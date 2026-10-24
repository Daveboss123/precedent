/**
 * Core domain types for Precedent.
 *
 * The design constraint that matters: memory is the permission system.
 * If you delete every Precedent, the agent must fall back to asking about
 * everything. `autonomy` therefore goes to zero. That is the delete test,
 * and it is the reason this is not a rules engine with a vector store.
 */

export type MemoryKind =
  | 'charter' // hard rules, always recalled
  | 'precedent' // a decision + its reason, with precedential authority
  | 'observation' // durable fact extracted from feedback
  | 'outcome' // what actually happened after the decision
  | 'audit'; // a finding raised by the Auditor agent

export type Domain = 'coffee' | 'household' | 'gear' | 'pantry';

export type Action = 'buy' | 'switch_brand' | 'defer' | 'block';

/** Standing constraints. Set by the user, or derived from explicit edits. */
export interface Charter {
  /** Monthly spend ceiling, in the settlement asset. */
  budgetPerMonth: number;
  /** Above this amount, the agent must ask even when a precedent applies. */
  approvalAbove: number;
  /** Categories the agent may never transact in. */
  bannedCategories: string[];
  /** If non-empty, only these vendors are permitted. */
  allowedVendors: string[];
}

/**
 * A machine-checkable gate on a precedent.
 *
 * The user never writes this: they say "if it jumps more than 15%, switch,"
 * and the model extracts `{ priceIncreaseAtLeast: 0.15 }`. Keeping it
 * structured — rather than parsing the trigger string — is what lets the
 * resolver stay deterministic and testable.
 *
 * `trigger` remains the human-readable version, and is never used for matching.
 */
export interface Condition {
  /** Minimum increase vs the last price paid, as a fraction. 0.15 = 15%. */
  priceIncreaseAtLeast?: number;
  /** Ceiling on the absolute price. */
  priceAtMost?: number;
  /** Restrict the precedent to one vendor. */
  vendorIs?: string;
  /** Restrict to recurring (or one-off) purchases. */
  recurring?: boolean;
}

/** A single decision, remembered with enough structure to bind future ones. */
export interface Precedent {
  id: number;
  kind: 'precedent';
  domain: Domain;
  action: Action;
  /** The condition that made this decision correct, in the user's words. */
  trigger: string;
  /** The structured gate extracted from the trigger. Null means "always". */
  when: Condition | null;
  /** The user's own words, preserved verbatim. */
  reason: string;
  /** What this precedent covers, e.g. ["beans"] — deliberately narrow. */
  scope: string[];
  /** How strongly the agent believes this precedent generalises. 0..1 */
  confidence: number;
  createdAt: string; // ISO 8601
  active: boolean;
  /** Set when a later precedent overturns this one. */
  supersededBy: number | null;
  /** Set when this precedent overturns an earlier one. */
  supersedes: number | null;
}

/** Something the agent is considering doing. */
export interface Candidate {
  id: string;
  domain: Domain;
  /** What is being bought, in the user's language. */
  item: string;
  vendor: string;
  category: string;
  price: number;
  recurring: boolean;
  /** Change vs the last price paid, as a fraction. 0.22 = up 22%. */
  priceIncrease?: number;
}

export type ResolutionAction = 'block' | 'act' | 'ask';

export interface Decision {
  candidateId: string;
  action: ResolutionAction;
  /** Precedent ids the decision rests on. Empty means "no precedent". */
  cited: number[];
  /** One sentence a human can read in the UI. */
  explanation: string;
  /** 0..1. Low confidence is why the agent asks. */
  confidence: number;
  /** True when the Auditor should look at this. */
  needsAudit: boolean;
  /** Machine-readable cause, for the UI chips and for tests. */
  cause:
    | 'charter_banned'
    | 'charter_threshold'
    | 'charter_vendor'
    | 'precedent_match'
    | 'precedent_conflict'
    | 'no_precedent';
}

export type OutcomeResult = 'accepted' | 'returned' | 'cancelled';

/** What actually happened after a decision. Separate from the decision itself. */
export interface Outcome {
  candidateId: string;
  /** Precedents the decision cited. Empty when the user answered cold. */
  precedentIds: number[];
  result: OutcomeResult;
  note: string;
}

export interface PolicyConfig {
  /** Minimum similarity for a precedent to count as relevant. */
  minSimilarity: number;
  /** Precedents older than this are treated as stale and ignored. */
  staleAfterDays: number;
  /** A decision is taken without asking only at or above this confidence. */
  actAtConfidence: number;
}
