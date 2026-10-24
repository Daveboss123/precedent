/**
 * Outcomes: what actually happened.
 *
 * A precedent records why the agent decided. An outcome records whether the
 * decision survived contact with reality. Keeping them separate is what lets
 * the autonomy chart be honest: autonomy measures how often the agent acted
 * alone, outcomes measure how often that was the right call.
 */

import type { Outcome, OutcomeResult } from './types.ts';
import { SEPARATOR, quote, splitFields, toRecord, unquote } from './wire.ts';

const RESULTS: OutcomeResult[] = ['accepted', 'returned', 'cancelled'];

export function serializeOutcome(outcome: Outcome, createdAt: string): string {
  return [
    'OUTCOME',
    `candidate:${outcome.candidateId}`,
    `precedents:${outcome.precedentIds.join(',')}`,
    `result:${outcome.result}`,
    `note:${quote(outcome.note)}`,
    `date:${createdAt.slice(0, 10)}`,
  ].join(SEPARATOR);
}

export function parseOutcome(line: string): Outcome | null {
  const fields = splitFields(line.trim());
  if (fields[0] !== 'OUTCOME') return null;

  const raw = toRecord(fields);
  if (!raw.candidate || !raw.result) return null;

  const result = raw.result as OutcomeResult;
  if (!RESULTS.includes(result)) return null;

  return {
    candidateId: raw.candidate,
    precedentIds: (raw.precedents ?? '')
      .split(',')
      .map((part) => Number(part.trim()))
      .filter((value) => Number.isFinite(value)),
    result,
    note: unquote(raw.note ?? ''),
  };
}
