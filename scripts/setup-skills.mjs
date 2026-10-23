// Project-local discovery mounts only; never replaces a different existing entry.
import {
  existsSync,
  readdirSync,
  lstatSync,
  realpathSync,
  mkdirSync,
  symlinkSync,
  readFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), ".."),
  argv = process.argv.slice(2);
const index = argv.indexOf("--client"),
  client = index >= 0 ? argv[index + 1] : "all";
if (!["all", "claude", "codex"].includes(client))
  throw new Error("--client must be all, claude or codex");
const localSkills = readdirSync(join(ROOT, "skills"))
  .filter((name) => existsSync(join(ROOT, "skills", name, "SKILL.md")))
  .sort();
const skills = localSkills.map((name) => ({
  name,
  target: join(ROOT, "skills", name),
}));
const upstream = join(ROOT, ".cache/upstream-skills/remotion-best-practices");
let official = "unavailable";
if (
  existsSync(join(ROOT, ".cache/upstream-skills/remotion-lock.json")) &&
  existsSync(join(upstream, "SKILL.md"))
) {
  const lock = JSON.parse(
      readFileSync(
        join(ROOT, ".cache/upstream-skills/remotion-lock.json"),
        "utf8",
      ),
    ),
    spec = JSON.parse(
      readFileSync(
        join(ROOT, "skills/video-motion/references/upstream.json"),
        "utf8",
      ),
    );
  if (lock.ref !== spec.ref)
    throw new Error("Official skill cache revision differs");
  for (const [rel, expected] of Object.entries(lock.files ?? {})) {
    if (
      rel.split("/").includes("..") ||
      rel.includes("\\") ||
      rel.startsWith("/")
    )
      throw new Error("Unsafe official skill lock path");
    const path = join(upstream, rel);
    if (
      !existsSync(path) ||
      createHash("sha256").update(readFileSync(path)).digest("hex") !== expected
    )
      throw new Error(
        `Official reference modified: ${rel}; preserve edits before reinstalling`,
      );
  }
  skills.push({ name: "remotion-best-practices", target: upstream });
  official = "installed";
}
const clients = client === "all" ? ["claude", "codex"] : [client];
const mounts = clients.flatMap((c) =>
  skills.map((s) => {
    const path = join(
      ROOT,
      c === "claude" ? ".claude" : ".agents",
      "skills",
      s.name,
    );
    let state = "create";
    if (existsSync(path)) {
      state =
        lstatSync(path).isSymbolicLink() &&
        realpathSync(path).toLowerCase() ===
          realpathSync(s.target).toLowerCase()
          ? "existing"
          : "conflict";
    }
    return { client: c, ...s, path, state };
  }),
);
if (mounts.some((m) => m.state === "conflict")) {
  console.error(JSON.stringify(mounts.filter((m) => m.state === "conflict")));
  process.exit(1);
}
if (!argv.includes("--dry"))
  for (const m of mounts)
    if (m.state === "create") {
      mkdirSync(dirname(m.path), { recursive: true });
      symlinkSync(
        m.target,
        m.path,
        process.platform === "win32" ? "junction" : "dir",
      );
    }
console.log(
  JSON.stringify(
    { dry: argv.includes("--dry"), localSkills, official, mounts },
    null,
    2,
  ),
);
