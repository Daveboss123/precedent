/** Serve the existing build in an isolated directory, capture, then stop. */
import { spawn } from 'node:child_process';
import { access, lstat, mkdir, symlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { setTimeout } from 'node:timers/promises';

const VIDEO = path.resolve(import.meta.dirname, '..');
const APP = path.resolve(VIDEO, '..');
const SANDBOX = path.join(VIDEO, '.sandbox');
const PORT = 3100;
const BASE = `http://127.0.0.1:${PORT}`;

async function link(name) {
  const dest = path.join(SANDBOX, name);
  try {
    const existing = await lstat(dest);
    if (!existing.isSymbolicLink()) throw new Error(`Unexpected file at ${dest}; refusing to overwrite it.`);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    await symlink(path.join(APP, name), dest, process.platform === 'win32' ? 'junction' : 'dir');
  }
}

function execute(file, args, options) {
  return new Promise((resolve, reject) => {
    const child = spawn(file, args, { stdio: 'inherit', ...options });
    child.once('error', reject);
    child.once('exit', (code) => code === 0 ? resolve() : reject(new Error(`Command exited ${code}`)));
  });
}

async function main() {
  await access(path.join(APP, '.next', 'BUILD_ID')).catch(() => {
    throw new Error('Build the unchanged app first: cd .. && npm run build');
  });
  // Never take control of an unrelated server or reset its data.
  try {
    await fetch(`${BASE}/`, { signal: AbortSignal.timeout(1500) });
    throw new Error(`Port ${PORT} is already in use. Stop that server before capturing.`);
  } catch (error) {
    if (error.message.includes('already in use')) throw error;
  }

  await mkdir(SANDBOX, { recursive: true });
  await Promise.all(['.next', 'public', 'node_modules'].map(link));
  await writeFile(path.join(SANDBOX, 'package.json'), JSON.stringify({ private: true, type: 'module' }));

  const env = {
    ...process.env,
    PRECEDENT_MODE: 'local',
    MEMWAL_NAMESPACE: 'precedent-video',
    MEMWAL_KEY: '',
    MEMWAL_ACCOUNT_ID: '',
    MEMWAL_AGENT_ID: '',
    TATUM_API_KEY: '',
    UPSTASH_REDIS_REST_URL: '',
    UPSTASH_REDIS_REST_TOKEN: '',
    NEXT_TELEMETRY_DISABLED: '1',
  };
  const server = spawn(process.execPath, [
    path.join(APP, 'node_modules/next/dist/bin/next'), 'start', SANDBOX,
    '--port', String(PORT), '--hostname', '127.0.0.1',
  ], { cwd: SANDBOX, env, stdio: 'inherit' });

  let exit = null;
  server.once('error', (error) => { exit = error; });
  server.once('exit', (code) => { exit = new Error(`Capture server exited ${code}`); });
  const stop = () => { if (!server.killed) server.kill(); };
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);
  try {
    let ready = false;
    for (let attempt = 0; attempt < 40; attempt++) {
      if (exit) throw exit;
      try {
        const response = await fetch(`${BASE}/api/state`, { signal: AbortSignal.timeout(6000) });
        if (response.ok) {
          const state = await response.json();
          if (state.mode !== 'local' || state.namespace !== 'precedent-video') {
            throw new Error('Capture server isolation check failed. No writes were made.');
          }
          ready = true;
          break;
        }
      } catch (error) {
        if (error.message.includes('isolation')) throw error;
      }
      await setTimeout(500);
    }
    if (!ready) throw new Error('The isolated capture server did not become ready.');
    await execute(process.execPath, [path.join(VIDEO, 'capture/capture.mjs')], {
      cwd: VIDEO,
      env: { ...env, CAPTURE_BASE: BASE, CAPTURE_PROOF_BASE: 'https://precedent-household.vercel.app' },
    });
  } finally {
    stop();
    process.removeListener('SIGINT', stop);
    process.removeListener('SIGTERM', stop);
  }
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
