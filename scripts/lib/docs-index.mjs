import { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, realpathSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { Snapshot, changedPaths, digest, git, historical, normalize, redact } from "./docs-source.mjs";
import { references } from "./docs-analyze.mjs";

const TOOL_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const INDEX_VERSION = 3; // Bump when tokenization, reference or history rules change.
const SKIP = new Set(["archive", "node_modules", "vendor", "dist", "build", "out", "target"]);

export function discoverRepos(workspace, { depth = 3 } = {}) {
  const root = realpathSync(resolve(workspace)), repos = [];
  function visit(path, level) {
    if (existsSync(join(path, ".git"))) { repos.push(realpathSync(path)); return; }
    if (level >= depth) return;
    for (const entry of readdirSync(path, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      if (entry.name.startsWith(".") || /^_?archiv(?:e|ed)$/i.test(entry.name) || SKIP.has(entry.name) || entry.isSymbolicLink() || !entry.isDirectory()) continue;
      visit(join(path, entry.name), level + 1);
    }
  }
  visit(root, 0);
  return repos.sort();
}

export function terms(raw) {
  const text = redact(raw).toLowerCase(), out = [];
  out.push(...(text.match(/[a-z][a-z0-9_-]{1,}/g) || []));
  for (const part of text.match(/[\p{Script=Han}]+/gu) || []) {
    const chars = [...part];
    if (chars.length === 1) out.push(chars[0]);
    else for (let i = 0; i < chars.length - 1; i++) out.push(chars.slice(i, i + 2).join(""));
  }
  return out;
}

function frequencies(text) {
  const counts = Object.create(null);
  for (const term of terms(text)) counts[term] = (counts[term] || 0) + 1;
  return counts;
}

function cachePath(workspace, cacheDir) {
  return join(cacheDir || join(TOOL_ROOT, ".cache", "docs"), `index-${digest(workspace).slice(0, 12)}.json`);
}

export function indexWorkspace(workspace, { cacheDir } = {}) {
  workspace = realpathSync(resolve(workspace));
  const path = cachePath(workspace, cacheDir);
  let previous;
  try { previous = JSON.parse(readFileSync(path, "utf8")); } catch { previous = {}; }
  if (previous.schemaVersion !== INDEX_VERSION || previous.workspace !== workspace || !Array.isArray(previous.entries)) previous = {};
  const old = new Map((previous.entries || []).map((e) => [`${e.repo}\0${e.path}`, e]));
  const entries = [], repos = [], errors = [];
  let refreshed = 0;
  for (const root of discoverRepos(workspace)) {
    try {
      const snapshot = new Snapshot(root);
      const head = git(root, ["rev-parse", "HEAD"], { optional: true })?.trim() || null;
      repos.push({ root, name: relative(workspace, root).replaceAll("\\", "/") || ".", head });
      for (const doc of snapshot.documents()) {
        const text = normalize(snapshot.read(doc)), hash = digest(text);
        const cached = old.get(`${root}\0${doc}`);
        if (cached?.hash === hash) { entries.push(cached); continue; }
        refreshed++;
        const title = text.match(/^#\s+(.+)$/m)?.[1] || doc;
        entries.push({ repo: root, path: doc, hash, title: redact(title),
          historical: historical(doc, text), terms: frequencies(text), titleTerms: frequencies(title + " " + doc),
          references: [...new Set(references(doc, text, snapshot).map((r) => r.path))],
        });
      }
    } catch (error) { errors.push({ repo: root, error: error.message }); }
  }
  // The workspace itself may not be a Git repository. Its short entrypoints
  // still belong in search, without inventing a Git version or scanning loose files.
  if (!repos.some((r) => r.root === workspace)) for (const doc of ["README.md", "AGENTS.md", "CLAUDE.md"]) {
    const file = join(workspace, doc);
    if (!existsSync(file) || lstatSync(file).isSymbolicLink() || !lstatSync(file).isFile() || lstatSync(file).size > 2 * 1024 * 1024) continue;
    const text = normalize(readFileSync(file, "utf8")), hash = digest(text);
    const cached = old.get(`${workspace}\0${doc}`);
    if (cached?.hash === hash) { entries.push(cached); continue; }
    refreshed++;
    const title = text.match(/^#\s+(.+)$/m)?.[1] || doc;
    entries.push({ repo: workspace, path: doc, hash, title: redact(title), workspaceOnly: true,
      historical: false, terms: frequencies(text), titleTerms: frequencies(title + " " + doc), references: [] });
  }
  const data = { schemaVersion: INDEX_VERSION, workspace, indexedAt: new Date().toISOString(), repos, entries, errors };
  mkdirSync(dirname(path), { recursive: true });
  const temp = `${path}.${randomUUID()}.tmp`;
  writeFileSync(temp, JSON.stringify(data), "utf8"); renameSync(temp, path);
  return { data, cache: path, refreshed };
}

function sourceState(entry, snapshot) {
  const changed = changedPaths(snapshot);
  const dirty = entry.references.filter((ref) => changed.some((p) => p === ref || p.startsWith(`${ref}/`)));
  const reasons = dirty.map((path) => ({ path, reason: "referenced-source-has-uncommitted-changes" }));
  const docCommit = git(snapshot.root, ["log", "-1", "--format=%H", "--", entry.path], { optional: true })?.trim();
  if (docCommit) {
    for (const path of entry.references.filter((p) => !/\.md$/i.test(p)).slice(0, 4)) {
      if (dirty.includes(path)) continue;
      const sourceCommit = git(snapshot.root, ["log", "-1", "--format=%H", "--", path], { optional: true })?.trim();
      if (sourceCommit && sourceCommit !== docCommit && git(snapshot.root, ["merge-base", "--is-ancestor", docCommit, sourceCommit], { optional: true }) !== null)
        reasons.push({ path, reason: "referenced-source-changed-after-document-commit" });
    }
  }
  return { status: reasons.length ? "needs-review" : "unverified", reasons,
    meaning: "Source changes are review hints. No automated semantic, human-acceptance or release certification." };
}

export function searchWorkspace(workspace, query, { limit = 5, history = false, cacheDir } = {}) {
  const queryTerms = [...new Set(terms(query))];
  if (!queryTerms.length) throw new Error("Search needs a Chinese/English keyword");
  // Always inspect source hashes. Reuse token data only for unchanged documents;
  // cache timestamps are never treated as proof of current source contents.
  const indexed = indexWorkspace(workspace, { cacheDir });
  const entries = indexed.data.entries.filter((e) => history || !e.historical);
  const count = (map, key) => Object.hasOwn(map, key) ? map[key] : 0;
  const df = Object.fromEntries(queryTerms.map((q) => [q, entries.filter((e) => count(e.terms, q) || count(e.titleTerms, q)).length]));
  const matches = entries.map((entry) => {
    let score = 0, hits = 0;
    for (const q of queryTerms) if (count(entry.terms, q) || count(entry.titleTerms, q)) {
      hits++;
      score += (1 + Math.log(1 + count(entry.terms, q))) * (1 + Math.log((entries.length + 1) / (df[q] + 1))) + (count(entry.titleTerms, q) ? 5 : 0);
    }
    return { entry, score: score * hits / queryTerms.length * (entry.historical ? 0.65 : 1) };
  }).filter((r) => r.score > 0).sort((a, b) => b.score - a.score || a.entry.path.localeCompare(b.entry.path)).slice(0, Math.max(1, Math.min(50, limit)));
  const snapshots = new Map();
  const results = matches.map(({ entry, score }) => {
    if (!entry.workspaceOnly && !snapshots.has(entry.repo)) snapshots.set(entry.repo, new Snapshot(entry.repo));
    const snapshot = snapshots.get(entry.repo);
    const rootFile = resolve(entry.repo, entry.path);
    const current = entry.workspaceOnly
      ? (existsSync(rootFile) && !lstatSync(rootFile).isSymbolicLink() && lstatSync(rootFile).isFile() && lstatSync(rootFile).size <= 2 * 1024 * 1024 ? readFileSync(rootFile, "utf8") : null)
      : snapshot.read(entry.path);
    const lines = normalize(current || "").split("\n");
    const snippets = lines.map((text, i) => ({ line: i + 1, text: redact(text), score: queryTerms.filter((q) => terms(text).includes(q)).length }))
      .filter((r) => r.score > 0).sort((a, b) => b.score - a.score).slice(0, 2).map(({ line, text }) => ({ line, text: [...text].slice(0, 240).join("") }));
    return { repo: entry.repo, path: entry.path, absolutePath: resolve(entry.repo, entry.path), title: entry.title,
      score: Number(score.toFixed(2)), kind: entry.historical ? "historical" : "current", head: indexed.data.repos.find((r) => r.root === entry.repo)?.head,
      contentHash: digest(current || ""), sourceState: entry.workspaceOnly
        ? { status: "unverified", reasons: [], meaning: "Workspace entrypoint has no Git version; source text was read at query time." }
        : sourceState(entry, snapshot), snippets };
  });
  return { query, repositories: indexed.data.repos.length, documents: indexed.data.entries.length,
    refreshed: indexed.refreshed, cache: indexed.cache, errors: indexed.data.errors, results };
}
