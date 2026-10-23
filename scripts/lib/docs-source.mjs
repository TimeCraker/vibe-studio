import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, lstatSync, readFileSync, realpathSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";

export const normalize = (text) => text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");
export const digest = (text) => createHash("sha256").update(normalize(text)).digest("hex");

export function git(root, args, { optional = false, input, maxBuffer = 32 * 1024 * 1024 } = {}) {
  const result = spawnSync("git", ["-C", root, ...args], {
    encoding: "utf8", input, maxBuffer, windowsHide: true,
  });
  if (result.error || result.status !== 0) {
    if (optional) return null;
    throw new Error(result.error?.message || result.stderr.trim() || `git ${args[0]} failed`);
  }
  return result.stdout;
}

export function repoRoot(path) {
  return realpathSync(git(resolve(path), ["rev-parse", "--show-toplevel"]).trim());
}

const EXCLUDED = /(?:^|\/)(?:node_modules|\.git|\.cache|\.venv|__pycache__|frames|render|out|dist|build|qa|\.studio|\.agents|\.claude|\.playwright-mcp)(?:\/|$)/;
export function sensitive(path) {
  return /(?:^|\/)(?:\.env(?:\..*)?|credentials?(?:\.[^/]*)?|secrets?(?:\.[^/]*)?|cookies?(?:\.[^/]*)?|auth\.json|storage-state\.json|id_rsa|id_ed25519)$/i.test(path);
}
export function documentPath(path) {
  return !EXCLUDED.test(path) && !sensitive(path) && /\.md$/i.test(path) && (
    !path.includes("/") || /(?:^|\/)(?:README|AGENTS?|CLAUDE|SKILL)\.md$/i.test(path) ||
    /^(?:docs|workflows|skills)\//.test(path)
  );
}
export function historical(path, text) {
  const header = text.split("\n").slice(0, 12).join("\n");
  if (/(?:^|\/)(?:_?archive|archived|completed|recipe|reports?|handoffs?)(?:\/|$)/i.test(path) ||
    /状态[:：]\s*已存档|status:\s*archived/i.test(header)) return true;
  if (/状态[:：]\s*活跃|status:\s*active/i.test(header)) return false;
  return /(?:^|\/)(?:\d{4}-\d{2}-\d{2}[-_].*|stage[-_]?\d+[-_].*)(?:acceptance|verification|report|handoff)\.md$/i.test(path);
}

