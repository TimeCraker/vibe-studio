const pptxgen = require("pptxgenjs");

const p = new pptxgen();
p.layout = "LAYOUT_WIDE"; // 13.33 x 7.5
p.author = "TimeCraker";
p.title = "AsterForge 个人项目产品图景与未来规划";

const W = 13.33, H = 7.5, M = 0.55;
// 色板：AsterForge 铜色系（取自主站品牌色 cc785c）
const INK = "231D16";      // 深墨（暗页背景 / 标题）
const BG = "FFFFFF";       // 亮页背景
const PAPER = "F6F2EC";    // 暖纸白 tint（卡片底，仅作 tint）
const ACCENT = "C0754A";   // 铜 — 唯一强调色
const TEXT = "2B2620";
const MUTED = "8A8177";
const LINE = "D8D1C7";
const F = "微软雅黑";

const T = (s, txt, o) => s.addText(txt, Object.assign({ fontFace: F, color: TEXT, margin: 0 }, o));
const hairline = (s, x, y, w, color = LINE) =>
  s.addShape(p.shapes.LINE, { x, y, w, h: 0, line: { color, width: 0.75 } });
const pageNum = (s, n) =>
  T(s, String(n).padStart(2, "0"), { x: W - 0.95, y: H - 0.48, w: 0.4, h: 0.3, fontSize: 11, color: MUTED, align: "right" });

/* ---------- 1 封面（暗） ---------- */
let s = p.addSlide();
s.background = { color: INK };
s.addShape(p.shapes.LINE, { x: M, y: 1.15, w: W - 2 * M, h: 0, line: { color: "4A4137", width: 0.75 } });
T(s, "ASTERFORGE · TIMECRAKER STUDIO", { x: M, y: 0.72, w: 8, h: 0.35, fontSize: 13, color: ACCENT, charSpacing: 4, bold: true });
T(s, "一个人的产品矩阵", { x: M, y: 2.0, w: 11, h: 1.2, fontSize: 60, color: "FFFFFF", bold: true });
T(s, "个人项目产品图景与未来规划", { x: M, y: 3.35, w: 11, h: 0.6, fontSize: 26, color: "CFC6BA" });
T(s, [
  { text: "AI 时代独立架构师", options: { color: ACCENT, bold: true } },
  { text: " —— 从 AI 工具、实时游戏到社区服务，一个人把设计、开发、部署、运营跑成完整闭环。", options: { color: "9C938A" } },
], { x: M, y: 4.35, w: 9.6, h: 0.9, fontSize: 16, fontFace: F, margin: 0 });
// 底部四个关键数字
const stats = [["6", "在线产品线"], ["17", "生产服务常驻"], ["9", "SSL 域名证书"], ["1", "台腾讯云单机"]];
stats.forEach((st, i) => {
  const x = M + i * 2.6;
  T(s, st[0], { x, y: 5.75, w: 2.2, h: 0.85, fontSize: 48, color: ACCENT, bold: true });
  T(s, st[1], { x, y: 6.62, w: 2.2, h: 0.35, fontSize: 13, color: "9C938A" });
});
s.addNotes("开场：一句话定位——独立开发者，一个人维护一套完整的产品矩阵。下面 10 页分三段：现状图景、每条产品线、未来规划。");

