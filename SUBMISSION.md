# Submission

**Tatum × Walrus: Total Recall, Track 2**

**Project:** Precedent  
**Tagline:** The weekly shop, handled. No weekly debate.

## Links

- **Live demo:** https://precedent-household.vercel.app
- **The record:** https://precedent-household.vercel.app/proof
- **Source:** https://github.com/Daveboss123/precedent
- **Write-up:** https://davee0x.substack.com/p/the-memory-is-the-case-law-building
- **Full demo (2:28):** https://precedent-household.vercel.app/video/precedent-demo.mp4
- **Short demo (0:55):** https://precedent-household.vercel.app/video/precedent-55s.mp4

## What it is

Precedent is a household replenishment agent whose memory is its case law. It learns the rules a household already uses, cites the governing rule before it spends money, stops when two live rules conflict, and keeps the losing rule on the record when it is overruled.

The product is a reorder ledger, not a chat window. Every decision is sorted into handled, needs you, or blocked, and every handled decision names the precedent behind it. Corrections create a supersession record instead of deleting history.

## The 60-second path

1. Open the ledger and find the coffee conflict under **Needs you**.
2. Answer it. The basket clears and the audit records the ruling.
3. Open **The record** and press **Check again** to verify the mainnet account and delegate through Tatum.

## Walrus Memory

- **Network:** Sui mainnet
- **Namespace:** `precedent`
- **Memories:** 20
- **MemWal account:** `0x9ed016de2fbfa51d73363495e7158e40f8761a0c253c9198c430423d624f6d55`
- **Delegate:** `43d54a89a0aadd1a1ef32233c86e14347a87afc1b109ff0cbacc700ca9c276ca`

The record holds rules, supersessions, outcomes, observations, and audit findings. The public demo writes to a separate, resettable store so visitors do not append to the submitted record.

## Tatum

`/proof` verifies the MemWal account and the registered delegate through Tatum's Sui GraphQL gateway:

`https://sui-mainnet.gateway.tatum.io/graphql`

The latest check on 29 October 2026 returned `verified` at checkpoint `339239284`. Results are cached for 60 seconds and shared between concurrent requests to stay inside the free plan's rate limit.

## Checks

- `npm test`: 73 of 73 passing
- `npx tsc --noEmit`: clean
- `npm run build`: clean
- Production `/`, `/ledger`, and `/proof`: no horizontal overflow at 390px or 768px
- Both films: 1920×1080, 30fps, H.264/AAC stereo, captions included, faststart

No keys or secrets are stored in the repository. The demo reads its public Walrus account, delegate, and Tatum credentials from environment variables.
