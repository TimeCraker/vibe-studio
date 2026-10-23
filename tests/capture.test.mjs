import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { Cdp } from '../skills/web-capture/templates/cdp.mjs';
const clock = readFileSync(new URL('../skills/web-capture/templates/vclock.js', import.meta.url), 'utf8');
function page() {
  const ctx = vm.createContext({ console, performance: {}, setTimeout });
  vm.runInContext('window=globalThis', ctx); vm.runInContext(clock, ctx);
  return ctx;
}
test('one rAF batch per frame, cancellation and nested callbacks respect next frame', () => {
  const ctx = page();
  vm.runInContext('var n=0;function loop(){n++;requestAnimationFrame(loop)}requestAnimationFrame(loop);__vclock.stepTo(0)', ctx);
  assert.equal(ctx.n, 1); vm.runInContext('__vclock.stepTo(16)', ctx); assert.equal(ctx.n, 2);
  vm.runInContext('var cancelled=0;var id=requestAnimationFrame(()=>cancelled++);cancelAnimationFrame(id);__vclock.stepTo(32)', ctx);
  assert.equal(ctx.cancelled, 0);
  assert.throws(() => vm.runInContext('__vclock.stepTo(0)', ctx), /monotonic/);
});
test('replayed chunks match stateful random animation and timed events', () => {
  const run = (last) => {
    const ctx = page();
    vm.runInContext('var x=0;function loop(){x+=Math.random();requestAnimationFrame(loop)}requestAnimationFrame(loop);setTimeout(()=>x+=100,250)', ctx);
    for (let i = 0; i <= last; i++) vm.runInContext(`__vclock.stepTo(${i * 1000 / 60})`, ctx);
    return ctx.x;
  };
  assert.equal(run(60), run(60));
  assert.notEqual(run(0), run(60));
});
class Socket extends EventTarget { send() {} close() { this.dispatchEvent(new Event('close')); } }
test('CDP rejects pending requests on disconnect, timeout and explicit close', async () => {
  const ws = new Socket(); const cdp = new Cdp(ws, { timeoutMs: 30 });
  const request = cdp.send('Runtime.evaluate'); ws.close();
  await assert.rejects(request, /disconnected/); assert.equal(cdp.pending.size, 0);
  await assert.rejects(cdp.send('Runtime.evaluate'), /closed/);
  const other = new Cdp(new Socket(), { timeoutMs: 10 });
  await assert.rejects(other.send('Runtime.evaluate'), /timeout/); assert.equal(other.pending.size, 0); other.close();
});
