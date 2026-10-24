import { test } from 'node:test';
import assert from 'node:assert/strict';

import { resolve, similarity } from '../src/core/resolve.ts';
import { parsePrecedent, serializePrecedent } from '../src/core/memory-format.ts';
import type { Candidate, Charter, Precedent } from '../src/core/types.ts';

const NOW = new Date('2026-10-24T12:00:00.000Z');

const charter: Charter = {
  budgetPerMonth: 120,
  approvalAbove: 40,
  bannedCategories: ['subscription'],
  allowedVendors: [],
};

const coffee: Candidate = {
  id: 'c1',
  domain: 'coffee',
  item: 'House blend beans',
  vendor: 'Roaster A',
  category: 'beans',
  price: 18,
  recurring: false,
};

function precedent(overrides: Partial<Precedent> = {}): Precedent {
  return {
    id: 7,
    kind: 'precedent',
    domain: 'coffee',
    action: 'switch_brand',
    trigger: 'price_increase>15%',
    when: null,
    reason: 'taste is fine, price is not',
    scope: ['beans'],
    confidence: 0.9,
    createdAt: '2026-10-20T00:00:00.000Z',
    active: true,
    supersededBy: null,
    supersedes: null,
    ...overrides,
  };
}

test('charter bans a category and never asks', () => {
  const decision = resolve(
    { ...coffee, category: 'subscription', price: 5 },
    charter,
    [precedent()],
    NOW,
  );

  assert.equal(decision.action, 'block');
  assert.equal(decision.cause, 'charter_banned');
  assert.equal(decision.cited.length, 0);
});

test('charter vendor allowlist blocks unknown vendors', () => {
  const decision = resolve(
    coffee,
    { ...charter, allowedVendors: ['Roaster B'] },
    [],
    NOW,
  );

  assert.equal(decision.action, 'block');
  assert.equal(decision.cause, 'charter_vendor');
});

test('threshold asks even when a precedent applies, but shows what it knows', () => {
  const decision = resolve(
    { ...coffee, price: 65 },
    charter,
    [precedent()],
    NOW,
  );

  assert.equal(decision.action, 'ask');
  assert.equal(decision.cause, 'charter_threshold');
  assert.deepEqual(decision.cited, [7]);
});

test('no precedent means ask, and that is the learning moment', () => {
  const decision = resolve(coffee, charter, [], NOW);

  assert.equal(decision.action, 'ask');
  assert.equal(decision.cause, 'no_precedent');
  assert.equal(decision.cited.length, 0);
});

