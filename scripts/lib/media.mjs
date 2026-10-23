import { spawnSync } from "node:child_process";
import { existsSync, statSync } from "node:fs";
import { safePath } from "./files.mjs";

export function mediaCommand(exe, args, options = {}) {
  const result = spawnSync(exe, args, {
    encoding: "utf8", timeout: 600000, maxBuffer: 32 * 1024 * 1024,
    windowsHide: true, ...options,
  });
  if (result.error || result.status !== 0)
    throw new Error(`${exe}: ${result.error?.message ?? result.stderr?.slice(-1800)}`);
  return result;
}
export function probeMedia(file) {
  const data = JSON.parse(mediaCommand("ffprobe", [
    "-v", "error", "-show_streams", "-show_format", "-of", "json", file,
  ]).stdout);
  const duration = Number(data.format?.duration ?? data.streams?.[0]?.duration);
  return { ...data, duration };
}
export function mediaInput(project, path) {
  const file = safePath(project, path);
  if (!existsSync(file) || !statSync(file).isFile()) throw new Error(`Missing input: ${path}`);
  return file;
}
export function bounded(value, name, min, max) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max)
    throw new Error(`${name} must be a number between ${min} and ${max}`);
  return value;
}
