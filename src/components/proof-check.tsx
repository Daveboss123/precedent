'use client';

import { useCallback, useEffect, useState } from 'react';

import type { Verification } from '../tatum/verify.ts';

export function ProofCheck() {
  const [verification, setVerification] = useState<Verification | null>(null);
  const [checking, setChecking] = useState(false);

  const check = useCallback(async (force = false) => {
    setChecking(true);
    try {
      const response = await fetch(`/api/verify${force ? '?force=1' : ''}`, {
        cache: 'no-store',
      });
      if (!response.ok) throw new Error(await response.text());
      setVerification((await response.json()) as Verification);
    } catch {
      setVerification({
        status: 'failed',
        network: 'sui-mainnet',
        endpoint: '',
        checkedAt: new Date().toISOString(),
        latencyMs: 0,
        checkpoint: null,
        digest: null,
        objectId: null,
        explorerUrl: null,
        detail: 'Could not reach the verification endpoint.',
      });
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    void check();
  }, [check]);

  const status = verification?.status ?? 'pending';
  const label =
    status === 'verified'
      ? 'Verified'
      : status === 'reachable'
        ? 'Reachable'
        : status === 'failed'
          ? 'Check failed'
          : 'Checking';

  return (
    <section className={`proof-check proof-check--${status}`}>
      <div className="proof-check-head">
        <span className="proof-check-dot" aria-hidden="true" />
        <b>{label}</b>
        <button
          className="btn btn--small"
          onClick={() => void check(true)}
          disabled={checking}
        >
          {checking ? 'Checking…' : 'Check again'}
        </button>
      </div>

      <dl className="proof-check-grid">
        <div>
          <dt>Checkpoint</dt>
          <dd>
            {verification?.checkpoint ? `#${verification.checkpoint}` : '—'}
          </dd>
        </div>
        <div>
          <dt>Latency</dt>
          <dd>{verification?.latencyMs ? `${verification.latencyMs} ms` : '—'}</dd>
        </div>
        <div>
          <dt>Gateway</dt>
          <dd>{verification?.endpoint || 'Tatum Sui GraphQL'}</dd>
        </div>
        <div>
          <dt>Detail</dt>
          <dd>{verification?.detail || 'Waiting for the first check.'}</dd>
        </div>
      </dl>
    </section>
  );
}
