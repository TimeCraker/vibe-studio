#!/usr/bin/env node
/**
 * douyin.mjs — 把抖音投稿表单替你填好。
 *
 * 契约与 bili.mjs 完全一致（见 ../SKILL.md）：**你登录、你点发布；脚本只填表。**
 * 本脚本不读、不存、不索要任何账号密码或 cookie；登录在一个独立 profile 里由你扫码完成。
 * 抖音/微信系对自动化比 B 站敏感，账号风控风险更高 —— 这条风险要由人知情后承担，
 * 所以「发布」这一步永远留给人。
 *
 * 依赖：本机 Chrome + Node 18+，不装任何 npm 包，也不用 Playwright。
 *
 * 使用独立 profile 与端口（~/.douyin-upload-profile，9223），与 B 站那个窗口互不干扰。
 *
 * ── 已实现（平台无关的驾驶层 + 逃生口） ─────────────────────────────
 *   node douyin.mjs launch | status | tabs | goto --url U | shot --out x.png [--full]
 *   node douyin.mjs inspect [--selector CSS] | eval --js 'EXPR'
 *   node douyin.mjs pickfile --selector CSS --path F | file --selector CSS --path F
 *   node douyin.mjs tap --selector CSS | tapText --text T | hover --text T
 *   node douyin.mjs type --selector CSS --text T [--enter] | key --key Escape
 *   node douyin.mjs scroll | popup --trigger CSS | pick --trigger CSS --option T
 *
 * ── 高层命令（登录后探明真实 DOM 再补，不猜选择器） ───────────────────
 *   TODO: video / fill / cover / check —— 写之前先跑 inspect 看真实字段与字数上限
 */
import { spawn } from 'node:child_process';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { homedir } from 'node:os';

const UPLOAD_URL = 'https://creator.douyin.com/creator-micro/content/upload';

const argv = process.argv.slice(2);
const cmd = argv[0];
const arg = (k, d) => {
  const i = argv.indexOf(`--${k}`);
  return i >= 0 && argv[i + 1] !== undefined && !argv[i + 1].startsWith('--') ? argv[i + 1] : d;
};
const flag = (k) => argv.includes(`--${k}`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const PORT = Number(arg('port', 9223));
// 独立 profile：抖音的登录态与 B 站分开，一个平台一个浏览器身份
const PROFILE = resolve(arg('profile', join(homedir(), '.douyin-upload-profile')));
const CHROME = arg('chrome', process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe');
const WORK = resolve(arg('work', process.cwd()));

// --------------------------------------------------------------------------- //
// 极简 CDP 客户端
// --------------------------------------------------------------------------- //
class Cdp {
  constructor(ws) {
    this.ws = ws; this.seq = 0; this.pending = new Map(); this.handlers = new Map(); this.sessionId = null;
    ws.addEventListener('message', (ev) => {
      const m = JSON.parse(ev.data);
      if (m.id !== undefined && this.pending.has(m.id)) {
        const { resolve: res, reject } = this.pending.get(m.id);
        this.pending.delete(m.id);
        if (m.error) reject(new Error(`${m.error.message} ${JSON.stringify(m.error.data ?? '')}`));
        else res(m.result);
        return;
      }
      if (m.method) this.handlers.get(m.method)?.(m.params, m.sessionId);
    });
  }
  static async connect(url) {
    const ws = new WebSocket(url);
    await new Promise((res, rej) => {
      ws.addEventListener('open', () => res(), { once: true });
      ws.addEventListener('error', () => rej(new Error('无法连接调试端口')), { once: true });
    });
    return new Cdp(ws);
  }
  send(method, params = {}, sessionId = this.sessionId) {
    const id = ++this.seq;
    const p = { id, method, params };
    if (sessionId) p.sessionId = sessionId;
    return new Promise((res, rej) => { this.pending.set(id, { resolve: res, reject: rej }); this.ws.send(JSON.stringify(p)); });
  }
  on(method, fn) { this.handlers.set(method, fn); }
  async eval(expression, awaitPromise = false) {
    const r = await this.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise });
    if (r.exceptionDetails) throw new Error(`页面异常: ${r.exceptionDetails.exception?.description ?? r.exceptionDetails.text}`);
    return r.result.value;
  }
  close() { try { this.ws.close(); } catch { /* ignore */ } }
}

async function endpoint() {
  try { const r = await fetch(`http://127.0.0.1:${PORT}/json/version`); if (r.ok) return await r.json(); } catch { /* down */ }
  return null;
}

