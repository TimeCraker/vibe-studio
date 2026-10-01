#!/usr/bin/env node
/**
 * xhs.mjs — 把小红书视频笔记的表单替你填好。
 *
 * 契约与 bili.mjs / douyin.mjs 完全一致（见 ../SKILL.md）：**你登录、你点发布；脚本只填表。**
 * 本脚本不读、不存、不索要任何账号密码或 cookie；登录在一个独立 profile 里由你扫码完成。
 * 小红书对自动化/风控在小红书系里属于最敏感的一档 —— 中途弹验证码或异常提示就停，不硬闯；
 * 「发布」这一步永远由人点。
 *
 * 依赖：本机 Chrome + Node 18+，不装任何 npm 包，也不用 Playwright。
 * 独立 profile 与端口（~/.xhs-upload-profile，9224），和 B 站/抖音的窗口互不干扰。
 *
 * ── 已实现（平台无关的驾驶层 + 逃生口） ─────────────────────────────
 *   node xhs.mjs launch | status | tabs | goto --url U | shot --out x.png [--full]
 *   node xhs.mjs inspect [--selector CSS] | eval --js 'EXPR'
 *   node xhs.mjs pickfile --selector CSS --path F | file --selector CSS --path F
 *   node xhs.mjs tap --selector CSS | tapText --text T | hover --text T
 *   node xhs.mjs type --selector CSS --text T [--enter] | key --key Escape
 *   node xhs.mjs scroll | clear
 *
 * ── 高层命令（登录后探明真实 DOM 再补，不猜选择器） ───────────────────
 *   TODO: upload / fill / topics / cover / setup
 */
import { spawn } from 'node:child_process';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { homedir } from 'node:os';

const ENTRY_URL = 'https://creator.xiaohongshu.com';

