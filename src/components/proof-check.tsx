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
        : status === 'unconfigured'
          ? 'Unconfigured'
          : status === 'failed'
            ? 'Check failed'
            : 'Checking';

  const summary =
    status === 'verified'
      ? 'The MemWal account is active and the configured delegate is registered.'
      : status === 'reachable'
        ? 'Tatum answered, but no MemWal account is pinned to this deployment.'
        : status === 'unconfigured'
          ? 'No Tatum key is configured for this deployment.'
          : status === 'failed'
            ? 'The check did not pass. The detail below says why.'
            : 'Asking Tatum’s Sui GraphQL gateway.';

  return (
    <section
      className={`pf-check pf-check--${status}`}
      aria-labelledby="pf-check-label"
    >
      <div className="pf-check-top">
        <p className="pf-check-kicker">
          Live attestation
          <span aria-hidden="true">·</span>
          Tatum Sui GraphQL
        </p>
        <button
          className="pf-check-btn"
          onClick={() => void check(true)}
          disabled={checking}
        >
          {checking ? 'Checking…' : 'Check again'}
          <RefreshIcon />
        </button>
      </div>

      <div className="pf-check-body">
        <div className="pf-check-status">
          <span className="pf-check-dot" aria-hidden="true" />
          <div>
            <b id="pf-check-label">{label}</b>
            <p>{summary}</p>
          </div>
        </div>

        <dl className="pf-check-grid">
          <div>
            <dt>Checkpoint</dt>
            <dd>{verification?.checkpoint ? `#${verification.checkpoint}` : 'Not yet'}</dd>
          </div>
          <div>
            <dt>Latency</dt>
            <dd>{verification?.latencyMs ? `${verification.latencyMs} ms` : 'Not yet'}</dd>
          </div>
          <div>
            <dt>Checked</dt>
            <dd>{verification ? formatTime(verification.checkedAt) : 'Not yet'}</dd>
          </div>
          <div>
            <dt>Gateway</dt>
            <dd
              className="pf-check-endpoint"
              title={verification?.endpoint || undefined}
            >
              {displayEndpoint(verification?.endpoint)}
            </dd>
          </div>
          <div className="pf-check-detail">
            <dt>Detail</dt>
            <dd>{verification?.detail || 'Waiting for the first check.'}</dd>
          </div>
        </dl>
      </div>

      <div className="pf-check-foot">
        <span className="pf-check-time" aria-live="polite">
          {verification
            ? `Checked ${formatTime(verification.checkedAt)} UTC against Sui mainnet`
            : 'Waiting for Tatum'}
        </span>
        {verification?.explorerUrl && (
          <a
            className="pf-check-explorer"
            href={verification.explorerUrl}
            target="_blank"
            rel="noreferrer"
          >
            View on SuiVision <span aria-hidden="true">↗</span>
          </a>
        )}
        <span className="pf-check-caveat">
          A pass confirms the account and delegate, not the truth of every memory.
        </span>
      </div>
    </section>
  );
}

function displayEndpoint(endpoint: string | undefined): string {
  if (!endpoint) return 'Not yet';
  return endpoint.replace(/^https?:\/\//, '').replace(/\/$/, '');
}

function formatTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not yet';
  return date.toLocaleTimeString('en-GB', {
    timeZone: 'UTC',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function RefreshIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      width="12"
      height="12"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M13 8a5 5 0 1 1-1.7-3.8M13 2.6V5h-2.4"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
