import {
  copyFileSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
} from "node:fs";
import { dirname, extname, resolve } from "node:path";
import {
  hashFile,
  inside,
  readJson,
  safePath,
  walk,
  writeJson,
} from "./files.mjs";

const CACHE_DIRS = new Set([
  "node_modules",
  ".git",
  ".venv",
  "__pycache__",
  "frames",
  "render",
  "out",
  "dist",
  "build",
  "qa",
  ".studio",
  ".cache",
  ".baseline",
  ".playwright-mcp",
]);
const SOURCE_EXT = new Set([
  ".md",
  ".json",
  ".js",
  ".mjs",
  ".cjs",
  ".ts",
  ".tsx",
  ".jsx",
  ".html",
  ".css",
  ".py",
  ".ps1",
  ".srt",
  ".svg",
  ".txt",
  ".yaml",
  ".yml",
  ".toml",
  ".lock",
  ".sh",
]);
export function archiveSkip(rel) {
  const parts = rel.split("/");
  const leaf = parts.at(-1);
  return (
    parts.some((s) => CACHE_DIRS.has(s)) ||
    /\.(?:log|pyc|tmp)$/i.test(leaf) ||
    (/^\.env(?:\.|$)/.test(leaf) && !/\.(?:example|template)$/.test(leaf)) ||
    /^(?:auth\.json|cookies?\.json|storage-state\.json)$/i.test(leaf)
  );
}
export function archiveProject(
  project,
  destination,
  metadata = {},
  { deliverables = [] } = {},
) {
  project = resolve(project);
  destination = resolve(destination);
  if (!existsSync(project) || !lstatSync(project).isDirectory())
    throw new Error("Project directory does not exist");
  if (
    project === destination ||
    inside(project, destination) ||
    inside(destination, project)
  )
    throw new Error("Archive and project must be separate");
  const manifestPath = resolve(destination, "archive.json");
  if (existsSync(manifestPath))
    throw new Error("Archive exists; use a new revision directory");
  const paths = walk(project, archiveSkip);
  if (!paths.length) throw new Error("Project has no source to archive");
  const files = paths.map((path) => {
    const source =
      SOURCE_EXT.has(extname(path).toLowerCase()) ||
      /^\.(?:gitignore|npmrc)$/.test(path.split("/").at(-1)) ||
      path.split("/").at(-1) === "LICENSE";
    return {
      path,
      stored: `${source ? "recipe" : "media"}/${path}`,
      kind: source ? "source" : "media",
      bytes: lstatSync(safePath(project, path)).size,
      sha256: hashFile(safePath(project, path)),
    };
  });
  for (const path of deliverables) {
    const original = safePath(project, path);
    if (!existsSync(original) || !lstatSync(original).isFile())
      throw new Error(`Missing deliverable: ${path}`);
    if (files.some((f) => f.path === path))
      throw new Error(`Deliverable already included as input: ${path}`);
    files.push({
      path,
      stored: `deliverables/${path}`,
      kind: "deliverable",
      bytes: lstatSync(original).size,
      sha256: hashFile(original),
    });
  }
  // Preflight the entire copy before creating anything. Never replace a different file.
  for (const entry of files) {
    const target = safePath(destination, entry.stored);
    if (existsSync(target) && hashFile(target) !== entry.sha256)
      throw new Error(`Archive collision: ${entry.stored}`);
  }
  for (const entry of files) {
    const target = safePath(destination, entry.stored);
    mkdirSync(dirname(target), { recursive: true });
    copyFileSync(safePath(project, entry.path), target);
  }
  const manifest = {
    schemaVersion: 1,
    createdAt: new Date().toISOString(),
    ...metadata,
    files,
  };
  writeJson(manifestPath, manifest);
  const check = verifyArchive(manifestPath);
  if (!check.ok)
    throw new Error(`Archive verification failed: ${check.errors.join("; ")}`);
  return {
    manifestPath,
    sourceFiles: files.filter((f) => f.kind === "source").length,
    mediaFiles: files.filter((f) => f.kind === "media").length,
    ...check,
  };
}
export function verifyArchive(manifestPath, { sourceOnly = false } = {}) {
  const manifest = readJson(manifestPath);
  const root = dirname(resolve(manifestPath));
  const errors = [];
  if (
    manifest.schemaVersion !== 1 ||
    !Array.isArray(manifest.files) ||
    !manifest.files.length
  )
    throw new Error("Invalid archive manifest");
  const seen = new Set();
  for (const entry of manifest.files) {
    safePath(root, entry.path);
    const path = safePath(root, entry.stored);
    const key = entry.path.toLowerCase();
    if (seen.has(key)) throw new Error(`Duplicate archive path: ${entry.path}`);
    seen.add(key);
    if (
      !["source", "media", "deliverable"].includes(entry.kind) ||
      !/^[a-f0-9]{64}$/.test(entry.sha256)
    )
      throw new Error(`Invalid archive entry: ${entry.path}`);
    if (sourceOnly && entry.kind !== "source") continue;
    if (!existsSync(path)) errors.push(`missing: ${entry.stored}`);
    else if (!lstatSync(path).isFile() || hashFile(path) !== entry.sha256)
      errors.push(`hash mismatch: ${entry.stored}`);
  }
  return {
    ok: errors.length === 0,
    errors,
    scope: sourceOnly ? "source-only" : "source-and-media",
  };
}
export function restoreArchive(
  manifestPath,
  target,
  { sourceOnly = false } = {},
) {
  const check = verifyArchive(manifestPath, { sourceOnly });
  if (!check.ok) throw new Error(`Cannot restore: ${check.errors.join("; ")}`);
  target = resolve(target);
  if (existsSync(target) && readdirSync(target).length)
    throw new Error("Restore target must be absent or empty");
  const manifest = readJson(manifestPath);
  const root = dirname(resolve(manifestPath));
  if (target === root || inside(root, target) || inside(target, root))
    throw new Error("Restore target overlaps archive");
  let restored = 0;
  for (const entry of manifest.files) {
    if (sourceOnly && entry.kind !== "source") continue;
    const dest = safePath(target, entry.path);
    mkdirSync(dirname(dest), { recursive: true });
    copyFileSync(safePath(root, entry.stored), dest);
    if (hashFile(dest) !== entry.sha256)
      throw new Error(`Restored file mismatch: ${entry.path}`);
    restored++;
  }
  return {
    ok: true,
    restored,
    scope: check.scope,
    missingExternalInputs: manifest.missingExternalInputs ?? [],
  };
}
