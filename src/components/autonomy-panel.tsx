'use client';

import type { AutonomyReport, PhaseReport } from '../lib/decision-log.ts';

interface Props {
  autonomy: AutonomyReport;
  approvalRate: number | null;
}

export function AutonomyPanel({ autonomy, approvalRate }: Props) {
  const phases = autonomy.phases;
  const first = phases[0];
  const last = phases[phases.length - 1];
  const delta =
    phases.length > 1 ? last.autonomy - first.autonomy : null;

  return (
    <section className="panel autonomy-panel" aria-labelledby="autonomy-title">
      <div className="panel-head">
        <h2 className="panel-title" id="autonomy-title">
          Autonomy
        </h2>
        <span className="panel-note">
          {approvalRate !== null
            ? `${pct(approvalRate)} of answers held up`
            : 'No outcomes recorded yet'}
        </span>
      </div>

      {phases.length === 0 ? (
        <div className="empty" style={{ marginTop: 16 }}>
          No decisions yet.
        </div>
      ) : (
        <div className="autonomy-body">
          <div className="autonomy-summary">
            <b>{pct(autonomy.autonomy)}</b>
            <span>handled without asking</span>
            {delta !== null && (
              <small className={delta >= 0 ? 'is-up' : 'is-down'}>
                {delta >= 0 ? '+' : '−'}
                {Math.abs(Math.round(delta * 100))} pts since {first.phase}
              </small>
            )}
          </div>

          <div className="autonomy-chart">
            <div className="autonomy-scale" aria-hidden="true">
              <span>0</span>
              <span>25</span>
              <span>50</span>
              <span>75</span>
              <span>100%</span>
            </div>

            {phases.map((phase) => (
              <PhaseRow key={phase.phase} phase={phase} />
            ))}

            <div className="autonomy-legend">
              <span>
                <i className="autonomy-swatch autonomy-swatch--acted" />
                Handled
              </span>
              <span>
                <i className="autonomy-swatch autonomy-swatch--asked" />
                Asked
              </span>
              <span>
                <i className="autonomy-swatch autonomy-swatch--blocked" />
                Blocked
              </span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function PhaseRow({ phase }: { phase: PhaseReport }) {
  const share = (count: number) =>
    phase.total === 0 ? 0 : (count / phase.total) * 100;

  const label = `${phase.phase}: ${phase.acted} handled, ${phase.asked} asked, ${phase.blocked} blocked. ${pct(phase.autonomy)} of decisions handled without asking.`;

  return (
    <div className="autonomy-row">
      <div className="autonomy-row-top">
        <span>{phase.phase}</span>
        <small>
          {phase.total} {phase.total === 1 ? 'decision' : 'decisions'}
        </small>
        <b>{pct(phase.autonomy)}</b>
      </div>

      <div className="autonomy-bar" role="img" aria-label={label}>
        <span
          className="autonomy-seg autonomy-seg--acted"
          style={{ width: `${share(phase.acted)}%` }}
        />
        <span
          className="autonomy-seg autonomy-seg--asked"
          style={{ width: `${share(phase.asked)}%` }}
        />
        <span
          className="autonomy-seg autonomy-seg--blocked"
          style={{ width: `${share(phase.blocked)}%` }}
        />
      </div>

      <p className="autonomy-row-foot">
        {phase.acted} handled · {phase.asked} asked · {phase.blocked} blocked
      </p>
    </div>
  );
}

function pct(value: number): string {
  return `${Math.round(value * 100)}%`;
}
