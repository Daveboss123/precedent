import { NextResponse } from 'next/server';

import { jsonError } from '../../../lib/http.ts';
import { getRuntime } from '../../../lib/runtime.ts';
import { buildState, invalidateState } from '../../../lib/state.ts';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    await getRuntime().clear();
    invalidateState();
    return NextResponse.json(await buildState());
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : String(error),
      409,
    );
  }
}
