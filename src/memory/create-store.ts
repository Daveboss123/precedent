/**
 * Pick the memory backend.
 *
 * Mainnet only when both credentials are present. There is no "staging"
 * branch on purpose: the hackathon requires mainnet writes, and a fallback
 * that silently writes somewhere else is worse than an obvious LOCAL badge.
 */

import { resolve } from 'node:path';

import { LocalStore } from './local-store.ts';
import { MemWalStore } from './memwal-store.ts';
import type { MemoryStore } from './store.ts';

export type StoreMode = 'mainnet' | 'local';

export interface StoreHandle {
  store: MemoryStore;
  mode: StoreMode;
  namespace: string;
}

export function createStore(
  namespace = process.env.MEMWAL_NAMESPACE ?? 'precedent',
): StoreHandle {
  const key = process.env.MEMWAL_KEY;
  const accountId = process.env.MEMWAL_ACCOUNT_ID;

  if (key && accountId) {
    return {
      store: new MemWalStore({ key, accountId, namespace }),
      mode: 'mainnet',
      namespace,
    };
  }

  return {
    store: new LocalStore(resolve('.data', `memories-${namespace}.json`)),
    mode: 'local',
    namespace,
  };
}
