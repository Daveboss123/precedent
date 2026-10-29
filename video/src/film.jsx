import React from 'react';
import { AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame } from 'remotion';
import audio from '../public/audio/audio.json';
import { C, FONT } from './theme.js';
import { duration, FPS, timeline } from './story.mjs';
import { clamp } from './components/layout.jsx';
import { Problem } from './scenes/problem.jsx';
import { Introduce } from './scenes/introduce.jsx';
import { Experience } from './scenes/experience.jsx';
import { Conflict } from './scenes/conflict.jsx';
import { Proof } from './scenes/proof.jsx';
import { Closing } from './scenes/closing.jsx';

const components = { problem: Problem, introduce: Introduce, experience: Experience, conflict: Conflict, proof: Proof, closing: Closing };

function Captions({ version }) {
  const frame = useCurrentFrame();
  const scene = audio[version].find((entry, i, all) => frame >= entry.from && frame < (all[i + 1]?.from ?? duration(version)));
  const seconds = (frame - scene.from) / FPS;
  const cue = scene.captions.find((entry) => seconds >= entry.start && seconds < entry.end);
  if (!cue) return null;
  return <div style={{ position: 'absolute', left: 220, right: 220, bottom: 31, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
    <div style={{ maxWidth: 1400, padding: '9px 22px', color: C.text, border: '1px solid #313731', borderRadius: 8, background: '#080b08ea', boxShadow: '0 2px 10px #0004', fontSize: 25, lineHeight: 1.32, textAlign: 'center' }}>{cue.text}</div>
  </div>;
}

export function Film({ version = 'long', narration = true, captions = true }) {
  const frame = useCurrentFrame();
  const total = duration(version);
  const entries = timeline(version);
  const endFade = interpolate(frame, [total - 24, total - 1], [0, 1], clamp);
  return <AbsoluteFill style={{ background: C.bg, fontFamily: FONT }}>
    <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 88% 12%, #35472a26, transparent 60%), radial-gradient(ellipse at 5% 90%, #29392726, transparent 55%)' }} />
    <div style={{ position: 'absolute', top: 110, bottom: 115, left: '50%', width: 1, background: 'linear-gradient(transparent, #323a320a, transparent)' }} />
    {entries.map((entry, index) => {
      const Component = components[entry.id];
      return <Sequence key={entry.id} name={entry.label} from={entry.from} durationInFrames={Math.min(entry.durationInFrames + 12, total - entry.from)}>
        <Component {...entry} index={index} title={entry.label} short={version === 'short'} />
      </Sequence>;
    })}

    <Audio src={staticFile('audio/bed.wav')} volume={(f) => interpolate(f, [0, 45, total - 90, total], [0, narration && audio.voiced ? 0.31 : 0.68, narration && audio.voiced ? 0.31 : 0.68, 0], clamp)} />
    {entries.slice(1).map((entry) => <Sequence key={`chime-${entry.id}`} from={entry.from} durationInFrames={40} name="Transition chime"><Audio src={staticFile('audio/chime.wav')} volume={0.28} /></Sequence>)}
    {narration && audio.voiced && audio[version].map((entry) => <Sequence key={entry.id} from={entry.from + Math.round(entry.lead * FPS)} name={`Narration · ${entry.scene}`}><Audio src={staticFile(`audio/${entry.file}`)} /></Sequence>)}
    {captions && <Captions version={version} />}
    <div style={{ position: 'absolute', left: 84, right: 84, bottom: 14, height: 2, background: C.line }}><div style={{ height: '100%', width: `${frame / (total - 1) * 100}%`, background: C.lime, opacity: 0.7 }} /></div>
    <AbsoluteFill style={{ pointerEvents: 'none', background: '#101211', opacity: endFade }} />
  </AbsoluteFill>;
}
