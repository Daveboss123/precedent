/**
 * The repository over Walrus Memory.
 *
 * This is where the append-only store becomes a working ledger:
 *
 *   - recall raw memories and parse them back into typed records
 *   - replay SUPERSEDES records to get the *current* set of precedents
 *   - allocate ids that never collide with history
 *   - write outcomes and audit findings as first-class memories
 *
 * Everything here is dependency-injected. `MemoryStore` is the only network
 * boundary, so the whole repository runs against a fake in tests.
 */

import type {
  Action,
  Candidate,
  Charter,
  Condition,
  Decision,
  Domain,
  Outcome,
  PolicyConfig,
  Precedent,
} from '../core/types.ts';
import { DEFAULT_POLICY, resolve } from '../core/resolve.ts';
import { parsePrecedent, serializePrecedent } from '../core/memory-format.ts';
import {
  applySupersessions,
  parseSupersession,
  serializeSupersession,
} from '../core/supersession.ts';
import type { SupersessionRecord } from '../core/supersession.ts';
import {
  findContradictions,
  parseFinding,
  serializeFinding,
} from '../core/audit.ts';
import type { AuditFinding } from '../core/audit.ts';
import { parseOutcome, serializeOutcome } from '../core/outcome.ts';
import type { IdAllocator } from './ids.ts';
import type { MemoryStore, RecalledMemory } from './store.ts';

export interface PrecedentRepoConfig {
  store: MemoryStore;
  ids: IdAllocator;
  now?: () => Date;
  policy?: PolicyConfig;
  /** How many memories to pull per record type. 200 covers the demo ledger. */
  recallLimit?: number;
}

export interface NewPrecedentInput {
  domain: Domain;
  action: Action;
  trigger: string;
  /** Structured gate extracted from the trigger. Null means "always". */
  when?: Condition | null;
  reason: string;
  scope: string[];
  confidence?: number;
}

/**
 * A supersession inherits everything it does not explicitly change. The demo
 * call is therefore one line: `supersede(7, { action: 'defer', reason: ... })`.
 */
export interface SupersedeChange {
  action: Action;
  reason: string;
  trigger?: string;
  /** Pass null to clear an inherited condition; omit to inherit it. */
  when?: Condition | null;
  scope?: string[];
  confidence?: number;
}

export interface LedgerSnapshot {
  /** Precedents with the supersession log already applied. */
  precedents: Precedent[];
  supersessions: SupersessionRecord[];
}

export class PrecedentRepo {
  store: MemoryStore;
  ids: IdAllocator;
  now: () => Date;
  policy: PolicyConfig;
  recallLimit: number;

  constructor(config: PrecedentRepoConfig) {
    this.store = config.store;
    this.ids = config.ids;
    this.now = config.now ?? (() => new Date());
    this.policy = config.policy ?? DEFAULT_POLICY;
    this.recallLimit = config.recallLimit ?? 200;
  }

  /**
   * Read the whole ledger and rebuild current state.
   *
   * Recall is semantic, not exhaustive — a production build would page until
   * it had every record. At demo scale one high-limit recall per record type
   * is enough, and the parser rejects anything unrelated that comes back.
   */
  async snapshot(): Promise<LedgerSnapshot> {
    const [precedentMemories, supersessionMemories] = await Promise.all([
      this.store.recall('PRECEDENT decision rule', this.recallLimit),
      this.store.recall('SUPERSEDES overruled precedent', this.recallLimit),
    ]);

    const byId = new Map<number, Precedent>();
    for (const memory of precedentMemories) {
      const precedent = parsePrecedent(memory.text);
      if (precedent) byId.set(precedent.id, precedent);
    }

    const seen = new Set<string>();
    const supersessions: SupersessionRecord[] = [];
    for (const memory of supersessionMemories) {
      const record = parseSupersession(memory.text);
      if (!record) continue;

      const key = `${record.oldId}->${record.newId}`;
      if (seen.has(key)) continue;
      seen.add(key);
      supersessions.push(record);
    }

    const precedents = [...byId.values()];
    if (precedents.length > 0) {
      // History is the source of truth. Never issue an id that already exists.
      await this.ids.observe(Math.max(...precedents.map((precedent) => precedent.id)));
    }

    return {
      precedents: applySupersessions(precedents, supersessions),
      supersessions,
    };
  }

  /** Precedents that may bind a new decision. Superseded ones are filtered out. */
  async activePrecedents(): Promise<Precedent[]> {
    const { precedents } = await this.snapshot();
    return precedents.filter(
      (precedent) => precedent.active && precedent.supersededBy === null,
    );
  }

  /** The decision the agent would make right now, given what it remembers. */
  async resolveCandidate(candidate: Candidate, charter: Charter): Promise<Decision> {
    const precedents = await this.activePrecedents();
    return resolve(candidate, charter, precedents, this.now(), this.policy);
  }

