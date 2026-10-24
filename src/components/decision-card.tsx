'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';

import type { QueueItem } from '../lib/state.ts';

export type AnswerAction = 'buy' | 'switch_brand' | 'defer';

export interface AnswerInput {
  candidateId: string;
  action: AnswerAction;
  reason: string;
  scope: string;
  increase?: number;
}

interface Props {
  item: QueueItem;
  busy: boolean;
  onAnswer: (input: AnswerInput) => Promise<void>;
  onReturn: (oldId: number, action: AnswerAction, reason: string) => Promise<void>;
}

export function DecisionCard({ item, busy, onAnswer, onReturn }: Props) {
  const { candidate, decision } = item;

  const status =
    decision.action === 'act' ? 'auto' : decision.action === 'ask' ? 'ask' : 'block';
  const label = status === 'auto' ? 'AUTO' : status === 'ask' ? 'ASK' : 'BLOCK';

  const defaultScope = candidate.item.split(/\s+/).slice(-1)[0] ?? candidate.category;
  const [action, setAction] = useState<AnswerAction>('buy');
  const [reason, setReason] = useState('');
  const [scope, setScope] = useState(defaultScope);
  const [increase, setIncrease] = useState('');
  const [returnAction, setReturnAction] = useState<AnswerAction>('buy');
  const [returnReason, setReturnReason] = useState('');

  async function submitAnswer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const trimmed = reason.trim();
    if (!trimmed) return;

    const percent = increase.trim() === '' ? undefined : Number(increase);
    await onAnswer({
      candidateId: candidate.id,
      action,
      reason: trimmed,
      scope,
      increase:
        percent !== undefined && Number.isFinite(percent) && percent > 0
          ? percent
          : undefined,
    });

    setReason('');
    form.closest('details')?.removeAttribute('open');
  }

  async function submitReturn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const trimmed = returnReason.trim();
    if (!trimmed || decision.cited.length === 0) return;

    await onReturn(decision.cited[0], returnAction, trimmed);
    setReturnReason('');
    form.closest('details')?.removeAttribute('open');
  }

  return (
    <article className={`card ${status}`}>
      <div className="card-top">
        <div>
          <div className="card-title">{candidate.item}</div>
          <div className="card-meta">
            {candidate.vendor} · {candidate.domain} · {candidate.category}
            {candidate.priceIncrease !== undefined &&
              ` · up ${Math.round(candidate.priceIncrease * 100)}%`}
          </div>
        </div>
        <div className="card-price">${candidate.price.toFixed(2)}</div>
      </div>

      <div className="card-foot">
        <span className={`chip ${status}`}>{label}</span>
        <span className="chip mono">conf {decision.confidence.toFixed(2)}</span>
        {decision.cited.map((id) => (
          <span className="chip gold mono" key={id}>
            #{id}
          </span>
        ))}
        {decision.needsAudit && <span className="chip ask">auditor flagged</span>}
      </div>

      <p className="card-explain">{decision.explanation}</p>

      {status === 'ask' && (
        <details className="answer">
          <summary>Answer once — it becomes a precedent</summary>
          <form onSubmit={submitAnswer}>
            <div className="form-row">
              <div className="field">
                <label htmlFor={`action-${candidate.id}`}>Action</label>
                <select
                  id={`action-${candidate.id}`}
                  value={action}
                  onChange={(event) => setAction(event.target.value as AnswerAction)}
                >
                  <option value="buy">buy</option>
                  <option value="switch_brand">switch brand</option>
                  <option value="defer">defer</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor={`increase-${candidate.id}`}>Only above rise (%)</label>
                <input
                  id={`increase-${candidate.id}`}
                  type="number"
                  min="0"
                  max="500"
                  placeholder="always"
                  value={increase}
                  onChange={(event) => setIncrease(event.target.value)}
                />
              </div>
            </div>

            <div className="form-stack" style={{ marginTop: 10 }}>
              <div className="field">
                <label htmlFor={`scope-${candidate.id}`}>Scope</label>
                <input
                  id={`scope-${candidate.id}`}
                  value={scope}
                  onChange={(event) => setScope(event.target.value)}
                  placeholder="beans, filters…"
                />
              </div>
              <div className="field">
                <label htmlFor={`reason-${candidate.id}`}>Why</label>
                <textarea
                  id={`reason-${candidate.id}`}
                  rows={2}
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="Say it in your own words. The agent preserves them."
                ></textarea>
              </div>
            </div>

            <div className="form-actions">
              <button className="btn primary" disabled={busy || !reason.trim()}>
                Record precedent
              </button>
            </div>
          </form>
        </details>
      )}

      {status === 'auto' && decision.cited.length > 0 && (
        <details className="answer">
          <summary>It was wrong</summary>
          <form onSubmit={submitReturn}>
            <div className="form-row">
              <div className="field">
                <label htmlFor={`return-action-${candidate.id}`}>Correct action</label>
                <select
                  id={`return-action-${candidate.id}`}
                  value={returnAction}
                  onChange={(event) =>
                    setReturnAction(event.target.value as AnswerAction)
                  }
                >
                  <option value="buy">buy</option>
                  <option value="switch_brand">switch brand</option>
                  <option value="defer">defer</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor={`return-${candidate.id}`}>What happened?</label>
                <textarea
                  id={`return-${candidate.id}`}
                  rows={2}
                  value={returnReason}
                  onChange={(event) => setReturnReason(event.target.value)}
                  placeholder="The cheaper beans were too acidic."
                ></textarea>
              </div>
            </div>
            <div className="form-actions">
              <button
                className="btn danger"
                disabled={busy || !returnReason.trim()}
              >
                Overrule #{decision.cited[0]}
              </button>
            </div>
          </form>
        </details>
      )}
    </article>
  );
}
