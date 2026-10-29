import React from 'react';
import { useCurrentFrame, interpolate } from 'remotion';
import { C } from '../theme.js';
import { Heading, Kicker, Note, Reveal, SceneFrame, clamp } from '../components/layout.jsx';
import { Screen } from '../components/screen.jsx';

export function Problem(props) {
  const frame = useCurrentFrame();
  const line = interpolate(frame, [36, 66], [0, 256], clamp);
  return <SceneFrame {...props}>
    <Reveal x={84} y={169}><Kicker>Same list. Same questions.</Kicker></Reveal>
    <Reveal x={84} y={251} delay={8} style={{ width: 865 }}>
      <Heading size={86}>What if your AI<br />remembered <span style={{ color: C.lime }}>why</span><br />it got something<br />wrong?</Heading>
      <div style={{ width: line, height: 2, background: C.lime, marginTop: 39 }} />
      <Note style={{ marginTop: 26, maxWidth: 640 }}>The next restock shouldn’t start from zero.</Note>
    </Reveal>
    <Reveal x={1001} y={242} delay={20}>
      <Screen shot="list-pristine" width={820} height={610} label="The real recurring list" fit="contain" />
    </Reveal>
    <Reveal x={1028} y={192} delay={28}><Note style={{ fontSize: 21, color: C.muted }}>Coffee. Oat milk. Filters. Again.</Note></Reveal>
  </SceneFrame>;
}
