// Orchestrate the whole capture: every shot in capture/shots.json is split into
// deterministic chunks, captured by parallel Chrome workers, then merged into
// frames/<shot>/f#####.png.
//
//   node capture-all.mjs [--only a-day,b-day] [--dry] [--fps 60] [--dsf 2]
//                        [--width 1920] [--height 1080] [--concurrency 6]
//                        [--chunk-count 3] [--seconds-scale 1] [--out <dir>]
import { readFileSync, writeFileSync, mkdirSync, rmSync, renameSync, existsSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { spawn } from 'node:child_process';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) continue;
    const key = a.slice(2).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) out[key] = true;
    else { out[key] = next; i++; }
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));
const cfg = JSON.parse(readFileSync(join(ROOT, 'capture', 'shots.json'), 'utf8'));

const fps = Number(args.fps ?? cfg.fps ?? 60);
const dsf = Number(args.dsf ?? cfg.dsf ?? 2);
const width = Number(args.width ?? cfg.width ?? 1920);
const height = Number(args.height ?? cfg.height ?? 1080);
const chunkCount = Number(args.chunkCount ?? cfg.chunkCount ?? 1);
const concurrency = Number(args.concurrency ?? cfg.concurrency ?? 4);
const secondsScale = Number(args.secondsScale ?? 1);
const outRoot = resolve(args.out ?? join(ROOT, 'frames'));
const only = args.only && args.only !== true ? String(args.only).split(',') : null;

const html = { A: resolve(cfg.htmlA), B: resolve(cfg.htmlB) };
const shots = cfg.shots.filter((s) => !only || only.includes(s.id));

const jobs = [];
let port = 9400;
for (const shot of shots) {
  const seconds = Number((shot.seconds * secondsScale).toFixed(3));
  const n = shot.chunkCount ?? ((shot.actions ?? []).length > 0 ? 1 : chunkCount);
  for (let c = 0; c < n; c++) {
    jobs.push({ shot, seconds, chunkIndex: c, port: port++, n });
  }
}

if (args.dry) {
  console.log(JSON.stringify({ fps, dsf, width, height, chunkCount, concurrency, outRoot, jobs: jobs.length, shots: shots.map((s) => s.id) }, null, 1));
  process.exit(0);
}

mkdirSync(outRoot, { recursive: true });
const chunkRoot = join(outRoot, '_chunks');
const logPath = join(ROOT, 'capture', 'capture.log');
mkdirSync(dirname(logPath), { recursive: true });

