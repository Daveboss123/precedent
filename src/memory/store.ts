/**
 * The memory boundary.
 *
 * Everything above this interface is pure and testable. Everything below it
 * touches the network. Keeping the seam this narrow is what lets the resolver
 * run in 0.4ms in tests and still be the same code that decides real spending.
 */

export interface RecalledMemory {
  text: string;
  score?: number;
}

export interface MemoryStore {
  /** Write a memory. Returns the job id; writes are asynchronous. */
  remember(text: string): Promise<{ jobId: string }>;
  /** Block until the write has landed. Never recall before this resolves. */
  waitForRemember(jobId: string): Promise<void>;
  /** Semantic search, scoped to this store's namespace. */
  recall(query: string, limit?: number): Promise<RecalledMemory[]>;
  /**
   * Extract structured facts from free text.
   * Returns [] when the backing client does not support extraction — callers
   * must then fall back to their own model layer rather than silently losing
   * the observation.
   */
  analyze(text: string): Promise<RecalledMemory[]>;
  /**
   * Total memories in this namespace, when the backend can count them.
   * Used to refuse a second scripted demo on an append-only ledger.
   */
  count?(): Promise<number>;
  /**
   * Best-effort raw dump for the trust drawer.
   * Optional: a remote store may not support exhaustive listing.
   */
  list?(): Promise<string[]>;
  /** Only resettable demo stores implement this. Mainnet is append-only. */
  clear?(): Promise<void>;
  health(): Promise<boolean>;
}
