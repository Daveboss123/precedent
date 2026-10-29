/**
 * Assemble everything the app renders.
 *
 * Decisions are recomputed live from the current rule set, not replayed from
 * the log. The log is the historical record (and feeds the autonomy report);
 * the queue is "what would the agent do right now".
 *
 * Reading the ledger costs four Walrus recalls. The relayer is fast enough for
 * a demo but not fast enough to pay that on every render, and it is
 * occasionally flaky. A short process-local cache makes the UI feel instant;
 * a mutation invalidates it explicitly. If a refresh fails while a previous
 * state exists, the previous state is served rather than a blank screen.
 */

import type { AuditFinding } from '../core/audit.ts';
import { findContradictions } from '../core/audit.ts';
import { resolve } from '../core/resolve.ts';
import type { SupersessionRecord } from '../core/supersession.ts';
import type { Candidate, Charter, Decision, Precedent } from '../core/types.ts';
import type { StoreMode } from '../memory/create-store.ts';
import { readCharter } from './charter.ts';
import type { AutonomyReport, DecisionEntry } from './decision-log.ts';
import { DEMO_CANDIDATES } from './demo.ts';
import { readItems } from './items-store.ts';
import type { ListItem, RecurringItem } from './recurring.ts';
import { imageFor, itemToCandidate, sameItemName } from './recurring.ts';
import { getRuntime } from './runtime.ts';

export interface QueueItem {
  candidate: Candidate;
  decision: Decision;
  /** Product photo for the card, or null when an illustration is better. */
  image: string | null;
  /** The user's words behind the cited rule, when there is one. */
  rule: string | null;
}

export interface AppState {
  mode: StoreMode;
  namespace: string;
  /** Public identifiers, shown in the UI. Never a key. */
  accountId: string | null;
  agentId: string | null;
  charter: Charter;
  precedents: Precedent[];
  supersessions: SupersessionRecord[];
  findings: AuditFinding[];
  queue: QueueItem[];
  items: ListItem[];
  decisions: DecisionEntry[];
  autonomy: AutonomyReport;
  /** accepted / (accepted + returned). Null until an outcome exists. */
  approvalRate: number | null;
  memories: string[];
}

const CACHE_TTL_MS = 20_000;

let cache: { at: number; state: AppState } | null = null;
let inFlight: Promise<AppState> | null = null;

/** Call after any write, so the next read sees the new record. */
export function invalidateState(): void {
  cache = null;
}

export async function buildState(
  options: { force?: boolean } = {},
): Promise<AppState> {
  if (!options.force && cache && Date.now() - cache.at < CACHE_TTL_MS) {
    return cache.state;
  }

  if (inFlight) return inFlight;

  inFlight = buildStateUncached()
    .then((state) => {
      cache = { at: Date.now(), state };
      return state;
    })
    .catch((error) => {
      if (cache) return cache.state;
      throw error;
    })
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
}

async function buildStateUncached(): Promise<AppState> {
  const rt = getRuntime();
  const charter = await readCharter();
  const snapshot = await rt.repo.snapshot();

  const active = snapshot.precedents.filter(
    (precedent) => precedent.active && precedent.supersededBy === null,
  );

  const [decisions, autonomy, memories, outcomes, storedItems] =
    await Promise.all([
      rt.log.all(),
      rt.log.report(),
      rt.store.list ? rt.store.list() : Promise.resolve([]),
      rt.repo.outcomes(),
      readItems(),
    ]);

  // Recompute the live contradictions from the same snapshot the queue uses.
  // This is the same predicate the Auditor writes, without three extra recalls.
  const findings = findContradictions(active);

  const now = new Date();
  const ruleById = new Map(
    snapshot.precedents.map((precedent) => [precedent.id, precedent.reason]),
  );

  const items: ListItem[] = storedItems.map((item) => {
    const decision = resolve(
      itemToCandidate(item),
      charter,
      snapshot.precedents,
      now,
    );
    return {
      ...item,
      decision,
      rule: decision.cited.length > 0 ? ruleById.get(decision.cited[0]) ?? null : null,
    };
  });

  const queue: QueueItem[] = DEMO_CANDIDATES.map((candidate) => {
    const decision = resolve(candidate, charter, snapshot.precedents, now);
    return {
      candidate,
      decision,
      image: imageFor(candidate.item, candidate.category, candidate.domain),
      rule: decision.cited.length > 0 ? ruleById.get(decision.cited[0]) ?? null : null,
    };
  });

  // A list item that is already part of the scripted week should not appear
  // twice. Everything the visitor adds shows up immediately after the scripted
  // cards, with the same resolver behind it.
  const scripted = new Set(DEMO_CANDIDATES.map((candidate) => candidate.item.toLowerCase()));
  for (const item of items) {
    if (scripted.has(item.name.toLowerCase())) continue;
    queue.push({
      candidate: itemToCandidate(item),
      decision: item.decision,
      image: item.image,
      rule: item.rule,
    });
  }

  const accepted = outcomes.filter((outcome) => outcome.result === 'accepted').length;
  const returned = outcomes.filter((outcome) => outcome.result === 'returned').length;
  const approvalRate =
    accepted + returned === 0 ? null : accepted / (accepted + returned);

  return {
    mode: rt.mode,
    namespace: rt.namespace,
    accountId: process.env.MEMWAL_ACCOUNT_ID ?? null,
    agentId: process.env.MEMWAL_AGENT_ID ?? null,
    charter,
    precedents: snapshot.precedents,
    supersessions: snapshot.supersessions,
    findings,
    queue,
    items,
    decisions,
    autonomy,
    approvalRate,
    memories,
  };
}

/** Find a candidate by id across the scripted week and the visitor's list. */
export async function candidateById(
  id: string,
): Promise<{ candidate: Candidate; item: RecurringItem | null } | null> {
  const scripted = DEMO_CANDIDATES.find((candidate) => candidate.id === id);
  if (scripted) return { candidate: scripted, item: null };

  const items = await readItems();
  const item = items.find((entry) => `item-${entry.id}` === id);
  return item ? { candidate: itemToCandidate(item), item } : null;
}

/** Small helper for the UI's "already on your list" check. */
export function isOnList(items: RecurringItem[], name: string): boolean {
  return items.some((item) => sameItemName(item.name, name));
}
