'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';

import type { AuditFinding } from '../core/audit.ts';
import type { Action, Precedent } from '../core/types.ts';
import type { DecisionEntry } from '../lib/decision-log.ts';

interface Props {
  findings: AuditFinding[];
  precedents: Precedent[];
  decisions: DecisionEntry[];
  busy: boolean;
  onSupersede: (oldId: number, action: Action, reason: string) => Promise<void>;
}

export function AuditorPanel({
  findings,
  precedents,
  decisions,
  busy,
  onSupersede,
}: Props) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<{ text: string; refusal: boolean } | null>(
    null,
  );

  function ask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = question.trim().toLowerCase();
    if (!query) return;

    if (/(balance|wallet|bank|finance)/.test(query)) {
      setAnswer({
        text: "I can't see the finance namespace. I can read precedents, observations and outcomes — not your balance.",
        refusal: true,
      });
      return;
    }

    const terms = query.split(/[^a-z0-9]+/).filter((term) => term.length > 2);
    const match = [...decisions]
      .reverse()
      .find((decision) =>
        terms.some((term) =>
          `${decision.candidate.item} ${decision.candidate.vendor}`
            .toLowerCase()
            .includes(term),
        ),
      );

    if (!match) {
      setAnswer({ text: 'No decision on record for that.', refusal: false });
      return;
    }

    const cited = match.cited
      .map((id) => precedents.find((precedent) => precedent.id === id))
      .filter((precedent): precedent is Precedent => precedent !== undefined);

    if (cited.length === 0) {
      setAnswer({
        text: `I asked, because no precedent covered ${match.candidate.item}.`,
        refusal: false,
      });
      return;
    }

    setAnswer({
      text: cited
        .map((precedent) => `#${precedent.id} — ${precedent.reason}`)
        .join(' '),
      refusal: false,
    });
  }

  return (
    <section className="panel">
      <div className="panel-head">
        <span className="panel-title">Auditor</span>
        <span className="chip ask">
          {findings.length} finding{findings.length === 1 ? '' : 's'}
        </span>
      </div>
      <div className="panel-body">
        {findings.length === 0 && (
          <div className="empty">No live contradictions in the active ledger.</div>
        )}

        {findings.map((finding) => {
          const a = precedents.find(
            (precedent) => precedent.id === finding.precedentIds[0],
          );
          const b = precedents.find(
            (precedent) => precedent.id === finding.precedentIds[1],
          );

          return (
            <div className="finding" key={finding.precedentIds.join('-')}>
              <div className="finding-title">Contradiction</div>
              <p>{finding.summary}</p>
              <div className="finding-actions">
                {a && b && (
                  <>
                    <button
                      className="btn"
                      disabled={busy}
                      onClick={() =>
                        onSupersede(
                          b.id,
                          a.action,
                          `Kept #${a.id}: ${a.reason}`,
                        )
                      }
                    >
                      Keep #{a.id} ({a.action})
                    </button>
                    <button
                      className="btn"
                      disabled={busy}
                      onClick={() =>
                        onSupersede(
                          a.id,
                          b.action,
                          `Kept #${b.id}: ${b.reason}`,
                        )
                      }
                    >
                      Keep #{b.id} ({b.action})
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}

        <div className="ask-box">
          <form onSubmit={ask}>
            <div className="field">
              <label htmlFor="auditor-question">Ask the Auditor</label>
              <input
                id="auditor-question"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="Why did you buy the beans?"
              />
            </div>
            <div className="form-actions">
              <button className="btn" disabled={!question.trim()}>
                Ask
              </button>
            </div>
          </form>

          {answer && (
            <div className={`answer-text ${answer.refusal ? 'muted' : ''}`}>
              {answer.text}
            </div>
          )}

          <div className="drawer-note">
            Read-only delegate. It sees precedents, observations and outcomes. It
            cannot see the finance namespace — that boundary is the demo.
          </div>
        </div>
      </div>
    </section>
  );
}
