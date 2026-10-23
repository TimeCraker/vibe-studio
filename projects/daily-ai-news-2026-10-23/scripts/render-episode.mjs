// Remotion's bundled ffmpeg cannot write into the user Temp directory on this
// machine (permission denied). Point TEMP at a repo-local cache folder first.
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const project = dirname(dirname(fileURLToPath(import.meta.url)));
const tmp = join(project, "..", "..", ".cache", "daily-ai-news-render");
mkdirSync(tmp, { recursive: true });
mkdirSync(join(project, "render"), { recursive: true });

const child = spawn(
  process.execPath,
  [
    join(project, "remotion-app", "node_modules", "@remotion", "cli", "remotion-cli.js"),
    "render",
    "remotion/index.ts",
    "DailyEdition",
    join(project, "render", "daily-ai-news-2026-10-23.mp4"),
  ],
  {
    cwd: join(project, "remotion-app"),
    env: { ...process.env, TEMP: tmp, TMP: tmp },
    stdio: "inherit",
  },
);
child.on("exit", (code) => {
  process.exitCode = code ?? 1;
});
