/**
 * The decision log.
 *
 * Deliberately *not* memory. Decisions are app state: they are recomputable,
 * they change on every page load, and they are not the thing the agent must
 * never forget. Precedents and outcomes are memory; this file is the audit
 * trail that feeds the autonomy chart.
 */

import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

import type { Candidate, Decision, ResolutionAction } from '../core/types.ts';

export interface DecisionEntry {
  id: string;
  at: string;
  /** "Day 1", "Day 12", "Interactive" — whatever the demo is labelling. */
  phase: string;
  candidate: Candidate;
  action: ResolutionAction;
  cause: Decision['cause'];
  cited: number[];
}

export interface PhaseReport {
  phase: string;
  total: number;
  acted: number;
  asked: number;
  blocked: number;
  /** acted / (acted + asked). Charter blocks are not autonomy decisions. */
  autonomy: number;
}

export interface AutonomyReport {
  total: number;
  acted: number;
  asked: number;
  blocked: number;
  autonomy: number;
  phases: PhaseReport[];
}

function summarise(entries: DecisionEntry[]): Omit<PhaseReport, 'phase'> {
  const acted = entries.filter((entry) => entry.action === 'act').length;
  const asked = entries.filter((entry) => entry.action === 'ask').length;
  const blocked = entries.filter((entry) => entry.action === 'block').length;
  const denominator = acted + asked;

  return {
    total: entries.length,
    acted,
    asked,
    blocked,
    autonomy: denominator === 0 ? 0 : acted / denominator,
  };
}

export class DecisionLog {
  path: string;
  queue: Promise<unknown>;

  constructor(path: string) {
    this.path = path;
    this.queue = Promise.resolve();
  }

  async all(): Promise<DecisionEntry[]> {
    try {
      const raw = await readFile(this.path, 'utf8');
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(
        (entry): entry is DecisionEntry =>
          Boolean(entry) &&
          typeof entry === 'object' &&
          typeof (entry as DecisionEntry).id === 'string',
      );
    } catch {
      return [];
    }
  }

  async append(entry: Omit<DecisionEntry, 'id' | 'at'>): Promise<DecisionEntry> {
    return this.run(async () => {
      const decisions = await this.all();
      const full: DecisionEntry = {
        id: crypto.randomUUID(),
        at: new Date().toISOString(),
        ...entry,
      };
      decisions.push(full);
      await this.persist(decisions);
      return full;
    });
  }

  async report(): Promise<AutonomyReport> {
    const decisions = await this.all();
    const overall = summarise(decisions);

    const groups = new Map<string, DecisionEntry[]>();
    for (const decision of decisions) {
      const group = groups.get(decision.phase) ?? [];
      group.push(decision);
      groups.set(decision.phase, group);
    }

    const phases = [...groups.entries()].map(([phase, entries]) => ({
      phase,
      ...summarise(entries),
    }));

    return { ...overall, phases };
  }

  async clear(): Promise<void> {
    await this.run(async () => {
      await this.persist([]);
    });
  }

  async persist(decisions: DecisionEntry[]): Promise<void> {
    await mkdir(dirname(this.path), { recursive: true });
    const temp = `${this.path}.tmp`;
    await writeFile(temp, `${JSON.stringify(decisions, null, 2)}\n`, 'utf8');
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
