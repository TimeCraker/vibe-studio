// 序列帧渲染：绕开 Remotion 合成器的 stdin 管道（沙箱 EPERM 边界），只出帧到磁盘。
// 音轨由 assemble 脚本从 rough cut 回填。用法：node tools/render-frames.mjs <HsrCut|HsrCutVertical> <seqDir>
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { bundle } from '@remotion/bundler';
import { renderFrames, selectComposition } from '@remotion/renderer';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const APP = path.resolve(HERE, '..');
const id = process.argv[2] ?? 'HsrCut';
const seqDir = path.resolve(APP, '..', 'render', process.argv[3] ?? (id === 'HsrCut' ? 'seq-main' : 'seq-v'));

const entryPoint = path.join(APP, 'remotion', 'index.ts');
console.log('bundling...');
const serveUrl = await bundle({ entryPoint, onProgress: () => {} });
const composition = await selectComposition({ serveUrl, id });
fs.mkdirSync(seqDir, { recursive: true });
console.log(`rendering ${id}: ${composition.durationInFrames} frames @ ${composition.fps}fps ${composition.width}x${composition.height} -> ${seqDir}`);

let last = -1;
await renderFrames({
  composition,
  serveUrl,
  imageFormat: 'jpeg',
  jpegQuality: 95,
  outputDir: seqDir,
  inputProps: {},
  frameRange: [0, composition.durationInFrames - 1],
  parallelism: 6,
  onProgress: ({ renderedFrames }) => {
    const pct = Math.floor((renderedFrames / composition.durationInFrames) * 100);
    if (pct !== last && pct % 5 === 0) { console.log(`${pct}% (${renderedFrames}/${composition.durationInFrames})`); last = pct; }
  },
});
console.log('FRAMES DONE');
