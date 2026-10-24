import React, { useEffect, useState } from "react";
import { loadFont } from "@remotion/fonts";
import {
  AbsoluteFill, Easing, Img, Sequence, cancelRender, continueRender,
  delayRender, interpolate, staticFile, useCurrentFrame, useVideoConfig,
} from "remotion";
import ranking from "../../ranking.json";

// This entry is deliberately separate from the user's in-progress DailyEdition.
// Facts are reused from this episode's storyboard, not newly researched here.
export const REWORK_SECONDS = 62;
const C = { paper: "#f5f4ef", ink: "#191a17", coral: "#a8513c", muted: "#73736b", line: "#c9c9bf", white: "#fbfaf6" };
const sans = "'DailySC', sans-serif";
const mono = "'DailyMono', monospace";
const ease = Easing.bezier(0.16, 1, 0.3, 1);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease } as const;
const pos = (left: number, top: number, width?: number, height?: number): React.CSSProperties => ({ position: "absolute", left, top, width, height });
const num: React.CSSProperties = { fontFamily: mono, fontVariantNumeric: "tabular-nums", letterSpacing: -3 };

let fontPromise: Promise<unknown> | undefined;
const FontGate: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [handle] = useState(() => delayRender("daily-rework local fonts"));
  useEffect(() => {
    fontPromise ??= Promise.all([
      loadFont({ family: "DailySC", url: staticFile("rework/fonts/NotoSansSC-VF.ttf"), weight: "100 900" }),
      loadFont({ family: "DailyMono", url: staticFile("rework/fonts/consola.ttf") }),
    ]);
    fontPromise.then(() => continueRender(handle)).catch(cancelRender);
  }, [handle]);
  return <>{children}</>;
};

