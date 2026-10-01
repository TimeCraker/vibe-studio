#!/usr/bin/env node
/**
 * bili.mjs — 把 B 站投稿表单替你填好。
 *
 * 分工是刻意的：**你登录、你发布；我只填表**。
 *   · 本脚本不读、不存、不索要任何账号密码或 cookie；登录在一个独立 profile 里由你扫码完成。
 *   · 发布按钮永远由你点 —— 那是不可逆的公开动作，而且自动化操作投稿页可能触发风控，
 *     这个风险要由人来担，不该由脚本替你担。
 *
 * 依赖：只依赖本机 Chrome 与 Node 18+（内置 fetch/WebSocket），不装任何 npm 包。
 *
 * ── 高层命令（日常用这几个） ──────────────────────────────────────────
 *   node bili.mjs launch                     打开常驻可见窗口，等你扫码
 *   node bili.mjs state                      打印登录态与表单当前状态
 *   node bili.mjs video  --path a.mp4        上传视频（自动开投稿页、处理弹窗）
 *   node bili.mjs declare --option 含AI生成内容
 *   node bili.mjs category --name 人工智能
 *   node bili.mjs fill   --spec form.json    标题 + 标签 + 简介
 *   node bili.mjs cover  --image cover.png   封面（走「上传封面」对话框）
 *   node bili.mjs check                      校验必填项并打印摘要（红的照原样报出来）
 *   node bili.mjs shot   --out x.png [--full] [--zoom N]
 *
 * ── 逃生口（页面改版时用来自查，不要日常用） ──────────────────────────
 *   node bili.mjs tabs | goto --url U | eval --js 'EXPR' | inspect [--selector CSS]
 *   node bili.mjs popup --trigger CSS [--text T] | pick --trigger CSS --option T
 *   node bili.mjs cascade --trigger CSS --level1 T [--level2 T] [--js] [--dump]
 *   node bili.mjs tap --selector CSS | tapText --text T | hover --text T
 *   node bili.mjs type --selector CSS --text T [--enter] | key --key Escape
 *   node bili.mjs scroll [--to bottom]
 *
 * 公共参数：--port 9222  --profile <dir>  --chrome <exe>  --work <dir>
 * 登录 profile 默认落在 ~/.bili-upload-profile（刻意放在仓库外，避免会话进版本库）。
 */
import { spawn } from 'node:child_process';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { homedir } from 'node:os';

const UPLOAD_URL = 'https://member.bilibili.com/video/frame';

