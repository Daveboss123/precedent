/**
 * Wire format for precedents.
 *
 * Memories are embedded and recalled by meaning, so they must read well to a
 * human *and* to an embedding model. Prose loses structure; JSON loses
 * legibility in the UI. This compact line format keeps both, and parses back
 * into chips like `domain: coffee`, `conf: 0.9`.
 *
 * Conditions are encoded as `key:value` pairs joined by `;`, e.g.
 * `when:price_increase:0.15;price:20`. Values are numbers, booleans, or short
 * vendor names; a vendor containing `;` or `:` would need quoting, which the
 * demo does not require.
 */

import type { Condition, Precedent } from './types.ts';
import {
  SEPARATOR,
  isoDate,
  nullableId,
  quote,
  splitFields,
  toRecord,
  unquote,
} from './wire.ts';

export function serializeCondition(
  condition: Condition | null | undefined,
): string {
  if (!condition) return '-';

  const parts: string[] = [];
  if (condition.priceIncreaseAtLeast !== undefined) {
    parts.push(`price_increase:${condition.priceIncreaseAtLeast}`);
  }
  if (condition.priceAtMost !== undefined) {
    parts.push(`price:${condition.priceAtMost}`);
  }
  if (condition.vendorIs !== undefined) {
    parts.push(`vendor:${condition.vendorIs}`);
  }
  if (condition.recurring !== undefined) {
    parts.push(`recurring:${condition.recurring}`);
  }

  return parts.length > 0 ? parts.join(';') : '-';
}

export function parseCondition(value: string | undefined): Condition | null {
  if (!value || value === '-') return null;

  const condition: Condition = {};

  for (const part of value.split(';')) {
    const colon = part.indexOf(':');
    if (colon === -1) continue;

    const key = part.slice(0, colon).trim();
    const raw = part.slice(colon + 1).trim();

    if (key === 'price_increase') {
      const parsed = Number(raw);
      if (Number.isFinite(parsed)) condition.priceIncreaseAtLeast = parsed;
    } else if (key === 'price') {
      const parsed = Number(raw);
      if (Number.isFinite(parsed)) condition.priceAtMost = parsed;
    } else if (key === 'vendor') {
      condition.vendorIs = raw;
    } else if (key === 'recurring') {
      condition.recurring = raw === 'true';
    }
  }

  return Object.keys(condition).length > 0 ? condition : null;
}

export function serializePrecedent(precedent: Precedent): string {
  return [
    'PRECEDENT',
    `id:${precedent.id}`,
    `domain:${precedent.domain}`,
    `action:${precedent.action}`,
    `trigger:${precedent.trigger}`,
    `reason:${quote(precedent.reason)}`,
    `scope:${precedent.scope.join(',')}`,
    `when:${serializeCondition(precedent.when)}`,
    `conf:${precedent.confidence}`,
    `date:${precedent.createdAt}`,
    `active:${precedent.active}`,
    `supersedes:${precedent.supersedes ?? '-'}`,
    `superseded_by:${precedent.supersededBy ?? '-'}`,
  ].join(SEPARATOR);
}

export function parsePrecedent(line: string): Precedent | null {
  const fields = splitFields(line.trim());
  if (fields[0] !== 'PRECEDENT') return null;

  const raw = toRecord(fields);
  const id = Number(raw.id);
  if (!Number.isFinite(id)) return null;

  return {
    id,
    kind: 'precedent',
    domain: raw.domain as Precedent['domain'],
    action: raw.action as Precedent['action'],
    trigger: raw.trigger ?? '',
    when: parseCondition(raw.when),
    reason: unquote(raw.reason ?? ''),
    scope: (raw.scope ?? '')
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean),
    confidence: Number(raw.conf ?? 0.5),
    createdAt: isoDate(raw.date),
    active: raw.active !== 'false',
    supersedes: nullableId(raw.supersedes),
    supersededBy: nullableId(raw.superseded_by),
  };
}