const Reveal: React.FC<React.PropsWithChildren<{ delay?: number; style?: React.CSSProperties }>> = ({ children, delay = 0, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return <div style={{ ...style, opacity: interpolate(frame, [delay * fps, (delay + 0.48) * fps], [0, 1], clamp), transform: `translateY(${interpolate(frame, [delay * fps, (delay + 0.48) * fps], [22, 0], clamp)}px)` }}>{children}</div>;
};

const Brand: React.FC<{ src: string; name: string; size?: number }> = ({ src, name, size = 72 }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
    <Img src={staticFile(`rework/brands/${src}`)} style={{ width: size, height: size, objectFit: "contain" }} />
    <span style={{ fontSize: 28, fontWeight: 650 }}>{name}</span>
  </div>
);

const Page: React.FC<React.PropsWithChildren<{ section: string; index: string; source: string; seconds: number }>> = ({ children, section, index, source, seconds }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return <AbsoluteFill style={{ background: C.paper, color: C.ink, fontFamily: sans, fontWeight: 450, overflow: "hidden" }}>
    <div style={{ position: "absolute", inset: 28, border: `1px solid ${C.line}` }} />
    <div style={{ ...pos(72, 52, 1776, 62), display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${C.line}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 17 }}><span style={{ width: 17, height: 17, background: C.coral }} /><span style={{ fontSize: 34, fontWeight: 850, letterSpacing: -1 }}>每日 AI</span><span style={{ marginLeft: 28, fontSize: 21, fontFamily: mono, color: C.muted }}>DAILY / 2026.10.23</span></div>
      <span style={{ fontSize: 23 }}><span style={{ fontFamily: mono, color: C.coral, marginRight: 16 }}>{index}</span>{section}</span>
    </div>
    {children}
    <div style={{ ...pos(72, 970, 1776, 1), background: C.line }} />
    <div style={{ ...pos(72, 970, 1776, 2), background: C.coral, transformOrigin: "left", transform: `scaleX(${Math.min(1, frame / (seconds * fps))})` }} />
    <div style={{ ...pos(72, 992, 1776), display: "flex", justifyContent: "space-between", fontSize: 19, color: C.muted }}><span>{source}</span><span style={{ fontFamily: mono }}>2026.10.23</span></div>
  </AbsoluteFill>;
};

const Kicker: React.FC<React.PropsWithChildren<{ top?: number }>> = ({ children, top = 158 }) => <div style={{ ...pos(74, top), color: C.coral, fontSize: 23, fontFamily: mono, letterSpacing: 1.5 }}>{children}</div>;

const Ranking: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const active = frame < 3 * fps ? -1 : frame < 5 * fps ? 0 : frame < 6.5 * fps ? 1 : frame < 8 * fps ? 2 : -1;
  return <Page section="综合智力" index="00" seconds={10} source={`榜单：${ranking.sourceName} / ${ranking.generatedAtShanghai} 北京时间 · 非现场网页排名`}>
    <Reveal style={{ ...pos(72, 151), fontSize: 106, fontWeight: 900, lineHeight: 1.1, letterSpacing: -4 }}>AI 模型综合智力 TOP 15</Reveal>
    <Reveal delay={0.08} style={{ ...pos(76, 282), fontFamily: mono, fontSize: 26, color: C.muted, letterSpacing: 2 }}>Epoch Capabilities Index / ECI</Reveal>
    <div style={{ ...pos(74, 354, 860, 540), display: "flex", flexDirection: "column", gap: 13 }}>
      {ranking.top15.slice(0, 3).map((row, i) => <Reveal key={row.id} delay={0.18 + i * 0.07} style={{ height: 171, flexShrink: 0, background: i === 0 ? C.coral : C.white, color: i === 0 ? C.white : C.ink, border: `1px solid ${i === 0 ? C.coral : C.line}`, display: "flex", alignItems: "center", padding: "0 26px", gap: 22, boxSizing: "border-box", boxShadow: active === i ? `inset 5px 0 ${i === 0 ? C.white : C.coral}` : "none" }}>
        <span style={{ ...num, fontSize: 43, letterSpacing: -2, width: 62 }}>{String(row.rank).padStart(2, "0")}</span>
        <span style={{ height: 80, width: 1, background: i === 0 ? "#e3b6a8" : C.line }} />
        <span style={{ fontSize: 45, fontWeight: 750, letterSpacing: -1.4, flex: 1, whiteSpace: "nowrap" }}>{row.name}</span>
        <div style={{ width: 142, borderLeft: `1px solid ${i === 0 ? "#e3b6a8" : C.line}`, paddingLeft: 20 }}><div style={{ fontFamily: mono, fontSize: 17, opacity: 0.8 }}>ECI</div><div style={{ ...num, fontSize: 43, marginTop: 4 }}>{row.eci.toFixed(2)}</div></div>
      </Reveal>)}
    </div>
    <div style={{ ...pos(970, 354, 878, 540), borderLeft: `1px solid ${C.line}`, paddingLeft: 28, boxSizing: "border-box" }}>
      <div style={{ display: "grid", gridTemplateColumns: "54px 1fr 100px", height: 33, alignItems: "start", color: C.muted, fontSize: 18, fontFamily: mono }}><span>#</span><span>模型名称</span><span style={{ textAlign: "right" }}>ECI</span></div>
      {ranking.top15.slice(3).map((row, i) => <Reveal key={row.id} delay={0.25 + i * 0.025} style={{ display: "grid", gridTemplateColumns: "54px 1fr 100px", alignItems: "center", height: 42, borderTop: `1px solid ${C.line}` }}>
        <span style={{ fontFamily: mono, fontSize: 24 }}>{String(row.rank).padStart(2, "0")}</span>
        <span style={{ fontSize: 28, fontWeight: 550, whiteSpace: "nowrap" }}>{row.name}{row.rank === 13 ? <span style={{ color: C.muted, fontSize: 17 }}> / 1.0</span> : null}</span>
        <span style={{ fontFamily: mono, fontSize: 27, textAlign: "right" }}>{row.eci.toFixed(2)}</span>
      </Reveal>)}
    </div>
    <div style={{ ...pos(76, 916), fontSize: 22, color: C.muted }}>指数用于比较综合评测表现；本期没有同口径昨日快照，不标升降。</div>
  </Page>;
};

