/**
 * A file-backed MemoryStore for development and the offline demo.
 *
 * This is deliberately not a simulation of Walrus. It is the same interface,
 * backed by a JSON file, with naive keyword recall. It exists so the product
 * can run before the SDK's Node requirement is met and so the demo has a
 * deterministic fallback if the relayer is slow on camera.
 *
 * The UI labels this mode `LOCAL` everywhere. It must never be mistaken for
 * the mainnet submission.
 */

import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

import type { MemoryStore, RecalledMemory } from './store.ts';

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((term) => term.length > 2);
}

export class LocalStore implements MemoryStore {
  path: string;
  memories: string[] | null;
  queue: Promise<unknown>;
  counter: number;

  constructor(path: string) {
    this.path = path;
    this.memories = null;
    this.queue = Promise.resolve();
    this.counter = 0;
  }

  async load(): Promise<string[]> {
    if (this.memories) return this.memories;

    try {
      const raw = await readFile(this.path, 'utf8');
      const parsed = JSON.parse(raw) as unknown;
      this.memories = Array.isArray(parsed)
        ? parsed.filter((item): item is string => typeof item === 'string')
        : [];
    } catch {
      this.memories = [];
    }

    return this.memories;
  }

  async remember(text: string): Promise<{ jobId: string }> {
    return this.run(async () => {
      const memories = await this.load();
      memories.push(text);
      await this.persist(memories);
      this.counter += 1;
      return { jobId: `local-${this.counter}` };
    });
  }

  async waitForRemember(jobId: string): Promise<void> {
    if (!jobId.startsWith('local-')) {
      throw new Error(`Unknown write job: ${jobId}`);
    }
  }

  async recall(query: string, limit = 20): Promise<RecalledMemory[]> {
    const memories = await this.load();
    const terms = tokenize(query);

    return memories
      .map((text, index) => {
        const haystack = text.toLowerCase();
        const hits = terms.filter((term) => haystack.includes(term)).length;
        // Index is a recency tiebreaker, not a relevance signal.
        return { text, score: hits + index / 1_000_000 };
      })
      .filter((memory) => memory.score >= 1)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  async analyze(_text: string): Promise<RecalledMemory[]> {
    // No model on the local path. The repository falls back to storing the raw
    // observation rather than losing it.
    return [];
  }

  async list(): Promise<string[]> {
    return [...(await this.load())];
  }

  async health(): Promise<boolean> {
    return true;
  }

  async clear(): Promise<void> {
    await this.run(async () => {
      this.memories = [];
      await this.persist([]);
    });
  }

  async persist(memories: string[]): Promise<void> {
    await mkdir(dirname(this.path), { recursive: true });
    const temp = `${this.path}.tmp`;
    await writeFile(temp, `${JSON.stringify(memories, null, 2)}\n`, 'utf8');
    await rename(temp, this.path);
  }

  run<T>(task: () => Promise<T>): Promise<T> {
    const result = this.queue.then(task, task);
    this.queue = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }
}
