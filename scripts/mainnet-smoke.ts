/**
 * Mainnet smoke test — the run that turns the local demo into a submission.
 *
 * It does exactly what the web demo does, in the configured mainnet namespace:
 *
 *   1. refuse to run unless Walrus Memory credentials are present
 *   2. check the relayer
 *   3. refuse to run if the namespace already has memories (append-only)
 *   4. execute the scripted story through the real repository
 *   5. count the memories the relayer reports (the hackathon needs 10+)
 *   6. verify the MemWalAccount and delegate key through Tatum's Sui GraphQL
 *
 * Usage:
 *   npm.cmd run smoke                 # write the story, then verify
 *   npm.cmd run smoke -- --verify-only  # re-check an existing ledger
 *
 * Credentials are read from `.env.local` by Node's `--env-file-if-exists`.
 * The script never prints a private key.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { runDemo } from '../src/lib/demo.ts';
import { getRuntime } from '../src/lib/runtime.ts';
import { createTatumClient } from '../src/tatum/client.ts';
import { verifyMemoryWrite } from '../src/tatum/verify.ts';
import type { Verification } from '../src/tatum/verify.ts';

const REQUIRED = ['MEMWAL_KEY', 'MEMWAL_ACCOUNT_ID'] as const;
const verifyOnly = process.argv.includes('--verify-only');

function fail(message: string): never {
  console.error(`\n✗ ${message}\n`);
  process.exit(1);
}

function line(label: string, value: string | number): void {
  console.log(`  ${label.padEnd(18)} ${value}`);
}

/**
 * A transient gateway timeout should not invalidate a run that already wrote
 * real memories. Retry before declaring the badge broken.
 */
async function verifyWithRetry(attempts = 3): Promise<Verification> {
  let last: Verification | null = null;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    last = await verifyMemoryWrite({
      client: createTatumClient(),
      accountId: process.env.MEMWAL_ACCOUNT_ID,
      agentPublicKey: process.env.MEMWAL_AGENT_ID,
    });

    if (last.status === 'verified') return last;

    if (attempt < attempts - 1) {
      console.log(`  … ${last.status}; retrying in 5s`);
      await new Promise((resolvePromise) => setTimeout(resolvePromise, 5_000));
    }
  }

  return last as Verification;
}

async function main(): Promise<void> {
  const missing = REQUIRED.filter((name) => !process.env[name]?.trim());
  if (missing.length > 0) {
    fail(
      `Missing ${missing.join(', ')}. Fill .env.local (see SETUP.md), then run again.`,
    );
  }

  const rt = getRuntime();

  if (rt.mode !== 'mainnet') {
    fail(
      'The runtime selected LOCAL. Check MEMWAL_KEY and MEMWAL_ACCOUNT_ID in .env.local.',
    );
  }

  console.log(
    `\nPrecedent — mainnet ${verifyOnly ? 'verification' : 'smoke test'}\n`,
  );
  line('mode', rt.mode);
  line('namespace', rt.namespace);
  line('account', short(process.env.MEMWAL_ACCOUNT_ID ?? ''));
  line(
    'delegate',
    process.env.MEMWAL_AGENT_ID
      ? short(process.env.MEMWAL_AGENT_ID)
      : 'not set',
  );

  console.log('\n→ Relayer health');
  const healthy = await rt.store.health();
  if (!healthy) fail('The mainnet relayer is not healthy. Try again shortly.');
  console.log('  ok');

  console.log('\n→ Existing memories');
  const before = (await rt.store.count?.()) ?? 0;
  line('count', before);

  if (!verifyOnly && before > 0) {
    fail(
      `Namespace "${rt.namespace}" already has ${before} memories. Walrus Memory is append-only; set MEMWAL_NAMESPACE to a fresh name in .env.local and run again.`,
    );
  }

  const started = Date.now();
  let after = before;

  if (!verifyOnly) {
    console.log('\n→ Running the scripted story (this writes real memories)');
    const heartbeat = setInterval(() => {
      const seconds = Math.round((Date.now() - started) / 1000);
      process.stdout.write(`  … ${seconds}s\n`);
    }, 10_000);

    try {
      await runDemo(rt);
    } finally {
      clearInterval(heartbeat);
    }
    console.log(`  done in ${Math.round((Date.now() - started) / 1000)}s`);

    console.log('\n→ Counting memories reported by the relayer');
    after = (await rt.store.count?.()) ?? 0;
    for (let attempt = 0; attempt < 12 && after < 10; attempt += 1) {
      await new Promise((resolvePromise) => setTimeout(resolvePromise, 5_000));
      after = (await rt.store.count?.()) ?? after;
      process.stdout.write(`  … ${after} so far\n`);
    }
    line('count', after);
  }

  if (after < 10) {
    fail(
      `Only ${after} memories are visible. The hackathon requires 10+. Do not delete anything; run the script again in a fresh namespace once the relayer catches up.`,
    );
  }

  console.log('\n→ Verifying the Walrus Memory account through Tatum');
  const verification = await verifyWithRetry();
  line('status', verification.status);
  line('checkpoint', verification.checkpoint ?? '—');
  line('detail', verification.detail);

  const report = {
    at: new Date().toISOString(),
    verifyOnly,
    network: 'sui-mainnet',
    namespace: rt.namespace,
    accountId: process.env.MEMWAL_ACCOUNT_ID ?? null,
    agentId: process.env.MEMWAL_AGENT_ID ?? null,
    memoriesBefore: verifyOnly ? null : before,
    memoriesAfter: after,
    relayerHealthy: healthy,
    verification,
    explorerUrl: verification.explorerUrl,
    durationSeconds: Math.round((Date.now() - started) / 1000),
  };

  const path = resolve('.data', 'mainnet-smoke.json');
  await mkdir(resolve('.data'), { recursive: true });
  await writeFile(path, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

  console.log(`\n  report            ${path}`);

  if (verification.status !== 'verified') {
    fail(
      `Memories are on mainnet, but Tatum did not verify the account (${verification.status}). Fix the badge before filming.`,
    );
  }

  console.log(
    `\n✓ Mainnet ledger verified: ${after} memories and a verified account.\n`,
  );
}

function short(value: string): string {
  return value.length > 16
    ? `${value.slice(0, 8)}…${value.slice(-6)}`
    : value || '—';
}

await main();
