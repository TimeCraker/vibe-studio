import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { renderAnimatic } from "../skills/content-director/scripts/animatic.mjs";
import { mediaCommand, probeMedia } from "../scripts/lib/media.mjs";
import { hashFile } from "../scripts/lib/files.mjs";
import { checkMedia } from "../skills/media-qc/scripts/check.mjs";

function fixture() {
  const root = mkdtempSync(join(tmpdir(), "vibe-animatic-"));
  for (const color of ["red", "blue"])
    mediaCommand("ffmpeg", ["-v", "error", "-f", "lavfi", "-i", `color=c=${color}:s=320x180`, "-frames:v", "1", "-y", join(root, `${color}.png`)]);
  mediaCommand("ffmpeg", ["-v", "error", "-f", "lavfi", "-i", "sine=frequency=500:duration=1", "-y", join(root, "voice.wav")]);
  const story = { schemaVersion: 1, scenes: [
    { id: "intro", start: 0, end: 0.75, title: "先看到红色" },
    { id: "demo", start: 0.75, end: 1.5, title: "再看到蓝色" },
  ] };
  const config = { schemaVersion: 1, width: 320, height: 180, fps: 24, audio: "voice.wav", frames: { intro: "red.png", demo: "blue.png" } };
  const put = () => { writeFileSync(join(root, "storyboard.json"), JSON.stringify(story)); writeFileSync(join(root, "animatic.json"), JSON.stringify(config)); };
  put(); return { root, story, config, put };
}
function pixel(file, time) {
  return mediaCommand("ffmpeg", ["-v", "error", "-ss", String(time), "-i", file, "-vf", "format=rgb24,crop=1:1:160:100", "-frames:v", "1", "-f", "rawvideo", "-"], { encoding: null }).stdout;
}
test("animatic follows storyboard timing, actually switches frames, embeds captions and is rejected as final", () => {
  const f = fixture(), report = renderAnimatic(f.root), file = join(f.root, "preview/animatic.mp4");
  assert.equal(report.frames, 36); assert.equal(report.seconds, 1.5);
  assert.equal(report.fullRender, false); assert.equal(report.fullTimeline, true);
  assert.equal(report.videoSha256, hashFile(file));
  assert.equal(report.humanReview.status, "pending");
  const a = pixel(file, 0.3), b = pixel(file, 1.1);
  assert.ok(a[0] > 200 && a[2] < 30); assert.ok(b[2] > 200 && b[0] < 30);
  const meta = probeMedia(file);
  assert.ok(meta.streams.some((s) => s.codec_type === "audio"));
  assert.ok(meta.streams.some((s) => s.codec_type === "subtitle"));
  assert.match(readFileSync(join(f.root, "preview/animatic.mp4.srt"), "utf8"), /00:00:00,750/);
  const qc = checkMedia(f.root, "preview/animatic.mp4");
  assert.equal(qc.ok, false); assert.ok(qc.errors.includes("partial render cannot be accepted as a full video"));
  assert.equal(checkMedia(f.root, "preview/animatic.mp4", { allowPreview: true }).ok, true);
});
test("animatic rejects missing/unknown references, overlaps and accidental audio truncation", () => {
  const f = fixture(); delete f.config.frames.demo; f.put();
  assert.throws(() => renderAnimatic(f.root), /reference frame missing/);
  f.config.allowPlaceholders = true; f.put(); const preview = renderAnimatic(f.root);
  assert.ok(preview.warnings.some((s) => /placeholder/.test(s)));
  f.config.frames.unknown = "blue.png"; f.put(); assert.throws(() => renderAnimatic(f.root), /unknown scene/);
  delete f.config.frames.unknown; f.story.scenes[1].start = 0.5; f.put();
  assert.throws(() => renderAnimatic(f.root), /gap, overlap/);
  f.story.scenes[1].start = 0.75; f.story.scenes[1].end = 0.9; f.put();
  assert.throws(() => renderAnimatic(f.root), /Audio exceeds/);
  f.story.scenes[1].end = 1.5; f.config.frames.intro = "../red.png"; f.put();
  assert.throws(() => renderAnimatic(f.root), /Unsafe/);
});
