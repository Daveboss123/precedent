import { NextResponse } from 'next/server';

import { jsonError } from '../../../../../lib/http.ts';
import {
  isItemId,
  parseImageUpload,
  readItemImage,
  saveItemImage,
} from '../../../../../lib/item-images.ts';
import { readItems, writeItems } from '../../../../../lib/items-store.ts';
import { buildState, invalidateState } from '../../../../../lib/state.ts';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const image = await readItemImage(id);
  if (!image) return new Response('Not found', { status: 404 });

  const blob = new Blob([image.data], { type: image.contentType });
  return new Response(blob, {
    headers: {
      'Content-Type': image.contentType,
      'Content-Length': String(blob.size),
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!isItemId(id)) return jsonError('Item not found.', 404);

  const body = (await request.json().catch(() => null)) as
    | { image?: unknown }
    | null;
  const parsed = parseImageUpload(body?.image);
  if (parsed.error || !parsed.image) {
    return jsonError(parsed.error ?? 'Choose a photo file.');
  }

  const items = await readItems();
  const index = items.findIndex((item) => item.id === id);
  if (index === -1) return jsonError('Item not found.', 404);

  try {
    await saveItemImage(id, parsed.image);
  } catch {
    return jsonError('That photo could not be saved. Try a smaller file.', 500);
  }

  items[index] = {
    ...items[index],
    image: `/api/items/${id}/image?v=${Date.now()}`,
  };
  await writeItems(items);
  invalidateState();
  return NextResponse.json(await buildState());
}
