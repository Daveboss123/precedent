/**
 * The scripted demo.
 *
 * This is the story from PLAN.md, executed against the real repository — not a
 * mock. Every precedent, supersession, outcome and audit finding written here
 * goes through the same code path as a live decision.
 *
 * The point is the pair of batches: the same eight candidates on Day 1 and
 * Day 12. Nothing about the world changes between them except memory.
 */

import type { Candidate, Charter } from '../core/types.ts';
import type { NewPrecedentInput } from '../memory/precedent-repo.ts';
import { writeCharter } from './charter.ts';
import type { Runtime } from './runtime.ts';

export const DEMO_CHARTER: Charter = {
  budgetPerMonth: 150,
  approvalAbove: 100,
  bannedCategories: ['subscription'],
  allowedVendors: [],
};

export const DEMO_CANDIDATES: Candidate[] = [
  {
    id: 'beans-restock',
    domain: 'coffee',
    item: 'House blend beans',
    vendor: 'Roaster A',
    category: 'beans',
    price: 18,
    recurring: true,
  },
  {
    id: 'oat-milk',
    domain: 'pantry',
    item: 'Oat milk',
    vendor: 'Green Grocer',
    category: 'dairy',
    price: 6,
    recurring: true,
  },
  {
    id: 'filters',
    domain: 'coffee',
    item: 'Paper filters',
    vendor: 'Green Grocer',
    category: 'filters',
    price: 9,
    recurring: true,
  },
  {
    id: 'pods',
    domain: 'coffee',
    item: 'Espresso pods',
    vendor: 'Roaster B',
    category: 'pods',
    price: 16,
    recurring: true,
  },
  {
    id: 'cleaning',
    domain: 'household',
    item: 'Grinder cleaning tablets',
    vendor: 'Vendor X',
    category: 'supplies',
    price: 12,
    recurring: false,
  },
  {
    id: 'monitor',
    domain: 'gear',
    item: '27 inch display',
    vendor: 'Vendor X',
    category: 'monitors',
    price: 320,
    recurring: false,
  },
  {
    id: 'streaming',
    domain: 'household',
    item: 'Streaming plan',
    vendor: 'Vendor Y',
    category: 'subscription',
    price: 12,
    recurring: true,
  },
  {
    id: 'beans-spike',
    domain: 'coffee',
    item: 'House blend beans',
    vendor: 'Roaster A',
    category: 'beans',
    price: 22,
    recurring: true,
    priceIncrease: 0.22,
  },
];

/**
 * What the user says on Day 1. The user never writes a rule; these are the
 * structured forms of six spoken answers.
 */
const RULES: NewPrecedentInput[] = [
  {
    domain: 'coffee',
    action: 'buy',
    trigger: 'routine restock',
    when: null,
    reason: 'House blend is the house standard. Buy it for the normal restock.',
    scope: ['beans'],
    confidence: 0.9,
  },
  {
    domain: 'coffee',
    action: 'switch_brand',
    trigger: 'price increase above 15%',
    when: { priceIncreaseAtLeast: 0.15 },
    reason: 'Above a 15% jump, switch to the cheaper roaster.',
    scope: ['beans'],
    confidence: 0.9,
  },
  {
    domain: 'pantry',
    action: 'buy',
    trigger: 'routine restock',
    when: null,
    reason: 'Oat milk is a staple. Buy the usual.',
    scope: ['oat milk'],
    confidence: 0.85,
  },
  {
    domain: 'coffee',
    action: 'buy',
    trigger: 'routine restock',
    when: null,
    reason: 'Filters are cheap. Keep a spare box.',
    scope: ['filters'],
    confidence: 0.85,
  },
  {
    domain: 'coffee',
    action: 'buy',
    trigger: 'guests',
    when: null,
    reason: 'Pods are for guests. Keep one box.',
    scope: ['pods'],
    confidence: 0.8,
  },
  {
    domain: 'household',
    action: 'buy',
    trigger: 'grinder maintenance',
    when: null,
    reason: 'Cleaning tablets every other month.',
    scope: ['cleaning tablets'],
    confidence: 0.8,
  },
];

export async function runDemo(rt: Runtime): Promise<void> {
  await rt.clear();
  await writeCharter(DEMO_CHARTER);

  const logBatch = async (phase: string): Promise<void> => {
    for (const candidate of DEMO_CANDIDATES) {
      const decision = await rt.repo.resolveCandidate(candidate, DEMO_CHARTER);
      await rt.log.append({
        phase,
        candidate,
        action: decision.action,
        cause: decision.cause,
        cited: decision.cited,
      });
    }
  };

  // Day 1: no precedents. Every candidate is a question, except the charter
  // block and the high-stakes threshold.
  await logBatch('Day 1');

  for (const rule of RULES) {
    await rt.repo.create(rule);
  }

  // A first pass so the Auditor has a chance to flag any Day-1 contradiction.
  await rt.repo.audit();

  // Day 12: same world, same candidates, different memory.
  await logBatch('Day 12');

  // What actually happened. Four deliveries held up; the cheaper beans did not.
  for (const candidate of DEMO_CANDIDATES) {
    const decision = await rt.repo.resolveCandidate(candidate, DEMO_CHARTER);
    if (decision.action !== 'act') continue;

    const returned = candidate.id === 'beans-spike';
    await rt.repo.recordOutcome({
      candidateId: candidate.id,
      precedentIds: decision.cited,
      result: returned ? 'returned' : 'accepted',
      note: returned
        ? 'The cheaper beans were too acidic.'
        : 'Delivered as expected.',
    });
  }

  // The reversal. This is the beat the whole product exists for.
  await rt.repo.observe(
    'The cheaper roaster the agent switched to was too acidic. Pay the premium and stay with Roaster A.',
  );

  await rt.repo.supersede(2, {
    action: 'buy',
    reason:
      'Pay the premium and stay with Roaster A. The cheaper beans were too acidic.',
    when: { priceIncreaseAtLeast: 0.15 },
  });

  const spike = DEMO_CANDIDATES.find((candidate) => candidate.id === 'beans-spike');
  if (spike) {
    const decision = await rt.repo.resolveCandidate(spike, DEMO_CHARTER);
    await rt.log.append({
      phase: 'After reversal',
      candidate: spike,
      action: decision.action,
      cause: decision.cause,
      cited: decision.cited,
    });
  }

  // The Auditor's second act: a new general rule contradicts #1. The specific
  // rule #7 is not a contradiction — it governs by being narrower.
  await rt.repo.create({
    domain: 'coffee',
    action: 'defer',
    trigger: 'budget tightening',
    when: null,
    reason: 'Hold off on beans this month.',
    scope: ['beans'],
    confidence: 0.85,
  });

  await rt.repo.audit();
}
