/**
 * Walrus Memory adapter.
 *
 * Deliberate choices:
 *
 * 1. The SDK is imported dynamically, through a variable specifier. It is an
 *    optional dependency: the core must build and test on a machine that has
 *    never run `npm install`. If the package is missing, this throws a message
 *    that says so instead of a module-resolution stack trace.
 *
 * 2. Result shapes are normalised defensively. The SDK is in beta and the
 *    relayer is a separate service; a demo that crashes because a field was
 *    renamed is not a demo.
 *
 * 3. One client per namespace. Recall is scoped by account + namespace, so
 *    namespaces are the unit of isolation, not a filter applied afterwards.
 */

import type { MemoryStore, RecalledMemory } from './store.ts';

export interface MemWalConfig {
  key: string;
  accountId: string;
  /** Defaults to the mainnet relayer. Never point this at staging by accident. */
  serverUrl?: string;
  namespace: string;
}

const MAINNET_RELAYER = 'https://relayer.memory.walrus.xyz';

interface RawClient {
  remember(text: string): Promise<unknown>;
  waitForRememberJob?(jobId: string): Promise<unknown>;
  recall(args: { query: string; limit?: number }): Promise<unknown>;
  analyze?(text: string): Promise<unknown>;
  health?(): Promise<unknown>;
}

function asArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if (Array.isArray(record.results)) return record.results;
    if (Array.isArray(record.memories)) return record.memories;
    if (Array.isArray(record.data)) return record.data;
  }
  return [];
}

function toMemory(value: unknown): RecalledMemory | null {
  if (typeof value === 'string') return { text: value };
  if (!value || typeof value !== 'object') return null;

  const record = value as Record<string, unknown>;
  const text =
    (typeof record.text === 'string' && record.text) ||
    (typeof record.memory === 'string' && record.memory) ||
    (typeof record.content === 'string' && record.content) ||
    (typeof record.value === 'string' && record.value);

  if (!text) return null;

  const score = typeof record.score === 'number' ? record.score : undefined;
  return { text, score };
}

function jobIdOf(value: unknown): string {
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if (typeof record.job_id === 'string') return record.job_id;
    if (typeof record.jobId === 'string') return record.jobId;
    if (typeof record.id === 'string') return record.id;
  }
  if (typeof value === 'string') return value;
  throw new Error('Walrus Memory returned a write job without an id.');
}

export class MemWalStore implements MemoryStore {
  config: MemWalConfig;
  clientPromise: Promise<RawClient> | null;

  constructor(config: MemWalConfig) {
    if (!config.key) throw new Error('MEMWAL_KEY is missing.');
    if (!config.accountId) throw new Error('MEMWAL_ACCOUNT_ID is missing.');
    if (!config.namespace) throw new Error('A namespace is required.');
    if (config.serverUrl?.includes('staging')) {
      throw new Error(
        'Refusing to write to the staging relayer. The hackathon requires mainnet.',
      );
    }

    this.config = config;
    this.clientPromise = null;
  }

  async connect(): Promise<RawClient> {
    if (this.clientPromise) return this.clientPromise;

    this.clientPromise = (async () => {
      // Variable specifier: keeps this an optional dependency at build time.
      const specifier = '@mysten-incubation/memwal';
      let module: Record<string, unknown>;

      try {
        module = (await import(specifier)) as Record<string, unknown>;
      } catch {
        throw new Error(
          `Walrus Memory SDK not installed. Run: npm install ${specifier}`,
        );
      }

      const factory = module.MemWal as
        | { create?: (config: Record<string, unknown>) => RawClient }
        | undefined;

      if (!factory?.create) {
        throw new Error('Walrus Memory SDK does not expose MemWal.create().');
      }

      return factory.create({
        key: this.config.key,
        accountId: this.config.accountId,
        serverUrl: this.config.serverUrl ?? MAINNET_RELAYER,
        namespace: this.config.namespace,
      });
    })();

    return this.clientPromise;
  }

  async remember(text: string): Promise<{ jobId: string }> {
    const client = await this.connect();
    const job = await client.remember(text);
    return { jobId: jobIdOf(job) };
  }

  async waitForRemember(jobId: string): Promise<void> {
    const client = await this.connect();
    if (!client.waitForRememberJob) return;
    await client.waitForRememberJob(jobId);
  }

  async recall(query: string, limit = 20): Promise<RecalledMemory[]> {
    const client = await this.connect();
    const response = await client.recall({ query, limit });
    return asArray(response)
      .map(toMemory)
      .filter((memory): memory is RecalledMemory => memory !== null);
  }

  async analyze(text: string): Promise<RecalledMemory[]> {
    const client = await this.connect();
    if (!client.analyze) return [];

    const response = await client.analyze(text);
    return asArray(response)
      .map(toMemory)
      .filter((memory): memory is RecalledMemory => memory !== null);
  }

  /**
   * Best-effort raw dump for the trust drawer.
   *
   * The relayer has no "list everything" call, so this is a broad recall. The
   * drawer labels it as a sample when the result fills the limit — never claim
   * completeness the store cannot prove.
   */
  async list(): Promise<string[]> {
    const memories = await this.recall(
      'PRECEDENT SUPERSEDES AUDIT OUTCOME OBSERVATION',
      200,
    );
    return memories.map((memory) => memory.text);
  }

  async health(): Promise<boolean> {
    const client = await this.connect();
    if (!client.health) return true;

    try {
      await client.health();
      return true;
    } catch {
      return false;
    }
  }
}