const Headline: React.FC = () => <Page section="今日头条" index="01" seconds={8} source="来源：MiniMaxAI / MiniMax-M3.1-Flash 模型卡 · 本期已有来源记录">
  <Kicker>MODEL RELEASE / 权重开放</Kicker>
  <Reveal delay={0.05} style={{ ...pos(72, 248, 1100), fontSize: 134, lineHeight: 1.06, letterSpacing: -5, fontWeight: 900 }}>MiniMax<br />M3.1 Flash</Reveal>
  <Reveal delay={0.3} style={{ ...pos(80, 603), fontSize: 36, color: C.muted }}>文字、图像、视频输入 · 文字输出</Reveal>
  <div style={{ ...pos(1190, 215, 1, 655), background: C.line }} />
  <Reveal delay={0.25} style={{ ...pos(1280, 200) }}><Brand src="minimax.png" name="MiniMax" size={74} /></Reveal>
  <Reveal delay={0.55} style={{ ...pos(1265, 335), fontSize: 156, lineHeight: 1.12, fontWeight: 850, color: C.coral, letterSpacing: -7 }}>开放<br />权重</Reveal>
  <Reveal delay={2.4} style={{ ...pos(80, 777, 1010), borderTop: `2px solid ${C.ink}`, paddingTop: 24, fontSize: 40, fontWeight: 650 }}>看模型规格，也要看商用条件。</Reveal>
</Page>;

