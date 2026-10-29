import React from 'react';
import { AbsoluteFill, Freeze, Img, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from 'remotion';
import { captures, clip, stillPath } from '../captures.js';
import { cursorAt, FPS, mediaTiming } from '../story.mjs';
import { C } from '../theme.js';
import { clamp } from './layout.jsx';

function RecordedCursor({ capture, sourceMs }) {
  const position = cursorAt(capture.cursor, sourceMs);
  if (!position) return null;
  const viewport = captures.viewport;
  const ripples = capture.clicks.filter((click) => sourceMs >= click.t && sourceMs < click.t + 700);
  return <AbsoluteFill style={{ pointerEvents: 'none' }}>
    {ripples.map((click, index) => {
      const p = (sourceMs - click.t) / 700;
      return <div key={`${click.t}-${index}`} style={{ position: 'absolute', left: `${click.x / viewport.width * 100}%`, top: `${click.y / viewport.height * 100}%`, width: 42 + p * 35, height: 42 + p * 35, border: '2px solid #8a3b2c', borderRadius: '50%', opacity: 0.65 * (1 - p), transform: 'translate(-50%, -50%)' }} />;
    })}
    <svg width="25" height="33" viewBox="0 0 25 33" style={{ position: 'absolute', left: `${position.x / viewport.width * 100}%`, top: `${position.y / viewport.height * 100}%`, filter: 'drop-shadow(0 2px 2px #0006)' }}>
      <path d="M2 2v25l6-6 5 10 4-2-5-9h9L2 2z" fill="#fff" stroke="#1c211c" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  </AbsoluteFill>;
}

function RecordedVideo({ name, startMs, endMs, durationInFrames, playbackRate = 1, width, height, camera }) {
  const frame = useCurrentFrame();
  const capture = clip(name);
  const timing = mediaTiming({ startMs, endMs: Math.min(endMs, capture.durationMs - 150), durationInFrames, playbackRate });
  const sourceMs = startMs + Math.min(frame, timing.playFrames - 1) / FPS * 1000 * playbackRate;
  const viewport = captures.viewport;
  let scale = Math.min(width / viewport.width, height / viewport.height);
  let left = (width - viewport.width * scale) / 2;
  let top = (height - viewport.height * scale) / 2;
  if (camera) {
    const times = camera.map((pose) => pose.timeMs);
    const cx = interpolate(sourceMs, times, camera.map((pose) => pose.x), clamp);
    const cy = interpolate(sourceMs, times, camera.map((pose) => pose.y), clamp);
    const sourceWidth = interpolate(sourceMs, times, camera.map((pose) => pose.width), clamp);
    scale = width / sourceWidth;
    left = width / 2 - cx * scale;
    top = height / 2 - cy * scale;
  }
  const video = <OffthreadVideo src={staticFile(`captures/${capture.file}`)} trimBefore={timing.trimBefore} playbackRate={playbackRate} muted style={{ width: '100%', height: '100%', objectFit: 'fill', display: 'block' }} />;
  return <div style={{ position: 'absolute', left, top, width: viewport.width * scale, height: viewport.height * scale }}>
    <Sequence from={0} durationInFrames={timing.playFrames} layout="none">{video}</Sequence>
    {timing.playFrames < durationInFrames && <Sequence from={timing.playFrames} durationInFrames={durationInFrames - timing.playFrames} layout="none"><Freeze frame={timing.playFrames - 1}>{video}</Freeze></Sequence>}
    <RecordedCursor capture={capture} sourceMs={sourceMs} />
  </div>;
}

/** A decorative video frame, never an invented application interface. */
export function Screen({ shot, video, x = 0, y = 0, width = 1120, height, label = 'Precedent · recorded local sandbox', chrome = true, fit = 'contain', zoom = 1, style = {} }) {
  const frame = useCurrentFrame();
  const dimensions = shot ? captures.stills[shot] : captures.viewport;
  const aspect = dimensions.width / dimensions.height;
  const chromeHeight = chrome ? 42 : 0;
  const h = height ?? width / aspect + chromeHeight;
  const progress = interpolate(frame, [0, 300], [1, zoom], clamp);
  return <div style={{ position: 'absolute', left: x, top: y, width, height: h, border: `1px solid ${C.line}`, borderRadius: chrome ? 18 : 15, background: chrome ? '#212621' : C.paper, overflow: 'hidden', boxShadow: '0 24px 64px #0005', boxSizing: 'border-box', ...style }}>
    {chrome && <div style={{ height: chromeHeight, display: 'flex', alignItems: 'center', gap: 9, padding: '0 20px', boxSizing: 'border-box', color: '#a4aca4', fontSize: 15 }}>
      {[0, 1, 2].map((n) => <span key={n} style={{ width: 8, height: 8, borderRadius: 9, background: n === 0 ? '#64725f' : '#424b42' }} />)}
      <span style={{ marginLeft: 16 }}>{label}</span>
    </div>}
    <div style={{ position: 'relative', width: '100%', height: h - chromeHeight, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, transform: `scale(${progress})`, transformOrigin: 'center' }}>
        {shot && <Img src={staticFile(stillPath(shot))} style={{ width: '100%', height: '100%', objectFit: fit, display: 'block' }} />}
        {video && <RecordedVideo {...video} width={width - 2} height={h - chromeHeight - 2} />}
      </div>
    </div>
  </div>;
}
