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

// Default capture viewport, i.e. capture-clip.mjs's historical defaults.
const DEFAULT_VIEWPORT = { width: 1920, height: 1080 };

/**
 * Effective capture viewport for one shot.
 *
 * Priority: shot.viewport > cli (--width/--height) > cfg (shots.json top-level
 * width/height) > 1920x1080. A shot.viewport that is not a positive-integer pair
 * (one side missing, zero/negative/fractional) is taken or ignored as a whole and
 * falls back to the global viewport with a warning: never merge shot values with
 * global values (mangled aspect), never abort the whole batch over one typo.
 */
export function resolveShotViewport(shot, cli = {}, cfg = {}) {
  const fallback = {
    width: Number(cli.width ?? cfg.width ?? DEFAULT_VIEWPORT.width),
    height: Number(cli.height ?? cfg.height ?? DEFAULT_VIEWPORT.height),
  };
  const vp = shot?.viewport;
  if (vp == null) return fallback;
  const bad = (why) => {
    console.error(`[viewport] shot ${shot?.id ?? '?'}: ${why}; ignoring shot viewport, capturing at ${fallback.width}x${fallback.height}`);
    return fallback;
  };
  if (typeof vp !== 'object' || Array.isArray(vp)) {
    return bad('viewport must be {"width": <int>, "height": <int>}');
  }
  if (vp.width === undefined || vp.height === undefined) {
    return bad('viewport needs both width and height');
  }
  if (!Number.isInteger(Number(vp.width)) || !Number.isInteger(Number(vp.height)) || Number(vp.width) <= 0 || Number(vp.height) <= 0) {
    return bad(`viewport width/height must be positive integers (got ${JSON.stringify(vp.width)}x${JSON.stringify(vp.height)})`);
  }
  return { width: Number(vp.width), height: Number(vp.height) };
}
