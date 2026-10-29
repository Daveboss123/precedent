import assert from 'node:assert/strict';
import test from 'node:test';

import { isItemId, parseImageUpload } from '../src/lib/item-images.ts';
import { isStoredImage, normaliseItem } from '../src/lib/recurring.ts';

const PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Zl1sAAAAASUVORK5CYII=';
const JPEG =
  'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAf/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAF//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABBQJ//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAwEBPwF//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAgEBPwF//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQAGPwJ//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPyF//9oADAMBAAIAAwAAABD/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAEDAQE/EH//xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAECAQE/EH//xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAE/EH//2Q==';

test('a real PNG upload is accepted and kept as base64', () => {
  const parsed = parseImageUpload(PNG);
  assert.equal(parsed.error, undefined);
  assert.equal(parsed.image?.contentType, 'image/png');
  assert.equal(parsed.image?.data, PNG.split(',')[1]);
});

test('a declared JPEG without JPEG bytes is rejected', () => {
  const parsed = parseImageUpload(PNG.replace('image/png', 'image/jpeg'));
  assert.match(parsed.error ?? '', /not a readable/);
});

test('SVG and remote URLs are not accepted as item photos', () => {
  assert.match(
    parseImageUpload('data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=').error ?? '',
    /JPG, PNG or WebP/,
  );
  assert.match(parseImageUpload('https://example.com/item.jpg').error ?? '', /JPG, PNG or WebP/);
  assert.equal(parseImageUpload('').image, undefined);
});

test('item ids are limited to safe path segments', () => {
  assert.equal(isItemId('0d6f3c9f-7a5d-4f8e-9c2b-3a1d5e7f9b0c'), true);
  assert.equal(isItemId('../secrets'), false);
  assert.equal(isItemId('short'), false);
});

test('only shipped or uploaded image paths survive normalisation', () => {
  assert.equal(isStoredImage('/products/olive-oil.jpg'), true);
  assert.equal(isStoredImage('/api/items/0d6f3c9f-7a5d-4f8e-9c2b-3a1d5e7f9b0c/image?v=1'), true);
  assert.equal(isStoredImage('/api/items/../../secret/image'), false);
  assert.equal(isStoredImage('data:image/png;base64,AAAA'), false);
  assert.equal(isStoredImage('javascript:alert(1)'), false);
});

test('a new item never borrows a stock photo by name', () => {
  const item = normaliseItem({
    name: 'Nivea cream',
    vendor: 'Walmart',
    price: 5,
    category: 'dairy',
    domain: 'pantry',
    cadence: 'monthly',
  });

  assert.ok(item);
  assert.equal(item.image, null);
});

test('an uploaded image path and a shipped photo both survive normalisation', () => {
  const id = '0d6f3c9f-7a5d-4f8e-9c2b-3a1d5e7f9b0c';
  const uploaded = normaliseItem({
    id,
    name: 'Nivea cream',
    image: `/api/items/${id}/image?v=1`,
  });
  const shipped = normaliseItem({
    name: 'Olive oil',
    image: '/products/olive-oil.jpg',
  });

  assert.equal(uploaded?.image, `/api/items/${id}/image?v=1`);
  assert.equal(shipped?.image, '/products/olive-oil.jpg');
});

test('the accepted JPEG fixture is readable', () => {
  const parsed = parseImageUpload(JPEG);
  assert.equal(parsed.error, undefined);
  assert.equal(parsed.image?.contentType, 'image/jpeg');
});
