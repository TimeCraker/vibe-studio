import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { validatePlan } from "../skills/content-director/scripts/validate-plan.mjs";
import { derive } from "../skills/content-repurpose/scripts/derive.mjs";
import { reviewMetrics } from "../skills/content-review/scripts/report.mjs";
import {
  checkSubtitles,
  checkMedia,
} from "../skills/media-qc/scripts/check.mjs";
test("director rejects missing evidence and overlapping scenes; human review stays separate", () => {
  const project = mkdtempSync(join(tmpdir(), "vibe-director-"));
  const plan = {
    schemaVersion: 1,
    audience: "用户",
    goal: "理解功能",
    profile: "product",
    claims: [
      {
        id: "c1",
        text: "可复跑",
        status: "verified",
        source: {
          path: "missing.md",
          locator: "第1段",
          checkedAt: "2026-10-23",
        },
      },
    ],
    scenes: [
      {
        id: "s1",
        start: 0,
        end: 2,
        title: "测试",
        subject: "画面",
        purpose: "解释",
        claimIds: ["c1"],
      },
    ],
  };
  assert.equal(validatePlan(plan, project).ok, false);
  writeFileSync(join(project, "missing.md"), "实际来源");
  assert.equal(validatePlan(plan, project).ok, true);
  assert.equal(
    validatePlan(plan, project, { requireReviewed: true }).ok,
    false,
  );
  plan.scenes.push({ ...plan.scenes[0], id: "s2", start: 1, end: 3 });
  assert.equal(validatePlan(plan, project).ok, false);
});
test("platform derivation actually selects and rebases scenes; form paths point to each output", () => {
  const project = mkdtempSync(join(tmpdir(), "vibe-derive-"));
  writeFileSync(
    join(project, "storyboard.json"),
    JSON.stringify({
      schemaVersion: 1,
      claims: [],
      scenes: [
        {
          id: "a",
          start: 0,
          end: 5,
          title: "A",
          shot: "clip",
          caption: "原稿A",
        },
        {
          id: "b",
          start: 5,
          end: 8,
          title: "B",
          shot: "clip",
          sourceStart: 5,
          caption: "原稿B",
        },
      ],
    }),
  );
  writeFileSync(
    join(project, "variants.json"),
    JSON.stringify({
      schemaVersion: 1,
      platforms: {
        douyin: {
          title: "短版",
          description: ["实际内容"],
          sceneIds: ["b"],
          tags: ["演示"],
          format: { width: 720, height: 1280, fps: 30 },
          video: "render/douyin.mp4",
          cover: "render/cover.png",
        },
      },
    }),
  );
  const result = derive(project);
  assert.equal(result.variants[0].seconds, 3);
  const timeline = JSON.parse(
    readFileSync(join(project, "exports/douyin/timeline.json")),
  );
  assert.equal(timeline.units[0].start, 0);
  assert.equal(timeline.units[0].sourceStart, 5);
  assert.equal(timeline.cues[0].text, "原稿B");
  const plan = JSON.parse(readFileSync(join(project, "publish-plan.json")));
  assert.equal(plan.platforms.douyin.video, "render/douyin.mp4");
});
test("review keeps unknown metrics null and never creates data for an empty series", () => {
  const project = mkdtempSync(join(tmpdir(), "vibe-review-"));
  writeFileSync(join(project, "raw.csv"), "原始导出");
  assert.equal(
    reviewMetrics({ schemaVersion: 1, records: [] }, project).status,
    "no-published-data",
  );
  const r = {
    contentId: "one",
    platform: "bili",
    publishedAt: "2026-10-20T00:00:00+08:00",
    observedAt: "2026-10-21T00:00:00+08:00",
    metrics: { views: 100, completions: 25 },
    production: { minutes: 50 },
    source: { path: "raw.csv", definition: "平台导出" },
  };
  const row = reviewMetrics({ schemaVersion: 1, records: [r] }, project)
    .records[0];
  assert.equal(row.completionRate, 0.25);
  assert.equal(row.clickRate, null);
  assert.equal(row.viewsPerProductionMinute, 2);
  assert.equal(row.windowHours, 24);
  r.metrics.views = 0;
  assert.equal(
    reviewMetrics({ schemaVersion: 1, records: [r] }, project).records[0]
      .completionRate,
    null,
  );
});
test("subtitle checks reject out-of-range windows and report reading speed", () => {
  assert.equal(
    checkSubtitles("1\n00:00:00,000 --> 00:00:02,000\n字幕", 1).errors.length,
    1,
  );
  assert.equal(
    checkSubtitles(
      "1\n00:00:00,000 --> 00:00:01,000\n这是一段很长的字幕内容需要让观众有时间阅读",
      1,
    ).warnings.length,
    1,
  );
});
test("media QC decodes fixtures, rejects full black and missing required audio", () => {
  const project = mkdtempSync(join(tmpdir(), "vibe-qc-"));
  const video = join(project, "black.mp4");
  const result = spawnSync(
    "ffmpeg",
    [
      "-hide_banner",
      "-loglevel",
      "error",
      "-f",
      "lavfi",
      "-i",
      "color=black:s=320x180:r=24:d=1",
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-y",
      video,
    ],
    { encoding: "utf8" },
  );
  assert.equal(result.status, 0, result.stderr);
  const report = checkMedia(project, "black.mp4", { requireAudio: true });
  assert.equal(report.ok, false);
  assert.ok(report.errors.includes("required audio missing"));
  assert.ok(report.errors.includes("video is effectively all black"));
  assert.equal(report.humanReview.status, "pending");
});
