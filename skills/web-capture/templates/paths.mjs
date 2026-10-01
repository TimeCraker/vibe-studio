// Shared CLI parsing + project root resolution for the web-capture harness.
//
// Two different directories are in play, and conflating them is what forced these
// tools to be copied into every project:
//
//   HERE  — this file's directory = the harness's own home in the skill.
//           Use it to locate siblings (cdp.mjs, vclock.js). Never for the project.
//   ROOT  — the project being captured, i.e. projects/<name>/.
//           Comes from --project, defaulting to the current working directory.
//
// So the documented invocation is "cd into the project, run the skill's tool",
// or "run from anywhere with --project <dir>".
import { resolve } from 'node:path';

/** --foo-bar value  ->  args.fooBar ; bare --flag -> true */
export function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) continue;
    const key = a.slice(2).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) out[key] = true;
    else { out[key] = next; i++; }
  }
  return out;
}

export function projectRoot(args) {
  return resolve(args?.project ?? process.cwd());
}
