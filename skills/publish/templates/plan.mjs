import { readFileSync, existsSync, statSync } from "node:fs";
import { resolve } from "node:path";
const platforms = {
  bili: { file: "bili.mjs", spec: "form.json", port: 9222 },
  douyin: { file: "douyin.mjs", spec: "douyin-form.json", port: 9223 },
  xhs: { file: "xhs.mjs", spec: "xhs-form.json", port: 9224 },
};
export function publishJobs(plan, project, { only, driver } = {}) {
  if (
    !plan ||
    typeof plan.platforms !== "object" ||
    !Object.keys(plan.platforms).length
  )
    throw new Error("publish-plan needs platforms");
  const wanted = only
    ? only.split(",").map((s) => s.trim())
    : Object.keys(plan.platforms);
  if (new Set(wanted).size !== wanted.length)
    throw new Error("Duplicate platform");
  return wanted.map((platform) => {
    const tool = platforms[platform],
      conf = plan.platforms[platform];
    if (!tool || !conf)
      throw new Error(`Unknown/unconfigured platform: ${platform}`);
    const selected = driver ?? conf.driver ?? plan.driver ?? "pw";
    if (!["pw", "basic"].includes(selected))
      throw new Error("driver must be pw or basic");
    const video = resolve(project, conf.video ?? plan.video ?? "");
    const cover = conf.cover ?? plan.cover;
    const spec = resolve(project, conf.spec ?? tool.spec);
    for (const path of [
      video,
      spec,
      ...(cover ? [resolve(project, cover)] : []),
    ])
      if (!existsSync(path) || !statSync(path).isFile())
        throw new Error(`Missing publish input: ${path}`);
    const form = JSON.parse(readFileSync(spec, "utf8"));
    if (
      typeof form.title !== "string" ||
      !form.title.trim() ||
      !Array.isArray(form.description) ||
      !form.description.length ||
      form.description.some((s) => typeof s !== "string" || !s.trim())
    )
      throw new Error(`Invalid platform form: ${spec}`);
    const topics = conf.topics ?? conf.names ?? (form.tags ?? []).join(",");
    const supported = {
      bili: "含AI生成内容",
      douyin: "内容由AI生成",
      xhs: "笔记含AI合成内容",
    };
    if (
      selected === "pw" &&
      conf.declare &&
      conf.declare !== supported[platform]
    )
      throw new Error(
        `Unsupported declaration for pw driver: ${platform}; use the basic driver or human selection`,
      );
    const args =
      selected === "pw"
        ? ["--project", project, "--spec", spec, "--video", video]
        : [
            "setup",
            "--project",
            project,
            "--spec",
            spec,
            platform === "bili" ? "--path" : "--video",
            video,
          ];
    if (cover)
      args.push(
        selected === "pw" ? "--cover" : "--image",
        resolve(project, cover),
      );
    if (topics)
      args.push(
        platform === "xhs" && selected === "pw" ? "--topics" : "--names",
        topics,
      );
    if (conf.declare) args.push("--declare", conf.declare);
    if (conf.category) args.push("--category", conf.category);
    if (conf.original === true && selected === "pw") args.push("--original");
    const timeoutSeconds = conf.timeoutSeconds ?? plan.timeoutSeconds ?? 900;
    if (!Number.isFinite(timeoutSeconds) || timeoutSeconds <= 0)
      throw new Error("Invalid publish timeout");
    const postActions =
      selected === "pw" && cover && platform === "bili"
        ? [
            {
              file: tool.file,
              args: [
                "cover",
                "--project",
                project,
                "--image",
                resolve(project, cover),
              ],
            },
          ]
        : [];
    const manualPending =
      selected === "pw" && cover && platform !== "bili"
        ? ["custom cover must be applied/reviewed in the platform UI"]
        : [];
    return {
      platform,
      driver: selected,
      file: selected === "pw" ? `pw/${platform}-fill.js` : tool.file,
      args,
      postActions,
      manualPending,
      video,
      spec,
      cover: cover ? resolve(project, cover) : null,
      timeoutSeconds,
      port: tool.port,
      title: form.title,
    };
  });
}
