/**
 * The resolution engine.
 *
 * This is the spine of the product. It is a pure function on purpose: no LLM,
 * no network, no clock surprises. Everything that decides whether an agent
 * spends money must be testable in milliseconds.
 *
 * Order matters and is not negotiable:
 *   1. charter violations   -> block, never ask
 *   2. charter thresholds   -> ask, but attach the precedents that inform it
 *   3. precedents agree     -> act, and cite them
 *   4. precedents disagree  -> ask, and flag for the Auditor
 *   5. no precedent         -> ask, and record the answer as a new precedent
 *
 * Within step 3, the *more specific* precedent governs. A rule that says
 * "switch roasters above a 15% increase" beats a general "buy beans" when the
 * increase is real, and yields to it when it is not. That is not a heuristic
 * bolted on for the demo; it is the reason a small set of rules can describe
 * real behaviour without becoming a spreadsheet of exceptions.
 */

import type {
  Candidate,
  Charter,
  Condition,
  Decision,
  PolicyConfig,
  Precedent,
} from './types.ts';

export const DEFAULT_POLICY: PolicyConfig = {
  minSimilarity: 0.5,
  staleAfterDays: 90,
  actAtConfidence: 0.7,
};

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Normalise a phrase into comparable terms.
 * Naive singularisation is deliberate: "monitors" and "monitor" must collide,
 * and a real stemmer would be one more dependency for no gain here.
 */
function tokenize(text: string): Set<string> {
  const terms = text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((term) => term.length > 2)
    .map((term) => (term.length > 3 && term.endsWith('s') ? term.slice(0, -1) : term));

  return new Set(terms);
}

/**
 * How well a precedent covers a candidate.
 *
 * Scope carries the weight; `trigger` is context for the human reading the
 * explanation, not a matching signal. A precedent with no scope can only
 * speak to its own domain, so it scores below the default threshold.
 */
export function similarity(candidate: Candidate, precedent: Precedent): number {
  if (precedent.domain !== candidate.domain) return 0;

  const scopeTerms = tokenize(precedent.scope.join(' '));
  if (scopeTerms.size === 0) return 0.4;

  const candidateTerms = tokenize(
    `${candidate.item} ${candidate.category} ${candidate.vendor}`,
  );

  let hits = 0;
  for (const term of scopeTerms) {
    if (candidateTerms.has(term)) hits += 1;
  }

  return hits / scopeTerms.size;
}

/**
 * Evaluate the structured gate. This is intentionally separate from
 * `similarity`: a precedent can be about beans and still not apply to *this*
 * bean purchase, because the price did not move enough.
 */
export function matchesCondition(
  candidate: Candidate,
  condition: Condition | null | undefined,
): boolean {
  if (!condition) return true;

  if (condition.priceIncreaseAtLeast !== undefined) {
    if (candidate.priceIncrease === undefined) return false;
    if (candidate.priceIncrease < condition.priceIncreaseAtLeast) return false;
  }

  if (condition.priceAtMost !== undefined && candidate.price > condition.priceAtMost) {
    return false;
  }

  if (condition.vendorIs !== undefined && candidate.vendor !== condition.vendorIs) {
    return false;
  }

  if (condition.recurring !== undefined && candidate.recurring !== condition.recurring) {
    return false;
  }

  return true;
}

function conditionSpecificity(condition: Condition | null | undefined): number {
  if (!condition) return 0;

  let count = 0;
  if (condition.priceIncreaseAtLeast !== undefined) count += 1;
  if (condition.priceAtMost !== undefined) count += 1;
  if (condition.vendorIs !== undefined) count += 1;
  if (condition.recurring !== undefined) count += 1;
  return count;
}

/**
 * How narrow a precedent is, for this candidate.
 *
 * Match quality dominates; a structured condition is worth more than a broad
 * scope; scope breadth is the final tiebreaker. Two rules that score the same
 * are genuinely tied, and a tie between different actions is a contradiction
 * the user has to settle.
 */
export function specificity(candidate: Candidate, precedent: Precedent): number {
  return (
    Math.round(similarity(candidate, precedent) * 100) +
    conditionSpecificity(precedent.when) * 10 +
    precedent.scope.length
  );
}

function isStale(precedent: Precedent, now: Date, policy: PolicyConfig): boolean {
  const age = now.getTime() - new Date(precedent.createdAt).getTime();
  return age > policy.staleAfterDays * DAY_MS;
}

