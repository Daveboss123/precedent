import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  findContradictions,
  parseFinding,
  serializeFinding,
} from '../src/core/audit.ts';
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

test('two live rules over the same scope with different actions contradict', () => {
  const findings = findContradictions([
    precedent(7, { action: 'buy' }),
    precedent(9, { action: 'defer' }),
  ]);

  assert.equal(findings.length, 1);
  assert.deepEqual(findings[0].precedentIds, [7, 9]);
  assert.deepEqual(findings[0].actions, ['buy', 'defer']);
  assert.deepEqual(findings[0].sharedScope, ['bean']);
  assert.match(findings[0].summary, /#7 \(buy\) and #9 \(defer\)/);
});

test('agreement is not a contradiction', () => {
  const findings = findContradictions([
    precedent(7, { action: 'buy' }),
    precedent(9, { action: 'buy' }),
  ]);

  assert.deepEqual(findings, []);
});

test('different domains never contradict, even with identical scope words', () => {
  const findings = findContradictions([
    precedent(7, { domain: 'coffee' }),
    precedent(9, { domain: 'gear', action: 'defer' }),
  ]);

  assert.deepEqual(findings, []);
});

test('disjoint scopes never contradict', () => {
  const findings = findContradictions([
    precedent(7, { scope: ['beans'] }),
    precedent(9, { action: 'defer', scope: ['grinder'] }),
  ]);

  assert.deepEqual(findings, []);
});

test('superseded rules are not audited', () => {
  const findings = findContradictions([
    precedent(7, { supersededBy: 19, active: false }),
    precedent(9, { action: 'defer' }),
  ]);

  assert.deepEqual(findings, []);
});

test('findings are deterministic and ordered by first precedent id', () => {
  const rules = [
    precedent(9, { action: 'defer' }),
    precedent(7, { action: 'buy' }),
    precedent(11, { action: 'switch_brand' }),
  ];

  const first = findContradictions(rules);
  const second = findContradictions([...rules].reverse());

  assert.deepEqual(first, second);
  assert.equal(first[0].precedentIds[0], 7);
  assert.equal(first.length, 3);
});

test('a finding survives a round trip through memory', () => {
  const [finding] = findContradictions([
    precedent(7, { action: 'buy' }),
    precedent(9, { action: 'defer' }),
  ]);

  const parsed = parseFinding(
    serializeFinding(finding, '2026-11-02T10:30:00.000Z'),
  );

  assert.deepEqual(parsed, finding);
});

test('a non-audit line is rejected', () => {
  assert.equal(parseFinding('PRECEDENT | id:7'), null);
  assert.equal(parseFinding('AUDIT | kind:contradiction | ids:7'), null);
});
