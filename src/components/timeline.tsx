'use client';

import type { Condition, Precedent } from '../core/types.ts';
import type { StoreMode } from '../memory/create-store.ts';

interface Props {
  precedents: Precedent[];
  mode: StoreMode;
}

export function Timeline({ precedents, mode }: Props) {
  if (precedents.length === 0) {
    return (
      <div className="empty" style={{ marginTop: 16 }}>
        No precedents yet. Every answer the agent receives becomes one.
      </div>
    );
  }

  const byId = new Map(precedents.map((precedent) => [precedent.id, precedent]));
  const roots = precedents
    .filter((precedent) => precedent.supersedes === null)
    .sort((a, b) => a.id - b.id);

  return (
    <div className="timeline">
      <div className="timeline-legend">
        <span>
          <i className="legend-dot" /> active
        </span>
        <span>
          <i className="legend-dot legend-dot--overruled" /> overruled
        </span>
        <span>append-only — nothing is deleted</span>
      </div>

      {roots.map((root) => {
        const chain: Precedent[] = [root];
        const seen = new Set([root.id]);
        let current = root;

        while (current.supersededBy !== null) {
          const next = byId.get(current.supersededBy);
          if (!next || seen.has(next.id)) break;
          chain.push(next);
          seen.add(next.id);
          current = next;
        }

        return (
          <div className="chain" key={root.id}>
            {chain.map((precedent) => (
              <Node key={precedent.id} precedent={precedent} mode={mode} />
            ))}
          </div>
        );
      })}
    </div>
  );
}

function Node({ precedent, mode }: { precedent: Precedent; mode: StoreMode }) {
  const actionClass =
    precedent.action === 'buy'
      ? 'auto'
      : precedent.action === 'defer'
        ? 'ask'
        : precedent.action === 'block'
          ? 'block'
          : 'ask';

  return (
    <article className={`node ${precedent.active ? '' : 'is-overruled'}`}>
      <div className="node-head">
        <span className="node-id">#{precedent.id}</span>
        <span className={`stamp stamp--${actionClass}`}>{precedent.action}</span>
        <span className="node-scope">{precedent.scope.join(' · ')}</span>
        <span className="node-date">{precedent.createdAt.slice(0, 10)}</span>
      </div>

      <p className="node-reason">{precedent.reason}</p>

      {precedent.when && (
        <div className="node-when">when {describeCondition(precedent.when)}</div>
      )}

      <div className="node-foot">
        <span>{mode === 'mainnet' ? 'Walrus mainnet' : 'Local memory'}</span>
        {precedent.supersedes !== null && (
          <span>supersedes #{precedent.supersedes}</span>
        )}
        {precedent.supersededBy !== null && (
          <span className="node-overruled">
            superseded by #{precedent.supersededBy}
          </span>
        )}
      </div>
    </article>
  );
}

export function describeCondition(condition: Condition): string {
  const parts: string[] = [];

  if (condition.priceIncreaseAtLeast !== undefined) {
    parts.push(`price up ≥ ${Math.round(condition.priceIncreaseAtLeast * 100)}%`);
  }
  if (condition.priceAtMost !== undefined) {
    parts.push(`price ≤ $${condition.priceAtMost}`);
  }
  if (condition.vendorIs !== undefined) {
    parts.push(`vendor ${condition.vendorIs}`);
  }
  if (condition.recurring !== undefined) {
    parts.push(condition.recurring ? 'recurring' : 'one-off');
  }

  return parts.join(' · ');
}
