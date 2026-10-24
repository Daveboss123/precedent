/**
 * The onchain badge, made honest.
 *
 * There are four possible truths, and the UI must show which one it is:
 *   verified     — a specific transaction or object exists on Sui mainnet
 *   reachable    — Tatum answered, but no memory write is pinned yet
 *   unconfigured — no Tatum key
 *   failed       — the gateway rejected us, timed out, or the write is missing
 *
 * A badge that silently hides a failure is worse than no badge.
 */

import {
  DEFAULT_TATUM_SUI_URL,
  TatumClient,
  TatumRpcError,
} from './client.ts';

export type VerificationStatus =
  | 'verified'
  | 'reachable'
  | 'unconfigured'
  | 'failed';

export interface Verification {
  status: VerificationStatus;
  network: 'sui-mainnet';
  endpoint: string;
  checkedAt: string;
  latencyMs: number;
  checkpoint: number | null;
  digest: string | null;
  objectId: string | null;
  explorerUrl: string | null;
  detail: string;
}

export interface VerifyInput {
  client: TatumClient | null;
  digest?: string | null;
  objectId?: string | null;
  /** MemWalAccount object ID. Stronger than a generic object check. */
  accountId?: string | null;
  /** Delegate public key the submission form calls MEMWAL_AGENT_ID. */
  agentPublicKey?: string | null;
}

export async function verifyMemoryWrite(
  input: VerifyInput,
): Promise<Verification> {
  const started = Date.now();
  const base = {
    network: 'sui-mainnet' as const,
    endpoint: input.client?.url ?? DEFAULT_TATUM_SUI_URL,
    checkedAt: new Date().toISOString(),
    digest: input.digest ?? null,
    objectId: input.objectId ?? null,
  };

  if (!input.client) {
    return {
      ...base,
      status: 'unconfigured',
      latencyMs: 0,
      checkpoint: null,
      explorerUrl: null,
      detail: 'Set TATUM_API_KEY to verify memory writes on Sui mainnet.',
    };
  }

  try {
    const checkpoint = await input.client.latestCheckpoint();

    if (input.digest) {
      const transaction = await input.client.getTransactionBlock(input.digest);
      const effect = transaction.effects?.status;

      if (effect && effect.status === 'failure') {
        return {
          ...base,
          status: 'failed',
          latencyMs: Date.now() - started,
          checkpoint,
          explorerUrl: explorerUrl('tx', input.digest),
          detail: `Transaction ${short(input.digest)} failed onchain: ${
            effect.error ?? 'unknown error'
          }.`,
        };
      }

      return {
        ...base,
        status: 'verified',
        latencyMs: Date.now() - started,
        checkpoint,
        explorerUrl: explorerUrl('tx', input.digest),
        detail: `Memory write confirmed in transaction ${short(
          input.digest,
        )} at checkpoint ${checkpoint}.`,
      };
    }

    if (input.accountId) {
      const account = await input.client.getObject(input.accountId, {
        showContent: true,
      });

      if (account.error || !account.data) {
        return {
          ...base,
          status: 'failed',
          latencyMs: Date.now() - started,
          checkpoint,
          explorerUrl: explorerUrl('object', input.accountId),
          detail: `MemWalAccount ${short(
            input.accountId,
          )} was not found on Sui mainnet.`,
        };
      }

      const fields = account.data.content?.fields;
      if (!fields) {
        return {
          ...base,
          status: 'failed',
          latencyMs: Date.now() - started,
          checkpoint,
          explorerUrl: explorerUrl('object', input.accountId),
          detail: `MemWalAccount ${short(
            input.accountId,
          )} exists but returned no content.`,
        };
      }

      if (fields.active === false) {
        return {
          ...base,
          status: 'failed',
          latencyMs: Date.now() - started,
          checkpoint,
          explorerUrl: explorerUrl('object', input.accountId),
          detail: `MemWalAccount ${short(input.accountId)} is frozen onchain.`,
        };
      }

      const delegates = delegateKeys(fields.delegate_keys);
      const wanted = normaliseKey(input.agentPublicKey);
      const registered =
        wanted === null
          ? null
          : delegates.some(
              (delegate) =>
                delegate.publicKey === wanted || delegate.suiAddress === wanted,
            );

      if (registered === false) {
        return {
          ...base,
          status: 'failed',
          latencyMs: Date.now() - started,
          checkpoint,
          explorerUrl: explorerUrl('object', input.accountId),
          detail: `MemWalAccount ${short(
            input.accountId,
          )} is active, but the configured delegate key is not registered.`,
        };
      }

      return {
        ...base,
        status: 'verified',
        latencyMs: Date.now() - started,
        checkpoint,
        explorerUrl: explorerUrl('object', input.accountId),
        detail: `MemWalAccount ${short(
          input.accountId,
        )} is active at checkpoint ${checkpoint}; ${delegates.length} delegate key${
          delegates.length === 1 ? '' : 's'
        } registered${registered ? ', including the configured agent' : ''}.`,
      };
    }

    if (input.objectId) {
      const object = await input.client.getObject(input.objectId);

      if (object.error || !object.data) {
        return {
          ...base,
          status: 'failed',
          latencyMs: Date.now() - started,
          checkpoint,
          explorerUrl: explorerUrl('object', input.objectId),
          detail: `Object ${short(input.objectId)} was not found on Sui mainnet.`,
        };
      }

      return {
        ...base,
        status: 'verified',
        latencyMs: Date.now() - started,
        checkpoint,
        explorerUrl: explorerUrl('object', input.objectId),
        detail: `Memory object ${short(
          input.objectId,
        )} exists on Sui mainnet at checkpoint ${checkpoint}.`,
      };
    }

    return {
      ...base,
      status: 'reachable',
      latencyMs: Date.now() - started,
      checkpoint,
      explorerUrl: null,
      detail: `Sui mainnet reachable at checkpoint ${checkpoint}. Set MEMWAL_ACCOUNT_ID to verify the Walrus Memory account, or TATUM_VERIFY_DIGEST to pin a write.`,
    };
  } catch (error) {
    return {
      ...base,
      status: 'failed',
      latencyMs: Date.now() - started,
      checkpoint: null,
      explorerUrl: null,
      detail:
        error instanceof TatumRpcError
          ? error.message
          : `Tatum check failed: ${
              error instanceof Error ? error.message : String(error)
            }`,
    };
  }
}

