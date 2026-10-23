import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname, isAbsolute, relative } from "node:path";
import { pathToFileURL } from "node:url";
export function validatePlan(plan, project, { requireReviewed = false } = {}) {
  const errors = [],
    warnings = [];
  const need = (ok, message) => {
    if (!ok) errors.push(message);
  };
  need(plan?.schemaVersion === 1, "schemaVersion must be 1");
  for (const key of ["audience", "goal", "profile"])
    need(
      typeof plan?.[key] === "string" && plan[key].trim(),
      `${key} required`,
    );
  need(
    ["demo", "product", "data", "story", "tutorial"].includes(plan?.profile),
    "unknown profile",
  );
  const claims = new Map();
  for (const claim of plan?.claims ?? []) {
    need(
      typeof claim.id === "string" && !claims.has(claim.id),
      "duplicate/missing claim id",
    );
    claims.set(claim.id, claim);
    need(
      typeof claim.text === "string" && claim.text.trim(),
      `claim ${claim.id} missing text`,
    );
    need(
      ["verified", "needs-check"].includes(claim.status),
      `claim ${claim.id} missing verification status`,
    );
    if (claim.status === "verified") {
      const source = claim.source ?? {};
      need(
        Boolean(source.path || source.url) &&
          typeof source.locator === "string" &&
          source.locator.trim() &&
          /^\d{4}-\d{2}-\d{2}$/.test(source.checkedAt ?? ""),
        `claim ${claim.id} needs source, locator and checkedAt`,
      );
      if (source.url) {
        try {
          need(
            ["https:", "http:"].includes(new URL(source.url).protocol),
            "invalid source URL",
          );
        } catch {
          need(false, "invalid source URL");
        }
      }
      if (source.path) {
        const path = resolve(project, source.path),
          rel = relative(project, path);
        need(
          !isAbsolute(source.path) && !rel.startsWith("..") && existsSync(path),
          `claim ${claim.id} source file missing/outside project`,
        );
      }
    }
  }
  need(
    Array.isArray(plan?.scenes) && plan.scenes.length > 0,
    "scenes required",
  );
  const ids = new Set();
  let end = 0;
  for (const scene of plan?.scenes ?? []) {
    need(
      typeof scene.id === "string" && !ids.has(scene.id),
      "duplicate/missing scene id",
    );
    ids.add(scene.id);
    need(
      Number.isFinite(scene.start) &&
        Number.isFinite(scene.end) &&
        scene.end > scene.start &&
        Math.abs(scene.start - end) < 0.001,
      `scene ${scene.id} has gap/overlap/invalid duration`,
    );
    end = scene.end;
    for (const key of ["title", "purpose", "subject"])
      need(
        typeof scene[key] === "string" && scene[key].trim(),
        `scene ${scene.id} missing ${key}`,
      );
    need(Array.isArray(scene.claimIds), `scene ${scene.id} needs claimIds`);
    for (const id of scene.claimIds ?? [])
      need(
        claims.get(id)?.status === "verified",
        `scene ${scene.id} cites unverified/missing claim ${id}`,
      );
    if (plan.profile !== "demo" && !scene.claimIds?.length)
      warnings.push(
        `scene ${scene.id}: no factual claim linked; review whether this scene asserts facts`,
      );
    if (scene.asset?.kind === "image" && !scene.asset.brief)
      need(false, `scene ${scene.id} image needs art brief`);
  }
  if (plan?.review?.status !== "accepted") {
    warnings.push("storyboard awaits human review");
    if (requireReviewed) need(false, "human storyboard review required");
  }
  return {
    ok: errors.length === 0,
    errors,
    warnings,
    seconds: end,
    scenes: ids.size,
  };
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  try {
    const project = resolve(process.argv[2] ?? ".");
    const report = validatePlan(
      JSON.parse(readFileSync(resolve(project, "storyboard.json"), "utf8")),
      project,
      { requireReviewed: process.argv.includes("--require-reviewed") },
    );
    console.log(JSON.stringify(report, null, 2));
    process.exitCode = report.ok ? 0 : 1;
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
