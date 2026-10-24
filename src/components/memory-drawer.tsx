'use client';

import { useState } from 'react';

import type { StoreMode } from '../memory/create-store.ts';

interface Props {
  memories: string[];
  mode: StoreMode;
}

export function MemoryDrawer({ memories, mode }: Props) {
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState(false);

  const filtered = query.trim()
    ? memories.filter((memory) => memory.toLowerCase().includes(query.toLowerCase()))
    : memories;
  const shown = expanded ? filtered : filtered.slice(0, 14);

  return (
    <section className="panel">
      <div className="panel-head">
        <h2 className="panel-title">Everything it knows</h2>
        <span className="panel-note">{memories.length} records</span>
      </div>

      <p className="panel-intro">
        Every rule, correction, and outcome, in the order it was written.
      </p>

      <div className="field memory-search">
        <label htmlFor="memory-search">Search</label>
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
          const rest = separator === -1 ? '' : memory.slice(separator + 3);

          return (
            <div className="memory-row" key={`${index}-${memory.slice(0, 24)}`}>
              <span className="memory-kind">{kind}</span>
              <span className="memory-text">{rest || memory}</span>
            </div>
          );
        })}
        {shown.length === 0 && (
          <div className="empty" style={{ marginTop: 14 }}>
            No memories match.
          </div>
        )}
      </div>

      {filtered.length > 14 && (
        <div className="form-actions" style={{ justifyContent: 'flex-start' }}>
          <button
            className="btn btn--ghost btn--small"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? 'Show fewer' : `Show all ${filtered.length}`}
          </button>
        </div>
      )}

      <p className="note">
        {mode === 'mainnet'
          ? 'Append-only. Older entries stay on the record.'
          : 'A local copy. Reset it under Limits.'}
      </p>
    </section>
  );
}