/* ---------- 2 图景总览（示意图） ---------- */
s = p.addSlide();
s.background = { color: BG };
T(s, "产品图景总览", { x: M, y: 0.45, w: 9, h: 0.65, fontSize: 36, color: INK, bold: true });
T(s, "一个品牌底座（AsterForge），四条产品线各司其职：商业主力打收入，场景产品打用户，技术旗舰打能力，基建底座打效率。", { x: M, y: 1.15, w: 12.2, h: 0.4, fontSize: 14, color: MUTED });
// 中心品牌轴
s.addShape(p.shapes.ROUNDED_RECTANGLE, { x: 4.62, y: 2.0, w: 4.1, h: 1.05, rectRadius: 0.08, fill: { color: INK } });
T(s, "ASTERFORGE", { x: 4.62, y: 2.14, w: 4.1, h: 0.45, fontSize: 22, color: "FFFFFF", bold: true, align: "center", charSpacing: 3 });
T(s, "asterforge.top · 独立 AI 系统工作室", { x: 4.62, y: 2.58, w: 4.1, h: 0.32, fontSize: 12, color: ACCENT, align: "center" });
// 四条产品线卡片
const lines = [
  ["01", "商业主力", "ResumeAIX", "AI 简历生成平台，功能冻结、接入正式支付", "收入"],
  ["02", "场景产品", "LeKao · 小饭桌", "AI 助教工作台 + 社区点餐，已上线真实用户", "用户"],
  ["03", "技术旗舰", "AsterNova", "Go 60Hz 权威裁决的实时联机动作游戏", "能力"],
  ["04", "基建底座", "Deploy · Studio", "17 服务单机部署 + 内容工厂 + 开源工具", "效率"],
];
lines.forEach((L, i) => {
  const x = M + i * 3.13, y = 3.55, w = 2.93, h = 3.05;
  s.addShape(p.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.06, fill: { color: PAPER } });
  T(s, L[0], { x: x + 0.25, y: y + 0.22, w: 1.2, h: 0.6, fontSize: 30, color: ACCENT, bold: true });
  T(s, L[1], { x: x + 0.25, y: y + 0.92, w: w - 0.5, h: 0.35, fontSize: 14, color: MUTED, bold: true });
  T(s, L[2], { x: x + 0.25, y: y + 1.28, w: w - 0.5, h: 0.45, fontSize: 19, color: INK, bold: true });
  hairline(s, x + 0.25, y + 1.85, w - 0.5);
  T(s, L[3], { x: x + 0.25, y: y + 2.0, w: w - 0.5, h: 0.75, fontSize: 12.5, color: TEXT });
  T(s, L[4], { x: x + 0.25, y: y + h - 0.5, w: w - 0.5, h: 0.32, fontSize: 12, color: ACCENT, bold: true });
});
pageNum(s, 2);
s.addNotes("讲法：不是一堆散项目，而是一个分工明确的矩阵。每条线一句话带过，后面各有一页展开。");

/* ---------- 3 ResumeAIX（商业主力） ---------- */
s = p.addSlide();
s.background = { color: BG };
T(s, "商业主力 · ResumeAIX", { x: M, y: 0.45, w: 9, h: 0.65, fontSize: 36, color: INK, bold: true });
T(s, "AI 驱动的智能简历生成平台 · 面向国内求职者", { x: M, y: 1.15, w: 10, h: 0.4, fontSize: 15, color: MUTED });
// 左侧五步流水线
T(s, "AI Pipeline · 5 分钟出成品", { x: M, y: 1.95, w: 6, h: 0.4, fontSize: 16, color: INK, bold: true });
const steps = ["上传旧简历 / 对话描述", "AI 结构化解析", "STAR 法则重写", "JD 匹配 + ATS 评分", "Puppeteer 渲染 PDF"];
steps.forEach((t, i) => {
  const y = 2.5 + i * 0.82;
  s.addShape(p.shapes.OVAL, { x: M, y: y, w: 0.52, h: 0.52, fill: { color: i === 4 ? ACCENT : INK } });
  T(s, String(i + 1), { x: M, y: y + 0.02, w: 0.52, h: 0.48, fontSize: 18, color: "FFFFFF", bold: true, align: "center" });
  T(s, t, { x: M + 0.75, y: y + 0.08, w: 4.6, h: 0.4, fontSize: 15, color: TEXT, valign: "middle" });
  if (i < 4) s.addShape(p.shapes.LINE, { x: M + 0.26, y: y + 0.52, w: 0, h: 0.3, line: { color: LINE, width: 1 } });
});
// 右侧信息
s.addShape(p.shapes.ROUNDED_RECTANGLE, { x: 6.5, y: 1.95, w: 6.28, h: 2.5, rectRadius: 0.06, fill: { color: PAPER } });
T(s, "产品亮点", { x: 6.8, y: 2.15, w: 5, h: 0.35, fontSize: 14, color: ACCENT, bold: true });
const bu = () => ({ code: "25B8", indent: 12 });
s.addText([
  { text: "多格式输入：PDF / DOCX / TXT / 图片均可解析", options: { bullet: bu(), breakLine: true } },
  { text: "ATS 评分优化，产出即投递标准", options: { bullet: bu(), breakLine: true } },
  { text: "所见即所得的专业 PDF 模板渲染", options: { bullet: bu() } },
], { x: 6.8, y: 2.55, w: 5.7, h: 1.7, fontSize: 14.5, fontFace: F, color: TEXT, paraSpaceAfter: 10, margin: 0 });
s.addShape(p.shapes.ROUNDED_RECTANGLE, { x: 6.5, y: 4.7, w: 6.28, h: 1.85, rectRadius: 0.06, fill: { color: INK } });
T(s, "当前阶段", { x: 6.8, y: 4.92, w: 5, h: 0.35, fontSize: 14, color: ACCENT, bold: true });
T(s, [
  { text: "功能冻结", options: { bold: true, color: "FFFFFF" } },
  { text: "—— 只修 Bug、接正式支付。技术栈：Next.js 16 + Fastify 5 + Prisma 6 + PostgreSQL + Redis + Docker。", options: { color: "CFC6BA" } },
], { x: 6.8, y: 5.32, w: 5.7, h: 1.0, fontSize: 14.5, fontFace: F, margin: 0 });
pageNum(s, 3);
s.addNotes("唯一被明确定义为『商业主力』的产品：功能已冻结进入收尾，下一步就是支付闭环。这一页讲流水线的完整性和『只差变现』的现状。");

