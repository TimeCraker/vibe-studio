import test from "node:test";
import assert from "node:assert/strict";
import { chmodSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, dirname, join, resolve } from "node:path";
import { git, Snapshot } from "../scripts/lib/docs-source.mjs";
import { generatedPlan, syncGenerated } from "../scripts/lib/docs-generate.mjs";
import { checkDocs, impact } from "../scripts/lib/docs-analyze.mjs";
import { discoverRepos, indexWorkspace, searchWorkspace } from "../scripts/lib/docs-index.mjs";
import { installHook } from "../scripts/lib/docs-hooks.mjs";

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
  writeFileSync(join(workspace, "AGENTS.md"), "# Workspace\nrootentryneedle constructor\n");
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
  assert.equal(searchWorkspace(workspace, "rootentryneedle", { cacheDir }).results[0].head, undefined);
  assert.equal(searchWorkspace(workspace, "constructor", { cacheDir }).results[0].path, "AGENTS.md");
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

test("installed hook actually blocks new broken links without changing the index and uninstalls only owned hooks", () => {
  const f = fixture();
  f.put("README.md", "# Fixture\n"); f.commit();
  const tool = resolve("scripts/docs.mjs");
  assert.equal(installHook(f.root, tool).status, "installed");
  assert.equal(installHook(f.root, tool).status, "unchanged");
  f.put("docs/new.md", "[bad](missing.md)\n"); git(f.root, ["add", "."]);
  const before = git(f.root, ["write-tree"]);
  assert.equal(git(f.root, ["commit", "-qm", "must fail"], { optional: true }), null);
  assert.equal(git(f.root, ["write-tree"]), before);
  f.put("docs/new.md", "No broken link\n");
  git(f.root, ["add", "."]); git(f.root, ["commit", "-qm", "works"]);
  assert.equal(installHook(f.root, tool, { remove: true }).status, "removed");
  f.put(".git/hooks/pre-commit", "#!/bin/sh\n# user-owned\nexit 0\n");
  assert.equal(installHook(f.root, tool).status, "skipped-existing-hook");
  assert.equal(installHook(f.root, tool, { remove: true }).status, "skipped-unowned-or-modified-hook");
  assert.match(readFileSync(join(f.root, ".git/hooks/pre-commit"), "utf8"), /user-owned/);
  git(f.root, ["config", "core.hooksPath", ".custom-hooks"]);
  assert.equal(installHook(f.root, tool).status, "skipped-existing-hooksPath");
});

test("Husky chaining preserves original checks, propagates their failures and removes only its own suffix", () => {
  const f = fixture();
  const original = "# original check\r\npnpm exec lint-staged\r\n";
  f.put(".husky/pre-commit", original);
  f.put(".husky/_/pre-commit", "#!/bin/sh\nexec sh -e .husky/pre-commit\n");
  chmodSync(join(f.root, ".husky/_/pre-commit"), 0o755);
  f.commit();
  git(f.root, ["config", "core.hooksPath", ".husky/_"]);
  const tool = resolve("scripts/docs.mjs");
  assert.equal(installHook(f.root, tool, { chainExisting: true }).status, "chained-existing-husky");
  assert.ok(readFileSync(join(f.root, ".husky/pre-commit"), "utf8").startsWith(original));
  assert.equal(installHook(f.root, tool, { chainExisting: true }).status, "unchanged-existing-husky");
  const oldPath = process.env.PATH;
  try {
    f.put("fake-bin/pnpm", "#!/bin/sh\nexit 0\n"); chmodSync(join(f.root, "fake-bin/pnpm"), 0o755);
    process.env.PATH = `${join(f.root, "fake-bin")}${delimiter}${oldPath}`;
    f.put("docs/new.md", "[bad](missing.md)\n"); git(f.root, ["add", "."]);
    assert.equal(git(f.root, ["commit", "-qm", "must fail docs"], { optional: true }), null);
    f.put("docs/new.md", "Good\n"); git(f.root, ["add", "."]);
    git(f.root, ["commit", "-qm", "passes original and docs"]);
    f.put("fake-bin/pnpm", "#!/bin/sh\nexit 7\n"); git(f.root, ["add", "."]);
    assert.equal(git(f.root, ["commit", "-qm", "must fail original"], { optional: true }), null);
  } finally { process.env.PATH = oldPath; }
  assert.equal(installHook(f.root, tool, { chainExisting: true, remove: true }).status, "removed-existing-husky");
  assert.equal(readFileSync(join(f.root, ".husky/pre-commit"), "utf8"), original);
});
