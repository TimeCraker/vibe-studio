// Verify the delivered master: container/stream facts, then a fidelity check that
// pulls frames back out of the encoded file and compares them against freshly
// rendered references (PSNR), plus a contact sheet for eyeballing.
//
//   node tools/verify-master.mjs [--master products/pelican-test/pelican-test-1080p.mp4]
import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { createServer } from 'node:http';
import { extname, normalize } from 'node:path';
import { launchChrome, openPage, addInitScript, navigate, capturePng, sleep } from '../../../skills/web-capture/templates/cdp.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const REPO = resolve(ROOT, '..', '..');
const argv = process.argv.slice(2);
const arg = (k, d) => {
  const i = argv.indexOf(`--${k}`);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : d;
};
const master = resolve(arg('master', join(REPO, 'products', 'pelican-ride', 'pelican-ride-1080p.mp4')));
if (!existsSync(master)) { console.error(`missing ${master}`); process.exit(1); }

const qa = join(ROOT, 'qa', 'master');
mkdirSync(qa, { recursive: true });
const problems = [];

// ---- 1. container facts ---------------------------------------------------- //
const info = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-print_format', 'json', '-show_format', '-show_streams', master], { encoding: 'utf8' }));
const v = info.streams.find((s) => s.codec_type === 'video');
const a = info.streams.find((s) => s.codec_type === 'audio');
const dur = Number(info.format.duration);
const frames = Number(v.nb_frames ?? 0);
console.log(`master     ${master}`);
console.log(`  size     ${(statSync(master).size / 1048576).toFixed(1)} MB`);
console.log(`  video    ${v.width}x${v.height}  ${v.r_frame_rate}  ${v.codec_name}/${v.profile}  ${v.pix_fmt}  ${dur.toFixed(2)}s  ${frames || '?'} frames`);
console.log(`  audio    ${a ? `${a.codec_name} ${a.sample_rate}Hz ${a.channels}ch ${Math.round(a.bit_rate / 1000)}kbps` : 'NONE'}`);
if (!a) problems.push('no audio stream');
if (v.width !== 1920 || v.height !== 1080) problems.push(`unexpected frame size ${v.width}x${v.height}`);
if (v.pix_fmt !== 'yuv420p') problems.push(`pix_fmt ${v.pix_fmt} is not broadly compatible`);
if (Math.abs(dur - 41.0) > 0.15) problems.push(`duration ${dur.toFixed(2)}s is not the expected 41.0s`);

// ---- 2. fidelity: compare encoded frames against fresh references ---------- //
const REF = [120, 400, 900, 1500, 2100, 2380];
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png' };
const port = 9590;
const server = createServer((req, res) => {
  const rel = decodeURIComponent((req.url || '/').split('?')[0]).replace(/^\/+/, '');
  const file = join(ROOT, normalize(rel));
  if (!file.startsWith(ROOT) || !existsSync(file) || !statSync(file).isFile()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream', 'cache-control': 'no-store' });
  res.end(readFileSync(file));
});
await new Promise((r) => server.listen(port, '127.0.0.1', r));

const browser = await launchChrome({ port: 9333 });
const psnrs = [];
try {
  await openPage(browser.cdp, { width: 1920, height: 1080, deviceScaleFactor: 1 });
  await addInitScript(browser.cdp, 'window.__DSF = 1;');
  await navigate(browser.cdp, `http://127.0.0.1:${port}/edit/director.html`);
  await browser.cdp.eval('window.__boot()', { awaitPromise: true });
  for (const i of REF) {
    await browser.cdp.eval(`window.__frame(${i})`, { awaitPromise: true });
    writeFileSync(join(qa, `ref-f${String(i).padStart(5, '0')}.png`), await capturePng(browser.cdp, { optimizeForSpeed: true }));
    // pull the same frame back out of the encode
    execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-i', master,
      '-vf', `select=eq(n\\,${i})`, '-fps_mode', 'passthrough', '-frames:v', '1', '-y', join(qa, `enc-f${String(i).padStart(5, '0')}.png`)]);
    // the psnr filter logs its summary to stderr, so capture both streams
    const ps = spawnSync('ffmpeg', ['-hide_banner', '-i', join(qa, `ref-f${String(i).padStart(5, '0')}.png`),
      '-i', join(qa, `enc-f${String(i).padStart(5, '0')}.png`),
      '-lavfi', 'psnr', '-f', 'null', '-'], { encoding: 'utf8' });
    const txt = `${ps.stdout ?? ''}${ps.stderr ?? ''}`;
    const m = /average:\s*([0-9.]+|inf)/.exec(txt);
    const val = m ? (m[1] === 'inf' ? 99 : Number(m[1])) : NaN;
    psnrs.push({ i, psnr: val });
    console.log(`  frame ${String(i).padStart(4)}  PSNR ${Number.isNaN(val) ? '?' : val.toFixed(1) + ' dB'}`);
  }
} finally {
  browser.kill();
  server.close();
  await sleep(150);
}

// 36 dB is the practical "visually transparent" bar here: the reference is RGB PNG
// while the deliverable is yuv420p, so some loss is inherent to the format itself
// (and every platform re-encodes to 4:2:0 regardless).
const FLOOR = 36;
const good = psnrs.filter((p) => p.psnr >= FLOOR).length;
console.log(`\nfidelity   ${good}/${psnrs.length} sampled frames at >= ${FLOOR} dB PSNR`);
if (good < psnrs.length) problems.push(`${psnrs.length - good} sampled frames below ${FLOOR} dB PSNR`);

// ---- 3. contact sheet of the encoded frames -------------------------------- //
console.log('\nbuild a contact sheet of the encode with:');
console.log(`  python tools/contact_sheet.py --dir qa/master --out qa/master-sheet.png --cols 3 --cell 620 --lint`);

if (problems.length) {
  console.log('\nPROBLEMS:');
  for (const p of problems) console.log(`  x ${p}`);
  process.exit(1);
}
console.log('\nOK  master verified');