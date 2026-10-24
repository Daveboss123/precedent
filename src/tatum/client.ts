/**
 * A small, typed client for Tatum's Sui GraphQL gateway.
 *
 * Tatum retired the Sui JSON-RPC surface. The mainnet gateway now exposes
 * GraphQL at `/graphql`, so this client speaks GraphQL and nothing else.
 *
 * It is deliberately thin — no SDK, no retries, no hidden fallbacks. If the
 * gateway is down or the key is wrong, the badge says so. A verification badge
 * that lies is worse than no badge.
 */

export const DEFAULT_TATUM_SUI_URL =
  'https://sui-mainnet.gateway.tatum.io/graphql';

export interface TatumConfig {
  apiKey: string;
  /** Gateway root or full `/graphql` URL. Both are accepted. */
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

interface GraphQLError {
  message: string;
}

interface GraphQLResponse<T> {
  data?: T | null;
  errors?: GraphQLError[];
}

interface GqlObject {
  address: string;
  version?: number | string | null;
  digest?: string | null;
  asMoveObject?: {
    contents?: {
      type?: { repr?: string | null } | null;
      json?: unknown;
    } | null;
  } | null;
}

interface GqlTransaction {
  digest: string;
  effects?: {
    status?: 'SUCCESS' | 'FAILURE' | null;
    executionError?: { message?: string | null } | null;
  } | null;
}

export class TatumClient {
  apiKey: string;
  url: string;
  fetchImpl: typeof fetch;
  timeoutMs: number;

  constructor(config: TatumConfig) {
    this.apiKey = config.apiKey;
    this.url = normalizeGraphqlUrl(config.url);
    this.fetchImpl = config.fetchImpl ?? fetch;
    this.timeoutMs = config.timeoutMs ?? 10_000;
  }

  async graphql<T>(
    query: string,
    variables: Record<string, unknown> = {},
  ): Promise<T> {
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
        body: JSON.stringify({ query, variables }),
        signal: controller.signal,
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new TatumRpcError(
          0,
          `Tatum GraphQL timed out after ${this.timeoutMs}ms.`,
        );
      }
      throw new TatumRpcError(
        0,
        `Tatum GraphQL request failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) {
      const detail = await readError(response);

      if (response.status === 401 || response.status === 403) {
        throw new TatumRpcError(
          response.status,
          'Tatum rejected the API key. Check TATUM_API_KEY.',
        );
      }
      if (response.status === 429) {
        throw new TatumRpcError(
          429,
          'Tatum rate limit reached (3 requests/second on the free plan). Wait a moment and retry.',
        );
      }
      if (response.status === 404) {
        throw new TatumRpcError(
          404,
          'Tatum GraphQL endpoint not found. Check TATUM_SUI_RPC_URL.',
        );
      }

      throw new TatumRpcError(
        response.status,
        `Tatum GraphQL returned HTTP ${response.status}${
          detail ? `: ${detail}` : '.'
        }`,
      );
    }

    const payload = (await response.json()) as GraphQLResponse<T>;

    if (payload.errors?.length) {
      throw new TatumRpcError(
        0,
        payload.errors.map((error) => error.message).join('; '),
      );
    }
    if (payload.data === undefined || payload.data === null) {
      throw new TatumRpcError(0, 'Tatum GraphQL returned no data.');
    }

    return payload.data;
  }

  async latestCheckpoint(): Promise<number> {
    const data = await this.graphql<{
      checkpoint: { sequenceNumber: number };
    }>('query { checkpoint { sequenceNumber } }');

    const checkpoint = Number(data.checkpoint.sequenceNumber);
    if (!Number.isFinite(checkpoint)) {
      throw new TatumRpcError(0, 'Tatum returned an invalid checkpoint.');
    }
    return checkpoint;
  }

  async getObject(
    objectId: string,
    _options: { showContent?: boolean } = {},
  ): Promise<SuiObjectResponse> {
    const data = await this.graphql<{ object: GqlObject | null }>(
      `query($address: SuiAddress!) {
        object(address: $address) {
          address
          version
          digest
          asMoveObject {
            contents {
              type { repr }
              json
            }
          }
        }
      }`,
      { address: objectId },
    );

    const object = data.object;
    if (!object) {
      return { error: { code: 'notExists', object_id: objectId } };
    }

    const contents = object.asMoveObject?.contents;
    const fields =
      contents?.json && typeof contents.json === 'object'
        ? (contents.json as Record<string, unknown>)
        : undefined;

    return {
      data: {
        objectId: object.address,
        version: String(object.version ?? ''),
        digest: object.digest ?? '',
        type: contents?.type?.repr ?? undefined,
        content: contents
          ? {
              dataType: 'moveObject',
              type: contents.type?.repr ?? undefined,
              fields,
            }
          : undefined,
      },
    };
  }

  async getTransactionBlock(
    digest: string,
  ): Promise<SuiTransactionBlockResponse> {
    const data = await this.graphql<{ transaction: GqlTransaction | null }>(
      `query($digest: String!) {
        transaction(digest: $digest) {
          digest
          effects {
            status
            executionError { message }
          }
        }
      }`,
      { digest },
    );

    const transaction = data.transaction;
    if (!transaction) {
      throw new TatumRpcError(
        0,
        `Transaction ${digest} was not found on Sui mainnet.`,
      );
    }

    const effects = transaction.effects;
    return {
      digest: transaction.digest,
      effects: effects
        ? {
            status: {
              status:
                effects.status === 'SUCCESS' ? 'success' : 'failure',
              error: effects.executionError?.message ?? undefined,
            },
          }
        : undefined,
    };
  }

  async getChainIdentifier(): Promise<string> {
    const data = await this.graphql<{ chainIdentifier: string }>(
      'query { chainIdentifier }',
    );
    return data.chainIdentifier;
  }

  /** Wallet truth for the charter's budget, when we get there. */
  async getBalance(owner: string, coinType?: string): Promise<SuiBalance> {
    const data = await this.graphql<{
      object: {
        balance?: {
          totalBalance?: string | number | null;
          coinType?: { repr?: string | null } | null;
        } | null;
      } | null;
    }>(
      `query($owner: SuiAddress!) {
        object(address: $owner) {
          balance {
            totalBalance
            coinType { repr }
          }
        }
      }`,
      { owner },
    );

    const balance = data.object?.balance;
    if (!balance) {
      throw new TatumRpcError(0, `No balance found for ${owner}.`);
    }

    return {
      coinType: balance.coinType?.repr ?? coinType ?? '0x2::sui::SUI',
      coinObjectCount: 0,
      totalBalance: String(balance.totalBalance ?? '0'),
    };
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
    url:
      env.TATUM_SUI_GRAPHQL_URL?.trim() ||
      env.TATUM_SUI_RPC_URL?.trim() ||
      DEFAULT_TATUM_SUI_URL,
  });
}

function normalizeGraphqlUrl(url?: string): string {
  const trimmed = url?.trim();
  if (!trimmed) return DEFAULT_TATUM_SUI_URL;

  const withoutSlash = trimmed.replace(/\/+$/, '');
  return withoutSlash.endsWith('/graphql')
    ? withoutSlash
    : `${withoutSlash}/graphql`;
}

async function readError(response: Response): Promise<string> {
  try {
    const text = await response.text();
    if (!text) return '';

    try {
      const parsed = JSON.parse(text) as {
        message?: string;
        errors?: GraphQLError[];
      };
      return (
        parsed.message ??
        parsed.errors?.map((error) => error.message).join('; ') ??
        text.slice(0, 200)
      );
    } catch {
      return text.slice(0, 200);
    }
  } catch {
    return '';
  }
}
