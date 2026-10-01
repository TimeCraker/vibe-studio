// Build frames/index.json from whatever has been captured so far, so the edit can
// be designed and previewed while a capture is still running. The real
// capture-all run overwrites this file when it finishes.
//
//   node tools/make-preview-index.mjs
import { readdirSync, writeFileSync, readFileSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const cfg = JSON.parse(readFileSync(join(ROOT, 'capture', 'shots.json'), 'utf8'));
const FPS = Number(cfg.fps ?? 60);
const chunkRoot = join(ROOT, 'frames', '_chunks');
const outRoot = join(ROOT, 'frames');

const shots = [];
for (const shot of cfg.shots) {
  const finalDir = join(outRoot, shot.id);
  const chunkDir = join(chunkRoot, shot.id);
  let frames = 0;
  if (existsSync(finalDir)) {
    frames = readdirSync(finalDir).filter((f) => f.endsWith('.png')).length;
  } else if (existsSync(chunkDir)) {
    for (const c of readdirSync(chunkDir)) {
      const d = join(chunkDir, c);
      if (statSync(d).isDirectory()) frames += readdirSync(d).filter((f) => f.endsWith('.png')).length;
    }
  }
  const expected = Math.round(FPS * shot.seconds);
  if (!frames) continue;
  shots.push({
    id: shot.id, src: shot.src, fps: FPS, dsf: cfg.dsf, width: cfg.width, height: cfg.height,
    seconds: shot.seconds, frames, expected, complete: frames === expected,
    // single-process shots (and shots with no transient events) are safe end to end
    usableRanges: [[0, Number(((frames - 1) / FPS).toFixed(3))]],
    boot: shot.boot ?? null, actions: shot.actions ?? [],
    _preview: true,
  });
}
writeFileSync(join(outRoot, 'index.json'), JSON.stringify({ fps: FPS, dsf: cfg.dsf, width: cfg.width, height: cfg.height, shots, _preview: true }, null, 2));
console.log(`preview index: ${shots.length} shots`);
for (const s of shots) console.log(`  ${s.id.padEnd(9)} ${s.frames}/${s.expected}${s.complete ? '  complete' : '  partial'}`);