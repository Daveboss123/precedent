/**
 * Upstash Redis over its REST API.
 *
 * Vercel gives the app a read-only filesystem, so the public demo cannot use
 * the local JSON files. This is deliberately a tiny client instead of a full
 * Redis SDK: the demo needs a list, a counter, and JSON blobs, and the REST
 * endpoint is one POST away.
 *
 * Only active when PRECEDENT_MODE=local. A machine with mainnet credentials
 * must never silently route its memories through Redis.
 */

const PREFIX = 'precedent';

function restUrl(): string | undefined {
  return (
    process.env.UPSTASH_REDIS_REST_URL ??
    process.env.KV_REST_API_URL
  )?.replace(/\/+$/, '');
}

function restToken(): string | undefined {
  return (
    process.env.UPSTASH_REDIS_REST_TOKEN ??
    process.env.KV_REST_API_TOKEN
  );
}

export function redisConfigured(): boolean {
  return (
    process.env.PRECEDENT_MODE === 'local' &&
    Boolean(restUrl() && restToken())
  );
}

export function redisKey(...parts: string[]): string {
  return [PREFIX, process.env.MEMWAL_NAMESPACE ?? 'precedent', ...parts].join(
    ':',
  );
}

export class RedisKv {
  url: string;
  token: string;

  constructor(url: string, token: string) {
    this.url = url;
    this.token = token;
  }

  async command<T>(args: (string | number)[]): Promise<T> {
    const response = await fetch(this.url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(args),
      cache: 'no-store',
      signal: AbortSignal.timeout(8_000),
    });

    const payload = (await response.json().catch(() => null)) as
      | { result?: T; error?: string }
      | null;

    if (!response.ok || payload?.error) {
      throw new Error(
        `Redis ${String(args[0])} failed: ${payload?.error ?? response.status}`,
      );
    }

    return payload?.result as T;
  }

  get(key: string): Promise<string | null> {
    return this.command<string | null>(['GET', key]);
  }

  set(key: string, value: string): Promise<string> {
    return this.command<string>(['SET', key, value]);
  }

  del(key: string): Promise<number> {
    return this.command<number>(['DEL', key]);
  }

  rpush(key: string, value: string): Promise<number> {
    return this.command<number>(['RPUSH', key, value]);
  }

  lrange(key: string, start: number, stop: number): Promise<string[]> {
    return this.command<string[]>(['LRANGE', key, start, stop]);
  }

  llen(key: string): Promise<number> {
    return this.command<number>(['LLEN', key]);
  }

  eval<T>(
    script: string,
    keys: string[],
    args: (string | number)[],
  ): Promise<T> {
    return this.command<T>(['EVAL', script, keys.length, ...keys, ...args]);
  }
}

let shared: RedisKv | null = null;

export function getRedisKv(): RedisKv {
  if (!shared) {
    const url = restUrl();
    const token = restToken();
    if (!url || !token) {
      throw new Error('Redis is not configured.');
    }
    shared = new RedisKv(url, token);
  }
  return shared;
}
