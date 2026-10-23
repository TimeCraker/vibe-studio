// Stateful pages replay from zero; seek mode requires a pure __captureSeek(ms).
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { launchChrome, openPage, addInitScript, navigate, capturePng, sleep } from './cdp.mjs';
import { parseArgs, projectRoot } from './paths.mjs';
const HERE = dirname(fileURLToPath(import.meta.url));
const args = parseArgs(process.argv.slice(2));
const ROOT = projectRoot(args), abs = (p) => resolve(ROOT, p);
if (!args.html || !args.out) throw new Error('usage: capture-clip.mjs --html <path> --out <dir> [--mode replay|seek]');
const fps = Number(args.fps ?? 60), seconds = Number(args.seconds ?? 24);
const width = Number(args.width ?? 1920), height = Number(args.height ?? 1080), dsf = Number(args.dsf ?? 1);
const chunkIndex = Number(args.chunkIndex ?? 0), chunkCount = Number(args.chunkCount ?? 1);
const mode = String(args.mode ?? 'replay');
if (![fps, seconds, width, height, dsf].every((v) => Number.isFinite(v) && v > 0)
    || !Number.isInteger(chunkIndex) || !Number.isInteger(chunkCount) || chunkIndex < 0 || chunkCount < 1 || chunkIndex >= chunkCount
    || !['replay', 'seek'].includes(mode)) throw new Error('Invalid capture dimensions, time, chunk or mode');
const totalFrames = Math.max(1, Math.round(fps * seconds));
const per = Math.ceil(totalFrames / chunkCount), i0 = chunkIndex * per, i1 = Math.min(totalFrames, i0 + per);
if (i0 >= i1) throw new Error('Empty chunk; reduce chunk count');
const actions = args.actions ? JSON.parse(readFileSync(abs(args.actions), 'utf8')).sort((a, b) => a.sec - b.sec) : [];
if (!actions.every((a) => Number.isFinite(a.sec) && a.sec >= 0 && typeof a.code === 'string')) throw new Error('Invalid actions');
if (mode === 'seek' && actions.length) throw new Error('Seek mode cannot replay UI actions; use replay mode');
const outDir = abs(args.out); mkdirSync(outDir, { recursive: true });
const browser = await launchChrome({ port: Number(args.port ?? 9333) });
const stop = () => { browser.kill(); process.exit(130); };
process.once('SIGINT', stop); process.once('SIGTERM', stop);
let written = 0, bytes = 0, actionCursor = 0;
const t0 = Date.now();
try {
  await openPage(browser.cdp, { width, height, deviceScaleFactor: dsf });
  await addInitScript(browser.cdp, readFileSync(join(HERE, 'vclock.js'), 'utf8'));
  if (args.setup) await addInitScript(browser.cdp, readFileSync(abs(args.setup), 'utf8'));
  let pageError = null;
  browser.cdp.on('Runtime.exceptionThrown', (event) => { pageError = event.exceptionDetails?.exception?.description ?? event.exceptionDetails?.text ?? 'page exception'; });
  await navigate(browser.cdp, pathToFileURL(abs(args.html)).href);
  if (args.boot) await browser.cdp.eval(`(() => { ${readFileSync(abs(args.boot), 'utf8')} })()`);
  await browser.cdp.eval('Promise.all([document.fonts.ready, ...Array.from(document.images, img => img.decode())]).then(()=>null)', { awaitPromise: true });
  if (mode === 'seek' && !await browser.cdp.eval('typeof window.__captureSeek === "function"')) throw new Error('Seek mode requires window.__captureSeek(ms)');
  for (let i = mode === 'replay' ? 0 : i0; i < i1; i++) {
    const ms = i * 1000 / fps;
    if (mode === 'seek') {
      await browser.cdp.eval(`window.__vclock.setTime(${ms}); Promise.resolve(window.__captureSeek(${ms})).then(()=>null)`, { awaitPromise: true });
    } else {
      const due = [];
      while (actionCursor < actions.length && actions[actionCursor].sec * 1000 <= ms + 1e-6) due.push(actions[actionCursor++].code);
      await browser.cdp.eval(`window.__vclock.setTime(${ms}); ${due.map((code) => `(() => { ${code} })();`).join('\n')} window.__vclock.stepTo(${ms}); null`);
    }
    if (pageError) throw new Error(`Page failed at frame ${i}: ${pageError}`);
    if (i < i0) continue;
    const png = await capturePng(browser.cdp, { optimizeForSpeed: args.optimize === 'true' });
    writeFileSync(join(outDir, `f${String(i).padStart(5, '0')}.png`), png);
    written++; bytes += png.length;
    if (written % 60 === 0) console.error(`[${args.label ?? chunkIndex}] ${written}/${i1 - i0} frames`);
  }
  const meta = { label: args.label ?? '', html: abs(args.html), fps, seconds, totalFrames, width, height, dsf, mode,
    chunkIndex, chunkCount, prerollFrames: mode === 'replay' ? i0 : 0, capturedFrames: written, capturedBytes: bytes,
    elapsedMs: Date.now() - t0, actions: actions.map((a) => a.sec) };
  writeFileSync(join(outDir, `capture.chunk${chunkIndex}.json`), JSON.stringify(meta, null, 2));
  console.log(JSON.stringify(meta));
} finally {
  process.removeListener('SIGINT', stop); process.removeListener('SIGTERM', stop);
  browser.kill(); await sleep(100);
}
