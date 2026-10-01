// Render the director to a video (or to sample stills for review).
//
//   node <skill>/templates/render-director.mjs [--project <dir>] --out render/video.mp4
//   node <skill>/templates/render-director.mjs [--project <dir>] --sample 0,60,300
//   node <skill>/templates/render-director.mjs [--project <dir>] --cover
//
// --project defaults to the current directory. The project must expose
// edit/director.html implementing window.__boot() / __frame(i) / __debug()
// (and __cover(opts) for --cover); the contract is in SKILL.md.
//
// Serves the project over loopback (so the page can fetch frames/*.png and
// sections.json), drives window.__frame(i) for every frame, and streams each
// screenshot straight into ffmpeg — no 4 GB of intermediate PNGs on disk.
import { createServer } from 'node:http';
import { readFileSync, mkdirSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { join, resolve, extname, normalize } from 'node:path';
import { spawn } from 'node:child_process';
import { launchChrome, openPage, addInitScript, navigate, capturePng, sleep } from './cdp.mjs';
import { parseArgs, projectRoot } from './paths.mjs';

const args = parseArgs(process.argv.slice(2));
const ROOT = projectRoot(args);
const dsf = Math.max(1, Math.min(4, Number(args.dsf ?? 1)));
const crf = Number(args.crf ?? 15);
// preset only trades encode time against file size at a fixed CRF — never quality.
// medium is the default because the paper texture defeats x264's block skipping and
// slow was the bottleneck for the whole pipeline (2.5fps vs 4.8fps).
const preset = String(args.preset ?? 'medium');
const port = Number(args.port ?? 9520);
const outPath = resolve(args.out ?? join(ROOT, 'render', 'video.mp4'));
const sampleList = args.sample && args.sample !== true ? String(args.sample).split(',').map(Number) : null;
const isSample = Array.isArray(sampleList);
const startFrame = Number(args.start ?? 0);

// --------------------------------------------------------------------------- //
// static file server
// --------------------------------------------------------------------------- //
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.png': 'image/png', '.wav': 'audio/wav', '.mp4': 'video/mp4', '.svg': 'image/svg+xml',
};
const server = createServer((req, res) => {
  const rel = decodeURIComponent((req.url || '/').split('?')[0]).replace(/^\/+/, '');
  const file = join(ROOT, normalize(rel));
  if (!file.startsWith(ROOT) || !existsSync(file) || !statSync(file).isFile()) {
    res.writeHead(404); res.end('not found'); return;
  }
  res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream', 'cache-control': 'no-store' });
  res.end(readFileSync(file));
});
await new Promise((r) => server.listen(port, '127.0.0.1', r));

// --------------------------------------------------------------------------- //
// ffmpeg sink (full renders only)
// --------------------------------------------------------------------------- //
let ff = null;
let ffDone = null;
if (!isSample && !args.cover) {
  mkdirSync(dirname(outPath), { recursive: true });
  ff = spawn('ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-stats',
    '-f', 'image2pipe', '-framerate', '60', '-i', '-',
    '-an',
    '-c:v', 'libx264', '-preset', preset, '-crf', String(crf),
    '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-level', '4.2',
    '-movflags', '+faststart',
    '-y', outPath,
  ], { stdio: ['pipe', 'inherit', 'inherit'] });
  ffDone = new Promise((res) => ff.on('close', (code) => res(code)));
}

// --------------------------------------------------------------------------- //
// drive the page
// --------------------------------------------------------------------------- //
const browser = await launchChrome({ port: 9333 });
let code = 0;
try {
  await openPage(browser.cdp, { width: 1920, height: 1080, deviceScaleFactor: dsf });
  await addInitScript(browser.cdp, `window.__DSF = ${dsf};`);
  await navigate(browser.cdp, `http://127.0.0.1:${port}/edit/director.html`);
  const boot = await browser.cdp.eval('window.__boot()', { awaitPromise: true });
  console.log('boot:', JSON.stringify(boot));

  if (isSample) {
    const dir = resolve(args.out ?? join(ROOT, 'render', 'samples'));
    mkdirSync(dir, { recursive: true });
    const profile = [];
    for (const i of sampleList) {
      const t0 = Date.now();
      await browser.cdp.eval(`window.__frame(${i})`, { awaitPromise: true });
      const t1 = Date.now();
      const png = await capturePng(browser.cdp);
      const t2 = Date.now();
      const p = join(dir, `f${String(i).padStart(5, '0')}.png`);
      writeFileSync(p, png);
      profile.push({ i, renderMs: t1 - t0, shotMs: t2 - t1, kb: Math.round(png.length / 1024) });
      console.log(`  ${p}  ${(png.length / 1024).toFixed(0)} KB   render=${t1 - t0}ms shot=${t2 - t1}ms`);
    }
    const avgR = profile.reduce((a, b) => a + b.renderMs, 0) / profile.length;
    const avgS = profile.reduce((a, b) => a + b.shotMs, 0) / profile.length;
    console.log(`  avg render=${avgR.toFixed(0)}ms  avg screenshot=${avgS.toFixed(0)}ms  -> ${(avgR + avgS).toFixed(0)}ms/frame`);
    const dbg = await browser.cdp.eval('window.__debug()');
    if (dbg.missingCount) console.log('missing frames:', JSON.stringify(dbg, null, 1));
  } else if (args.cover) {
    // Cover variants are project data ("which frame looks good" is a judgement about
    // this project's footage), so they live in the project rather than in the harness.
    const coversPath = join(ROOT, 'edit', 'covers.json');
    if (!existsSync(coversPath)) throw new Error(`--cover needs ${coversPath}`);
    const { variants } = JSON.parse(readFileSync(coversPath, 'utf8'));
    const dir = join(ROOT, 'render', 'covers');
    mkdirSync(dir, { recursive: true });
    for (const v of variants.filter((x) => x && x.name && x.shot)) {
      await browser.cdp.eval(`window.__cover(${JSON.stringify(v)})`, { awaitPromise: true });
      const png = await capturePng(browser.cdp);
      const p = join(dir, `${v.name}.png`);
      writeFileSync(p, png);
      console.log(`  ${p}  ${(png.length / 1024).toFixed(0)} KB`);
    }
  } else {
    const total = Math.round((boot.frames ?? 0));
    const t0 = Date.now();
    for (let i = startFrame; i < total; i++) {
      // awaitPromise matters: __frame loads source frames asynchronously, and a
      // screenshot taken before it settles would capture the wrong picture
      await browser.cdp.eval(`window.__frame(${i})`, { awaitPromise: true });
      const png = await capturePng(browser.cdp, { optimizeForSpeed: true });
      if (!ff.stdin.write(png)) await new Promise((r) => ff.stdin.once('drain', r));
      if (i % 120 === 0 || i === total - 1) {
        const done = i - startFrame + 1;
        const rate = (Date.now() - t0) / done;
        process.stderr.write(`  frame ${i + 1}/${total}  ${rate.toFixed(0)} ms/frame  eta ${(((total - i - 1) * rate) / 1000 / 60).toFixed(1)} min\n`);
      }
    }
    ff.stdin.end();
    code = await ffDone;
    const dbg = await browser.cdp.eval('window.__debug()');
    if (dbg.missingCount) console.log('missing frames:', JSON.stringify(dbg, null, 1));
    console.log(`ffmpeg exit ${code}; wrote ${outPath}`);
  }
} finally {
  browser.kill();
  server.close();
  await sleep(150);
}
process.exit(code);