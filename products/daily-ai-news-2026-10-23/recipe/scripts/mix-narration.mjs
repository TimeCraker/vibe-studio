// Place each page wav on the deck timeline and pad the page tail with silence.
// Remotion's Windows audio mixer hit a permission error on this machine, so the
// delivered track is mixed here from the same page wavs. Speech speed is unchanged.
import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const project = dirname(dirname(fileURLToPath(import.meta.url)));
const audioDir = join(project, "remotion-app", "public", "deck", "audio");
const out = join(project, "render", "narration.wav");
mkdirSync(dirname(out), { recursive: true });

const pages = [
  { index: 1, pageSeconds: 62.026 },
  { index: 2, pageSeconds: 80.424 },
  { index: 3, pageSeconds: 86.01 },
  { index: 4, pageSeconds: 55.372 },
  { index: 5, pageSeconds: 13.806 },
];

const probe = (file) =>
  Number(
    execFileSync(
      "ffprobe",
      ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file],
      { encoding: "utf8" },
    ).trim(),
  );

const args = ["-y", "-hide_banner", "-loglevel", "error"];
const filters = [];
pages.forEach((page, i) => {
  const wav = join(audioDir, `page-${page.index}.wav`);
  const dur = probe(wav);
  const gap = Math.max(page.pageSeconds - dur, 0);
  args.push("-i", wav);
  filters.push(
    `[${i}:a]aresample=48000,aformat=channel_layouts=stereo,apad=pad_dur=${gap.toFixed(6)}[a${i}]`,
  );
});
filters.push(`${pages.map((_, i) => `[a${i}]`).join("")}concat=n=${pages.length}:v=0:a=1[a]`);
args.push("-filter_complex", filters.join(";"), "-map", "[a]", "-c:a", "pcm_s16le", out);
execFileSync("ffmpeg", args, { stdio: "inherit" });
console.log(`narration ${probe(out).toFixed(3)}s -> ${out}`);