const argv = process.argv.slice(2);
const cmd = argv[0];
const arg = (k, d) => {
  const i = argv.indexOf(`--${k}`);
  return i >= 0 && argv[i + 1] !== undefined && !argv[i + 1].startsWith('--') ? argv[i + 1] : d;
};
const flag = (k) => argv.includes(`--${k}`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const PORT = Number(arg('port', 9222));
const PROFILE = resolve(arg('profile', join(homedir(), '.bili-upload-profile')));
const CHROME = arg('chrome', process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe');
const WORK = resolve(arg('work', process.cwd()));

// --------------------------------------------------------------------------- //
// 极简 CDP 客户端（Node 内置 WebSocket，不需要 npm 包）
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

/** 附着到已打开的窗口里那个 B 站标签页 */
async function attach() {
  const v = await endpoint();
  if (!v) throw new Error(`端口 ${PORT} 上没有 Chrome。先跑：node bili.mjs launch`);
  const cdp = await Cdp.connect(v.webSocketDebuggerUrl);
  const { targetInfos } = await cdp.send('Target.getTargets');
  const pages = targetInfos.filter((t) => t.type === 'page' && !t.url.startsWith('devtools://'));
  if (!pages.length) throw new Error('没有打开的标签页');
  const pick = pages.find((t) => /bilibili\.com/.test(t.url)) ?? pages[0];
  const { sessionId } = await cdp.send('Target.attachToTarget', { targetId: pick.targetId, flatten: true });
  cdp.sessionId = sessionId;
  await cdp.send('Runtime.enable');
  if (pages.length > 1) console.error(`[tabs] 共 ${pages.length} 个，已附着：${pick.url.slice(0, 90)}`);
  return cdp;
}

// --------------------------------------------------------------------------- //
// 小工具
// --------------------------------------------------------------------------- //
/** 只在该元素真的不在视口里时才滚动 —— 无意义的滚动会把已打开的下拉框滚关 */
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

/** 真人点击 + 拦截原生文件选择框。synthetic el.click() 不算用户手势，开不了选择框。 */
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

function sendKey(cdp, key) {
  const vk = key === 'Escape' ? 27 : key === 'Enter' ? 13 : 0;
  return (async () => {
    for (const type of ['keyDown', 'keyUp']) {
      await cdp.send('Input.dispatchKeyEvent', { type, key, code: key, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk });
    }
  })();
}

/** 点第一个「文本完全等于 t」的可见元素（B 站多数控件是 div，不是 button） */
async function tapText(cdp, t) {
  const r = await cdp.eval(`(() => {
    const els = [...document.querySelectorAll('div,span,a,button,label,li')]
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

/** 等页面里出现/消失某段文字 */
async function waitForText(cdp, needle, { timeout = 60000, gone = false } = {}) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) {
    const has = await cdp.eval(`document.body.innerText.includes(${JSON.stringify(needle)})`);
    if (gap(has, gone)) return true;
    await sleep(700);
  }
  throw new Error(`等待「${needle}」${gone ? '消失' : '出现'}超时`);
}
const gap = (has, gone) => (gone ? !has : has);

const STATE_JS = `(() => {
  const vis = e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  const q = (s) => document.querySelector(s);
  const errs = [...document.querySelectorAll('[class*=error],[class*=invalid]')].filter(vis)
    .map(e => (e.innerText || '').trim()).filter(t => t && t.length < 60);
  return {
    url: location.href,
    // 创作中心是子域，头像选择器与主站不同；投稿表单渲染出来本身就说明已登录
    loggedIn: !!q('input[maxlength="80"]') || !!q('.header-avatar-wrap') || document.body.innerText.includes('成为UP主'),
    uploaded: document.body.innerText.includes('上传完成'),
    title: q('input[maxlength="80"]')?.value ?? null,
    titleLen: (q('input[maxlength="80"]')?.value ?? '').length,
    declaration: q('.bcc-select-input-inner')?.value ?? null,
    category: (q('.select-item-cont')?.innerText || '').trim() || null,
    tags: [...document.querySelectorAll('.label-item-v2-content')].map(e => e.innerText.trim()),
    descLen: (q('.ql-editor')?.innerText || '').length,
    cover: !!q('.cover-img')?.style.backgroundImage,
    errors: [...new Set(errs)],
  };
})()`;

// --------------------------------------------------------------------------- //
// 高层命令
// --------------------------------------------------------------------------- //
async function launch() {
  if (await endpoint()) { console.log(`已在运行（端口 ${PORT}）`); return; }
  if (!existsSync(CHROME)) throw new Error(`找不到 Chrome: ${CHROME}（用 --chrome 指定）`);
  mkdirSync(PROFILE, { recursive: true });
  const child = spawn(CHROME, [
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${PROFILE}`,
    '--no-first-run', '--no-default-browser-check', '--start-maximized',
    arg('url', 'https://www.bilibili.com/'),
  ], { detached: true, stdio: 'ignore' });
  child.unref();
  for (let i = 0; i < 120; i++) { if (await endpoint()) break; await sleep(250); }
  if (!await endpoint()) throw new Error('Chrome 没起来调试端口');
  console.log(`已打开窗口  profile=${PROFILE}`);
  console.log('→ 现在由你操作：在窗口里扫码登录，登录完再跑后续命令。');
  console.log('  这个登录态会留在上面的 profile 目录里，下次不用重扫。');
}

async function video(cdp) {
  const file = resolve(arg('path', ''));
  if (!file) throw new Error('需要 --path <视频文件>');
  await cdp.send('Page.navigate', { url: UPLOAD_URL });
  await sleep(5000);
  // 上传前/后都可能弹「知道了」通知框，会挡住表单
  await tapText(cdp, '知道了');
  const box = await pickFile(cdp, 'div.upload-btn', file);
  console.log(`已交给上传控件：${box.text}`);
  await waitForText(cdp, '上传完成', { timeout: 15 * 60 * 1000 });
  await tapText(cdp, '知道了');
  console.log('上传完成，表单已出现。');
}

async function declare(cdp) {
  const want = arg('option', null);
  if (!want) throw new Error('需要 --option <创作声明文本>');
  await pickOption(cdp, '.bcc-select', want);
  const got = await cdp.eval(`document.querySelector('.bcc-select-input-inner')?.value ?? null`);
  console.log(`创作声明 = ${JSON.stringify(got)}`);
  if (got !== want) throw new Error(`设置失败：页面显示 ${JSON.stringify(got)}`);
}

async function category(cdp) {
  const want = arg('name', null);
  if (!want) throw new Error('需要 --name <分区名，如 人工智能>');
  await cascade(cdp, '.select-controller', want, arg('level2', null));
  const got = await cdp.eval(`(document.querySelector('.select-item-cont')?.innerText || '').trim()`);
  console.log(`分区 = ${JSON.stringify(got)}`);
  if (got !== want) throw new Error(`设置失败：页面显示 ${JSON.stringify(got)}`);
}

/** 下拉：已开就直接选，没开才点触发器（再点一次会把已开的关掉） */
async function pickOption(cdp, trig, want) {
  const find = () => cdp.eval(`(() => {
    const els = [...document.querySelectorAll('li,div,span,article')].filter(e => {
      const r = e.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && (e.innerText || '').trim() === ${JSON.stringify(want)};
    });
    if (!els.length) return null;
    const el = els[els.length - 1];
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  })()`);
  let hit = await find();
  if (!hit) {
    await realClick(cdp, trig);
    for (let i = 0; i < 25 && !hit; i++) { await sleep(160); hit = await find(); }
  }
  if (!hit) throw new Error(`展开 ${trig} 后仍看不到选项「${want}」`);
  for (const type of ['mousePressed', 'mouseReleased']) {
    await cdp.send('Input.dispatchMouseEvent', { type, x: Math.round(hit.x), y: Math.round(hit.y), button: 'left', clickCount: 1 });
  }
  await sleep(700);
}

/** 级联/下拉：开 + 选必须在同一进程，否则弹层会自己关掉 */
async function cascade(cdp, trig, l1, l2) {
  const findItem = (t) => cdp.eval(`(() => {
    const els = [...document.querySelectorAll('.drop-list-v2-item, .drop-list-v2-item-cont, [class*=option], [class*=drop-list] li')].filter(e => {
      const r = e.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && (e.innerText || '').trim() === ${JSON.stringify(t)};
    });
    if (!els.length) return null;
    const el = els[els.length - 1];
    const r = el.getBoundingClientRect();
    return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
  })()`);
  await realClick(cdp, trig);
  await sleep(900);
  const it = await findItem(l1);
  if (!it) throw new Error(`展开 ${trig} 后找不到一级项「${l1}」`);
  // 一级项要对「外层行」发 DOM click —— 对内部 span 发坐标点击不生效（实测）
  const r = await cdp.eval(`(() => {
    const els = [...document.querySelectorAll('.drop-list-v2-item')].filter(e => (e.innerText || '').trim() === ${JSON.stringify(l1)});
    if (!els.length) return 'no outer row';
    els[0].click();
    return 'ok';
  })()`);
  if (r !== 'ok') throw new Error(`点一级项失败：${r}`);
  await sleep(900);
  if (l2) {
    const it2 = await findItem(l2);
    if (!it2) throw new Error(`选完「${l1}」后找不到二级项「${l2}」`);
    for (const type of ['mousePressed', 'mouseReleased']) {
      await cdp.send('Input.dispatchMouseEvent', { type, x: it2.x, y: it2.y, button: 'left', clickCount: 1 });
    }
    await sleep(900);
  }
}

async function fill(cdp) {
  const specPath = resolve(arg('spec', join(WORK, 'form.json')));
  if (!existsSync(specPath)) throw new Error(`找不到 spec: ${specPath}`);
  const spec = JSON.parse(readFileSync(specPath, 'utf8'));
  const only = arg('only', null);
  const want = (k) => !only || only === k;
  const out = {};

  if (spec.title && want('title')) {
    const ok = await cdp.eval(`(() => {
      const el = [...document.querySelectorAll('input[maxlength="80"]')].find(e => e.getBoundingClientRect().width > 0);
      if (!el) return '找不到标题框';
      el.focus(); el.select(); return 'ok';
    })()`);
    if (ok !== 'ok') throw new Error(ok);
    await cdp.send('Input.insertText', { text: spec.title });
    out.title = await cdp.eval(`document.querySelector('input[maxlength="80"]')?.value ?? null`);
  }

  if (spec.tags?.length && want('tags')) {
    out.tagsCleared = await cdp.eval(`(() => {
      let n = 0;
      for (const svg of [...document.querySelectorAll('.label-item-v2-container svg.close')]) {
        const r = svg.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) { svg.dispatchEvent(new MouseEvent('click', { bubbles: true })); n++; }
      }
      return n;
    })()`);
    await sleep(600);
    const added = [];
    for (const tag of spec.tags) {
      const before = await cdp.eval(`document.querySelectorAll('.label-item-v2-container').length`);
      const ok = await cdp.eval(`(() => {
        const el = [...document.querySelectorAll('input[maxlength="20"]')].find(e => e.getBoundingClientRect().width > 0);
        if (!el) return '找不到标签框';
        el.focus(); el.select(); return 'ok';
      })()`);
      if (ok !== 'ok') throw new Error(ok);
      await cdp.send('Input.insertText', { text: tag });
      await sleep(220);
      await sendKey(cdp, 'Enter');
      await sleep(420);
      added.push({ tag, ok: (await cdp.eval(`document.querySelectorAll('.label-item-v2-container').length`)) > before });
    }
    out.tagsAdded = added;
  }

  if (spec.description?.length && want('desc')) {
    const ok = await cdp.eval(`(() => {
      const el = document.querySelector('.ql-editor');
      if (!el) return '找不到简介编辑器';
      el.focus(); el.innerHTML = ''; return 'ok';
    })()`);
    if (ok !== 'ok') throw new Error(ok);
    const lines = spec.description;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i]) await cdp.send('Input.insertText', { text: lines[i] });
      // 空行会被 Quill 变成多余空段落 —— 规格里一行就是一个段落，别写空字符串
      if (i < lines.length - 1) await sendKey(cdp, 'Enter');
      await sleep(60);
    }
    out.descChars = await cdp.eval(`(document.querySelector('.ql-editor')?.innerText || '').length`);
  }
  console.log(JSON.stringify(out, null, 1));
}