const argv = process.argv.slice(2);
const cmd = argv[0];
const arg = (k, d) => {
  const i = argv.indexOf(`--${k}`);
  return i >= 0 && argv[i + 1] !== undefined && !argv[i + 1].startsWith('--') ? argv[i + 1] : d;
};
const flag = (k) => argv.includes(`--${k}`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const PORT = Number(arg('port', 9224));
// 独立 profile：小红书的登录态单独放，一个平台一个浏览器身份
const PROFILE = resolve(arg('profile', join(homedir(), '.xhs-upload-profile')));
const CHROME = arg('chrome', process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe');
const PROJECT = resolve(arg('project', arg('work', process.cwd())));

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
  if (!v) throw new Error(`端口 ${PORT} 上没有 Chrome。先跑：node xhs.mjs launch`);
  const cdp = await Cdp.connect(v.webSocketDebuggerUrl);
  const { targetInfos } = await cdp.send('Target.getTargets');
  const pages = targetInfos.filter((t) => t.type === 'page' && !t.url.startsWith('devtools://'));
  if (!pages.length) throw new Error('没有打开的标签页');
  const pick = pages.find((t) => /xiaohongshu\.com/.test(t.url)) ?? pages[0];
  const { sessionId } = await cdp.send('Target.attachToTarget', { targetId: pick.targetId, flatten: true });
  cdp.sessionId = sessionId;
  await cdp.send('Runtime.enable');
  if (pages.length > 1) console.error(`[tabs] 共 ${pages.length} 个，已附着：${pick.url.slice(0, 90)}`);
  return cdp;
}

// --------------------------------------------------------------------------- //
// 小工具（与 bili.mjs / douyin.mjs 同一套实现）
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

/** 真人点击 + 拦截原生文件选择框 */
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

// ---- 小红书投稿动作（命令分支与 setup 共用同一份实现） ----

/** 上传视频（直接把文件挂到唯一的 file input 上；小红书接受这种方式，读回 0 但实际生效） */
async function doUpload(cdp, video) {
  await cdp.send('DOM.enable');
  const r = await cdp.send('Runtime.evaluate', {
    expression: `(() => { const els = [...document.querySelectorAll('input[type=file]')]; return els[0] ?? null; })()`,
    returnByValue: false,
  });
  if (!r.result?.objectId) throw new Error('找不到视频文件输入');
  await cdp.send('DOM.setFileInputFiles', { files: [video], objectId: r.result.objectId });
  // 页面会换到发布表单并重渲染（input 被替换，读回 files=0 是正常的）
  await sleep(5000);
}

/** 应用一张 AI 推荐封面（默认最后一张） */
async function doApplyCover(cdp, idx = 2) {
  const n = await cdp.eval(`[...document.querySelectorAll('.apply-btn')].filter(e => e.getBoundingClientRect().width > 0).length`);
  if (!n) throw new Error('找不到智能推荐封面的「应用」按钮（封面还没生成？）');
  const i = Math.min(idx, n - 1);
  await cdp.eval(`(() => {
    const el = [...document.querySelectorAll('.apply-btn')].filter(e => e.getBoundingClientRect().width > 0)[${i}];
    el.setAttribute('data-xhs-apply', '1');
  })()`);
  await realClick(cdp, '[data-xhs-apply]', 0);
  await sleep(1200);
  return `已应用推荐封面 #${i + 1}`;
}

/** 原创声明开关 + 同意 + 内容类型（笔记含AI合成内容） */
async function doDeclare(cdp, want = '笔记含AI合成内容') {
  // 1) 拨原创声明开关（开关图形在行右端，中心点不到它）
  const pt = await cdp.eval(`(() => {
    const row = [...document.querySelectorAll('*')].find(e => { const r = e.getBoundingClientRect(); return r.width > 300 && r.height > 30 && r.height < 80 && (e.innerText || '').trim() === '原创声明'; });
    if (!row) return null;
    const r = row.getBoundingClientRect();
    return { x: Math.round(r.right - 25), y: Math.round(r.top + r.height / 2) };
  })()`);
  if (!pt) throw new Error('找不到原创声明行');
  for (const type of ['mousePressed', 'mouseReleased']) {
    await cdp.send('Input.dispatchMouseEvent', { type, x: pt.x, y: pt.y, button: 'left', clickCount: 1 });
  }
  await sleep(1500);
  // 2) 权益确认框：勾同意 + 点声明原创
  await cdp.eval(`(() => {
    const lbl = [...document.querySelectorAll('*')].filter(e => { const r = e.getBoundingClientRect(); return r.width > 300 && r.height > 20 && r.height < 50 && (e.innerText || '').includes('我已阅读并同意'); });
    lbl[lbl.length - 1]?.setAttribute('data-xhs-agree', '1');
  })()`);
  await realClick(cdp, '[data-xhs-agree]', 0);
  await sleep(700);
  await cdp.eval(`(() => {
    const el = [...document.querySelectorAll('button,div,span')].filter(e => { const r = e.getBoundingClientRect(); return r.width > 60 && r.height > 25 && (e.innerText || '').trim() === '声明原创'; });
    el[el.length - 1]?.setAttribute('data-xhs-orig', '1');
  })()`);
  await realClick(cdp, '[data-xhs-orig]', 0);
  await sleep(1200);
  // 3) 内容类型下拉：选 AI 合成
  await cdp.eval(`(() => {
    const el = [...document.querySelectorAll('*')].find(e => { const r = e.getBoundingClientRect(); return r.width > 300 && r.height > 25 && r.height < 70 && (e.innerText || '').trim() === '添加内容类型声明'; });
    el?.setAttribute('data-xhs-type', '1');
  })()`);
  await realClick(cdp, '[data-xhs-type]', 0);
  await sleep(1500);
  const picked = await cdp.eval(`(() => {
    const row = [...document.querySelectorAll('*')].find(e => { const r = e.getBoundingClientRect(); return r.width > 200 && r.height > 25 && r.height < 60 && (e.innerText || '').trim() === ${JSON.stringify(want)}; });
    if (!row) return null;
    row.click();
    return (row.innerText || '').trim();
  })()`);
  if (!picked) throw new Error(`声明下拉里没有「${want}」`);
  await sleep(900);
  return picked;
}

/** setup 的步骤计划。--dry 在附着浏览器之前就打印它。 */
function setupPlan() {
  const video = arg('video', null);
  const coverIdx = Number(arg('cover-index', 2));
  const declareTxt = arg('declare', '笔记含AI合成内容');
  const tags = String(arg('names', '')).split(',').map((s) => s.trim()).filter(Boolean);
  return [
    'goto 发布页',
    video ? '上传视频' : '上传视频（未给 --video，需要已在表单页）',
    `fill --spec ${arg('spec', 'xhs-form.json')}`,
    tags.length ? `topics --names ${tags.join(',')}` : 'topics（未给 --names，跳过）',
    `应用 AI 推荐封面 #${coverIdx + 1}`,
    `declare --option ${declareTxt}`,
    '自检汇总（发布按钮由你点）',
  ];
}

/** 话题：点 #话题 按钮（插入一个 # 并弹情境联想）→ 在同一次 eval 里找到名字匹配的
 *  联想项并点击。跨进程点击会因弹层重渲染点错项（实测踩过）。
 *  联想是小红书按视频内容给的有限集合：想要的话题没有就删掉 #，不硬凑。 */
async function doTopics(cdp, names) {
  const results = [];
  for (const name of names) {
    await cdp.eval(`document.querySelector('.contentBtn.topic-btn')?.click()`);
    await sleep(1400);
    const picked = await cdp.eval(`(() => {
      const want = ${JSON.stringify(name)};
      const cands = [...document.querySelectorAll('*')].filter(e => {
        const r = e.getBoundingClientRect();
        if (r.width < 30 || r.height < 18 || r.height > 60 || r.width > 420) return false;
        const t = (e.innerText || '').trim();
        return t.startsWith('#') && t.includes(want) && t.length <= want.length + 20;
      }).map(e => ({ el: e, t: (e.innerText || '').trim(), len: (e.innerText || '').trim().length }));
      if (!cands.length) return null;
      cands.sort((a, b) => a.len - b.len);   // 名字最短优先（避免 #AI 选中 #AI绘画）
      const el = cands[0].el;
      const hit = cands[0].t;
      el.click();
      return hit.slice(0, 26);
    })()`);
    await sleep(700);
    if (!picked) {
      await cdp.eval(`document.querySelector('.tiptap.ProseMirror')?.focus(), null`);
      await sleep(120);
      await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Backspace', code: 'Backspace', windowsVirtualKeyCode: 8, nativeVirtualKeyCode: 8 });
      await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Backspace', code: 'Backspace', windowsVirtualKeyCode: 8, nativeVirtualKeyCode: 8 });
      results.push({ name, picked: null, note: 'no suggestion, removed the #' });
      continue;
    }
    results.push({ name, picked });
  }
  return results;
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
    arg('url', ENTRY_URL),
  ], { detached: true, stdio: 'ignore' });
  child.unref();
  for (let i = 0; i < 120; i++) { if (await endpoint()) break; await sleep(250); }
  if (!await endpoint()) throw new Error('Chrome 没起来调试端口');
  console.log(`已打开窗口  profile=${PROFILE}`);
  console.log('→ 由你操作：在窗口里登录小红书，登录完告诉我。');
  console.log('  登录态留在上面的 profile 目录里，下次不用重扫。');
}

