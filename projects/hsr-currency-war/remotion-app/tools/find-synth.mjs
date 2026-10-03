// 双向亮度突变检测（正=金色爆发/白屏，负=暗色全屏弹层如奖励选择）。
// 用法：node tools/find-synth.mjs
import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';

const SRC = 'C:/Users/TimeCraker/Videos/NVIDIA/Honkai Star Rail/Honkai Star Rail 2026.08.08 - 17.32.50.01.mp4';
const START = 26, END = 425;

const ff = spawn('ffmpeg', [
  '-v', 'info', '-ss', String(START), '-t', String(END - START), '-i', SRC,
  '-vf', 'fps=2,scale=64:36,signalstats,metadata=print:key=lavfi.signalstats.YAVG:file=-',
  '-f', 'null', '-',
]);

const rl = createInterface({ input: ff.stdout });
let frame = 0;
const pts = [];
rl.on('line', (line) => {
  const m = line.match(/pts_time:([\d.]+)/);
  if (m) { frame = parseFloat(m[1]); return; }
  const y = line.match(/YAVG=([\d.]+)/);
  if (y) pts.push({ t: START + frame, y: parseFloat(y[1]) });
});
ff.stderr.on('data', () => {});
ff.on('close', () => {
  const events = [];
  const W = 50;
  for (let i = 0; i < pts.length; i++) {
    let sum = 0, n = 0;
    for (let j = Math.max(0, i - W); j < Math.min(pts.length, i + W); j += 4) { sum += pts[j].y; n++; }
    const base = sum / n;
    const ratio = pts[i].y / base;
    if (ratio > 1.22 || ratio < 0.72) events.push({ t: +pts[i].t.toFixed(1), y: Math.round(pts[i].y), base: Math.round(base), dir: ratio > 1 ? '+' : '-' });
  }
  const merged = [];
  for (const e of events) {
    const last = merged[merged.length - 1];
    if (last && e.t - last.t <= 2 && e.dir === last.dir) { if (Math.abs(e.y - e.base) > Math.abs(last.y - last.base)) { Object.assign(last, e); } }
    else merged.push({ ...e });
  }
  console.log(JSON.stringify(merged));
});
