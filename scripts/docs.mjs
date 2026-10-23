#!/usr/bin/env node
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Snapshot, git } from "./lib/docs-source.mjs";
import { syncGenerated } from "./lib/docs-generate.mjs";
import { checkDocs, impact } from "./lib/docs-analyze.mjs";
import { indexWorkspace, searchWorkspace } from "./lib/docs-index.mjs";
import { installHook, setupWorkspace } from "./lib/docs-hooks.mjs";

const [command = "help", ...argv] = process.argv.slice(2);
const args = {};
function execute() {
  if (["help", "--help"].includes(command)) return { commands: ["maintain [--repo DIR] [--base REF]", "sync [--repo DIR]", "check [--repo DIR] [--staged] [--new-only]", "impact [--repo DIR] [--base REF] [--staged]", "guard --staged [--repo DIR]", "index --workspace DIR", "search --workspace DIR --query TEXT [--limit 5] [--history]", "hooks [--repo DIR] [--chain-existing] [--remove]", "setup --workspace DIR [--chain-existing] [--remove]"] };
  if (["setup", "hooks"].includes(command)) {
    const tool = fileURLToPath(import.meta.url), options = { remove: Boolean(args.remove), chainExisting: Boolean(args["chain-existing"]) };
    if (command === "setup" && !args.workspace) throw new Error("setup requires --workspace DIR");
    return command === "setup" ? setupWorkspace(args.workspace, tool, options) : installHook(args.repo || process.cwd(), tool, options);
  }
  if (["index", "search"].includes(command)) {
    if (!args.workspace) throw new Error("index/search require --workspace DIR");
    const options = { limit: Number(args.limit || 5), history: Boolean(args.history) };
    if (!Number.isInteger(options.limit) || options.limit < 1 || options.limit > 50) throw new Error("--limit must be an integer from 1 to 50");
    const result = command === "search" ? searchWorkspace(args.workspace, String(args.query || ""), options) : (() => {
      const r = indexWorkspace(args.workspace); return { cache: r.cache, repositories: r.data.repos.length, documents: r.data.entries.length, refreshed: r.refreshed, errors: r.data.errors };
    })();
    return result;
  }
  const snapshot = new Snapshot(resolve(args.repo || process.cwd()), { staged: Boolean(args.staged) });
  let result;
  if (command === "sync") result = syncGenerated(snapshot);
  else if (command === "check") result = checkDocs(snapshot, { newOnly: Boolean(args["new-only"]) });
  else if (command === "impact") result = impact(snapshot, { base: args.base });
  else if (command === "maintain") {
    if (snapshot.staged) throw new Error("maintain works on the worktree; use guard --staged for the index");
    if (args.base) git(snapshot.root, ["rev-parse", "--verify", `${args.base}^{commit}`]);
    const synced = syncGenerated(snapshot);
    // Re-read the changed files after generation.
    const fresh = new Snapshot(snapshot.root);
    result = { ...synced, ...checkDocs(fresh, { newOnly: true }), impact: impact(fresh, { base: args.base }) };
  } else if (command === "guard") {
    result = { ...checkDocs(snapshot, { newOnly: true }), impact: impact(snapshot) };
  } else throw new Error(`Unknown docs command: ${command}`);
  return result;
}
try {
  const boolean = new Set(["history", "staged", "hook", "remove", "chain-existing", "new-only"]);
  const values = new Set(["repo", "workspace", "query", "limit", "base"]);
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i].slice(2);
    if (!argv[i].startsWith("--") || (!boolean.has(key) && !values.has(key))) throw new Error(`Unknown argument: ${argv[i]}`);
    if (boolean.has(key)) args[key] = true;
    else {
      if (!argv[i + 1] || argv[i + 1].startsWith("--")) throw new Error(`--${key} needs a value`);
      args[key] = argv[++i];
    }
  }
  if (args.hook && (command !== "guard" || !args.staged)) throw new Error("--hook requires guard --staged");
  const result = execute();
  if (args.hook) {
    if (result.generatedDrift.length) console.error(`docs: generated blocks differ: ${result.generatedDrift.join(", ")}`);
    for (const link of result.brokenLinks) console.error(`docs: new broken link ${link.doc}:${link.line} -> ${link.path}`);
    if (!result.ok) console.error(`docs: run node "${fileURLToPath(import.meta.url)}" maintain --repo .; inspect and stage intended changes, then retry. Nothing was staged or rewritten by this hook.`);
    if (result.impact.candidates.length) {
      console.log(`docs: ${result.impact.candidates.length} document candidates need semantic inspection (advisory):`);
      for (const candidate of result.impact.candidates.slice(0, 8)) console.log(`  ${candidate.doc}${candidate.docChanged ? " (also changed)" : ""}`);
      console.log(`docs: use the shared maintain command for source paths and line numbers; no extra report is needed.`);
    }
  } else console.log(JSON.stringify(result, null, 2));
  if (result.ok === false || result.errors?.length) process.exitCode = 1;
} catch (error) {
  console.error(`docs: ${error.message}`);
  process.exitCode = 1;
}
