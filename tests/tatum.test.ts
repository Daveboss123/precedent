import assert from 'node:assert/strict';
import test from 'node:test';

import { TatumClient, TatumRpcError } from '../src/tatum/client.ts';
import { verifyMemoryWrite } from '../src/tatum/verify.ts';

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

interface MockData {
  checkpoint?: number;
  object?: unknown;
  transaction?: unknown;
  chainIdentifier?: string;
}

/** A fake Tatum GraphQL gateway: routes by the query the client sends. */
function gqlFetch(data: MockData): typeof fetch {
  return (async (_input: Parameters<typeof fetch>[0], init?: RequestInit) => {
    const payload = JSON.parse(String(init?.body ?? '{}')) as {
      query?: string;
    };
    const query = payload.query ?? '';

    if (query.includes('checkpoint')) {
      return json({
        data: { checkpoint: { sequenceNumber: data.checkpoint ?? 777 } },
      });
    }
    if (query.includes('transaction(')) {
      return json({ data: { transaction: data.transaction ?? null } });
    }
    if (query.includes('object(')) {
      return json({ data: { object: data.object ?? null } });
    }
    if (query.includes('chainIdentifier')) {
      return json({
        data: { chainIdentifier: data.chainIdentifier ?? 'abc' },
      });
    }

    return json({ errors: [{ message: `No mock for ${query}` }] });
  }) as typeof fetch;
}

const AGENT_BASE64 = 'Q9VKiaCq3Roe8yIzyG4UNHqHr8GxCf8MusxwDKnCdso=';
const AGENT_HEX = Buffer.from(AGENT_BASE64, 'base64').toString('hex');

function memwalAccount(
  overrides: { active?: boolean; publicKey?: string } = {},
): unknown {
  return {
    address: '0xaccount',
    version: 1,
    digest: '0xdef',
    asMoveObject: {
      contents: {
        type: { repr: '0xe7c16f::account::MemWalAccount' },
        json: {
          id: '0xaccount',
          owner: '0xowner',
          active: overrides.active ?? true,
          delegate_keys: [
            {
              public_key: overrides.publicKey ?? AGENT_BASE64,
              sui_address: '0x184d3a49dbc3bf6506a1e691f3d0de6c3cc9ea038cb15473620bd4287254eae5',
              label: 'Web App',
            },
          ],
        },
      },
    },
  };
}

test('the client parses a checkpoint and sends the key', async () => {
  let headers: Headers | undefined;

  const client = new TatumClient({
    apiKey: 'secret-key',
    fetchImpl: (async (_input, init) => {
      headers = new Headers(init?.headers);
      return json({ data: { checkpoint: { sequenceNumber: 12345 } } });
    }) as typeof fetch,
  });

  assert.equal(await client.latestCheckpoint(), 12345);
  assert.equal(headers?.get('x-api-key'), 'secret-key');
  assert.equal(headers?.get('content-type'), 'application/json');
});

test('a gateway root is normalised to the GraphQL endpoint', () => {
  const root = new TatumClient({
    apiKey: 'test',
    url: 'https://sui-mainnet.gateway.tatum.io',
  });
  const full = new TatumClient({
    apiKey: 'test',
    url: 'https://sui-mainnet.gateway.tatum.io/graphql/',
  });

  assert.equal(root.url, 'https://sui-mainnet.gateway.tatum.io/graphql');
  assert.equal(full.url, 'https://sui-mainnet.gateway.tatum.io/graphql');
});

test('a GraphQL error keeps its message', async () => {
  const client = new TatumClient({
    apiKey: 'test',
    fetchImpl: (async () =>
      json({
        errors: [{ message: 'Unknown field "checkpoint"' }],
      })) as typeof fetch,
  });

  await assert.rejects(
    () => client.latestCheckpoint(),
    (error: unknown) =>
      error instanceof TatumRpcError &&
      /Unknown field/.test(error.message),
  );
});

test('a rejected key is named as such', async () => {
  const client = new TatumClient({
    apiKey: 'bad-key',
    fetchImpl: (async () =>
      new Response('nope', { status: 401 })) as typeof fetch,
  });

  await assert.rejects(
    () => client.latestCheckpoint(),
    /Tatum rejected the API key/,
  );
});

test('a rate limit is named, not mistaken for a bad key', async () => {
  const client = new TatumClient({
    apiKey: 'test',
    fetchImpl: (async () =>
      new Response('slow down', { status: 429 })) as typeof fetch,
  });

  await assert.rejects(() => client.latestCheckpoint(), /rate limit/);
});

test('a stalled gateway times out', async () => {
  const client = new TatumClient({
    apiKey: 'test',
    timeoutMs: 10,
    fetchImpl: ((_input, init) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          const error = new Error('Aborted');
          error.name = 'AbortError';
          reject(error);
        });
      })) as typeof fetch,
  });

  await assert.rejects(() => client.latestCheckpoint(), /timed out/);
});

