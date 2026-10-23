import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve, dirname, join, basename } from "node:path";
import { pathToFileURL } from "node:url";
export function checkSubtitles(
  text,
  duration,
  { maxCharsPerSecond = 14 } = {},
) {
  const errors = [],
    warnings = [];
  let previous = 0,
    count = 0;
  const stamp = (s) => {
    const m = s.match(/^(\d+):(\d{2}):(\d{2})[,.](\d{3})$/);
    if (!m || +m[2] >= 60 || +m[3] >= 60) return NaN;
    return +m[1] * 3600 + +m[2] * 60 + +m[3] + +m[4] / 1000;
  };
  for (const block of text
    .replace(/^\uFEFF/, "")
    .trim()
    .split(/\r?\n\s*\r?\n/)) {
    const lines = block.split(/\r?\n/);
    if (!block.trim()) continue;
    const match = lines[1]?.match(/^(\S+)\s+-->\s+(\S+)$/);
    const start = stamp(match?.[1] ?? ""),
      end = stamp(match?.[2] ?? "");
    count++;
    if (
      +lines[0] !== count ||
      !Number.isFinite(start) ||
      !Number.isFinite(end) ||
      start < 0 ||
      end <= start ||
      start < previous - 0.001 ||
      end > duration + 0.1
    )
      errors.push(`subtitle ${count}: invalid sequence/time window`);
    const chars = lines.slice(2).join("").replace(/\s/g, "").length;
    if (!chars) errors.push(`subtitle ${count}: empty text`);
    if (chars / (end - start) > maxCharsPerSecond)
      warnings.push(
        `subtitle ${count}: fast reading ${Math.round(chars / (end - start))} chars/s`,
      );
    previous = end;
  }
  return { errors, warnings, count };
}
function command(exe, args) {
  const r = spawnSync(exe, args, {
    encoding: "utf8",
    timeout: 600000,
    maxBuffer: 16 * 1024 * 1024,
  });
  if (r.error || r.status !== 0)
    throw new Error(
      `${exe} failed: ${r.error?.message ?? r.stderr?.slice(-800)}`,
    );
  return r;
}
export function checkMedia(
  project,
  video,
  { srt, requireAudio = false, allowPreview = false, out, configPath } = {},
) {
  project = resolve(project);
  video = resolve(project, video);
  out = resolve(project, out ?? "qa/media-report.json");
  mkdirSync(dirname(out), { recursive: true });
  const settings = resolve(project, configPath ?? "qc.json");
  const config = existsSync(settings)
    ? JSON.parse(readFileSync(settings, "utf8"))
    : {};
  const errors = [],
    warnings = [],
    manualChecks = [
      "phone-size readability",
      "subject and factual accuracy",
      "narration timing",
      "music vs voice",
      "cover and platform safe areas",
    ];
  const meta = JSON.parse(
    command("ffprobe", [
      "-v",
      "error",
      "-show_streams",
      "-show_format",
      "-of",
      "json",
      video,
    ]).stdout,
  );
  const stream = meta.streams.find((s) => s.codec_type === "video"),
    audio = meta.streams.find((s) => s.codec_type === "audio");
  if (!stream) throw new Error("No video stream");
  const duration = Number(stream.duration ?? meta.format.duration);
  const [n, d] = stream.avg_frame_rate.split("/").map(Number),
    fps = n / d;
  if (
    !Number.isFinite(duration) ||
    duration <= 0 ||
    !Number.isFinite(fps) ||
    fps <= 0
  )
    errors.push("invalid duration/fps");
  for (const [key, value] of Object.entries({
    width: stream.width,
    height: stream.height,
    fps,
    duration,
  }))
    if (
      config[key] !== undefined &&
      Math.abs(config[key] - value) > (key === "duration" ? 0.1 : 0.01)
    )
      errors.push(`${key} differs from requested target`);
  if (stream.width % 2 || stream.height % 2)
    warnings.push("odd dimensions may be unsuitable for yuv420p");
  if (requireAudio && !audio) errors.push("required audio missing");
  const scan = command("ffmpeg", [
    "-hide_banner",
    "-nostats",
    "-i",
    video,
    "-map",
    "0:v:0",
    "-vf",
    "blackdetect=d=0.3:pix_th=0.1,freezedetect=n=-50dB:d=2",
    "-an",
    "-f",
    "null",
    "-",
  ]);
  const black = [
    ...scan.stderr.matchAll(
      /black_start:([\d.]+) black_end:([\d.]+) black_duration:([\d.]+)/g,
    ),
  ].map((m) => ({ start: +m[1], end: +m[2], seconds: +m[3] }));
  if (black.some((b) => b.seconds >= duration - 0.1))
    errors.push("video is effectively all black");
  else if (black.length) warnings.push("black intervals need visual review");
  const freezes = [...scan.stderr.matchAll(/freeze_start:\s*([\d.]+)/g)].map(
    (m) => +m[1],
  );
  if (freezes.length) warnings.push("static intervals need editorial review");
  if (/(?:corrupt|invalid data|error while decoding)/i.test(scan.stderr))
    errors.push("decoder reported corrupted data");
  let loudness = null;
  if (audio) {
    const measurement = command("ffmpeg", [
      "-hide_banner",
      "-nostats",
      "-i",
      video,
      "-vn",
      "-af",
      "loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json",
      "-f",
      "null",
      "-",
    ]);
    const json = measurement.stderr.match(/\{\s*"input_i"[\s\S]*?\}/)?.[0];
    if (!json) errors.push("audio loudness measurement missing");
    else {
      const data = JSON.parse(json);
      loudness = {
        integratedLufs: data.input_i,
        truePeakDbtp: data.input_tp,
        rangeLu: data.input_lra,
      };
      if (!Number.isFinite(Number(data.input_i))) {
        (requireAudio ? errors : warnings).push("audio is silent");
      } else if (
        Number(data.input_i) < (config.minLufs ?? -24) ||
        Number(data.input_i) > (config.maxLufs ?? -10)
      )
        warnings.push("integrated loudness outside project range");
      if (Number(data.input_tp) > (config.maxTruePeak ?? -1))
        warnings.push("true peak exceeds project target");
    }
  }
  let subtitles = null;
  if (srt) {
    subtitles = checkSubtitles(
      readFileSync(resolve(project, srt), "utf8"),
      duration,
      config,
    );
    errors.push(...subtitles.errors);
    warnings.push(...subtitles.warnings);
  }
  let render = null;
  if (existsSync(`${video}.json`)) {
    render = JSON.parse(readFileSync(`${video}.json`, "utf8"));
    if (render.fullRender === false && !allowPreview)
      errors.push("partial render cannot be accepted as a full video");
    if (render.debug?.overflows?.length)
      errors.push("director reports text overflow");
  }
  const sheet = join(
    dirname(out),
    basename(out, ".json") + "-contact-sheet.png",
  );
  command("ffmpeg", [
    "-hide_banner",
    "-loglevel",
    "error",
    "-i",
    video,
    "-vf",
    `fps=${6 / duration},scale=480:-2,tile=3x2`,
    "-frames:v",
    "1",
    "-y",
    sheet,
  ]);
  const report = {
    schemaVersion: 1,
    status: errors.length ? "failed" : "technical-pass-needs-human-review",
    ok: errors.length === 0,
    video,
    width: stream.width,
    height: stream.height,
    fps,
    duration,
    videoCodec: stream.codec_name,
    audio: Boolean(audio),
    loudness,
    black,
    freezes,
    subtitles,
    errors,
    warnings,
    evidence: {
      contactSheet: sheet,
      renderReport: render ? `${video}.json` : null,
    },
    humanReview: { status: "pending", checks: manualChecks },
  };
  writeFileSync(out, JSON.stringify(report, null, 2) + "\n");
  return report;
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  const argv = process.argv.slice(2),
    arg = (key, def) => {
      const i = argv.indexOf("--" + key);
      return i >= 0 ? argv[i + 1] : def;
    };
  try {
    if (!arg("video")) throw new Error("--video required");
    const report = checkMedia(arg("project", "."), arg("video"), {
      srt: arg("srt"),
      requireAudio: argv.includes("--require-audio"),
      allowPreview: argv.includes("--allow-preview"),
      out: arg("out"),
      configPath: arg("config"),
    });
    console.log(JSON.stringify(report, null, 2));
    process.exitCode = report.ok ? 0 : 1;
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
