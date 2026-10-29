/** No credentials or paid sound libraries: local system voice + original sound. */
import { execFile } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { duration, FPS, timeline } from '../src/story.mjs';
import { splitCaptions, stamp, timeCaptions } from '../src/captions.mjs';

const run = promisify(execFile);
const VIDEO = path.resolve(import.meta.dirname, '..');
const AUDIO = path.join(VIDEO, 'public/audio');
const RAW = path.join(VIDEO, '.raw/audio');
const SAMPLE_RATE = 48000;

function wav(samples, channels = 1) {
  const pcm = Buffer.alloc(samples.length * 2);
  samples.forEach((sample, index) => pcm.writeInt16LE(Math.round(Math.max(-1, Math.min(1, sample)) * 32767), index * 2));
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write('WAVEfmt ', 8);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(SAMPLE_RATE, 24);
  header.writeUInt32LE(SAMPLE_RATE * channels * 2, 28);
  header.writeUInt16LE(channels * 2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

function bed(seconds) {
  const samples = new Float32Array(Math.ceil(seconds * SAMPLE_RATE) * 2);
  const chords = [
    [146.832, 220, 293.665, 369.994],
    [130.813, 196, 261.626, 329.628],
    [164.814, 246.942, 329.628, 440],
    [146.832, 220, 293.665, 440],
  ];
  for (let i = 0; i < samples.length / 2; i++) {
    const t = i / SAMPLE_RATE;
    const chord = chords[Math.floor(t / 12) % chords.length];
    const attack = Math.min(1, (t % 12) / 2.5);
    const release = Math.min(1, (12 - t % 12) / 3);
    const envelope = Math.min(1, t / 2, (seconds - t) / 3) * attack * release;
    let left = 0;
    let right = 0;
    chord.forEach((hz, n) => {
      const weight = n === 0 ? 0.44 : 0.23;
      left += Math.sin(2 * Math.PI * hz * t + 0.006 * Math.sin(t * 0.4)) * weight;
      right += Math.sin(2 * Math.PI * hz * 1.00014 * t + n * 0.1) * weight;
    });
    const pulse = 0.84 + 0.16 * Math.cos(t * Math.PI / 2);
    samples[i * 2] = left * 0.034 * envelope * pulse;
    samples[i * 2 + 1] = right * 0.034 * envelope * pulse;
  }
  return wav(samples, 2);
}

function chime() {
  const samples = new Float32Array(SAMPLE_RATE * 1.3);
  for (let i = 0; i < samples.length; i++) {
    const t = i / SAMPLE_RATE;
    const attack = Math.min(1, t / 0.006);
    samples[i] = attack * Math.exp(-t * 6) * (Math.sin(2 * Math.PI * 880 * t) * 0.055 + Math.sin(2 * Math.PI * 1320 * t) * 0.022);
  }
  return wav(samples);
}

async function main() {
  await Promise.all([mkdir(AUDIO, { recursive: true }), mkdir(RAW, { recursive: true })]);
  await writeFile(path.join(AUDIO, 'bed.wav'), bed(duration('long') / FPS + 2));
  await writeFile(path.join(AUDIO, 'chime.wav'), chime());

  const jobs = ['long', 'short'].flatMap((version) => timeline(version).map((entry) => ({ ...entry, version, id: `${version}-${entry.id}` })));
  const jobFile = path.join(RAW, 'jobs.json');
  await writeFile(jobFile, JSON.stringify(jobs));
  let voiced = false;
  if (process.platform === 'win32' && process.env.VIDEO_NO_VOICE !== '1') {
    try {
      const result = await run('powershell.exe', [
        '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File',
        path.join(VIDEO, 'capture/voice.ps1'), '-Manifest', jobFile, '-OutputDirectory', RAW,
      ], { maxBuffer: 8 * 1024 * 1024 });
      console.log(result.stdout.trim());
      voiced = true;
    } catch (error) {
      console.warn('System narration unavailable; keeping music and readable captions.', error.message);
    }
  }

  const manifest = { voiced, voice: voiced ? 'Windows system voice (synthetic)' : null, long: [], short: [] };
  for (const job of jobs) {
    const lead = job.version === 'short' ? 0.35 : 0.65;
    const target = job.seconds - lead - 0.65;
    let spokenDuration = target;
    if (voiced) {
      const { stdout } = await run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'json', path.join(RAW, `${job.id}.wav`)]);
      const sourceDuration = Number(JSON.parse(stdout).format.duration);
      const tempo = Math.max(1, sourceDuration / target);
      spokenDuration = sourceDuration / tempo;
      await run('ffmpeg', [
        '-y', '-i', path.join(RAW, `${job.id}.wav`),
        '-af', `atempo=${tempo.toFixed(6)},loudnorm=I=-17:TP=-2:LRA=7,afade=t=in:d=0.015,afade=t=out:st=${Math.max(0, spokenDuration - 0.08).toFixed(3)}:d=0.08`,
        '-ar', '48000', '-ac', '1', path.join(AUDIO, `${job.id}.wav`),
      ], { maxBuffer: 8 * 1024 * 1024 });
      console.log(`${job.id}: ${sourceDuration.toFixed(1)}s → ${spokenDuration.toFixed(1)}s (${tempo.toFixed(2)}x)`);
    }

    const chunks = splitCaptions(job.text);
    const captions = timeCaptions(chunks, lead, spokenDuration);
    manifest[job.version].push({ id: job.id, scene: job.id.replace(`${job.version}-`, ''), from: job.from, lead, spokenDuration, file: voiced ? `${job.id}.wav` : null, captions });
  }

  await writeFile(path.join(AUDIO, 'audio.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  await mkdir(path.join(VIDEO, 'out'), { recursive: true });
  for (const version of ['long', 'short']) {
    const cues = manifest[version].flatMap((scene) => scene.captions.map((cue) => ({ ...cue, start: scene.from / FPS + cue.start, end: scene.from / FPS + cue.end })));
    const srt = cues.map((cue, i) => `${i + 1}\n${stamp(cue.start)} --> ${stamp(cue.end)}\n${cue.text}\n`).join('\n');
    await writeFile(path.join(VIDEO, 'out', version === 'long' ? 'precedent-demo.srt' : 'precedent-55s.srt'), srt);
  }
  console.log('Original sound bed, transition chime, narration and SRT captions ready.');
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
