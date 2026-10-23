import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
export function doctor(repo, { line = "all", project } = {}) {
  const checks = [];
  const check = (name, ok, required, hint = "") =>
    checks.push({ name, ok, required, hint: ok ? "" : hint });
  check(
    "node>=22 / fetch / WebSocket",
    Number(process.versions.node.split(".")[0]) >= 22 &&
      typeof fetch === "function" &&
      typeof WebSocket === "function",
    true,
    "Install Node >=22",
  );
  for (const exe of ["ffmpeg", "ffprobe"])
    check(
      exe,
      spawnSync(exe, ["-version"], { stdio: "ignore" }).status === 0,
      line !== "ppt",
      "Install FFmpeg and add it to PATH",
    );
  const chrome =
    process.env.CHROME_PATH ||
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
  check(
    "Chrome",
    existsSync(chrome),
    ["all", "b", "c", "footage"].includes(line),
    "Set CHROME_PATH to the Chrome executable",
  );
  const py =
    spawnSync("python", ["--version"], { stdio: "ignore" }).status === 0;
  check("Python", py, true, "Install Python 3.10+");
  for (const [module, required] of [
    ["pptx", ["all", "ppt"].includes(line)],
    ["fitz", ["all", "ppt"].includes(line)],
    ["numpy", false],
    ["PIL", false],
    ["faster_whisper", false],
  ]) {
    const result =
      py &&
      spawnSync(
        "python",
        [
          "-c",
          `import importlib.util,sys;sys.exit(0 if importlib.util.find_spec('${module}') else 1)`,
        ],
        { stdio: "ignore" },
      ).status === 0;
    check(
      `python:${module}`,
      Boolean(result),
      required,
      `Install the ${module} dependency in the selected Python environment`,
    );
  }
  if (project && ["b", "footage"].includes(line))
    check(
      "project npm dependencies",
      existsSync(join(project, "remotion-app/node_modules/typescript/bin/tsc")),
      true,
      "Run studio run --step deps",
    );
  for (const client of [".claude", ".agents"])
    check(
      `${client}/skills mounts`,
      existsSync(join(repo, client, "skills", "web-capture")),
      false,
      "Run node scripts/setup-skills.mjs",
    );
  const asrPython = join(
    homedir(),
    ".cache/vibe-studio/asr-venv",
    process.platform === "win32" ? "Scripts/python.exe" : "bin/python",
  );
  check(
    "shared ASR environment",
    existsSync(asrPython) &&
      spawnSync(asrPython, ["-c", "import faster_whisper"], {
        stdio: "ignore",
        timeout: 30000,
      }).status === 0,
    false,
    "Optional: initialize the shared ASR environment from auto-subtitle SKILL.md",
  );
  check(
    "official Remotion references",
    existsSync(
      join(repo, ".cache/upstream-skills/remotion-best-practices/SKILL.md"),
    ),
    false,
    "Run python scripts/install-upstream-skills.py",
  );
  return { ok: checks.every((c) => c.ok || !c.required), checks };
}