const Parameters: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const second = frame / fps;
  return <Page section="模型规格" index="01" seconds={8} source="来源：MiniMax-M3.1-Flash / Model at a Glance · 数值按本期模型卡">
    <Kicker>M3.1 FLASH / 模型卡</Kicker>
    <Reveal style={{ ...pos(74, 213), fontSize: 76, fontWeight: 850, letterSpacing: -2 }}>总参数，与每次激活分开看。</Reveal>
    <div style={{ ...pos(74, 369, 1772, 310), display: "grid", gridTemplateColumns: "1fr 1fr", gap: 70 }}>
      {[{ value: "428", label: "总参数", note: "模型卡标注的约数", color: C.ink }, { value: "23", label: "每 token 激活参数", note: "按每次计算激活的参数量", color: C.coral }].map((item, i) => <Reveal key={item.label} delay={0.25 + i * 1.5} style={{ borderTop: `2px solid ${second >= 2 && i === 1 ? C.coral : C.ink}`, paddingTop: 22 }}>
        <div style={{ fontSize: 31, fontWeight: 650 }}>{item.label}</div>
        <div style={{ ...num, fontSize: 174, color: item.color, lineHeight: 1.15 }}>{item.value}<span style={{ fontSize: 82, marginLeft: 8 }}>B</span></div>
        <div style={{ fontSize: 26, color: C.muted }}>{item.note}</div>
      </Reveal>)}
    </div>
    <Reveal delay={4.1} style={{ ...pos(74, 763, 1772, 138), borderTop: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}`, display: "flex", alignItems: "center", gap: 54 }}>
      <div style={{ fontSize: 31, width: 285 }}>上下文长度</div><div style={{ ...num, fontSize: 76, color: C.coral }}>1,000,000<span style={{ fontSize: 32, color: C.ink, marginLeft: 22, letterSpacing: 0 }}>token</span></div>
    </Reveal>
  </Page>;
};

const License: React.FC = () => <Page section="使用条件" index="01" seconds={8} source="来源：MiniMax Community License 第 2 条 · 此处为摘要，具体使用以许可原文为准">
  <Kicker>BEFORE YOU USE / 先看许可</Kicker>
  <Reveal style={{ ...pos(74, 215), fontSize: 84, fontWeight: 850, letterSpacing: -3 }}>权重开放，商用另有条件。</Reveal>
  <div style={{ ...pos(74, 378, 1772), display: "flex", flexDirection: "column" }}>
    {[
      { name: "非商业", result: "免费使用", detail: "许可为 MiniMax Community License", delay: 0.3 },
      { name: "商用", result: "指定署名 + 通知", detail: "Built with MiniMax M3.1-Flash", delay: 2.0 },
      { name: "年收入超过 2,000 万美元", result: "事先书面授权", detail: "超过许可门槛时，不能仅靠通知", delay: 4.1 },
    ].map((item, i) => <Reveal key={item.name} delay={item.delay} style={{ height: 171, borderTop: `1px solid ${C.line}`, display: "grid", gridTemplateColumns: "66px 630px 1fr", alignItems: "center", gap: 26 }}>
      <span style={{ fontFamily: mono, fontSize: 28, color: C.coral }}>0{i + 1}</span><span style={{ fontSize: i === 2 ? 37 : 44, fontWeight: 650 }}>{item.name}</span>
      <div><div style={{ fontSize: 46, fontWeight: 750, color: i === 2 ? C.coral : C.ink }}>{item.result}</div><div style={{ fontSize: 23, color: C.muted, marginTop: 9 }}>{item.detail}</div></div>
    </Reveal>)}
  </div>
</Page>;

const FlintSpecs: React.FC = () => <>
  <Reveal style={{ ...pos(74, 337), fontSize: 36, fontWeight: 600 }}>开放权重的本地编码模型</Reveal>
  <div style={{ ...pos(74, 452, 1772), display: "grid", gridTemplateColumns: "1fr 1fr", gap: 70 }}>
    {[{ value: "39.8B", name: "总参数" }, { value: "2.5B", name: "每 token 约激活" }].map((item, i) => <Reveal key={item.name} delay={0.15 + i * 0.6} style={{ borderTop: `2px solid ${C.ink}`, paddingTop: 25 }}><div style={{ ...num, fontSize: 142, lineHeight: 1.1, color: i === 1 ? C.coral : C.ink }}>{item.value}</div><div style={{ fontSize: 32, marginTop: 14 }}>{item.name}</div></Reveal>)}
  </div>
  <Reveal delay={2.3} style={{ ...pos(74, 790, 1772), display: "flex", borderTop: `1px solid ${C.line}`, paddingTop: 25, fontSize: 32, gap: 68 }}><span style={{ color: C.coral, fontWeight: 700 }}>Apache 2.0</span><span>主文件为 BF16，量化版本另行提供。</span></Reveal>
</>;

const FlintScores: React.FC = () => <>
  <Reveal style={{ ...pos(74, 337), fontSize: 34, fontWeight: 600 }}>下面是官方自测，分数按评测项目分别看。</Reveal>
  <div style={{ ...pos(74, 431, 1772) }}>
    {[{ name: "SWE-bench Verified", value: "74.2" }, { name: "SWE-bench Pro v2", value: "89.7" }, { name: "Terminal-Bench 2.1", value: "54.9" }].map((item, i) => <Reveal key={item.name} delay={0.12 + i * 0.36} style={{ height: 141, borderTop: `1px solid ${C.line}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}><span style={{ fontSize: 39, fontWeight: 550 }}>{item.name}</span><span style={{ ...num, fontSize: 84, color: C.coral }}>{item.value}<span style={{ fontSize: 32, marginLeft: 9 }}>%</span></span></Reveal>)}
  </div>
  <div style={{ ...pos(74, 904), fontSize: 23, color: C.muted }}>官方口径：温度 1.0，至少 5 次平均。笔记本推理速度需另看设备与权重配置。</div>
</>;

