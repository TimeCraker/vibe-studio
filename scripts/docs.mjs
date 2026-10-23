#!/usr/bin/env node
import { resolve } from "node:path";
import { Snapshot } from "./lib/docs-source.mjs";
import { generatedPlan, syncGenerated } from "./lib/docs-generate.mjs";

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
  else if (command === "check") {
    const drift = generatedPlan(snapshot).map((p) => p.path);
    result = { ok: !drift.length, generatedDrift: drift };
  } else if (["help", "--help"].includes(command)) {
    result = { commands: ["sync [--repo DIR]", "check [--repo DIR] [--staged]"] };
  } else throw new Error(`Unknown docs command: ${command}`);
  console.log(JSON.stringify(result, null, 2));
  if (result.ok === false) process.exitCode = 1;
} catch (error) {
  console.error(`docs: ${error.message}`);
  process.exitCode = 1;
}
