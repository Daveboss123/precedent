'use client';

import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';

import type { Charter } from '../core/types.ts';

interface Props {
  charter: Charter;
  busy: boolean;
  onSave: (charter: Charter) => Promise<void>;
}

export function CharterPanel({ charter, busy, onSave }: Props) {
  const [budget, setBudget] = useState(String(charter.budgetPerMonth));
  const [approval, setApproval] = useState(String(charter.approvalAbove));
  const [banned, setBanned] = useState(charter.bannedCategories.join(', '));
  const [vendors, setVendors] = useState(charter.allowedVendors.join(', '));

  useEffect(() => {
    setBudget(String(charter.budgetPerMonth));
    setApproval(String(charter.approvalAbove));
    setBanned(charter.bannedCategories.join(', '));
    setVendors(charter.allowedVendors.join(', '));
  }, [charter]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await onSave({
      budgetPerMonth: Number(budget) || 0,
      approvalAbove: Number(approval) || 0,
      bannedCategories: split(banned),
      allowedVendors: split(vendors),
    });
  }

  return (
    <section className="panel">
      <div className="panel-head">
        <h2 className="panel-title">Hard limits</h2>
        <span className="panel-note">checked first</span>
      </div>

      <p className="panel-intro">
        Limits win over preferences. They are checked before any rule.
      </p>

      <form onSubmit={submit} style={{ marginTop: 18 }}>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="budget">Monthly budget ($)</label>
            <input
              id="budget"
              type="number"
              min="0"
              value={budget}
              onChange={(event) => setBudget(event.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="approval">Ask me above ($)</label>
            <input
              id="approval"
              type="number"
              min="0"
              value={approval}
              onChange={(event) => setApproval(event.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="banned">Never buy these</label>
            <input
              id="banned"
              value={banned}
              onChange={(event) => setBanned(event.target.value)}
              placeholder="subscription, gambling"
            />
          </div>

          <div className="field">
            <label htmlFor="vendors">Only from these stores (empty = any)</label>
            <input
              id="vendors"
              value={vendors}
              onChange={(event) => setVendors(event.target.value)}
              placeholder="Roaster A, Green Grocer"
            />
          </div>
        </div>

        <div className="form-actions" style={{ justifyContent: 'flex-start' }}>
          <button className="btn btn--dark" disabled={busy}>
            Save my limits
          </button>
        </div>
      </form>

      <p className="note">
        Banned categories are never bought. Budget is checked against this
        month’s spend.
      </p>
    </section>
  );
}

function split(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}
