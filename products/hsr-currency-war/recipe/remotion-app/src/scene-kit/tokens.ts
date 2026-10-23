// 设计令牌（v3 质感层）：全部组件光影/色彩/字号的唯一取值处（spec §2.2）。
// 光源统一左上；双族 = 浅族米白杂志 / 深族深蓝科技。
export const COLOR = {
  brand: "#3157F6",
  brandBright: "#5B7DFF",
  ink: "#1A2233",
  paper: "#F5F1E8",
  paperCard: "#FFFFFF",
  dark0: "#0a0e1a",
  dark1: "#141a2e",
  darkCard: "#1B2338",
  inkSoft: "#4A5568",
  line: "rgba(26,34,51,.10)",
  lineDark: "rgba(255,255,255,.10)",
};

// 双层阴影体系：环境光层 + 主投影/接触层
export const SHADOW = {
  card: "0 2px 6px rgba(15,23,42,.07), 0 14px 40px rgba(15,23,42,.12)", // 浅底卡片
  float: "0 8px 20px rgba(5,10,20,.35), 0 32px 80px rgba(5,10,20,.45)", // 深底悬浮主体
  contact: "0 3px 10px rgba(10,14,26,.25)", // 接触阴影
};

// 1px 边光：浅底卡顶光 / 深底 rim light（可追加进 boxShadow 列表）
export const RIM = {
  light: "inset 0 1px 0 rgba(255,255,255,.9)",
  dark: "inset 0 1px 0 rgba(255,255,255,.14), inset 0 0 0 1px rgba(255,255,255,.06)",
};

// 字号台阶：主标题 ≥ 画高 11%（120px/1080），金句/CTA ≥150px
export const TYPE = {
  displayMin: 150, // 金句/CTA 页（spec 记法 displayL "clamp:≥150px"）
  display: 120, // 主标题下限
  title: 64,
  body: 42,
  meta: 30,
  monoMin: 26,
};

// 全片字体栈：任何文字不得落回浏览器默认衬线（v2 气泡衬线穿帮的根因）
export const FONT = {
  sans: "'Microsoft YaHei','PingFang SC','Noto Sans SC',sans-serif",
  mono: "Consolas,'SF Mono','Courier New',monospace",
};
