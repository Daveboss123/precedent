/**
 * Capture real footage and stills from the running Precedent app.
 *
 *   node capture/capture.mjs
 *
 * Invoked by run.mjs, which creates an isolated local server.
 * Refuses to run unless the server reports local mode — the mainnet ledger is
 * append-only and must never be touched by a capture run.
 *
 * Outputs into video/public/captures:
 *   landing.mp4, ledger.mp4, proof.mp4      — transcoded session footage
 *   stills/*.png                            — 2x viewport and element shots
 *   captures.json                           — durations, markers, cursor tracks
 */

import { execFile } from 'node:child_process';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';

import { chromium } from 'playwright-core';

const execFileAsync = promisify(execFile);

const BASE = process.env.CAPTURE_BASE ?? 'http://localhost:3100';
const PROOF_BASE = process.env.CAPTURE_PROOF_BASE ?? 'https://precedent-household.vercel.app';
const HERE = path.resolve(import.meta.dirname, '..');
const PUBLIC_DIR = path.join(HERE, 'public', 'captures');
const STILLS_DIR = path.join(PUBLIC_DIR, 'stills');
const RAW_DIR = path.join(HERE, '.raw');
const CHROME =
  process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const VIEWPORT = { width: 1440, height: 900 };
const stills = {};
let capturedVerification = null;
const LAUNCH_ARGS = [
  '--hide-scrollbars',
  '--force-color-profile=srgb',
  '--force-device-scale-factor=1',
  '--disable-lcd-text',
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/* ------------------------------------------------------------------ state */

async function api(pathname, init) {
  const response = await fetch(`${BASE}${pathname}`, init);
  if (!response.ok) throw new Error(`${pathname} → ${response.status} ${await response.text()}`);
  return response.json();
}

async function seedAndVerify(label) {
  const before = await api('/api/state?force=1');
  if (before.mode !== 'local' || before.namespace !== 'precedent-video') {
    throw new Error('Refusing to capture outside the isolated local precedent-video namespace. No reset was made.');
  }
  await api('/api/demo', { method: 'POST' });
  const state = await api('/api/state?force=1');
  const summary = {
    mode: state.mode,
    precedents: state.precedents.length,
    items: state.items.length,
    findings: state.findings.length,
    supersessions: state.supersessions.length,
  };
  console.log(`[state] ${label}:`, JSON.stringify(summary));
  return state;
}

/* ------------------------------------------------------------- interactions */

function makeLog() {
  return { t0: 0, cursor: [], clicks: [], markers: {} };
}

const now = (log) => Math.round(performance.now() - log.t0);

const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

/** Glide the mouse to (x, y), logging every sample so the cursor can be redrawn. */
async function glide(log, page, x, y, ms = 620) {
  const from = log.cursor.at(-1) ?? { x: 1060, y: 780 };
  const steps = Math.max(10, Math.round(ms / 20));
  for (let i = 1; i <= steps; i += 1) {
    const e = easeInOut(i / steps);
    const cx = from.x + (x - from.x) * e;
    const cy = from.y + (y - from.y) * e;
    await page.mouse.move(cx, cy);
    log.cursor.push({ t: now(log), x: Math.round(cx), y: Math.round(cy) });
    await sleep(ms / steps);
  }
}

async function glideToElement(log, page, locator, { ms = 620, offset = null } = {}) {
  await locator.scrollIntoViewIfNeeded();
  await sleep(180);
  const box = await locator.boundingBox();
  if (!box) throw new Error('glideToElement: element has no box');
  const x = offset ? box.x + offset.x : box.x + box.width / 2;
  const y = offset ? box.y + offset.y : box.y + box.height / 2;
  await glide(log, page, x, y, ms);
  return { x, y };
}

async function clickAt(log, page, x, y) {
  await sleep(140);
  await page.mouse.down();
  await sleep(70);
  await page.mouse.up();
  log.clicks.push({ t: now(log), x: Math.round(x), y: Math.round(y) });
}

async function clickElement(log, page, locator, options = {}) {
  const { x, y } = await glideToElement(log, page, locator, options);
  await clickAt(log, page, x, y);
}

/** Cinematic eased scrolling — slower and smoother than the browser's own. */
async function scrollPage(page, target, duration = 1400) {
  await page.evaluate(
    async ([selector, ms]) => {
      const element = document.querySelector(selector);
      if (!element) throw new Error(`scrollPage: no element for ${selector}`);
      const start = window.scrollY;
      const end = Math.max(
        0,
        Math.min(
          element.getBoundingClientRect().top + window.scrollY - 76,
          document.body.scrollHeight - window.innerHeight,
        ),
      );
      const t0 = performance.now();
      await new Promise((resolve) => {
        const tick = (t) => {
          const p = Math.min(1, (t - t0) / ms);
          const e = p < 0.5 ? 4 * p * p * p : 1 - (-2 * p + 2) ** 3 / 2;
          window.scrollTo(0, start + (end - start) * e);
          if (p < 1) requestAnimationFrame(tick);
          else resolve();
        };
        requestAnimationFrame(tick);
      });
    },
    [target, duration],
  );
}

async function settle(page) {
  await page.evaluate(() => document.fonts.ready);
  await sleep(260);
}

/* ---------------------------------------------------------------- sessions */

async function withBrowser(fn) {
  const browser = await chromium.launch({ channel: 'chrome', executablePath: CHROME, args: LAUNCH_ARGS });
  try {
    return await fn(browser);
  } finally {
    await browser.close();
  }
}

async function recordSession(browser, name, fn) {
  const dir = path.join(RAW_DIR, name);
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });

  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 1,
    colorScheme: 'light',
    recordVideo: { dir, size: VIEWPORT },
  });
  const page = await context.newPage();
  const log = makeLog();
  log.t0 = performance.now();
  const mark = (key) => {
    log.markers[key] = now(log);
    console.log(`  · ${name} ${key} @ ${log.markers[key]}ms`);
  };

  try {
    await fn(page, mark, log);
  } finally {
    const video = page.video();
    mark('end');
    await page.close();
    await context.close();
    const dest = path.join(RAW_DIR, `${name}.webm`);
    await video.saveAs(dest);
  }
  return log;
}

