# Precedent

**The weekly shop, handled — without the weekly debate.**

Precedent is a household replenishment agent whose memory is its case law. It learns the rules you already have, cites them before it spends your money, and keeps the old rule on the record when you correct it.

Built for **Tatum × Walrus — Total Recall, Track 2**.

- **Live app:** https://precedent-household.vercel.app
- **The record:** https://precedent-household.vercel.app/proof
- **Source:** https://github.com/Daveboss123/precedent

## The idea

Most “AI shopping” demos ask you to configure preferences. Precedent starts with the list you already have and learns the way people actually do: by being wrong, and being told.

Every decision is a small case:

1. **A rule is written in your words.** “Pay the premium and stay with Roaster A. The cheaper beans were too acidic.”
2. **It is cited before the next spend.** “House blend beans — $18.00. Cited #7.”
3. **A correction does not overwrite it.** The old rule stays on the record; a supersession record names the new one that governs.
4. **Limits are checked first.** A monthly ceiling, an ask-above amount, and hard no’s are not preferences. No answer can learn around them.

The app is deliberately a normal reorder dashboard, not a chat window. The memory is visible in the record, not hidden behind a prompt.

## Walrus Memory

The mainnet submission used **20 memories** in the `precedent` namespace on Sui mainnet.

| | |
| --- | --- |
| MemWal account | `0x9ed016de2fbfa51d73363495e7158e40f8761a0c253c9198c430423d624f6d55` |
| Delegate | `43d54a89a0aadd1a1ef32233c86e14347a87afc1b109ff0cbacc700ca9c276ca` |
| Namespace | `precedent` |
| Evidence | `.data/mainnet-smoke.json` when running the smoke script |

Walrus is the source of truth for rules, supersessions, outcomes, observations, and audit findings. The decision log and the editable shopping list are ordinary app state, because they are recomputable and should not spend a mainnet write.

The public demo is intentionally **not** pointed at that mainnet namespace. A visitor can reset it, and Walrus Memory is append-only. The demo uses a separate Redis-backed store and labels itself accordingly.

## Tatum

`/proof` verifies the mainnet record live through Tatum’s Sui GraphQL gateway:

- the MemWal account exists and is active,
- the delegate key is registered,
- optionally, a pinned memory write when `TATUM_VERIFY_DIGEST` or `TATUM_VERIFY_OBJECT_ID` is set.

Tatum retired Sui JSON-RPC, so the client talks to `https://sui-mainnet.gateway.tatum.io/graphql`. The verification result is cached for 60 seconds and shared between concurrent requests to stay inside the free plan’s rate limit.

## Run it

Requires Node 22.23+.

```bash
npm install
npm run dev
```

Without credentials the app runs in local mode with file-backed storage.

For the mainnet path, copy `.env.example` to `.env.local` and fill in:

```bash
TATUM_API_KEY=
MEMWAL_KEY=
MEMWAL_ACCOUNT_ID=
MEMWAL_AGENT_ID=
MEMWAL_NAMESPACE=precedent
```

`MEMWAL_ACCOUNT_ID` is the `MemWalAccount` object ID, not the owner wallet. `MEMWAL_AGENT_ID` is the delegate public key.

For a resettable public deployment, set:

```bash
PRECEDENT_MODE=local
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

The demo still needs the public `MEMWAL_ACCOUNT_ID`, `MEMWAL_AGENT_ID`, and `TATUM_API_KEY` for `/proof`; it never needs `MEMWAL_KEY`.

## Verify the mainnet writes

```bash
npm run smoke:verify
```

This re-reads the account and delegate through Tatum, plus the pinned write when configured. The script exits non-zero if the record cannot be verified.

## Tests

```bash
npm test
npx tsc --noEmit
```

65 tests cover resolution, supersession chains, the Auditor, repository behaviour, the file allocator, and Tatum verification. The resolver is pure and deterministic; the memory boundary is a narrow interface so the same decision code runs against Walrus, Redis, or a test double.

## Structure

```text
src/core/          pure resolver, supersession, audit, wire format
src/memory/        Walrus, local, and Redis stores; repository
src/tatum/         typed Sui GraphQL client and verification
src/lib/           runtime, state assembly, demo script, decision log
src/app/           product UI, API routes, /proof
tests/             resolver, supersession, audit, repository, Tatum
```

## Notes

- Mainnet is append-only in the product. The UI refuses to delete a Walrus memory.
- The editable list and the decision log are separate from memory on purpose.
- The public demo is a separate store because a visitor cannot be allowed to append to the submission record.

## Credits

Product and editorial photography comes from free stock libraries:

- **Unsplash:** coffee bag, oat milk, paper filters, espresso pods, dish soap, coffee table, kitchen pantry.
- **Pexels:** olive oil (#16486887), paper towels (#3941873), grocery bag (#8900041).
- **Pixabay:** dishwasher tablets.
