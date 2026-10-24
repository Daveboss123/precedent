# Total Recall — Build Plan
### Tatum × Walrus Memory Hackathon · Track 2: Smart Agents for Real Life

**Deadline:** Nov 10, 2026, 17:00 UTC · **Today:** Oct 24 → 17 days
**Working name:** Precedent (alternates at the bottom)
**One line:** An agent that remembers your rules — and cites them before it spends your money.
**Version:** 1.1 (Oct 24) — merged the external review. See §18 for what changed and why.

---

## 0. The pitch, in three lengths

**10 words**
Memory is the permission system, not the chat log.

**One sentence**
Precedent is a purchasing agent that never writes its own rules: every decision you approve, reject, or reverse becomes a remembered *precedent*, and the agent's autonomy is earned one precedent at a time.

**One paragraph**
Personal agents can spend your money but can't remember your rules, so you either babysit them or get burned. Precedent fixes that by treating memory as governance. You give it a budget and a few goals. It researches and proposes purchases. Every approval, rejection, and reversal is written to Walrus Memory as a structured precedent — situation, action, reason, scope, confidence. Before acting again it recalls the relevant precedents and either follows them, cites an exception, or asks. When an outcome contradicts a precedent, the old one is *superseded* by a new one. The number that matters is autonomy: decisions taken without asking, at a stable approval rate. It starts near zero and climbs.

---

## 1. Why this wins on their rubric

| Criterion | Weight | How this scores |
|---|---|---|
| Walrus + Tatum integration | 30% | Memory is load-bearing. Delete it and the agent has no authority to act — autonomy goes to 0. Uses all four ops (remember/recall/analyze/ask), deliberate namespaces, delegate-key scoping, and onchain verification via Tatum RPC. |
| Technical quality | 30% | Small surface area: one decision pipeline with a deterministic resolution order, a policy engine that is unit-testable without an LLM, and clean separation between memory, catalog, and UI. |
| Creativity | 20% | "Memory as case law" is a framing nobody else will use. Memory that *revises itself* (supersession) is rarer still. |
| Presentation | 20% | A single chart — autonomy rising while approval holds — plus a demo where the second session is visibly different from the first. |

**The sentence that wins the Best Walrus Memory award:** *"Our memories have precedential authority. The agent cannot act outside them, and it can overturn them when reality disagrees."*

**Weighting discipline (important).** 60% of the score is integration + technical quality. Presentation is 20%. Do not let the demo's visual polish eat the build — a beautiful ledger with shallow memory loses to an ugly ledger with real supersession. Polish is a day-16 activity, not a day-4 one.

---

## 2. The idea, precisely

### What it is not

It is **not a rules engine**. A rules engine is *configured* — a human writes the rules. In Precedent, the user never writes a rule. They answer questions, and the agent writes the rule. Rules are natural language, semantically recalled, scoped, and allowed to conflict. That distinction is the whole product, and it should be the first thing you say to a judge.

It is **not a chatbot**. There is no conversation as the primary interface. The primary interface is a *decision queue* and a *precedent ledger*.

### The four memory types

| Type | Namespace | Written when | Example | Recalled for |
|---|---|---|---|---|
| **Charter** | `charter` | Onboarding + explicit user edits | `budget: $120/mo · approval_above: $40 · banned: [subscriptions, extended warranties]` | Every decision, always |
| **Precedent** | `precedents:<domain>` | Every decision, immediately | `PRECEDENT domain:coffee action:switch_brand trigger:price_increase>15% reason:"taste fine, price isn't" scope:beans_not_pods conf:0.9` | Similar future decisions |
| **Observation** | `observations` | Extracted from free-text feedback via `analyze` | `attribute:brightness polarity:negative domain:monitor` | Filtering candidates |
| **Outcome** | `outcomes` | Days/weeks later, when reality lands | `precedent:19 result:returned reason:"too acidic"` | Superseding precedents |

Plus a restricted `finance` namespace (wallet state) that only the main agent can read.

### Why structured text, not prose

