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
import { LocalStore } from '../memory/local-store.ts';
import { PrecedentRepo } from '../memory/precedent-repo.ts';
import type { MemoryStore } from '../memory/store.ts';
import { DecisionLog } from './decision-log.ts';

export interface Runtime {
  repo: PrecedentRepo;
  store: MemoryStore;
  ids: FileIdAllocator;
  log: DecisionLog;
  mode: StoreMode;
  namespace: string;
  clear: () => Promise<void>;
}

function buildRuntime(): Runtime {
  const handle = createStore();
  const ids = new FileIdAllocator(resolve('.data', 'ids.json'));
  const log = new DecisionLog(resolve('.data', 'decisions.json'));
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
      if (handle.store instanceof LocalStore) await handle.store.clear();
      await ids.reset();
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
