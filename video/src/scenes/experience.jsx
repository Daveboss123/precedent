import React from 'react';
import { Sequence, useCurrentFrame, interpolate } from 'remotion';
import { rule, states } from '../captures.js';
import { C, MONO } from '../theme.js';
import { Heading, Kicker, Note, Pill, RecordCard, Reveal, SceneFrame, clamp } from '../components/layout.jsx';
import { Screen } from '../components/screen.jsx';

const base = states.pristine.queue.find((entry) => entry.candidate.id === 'beans-restock').candidate;
const spike = states.pristine.queue.find((entry) => entry.candidate.id === 'beans-spike').candidate;
const phases = states.pristine.autonomy.phases;
const first = phases.find((entry) => entry.phase === 'Day 1');
const later = phases.find((entry) => entry.phase === 'Day 12');

function Autonomy({ from }) {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [from, from + 34], [0, 1], clamp);
  return <div style={{ width: 615, opacity: p }}>
    <div style={{ fontSize: 20, color: C.muted, marginBottom: 17 }}>Same eight candidates. Only memory changes.</div>
    {[first, later].map((entry) => <div key={entry.phase} style={{ display: 'flex', alignItems: 'center', gap: 15, height: 46 }}>
      <span style={{ width: 74, color: C.muted, fontSize: 20 }}>{entry.phase}</span>
      <div style={{ height: 6, flex: 1, borderRadius: 8, background: C.line }}><div style={{ height: 6, width: `${entry.autonomy * 100 * p}%`, borderRadius: 8, background: C.lime }} /></div>
      <span style={{ fontFamily: MONO, fontSize: 23, color: C.lime, width: 54, textAlign: 'right' }}>{Math.round(entry.autonomy * 100)}%</span>
    </div>)}
    <div style={{ color: C.faint, fontSize: 17, marginTop: 10 }}>Handled without asking · excludes blocked decisions</div>
  </div>;
}

export function Experience(props) {
  const frame = useCurrentFrame();
  const duration = props.durationInFrames;
  const returned = Math.round(duration * 0.24);
  const corrected = Math.round(duration * 0.44);
  const history = Math.round(duration * 0.69);
  return <SceneFrame {...props}>
    <Reveal x={84} y={165}><Kicker>Coffee · learning from experience</Kicker></Reveal>
    <Reveal x={84} y={236} delay={8} style={{ width: 775 }}><Heading size={77}>Wrong once.<br /><span style={{ color: C.lime }}>Different next time.</span></Heading></Reveal>
    <Reveal x={84} y={466} delay={17}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
        <span style={{ fontSize: 78, color: C.muted, fontWeight: 420, letterSpacing: -4 }}>${base.price}</span>
        <span style={{ color: C.faint, fontSize: 42 }}>→</span>
        <span style={{ fontSize: 78, color: C.text, fontWeight: 500, letterSpacing: -4 }}>${spike.price}</span>
      </div>
      <Pill color={C.amber} style={{ marginTop: 18 }}>Price up {Math.round(spike.priceIncrease * 100)}% · rule #2 applied</Pill>
    </Reveal>

    {frame < returned && <Sequence from={0} durationInFrames={returned} layout="none">
      <Reveal x={924} y={294} delay={18}><RecordCard record={rule(2)} active={false} width={912} caption="THE ORIGINAL RULE" /></Reveal>
      <Reveal x={925} y={710} delay={30}><Note style={{ fontSize: 23 }}>A narrower price rule beats the routine restock rule.</Note></Reveal>
    </Sequence>}
    {frame >= returned && frame < corrected && <Sequence from={returned} durationInFrames={corrected - returned} layout="none">
      <Reveal x={924} y={291}><div style={{ width: 912, border: `1px solid #654b43`, borderRadius: 20, padding: '37px 40px', boxSizing: 'border-box', background: C.panel }}>
        <Kicker color={C.rose}>Recorded outcome · returned</Kicker>
        <div style={{ fontSize: 51, lineHeight: 1.24, letterSpacing: -1.7, marginTop: 36 }}>“The cheaper beans<br />were too acidic.”</div>
        <div style={{ color: C.muted, fontSize: 22, marginTop: 36 }}>What happened becomes part of what it remembers.</div>
      </div></Reveal>
    </Sequence>}
    {frame >= corrected && <Sequence from={corrected} durationInFrames={duration + 12 - corrected} layout="none">
      <Reveal x={924} y={276}><RecordCard record={rule(7)} width={912} caption="THE CORRECTION · #7 SUPERSEDES #2" /></Reveal>
      <Reveal x={927} y={737} delay={12}><Note style={{ fontSize: 24, color: C.lime }}>The reason survives the next price increase.</Note></Reveal>
    </Sequence>}

    {frame < history && <Reveal x={84} y={697} delay={25} style={{ width: 720 }}><Note>Corrections change what governs.<br />They don’t erase what happened.</Note></Reveal>}
    {frame >= history && <Sequence from={history} durationInFrames={duration + 12 - history} layout="none">
      {props.short ? <Reveal x={84} y={701}><Note style={{ color: C.lime }}>Superseded. Never erased.</Note></Reveal> : <Reveal x={84} y={694}><Autonomy from={0} /></Reveal>}
      <Reveal x={923} y={825} delay={10}><div style={{ fontFamily: MONO, fontSize: 18, color: C.muted }}>#2 → #7 · both preserved in the captured record</div></Reveal>
    </Sequence>}
  </SceneFrame>;
}