/* ---------- 4 场景产品：LeKao + 小饭桌 ---------- */
s = p.addSlide();
s.background = { color: BG };
T(s, "场景产品 · 已上线，真实用户在用", { x: M, y: 0.45, w: 11, h: 0.65, fontSize: 36, color: INK, bold: true });
T(s, "两条垂直场景：一个解放助教的重复劳动，一个让社区小生意先跑起来。", { x: M, y: 1.15, w: 11.5, h: 0.4, fontSize: 14, color: MUTED });
const duo = [
  {
    x: M, name: "LeKao · AI 智能助教助手", url: "lekao.asterforge.top",
    rows: [
      ["用户", "K12 培训机构助教 / 学管 / 班主任"],
      ["核心", "讲义图片 → 课堂小结 + 逐题反馈 + 全班错题 Word"],
      ["价值", "每次课省 1–2 小时抄写与撰写时间"],
      ["模式", "完全免费，T-Coin 签到体系，Qwen3-VL + DeepSeek 双模型"],
    ],
  },
  {
    x: M + 6.35, name: "小饭桌 · 社区家庭厨房点餐", url: "xiaofanzhuo.asterforge.top",
    rows: [
      ["用户", "宝妈小饭桌商家 + 社区家长"],
      ["核心", "链接即点餐，口令登录管理菜单与订单"],
      ["价值", "零成本上线，微信私信收款 + 订单快照核对"],
      ["现状", "2026-08-23 部署上线，74 条测试用例，常驻仅 110MB"],
    ],
  },
];
duo.forEach((c) => {
  s.addShape(p.shapes.ROUNDED_RECTANGLE, { x: c.x, y: 1.8, w: 5.88, h: 4.85, rectRadius: 0.06, fill: { color: PAPER } });
  T(s, c.name, { x: c.x + 0.35, y: 2.05, w: 5.2, h: 0.42, fontSize: 19, color: INK, bold: true });
  T(s, c.url, { x: c.x + 0.35, y: 2.5, w: 5.2, h: 0.3, fontSize: 12, color: ACCENT, bold: true });
  hairline(s, c.x + 0.35, 2.92, 5.18);
  c.rows.forEach((r, i) => {
    const y = 3.1 + i * 0.88;
    T(s, r[0], { x: c.x + 0.35, y, w: 0.85, h: 0.35, fontSize: 12.5, color: ACCENT, bold: true });
    T(s, r[1], { x: c.x + 1.25, y, w: 4.3, h: 0.8, fontSize: 13, color: TEXT });
  });
});
pageNum(s, 4);
s.addNotes("两个产品共同点：都是小切口、真需求、已部署、有真实用户。LeKao 免费打口碑聚用户，小饭桌验证最小商业闭环。");