Memories get embedded and recalled by meaning. Compact structured strings keep recall precise and make the UI legible:

```
PRECEDENT | domain:coffee | action:switch_brand | trigger:price_increase>15%
| reason:"taste is fine, price isn't" | scope:beans, not pods | conf:0.9 | 2026-10-26
```

The UI can parse this back into chips: `domain: coffee`, `trigger: price ↑ >15%`, `conf: 0.9`.

---

## 3. The decision pipeline (the heart of the build)

Every candidate purchase runs the same six stages.

**1. Parse** — what is it, price, vendor, category, urgency, recurrence.

**2. Recall** — four parallel recalls against the four namespaces, query text including the domain so semantic search stays scoped.

**3. Resolve** — strict order. This is the product's spine:

| Condition | Action | What the user sees |
|---|---|---|
| Charter violation | **Block** — never ask | "Blocked: subscriptions are banned by your charter" |
| Matching precedent, high confidence | **Act**, cite it | "Switched brands — Precedent #7 (price ↑ >15%)" |
| Conflicting precedents | **Ask**, then record the resolution | "Two precedents disagree. Which wins?" |
| No precedent | **Ask**, then record | "First time I've seen this. Approve?" |

**4. Act** — buy, propose, defer, or pay (x402).

**5. Write** — the decision becomes a precedent *before* the outcome is known. This is important: the agent commits to its reasoning in public.

**6. Revise** — when an outcome arrives (kept / returned / regretted), write an `outcome` memory. If it contradicts the precedent, write a *new* precedent that **supersedes** the old one, with a link.

### Supersession is the demo

Most memory demos show accumulation. Yours shows **revision**. A visible chain:

```
#7  switch brands above +15%          (Oct 26)
 └─ superseded by
#19 never switch to house brands      (Nov 2, reason: returned, too acidic)
```

That single visual proves the loop is real, not decorative. It is also the strongest possible answer to "is this just a vector DB?"

### Autonomy, quantified

Two numbers, one chart:

- **Autonomy** = decisions taken without asking ÷ total decisions
- **Approval rate** = approved ÷ decisions acted on

The target shape is autonomy climbing from ~10% to ~75% while approval stays above 90%. If autonomy rises and approval falls, the agent is learning the wrong thing — and saying that out loud in the blog post shows you understand the failure mode.

Also expose **confidence** per decision, derived from how many precedents matched and how strongly. Low confidence → ask. This makes the act/ask boundary legible instead of arbitrary.

---

## 4. The two surfaces (the portability demo)

Walrus Memory's thesis is memory that follows you across tools. Most teams will build one web app. Build two.

**Surface A — Web ledger (Next.js)**
- Charter editor
- Decision queue (pending / auto-approved / blocked), with the Auditor's findings inline
- **Precedent timeline rendered as a git-style branch graph** — supersession reads as a fork, not a list. Clickable nodes, each with its own onchain badge. (React Flow view is a stretch goal for day 12+, not the primary artifact.)
- Autonomy dashboard
- Memory drawer (searchable, deletable — trust matters)
- Auditor panel: proactive findings + Q&A

**Surface B — Telegram bot**
- The "in the moment" surface
- Push: "Coffee is +18%. Precedent #7 says switch above 15%. Switching to X — reply NO to override."
- One tap approves or rejects from a phone
- Same namespace, same memory, instant effect

**The 15-second demo beat:** approve in Telegram → open the web app → the new precedent is there, with a fresh onchain verification badge. That sequence is the product thesis, filmed.

---

## 5. Tatum integration (three layers, one of them the differentiator)

**Layer 1 — Verify memory onchain (the on-thesis move)**
After every `remember()`, fetch the Walrus object/blob via Tatum's Sui GraphQL gateway (`https://sui-mainnet.gateway.tatum.io/graphql`, `x-api-key`). Confirm existence, capture the object ID and checkpoint/epoch, and surface a **clickable "verified onchain" badge** that opens the object in SuiVision or SuiScan. Hovering shows the checkpoint number. Store the verification result as memory metadata.