/** Precedents that are allowed to bind this candidate, best first. */
export function relevantPrecedents(
  candidate: Candidate,
  precedents: Precedent[],
  now: Date,
  policy: PolicyConfig = DEFAULT_POLICY,
): Array<{ precedent: Precedent; similarity: number; weight: number }> {
  return precedents
    .filter((precedent) => precedent.active && precedent.supersededBy === null)
    .filter((precedent) => !isStale(precedent, now, policy))
    .filter((precedent) => matchesCondition(candidate, precedent.when))
    .map((precedent) => {
      const score = similarity(candidate, precedent);
      return { precedent, similarity: score, weight: score * precedent.confidence };
    })
    .filter((match) => match.similarity >= policy.minSimilarity)
    .sort((a, b) => b.weight - a.weight);
}

export function resolve(
  candidate: Candidate,
  charter: Charter,
  precedents: Precedent[],
  now: Date = new Date(),
  policy: PolicyConfig = DEFAULT_POLICY,
): Decision {
  const base = { candidateId: candidate.id, needsAudit: false } as const;

  // 1. Hard rules. Never ask, never learn around them.
  if (charter.bannedCategories.includes(candidate.category)) {
    return {
      ...base,
      action: 'block',
      cited: [],
      confidence: 1,
      cause: 'charter_banned',
      explanation: `Blocked: your charter bans ${candidate.category}.`,
    };
  }

  if (
    charter.allowedVendors.length > 0 &&
    !charter.allowedVendors.includes(candidate.vendor)
  ) {
    return {
      ...base,
      action: 'block',
      cited: [],
      confidence: 1,
      cause: 'charter_vendor',
      explanation: `Blocked: ${candidate.vendor} is not an approved vendor.`,
    };
  }

  const matches = relevantPrecedents(candidate, precedents, now, policy);

  // 2. Thresholds. The charter wins over any precedent, but the user deserves
  //    to see what the agent already knows before answering.
  if (candidate.price > charter.approvalAbove) {
    return {
      ...base,
      action: 'ask',
      cited: matches.slice(0, 3).map((match) => match.precedent.id),
      confidence: 0.5,
      cause: 'charter_threshold',
      explanation: `${formatPrice(candidate.price)} is above your ${formatPrice(
        charter.approvalAbove,
      )} approval threshold.`,
    };
  }

  // 3. No precedent. This is the moment the product learns.
  if (matches.length === 0) {
    return {
      ...base,
      action: 'ask',
      cited: [],
      confidence: 0.2,
      cause: 'no_precedent',
      explanation: 'No precedent covers this. Your answer becomes one.',
    };
  }

  // 4. The most specific rules govern. Only ties among *those* are conflicts.
  const scored = matches.map((match) => ({
    ...match,
    specificity: specificity(candidate, match.precedent),
  }));
  const top = Math.max(...scored.map((match) => match.specificity));
  const governing = scored.filter((match) => match.specificity === top);

  const actions = new Set(governing.map((match) => match.precedent.action));
  if (actions.size > 1) {
    const cited = governing.map((match) => match.precedent.id);
    return {
      ...base,
      action: 'ask',
      cited,
      confidence: 0.3,
      needsAudit: true,
      cause: 'precedent_conflict',
      explanation: `Precedents #${cited.join(' and #')} disagree. Which governs?`,
    };
  }

  // 5. The governing precedents agree. Act only if the strongest is
  //    convincing enough.
  const best = governing[0];
  const cited = governing.map((match) => match.precedent.id);

  if (best.weight < policy.actAtConfidence) {
    return {
      ...base,
      action: 'ask',
      cited,
      confidence: round(best.weight),
      needsAudit: best.weight > policy.actAtConfidence - 0.15,
      cause: 'precedent_match',
      explanation: `Precedent #${best.precedent.id} applies but is weak (${round(
        best.weight,
      )}).`,
    };
  }

  const narrower = matches.length > governing.length;

  return {
    ...base,
    action: 'act',
    cited,
    confidence: round(best.weight),
    cause: 'precedent_match',
    explanation: `${narrower ? 'Following the more specific precedent' : 'Following precedent'} #${
      best.precedent.id
    }: ${best.precedent.reason}`,
  };
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function formatPrice(value: number): string {
  return `$${value.toFixed(2)}`;
}