export class Snapshot {
  constructor(root, { staged = false } = {}) {
    this.root = repoRoot(root);
    this.staged = staged;
    this.modes = new Map();
    for (const entry of git(this.root, ["ls-files", "--stage", "-z"]).split("\0").filter(Boolean)) {
      const tab = entry.indexOf("\t"), header = entry.slice(0, tab).split(" ");
      if (header[2] !== "0") throw new Error("Resolve Git conflicts before maintaining docs");
      this.modes.set(entry.slice(tab + 1), header[0]);
    }
    const args = staged ? ["ls-files", "-z"] : ["ls-files", "--cached", "--others", "--exclude-standard", "-z"];
    this.files = [...new Set(git(this.root, args).split("\0").filter(Boolean))].sort();
    this.fileSet = new Set(this.files);
    this.directories = new Set();
    for (const file of this.files) {
      const parts = file.split("/");
      for (let i = 1; i < parts.length; i++) this.directories.add(parts.slice(0, i).join("/"));
    }
    this.cache = new Map();
    if (staged) this.preloadDocuments();
  }
  preloadDocuments() {
    const names = this.files.filter(documentPath).filter((p) => this.safe(p));
    if (!names.length) return;
    // One batch avoids a Git process for every Markdown file in large repos.
    const sizes = git(this.root, ["cat-file", "--batch-check=%(objectname) %(objecttype) %(objectsize)"],
      { input: names.map((p) => `:${p}\n`).join("") }).trimEnd().split("\n");
    const readable = names.filter((_p, i) => / blob \d+$/.test(sizes[i]) && Number(sizes[i].split(" ").at(-1)) <= 2 * 1024 * 1024);
    for (const name of names) this.cache.set(name, null);
    if (!readable.length) return;
    const result = spawnSync("git", ["-C", this.root, "cat-file", "--batch"], {
      input: readable.map((p) => `:${p}\n`).join(""), maxBuffer: 128 * 1024 * 1024, windowsHide: true,
    });
    if (result.error || result.status !== 0) throw new Error("Cannot read staged document batch");
    let offset = 0;
    for (const name of readable) {
      const end = result.stdout.indexOf(10, offset);
      const size = Number(result.stdout.subarray(offset, end).toString("utf8").split(" ").at(-1));
      if (end < 0 || !Number.isSafeInteger(size)) throw new Error("Invalid Git document batch");
      this.cache.set(name, result.stdout.subarray(end + 1, end + 1 + size).toString("utf8"));
      offset = end + size + 2;
    }
  }
  safe(path) {
    if (!path || path.includes("\\") || isAbsolute(path) || path.split("/").some((p) => p === ".." || p === ".")) return false;
    let part = path;
    while (part !== ".") {
      if (this.modes.get(part) === "120000") return false;
      part = dirname(part).replaceAll("\\", "/");
    }
    if (!this.staged) {
      let target = resolve(this.root, path);
      while (target !== this.root) {
        const rel = relative(this.root, target);
        if (rel === ".." || rel.startsWith(`..${sep}`) || isAbsolute(rel)) return false;
        if (existsSync(target) && lstatSync(target).isSymbolicLink()) return false;
        target = dirname(target);
      }
    }
    return true;
  }
  read(path) {
    if (!this.safe(path) || sensitive(path)) return null;
    if (this.cache.has(path)) return this.cache.get(path);
    let text = null;
    if (this.staged) {
      if (this.fileSet.has(path)) text = git(this.root, ["show", `:${path}`], { optional: true, maxBuffer: 2 * 1024 * 1024 });
    } else {
      const file = resolve(this.root, path);
      if (existsSync(file) && lstatSync(file).isFile() && lstatSync(file).size <= 2 * 1024 * 1024) text = readFileSync(file, "utf8");
    }
    this.cache.set(path, text);
    return text;
  }
  exists(path) {
    if (path === ".") return true;
    if (!this.safe(path)) return false;
    if (this.staged) return this.fileSet.has(path) || this.directories.has(path.replace(/\/$/, ""));
    return existsSync(resolve(this.root, path));
  }
  documents({ history = true } = {}) {
    return this.files.filter(documentPath).filter((p) => {
      const text = this.read(p);
      return text !== null && (history || !historical(p, normalize(text)));
    });
  }
}

export function changedPaths(snapshot, { staged = snapshot.staged, base } = {}) {
  if (base) git(snapshot.root, ["rev-parse", "--verify", `${base}^{commit}`]);
  const args = ["diff", "--name-only", "--no-renames", "-z"];
  if (staged) args.push("--cached");
  args.push(base || "HEAD", "--");
  const head = git(snapshot.root, ["rev-parse", "--verify", "HEAD"], { optional: true });
  const paths = head ? git(snapshot.root, args).split("\0") : snapshot.files;
  if (!staged) paths.push(...git(snapshot.root, ["ls-files", "--others", "--exclude-standard", "-z"]).split("\0"));
  return [...new Set(paths.filter((p) => p && !EXCLUDED.test(p) && !sensitive(p)))].sort();
}

export function redact(text) {
  return text.replace(/\b(?:sk-[A-Za-z0-9_-]{16,}|gh[pousr]_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,})\b/g, "[REDACTED]")
    .replace(/((?:api[_-]?key|password|secret|access[_-]?token)\s*[:=]\s*)["']?[^\s,"'`]+/gi, "$1[REDACTED]");
}