function explorerUrl(kind: 'tx' | 'object', id: string): string {
  const encoded = encodeURIComponent(id);
  return kind === 'tx'
    ? `https://suivision.xyz/txblock/${encoded}`
    : `https://suivision.xyz/object/${encoded}`;
}

interface DelegateKey {
  publicKey: string | null;
  suiAddress: string | null;
}

function delegateKeys(value: unknown): DelegateKey[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((entry): DelegateKey => {
      if (!entry || typeof entry !== 'object') {
        return { publicKey: null, suiAddress: null };
      }

      const record = entry as Record<string, unknown>;
      const fields = (
        record.fields && typeof record.fields === 'object'
          ? record.fields
          : record
      ) as Record<string, unknown>;

      return {
        publicKey: bytesToHex(fields.public_key),
        suiAddress:
          typeof fields.sui_address === 'string'
            ? normaliseKey(fields.sui_address)
            : null,
      };
    })
    .filter(
      (delegate) => delegate.publicKey !== null || delegate.suiAddress !== null,
    );
}

function bytesToHex(value: unknown): string | null {
  if (Array.isArray(value)) {
    const bytes = value.map(Number);
    if (bytes.some((byte) => !Number.isInteger(byte) || byte < 0 || byte > 255)) {
      return null;
    }
    return bytes.map((byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (/^0x[0-9a-f]+$/i.test(trimmed)) return trimmed.slice(2).toLowerCase();
    if (/^[0-9a-f]+$/i.test(trimmed)) return trimmed.toLowerCase();

    // Newer gateways can encode byte vectors as base64. Decode defensively.
    try {
      const decoded = Buffer.from(trimmed, 'base64');
      if (decoded.length > 0) return decoded.toString('hex');
    } catch {
      return null;
    }
  }

  return null;
}

function normaliseKey(value: string | null | undefined): string | null {
  if (!value) return null;

  const trimmed = value.trim();
  if (/^0x[0-9a-f]+$/i.test(trimmed)) return trimmed.slice(2).toLowerCase();
  if (/^[0-9a-f]+$/i.test(trimmed)) return trimmed.toLowerCase();
  return trimmed.toLowerCase();
}

function short(id: string): string {
  return id.length > 14 ? `${id.slice(0, 8)}…${id.slice(-4)}` : id;
}
