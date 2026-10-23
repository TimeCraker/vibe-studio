// merge-chunks.mjs — 把 _chunks/<shot>/<cN>/ 里的帧合并进 frames/<shot>/，并补写 clip.json。
// 这是 capture-all 合并步骤的独立版：用于「分块由多次单独调用采集」的补采场景。
//
//   node capture/merge-chunks.mjs                # 合并全部 _chunks 下已有的 shot
//   node capture/merge-chunks.mjs page-main      # 只处理指定 shot
//
// clip.json 字段与 capture-all 的 merge 输出一致；usableRanges 规则相同：
// 分块区间连续；有动作镜头按 REPLAY_WINDOW(2s)/GHOST_LIFETIME(1.5s) 剔除事件鬼影区。
import { readdirSync, mkdirSync, renameSync, existsSync, statSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const FRAMES = join(ROOT, 'frames');
const CHUNKS = join(FRAMES, '_chunks');
const only = process.argv[2] ?? null;

const cfg = JSON.parse(readFileSync(join(ROOT, 'capture', 'shots.json'), 'utf8'));
const fps = Number(cfg.fps ?? 60);
const dsf = Number(cfg.dsf ?? 2);
const width = Number(process.argv[3] ?? cfg.width ?? 1920);
const height = Number(process.argv[4] ?? cfg.height ?? 1080);

const REPLAY_WINDOW = 2.0;
const GHOST_LIFETIME = 1.5;

for (const shot of cfg.shots) {
  if (only && shot.id !== only) continue;
  const srcDir = join(CHUNKS, shot.id);
  if (!existsSync(srcDir)) continue;

  const finalDir = join(FRAMES, shot.id);
  rmSync(finalDir, { recursive: true, force: true });
  mkdirSync(finalDir, { recursive: true });

  let frames = 0;
  let bytes = 0;
  const chunkDirs = readdirSync(srcDir).filter((d) => /^c\d+$/.test(d)).sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)));
  for (const c of chunkDirs) {
    const d = join(srcDir, c);
    for (const f of readdirSync(d)) {
      if (!f.endsWith('.png')) continue;
      renameSync(join(d, f), join(finalDir, f));
      frames++;
      bytes += statSync(join(finalDir, f)).size;
    }
  }

  const chunkCount = shot.chunkCount ?? ((shot.actions ?? []).length > 0 ? 1 : (cfg.chunkCount ?? 1));
  const totalFrames = Math.max(1, Math.round(fps * shot.seconds));
  const per = Math.ceil(totalFrames / chunkCount);
  const usableRanges = [];
  for (let c = 0; c < chunkCount; c++) {
    const startSec = (c * per) / fps;
    const endSec = Math.min(totalFrames, (c + 1) * per) / fps;
    const ghosts = (shot.actions ?? []).filter((a) => a.sec < startSec && a.sec >= startSec - REPLAY_WINDOW);
    const s = startSec + (ghosts.length ? GHOST_LIFETIME : 0);
    if (endSec - s > 0.2) usableRanges.push([Number(s.toFixed(3)), Number(endSec.toFixed(3))]);
  }

  const entry = {
    id: shot.id, src: shot.src, html: join(ROOT, 'capture', 'src', 'pelican-ride.html'),
    fps, dsf, width, height, seconds: Number(shot.seconds.toFixed(3)),
    frames, expected: totalFrames, bytes, mb: Number((bytes / 1048576).toFixed(1)),
    boot: shot.boot ?? null, actions: shot.actions ?? [], bootApplied: null,
    chunkCount, usableRanges, complete: frames === totalFrames,
    capturedAt: new Date().toISOString(),
    _note: 'merged by capture/merge-chunks.mjs（分块单独补采的合并路径）',
  };
  writeFileSync(join(finalDir, 'clip.json'), JSON.stringify(entry, null, 2));
  rmSync(srcDir, { recursive: true, force: true });
  console.log(`[merge] ${shot.id}: ${frames}/${totalFrames} frames, ${entry.mb} MB, complete=${entry.complete}`);
}

// 剩余分块清空后收掉 _chunks
if (existsSync(CHUNKS) && readdirSync(CHUNKS).length === 0) rmSync(CHUNKS, { recursive: true, force: true });
