// Capture a deterministic PNG frame sequence from one of the pelican HTML animations.
//
//   node capture-clip.mjs --html <path> --out <dir> [options]
//
// Options
//   --fps 60            frames per second of virtual time
//   --seconds 24        length of the full virtual timeline
//   --chunk-index 0     which slice of [0,seconds) this process captures
//   --chunk-count 1     how many slices the timeline is split into (parallel-safe)
//   --width 1920 --height 1080 --dsf 2
//   --theme day|sunset|night
//   --speed 1|2|3
//   --actions <file>    JSON [{ "sec": 2.5, "code": "triggerFishJump()" }]
//   --port 9333
//   --label name        recorded in capture.json
//
// Frames are written as <out>/f<GLOBAL frame index>.png so chunks merge by copy.
// Determinism: vclock.js re-seeds Math.random per frame from absolute virtual time,
// so a chunked capture is byte-identical to a single-process capture.
import { readFileSync, mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { launchChrome, openPage, addInitScript, navigate, capturePng, sleep } from './cdp.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));

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
if (!args.html || !args.out) {
  console.error('usage: node capture-clip.mjs --html <path> --out <dir> [--fps 60] [--seconds 24]');
  process.exit(2);
}

const htmlPath = resolve(args.html);
const outDir = resolve(args.out);
const fps = Number(args.fps ?? 60);
const seconds = Number(args.seconds ?? 24);
const width = Number(args.width ?? 1920);
const height = Number(args.height ?? 1080);
const dsf = Number(args.dsf ?? 1);
const port = Number(args.port ?? 9333);
const theme = args.theme ?? 'day';
const speed = String(args.speed ?? '1');
const optimizeForSpeed = args.optimize === 'true';
const label = String(args.label ?? '');
const chunkIndex = Number(args.chunkIndex ?? 0);
const chunkCount = Number(args.chunkCount ?? 1);

const totalFrames = Math.max(1, Math.round(fps * seconds));
const dtMs = 1000 / fps;
const per = Math.ceil(totalFrames / chunkCount);
const i0 = chunkIndex * per;
const i1 = Math.min(totalFrames, i0 + per);
if (i0 >= i1) {
  console.error(`chunk ${chunkIndex}/${chunkCount} is empty (nothing to capture)`);
  process.exit(0);
}

// Transient events (bell, fish) live for <=1.5s. When this process only owns a slice
// of the timeline, replay events that fired just before the slice so their lingering
// effect is present, and skip anything older than that window.
const ALL_ACTIONS = args.actions
  ? JSON.parse(readFileSync(resolve(args.actions), 'utf8')).sort((a, b) => a.sec - b.sec)
  : [];
const chunkStartMs = i0 * dtMs;
const REPLAY_WINDOW_MS = 2000;
const actions = ALL_ACTIONS.filter((a) => a.sec * 1000 >= chunkStartMs - REPLAY_WINDOW_MS);
let actionCursor = 0;

mkdirSync(outDir, { recursive: true });

const browser = await launchChrome({ port });
const t0 = Date.now();
let written = 0;
let bytes = 0;
try {
  await openPage(browser.cdp, { width, height, deviceScaleFactor: dsf });
  await addInitScript(browser.cdp, readFileSync(join(HERE, 'vclock.js'), 'utf8'));
  if (args.setup) await addInitScript(browser.cdp, readFileSync(resolve(args.setup), 'utf8'));

  await navigate(browser.cdp, pathToFileURL(htmlPath).href);

  // Discover what is actually interactive, then run the per-shot boot script,
  // which drives the app through its real UI controls.
  const boot = await browser.cdp.eval(`(() => {
    const summary = {
      theme: document.body.getAttribute('data-theme'),
      buttons: [...document.querySelectorAll('button')].map((b) => b.id).filter(Boolean),
      ranges: [...document.querySelectorAll('input[type=range]')].map((r) => r.id),
    };
    return summary;
  })()`);
  if (args.boot) {
    boot.applied = await browser.cdp.eval(`(() => { ${readFileSync(resolve(args.boot), 'utf8')} return document.body.getAttribute('data-theme'); })()`);
  }
  await browser.cdp.eval('window.__vclock.tick(), null');

  const pingStart = Date.now();
  await capturePng(browser.cdp, { optimizeForSpeed });
  const firstShotMs = Date.now() - pingStart;

  for (let i = i0; i < i1; i++) {
    const tMs = i * dtMs;
    await browser.cdp.eval(`window.__vclock.stepTo(${tMs.toFixed(4)}), null`);

    let ranAction = false;
    while (actionCursor < actions.length && actions[actionCursor].sec * 1000 <= tMs + dtMs * 0.5) {
      const act = actions[actionCursor++];
      try { await browser.cdp.eval(`(() => { ${act.code} })()`); } catch (e) { console.error(`action @${act.sec}s failed: ${e.message}`); }
      ranAction = true;
    }
    if (ranAction) await browser.cdp.eval('window.__vclock.tick(), null');

    const png = await capturePng(browser.cdp, { optimizeForSpeed });
    writeFileSync(join(outDir, `f${String(i).padStart(5, '0')}.png`), png);
    written++;
    bytes += png.length;
    if (written % 60 === 0) {
      const rate = (Date.now() - t0) / written;
      console.error(`  [${label || chunkIndex}] ${written}/${i1 - i0} frames  ${rate.toFixed(0)}ms/frame  eta ${(((i1 - i0 - written) * rate) / 1000).toFixed(0)}s`);
    }
  }

  const meta = {
    label, html: htmlPath, fps, seconds, totalFrames, width, height, dsf, theme, speed,
    chunkIndex, chunkCount, capturedFrames: written, capturedBytes: bytes,
    avgFrameBytes: Math.round(bytes / Math.max(1, written)),
    firstShotMs, elapsedMs: Date.now() - t0, msPerFrame: (Date.now() - t0) / Math.max(1, written),
    boot, actions: ALL_ACTIONS.map((a) => a.sec), replayed: actions.map((a) => a.sec),
  };
  writeFileSync(join(outDir, `capture.chunk${chunkIndex}.json`), JSON.stringify(meta, null, 2));
  console.log(JSON.stringify(meta));
} finally {
  browser.kill();
  await sleep(150);
}