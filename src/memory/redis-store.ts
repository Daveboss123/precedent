/**
 * MemoryStore backed by Upstash Redis, for the resettable public demo.
 *
 * It mirrors LocalStore exactly, including the same naive keyword recall, so
 * the product behaves the same whether it is running on a laptop or on Vercel.
 * Walrus remains the only mainnet memory; this store is explicitly demo state.
 */

import { getRedisKv, redisKey } from '../lib/redis.ts';
import type { MemoryStore, RecalledMemory } from './store.ts';

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((term) => term.length > 2);
}

export class RedisStore implements MemoryStore {
  key: string;
  counter: number;

  constructor() {
    this.key = redisKey('memories');
    this.counter = 0;
  }

  async remember(text: string): Promise<{ jobId: string }> {
    await getRedisKv().rpush(this.key, text);
    this.counter += 1;
    return { jobId: `demo-${this.counter}` };
  }

  async waitForRemember(_jobId: string): Promise<void> {
    // The REST write has already completed when remember() resolves.
  }

  async recall(query: string, limit = 20): Promise<RecalledMemory[]> {
    const memories = await getRedisKv().lrange(this.key, 0, -1);
    const terms = tokenize(query);

    return memories
      .map((text, index) => {
        const haystack = text.toLowerCase();
        const hits = terms.filter((term) => haystack.includes(term)).length;
        return { text, score: hits + index / 1_000_000 };
      })
      .filter((memory) => memory.score >= 1)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  async analyze(_text: string): Promise<RecalledMemory[]> {
    return [];
  }

  async list(): Promise<string[]> {
    return getRedisKv().lrange(this.key, 0, -1);
  }

  async count(): Promise<number> {
    return getRedisKv().llen(this.key);
  }

  async health(): Promise<boolean> {
    try {
      return (await getRedisKv().command<string>(['PING'])) === 'PONG';
    } catch {
      return false;
    }
  }

  async clear(): Promise<void> {
    await getRedisKv().del(this.key);
  }
}
