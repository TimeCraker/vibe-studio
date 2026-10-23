// Profile screenshot cost on the director page under different capture settings,
// to pick the fastest option that still looks right.
//
//   node tools/profile-capture.mjs
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve, extname, normalize } from 'node:path';
import { launchChrome, openPage, addInitScript, navigate, sleep } from './cdp.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const port = 9580;

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png' };
const server = createServer((req, res) => {
  const rel = decodeURIComponent((req.url || '/').split('?')[0]).replace(/^\/+/, '');
  const file = join(ROOT, normalize(rel));
  if (!file.startsWith(ROOT) || !existsSync(file) || !statSync(file).isFile()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream', 'cache-control': 'no-store' });
  res.end(readFileSync(file));
});
await new Promise((r) => server.listen(port, '127.0.0.1', r));

const CASES = [
  { name: 'png baseline', args: [], shot: { format: 'png' } },
  { name: 'png fast', args: [], shot: { format: 'png', optimizeForSpeed: true } },
  { name: 'png no-flush', args: [], noFlush: true, shot: { format: 'png' } },
  { name: 'jpeg q95', args: [], shot: { format: 'jpeg', quality: 95 } },
  { name: 'jpeg q90 fast', args: [], shot: { format: 'jpeg', quality: 90, optimizeForSpeed: true } },
];

// a mix of a title card and a real clip frame, so decode cost is included
const FRAMES = [150, 300, 470, 620, 740, 900, 2650, 2900];

for (const c of CASES) {
  const extra = [...c.args];
  const browser = await launchChrome({ port: 9333, extraArgs: extra, noFlush: c.noFlush });
  try {
    await openPage(browser.cdp, { width: 1920, height: 1080, deviceScaleFactor: 1 });
    await addInitScript(browser.cdp, 'window.__DSF = 1;');
    await navigate(browser.cdp, `http://127.0.0.1:${port}/edit/director.html`);
    await browser.cdp.eval('window.__boot()', { awaitPromise: true });
    const times = [];
    let bytes = 0;
    for (const i of FRAMES) {
      const t0 = Date.now();
      await browser.cdp.eval(`window.__frame(${i})`, { awaitPromise: true });
      const t1 = Date.now();
      const { data } = await browser.cdp.send('Page.captureScreenshot', { fromSurface: true, captureBeyondViewport: false, ...c.shot });
      const t2 = Date.now();
      times.push([t1 - t0, t2 - t1]);
      bytes += Buffer.from(data, 'base64').length;
    }
    const avg = (k) => times.reduce((a, b) => a + b[k], 0) / times.length;
    console.log(`${c.name.padEnd(16)} render ${avg(0).toFixed(0).padStart(4)}ms  shot ${avg(1).toFixed(0).padStart(4)}ms  ` +
      `total ${(avg(0) + avg(1)).toFixed(0).padStart(4)}ms/frame  avg ${(bytes / times.length / 1024).toFixed(0)} KB`);
  } finally {
    browser.kill();
    await sleep(200);
  }
}
server.close();