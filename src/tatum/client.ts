/**
 * A small, typed client for Tatum's Sui JSON-RPC gateway.
 *
 * Tatum is used for one thing here: proving that a memory write is real. The
 * client is deliberately thin — no SDK, no retries, no hidden fallbacks. If the
 * gateway is down or the key is wrong, the badge says so. A verification badge
 * that lies is worse than no badge.
 */

export const DEFAULT_TATUM_SUI_URL = 'https://sui-mainnet.gateway.tatum.io';

export interface TatumConfig {
  apiKey: string;
  url?: string;
  /** Injected in tests; defaults to global fetch. */
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

export class TatumRpcError extends Error {
  code: number;

  constructor(code: number, message: string) {
    super(message);
    this.name = 'TatumRpcError';
    this.code = code;
  }
}

export interface SuiObjectContent {
  dataType?: string;
  type?: string;
  fields?: Record<string, unknown>;
}

export interface SuiObjectResponse {
  data?: {
    objectId: string;
    version: string;
    digest: string;
    type?: string;
    owner?: unknown;
    content?: SuiObjectContent;
  };
  error?: {
    code: string;
    object_id?: string;
  };
}

export interface SuiTransactionBlockResponse {
  digest: string;
  checkpoint?: string;
  effects?: {
    status?: {
      status: 'success' | 'failure';
      error?: string;
    };
  };
}

export interface SuiBalance {
  coinType: string;
  coinObjectCount: number;
  totalBalance: string;
  lockedBalance?: Record<string, string>;
}

export class TatumClient {
  apiKey: string;
  url: string;
  fetchImpl: typeof fetch;
  timeoutMs: number;

  constructor(config: TatumConfig) {
    this.apiKey = config.apiKey;
    this.url = config.url ?? DEFAULT_TATUM_SUI_URL;
    this.fetchImpl = config.fetchImpl ?? fetch;
    this.timeoutMs = config.timeoutMs ?? 10_000;
  }

  async rpc<T>(method: string, params: unknown[] = []): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    let response: Response;
    try {
      response = await this.fetchImpl(this.url, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': this.apiKey,
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method,
          params,
        }),
        signal: controller.signal,
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new TatumRpcError(
          0,
          `Tatum RPC timed out after ${this.timeoutMs}ms.`,
        );
      }
      throw new TatumRpcError(
        0,
        `Tatum RPC request failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new TatumRpcError(
          response.status,
          'Tatum rejected the API key. Check TATUM_API_KEY.',
        );
      }
      throw new TatumRpcError(
        response.status,
        `Tatum RPC returned HTTP ${response.status}.`,
      );
    }

    const payload = (await response.json()) as {
      result?: T;
      error?: { code: number; message: string };
    };

    if (payload.error) {
      throw new TatumRpcError(payload.error.code, payload.error.message);
    }
    if (payload.result === undefined) {
      throw new TatumRpcError(0, 'Tatum RPC returned no result.');
    }

    return payload.result;
  }

  async latestCheckpoint(): Promise<number> {
    const raw = await this.rpc<string>('sui_getLatestCheckpointSequenceNumber');
    const checkpoint = Number(raw);
    if (!Number.isFinite(checkpoint)) {
      throw new TatumRpcError(0, 'Tatum returned an invalid checkpoint.');
    }
    return checkpoint;
  }

  async getObject(
    objectId: string,
    options: { showContent?: boolean } = {},
  ): Promise<SuiObjectResponse> {
    return this.rpc<SuiObjectResponse>('sui_getObject', [
      objectId,
      {
        showType: true,
        showOwner: true,
        showContent: options.showContent ?? false,
      },
    ]);
  }

  async getTransactionBlock(
    digest: string,
  ): Promise<SuiTransactionBlockResponse> {
    return this.rpc<SuiTransactionBlockResponse>('sui_getTransactionBlock', [
      digest,
      { showEffects: true },
    ]);
  }

  async getChainIdentifier(): Promise<string> {
    return this.rpc<string>('sui_getChainIdentifier');
  }

  /** Wallet truth for the charter's budget, when we get there. */
  async getBalance(owner: string, coinType?: string): Promise<SuiBalance> {
    return this.rpc<SuiBalance>('sui_getBalance', [
      owner,
      coinType ?? null,
    ]);
  }
}

/**
 * Mainnet only when a key is present. There is no staging branch: the
 * hackathon requires mainnet, and a silent fallback would undermine the badge.
 */
export function createTatumClient(
  env: Record<string, string | undefined> = process.env,
): TatumClient | null {
  const apiKey = env.TATUM_API_KEY?.trim();
  if (!apiKey) return null;

  return new TatumClient({
    apiKey,
    url: env.TATUM_SUI_RPC_URL?.trim() || DEFAULT_TATUM_SUI_URL,
  });
}