  async create(
    input: NewPrecedentInput,
    supersedes: number | null = null,
  ): Promise<Precedent> {
    const id = await this.ids.next();
    const precedent: Precedent = {
      id,
      kind: 'precedent',
      domain: input.domain,
      action: input.action,
      trigger: input.trigger,
      when: input.when ?? null,
      reason: input.reason,
      scope: [...input.scope],
      confidence: clamp(input.confidence ?? 0.8),
      createdAt: this.now().toISOString(),
      active: true,
      supersededBy: null,
      supersedes,
    };

    await this.write(serializePrecedent(precedent));
    return precedent;
  }

  /**
   * Overrule a precedent with a new one, and record the relationship.
   *
   * Two writes, in this order: the replacement first, then the SUPERSEDES
   * record. If the second write failed the ledger would briefly show both as
   * active — never the reverse, where a rule is deleted and nothing replaces
   * it.
   */
  async supersede(
    oldId: number,
    change: SupersedeChange,
  ): Promise<{ precedent: Precedent; record: SupersessionRecord }> {
    const active = await this.activePrecedents();
    const old = active.find((precedent) => precedent.id === oldId);
    if (!old) {
      throw new Error(`Cannot supersede #${oldId}: no active precedent with that id.`);
    }

    const precedent = await this.create(
      {
        domain: old.domain,
        action: change.action,
        trigger: change.trigger ?? old.trigger,
        when: change.when !== undefined ? change.when : old.when,
        reason: change.reason,
        scope: change.scope ?? old.scope,
        confidence: change.confidence ?? old.confidence,
      },
      oldId,
    );

    const record: SupersessionRecord = {
      oldId,
      newId: precedent.id,
      reason: change.reason,
      createdAt: this.now().toISOString(),
    };

    await this.write(serializeSupersession(record));
    return { precedent, record };
  }

  async recordOutcome(outcome: Outcome): Promise<void> {
    await this.write(serializeOutcome(outcome, this.now().toISOString()));
  }

  /** What actually happened, newest last. Feeds the approval rate. */
  async outcomes(): Promise<Outcome[]> {
    const memories = await this.store.recall(
      'OUTCOME accepted returned',
      this.recallLimit,
    );

    return memories
      .map((memory) => parseOutcome(memory.text))
      .filter((outcome): outcome is Outcome => outcome !== null);
  }

  /**
   * Turn free text into durable observations.
   *
   * `analyze` is the intended extractor, but it is not guaranteed to exist on
   * the SDK. When it returns nothing, the raw text is still written — losing
   * the user's words because extraction was unavailable would be worse than
   * storing an unpolished observation.
   */
  async observe(text: string): Promise<RecalledMemory[]> {
    const extracted = await this.store.analyze(text);
    const observations = extracted.length > 0 ? extracted : [{ text }];

    for (const observation of observations) {
      await this.write(`OBSERVATION | ${observation.text}`);
    }

    return observations;
  }

  /** Every audit finding ever written, including ones already resolved. */
  async storedFindings(): Promise<AuditFinding[]> {
    const memories = await this.store.recall(
      'AUDIT contradiction finding',
      this.recallLimit,
    );

    const seen = new Set<string>();
    const findings: AuditFinding[] = [];

    for (const memory of memories) {
      const finding = parseFinding(memory.text);
      if (!finding) continue;

      const key = findingKey(finding);
      if (seen.has(key)) continue;
      seen.add(key);
      findings.push(finding);
    }

    return findings;
  }

  /** Findings that still describe live contradictions. This is what the UI shows. */
  async findings(): Promise<AuditFinding[]> {
    const [stored, active] = await Promise.all([
      this.storedFindings(),
      this.activePrecedents(),
    ]);

    const activeIds = new Set(active.map((precedent) => precedent.id));
    return stored.filter((finding) =>
      finding.precedentIds.every((id) => activeIds.has(id)),
    );
  }

  /**
   * Scan the active ledger and write any *new* contradiction as a memory.
   *
   * Idempotent: the Auditor runs after every precedent write, so re-writing
   * the same finding on every pass would turn memory into noise.
   */
  async audit(): Promise<AuditFinding[]> {
    const active = await this.activePrecedents();
    const found = findContradictions(active);
    if (found.length === 0) return [];

    const known = new Set((await this.storedFindings()).map(findingKey));
    const fresh = found.filter((finding) => !known.has(findingKey(finding)));

    for (const finding of fresh) {
      await this.write(serializeFinding(finding, this.now().toISOString()));
    }

    return fresh;
  }

  async write(text: string): Promise<void> {
    const { jobId } = await this.store.remember(text);
    // Recall before the job lands returns stale state, which is the single
    // easiest way to make a memory demo lie.
    await this.store.waitForRemember(jobId);
  }
}

function clamp(value: number): number {
  if (!Number.isFinite(value)) return 0.5;
  return Math.min(1, Math.max(0, value));
}

function findingKey(finding: AuditFinding): string {
  const ids = [...finding.precedentIds].sort((a, b) => a - b).join(',');
  return `${ids}:${finding.kind}`;
}
