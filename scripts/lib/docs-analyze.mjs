import { posix } from "node:path";
import { changedPaths, git, normalize } from "./docs-source.mjs";
import { generatedPlan, withoutGenerated } from "./docs-generate.mjs";

function unfenced(text) {
  // Preserve line offsets when ignoring examples inside fenced blocks.
  return text.replace(/^([ \t]*)(`{3,}|~{3,})[^\n]*\n[\s\S]*?^\1\2[^\n]*$/gm, (s) => s.replace(/[^\n]/g, " "));
}

export function localLinks(doc, raw) {
  const text = unfenced(normalize(raw)), links = [];
  const matches = [...text.matchAll(/!?\[[^\]\n]*\]\((<[^>\n]+>|[^\s)]+)(?:\s+["'][^\n]*?["'])?\)/g),
    ...text.matchAll(/^\s*\[[^\]\n]+\]:\s*(<[^>\n]+>|[^\s]+).*$/gm)];
  for (const match of matches) {
    let target = match[1].replace(/^<|>$/g, "");
    if (/^(?:[a-z][a-z0-9+.-]*:|\/|#)/i.test(target)) continue;
    target = target.split("#")[0].split("?")[0];
    try { target = decodeURIComponent(target); } catch { continue; }
    if (!target || /[<>{}*]/.test(target)) continue; // Template placeholders are not file promises.
    const path = posix.normalize(posix.join(posix.dirname(doc), target)).replace(/\/$/, "");
    if (path === ".." || path.startsWith("../")) continue;
    links.push({ path, target, line: text.slice(0, match.index).split("\n").length });
  }
  return links;
}

export function references(doc, raw, snapshot) {
  const text = withoutGenerated(normalize(raw));
  const refs = localLinks(doc, text).map((link) => ({ ...link, kind: "link" }));
  // Recognize executable snippets and inline repository paths, including deleted files.
  for (const match of text.matchAll(/(?:^|[\s`"'(])((?:scripts|skills|src|app|lib|packages|assets|workflows|docs|projects|products|templates|references)\/[A-Za-z0-9_@./-]+)/gm)) {
    const rawPath = match[1].replace(/[.,/]+$/, "");
    if (rawPath.split("/").some((p) => p === "..")) continue;
    const path = snapshot.exists(rawPath) || /^(?:scripts|skills|src|app|lib|packages|assets|workflows|docs|projects|products)\//.test(rawPath)
      ? rawPath : posix.normalize(posix.join(posix.dirname(doc), rawPath));
    refs.push({ path, line: text.slice(0, match.index).split("\n").length, kind: "path-or-command" });
  }
  return refs;
}

export function impact(snapshot, { base } = {}) {
  const changes = changedPaths(snapshot, { base });
  const changed = new Set(changes), candidates = [], covered = new Set();
  for (const doc of snapshot.documents({ history: false })) {
    const reasons = [];
    for (const ref of references(doc, snapshot.read(doc), snapshot)) {
      const sources = changes.filter((path) => path !== doc && (path === ref.path || path.startsWith(`${ref.path}/`)));
      if (!sources.length) continue;
      for (const source of sources) covered.add(source);
      reasons.push({ reference: ref.path, line: ref.line, kind: ref.kind, changedSources: sources });
    }
    if (reasons.length) candidates.push({ doc, docChanged: changed.has(doc), reasons });
  }
  return {
    changed: changes, candidates,
    unmapped: changes.filter((p) => !covered.has(p) && !/\.md$/i.test(p)),
    meaning: "Candidates need semantic inspection, not a claim of staleness. Unmapped behavior changes still need judgement. Do not create a new report per task.",
  };
}

export function checkDocs(snapshot, { newOnly = false } = {}) {
  const drift = generatedPlan(snapshot).map((p) => p.path), broken = [], legacy = [];
  const changes = newOnly ? changedPaths(snapshot) : [];
  const changed = new Set(changes);
  const headDocCache = new Map(), headExistsCache = new Map();
  for (const doc of snapshot.documents({ history: false })) {
    for (const link of localLinks(doc, snapshot.read(doc))) {
      if (newOnly && !changed.has(doc) && !changes.some((p) => p === link.path || p.startsWith(`${link.path}/`))) continue;
      if (snapshot.exists(link.path)) continue;
      if (newOnly) {
        if (!headDocCache.has(doc)) {
          const text = git(snapshot.root, ["show", `HEAD:${doc}`], { optional: true });
          headDocCache.set(doc, new Set(text === null ? [] : localLinks(doc, text).map((r) => r.path)));
        }
        if (!headExistsCache.has(link.path)) headExistsCache.set(link.path,
          git(snapshot.root, ["cat-file", "-e", `HEAD:${link.path}`], { optional: true }) !== null);
        if (headDocCache.get(doc).has(link.path) && !headExistsCache.get(link.path)) {
          legacy.push({ doc, ...link });
          continue;
        }
      }
      broken.push({ doc, ...link });
    }
  }
  return {
    ok: !drift.length && !broken.length,
    generatedDrift: drift, brokenLinks: broken,
    legacyBrokenCount: legacy.length,
    scope: snapshot.staged ? "git-index" : "worktree",
    repair: drift.length ? "Run node scripts/docs.mjs sync --repo <repo>, inspect the diff and stage the intended generated changes. Partial staging is preserved; this tool never stages for you." : undefined,
  };
}
