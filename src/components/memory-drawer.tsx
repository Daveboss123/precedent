'use client';

import { useState } from 'react';

import type { StoreMode } from '../memory/create-store.ts';

interface Props {
  memories: string[];
  mode: StoreMode;
  busy: boolean;
  onForget: () => Promise<void>;
}

export function MemoryDrawer({ memories, mode, busy, onForget }: Props) {
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState(false);

  const filtered = query.trim()
    ? memories.filter((memory) => memory.toLowerCase().includes(query.toLowerCase()))
    : memories;
  const shown = expanded ? filtered : filtered.slice(0, 12);

  return (
    <section className="panel">
      <div className="panel-head">
        <span className="panel-title">Memory</span>
        <span className="chip mono">{memories.length} records</span>
      </div>
      <div className="panel-body">
        <div className="field">
          <label htmlFor="memory-search">Search the ledger</label>
          <input
            id="memory-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="beans, supersede, audit…"
          />
        </div>

        <div className="memory-list">
          {shown.map((memory, index) => {
            const separator = memory.indexOf(' | ');
            const kind = separator === -1 ? memory : memory.slice(0, separator);
            const rest = separator === -1 ? '' : memory.slice(separator);

            return (
              <div className="memory" key={`${index}-${memory.slice(0, 24)}`}>
                <span className="memory-kind">{kind}</span>
                {rest}
              </div>
            );
          })}
          {shown.length === 0 && <div className="empty">No memories match.</div>}
        </div>

        {filtered.length > 12 && (
          <div className="form-actions">
            <button className="btn ghost" onClick={() => setExpanded(!expanded)}>
              {expanded ? 'Show fewer' : `Show all ${filtered.length}`}
            </button>
          </div>
        )}

        {mode === 'local' ? (
          <>
            <div className="form-actions">
              <button
                className="btn danger"
                disabled={busy || memories.length === 0}
                onClick={onForget}
              >
                Forget everything
              </button>
            </div>
            <div className="drawer-note">
              This is the delete test, made literal. Delete the memories and every
              candidate falls back to <b>ask</b>; autonomy goes to 0.
            </div>
          </>
        ) : (
          <div className="drawer-note">
            Mainnet memories are append-only. This drawer is a best-effort sample,
            not a claim of completeness.
          </div>
        )}
      </div>
    </section>
  );
}
