import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { hashFile, readJson, writeJson, safePath } from "../../../scripts/lib/files.mjs";
import { mediaInput, probeMedia } from "../../../scripts/lib/media.mjs";

function ranges(value, duration, label) {
  if (!Array.isArray(value)) throw new Error(`${label} must be ranges actually inspected`);
  const sorted = value.map((r) => {
    if (!Number.isFinite(r.start) || !Number.isFinite(r.end) || r.start < 0 || r.end <= r.start || r.end > duration + 0.02)
      throw new Error(`${label}: invalid inspection interval`);
    return { start: r.start, end: Math.min(r.end, duration) };
  }).sort((a, b) => a.start - b.start);
  const merged = [];
  for (const r of sorted) {
    const previous = merged.at(-1);
    if (previous && r.start <= previous.end + 0.001) previous.end = Math.max(previous.end, r.end);
    else merged.push({ ...r });
  }
  return merged;
}
const covers = (ranges, start, end) => ranges.some((r) => r.start <= start + 0.001 && r.end >= end - 0.001);

export function recordInspection(project, { input = "qa/inspection-input.json", out = "qa/editorial-review.json" } = {}) {
  project = resolve(project);
  const source = mediaInput(project, input), data = readJson(source);
  if (data.schemaVersion !== 1 || typeof data.reviewer !== "string" || !data.reviewer.trim() || !Array.isArray(data.checks) || !data.checks.length)
    throw new Error("Inspection needs schemaVersion=1, reviewer and checks");
  if (data.status === "accepted" || data.accepted || data.humanReview?.status === "accepted") throw new Error("Inspection cannot generate human acceptance");
  const video = mediaInput(project, data.video), hash = hashFile(video), meta = probeMedia(video);
  const stream = meta.streams.find((s) => s.codec_type === "video"), duration = Number(stream?.duration ?? meta.duration);
  if (!stream || !Number.isFinite(duration) || duration <= 0) throw new Error("Inspection needs a finite video");
  if (data.videoSha256 !== hash) throw new Error("Inspection video hash differs; inspect the actual current version");
  const visual = ranges(data.inspection?.visual ?? [], duration, "visual"), audio = ranges(data.inspection?.audio ?? [], duration, "audio");
  if (audio.length && !meta.streams.some((s) => s.codec_type === "audio")) throw new Error("Cannot claim listening when video has no audio");
  const checks = data.checks.map((check) => {
    if (!["visual", "audio", "sync", "story", "facts"].includes(check.kind) || !["pass", "issue", "unreviewed"].includes(check.status) || typeof check.note !== "string" || !check.note.trim())
      throw new Error("Each check needs kind, status and an explicit observation or unreviewed reason");
    if (check.status !== "unreviewed") {
      ranges([{ start: check.start, end: check.end }], duration, "check");
      if (check.kind !== "audio" && !covers(visual, check.start, check.end)) throw new Error("Visual observation exceeds declared viewing coverage");
      if (["audio", "sync"].includes(check.kind) && !covers(audio, check.start, check.end)) throw new Error("Audio observation exceeds declared listening coverage");
      if (check.kind === "facts" && (!Array.isArray(check.evidence) || !check.evidence.length)) throw new Error("Factual observations need source evidence");
    }
    for (const file of check.evidence ?? []) mediaInput(project, file);
    if (check.fix) {
      mediaInput(project, check.fix.path);
      if (typeof check.fix.suggestion !== "string" || !check.fix.suggestion.trim()) throw new Error("Fix needs a concrete suggestion");
    }
    return check;
  });
  const output = safePath(project, out);
  const protectedPaths = [video, source, ...checks.flatMap((c) => [...(c.evidence ?? []), ...(c.fix ? [c.fix.path] : [])]).map((p) => safePath(project, p))];
  if (protectedPaths.some((p) => p.toLowerCase() === output.toLowerCase())) throw new Error("Inspection output would overwrite source evidence");
  const unreviewedKinds = ["visual", "audio", "sync", "story", "facts"].filter((kind) => !checks.some((c) => c.kind === kind && c.status !== "unreviewed"));
  const report = { schemaVersion: 1, ok: true, status: checks.some((c) => c.status === "issue") ? "issues-recorded-needs-human-review" : "observations-recorded-needs-human-review",
    video: data.video, videoSha256: hash, duration, reviewer: data.reviewer,
    inspection: { visual, audio }, coverage: { visualFullTimeline: covers(visual, 0, duration), audioFullTimeline: covers(audio, 0, duration) },
    checks, unreviewedKinds, humanReview: { status: "pending" },
    meaning: "Declared observations and coverage, not independent proof of watching/listening, factual correctness or human acceptance" };
  if (hashFile(video) !== hash) throw new Error("Video changed while recording inspection");
  writeJson(output, report); return report;
}

export function verifyInspection(project, path) {
  project = resolve(project);
  const report = readJson(mediaInput(project, path));
  if (report.schemaVersion !== 1 || typeof report.videoSha256 !== "string") throw new Error("Invalid inspection report");
  const matches = hashFile(mediaInput(project, report.video)) === report.videoSha256;
  return { ok: matches, status: matches ? "same-media-version" : "stale-review", humanReview: { status: "pending" },
    meaning: "Version comparison only; recorded observations remain the reviewer's responsibility" };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const argv = process.argv.slice(2), arg = (key, fallback) => {
    const i = argv.indexOf(`--${key}`); return i < 0 ? fallback : argv[i + 1];
  };
  try {
    const result = arg("verify") ? verifyInspection(arg("project", "."), arg("verify")) : recordInspection(arg("project", "."), { input: arg("input", "qa/inspection-input.json"), out: arg("out", "qa/editorial-review.json") });
    console.log(JSON.stringify(result, null, 2)); process.exitCode = result.ok ? 0 : 1;
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
