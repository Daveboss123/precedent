import { NextResponse } from 'next/server';

import { jsonError } from '../../../lib/http.ts';
import { readItems, writeItems } from '../../../lib/items-store.ts';
import { normaliseItem } from '../../../lib/recurring.ts';
import { buildState, invalidateState } from '../../../lib/state.ts';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ items: await readItems() });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { items?: unknown }
    | unknown[]
    | null;

  const raw = Array.isArray(body) ? body : body?.items;
  if (!Array.isArray(raw) || raw.length === 0) {
    return jsonError('Add at least one item.');
  }

  const items = await readItems();
  const known = new Set(
    items.map((item) => `${item.name.toLowerCase()}::${item.vendor.toLowerCase()}`),
  );

  const added = [];
  for (const entry of raw.slice(0, 50)) {
    const item = normaliseItem(entry);
    if (!item) continue;

    const key = `${item.name.toLowerCase()}::${item.vendor.toLowerCase()}`;
    if (known.has(key)) continue;
    known.add(key);
    added.push(item);
  }

  if (added.length === 0) {
    return jsonError('Those items are already on your list.');
  }

  await writeItems([...items, ...added]);
  invalidateState();
  return NextResponse.json(await buildState());
}

export async function DELETE(request: Request) {
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return jsonError('Missing item id.');

  const items = await readItems();
  const next = items.filter((item) => item.id !== id);
  if (next.length === items.length) return jsonError('Item not found.');

  await writeItems(next);
  invalidateState();
  return NextResponse.json(await buildState());
}
