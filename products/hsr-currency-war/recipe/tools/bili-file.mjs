// bili-file.mjs — 直接对 B 站投稿页隐藏的 input[type=file] 设文件（bili.mjs 的 video 命令选择器过时的临时绕过）。
// 用法：node bili-file.mjs <视频路径> [输入框序号]
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const PORT = 9222;
const file = resolve(process.argv[2] ?? '');
if (!existsSync(file)) { console.error('文件不存在: ' + file); process.exit(1); }

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

// attach 到 member.bilibili.com 的标签页
const { targetInfos } = await send('Target.getTargets');
const page = targetInfos.filter(t => t.type === 'page' && t.url.includes('member.bilibili.com'))[0];
if (!page) { console.error('没找到 B 站标签页'); process.exit(1); }
const { sessionId } = await send('Target.attachToTarget', { targetId: page.targetId, flatten: true });
sid = sessionId;
await send('Runtime.enable');

// 点掉可能的「知道了」弹层
const dismiss = await send('Runtime.evaluate', { expression: `(() => { const b = [...document.querySelectorAll('button')].find(b => b.innerText.trim() === '知道了'); if (b) { b.click(); return 'dismissed'; } return 'none'; })()`, returnByValue: true });
console.log('popup:', dismiss.result.value);

// 逐个 input[type=file] 设文件，直到页面出现上传进度/文件名
const { root } = await send('DOM.getDocument');
const { nodeIds } = await send('DOM.querySelectorAll', { nodeId: root.nodeId, selector: 'input[type=file]' });
console.log('file inputs:', nodeIds.length);
const nameFrag = file.split(/[\\/]/).pop().slice(0, 12);
let ok = -1;
for (let i = 0; i < nodeIds.length; i++) {
  try {
    await send('DOM.setFileInputFiles', { files: [file], nodeId: nodeIds[i] });
    await new Promise(r => setTimeout(r, 2500));
    const probe = await send('Runtime.evaluate', { expression: `(() => { const t = document.body.innerText; return { uploading: /上传中|上传进度|%|处理中|重新上传/.test(t), has: t.includes(${JSON.stringify(nameFrag)}) }; })()`, returnByValue: true });
    console.log(`input[${i}]: ` + JSON.stringify(probe.result.value));
    if (probe.result.value.uploading || probe.result.value.has) { ok = i; break; }
  } catch (e) { console.log(`input[${i}]: ${String(e.message).slice(0, 80)}`); }
}
console.log(ok >= 0 ? `UPLOADED-STARTED via input[${ok}]` : 'ALL-INPUTS-FAILED');
process.exit(0);