async function stillsSession(browser, fn) {
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 2,
    colorScheme: 'light',
  });
  const page = await context.newPage();
  const shot = async (name) => {
    const file = path.join(STILLS_DIR, `${name}.png`);
    const png = await page.screenshot({ path: file });
    stills[name] = { width: png.readUInt32BE(16), height: png.readUInt32BE(20) };
    console.log(`  · still ${name}`);
  };
  const shotElement = async (name, locator) => {
    const file = path.join(STILLS_DIR, `${name}.png`);
    const png = await locator.screenshot({ path: file });
    stills[name] = { width: png.readUInt32BE(16), height: png.readUInt32BE(20) };
    console.log(`  · still ${name} (element)`);
  };
  try {
    await fn(page, shot, shotElement);
  } finally {
    await page.close();
    await context.close();
  }
}

/* ------------------------------------------------------------------ flows */

async function landingFlow(page, mark, log) {
  await page.goto(`${BASE}/`, { waitUntil: 'load' });
  await settle(page);
  mark('ready');
  await sleep(900);
  mark('hero');

  await page.locator('.lp-hero').hover();
  await sleep(600);

  await scrollPage(page, '#how');
  mark('how');
  await sleep(1500);

  await scrollPage(page, '#list');
  mark('list');
  await sleep(1700);

  await scrollPage(page, '#remembers');
  mark('remembers');
  await sleep(1700);

  await scrollPage(page, '.lp-cta');
  mark('cta');
  await sleep(1400);

  await scrollPage(page, '.lp-questions');
  mark('faq');
  await sleep(2200);

  // A small glide so the cursor leaves the scene naturally.
  await glide(log, page, 1320, 520, 800);
  await sleep(500);
}

const CONFLICT_REASON =
  'Buy the house blend. The hold-off was only for last month.';

