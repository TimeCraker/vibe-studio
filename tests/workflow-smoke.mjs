// Explicit end-to-end fixture, no publishing or paid APIs. Requires Chrome/FFmpeg.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { archiveProject, restoreArchive } from "../scripts/lib/archive.mjs";
import { runJob } from "../scripts/lib/runner.mjs";

const repo = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const base = mkdtempSync(join(tmpdir(), "vibe-workflow-"));
const project = join(base, "project");
function run(file, args = [], timeout = 240000) {
  return execFileSync(process.execPath, [resolve(repo, file), ...args], {
    cwd: repo,
    encoding: "utf8",
    timeout,
    maxBuffer: 8 * 1024 * 1024,
  });
}
const json = (path) => JSON.parse(readFileSync(path, "utf8"));
run("scripts/studio.mjs", [
  "init",
  "--id",
  "workflow-fixture",
  "--project",
  project,
]);
await runJob(project, repo, { quiet: true });
const cached = await runJob(project, repo, { quiet: true });
assert.deepEqual(cached.cached, [
  "capture",
  "preview",
  "render",
  "covers",
  "qc",
]);
assert.equal(
  json(join(project, "qa/media-report.json")).humanReview.status,
  "pending",
);
const storyboard = json(join(project, "storyboard.json"));
storyboard.scenes[0].caption = "测试素材按帧定位";
writeFileSync(join(project, "storyboard.json"), JSON.stringify(storyboard));
run("scripts/studio.mjs", ["derive", "--project", project]);
for (const platform of ["bili", "douyin", "xhs"]) {
  run("skills/web-capture/templates/render-director.mjs", [
    "--project",
    project,
    "--variant",
    platform,
    "--out",
    `render/${platform}.mp4`,
  ]);
  const report = JSON.parse(
    run("scripts/studio.mjs", [
      "qc",
      "--project",
      project,
      "--video",
      `render/${platform}.mp4`,
      "--config",
      `exports/${platform}/qc.json`,
      "--srt",
      `exports/${platform}/captions.srt`,
      "--out",
      `qa/${platform}.json`,
    ]),
  );
  assert.equal(report.ok, true);
  assert.equal(report.duration, 6);
  assert.equal(report.subtitles.count, 1);
  assert.equal(report.width, platform === "bili" ? 1280 : 720);
}
run("skills/web-capture/templates/render-director.mjs", [
  "--project",
  project,
  "--seconds",
  ".2",
  "--dsf",
  "2",
  "--out",
  "render/supersample.mp4",
]);
const supersample = JSON.parse(
  execFileSync(
    "ffprobe",
    [
      "-v",
      "error",
      "-show_streams",
      "-of",
      "json",
      join(project, "render/supersample.mp4"),
    ],
    { encoding: "utf8" },
  ),
);
assert.equal(supersample.streams[0].width, 1280);
execFileSync(
  "python",
  [resolve(repo, "scripts/make_music.py"), "--project", project],
  { cwd: repo, encoding: "utf8", timeout: 120000 },
);
run("skills/web-capture/templates/render-director.mjs", [
  "--project",
  project,
  "--audio",
  "audio/music.wav",
  "--out",
  "render/with-audio.mp4",
]);
const audio = JSON.parse(
  run("scripts/studio.mjs", [
    "qc",
    "--project",
    project,
    "--video",
    "render/with-audio.mp4",
    "--require-audio",
    "--out",
    "qa/audio.json",
  ]),
);
assert.equal(audio.audio, true);
assert.ok(Number.isFinite(Number(audio.loudness.integratedLufs)));
const dry = JSON.parse(
  run("skills/publish/templates/run.mjs", ["--project", project, "--dry"]),
);
assert.equal(dry.dry, true);
assert.equal(dry.jobs.length, 3);
const review = JSON.parse(
  run("scripts/studio.mjs", ["review", "--project", project]),
);
assert.equal(review.status, "no-published-data");
const deliverables = json(join(project, "deliverables.json")).files;
deliverables.push("render/bili.mp4", "render/douyin.mp4", "render/xhs.mp4");
const archive = archiveProject(
  project,
  join(base, "product"),
  { id: "workflow-fixture", fixture: true },
  { deliverables },
);
restoreArchive(archive.manifestPath, join(base, "restored"));
await runJob(join(base, "restored"), repo, { quiet: true });
assert.equal(json(join(base, "restored/qa/media-report.json")).ok, true);
const summary = {
  ok: true,
  evidence: base,
  cachedSteps: cached.cached,
  variants: 3,
  audioMeasured: true,
  archiveRestoredAndRerendered: true,
  published: false,
  humanReview: "pending",
};
mkdirSync(join(repo, ".cache/verification"), { recursive: true });
writeFileSync(
  join(repo, ".cache/verification/workflow.json"),
  JSON.stringify(summary, null, 2),
);
console.log(JSON.stringify(summary, null, 2));
