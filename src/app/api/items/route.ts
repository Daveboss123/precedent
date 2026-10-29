import { NextResponse } from 'next/server';

import { jsonError } from '../../../lib/http.ts';
import {
  deleteItemImage,
  parseImageUpload,
  saveItemImage,
} from '../../../lib/item-images.ts';
import type { ItemImage } from '../../../lib/item-images.ts';
import { readItems, writeItems } from '../../../lib/items-store.ts';
import { normaliseItem } from '../../../lib/recurring.ts';
import type { RecurringItem } from '../../../lib/recurring.ts';
import { buildState, invalidateState } from '../../../lib/state.ts';

export const dynamic = 'force-dynamic';

function recordOf(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

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

  const added: Array<{ item: RecurringItem; upload?: ItemImage }> = [];
  for (const entry of raw.slice(0, 50)) {
    const record = recordOf(entry);
    if (!record) continue;

    const upload =
      typeof record.image === 'string' && record.image.startsWith('data:')
        ? record.image
        : null;
    const parsed = upload ? parseImageUpload(upload) : {};
    if (parsed.error) return jsonError(parsed.error);

    const item = normaliseItem({
      ...record,
      id: undefined,
      createdAt: undefined,
      image: upload ? null : record.image,
    });
    if (!item) continue;

    const key = `${item.name.toLowerCase()}::${item.vendor.toLowerCase()}`;
    if (known.has(key)) continue;
    known.add(key);
    added.push({ item, upload: parsed.image });
  }

  if (added.length === 0) {
    return jsonError('Those items are already on your list.');
  }

  try {
    for (const entry of added) {
      if (!entry.upload) continue;
      await saveItemImage(entry.item.id, entry.upload);
      entry.item.image = `/api/items/${entry.item.id}/image?v=${Date.now()}`;
    }
  } catch {
    return jsonError('That photo could not be saved. Try a smaller file.', 500);
  }

  await writeItems([...items, ...added.map((entry) => entry.item)]);
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
  await deleteItemImage(id).catch(() => undefined);
  invalidateState();
  return NextResponse.json(await buildState());
}
