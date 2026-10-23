import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { recordInspection, verifyInspection } from "../skills/media-qc/scripts/inspect.mjs";
import { mediaCommand } from "../scripts/lib/media.mjs";
import { hashFile } from "../scripts/lib/files.mjs";

test("editorial observations bind actual media, enforce coverage and never synthesize acceptance", () => {
  const root = mkdtempSync(join(tmpdir(), "vibe-inspect-")), video = join(root, "video.mp4");
  mediaCommand("ffmpeg", ["-v", "error", "-f", "lavfi", "-i", "color=red:s=320x180:r=24:d=2", "-c:v", "libx264", "-y", video]);
  writeFileSync(join(root, "scene.html"), "scene source");
  const input = { schemaVersion: 1, video: "video.mp4", videoSha256: hashFile(video), reviewer: "test-observer",
    inspection: { visual: [{ start: 0, end: 1 }], audio: [] },
    checks: [{ kind: "visual", status: "issue", start: 0.2, end: 0.7, note: "Observed placement issue",
      fix: { path: "scene.html", suggestion: "Move the title into the visible area" } },
    { kind: "audio", status: "unreviewed", note: "No audio in source" }] };
  const put = () => writeFileSync(join(root, "inspection.json"), JSON.stringify(input));
  put(); const report = recordInspection(root, { input: "inspection.json" });
  assert.equal(report.humanReview.status, "pending");
  assert.equal(report.coverage.visualFullTimeline, false);
  assert.ok(report.unreviewedKinds.includes("audio"));
  assert.equal(verifyInspection(root, "qa/editorial-review.json").ok, true);
  input.checks[0].end = 1.8; put(); assert.throws(() => recordInspection(root, { input: "inspection.json" }), /coverage/);
  input.checks[0].end = 0.7; input.checks[0].kind = "sync"; put();
  assert.throws(() => recordInspection(root, { input: "inspection.json" }), /listening coverage/);
  input.checks[0].kind = "visual"; input.status = "accepted"; put();
  assert.throws(() => recordInspection(root, { input: "inspection.json" }), /human acceptance/);
  delete input.status; input.videoSha256 = "old"; put();
  assert.throws(() => recordInspection(root, { input: "inspection.json" }), /hash differs/);
  mediaCommand("ffmpeg", ["-v", "error", "-f", "lavfi", "-i", "color=blue:s=320x180:r=24:d=2", "-c:v", "libx264", "-y", video]);
  assert.equal(verifyInspection(root, "qa/editorial-review.json").status, "stale-review");
});
