'use client';

import type { AutonomyReport } from '../lib/decision-log.ts';

interface Props {
  autonomy: AutonomyReport;
  approvalRate: number | null;
}

export function AutonomyPanel({ autonomy, approvalRate }: Props) {
  return (
    <section className="panel autonomy-panel">
      <div className="panel-head">
        <h2 className="panel-title">Autonomy</h2>
        <span className="panel-note">
          {pct(autonomy.autonomy)} handled without asking
          {approvalRate !== null && ` · ${pct(approvalRate)} held up`}
        </span>
      </div>

      {autonomy.phases.length === 0 ? (
        <div className="empty" style={{ marginTop: 16 }}>
          No decisions yet.
        </div>
      ) : (
        <div className="autonomy-grid">
          {autonomy.phases.map((phase) => (
            <div className="phase" key={phase.phase}>
              <div className="phase-top">
                <span>{phase.phase}</span>
                <b>{pct(phase.autonomy)}</b>
              </div>
              <div className="bar">
                <span style={{ width: `${Math.round(phase.autonomy * 100)}%` }} />
              </div>
              <p>
                {phase.acted} handled · {phase.asked} asked · {phase.blocked} blocked
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function pct(value: number): string {
  return `${Math.round(value * 100)}%`;
}
