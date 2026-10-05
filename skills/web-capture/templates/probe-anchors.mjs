// Report where the interesting parts of each animation actually are on screen,
// in normalised source coordinates, so annotations can be anchored to real
// features instead of guessed pixel positions.
//
//   node <skill>/templates/probe-anchors.mjs [--project <dir>]
//
// Targets come from <project>/capture/anchor-targets.json (element ids are project
// data, so they live in the project, not here):
//   { "A": { "html": "<project-relative or absolute path>",
//            "ids": ["bike-bell-button", "pelican-pouch", ...],
//            "viewport": {"width": 2880, "height": 1560} }, ... }
// `viewport` is optional per entry (default 1920x1080). Set it to the viewport the
// scene is CAPTURED at, so the normalised ratios in anchors.json line up with the
// frames they will be drawn over. Invalid pairs are ignored with a warning.
// Writes <project>/capture/anchors.json.
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { launchChrome, openPage, addInitScript, navigate, sleep } from './cdp.mjs';
import { parseArgs, projectRoot, resolveShotViewport } from './paths.mjs';

// HERE locates the harness's own siblings (vclock.js); the project comes from --project
const HERE = dirname(fileURLToPath(import.meta.url));
const args = parseArgs(process.argv.slice(2));
const ROOT = projectRoot(args);

const targetsPath = join(ROOT, 'capture', 'anchor-targets.json');
if (!existsSync(targetsPath)) throw new Error(`missing ${targetsPath}`);
// `_`-prefixed keys are file-local metadata (e.g. "_comment"), not targets
const TARGETS = Object.fromEntries(
  Object.entries(JSON.parse(readFileSync(targetsPath, 'utf8'))).filter(([k]) => !k.startsWith('_')),
);
const abs = (p) => (/^[A-Za-z]:[\\/]|^[\\/]/.test(p) ? resolve(p) : resolve(ROOT, p));

const out = {};
let port = 9560;
for (const [name, cfg] of Object.entries(TARGETS)) {
  const vp = resolveShotViewport({ ...cfg, id: name }, {}, {});
  const browser = await launchChrome({ port: port++ });
  try {
    await openPage(browser.cdp, { width: vp.width, height: vp.height, deviceScaleFactor: 1 });
    await addInitScript(browser.cdp, readFileSync(join(HERE, 'vclock.js'), 'utf8'));
    await navigate(browser.cdp, pathToFileURL(abs(cfg.html)).href);
    await browser.cdp.eval('window.__vclock.tick(), null');
    // let the animation run a couple of seconds so nothing is mid-entrance
    await browser.cdp.eval('window.__vclock.stepTo(2000), null');

    const info = await browser.cdp.eval(`(() => {
      const box = (id) => {
        const el = document.getElementById(id);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        if (!r.width && !r.height) return { missing: 'zero-size' };
        return {
          cx: +(((r.left + r.right) / 2) / ${vp.width}).toFixed(4),
          cy: +(((r.top + r.bottom) / 2) / ${vp.height}).toFixed(4),
          w: +(r.width / ${vp.width}).toFixed(4),
          h: +(r.height / ${vp.height}).toFixed(4),
        };
      };
      const ids = ${JSON.stringify(cfg.ids)};
      const res = {};
      for (const id of ids) res[id] = box(id);
      return { res, theme: document.body.getAttribute('data-theme'), viewport: [innerWidth, innerHeight] };
    })()`);
    out[name] = info;
    console.log(`\n=== ${name}  theme=${info.theme} viewport=${info.viewport} ===`);
    for (const [id, b] of Object.entries(info.res)) {
      if (!b) console.log(`  ${id.padEnd(26)} <not found>`);
      else if (b.missing) console.log(`  ${id.padEnd(26)} ${b.missing}`);
      else console.log(`  ${id.padEnd(26)} cx=${String(b.cx).padEnd(7)} cy=${String(b.cy).padEnd(7)} w=${String(b.w).padEnd(7)} h=${b.h}`);
    }
  } finally {
    browser.kill();
    await sleep(120);
  }
}
mkdirSync(join(ROOT, 'capture'), { recursive: true });
writeFileSync(join(ROOT, 'capture', 'anchors.json'), JSON.stringify(out, null, 2));
console.log('\nwrote capture/anchors.json');