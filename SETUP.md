# Setup

Two accounts gate the submission: **Tatum** (Sui RPC) and **Walrus Memory**
(mainnet). Everything else runs locally without them, but the local demo is not
the submission.

> Secrets go in `.env.local`. It is gitignored. Never paste a key into a commit,
> a screenshot, or the public repo.

## 1. Tatum

1. Create a free account at <https://dashboard.tatum.io>.
2. Copy an **API key** from the dashboard.
3. Copy your **dashboard account ID** — the submission form asks for it.
4. Add both to `.env.local`:

```dotenv
TATUM_API_KEY=your-mainnet-key
TATUM_SUI_RPC_URL=https://sui-mainnet.gateway.tatum.io/graphql
```

Tatum retired its Sui JSON-RPC surface; the mainnet gateway now serves GraphQL
at `/graphql`. The client accepts either the bare gateway root or the full URL.

Check it:

```powershell
npm.cmd run dev
# then open http://localhost:3000/api/verify
```

With only the key, the endpoint returns `status: "reachable"` and the latest
Sui mainnet checkpoint. That proves the RPC path; it is deliberately **not**
called "verified."

## 2. Walrus Memory (mainnet)

1. Open <https://memory.walrus.xyz>.
2. Connect a Sui wallet. This wallet is the **owner**; its address is the
   `SUI address` / `Account ID (SUI)` on the submission form.
3. Create a **Walrus Memory account**. The resulting object ID is
   `MEMWAL_ACCOUNT_ID`. This is **not** the wallet address shown at the top of
   the dashboard: the wallet is the owner, the object ID is the account. If the
   badge says the account was not found, you almost certainly pasted the wallet
   address.
4. Create a **delegate key** for this app. You get:
   - a private key → `MEMWAL_KEY`
   - a public key → `MEMWAL_AGENT_ID` (this is what the form calls
     `MEMWAL_AGENT_ID`)
   - a derived Sui address (useful for debugging, not required)
5. Add them to `.env.local`:

```dotenv
MEMWAL_KEY=your-delegate-private-key
MEMWAL_ACCOUNT_ID=0x...        # MemWalAccount object ID
MEMWAL_AGENT_ID=...            # delegate PUBLIC key
MEMWAL_SERVER_URL=https://relayer.memory.walrus.xyz
MEMWAL_NAMESPACE=precedent
```

The delegate key must be **registered onchain** by the owner. The dashboard does
this when you create the key there. A key that exists only in `.env.local` will
fail with `AUTH_REJECTED`.

### What the badge checks

With `TATUM_API_KEY` + `MEMWAL_ACCOUNT_ID`, `/api/verify` calls Tatum's
`sui_getObject` on the `MemWalAccount` and checks:

- the object exists on Sui mainnet,
- `active` is not `false`,
- `MEMWAL_AGENT_ID` appears in `delegate_keys`.

If all three hold, the badge says **Sui verified** and links to the account on
SuiVision. If the delegate key is missing, it says so instead of hiding it.

## 3. Run it

```powershell
npm.cmd install
npm.cmd run test        # 62 engine + Tatum tests, no network
npm.cmd run dev
```

Open <http://localhost:3000>. The top bar must say **MAINNET** once
`MEMWAL_KEY` and `MEMWAL_ACCOUNT_ID` are present. If it says **LOCAL DEMO**, the
app is writing to `.data/`, not Walrus.

## 4. Mainnet smoke test

Before filming, run the whole story once with mainnet credentials:

```powershell
npm.cmd run smoke
```

The script reads `.env.local`, refuses to run on the local store, checks the
relayer, and refuses if the namespace already has memories (Walrus Memory is
append-only). It then writes the scripted story, waits until the relayer reports
at least 10 memories, verifies the `MemWalAccount` through Tatum, and writes
`.data/mainnet-smoke.json` as evidence.

A successful run ends with:

```
✓ Mainnet run complete: 10+ memories and a verified account.
```

If the namespace already has memories, set a fresh name and restart:

```dotenv
MEMWAL_NAMESPACE=precedent-demo-1
```

Then run `npm.cmd run smoke` again. The web app reads the same namespace, so the
ledger you just wrote is the ledger it shows.

`listMemories` is metadata-only and does not decrypt content.

## 5. Submission form values

| Field | Where it comes from |
| --- | --- |
| Tatum ID | Tatum dashboard account ID |
| SUI address | owner wallet address |
| Account ID (SUI) | same owner wallet address, unless the form asks for the object ID |
| MEMWAL_AGENT_ID | delegate **public** key from `memory.walrus.xyz` |

## Node version

The Walrus docs list Node **22.23.4+ / 24.22.1+**. The SDK (`0.1.9`) installs and
its mainnet `health()` check succeeds on Node 24.20.0, but upgrade before the
submission run if anything behaves oddly:

```powershell
winget upgrade OpenJS.NodeJS.LTS
node --version
```
