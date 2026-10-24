/**
 * Assemble everything the ledger renders.
 *
 * Decisions are recomputed live from the current precedent set, not replayed
 * from the log. The log is the historical record (and feeds autonomy); the
 * queue is "what would the agent do right now".
 */

import type { AuditFinding } from '../core/audit.ts';
import { resolve } from '../core/resolve.ts';
import type { SupersessionRecord } from '../core/supersession.ts';
import type { Candidate, Charter, Decision, Precedent } from '../core/types.ts';
import type { StoreMode } from '../memory/create-store.ts';
import { readCharter } from './charter.ts';
import type { AutonomyReport, DecisionEntry } from './decision-log.ts';
import { DEMO_CANDIDATES } from './demo.ts';
import { getRuntime } from './runtime.ts';

export interface QueueItem {
  candidate: Candidate;
  decision: Decision;
}

export interface AppState {
  mode: StoreMode;
  namespace: string;
  charter: Charter;
  precedents: Precedent[];
  supersessions: SupersessionRecord[];
  findings: AuditFinding[];
  queue: QueueItem[];
  decisions: DecisionEntry[];
  autonomy: AutonomyReport;
  /** accepted / (accepted + returned). Null until an outcome exists. */
  approvalRate: number | null;
  memories: string[];
}

export async function buildState(): Promise<AppState> {
  const rt = getRuntime();
  const charter = await readCharter();
  const snapshot = await rt.repo.snapshot();

  const [findings, decisions, autonomy, memories, outcomes] = await Promise.all([
    rt.repo.findings(),
    rt.log.all(),
    rt.log.report(),
    rt.store.list ? rt.store.list() : Promise.resolve([]),
    rt.repo.outcomes(),
  ]);

  const now = new Date();
  const queue = DEMO_CANDIDATES.map((candidate) => ({
    candidate,
    decision: resolve(candidate, charter, snapshot.precedents, now),
  }));

  const accepted = outcomes.filter((outcome) => outcome.result === 'accepted').length;
  const returned = outcomes.filter((outcome) => outcome.result === 'returned').length;
  const approvalRate =
    accepted + returned === 0 ? null : accepted / (accepted + returned);

  return {
    mode: rt.mode,
    namespace: rt.namespace,
    charter,
    precedents: snapshot.precedents,
    supersessions: snapshot.supersessions,
    findings,
    queue,
    decisions,
    autonomy,
    approvalRate,
    memories,
  };
}