async function cover(cdp) {
  const img = resolve(arg('image', ''));
  if (!img) throw new Error('需要 --image <封面图>');
  // 已有封面 → 点它重新编辑；没有 → 点空槽
  const trigger = await cdp.eval(`(() => {
    const has = document.querySelector('.cover-img');
    return has ? '.cover-img' : '.cover-empty';
  })()`);
  await realClick(cdp, trigger);
  await sleep(2000);
  const before = await cdp.eval(`document.querySelector('.cover-img')?.style.backgroundImage ?? ''`);
  await pickFile(cdp, '.cover-upload .upload-area', img);
  await sleep(5000);
  await pickOption(cdp, '.cover-editor .bcc-button--primary', '完成');
  const btn = await cdp.eval(`(() => {
    const els = [...document.querySelectorAll('div,button,span')].filter(e => (e.innerText || '').trim() === '完成' && e.getBoundingClientRect().width > 0);
    if (!els.length) return 'no 完成 button';
    const el = els[els.length - 1];
    const r = el.getBoundingClientRect();
    return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
  })()`);
  if (btn !== 'no 完成 button') {
    for (const type of ['mousePressed', 'mouseReleased']) {
      await cdp.send('Input.dispatchMouseEvent', { type, x: btn.x, y: btn.y, button: 'left', clickCount: 1 });
    }
  } else {
    console.error('警告：没找到「完成」按钮，封面对话框可能仍开着');
  }
  await sleep(2500);
  const after = await cdp.eval(`document.querySelector('.cover-img')?.style.backgroundImage ?? ''`);
  console.log(`封面：${before === after ? '未变化（可能失败）' : '已更新'}`);
  if (before === after) throw new Error('封面 URL 没变，视为失败');
}

