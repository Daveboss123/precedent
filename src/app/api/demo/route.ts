import { NextResponse } from 'next/server';

import { runDemo } from '../../../lib/demo.ts';
import { jsonError } from '../../../lib/http.ts';
import { getRuntime } from '../../../lib/runtime.ts';
import { buildState, invalidateState } from '../../../lib/state.ts';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const rt = getRuntime();

    // Walrus Memory is append-only. The scripted story starts from an empty
    // ledger, so a second run on the same namespace would silently produce a
    // different (and wrong) Day 1. Refuse instead of pretending.
    if (rt.mode === 'mainnet' && rt.store.count) {
      const existing = await rt.store.count();
      if (existing > 0) {
        return jsonError(
          `This mainnet namespace already has ${existing} memories. The scripted demo starts from an empty ledger; set MEMWAL_NAMESPACE to a fresh name and restart.`,
          409,
        );
      }
    }

    await runDemo(rt);
    invalidateState();
    return NextResponse.json(await buildState());
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : String(error),
      409,
    );
  }
}
