/**
 * A MemoryStore that behaves like the real one in the ways that matter:
 * writes are append-only, recall is relevance-ranked, and nothing is ever
 * updated or deleted.
 *
 * The scoring is deliberately naive. It is enough to prove that the repository
 * filters by record type rather than trusting recall to be precise — which is
 * exactly how the real relayer behaves.
 */

import type { MemoryStore, RecalledMemory } from '../src/memory/store.ts';

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((term) => term.length > 2);
}

export class FakeStore implements MemoryStore {
  memories: string[];
  writes: string[];
  analyzeResult: RecalledMemory[];
  jobs: string[];

  constructor(seed: string[] = []) {
    this.memories = [...seed];
    this.writes = [];
    this.analyzeResult = [];
    this.jobs = [];
  }

  async remember(text: string): Promise<{ jobId: string }> {
    this.memories.push(text);
    this.writes.push(text);
    const jobId = `job-${this.writes.length}`;
    this.jobs.push(jobId);
    return { jobId };
  }

  async waitForRemember(jobId: string): Promise<void> {
    if (!this.jobs.includes(jobId)) {
      throw new Error(`Unknown write job: ${jobId}`);
    }
  }

  async recall(query: string, limit = 20): Promise<RecalledMemory[]> {
    const terms = tokenize(query);

    return this.memories
      .map((text) => {
        const haystack = text.toLowerCase();
        const hits = terms.filter((term) => haystack.includes(term)).length;
        return { text, score: hits };
      })
      .filter((memory) => memory.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  async analyze(_text: string): Promise<RecalledMemory[]> {
    return this.analyzeResult;
  }

  async health(): Promise<boolean> {
    return true;
  }
}
