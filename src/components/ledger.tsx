'use client';

import { useCallback, useEffect, useState } from 'react';

import type { AppState } from '../lib/state.ts';
import { AuditorPanel } from './auditor-panel.tsx';
import { AutonomyPanel } from './autonomy-panel.tsx';
import { CharterPanel } from './charter-panel.tsx';
import { DecisionCard } from './decision-card.tsx';
import type { AnswerInput } from './decision-card.tsx';
import { MemoryDrawer } from './memory-drawer.tsx';
import { TatumBadge } from './tatum-badge.tsx';
import { Timeline } from './timeline.tsx';

export function Ledger() {
  const [state, setState] = useState<AppState | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const response = await fetch('/api/state', { cache: 'no-store' });
    if (!response.ok) throw new Error(await response.text());
    setState((await response.json()) as AppState);
  }, []);

  useEffect(() => {
    refresh().catch((err) => {
      setError(err instanceof Error ? err.message : String(err));
    });
  }, [refresh]);

  async function post(path: string, body?: unknown): Promise<void> {
    setBusy(path);
    setError(null);

    try {
      const response = await fetch(path, {
        method: 'POST',
        headers:
          body === undefined ? undefined : { 'content-type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
      });

      const payload = (await response.json().catch(() => ({}))) as AppState & {
        error?: string;
      };

      if (!response.ok) throw new Error(payload.error ?? response.statusText);
      setState(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  }

  async function runDemo() {
    const confirmed = window.confirm(
      'Run the scripted demo? This resets the local ledger and replays Day 1 → Day 12.',
    );
    if (!confirmed) return;
    await post('/api/demo');
  }

  async function forget() {
    const confirmed = window.confirm(
      'Delete every local memory? This is the delete test: the agent will have to ask about everything again.',
    );
    if (!confirmed) return;
    await post('/api/forget');
  }

  async function answer(input: AnswerInput) {
    await post('/api/answer', input);
  }

  async function supersede(
    oldId: number,
    action: 'buy' | 'switch_brand' | 'defer' | 'block',
    reason: string,
  ) {
    await post('/api/supersede', { oldId, action, reason });
  }

  if (!state) {
    return (
      <div className="shell">
        <div className="loading">LOADING LEDGER…</div>
        {error && <div className="error">{error}</div>}
      </div>
    );
  }

  const active = state.precedents.filter(
    (precedent) => precedent.active && precedent.supersededBy === null,
  ).length;
  const overruled = state.precedents.length - active;
  const working = busy !== null;

  return (
    <div className="shell">
      <header className="topbar">
        <div className="wordmark">PRECEDENT</div>
        <span className={`chip ${state.mode === 'mainnet' ? 'mainnet' : 'local'}`}>
          {state.mode === 'mainnet' ? 'MAINNET' : 'LOCAL DEMO'}
        </span>
        <span className="namespace">ns:{state.namespace}</span>
        <TatumBadge />

        <div className="topbar-actions">
          <button
            className="btn ghost"
            onClick={forget}
            disabled={working || state.mode !== 'local' || state.memories.length === 0}
          >
            Forget
          </button>
          <button className="btn primary" onClick={runDemo} disabled={working}>
            {busy === '/api/demo' ? 'Running…' : 'Run demo'}
          </button>
        </div>
      </header>

      {error && <div className="error">{error}</div>}

      <section className="hero">
        <div>
          <h1>
            Your agent&apos;s memory is <em>its case law</em>.
          </h1>
          <p>
            It asks once. It remembers why. When reality disagrees, it overrules
            itself — and shows you the record.
          </p>
        </div>
        <div className="hero-note">
          <b>The non-negotiable</b>
          Session one learns. Session two behaves differently. Delete the memories
          and autonomy falls to zero.
        </div>
      </section>

      <div className="grid">
        <main>
          <section className="panel">
            <div className="panel-head">
              <span className="panel-title">Decision queue</span>
              <span className="chip">{state.queue.length} candidates</span>
            </div>
            <div className="panel-body queue">
              {state.queue.map((item) => (
                <DecisionCard
                  key={item.candidate.id}
                  item={item}
                  busy={working}
                  onAnswer={answer}
                  onReturn={supersede}
                />
              ))}
            </div>
          </section>

          <section className="panel">
            <div className="panel-head">
              <span className="panel-title">Precedent timeline</span>
              <span className="chip mono">
                {active} active · {overruled} overruled
              </span>
            </div>
            <div className="panel-body tight">
              <Timeline precedents={state.precedents} mode={state.mode} />
            </div>
          </section>
        </main>

        <aside>
          <AutonomyPanel
            autonomy={state.autonomy}
            approvalRate={state.approvalRate}
          />

          <CharterPanel
            charter={state.charter}
            busy={working}
            onSave={(charter) => post('/api/charter', charter)}
          />

          <AuditorPanel
            findings={state.findings}
            precedents={state.precedents}
            decisions={state.decisions}
            busy={working}
            onSupersede={supersede}
          />

          <MemoryDrawer
            memories={state.memories}
            mode={state.mode}
            busy={working}
            onForget={forget}
          />
        </aside>
      </div>

      <footer className="footer">
        <span>
          <b>Precedent</b> · memory as case law
        </span>
        <span>
          {state.mode === 'mainnet'
            ? 'Walrus Memory mainnet'
            : 'Local demo store'}{' '}
          · Tatum verification next · x402 next
        </span>
      </footer>
    </div>
  );
}
