/**
 * The things a household buys again and again.
 *
 * This is app state, not memory: the list is what the user is tracking, while
 * the rules about that list live in Walrus Memory. Keeping the two separate is
 * what lets someone edit their shopping list without rewriting case law.
 */

import type { Candidate, Decision, Domain } from '../core/types.ts';

export type Cadence =
  | 'weekly'
  | 'every 2 weeks'
  | 'monthly'
  | 'every other month'
  | 'as needed';

export const CADENCES: Cadence[] = [
  'weekly',
  'every 2 weeks',
  'monthly',
  'every other month',
  'as needed',
];

export interface RecurringItem {
  id: string;
  name: string;
  vendor: string;
  price: number;
  category: string;
  domain: Domain;
  cadence: Cadence;
  image: string | null;
  createdAt: string;
}

export interface ListItem extends RecurringItem {
  /** What the agent would do with this item right now. */
  decision: Decision;
  /** The user's own words behind that decision, when a rule covers it. */
  rule: string | null;
}

export interface NewItemInput {
  name: string;
  vendor?: string;
  price?: number;
  category?: string;
  domain?: Domain;
  cadence?: Cadence;
  image?: string | null;
}

const DOMAINS: Domain[] = ['coffee', 'household', 'gear', 'pantry'];

const IMAGE_BY_NAME: Array<[RegExp, string]> = [
  [/bean|coffee|roast/i, '/products/coffee-bag.jpg'],
  [/oat|milk|cream/i, '/products/oat-milk.jpg'],
  [/filter/i, '/products/filters-real.jpg'],
  [/pod|capsule|espresso/i, '/products/espresso-pods.jpg'],
  [/tablet|clean|detergent/i, '/products/tablets-2.jpg'],
  [/olive|oil/i, '/products/olive-oil.jpg'],
  [/soap|dish/i, '/products/dish-soap.jpg'],
  [/towel|paper/i, '/products/paper-towels.jpg'],
  [/pasta|fusilli|spaghetti/i, '/products/pasta.jpg'],
];

const CATEGORY_IMAGE: Record<string, string> = {
  beans: '/products/coffee-bag.jpg',
  coffee: '/products/coffee-bag.jpg',
  pods: '/products/espresso-pods.jpg',
  filters: '/products/filters-real.jpg',
  dairy: '/products/oat-milk.jpg',
  pantry: '/products/pasta.jpg',
  supplies: '/products/tablets-2.jpg',
  household: '/products/dish-soap.jpg',
};

export function isDomain(value: unknown): value is Domain {
  return typeof value === 'string' && DOMAINS.includes(value as Domain);
}

export function isCadence(value: unknown): value is Cadence {
  return typeof value === 'string' && CADENCES.includes(value as Cadence);
}

export function inferDomain(name: string, category = ''): Domain {
  const text = `${name} ${category}`.toLowerCase();
  if (/(bean|coffee|espresso|pod|filter|roast)/.test(text)) return 'coffee';
  if (/(monitor|display|cable|keyboard|gear|headphone)/.test(text)) return 'gear';
  if (/(soap|detergent|clean|tablet|towel|paper|trash|subscription|stream)/.test(text)) {
    return 'household';
  }
  return 'pantry';
}

export function inferCategory(name: string): string {
  const text = name.toLowerCase();
  if (/bean|roast/.test(text)) return 'beans';
  if (/pod|capsule|espresso/.test(text)) return 'pods';
  if (/filter/.test(text)) return 'filters';
  if (/oat|milk|cream/.test(text)) return 'dairy';
  if (/soap|detergent|clean|tablet|towel|paper/.test(text)) return 'supplies';
  if (/monitor|display|cable|keyboard|headphone/.test(text)) return 'gear';
  if (/subscription|stream/.test(text)) return 'subscription';
  return 'pantry';
}

export function imageFor(
  name: string,
  category = '',
  domain: Domain = 'pantry',
): string | null {
  if (domain === 'gear' || category === 'subscription') return null;

  for (const [pattern, image] of IMAGE_BY_NAME) {
    if (pattern.test(`${name} ${category}`)) return image;
  }

  return CATEGORY_IMAGE[category] ?? CATEGORY_IMAGE[domain] ?? null;
}

/** Only photos we ship, or a photo uploaded through the item API. */
export function isStoredImage(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  if (/^\/products\/[a-z0-9][a-z0-9._-]*\.(?:jpe?g|png|webp)$/i.test(value)) {
    return true;
  }
  return /^\/api\/items\/[a-zA-Z0-9-]+\/image(?:\?v=\d+)?$/.test(value);
}

