// bili-click.mjs — 完整鼠标事件序列点击（hover → press → up），用于 bcc-select 这类对事件序列敏感的组件。
// 用法：node bili-click.mjs <selector> [index]
import { existsSync } from 'node:fs';

const PORT = 9222;
const sel = process.argv[2] ?? 'li.bcc-option';
const idx = Number(process.argv[3] ?? 0);

const v = await (async () => { const r = await fetch(`http://127.0.0.1:${PORT}/json/version`); return r.json(); })();
const ws = new WebSocket(v.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.addEventListener('open', () => res(), { once: true }); ws.addEventListener('error', () => rej(new Error('无法连接 9222')), { once: true }); });
let seq = 0; const pending = new Map(); let sid = null;
ws.addEventListener('message', (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id !== undefined && pending.has(m.id)) {
    const { resolve: res, reject } = pending.get(m.id);
    pending.delete(m.id);
    m.error ? reject(new Error(m.error.message)) : res(m.result);
  }
});
const send = (method, params = {}) => {
  const id = ++seq;
  const p = { id, method, params };
  if (sid) p.sessionId = sid;
  return new Promise((res, rej) => { pending.set(id, { resolve: res, reject: rej }); ws.send(JSON.stringify(p)); });
};

const { targetInfos } = await send('Target.getTargets');
const page = targetInfos.filter(t => t.type === 'page' && t.url.includes('member.bilibili.com'))[0];
if (!page) { console.error('没找到 B 站标签页'); process.exit(1); }
const { sessionId } = await send('Target.attachToTarget', { targetId: page.targetId, flatten: true });
sid = sessionId;
await send('Runtime.enable');

const rect = await send('Runtime.evaluate', { expression: `(() => {
  const els = [...document.querySelectorAll(${JSON.stringify(sel)})].filter(e => e.getBoundingClientRect().width > 0);
  const el = els[${idx}];
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: r.x + r.width / 2, y: r.y + r.height / 2, text: (el.innerText || '').trim().slice(0, 20), n: els.length };
})()`, returnByValue: true });
if (!rect.result.value) { console.error('元素不可见: ' + sel); process.exit(1); }
const { x, y, text } = rect.result.value;
console.log(`clicking [${sel}#${idx}] "${text}" @ (${Math.round(x)}, ${Math.round(y)})`);

for (const type of ['mouseMoved', 'mousePressed', 'mouseReleased']) {
  await send('Input.dispatchMouseEvent', { type, x: Math.round(x), y: Math.round(y), button: 'left', clickCount: type === 'mouseMoved' ? 0 : 1 });
  await new Promise(r => setTimeout(r, 60));
}
console.log('CLICKED');
