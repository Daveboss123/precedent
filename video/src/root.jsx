import React from 'react';
import { Composition } from 'remotion';
import { Film } from './film.jsx';
import { duration, FPS, HEIGHT, WIDTH } from './story.mjs';

export function Root() {
  return <>
    <Composition id="PrecedentDemo" component={Film} durationInFrames={duration('long')} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{ version: 'long', narration: true, captions: true }} />
    <Composition id="PrecedentShort" component={Film} durationInFrames={duration('short')} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{ version: 'short', narration: true, captions: true }} />
  </>;
}
