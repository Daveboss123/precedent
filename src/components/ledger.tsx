'use client';

import { useCallback, useEffect, useState } from 'react';

import type { NewItemInput } from '../lib/recurring.ts';
import type { AppState } from '../lib/state.ts';
import { AuditorPanel } from './auditor-panel.tsx';
import { AutonomyPanel } from './autonomy-panel.tsx';
import { CharterPanel } from './charter-panel.tsx';
import { DecisionCard } from './decision-card.tsx';
import type { AnswerInput } from './decision-card.tsx';
import { MemoryDrawer } from './memory-drawer.tsx';
import { Timeline } from './timeline.tsx';
import { Wordmark } from './wordmark.tsx';
import { YourList } from './your-list.tsx';

type View = 'today' | 'list' | 'memory' | 'auditor' | 'limits';
type QueueFilter = 'all' | 'ask' | 'act' | 'block';

const VIEWS: { id: View; label: string }[] = [
  { id: 'today', label: 'This week' },
  { id: 'list', label: 'Your list' },
  { id: 'memory', label: 'Rules' },
  { id: 'auditor', label: 'Audit' },
  { id: 'limits', label: 'Limits' },
];

export function Ledger() {
  const [state, setState] = useState<AppState | null>(null);
  const [view, setView] = useState<View>('today');
  const [queueFilter, setQueueFilter] = useState<QueueFilter>('all');
  const [busy, setBusy] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (force = false) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/state${force ? '?force=1' : ''}`, {
        cache: 'no-store',
      });
      if (!response.ok) throw new Error(await response.text());
      setState((await response.json()) as AppState);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    function readHash(): View {
      const hash = window.location.hash.replace('#', '');
      if (hash === 'charter') return 'limits';
      return VIEWS.some((item) => item.id === hash) ? (hash as View) : 'today';
    }

    setView(readHash());
    const onHash = () => setView(readHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  function go(next: View) {
    setView(next);
    window.history.replaceState(null, '', `#${next}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function reviewNeeds() {
    setQueueFilter('ask');
    document
      .getElementById('queue')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function post(path: string, body?: unknown): Promise<boolean> {
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
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return false;
    } finally {
      setBusy(null);
    }
  }

  async function removeItem(id: string): Promise<boolean> {
    setBusy('/api/items');
    setError(null);

    try {
      const response = await fetch(`/api/items?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const payload = (await response.json().catch(() => ({}))) as AppState & {
        error?: string;
      };
      if (!response.ok) throw new Error(payload.error ?? response.statusText);
      setState(payload);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return false;
    } finally {
      setBusy(null);
    }
  }

  async function runDemo() {
    const confirmed = window.confirm(
      'Replay the demo? This resets the local rules and keeps your list.',
    );
    if (!confirmed) return;
    const ok = await post('/api/demo');
    if (ok) go('today');
  }

  async function forget() {
    const confirmed = window.confirm(
      'Delete every rule? It will have to ask about everything again. Your list stays.',
    );
    if (!confirmed) return;
    const ok = await post('/api/forget');
    if (ok) go('today');
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

  async function addItems(items: NewItemInput[]): Promise<boolean> {
    return post('/api/items', { items });
  }

  async function setItemPhoto(id: string, image: string): Promise<boolean> {
    return post(`/api/items/${encodeURIComponent(id)}/image`, { image });
  }

  if (!state && loading) {
    return (
      <div className="loading">
        <div className="loading-lockup">
          <span className="loading-brand">
            <Wordmark />
          </span>
        </div>
        <span className="loading-bar" aria-hidden="true">
          <span />
        </span>
        <p className="loading-text">Loading your basket</p>
      </div>
    );
  }

  if (!state) {
    return (
      <div className="error-state">
        <div className="loading-brand">
          <Wordmark />
        </div>
        <h1>Couldn’t load your basket.</h1>
        <p>Try again in a moment.</p>
        <button className="btn btn--dark" onClick={() => void refresh(true)}>
          Try again
        </button>
        <a className="btn btn--ghost" href="/">
          Back to the home page
        </a>
      </div>
    );
  }

  const active = state.precedents.filter(
    (precedent) => precedent.active && precedent.supersededBy === null,
  ).length;
  const overruled = state.precedents.length - active;
  const working = busy !== null;
  const auto = state.queue.filter((item) => item.decision.action === 'act').length;
  const ask = state.queue.filter((item) => item.decision.action === 'ask').length;
  const blocked = state.queue.filter((item) => item.decision.action === 'block').length;
  const queueTotal = state.queue.length;
  const meterWidth = (count: number) =>
    queueTotal === 0 ? '0%' : `${(count / queueTotal) * 100}%`;
  const covered = state.items.filter((item) => item.decision.action === 'act').length;

  const filteredQueue = state.queue.filter((item) => {
    if (queueFilter === 'all') return true;
    return item.decision.action === queueFilter;
  });

  const latestSubstantive = [...state.autonomy.phases]
    .reverse()
    .find((phase) => phase.total >= 3);
  const day12 =
    state.autonomy.phases.find((phase) => phase.phase === 'Day 12') ??
    latestSubstantive;

  const counts: Record<View, string> = {
    today: String(state.queue.length),
    list: String(state.items.length),
    memory: String(state.precedents.length),
    auditor: String(state.findings.length),
    limits: '',
  };

  return (
    <div className="app">
      <aside className="rail">
        <a className="rail-brand" href="/" aria-label="Precedent home">
          <Wordmark />
        </a>

        <nav className="rail-nav" aria-label="Precedent sections">
          {VIEWS.map((item) => (
            <button
              key={item.id}
              className={`rail-link ${view === item.id ? 'is-active' : ''}`}
              onClick={() => go(item.id)}
              aria-current={view === item.id ? 'page' : undefined}
            >
              <span className="rail-link-label">{item.label}</span>
              {counts[item.id] && (
                <span className="rail-count">{counts[item.id]}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="rail-foot">
          <div className="rail-status">
            <span
              className={`status-dot ${
                state.mode === 'mainnet' ? 'status-dot--live' : 'status-dot--local'
              }`}
            />
            {state.mode === 'mainnet' ? 'Live' : 'Demo'}
          </div>
          <div className="rail-meta">
            {state.items.length} items · {active} rules
          </div>
          <a className="rail-home" href="/proof">
            Proof
          </a>
          <a className="rail-home" href="/">
            ← Home
          </a>
        </div>
      </aside>

      <main className="main">
        <div className="topline">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="crumb">Precedent / {labelFor(view)}</span>
            <span
              className={`stamp ${
                state.mode === 'mainnet' ? 'stamp--auto' : 'stamp--ask'
              }`}
            >
              {state.mode === 'mainnet' ? 'Live' : 'Demo'}
            </span>
          </div>

          <div className="topline-actions">
            {state.mode === 'local' && (
              <button
                className="btn btn--ghost btn--small"
                onClick={runDemo}
                disabled={working}
              >
                {busy === '/api/demo' ? 'Running…' : 'Replay story'}
              </button>
            )}
            <button
              className="btn btn--ghost btn--small"
              onClick={() => void refresh(true)}
              disabled={loading}
            >
              {loading ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
        </div>

        {error && (
          <div className="banner banner--error" role="alert">
            <span>{error}</span>
            <button className="btn btn--small" onClick={() => void refresh(true)}>
              Retry
            </button>
          </div>
        )}

        <div className="view" key={view}>
        {view === 'today' && (
          <>
            <header className="page-head">
              <p className="page-kicker">Basket</p>
              <h1 className="page-title">This week</h1>
              <p className="page-sub">
                {state.queue.length} items · {ask} {ask === 1 ? 'needs' : 'need'} you
              </p>
            </header>

            <section className="today-stats" aria-label="This week at a glance">
              <div className="today-stat">
                <b>{auto}</b>
                <span>Handled</span>
              </div>
              <button className="today-stat today-stat--action" onClick={reviewNeeds}>
                <b>{ask}</b>
                <span>Needs you</span>
                <small>Review →</small>
              </button>
              <div className="today-stat">
                <b>{blocked}</b>
                <span>Blocked</span>
              </div>
              <div className="today-stat">
                <b>{active}</b>
                <span>Rules</span>
              </div>
              <div
                className="today-meter"
                role="img"
                aria-label={`${auto} handled, ${ask} need you, ${blocked} blocked`}
              >
                <span
                  className="today-meter-seg today-meter-seg--auto"
                  style={{ width: meterWidth(auto) }}
                />
                <span
                  className="today-meter-seg today-meter-seg--ask"
                  style={{ width: meterWidth(ask) }}
                />
                <span
                  className="today-meter-seg today-meter-seg--block"
                  style={{ width: meterWidth(blocked) }}
                />
              </div>
            </section>

            <div className="queue-head" id="queue">
              <h2>Basket</h2>
              <span>{state.queue.length} items</span>
            </div>

            <div className="queue-filter" role="group" aria-label="Filter the basket">
              <FilterButton
                active={queueFilter === 'all'}
                onClick={() => setQueueFilter('all')}
                label="All"
                count={state.queue.length}
              />
              <FilterButton
                active={queueFilter === 'ask'}
                onClick={() => setQueueFilter('ask')}
                label="Needs you"
                count={ask}
              />
              <FilterButton
                active={queueFilter === 'act'}
                onClick={() => setQueueFilter('act')}
                label="Handled"
                count={auto}
              />
              <FilterButton
                active={queueFilter === 'block'}
                onClick={() => setQueueFilter('block')}
                label="Blocked"
                count={blocked}
              />
            </div>

            <div className="queue">
              {filteredQueue.length === 0 ? (
                <div className="empty">Nothing here.</div>
              ) : (
                filteredQueue.map((item) => (
                  <DecisionCard
                    key={item.candidate.id}
                    item={item}
                    busy={working}
                    approvalAbove={state.charter.approvalAbove}
                    onAnswer={answer}
                    onReturn={supersede}
                  />
                ))
              )}
            </div>

            <AutonomyPanel
              autonomy={state.autonomy}
              approvalRate={state.approvalRate}
            />

            <section className="panel list-cta-panel">
              <p>
                <b>{state.items.length} items on your list</b> · {covered} have a
                rule
              </p>
              <button className="btn btn--small" onClick={() => go('list')}>
                Edit list
              </button>
            </section>
          </>
        )}

        {view === 'list' && (
          <YourList
            items={state.items}
            busy={working}
            onAdd={addItems}
            onPhoto={setItemPhoto}
            onRemove={removeItem}
          />
        )}

        {view === 'memory' && (
          <>
            <header className="page-head">
              <p className="page-kicker">Rules</p>
              <h1 className="page-title">Rules</h1>
              <p className="page-sub">
                The rules it has learned, and the ones you corrected.
              </p>
            </header>

            <section className="today-stats" aria-label="Memory at a glance">
              <div className="today-stat">
                <b>{active}</b>
                <span>Rules in force</span>
              </div>
              <div className="today-stat">
                <b>{overruled}</b>
                <span>Corrected</span>
              </div>
              <div className="today-stat">
                <b>{state.supersessions.length}</b>
                <span>Corrections</span>
              </div>
              <div className="today-stat">
                <b>{state.memories.length}</b>
                <span>Records</span>
              </div>
            </section>

            <section className="panel" style={{ marginTop: 14 }}>
              <div className="panel-head">
                <h2 className="panel-title">The rules, in order</h2>
                <span className="panel-note">
                  {active} in force · {overruled} corrected
                </span>
              </div>
              <Timeline precedents={state.precedents} mode={state.mode} />
            </section>

            <MemoryDrawer memories={state.memories} mode={state.mode} />
          </>
        )}

        {view === 'auditor' && (
          <>
            <header className="page-head">
              <p className="page-kicker">Audit</p>
              <h1 className="page-title">Audit</h1>
              <p className="page-sub">
                Why it decided, and where two rules disagree.
              </p>
            </header>

            <AuditorPanel
              findings={state.findings}
              precedents={state.precedents}
              decisions={state.decisions}
              busy={working}
              onSupersede={supersede}
            />

            <section className="panel">
              <div className="panel-head">
                <h2 className="panel-title">What it decided</h2>
                <span className="panel-note">{state.decisions.length} entries</span>
              </div>

              {state.decisions.length === 0 ? (
                <div className="empty" style={{ marginTop: 14 }}>
                  No decisions yet. Run the story or answer something in this
                  week’s basket.
                </div>
              ) : (
                <div className="table-wrap">
                  <table className="log-table">
                    <thead>
                      <tr>
                        <th>When</th>
                        <th>Item</th>
                        <th>Action</th>
                        <th>Cause</th>
                        <th>Rule</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...state.decisions].reverse().map((entry) => (
                        <tr key={entry.id}>
                          <td className="log-phase">{entry.phase}</td>
                          <td>{entry.candidate.item}</td>
                          <td>
                            <span
                              className={`stamp ${
                                entry.action === 'act'
                                  ? 'stamp--auto'
                                  : entry.action === 'ask'
                                    ? 'stamp--ask'
                                    : 'stamp--block'
                              }`}
                            >
                              {entry.action === 'act'
                                ? 'Handled'
                                : entry.action === 'ask'
                                  ? 'Asked'
                                  : 'Blocked'}
                            </span>
                          </td>
                          <td>{plainCause(entry.cause)}</td>
                          <td className="log-cited">
                            {entry.cited.length > 0
                              ? entry.cited.map((id) => `#${id}`).join(', ')
                              : 'None'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}

        {view === 'limits' && (
          <>
            <header className="page-head">
              <p className="page-kicker">Limits</p>
              <h1 className="page-title">Limits</h1>
              <p className="page-sub">
                Budget, approvals, and hard no’s. Checked before any rule.
              </p>
            </header>

            <CharterPanel
              charter={state.charter}
              busy={working}
              onSave={(charter) => post('/api/charter', charter).then(() => undefined)}
            />

            <section className="panel">
              <div className="panel-head">
                <h2 className="panel-title">Storage & the delete test</h2>
                <span className="panel-note">
                  {state.mode === 'mainnet' ? 'append-only' : 'replayable'}
                </span>
              </div>

              <p className="panel-intro">
                The list is yours. The rules are append-only in Walrus Memory.
                Delete them and it goes back to asking.
              </p>

              <dl className="storage-list">
                <div>
                  <dt>Mode</dt>
                  <dd>{state.mode === 'mainnet' ? 'Walrus Memory mainnet' : 'Local demo store'}</dd>
                </div>
                <div>
                  <dt>Namespace</dt>
                  <dd className="lp-mono">{state.namespace}</dd>
                </div>
                <div>
                  <dt>Memories</dt>
                  <dd>{state.memories.length}</dd>
                </div>
                <div>
                  <dt>Account</dt>
                  <dd className="lp-mono">{short(state.accountId)}</dd>
                </div>
                <div>
                  <dt>Delegate</dt>
                  <dd className="lp-mono">{short(state.agentId)}</dd>
                </div>
              </dl>

              {state.mode === 'local' ? (
                <>
                  <p className="note">
                    Delete every rule and it goes back to asking. That is the
                    delete test.
                  </p>
                  <div className="form-actions" style={{ justifyContent: 'flex-start' }}>
                    <button
                      className="btn btn--danger"
                      onClick={forget}
                      disabled={working || state.memories.length === 0}
                    >
                      Delete every local rule
                    </button>
                  </div>
                </>
              ) : (
                <p className="note">
                  Mainnet rules are append-only. This view is read-only. The local
                  demo replays the delete test.
                </p>
              )}
            </section>
          </>
        )}
        </div>
      </main>
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      className={`queue-filter-btn ${active ? 'is-active' : ''}`}
      onClick={onClick}
      aria-pressed={active}
    >
      {label} <span>{count}</span>
    </button>
  );
}

function labelFor(view: View): string {
  return VIEWS.find((item) => item.id === view)?.label ?? 'This week';
}

function short(value: string | null | undefined): string {
  if (!value) return 'Not set';
  return value.length > 16 ? `${value.slice(0, 8)}…${value.slice(-6)}` : value;
}

function plainCause(cause: string): string {
  switch (cause) {
    case 'charter_banned':
      return 'blocked category';
    case 'charter_threshold':
      return 'above approval limit';
    case 'charter_vendor':
      return 'unapproved store';
    case 'precedent_match':
      return 'rule applied';
    case 'precedent_conflict':
      return 'rules disagreed';
    default:
      return 'no rule yet';
  }
}
