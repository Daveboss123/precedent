/**
 * One cached verification, shared by every page load.
 *
 * The RPC call is cheap, but it is still a network call. A 60-second cache
 * keeps the badge live enough to be honest and fast enough to film. The
 * `/api/verify?force=1` path bypasses the cache when the user clicks.
 */

import { createTatumClient } from '../tatum/client.ts';
import { verifyMemoryWrite } from '../tatum/verify.ts';
import type { Verification } from '../tatum/verify.ts';

const TTL_MS = 60_000;

let cached: { at: number; value: Verification } | null = null;
let inFlight: Promise<Verification> | null = null;

export async function getVerification(force = false): Promise<Verification> {
  if (!force && cached && Date.now() - cached.at < TTL_MS) {
    return cached.value;
  }

  // Two pages mounting at once should not spend two GraphQL calls each. The
  // free Tatum plan allows 3 requests/second, and verification itself costs
  // two. Sharing the in-flight check keeps the badge honest without tripping
  // the rate limit during navigation.
  if (inFlight) return inFlight;

  inFlight = verifyMemoryWrite({
    client: createTatumClient(),
    digest: process.env.TATUM_VERIFY_DIGEST,
    objectId: process.env.TATUM_VERIFY_OBJECT_ID,
    accountId: process.env.MEMWAL_ACCOUNT_ID,
    agentPublicKey: process.env.MEMWAL_AGENT_ID,
  })
    .then((value) => {
      cached = { at: Date.now(), value };
      return value;
    })
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
}

export function resetVerificationCache(): void {
  cached = null;
}
