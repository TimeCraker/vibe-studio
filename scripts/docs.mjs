#!/usr/bin/env node
import { resolve } from "node:path";
import { Snapshot } from "./lib/docs-source.mjs";
import { generatedPlan, syncGenerated } from "./lib/docs-generate.mjs";
import { checkDocs, impact } from "./lib/docs-analyze.mjs";

const [command = "help", ...argv] = process.argv.slice(2);
const args = {};
for (let i = 0; i < argv.length; i++) {
  if (!argv[i].startsWith("--")) throw new Error(`Use named arguments: ${argv[i]}`);
  const key = argv[i].slice(2);
  args[key] = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : true;
}
try {
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
    result = { commands: ["maintain [--repo DIR] [--base REF]", "sync [--repo DIR]", "check [--repo DIR] [--staged] [--new-only]", "impact [--repo DIR] [--base REF] [--staged]", "guard --staged [--repo DIR]"] };
  } else throw new Error(`Unknown docs command: ${command}`);
  console.log(JSON.stringify(result, null, 2));
  if (result.ok === false) process.exitCode = 1;
} catch (error) {
  console.error(`docs: ${error.message}`);
  process.exitCode = 1;
}