async function main() {
  if (cmd === 'launch') return launch();
  if (!cmd) { console.log('commands: launch status tabs goto eval inspect shot scroll pickfile file tap tapText hover type key clear fill topics clickxy setup'); return; }
  // --dry 只打印计划，不碰浏览器
  if (flag('dry') && cmd === 'setup') {
    console.log(setupPlan().map((s, i) => `${i + 1}. ${s}`).join('\n'));
    return;
  }
  const cdp = await attach();
  try {
    if (cmd === 'status') {
      const r = await cdp.eval(`(() => ({
        url: location.href,
        title: document.title,
        ready: document.readyState,
        bodyHint: document.body.innerText.replace(/\\s+/g, ' ').slice(0, 200),
      }))()`);
      console.log(JSON.stringify(r, null, 1));
    } else if (cmd === 'tabs') {
      const v = await endpoint();
      const c2 = await Cdp.connect(v.webSocketDebuggerUrl);
      const { targetInfos } = await c2.send('Target.getTargets');
      for (const t of targetInfos.filter((x) => x.type === 'page')) console.log(`${t.title.slice(0, 40).padEnd(42)} ${t.url.slice(0, 110)}`);
      c2.close();
    } else if (cmd === 'goto') {
      await cdp.send('Page.navigate', { url: arg('url', ENTRY_URL) });
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
      const out = resolve(arg('out', join(PROJECT, 'qa', 'xhs.png')));
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
    } else if (cmd === 'fill') {
      // 小红书笔记 = 标题 input（20 字）+ TipTap 正文（1000 字）。
      // TipTap 与 editor-kit 同源（ProseMirror 系）：只 focus，不要用 Range API 设光标；
      // 清空用 Ctrl+A + Backspace 真实按键。
      const specPath = resolve(arg('spec', join(PROJECT, 'xhs-form.json')));
      if (!existsSync(specPath)) throw new Error(`找不到 spec: ${specPath}`);
      const spec = JSON.parse(readFileSync(specPath, 'utf8'));
      const out = {};
      if (spec.title) {
        const ok = await cdp.eval(`(() => {
          const el = [...document.querySelectorAll('input.d-text')].find(e => (e.placeholder || '').includes('标题') && e.getBoundingClientRect().width > 0);
          if (!el) return '找不到标题框';
          el.focus(); el.select(); return 'ok';
        })()`);
        if (ok !== 'ok') throw new Error(ok);
        await cdp.send('Input.insertText', { text: spec.title });
        await sleep(300);
        out.title = await cdp.eval(`document.querySelector('input.d-text')?.value ?? null`);
      }
      if (spec.description?.length) {
        await cdp.eval(`document.querySelector('.tiptap.ProseMirror')?.focus(), null`);
        await sleep(200);
        for (const type of ['keyDown', 'keyUp']) {
          await cdp.send('Input.dispatchKeyEvent', { type, key: 'a', code: 'KeyA', windowsVirtualKeyCode: 65, nativeVirtualKeyCode: 65, modifiers: 2 });
        }
        await sleep(100);
        for (const type of ['keyDown', 'keyUp']) {
          await cdp.send('Input.dispatchKeyEvent', { type, key: 'Backspace', code: 'Backspace', windowsVirtualKeyCode: 8, nativeVirtualKeyCode: 8 });
        }
        await sleep(250);
        const lines = spec.description;
        for (let i = 0; i < lines.length; i++) {
          if (lines[i]) await cdp.send('Input.insertText', { text: lines[i] });
          if (i < lines.length - 1) await sendKey(cdp, 'Enter');
          await sleep(70);
        }
        await sleep(400);
        out.descLen = await cdp.eval(`(() => {
          const el = document.querySelector('.tiptap.ProseMirror');
          return el ? (el.innerText || '').trimEnd().length : null;
        })()`);
      }
      console.log(JSON.stringify(out, null, 1));
    } else if (cmd === 'topics') {
      const names = String(arg('names', '')).split(',').map((s) => s.trim()).filter(Boolean);
      if (!names.length) throw new Error('需要 --names A,B,C');
      console.log(JSON.stringify(await doTopics(cdp, names), null, 1));
    } else if (cmd === 'clickxy') {
      // 坐标点击逃生口：开关/滑块这类小控件没有稳定选择器时用
      const x = Math.round(Number(arg('x', 0))), y = Math.round(Number(arg('y', 0)));
      for (const type of ['mousePressed', 'mouseReleased']) {
        await cdp.send('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 });
      }
      await sleep(Number(arg('wait', 800)));
      console.log(`clicked at ${x},${y}`);
    } else if (cmd === 'setup') {
      // 完整投稿前序列。发布按钮永远由人点 —— 这里到自检为止（--dry 在 main 入口处理）。
      const video = arg('video', null);
      const coverIdx = Number(arg('cover-index', 2));
      const declareTxt = arg('declare', '笔记含AI合成内容');
      const specPath = resolve(arg('spec', join(PROJECT, 'xhs-form.json')));
      const tags = String(arg('names', '')).split(',').map((s) => s.trim()).filter(Boolean);

      const onPublishPage = String(await cdp.eval('location.href')).includes('/publish/publish');
      if (!onPublishPage) {
        if (!video) throw new Error('不在发布页，且未提供 --video');
        await cdp.send('Page.navigate', { url: 'https://creator.xiaohongshu.com/publish/publish?source=official' });
        await sleep(5000);
      }
      // 视频已上传的页面没有 file input
      const hasInput = await cdp.eval(`[...document.querySelectorAll('input[type=file]')].some(e => e.accept.includes('.mp4') || e.accept.includes('video'))`);
      if (hasInput) {
        if (!video) throw new Error('需要上传视频，但未提供 --video');
        await doUpload(cdp, resolve(video));
      } else {
        console.log('视频已上传，跳过上传');
      }
      const out = {};
      out.fill = await doFill(cdp, specPath);
      if (tags.length) out.topics = await doTopics(cdp, tags);
      out.cover = await doApplyCover(cdp, coverIdx);
      out.declare = await doDeclare(cdp, declareTxt);
      console.log(JSON.stringify(out, null, 1));
      console.log('表单就绪。发布按钮由你点。');
    } else if (cmd === 'clear') {
      // 清空聚焦的可编辑元素：Ctrl+A + Backspace（富文本编辑器通用，别用 execCommand）
      await cdp.eval(`(() => { const el = document.activeElement; if (el) el.focus(); })()`);
      await sleep(120);
      for (const type of ['keyDown', 'keyUp']) {
        await cdp.send('Input.dispatchKeyEvent', { type, key: 'a', code: 'KeyA', windowsVirtualKeyCode: 65, nativeVirtualKeyCode: 65, modifiers: 2 });
      }
      await sleep(100);
      for (const type of ['keyDown', 'keyUp']) {
        await cdp.send('Input.dispatchKeyEvent', { type, key: 'Backspace', code: 'Backspace', windowsVirtualKeyCode: 8, nativeVirtualKeyCode: 8 });
      }
      await sleep(200);
      console.log('cleared focused element');
    } else {
      console.log('未知命令。可用：launch status tabs goto eval inspect shot scroll pickfile file tap tapText hover type key clear');
    }
  } finally {
    cdp.close();
  }
}

main().catch((e) => { console.error(String(e.message || e)); process.exit(1); });