test('without a key the badge says unconfigured, not verified', async () => {
  const result = await verifyMemoryWrite({ client: null });

  assert.equal(result.status, 'unconfigured');
  assert.match(result.detail, /TATUM_API_KEY/);
});

test('a successful transaction verifies the memory write', async () => {
  const client = new TatumClient({
    apiKey: 'test',
    fetchImpl: gqlFetch({
      checkpoint: 777,
      transaction: {
        digest: '0xabc',
        effects: { status: 'SUCCESS', executionError: null },
      },
    }),
  });

  const result = await verifyMemoryWrite({ client, digest: '0xabc' });

  assert.equal(result.status, 'verified');
  assert.equal(result.checkpoint, 777);
  assert.equal(result.digest, '0xabc');
  assert.match(result.explorerUrl ?? '', /txblock\/0xabc/);
});

test('a failed transaction is a failed verification', async () => {
  const client = new TatumClient({
    apiKey: 'test',
    fetchImpl: gqlFetch({
      checkpoint: 777,
      transaction: {
        digest: '0xbad',
        effects: {
          status: 'FAILURE',
          executionError: { message: 'MoveAbort' },
        },
      },
    }),
  });

  const result = await verifyMemoryWrite({ client, digest: '0xbad' });

  assert.equal(result.status, 'failed');
  assert.match(result.detail, /MoveAbort/);
});

test('an object that does not exist is a failed verification', async () => {
  const client = new TatumClient({
    apiKey: 'test',
    fetchImpl: gqlFetch({ checkpoint: 777, object: null }),
  });

  const result = await verifyMemoryWrite({
    client,
    objectId: '0xmissing',
  });

  assert.equal(result.status, 'failed');
  assert.match(result.detail, /not found/);
});

test('an existing object verifies the memory write', async () => {
  const client = new TatumClient({
    apiKey: 'test',
    fetchImpl: gqlFetch({
      checkpoint: 777,
      object: {
        address: '0xobj',
        version: 1,
        digest: '0xdef',
        asMoveObject: {
          contents: {
            type: { repr: '0x2::coin::Coin' },
            json: { id: '0xobj' },
          },
        },
      },
    }),
  });

  const result = await verifyMemoryWrite({ client, objectId: '0xobj' });

  assert.equal(result.status, 'verified');
  assert.match(result.explorerUrl ?? '', /object\/0xobj/);
});

test('a reachable gateway without a pinned write is not called verified', async () => {
  const client = new TatumClient({
    apiKey: 'test',
    fetchImpl: gqlFetch({ checkpoint: 777 }),
  });

  const result = await verifyMemoryWrite({ client });

  assert.equal(result.status, 'reachable');
  assert.equal(result.checkpoint, 777);
  assert.equal(result.explorerUrl, null);
});

test('a MemWalAccount verifies the registered delegate key', async () => {
  const client = new TatumClient({
    apiKey: 'test',
    fetchImpl: gqlFetch({
      checkpoint: 777,
      object: memwalAccount(),
    }),
  });

  const result = await verifyMemoryWrite({
    client,
    accountId: '0xaccount',
    agentPublicKey: AGENT_HEX,
  });

  assert.equal(result.status, 'verified');
  assert.match(result.detail, /delegate key/);
  assert.match(result.explorerUrl ?? '', /object\/0xaccount/);
});

test('an unregistered delegate key fails the account check', async () => {
  const client = new TatumClient({
    apiKey: 'test',
    fetchImpl: gqlFetch({
      checkpoint: 777,
      object: memwalAccount(),
    }),
  });

  const result = await verifyMemoryWrite({
    client,
    accountId: '0xaccount',
    agentPublicKey: '0xdeadbeef',
  });

  assert.equal(result.status, 'failed');
  assert.match(result.detail, /not registered/);
});

test('a frozen MemWalAccount fails the account check', async () => {
  const client = new TatumClient({
    apiKey: 'test',
    fetchImpl: gqlFetch({
      checkpoint: 777,
      object: memwalAccount({ active: false }),
    }),
  });

  const result = await verifyMemoryWrite({
    client,
    accountId: '0xaccount',
  });

  assert.equal(result.status, 'failed');
  assert.match(result.detail, /frozen/);
});

test('a transport failure is reported, never hidden', async () => {
  const client = new TatumClient({
    apiKey: 'test',
    fetchImpl: (async () => {
      throw new Error('ECONNRESET');
    }) as typeof fetch,
  });

  const result = await verifyMemoryWrite({ client });

  assert.equal(result.status, 'failed');
  assert.match(result.detail, /ECONNRESET/);
});
