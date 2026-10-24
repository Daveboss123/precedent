'use client';

import { useCallback, useEffect, useState } from 'react';

import type { Verification } from '../tatum/verify.ts';

/**
 * The rail's truth about Tatum.
 *
 * It fetches once on mount, then only when clicked. `verified` links to the
 * explorer; `reachable` is a checkpoint, not a claim about a memory; and a
 * failure stays visible instead of disappearing.
 */
export function TatumBadge() {
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

  if (!verification) {
    return <span className="tatum tatum--pending">Checking Sui…</span>;
  }

  if (verification.status === 'verified' && verification.explorerUrl) {
    return (
      <a
        className="tatum tatum--verified"
        href={verification.explorerUrl}
        target="_blank"
        rel="noreferrer"
        title={verification.detail}
      >
        <span className="tatum-dot" />
        Sui verified · #{verification.checkpoint}
      </a>
    );
  }

  if (verification.status === 'reachable') {
    return (
      <button
        className="tatum tatum--verified"
        onClick={() => void check(true)}
        disabled={checking}
        title={verification.detail}
      >
        <span className="tatum-dot" />
        Sui mainnet · #{verification.checkpoint}
      </button>
    );
  }

  if (verification.status === 'failed') {
    return (
      <button
        className="tatum tatum--failed"
        onClick={() => void check(true)}
        disabled={checking}
        title={verification.detail}
      >
        <span className="tatum-dot" />
        Tatum check failed
      </button>
    );
  }

  return (
    <button
      className="tatum tatum--pending"
      onClick={() => void check(true)}
      disabled={checking}
      title={verification.detail}
    >
      <span className="tatum-dot" />
      Tatum not configured
    </button>
  );
}
