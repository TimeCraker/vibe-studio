// Drive a persistent, VISIBLE Chrome window that you log into yourself.
//
// Nothing here touches credentials: the browser profile lives outside the repo
// (in %USERPROFILE%), you authenticate by scanning the QR yourself, and every
// command attaches to the already-running window. This script never reads
// cookies, localStorage or saved passwords.
//
//   node tools/bb.mjs launch [--url <url>]     open the window (stays running)
//   node tools/bb.mjs status                   current URL / title
//   node tools/bb.mjs inspect [--selector css] dump interactive elements + boxes
//   node tools/bb.mjs eval --js '<expr>'       run JS in the page, print JSON
//   node tools/bb.mjs shot --out <file.png>    screenshot
//   node tools/bb.mjs goto --url <url>         navigate
//   node tools/bb.mjs file --selector css --path <file> [--index 0]
//   node tools/bb.mjs type --selector css --text <s> [--index 0] [--enter]
//   node tools/bb.mjs click --selector css [--index 0]
import { spawn } from 'node:child_process';
import { writeFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import { homedir } from 'node:os';
import { Cdp } from './cdp.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');

const argv = process.argv.slice(2);
const cmd = argv[0];
const arg = (k, d) => {
  const i = argv.indexOf(`--${k}`);
  return i >= 0 && argv[i + 1] !== undefined && !argv[i + 1].startsWith('--') ? argv[i + 1] : d;
};
const flag = (k) => argv.includes(`--${k}`);