Rules: the link must resolve to a real object before you film; a dead explorer link is worse than no link. And the badge must be *live* — if verification fails, it says so rather than silently hiding.

Why this matters: verifiability is one of Walrus Memory's four pillars, and you're using Tatum's RPC to prove their partner's product works. It hits both 30% buckets with one feature, and almost nobody will do it.

**Layer 2 — Real wallet state**
The agent's spending budget is read from chain, not from a local variable: balance and recent transfers via Tatum RPC. The charter's budget cap is enforced against onchain truth.

**Layer 3 — x402 payments (the $500 award) — now a first-class demo beat**
The agent pays for the premium data it needs to make a decision (a vendor price-history feed) using x402 on Sui. The receipt attaches to the precedent that used the data: **payment with provenance** — the receipt explains why the agent spent, not just that it did. The demo beat is: agent hits a paywall → 402 → pays → decision improves → receipt visible on the precedent.

**Receipt abstraction (build this before you build x402).** Every payment produces a normalized `Receipt` record: `{ id, rail, amount, asset, payee, txDigest, objectId, verifiedAt, explorerUrl }`. The UI renders `Receipt`, never the rail. That way the fallback — a direct Sui transfer with a receipt object — drops in without touching the UI, the demo script, or the blog post.

**Commitment:** commit to the *story* (agent pays for its own inputs, provably), not the *protocol*. Ask in Discord on day 1 whether they recommend a specific Sui x402 facilitator or SDK — that single question de-risks the whole track.

**Hard cutoff: Nov 3.** If x402 isn't settling by then, switch the rail to the fallback and move on. Do not trade a $1,500 track placement for a $500 bonus.

---

## 6. Scoped delegation: the Auditor (two modes, one credential boundary)

Create a second agent with a **delegate key** that has read-only access to `precedents` and `observations` but **no access to `finance`**.

**Mode 1 — Proactive critic (the differentiator).** After every new precedent is written, the Auditor compares it against existing precedents and the charter. If it finds a contradiction — "Precedent #19 contradicts #7 on brand switching, and #7 is still marked active" — it writes an **audit finding** to memory and surfaces it inline in the decision queue, *before* the user notices.

Findings are memories too. That closes the loop: the Auditor's findings can themselves trigger a supersession, which means the system's memory is being revised by an agent that cannot see the wallet. That's a genuinely novel structure, and it's demonstrable in ten seconds.

**Mode 2 — Q&A with a hard boundary.** "Why did you buy this?" → answered with citations. "What's my balance?" → refuses, because it can't see `finance`.

**Scope discipline:** contradiction detection on the pending queue only. Do not build a general multi-agent orchestration layer — two LLM calls dressed as a committee reads as theater, costs days, and judges can tell. The credibility comes from the *credential boundary*, not the agent count.

This is cheap to build (a second SDK client with different credentials) and it demonstrates programmable permissions, which is the part of Walrus Memory nobody else will touch.

---

## 7. Namespace design

```
acct_<user>
├── charter                 hard rules, always recalled
├── precedents:household    decisions, scoped by domain
├── precedents:fitness      ...
├── observations            durable facts (sizes, brands, tastes)
├── outcomes                keep/return/regret signals
└── finance                 wallet state — main agent only
```

Rules of thumb:
- Recall is per **account + namespace**, so every extra namespace is an extra call. Keep it to ~5.
- Include the domain in the query string; semantic search alone will happily return the wrong domain.
- Post-filter by the `domain:` prefix before passing to the resolver.

---

## 8. Tech stack

| Piece | Choice | Note |
|---|---|---|
| App | Next.js 15 + TypeScript, Tailwind + shadcn | Fast UI, deploy on Vercel |
| Memory | `@mysten-incubation/memwal` | **Pin Node 22.23.4+** — the SDK requires it |
| Relayer | `https://relayer.memory.walrus.xyz` | Production/mainnet, not staging |
| Onchain reads | Tatum Sui GraphQL + `x-api-key` | `sui-mainnet.gateway.tatum.io/graphql` |
| Bot | `grammy` (Telegram) | Shares the same memory client |
| Local state | SQLite/Postgres | Catalog cache + job queue **only** — never let this become the memory |
| Payments | x402 client + paid endpoint | Fallback: Sui transfer + receipt |
| Deploy | Vercel (web) + Railway/Fly (bot + cron) | |