test('a strong matching precedent is followed and cited', () => {
  const decision = resolve(coffee, charter, [precedent()], NOW);

  assert.equal(decision.action, 'act');
  assert.equal(decision.cause, 'precedent_match');
  assert.deepEqual(decision.cited, [7]);
  assert.match(decision.explanation, /Following precedent #7/);
  assert.ok(decision.confidence >= 0.7);
});

test('conflicting precedents ask and are flagged for the Auditor', () => {
  const decision = resolve(
    coffee,
    charter,
    [
      precedent({ id: 7, action: 'switch_brand', confidence: 0.9 }),
      precedent({ id: 9, action: 'defer', confidence: 0.9 }),
    ],
    NOW,
  );

  assert.equal(decision.action, 'ask');
  assert.equal(decision.cause, 'precedent_conflict');
  assert.equal(decision.needsAudit, true);
  assert.deepEqual(decision.cited.sort(), [7, 9]);
});

test('superseded precedents lose their authority', () => {
  const decision = resolve(
    coffee,
    charter,
    [precedent({ supersededBy: 19 })],
    NOW,
  );

  assert.equal(decision.action, 'ask');
  assert.equal(decision.cause, 'no_precedent');
});

test('stale precedents are ignored', () => {
  const decision = resolve(
    coffee,
    charter,
    [precedent({ createdAt: '2026-05-01T00:00:00.000Z' })],
    NOW,
  );

  assert.equal(decision.action, 'ask');
  assert.equal(decision.cause, 'no_precedent');
});

test('a weak match asks instead of acting', () => {
  const decision = resolve(
    coffee,
    charter,
    [precedent({ confidence: 0.6 })],
    NOW,
  );

  assert.equal(decision.action, 'ask');
  assert.equal(decision.cause, 'precedent_match');
});

test('similarity is scoped by domain', () => {
  assert.equal(similarity({ ...coffee, domain: 'gear' }, precedent()), 0);
});

test('similarity handles naive pluralisation', () => {
  const monitor: Candidate = {
    id: 'm1',
    domain: 'gear',
    item: '27 inch display',
    vendor: 'Vendor X',
    category: 'monitors',
    price: 300,
    recurring: false,
  };

  const monitorPrecedent = precedent({
    domain: 'gear',
    scope: ['monitor'],
    action: 'buy',
  });

  assert.equal(similarity(monitor, monitorPrecedent), 1);
});

test('resolution is deterministic', () => {
  const first = resolve(coffee, charter, [precedent()], NOW);
  const second = resolve(coffee, charter, [precedent()], NOW);

  assert.deepEqual(first, second);
});

test('memories round-trip through the wire format, pipes and quotes intact', () => {
  const original = precedent({
    reason: 'taste is fine | "price" is not',
    scope: ['beans', 'pods'],
  });

  const parsed = parsePrecedent(serializePrecedent(original));

  assert.ok(parsed);
  assert.equal(parsed.reason, original.reason);
  assert.deepEqual(parsed.scope, original.scope);
  assert.equal(parsed.confidence, original.confidence);
  assert.equal(parsed.supersededBy, null);
});

test('the wire format is readable enough for a human and an embedding', () => {
  const line = serializePrecedent(precedent());

  assert.match(line, /^PRECEDENT \| id:7 \| domain:coffee \| action:switch_brand/);
  assert.match(line, /reason:"taste is fine, price is not"/);
});

test('a condition gates a precedent even when the scope matches', () => {
  const conditional = precedent({
    action: 'switch_brand',
    when: { priceIncreaseAtLeast: 0.15 },
  });

  const quiet = resolve({ ...coffee, priceIncrease: 0.05 }, charter, [conditional], NOW);
  assert.equal(quiet.action, 'ask');
  assert.equal(quiet.cause, 'no_precedent');

  const spike = resolve({ ...coffee, priceIncrease: 0.22 }, charter, [conditional], NOW);
  assert.equal(spike.action, 'act');
  assert.deepEqual(spike.cited, [7]);
});

test('a missing measurement cannot satisfy a condition', () => {
  const conditional = precedent({ when: { priceIncreaseAtLeast: 0.15 } });
  const decision = resolve(coffee, charter, [conditional], NOW);

  assert.equal(decision.cause, 'no_precedent');
});

test('the more specific precedent governs when both match', () => {
  const general = precedent({ id: 1, action: 'buy', when: null, confidence: 0.9 });
  const specific = precedent({
    id: 2,
    action: 'switch_brand',
    when: { priceIncreaseAtLeast: 0.15 },
    confidence: 0.9,
  });

  const spike = resolve(
    { ...coffee, priceIncrease: 0.22 },
    charter,
    [general, specific],
    NOW,
  );
  assert.equal(spike.action, 'act');
  assert.deepEqual(spike.cited, [2]);
  assert.match(spike.explanation, /more specific precedent #2/);

  const quiet = resolve(
    { ...coffee, priceIncrease: 0.02 },
    charter,
    [general, specific],
    NOW,
  );
  assert.equal(quiet.action, 'act');
  assert.deepEqual(quiet.cited, [1]);
});

test('equally specific rules that disagree are still a conflict', () => {
  const a = precedent({ id: 1, action: 'buy', when: { priceAtMost: 20 } });
  const b = precedent({ id: 2, action: 'defer', when: { priceAtMost: 20 } });

  const decision = resolve({ ...coffee, price: 18 }, charter, [a, b], NOW);

  assert.equal(decision.action, 'ask');
  assert.equal(decision.cause, 'precedent_conflict');
  assert.deepEqual(decision.cited.sort(), [1, 2]);
});

test('structured conditions round-trip through memory', () => {
  const original = precedent({
    when: {
      priceIncreaseAtLeast: 0.15,
      priceAtMost: 25,
      vendorIs: 'Roaster A',
      recurring: true,
    },
  });

  const parsed = parsePrecedent(serializePrecedent(original));

  assert.ok(parsed);
  assert.deepEqual(parsed.when, original.when);
});