const Flint: React.FC = () => {
  const { fps } = useVideoConfig();
  return <Page section="本地编码" index="02" seconds={12} source="来源：Recursive / Flint 模型卡与 Introducing Recursive Flint · 发布于 10 月 21 日">
    <Kicker>OPEN MODEL / RECURSIVE</Kicker>
    <Reveal style={{ ...pos(74, 204), fontSize: 105, fontWeight: 850, letterSpacing: -4 }}>Flint</Reveal>
    <div style={pos(1490, 188)}><Brand src="recursive-mark.png" name="Recursive" size={70} /></div>
    <Sequence durationInFrames={Math.round(5.5 * fps)} layout="none"><FlintSpecs /></Sequence>
    <Sequence from={Math.round(5.5 * fps)} durationInFrames={Math.round(6.5 * fps)} layout="none"><FlintScores /></Sequence>
  </Page>;
};

const TypeScriptChart: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return <>
    <Reveal style={{ ...pos(74, 222), fontSize: 83, fontWeight: 850, letterSpacing: -3 }}>TypeScript 7.1 beta</Reveal>
    <Reveal delay={0.15} style={{ ...pos(80, 345), fontSize: 30, color: C.muted }}>4 个类型检查线程 · noEmit · 对照版本为 TypeScript 7.0</Reveal>
    <div style={{ ...pos(80, 463, 1764), display: "flex", flexDirection: "column", gap: 48 }}>
      {[{ name: "mui-docs", value: 1.9 }, { name: "VS Code", value: 1.2 }].map((item, i) => <Reveal key={item.name} delay={0.3 + i * 0.22} style={{ borderTop: `1px solid ${C.line}`, paddingTop: 20 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}><span style={{ fontSize: 37, fontWeight: 600 }}>{item.name}</span><span style={{ ...num, fontSize: 76, color: C.coral }}>{item.value.toFixed(1)}<span style={{ fontSize: 36, marginLeft: 8 }}>×</span></span></div>
        <div style={{ height: 14, marginTop: 18, background: "#e7e3da" }}><div style={{ width: `${item.value / 2 * 100}%`, height: "100%", background: C.coral, transformOrigin: "left", transform: `scaleX(${interpolate(frame, [(0.45 + i * 0.22) * fps, (1.7 + i * 0.22) * fps], [0, 1], clamp)})` }} /></div>
      </Reveal>)}
    </div>
    <Reveal delay={2.8} style={{ ...pos(80, 867), fontSize: 28 }}>不同项目加速不同，先看与自己工程相近的对照。</Reveal>
  </>;
};

const Tsrs: React.FC = () => <>
  <Reveal style={{ ...pos(74, 222), fontSize: 83, fontWeight: 850, letterSpacing: -3 }}>tsrs，另一项实验。</Reveal>
  <Reveal delay={0.2} style={{ ...pos(74, 385), color: C.coral, fontFamily: mono, fontSize: 254, letterSpacing: -12, lineHeight: 1 }}>8<span style={{ fontSize: 144 }}>×</span></Reveal>
  <Reveal delay={0.55} style={{ ...pos(720, 410, 1050), fontSize: 48, lineHeight: 1.55, fontWeight: 650 }}>Cloudflare 官方最高加速值<br />对照 TypeScript 7.0</Reveal>
  <Reveal delay={2.0} style={{ ...pos(80, 757, 1764), borderTop: `1px solid ${C.line}`, paddingTop: 27, fontSize: 33 }}>这个 8 倍，不能写成相对 7.1 beta 的提升。</Reveal>
  <Reveal delay={2.5} style={{ ...pos(80, 842), color: C.muted, fontSize: 27 }}>Rust 移植 · 仍处于实验阶段 · npx tsrs</Reveal>
</>;

