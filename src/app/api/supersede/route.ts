import { NextResponse } from 'next/server';

import type { Action } from '../../../core/types.ts';
import { jsonError } from '../../../lib/http.ts';
import { getRuntime } from '../../../lib/runtime.ts';
import { buildState, invalidateState } from '../../../lib/state.ts';

export const dynamic = 'force-dynamic';

const ACTIONS: Action[] = ['buy', 'switch_brand', 'defer', 'block'];

interface Body {
  oldId?: number;
  action?: string;
  reason?: string;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Body | null;
  if (!body) return jsonError('Expected a JSON body.');

  const oldId = Number(body.oldId);
  if (!Number.isInteger(oldId) || oldId < 1) {
    return jsonError('Unknown precedent id.');
  }

  const action = body.action as Action | undefined;
  if (!action || !ACTIONS.includes(action)) return jsonError('Unknown action.');

  const reason = (body.reason ?? '').trim();
  if (!reason) return jsonError('A reason is required — it becomes the new precedent.');

  const rt = getRuntime();

  try {
    await rt.repo.supersede(oldId, { action, reason });
    await rt.repo.audit();
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : String(error),
      409,
    );
  }

  invalidateState();
  return NextResponse.json(await buildState());
}
