import { mkdirSync, mkdtempSync, renameSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { readJson, writeJson, safePath, hashFile } from "../../../scripts/lib/files.mjs";
import { bounded, mediaCommand, mediaInput, probeMedia } from "../../../scripts/lib/media.mjs";

const ffmpeg = (args) => mediaCommand("ffmpeg", ["-hide_banner", "-nostats", "-nostdin", ...args]);
function measure(file, target) {
  const result = ffmpeg(["-i", file, "-vn", "-af",
    `loudnorm=I=${target.integrated}:TP=${target.truePeak}:LRA=${target.range}:print_format=json`, "-f", "null", "-"]);
  const raw = JSON.parse(result.stderr.match(/\{\s*"input_i"[\s\S]*?\}/)?.[0] || "null");
  if (!raw || ["input_i", "input_tp", "input_lra", "input_thresh", "target_offset"].some((key) => !Number.isFinite(Number(raw[key]))))
    throw new Error("Audio is silent or too short for reliable loudness measurement");
  return raw;
}

export function mixAudio(project, { configPath = "audio.json", out = "audio/mix.wav" } = {}) {
  project = resolve(project);
  const configFile = mediaInput(project, configPath), config = readJson(configFile);
  const configSha256 = hashFile(configFile);
  if (config.schemaVersion !== 1 || !Array.isArray(config.tracks) || !config.tracks.length || config.tracks.length > 32)
    throw new Error("audio.json needs schemaVersion=1 and 1..32 tracks");
  const seconds = bounded(config.duration, "duration", 0.4, 14400);
  const output = safePath(project, out), reportPath = safePath(project, `${out}.json`);
  if (!out.toLowerCase().endsWith(".wav")) throw new Error("Audio output must be .wav");
  const target = { integrated: -16, truePeak: -1.5, range: 11, ...config.target };
  bounded(target.integrated, "target.integrated", -70, -5);
  bounded(target.truePeak, "target.truePeak", -9, 0);
  bounded(target.range, "target.range", 1, 50);
  if (config.normalize !== undefined && typeof config.normalize !== "boolean") throw new Error("normalize must be boolean");
  if (config.ducking !== undefined && config.ducking !== false && (typeof config.ducking !== "object" || config.ducking === null || Array.isArray(config.ducking)))
    throw new Error("ducking must be false or a settings object");
  const duck = { threshold: 0.03, ratio: 8, attack: 10, release: 250, ...(config.ducking || {}) };
  bounded(duck.threshold, "ducking.threshold", 0.000976, 1);
  bounded(duck.ratio, "ducking.ratio", 1, 20);
  bounded(duck.attack, "ducking.attack", 0.01, 2000);
  bounded(duck.release, "ducking.release", 0.01, 9000);
  const tracks = config.tracks.map((track, index) => {
    if (!["voice", "music", "effect"].includes(track.role)) throw new Error(`track ${index}: invalid role`);
    const file = mediaInput(project, track.file), meta = probeMedia(file);
    if (!meta.streams.some((s) => s.codec_type === "audio") || !Number.isFinite(meta.duration) || meta.duration <= 0)
      throw new Error(`track ${index}: no finite audio duration`);
    if (track.loop !== undefined && typeof track.loop !== "boolean") throw new Error("loop must be boolean");
    if (track.loop && track.role !== "music") throw new Error("Only music tracks can loop");
    const start = bounded(track.start ?? 0, "track.start", 0, seconds);
    const inputStart = bounded(track.in ?? 0, "track.in", 0, meta.duration - 0.000001);
    const length = bounded(track.duration ?? (track.loop ? seconds - start : meta.duration - inputStart), "track.duration", 0.001, seconds);
    if (start + length > seconds + 0.001 || (!track.loop && inputStart + length > meta.duration + 0.01))
      throw new Error(`track ${index}: exceeds source or timeline; declare an explicit trim`);
    const gainDb = bounded(track.gainDb ?? 0, "track.gainDb", -80, 24);
    const fadeIn = bounded(track.fadeIn ?? 0, "track.fadeIn", 0, length);
    const fadeOut = bounded(track.fadeOut ?? 0, "track.fadeOut", 0, length);
    const highpassHz = bounded(track.highpassHz ?? 0, "track.highpassHz", 0, 400);
    let denoise = false;
    if (track.denoise !== undefined && track.denoise !== false) {
      if (track.role !== "voice" || !track.denoise || typeof track.denoise !== "object" || Array.isArray(track.denoise))
        throw new Error("track.denoise must be a settings object on a voice track, or false");
      if (Object.keys(track.denoise).some((key) => !["reductionDb", "noiseFloorDb"].includes(key)))
        throw new Error("Unknown track.denoise setting; use reductionDb/noiseFloorDb");
      denoise = {
        reductionDb: bounded(track.denoise.reductionDb ?? 8, "track.denoise.reductionDb", 0.01, 30),
        noiseFloorDb: bounded(track.denoise.noiseFloorDb ?? -50, "track.denoise.noiseFloorDb", -80, -20),
      };
    }
    if (fadeIn + fadeOut > length) throw new Error("Fades overlap; shorten them or lengthen the clip");
    return { ...track, file, start, inputStart, length, gainDb, fadeIn, fadeOut, highpassHz, denoise, sha256: hashFile(file) };
  });
  const protectedPaths = [configFile, ...tracks.map((t) => t.file)].map((p) => p.toLowerCase());
  if ([output, reportPath].some((p) => protectedPaths.includes(p.toLowerCase()))) throw new Error("Output would overwrite an input");
  const filters = [], inputArgs = [], groups = { voice: [], music: [], effect: [] };
  for (const [i, t] of tracks.entries()) {
    if (t.loop) inputArgs.push("-stream_loop", "-1");
    inputArgs.push("-i", t.file);
    const chain = [`atrim=start=${t.inputStart}:duration=${t.length}`, "asetpts=PTS-STARTPTS", "aresample=48000",
      "aformat=sample_fmts=fltp:channel_layouts=stereo"];
    // Noise floor refers to the source level, before gain and loudness normalization.
    if (t.denoise) {
      // afftdn uses a 3-hop window and delays samples by 2 hops: 25ms at 48kHz.
      // Flush the tail, then compensate that delay so existing word timing remains valid.
      chain.push("apad=pad_len=1200", `afftdn=nr=${t.denoise.reductionDb}:nf=${t.denoise.noiseFloorDb}`,
        `atrim=start_sample=1200:duration=${t.length}`, "asetpts=PTS-STARTPTS");
    }
    chain.push(`volume=${t.gainDb}dB`);
    if (t.highpassHz) chain.push(`highpass=f=${t.highpassHz}`);
    if (t.fadeIn) chain.push(`afade=t=in:st=0:d=${t.fadeIn}`);
    if (t.fadeOut) chain.push(`afade=t=out:st=${t.length - t.fadeOut}:d=${t.fadeOut}`);
    chain.push(`adelay=${Math.round(t.start * 1000)}:all=1`, `apad=whole_dur=${seconds}`, `atrim=duration=${seconds}`);
    filters.push(`[${i}:a:0]${chain.join(",")}[t${i}]`);
    groups[t.role].push(`[t${i}]`);
  }
  const streams = {};
  for (const [role, labels] of Object.entries(groups)) {
    if (!labels.length) continue;
    filters.push(`${labels.join("")}amix=inputs=${labels.length}:normalize=0:duration=longest[${role}]`);
    streams[role] = `[${role}]`;
  }
  const duckingApplied = config.ducking !== false && Boolean(streams.voice && streams.music);
  if (duckingApplied) {
    filters.push("[voice]asplit=2[spoken][key]",
      `[music][key]sidechaincompress=threshold=${duck.threshold}:ratio=${duck.ratio}:attack=${duck.attack}:release=${duck.release}[ducked]`);
    streams.voice = "[spoken]"; streams.music = "[ducked]";
  }
  const labels = Object.values(streams);
  filters.push(`${labels.join("")}amix=inputs=${labels.length}:normalize=0:duration=longest,atrim=duration=${seconds}[mix]`);
  const tempRoot = safePath(project, ".studio/tmp"); mkdirSync(tempRoot, { recursive: true });
  const temp = mkdtempSync(join(tempRoot, "audio-"));
  try {
    const raw = join(temp, "raw.wav"), rendered = join(temp, "mix.wav");
    // Float intermediate preserves overs that loudnorm can attenuate before PCM export.
    ffmpeg([...inputArgs, "-filter_complex", filters.join(";"), "-map", "[mix]", "-ar", "48000", "-ac", "2", "-c:a", "pcm_f32le", "-y", raw]);
    const before = measure(raw, target);
    if (config.normalize === false) {
      if (Number(before.input_tp) > 0) throw new Error("Unnormalized mix would clip; lower track gains or enable normalization");
      ffmpeg(["-i", raw, "-c:a", "pcm_s24le", "-y", rendered]);
    }
    else {
      const filter = `loudnorm=I=${target.integrated}:TP=${target.truePeak}:LRA=${target.range}:measured_I=${before.input_i}:measured_TP=${before.input_tp}:measured_LRA=${before.input_lra}:measured_thresh=${before.input_thresh}:offset=${before.target_offset}:linear=true`;
      ffmpeg(["-i", raw, "-af", filter, "-ar", "48000", "-ac", "2", "-c:a", "pcm_s24le", "-y", rendered]);
    }
    const after = measure(rendered, target), meta = probeMedia(rendered), errors = [];
    if (Math.abs(meta.duration - seconds) > 0.02) errors.push("Output duration differs from declared timeline");
    if (config.normalize !== false && (Number(after.input_tp) > target.truePeak + 0.3 || Math.abs(Number(after.input_i) - target.integrated) > 1.5))
      errors.push("Measured loudness or true peak misses target; inspect source and dynamics");
    if (hashFile(configFile) !== configSha256 || tracks.some((t) => hashFile(t.file) !== t.sha256))
      throw new Error("Audio inputs changed during processing; retry with stable sources");
    mkdirSync(dirname(output), { recursive: true }); renameSync(rendered, output);
    const report = { schemaVersion: 1, ok: !errors.length, status: errors.length ? "failed" : "processed-needs-listening",
      output: out, outputSha256: hashFile(output), duration: meta.duration, sampleRate: 48000, channels: 2,
      config: { path: configPath, sha256: configSha256 },
      inputs: tracks.map((t) => ({ path: t.file, sha256: t.sha256, role: t.role, start: t.start, in: t.inputStart, duration: t.length, gainDb: t.gainDb, highpassHz: t.highpassHz, denoise: t.denoise, denoiseDelayCompensationSamples: t.denoise ? 1200 : 0 })),
      duckingApplied, normalized: config.normalize !== false, target, before, after, errors,
      warnings: config.normalize === false ? ["Normalization disabled by project config"] : [],
      humanReview: { status: "pending", checks: ["intelligibility", "music balance", "cuts and fades", "distortion", "sync with picture"] } };
    writeJson(reportPath, report);
    return report;
  } finally { rmSync(temp, { recursive: true, force: true }); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const argv = process.argv.slice(2), arg = (key, fallback) => {
    const i = argv.indexOf(`--${key}`); return i < 0 ? fallback : argv[i + 1];
  };
  try { const result = mixAudio(arg("project", "."), { configPath: arg("config", "audio.json"), out: arg("out", "audio/mix.wav") });
    console.log(JSON.stringify(result, null, 2)); process.exitCode = result.ok ? 0 : 1;
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
