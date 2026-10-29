/**
 * Uploaded item photos.
 *
 * The photo is resized in the browser before it reaches the API, then stored
 * beside the list rather than inside it. That keeps the state payload small and
 * gives each item a stable URL the card can cache.
 */

import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

import { getRedisKv, redisConfigured, redisKey } from './redis.ts';

const MAX_IMAGE_BYTES = 320 * 1024;
const DATA_URL = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/;

export interface ItemImage {
  contentType: string;
  /** Base64, without the data URL prefix. */
  data: string;
}

export function isItemId(value: string): boolean {
  return /^[a-zA-Z0-9][a-zA-Z0-9-]{5,79}$/.test(value);
}

function sniff(buffer: Buffer): string | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }

  if (
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    )
  ) {
    return 'image/png';
  }

  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'image/webp';
  }

  return null;
}

/** Validate an uploaded data URL. Only real JPEG, PNG and WebP bytes are kept. */
export function parseImageUpload(
  value: unknown,
): { image?: ItemImage; error?: string } {
  if (value === undefined || value === null || value === '') return {};
  if (typeof value !== 'string') {
    return { error: 'Choose a photo file.' };
  }

  const match = DATA_URL.exec(value);
  if (!match) {
    return { error: 'Use a JPG, PNG or WebP photo.' };
  }

  const buffer = Buffer.from(match[2], 'base64');
  if (buffer.length === 0) {
    return { error: 'That photo is empty. Choose another file.' };
  }
  if (buffer.length > MAX_IMAGE_BYTES) {
    return { error: 'That photo is too large. Choose a smaller file.' };
  }

  const contentType = sniff(buffer);
  if (!contentType || contentType !== match[1]) {
    return { error: 'That file is not a readable JPG, PNG or WebP photo.' };
  }

  return { image: { contentType, data: match[2] } };
}

function imagePath(id: string): string {
  return resolve('.data', 'item-images', `${id}.json`);
}

export async function saveItemImage(id: string, image: ItemImage): Promise<void> {
  if (!isItemId(id)) throw new Error('Invalid item id.');

  const payload = JSON.stringify(image);
  if (redisConfigured()) {
    await getRedisKv().set(redisKey('item-image', id), payload);
    return;
  }

  const file = imagePath(id);
  await mkdir(dirname(file), { recursive: true });
  const temp = `${file}.tmp`;
  await writeFile(temp, payload, 'utf8');
  await rename(temp, file);
}

export async function readItemImage(
  id: string,
): Promise<{ contentType: string; data: Uint8Array<ArrayBuffer> } | null> {
  if (!isItemId(id)) return null;

  let raw: string | null = null;
  try {
    raw = redisConfigured()
      ? await getRedisKv().get(redisKey('item-image', id))
      : await readFile(imagePath(id), 'utf8');
  } catch {
    return null;
  }
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<ItemImage>;
    if (
      typeof parsed.contentType !== 'string' ||
      !['image/jpeg', 'image/png', 'image/webp'].includes(parsed.contentType) ||
      typeof parsed.data !== 'string'
    ) {
      return null;
    }

    const buffer = Buffer.from(parsed.data, 'base64');
    if (buffer.length === 0 || sniff(buffer) !== parsed.contentType) return null;

    const data = new Uint8Array(buffer.length);
    data.set(buffer);
    return {
      contentType: parsed.contentType,
      data,
    };
  } catch {
    return null;
  }
}

export async function deleteItemImage(id: string): Promise<void> {
  if (!isItemId(id)) return;

  if (redisConfigured()) {
    await getRedisKv().del(redisKey('item-image', id));
    return;
  }

  await rm(imagePath(id), { force: true });
}