Env: `MEMWAL_KEY`, `MEMWAL_ACCOUNT_ID`, `MEMWAL_NAMESPACE`, `TATUM_API_KEY`, `TELEGRAM_TOKEN`.

---

## 9. The domain decision (pick this on day 1)

The agent needs a concrete purchasing domain. This choice affects how serious judges think the product is.

| Domain | Pros | Cons |
|---|---|---|
| **Coffee / groceries restock** | Charming, universally understood, easy demo, frequent decisions | Can read as toy-like |
| **Home office gear** | Real money, real stakes, judges relate | Fewer decisions → slower learning curve |
| **Running shoes / fitness gear** | Replacement cycles are a natural memory loop (wear, fit, returns) | Narrow |
| **Household + gear hybrid** | Best of both: frequent small decisions + occasional big ones | Slightly fuzzier pitch |

**Recommendation:** household restock as the *frequent* loop, gear replacement as the *high-stakes* loop. The demo uses coffee for speed and a monitor for consequence.

---

## 10. Demo script (2:30)

| Time | Beat |
|---|---|
| 0:00 | **Problem.** "Agents can spend your money but can't remember your rules. So you babysit them, or you get burned." |
| 0:15 | **Day 1.** Ask it to restock coffee. It asks three questions. You answer. Three precedents appear in the ledger. |
| 0:40 | **Day 12.** Price spikes. Telegram pings: "Precedent #7 says switch above 15%." One tap. Web app shows the new precedent with a verified-onchain badge — click it, it opens on SuiVision. |
| 1:05 | **The payment.** The agent needed a price-history feed, hit a 402, paid via x402 on Sui, and the receipt is attached to the precedent that used the data. |
| 1:25 | **The reversal.** You return the beans — too acidic. `analyze` extracts the fact, Precedent #7 is superseded by #19. The timeline forks on screen. |
| 1:45 | **The Auditor.** It flags the contradiction between #7 and #19 before you do — and it still can't see your wallet. |
| 2:05 | **Stack.** Walrus Memory mainnet · Tatum RPC verification · scoped delegation. |
| 2:15 | **The number.** Autonomy 12% → 78%, approval 94%. "It earned its autonomy." |

Non-negotiable: **session 1 learns, session 2 behaves differently.** If the video doesn't show that, you haven't shown memory.

---

## 11. Blog post outline

**Title:** *Memory as case law: building an agent that earns autonomy*

1. The agent trust gap — too autonomous or too needy
2. Why memory isn't context — the delete test (remove memory → autonomy 0)
3. The precedent model: schema, namespaces, resolution order
4. Supersession: memory that revises itself
5. Portability: one namespace, two surfaces (screenshots)
6. Verifying memory onchain with Tatum — the actual RPC calls
7. Scoped delegation: the auditor that can't see your balance
8. The numbers: autonomy and approval over 17 days
9. What failed, what I'd change (judges reward this)
10. Links

Include a table of **real memory examples** — verbatim strings from the ledger. It's the most convincing artifact you can put in a post.

---

## 12. Risk register

