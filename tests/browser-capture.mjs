// Explicit integration check: node tests/browser-capture.mjs (requires Chrome).
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createHash } from 'node:crypto';
const dir = mkdtempSync(join(tmpdir(), 'vibe-browser-capture-'));
writeFileSync(join(dir, 'page.html'), `<!doctype html><style>body{margin:0;background:#fafafa}canvas{display:block}</style><canvas width="320" height="180"></canvas><script>
const c=document.querySelector('canvas').getContext('2d');let x=0,n=0;
setTimeout(()=>x+=31,500);function frame(){x+=Math.random()*3;n++;c.clearRect(0,0,320,180);c.fillStyle='#3157f6';c.fillRect(x,30,n+20,40);requestAnimationFrame(frame)}requestAnimationFrame(frame);
</script>`);
writeFileSync(join(dir, 'actions.json'), '[{"sec":0.7,"code":"x+=19"}]');
const script = resolve('skills/web-capture/templates/capture-clip.mjs');
function run(out, chunk, count, port) {
  execFileSync(process.execPath, [script, '--project', dir, '--html', 'page.html', '--out', out, '--fps', '6', '--seconds', '2', '--width', '320', '--height', '180', '--actions', 'actions.json', '--chunk-index', String(chunk), '--chunk-count', String(count), '--port', String(port)], { timeout: 120000, stdio: ['ignore', 'pipe', 'pipe'] });
}
run('full', 0, 1, 9541); run('chunk0', 0, 2, 9542); run('chunk1', 1, 2, 9543);
const hash = (path) => createHash('sha256').update(readFileSync(path)).digest('hex');
for (let i = 0; i < 12; i++) {
  const file = `f${String(i).padStart(5, '0')}.png`;
  assert.equal(hash(join(dir, 'full', file)), hash(join(dir, i < 6 ? 'chunk0' : 'chunk1', file)), `frame ${i}`);
}
console.log(JSON.stringify({ ok: true, framesCompared: 12, mode: 'stateful-replay-with-random-and-actions', evidence: dir }));
