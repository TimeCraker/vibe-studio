// 检测长录像里的金色爆发（三星合成）时刻：按 2fps 统计帧平均亮度 YAVG，找持续 0.5s+ 的尖峰。
// 用法：node tools/find-bursts.cjs > bursts.txt  （ffmpeg 日志由本脚本 spawn 解析）
import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';

const SRC = 'C:/Users/TimeCraker/Videos/NVIDIA/Honkai Star Rail/Honkai Star Rail 2026.08.08 - 17.32.50.01.mp4';
const START = 26, END = 1290;

const ff = spawn('ffmpeg', [
  '-v', 'info', '-ss', String(START), '-t', String(END - START), '-i', SRC,
  '-vf', 'fps=2,scale=64:36,signalstats,metadata=print:key=lavfi.signalstats.YAVG:file=-',
  '-f', 'null', '-',
]);

const rl = createInterface({ input: ff.stdout });
let frame = 0;
const pts = []; // {t, y}
rl.on('line', (line) => {
  const m = line.match(/pts_time:([\d.]+)/);
  if (m) { frame = parseFloat(m[1]); return; }
  const y = line.match(/YAVG=([\d.]+)/);
  if (y) pts.push({ t: START + frame, y: parseFloat(y[1]) });
});
ff.stderr.on('data', () => {}); // drain
ff.on('close', () => {
  // 基线 = 滑动中位数近似：用前后 60 帧均值
  const spikes = [];
  const W = 60;
  for (let i = 0; i < pts.length; i++) {
    let sum = 0, n = 0;
    for (let j = Math.max(0, i - W); j < Math.min(pts.length, i + W); j += 4) { sum += pts[j].y; n++; }
    const base = sum / n;
    if (pts[i].y > base * 1.28 && pts[i].y > 60) spikes.push({ t: +pts[i].t.toFixed(1), y: pts[i].y, base: +base.toFixed(1) });
  }
  // 合并相邻（<2s）
  const merged = [];
  for (const s of spikes) {
    const last = merged[merged.length - 1];
    if (last && s.t - last.t < 2) { if (s.y > last.y) { last.t = s.t; last.y = s.y; } }
    else merged.push({ ...s });
  }
  console.log(JSON.stringify(merged, null, 1));
});