const Tools: React.FC = () => {
  const { fps } = useVideoConfig();
  return <Page section="工具简讯" index="03" seconds={11} source="来源：微软 TypeScript 7.1 beta / Cloudflare tsrs 官方介绍 · 发布于 10 月 20 日">
    <Kicker>DEVELOPER TOOLS / 10.20 发布</Kicker>
    <div style={pos(1752, 169)}><Img src={staticFile("rework/brands/typescript.svg")} style={{ width: 80, height: 80 }} /></div>
    <Sequence durationInFrames={Math.round(5.5 * fps)} layout="none"><TypeScriptChart /></Sequence>
    <Sequence from={Math.round(5.5 * fps)} durationInFrames={Math.round(5.5 * fps)} layout="none"><Tsrs /></Sequence>
  </Page>;
};

const Close: React.FC = () => <Page section="本期回顾" index="END" seconds={5} source="完整来源与选题记录随本期工程保留 · 此为无声视觉重制待审版">
  <Kicker>THE TAKEAWAY / 今天的变化</Kicker>
  <Reveal style={{ ...pos(74, 225), fontSize: 94, fontWeight: 850, letterSpacing: -4 }}>看能力，也看使用条件。</Reveal>
  <div style={{ ...pos(74, 438, 1772) }}>
    {[["01", "M3.1 Flash", "开放权重，留意商用许可。"], ["02", "Flint", "本地编码，评测与硬件速度分开看。"], ["03", "TypeScript", "有提速，先对齐比较的版本。"]].map((row, i) => <Reveal key={row[0]} delay={0.22 + i * 0.15} style={{ height: 140, borderTop: `1px solid ${C.line}`, display: "grid", gridTemplateColumns: "90px 430px 1fr", alignItems: "center" }}><span style={{ color: C.coral, fontFamily: mono, fontSize: 29 }}>{row[0]}</span><span style={{ fontSize: 43, fontWeight: 700 }}>{row[1]}</span><span style={{ fontSize: 34 }}>{row[2]}</span></Reveal>)}
  </div>
</Page>;

export const DailyRework: React.FC = () => {
  const { fps } = useVideoConfig();
  return <FontGate><AbsoluteFill style={{ background: C.paper }}>
    <Sequence name="完整榜单与前三聚焦" durationInFrames={10 * fps}><Ranking /></Sequence>
    <Sequence name="头条" from={10 * fps} durationInFrames={8 * fps}><Headline /></Sequence>
    <Sequence name="总参、激活与上下文" from={18 * fps} durationInFrames={8 * fps}><Parameters /></Sequence>
    <Sequence name="许可" from={26 * fps} durationInFrames={8 * fps}><License /></Sequence>
    <Sequence name="Flint 规格与评测" from={34 * fps} durationInFrames={12 * fps}><Flint /></Sequence>
    <Sequence name="TypeScript 与 tsrs" from={46 * fps} durationInFrames={11 * fps}><Tools /></Sequence>
    <Sequence name="回顾" from={57 * fps} durationInFrames={5 * fps}><Close /></Sequence>
  </AbsoluteFill></FontGate>;
};

export const DailyReworkCover: React.FC = () => <FontGate><Page section="模型动态" index="01" seconds={1} source="本期头条 / MiniMax M3.1 Flash · 官方标志来自本期已有原文件">
  <Kicker>2026.10.23 / OPEN WEIGHTS</Kicker>
  <div style={{ ...pos(70, 261), fontWeight: 900, fontSize: 153, lineHeight: 1.08, letterSpacing: -6 }}>M3.1 Flash<br /><span style={{ color: C.coral }}>开放权重</span></div>
  <div style={{ ...pos(80, 713), fontSize: 36 }}>总参约 428B · 激活约 23B · 百万 token 上下文</div>
  <div style={pos(1460, 224)}><Brand src="minimax.png" name="MiniMax" size={114} /></div>
  <div style={{ ...pos(1390, 483), borderTop: `2px solid ${C.ink}`, width: 420, paddingTop: 24 }}><div style={{ fontSize: 24, color: C.muted }}>使用前先看</div><div style={{ fontSize: 57, fontWeight: 750, marginTop: 14 }}>商用许可</div></div>
</Page></FontGate>;
