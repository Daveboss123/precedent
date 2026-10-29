/**
 * Rebuild caption text and cue timing from the current chunker.
 * Narration files are never touched: each scene keeps its saved lead and spoken span.
 */
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { splitCaptions, stamp, timeCaptions } from '../src/captions.mjs';
import { duration, FPS, timeline } from '../src/story.mjs';

const VIDEO = path.resolve(import.meta.dirname, '..');
const AUDIO = path.join(VIDEO, 'public/audio');
const OUT = path.join(VIDEO, 'out');
const MANIFEST = path.join(AUDIO, 'audio.json');

const squash = (text) => text.replace(/\s+/g, ' ').trim();

function srt(version, manifest) {
  const cues = manifest[version].flatMap((scene) =>
    scene.captions.map((cue) => ({
      ...cue,
      start: scene.from / FPS + cue.start,
      end: scene.from / FPS + cue.end,
    })),
  );
  return cues.map((cue, i) => `${i + 1}\n${stamp(cue.start)} --> ${stamp(cue.end)}\n${cue.text}\n`).join('\n');
}

async function main() {
  const manifest = JSON.parse(await readFile(MANIFEST, 'utf8'));
  await mkdir(path.join(VIDEO, '.raw'), { recursive: true });
  await copyFile(MANIFEST, path.join(VIDEO, '.raw/audio.before-recaption.json'));

  for (const version of ['long', 'short']) {
    const beats = timeline(version);
    if (beats.length !== manifest[version].length) {
      throw new Error(`${version}: timeline has ${beats.length} scenes, manifest has ${manifest[version].length}`);
    }

    beats.forEach((beat, index) => {
      const scene = manifest[version][index];
      if (scene.scene !== beat.id) throw new Error(`${version}: scene ${index} is ${scene.scene}, expected ${beat.id}`);
      if (!scene.file) throw new Error(`${scene.id}: narration file missing from manifest`);

      const chunks = splitCaptions(beat.text);
      const spoken = squash(chunks.join(' '));
      if (spoken !== squash(beat.text)) {
        throw new Error(`${scene.id}: chunker changed the words\n  source: ${squash(beat.text)}\n  chunks: ${spoken}`);
      }

      const before = scene.captions.map((cue) => cue.text);
      scene.captions = timeCaptions(chunks, scene.lead, scene.spokenDuration);
      const changed = JSON.stringify(before) !== JSON.stringify(scene.captions.map((cue) => cue.text));
      console.log(`${scene.id}: ${before.length} -> ${scene.captions.length} cues${changed ? '' : ' (unchanged)'}`);
    });
  }

  await writeFile(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
  await mkdir(OUT, { recursive: true });
  await writeFile(path.join(OUT, 'precedent-demo.srt'), srt('long', manifest));
  await writeFile(path.join(OUT, 'precedent-55s.srt'), srt('short', manifest));

  for (const version of ['long', 'short']) {
    const last = manifest[version].at(-1);
    const end = last.from / FPS + last.lead + last.spokenDuration;
    console.log(`${version}: last cue ends at ${end.toFixed(2)}s, cut is ${(duration(version) / FPS).toFixed(2)}s`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
