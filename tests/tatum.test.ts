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

/** A fake gateway: maps a JSON-RPC method to its result. */
function rpcFetch(routes: Record<string, unknown>): typeof fetch {
  return (async (_input: Parameters<typeof fetch>[0], init?: RequestInit) => {
    const payload = JSON.parse(String(init?.body ?? '{}')) as {
      method?: string;
    };
    const route = payload.method ? routes[payload.method] : undefined;

    if (route === undefined) {
      return json({
        jsonrpc: '2.0',
        id: 1,
        error: {
          code: -32601,
          message: `No mock for ${payload.method}`,
        },
      });
    }

    return json({ jsonrpc: '2.0', id: 1, result: route });
  }) as typeof fetch;
}

test('the client parses a checkpoint and sends the key', async () => {
  let headers: Headers | undefined;

  const client = new TatumClient({
    apiKey: 'secret-key',
    fetchImpl: (async (_input, init) => {
      headers = new Headers(init?.headers);
      return json({ jsonrpc: '2.0', id: 1, result: '12345' });
    }) as typeof fetch,
  });

  assert.equal(await client.latestCheckpoint(), 12345);
  assert.equal(headers?.get('x-api-key'), 'secret-key');
});

test('a JSON-RPC error keeps its code and message', async () => {
  const client = new TatumClient({
    apiKey: 'test',
    fetchImpl: rpcFetch({}),
  });

  await assert.rejects(
    () => client.latestCheckpoint(),
    (error: unknown) =>
      error instanceof TatumRpcError &&
      error.code === -32601 &&
      /No mock/.test(error.message),
  );
});

test('a rejected key is named as such', async () => {
  const client = new TatumClient({
    apiKey: 'bad-key',
    fetchImpl: (async () => new Response('nope', { status: 401 })) as typeof fetch,
  });

  await assert.rejects(
    () => client.latestCheckpoint(),
    /Tatum rejected the API key/,
  );
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
    fetchImpl: rpcFetch({
      sui_getLatestCheckpointSequenceNumber: '777',
      sui_getTransactionBlock: {
        digest: '0xabc',
        effects: { status: { status: 'success' } },
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
    fetchImpl: rpcFetch({
      sui_getLatestCheckpointSequenceNumber: '777',
      sui_getTransactionBlock: {
        digest: '0xbad',
        effects: {
          status: { status: 'failure', error: 'MoveAbort' },
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
    fetchImpl: rpcFetch({
      sui_getLatestCheckpointSequenceNumber: '777',
      sui_getObject: {
        error: { code: 'notExists', object_id: '0xmissing' },
      },
    }),
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
    fetchImpl: rpcFetch({
      sui_getLatestCheckpointSequenceNumber: '777',
      sui_getObject: {
        data: { objectId: '0xobj', version: '1', digest: '0xdef' },
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
    fetchImpl: rpcFetch({
      sui_getLatestCheckpointSequenceNumber: '777',
    }),
  });

  const result = await verifyMemoryWrite({ client });

  assert.equal(result.status, 'reachable');
  assert.equal(result.checkpoint, 777);
  assert.equal(result.explorerUrl, null);
});

test('a MemWalAccount verifies the registered delegate key', async () => {
  const client = new TatumClient({
    apiKey: 'test',
    fetchImpl: rpcFetch({
      sui_getLatestCheckpointSequenceNumber: '777',
      sui_getObject: {
        data: {
          objectId: '0xaccount',
          version: '1',
          digest: '0xdef',
          type: '0xpackage::account::MemWalAccount',
          content: {
            dataType: 'moveObject',
            fields: {
              owner: '0xowner',
              active: true,
              delegate_keys: [
                {
                  type: '0xpackage::account::DelegateKey',
                  fields: {
                    public_key: [1, 2, 3],
                    sui_address: '0xabc',
                    label: 'Precedent agent',
                  },
                },
              ],
            },
          },
        },
      },
    }),
  });

  const result = await verifyMemoryWrite({
    client,
    accountId: '0xaccount',
    agentPublicKey: '0x010203',
  });

  assert.equal(result.status, 'verified');
  assert.match(result.detail, /delegate key/);
  assert.match(result.explorerUrl ?? '', /object\/0xaccount/);
});

test('an unregistered delegate key fails the account check', async () => {
  const client = new TatumClient({
    apiKey: 'test',
    fetchImpl: rpcFetch({
      sui_getLatestCheckpointSequenceNumber: '777',
      sui_getObject: {
        data: {
          objectId: '0xaccount',
          version: '1',
          digest: '0xdef',
          content: {
            dataType: 'moveObject',
            fields: {
              active: true,
              delegate_keys: [
                {
                  fields: {
                    public_key: [1, 2, 3],
                    sui_address: '0xabc',
                  },
                },
              ],
            },
          },
        },
      },
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
    fetchImpl: rpcFetch({
      sui_getLatestCheckpointSequenceNumber: '777',
      sui_getObject: {
        data: {
          objectId: '0xaccount',
          version: '1',
          digest: '0xdef',
          content: {
            dataType: 'moveObject',
            fields: { active: false, delegate_keys: [] },
          },
        },
      },
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
