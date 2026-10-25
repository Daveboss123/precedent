/**
 * The charter, stored as app state.
 *
 * It is not a memory yet — the resolver takes it as an argument. Writing it to
 * memory is the next step, because the Auditor should be able to read the
 * charter without being able to read finance.
 *
 * Local development uses a JSON file. The public Vercel demo uses Upstash
 * Redis because its filesystem is read-only.
 */

import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

import type { Charter } from '../core/types.ts';
import { getRedisKv, redisConfigured, redisKey } from './redis.ts';

const PATH = resolve('.data', 'charter.json');

export const DEFAULT_CHARTER: Charter = {
  budgetPerMonth: 150,
  approvalAbove: 100,
  bannedCategories: ['subscription'],
  allowedVendors: [],
};

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean);
}

function numberOr(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

export function normaliseCharter(value: unknown): Charter {
  const record = (value ?? {}) as Partial<Charter>;
  return {
    budgetPerMonth: numberOr(record.budgetPerMonth, DEFAULT_CHARTER.budgetPerMonth),
    approvalAbove: numberOr(record.approvalAbove, DEFAULT_CHARTER.approvalAbove),
    bannedCategories: stringList(record.bannedCategories),
    allowedVendors: stringList(record.allowedVendors),
  };
}

export async function readCharter(): Promise<Charter> {
  if (redisConfigured()) {
    const raw = await getRedisKv().get(redisKey('charter'));
    return raw ? normaliseCharter(JSON.parse(raw)) : { ...DEFAULT_CHARTER };
  }

  try {
    const raw = await readFile(PATH, 'utf8');
    return normaliseCharter(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_CHARTER };
  }
}

export async function writeCharter(charter: Charter): Promise<Charter> {
  const normalised = normaliseCharter(charter);

  if (redisConfigured()) {
    await getRedisKv().set(redisKey('charter'), JSON.stringify(normalised));
    return normalised;
  }

  await mkdir(dirname(PATH), { recursive: true });
  const temp = `${PATH}.tmp`;
  await writeFile(temp, `${JSON.stringify(normalised, null, 2)}\n`, 'utf8');
  await rename(temp, PATH);
  return normalised;
}
