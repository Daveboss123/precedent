/**
 * The Auditor's job.
 *
 * It runs with a delegate key that cannot read the `finance` namespace, so it
 * can reason about rules but never about money. Its only output is a finding —
 * written to memory like everything else, which means findings can themselves
 * trigger a supersession.
 *
 * Scope discipline: contradictions only. A general "critique the agent" loop
 * is theatre and costs days.
 */

import type { Action, Precedent } from './types.ts';
import { conditionSpecificity } from './resolve.ts';
import { quote, splitFields, toRecord, unquote } from './wire.ts';

export interface AuditFinding {
  kind: 'contradiction';
  domain: string;
  precedentIds: [number, number];
  actions: [Action, Action];
  /** The scope terms the two precedents both claim. */
  sharedScope: string[];
  /** One sentence, ready for the decision queue. */
  summary: string;
}

function normaliseScope(scope: string[]): Set<string> {
  return new Set(
    scope
      .join(' ')
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((term) => term.length > 2)
      .map((term) => (term.length > 3 && term.endsWith('s') ? term.slice(0, -1) : term)),
  );
}

/**
 * Static specificity, mirroring the resolver's tiebreak.
 *
 * A conditional rule is narrower than an unconditional one; a longer scope is
 * narrower than a shorter one. If one rule is strictly narrower, the resolver
 * will let it govern, so it is not a contradiction — it is hierarchy. Only
 * equally narrow rules can genuinely tie.
 */
function structuralSpecificity(precedent: Precedent): number {
  return conditionSpecificity(precedent.when) * 10 + precedent.scope.length;
}

/**
 * Active precedents that claim the same ground but prescribe different actions.
 * Two rules can both be "right" and still be impossible to follow at once —
 * that is exactly the state the user needs to be shown.
 */
export function findContradictions(precedents: Precedent[]): AuditFinding[] {
  const live = precedents
    .filter((precedent) => precedent.active && precedent.supersededBy === null)
    // Recall order is not guaranteed, so the audit must impose its own. Without
    // this, the same ledger can produce findings in a different order on every
    // pass, which makes deduplication unreliable.
    .sort((a, b) => a.id - b.id);

  const findings: AuditFinding[] = [];

  for (let i = 0; i < live.length; i += 1) {
    for (let j = i + 1; j < live.length; j += 1) {
      const a = live[i];
      const b = live[j];

      if (a.domain !== b.domain) continue;
      if (a.action === b.action) continue;
      if (structuralSpecificity(a) !== structuralSpecificity(b)) continue;

      const scopeA = normaliseScope(a.scope);
      const scopeB = normaliseScope(b.scope);

      const shared = [...scopeA].filter((term) => scopeB.has(term));
      if (shared.length === 0) continue;

      findings.push({
        kind: 'contradiction',
        domain: a.domain,
        precedentIds: [a.id, b.id],
        actions: [a.action, b.action],
        sharedScope: shared.sort(),
        summary: `#${a.id} (${a.action}) and #${b.id} (${b.action}) both govern ${shared.join(
          ', ',
        )} in ${a.domain}.`,
      });
    }
  }

  return findings.sort((x, y) => x.precedentIds[0] - y.precedentIds[0]);
}

/** Render a finding as the memory string the Auditor writes. */
export function serializeFinding(finding: AuditFinding, createdAt: string): string {
  return [
    'AUDIT',
    `kind:${finding.kind}`,
    `domain:${finding.domain}`,
    `ids:${finding.precedentIds.join(',')}`,
    `actions:${finding.actions.join(',')}`,
    `scope:${finding.sharedScope.join(',')}`,
    `date:${createdAt.slice(0, 10)}`,
    `summary:${quote(finding.summary)}`,
  ].join(' | ');
}

export function parseFinding(line: string): AuditFinding | null {
  const fields = splitFields(line.trim());
  if (fields[0] !== 'AUDIT') return null;

  const raw = toRecord(fields);
  if (raw.kind !== 'contradiction') return null;

  const ids = (raw.ids ?? '')
    .split(',')
    .map((part) => Number(part.trim()))
    .filter((value) => Number.isFinite(value));

  const actions = (raw.actions ?? '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean) as Action[];

  if (ids.length !== 2 || actions.length !== 2) return null;

  return {
    kind: 'contradiction',
    domain: raw.domain ?? '',
    precedentIds: [ids[0], ids[1]],
    actions: [actions[0], actions[1]],
    sharedScope: (raw.scope ?? '')
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean),
    summary: unquote(raw.summary ?? ''),
  };
}