function runJob(job) {
  return new Promise((resolvePromise) => {
    const { shot, seconds, chunkIndex, port: p, n } = job;
    const dir = join(chunkRoot, shot.id, `c${chunkIndex}`);
    rmSync(dir, { recursive: true, force: true });
    mkdirSync(dir, { recursive: true });
    const actionFile = join(chunkRoot, `${shot.id}.actions.json`);
    if (!existsSync(actionFile)) writeFileSync(actionFile, JSON.stringify(shot.actions ?? []));

    const argv = [
      join(HERE, 'capture-clip.mjs'),
      '--html', html[shot.src],
      '--out', dir,
      '--fps', String(fps),
      '--seconds', String(seconds),
      '--chunk-index', String(chunkIndex),
      '--chunk-count', String(n),
      '--width', String(width),
      '--height', String(height),
      '--dsf', String(dsf),
      '--port', String(p),
      '--label', `${shot.id}#${chunkIndex}`,
      '--actions', actionFile,
    ];
    if (shot.boot) argv.push('--boot', join(ROOT, 'capture', 'boot', shot.boot));

    const child = spawn(process.execPath, argv, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    child.stdout.on('data', (d) => { stdout += d; });
    child.stderr.on('data', (d) => process.stderr.write(`[${shot.id}#${chunkIndex}] ${d}`));
    child.on('close', (code) => {
      if (code !== 0) process.stderr.write(`[${shot.id}#${chunkIndex}] worker exited ${code}\n`);
      let meta = null;
      try { meta = JSON.parse(stdout.trim().split('\n').pop()); } catch { /* ignore */ }
      resolvePromise({ job, code, meta });
    });
  });
}

const started = Date.now();
let idx = 0;
let done = 0;
const results = [];
const workers = Array.from({ length: Math.min(concurrency, jobs.length) }, async () => {
  while (idx < jobs.length) {
    const job = jobs[idx++];
    const r = await runJob(job);
    results.push(r);
    done++;
    process.stderr.write(`--- ${done}/${jobs.length} workers done (${((Date.now() - started) / 1000).toFixed(0)}s) ---\n`);
  }
});
await Promise.all(workers);

// Merge chunk dirs into frames/<shot>/ and drop the chunk tree.
const merged = [];
for (const shot of shots) {
  const finalDir = join(outRoot, shot.id);
  rmSync(finalDir, { recursive: true, force: true });
  mkdirSync(finalDir, { recursive: true });
  let frames = 0;
  let bytes = 0;
  const srcDir = join(chunkRoot, shot.id);
  if (existsSync(srcDir)) {
    for (const c of readdirSync(srcDir)) {
      const d = join(srcDir, c);
      if (!statSync(d).isDirectory()) continue;
      for (const f of readdirSync(d)) {
        if (!f.endsWith('.png')) continue;
        const from = join(d, f);
        renameSync(from, join(finalDir, f));
        frames++; bytes += statSync(join(finalDir, f)).size;
      }
    }
  }
  // Chunk 1..n replay transient events that fired just before their slice, so the
  // first moments of those slices may contain a ghost of an earlier event. Record
  // which source-time ranges are safe for the edit to cut from.
  // Shots that contain transient events (bell, fish) are captured in ONE process so
  // no chunk boundary can replay an event out of place; only event-free shots are
  // split for speed. Determined from the shot's own action list.
  const shotChunks = shot.chunkCount ?? ((shot.actions ?? []).length > 0 ? 1 : chunkCount);
  const totalFrames = Math.max(1, Math.round(fps * shot.seconds * secondsScale));
  const per = Math.ceil(totalFrames / shotChunks);

  // A chunk n>0 replays events that fired within REPLAY_WINDOW before its start, so
  // the first moments of those slices can hold a ghost. Guard exactly that long.
  const REPLAY_WINDOW = 2.0;
  const GHOST_LIFETIME = 1.5;
  const usableRanges = [];
  for (let c = 0; c < shotChunks; c++) {
    const startSec = (c * per) / fps;
    const endSec = Math.min(totalFrames, (c + 1) * per) / fps;
    const ghosts = (shot.actions ?? []).filter((a) => a.sec < startSec && a.sec >= startSec - REPLAY_WINDOW);
    const s = startSec + (ghosts.length ? GHOST_LIFETIME : 0);
    if (endSec - s > 0.2) usableRanges.push([Number(s.toFixed(3)), Number(endSec.toFixed(3))]);
  }

  const entry = {
    id: shot.id, src: shot.src, html: html[shot.src], fps, dsf,
    width, height, seconds: Number((shot.seconds * secondsScale).toFixed(3)),
    frames, expected: Math.round(fps * shot.seconds * secondsScale),
    bytes, mb: Number((bytes / 1048576).toFixed(1)),
    boot: shot.boot ?? null, actions: shot.actions ?? [],
    bootApplied: results.find((r) => r.job.shot.id === shot.id)?.meta?.boot ?? null,
    chunkCount: shotChunks, usableRanges,
    complete: frames === Math.round(fps * shot.seconds * secondsScale),
    capturedAt: new Date().toISOString(),
  };
  writeFileSync(join(finalDir, 'clip.json'), JSON.stringify(entry, null, 2));
  merged.push(entry);
  process.stderr.write(`[merge] ${shot.id}: ${frames}/${entry.expected} frames, ${entry.mb} MB\n`);
}
rmSync(chunkRoot, { recursive: true, force: true });
writeFileSync(join(outRoot, 'index.json'), JSON.stringify({ fps, dsf, width, height, shots: merged, elapsedMs: Date.now() - started }, null, 2));

const incomplete = merged.filter((m) => !m.complete);
console.log(JSON.stringify({ ok: incomplete.length === 0, totalFrames: merged.reduce((a, m) => a + m.frames, 0), incomplete: incomplete.map((m) => m.id), totalMB: Number((merged.reduce((a, m) => a + m.bytes, 0) / 1048576).toFixed(1)), elapsedSec: Number(((Date.now() - started) / 1000).toFixed(1)) }, null, 1));
if (incomplete.length) process.exit(1);