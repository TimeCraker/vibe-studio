#!/usr/bin/env node
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { readJson, writeJson, safePath } from "./lib/files.mjs";
import {
  archiveProject,
  verifyArchive,
  restoreArchive,
} from "./lib/archive.mjs";
import { runJob, validateJob } from "./lib/runner.mjs";
import { doctor } from "./lib/doctor.mjs";
import { validatePlan } from "../skills/content-director/scripts/validate-plan.mjs";
import { checkMedia } from "../skills/media-qc/scripts/check.mjs";
import { derive } from "../skills/content-repurpose/scripts/derive.mjs";
import { writeReview } from "../skills/content-review/scripts/report.mjs";
const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const [cmd, ...argv] = process.argv.slice(2);
const args = {};
for (let i = 0; i < argv.length; i++)
  if (argv[i].startsWith("--")) {
    const key = argv[i].slice(2);
    args[key] = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : true;
  }
const project = resolve(args.project ?? process.cwd());
function init() {
  const id = String(
    args.id ?? (argv[0] && !argv[0].startsWith("--") ? argv[0] : ""),
  );
  if (!/^[a-z][a-z0-9-]{0,63}$/.test(id))
    throw new Error("init requires --id <kebab-case>");
  const line = String(args.line ?? "c");
  if (!["a", "b", "c", "ppt", "footage"].includes(line))
    throw new Error("Invalid line");
  const root = args.project ? project : join(REPO, "projects", id);
  if (existsSync(root) && readdirSync(root).length)
    throw new Error("Init target must be absent or empty");
  mkdirSync(root, { recursive: true });
  if (line === "c")
    cpSync(join(REPO, "skills/web-capture/templates/project"), root, {
      recursive: true,
    });
  if (["b", "footage"].includes(line))
    cpSync(
      join(REPO, "skills/video-motion/templates/remotion-app"),
      join(root, "remotion-app"),
      {
        recursive: true,
        filter: (p) => !p.split(/[\\/]/).includes("node_modules"),
      },
    );
  const storyboard = {
    schemaVersion: 1,
    audience: "验证生产流程的制作者",
    goal: "确认管线并替换为真实内容",
    profile: "demo",
    claims: [],
    scenes: [
      {
        id: "demo",
        start: 0,
        end: 6,
        title: "网页动画逐帧采集",
        purpose: "演示管线",
        subject: "测试页面",
        claimIds: [],
        shot: line === "c" ? "demo" : undefined,
        sourceStart: 0,
        asset: { kind: "source-page" },
        motion: "按帧定位",
      },
    ],
    review: { status: "pending" },
  };
  writeJson(join(root, "project.json"), {
    schemaVersion: 1,
    id,
    line,
    title: id,
    targets: ["bili", "douyin", "xhs"],
  });
  writeJson(join(root, "storyboard.json"), storyboard);
  writeFileSync(
    join(root, "brief.md"),
    "# 制作简报\n\n填写受众、核心承诺、片长、画幅、目标行为与事实来源。先看短样片，再制作全片。\n",
  );
  cpSync(
    join(REPO, "skills/content-repurpose/templates/variants.example.json"),
    join(root, "variants.json"),
  );
  cpSync(
    join(REPO, "skills/content-review/templates/metrics.example.json"),
    join(root, "metrics.json"),
  );
  writeJson(join(root, "qc.json"), {});
  writeJson(join(root, "deliverables.json"), {
    files:
      line === "c"
        ? [
            "render/video.mp4",
            "render/video.mp4.json",
            "render/covers/cover-landscape.png",
            "render/covers/cover-portrait.png",
            "qa/media-report.json",
            "qa/media-report-contact-sheet.png",
          ]
        : [],
  });
  const steps = [
    {
      id: "plan",
      command: [
        "node",
        "{repo}/skills/content-director/scripts/validate-plan.mjs",
        "{project}",
      ],
      inputs: ["storyboard.json"],
      outputs: [],
    },
  ];
  if (line === "c")
    steps.push(
      {
        id: "capture",
        command: [
          "node",
          "{repo}/skills/web-capture/templates/capture-all.mjs",
          "--project",
          "{project}",
        ],
        inputs: ["capture"],
        outputs: ["frames"],
        timeoutSeconds: 1800,
      },
      {
        id: "preview",
        command: [
          "node",
          "{repo}/skills/web-capture/templates/render-director.mjs",
          "--project",
          "{project}",
          "--seconds",
          "2",
          "--out",
          "render/preview.mp4",
        ],
        inputs: ["edit", "frames"],
        outputs: ["render/preview.mp4", "render/preview.mp4.json"],
      },
      {
        id: "render",
        command: [
          "node",
          "{repo}/skills/web-capture/templates/render-director.mjs",
          "--project",
          "{project}",
        ],
        inputs: ["edit", "frames"],
        outputs: ["render/video.mp4", "render/video.mp4.json"],
        timeoutSeconds: 1800,
      },
      {
        id: "covers",
        command: [
          "node",
          "{repo}/skills/web-capture/templates/render-director.mjs",
          "--project",
          "{project}",
          "--cover",
        ],
        inputs: ["edit", "frames"],
        outputs: ["render/covers"],
      },
      {
        id: "qc",
        command: [
          "node",
          "{repo}/skills/media-qc/scripts/check.mjs",
          "--project",
          "{project}",
          "--video",
          "render/video.mp4",
        ],
        inputs: ["render/video.mp4", "render/video.mp4.json", "qc.json"],
        outputs: ["qa/media-report.json", "qa/media-report-contact-sheet.png"],
      },
    );
  if (["b", "footage"].includes(line))
    steps.push(
      {
        id: "deps",
        cwd: "remotion-app",
        command: ["npm", "ci", "--ignore-scripts", "--no-audit", "--no-fund"],
        inputs: ["remotion-app/package.json", "remotion-app/package-lock.json"],
        outputs: [
          "remotion-app/node_modules/typescript/bin/tsc",
          "remotion-app/node_modules/remotion/package.json",
        ],
        timeoutSeconds: 900,
      },
      {
        id: "typecheck",
        cwd: "remotion-app",
        command: ["node", "node_modules/typescript/bin/tsc", "--noEmit"],
        inputs: [
          "remotion-app/src",
          "remotion-app/remotion",
          "remotion-app/tsconfig.json",
        ],
        outputs: [],
      },
    );
  writeJson(join(root, "job.json"), { schemaVersion: 1, steps });
  return {
    ok: true,
    project: root,
    line,
    note:
      line === "c"
        ? "Sample capture job ready; human storyboard/final review remains pending"
        : "Starter ready; add your generation/render commands and original media to job.json after designing the storyboard",
  };
}
try {
  let result;
  if (cmd === "init") result = init();
  else if (cmd === "doctor")
    result = doctor(REPO, {
      line:
        args.line ??
        (existsSync(join(project, "project.json"))
          ? readJson(join(project, "project.json")).line
          : "all"),
      project: args.project ? project : undefined,
    });
  else if (cmd === "validate") {
    validateJob(readJson(join(project, "job.json")));
    for (const s of readJson(join(project, "job.json")).steps)
      for (const p of [...s.inputs, ...s.outputs]) safePath(project, p);
    result = validatePlan(readJson(join(project, "storyboard.json")), project, {
      requireReviewed: Boolean(args["require-reviewed"]),
    });
  } else if (cmd === "run")
    result = await runJob(project, REPO, {
      step: args.step,
      from: args.from,
      dry: Boolean(args.dry),
    });
  else if (cmd === "qc")
    result = checkMedia(project, String(args.video ?? "render/video.mp4"), {
      srt: args.srt,
      requireAudio: Boolean(args["require-audio"]),
      allowPreview: Boolean(args["allow-preview"]),
      out: args.out,
      configPath: args.config,
    });
  else if (cmd === "derive") {
    const plan = validatePlan(
      readJson(join(project, "storyboard.json")),
      project,
    );
    if (!plan.ok) throw new Error(plan.errors.join("; "));
    result = derive(project);
  } else if (cmd === "review") result = writeReview(project);
  else if (cmd === "archive") {
    const id = String(args.id ?? readJson(join(project, "project.json")).id);
    if (!/^[a-z][a-z0-9-]{0,63}$/.test(id))
      throw new Error("Invalid archive id");
    const deliverables = args["source-only"]
      ? []
      : readJson(join(project, "deliverables.json")).files;
    if (
      !args["source-only"] &&
      (!Array.isArray(deliverables) || !deliverables.length)
    )
      throw new Error(
        "Declare final files in deliverables.json; use --source-only only for draft source backup",
      );
    result = archiveProject(
      project,
      join(REPO, "products", id),
      {
        id,
        line: existsSync(join(project, "project.json"))
          ? readJson(join(project, "project.json")).line
          : "unknown",
        scope: args["source-only"]
          ? "draft-source-only"
          : "source-inputs-and-deliverables",
        reproducibility: "inputs-archived-rerender-not-certified",
      },
      { deliverables },
    );
  } else if (cmd === "verify-archive")
    result = verifyArchive(resolve(String(args.archive)), {
      sourceOnly: Boolean(args["source-only"]),
    });
  else if (cmd === "restore") {
    if (!args.archive || !args.project)
      throw new Error("restore needs --archive and --project");
    result = restoreArchive(resolve(String(args.archive)), project, {
      sourceOnly: Boolean(args["source-only"]),
    });
  } else if (cmd === "status")
    result = existsSync(join(project, ".studio/state.json"))
      ? readJson(join(project, ".studio/state.json"))
      : { steps: {} };
  else {
    console.log(
      "studio init --id NAME --line a|b|c|ppt|footage [--project DIR]\nstudio doctor [--line LINE] [--project DIR]\nstudio validate --project DIR [--require-reviewed]\nstudio run --project DIR [--step ID | --from ID] [--dry]\nstudio status --project DIR\nstudio qc --project DIR --video FILE [--srt FILE] [--config FILE]\nstudio derive --project DIR\nstudio review --project DIR\nstudio archive --project DIR [--id NEW-REVISION] [--source-only]\nstudio verify-archive --archive FILE [--source-only]\nstudio restore --archive FILE --project DIR [--source-only]",
    );
    process.exitCode = cmd ? 1 : 0;
  }
  if (result) {
    console.log(JSON.stringify(result, null, 2));
    if (result.ok === false) process.exitCode = 1;
  }
} catch (error) {
  console.error(`ERROR ${error.message}`);
  process.exitCode = 1;
}
