import { NextResponse } from 'next/server';

import { getRuntime } from '../../../lib/runtime.ts';
import { buildState, invalidateState } from '../../../lib/state.ts';

export const dynamic = 'force-dynamic';

export async function POST() {
  await getRuntime().repo.audit();
  invalidateState();
  return NextResponse.json(await buildState());
}
