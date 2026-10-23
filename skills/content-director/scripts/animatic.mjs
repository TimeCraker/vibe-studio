import { mkdirSync, mkdtempSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { readJson, writeJson, safePath, hashFile } from "../../../scripts/lib/files.mjs";
import { mediaCommand, mediaInput, probeMedia, bounded } from "../../../scripts/lib/media.mjs";

const run = (args) => mediaCommand("ffmpeg", ["-hide_banner", "-loglevel", "error", "-nostdin", ...args]);
const stamp = (seconds) => {
  const n = Math.round(seconds * 1000);
  return `${String(Math.floor(n / 3600000)).padStart(2, "0")}:${String(Math.floor(n / 60000) % 60).padStart(2, "0")}:${String(Math.floor(n / 1000) % 60).padStart(2, "0")},${String(n % 1000).padStart(3, "0")}`;
};

export function renderAnimatic(project, { configPath = "animatic.json", out = "preview/animatic.mp4" } = {}) {
  project = resolve(project);
  const configFile = mediaInput(project, configPath), config = readJson(configFile);
  if (config.schemaVersion !== 1) throw new Error("animatic schemaVersion must be 1");
  const storyPath = config.storyboard ?? "storyboard.json", storyFile = mediaInput(project, storyPath), story = readJson(storyFile);
  if (story.schemaVersion !== 1 || !Array.isArray(story.scenes) || !story.scenes.length) throw new Error("Storyboard needs scenes");
  const width = bounded(config.width ?? 640, "width", 160, 3840), height = bounded(config.height ?? 360, "height", 90, 3840);
  const fps = bounded(config.fps ?? 24, "fps", 1, 60);
  if (![width, height, fps].every(Number.isInteger) || width % 2 || height % 2) throw new Error("Use integer fps and even dimensions");
  if (config.allowPlaceholders !== undefined && typeof config.allowPlaceholders !== "boolean") throw new Error("allowPlaceholders must be boolean");
  const sources = [{ path: configPath, sha256: hashFile(configFile) }, { path: storyPath, sha256: hashFile(storyFile) }];
  const ids = new Set(), warnings = [], scenes = [];
  let end = 0;
  for (const scene of story.scenes) {
    if (typeof scene.id !== "string" || !scene.id || ids.has(scene.id)) throw new Error("Scene IDs must be nonempty and unique");
    ids.add(scene.id);
    if (!Number.isFinite(scene.start) || !Number.isFinite(scene.end) || Math.abs(scene.start - end) > 0.001 || scene.end <= scene.start)
      throw new Error(`Scene ${scene.id}: gap, overlap or invalid time`);
    bounded(scene.end, "scene.end", 0.001, 14400);
    const startFrame = Math.round(scene.start * fps), endFrame = Math.round(scene.end * fps);
    if (endFrame <= startFrame) throw new Error(`Scene ${scene.id} is shorter than one frame`);
    const frame = config.frames?.[scene.id];
    if (frame !== undefined && (typeof frame !== "string" || !/\.(png|jpe?g|webp)$/i.test(frame))) throw new Error(`Scene ${scene.id}: use a still PNG/JPEG/WebP`);
    if (!frame && config.allowPlaceholders !== true) throw new Error(`Scene ${scene.id}: reference frame missing`);
    if (frame) { mediaInput(project, frame); sources.push({ path: frame, sha256: hashFile(safePath(project, frame)) }); }
    else warnings.push(`Scene ${scene.id} uses an explicit placeholder; visual direction is not verified`);
    scenes.push({ id: scene.id, start: startFrame / fps, end: endFrame / fps, frames: endFrame - startFrame,
      source: frame ?? null, caption: String(scene.caption ?? scene.title ?? scene.id).replace(/[\r\n]+/g, " ") });
    end = scene.end;
  }
  if (Object.keys(config.frames ?? {}).some((id) => !ids.has(id))) throw new Error("Reference frames contain unknown scene IDs");
  const duration = scenes.at(-1).end, frames = Math.round(duration * fps);
  let audio;
  if (config.audio !== undefined) {
    audio = mediaInput(project, config.audio);
    const info = probeMedia(audio);
    if (!info.streams.some((s) => s.codec_type === "audio") || !Number.isFinite(info.duration)) throw new Error("Invalid animatic audio");
    if (info.duration > duration + 0.05 && config.audioTrim !== true) throw new Error("Audio exceeds storyboard; adjust timing or explicitly set audioTrim:true");
    if (Math.abs(info.duration - duration) > 0.05) warnings.push(info.duration > duration ? "Audio is explicitly trimmed to storyboard" : "Short audio is padded with silence");
    sources.push({ path: config.audio, sha256: hashFile(audio) });
  } else warnings.push("No audio: narrative timing and listening remain unreviewed");
  const output = safePath(project, out), reportPath = safePath(project, `${out}.json`), srtPath = safePath(project, `${out}.srt`);
  if (!out.toLowerCase().endsWith(".mp4")) throw new Error("Animatic output must be .mp4");
  const protectedPaths = sources.map((s) => safePath(project, s.path).toLowerCase());
  if ([output, reportPath, srtPath].some((p) => protectedPaths.includes(p.toLowerCase()))) throw new Error("Animatic output would overwrite an input");
  const subtitle = scenes.map((s, i) => `${i + 1}\n${stamp(s.start)} --> ${stamp(s.end)}\n${s.caption}\n`).join("\n");
  const tempRoot = safePath(project, ".studio/tmp"); mkdirSync(tempRoot, { recursive: true });
  const temp = mkdtempSync(join(tempRoot, "animatic-"));
  try {
    for (const [i, scene] of scenes.entries()) {
      const input = scene.source ? ["-loop", "1", "-framerate", String(fps), "-i", safePath(project, scene.source)] :
        ["-f", "lavfi", "-i", `color=c=0x354052:s=${width}x${height}:r=${fps}`];
      run([...input, "-vf", `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,setsar=1,drawbox=x=0:y=0:w=iw:h=30:color=black@0.7:t=fill,drawtext=text='ANIMATIC / NOT FINAL':fontsize=16:fontcolor=white:x=10:y=6`,
        "-frames:v", String(scene.frames), "-an", "-c:v", "libx264", "-preset", "ultrafast", "-crf", "25", "-pix_fmt", "yuv420p", "-y", join(temp, `scene-${i}.mp4`)]);
    }
    const list = join(temp, "concat.txt"), captions = join(temp, "captions.srt"), rendered = join(temp, "animatic.mp4");
    writeFileSync(list, scenes.map((_s, i) => `file 'scene-${i}.mp4'`).join("\n"));
    writeFileSync(captions, subtitle, "utf8");
    const args = ["-f", "concat", "-safe", "0", "-i", list];
    if (audio) args.push("-i", audio);
    args.push("-i", captions, "-map", "0:v:0");
    if (audio) args.push("-map", "1:a:0", "-af", `apad=whole_dur=${duration},atrim=duration=${duration}`, "-c:a", "aac");
    args.push("-map", `${audio ? 2 : 1}:0`, "-c:s", "mov_text", "-c:v", "copy", "-t", String(duration), "-movflags", "+faststart", "-y", rendered);
    run(args);
    const meta = probeMedia(rendered), video = meta.streams.find((s) => s.codec_type === "video");
    if (!video || Number(video.nb_frames) !== frames || Math.abs(Number(video.duration) - duration) > 1 / fps + 0.01)
      throw new Error("Animatic frame count or duration differs from storyboard");
    if (sources.some((s) => hashFile(safePath(project, s.path)) !== s.sha256)) throw new Error("Animatic sources changed during render");
    mkdirSync(dirname(output), { recursive: true }); renameSync(rendered, output); writeFileSync(srtPath, subtitle, "utf8");
    const report = { schemaVersion: 1, ok: true, kind: "animatic", status: "preview-needs-review", fullRender: false, fullTimeline: true,
      video: out, videoSha256: hashFile(output), width, height, fps, frames, seconds: duration, storyboardSeconds: end,
      audio: config.audio ?? null, subtitle: `${out}.srt`, subtitleSha256: hashFile(srtPath), scenes, sources, warnings,
      humanReview: { status: "pending", checks: ["story clarity", "pacing", "visual direction", "voice and picture timing"] } };
    writeJson(reportPath, report); return report;
  } finally { rmSync(temp, { recursive: true, force: true }); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const argv = process.argv.slice(2), arg = (key, fallback) => {
    const i = argv.indexOf(`--${key}`); return i < 0 ? fallback : argv[i + 1];
  };
  try { console.log(JSON.stringify(renderAnimatic(arg("project", "."), { configPath: arg("config", "animatic.json"), out: arg("out", "preview/animatic.mp4") }), null, 2));
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
