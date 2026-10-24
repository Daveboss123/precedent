'use client';

import { useCallback, useEffect, useState } from 'react';

import type { Verification } from '../tatum/verify.ts';

/**
 * The top-bar truth about Tatum.
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
    return <span className="chip local">checking Sui…</span>;
  }

  if (verification.status === 'verified' && verification.explorerUrl) {
    return (
      <a
        className="chip mainnet"
        href={verification.explorerUrl}
        target="_blank"
        rel="noreferrer"
        title={verification.detail}
      >
        Sui verified · #{verification.checkpoint}
      </a>
    );
  }

  if (verification.status === 'reachable') {
    return (
      <button
        className="chip mainnet"
        onClick={() => void check(true)}
        disabled={checking}
        title={verification.detail}
      >
        Sui mainnet · #{verification.checkpoint}
      </button>
    );
  }

  if (verification.status === 'failed') {
    return (
      <button
        className="chip block"
        onClick={() => void check(true)}
        disabled={checking}
        title={verification.detail}
      >
        Tatum check failed
      </button>
    );
  }

  return (
    <button
      className="chip local"
      onClick={() => void check(true)}
      disabled={checking}
      title={verification.detail}
    >
      Tatum not configured
    </button>
  );
}
