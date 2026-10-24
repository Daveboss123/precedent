import { NextResponse } from 'next/server';

import { runDemo } from '../../../lib/demo.ts';
import { jsonError } from '../../../lib/http.ts';
import { resetRuntime } from '../../../lib/runtime.ts';
import { buildState } from '../../../lib/state.ts';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const rt = await resetRuntime();
    await runDemo(rt);
    return NextResponse.json(await buildState());
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : String(error),
      409,
    );
  }
}
