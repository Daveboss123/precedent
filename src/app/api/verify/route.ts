import { NextResponse } from 'next/server';

import { getVerification } from '../../../lib/verification.ts';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const force = new URL(request.url).searchParams.get('force') === '1';
  return NextResponse.json(await getVerification(force));
}
