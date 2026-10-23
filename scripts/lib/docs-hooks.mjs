import { chmodSync, existsSync, lstatSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { repoRoot, git, digest } from "./docs-source.mjs";
import { discoverRepos } from "./docs-index.mjs";

const quote = (s) => `'${s.replaceAll("\\", "/").replaceAll("'", `'"'"'`)}'`;

function chainHusky(root, tool, { remove }) {
  const file = join(root, ".husky", "pre-commit");
  if (existsSync(join(root, ".husky")) && lstatSync(join(root, ".husky")).isSymbolicLink()) return { repo: root, status: "skipped-linked-husky-directory" };
  if (!existsSync(file) || lstatSync(file).isSymbolicLink()) return { repo: root, status: "skipped-unsupported-husky" };
  const text = readFileSync(file, "utf8"), nl = text.includes("\r\n") ? "\r\n" : "\n";
  const command = quote(relative(root, resolve(tool)));
  const suffix = ["", "# docs:auto-hook:start", "docs_previous_status=$?", '[ "$docs_previous_status" -eq 0 ] || exit "$docs_previous_status"',
    `if [ -f ${command} ]; then`, `  node ${command} guard --staged --hook --repo . || exit $?`, "fi", "# docs:auto-hook:end", ""].join(nl);
  const managed = text.match(/\r?\n# docs:auto-hook:start\r?\n[\s\S]*?# docs:auto-hook:end\r?\n?$/);
  if (managed) {
    if (digest(managed[0]) !== digest(suffix)) return { repo: root, status: "skipped-modified-husky-chain" };
    if (!remove) return { repo: root, status: "unchanged-existing-husky" };
    writeFileSync(file, text.slice(0, managed.index), "utf8");
    return { repo: root, status: "removed-existing-husky", modifiedFiles: [".husky/pre-commit"] };
  }
  if (remove) return { repo: root, status: "not-installed" };
  const commands = text.split(/\r?\n/).map((s) => s.trim()).filter((s) => s && !s.startsWith("#"));
  if (commands.length !== 1 || commands[0] !== "pnpm exec lint-staged") return { repo: root, status: "skipped-unsupported-husky-script" };
  if (git(root, ["diff", "HEAD", "--", ".husky/pre-commit"]).trim()) return { repo: root, status: "skipped-dirty-husky-script" };
  writeFileSync(file, text + suffix, "utf8");
  return { repo: root, status: "chained-existing-husky", modifiedFiles: [".husky/pre-commit"] };
}

export function installHook(repo, tool, { remove = false, chainExisting = false } = {}) {
  const root = repoRoot(repo);
  const custom = git(root, ["config", "--get", "core.hooksPath"], { optional: true })?.trim();
  if (custom) {
    const configured = resolve(root, custom), localHusky = resolve(root, ".husky/_");
    const matches = process.platform === "win32" ? configured.toLowerCase() === localHusky.toLowerCase() : configured === localHusky;
    if (chainExisting && matches) return chainHusky(root, tool, { remove });
    return { repo: root, status: "skipped-existing-hooksPath" };
  }
  const hooks = resolve(root, git(root, ["rev-parse", "--git-path", "hooks"]).trim());
  if (existsSync(hooks) && lstatSync(hooks).isSymbolicLink()) return { repo: root, status: "skipped-linked-hooks-directory" };
  const path = join(hooks, "pre-commit"), statePath = join(hooks, "vibe-docs-owner.json");
  if (existsSync(path) && lstatSync(path).isSymbolicLink()) return { repo: root, status: "skipped-linked-hook" };
  if (existsSync(statePath) && lstatSync(statePath).isSymbolicLink()) return { repo: root, status: "skipped-linked-hook-metadata" };
  const current = existsSync(path) ? readFileSync(path, "utf8") : null;
  let state;
  try { state = JSON.parse(readFileSync(statePath, "utf8")); } catch { state = null; }
  const body = `#!/bin/sh\n# vibe-docs-managed-hook-v1\nexec ${quote(process.execPath)} ${quote(resolve(tool))} guard --staged --hook --repo .\n`;
  const owned = current !== null && state?.schemaVersion === 1 && state.hash === digest(current) && current.startsWith("#!/bin/sh\n# vibe-docs-managed-hook-v1\n");
  if (remove) {
    if (current === null) return { repo: root, status: "not-installed" };
    if (!owned) return { repo: root, status: "skipped-unowned-or-modified-hook" };
    unlinkSync(path); unlinkSync(statePath);
    return { repo: root, status: "removed" };
  }
  if (current !== null && !owned) return { repo: root, status: "skipped-existing-hook" };
  if (owned && current === body) return { repo: root, status: "unchanged" };
  mkdirSync(hooks, { recursive: true });
  writeFileSync(path, body, "utf8"); chmodSync(path, 0o755);
  writeFileSync(statePath, JSON.stringify({ schemaVersion: 1, hash: digest(body), tool: resolve(tool) }), "utf8");
  return { repo: root, status: owned ? "updated" : "installed" };
}

export function setupWorkspace(workspace, tool, options = {}) {
  const results = [];
  for (const root of discoverRepos(workspace)) {
    const before = git(root, ["status", "--porcelain=v1", "-z"]);
    const result = installHook(root, tool, options);
    const after = git(root, ["status", "--porcelain=v1", "-z"]);
    const withoutManagedFile = (status) => status.split("\0").filter((s) => s.slice(3) !== ".husky/pre-commit").join("\0");
    if (result.modifiedFiles ? withoutManagedFile(before) !== withoutManagedFile(after) : before !== after)
      throw new Error(`Hook setup changed unrelated checkout status: ${root}`);
    results.push(result);
  }
  return { results, note: "Existing custom hooks are preserved. Skipped repositories can run maintain explicitly; workspace Agent instructions provide the shared entrypoint." };
}
