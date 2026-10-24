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
        <h2 className="panel-title">Rules that disagree</h2>
        <span className="panel-note">
          {findings.length} found
        </span>
      </div>

      {findings.length === 0 ? (
        <div className="empty" style={{ marginTop: 16 }}>
          No rules disagree right now.
        </div>
      ) : (
        findings.map((finding) => {
          const a = precedents.find(
            (precedent) => precedent.id === finding.precedentIds[0],
          );
          const b = precedents.find(
            (precedent) => precedent.id === finding.precedentIds[1],
          );

          return (
            <article className="finding" key={finding.precedentIds.join('-')}>
              <div className="finding-head">
                <span className="stamp stamp--ask">Rules disagree</span>
                <span className="finding-ids">
                  #{finding.precedentIds.join(' vs #')}
                </span>
              </div>

              <p>{finding.summary}</p>

              {a && b && (
                <div className="finding-quotes">
                  <div className="finding-quote">
                    <b>#{a.id}</b>
                    {a.reason}
                  </div>
                  <div className="finding-quote">
                    <b>#{b.id}</b>
                    {b.reason}
                  </div>
                </div>
              )}

              <div className="finding-actions">
                {a && b && (
                  <>
                    <button
                      className="btn btn--ghost btn--small"
                      disabled={busy}
                      onClick={() =>
                        onSupersede(b.id, a.action, `Kept #${a.id}: ${a.reason}`)
                      }
                    >
                      Keep #{a.id}
                    </button>
                    <button
                      className="btn btn--ghost btn--small"
                      disabled={busy}
                      onClick={() =>
                        onSupersede(a.id, b.action, `Kept #${b.id}: ${b.reason}`)
                      }
                    >
                      Keep #{b.id}
                    </button>
                  </>
                )}
              </div>
            </article>
          );
        })
      )}

      <form className="ask-form" onSubmit={ask}>
        <div className="field">
          <label htmlFor="auditor-question">Ask why</label>
          <input
            id="auditor-question"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Why did you buy the beans?"
          />
        </div>
        <div className="form-actions" style={{ justifyContent: 'flex-start' }}>
          <button className="btn btn--dark" disabled={!question.trim()}>
            Ask
          </button>
        </div>
      </form>

      {answer && (
        <div
          className={`ask-answer ${answer.refusal ? 'ask-answer--refusal' : ''}`}
        >
          {answer.text}
        </div>
      )}

      <p className="note">
        Read-only. It can see rules and outcomes, not your money.
      </p>
    </section>
  );
}
