/** Shared caption chunker. Whole sentences stay intact; long ones break at a clause edge. */

const CAPTION_MAX = 100;
const CAPTION_MIN_SECONDS = 1.1;

const BREAKS = [
  { token: ' that ', keep: 'right' },
  { token: ' which ', keep: 'right' },
  { token: ' because ', keep: 'right' },
  { token: ' while ', keep: 'right' },
  { token: ' when ', keep: 'right' },
  { token: ' and ', keep: 'right' },
  { token: ' but ', keep: 'right' },
  { token: ' so ', keep: 'right' },
  { token: ', ', keep: 'left' },
  { token: ': ', keep: 'left' },
  { token: '; ', keep: 'left' },
];

function splitSentences(text) {
  return text
    .match(/[^.!?]+[.!?]+(?:["'”’])?|[^.!?]+$/g)
    ?.map((sentence) => sentence.trim())
    .filter(Boolean) ?? [text];
}

/** Where the right-hand chunk begins, keeping the clause word or the punctuation intact. */
function cutAt(sentence, { keep }, at) {
  let cut = at + 1;
  if (keep === 'left') {
    while (sentence[cut] === ' ') cut += 1;
  }
  return cut;
}

function splitLongSentence(sentence) {
  if (sentence.length <= CAPTION_MAX) return [sentence];

  const middle = sentence.length / 2;
  let best = null;
  for (const breakpoint of BREAKS) {
    let at = sentence.indexOf(breakpoint.token);
    while (at !== -1) {
      const cut = cutAt(sentence, breakpoint, at);
      const score = Math.abs(cut - middle);
      if (!best || score < best.score - 3) best = { cut, score };
      at = sentence.indexOf(breakpoint.token, at + 1);
    }
  }

  if (!best) {
    const at = sentence.lastIndexOf(' ', CAPTION_MAX);
    best = { cut: at > 0 ? at : CAPTION_MAX, score: 0 };
  }

  const { cut } = best;
  if (cut <= 0 || cut >= sentence.length) return [sentence];

  const left = sentence.slice(0, cut).trim();
  const right = sentence.slice(cut).trim();
  if (!left || !right) return [sentence];

  return [...splitLongSentence(left), ...splitLongSentence(right)];
}

export function splitCaptions(text) {
  return splitSentences(text).flatMap(splitLongSentence).filter(Boolean);
}

/** Join brief cues to a neighbour instead of flashing a single word on screen. */
function mergeBriefCues(cues) {
  const merged = [];
  for (let index = 0; index < cues.length; index++) {
    const cue = { ...cues[index] };
    while (cue.end - cue.start < CAPTION_MIN_SECONDS && index + 1 < cues.length) {
      const next = cues[index + 1];
      if (`${cue.text} ${next.text}`.length > CAPTION_MAX) break;
      cue.text = `${cue.text} ${next.text}`;
      cue.end = next.end;
      index += 1;
    }

    const previous = merged.at(-1);
    if (cue.end - cue.start < CAPTION_MIN_SECONDS && previous && `${previous.text} ${cue.text}`.length <= CAPTION_MAX) {
      previous.text = `${previous.text} ${cue.text}`;
      previous.end = cue.end;
    } else {
      merged.push(cue);
    }
  }
  return merged;
}

/** Cue times scale with spoken words so the whole scene keeps its existing narration span. */
export function timeCaptions(chunks, lead, spokenDuration) {
  const weight = chunks.reduce((sum, chunk) => sum + chunk.split(/\s+/).length, 0);
  let current = lead;
  const cues = chunks.map((text, index) => {
    const seconds = spokenDuration * text.split(/\s+/).length / weight;
    const end = index === chunks.length - 1 ? lead + spokenDuration : current + seconds;
    const cue = { text, start: current, end };
    current = end;
    return cue;
  });
  return mergeBriefCues(cues);
}

export function stamp(seconds) {
  const ms = Math.round(seconds * 1000);
  return `${String(Math.floor(ms / 3600000)).padStart(2, '0')}:${String(Math.floor(ms / 60000) % 60).padStart(2, '0')}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')},${String(ms % 1000).padStart(3, '0')}`;
}