async function ledgerFlow(page, mark, log) {
  await page.goto(`${BASE}/ledger#today`, { waitUntil: 'load' });
  await page.locator('.decision--ask').first().waitFor();
  await settle(page);
  mark('ready');
  await sleep(1200);

  const conflictCard = page.locator('.decision--ask').first();
  await glideToElement(log, page, conflictCard, { ms: 700 });
  mark('conflict');
  await sleep(1600);

  const summary = conflictCard.locator('summary', { hasText: 'Answer' });
  await clickElement(log, page, summary, { ms: 500 });
  await sleep(700);
  mark('answerOpen');

  const reason = page.locator('#reason-beans-restock');
  await glideToElement(log, page, reason, { ms: 520 });
  await reason.click();
  await reason.pressSequentially(CONFLICT_REASON, { delay: 22 });
  mark('reasonTyped');
  await sleep(900);

  const save = conflictCard.locator('button', { hasText: 'Save rule' });
  await clickElement(log, page, save, { ms: 620 });
  mark('saved');

  const handled = page.locator('.decision--auto', { hasText: 'House blend beans' }).first();
  await handled.waitFor({ timeout: 15000 });
  await page.waitForFunction(() => document.querySelector('.decision--auto')?.textContent.includes('#9'));
  await sleep(500);
  mark('handled');
  await sleep(1400);

  await scrollPage(page, '.autonomy-panel');
  mark('autonomy');
  await sleep(2200);

  await clickElement(log, page, page.locator('.rail-link', { hasText: 'Rules' }), { ms: 620 });
  await page.locator('.timeline').waitFor();
  mark('rules');
  const overruled = page.locator('.node', { has: page.locator('.node-id', { hasText: /^#8$/ }) });
  await overruled.scrollIntoViewIfNeeded();
  await sleep(900);
  await glideToElement(log, page, overruled.locator('.node-overruled'), { ms: 640 });
  mark('supersession');
  await sleep(2000);

  await clickElement(log, page, page.locator('.rail-link', { hasText: 'Audit' }), { ms: 620 });
  await page.locator('h1', { hasText: 'Audit' }).waitFor();
  mark('audit');
  await sleep(800);
  await scrollPage(page, '.auditor-panel, .panel');
  await sleep(2000);
  mark('auditSettled');

  await clickElement(log, page, page.locator('.rail-link', { hasText: 'Your list' }), { ms: 620 });
  await page.locator('.list-rows').waitFor();
  mark('listHandled');
  await page.locator('.list-row').first().scrollIntoViewIfNeeded();
  await sleep(1800);

  await glide(log, page, 1320, 560, 700);
  await sleep(400);
}

async function proofFlow(page, mark, log) {
  const firstResponse = page.waitForResponse((response) => response.url().includes('/api/verify') && response.status() === 200);
  await page.goto(`${PROOF_BASE}/proof`, { waitUntil: 'load' });
  capturedVerification = await (await firstResponse).json();
  if (capturedVerification.status !== 'verified') throw new Error('Live proof did not return verified. Refusing to fabricate a result.');
  await page.locator('.proof-check').waitFor();
  await settle(page);
  mark('ready');

  await page.locator('.proof-check--verified').waitFor({ timeout: 45000 });
  await sleep(600);
  mark('verified');
  await sleep(1500);

  const again = page.locator('.proof-check button', { hasText: /Check again|Checking/ });
  const secondResponse = page.waitForResponse((response) => response.url().includes('/api/verify') && response.status() === 200);
  await clickElement(log, page, again, { ms: 700 });
  capturedVerification = await (await secondResponse).json();
  if (capturedVerification.status !== 'verified') throw new Error('The repeated live verification failed.');
  await sleep(300);
  mark('checkAgain');
  await page.locator('.proof-check--verified').waitFor({ timeout: 45000 });
  await sleep(400);
  mark('rechecked');
  await sleep(1200);

  await scrollPage(page, '.proof-grid');
  mark('record');
  await sleep(2400);

  await glide(log, page, 1300, 620, 800);
  await sleep(500);
}

async function landingStills(page, shot) {
  await page.goto(`${BASE}/`, { waitUntil: 'load' });
  await settle(page);
  await shot('landing-hero');

  for (const [name, selector] of [
    ['landing-how', '#how'],
    ['landing-list', '#list'],
    ['landing-remembers', '#remembers'],
    ['landing-cta', '.lp-cta'],
    ['landing-faq', '.lp-questions'],
  ]) {
    await page.evaluate((sel) => {
      const element = document.querySelector(sel);
      window.scrollTo(0, element.getBoundingClientRect().top + window.scrollY - 76);
    }, selector);
    await sleep(1200);
    await shot(name);
  }
}

async function ledgerStillsPristine(page, shot, shotElement) {
  await page.goto(`${BASE}/ledger#today`, { waitUntil: 'load' });
  await page.locator('.decision--ask').first().waitFor();
  await settle(page);
  await shot('ledger-today');

  const conflictCard = page.locator('.decision--ask').first();
  await shotElement('card-conflict', conflictCard);

  await page.locator('.rail-link', { hasText: 'Your list' }).click();
  await page.locator('.list-rows').waitFor();
  await sleep(650);
  await shot('ledger-list-pristine');
  await shotElement('list-pristine', page.locator('.list-rows'));

  await page.locator('.rail-link', { hasText: 'Audit' }).click();
  await page.locator('.finding').waitFor();
  await sleep(650);
  await shotElement('finding-conflict', page.locator('.finding').first());

  await page.locator('.rail-link', { hasText: 'Rules' }).click();
  await page.locator('.timeline').waitFor();
  await sleep(650);
  for (const id of [1, 2, 7, 8]) {
    await shotElement(`rule-${id}`, page.locator('.node', { has: page.locator('.node-id', { hasText: new RegExp(`^#${id}$`) }) }));
  }
  await shotElement('chain-coffee', page.locator('.chain', { has: page.locator('.node-id', { hasText: /^#2$/ }) }));

  await page.locator('.rail-link', { hasText: 'This week' }).click();
  await page.locator('.decision--ask').first().waitFor();
  await sleep(600);

  await page.locator('.decision--ask').first().locator('summary', { hasText: 'Answer' }).click();
  await sleep(400);
  await page.locator('#reason-beans-restock').fill(CONFLICT_REASON);
  await sleep(300);
  await shot('ledger-answer');
  await shotElement('card-answer', conflictCard);
}

async function ledgerStillsAnswered(page, shot, shotElement) {
  await page.goto(`${BASE}/ledger#today`, { waitUntil: 'load' });
  await page.locator('.decision--auto').first().waitFor();
  await settle(page);

  await page.locator('.decision--auto', { hasText: 'House blend beans' }).first().scrollIntoViewIfNeeded();
  await sleep(500);
  await shot('ledger-handled');
  await shotElement(
    'card-handled',
    page.locator('.decision--auto', { hasText: 'House blend beans' }).first(),
  );

  await page.locator('.autonomy-panel').scrollIntoViewIfNeeded();
  await sleep(700);
  await shot('ledger-autonomy');
  await shotElement('panel-autonomy', page.locator('.autonomy-panel'));

  await page.locator('.rail-link', { hasText: 'Rules' }).click();
  await page.locator('.timeline').waitFor();
  await sleep(700);
  await shot('ledger-rules');
  await page.locator('.node.is-overruled').first().scrollIntoViewIfNeeded();
  await sleep(700);
  await shot('ledger-supersession');
  await shotElement('timeline-rules', page.locator('.timeline'));
  for (const id of [8, 9]) {
    await shotElement(`rule-${id}-answered`, page.locator('.node', { has: page.locator('.node-id', { hasText: new RegExp(`^#${id}$`) }) }).first());
  }
  await shotElement('chain-ruling', page.locator('.chain', { has: page.locator('.node-id', { hasText: /^#8$/ }) }));

  await page.locator('.rail-link', { hasText: 'Audit' }).click();
  await page.locator('h1', { hasText: 'Audit' }).waitFor();
  await sleep(700);
  await shot('ledger-audit');

  await page.locator('.rail-link', { hasText: 'Your list' }).click();
  await page.locator('.list-rows').waitFor();
  await sleep(700);
  await shot('ledger-list');

  await page.locator('.rail-link', { hasText: 'Limits' }).click();
  await page.locator('h1', { hasText: 'Limits' }).waitFor();
  await sleep(700);
  await shot('ledger-limits');
}

async function proofStills(page, shot, shotElement) {
  const response = page.waitForResponse((entry) => entry.url().includes('/api/verify') && entry.status() === 200);
  await page.goto(`${PROOF_BASE}/proof`, { waitUntil: 'load' });
  capturedVerification = await (await response).json();
  if (capturedVerification.status !== 'verified') throw new Error('Live proof screenshot is not verified.');
  await page.locator('.proof-check--verified').waitFor({ timeout: 45000 });
  await settle(page);
  await sleep(400);
  await shot('proof-top');
  await shotElement('proof-check', page.locator('.proof-check'));
  await shotElement('proof-details', page.locator('.proof-grid'));

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await sleep(900);
  await shot('proof-record');
}

/* -------------------------------------------------------------- transcode */

async function probe(file) {
  const { stdout } = await execFileAsync('ffprobe', [
    '-v', 'error',
    '-select_streams', 'v:0',
    '-show_entries', 'stream=width,height',
    '-show_entries', 'format=duration',
    '-of', 'json',
    file,
  ]);
  const parsed = JSON.parse(stdout);
  const stream = parsed.streams[0];
  return {
    width: stream.width,
    height: stream.height,
    durationMs: Math.round(Number(parsed.format.duration) * 1000),
  };
}

async function transcode(name) {
  const source = path.join(RAW_DIR, `${name}.webm`);
  const dest = path.join(PUBLIC_DIR, `${name}.mp4`);
  await execFileAsync('ffmpeg', [
    '-y', '-i', source,
    '-c:v', 'libx264',
    '-preset', 'slow',
    '-crf', '17',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    '-an',
    dest,
  ], { maxBuffer: 32 * 1024 * 1024 });
  const info = await probe(dest);
  console.log(`[ffmpeg] ${name}.mp4 ${info.width}x${info.height} ${(info.durationMs / 1000).toFixed(1)}s`);
  return info;
}

/* ------------------------------------------------------------------- main */

async function main() {
  console.log(`Capturing ${BASE}`);
  await seedAndVerify('before');
  await rm(PUBLIC_DIR, { recursive: true, force: true });
  await mkdir(STILLS_DIR, { recursive: true });
  await mkdir(RAW_DIR, { recursive: true });

  await mkdir(path.join(PUBLIC_DIR, 'states'), { recursive: true });
  const captures = {
    base: BASE,
    proofBase: PROOF_BASE,
    capturedAt: new Date().toISOString(),
    viewport: VIEWPORT,
    clips: {},
    stills,
  };

  await withBrowser(async (browser) => {
    console.log('[session] landing (video)');
    const landing = await recordSession(browser, 'landing', landingFlow);
    captures.clips.landing = landing;

    console.log('[session] landing (stills)');
    await stillsSession(browser, landingStills);

    console.log('[session] ledger pristine (stills)');
    const pristine = await seedAndVerify('reset for pristine stills');
    await writeFile(path.join(PUBLIC_DIR, 'states/pristine.json'), `${JSON.stringify(pristine, null, 2)}\n`);
    await stillsSession(browser, ledgerStillsPristine);

    console.log('[session] ledger (video)');
    const ledger = await recordSession(browser, 'ledger', ledgerFlow);
    captures.clips.ledger = ledger;
    const answered = await api('/api/state?force=1');
    if (answered.findings.length !== 0 || !answered.supersessions.some((entry) => entry.oldId === 8 && entry.newId === 9)) {
      throw new Error('The real conflict ruling did not resolve #8 with #9.');
    }
    await writeFile(path.join(PUBLIC_DIR, 'states/answered.json'), `${JSON.stringify(answered, null, 2)}\n`);

    console.log('[session] ledger answered (stills)');
    await stillsSession(browser, ledgerStillsAnswered);

    console.log('[session] proof');
    const proof = await recordSession(browser, 'proof', proofFlow);
    captures.clips.proof = proof;
    await stillsSession(browser, proofStills);
  });

  for (const name of ['landing', 'ledger', 'proof']) {
    const info = await transcode(name);
    captures.clips[name].file = `${name}.mp4`;
    captures.clips[name].width = info.width;
    captures.clips[name].height = info.height;
    captures.clips[name].durationMs = info.durationMs;
  }

  await writeFile(
    path.join(PUBLIC_DIR, 'captures.json'),
    `${JSON.stringify(captures, null, 2)}\n`,
  );
  await writeFile(path.join(PUBLIC_DIR, 'proof-response.json'), `${JSON.stringify(capturedVerification, null, 2)}\n`);

  await seedAndVerify('before render (left pristine)');
  console.log('Done. captures.json written.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