async function attach() {
  const v = await endpoint();
  if (!v) throw new Error(`端口 ${PORT} 上没有 Chrome。先跑：node douyin.mjs launch`);
  const cdp = await Cdp.connect(v.webSocketDebuggerUrl);
  const { targetInfos } = await cdp.send('Target.getTargets');
  const pages = targetInfos.filter((t) => t.type === 'page' && !t.url.startsWith('devtools://'));
  if (!pages.length) throw new Error('没有打开的标签页');
  const pick = pages.find((t) => /douyin\.com/.test(t.url)) ?? pages[0];
  const { sessionId } = await cdp.send('Target.attachToTarget', { targetId: pick.targetId, flatten: true });
  cdp.sessionId = sessionId;
  await cdp.send('Runtime.enable');
  if (pages.length > 1) console.error(`[tabs] 共 ${pages.length} 个，已附着：${pick.url.slice(0, 90)}`);
  return cdp;
}

// --------------------------------------------------------------------------- //
// 小工具
// --------------------------------------------------------------------------- //
async function realClick(cdp, sel, idx = 0) {
  const box = await cdp.eval(`(() => {
    const els = [...document.querySelectorAll(${JSON.stringify(sel)})].filter(e => e.getBoundingClientRect().width > 0);
    const el = els[${idx}];
    if (!el) return { err: 'not-found', n: els.length };
    let r = el.getBoundingClientRect();
    const outside = r.top < 0 || r.bottom > innerHeight || r.left < 0 || r.right > innerWidth;
    if (outside) { el.scrollIntoView({ block: 'center' }); r = el.getBoundingClientRect(); }
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, n: els.length,
             text: (el.innerText || el.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 40) };
  })()`);
  if (box.err) throw new Error(`${sel}[${idx}] ${box.err}（可见匹配 ${box.n} 个）`);
  for (const type of ['mousePressed', 'mouseReleased']) {
    await cdp.send('Input.dispatchMouseEvent', { type, x: Math.round(box.x), y: Math.round(box.y), button: 'left', clickCount: 1 });
  }
  return box;
}

/** 真人点击 + 拦截原生文件选择框；synthetic el.click() 不算用户手势，开不了选择框 */
async function pickFile(cdp, triggerSel, file) {
  if (!existsSync(file)) throw new Error(`文件不存在: ${file}`);
  await cdp.send('Page.enable');
  await cdp.send('DOM.enable');
  await cdp.send('Page.setInterceptFileChooserDialog', { enabled: true });
  let opened = null;
  cdp.on('Page.fileChooserOpened', (p) => { opened = p; });
  const box = await realClick(cdp, triggerSel, Number(arg('index', 0)));
  for (let i = 0; i < 40 && !opened; i++) await sleep(150);
  if (!opened) throw new Error(`点了「${box.text}」但没弹出文件选择框`);
  await cdp.send('DOM.setFileInputFiles', { files: [file], backendNodeId: opened.backendNodeId });
  await sleep(800);
  return box;
}

async function sendKey(cdp, key) {
  const vk = key === 'Escape' ? 27 : key === 'Enter' ? 13 : 0;
  for (const type of ['keyDown', 'keyUp']) {
    await cdp.send('Input.dispatchKeyEvent', { type, key, code: key, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk });
  }
}

/** 点第一个「文本完全等于 t」的可见元素 */
async function tapText(cdp, t) {
  const r = await cdp.eval(`(() => {
    const els = [...document.querySelectorAll('div,span,a,button,label,li,p')]
      .filter(e => (e.innerText || '').trim() === ${JSON.stringify(t)} && e.getBoundingClientRect().width > 0);
    if (!els.length) return null;
    const el = els[els.length - 1];
    const b = el.getBoundingClientRect();
    return { x: b.left + b.width / 2, y: b.top + b.height / 2 };
  })()`);
  if (!r) return false;
  for (const type of ['mousePressed', 'mouseReleased']) {
    await cdp.send('Input.dispatchMouseEvent', { type, x: Math.round(r.x), y: Math.round(r.y), button: 'left', clickCount: 1 });
  }
  await sleep(600);
  return true;
}

