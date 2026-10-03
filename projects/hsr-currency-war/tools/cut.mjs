// 粗剪工具：读 capture/edl.json，逐段切片（统一 1920x1080@60 h264+aac48k），再 concat -c copy 无损拼接。
// 用法：node tools/cut.mjs [--dry]
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const HERE = dirname(fileURLToPath(import.meta.url));
const PROJECT = resolve(HERE, '..');
const SOURCES = {
  dvr: 'C:/Users/TimeCraker/Videos/NVIDIA/Honkai Star Rail/Honkai Star Rail 2026.08.10 - 20.40.13.02.DVR.mp4',
  long: 'C:/Users/TimeCraker/Videos/NVIDIA/Honkai Star Rail/Honkai Star Rail 2026.08.08 - 17.32.50.01.mp4',
};
function argValue(flag) {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
const dry = process.argv.includes('--dry');
const edlPath = argValue('--edl') ?? join(PROJECT, 'capture', 'edl.json');
const ffmpeg = 'ffmpeg';

const edl = JSON.parse(readFileSync(edlPath, 'utf8'));
const segDir = join(PROJECT, 'render', 'segs', edl.name ?? 'main');
const outFinal = join(PROJECT, edl.output);
mkdirSync(segDir, { recursive: true });

function run(args) {
  if (dry) { console.log('DRY', args.join(' ')); return; }
  execFileSync(ffmpeg, args, { stdio: ['ignore', 'ignore', 'pipe'] });
}

let total = 0;
const listLines = [];
for (let i = 0; i < edl.segments.length; i++) {
  const s = edl.segments[i];
  const outDur = s.dur / s.speed;
  const file = join(segDir, `seg-${String(i + 1).padStart(2, '0')}-${s.id}.mp4`);
  listLines.push(`file '${file.replace(/\\/g, '/')}'`);
  if (existsSync(file) && statSync(file).size > 100000) {
    console.log(`skip ${s.id} (exists)`);
    total += outDur;
    continue;
  }
  let args;
  if (s.src === 'color') {
    // 纯色段（收尾黑场等）：带静音轨，供叠 EndCard
    args = ['-y', '-v', 'error',
      '-f', 'lavfi', '-t', String(outDur), '-i', `color=c=${s.color}:s=1920x1080:r=60`,
      '-f', 'lavfi', '-t', String(outDur), '-i', 'anullsrc=r=48000:cl=stereo',
      '-map', '0:v:0', '-map', '1:a:0',
      '-c:v', 'libx264', '-crf', '18', '-preset', 'medium', '-pix_fmt', 'yuv420p',
      '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-ac', '2',
      file];
    console.log(`cut ${s.id} color ${s.color} -> ${outDur.toFixed(1)}s`);
    run(args);
    total += outDur;
    continue;
  }
  const src = SOURCES[s.src];
  if (!src || !existsSync(src)) throw new Error('missing source: ' + s.src);
  const srcSize = statSync(src).size;
  args = ['-y', '-v', 'error', '-ss', String(s.ss), '-t', String(s.dur), '-i', src];
  if (!s.audio) args.push('-f', 'lavfi', '-t', String(outDur), '-i', 'anullsrc=r=48000:cl=stereo');
  const vf = `scale=1920:1080:flags=lanczos,setpts=PTS/${s.speed},fps=60`;
  let af;
  if (s.audio) {
    af = `atempo=${s.speed},afade=t=in:d=0.12,afade=t=out:st=${Math.max(0, outDur - 0.15).toFixed(2)}:d=0.15`;
  }
  // note: audio=true with speed>1 would need atempo; keep it (atempo supports 0.5-100)
  args.push('-vf', vf);
  if (af) args.push('-af', af);
  args.push(
    '-map', '0:v:0', '-map', s.audio ? '0:a:0' : '1:a:0',
    '-c:v', 'libx264', '-crf', '18', '-preset', 'medium', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-ac', '2',
    '-shortest', file,
  );
  console.log(`cut ${s.id} ${s.src}@${s.ss} x${s.speed} -> ${outDur.toFixed(1)}s  ${s.note}`);
  run(args);
  total += outDur;
}

const listFile = join(segDir, 'concat.txt');
writeFileSync(listFile, listLines.join('\n') + '\n');
console.log(`segments total ${total.toFixed(1)}s; concat -> ${outFinal}`);
if (!dry) {
  run(['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', listFile, '-c', 'copy', '-movflags', '+faststart', outFinal]);
}
console.log('DONE');