| Risk | Mitigation |
|---|---|
| x402 on Sui is immature | Hard cutoff Nov 3. `Receipt` abstraction built first, so the rail swaps without touching UI, demo, or post. |
| Auditor becomes scope creep | Contradiction detection on the pending queue only. No orchestration layer. |
| Supersession graph turns into a hairball | Git-style timeline is the primary artifact; React Flow is a stretch goal. |
| Telegram latency looks bad on camera | Pre-warm the decision before the tap; measure the real number; report it, don't promise "under 3s". |
| Telegram + web race conditions | Every decision gets an ID; writes are idempotent |
| Recall returns wrong-domain memories | Domain in query + post-filter on `domain:` prefix |
| Memory bloat over 100+ writes | `analyze` compresses old precedents into observations; cap the ledger |
| `remember()` is async | Always `await waitForRememberJob(job_id)` before recall |
| Wrong relayer / namespace | Mainnet URL, own account ID — assert both at boot |
| Dead explorer link in the demo | Click every badge before filming |
| Demo fragility | Pre-seeded demo account + recorded video on day 16 |
| Judges see "just a rules engine" | Lead with "the user never writes a rule" |
| Spectacle eats the build | Polish is a day-16 activity; integration and tests come first |

---

## 13. 17-day plan

| Day | Work |
|---|---|
| 1 | Memory spike on mainnet: remember → wait → recall → analyze. Write the schema doc. |
| 2 | Decision pipeline + resolution order + unit tests against fake memories |
| 3 | Web shell: charter + decision queue |
| 4 | Catalog mock + propose/approve loop end-to-end |
| 5 | Precedent writing + citation chips in UI |
| 6 | Outcome capture + supersession chain |
| 7 | Autonomy dashboard + memory drawer |
| 8 | Tatum onchain verification + clickable explorer badge |
| 9 | `Receipt` abstraction + Telegram surface on the same namespace |
| 10 | x402 rail wired against the abstraction, fallback ready — **hard cutoff Nov 3** |
| 11 | Auditor: scoped delegate key, proactive contradiction detection, Q&A |
| 12 | Supersession branch graph + polish: empty states, errors, seed 100+ memories |
| 13 | Tests, README, `.env.example`, one-command run |
| 14 | Demo video draft |
| 15 | Blog post draft |
| 16 | Final video, screenshots, form prep (Tatum account ID + `MEMWAL_AGENT_ID`) |
| 17 (Nov 9) | **Submit.** Nov 10 is buffer. |

---

## 14. Submission checklist

- [ ] Walrus Memory writing on **mainnet**, 10+ memories (target 100+)
- [ ] Tatum RPC used meaningfully (verification + wallet + x402)
- [ ] Blog post published
- [ ] 2–3 min demo video
- [ ] Public repo with README, architecture diagram, `.env.example`
- [ ] Submission form: Tatum dashboard account ID, `MEMWAL_AGENT_ID`
- [ ] Post on X + LinkedIn, tag @Tatum_io and @WalrusFoundation
- [ ] Discord office hours: introduce the project, ask what "meaningful" means

---

## 15. Prompt pack (copy-paste)

### A. Red-team the concept
> You are a judge at the Tatum × Walrus Memory hackathon. Scoring: 30% Walrus+Tatum integration, 30% technical quality, 20% creativity, 20% presentation. Here is my project: [paste section 0 and 3]. Give me the three harshest objections you would raise in deliberation, the exact sentence I should say to defuse each, and the one feature that would most raise my integration score. Be blunt.

### B. Design the memory schema
> I'm building an agent whose memory acts as a permission system. Memory ops available: remember (semantic write), recall (semantic query), analyze (extract structured facts from text), ask (RAG answer). Scoping is per account+namespace. Propose a memory schema: types, namespaces, the exact string format for each type, what triggers a write, what a recall changes in the UI, and how to handle conflicts and supersession. Optimize for precise semantic recall and human-readable UI chips.

### C. Write the resolution order
> Here is my decision pipeline: [paste]. Write the resolution algorithm as pseudocode with explicit tie-breakers, confidence scoring, and idempotency. Include the edge cases: two precedents of equal confidence that disagree, a charter rule that contradicts a precedent, a stale precedent older than 90 days, and an outcome that arrives before the precedent is written. Then write the unit tests.

### D. Sharpen the demo
> Here is my 2:30 demo script: [paste]. Cut it to the strongest 90 seconds. For each beat, tell me what must be visible on screen and what the voiceover says. Identify the single beat that, if it fails on camera, ruins the submission, and tell me how to make it bulletproof.

