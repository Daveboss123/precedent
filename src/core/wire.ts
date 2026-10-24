/**
 * The shared wire grammar.
 *
 * Memories are newline-free, pipe-delimited records: legible to a human in the
 * ledger, legible to an embedding model, and cheap to parse without a schema.
 * Three record types use it (PRECEDENT, SUPERSEDES, AUDIT), so the escaping
 * rules live here once instead of three times.
 */

export const SEPARATOR = ' | ';

/** Split on the separator, but never inside a quoted value. */
export function splitFields(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
      current += char;
      continue;
    }

    if (!inQuotes && line.startsWith(SEPARATOR, i)) {
      fields.push(current);
      current = '';
      i += SEPARATOR.length - 1;
      continue;
    }

    current += char;
  }

  fields.push(current);
  return fields;
}

/** Turn `['PRECEDENT', 'id:7', 'domain:coffee']` into a field map. */
export function toRecord(fields: string[]): Record<string, string> {
  const record: Record<string, string> = {};

  for (const field of fields.slice(1)) {
    const colon = field.indexOf(':');
    if (colon === -1) continue;
    record[field.slice(0, colon).trim()] = field.slice(colon + 1).trim();
  }

  return record;
}

export function quote(value: string): string {
  return `"${value.replaceAll('"', '\\"')}"`;
}

export function unquote(value: string): string {
  const trimmed = value.trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1).replaceAll('\\"', '"');
  }
  return trimmed;
}

/**
 * Timestamps are stored whole, not as calendar days.
 *
 * Two overrulings can happen on the same day, and replaying them in the wrong
 * order would produce the wrong current law. Full ISO strings also sort
 * lexicographically, which is what `applySupersessions` relies on.
 */
export function isoDate(value: string | undefined): string {
  if (!value) return '1970-01-01T00:00:00.000Z';
  if (value.includes('T')) {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime())
      ? '1970-01-01T00:00:00.000Z'
      : parsed.toISOString();
  }
  return `${value}T00:00:00.000Z`;
}

/** `-` and the empty string mean "no link", not id zero. */
export function nullableId(value: string | undefined): number | null {
  if (value === undefined || value === '-' || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
