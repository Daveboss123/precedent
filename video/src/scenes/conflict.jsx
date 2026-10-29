import React from 'react';
import { Sequence, useCurrentFrame } from 'remotion';
import { marker, rule, states } from '../captures.js';
import { C, MONO } from '../theme.js';
import { Heading, Kicker, Note, Pill, RecordCard, Reveal, SceneFrame } from '../components/layout.jsx';
import { Screen } from '../components/screen.jsx';

export function Conflict(props) {
  const frame = useCurrentFrame();
  const total = props.durationInFrames;
  const ask = Math.round(total * 0.26);
  const handled = Math.round(total * 0.59);
  const history = Math.round(total * 0.75);
  const from = props.short ? marker('ledger', 'reasonTyped') - 2400 : marker('ledger', 'answerOpen') - 800;
  const to = marker('ledger', 'handled') + 650;
  const rate = Math.max(props.short ? 1 : 0.65, (to - from) / 1000 / ((handled - ask) / 30));
  return <SceneFrame {...props}>
    <Reveal x={84} y={158}><Kicker>When two rules disagree</Kicker></Reveal>
    <Reveal x={84} y={216} delay={7}><Heading size={68}>It asks. <span style={{ color: C.lime }}>You rule.</span></Heading></Reveal>

    {frame < ask && <Sequence from={0} durationInFrames={ask} layout="none">
      <Reveal x={84} y={357} delay={15}><RecordCard record={rule(1)} width={824} caption="RULE #1 · BUY" compact /></Reveal>
      <Reveal x={1012} y={357} delay={23}><RecordCard record={rule(8)} width={824} active={false} caption="RULE #8 · HOLD OFF" compact /></Reveal>
      <Reveal x={928} y={448} delay={30}><div style={{ fontSize: 32, fontFamily: MONO, color: C.amber }}>≠</div></Reveal>
      <Reveal x={84} y={744} delay={28}><Pill color={C.amber}>Same beans. Same restock. Opposite actions.</Pill></Reveal>
      <Reveal x={84} y={813} delay={34}><Note>Neither recency nor confidence silently decides the winner.</Note></Reveal>
    </Sequence>}

    {frame >= ask && frame < handled && <Sequence from={ask} durationInFrames={handled - ask} layout="none">
      <Reveal x={84} y={359}><Heading size={43} style={{ maxWidth: 470 }}>One sentence.<br />A new precedent.</Heading><Note style={{ marginTop: 31, maxWidth: 430 }}>Buy the house blend.<br />The hold-off was only for last month.</Note><Pill style={{ marginTop: 34 }}>Actual UI interaction</Pill></Reveal>
      <Reveal x={659} y={321} duration={12}><Screen width={1177} height={594} video={{ name: 'ledger', startMs: from, endMs: to, durationInFrames: handled - ask, playbackRate: rate, camera: [
        { timeMs: from, x: 835, y: 640, width: 1080 },
        { timeMs: marker('ledger', 'reasonTyped'), x: 835, y: 640, width: 1080 },
        { timeMs: marker('ledger', 'saved'), x: 835, y: 610, width: 1080 },
        { timeMs: to, x: 835, y: 395, width: 1080 },
      ] }} label="Real answer → Save rule → updated decision" /></Reveal>
    </Sequence>}

    {frame >= handled && frame < history && <Sequence from={handled} durationInFrames={history - handled} layout="none">
      <Reveal x={84} y={355}><RecordCard record={rule(9, 'answered')} width={826} caption="THE RULING · #9" compact /></Reveal>
      <Reveal x={1012} y={357} delay={10}><Screen shot="card-handled" width={824} height={340} label="The basket now cites #9" /></Reveal>
      <Reveal x={1012} y={744} delay={19}><Pill>#8 overruled · #1 stays active</Pill></Reveal>
    </Sequence>}

    {frame >= history && <Sequence from={history} durationInFrames={total + 12 - history} layout="none">
      <Reveal x={84} y={357}><Heading size={47}>The old rule stays.<br /><span style={{ color: C.lime }}>The conflict goes.</span></Heading><Note style={{ marginTop: 29, width: 470 }}>The record says exactly<br />which rule took over.</Note>
        <div style={{ marginTop: 42, fontSize: 68, fontWeight: 500, color: C.lime }}>{states.answered.findings.length}<span style={{ fontSize: 23, color: C.muted, fontWeight: 400, marginLeft: 16 }}>unresolved conflicts</span></div>
      </Reveal>
      <Reveal x={672} y={332}><Screen shot="chain-ruling" width={1164} height={544} label="Real rule history · #8 superseded by #9" /></Reveal>
    </Sequence>}
  </SceneFrame>;
}
