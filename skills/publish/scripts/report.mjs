import { readFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve, join, isAbsolute, relative } from "node:path";
import { pathToFileURL } from "node:url";
const number = (v) => typeof v === "number" && Number.isFinite(v) && v >= 0;
const ratio = (a, b) => (number(a) && number(b) && b > 0 ? a / b : null);
export function reviewMetrics(input, project) {
  if (input.schemaVersion !== 1 || !Array.isArray(input.records))
    throw new Error("metrics requires schemaVersion=1 and records");
  const seen = new Set();
  const rows = input.records.map((r) => {
    if (
      typeof r.contentId !== "string" ||
      !r.contentId ||
      !["bili", "douyin", "xhs"].includes(r.platform)
    )
      throw new Error("Invalid content/platform");
    const key = `${r.contentId}:${r.platform}:${r.observedAt}`;
    if (seen.has(key)) throw new Error("Duplicate observation");
    seen.add(key);
    const published = Date.parse(r.publishedAt),
      observed = Date.parse(r.observedAt);
    if (
      !Number.isFinite(published) ||
      !Number.isFinite(observed) ||
      observed < published ||
      ![r.publishedAt, r.observedAt].every((s) =>
        /(?:Z|[+-]\d{2}:\d{2})$/.test(s),
      )
    )
      throw new Error("Invalid observation dates/timezone");
    if (
      !r.source?.path ||
      !r.source?.definition ||
      isAbsolute(r.source.path) ||
      relative(project, resolve(project, r.source.path)).startsWith("..") ||
      !existsSync(resolve(project, r.source.path))
    )
      throw new Error(
        "Metrics need an existing raw source and counting definition",
      );
    const m = r.metrics ?? {},
      p = r.production ?? {};
    for (const v of [...Object.values(m), ...Object.values(p)])
      if (v !== null && v !== undefined && !number(v))
        throw new Error("Metrics/cost must be non-negative numbers or null");
    return {
      contentId: r.contentId,
      series: r.series ?? "",
      platform: r.platform,
      observedAt: r.observedAt,
      windowHours: (observed - published) / 3600000,
      views: m.views ?? null,
      clickRate: ratio(m.clicks, m.impressions),
      completionRate: ratio(m.completions, m.views),
      averageWatchSeconds: ratio(m.watchSeconds, m.views),
      followersPerThousandViews:
        ratio(m.followers, m.views) === null
          ? null
          : ratio(m.followers, m.views) * 1000,
      viewsPerProductionMinute: ratio(m.views, p.minutes),
      productionMinutes: p.minutes ?? null,
      revisions: p.revisions ?? null,
      source: r.source,
    };
  });
  return {
    schemaVersion: 1,
    records: rows,
    status: rows.length ? "observed-data" : "no-published-data",
    comparisonRule:
      "Compare within platform, series, counting definition and observation window; no causal conclusion is generated.",
  };
}
export function writeReview(project) {
  project = resolve(project);
  const report = reviewMetrics(
    JSON.parse(readFileSync(join(project, "metrics.json"), "utf8")),
    project,
  );
  const dir = join(project, "review");
  mkdirSync(dir, { recursive: true });
  const pct = (v) => (v === null ? "未提供" : `${(v * 100).toFixed(1)}%`),
    val = (v) => (v === null ? "未提供" : Number(v.toFixed(2)));
  const lines = [
    "# 内容复盘",
    "",
    report.records.length
      ? "以下数值来自已登记来源，按平台与观察窗口对照。"
      : "尚无真实发布数据；未生成效果结论。",
    "",
    "| 作品 | 平台 | 观察小时 | 观看 | 点击率 | 完播率 | 制作分钟 |",
    "|---|---|---:|---:|---:|---:|---:|",
    ...report.records.map(
      (r) =>
        `| ${r.contentId.replace(/\|/g, "/")} | ${r.platform} | ${val(r.windowHours)} | ${val(r.views)} | ${pct(r.clickRate)} | ${pct(r.completionRate)} | ${val(r.productionMinutes)} |`,
    ),
    "",
    "下一步人工填写：同系列对照、可能原因、下一条只验证的一个改动。缺失数值不按零处理。",
    "",
  ];
  writeFileSync(
    join(dir, "summary.json"),
    JSON.stringify(report, null, 2) + "\n",
  );
  writeFileSync(join(dir, "review.md"), lines.join("\n"), "utf8");
  return report;
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  try {
    const i = process.argv.indexOf("--project");
    console.log(
      JSON.stringify(writeReview(i >= 0 ? process.argv[i + 1] : "."), null, 2),
    );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
