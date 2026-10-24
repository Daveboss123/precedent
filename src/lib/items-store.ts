/**
 * File-backed storage for the user's recurring list.
 *
 * It is deliberately separate from Walrus Memory: the list is editable app
 * state, while the rules about it are append-only. A visitor can curate the
 * list without spending a mainnet write.
 */

import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

import type { RecurringItem } from './recurring.ts';
import { normaliseItem, seedItems } from './recurring.ts';

function mode(): 'mainnet' | 'local' {
  return process.env.MEMWAL_KEY && process.env.MEMWAL_ACCOUNT_ID
    ? 'mainnet'
    : 'local';
}

function path(): string {
  const namespace = process.env.MEMWAL_NAMESPACE ?? 'precedent';
  return resolve('.data', `items-${mode()}-${namespace}.json`);
}

export async function readItems(): Promise<RecurringItem[]> {
  const file = path();

  try {
    const raw = await readFile(file, 'utf8');
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return seedItems();

    return parsed
      .map((entry) => normaliseItem(entry))
      .filter((item): item is RecurringItem => item !== null);
  } catch {
    const seeded = seedItems();
    await writeItems(seeded);
    return seeded;
  }
}

export async function writeItems(items: RecurringItem[]): Promise<void> {
  const file = path();
  await mkdir(dirname(file), { recursive: true });
  const temp = `${file}.tmp`;
  await writeFile(temp, `${JSON.stringify(items, null, 2)}\n`, 'utf8');
  await rename(temp, file);
}
