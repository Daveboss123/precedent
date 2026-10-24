import { NextResponse } from 'next/server';

import { buildState } from '../../../lib/state.ts';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(await buildState());
}
