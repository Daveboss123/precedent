import { NextResponse } from 'next/server';

import { getRuntime } from '../../../lib/runtime.ts';
import { buildState } from '../../../lib/state.ts';

export const dynamic = 'force-dynamic';

export async function POST() {
  await getRuntime().repo.audit();
  return NextResponse.json(await buildState());
}
