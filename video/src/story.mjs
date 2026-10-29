/** All editable timing and narration lives here. Both cuts use the same scenes. */
export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;

export const LINKS = {
  demo: 'https://precedent-household.vercel.app',
  proof: 'https://precedent-household.vercel.app/proof',
  source: 'https://github.com/Daveboss123/precedent',
};

export const SCENES = [
  { id: 'problem', label: 'The problem' },
  { id: 'introduce', label: 'Meet Precedent' },
  { id: 'experience', label: 'Learning from experience' },
  { id: 'conflict', label: 'One answer becomes a ruling' },
  { id: 'proof', label: 'The verifiable record' },
  { id: 'closing', label: 'A record, not another debate' },
];

const long = [
  {
    seconds: 14,
    text: 'The weekly shop is full of decisions you have already made. Which coffee? When is the premium worth it? What if your AI remembered why it got something wrong?',
  },
  {
    seconds: 21,
    text: 'Meet Precedent, a household replenishment agent. Your shopping rules, remembered. Add the things you buy again and again. The dashboard separates what is handled, what needs you, and what is blocked. Each decision carries the rule behind it. This is a demo, not a checkout.',
  },
  {
    seconds: 34,
    text: 'Here is the coffee story from the recorded demo. A twenty-two percent price increase triggers rule two: switch to the cheaper roaster. But the recorded return says the beans were too acidic. The correction becomes rule seven: pay the premium and stay with Roaster A. The new rule supersedes the old one, without erasing it. Next time the price jumps, the agent follows the correction and remembers why. In the same eight-item replay, routine autonomy rises from zero to eighty-six percent.',
  },
  {
    seconds: 39,
    text: 'Memory also needs a way to handle disagreement. Rule one says to buy the house blend. Rule eight says to hold off on beans. Both apply to the same restock. Precedent pauses instead of silently guessing. Here is the real interface: buy it, then explain why. The answer becomes rule nine. It overrules the conflicting skip rule, while rule one stays active as supporting history. The basket now cites the new rule, and the audit has no unresolved conflicts. Learning is a visible change in the record, not a hidden change to a prompt.',
  },
  {
    seconds: 26,
    text: 'The public sandbox and the mainnet record are separate. Walrus Memory holds twenty recorded memories on Sui mainnet. Tatum provides the GraphQL gateway used to check that the account is active and the configured delegate is registered. This is an actual saved result from the live proof page. It verifies the account and delegate, not every individual memory transaction.',
  },
  {
    seconds: 14,
    text: 'The weekly shop should not require a weekly debate. It should require a record. Precedent: written in your words, cited before it acts, superseded rather than erased. Try the demo and inspect the proof.',
  },
];

const short = [
  {
    seconds: 7,
    text: 'What if your AI remembered why it got something wrong? Same shopping list. Fewer repeated decisions.',
  },
  {
    seconds: 11,
    text: 'Meet Precedent. Your shopping rules, remembered. It separates what is handled, what needs you, and what is blocked. Every decision carries its rule.',
  },
  {
    seconds: 11,
    text: 'Cheaper coffee. Too acidic. The correction becomes a new rule. Pay the premium, keep the original record, and remember why next time.',
  },
  {
    seconds: 10,
    text: 'Two rules disagree? It pauses and asks. One answer resolves the conflict. The new rule governs; the old one stays on the record.',
  },
  {
    seconds: 9,
    text: 'Walrus stores the history. Tatum checks the mainnet account and delegate. This is a captured result from the real proof page.',
  },
  {
    seconds: 7,
    text: 'The weekly shop should not require a weekly debate. It should require a record. Precedent.',
  },
];

export const VERSIONS = { long, short };

export function timeline(version = 'long') {
  let from = 0;
  return SCENES.map((scene, index) => {
    const beat = VERSIONS[version][index];
    const durationInFrames = beat.seconds * FPS;
    const entry = { ...scene, ...beat, from, durationInFrames };
    from += durationInFrames;
    return entry;
  });
}

export const duration = (version) => timeline(version).reduce((sum, entry) => sum + entry.durationInFrames, 0);

/** A source clip can play faster, then freeze. It never runs past its end. */
export function mediaTiming({ startMs, endMs, durationInFrames, playbackRate, fps = FPS }) {
  const rate = playbackRate ?? 1;
  const sourceFrames = Math.max(1, Math.floor((endMs - startMs) / 1000 * fps));
  return {
    trimBefore: Math.max(0, Math.floor(startMs / 1000 * fps)),
    playbackRate: rate,
    playFrames: Math.min(durationInFrames, Math.max(1, Math.floor(sourceFrames / rate))),
  };
}

/** Sample captured mouse tracks deterministically at the source video time. */
export function cursorAt(samples, timeMs) {
  if (!samples.length || timeMs < samples[0].t) return null;
  let low = 0;
  let high = samples.length - 1;
  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    if (samples[mid].t <= timeMs) low = mid;
    else high = mid - 1;
  }
  const a = samples[low];
  const b = samples[low + 1];
  if (!b) return a;
  const t = Math.min(1, Math.max(0, (timeMs - a.t) / (b.t - a.t || 1)));
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}
