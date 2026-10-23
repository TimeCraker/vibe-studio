import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { publishJobs } from "../skills/publish/templates/plan.mjs";
import { readFileSync } from "node:fs";
import vm from "node:vm";

test("historical auto-publication fails before loading any browser dependency", () => {
  for (const name of ["bili-publish.js", "bili-publish2.js", "dy-fill.js"]) {
    const source = readFileSync(`products/hsr-currency-war/recipe/pw/${name}`, "utf8");
    assert.throws(() => vm.runInNewContext(source, { require() { throw new Error("browser dependency loaded"); } }, { timeout: 1000 }), /Archived auto-publish is disabled/);
  }
});
test("publisher maps per-platform video, cover, custom spec and topic aliases", () => {
  const dir = mkdtempSync(join(tmpdir(), "vibe-publish-"));
  for (const name of ["wide.mp4", "tall.mp4", "cover.png"])
    writeFileSync(join(dir, name), "fixture");
  writeFileSync(
    join(dir, "custom.json"),
    JSON.stringify({ title: "标题", description: ["正文"], tags: ["标签"] }),
  );
  const jobs = publishJobs(
    {
      video: "wide.mp4",
      platforms: {
        bili: { spec: "custom.json" },
        xhs: {
          video: "tall.mp4",
          cover: "cover.png",
          spec: "custom.json",
          names: "A,B",
        },
      },
    },
    dir,
  );
  assert.equal(jobs[0].file, "pw/bili-fill.js");
  assert.equal(jobs[1].video, join(dir, "tall.mp4"));
  assert.ok(jobs[1].args.includes("--topics"));
  assert.ok(jobs[1].args.includes("--cover"));
  assert.equal(jobs[1].manualPending.length, 1);
  assert.throws(
    () =>
      publishJobs(
        { video: "wide.mp4", platforms: { bili: { spec: "missing.json" } } },
        dir,
      ),
    /Missing/,
  );
  const result = spawnSync(
    process.execPath,
    [resolve("skills/publish/templates/run.mjs"), "--project", dir, "--dry"],
    { encoding: "utf8" },
  );
  assert.notEqual(result.status, 0);
  writeFileSync(
    join(dir, "publish-plan.json"),
    JSON.stringify({
      video: "wide.mp4",
      platforms: { bili: { spec: "custom.json" } },
    }),
  );
  const dry = spawnSync(
    process.execPath,
    [resolve("skills/publish/templates/run.mjs"), "--project", dir, "--dry"],
    { encoding: "utf8" },
  );
  assert.equal(dry.status, 0, dry.stderr);
  assert.match(dry.stdout, /dry/);
  for (const platform of ["bili", "douyin", "xhs"]) {
    const direct = spawnSync(
      process.execPath,
      [
        resolve(`skills/publish/templates/pw/${platform}-fill.js`),
        "--project",
        dir,
        "--spec",
        "custom.json",
        "--video",
        join(dir, "wide.mp4"),
        "--dry",
      ],
      { encoding: "utf8" },
    );
    assert.equal(direct.status, 0, direct.stderr);
    assert.match(direct.stdout, /no browser/);
  }
});
