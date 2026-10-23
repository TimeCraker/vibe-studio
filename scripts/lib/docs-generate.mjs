import { readFileSync, writeFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import { normalize } from "./docs-source.mjs";

export const BLOCK = /<!-- docs:auto ([a-z-]+)(?: source="([^"]+)")? -->\r?\n([\s\S]*?)<!-- \/docs:auto -->/g;
export const withoutGenerated = (text) => text.replace(BLOCK, "");
const cell = (value) => String(value).replaceAll("|", "\\|").replaceAll("\n", " ");

function field(text, key) {
  const front = normalize(text).match(/^---\n([\s\S]*?)\n---(?:\n|$)/)?.[1];
  if (!front) throw new Error("Skill frontmatter missing");
  const lines = front.split("\n"), i = lines.findIndex((l) => l.startsWith(`${key}:`));
  if (i < 0) throw new Error(`Skill ${key} missing`);
  let value = lines[i].slice(key.length + 1).trim();
  if (/^[>|][-+]?$/.test(value)) {
    value = lines.slice(i + 1).filter((l, n, all) => all.slice(0, n + 1).every((s) => /^\s|^$/.test(s))).map((s) => s.trim()).join(" ");
  }
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
  return value;
}

function skills(snapshot) {
  const paths = snapshot.files.filter((p) => /^skills\/[^/]+\/SKILL\.md$/.test(p));
  const rows = paths.map((path) => {
    const text = snapshot.read(path);
    if (text === null) throw new Error(`Cannot read skill: ${path}`);
    const name = field(text, "name"), description = field(text, "description");
    const short = [...description].slice(0, 130).join("") + ([...description].length > 130 ? "…" : "");
    return `| [${cell(name)}](${path.slice(0, -8)}) | ${cell(short)} |`;
  });
  return ["| 技能 | 用途（来自 SKILL.md） |", "|---|---|", ...rows].join("\n");
}

function tree(snapshot) {
  const dirs = [...new Set(snapshot.files.filter((p) => p.includes("/") && !p.startsWith(".")).map((p) => p.split("/")[0]))].sort();
  const rootFiles = snapshot.files.filter((p) => !p.includes("/") && /^(?:README\.md|AGENTS\.md|CLAUDE\.md|package\.json)$/.test(p));
  const entries = [...dirs.map((name) => ({ name, dir: true })), ...rootFiles.map((name) => ({ name, dir: false }))];
  const lines = [`${basename(snapshot.root)}/`];
  for (const [i, entry] of entries.entries()) {
    const last = i === entries.length - 1;
    lines.push(`${last ? "└" : "├"}── ${entry.name}${entry.dir ? "/" : ""}`);
    if (entry.name === "skills") {
      const names = [...new Set(snapshot.files.filter((p) => /^skills\/[^/]+\/SKILL\.md$/.test(p)).map((p) => p.split("/")[1]))].sort();
      for (const [j, name] of names.entries()) lines.push(`${last ? " " : "│"}   ${j === names.length - 1 ? "└" : "├"}── ${name}/`);
    }
  }
  return ["```", ...lines, "```"].join("\n");
}

function commands(snapshot, source) {
  if (!source) throw new Error("commands block needs a source JSON path");
  const text = snapshot.read(source);
  if (text === null) throw new Error(`Cannot read command source: ${source}`);
  const data = JSON.parse(text);
  if (data.schemaVersion !== 1 || !Array.isArray(data.commands) || !data.commands.length) throw new Error("Invalid command catalog");
  const rows = data.commands.map((c) => {
    if (!c.syntax || !c.description) throw new Error("Command needs syntax and description");
    return `| \`${cell(c.syntax)}\` | ${cell(c.description)} |`;
  });
  return ["| 命令（node scripts/studio.mjs 后的参数） | 用途 |", "|---|---|", ...rows].join("\n");
}

export function generatedPlan(snapshot) {
  const plans = [];
  for (const path of snapshot.documents({ history: false })) {
    const original = snapshot.read(path);
    const starts = [...original.matchAll(/<!-- docs:auto\b/g)].length;
    const ends = [...original.matchAll(/<!-- \/docs:auto -->/g)].length;
    const matches = [...original.matchAll(BLOCK)];
    if (starts !== matches.length || ends !== matches.length) throw new Error(`Malformed generated markers: ${path}`);
    if (!starts) continue;
    const seen = new Set();
    const expected = original.replace(BLOCK, (_all, kind, source) => {
      const key = `${kind}:${source || ""}`;
      if (seen.has(key)) throw new Error(`Duplicate generated block: ${path}: ${key}`);
      seen.add(key);
      let body;
      if (kind === "skills") body = skills(snapshot);
      else if (kind === "tree") body = tree(snapshot);
      else if (kind === "commands") body = commands(snapshot, source);
      else throw new Error(`Unknown generated block: ${kind}`);
      // Generated links are rooted at the repository; keep blocks in root README.
      if (path !== "README.md") throw new Error(`Generated blocks currently belong in root README.md: ${path}`);
      const nl = original.includes("\r\n") ? "\r\n" : "\n";
      return [`<!-- docs:auto ${kind}${source ? ` source="${source}"` : ""} -->`, ...body.split("\n"), "<!-- /docs:auto -->"].join(nl);
    });
    if (normalize(original) !== normalize(expected)) plans.push({ path, original, expected });
  }
  return plans;
}

export function syncGenerated(snapshot) {
  if (snapshot.staged) throw new Error("sync writes the worktree only; staged files are never modified automatically");
  const plans = generatedPlan(snapshot);
  // Plan everything first; invalid inputs must not leave partially rewritten docs.
  for (const plan of plans) if (readFileSync(resolve(snapshot.root, plan.path), "utf8") !== plan.original) throw new Error(`Document changed during sync: ${plan.path}`);
  for (const plan of plans) writeFileSync(resolve(snapshot.root, plan.path), plan.expected, "utf8");
  return { updated: plans.map((p) => p.path) };
}
