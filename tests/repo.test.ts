import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { PrecedentRepo } from '../src/memory/precedent-repo.ts';
import type { NewPrecedentInput } from '../src/memory/precedent-repo.ts';
import { FileIdAllocator, InMemoryIdAllocator } from '../src/memory/ids.ts';
import { serializePrecedent } from '../src/core/memory-format.ts';
import { parseOutcome } from '../src/core/outcome.ts';
import { FakeStore } from './fake-store.ts';
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

const beans: NewPrecedentInput = {
  domain: 'coffee',
  action: 'switch_brand',
  trigger: 'price_increase>15%',
  reason: 'taste is fine, price is not',
  scope: ['beans'],
  confidence: 0.9,
};

function makeRepo(seed: string[] = []) {
  const store = new FakeStore(seed);
  const ids = new InMemoryIdAllocator(1);
  const repo = new PrecedentRepo({ store, ids, now: () => NOW });
  return { store, ids, repo };
}

function stored(id: number): Precedent {
  return {
    id,
    kind: 'precedent',
    domain: 'coffee',
    action: 'buy',
    trigger: 'restock',
    when: null,
    reason: 'it ran out',
    scope: ['beans'],
    confidence: 0.8,
    createdAt: '2026-10-20T00:00:00.000Z',
    active: true,
    supersededBy: null,
    supersedes: null,
  };
}

test('a new precedent is written, readable, and numbered', async () => {
  const { repo, store } = makeRepo();

  const created = await repo.create(beans);

  assert.equal(created.id, 1);
  assert.equal(store.writes.length, 1);
  assert.match(store.writes[0], /^PRECEDENT \| id:1 \| domain:coffee/);

  const snapshot = await repo.snapshot();
  assert.equal(snapshot.precedents.length, 1);
  assert.deepEqual(snapshot.precedents[0].scope, ['beans']);
  assert.equal(snapshot.precedents[0].active, true);
});

test('session one asks; session two acts on what it learned', async () => {
  const { repo } = makeRepo();

  const cold = await repo.resolveCandidate(coffee, charter);
  assert.equal(cold.action, 'ask');
  assert.equal(cold.cause, 'no_precedent');

  await repo.create(beans);

  const warm = await repo.resolveCandidate(coffee, charter);
  assert.equal(warm.action, 'act');
  assert.equal(warm.cause, 'precedent_match');
  assert.deepEqual(warm.cited, [1]);
});

