// Build the adopted voice track by keeping only clean takes, with short fades at every join.
// Usage: node projects/daily-ai-news-2026-11-01/scripts/build-adopted-track.mjs [--dry]
import { execFileSync } from 'node:child_process';
import { existsSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'audio/source/narration-decoded-8deab700a1b1.wav');
const out = join(root, 'audio/source/narration-adopted-v1.wav');

// Keep intervals in source time. Every removed range is a stutter, a false start or dead air.
export const keeps = [
  { start: 0.40, end: 14.20, note: '片头到“Apple 智能”，切掉后面的“订入”假起手' },
  { start: 15.58, end: 64.18, note: '“接入了阿里千问”到“独立的看门狗，”' },
  { start: 68.02, end: 72.60, note: '“专门盯每个任务…”到“文章”之前，切掉“专门／这个 watchdog／这个”这一串重来' },
  { start: 73.88, end: 105.29, note: '“文章给了一组初步数据”到“苹果宣布”，切掉只有“文章”两个字的假起手' },
  { start: 106.60, end: 146.88, note: '“国行版 Apple 智能要来了”到“国内的”，切掉前一次没说完的“国航版”' },
  { start: 150.65, end: 181.05, note: '“开源这个模型…”到“再见”，切掉“国内的”之后 3.7 秒空停与片尾余音' },
];

const fade = 0.012;
const parts = keeps.map((k, i) => {
  const d = Number((k.end - k.start).toFixed(6));
  const fadeOutStart = Math.max(0, d - fade);
  return `[0:a]atrim=start=${k.start}:end=${k.end},asetpts=PTS-STARTPTS,afade=t=in:st=0:d=${fade},afade=t=out:st=${fadeOutStart.toFixed(6)}:d=${fade}[a${i}]`;
});
const graph = `${parts.join(';')};${keeps.map((_, i) => `[a${i}]`).join('')}concat=n=${keeps.length}:v=0:a=1[out]`;

const args = [
  '-hide_banner', '-nostats', '-y',
  '-i', src,
  '-filter_complex', graph,
  '-map', '[out]',
  '-ar', '48000', '-ac', '2', '-c:a', 'pcm_s16le',
  out,
];

const kept = keeps.reduce((n, k) => n + (k.end - k.start), 0);
console.log(JSON.stringify({ segments: keeps.length, keptSeconds: Number(kept.toFixed(3)), out }, null, 2));

if (!process.argv.includes('--dry')) {
  if (!existsSync(src)) throw new Error(`missing source ${src}`);
  execFileSync('ffmpeg', args, { stdio: ['ignore', 'inherit', 'inherit'] });
  writeFileSync(join(root, 'audio/adopted-plan.json'), JSON.stringify({ source: 'audio/source/narration-decoded-8deab700a1b1.wav', keeps, fadeSeconds: fade }, null, 2));
  console.log('wrote', out);
}
