import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { git, Snapshot } from "../scripts/lib/docs-source.mjs";
import { generatedPlan, syncGenerated } from "../scripts/lib/docs-generate.mjs";

function fixture() {
  const root = mkdtempSync(join(tmpdir(), "vibe-docs-"));
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
