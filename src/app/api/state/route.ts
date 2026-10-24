import { NextResponse } from 'next/server';

import { buildState } from '../../../lib/state.ts';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const force = new URL(request.url).searchParams.has('force');
  return NextResponse.json(await buildState({ force }));
}
