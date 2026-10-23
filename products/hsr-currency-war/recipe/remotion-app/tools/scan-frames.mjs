// 全片帧统计：区分「白屏污染」（低饱和高亮）与「金色爆发」（高亮+中高饱和）。
// 输出：pollution 区间列表 + burst 候选列表。用法：node tools/scan-frames.mjs
import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';

const SRC = 'C:/Users/TimeCraker/Videos/NVIDIA/Honkai Star Rail/Honkai Star Rail 2026.08.08 - 17.32.50.01.mp4';
const OFFSET = 0;

// 单次遍历：全量 metadata 打印（含 YAVG / SATAVG）。
const ff2 = spawn('ffmpeg', [
  '-v', 'info', '-i', SRC,
  '-vf', 'fps=1,scale=64:36,signalstats,metadata=print:file=-',
  '-f', 'null', '-',
]);

const frames = []; // {t, yavg, satavg}
let cur = { t: 0 };
let idx = 0;

const rl = createInterface({ input: ff2.stdout });
rl.on('line', (line) => {
  let m = line.match(/pts_time:([\d.]+)/);
  if (m) { if (cur.yavg !== undefined) frames.push({ ...cur }); cur = { t: OFFSET + parseFloat(m[1]) }; return; }
  m = line.match(/YAVG=([\d.]+)/);
  if (m) { cur.yavg = parseFloat(m[1]); return; }
  m = line.match(/SATAVG=([\d.]+)/);
  if (m) { cur.satavg = parseFloat(m[1]); }
});
ff2.stderr.on('data', () => {});
ff2.on('close', () => {
  if (cur.yavg !== undefined) frames.push({ ...cur });
  console.error('frames:', frames.length);

  // 1) 污染区间：白色页面 = 高 Y + 极低饱和
  const pol = frames.filter(f => f.satavg !== undefined && f.satavg < 0.10 && f.yavg > 90).map(f => f.t);
  const polRanges = [];
  for (const t of pol) {
    const last = polRanges[polRanges.length - 1];
    if (last && t - last[1] <= 3) last[1] = t; else polRanges.push([t, t]);
  }
  console.log('POLLUTION_RANGES=' + JSON.stringify(polRanges.map(r => [r[0], r[1]])));

  // 2) 金色爆发：亮度显著高于局部基线，且不是白屏
  const spikes = [];
  const W = 45;
  for (let i = 0; i < frames.length; i++) {
    const f = frames[i];
    if (f.satavg === undefined) continue;
    let sum = 0, n = 0;
    for (let j = Math.max(0, i - W); j < Math.min(frames.length, i + W); j += 3) { sum += frames[j].yavg; n++; }
    const base = sum / n;
    if (f.yavg > base * 1.30 && f.yavg > 90 && f.satavg > 0.16) spikes.push({ t: +f.t.toFixed(1), y: Math.round(f.yavg), s: f.satavg });
  }
  const merged = [];
  for (const s of spikes) {
    const last = merged[merged.length - 1];
    if (last && s.t - last.t <= 3) { if (s.y > last.y) { last.t = s.t; last.y = s.y; last.s = s.s; } }
    else merged.push({ ...s });
  }
  console.log('BURSTS=' + JSON.stringify(merged));
});
