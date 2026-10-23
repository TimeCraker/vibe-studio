// Local media integration fixture: no model calls, accounts, publishing or human acceptance.
import assert from "node:assert/strict";
import { cpSync, mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { mediaCommand, probeMedia } from "../scripts/lib/media.mjs";
import { hashFile, readJson, writeJson } from "../scripts/lib/files.mjs";
import { runJob } from "../scripts/lib/runner.mjs";
import { recordInspection, verifyInspection } from "../skills/media-qc/scripts/inspect.mjs";

const repo = resolve(dirname(fileURLToPath(import.meta.url)), "..");
mkdirSync(join(repo, ".cache"), { recursive: true });
const project = mkdtempSync(join(repo, ".cache/quality-fixture-"));
mkdirSync(join(project, "art")); mkdirSync(join(project, "audio"));
const frameNames = ["p01.jpg", "p02.jpg", "p03.jpg"];
for (const file of frameNames) cpSync(join(repo, "assets/patterns-frames", file), join(project, "art", file));
for (const [file, signal] of [["voice.wav", "sine=frequency=1200:duration=3:sample_rate=48000"], ["music.wav", "sine=frequency=220:duration=1:sample_rate=48000"]])
  mediaCommand("ffmpeg", ["-v", "error", "-f", "lavfi", "-i", signal, "-y", join(project, "audio", file)]);
writeJson(join(project, "storyboard.json"), { schemaVersion: 1, audience: "工具验证", goal: "确认媒体接线", profile: "demo", claims: [],
  scenes: frameNames.map((file, i) => ({ id: `s${i + 1}`, start: i * 2, end: (i + 1) * 2, title: `测试参考画面 ${i + 1}`, purpose: "验证时间与素材", subject: file, claimIds: [] })), review: { status: "pending" } });
const audio = { schemaVersion: 1, duration: 6, tracks: [
  { file: "audio/voice.wav", role: "voice", start: 1 },
  { file: "audio/music.wav", role: "music", loop: true, gainDb: -12, fadeIn: 0.2, fadeOut: 0.4 },
] };
writeJson(join(project, "audio.json"), audio);
writeJson(join(project, "animatic.json"), { schemaVersion: 1, width: 640, height: 360, fps: 24,
  audio: "audio/mix.wav", frames: Object.fromEntries(frameNames.map((file, i) => [`s${i + 1}`, `art/${file}`])) });
writeFileSync(join(project, "README.md"), "# Quality integration fixture\nSynthetic tones stand in for voice/music. Images reuse existing pattern references. Technical verification only; human visual/listening review remains pending.\n");
writeJson(join(project, "job.json"), { schemaVersion: 1, steps: [
  { id: "audio", command: ["node", "{repo}/scripts/studio.mjs", "audio", "--project", "{project}"],
    inputs: ["audio.json", "audio/voice.wav", "audio/music.wav"], outputs: ["audio/mix.wav", "audio/mix.wav.json"] },
  { id: "animatic", command: ["node", "{repo}/scripts/studio.mjs", "animatic", "--project", "{project}"],
    inputs: ["animatic.json", "storyboard.json", "art", "audio/mix.wav"], outputs: ["preview/animatic.mp4", "preview/animatic.mp4.json", "preview/animatic.mp4.srt"] },
  { id: "qc", command: ["node", "{repo}/scripts/studio.mjs", "qc", "--project", "{project}", "--video", "preview/animatic.mp4", "--srt", "preview/animatic.mp4.srt", "--allow-preview", "--require-audio"],
    inputs: ["preview/animatic.mp4", "preview/animatic.mp4.json", "preview/animatic.mp4.srt"], outputs: ["qa/media-report.json", "qa/media-report-contact-sheet.png"] },
] });
await runJob(project, repo, { quiet: true });
assert.deepEqual((await runJob(project, repo, { quiet: true })).cached, ["audio", "animatic", "qc"]);
const first = readJson(join(project, "qa/media-report.json"));
assert.equal(first.ok, true); assert.equal(first.duration, 6); assert.equal(first.subtitles.count, 3);
writeJson(join(project, "qa/inspection-input.json"), { schemaVersion: 1, video: "preview/animatic.mp4", videoSha256: first.videoSha256,
  reviewer: "integration-fixture", inspection: { visual: [], audio: [] },
  checks: [{ kind: "visual", status: "unreviewed", note: "Fixture does not assert human visual acceptance" }, { kind: "audio", status: "unreviewed", note: "Synthetic tones, not a listening acceptance" }] });
recordInspection(project);
assert.equal(verifyInspection(project, "qa/editorial-review.json").ok, true);
audio.tracks[0].gainDb = -9; writeJson(join(project, "audio.json"), audio);
assert.deepEqual((await runJob(project, repo, { quiet: true })).cached, []);
assert.notEqual(hashFile(join(project, "preview/animatic.mp4")), first.videoSha256);
assert.equal(verifyInspection(project, "qa/editorial-review.json").status, "stale-review");
mediaCommand("ffmpeg", ["-v", "error", "-i", join(project, "preview/animatic.mp4"), "-f", "null", "-"]);
const meta = probeMedia(join(project, "preview/animatic.mp4"));
assert.ok(meta.streams.some((s) => s.codec_type === "audio"));
const summary = { ok: true, project, video: join(project, "preview/animatic.mp4"), contactSheet: join(project, "qa/media-report-contact-sheet.png"),
  seconds: 6, frames: 144, cacheAndInvalidationVerified: true, staleReviewRejected: true, syntheticTestAudio: true, humanReview: "pending", published: false };
writeJson(join(repo, ".cache/verification/quality-workflow.json"), summary);
console.log(JSON.stringify(summary, null, 2));
