/**
 * Supersession.
 *
 * Walrus Memory is append-only: you cannot edit or delete a memory. So a
 * precedent is never "updated" when reality disagrees with it — a later
 * precedent *overrules* it, and a separate SUPERSEDES record makes that
 * relationship explicit.
 *
 * This is not a workaround. It is the correct model for case law: the old
 * decision stays on the record, and the record shows that it was overturned.
 * It also means the audit trail can never be quietly rewritten.
 */

import type { Precedent } from './types.ts';
import {
  SEPARATOR,
  isoDate,
  quote,
  splitFields,
  toRecord,
  unquote,
} from './wire.ts';

export interface SupersessionRecord {
  oldId: number;
  newId: number;
  reason: string;
  createdAt: string;
}

export function serializeSupersession(record: SupersessionRecord): string {
  return [
    'SUPERSEDES',
    `old:${record.oldId}`,
    `new:${record.newId}`,
    `reason:${quote(record.reason)}`,
    `date:${record.createdAt}`,
  ].join(SEPARATOR);
}

export function parseSupersession(line: string): SupersessionRecord | null {
  const fields = splitFields(line.trim());
  if (fields[0] !== 'SUPERSEDES') return null;

  const raw = toRecord(fields);
  const oldId = Number(raw.old);
  const newId = Number(raw.new);
  if (!Number.isFinite(oldId) || !Number.isFinite(newId)) return null;

  return {
    oldId,
    newId,
    reason: unquote(raw.reason ?? ''),
    createdAt: isoDate(raw.date),
  };
}

/**
 * Apply the overruling records to a set of precedents.
 *
 * Later records win, so replaying the full log is enough to rebuild current
 * state. Returns new objects — callers must never assume the input is mutated.
 */
export function applySupersessions(
  precedents: Precedent[],
  records: SupersessionRecord[],
): Precedent[] {
  const ordered = [...records].sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt),
  );

  const overruledBy = new Map<number, number>();
  const overrules = new Map<number, number>();

  for (const record of ordered) {
    overruledBy.set(record.oldId, record.newId);
    overrules.set(record.newId, record.oldId);
  }

  return precedents.map((precedent) => {
    const supersededBy = overruledBy.get(precedent.id) ?? null;
    const supersedes = overrules.get(precedent.id) ?? precedent.supersedes ?? null;

    return {
      ...precedent,
      supersededBy,
      supersedes,
      active: supersededBy === null ? precedent.active : false,
    };
  });
}
