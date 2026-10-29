# Precedent demo films

Two cuts of the same recorded story:

| Cut | Length | File |
| --- | --- | --- |
| Full demo | 2:28 | `out/precedent-demo.mp4` |
| Short demo | 0:55 | `out/precedent-55s.mp4` |

Both are 1920×1080 at 30fps, with H.264 video, AAC stereo audio, burned-in captions, and matching `.srt` files.

## What is on screen

The app footage is captured from the running product with Playwright, then played back inside a dark editorial frame. The film does not make live requests while it renders: the proof scene uses a saved Tatum response from `/proof` and labels it as a captured result. Narration is synthetic, the ambience and chimes are original, and the on-screen claims match the saved data.

- `src/story.mjs` holds the timing and narration for both cuts.
- `src/scenes/` holds the six scenes: problem, introduction, learning from experience, conflict, proof, closing.
- `src/captions.mjs` chunks the narration without dropping words and writes the SRTs.
- `capture/` records the app and generates narration, ambience, and captions.

## Reproduce

```bash
npm install
npm run prepare   # captures the app, then builds the audio
npm run render -- --concurrency=1
npm run render:short -- --concurrency=1
npm test
```

`prepare` needs Chrome at the path set in `capture/run.mjs`. Captures, narration WAVs, the sound bed, and renders are intentionally ignored by git; they are generated artefacts. The source, story, captions, and tests are tracked.

The films were made for **Tatum × Walrus: Total Recall, Track 2**.