export function normaliseItem(input: unknown): RecurringItem | null {
  if (!input || typeof input !== 'object') return null;
  const record = input as Record<string, unknown>;

  const name = String(record.name ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80);
  if (!name) return null;

  const category = String(record.category ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 40);
  const domain = isDomain(record.domain)
    ? record.domain
    : inferDomain(name, category);
  const inferredCategory = category || inferCategory(name);

  const rawPrice = Number(record.price);
  const price =
    Number.isFinite(rawPrice) && rawPrice >= 0
      ? Math.round(rawPrice * 100) / 100
      : 0;

  const vendor =
    String(record.vendor ?? '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 80) || 'Your usual store';

  const cadence = isCadence(record.cadence) ? record.cadence : 'monthly';
  const image = isStoredImage(record.image) ? record.image : null;

  return {
    id:
      typeof record.id === 'string' && record.id.trim()
        ? record.id.trim()
        : crypto.randomUUID(),
    name,
    vendor,
    price,
    category: inferredCategory,
    domain,
    cadence,
    image,
    createdAt:
      typeof record.createdAt === 'string'
        ? record.createdAt
        : new Date().toISOString(),
  };
}

export function itemToCandidate(item: RecurringItem): Candidate {
  return {
    id: `item-${item.id}`,
    domain: item.domain,
    item: item.name,
    vendor: item.vendor,
    category: item.category,
    price: item.price,
    recurring: true,
  };
}

export function sameItemName(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

/**
 * Parse a pasted or uploaded list.
 *
 * One item per line. Commas, semicolons or tabs separate fields. Only the name
 * is required; a number is read as the price, a cadence phrase is read as the
 * cadence, and the remaining fields become vendor then category.
 */
export function parseItemLines(text: string): NewItemInput[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 50)
    .map((line) => {
      const parts = line
        .split(/\t|,|;/)
        .map((part) => part.trim())
        .filter(Boolean);

      const name = parts[0] ?? '';
      let price = 0;
      let cadence: Cadence = 'monthly';
      let vendor = '';
      let category = '';

      for (const part of parts.slice(1)) {
        if (/^\$?\d+(?:\.\d{1,2})?$/.test(part)) {
          price = Number(part.replace('$', ''));
          continue;
        }

        const cadenceMatch = CADENCES.find(
          (option) => option.toLowerCase() === part.toLowerCase(),
        );
        if (cadenceMatch) {
          cadence = cadenceMatch;
          continue;
        }

        if (!vendor) {
          vendor = part;
        } else if (!category) {
          category = part;
        }
      }

      return {
        name,
        vendor,
        price,
        category,
        cadence,
        domain: inferDomain(name, category),
      };
    })
    .filter((item) => item.name.length > 0);
}

export function seedItems(): RecurringItem[] {
  const at = '2026-10-01T09:00:00.000Z';

  const make = (
    id: string,
    name: string,
    vendor: string,
    price: number,
    category: string,
    domain: Domain,
    cadence: Cadence,
    image: string | null,
  ): RecurringItem => ({
    id,
    name,
    vendor,
    price,
    category,
    domain,
    cadence,
    image,
    createdAt: at,
  });

  return [
    make(
      'seed-beans',
      'House blend beans',
      'Roaster A',
      18,
      'beans',
      'coffee',
      'weekly',
      '/products/coffee-bag.jpg',
    ),
    make(
      'seed-oat-milk',
      'Oat milk',
      'Green Grocer',
      6,
      'dairy',
      'pantry',
      'weekly',
      '/products/oat-milk.jpg',
    ),
    make(
      'seed-filters',
      'Paper filters',
      'Green Grocer',
      9,
      'filters',
      'coffee',
      'monthly',
      '/products/filters-real.jpg',
    ),
    make(
      'seed-pods',
      'Espresso pods',
      'Roaster B',
      16,
      'pods',
      'coffee',
      'monthly',
      '/products/espresso-pods.jpg',
    ),
    make(
      'seed-cleaning',
      'Grinder cleaning tablets',
      'Vendor X',
      12,
      'supplies',
      'household',
      'every other month',
      '/products/tablets-2.jpg',
    ),
    make(
      'seed-streaming',
      'Streaming plan',
      'Vendor Y',
      12,
      'subscription',
      'household',
      'monthly',
      null,
    ),
  ];
}