/* ---------- 4.5 线上实证 ---------- */
s = p.addSlide();
s.background = { color: BG };
T(s, "线上实证 · 打开就能用", { x: M, y: 0.45, w: 10, h: 0.65, fontSize: 36, color: INK, bold: true });
T(s, "以下均为生产环境实拍截图（2026-08），非设计稿。", { x: M, y: 1.15, w: 10, h: 0.4, fontSize: 14, color: MUTED });
const shots = [
  ["shots/home.png", "AsterForge 主站", "asterforge.top", "项目叙事 · 接单入口 · 投票看板"],
  ["shots/lekao.png", "LeKao 助教工作台", "lekao.asterforge.top", "错题本一键生成 · 免费 T-Coin"],
  ["shots/game.png", "AsterNova 竞技场", "asterforge.top/projects/game", "60Hz 权威同步 · 2000+ 玩家 · LIVE"],
];
shots.forEach((sh, i) => {
  const x = M + i * 4.14, w = 3.94, imgH = 2.46, y = 1.75;
  s.addImage({ path: sh[0], x, y, w, h: imgH, sizing: { type: "cover", w, h: imgH } });
  s.addShape(p.shapes.RECTANGLE, { x, y, w, h: imgH, fill: { type: "none" }, line: { color: LINE, width: 1 } });
  T(s, sh[1], { x, y: y + imgH + 0.18, w, h: 0.38, fontSize: 16, color: INK, bold: true });
  T(s, sh[2], { x, y: y + imgH + 0.58, w, h: 0.32, fontSize: 12.5, color: ACCENT, bold: true });
  T(s, sh[3], { x, y: y + imgH + 0.92, w, h: 0.35, fontSize: 12.5, color: MUTED });
});
hairline(s, M, 6.35, W - 2 * M);
T(s, [
  { text: "小饭桌", options: { bold: true, color: INK } },
  { text: "（xiaofanzhuo.asterforge.top）已上线并完成 HTTPS + 自动续签，当前商家未上架菜品，截图略。", options: { color: TEXT } },
], { x: M, y: 6.6, w: 12.2, h: 0.45, fontSize: 13, fontFace: F, margin: 0 });
pageNum(s, 5);
s.addNotes("这一页是证据页：所有产品不是 PPT 里的概念，浏览器输入网址就能打开。AsterNova 已有 2000+ 玩家、RTT<30ms。");

/* ---------- 5 AsterNova（技术旗舰） ---------- */
s = p.addSlide();
s.background = { color: INK };
T(s, "技术旗舰 · AsterNova", { x: M, y: 0.45, w: 9, h: 0.65, fontSize: 36, color: "FFFFFF", bold: true });
T(s, [{ text: "服务端权威的实时联机动作游戏 · ", options: { color: "9C938A" } }, { text: "“Feel the impact, not the latency.”", options: { color: ACCENT, italic: true } }], { x: M, y: 1.15, w: 12, h: 0.4, fontSize: 15, fontFace: F, margin: 0 });
// 中央 60Hz 大数字
T(s, "60Hz", { x: M, y: 1.9, w: 4.2, h: 1.35, fontSize: 84, color: ACCENT, bold: true });
T(s, "服务器以固定频率裁决全部物理：客户端零预测，也没有作弊面", { x: M, y: 3.3, w: 4.0, h: 0.8, fontSize: 13.5, color: "CFC6BA" });
// 右侧架构三铁律
const laws = [
  ["后端独占裁决权", "battle 服务跑纯数学物理（矢量 / 碰撞盒 / 状态机），客户端只上报输入、插值渲染快照"],
  ["Web 是外壳不是通道", "WASM 引擎直连后端 WebSocket，绕过 Web 层 HTTP 限制；JSBridge 双通道注入 JWT"],
  ["一套协议三端共享", "同一份 game.proto 驱动 Web / Godot→WASM / Unity→WebGL，改协议三端同步"],
];
laws.forEach((L, i) => {
  const y = 1.95 + i * 1.45;
  T(s, "0" + (i + 1), { x: 5.3, y, w: 0.9, h: 0.6, fontSize: 26, color: ACCENT, bold: true });
  T(s, L[0], { x: 6.3, y: y + 0.03, w: 6.4, h: 0.4, fontSize: 17, color: "FFFFFF", bold: true });
  T(s, L[1], { x: 6.3, y: y + 0.45, w: 6.4, h: 0.75, fontSize: 13, color: "9C938A" });
  if (i < 2) s.addShape(p.shapes.LINE, { x: 5.3, y: y + 1.25, w: 7.4, h: 0, line: { color: "4A4137", width: 0.75 } });
});
// 底部打击感细节
s.addShape(p.shapes.LINE, { x: M, y: 6.15, w: W - 2 * M, h: 0, line: { color: "4A4137", width: 0.75 } });
T(s, [
  { text: "打击感做进引擎里：", options: { bold: true, color: "FFFFFF" } },
  { text: "普攻命中 0.08s、拼刀 0.15s 的 Hit-Stop 卡肉 + 衰减式屏幕震动 · 在线试玩 asterforge.top/game", options: { color: "9C938A" } },
], { x: M, y: 6.38, w: 12.2, h: 0.5, fontSize: 14, fontFace: F, margin: 0 });
pageNum(s, 6);
s.addNotes("这条线的价值不是流量，是能力证明：实时网络同步、权威服务器架构、三端协议统一——这是接企业级订单时的技术背书。");

