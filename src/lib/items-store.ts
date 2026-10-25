/**
 * Storage for the user's recurring list.
 *
 * It is deliberately separate from Walrus Memory: the list is editable app
 * state, while the rules about it are append-only. A visitor can curate the
 * list without spending a mainnet write.
 *
 * Local development uses a JSON file. The public Vercel demo uses Upstash
 * Redis because its filesystem is read-only.
 */

import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

import type { RecurringItem } from './recurring.ts';
import { normaliseItem, seedItems } from './recurring.ts';
import { getRedisKv, redisConfigured, redisKey } from './redis.ts';

function mode(): 'mainnet' | 'local' {
  return process.env.MEMWAL_KEY && process.env.MEMWAL_ACCOUNT_ID
    ? 'mainnet'
    : 'local';
}

function path(): string {
  const namespace = process.env.MEMWAL_NAMESPACE ?? 'precedent';
  return resolve('.data', `items-${mode()}-${namespace}.json`);
}

function parseItems(raw: string): RecurringItem[] | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;

    return parsed
      .map((entry) => normaliseItem(entry))
      .filter((item): item is RecurringItem => item !== null);
  } catch {
    return null;
  }
}

async function readRedisItems(): Promise<RecurringItem[]> {
  const key = redisKey('items');
  const raw = await getRedisKv().get(key);
  const parsed = raw ? parseItems(raw) : null;
  if (parsed) return parsed;

  const seeded = seedItems();
  await getRedisKv().set(key, JSON.stringify(seeded));
  return seeded;
}

export async function readItems(): Promise<RecurringItem[]> {
  if (redisConfigured()) return readRedisItems();

  const file = path();

  try {
    const raw = await readFile(file, 'utf8');
    const parsed = parseItems(raw);
    if (parsed) return parsed;

    const seeded = seedItems();
    await writeItems(seeded);
    return seeded;
  } catch {
    const seeded = seedItems();
    await writeItems(seeded);
    return seeded;
  }
}

export async function writeItems(items: RecurringItem[]): Promise<void> {
  if (redisConfigured()) {
    await getRedisKv().set(redisKey('items'), JSON.stringify(items));
    return;
  }

  const file = path();
  await mkdir(dirname(file), { recursive: true });
  const temp = `${file}.tmp`;
  await writeFile(temp, `${JSON.stringify(items, null, 2)}\n`, 'utf8');
  await rename(temp, file);
}
