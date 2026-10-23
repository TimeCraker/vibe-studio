import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  archiveProject,
  restoreArchive,
  verifyArchive,
} from "../scripts/lib/archive.mjs";

test("archive preserves sources and binary inputs, excludes caches, restores exact bytes", () => {
  const base = mkdtempSync(join(tmpdir(), "vibe-archive-test-"));
  const project = join(base, "project");
  mkdirSync(join(project, "frames"), { recursive: true });
  writeFileSync(join(project, "script.json"), '{"title":"中文"}');
  writeFileSync(join(project, "voice.wav"), Buffer.from([0, 255, 23, 42]));
  writeFileSync(join(project, "frames", "f.png"), "cache");
  writeFileSync(join(project, ".env.local"), "not copied");
  const result = archiveProject(project, join(base, "product"));
  assert.equal(result.sourceFiles, 1);
  assert.equal(result.mediaFiles, 1);
  restoreArchive(result.manifestPath, join(base, "restored"));
  assert.deepEqual(
    readFileSync(join(base, "restored", "voice.wav")),
    readFileSync(join(project, "voice.wav")),
  );
  writeFileSync(join(base, "product", "media", "voice.wav"), "changed");
  assert.equal(verifyArchive(result.manifestPath).ok, false);
  assert.throws(
    () => restoreArchive(result.manifestPath, join(base, "broken")),
    /Cannot restore/,
  );
  assert.equal(
    verifyArchive(result.manifestPath, { sourceOnly: true }).ok,
    true,
  );
});
test("restore rejects traversal and occupied destinations", () => {
  const base = mkdtempSync(join(tmpdir(), "vibe-archive-boundary-"));
  mkdirSync(join(base, "src"));
  writeFileSync(join(base, "src", "a.js"), "hello");
  const { manifestPath } = archiveProject(
    join(base, "src"),
    join(base, "product"),
  );
  assert.throws(() => restoreArchive(manifestPath, join(base, "src")), /empty/);
  const manifest = JSON.parse(readFileSync(manifestPath));
  manifest.files[0].path = "../outside.js";
  writeFileSync(manifestPath, JSON.stringify(manifest));
  assert.throws(() => verifyArchive(manifestPath), /Unsafe/);
});
test("declared final video survives cache exclusion and missing final output blocks delivery", () => {
  const base = mkdtempSync(join(tmpdir(), "vibe-delivery-"));
  const project = join(base, "project");
  mkdirSync(join(project, "render"), { recursive: true });
  writeFileSync(join(project, "source.js"), "source");
  writeFileSync(join(project, "render/final.mp4"), "final bytes");
  assert.throws(
    () =>
      archiveProject(
        project,
        join(base, "missing"),
        {},
        { deliverables: ["render/absent.mp4"] },
      ),
    /Missing deliverable/,
  );
  const result = archiveProject(
    project,
    join(base, "product"),
    {},
    { deliverables: ["render/final.mp4"] },
  );
  restoreArchive(result.manifestPath, join(base, "restored"));
  assert.equal(
    readFileSync(join(base, "restored/render/final.mp4"), "utf8"),
    "final bytes",
  );
});
