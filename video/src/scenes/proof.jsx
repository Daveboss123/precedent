import React from 'react';
import { Sequence, useCurrentFrame } from 'remotion';
import { marker, verification } from '../captures.js';
import { C } from '../theme.js';
import { Heading, Kicker, Note, Pill, Reveal, SceneFrame } from '../components/layout.jsx';
import { Screen } from '../components/screen.jsx';

const checkDate = new Date(verification.checkedAt).toISOString().slice(0, 10);

function ArchitectureCard({ name, role, description, letter, color = C.lime }) {
  return <div style={{ width: 630, padding: '29px 30px', border: `1px solid ${C.line}`, borderRadius: 18, background: C.panel, display: 'flex', gap: 25, boxSizing: 'border-box' }}>
    <div style={{ flexShrink: 0, width: 57, height: 57, border: `1px solid ${C.line}`, borderRadius: 12, color, fontSize: 30, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{letter}</div>
    <div><div style={{ fontSize: 29, fontWeight: 550, color: C.text }}>{name}</div><div style={{ fontSize: 20, color, marginTop: 7 }}>{role}</div><div style={{ fontSize: 21, color: C.muted, lineHeight: 1.4, marginTop: 17 }}>{description}</div></div>
  </div>;
}

export function Proof(props) {
  const frame = useCurrentFrame();
  const focus = Math.round(props.durationInFrames * 0.29);
  return <SceneFrame {...props} tag={`ACTUAL SAVED PROOF · ${checkDate} · ACCOUNT / DELEGATE CHECK`}>
    <Reveal x={84} y={158}><Kicker>Separate jobs. One inspectable record.</Kicker></Reveal>
    <Reveal x={84} y={218} delay={7}><Heading size={68}>Memory with <span style={{ color: C.lime }}>receipts.</span></Heading></Reveal>
    <Reveal x={84} y={357} delay={16}><ArchitectureCard name="Walrus Memory" role="Stores the precedent history" description={<>20 recorded mainnet memories.<br />Rules, corrections and outcomes.</>} letter="W" /></Reveal>
    <Reveal x={84} y={609} delay={25}><ArchitectureCard name="Tatum" role="Sui mainnet GraphQL gateway" description={<>Checks account activity and<br />configured delegate registration.</>} letter="T" color={C.amber} /></Reveal>

    {frame < focus && <Sequence from={0} durationInFrames={focus} layout="none">
      <Reveal x={793} y={332} delay={19}><Screen width={1043} height={585} video={{ name: 'proof', startMs: marker('proof', 'ready'), endMs: marker('proof', 'rechecked') + 800, durationInFrames: focus, camera: [
        { timeMs: marker('proof', 'ready'), x: 720, y: 435, width: 1040 },
        { timeMs: marker('proof', 'rechecked') + 800, x: 720, y: 435, width: 1040 },
      ] }} label="Recorded from precedent-household.vercel.app/proof" /></Reveal>
    </Sequence>}
    {frame >= focus && <Sequence from={focus} durationInFrames={props.durationInFrames + 12 - focus} layout="none">
      <Reveal x={794} y={355}><Screen shot="proof-check" width={1042} height={345} label="Actual saved Tatum response · not a live render request" /></Reveal>
      <Reveal x={795} y={743} delay={10}><Pill color={verification.status === 'verified' ? C.lime : C.rose}>{verification.status === 'verified' ? 'Verified' : verification.status} · checkpoint {Number(verification.checkpoint).toLocaleString('en-US')}</Pill></Reveal>
      <Reveal x={796} y={818} delay={17} style={{ width: 1010 }}><Note style={{ fontSize: 22 }}>Account + delegate verification.<br />Not an individual transaction receipt for every memory.</Note></Reveal>
    </Sequence>}
  </SceneFrame>;
}
