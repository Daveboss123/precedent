import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  applySupersessions,
  parseSupersession,
  serializeSupersession,
} from '../src/core/supersession.ts';
import type { Precedent } from '../src/core/types.ts';

function precedent(id: number, overrides: Partial<Precedent> = {}): Precedent {
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
    ...overrides,
  };
}

test('a supersession record survives a round trip, pipes and quotes intact', () => {
  const record = {
    oldId: 7,
    newId: 19,
    reason: 'too acidic | "returned" it',
    createdAt: '2026-11-02T10:30:00.000Z',
  };

  const parsed = parseSupersession(serializeSupersession(record));

  assert.deepEqual(parsed, record);
});

test('the old precedent stays on the record but loses its authority', () => {
  const applied = applySupersessions(
    [precedent(7), precedent(19, { action: 'defer' })],
    [
      {
        oldId: 7,
        newId: 19,
        reason: 'beans were too acidic',
        createdAt: '2026-11-02T10:30:00.000Z',
      },
    ],
  );

  const old = applied.find((item) => item.id === 7);
  const next = applied.find((item) => item.id === 19);

  assert.ok(old);
  assert.ok(next);
  assert.equal(old.active, false);
  assert.equal(old.supersededBy, 19);
  assert.equal(next.active, true);
  assert.equal(next.supersedes, 7);
});

test('a chain of overrulings resolves to the newest precedent', () => {
  const applied = applySupersessions(
    [precedent(1), precedent(2), precedent(3)],
    [
      {
        oldId: 1,
        newId: 2,
        reason: 'first correction',
        createdAt: '2026-10-21T00:00:00.000Z',
      },
      {
        oldId: 2,
        newId: 3,
        reason: 'second correction',
        createdAt: '2026-10-22T00:00:00.000Z',
      },
    ],
  );

  assert.equal(applied.find((item) => item.id === 1)?.supersededBy, 2);
  assert.equal(applied.find((item) => item.id === 2)?.supersededBy, 3);
  assert.equal(applied.find((item) => item.id === 3)?.supersededBy, null);
  assert.equal(applied.find((item) => item.id === 2)?.supersedes, 1);
  assert.equal(applied.find((item) => item.id === 3)?.supersedes, 2);
  assert.deepEqual(
    applied.map((item) => item.active),
    [false, false, true],
  );
});

test('when two records overrule the same precedent, the later one wins', () => {
  const applied = applySupersessions(
    [precedent(1), precedent(2), precedent(3)],
    [
      {
        oldId: 1,
        newId: 3,
        reason: 'later record, listed first',
        createdAt: '2026-10-22T00:00:00.000Z',
      },
      {
        oldId: 1,
        newId: 2,
        reason: 'earlier record, listed second',
        createdAt: '2026-10-21T00:00:00.000Z',
      },
    ],
  );

  assert.equal(applied.find((item) => item.id === 1)?.supersededBy, 3);
  assert.equal(applied.find((item) => item.id === 3)?.supersedes, 1);
});

test('applying supersessions never mutates the input', () => {
  const original = precedent(7);
  const applied = applySupersessions(
    [original],
    [
      {
        oldId: 7,
        newId: 19,
        reason: 'overruled',
        createdAt: '2026-11-02T10:30:00.000Z',
      },
    ],
  );

  assert.equal(original.active, true);
  assert.equal(original.supersededBy, null);
  assert.notEqual(applied[0], original);
});

test('a non-supersession line is rejected', () => {
  assert.equal(parseSupersession('PRECEDENT | id:7 | domain:coffee'), null);
  assert.equal(parseSupersession('SUPERSEDES | old:x | new:y'), null);
});
