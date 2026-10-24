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
        <span className="panel-title">Charter</span>
        <span className="chip">hard limits</span>
      </div>
      <div className="panel-body">
        <form onSubmit={submit}>
          <div className="form-row">
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
              <label htmlFor="approval">Ask above ($)</label>
              <input
                id="approval"
                type="number"
                min="0"
                value={approval}
                onChange={(event) => setApproval(event.target.value)}
              />
            </div>
          </div>

          <div className="form-stack" style={{ marginTop: 10 }}>
            <div className="field">
              <label htmlFor="banned">Banned categories</label>
              <input
                id="banned"
                value={banned}
                onChange={(event) => setBanned(event.target.value)}
                placeholder="subscription, gambling"
              />
            </div>
            <div className="field">
              <label htmlFor="vendors">Allowed vendors (empty = any)</label>
              <input
                id="vendors"
                value={vendors}
                onChange={(event) => setVendors(event.target.value)}
                placeholder="Roaster A, Green Grocer"
              />
            </div>
          </div>

          <div className="form-actions">
            <button className="btn" disabled={busy}>
              Save charter
            </button>
          </div>
        </form>

        <div className="drawer-note">
          The charter is checked before any precedent. A banned category is blocked,
          never asked about, and cannot be learned around.
        </div>
      </div>
    </section>
  );
}

function split(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}