async function check(cdp) {
  const s = await cdp.eval(STATE_JS);
  console.log(JSON.stringify(s, null, 1));
  const missing = [];
  if (!s.uploaded) missing.push('视频未上传完成');
  if (!s.title) missing.push('标题为空');
  if (!s.declaration) missing.push('创作声明未选（必填）');
  if (!s.category) missing.push('分区未选（必填）');
  if (!s.cover) missing.push('封面未设置（必填）');
  if (s.tags?.length > 10) missing.push(`标签 ${s.tags.length} 个，超过 10 个上限`);
  if (s.descLen > 2000) missing.push(`简介 ${s.descLen} 字，超过 2000 上限`);
  if (s.titleLen > 80) missing.push(`标题 ${s.titleLen} 字，超过 80 上限`);
  if (s.errors.length) missing.push(`页面报错：${s.errors.join(' / ')}`);
  if (missing.length) { console.log('\n未就绪：'); for (const m of missing) console.log('  x ' + m); process.exitCode = 1; }
  else console.log('\n必填项齐了，且无页面报错。发布按钮由你点。');
}

// --------------------------------------------------------------------------- //
// 主流程
// --------------------------------------------------------------------------- //
async function main() {
  if (cmd === 'launch') return launch();
  if (!cmd) { console.log(readFileSync(new URL(import.meta.url), 'utf8').split('* ── 高层命令')[1]?.slice(0, 900) ?? ''); return; }

  const cdp = await attach();
  try {
    const HIGH = { state: async () => console.log(JSON.stringify(await cdp.eval(STATE_JS), null, 1)),
      video: () => video(cdp), declare: () => declare(cdp), category: () => category(cdp),
      fill: () => fill(cdp), cover: () => cover(cdp), check: () => check(cdp) };
    if (HIGH[cmd]) return await HIGH[cmd]();

    // ---- 逃生口 ----
    if (cmd === 'tabs') {
      const v = await endpoint();
      const c2 = await Cdp.connect(v.webSocketDebuggerUrl);
      const { targetInfos } = await c2.send('Target.getTargets');
      for (const t of targetInfos.filter((x) => x.type === 'page')) console.log(`${t.title.slice(0, 40).padEnd(42)} ${t.url.slice(0, 110)}`);
      c2.close();
    } else if (cmd === 'goto') {
      await cdp.send('Page.navigate', { url: arg('url', 'https://www.bilibili.com/') });
      await sleep(Number(arg('wait', 3500)));
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
        for (const sc of scopes) for (const el of sc.querySelectorAll('input, textarea, select, button, [contenteditable="true"], [role="textbox"]')) {
          const r = el.getBoundingClientRect();
          out.push({ tag: el.tagName.toLowerCase(), cls: (el.className || '').toString().slice(0, 50),
            box: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)],
            visible: r.width > 0 && r.height > 0,
            ph: el.placeholder ?? null, ml: el.maxLength ?? null, val: (el.value ?? '').slice(0, 40),
            txt: (el.innerText || '').replace(/\\s+/g, ' ').trim().slice(0, 40) });
        }
        return out;
      })()`);
      console.log(JSON.stringify(r, null, 1));
    } else if (cmd === 'shot') {
      const params = { format: 'png' };
      if (flag('full')) params.captureBeyondViewport = true;
      if (flag('zoom')) params.clip = await cdp.eval(`(() => {
        const r = document.querySelector(${JSON.stringify(arg('selector', 'body'))})?.getBoundingClientRect();
        return { x: r.left, y: r.top, width: r.width, height: r.height, scale: ${Number(arg('zoom', 1))} };
      })()`);
      const { data } = await cdp.send('Page.captureScreenshot', params);
      const out = resolve(arg('out', join(WORK, 'bb.png')));
      mkdirSync(dirname(out), { recursive: true });
      writeFileSync(out, Buffer.from(data, 'base64'));
      console.log(out);
    } else if (cmd === 'scroll') {
      const to = arg('to', 'bottom');
      await cdp.eval(`window.scrollTo(0, ${to === 'bottom' ? 'document.body.scrollHeight' : Number(to)}), null`);
      await sleep(Number(arg('wait', 700)));
      console.log(`scrolled ${to}`);
    } else if (cmd === 'popup') {
      await realClick(cdp, arg('trigger', '.bcc-select'));
      await sleep(Number(arg('wait', 900)));
      const dump = await cdp.eval(`(() => {
        const out = [];
        for (const e of document.querySelectorAll('div,li,span,p')) {
          const r = e.getBoundingClientRect();
          if (r.width < 50 || r.width > 320 || r.height < 12 || r.height > 60 || r.left < 650 || r.left > 1400) continue;
          const t = (e.innerText || '').replace(/\\s+/g, ' ').trim();
          if (!t || t.length > 24) continue;
          out.push({ l: Math.round(r.left), t: Math.round(r.top), cls: (e.className || '').toString().split(' ')[0].slice(0, 26), txt: t });
        }
        const seen = new Set();
        return out.filter(i => { const k = i.l + '|' + i.t + '|' + i.txt; if (seen.has(k)) return false; seen.add(k); return true; }).sort((a, b) => a.l - b.l || a.t - b.t);
      })()`);
      console.log(JSON.stringify(dump, null, 0).replace(/\},\{/g, '},\n{'));
    } else if (cmd === 'pick') {
      await pickOption(cdp, arg('trigger', '.bcc-select'), arg('option', ''));
      console.log(JSON.stringify(await cdp.eval(STATE_JS), null, 1));
    } else if (cmd === 'cascade') {
      await cascade(cdp, arg('trigger', '.select-controller'), arg('level1', ''), arg('level2', null));
      console.log(JSON.stringify(await cdp.eval(STATE_JS), null, 1));
    } else if (cmd === 'tap') {
      const b = await realClick(cdp, arg('selector', 'button'), Number(arg('index', 0)));
      await sleep(Number(arg('wait', 700)));
      console.log(`tapped "${b.text}"`);
    } else if (cmd === 'tapText') {
      const t = arg('text', '');
      const r = await cdp.eval(`(() => {
        const els = [...document.querySelectorAll('div,span,a,button,label,li')].filter(e => (e.innerText || '').trim() === ${JSON.stringify(t)} && e.getBoundingClientRect().width > 0);
        if (!els.length) return null;
        const el = els[els.length - 1];
        el.setAttribute('data-bb-tap', '1');
        const b = el.getBoundingClientRect();
        return { x: b.left + b.width / 2, y: b.top + b.height / 2, n: els.length };
      })()`);
      if (!r) throw new Error(`找不到文本「${t}」`);
      for (const type of ['mousePressed', 'mouseReleased']) {
        await cdp.send('Input.dispatchMouseEvent', { type, x: Math.round(r.x), y: Math.round(r.y), button: 'left', clickCount: 1 });
      }
      await cdp.eval('document.querySelector("[data-bb-tap]")?.removeAttribute("data-bb-tap"), null');
      await sleep(Number(arg('wait', 700)));
      console.log(`tapped "${t}"`);
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
    } else {
      console.log('未知命令。高层：launch state video declare category fill cover check shot');
      console.log('逃生口：tabs goto eval inspect popup pick cascade tap tapText hover type key scroll');
    }
  } finally {
    cdp.close();
  }
}

main().catch((e) => { console.error(String(e.message || e)); process.exit(1); });