/* ---------- 6 基建底座 ---------- */
s = p.addSlide();
s.background = { color: BG };
T(s, "基建底座 · 一台服务器撑起整个矩阵", { x: M, y: 0.45, w: 11.5, h: 0.65, fontSize: 36, color: INK, bold: true });
const infra = [
  ["17", "常驻服务", "systemd + cgroup v2 监控，R56 巡检入库"],
  ["9", "SSL 证书", "nginx 反代 + 自动续签，HTTPS 全覆盖"],
  ["1", "腾讯云单机", "阿里云双机架构已废弃，全部迁入单机"],
];
infra.forEach((it, i) => {
  const x = M + i * 4.15;
  T(s, it[0], { x, y: 1.5, w: 3.8, h: 1.1, fontSize: 72, color: ACCENT, bold: true });
  T(s, it[1], { x, y: 2.68, w: 3.8, h: 0.4, fontSize: 17, color: INK, bold: true });
  T(s, it[2], { x, y: 3.1, w: 3.7, h: 0.65, fontSize: 13, color: MUTED });
});
hairline(s, M, 4.05, W - 2 * M);
// 底部三件套
const tools = [
  ["asterforge-deploy", "生产环境唯一权威部署手册：备份、迁移、故障排查、Schema 规范全部文档化，可重建可审计"],
  ["my-portfolio 主站", "asterforge.top 对外门面：项目叙事、接单入口、无登录投票看板 + 自建管理后台热更新"],
  ["vibe-studio 内容工厂", "Skills + Workflows 沉淀内容生产力：代码画 PPT、去 AI 腔 humanizer，deck → 视频成片的流水线"],
];
tools.forEach((t, i) => {
  const x = M + i * 4.15;
  T(s, t[0], { x, y: 4.3, w: 3.8, h: 0.4, fontSize: 16, color: INK, bold: true });
  T(s, t[1], { x, y: 4.75, w: 3.7, h: 1.7, fontSize: 13, color: TEXT });
});
pageNum(s, 7);
s.addNotes("基建是被低估的护城河：任何一台新机器都能按手册在几小时内重建整个矩阵。vibe-studio 则把『做内容』本身也产品化了。");

/* ---------- 7 生产力飞轮（dsh-claude-import + vibe-studio 方法论） ---------- */
s = p.addSlide();
s.background = { color: BG };
T(s, "生产力飞轮 · 用工具造工具", { x: M, y: 0.45, w: 10, h: 0.65, fontSize: 36, color: INK, bold: true });
T(s, "独立开发的天花板是时间。解法不是加班，是把重复劳动沉淀成可复跑的系统。", { x: M, y: 1.15, w: 11.5, h: 0.4, fontSize: 14, color: MUTED });
// 飞轮：三步环
const wheel = [
  ["沉淀", "每个项目的方法论写成 Skill：17 种页面范式、去 AI 腔改写体系"],
  ["复用", "下一个项目直接调用：deck、文案、部署、测试全部模板化"],
  ["开源", "dsh-claude-import 把配置资产导入工具开源，反哺社区与个人品牌"],
];
wheel.forEach((st, i) => {
  const x = M + i * 4.15, y = 2.1;
  s.addShape(p.shapes.OVAL, { x: x + 1.35, y, w: 1.1, h: 1.1, fill: { color: i === 2 ? ACCENT : INK } });
  T(s, st[0], { x: x + 1.35, y: y + 0.28, w: 1.1, h: 0.5, fontSize: 18, color: "FFFFFF", bold: true, align: "center" });
  T(s, st[1], { x: x + 0.1, y: y + 1.4, w: 3.6, h: 1.2, fontSize: 13.5, color: TEXT, align: "center" });
  if (i < 2) T(s, "→", { x: x + 3.35, y: y + 0.2, w: 0.8, h: 0.7, fontSize: 32, color: ACCENT, bold: true, align: "center" });
});
s.addShape(p.shapes.LINE, { x: M, y: 5.15, w: W - 2 * M, h: 0, line: { color: LINE, width: 0.75 } });
T(s, [
  { text: "设计即代码：", options: { bold: true, color: INK } },
  { text: "网格坐标、字号阶梯、色板全部显式声明，可复跑、可 diff、可版本化——这套图景 deck 本身就是 vibe-studio 流水线的产物。", options: { color: TEXT } },
], { x: M, y: 5.45, w: 12.2, h: 0.8, fontSize: 16, fontFace: F, margin: 0 });
pageNum(s, 8);
s.addNotes("这是整个矩阵的元能力：别人交付项目就结束了，我交付项目顺便沉淀一条生产线，越做越快。");