const PORT = Number(arg('port', 9222));
// Deliberately OUTSIDE the repository: this directory holds a logged-in session.
const PROFILE = resolve(arg('profile', join(homedir(), '.bili-upload-profile')));
const CHROME = arg('chrome', 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe');
const DEFAULT_URL = 'https://www.bilibili.com/';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function endpoint() {
  try {
    const res = await fetch(`http://127.0.0.1:${PORT}/json/version`);
    if (res.ok) return await res.json();
  } catch { /* not up */ }
  return null;
}

/** attach to a page target. Prefers a bilibili tab, and always reports which one
 *  it picked — the user may have several tabs open. */
async function attach() {
  const v = await endpoint();
  if (!v) throw new Error(`no Chrome debug endpoint on ${PORT} — run: node tools/bb.mjs launch`);
  const cdp = await Cdp.connect(v.webSocketDebuggerUrl);
  const { targetInfos } = await cdp.send('Target.getTargets');
  const pages = targetInfos.filter((t) => t.type === 'page' && !t.url.startsWith('devtools://'));
  if (!pages.length) throw new Error('no page target open');
  const wanted = arg('url-match', null);
  let pick = pages.find((t) => wanted && t.url.includes(wanted));
  if (!pick) pick = pages.find((t) => /bilibili\.com/.test(t.url)) ?? pages[0];
  const { sessionId } = await cdp.send('Target.attachToTarget', { targetId: pick.targetId, flatten: true });
  cdp.sessionId = sessionId;
  await cdp.send('Runtime.enable');
  if (pages.length > 1) {
    console.error(`[tabs] ${pages.length} open; attached to: ${pick.url.slice(0, 100)}`);
  }
  return cdp;
}

async function launch() {
  if (await endpoint()) {
    console.log(`already running on ${PORT} (profile ${PROFILE})`);
    return;
  }
  if (!existsSync(CHROME)) throw new Error(`chrome not found at ${CHROME}`);
  mkdirSync(PROFILE, { recursive: true });
  const args = [
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${PROFILE}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-features=Translate',
    '--start-maximized',
    arg('url', DEFAULT_URL),
  ];
  const child = spawn(CHROME, args, { detached: true, stdio: 'ignore' });
  child.unref();
  for (let i = 0; i < 120; i++) {
    if (await endpoint()) break;
    await sleep(250);
  }
  const v = await endpoint();
  if (!v) throw new Error('Chrome did not expose a debug endpoint');
  console.log(`launched  ${v.Browser}`);
  console.log(`profile   ${PROFILE}`);
  console.log(`port      ${PORT}`);
  console.log(`url       ${arg('url', DEFAULT_URL)}`);
  console.log('\n浏览器窗口已经打开 —— 这一步由你自己操作：');
  console.log('  1) 在窗口里登录 B 站（扫码）');
  console.log('  2) 登录完成后告诉我，我接手填表');
  console.log('这个登录状态会留在上面的 profile 目录里，下次不用再扫。');
}

/** describe interactive elements so selectors are read off the real DOM */
const INSPECT_JS = (sel) => `(() => {
  const scopes = ${JSON.stringify(sel)} ? [...document.querySelectorAll(${JSON.stringify(sel)})] : [document];
  const out = [];
  const seen = new Set();
  const push = (el, why) => {
    if (!el || seen.has(el)) return;
    seen.add(el);
    const r = el.getBoundingClientRect();
    const attrs = {};
    for (const a of el.attributes || []) {
      if (/^(value|title|placeholder|name|type|accept|id|class|role|contenteditable|aria-label|maxlength)$/.test(a.name)) attrs[a.name] = a.value.slice(0, 120);
    }
    out.push({
      why, tag: el.tagName.toLowerCase(),
      text: (el.innerText || el.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 60),
      box: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)],
      visible: r.width > 0 && r.height > 0,
      attrs,
      path: (() => { let p = [], n = el; while (n && n.nodeType === 1 && p.length < 5) { p.unshift(n.tagName.toLowerCase() + (n.id ? '#' + n.id : '') + (n.className && typeof n.className === 'string' ? '.' + n.className.trim().split(/\\s+/).slice(0, 3).join('.') : '')); n = n.parentElement; } return p.join(' > '); })(),
    });
  };
  for (const sc of scopes) {
    for (const el of sc.querySelectorAll('input, textarea, select, button, [contenteditable="true"], [role="button"], [role="textbox"]')) push(el, 'field');
  }
  return { url: location.href, title: document.title, count: out.length, elements: out };
})()`;

/** find a visible element and send a REAL mouse click at its centre.
 *  Synthetic el.click() often fails (no user gesture, pointer-events:none wrappers). */
async function realClick(cdp, sel, idx = 0) {
  const box = await cdp.eval(`(() => {
    const els = [...document.querySelectorAll(${JSON.stringify(sel)})].filter(e => e.getBoundingClientRect().width > 0);
    const el = els[${idx}];
    if (!el) return { err: 'not-found', n: els.length };
    // only scroll when the element is actually off-screen: a needless scroll can
    // close an open dropdown/popup before the click lands
    let r = el.getBoundingClientRect();
    const outside = r.top < 0 || r.bottom > innerHeight || r.left < 0 || r.right > innerWidth;
    if (outside) { el.scrollIntoView({ block: 'center' }); r = el.getBoundingClientRect(); }
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, n: els.length, scrolled: outside,
             text: (el.innerText || el.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 40) };
  })()`);
  if (box.err) throw new Error(`${sel}[${idx}] ${box.err} (visible matches: ${box.n})`);
  for (const type of ['mousePressed', 'mouseReleased']) {
    await cdp.send('Input.dispatchMouseEvent', { type, x: Math.round(box.x), y: Math.round(box.y), button: 'left', clickCount: 1 });
  }
  return box;
}

async function main() {
  if (cmd === 'launch') return launch();

  const cdp = await attach();
  try {
    if (cmd === 'tabs') {
      const v = await endpoint();
      const cdp2 = await Cdp.connect(v.webSocketDebuggerUrl);
      const { targetInfos } = await cdp2.send('Target.getTargets');
      for (const t of targetInfos.filter((x) => x.type === 'page')) {
        console.log(`${t.attached ? '*' : ' '} ${t.title.slice(0, 40).padEnd(42)} ${t.url.slice(0, 110)}`);
      }
      cdp2.close();
    } else if (cmd === 'status') {
      const r = await cdp.eval('({url: location.href, title: document.title, ready: document.readyState, loggedIn: !!document.querySelector(".header-avatar-wrap, .bili-avatar, .avatar")})');
      console.log(JSON.stringify(r, null, 1));
    } else if (cmd === 'goto') {
      await cdp.send('Page.navigate', { url: arg('url', DEFAULT_URL) });
      await sleep(Number(arg('wait', 3500)));
      console.log(JSON.stringify(await cdp.eval('({url: location.href, title: document.title})'), null, 1));
    } else if (cmd === 'inspect') {
      const r = await cdp.eval(INSPECT_JS(arg('selector', null)));
      console.log(JSON.stringify(r, null, 1));
    } else if (cmd === 'eval') {
      const js = arg('js', null);
      if (!js) throw new Error('--js required');
      const r = await cdp.eval(js);
      console.log(typeof r === 'string' ? r : JSON.stringify(r, null, 1));
    } else if (cmd === 'shot') {
      const params = { format: 'png' };
      if (flag('full')) params.captureBeyondViewport = true;
      const { data } = await cdp.send('Page.captureScreenshot', params);
      const out = resolve(arg('out', join(ROOT, 'qa', 'bb.png')));
      mkdirSync(dirname(out), { recursive: true });
      writeFileSync(out, Buffer.from(data, 'base64'));
      console.log(out);
    } else if (cmd === 'scroll') {
      const sel = arg('selector', 'input[type=file]');
      const idx = Number(arg('index', 0));
      const file = resolve(arg('path', ''));
      if (!existsSync(file)) throw new Error(`file not found: ${file}`);
      await cdp.send('DOM.enable');
      // Resolve a live JS handle first (micro-app re-renders can invalidate a
      // nodeId), set the files on it, then read the value straight back.
      const r = await cdp.send('Runtime.evaluate', {
        expression: `(() => { const els = [...document.querySelectorAll(${JSON.stringify(sel)})]; return els[${idx}] ?? null; })()`,
        returnByValue: false,
      });
      const objectId = r.result?.objectId;
      if (!objectId) throw new Error(`${sel}[${idx}] not found`);
      await cdp.send('DOM.setFileInputFiles', { files: [file], objectId });
      await sleep(600);
      const check = await cdp.eval(`(() => {
        const els = [...document.querySelectorAll(${JSON.stringify(sel)})];
        const el = els[${idx}];
        return el ? { files: el.files.length, name: el.files[0]?.name ?? null, size: el.files[0]?.size ?? null } : 'gone';
      })()`);
      console.log(`set ${file}`);
      console.log(`readback ${JSON.stringify(check)}`);
      if (!check || check === 'gone' || !check.files) throw new Error('file did not stick on the input');
    } else if (cmd === 'pickfile') {
      // The reliable path: intercept the native file chooser, then produce a REAL
      // click (synthetic el.click() is not a user gesture and won't open it), and
      // hand the file to whatever input Chrome says it opened.
      const sel = arg('selector', 'button');
      const idx = Number(arg('index', 0));
      const file = resolve(arg('path', ''));
      if (!existsSync(file)) throw new Error(`file not found: ${file}`);
      await cdp.send('Page.enable');
      await cdp.send('DOM.enable');
      await cdp.send('Page.setInterceptFileChooserDialog', { enabled: true });

      let opened = null;
      cdp.on('Page.fileChooserOpened', (p) => { opened = p; });

      const box = await cdp.eval(`(() => {
        const els = [...document.querySelectorAll(${JSON.stringify(sel)})].filter(e => e.getBoundingClientRect().width > 0);
        const el = els[${idx}];
        if (!el) return null;
        const r = el.getBoundingClientRect();
        el.scrollIntoView({ block: 'center' });
        const r2 = el.getBoundingClientRect();
        return { x: r2.left + r2.width / 2, y: r2.top + r2.height / 2, text: (el.innerText || '').replace(/\\s+/g, ' ').trim().slice(0, 30), n: els.length };
      })()`);
      if (!box) throw new Error(`${sel}[${idx}] not found or not visible`);
      for (const type of ['mousePressed', 'mouseReleased']) {
        await cdp.send('Input.dispatchMouseEvent', {
          type, x: Math.round(box.x), y: Math.round(box.y), button: 'left', clickCount: 1,
        });
      }
      for (let i = 0; i < 40 && !opened; i++) await sleep(150);
      if (!opened) throw new Error(`clicked "${box.text}" but no file chooser opened`);
      await cdp.send('DOM.setFileInputFiles', { files: [file], backendNodeId: opened.backendNodeId });
      await sleep(800);
      const check = await cdp.eval(`(() => {
        const f = [...document.querySelectorAll("input[type=file]")].map(e => e.files.length);
        return { perInput: f, total: f.reduce((a, b) => a + b, 0) };
      })()`);
      console.log(`clicked "${box.text}" (${box.n} match) -> chooser backendNodeId ${opened.backendNodeId}`);
      console.log(`set ${file}`);
      console.log(`readback ${JSON.stringify(check)}`);
    } else if (cmd === 'tap') {
      const sel = arg('selector', 'button');
      const idx = Number(arg('index', 0));
      const box = await realClick(cdp, sel, idx);
      await sleep(Number(arg('wait', 700)));
      console.log(`tapped "${box.text}" (${box.n} match)`);
    } else if (cmd === 'tapText') {
      // click by exact visible text, which is how bilibili labels most controls
      const want = arg('text', '');
      const r = await cdp.eval(`(() => {
        const els = [...document.querySelectorAll('div,span,a,button,label,li')]
          .filter(e => (e.innerText || '').trim() === ${JSON.stringify(want)} && e.getBoundingClientRect().width > 0);
        if (!els.length) return { err: 'no exact text match' };
        const el = els[els.length - 1];
        el.setAttribute('data-bb-tap', '1');
        const b = el.getBoundingClientRect();
        return { x: b.left + b.width / 2, y: b.top + b.height / 2, count: els.length };
      })()`);
      if (r.err) throw new Error(r.err);
      for (const type of ['mousePressed', 'mouseReleased']) {
        await cdp.send('Input.dispatchMouseEvent', { type, x: Math.round(r.x), y: Math.round(r.y), button: 'left', clickCount: 1 });
      }
      await cdp.eval('document.querySelector("[data-bb-tap]")?.removeAttribute("data-bb-tap"), null');
      await sleep(Number(arg('wait', 700)));
      console.log(`tapped text "${want}" (${r.count} match)`);
    } else if (cmd === 'pick') {
      // open a dropdown with a real click, then click the option by exact text
      const trig = arg('trigger', null);
      const want = arg('option', null);
      if (!trig || !want) throw new Error('--trigger and --option required');
      const visibleOption = (text) => cdp.eval(`(() => {
        const els = [...document.querySelectorAll('li,div,span,article')].filter(e => {
          const r = e.getBoundingClientRect();
          return r.width > 0 && r.height > 0 && (e.innerText || '').trim() === ${JSON.stringify(text)};
        });
        if (!els.length) return null;
        const el = els[els.length - 1];
        const r = el.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      })()`);
      // only click the trigger if the dropdown is not already open — otherwise the
      // click toggles it shut (bitten by this once already)
      let found = await visibleOption(want);
      if (!found) {
        await realClick(cdp, trig, Number(arg('index', 0)));
        for (let i = 0; i < 25 && !found; i++) {
          await sleep(160);
          found = await visibleOption(want);
        }
      }
      if (!found) throw new Error(`option "${want}" never became visible after opening ${trig}`);
      for (const type of ['mousePressed', 'mouseReleased']) {
        await cdp.send('Input.dispatchMouseEvent', { type, x: Math.round(found.x), y: Math.round(found.y), button: 'left', clickCount: 1 });
      }
      await sleep(Number(arg('wait', 900)));
      const after = await cdp.eval(`(() => {
        const t = document.querySelector(${JSON.stringify(trig)});
        return { value: (t?.innerText || '').replace(/\\s+/g, ' ').trim().slice(0, 60) };
      })()`);
      console.log(`picked "${want}" via ${trig}`);
      console.log(`now shows: ${JSON.stringify(after.value)}`);
    } else if (cmd === 'cascade') {
      // open -> hover -> click, entirely inside one process. These popups move and
      // close between separate invocations, so every step must share one session.
      const trig = arg('trigger', null);
      const l1 = arg('level1', null);
      const l2 = arg('level2', null);
      if (!trig || !l1) throw new Error('--trigger and --level1 required');

      const findItem = (text) => cdp.eval(`(() => {
        const els = [...document.querySelectorAll('.drop-list-v2-item, .drop-list-v2-item-cont, [class*=option], [class*=drop-list] li')]
          .filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && (e.innerText || '').trim() === ${JSON.stringify(text)}; });
        if (!els.length) return null;
        const el = els[els.length - 1];
        const r = el.getBoundingClientRect();
        return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2), n: els.length, cls: (el.className||'').toString().split(' ')[0] };
      })()`);

      await realClick(cdp, trig, Number(arg('index', 0)));
      await sleep(Number(arg('wait', 900)));

      let it = await findItem(l1);
      if (!it) throw new Error(`level1 "${l1}" not found after opening ${trig}`);
      if (flag('js')) {
        // some cascaders only react to a DOM click on the OUTER row element
        const r = await cdp.eval(`(() => {
          const els = [...document.querySelectorAll('.drop-list-v2-item')]
            .filter(e => (e.innerText || '').trim() === ${JSON.stringify(l1)});
          if (!els.length) return 'no outer row';
          els[0].click();
          return 'clicked outer row';
        })()`);
        console.log(r);
      } else {
        // hover first: some cascaders only render the child column on mouseenter
        await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: it.x, y: it.y });
        await sleep(350);
        await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: it.x, y: it.y, button: 'left', clickCount: 1 });
        await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: it.x, y: it.y, button: 'left', clickCount: 1 });
      }
      await sleep(Number(arg('wait2', 900)));
      console.log(`clicked level1 "${l1}" (${it.cls})`);

      if (l2) {
        const it2 = await findItem(l2);
        if (!it2) throw new Error(`level2 "${l2}" not found after picking ${l1}`);
        await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: it2.x, y: it2.y, button: 'left', clickCount: 1 });
        await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: it2.x, y: it2.y, button: 'left', clickCount: 1 });
        await sleep(Number(arg('wait3', 900)));
        console.log(`clicked level2 "${l2}"`);
      } else if (flag('dump')) {
        const items = await cdp.eval(`(() => {
          const out = [];
          for (const e of document.querySelectorAll('div,li,span,p')) {
            const r = e.getBoundingClientRect();
            if (r.width < 40 || r.height < 12 || r.height > 60) continue;
            if (r.left < 600 || r.left > 1600 || r.top < 0 || r.top > innerHeight) continue;
            const t = (e.innerText || '').replace(/\\s+/g, ' ').trim();
            if (!t || t.length > 20) continue;
            out.push({ l: Math.round(r.left), t: Math.round(r.top), w: Math.round(r.width), cls: (e.className||'').toString().split(' ')[0].slice(0,28), txt: t });
          }
          const seen = new Set();
          return out.filter(i => { const k = i.l+'|'+i.t+'|'+i.txt; if (seen.has(k)) return false; seen.add(k); return true; })
                    .sort((a, b) => a.l - b.l || a.t - b.t).slice(0, 60);
        })()`);
        console.log('after click, popup contents:');
        for (const i of items) console.log(`  l${String(i.l).padStart(4)} t${String(i.t).padStart(5)} w${String(i.w).padStart(4)}  ${i.cls.padEnd(28)} ${i.txt}`);
      }
      const after = await cdp.eval(`(() => ({
        selected: (document.querySelector('.selector-container .select-item-cont')?.innerText || '').trim(),
        stillOpen: [...document.querySelectorAll('.drop-list-v2-item')].filter(e => e.getBoundingClientRect().height > 0).length > 0,
      }))()`);
      console.log(`selected now: ${JSON.stringify(after.selected)}  popupOpen=${after.stillOpen}`);
    } else if (cmd === 'popup') {
      // open a dropdown and dump its whole visible structure in ONE process —
      // these popups close between separate invocations
      const trig = arg('trigger', null);
      const hover = arg('text', null);
      if (trig) {
        await realClick(cdp, trig, Number(arg('index', 0)));
        await sleep(Number(arg('wait', 900)));
      }
      if (hover) {
        const h = await cdp.eval(`(() => {
          const els = [...document.querySelectorAll('div,li,span')].filter(e => {
            const b = e.getBoundingClientRect();
            return b.width > 0 && b.height > 0 && (e.innerText || '').trim() === ${JSON.stringify(hover)};
          });
          if (!els.length) return null;
          const el = els[els.length - 1];
          const b = el.getBoundingClientRect();
          return { x: Math.round(b.left + b.width / 2), y: Math.round(b.top + b.height / 2) };
        })()`);
        if (h) {
          await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: h.x - 25, y: h.y });
          await sleep(120);
          await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: h.x, y: h.y });
          await sleep(Number(arg('hoverWait', 900)));
        } else {
          console.error(`[hover] "${hover}" not found`);
        }
      }
      const dump = await cdp.eval(`(() => {
        const vis = e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
        const items = [...document.querySelectorAll('div,li,span,p')].filter(e => {
          if (!vis(e)) return false;
          const r = e.getBoundingClientRect();
          const t = (e.innerText || '').replace(/\\s+/g, ' ').trim();
          return t && t.length <= 24 && r.width >= 50 && r.width <= 320 && r.height <= 60 && r.left > 650 && r.left < 1400;
        }).map(e => {
          const r = e.getBoundingClientRect();
          return { l: Math.round(r.left), t: Math.round(r.top), w: Math.round(r.width), cls: (e.className || '').toString().split(' ')[0].slice(0, 26), txt: (e.innerText || '').replace(/\\s+/g, ' ').trim() };
        });
        const seen = new Set();
        return items.filter(i => { const k = i.l + '|' + i.t + '|' + i.txt; if (seen.has(k)) return false; seen.add(k); return true; })
                    .sort((a, b) => a.l - b.l || a.t - b.t);
      })()`);
      console.log(JSON.stringify(dump, null, 0).replace(/\},\{/g, '},\n{'));
    } else if (cmd === 'hover') {
      // cascaders often expand a sub-list on hover, not click
      const want = arg('text', null);
      const sel = arg('selector', null);
      if (!want && !sel) throw new Error('--text or --selector required');
      const r = await cdp.eval(`(() => {
        let els;
        if (${JSON.stringify(want)}) {
          els = [...document.querySelectorAll('li,div,span,a')].filter(e => {
            const b = e.getBoundingClientRect();
            return b.width > 0 && b.height > 0 && (e.innerText || '').trim() === ${JSON.stringify(want)};
          });
        } else {
          els = [...document.querySelectorAll(${JSON.stringify(sel)})].filter(e => e.getBoundingClientRect().width > 0);
        }
        if (!els.length) return { err: 'no match', sel: ${JSON.stringify(want ?? sel)} };
        const el = els[els.length - 1];
        el.scrollIntoView({ block: 'center' });
        const b = el.getBoundingClientRect();
        return { x: Math.round(b.left + b.width / 2), y: Math.round(b.top + b.height / 2), n: els.length };
      })()`);
      if (r.err) throw new Error(`${r.err}: ${r.sel}`);
      // move in from a neighbouring point so mouseenter actually fires
      await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: r.x - 30, y: r.y });
      await sleep(120);
      await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: r.x, y: r.y });
      await sleep(Number(arg('wait', 800)));
      console.log(`hovered ${want ? `"${want}"` : sel} (${r.n} match) at ${r.x},${r.y}`);
    } else if (cmd === 'fill') {
      const specPath = resolve(arg('spec', join(ROOT, 'bb-upload.json')));
      if (!existsSync(specPath)) throw new Error(`spec not found: ${specPath}`);
      const spec = JSON.parse(readFileSync(specPath, 'utf8'));
      const only = arg('only', null);
      const want = (k) => !only || only === k;
      const report = {};

      // ---- title ----
      if (spec.title && want('title')) {
        const focused = await cdp.eval(`(() => {
          const el = [...document.querySelectorAll('input[maxlength="80"]')].find(e => e.getBoundingClientRect().width > 0);
          if (!el) return 'no title input';
          el.focus(); el.select();
          return 'ok';
        })()`);
        if (focused !== 'ok') throw new Error(focused);
        await cdp.send('Input.insertText', { text: spec.title });
        report.title = await cdp.eval(`document.querySelector('input[maxlength="80"]')?.value ?? null`);
      }

      // ---- clear the default tags the uploader pre-filled ----
      const cleared = want('tags') ? await cdp.eval(`(() => {
        let n = 0;
        for (const svg of [...document.querySelectorAll('.label-item-v2-container svg.close')]) {
          const r = svg.getBoundingClientRect();
          if (r.width > 0 && r.height > 0) { svg.dispatchEvent(new MouseEvent('click', { bubbles: true })); n++; }
        }
        return n;
      })()`) : 0;
      await sleep(600);
      report.tagsCleared = cleared;

      // ---- add tags ----
      if (spec.tags?.length && want('tags')) {
        const added = [];
        for (const tag of spec.tags) {
          const before = await cdp.eval(`document.querySelectorAll('.label-item-v2-container').length`);
          const ok = await cdp.eval(`(() => {
            const el = [...document.querySelectorAll('input[maxlength="20"]')].find(e => e.getBoundingClientRect().width > 0);
            if (!el) return 'no tag input';
            el.focus(); el.select();
            return 'ok';
          })()`);
          if (ok !== 'ok') throw new Error(ok);
          await cdp.send('Input.insertText', { text: tag });
          await sleep(220);
          for (const type of ['keyDown', 'keyUp']) {
            await cdp.send('Input.dispatchKeyEvent', { type, key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13 });
          }
          await sleep(420);
          const after = await cdp.eval(`document.querySelectorAll('.label-item-v2-container').length`);
          added.push({ tag, ok: after > before });
        }
        report.tagsAdded = added;
      }

      // ---- description (Quill contenteditable) ----
      if (spec.description?.length && want('desc')) {
        const focused = await cdp.eval(`(() => {
          const el = document.querySelector('.ql-editor');
          if (!el) return 'no .ql-editor';
          el.focus();
          el.innerHTML = '';
          return 'ok';
        })()`);
        if (focused !== 'ok') throw new Error(focused);
        const lines = spec.description;
        for (let i = 0; i < lines.length; i++) {
          if (lines[i]) await cdp.send('Input.insertText', { text: lines[i] });
          if (i < lines.length - 1) {
            for (const type of ['keyDown', 'keyUp']) {
              await cdp.send('Input.dispatchKeyEvent', { type, key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13 });
            }
          }
          await sleep(60);
        }
        report.descChars = await cdp.eval(`(document.querySelector('.ql-editor')?.innerText || '').length`);
      }

      console.log(JSON.stringify(report, null, 1));
    } else if (cmd === 'key') {
      const k = arg('key', 'Escape');
      const code = arg('code', k);
      const vk = Number(arg('vk', k === 'Escape' ? 27 : k === 'Enter' ? 13 : 0));
      for (const type of ['keyDown', 'keyUp']) {
        await cdp.send('Input.dispatchKeyEvent', { type, key: k, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk });
      }
      await sleep(Number(arg('wait', 400)));
      console.log(`sent ${k}`);
    } else if (cmd === 'type') {
      const sel = arg('selector', 'input');
      const idx = Number(arg('index', 0));
      const text = arg('text', '');
      const ok = await cdp.eval(`(() => {
        const els = [...document.querySelectorAll(${JSON.stringify(sel)})].filter(e => e.getBoundingClientRect().width > 0);
        const el = els[${idx}];
        if (!el) return 'no-visible-match';
        el.focus();
        if (el.select) el.select();
        else if (el.setSelectionRange) el.setSelectionRange(0, (el.value || '').length);
        return 'focused:' + el.tagName.toLowerCase();
      })()`);
      if (String(ok).startsWith('no-visible')) throw new Error(`${sel}[${idx}] not found or not visible`);
      await cdp.send('Input.insertText', { text });
      if (flag('enter')) {
        for (const type of ['keyDown', 'keyUp']) {
          await cdp.send('Input.dispatchKeyEvent', { type, key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13 });
        }
      }
      console.log(`${ok}  inserted ${text.length} chars`);
    } else if (cmd === 'click') {
      const sel = arg('selector', 'button');
      const idx = Number(arg('index', 0));
      const r = await cdp.eval(`(() => {
        const els = [...document.querySelectorAll(${JSON.stringify(sel)})].filter(e => e.getBoundingClientRect().width > 0);
        const el = els[${idx}];
        if (!el) return { ok: false, candidates: els.length };
        const t = (el.innerText || el.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 40);
        el.scrollIntoView({ block: 'center' });
        el.click();
        return { ok: true, clicked: t };
      })()`);
      console.log(JSON.stringify(r));
    } else {
      console.log(readFileSync(import.meta.url, 'utf8').split('//   node tools/bb.mjs')[1]?.split('\n').slice(0, 12).join('\n') ?? '');
      console.log('commands: launch | status | inspect | eval | shot | goto | file | type | click');
    }
  } finally {
    cdp.close();
  }
}

main().catch((e) => { console.error(String(e.message || e)); process.exit(1); });