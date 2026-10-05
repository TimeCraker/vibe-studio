#!/usr/bin/env node
// cues.ts 渲染前校验器（数据契约 lint）：字幕时长/重叠/负值、圈注与数据柱 1920x1080 设计坐标越界、
// 必填字段与类型、cue 时间窗超出总时长。规则分级：ERROR 计错退出 1，WARN 只打印不计错。
// 总时长来源：footage-params.ts 的 durationInFrames/fps（探针产物），退回 deck-params.ts 的
// totalSeconds（deck 派生链）；拿不到时跳过时长窗口类规则并 WARN，不臆造总长。
// Usage: node scripts/verify-cues.mjs [cues.ts] [params.ts]
//   cues.ts   缺省 <remotion-app>/src/cues.ts
//   params.ts 缺省自动找 src/footage-params.ts -> src/deck-params.ts；显式传入时文件必须存在
// 退出码：0 = 无 ERROR / 1 = 有 ERROR / 2 = 无法运行（文件缺失、加载失败）
// 零依赖：优先 Node 原生 TS 直载（>=22.6）；失败时若本地 node_modules/esbuild 在则转译兜底；
// 两者皆败报 FATAL——本工具不 npm install。
// 注：Node 对模板 package.json（无 "type" 字段）会向 stderr 打一条 MODULE_TYPELESS_PACKAGE_JSON
// 提示，属 Node 自身噪音且进程内无法抑制（已实测 warning listener 不拦截默认打印）；判定输出全在 stdout。
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const DESIGN_W = 1920; // cues 统一按 1080p 设计坐标书写（FootageOverlay 内置缩放适配任意画布）
const DESIGN_H = 1080;
const MAX_SUBTITLE_SECONDS = 2; // SKILL.md Step 1：每条字幕 <=2s
const EPS = 1e-6;
const SPOT_KINDS = new Set(["circle", "arrow", "box"]);

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const cuesPath = process.argv[2] ? resolve(process.argv[2]) : join(root, "src", "cues.ts");
const argParams = process.argv[3];
// 链条配对（不跨链）：deck-cues.ts 属 deck 派生链（deck-params.ts 供时长、deckCues 导出、
// 字幕时长由音频派生不受 2s 上限）；其余（cues.ts）按 footage 链配 footage-params.ts。
// 模板同时内置两条链的 demo，时长跨链取必误报（30.5s 素材 cues 对 8.4s deck 总长）。
const isDeckChain = basename(cuesPath) === "deck-cues.ts";

const findings = [];
const err = (rule, loc, msg) => findings.push({ level: "ERROR", rule, loc, msg });
const warn = (rule, loc, msg) => findings.push({ level: "WARN", rule, loc, msg });
const fatal = (msg) => {
  console.error(`[FATAL] ${msg}`);
  process.exit(2);
};

const isNum = (v) => typeof v === "number" && Number.isFinite(v);
const isObj = (v) => typeof v === "object" && v !== null && !Array.isArray(v);
const typeName = (v) => (Array.isArray(v) ? "array" : v === null ? "null" : typeof v);
const f2 = (n) => String(Math.round(n * 100) / 100);