/* ---------- 8 演进时间线 ---------- */
s = p.addSlide();
s.background = { color: BG };
T(s, "演进路径 · 从实验到矩阵", { x: M, y: 0.45, w: 10, h: 0.65, fontSize: 36, color: INK, bold: true });
const tl = [
  ["早期", "实验期", "Genesis v2 Agent 进化研究 · 一言道生小程序 PRD · self-hosted TTS SDK", "探索方向，沉淀技术判断"],
  ["2025", "能力期", "AsterNova 实时联机架构 · 企业级软硬件集成能力（PWA 智能硬件远程控制协议）", "把难度最高的技术做扎实"],
  ["2026 H1", "产品期", "ResumeAIX 立项为商业主力 · my-portfolio 主站上线 · LeKao 上线", "从做技术转向做产品"],
  ["2026-08", "矩阵期", "小饭桌上线 · 单机 17 服务矩阵成型 · vibe-studio 内容工厂开线", "多线并行，闭环成型"],
];
const baseY = 3.0;
s.addShape(p.shapes.LINE, { x: M + 0.3, y: baseY, w: W - 2 * M - 0.6, h: 0, line: { color: LINE, width: 1.5 } });
tl.forEach((t, i) => {
  const x = M + i * 3.18 + 0.15;
  s.addShape(p.shapes.OVAL, { x: x + 0.02, y: baseY - 0.11, w: 0.22, h: 0.22, fill: { color: i === 3 ? ACCENT : INK } });
  T(s, t[0], { x, y: baseY - 0.85, w: 2.6, h: 0.4, fontSize: 16, color: ACCENT, bold: true });
  T(s, t[1], { x, y: baseY + 0.3, w: 2.6, h: 0.4, fontSize: 18, color: INK, bold: true });
  T(s, t[2], { x, y: baseY + 0.75, w: 2.75, h: 1.1, fontSize: 12.5, color: TEXT });
  T(s, t[3], { x, y: baseY + 1.95, w: 2.75, h: 0.6, fontSize: 12, color: MUTED });
});
pageNum(s, 9);
s.addNotes("关键转折：2026 年从『什么火做什么』收敛为『一个主力 + 多个场景验证』。归档项目不是失败，是排除了歧路。");

/* ---------- 9 未来规划 · 三大方向 ---------- */
s = p.addSlide();
s.background = { color: BG };
T(s, "未来规划 · 三条主线", { x: M, y: 0.45, w: 10, h: 0.65, fontSize: 36, color: INK, bold: true });
T(s, "不摊大饼。已有矩阵上做深变现、补流量、放大内容杠杆。", { x: M, y: 1.15, w: 11.5, h: 0.4, fontSize: 14, color: MUTED });
const dirs = [
  ["变现", "商业闭环", [
    "ResumeAIX 接入正式支付，跑通订阅收费",
    "小程序定制部署 / 企业软硬件集成持续接单",
    "小饭桌模式验证后复制到更多社区商家",
  ]],
  ["增长", "流量入口", [
    "smart-product-publisher 流量产品按 Stage Spec 推进",
    "LeKao 免费策略积累助教用户群与口碑",
    "主站投票看板收集需求，让用户参与选题",
  ]],
  ["杠杆", "内容与开源", [
    "vibe-motion 逐页动效编排上线",
    "deck-to-video：deck 直接渲染成视频成片",
    "开源工具持续迭代，强化独立架构师品牌",
  ]],
];
dirs.forEach((d, i) => {
  const x = M + i * 4.15;
  T(s, d[0], { x, y: 1.95, w: 3.8, h: 0.85, fontSize: 44, color: ACCENT, bold: true });
  T(s, d[1], { x, y: 2.85, w: 3.8, h: 0.4, fontSize: 17, color: INK, bold: true });
  hairline(s, x, 3.35, 3.7);
  s.addText(d[2].map((t, j) => ({ text: t, options: { bullet: bu(), breakLine: j < d[2].length - 1 } })),
    { x, y: 3.55, w: 3.75, h: 2.6, fontSize: 13.5, fontFace: F, color: TEXT, paraSpaceAfter: 12, margin: 0 });
});
pageNum(s, 10);
s.addNotes("三条主线互为支撑：变现提供现金流，流量提供用户，内容杠杆让一个人能同时维护多条线。");

