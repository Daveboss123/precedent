/**
 * One process-wide runtime.
 *
 * The store is file-backed, so even if Next reloads this module the ledger
 * survives. The global cache exists to keep the id allocator's in-memory
 * watermark stable across hot reloads, not to hold the source of truth.
 */

import { resolve } from 'node:path';

import { createStore } from '../memory/create-store.ts';
import type { StoreMode } from '../memory/create-store.ts';
import { FileIdAllocator } from '../memory/ids.ts';
import type { IdAllocator } from '../memory/ids.ts';
import { PrecedentRepo } from '../memory/precedent-repo.ts';
import { RedisIdAllocator } from '../memory/redis-ids.ts';
import type { MemoryStore } from '../memory/store.ts';
import { DecisionLog } from './decision-log.ts';
import type { DecisionLogLike } from './decision-log.ts';
import { redisConfigured } from './redis.ts';
import { RedisDecisionLog } from './redis-decision-log.ts';

export interface Runtime {
  repo: PrecedentRepo;
  store: MemoryStore;
  ids: IdAllocator;
  log: DecisionLogLike;
  mode: StoreMode;
  namespace: string;
  clear: () => Promise<void>;
}

function buildRuntime(): Runtime {
  const handle = createStore();
  const distributed = redisConfigured();

  // Local and mainnet are different ledgers even when they share a namespace
  // name. Keeping separate counters means a local demo can never consume the
  // ids a fresh mainnet run is about to allocate.
  const ids: IdAllocator = distributed
    ? new RedisIdAllocator()
    : new FileIdAllocator(
        resolve('.data', `ids-${handle.mode}-${handle.namespace}.json`),
      );
  const log: DecisionLogLike = distributed
    ? new RedisDecisionLog()
    : new DecisionLog(
        resolve('.data', `decisions-${handle.mode}-${handle.namespace}.json`),
      );
  const repo = new PrecedentRepo({ store: handle.store, ids });

  return {
    repo,
    store: handle.store,
    ids,
    log,
    mode: handle.mode,
    namespace: handle.namespace,
    clear: async () => {
      if (handle.mode !== 'local') {
        throw new Error(
          'Refusing to delete mainnet memories. Walrus Memory is append-only.',
        );
      }
      await handle.store.clear?.();
      await ids.reset?.();
      await log.clear();
    },
  };
}

const globalForRuntime = globalThis as unknown as {
  __precedentRuntime?: Runtime;
};

export function getRuntime(): Runtime {
  if (!globalForRuntime.__precedentRuntime) {
    globalForRuntime.__precedentRuntime = buildRuntime();
  }
  return globalForRuntime.__precedentRuntime;
}

/** Wipe local state and start a fresh ledger. Mainnet refuses. */
export async function resetRuntime(): Promise<Runtime> {
  const next = buildRuntime();
  await next.clear();
  globalForRuntime.__precedentRuntime = next;
  return next;
}
