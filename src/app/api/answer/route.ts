import { NextResponse } from 'next/server';

import type { Action, Condition } from '../../../core/types.ts';
import { readCharter } from '../../../lib/charter.ts';
import { DEMO_CANDIDATES } from '../../../lib/demo.ts';
import { jsonError } from '../../../lib/http.ts';
import { getRuntime } from '../../../lib/runtime.ts';
import { buildState } from '../../../lib/state.ts';

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

  const candidate = DEMO_CANDIDATES.find((item) => item.id === body.candidateId);
  if (!candidate) return jsonError('Unknown candidate.');

  const action = body.action as Action | undefined;
  if (!action || !ACTIONS.includes(action)) return jsonError('Unknown action.');

  const reason = (body.reason ?? '').trim();
  if (!reason) return jsonError('A reason is required — it becomes the precedent.');

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
  await rt.repo.create({
    domain: candidate.domain,
    action,
    trigger: increase === null ? 'stated rule' : `price increase above ${increase}%`,
    when,
    reason,
    scope,
    confidence: 0.9,
  });

  await rt.repo.audit();

  const decision = await rt.repo.resolveCandidate(candidate, await readCharter());
  await rt.log.append({
    phase: 'Interactive',
    candidate,
    action: decision.action,
    cause: decision.cause,
    cited: decision.cited,
  });

  return NextResponse.json(await buildState());
}
