// Assemble the master: mux the rendered picture with the score, verify the
// result, and export the subtitle sidecar.
//
//   node tools/assemble.mjs [--gain -1.5] [--slug pelican-test]
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync, copyFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');              // projects/pelican-test
const REPO = resolve(ROOT, '..', '..');        // vibe-studio
const argv = process.argv.slice(2);
const arg = (k, d) => {
  const i = argv.indexOf(`--${k}`);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : d;
};
const gain = arg('gain', '-1.5');
const slug = arg('slug', 'pelican-test');
// deliverables live in the repo-level products/ zone, not inside the project
const outDir = resolve(arg('outDir', join(REPO, 'products', slug)));
mkdirSync(outDir, { recursive: true });

const video = join(ROOT, 'render', 'video.mp4');
const music = join(ROOT, 'audio', 'music.wav');
for (const f of [video, music]) {
  if (!existsSync(f)) { console.error(`missing ${f}`); process.exit(1); }
}

const ff = (args) => execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', ...args], { encoding: 'utf8' });
const probe = (f) => JSON.parse(execFileSync('ffprobe', [
  '-v', 'error', '-print_format', 'json', '-show_format', '-show_streams', f,
], { encoding: 'utf8' }));

const vin = probe(video);
const vstream = vin.streams.find((s) => s.codec_type === 'video');
console.log(`picture : ${vstream.width}x${vstream.height} ${vstream.r_frame_rate} ${vstream.codec_name} ` +
  `${Number(vin.format.duration).toFixed(2)}s  ${(statSync(video).size / 1048576).toFixed(0)} MB`);

const out = join(outDir, `${slug}-1080p.mp4`);
ff([
  '-i', video, '-i', music,
  '-map', '0:v:0', '-map', '1:a:0',
  '-c:v', 'copy',
  '-af', `volume=${gain}dB`,
  '-c:a', 'aac', '-b:a', '256k', '-ar', '48000', '-ac', '2',
  '-movflags', '+faststart',
  '-y', out,
]);

const pin = probe(out);
const os_ = pin.streams;
const a = os_.find((s) => s.codec_type === 'audio');
const v = os_.find((s) => s.codec_type === 'video');
console.log(`\nmaster  : ${out}`);
console.log(`  video : ${v.width}x${v.height} ${v.r_frame_rate} ${v.codec_name} profile=${v.profile} pix=${v.pix_fmt} ${Number(pin.format.duration).toFixed(2)}s`);
console.log(`  audio : ${a.codec_name} ${a.sample_rate}Hz ${a.channels}ch ${a.bit_rate ? Math.round(a.bit_rate / 1000) + 'k' : ''}`);
console.log(`  size  : ${(statSync(out).size / 1048576).toFixed(1)} MB`);

// ---- subtitle sidecar (the picture already has them burned in) -------------- //
const src = readFileSync(join(ROOT, 'edit', 'timeline.js'), 'utf8');
const { CUES } = new Function(`${src}; return { CUES };`)();
const ts = (t) => {
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = Math.floor(t % 60);
  const ms = Math.round((t - Math.floor(t)) * 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
};
const srt = CUES.map((c, i) => `${i + 1}\n${ts(c.a)} --> ${ts(c.b)}\n${c.text}\n`).join('\n');
const srtPath = join(outDir, `${slug}.srt`);
writeFileSync(srtPath, srt, 'utf8');
console.log(`  subs  : ${srtPath} (${CUES.length} cues)`);

// ---- cover + poster --------------------------------------------------------- //
const covers = join(ROOT, 'render', 'covers');
if (existsSync(join(covers, 'cover-a-sunset.png'))) {
  copyFileSync(join(covers, 'cover-a-sunset.png'), join(outDir, `${slug}-cover.png`));
  console.log(`  cover : ${join(outDir, `${slug}-cover.png`)}`);
}

// ---- loudness report -------------------------------------------------------- //
// ebur128 prints its summary to stderr, so capture both streams
const ebur = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', out, '-af', 'ebur128=framelog=quiet', '-f', 'null', '-'],
  { encoding: 'utf8' });
console.log('\nloudness (final master):');
for (const line of `${ebur.stdout ?? ''}${ebur.stderr ?? ''}`.split('\n')) {
  if (/^\s+(I|LRA|Peak):/.test(line)) console.log('  ' + line.trim());
}
console.log(`\nOK  ${out}`);