async function launch() {
  if (await endpoint()) { console.log(`已在运行（端口 ${PORT}）`); return; }
  if (!existsSync(CHROME)) throw new Error(`找不到 Chrome: ${CHROME}（用 --chrome 指定）`);
  mkdirSync(PROFILE, { recursive: true });
  const child = spawn(CHROME, [
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${PROFILE}`,
    '--no-first-run', '--no-default-browser-check', '--start-maximized',
    arg('url', UPLOAD_URL),
  ], { detached: true, stdio: 'ignore' });
  child.unref();
  for (let i = 0; i < 120; i++) { if (await endpoint()) break; await sleep(250); }
  if (!await endpoint()) throw new Error('Chrome 没起来调试端口');
  console.log(`已打开窗口  profile=${PROFILE}`);
  console.log('→ 由你操作：在窗口里扫码登录抖音，登录完告诉我。');
  console.log('  登录态留在上面的 profile 目录里，下次不用重扫。');
}

async function main() {
  if (cmd === 'launch') return launch();
  if (!cmd) { console.log('commands: launch status tabs goto eval inspect shot scroll pickfile file tap tapText hover type key popup pick cascade'); return; }

  const cdp = await attach();
  try {
    if (cmd === 'status') {
      const r = await cdp.eval(`(() => ({
        url: location.href,
        title: document.title,
        ready: document.readyState,
        // 启发式，等登录后探明页面结构再收紧
        hasUploadEntry: document.body.innerText.includes('上传视频'),
        hasLoginQr: !!document.querySelector('[class*=login],[class*=qrcode],iframe[src*=passport]'),
        bodyHint: document.body.innerText.replace(/\\s+/g, ' ').slice(0, 160),
      }))()`);
      console.log(JSON.stringify(r, null, 1));
    } else if (cmd === 'tabs') {
      const v = await endpoint();
      const c2 = await Cdp.connect(v.webSocketDebuggerUrl);
      const { targetInfos } = await c2.send('Target.getTargets');
      for (const t of targetInfos.filter((x) => x.type === 'page')) console.log(`${t.title.slice(0, 40).padEnd(42)} ${t.url.slice(0, 110)}`);
      c2.close();
    } else if (cmd === 'goto') {
      await cdp.send('Page.navigate', { url: arg('url', UPLOAD_URL) });
      await sleep(Number(arg('wait', 4000)));
      console.log(JSON.stringify(await cdp.eval('({url: location.href, title: document.title})'), null, 1));
    } else if (cmd === 'eval') {
      const js = arg('js', null);
      if (!js) throw new Error('需要 --js');
      const r = await cdp.eval(js);
      console.log(typeof r === 'string' ? r : JSON.stringify(r, null, 1));
    } else if (cmd === 'inspect') {
      const r = await cdp.eval(`(() => {
        const scopes = ${JSON.stringify(arg('selector', null))} ? [...document.querySelectorAll(${JSON.stringify(arg('selector', null))})] : [document];
        const out = [];
        for (const sc of scopes) for (const el of sc.querySelectorAll('input, textarea, select, button, [contenteditable="true"], [role="textbox"], [role="button"]')) {
          const r = el.getBoundingClientRect();
          out.push({ tag: el.tagName.toLowerCase(), cls: (el.className || '').toString().slice(0, 55),
            box: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)],
            visible: r.width > 0 && r.height > 0,
            ph: el.placeholder ?? null, ml: el.maxLength === -1 ? null : el.maxLength,
            type: el.type ?? null, val: (el.value ?? '').slice(0, 40),
            txt: (el.innerText || '').replace(/\\s+/g, ' ').trim().slice(0, 40) });
        }
        return out;
      })()`);
      console.log(JSON.stringify(r, null, 1));
    } else if (cmd === 'shot') {
      const params = { format: 'png' };
      if (flag('full')) params.captureBeyondViewport = true;
      const { data } = await cdp.send('Page.captureScreenshot', params);
      const out = resolve(arg('out', join(WORK, 'dy.png')));
      mkdirSync(dirname(out), { recursive: true });
      writeFileSync(out, Buffer.from(data, 'base64'));
      console.log(out);
    } else if (cmd === 'scroll') {
      const to = arg('to', 'bottom');
      await cdp.eval(`window.scrollTo(0, ${to === 'bottom' ? 'document.body.scrollHeight' : Number(to)}), null`);
      await sleep(Number(arg('wait', 700)));
      console.log(`scrolled ${to}`);
    } else if (cmd === 'pickfile') {
      const box = await pickFile(cdp, arg('selector', 'input[type=file]'), resolve(arg('path', '')));
      console.log(`clicked "${box.text}" and handed over the file`);
    } else if (cmd === 'file') {
      const sel = arg('selector', 'input[type=file]');
      const idx = Number(arg('index', 0));
      const file = resolve(arg('path', ''));
      if (!existsSync(file)) throw new Error(`文件不存在: ${file}`);
      await cdp.send('DOM.enable');
      const r = await cdp.send('Runtime.evaluate', {
        expression: `(() => { const els = [...document.querySelectorAll(${JSON.stringify(sel)})]; return els[${idx}] ?? null; })()`,
        returnByValue: false,
      });
      if (!r.result?.objectId) throw new Error(`${sel}[${idx}] not found`);
      await cdp.send('DOM.setFileInputFiles', { files: [file], objectId: r.result.objectId });
      await sleep(600);
      const check = await cdp.eval(`(() => {
        const el = [...document.querySelectorAll(${JSON.stringify(sel)})][${idx}];
        return el ? { files: el.files.length, name: el.files[0]?.name ?? null } : 'gone';
      })()`);
      console.log(`readback ${JSON.stringify(check)}`);
    } else if (cmd === 'tap') {
      const b = await realClick(cdp, arg('selector', 'button'), Number(arg('index', 0)));
      await sleep(Number(arg('wait', 700)));
      console.log(`tapped "${b.text}"`);
    } else if (cmd === 'tapText') {
      const ok = await tapText(cdp, arg('text', ''));
      if (!ok) throw new Error(`找不到文本「${arg('text', '')}」`);
      console.log(`tapped "${arg('text', '')}"`);
    } else if (cmd === 'hover') {
      const t = arg('text', null);
      const sel = arg('selector', null);
      const r = await cdp.eval(`(() => {
        const els = ${JSON.stringify(t)}
          ? [...document.querySelectorAll('div,li,span,p')].filter(e => { const b = e.getBoundingClientRect(); return b.width > 0 && b.height > 0 && (e.innerText || '').trim() === ${JSON.stringify(t)}; })
          : [...document.querySelectorAll(${JSON.stringify(sel)})].filter(e => e.getBoundingClientRect().width > 0);
        if (!els.length) return null;
        const el = els[els.length - 1];
        el.scrollIntoView({ block: 'center' });
        const b = el.getBoundingClientRect();
        return { x: Math.round(b.left + b.width / 2), y: Math.round(b.top + b.height / 2) };
      })()`);
      if (!r) throw new Error('找不到要 hover 的元素');
      await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: r.x - 25, y: r.y });
      await sleep(120);
      await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: r.x, y: r.y });
      await sleep(Number(arg('wait', 800)));
      console.log('hovered');
    } else if (cmd === 'type') {
      const sel = arg('selector', 'input');
      const ok = await cdp.eval(`(() => {
        const el = [...document.querySelectorAll(${JSON.stringify(sel)})].filter(e => e.getBoundingClientRect().width > 0)[${Number(arg('index', 0))}];
        if (!el) return '找不到可见元素';
        el.focus(); el.select?.(); return 'ok';
      })()`);
      if (ok !== 'ok') throw new Error(ok);
      await cdp.send('Input.insertText', { text: arg('text', '') });
      if (flag('enter')) await sendKey(cdp, 'Enter');
      console.log('typed');
    } else if (cmd === 'key') {
      await sendKey(cdp, arg('key', 'Escape'));
      console.log('sent');
    } else if (cmd === 'clear') {
      // 清空简介编辑器：Ctrl+A + Backspace 走编辑器自己的输入管线。
      // document.execCommand 在 editor-kit 上不可靠（实测选区建了但删不掉）。
      await cdp.eval(`document.querySelector('.zone-container.editor-kit-container')?.focus(), null`);
      await sleep(150);
      for (const type of ['keyDown', 'keyUp']) {
        await cdp.send('Input.dispatchKeyEvent', { type, key: 'a', code: 'KeyA', windowsVirtualKeyCode: 65, nativeVirtualKeyCode: 65, modifiers: 2 });
      }
      await sleep(120);
      for (const type of ['keyDown', 'keyUp']) {
        await cdp.send('Input.dispatchKeyEvent', { type, key: 'Backspace', code: 'Backspace', windowsVirtualKeyCode: 8, nativeVirtualKeyCode: 8 });
      }
      await sleep(300);
      const len = await cdp.eval(`(document.querySelector('.zone-container.editor-kit-container')?.innerText || '').length`);
      console.log(`editor length after clear: ${len}`);
    } else if (cmd === 'fill') {
      // 抖音的描述分两层：标题 input（30 字）+ 富文本简介（1000 字）。
      // 简介必须在一个进程里逐行写完：换行后光标停在段尾，跨进程重新 focus 可能跳回开头。
      const specPath = resolve(arg('spec', join(WORK, 'douyin-form.json')));
      if (!existsSync(specPath)) throw new Error(`找不到 spec: ${specPath}`);
      const spec = JSON.parse(readFileSync(specPath, 'utf8'));
      const out = {};

      if (spec.title) {
        const ok = await cdp.eval(`(() => {
          const el = [...document.querySelectorAll('input[placeholder*="填写作品标题"]')].find(e => e.getBoundingClientRect().width > 0);
          if (!el) return '找不到标题框';
          el.focus(); el.select(); return 'ok';
        })()`);
        if (ok !== 'ok') throw new Error(ok);
        await cdp.send('Input.insertText', { text: spec.title });
        await sleep(300);
        out.title = await cdp.eval(`document.querySelector('input[placeholder*="填写作品标题"]')?.value ?? null`);
      }

      if (spec.description?.length) {
        // 只 focus，不要用 Range API 设光标：editor-kit 维护自己的选区，
        // 外部强设之后内部不同步，后续插入会落错位置还会重复（实测踩过）。
        const ok = await cdp.eval(`(() => {
          const el = document.querySelector('.zone-container.editor-kit-container');
          if (!el) return '找不到简介编辑器';
          el.focus();
          return 'ok';
        })()`);
        if (ok !== 'ok') throw new Error(ok);
        await sleep(200);
        const lines = spec.description;
        for (let i = 0; i < lines.length; i++) {
          if (lines[i]) await cdp.send('Input.insertText', { text: lines[i] });
          if (i < lines.length - 1) await sendKey(cdp, 'Enter');
          await sleep(70);
        }
        await sleep(400);
        out.descLen = await cdp.eval(`(() => {
          const el = document.querySelector('.zone-container.editor-kit-container');
          return el ? (el.innerText || '').trimEnd().length : null;
        })()`);
      }
      console.log(JSON.stringify(out, null, 1));
    } else if (cmd === 'hashtags') {
      // 逐个加话题：输入 #名字 → 等联想弹层 → 点第一项 → 变成真正的话题节点。
      // 联想不到（没有这个话题）就把打出去的 "#名字" 删掉，不留纯文本假话题。
      const names = String(arg('names', '')).split(',').map((s) => s.trim()).filter(Boolean);
      if (!names.length) throw new Error('需要 --names A,B,C');
      const results = [];
      for (const name of names) {
        await cdp.eval(`document.querySelector('.zone-container.editor-kit-container')?.focus(), null`);
        await sleep(200);
        await cdp.send('Input.insertText', { text: `#${name}` });
        let popup = null;
        for (let i = 0; i < 16 && !popup; i++) {
          await sleep(180);
          popup = await cdp.eval(`(() => {
            const m = document.querySelector('.mention-suggest-mount-dom');
            if (!m) return null;
            const items = [...m.querySelectorAll('*')].filter(e => {
              const r = e.getBoundingClientRect();
              return r.width > 100 && r.height > 25 && r.height < 60 && (e.innerText || '').trim().startsWith('#');
            });
            const first = items[0];
            if (!first) return null;
            const r = first.getBoundingClientRect();
            return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2), txt: (first.innerText || '').replace(/\\s+/g, ' ').trim().slice(0, 24) };
          })()`);
        }
        if (!popup) {
          // 没有联想结果：删掉 "#名字"，不留纯文本假话题
          for (let i = 0; i < name.length + 1; i++) {
            for (const type of ['keyDown', 'keyUp']) {
              await cdp.send('Input.dispatchKeyEvent', { type, key: 'Backspace', code: 'Backspace', windowsVirtualKeyCode: 8, nativeVirtualKeyCode: 8 });
            }
            await sleep(40);
          }
          results.push({ name, picked: null, note: 'no suggestion, removed' });
          continue;
        }
        await cdp.eval(`(() => {
          const m = document.querySelector('.mention-suggest-mount-dom');
          const items = [...m.querySelectorAll('*')].filter(e => {
            const r = e.getBoundingClientRect();
            return r.width > 100 && r.height > 25 && r.height < 60 && (e.innerText || '').trim().startsWith('#');
          });
          items[0]?.click();
          return true;
        })()`);
        await sleep(600);
        const gone = await cdp.eval(`!document.querySelector('.mention-suggest-mount-dom')`);
        results.push({ name, picked: popup.txt, ok: gone });
      }
      console.log(JSON.stringify(results, null, 1));
    } else if (cmd === 'popup' || cmd === 'pick' || cmd === 'cascade') {
      console.log('这三个命令是 B 站组件专用的；抖音的下拉/弹层结构探明后再补对应命令');
    } else {
      console.log('未知命令。可用：launch status tabs goto eval inspect shot scroll pickfile file tap tapText hover type key');
    }
  } finally {
    cdp.close();
  }
}

main().catch((e) => { console.error(String(e.message || e)); process.exit(1); });