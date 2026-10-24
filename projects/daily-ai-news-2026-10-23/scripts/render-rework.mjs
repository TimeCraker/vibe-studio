// Separate visual revision. Never overwrites DailyEdition or its render.
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const project = dirname(dirname(fileURLToPath(import.meta.url)));
const app = join(project, "remotion-app");
const repo = resolve(project, "../..");
const temp = join(repo, ".cache/daily-ai-news-rework-temp");
const publicRoot = join(app, "public/rework");
const mode = process.argv[2] ?? "stills";
const cli = join(app, "node_modules/@remotion/cli/remotion-cli.js");
if (!["prepare", "stills", "sample", "video", "studio"].includes(mode)) throw new Error("Use prepare, stills, sample, video or studio");
for (const folder of [temp, publicRoot, join(publicRoot, "fonts"), join(publicRoot, "brands"), join(project, "render/rework")]) mkdirSync(folder, { recursive: true });
const systemFonts = join(process.env.WINDIR ?? "C:/Windows", "Fonts");
const assets = [
  [join(systemFonts, "NotoSansSC-VF.ttf"), "fonts/NotoSansSC-VF.ttf"],
  [join(systemFonts, "consola.ttf"), "fonts/consola.ttf"],
  ...["minimax.png", "recursive-mark.png", "typescript.svg"].map((file) => [join(project, "assets/brands", file), `brands/${file}`]),
];
const manifest = [];
for (const [source, relative] of assets) {
  if (!existsSync(source)) throw new Error(`Missing local asset: ${source}. Supply the same licensed font/official source; do not silently substitute.`);
  const target = join(publicRoot, relative);
  copyFileSync(source, target);
  manifest.push({ file: relative, source, sha256: createHash("sha256").update(readFileSync(target)).digest("hex") });
}
writeFileSync(join(publicRoot, "manifest.json"), JSON.stringify({ files: manifest }, null, 2) + "\n");
const run = (args) => {
  const result = spawnSync(process.execPath, [cli, ...args], { cwd: app, env: { ...process.env, TEMP: temp, TMP: temp }, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
};
const entry = "remotion/rework.tsx";
if (mode === "studio") run(["studio", entry, "--no-open", "--port=3473"]);
if (mode === "stills") {
  for (const [name, frame] of [["ranking", 120], ["headline", 810], ["parameters", 1440], ["license", 1900], ["flint-specs", 2250], ["flint-scores", 2600], ["typescript", 2940], ["tsrs", 3240], ["close", 3570]]) {
    run(["still", entry, "DailyRework", join(project, `render/rework/${name}.png`), `--frame=${frame}`, "--log=error"]);
  }
  run(["still", entry, "DailyReworkCover", join(project, "render/rework/cover.png"), "--log=error"]);
}
if (mode === "sample" || mode === "video") {
  const output = mode === "sample" ? "daily-ai-news-2026-10-23-rework-sample.mp4" : "daily-ai-news-2026-10-23-rework.mp4";
  run(["render", entry, "DailyRework", join(project, "render", output), "--codec=h264", "--crf=16", "--concurrency=4", "--log=error", ...(mode === "sample" ? ["--frames=0-1079"] : [])]);
}
