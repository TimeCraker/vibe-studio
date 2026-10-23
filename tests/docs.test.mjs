import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { git, Snapshot } from "../scripts/lib/docs-source.mjs";
import { generatedPlan, syncGenerated } from "../scripts/lib/docs-generate.mjs";
import { checkDocs, impact } from "../scripts/lib/docs-analyze.mjs";
import { discoverRepos, indexWorkspace, searchWorkspace } from "../scripts/lib/docs-index.mjs";

function fixture(parent = tmpdir()) {
  const root = mkdtempSync(join(parent, "vibe-docs-"));
  git(root, ["init", "-q"]);
  git(root, ["config", "user.name", "Fixture"]);
  git(root, ["config", "user.email", "fixture@example.invalid"]);
  git(root, ["config", "core.autocrlf", "false"]);
  const put = (path, text) => { mkdirSync(dirname(join(root, path)), { recursive: true }); writeFileSync(join(root, path), text); };
  return { root, put, commit: () => { git(root, ["add", "."]); git(root, ["commit", "-qm", "fixture"]); } };
}

test("generated facts preserve surrounding CRLF prose, are idempotent and fail atomically", () => {
  const f = fixture();
  f.put("README.md", "人工说明\r\n<!-- docs:auto skills -->\r\nold\r\n<!-- /docs:auto -->\r\n最后一行  \r\n");
  f.put("skills/alpha/SKILL.md", "---\nname: alpha\ndescription: 中文能力说明\n---\n");
  const before = readFileSync(join(f.root, "README.md"), "utf8");
  assert.deepEqual(syncGenerated(new Snapshot(f.root)).updated, ["README.md"]);
  const after = readFileSync(join(f.root, "README.md"), "utf8");
  assert.ok(after.startsWith("人工说明\r\n"));
  assert.ok(after.endsWith("最后一行  \r\n"));
  assert.match(after, /中文能力说明/);
  assert.deepEqual(syncGenerated(new Snapshot(f.root)).updated, []);
  f.put("README.md", before + "<!-- docs:auto unknown -->\r\nx\r\n<!-- /docs:auto -->\r\n");
  const malformed = readFileSync(join(f.root, "README.md"), "utf8");
  assert.throws(() => syncGenerated(new Snapshot(f.root)), /Unknown generated block/);
  assert.equal(readFileSync(join(f.root, "README.md"), "utf8"), malformed);
});

test("generation checks the staged snapshot and never masks a partially staged source edit", () => {
  const f = fixture();
  f.put("README.md", "<!-- docs:auto skills -->\nx\n<!-- /docs:auto -->\n");
  f.put("skills/a/SKILL.md", "---\nname: a\ndescription: original\n---\n");
  syncGenerated(new Snapshot(f.root)); f.commit();
  f.put("skills/a/SKILL.md", "---\nname: a\ndescription: staged-value\n---\n");
  git(f.root, ["add", "skills/a/SKILL.md"]);
  f.put("skills/a/SKILL.md", "---\nname: a\ndescription: worktree-value\n---\n");
  syncGenerated(new Snapshot(f.root));
  git(f.root, ["add", "README.md"]);
  const plans = generatedPlan(new Snapshot(f.root, { staged: true }));
  assert.equal(plans.length, 1);
  assert.match(plans[0].expected, /staged-value/);
  assert.doesNotMatch(plans[0].expected, /worktree-value/);
  assert.throws(() => syncGenerated(new Snapshot(f.root, { staged: true })), /never modified automatically/);
});

export { fixture };

test("impact locates command and directory consumers after deletes and renames", () => {
  const f = fixture();
  f.put("scripts/old.mjs", "old");
  f.put("docs/guide.md", "Run `node scripts/old.mjs`\nSource: `src/feature/`\n");
  f.put("src/feature/a.ts", "a"); f.commit();
  git(f.root, ["mv", "scripts/old.mjs", "scripts/new.mjs"]);
  f.put("src/feature/a.ts", "changed");
  const report = impact(new Snapshot(f.root));
  const guide = report.candidates.find((r) => r.doc === "docs/guide.md");
  assert.ok(guide.reasons.some((r) => r.changedSources.includes("scripts/old.mjs")));
  assert.ok(guide.reasons.some((r) => r.changedSources.includes("src/feature/a.ts")));
  assert.ok(report.unmapped.includes("scripts/new.mjs"));
});

test("guard catches newly broken links and removed targets, preserves staged boundaries and tolerates old debt", () => {
  const f = fixture();
  f.put("README.md", "[old](docs/missing.md)\n[good](docs/good.md)\n");
  f.put("docs/good.md", "good"); f.commit();
  assert.equal(checkDocs(new Snapshot(f.root), { newOnly: true }).ok, true);
  f.put("README.md", "[old](docs/missing.md)\n[good](docs/good.md)\n[new](docs/unstaged.md)\n");
  git(f.root, ["add", "README.md"]);
  f.put("docs/unstaged.md", "exists only in worktree");
  assert.equal(checkDocs(new Snapshot(f.root), { newOnly: true }).ok, true);
  const staged = checkDocs(new Snapshot(f.root, { staged: true }), { newOnly: true });
  assert.deepEqual(staged.brokenLinks.map((r) => r.path), ["docs/unstaged.md"]);
  git(f.root, ["rm", "docs/good.md"]);
  assert.ok(checkDocs(new Snapshot(f.root, { staged: true }), { newOnly: true }).brokenLinks.some((r) => r.path === "docs/good.md"));
});

test("workspace search refreshes edited source docs, separates history and excludes secrets and index symlinks", () => {
  const workspace = mkdtempSync(join(tmpdir(), "vibe-workspace-"));
  const cacheDir = join(workspace, ".cache");
  const f = fixture(workspace), other = fixture(workspace);
  f.put("README.md", "# 网页采集\nUse `node scripts/capture.mjs`.\n");
  f.put("scripts/capture.mjs", "original");
  f.put("docs/history.md", "> 状态：已存档\n# 网页采集旧版\nlegacyneedle\n");
  f.put("docs/credentials.md", "supersecretneedle");
  other.put("README.md", "# 图片转换\nimage conversion\n"); f.commit(); other.commit();
  const blob = git(f.root, ["hash-object", "-w", "--stdin"], { input: "../outside-private.md" }).trim();
  git(f.root, ["update-index", "--add", "--cacheinfo", `120000,${blob},docs/link.md`]);
  assert.equal(new Snapshot(f.root, { staged: true }).read("docs/link.md"), null);
  assert.equal(discoverRepos(workspace).length, 2);
  assert.equal(searchWorkspace(workspace, "网页采集", { cacheDir }).results[0].path, "README.md");
  assert.equal(searchWorkspace(workspace, "legacyneedle", { cacheDir }).results.length, 0);
  assert.equal(searchWorkspace(workspace, "legacyneedle", { cacheDir, history: true }).results[0].kind, "historical");
  f.put("docs/new.md", "# 新知识\nuniquerefreshneedle\n");
  assert.equal(searchWorkspace(workspace, "uniquerefreshneedle", { cacheDir }).results[0].path, "docs/new.md");
  f.put("scripts/capture.mjs", "changed");
  assert.equal(searchWorkspace(workspace, "网页采集", { cacheDir }).results[0].sourceState.status, "needs-review");
  const indexed = indexWorkspace(workspace, { cacheDir });
  const cache = readFileSync(indexed.cache, "utf8");
  assert.doesNotMatch(cache, /supersecretneedle|outside-private/);
  assert.ok(!indexed.data.entries.some((e) => e.path.endsWith("credentials.md")));
});
