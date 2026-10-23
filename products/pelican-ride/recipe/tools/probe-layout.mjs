// Report where the typography actually lands on a given frame, and flag overlaps
// with the caption band. Sibling of probe-anchors.mjs: measure, don't squint.
//
//   node tools/probe-layout.mjs --frames 150,2250,3580
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve, extname, normalize } from 'node:path';
import { launchChrome, openPage, addInitScript, navigate, sleep } from '../../../skills/web-capture/templates/cdp.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const argv = process.argv.slice(2);
const arg = (k, d) => {
  const i = argv.indexOf(`--${k}`);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : d;
};
const frames = String(arg('frames', '150,2250,3580')).split(',').map(Number);
const port = Number(arg('port', 9595));

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png' };
const server = createServer((req, res) => {
  const rel = decodeURIComponent((req.url || '/').split('?')[0]).replace(/^\/+/, '');
  const file = join(ROOT, normalize(rel));
  if (!file.startsWith(ROOT) || !existsSync(file) || !statSync(file).isFile()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream', 'cache-control': 'no-store' });
  res.end(readFileSync(file));
});
await new Promise((r) => server.listen(port, '127.0.0.1', r));

const SEL = ['.head', '.band', '.bandrule', '.band-inner', '.band-top', '.cap',
  '.page', '.main', '.rail', '.pull', '.agenda', '.facts', '.check',
  '.thumblabel', '.note-label', '.plate-label', '.vrule',
  '.kicker', '.display', '.prose', '.foot', '.stat', '.stat-l', '.handle', '.table', '.trow'];

const browser = await launchChrome({ port: 9333 });
try {
  await openPage(browser.cdp, { width: 1920, height: 1080, deviceScaleFactor: 1 });
  await addInitScript(browser.cdp, 'window.__DSF = 1;');
  await navigate(browser.cdp, `http://127.0.0.1:${port}/edit/director.html`);
  await browser.cdp.eval('window.__boot()', { awaitPromise: true });

  for (const f of frames) {
    await browser.cdp.eval(`window.__frame(${f})`, { awaitPromise: true });
    const info = await browser.cdp.eval(`(() => {
      const sel = ${JSON.stringify(SEL)};
      const rects = [];
      for (const s of sel) {
        for (const el of document.querySelectorAll(s)) {
          const r = el.getBoundingClientRect();
          if (r.width < 1 || r.height < 1) continue;
          rects.push({ sel: s, x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height),
                       txt: (el.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 22) });
        }
      }
      const band = document.querySelector('.band');
      const bandTop = band ? band.getBoundingClientRect().top : 1080;
      const main = document.querySelector('.main');
      const page = document.querySelector('.page');
      const box = (el) => (el ? { client: el.clientHeight, scroll: el.scrollHeight, cs: getComputedStyle(el).height, bottom: getComputedStyle(el).bottom, top: getComputedStyle(el).top } : null);
      return { rects, bandTop: Math.round(bandTop), unit: document.querySelector('.band-kicker')?.textContent ?? '',
               mainBox: box(main), pageBox: box(page) };
    })()`);

    console.log(`\n--- frame ${f}  (${info.unit})  bandTop=${info.bandTop} ---`);
    console.log(`  .page  client=${info.pageBox?.client} scroll=${info.pageBox?.scroll} computedH=${info.pageBox?.cs} top=${info.pageBox?.top} bottom=${info.pageBox?.bottom}`);
    console.log(`  .main  client=${info.mainBox?.client} scroll=${info.mainBox?.scroll} computedH=${info.mainBox?.cs}`);
    const above = info.rects.filter((r) => r.sel !== '.band' && r.sel !== '.band-inner' && r.sel !== '.band-top' && r.sel !== '.cap' && r.sel !== '.bandrule');
    for (const r of info.rects) {
      console.log(`  ${r.sel.padEnd(13)} x${String(r.x).padStart(5)} y${String(r.y).padStart(5)} w${String(r.w).padStart(5)} h${String(r.h).padStart(4)}  ${r.txt}`);
    }
    // anything that should sit above the band must not cross bandTop
    for (const r of above) {
      if (r.y + r.h > info.bandTop + 1 && r.sel !== '.page') {
        console.log(`  !! ${r.sel} bottom ${r.y + r.h} crosses the band top ${info.bandTop}  ("${r.txt}")`);
      }
    }
  }
} finally {
  browser.kill();
  server.close();
  await sleep(150);
}