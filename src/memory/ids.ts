/**
 * Precedent ids.
 *
 * Ids are the identity of a rule. Reusing one would silently rewrite history:
 * `#7` would mean two different things in two different memories. So the
 * allocator is monotonic and durable, and it also *observes* ids found in
 * memory — if the local counter file is lost, the next id still clears every
 * id already written.
 *
 * Walrus Memory has no notion of an id sequence, so this is deliberately a
 * client-side concern. The memory log is the source of truth; the counter is
 * just a cache in front of it.
 */

import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

export interface IdAllocator {
  /** Reserve the next id. Unique for the lifetime of the account. */
  next(): Promise<number>;
  /** Raise the watermark so an id already in memory is never reissued. */
  observe(id: number): Promise<void>;
}

interface IdState {
  next: number;
}

function normalise(value: unknown): IdState {
  const next = Number((value as Partial<IdState> | null)?.next);
  return { next: Number.isFinite(next) && next >= 1 ? Math.floor(next) : 1 };
}

/** Test double. Deterministic, no disk, no cleanup. */
export class InMemoryIdAllocator implements IdAllocator {
  state: IdState;

  constructor(start = 1) {
    this.state = { next: Math.max(1, Math.floor(start)) };
  }

  async next(): Promise<number> {
    const id = this.state.next;
    this.state.next = id + 1;
    return id;
  }

  async observe(id: number): Promise<void> {
    if (!Number.isFinite(id)) return;
    if (id >= this.state.next) this.state.next = Math.floor(id) + 1;
  }
}

/**
 * Durable allocator. Writes are serialised through a promise queue and land
 * via write-then-rename, so a crash cannot leave a half-written counter.
 *
 * This assumes one process owns the file. That is true for the demo and for a
 * single-user agent; a multi-writer deployment would move the sequence into
 * the memory layer itself.
 */
export class FileIdAllocator implements IdAllocator {
  path: string;
  state: IdState | null;
  queue: Promise<unknown>;

  constructor(path: string) {
    this.path = path;
    this.state = null;
    this.queue = Promise.resolve();
  }

  async load(): Promise<IdState> {
    if (this.state) return this.state;

    try {
      const raw = await readFile(this.path, 'utf8');
      this.state = normalise(JSON.parse(raw));
    } catch {
      // Missing or corrupt counter: start at 1. `observe()` will lift it past
      // anything already in memory before the first write.
      this.state = { next: 1 };
    }

    return this.state;
  }

  async next(): Promise<number> {
    return this.run(async () => {
      const state = await this.load();
      const id = state.next;
      state.next = id + 1;
      await this.persist(state);
      return id;
    });
  }

  async observe(id: number): Promise<void> {
    if (!Number.isFinite(id) || id < 1) return;

    await this.run(async () => {
      const state = await this.load();
      if (id >= state.next) {
        state.next = Math.floor(id) + 1;
        await this.persist(state);
      }
    });
  }

  async persist(state: IdState): Promise<void> {
    await mkdir(dirname(this.path), { recursive: true });
    const temp = `${this.path}.tmp`;
    await writeFile(temp, `${JSON.stringify(state)}\n`, 'utf8');
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
