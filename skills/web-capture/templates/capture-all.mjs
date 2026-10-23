// Project shot manifest -> bounded workers -> verified complete frame directories.
import { readFileSync, writeFileSync, mkdirSync, rmSync, renameSync, existsSync, readdirSync, statSync, lstatSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve, relative, isAbsolute } from 'node:path';
import { spawn } from 'node:child_process';
import { parseArgs, projectRoot, resolveShotViewport } from './paths.mjs';
const HERE = dirname(fileURLToPath(import.meta.url));
const args = parseArgs(process.argv.slice(2)), ROOT = projectRoot(args);
const cfg = JSON.parse(readFileSync(join(ROOT, 'capture', 'shots.json'), 'utf8'));
const fps = Number(args.fps ?? cfg.fps ?? 60), dsf = Number(args.dsf ?? cfg.dsf ?? 2);
const globalViewport = resolveShotViewport({}, args, cfg);
const chunkCount = Number(args.chunkCount ?? cfg.chunkCount ?? 1), concurrency = Number(args.concurrency ?? cfg.concurrency ?? 4);
const secondsScale = Number(args.secondsScale ?? 1), timeoutMs = Number(args.timeoutSeconds ?? cfg.timeoutSeconds ?? 1800) * 1000;
if (![fps, dsf, secondsScale, timeoutMs].every((v) => Number.isFinite(v) && v > 0) || ![chunkCount, concurrency].every((v) => Number.isInteger(v) && v > 0)) throw new Error('Invalid capture options');
const outRoot = resolve(ROOT, args.out ?? 'frames');
if (outRoot === ROOT) throw new Error('Frame output cannot be project root');
const html = Object.fromEntries(Object.entries(cfg.sources ?? { A: cfg.htmlA, B: cfg.htmlB }).filter(([, v]) => v).map(([k, v]) => [k, resolve(ROOT, v)]));
const wanted = args.only ? String(args.only).split(',') : null;
if (!Array.isArray(cfg.shots) || !cfg.shots.length) throw new Error('shots must be a non-empty array');
const ids = new Set();
for (const shot of cfg.shots) {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/.test(shot.id) || ids.has(shot.id)) throw new Error(`Invalid/duplicate shot id: ${shot.id}`);
  ids.add(shot.id);
  if (!html[shot.src] || !existsSync(html[shot.src]) || !Number.isFinite(shot.seconds) || shot.seconds <= 0) throw new Error(`Invalid shot source/duration: ${shot.id}`);
}
if (wanted?.some((id) => !ids.has(id))) throw new Error('Unknown shot in --only');
const shots = cfg.shots.filter((s) => !wanted || wanted.includes(s.id));
const jobs = [], viewports = new Map();
let nextPort = Number(args.port ?? 9400);
for (const shot of shots) {
  viewports.set(shot.id, resolveShotViewport(shot, args, cfg));
  const n = Number(shot.chunkCount ?? chunkCount), seconds = shot.seconds * secondsScale;
  const mode = shot.mode ?? cfg.mode ?? 'replay';
  if (!Number.isInteger(n) || n < 1 || n > Math.round(seconds * fps) || !['replay', 'seek'].includes(mode)) throw new Error(`Invalid shot chunks/mode: ${shot.id}`);
  for (let c = 0; c < n; c++) jobs.push({ shot, n, c, seconds, mode, port: nextPort++ });
}
if (args.dry) {
  console.log(JSON.stringify({ fps, dsf, ...globalViewport, concurrency, outRoot, jobs: jobs.length, shots: shots.map((s) => ({ id: s.id, mode: s.mode ?? cfg.mode ?? 'replay', ...viewports.get(s.id) })) }, null, 2));
  process.exit(0);
}
const marker = join(outRoot, '.capture-owner.json');
if (existsSync(outRoot) && readdirSync(outRoot).length && !existsSync(marker)) throw new Error('Output directory is not owned by this capture; choose an empty --out directory');
if (existsSync(marker) && JSON.parse(readFileSync(marker, 'utf8')).project !== ROOT) throw new Error('Output belongs to another project');
mkdirSync(outRoot, { recursive: true }); writeFileSync(marker, JSON.stringify({ project: ROOT }));
function removeOwned(path) {
  const rel = relative(outRoot, resolve(path));
  if (!rel || rel.startsWith('..') || isAbsolute(rel)) throw new Error('Refusing unsafe capture cleanup');
  for (let p = resolve(path); p !== outRoot; p = dirname(p)) if (existsSync(p) && lstatSync(p).isSymbolicLink()) throw new Error('Refusing symlink capture cleanup');
  rmSync(path, { recursive: true, force: true });
}
const chunkRoot = join(outRoot, '_chunks');
const started = Date.now();
function runJob(job) {
  return new Promise((done) => {
    const { shot, n, c, seconds, mode, port } = job;
    const dir = join(chunkRoot, shot.id, `c${c}`); removeOwned(dir); mkdirSync(dir, { recursive: true });
    const actionFile = join(dir, 'actions.json'); writeFileSync(actionFile, JSON.stringify(shot.actions ?? []));
    const vp = viewports.get(shot.id);
    const argv = [join(HERE, 'capture-clip.mjs'), '--project', ROOT, '--html', html[shot.src], '--out', dir, '--fps', String(fps), '--seconds', String(seconds), '--chunk-index', String(c), '--chunk-count', String(n), '--width', String(vp.width), '--height', String(vp.height), '--dsf', String(dsf), '--port', String(port), '--mode', mode, '--actions', actionFile, '--label', `${shot.id}#${c}`];
    if (shot.boot) argv.push('--boot', join(ROOT, 'capture', 'boot', shot.boot));
    const child = spawn(process.execPath, argv, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '', timedOut = false;
    const timer = setTimeout(() => { timedOut = true; child.kill(); }, timeoutMs);
    child.stdout.on('data', (d) => { stdout += d; });
    child.stderr.on('data', (d) => process.stderr.write(`[${shot.id}#${c}] ${d}`));
    child.once('error', (error) => { clearTimeout(timer); done({ job, code: 1, error: error.message }); });
    child.once('close', (code) => {
      clearTimeout(timer); let meta;
      try { meta = JSON.parse(stdout.trim().split('\n').at(-1)); } catch { /* failure retained below */ }
      done({ job, code: timedOut ? 124 : code, meta });
    });
  });
}
const results = []; let cursor = 0;
await Promise.all(Array.from({ length: Math.min(concurrency, jobs.length) }, async () => { while (cursor < jobs.length) results.push(await runJob(jobs[cursor++])); }));
if (results.some((r) => r.code !== 0 || !r.meta)) throw new Error(`Capture workers failed; previous frames retained: ${results.filter((r) => r.code !== 0 || !r.meta).map((r) => `${r.job.shot.id}#${r.job.c}:${r.code}`).join(', ')}`);
const merged = [];
for (const shot of shots) {
  const expected = Math.max(1, Math.round(fps * shot.seconds * secondsScale));
  const files = results.filter((r) => r.job.shot.id === shot.id).flatMap((r) => {
    const dir = join(chunkRoot, shot.id, `c${r.job.c}`);
    return readdirSync(dir).filter((name) => /^f\d+\.png$/.test(name)).map((name) => ({ name, path: join(dir, name) }));
  });
  const names = new Set(files.map((f) => f.name));
  if (files.length !== expected || names.size !== expected || Array.from({ length: expected }, (_, i) => `f${String(i).padStart(5, '0')}.png`).some((f) => !names.has(f))) throw new Error(`Incomplete frame sequence: ${shot.id}`);
  const dir = join(outRoot, shot.id); removeOwned(dir); mkdirSync(dir, { recursive: true });
  let bytes = 0;
  for (const file of files) { bytes += statSync(file.path).size; renameSync(file.path, join(dir, file.name)); }
  const entry = { id: shot.id, src: shot.src, html: html[shot.src], fps, dsf, ...viewports.get(shot.id), seconds: shot.seconds * secondsScale, frames: expected, expected, bytes,
    mode: shot.mode ?? cfg.mode ?? 'replay', chunkCount: shot.chunkCount ?? chunkCount, usableRanges: [[0, shot.seconds * secondsScale]], complete: true, capturedAt: new Date().toISOString() };
  writeFileSync(join(dir, 'clip.json'), JSON.stringify(entry, null, 2)); merged.push(entry);
}
removeOwned(chunkRoot);
const previous = existsSync(join(outRoot, 'index.json')) ? JSON.parse(readFileSync(join(outRoot, 'index.json'), 'utf8')).shots ?? [] : [];
const all = [...previous.filter((s) => !shots.some((current) => current.id === s.id)), ...merged];
writeFileSync(join(outRoot, 'index.json'), JSON.stringify({ fps, dsf, ...globalViewport, shots: all, elapsedMs: Date.now() - started }, null, 2));
console.log(JSON.stringify({ ok: true, shots: merged.length, frames: merged.reduce((n, s) => n + s.frames, 0), elapsedMs: Date.now() - started }));
