import { NextResponse } from 'next/server';

import type { Action, Condition } from '../../../core/types.ts';
import { readCharter } from '../../../lib/charter.ts';
import { jsonError } from '../../../lib/http.ts';
import { getRuntime } from '../../../lib/runtime.ts';
import { buildState, candidateById, invalidateState } from '../../../lib/state.ts';

export const dynamic = 'force-dynamic';

const ACTIONS: Action[] = ['buy', 'switch_brand', 'defer', 'block'];

interface Body {
  candidateId?: string;
  action?: string;
  reason?: string;
  scope?: string;
  increase?: number;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Body | null;
  if (!body) return jsonError('Expected a JSON body.');

  const match = body.candidateId
    ? await candidateById(body.candidateId)
    : null;
  if (!match) return jsonError('Unknown candidate.');
  const { candidate } = match;

  const action = body.action as Action | undefined;
  if (!action || !ACTIONS.includes(action)) return jsonError('Unknown action.');

  const reason = (body.reason ?? '').trim();
  if (!reason) return jsonError('A reason is required. It becomes the rule.');

  const scope = (body.scope ?? '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  if (scope.length === 0) scope.push(candidate.category);

  const increase =
    typeof body.increase === 'number' &&
    Number.isFinite(body.increase) &&
    body.increase > 0
      ? body.increase
      : null;

  const when: Condition | null =
    increase === null ? null : { priceIncreaseAtLeast: increase / 100 };

  const rt = getRuntime();
  const charter = await readCharter();

  // What the agent believed *before* this answer. If the user is settling a
  // conflict, the answer is a ruling: the precedents on the losing side are
  // overruled, not left to contradict the new rule forever.
  const before = await rt.repo.resolveCandidate(candidate, charter);

  const created = await rt.repo.create({
    domain: candidate.domain,
    action,
    trigger: increase === null ? 'stated rule' : `price increase above ${increase}%`,
    when,
    reason,
    scope,
    confidence: 0.9,
  });

  if (before.cause === 'precedent_conflict') {
    await rt.repo.overrule(before.cited, created.id, reason);
  }

  await rt.repo.audit();

  const decision = await rt.repo.resolveCandidate(candidate, charter);
  await rt.log.append({
    phase: 'Interactive',
    candidate,
    action: decision.action,
    cause: decision.cause,
    cited: decision.cited,
  });

  invalidateState();
  return NextResponse.json(await buildState());
}