test('a supersession flips the decision and keeps the old rule on the record', async () => {
  const { repo } = makeRepo();
  await repo.create(beans);

  const { precedent, record } = await repo.supersede(1, {
    action: 'defer',
    reason: 'beans were too acidic',
  });

  assert.equal(precedent.id, 2);
  assert.equal(precedent.supersedes, 1);
  assert.equal(record.oldId, 1);
  assert.equal(record.newId, 2);

  const snapshot = await repo.snapshot();
  const old = snapshot.precedents.find((item) => item.id === 1);
  assert.ok(old);
  assert.equal(old.active, false);
  assert.equal(old.supersededBy, 2);

  const decision = await repo.resolveCandidate(coffee, charter);
  assert.equal(decision.action, 'act');
  assert.deepEqual(decision.cited, [2]);
  assert.match(decision.explanation, /precedent #2/);
});

test('the old precedent is never rewritten, only overruled', async () => {
  const { repo, store } = makeRepo();
  await repo.create(beans);
  const before = store.writes[0];

  await repo.supersede(1, { action: 'defer', reason: 'too acidic' });

  assert.equal(store.writes[0], before);
  assert.ok(store.writes.some((text) => text.startsWith('SUPERSEDES')));
});

test('superseding a rule that is already overruled is refused', async () => {
  const { repo } = makeRepo();
  await repo.create(beans);
  await repo.supersede(1, { action: 'defer', reason: 'too acidic' });

  await assert.rejects(
    () => repo.supersede(1, { action: 'buy', reason: 'changed my mind' }),
    /no active precedent/,
  );
});

test('delete the memories and autonomy goes to zero', async () => {
  const { repo, store } = makeRepo();
  await repo.create(beans);

  assert.equal((await repo.resolveCandidate(coffee, charter)).action, 'act');

  // Simulate deleting every memory. Walrus is append-only in production, but
  // this is the thought experiment the whole product rests on.
  store.memories.length = 0;

  const after = await repo.resolveCandidate(coffee, charter);
  assert.equal(after.action, 'ask');
  assert.equal(after.cause, 'no_precedent');
  assert.deepEqual(after.cited, []);
});

test('the Auditor writes a contradiction once, not on every pass', async () => {
  const { repo, store } = makeRepo();
  await repo.create(beans);
  await repo.create({ ...beans, action: 'defer', reason: 'beans are too acidic' });

  const first = await repo.audit();
  assert.equal(first.length, 1);
  assert.deepEqual(first[0].precedentIds, [1, 2]);

  const second = await repo.audit();
  assert.deepEqual(second, []);
  assert.equal(store.writes.filter((text) => text.startsWith('AUDIT')).length, 1);
});

test('resolving a contradiction retires its finding', async () => {
  const { repo } = makeRepo();
  await repo.create(beans);
  await repo.create({ ...beans, action: 'defer', reason: 'beans are too acidic' });

  await repo.audit();
  assert.equal((await repo.findings()).length, 1);

  await repo.supersede(1, {
    action: 'defer',
    reason: 'settled: defer to the cheaper lot',
  });

  assert.deepEqual(await repo.findings(), []);
  assert.deepEqual(await repo.audit(), []);
});

test('answering a conflict overrules the losing side and settles it', async () => {
  const { repo } = makeRepo();
  await repo.create(beans);
  await repo.create({ ...beans, action: 'buy', reason: 'keep the house blend' });

  const before = await repo.resolveCandidate(coffee, charter);
  assert.equal(before.cause, 'precedent_conflict');
  assert.deepEqual(before.cited, [1, 2]);
  await repo.audit();
  assert.equal((await repo.findings()).length, 1);

  const ruling = await repo.create({
    ...beans,
    action: 'buy',
    reason: 'the house blend wins',
  });
  const overruled = await repo.overrule(before.cited, ruling.id, ruling.reason);
  assert.deepEqual(overruled.map((record) => record.oldId), [1]);

  const after = await repo.resolveCandidate(coffee, charter);
  assert.equal(after.action, 'act');
  assert.equal(after.cause, 'precedent_match');
  assert.deepEqual([...after.cited].sort((a, b) => a - b), [2, 3]);

  const snapshot = await repo.snapshot();
  assert.equal(snapshot.precedents.find((item) => item.id === 1)?.supersededBy, 3);
  assert.deepEqual(await repo.findings(), []);
});

test('outcomes are recorded as memories', async () => {
  const { repo, store } = makeRepo();

  await repo.recordOutcome({
    candidateId: 'c1',
    precedentIds: [7],
    result: 'returned',
    note: 'too acidic',
  });

  const line = store.writes[0];
  assert.match(line, /^OUTCOME/);

  const parsed = parseOutcome(line);
  assert.ok(parsed);
  assert.deepEqual(parsed.precedentIds, [7]);
  assert.equal(parsed.result, 'returned');
  assert.equal(parsed.note, 'too acidic');
});

test('an observation is never lost when extraction is unavailable', async () => {
  const { repo, store } = makeRepo();

  const observations = await repo.observe('the grinder chokes on oily beans');

  assert.equal(observations.length, 1);
  assert.equal(store.writes.length, 1);
  assert.match(store.writes[0], /^OBSERVATION \| the grinder/);
});

test('extracted observations are written instead of the raw text', async () => {
  const { repo, store } = makeRepo();
  store.analyzeResult = [{ text: 'grinder: oily beans jam it' }];

  const observations = await repo.observe('the grinder chokes on oily beans');

  assert.equal(observations.length, 1);
  assert.match(store.writes[0], /grinder: oily beans jam it/);
});

test('the allocator never reissues an id that memory already contains', async () => {
  const store = new FakeStore([serializePrecedent(stored(7))]);
  const ids = new InMemoryIdAllocator(1);
  const repo = new PrecedentRepo({ store, ids, now: () => NOW });

  await repo.snapshot();

  assert.equal(await ids.next(), 8);
});

test('the file allocator is monotonic across instances', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'precedent-ids-'));
  const path = join(dir, 'ids.json');

  try {
    const first = new FileIdAllocator(path);
    assert.equal(await first.next(), 1);
    assert.equal(await first.next(), 2);

    const second = new FileIdAllocator(path);
    assert.equal(await second.next(), 3);

    await second.observe(41);
    assert.equal(await second.next(), 42);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('the file allocator survives concurrent reservations', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'precedent-ids-'));
  const path = join(dir, 'ids.json');

  try {
    const allocator = new FileIdAllocator(path);
    const ids = await Promise.all(
      Array.from({ length: 20 }, () => allocator.next()),
    );

    assert.deepEqual(ids, Array.from({ length: 20 }, (_, index) => index + 1));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
