import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { splitCaptions, stamp, timeCaptions } from '../src/captions.mjs';
import { FPS, timeline } from '../src/story.mjs';

const squash = (text) => text.replace(/\s+/g, ' ').trim();

test('whole sentences stay intact when they fit', () => {
  assert.deepEqual(splitCaptions('Two rules disagree? It pauses and asks.'), [
    'Two rules disagree?',
    'It pauses and asks.',
  ]);
});

test('long clause splits preserve connecting words and punctuation', () => {
  for (const token of ['that', 'which', 'because', 'while', 'when', 'and', 'but', 'so']) {
    const text = `The household has already recorded a clear shopping preference ${token} the next basket should follow that preference instead of making the same decision again.`;
    const chunks = splitCaptions(text);
    assert.ok(chunks.length > 1);
    assert.equal(squash(chunks.join(' ')), text);
    assert.ok(chunks.every((chunk) => chunk.length <= 100));
  }

  const text = 'The answer becomes a new rule: the original record remains available, the correction governs the basket; nothing has been erased from the household history.';
  assert.equal(squash(splitCaptions(text).join(' ')), text);
});

test('long sentences without clause markers split at a word boundary', () => {
  const text = `${'Recorded shopping preferences help future household decisions '.repeat(4).trim()}.`;
  const chunks = splitCaptions(text);
  assert.ok(chunks.every((chunk) => chunk.length <= 100));
  assert.equal(squash(chunks.join(' ')), text);
});

test('brief opening cues merge forward without changing their spoken span', () => {
  const cues = timeCaptions(['Cheaper coffee.', 'Too acidic.', 'The correction becomes a new rule.'], 0.35, 5);
  assert.equal(cues[0].text, 'Cheaper coffee. Too acidic.');
  assert.equal(cues[0].start, 0.35);
  assert.equal(cues.at(-1).end, 5.35);
});

test('a brief final cue merges backward without moving the end', () => {
  const cues = timeCaptions(['It should require a record.', 'Precedent.'], 0.35, 2.4);
  assert.equal(cues.length, 1);
  assert.equal(cues[0].text, 'It should require a record. Precedent.');
  assert.equal(cues[0].end, 2.75);
});

test('empty narration produces no captions', () => {
  assert.deepEqual(splitCaptions(''), []);
  assert.deepEqual(timeCaptions([], 0.35, 0), []);
});

test('SRT timestamps round milliseconds and carry across seconds', () => {
  assert.equal(stamp(59.9996), '00:01:00,000');
  assert.equal(stamp(3661.025), '01:01:01,025');
});

test('both cuts preserve every narrated word and readable, contiguous cue spans', async () => {
  const manifest = JSON.parse(await readFile(new URL('../public/audio/audio.json', import.meta.url), 'utf8'));
  assert.equal(manifest.voiced, true);
  assert.equal(manifest.voice, 'Windows system voice (synthetic)');

  for (const version of ['long', 'short']) {
    const beats = timeline(version);
    for (const [index, scene] of manifest[version].entries()) {
      const beat = beats[index];
      const cues = timeCaptions(splitCaptions(beat.text), scene.lead, scene.spokenDuration);
      assert.equal(squash(cues.map((cue) => cue.text).join(' ')), squash(beat.text));
      assert.equal(cues[0].start, scene.lead);
      assert.equal(cues.at(-1).end, scene.lead + scene.spokenDuration);
      assert.ok(cues.at(-1).end <= beat.durationInFrames / FPS);
      assert.ok(cues.every((cue) => cue.text.length <= 100));
      assert.ok(cues.every((cue) => cue.end - cue.start >= 1.1), scene.id);
      for (let cueIndex = 1; cueIndex < cues.length; cueIndex++) {
        assert.equal(cues[cueIndex].start, cues[cueIndex - 1].end);
      }
      assert.ok(scene.file.endsWith('.wav'));
    }
  }
});