/* ---------- 10 路线图 ---------- */
s = p.addSlide();
s.background = { color: BG };
T(s, "路线图 · 未来 12 个月", { x: M, y: 0.45, w: 10, h: 0.65, fontSize: 36, color: INK, bold: true });
const road = [
  ["2026 Q4", ["ResumeAIX 正式支付上线", "小饭桌微信真机复验收尾", "smart-product-publisher MVP"], "收尾与启动"],
  ["2027 Q1", ["LeKao 用户增长与口碑运营", "vibe-motion 动效 skill 发布", "定制接单交付 2+ 单"], "增长与沉淀"],
  ["2027 Q2", ["deck-to-video 出第一条成片", "矩阵产品数据复盘、砍掉不增长线", "企业级集成案例文档化"], "聚焦与放大"],
];
const rBaseY = 2.4;
s.addShape(p.shapes.LINE, { x: M + 0.3, y: rBaseY, w: W - 2 * M - 0.6, h: 0, line: { color: LINE, width: 1.5 } });
road.forEach((r, i) => {
  const x = M + i * 4.15;
  s.addShape(p.shapes.OVAL, { x: x + 0.02, y: rBaseY - 0.11, w: 0.22, h: 0.22, fill: { color: i === 2 ? ACCENT : INK } });
  T(s, r[0], { x, y: rBaseY - 0.85, w: 3.5, h: 0.45, fontSize: 20, color: ACCENT, bold: true });
  s.addText(r[1].map((t, j) => ({ text: t, options: { bullet: bu(), breakLine: j < r[1].length - 1 } })),
    { x, y: rBaseY + 0.35, w: 3.75, h: 2.0, fontSize: 13.5, fontFace: F, color: TEXT, paraSpaceAfter: 10, margin: 0 });
  T(s, r[3], { x, y: rBaseY + 2.5, w: 3.5, h: 0.4, fontSize: 13, color: MUTED, bold: true });
});
T(s, [
  { text: "原则：", options: { bold: true, color: INK } },
  { text: "一次只推进一个在研 side project；每条线有明确的去留判据——不增长的产品在 2027 Q2 复盘时果断归档。", options: { color: TEXT } },
], { x: M, y: 6.3, w: 12.2, h: 0.6, fontSize: 14.5, fontFace: F, margin: 0 });
pageNum(s, 11);
s.addNotes("路线图刻意留了复盘点：矩阵期的风险是摊子太大，用季度复盘强制做减法。");

/* ---------- 11 结尾（暗） ---------- */
s = p.addSlide();
s.background = { color: INK };
s.addShape(p.shapes.LINE, { x: M, y: 1.15, w: W - 2 * M, h: 0, line: { color: "4A4137", width: 0.75 } });
T(s, "ASTERFORGE", { x: M, y: 0.72, w: 8, h: 0.35, fontSize: 13, color: ACCENT, charSpacing: 4, bold: true });
T(s, "一个人，一条完整的产品流水线。", { x: M, y: 2.5, w: 12, h: 0.9, fontSize: 40, color: "FFFFFF", bold: true });
T(s, "从设计、开发、部署到内容与变现——每个环节都被工具化、可复跑。下一步，让矩阵自己产生现金流。", { x: M, y: 3.7, w: 10.5, h: 0.8, fontSize: 17, color: "CFC6BA" });
T(s, "asterforge.top · github.com/TimeCraker", { x: M, y: 5.9, w: 8, h: 0.4, fontSize: 14, color: ACCENT, bold: true });
pageNum(s, 12);
s.addNotes("结尾回到核心主张：独立开发者的优势不是人力，是系统。欢迎通过主站联系。");

p.writeFile({ fileName: "../../output/asterforge-product-landscape.pptx" }).then((f) => console.log("written:", f));
