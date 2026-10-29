import React from 'react';
import { C } from '../theme.js';
import { LINKS } from '../story.mjs';
import { Brand, Heading, Kicker, Reveal, SceneFrame } from '../components/layout.jsx';

export function Closing(props) {
  return <SceneFrame {...props} tag={null}>
    <Reveal x={84} y={169}><Kicker>Written. Cited. Superseded. Never erased.</Kicker></Reveal>
    <Reveal x={84} y={235} delay={6}><Brand size={110} /></Reveal>
    <Reveal x={84} y={407} delay={16}><Heading size={69}>The weekly shop shouldn’t<br />require a weekly debate.<br /><span style={{ color: C.lime }}>It should require a record.</span></Heading></Reveal>
    <Reveal x={84} y={722} delay={30}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 34, fontSize: 31 }}><span style={{ width: 100, color: C.muted, fontSize: 20, letterSpacing: 2 }}>DEMO</span>{LINKS.demo.replace('https://', '')}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 34, fontSize: 31, marginTop: 23 }}><span style={{ width: 100, color: C.muted, fontSize: 20, letterSpacing: 2 }}>PROOF</span><span style={{ color: C.lime }}>{LINKS.proof.replace('https://', '')}</span></div>
      <div style={{ marginTop: 29, paddingTop: 24, borderTop: `1px solid ${C.line}`, color: C.muted, fontSize: 21 }}>{LINKS.source.replace('https://', '')}<span style={{ marginLeft: 40, color: C.faint }}>Tatum × Walrus · Total Recall · Track 2</span></div>
    </Reveal>
  </SceneFrame>;
}