// ---- TS 加载：原生直载优先，本地 esbuild 兜底（输出纯 ASCII，cue 文本永不入输出，GBK 控制台安全）----
async function importTs(tsPath) {
  try {
    return await import(pathToFileURL(tsPath).href);
  } catch (nativeErr) {
    const esbuild = loadEsbuild();
    if (!esbuild) throw nativeErr;
    const js = esbuild.transformSync(readFileSync(tsPath, "utf8"), {
      loader: "ts",
    }).code;
    const dir = mkdtempSync(join(tmpdir(), "verify-cues-"));
    writeFileSync(join(dir, "mod.mjs"), js);
    try {
      return await import(pathToFileURL(join(dir, "mod.mjs")).href);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }
}

function loadEsbuild() {
  const require = createRequire(import.meta.url);
  for (const p of [join(root, "node_modules", "esbuild"), "esbuild"]) {
    try {
      return require(p);
    } catch {
      // try next candidate
    }
  }
  return null;
}

// ---- 字段检查小件 ----
function checkNumber(loc, obj, field, { positive = false } = {}) {
  const v = obj[field];
  if (v === undefined) {
    err("field", loc, `${field} is required`);
    return undefined;
  }
  if (!isNum(v)) {
    err("field", loc, `${field} must be a finite number, got ${typeName(v)}`);
    return undefined;
  }
  if (positive && v <= 0) {
    err("field", loc, `${field} must be > 0, got ${v}`);
    return undefined;
  }
  return v;
}

function checkString(loc, obj, field, { required = true, nonEmpty = true } = {}) {
  const v = obj[field];
  if (v === undefined) {
    if (required) err("field", loc, `${field} is required`);
    return undefined;
  }
  if (typeof v !== "string") {
    err("field", loc, `${field} must be a string, got ${typeName(v)}`);
    return undefined;
  }
  if (nonEmpty && v.trim() === "") {
    err("field", loc, `${field} must be non-empty`);
    return undefined;
  }
  return v;
}

// ---- 总时长解析（可得知才查时长窗口类规则）----
if (!existsSync(cuesPath)) fatal(`cues file not found: ${cuesPath}`);

const paramsDefault = join(root, "src", isDeckChain ? "deck-params.ts" : "footage-params.ts");
let duration = null;
let durationWhy = `${basename(paramsDefault)} not found`;
const paramsCandidates = argParams
  ? [{ path: resolve(argParams), explicit: true }]
  : [{ path: paramsDefault, explicit: false }];
for (const cand of paramsCandidates) {
  if (!existsSync(cand.path)) {
    if (cand.explicit) fatal(`params file not found: ${cand.path}`);
    continue;
  }
  let mod;
  try {
    mod = await importTs(cand.path);
  } catch (e) {
    if (cand.explicit) fatal(`cannot load ${cand.path}: ${e.message}`);
    warn("duration-unknown", "-", `cannot load ${basename(cand.path)}: ${e.message}`);
    durationWhy = `${basename(cand.path)} not loadable`;
    continue;
  }
  const fp = mod.footageParams;
  if (isNum(fp?.durationInFrames) && isNum(fp?.fps) && fp.fps > 0) {
    duration = {
      seconds: fp.durationInFrames / fp.fps,
      source: `${basename(cand.path)} durationInFrames=${fp.durationInFrames} fps=${fp.fps}`,
    };
    break;
  }
  const dp = mod.deckParams;
  if (isNum(dp?.totalSeconds)) {
    duration = {
      seconds: dp.totalSeconds,
      source: `${basename(cand.path)} totalSeconds=${dp.totalSeconds}`,
    };
    break;
  }
  durationWhy = `${basename(cand.path)} lacks durationInFrames/fps or totalSeconds`;
}
if (!duration) {
  warn("duration-unknown", "-", `${durationWhy} -> beyond-total rules skipped`);
}

// ---- cues 加载 ----
let cuesMod;
try {
  cuesMod = await importTs(cuesPath);
} catch (e) {
  fatal(
    `cannot load ${cuesPath}: ${e.message} ` +
      "(native TS import failed and no local esbuild; this tool never npm installs)",
  );
}

function sectionOf(obj, name) {
  const arr = obj[name];
  if (arr === undefined) {
    err("field", `cues.${name}`, "required array is missing");
    return [];
  }
  if (!Array.isArray(arr)) {
    err("field", `cues.${name}`, `must be an array, got ${typeName(arr)}`);
    return [];
  }
  return arr;
}

let subtitles, dataBars, spotlights;
if (isDeckChain) {
  const dc = cuesMod.deckCues;
  if (!Array.isArray(dc)) fatal(`expected 'deckCues' array export in ${cuesPath}, got ${typeName(dc)}`);
  subtitles = dc;
  dataBars = [];
  spotlights = [];
} else {
  const cues = cuesMod.cues;
  if (!isObj(cues)) fatal(`no usable 'cues' export in ${cuesPath} (got ${typeName(cues)})`);
  subtitles = sectionOf(cues, "subtitles");
  dataBars = sectionOf(cues, "dataBars");
  spotlights = sectionOf(cues, "spotlights");
}

// ---- 字幕 ----
for (let i = 0; i < subtitles.length; i++) {
  const c = subtitles[i];
  const loc = `subtitles[${i}]`;
  if (!isObj(c)) {
    err("field", loc, `must be an object, got ${typeName(c)}`);
    continue;
  }
  const start = checkNumber(loc, c, "start");
  const end = checkNumber(loc, c, "end");
  checkString(loc, c, "text");
  if (start === undefined || end === undefined) continue;
  if (start < 0 || end < 0)
    err("subtitle-negative", loc, `start=${f2(start)} end=${f2(end)}; both must be >= 0`);
  if (end <= start) {
    err("subtitle-order", loc, `end=${f2(end)} must be after start=${f2(start)}`);
  } else {
    // 2s 上限是 footage 剧本设计规则（SKILL.md Step 1）；deck 字幕按时长由页音频派生，不设上限
    if (!isDeckChain && end - start > MAX_SUBTITLE_SECONDS + EPS)
      err("subtitle-duration", loc, `duration ${f2(end - start)}s exceeds ${MAX_SUBTITLE_SECONDS}s`);
    if (duration && end > duration.seconds + EPS)
      err("subtitle-beyond-total", loc, `end=${f2(end)}s exceeds total ${f2(duration.seconds)}s`);
  }
}

// 时间重叠：按 start 排序扫描，滚动 max end——链式重叠（A 压 B、B 压 C）也能全部查出
const timed = [];
subtitles.forEach((c, i) => {
  if (isObj(c) && isNum(c.start) && isNum(c.end)) timed.push({ i, start: c.start, end: c.end });
});
timed.sort((a, b) => a.start - b.start || a.i - b.i);
let maxEnd = -Infinity;
let maxIdx = -1;
for (const c of timed) {
  if (maxIdx >= 0 && c.start < maxEnd - EPS)
    err("subtitle-overlap", `subtitles[${c.i}]`, `start=${f2(c.start)}s before subtitles[${maxIdx}] end=${f2(maxEnd)}s`);
  if (c.end > maxEnd) {
    maxEnd = c.end;
    maxIdx = c.i;
  }
}

// 完全相同的字幕文本
const byText = new Map();
subtitles.forEach((c, i) => {
  if (isObj(c) && typeof c.text === "string" && c.text.trim() !== "") {
    const list = byText.get(c.text) ?? [];
    list.push(i);
    byText.set(c.text, list);
  }
});
for (const idx of byText.values()) {
  if (idx.length > 1)
    warn(
      "subtitle-duplicate-text",
      idx.map((i) => `subtitles[${i}]`).join(","),
      `identical text appears ${idx.length} times`,
    );
}

// ---- 数据柱 ----
for (let i = 0; i < dataBars.length; i++) {
  const g = dataBars[i];
  const loc = `dataBars[${i}]`;
  if (!isObj(g)) {
    err("field", loc, `must be an object, got ${typeName(g)}`);
    continue;
  }
  const t = checkNumber(loc, g, "t");
  const x = checkNumber(loc, g, "x");
  const y = checkNumber(loc, g, "y");
  if (g.scale !== undefined) checkNumber(loc, g, "scale", { positive: true });
  if (!Array.isArray(g.bars) || g.bars.length === 0)
    err("field", loc, `bars must be a non-empty array, got ${Array.isArray(g.bars) ? "0 items" : typeName(g.bars)}`);
  else
    for (let j = 0; j < g.bars.length; j++) {
      const b = g.bars[j];
      const bloc = `${loc}.bars[${j}]`;
      if (!isObj(b)) {
        err("field", bloc, `must be an object, got ${typeName(b)}`);
        continue;
      }
      checkString(bloc, b, "label");
      checkNumber(bloc, b, "value");
      if (b.unit !== undefined) checkString(bloc, b, "unit", { nonEmpty: false });
      if (b.color !== undefined) checkString(bloc, b, "color", { nonEmpty: false });
    }
  if (x !== undefined && y !== undefined && (x < 0 || y < 0 || x > DESIGN_W || y > DESIGN_H))
    err("databar-coords", loc, `anchor x=${f2(x)} y=${f2(y)} outside ${DESIGN_W}x${DESIGN_H} design space`);
  if (t !== undefined && duration && t > duration.seconds + EPS)
    err("databar-beyond-total", loc, `t=${f2(t)}s exceeds total ${f2(duration.seconds)}s`);
}

// ---- 圈注 ----
for (let i = 0; i < spotlights.length; i++) {
  const s = spotlights[i];
  const loc = `spotlights[${i}]`;
  if (!isObj(s)) {
    err("field", loc, `must be an object, got ${typeName(s)}`);
    continue;
  }
  const t = checkNumber(loc, s, "t");
  const ttl = checkNumber(loc, s, "ttl", { positive: true });
  if (typeof s.kind !== "string" || !SPOT_KINDS.has(s.kind))
    err(
      "field",
      loc,
      `kind must be circle|arrow|box, got ${typeof s.kind === "string" ? `string(len=${s.kind.length})` : typeName(s.kind)}`,
    );
  const x = checkNumber(loc, s, "x");
  const y = checkNumber(loc, s, "y");
  const w = checkNumber(loc, s, "w");
  const h = checkNumber(loc, s, "h");
  if (s.text !== undefined) checkString(loc, s, "text", { nonEmpty: false });
  if (
    [x, y, w, h].every((v) => v !== undefined) &&
    (x < 0 || y < 0 || w < 0 || h < 0 || x + w > DESIGN_W + EPS || y + h > DESIGN_H + EPS)
  )
    err("spotlight-coords", loc, `x=${f2(x)} y=${f2(y)} w=${f2(w)} h=${f2(h)} exceeds ${DESIGN_W}x${DESIGN_H} design space`);
  if (s.kind === "arrow" && h !== undefined && h !== 0)
    warn("spotlight-arrow-h", loc, `kind=arrow expects h=0 (w is arrow length), got h=${f2(h)}`);
  if (t !== undefined && ttl !== undefined && duration && t + ttl > duration.seconds + EPS)
    err("spotlight-beyond-total", loc, `t+ttl=${f2(t + ttl)}s exceeds total ${f2(duration.seconds)}s`);
}

// ---- 输出（纯 ASCII；定位只用数组下标，cue 文本不入输出）----
console.log(`verify-cues: ${cuesPath}`);
console.log(
  duration
    ? `duration: ${f2(duration.seconds)}s (${duration.source})`
    : "duration: unknown -> beyond-total rules skipped",
);
for (const f of findings) console.log(`[${f.level}] ${f.rule} ${f.loc} ${f.msg}`);
const nErr = findings.filter((f) => f.level === "ERROR").length;
const nWarn = findings.length - nErr;
if (findings.length > 0) console.log("--------");
console.log(
  `${nErr > 0 ? "FAIL" : "PASS"}: ${nErr} error(s), ${nWarn} warning(s) ` +
    `(chain=${isDeckChain ? "deck" : "footage"} subtitles=${subtitles.length} dataBars=${dataBars.length} spotlights=${spotlights.length})`,
);
process.exitCode = nErr > 0 ? 1 : 0;
