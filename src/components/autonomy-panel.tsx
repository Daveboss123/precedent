'use client';

import type { AutonomyReport } from '../lib/decision-log.ts';

interface Props {
  autonomy: AutonomyReport;
  approvalRate: number | null;
}

export function AutonomyPanel({ autonomy, approvalRate }: Props) {
  const unasked = autonomy.acted + autonomy.asked;

  // The headline is the latest phase with a meaningful sample. A single
  // post-reversal decision is real, but 1/1 = 100% is not a claim worth
  // leading with — the phase bars show it without overselling it.
  const substantive = [...autonomy.phases]
    .reverse()
    .find((phase) => phase.total >= 3);
  const headline =
    substantive ?? autonomy.phases[autonomy.phases.length - 1] ?? null;

  return (
    <section className="panel">
      <div className="panel-head">
        <span className="panel-title">Autonomy</span>
        <span className="chip mono">
          {autonomy.acted}/{unasked} overall
        </span>
      </div>
      <div className="panel-body">
        <div className="metrics">
          <div className="metric">
            <div className="metric-value gold">
              {pct(headline ? headline.autonomy : autonomy.autonomy)}
            </div>
            <div className="metric-label">
              {headline ? `autonomy · ${headline.phase}` : 'decisions taken without asking'}
            </div>
          </div>
          <div className="metric">
            <div className="metric-value">
              {approvalRate === null ? '—' : pct(approvalRate)}
            </div>
            <div className="metric-label">outcomes that held up</div>
          </div>
        </div>

        {autonomy.phases.map((phase) => (
          <div className="phase" key={phase.phase}>
            <div className="phase-head">
              <span>{phase.phase}</span>
              <b>{pct(phase.autonomy)}</b>
            </div>
            <div className="bar">
              <div
                className="bar-fill"
                style={{ width: `${Math.round(phase.autonomy * 100)}%` }}
              />
            </div>
            <div className="phase-note">
              {phase.acted} acted · {phase.asked} asked · {phase.blocked} blocked
            </div>
          </div>
        ))}

        {autonomy.phases.length === 0 && (
          <div className="empty">No decisions logged yet. Run the demo.</div>
        )}
      </div>
    </section>
  );
}

function pct(value: number): string {
  return `${Math.round(value * 100)}%`;
}
