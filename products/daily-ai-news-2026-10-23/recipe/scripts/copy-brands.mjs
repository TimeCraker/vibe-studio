import { cpSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const project = dirname(dirname(fileURLToPath(import.meta.url)));
const from = join(project, "assets", "brands");
const to = join(project, "remotion-app", "public", "brands");
mkdirSync(to, { recursive: true });
for (const name of ["minimax.png", "recursive-mark.png", "typescript.svg"]) {
  cpSync(join(from, name), join(to, name));
}
console.log("brands copied");
