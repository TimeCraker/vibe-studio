// 采集收尾：给 capture-clip 直采的 page-narrow 补写 clip.json，并从各镜头的
// clip.json 重建 frames/index.json（capture-all 每次运行会覆盖 index.json，
// 两批采集 + 直采镜头需要一个合并视图）。
import { readdirSync, readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const FRAMES = join(ROOT, 'frames');

// 1) page-narrow：从 capture.chunk0.json 生成 clip.json
const narrowDir = join(FRAMES, 'page-narrow');
const chunkMetaPath = join(narrowDir, 'capture.chunk0.json');
if (existsSync(chunkMetaPath) && !existsSync(join(narrowDir, 'clip.json'))) {
  const m = JSON.parse(readFileSync(chunkMetaPath, 'utf8'));
  const pngs = readdirSync(narrowDir).filter((f) => f.endsWith('.png'));
  const bytes = pngs.reduce((a, f) => a + statSync(join(narrowDir, f)).size, 0);
  const clip = {
    id: 'page-narrow', src: 'A', html: m.html, fps: m.fps, dsf: m.dsf,
    width: m.width, height: m.height, seconds: m.seconds,
    frames: pngs.length, expected: m.totalFrames,
    bytes, mb: Number((bytes / 1048576).toFixed(1)),
    boot: null, actions: [], bootApplied: null,
    chunkCount: 1, usableRanges: [[0, m.seconds]],
    complete: pngs.length === m.totalFrames,
    capturedAt: new Date().toISOString(),
  };
  writeFileSync(join(narrowDir, 'clip.json'), JSON.stringify(clip, null, 2));
  console.log(`page-narrow clip.json written: ${pngs.length}/${m.totalFrames} frames`);
}

// 2) 重建 index.json
const shots = [];
for (const d of readdirSync(FRAMES)) {
  const clipPath = join(FRAMES, d, 'clip.json');
  if (existsSync(clipPath)) shots.push(JSON.parse(readFileSync(clipPath, 'utf8')));
}
shots.sort((a, b) => a.id.localeCompare(b.id));
const index = {
  fps: shots[0]?.fps ?? 60, dsf: shots[0]?.dsf ?? 2,
  width: shots[0]?.width, height: shots[0]?.height,
  shots,
  totalFrames: shots.reduce((a, s) => a + s.frames, 0),
  totalMB: Number((shots.reduce((a, s) => a + (s.bytes ?? 0), 0) / 1048576).toFixed(1)),
  rebuiltAt: new Date().toISOString(),
  _note: '由 capture/finalize-frames.mjs 合并两批 capture-all 与 page-narrow 直采生成',
};
writeFileSync(join(FRAMES, 'index.json'), JSON.stringify(index, null, 2));
for (const s of shots) console.log(`${s.complete ? 'OK ' : 'BAD'} ${s.id}: ${s.frames}/${s.expected} frames, ${s.mb} MB, ${s.width}x${s.height}`);
console.log(`index.json rebuilt: ${shots.length} shots, ${index.totalFrames} frames`);
