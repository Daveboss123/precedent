import { NextResponse } from 'next/server';

import type { Charter } from '../../../core/types.ts';
import { writeCharter } from '../../../lib/charter.ts';
import { jsonError } from '../../../lib/http.ts';
import { buildState, invalidateState } from '../../../lib/state.ts';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Charter | null;
  if (!body || typeof body !== 'object') {
    return jsonError('Expected a charter object.');
  }

  await writeCharter(body);
  invalidateState();
  return NextResponse.json(await buildState());
}
