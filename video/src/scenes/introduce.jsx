import React from 'react';
import { states } from '../captures.js';
import { C } from '../theme.js';
import { Heading, Kicker, Note, Reveal, SceneFrame } from '../components/layout.jsx';
import { Screen } from '../components/screen.jsx';

const counts = ['act', 'ask', 'block'].map((action) => states.pristine.queue.filter((entry) => entry.decision.action === action).length);

export function Introduce(props) {
  return <SceneFrame {...props}>
    <Reveal x={84} y={162}><Kicker>Meet Precedent</Kicker></Reveal>
    <Reveal x={84} y={229} delay={5} style={{ width: 550 }}><Heading size={73}>Your shopping<br />rules,<br /><span style={{ color: C.lime }}>remembered.</span></Heading></Reveal>
    <Reveal x={84} y={504} delay={15} style={{ width: 475 }}><Note>Not another chat window.<br />A basket with a reason behind every decision.</Note></Reveal>
    {['Handled', 'Needs you', 'Blocked'].map((label, index) => <Reveal key={label} x={84} y={640 + index * 86} delay={24 + index * 8}>
      <div style={{ width: 460, height: 69, display: 'flex', alignItems: 'center', gap: 18, borderBottom: `1px solid ${C.line}` }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: [C.lime, C.amber, C.rose][index] }} />
        <span style={{ fontSize: 27, color: C.text, flex: 1 }}>{label}</span>
        <span style={{ fontSize: 35, fontWeight: 520, color: [C.lime, C.amber, C.rose][index] }}>{counts[index]}</span>
      </div>
    </Reveal>)}
    <Reveal x={685} y={177} delay={15}><Screen shot="ledger-today" width={1150} zoom={1.012} /></Reveal>
  </SceneFrame>;
}
