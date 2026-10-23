// 解析 bench-yavg.log，找后台区亮度尖峰（三星合成金光）。输出合并后的候选时刻。
import fs from 'node:fs';

const text = fs.readFileSync('C:/Users/TimeCraker/Desktop/my_workspace/vibe-studio/projects/hsr-currency-war/qa/bench-yavg.log', 'utf8');
const pts = [];
let t = 0;
for (const line of text.split('\n')) {
  let m = line.match(/pts_time:([\d.]+)/);
  if (m) { t = 26 + parseFloat(m[1]); continue; }
  m = line.match(/YAVG=([\d.]+)/);
  if (m) pts.push({ t: +t.toFixed(2), y: parseFloat(m[1]) });
}
console.error('samples:', pts.length);
const events = [];
const W = 50;
for (let i = 0; i < pts.length; i++) {
  let sum = 0, n = 0;
  for (let j = Math.max(0, i - W); j < Math.min(pts.length, i + W); j += 4) { sum += pts[j].y; n++; }
  const base = sum / n;
  const ratio = pts[i].y / base;
  if (ratio > 1.35 && pts[i].y > 120) events.push({ t: pts[i].t, y: Math.round(pts[i].y), base: Math.round(base), r: +ratio.toFixed(2) });
}
const merged = [];
for (const e of events) {
  const last = merged[merged.length - 1];
  if (last && e.t - last.t <= 2.5) { if (e.r > last.r) Object.assign(last, e); }
  else merged.push({ ...e });
}
console.log(JSON.stringify(merged, null, 1));
