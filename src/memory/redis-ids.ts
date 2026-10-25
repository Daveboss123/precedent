/**
 * Durable id allocation for the Redis-backed demo.
 *
 * Redis is the counter, so two serverless instances cannot issue the same
 * precedent id. The script keeps the read-and-increment atomic.
 */

import { getRedisKv, redisKey } from '../lib/redis.ts';
import type { IdAllocator } from './ids.ts';

const NEXT = `
local n = tonumber(redis.call('GET', KEYS[1]) or '1')
redis.call('SET', KEYS[1], n + 1)
return n
`;

const OBSERVE = `
local n = tonumber(redis.call('GET', KEYS[1]) or '1')
local seen = tonumber(ARGV[1])
if seen >= n then
  redis.call('SET', KEYS[1], seen + 1)
end
return n
`;

export class RedisIdAllocator implements IdAllocator {
  key: string;

  constructor() {
    this.key = redisKey('next-id');
  }

  async next(): Promise<number> {
    return getRedisKv().eval<number>(NEXT, [this.key], []);
  }

  async observe(id: number): Promise<void> {
    if (!Number.isFinite(id) || id < 1) return;
    await getRedisKv().eval<number>(OBSERVE, [this.key], [Math.floor(id)]);
  }

  async reset(): Promise<void> {
    await getRedisKv().set(this.key, '1');
  }
}
