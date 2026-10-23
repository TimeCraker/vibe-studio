#!/usr/bin/env node
import { resolve } from "node:path";
import { Snapshot } from "./lib/docs-source.mjs";
import { syncGenerated } from "./lib/docs-generate.mjs";
import { checkDocs, impact } from "./lib/docs-analyze.mjs";
import { indexWorkspace, searchWorkspace } from "./lib/docs-index.mjs";

const [command = "help", ...argv] = process.argv.slice(2);
const args = {};
for (let i = 0; i < argv.length; i++) {
  if (!argv[i].startsWith("--")) throw new Error(`Use named arguments: ${argv[i]}`);
  const key = argv[i].slice(2);
  args[key] = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : true;
}
try {
  if (["index", "search"].includes(command)) {
    if (!args.workspace) throw new Error("index/search require --workspace DIR");
    const options = { limit: Number(args.limit || 5), history: Boolean(args.history) };
    const result = command === "search" ? searchWorkspace(args.workspace, String(args.query || ""), options) : (() => {
      const r = indexWorkspace(args.workspace); return { cache: r.cache, repositories: r.data.repos.length, documents: r.data.entries.length, refreshed: r.refreshed, errors: r.data.errors };
    })();
    console.log(JSON.stringify(result, null, 2));
    if (result.errors.length) process.exitCode = 1;
    process.exit();
  }
  const snapshot = new Snapshot(resolve(args.repo || process.cwd()), { staged: Boolean(args.staged) });
  let result;
  if (command === "sync") result = syncGenerated(snapshot);
  else if (command === "check") result = checkDocs(snapshot, { newOnly: Boolean(args["new-only"]) });
  else if (command === "impact") result = impact(snapshot, { base: args.base });
  else if (command === "maintain") {
    if (snapshot.staged) throw new Error("maintain works on the worktree; use guard --staged for the index");
    const synced = syncGenerated(snapshot);
    // Re-read the changed files after generation.
    const fresh = new Snapshot(snapshot.root);
    result = { ...synced, ...checkDocs(fresh, { newOnly: true }), impact: impact(fresh, { base: args.base }) };
  } else if (command === "guard") {
    result = { ...checkDocs(snapshot, { newOnly: true }), impact: impact(snapshot) };
  } else if (["help", "--help"].includes(command)) {
    result = { commands: ["maintain [--repo DIR] [--base REF]", "sync [--repo DIR]", "check [--repo DIR] [--staged] [--new-only]", "impact [--repo DIR] [--base REF] [--staged]", "guard --staged [--repo DIR]", "index --workspace DIR", "search --workspace DIR --query TEXT [--limit 5] [--history]"] };
  } else throw new Error(`Unknown docs command: ${command}`);
  console.log(JSON.stringify(result, null, 2));
  if (result.ok === false) process.exitCode = 1;
} catch (error) {
  console.error(`docs: ${error.message}`);
  process.exitCode = 1;
}
