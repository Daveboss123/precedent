import React from 'react';
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';
import { C, FONT, MONO } from '../theme.js';

export const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' };
export const ease = Easing.bezier(0.22, 0.68, 0, 1);

export function Reveal({ children, delay = 0, duration = 20, x = 0, y = 0, style = {} }) {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [delay, delay + duration], [0, 1], { ...clamp, easing: ease });
  return <div style={{ position: 'absolute', left: x, top: y, opacity: p, transform: `translateY(${(1 - p) * 20}px)`, ...style }}>{children}</div>;
}

export function Brand({ size = 30, color = C.text }) {
  return <div style={{ fontFamily: FONT, fontSize: size, fontWeight: 650, letterSpacing: -size * 0.055, color, lineHeight: 1 }}>Precedent<span style={{ color: C.lime, marginLeft: size * 0.035, fontWeight: 440 }}>§</span></div>;
}

export function Kicker({ children, color = C.lime, style = {} }) {
  return <div style={{ color, fontSize: 18, fontWeight: 520, letterSpacing: 3.1, textTransform: 'uppercase', ...style }}>{children}</div>;
}

export function Heading({ children, size = 70, style = {} }) {
  return <div style={{ color: C.text, fontSize: size, fontWeight: 570, lineHeight: 1.08, letterSpacing: -size * 0.045, ...style }}>{children}</div>;
}

export function Note({ children, style = {} }) {
  return <div style={{ color: C.muted, fontSize: 24, lineHeight: 1.45, ...style }}>{children}</div>;
}

export function Pill({ children, color = C.lime, style = {} }) {
  return <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, border: `1px solid ${C.line}`, borderRadius: 100, padding: '10px 17px', fontSize: 19, fontWeight: 520, color, backgroundColor: C.panel, ...style }}><span style={{ width: 7, height: 7, borderRadius: 99, background: color }} />{children}</div>;
}

export function SceneFrame({ index, title, durationInFrames, children, tag = 'RECORDED DEMO · NO CHECKOUT' }) {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 12, durationInFrames, durationInFrames + 12], [0, 1, 1, 0], clamp);
  return <AbsoluteFill style={{ opacity, color: C.text, fontFamily: FONT }}>
    <div style={{ position: 'absolute', left: 84, top: 54 }}><Brand /></div>
    <div style={{ position: 'absolute', right: 84, top: 58, display: 'flex', alignItems: 'center', gap: 20, color: C.muted, fontSize: 19 }}>
      <span>{title}</span><span style={{ color: C.lime, fontFamily: MONO, fontSize: 17 }}>{String(index + 1).padStart(2, '0')} / 06</span>
    </div>
    <div style={{ position: 'absolute', left: 84, right: 84, top: 109, height: 1, background: C.line }} />
    {children}
    {tag && <div style={{ position: 'absolute', left: 84, bottom: 115, color: C.faint, fontSize: 17, letterSpacing: 1.45 }}>{tag}</div>}
  </AbsoluteFill>;
}

export function RecordCard({ record, active = true, caption = 'CAPTURED DEMO RULE', width = 780, compact = false, style = {} }) {
  return <div style={{ width, padding: compact ? '25px 30px' : '34px 38px', border: `1px solid ${active ? '#536643' : C.line}`, borderRadius: 20, background: active ? 'linear-gradient(140deg, #232c20, #191d1a)' : C.panel, boxSizing: 'border-box', ...style }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: compact ? 18 : 28 }}>
      <span style={{ fontFamily: MONO, fontSize: 19, letterSpacing: 1.2, color: active ? C.lime : C.muted }}>{caption}</span>
      <span style={{ fontFamily: MONO, fontSize: 27, color: active ? C.lime : C.muted }}>#{record.id}</span>
    </div>
    <div style={{ fontSize: compact ? 29 : 36, lineHeight: 1.38, fontWeight: 450, letterSpacing: -0.8, color: active ? C.text : '#b8beb6' }}>“{record.reason}”</div>
    <div style={{ marginTop: compact ? 24 : 30, display: 'flex', gap: 15, alignItems: 'center', color: C.muted, fontSize: 20 }}>
      <span style={{ color: active ? C.lime : C.amber, textTransform: 'uppercase', fontSize: 17, letterSpacing: 1.5 }}>{record.action.replaceAll('_', ' ')}</span><span style={{ width: 3, height: 3, background: C.faint, borderRadius: 3 }} />{record.scope.join(' · ')}
    </div>
  </div>;
}
