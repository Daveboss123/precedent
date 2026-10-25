/**
 * Decision log backed by Upstash Redis for the resettable public demo.
 *
 * The stored shape is identical to the file-backed log. Only the transport
 * changes, so the autonomy report and the UI never know the difference.
 */

import { getRedisKv, redisKey } from './redis.ts';
import type {
  AutonomyReport,
  DecisionEntry,
  DecisionLogLike,
} from './decision-log.ts';
import { reportOf } from './decision-log.ts';

export class RedisDecisionLog implements DecisionLogLike {
  key: string;

  constructor() {
    this.key = redisKey('decisions');
  }

  async all(): Promise<DecisionEntry[]> {
    const raw = await getRedisKv().lrange(this.key, 0, -1);
    return raw
      .map((entry) => {
        try {
          return JSON.parse(entry) as unknown;
        } catch {
          return null;
        }
      })
      .filter(
        (entry): entry is DecisionEntry =>
          Boolean(entry) &&
          typeof entry === 'object' &&
          typeof (entry as DecisionEntry).id === 'string',
      );
  }

  async append(entry: Omit<DecisionEntry, 'id' | 'at'>): Promise<DecisionEntry> {
    const full: DecisionEntry = {
      id: crypto.randomUUID(),
      at: new Date().toISOString(),
      ...entry,
    };
    await getRedisKv().rpush(this.key, JSON.stringify(full));
    return full;
  }

  async report(): Promise<AutonomyReport> {
    return reportOf(await this.all());
  }

  async clear(): Promise<void> {
    await getRedisKv().del(this.key);
  }
}
