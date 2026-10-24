'use client';

import Image from 'next/image';
import { useState } from 'react';
import type { FormEvent } from 'react';

import type { QueueItem } from '../lib/state.ts';
import { MonitorArt, StreamingArt } from './illustrations.tsx';

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
  approvalAbove: number;
  onAnswer: (input: AnswerInput) => Promise<void>;
  onReturn: (oldId: number, action: AnswerAction, reason: string) => Promise<void>;
}

export function DecisionCard({
  item,
  busy,
  approvalAbove,
  onAnswer,
  onReturn,
}: Props) {
  const { candidate, decision } = item;

  const status =
    decision.action === 'act' ? 'auto' : decision.action === 'ask' ? 'ask' : 'block';
  const label =
    status === 'auto' ? 'Handled' : status === 'ask' ? 'Needs you' : 'Blocked';

  const defaultScope = candidate.item.split(/\s+/).slice(-1)[0] ?? candidate.category;
  const [intent, setIntent] = useState<AnswerAction>('buy');
  const [reason, setReason] = useState('');
  const [scope, setScope] = useState(defaultScope);
  const [increase, setIncrease] = useState('');
  const [returnAction, setReturnAction] = useState<AnswerAction>('buy');
  const [returnReason, setReturnReason] = useState('');

  const headline =
    decision.action === 'act'
      ? 'Bought with your rule.'
      : decision.action === 'block'
        ? 'Blocked by your limits.'
        : decision.cause === 'no_precedent'
          ? 'No rule yet — what should it do?'
          : decision.cause === 'precedent_conflict'
            ? 'Two rules disagree — which one wins?'
            : decision.cause === 'charter_threshold'
              ? `Above your ${money(approvalAbove)} limit — buy it?`
              : 'Confirm before it buys.';

  const cited =
    decision.cited.length > 0
      ? decision.cited.map((id) => `#${id}`).join(' ')
      : null;

  async function submitAnswer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const trimmed = reason.trim();
    if (!trimmed) return;

    const percent = increase.trim() === '' ? undefined : Number(increase);
    await onAnswer({
      candidateId: candidate.id,
      action: intent,
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
    <article className={`decision decision--${status}`}>
      <div className="decision-photo">
        {item.image ? (
          <Image src={item.image} alt="" fill sizes="120px" />
        ) : candidate.category === 'subscription' ? (
          <StreamingArt />
        ) : (
          <MonitorArt />
        )}
      </div>

      <div className="decision-main">
        <div className="decision-top">
          <div>
            <h3 className="decision-item">{candidate.item}</h3>
            <p className="decision-meta">
              {candidate.vendor}
              {candidate.price > 0 ? ` · ${money(candidate.price)}` : ' · price needed'}
              {candidate.priceIncrease !== undefined &&
                ` · up ${Math.round(candidate.priceIncrease * 100)}%`}
            </p>
          </div>
          <div className="decision-right">
            <span className={`stamp stamp--${status}`}>{label}</span>
          </div>
        </div>

        <p className="decision-line">{headline}</p>

        {item.rule && (
          <blockquote className="decision-rule">
            {cited && <span className="decision-rule-cite">{cited}</span>}
            <span>“{item.rule}”</span>
          </blockquote>
        )}

        {status === 'ask' && (
          <details className="detail detail--answer">
            <summary>
              Answer <span aria-hidden="true">+</span>
            </summary>
            <form className="detail-body" onSubmit={submitAnswer}>
              <div className="answer-choice" role="group" aria-label="What should it do?">
                <Choice
                  active={intent === 'buy'}
                  onClick={() => setIntent('buy')}
                  label="Buy it"
                />
                <Choice
                  active={intent === 'switch_brand'}
                  onClick={() => setIntent('switch_brand')}
                  label="Switch brand"
                />
                <Choice
                  active={intent === 'defer'}
                  onClick={() => setIntent('defer')}
                  label="Skip"
                />
              </div>

              <div className="field answer-reason">
                <label htmlFor={`reason-${candidate.id}`}>Why? One sentence.</label>
                <textarea
                  id={`reason-${candidate.id}`}
                  rows={2}
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="The good one when guests are coming."
                ></textarea>
              </div>

              <details className="answer-more">
                <summary>Advanced</summary>
                <div className="form-grid">
                  <div className="field">
                    <label htmlFor={`scope-${candidate.id}`}>This rule is about</label>
                    <input
                      id={`scope-${candidate.id}`}
                      value={scope}
                      onChange={(event) => setScope(event.target.value)}
                      placeholder="oat milk, beans, filters…"
                    />
                  </div>

                  <div className="field">
                    <label htmlFor={`increase-${candidate.id}`}>
                      Only above (% price rise)
                    </label>
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
              </details>

              <div className="form-actions">
                <button className="btn btn--dark" disabled={busy || !reason.trim()}>
                  Save rule
                </button>
              </div>
            </form>
          </details>
        )}

        {status === 'auto' && decision.cited.length > 0 && (
          <details className="detail detail--quiet">
            <summary>
              Wrong? Fix it <span aria-hidden="true">+</span>
            </summary>
            <form className="detail-body" onSubmit={submitReturn}>
              <div className="form-grid">
                <div className="field">
                  <label htmlFor={`return-action-${candidate.id}`}>
                    What should it have done?
                  </label>
                  <select
                    id={`return-action-${candidate.id}`}
                    value={returnAction}
                    onChange={(event) =>
                      setReturnAction(event.target.value as AnswerAction)
                    }
                  >
                    <option value="buy">Buy it</option>
                    <option value="switch_brand">Switch brand</option>
                    <option value="defer">Skip</option>
                  </select>
                </div>

                <div className="field field--full">
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
                  className="btn btn--danger"
                  disabled={busy || !returnReason.trim()}
                >
                  Save correction
                </button>
              </div>
            </form>
          </details>
        )}

        {status === 'block' && (
          <a className="decision-limit-link" href="#limits">
            See limits →
          </a>
        )}
      </div>
    </article>
  );
}

function Choice({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      className={`answer-choice-btn ${active ? 'is-selected' : ''}`}
      onClick={onClick}
      aria-pressed={active}
    >
      {label}
    </button>
  );
}

function money(value: number): string {
  return `$${value.toFixed(2)}`;
}
