// Load an HTML/SVG animation and dump its interactive controls,
// so capture actions can drive the app the same way a user would.
//
//   node <skill>/templates/probe-ui.mjs --html <path> [--project <dir>]
//        [--width 1920] [--height 1080] [--port 9333] [--shot <out.png>]
import { readFileSync } from 'node:fs';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { launchChrome, openPage, addInitScript, navigate, capturePng, sleep } from './cdp.mjs';
import { parseArgs, projectRoot } from './paths.mjs';

// HERE locates the harness's own siblings (vclock.js); the project comes from --project
const HERE = dirname(fileURLToPath(import.meta.url));
const args = parseArgs(process.argv.slice(2));
const ROOT = projectRoot(args);
const abs = (p) => (!p ? p : /^[A-Za-z]:[\\/]|^[\\/]/.test(p) ? resolve(p) : resolve(ROOT, p));
const browser = await launchChrome({ port: Number(args.port ?? 9333) });
try {
  await openPage(browser.cdp, { width: Number(args.width ?? 1920), height: Number(args.height ?? 1080), deviceScaleFactor: 1 });
  await addInitScript(browser.cdp, readFileSync(join(HERE, 'vclock.js'), 'utf8'));
  await navigate(browser.cdp, pathToFileURL(abs(args.html)).href);
  await browser.cdp.eval('window.__vclock.tick(), null');
  const info = await browser.cdp.eval(`(() => {
    const describe = (el) => ({
      tag: el.tagName.toLowerCase(),
      id: el.id || null,
      cls: el.className && typeof el.className === 'string' ? el.className : null,
      type: el.getAttribute('type'),
      title: el.getAttribute('title'),
      text: (el.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 30),
      value: el.value ?? null,
      min: el.getAttribute('min'), max: el.getAttribute('max'), step: el.getAttribute('step'),
    });
    return {
      title: document.title,
      theme: document.body.getAttribute('data-theme'),
      viewport: [innerWidth, innerHeight],
      buttons: [...document.querySelectorAll('button, [role=button], .btn')].map(describe),
      inputs: [...document.querySelectorAll('input, select')].map(describe),
      svg: [...document.querySelectorAll('svg')].map((s) => ({ id: s.id || null, cls: s.getAttribute('class'), viewBox: s.getAttribute('viewBox') })),
      keyHint: (document.body.innerText.match(/[^\\n]*快捷键[^\\n]*/) || [''])[0].slice(0, 120),
      overflow: { sw: document.documentElement.scrollWidth, sh: document.documentElement.scrollHeight },
    };
  })()`);
  console.log(JSON.stringify(info, null, 1));
  if (args.shot) await capturePng(browser.cdp).then((b) => import('node:fs').then((fs) => fs.writeFileSync(resolve(args.shot), b)));
} finally {
  browser.kill();
  await sleep(120);
}