### E. Blog post
> Write a technical blog post titled "Memory as case law: building an agent that earns autonomy." Voice: engineer writing for engineers, no marketing fluff, first person. Cover: why memory isn't context, the precedent schema, the resolution order, supersession, portability across two surfaces, verifying memory onchain via Sui RPC, and what failed. 1,400 words. Use a table of real memory examples. End with repo and demo links.

### F. Judge simulation
> Score my submission out of 100 using this rubric: 30% integration, 30% technical, 20% creativity, 20% presentation. Here is my README, blog post, and demo transcript: [paste]. Give me a per-criterion score with justification, the highest-leverage fix for each, and a realistic rank out of 15 entrants in my track.

### G. Naming and positioning
> My product is a purchasing agent that remembers your rules as precedents and cites them before spending. Generate 15 names that sound like governance or law rather than AI. For the top 3, write a one-line tagline and the first sentence of the landing page. Avoid anything with "AI", "GPT", "smart", or "copilot".

### H. Failure modes
> My agent learns purchasing rules from user approvals and rejections. List 12 ways this learning loop produces confidently wrong behaviour over time, ranked by how likely a judge would notice in a 3-minute demo. For each, give a cheap safeguard I can implement in under a day.

---

## 16. Names

| Name | Why |
|---|---|
| **Precedent** | Past decisions constrain future ones. Instantly explains the product. |
| **Charter** | The user's constitution; the agent can't exceed it. |
| **Mandate** | Authority granted, and revocable. |
| **Steward** | Someone who acts on your behalf, with care. |
| **Bailiff** | Enforces the rules. Slightly playful. |

Recommendation: **Precedent**, with "Your agent's memory is its case law" as the tagline.

---

## 17. Open decisions

1. **Domain** — coffee/household vs home-office gear vs hybrid (see §9)
2. **x402** — chase the $500 or protect the timeline?
3. **Solo or team** — if two people: one on pipeline + memory, one on UI + demo
4. **Name** — Precedent vs Charter
5. **LLM for analysis** — `analyze`/`ask` are built in; do you also need a model for parsing free-text feedback, or can `analyze` cover it?

---

## 18. What changed in v1.1 (and why)

Merged from the external deep-dive review. Four adopted, one modified, one rejected.

**Adopted**
1. **Auditor becomes a proactive critic** (§6) — it audits new precedents against existing ones and writes findings to memory, instead of only answering questions. This is the strongest idea in the review. Bounded to the pending queue to protect the timeline.
2. **Supersession rendered as a graph** (§4) — git-style branch timeline first, React Flow as a stretch goal.
3. **Onchain badge is interactive** (§5) — links to SuiVision/SuiScan, shows checkpoint, must resolve before filming.
4. **x402 promoted to a first-class demo beat** (§5) — with a `Receipt` abstraction built first so the rail can swap.

**Modified**
5. **Telegram "under 3 seconds"** — dropped as a promise. Pre-warm the decision, measure the real latency, report it in the post.

**Rejected**
6. **"Prioritize spectacle / hit every bonus bounty."** The rubric is 30/30/20/20 — sixty percent is integration and code quality, and the entire bonus pool is $1,500. Visual polish is a day-16 activity. x402 gets a hard cutoff of Nov 3.

**Corrections to the review**
- It describes the AI Builder award as requiring "heavy reliance on Tatum RPC." It doesn't — that award is for building primarily with ai.tatum.io. Different thing, different $500.
- Its competitor analysis (Memorus, Rocky, FetchFund, DAOGenie) is unverified and none are winners of this hackathon. Treat as directional, not evidence.

**Gaps in the review that this plan already covers**
The delete test, `analyze` as the engine of supersession, namespace scoping, the autonomy metric, the "user never writes a rule" defense, and the submission mechanics (`MEMWAL_AGENT_ID`, mainnet relayer, `waitForRememberJob`, 10-memory floor).

---

*Last updated: Oct 24, 2026 · v1.1*
