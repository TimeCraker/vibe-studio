import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { ChartGrow, CoinIcon } from "./scene-kit/ChartGrow";
import { ChatReplay } from "./scene-kit/ChatReplay";
import { CountUp } from "./scene-kit/CountUp";
import { DropCard } from "./scene-kit/DropCard";
import { FloatWrap } from "./scene-kit/FloatWrap";
import { GlowPulse } from "./scene-kit/GlowPulse";
import { DeviceFrame, PhoneShell } from "./scene-kit/DeviceFrame";
import { SceneBg } from "./scene-kit/SceneBg";
import { SceneShell } from "./scene-kit/SceneShell";
import { StaggerList } from "./scene-kit/StaggerList";
import { SubtitleTrack } from "./fx/SubtitleTrack";
import { TextReveal } from "./scene-kit/TextReveal";
import { TopProgress } from "./scene-kit/TopProgress";
import { TypingTerminal } from "./scene-kit/TypingTerminal";
import { COLOR, FONT, SHADOW } from "./scene-kit/tokens";
import { deckCues } from "./deck-cues";
import { deckParams } from "./deck-params";

// DeckVideoV2 — 场景化成片（v3 质感版）：按 scene-design.md v3（复核修订单后）原地升级。
// v3 要点：tokens 光影体系（DropCard 全覆盖）/ 主标题 ≥120px（金句 CTA 150px）/ 进场相位前移
// 0.15-0.25s / 字幕 panel 双色调+去重（P1/P10/P11）/ 顶部进度条 / P8 屏内「截图段+深色自绘段」分区。
// 页时长/起点/音频/字幕时间轴仍全部复用 deck-params / deck-cues，换配音重跑即换音。
// 确定性：无随机源、无时钟取值。

const SPRING = { damping: 200, stiffness: 120, mass: 1 };
const BRAND = COLOR.brand;
const BRAND_LIGHT = "#8FA8FF"; // 深底上的钴蓝提亮档
const INK = COLOR.ink;
const MUTED = COLOR.inkSoft;
const MUTED_DARK = "#94a3b8";
const DARK_PAGES = [1, 7, 10, 11];

// 延迟 spring 入场（位移+缩放+透明度），场景内通用
const SpringIn: React.FC<{
  delay?: number;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}> = ({ delay = 0, style, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: Math.max(0, frame - delay * fps), fps, config: SPRING });
  return (
    <div
      style={{
        ...style,
        opacity: p,
        transform: `translateY(${((1 - p) * 28).toFixed(2)}px) scale(${(0.94 + 0.06 * p).toFixed(3)})`,
      }}
    >
      {children}
    </div>
  );
};

// 杂志 chrome（非 SceneShell 构图复用）：眉题 + 120px 级标题 + 细线
const Chrome: React.FC<{
  eyebrow: string;
  chapter?: string;
  title: string;
  highlight?: { start: number; end: number };
  titleSize?: number;
  dark?: boolean;
}> = ({ eyebrow, chapter, title, highlight, titleSize = 120, dark = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: Math.max(0, frame - 0.05 * fps), fps, config: SPRING });
  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: "0.32em", textTransform: "uppercase", color: dark ? BRAND_LIGHT : BRAND, opacity: p }}>
          {eyebrow}
        </div>
        {chapter ? (
          <div style={{ fontFamily: FONT.mono, fontSize: 26, fontWeight: 700, color: dark ? MUTED_DARK : MUTED, opacity: p }}>
            {chapter}
          </div>
        ) : null}
      </div>
      <div style={{ marginTop: 18 }}>
        <TextReveal
          text={title}
          mode="char"
          size={titleSize}
          weight={800}
          color={dark ? "#f8fafc" : INK}
          delay={0.1}
          highlights={highlight ? [{ start: highlight.start, end: highlight.end, color: dark ? BRAND_LIGHT : BRAND }] : []}
        />
      </div>
      <ChromeLine dark={dark} />
    </>
  );
};

const ChromeLine: React.FC<{ dark?: boolean }> = ({ dark = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: Math.max(0, frame - 0.3 * fps), fps, config: SPRING });
  return (
    <div
      style={{
        marginTop: 22,
        height: 1,
        background: dark ? "rgba(255,255,255,0.16)" : COLOR.line,
        transformOrigin: "left center",
        transform: `scaleX(${p.toFixed(3)})`,
      }}
    />
  );
};

// 插画卡 v3：DropCard 白卡装官方示意插画，可带角标（主体标注）
const IllustCard: React.FC<{ src: string; width: number; tag?: string; style?: React.CSSProperties }> = ({
  src,
  width,
  tag,
  style,
}) => (
  <DropCard tone="light" radius={20} style={style}>
    <div style={{ position: "relative" }}>
      <Img src={staticFile(src)} style={{ width: "100%", display: "block" }} />
      {tag ? (
        <div
          style={{
            position: "absolute",
            top: 14,
            right: 14,
            background: BRAND,
            color: "#fff",
            fontFamily: FONT.mono,
            fontSize: 22,
            fontWeight: 700,
            padding: "6px 14px",
            borderRadius: 10,
            boxShadow: "0 4px 14px rgba(49,87,246,.35)",
          }}
        >
          {tag}
        </div>
      ) : null}
    </div>
  </DropCard>
);

// 扫描线插画卡（P4）：「AI 识别中」——横扫亮线 2.8s 周期（确定性 sin）
const ScanCard: React.FC<{ src: string; width: number; style?: React.CSSProperties }> = ({ src, width, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const imgH = width * (832 / 1248);
  const y = (0.5 + 0.5 * Math.sin((2 * Math.PI * t) / 2.8)) * (imgH - 6);
  return (
    <DropCard tone="light" radius={20} style={style}>
      <div style={{ position: "relative" }}>
        <Img src={staticFile(src)} style={{ width: "100%", display: "block" }} />
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: y,
            height: 3,
            background: "linear-gradient(90deg, rgba(91,125,255,0), rgba(91,125,255,0.85), rgba(91,125,255,0))",
            boxShadow: "0 0 18px rgba(91,125,255,0.6)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 14,
            right: 14,
            background: BRAND,
            color: "#fff",
            fontFamily: FONT.mono,
            fontSize: 22,
            fontWeight: 700,
            padding: "6px 14px",
            borderRadius: 10,
            boxShadow: "0 4px 14px rgba(49,87,246,.35)",
          }}
        >
          AI 识别中
        </div>
      </div>
    </DropCard>
  );
};

// 步骤条目 v3：mono 编号 + 加粗步骤名 + 说明，左侧钴蓝竖线
const StepItem: React.FC<{ no: string; name: string; desc: string }> = ({ no, name, desc }) => (
  <div style={{ borderLeft: `4px solid ${BRAND}`, paddingLeft: 22, paddingTop: 4, paddingBottom: 4 }}>
    <div style={{ fontFamily: FONT.mono, fontSize: 26, fontWeight: 800, color: BRAND, letterSpacing: "0.14em" }}>
      {no}
    </div>
    <div style={{ fontSize: 36, fontWeight: 800, color: INK, marginTop: 6 }}>{name}</div>
    <div style={{ fontSize: 26, fontWeight: 600, color: MUTED, marginTop: 6 }}>{desc}</div>
  </div>
);

// P7 规则行：T 币锚 + mono 数字 + 说明（讲币必画币）
const RuleRow: React.FC<{ num: string; text: string; last?: boolean }> = ({ num, text, last = false }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 16,
      paddingBottom: 16,
      borderBottom: last ? "none" : "1px solid rgba(255,255,255,0.10)",
    }}
  >
    <CoinIcon size={34} />
    <span style={{ fontFamily: FONT.mono, fontSize: 40, fontWeight: 800, color: "#f8fafc", whiteSpace: "nowrap" }}>
      {num}
    </span>
    <span style={{ fontFamily: FONT.sans, fontSize: 27, fontWeight: 600, color: MUTED_DARK }}>{text}</span>
  </div>
);

// ── P8 屏内组合：上段官网内容特写（素材）+ 下段深色自绘三功能行 ──────────
const PhoneHeroScreen: React.FC<{ width?: number }> = ({ width = 300 }) => {
  const screenW = width - 24;
  const imgH = screenW * (790 / 680); // hero-content 素材 680×790
  const topPad = 40; // 灵动岛安全区（岛贴顶 12+24）
  const ringTop = topPad + imgH * 0.085; // 大标题区（素材内比例）
  const ringH = imgH * 0.29;
  return (
    <PhoneShell width={width} tone="light">
      <div style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column", background: COLOR.dark0 }}>
        {/* 上段：官网内容段特写（浅色，素材原貌） */}
        <div style={{ paddingTop: topPad, flexShrink: 0, background: COLOR.dark0 }}>
          <Img src={staticFile("lekao/lekao-hero-content.png")} style={{ width: "100%", display: "block" }} />
        </div>
        {/* 下段：深色自绘三功能行（README 行名 + 稿9/11/13 口径），分界干净水平 */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            padding: "10px 14px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-evenly",
            borderTop: "1px solid rgba(255,255,255,0.14)",
            background: `linear-gradient(180deg, ${COLOR.dark1}, ${COLOR.dark0})`,
          }}
        >
          {[
            { name: "课堂小结", desc: "10 条反馈 + 1 段小结" },
            { name: "作业反馈", desc: "逐题反馈 + 总体小结" },
            { name: "错题集", desc: "5 分钟全班一本" },
          ].map((f, i) => (
            <div
              key={f.name}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 9,
                paddingBottom: i < 2 ? 8 : 0,
                borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.08)" : "none",
              }}
            >
              <div style={{ width: 8, height: 8, borderRadius: 2, background: BRAND_LIGHT, flexShrink: 0 }} />
              <div>
                <div style={{ fontFamily: FONT.sans, fontSize: 14, fontWeight: 700, color: "#eef2f9" }}>{f.name}</div>
                <div style={{ fontFamily: FONT.sans, fontSize: 11, fontWeight: 600, color: "#93a0b8", marginTop: 2 }}>
                  {f.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* 屏内主体标注：高亮圈圈住上段大标题 + 角标 */}
        <div
          style={{
            position: "absolute",
            top: ringTop,
            left: 8,
            right: 8,
            height: ringH,
            border: `2px solid ${BRAND_LIGHT}`,
            borderRadius: 12,
            boxShadow: "0 0 0 4px rgba(91,125,255,0.15)",
            zIndex: 5,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: ringTop + ringH + 6,
            right: 10,
            background: BRAND,
            color: "#fff",
            fontFamily: FONT.sans,
            fontSize: 11,
            fontWeight: 700,
            padding: "3px 9px",
            borderRadius: 6,
            zIndex: 5,
          }}
        >
          官网首屏
        </div>
      </div>
    </PhoneShell>
  );
};

// ── P1 · 01:11 品牌开场（dark，130px 大字 + 三功能 chips）────────────────
const Scene01: React.FC = () => (
  <SceneBg variant="dark">
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <GlowPulse size={680} intensity={0.5} style={{ top: -170 }} />
        <SpringIn delay={0.15}>
          <FloatWrap period={4.2}>
            <Img src={staticFile("lekao/lekao-mark.svg")} style={{ width: 150, height: 150 }} />
          </FloatWrap>
        </SpringIn>
        <div style={{ marginTop: 44 }}>
          <TextReveal
            text="LeKao · AI 智能助教助手"
            mode="char"
            size={130}
            weight={800}
            color="#f8fafc"
            align="center"
            delay={0.3}
            highlights={[{ start: 0, end: 5, color: BRAND_LIGHT }]}
          />
        </div>
        <SpringIn delay={0.85}>
          <div style={{ marginTop: 26, fontSize: 30, fontWeight: 600, color: MUTED_DARK }}>
            K12 机构助教的 AI 工作台
          </div>
        </SpringIn>
        <SpringIn delay={1.0}>
          <div style={{ marginTop: 12, fontFamily: FONT.mono, fontSize: 26, fontWeight: 600, color: MUTED_DARK }}>
            lekao.asterforge.top
          </div>
        </SpringIn>
        <SpringIn delay={1.15}>
          <StaggerList gap={110} direction="left" delay={1.3} style={{ flexDirection: "row", gap: 16, marginTop: 30, justifyContent: "center" }}>
            {["课堂小结", "作业反馈", "错题集"].map((t) => (
              <div
                key={t}
                style={{
                  padding: "12px 30px",
                  borderRadius: 999,
                  background: COLOR.darkCard,
                  border: "1px solid rgba(255,255,255,0.14)",
                  fontFamily: FONT.sans,
                  fontSize: 24,
                  fontWeight: 700,
                  color: "#e2e8f0",
                  boxShadow: "0 8px 20px rgba(5,10,20,.35), inset 0 1px 0 rgba(255,255,255,.14)",
                }}
              >
                {t}
              </div>
            ))}
          </StaggerList>
        </SpringIn>
      </div>
    </AbsoluteFill>
  </SceneBg>
);

// ── P2 · 02:11 叙事痛点：左拆项清单 / 右终端待办（light）─────────────────
const Scene02: React.FC = () => (
  <SceneBg variant="light">
    <SceneShell
      chapter="02 / 11"
      eyebrow="PAIN POINT · EVERY CLASS"
      title="1 到 2 小时，去哪了"
      highlight={{ start: 0, end: 8 }}
      titleSize={120}
      style={{ paddingBottom: 150 }}
      left={
        <div style={{ display: "flex", flexDirection: "column", gap: 26, justifyContent: "center", flex: 1 }}>
          <StaggerList gap={140} delay={0.45}>
            <StepItem no="01" name="抄错题" desc="错题重新整理一遍" />
            <StepItem no="02" name="写小结" desc="每节课都要写一段" />
            <StepItem no="03" name="写反馈" desc="作业逐题给出反馈" />
          </StaggerList>
          <SpringIn delay={1.1}>
            <div style={{ fontSize: 28, fontWeight: 600, color: MUTED }}>每个班、每节课，都在重复同一套工序</div>
          </SpringIn>
        </div>
      }
    >
      <SpringIn delay={0.2} style={{ width: "100%", display: "flex", justifyContent: "center" }}>
        <TypingTerminal
          title="助教 · 晚间待办"
          cps={16}
          width={620}
          lines={[
            "$ 放学后的待办清单",
            "[1] 抄错题：把学生错题重新整理一遍",
            "[2] 写小结：每节课都要写一段",
            "[3] 写反馈：作业要逐题给出反馈",
            "全部做完：1 到 2 个小时后",
          ]}
        />
      </SpringIn>
    </SceneShell>
  </SceneBg>
);

// ── P3 · 03:11 产品总览：手机壳内对话回放（light）────────────────────────
const Scene03: React.FC = () => (
  <SceneBg variant="light">
    <SceneShell
      chapter="03 / 11"
      eyebrow="LEKAO · TAKE OVER"
      title="三件事，一次接走"
      highlight={{ start: 4, end: 8 }}
      titleSize={120}
      style={{ paddingBottom: 150 }}
      left={
        <div style={{ display: "flex", flexDirection: "column", gap: 26, justifyContent: "center", flex: 1 }}>
          <StaggerList gap={130} delay={0.45}>
            <StepItem no="01" name="课堂小结" desc="10 条反馈 + 1 段小结" />
            <StepItem no="02" name="作业反馈" desc="逐题反馈 + 总体小结" />
            <StepItem no="03" name="错题集" desc="5 分钟，全班一本" />
          </StaggerList>
          <SpringIn delay={1.15}>
            <div style={{ fontSize: 30, fontWeight: 700, color: INK }}>
              传一张讲义图，出三样成品 <span style={{ color: BRAND }}>→</span>
            </div>
          </SpringIn>
        </div>
      }
    >
      <SpringIn delay={0.2} style={{ width: "100%", display: "flex", justifyContent: "center" }}>
        <ChatReplay
          shell
          width={320}
          messages={[
            { side: "user", text: "小结、反馈、错题集……干不完" },
            { side: "ai", text: "发我讲义图就行" },
            { side: "ai", text: "课堂小结：10 条反馈 + 一段小结" },
            { side: "user", text: "错题集呢？" },
            { side: "ai", text: "五分钟，全班一本 Word" },
          ]}
        />
      </SpringIn>
    </SceneShell>
  </SceneBg>
);

// ── P4 · 04:11 功能演示①：课堂小结（light，双栏+扫描线插画卡）───────────
const Scene04: React.FC = () => (
  <SceneBg variant="light">
    <SceneShell
      chapter="04 / 11"
      eyebrow="FEATURE 01 · CLASS SUMMARY"
      title="一张图，出一份成品"
      highlight={{ start: 5, end: 9 }}
      titleSize={120}
      style={{ paddingBottom: 150 }}
      left={
        <div style={{ display: "flex", flexDirection: "column", gap: 24, justifyContent: "center", flex: 1 }}>
          <StaggerList gap={120} delay={0.4}>
            <StepItem no="STEP 01" name="上传讲义图" desc="讲义拍照上传，AI 先读图" />
            <StepItem no="STEP 02" name="AI 读图识别" desc="学科 · 章节 · 知识点，自动认" />
            <StepItem no="STEP 03" name="生成成品" desc="10 条反馈 + 1 段小结，直接出" />
          </StaggerList>
          <SpringIn delay={1.0}>
            <DropCard tone="light" radius={16} padding="20px 28px" style={{ borderLeft: `4px solid ${BRAND}` }}>
              <div style={{ fontFamily: FONT.mono, fontSize: 26, fontWeight: 800, color: BRAND }}>成品清单</div>
              <div style={{ fontSize: 34, fontWeight: 800, color: INK, marginTop: 6 }}>10 条逐题反馈 + 1 段小结</div>
            </DropCard>
          </SpringIn>
        </div>
      }
    >
      <div style={{ position: "relative", width: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <GlowPulse size={560} intensity={0.4} />
        <SpringIn delay={0.2}>
          <FloatWrap period={4.4}>
            <ScanCard src="lekao/feature-summary.png" width={560} />
          </FloatWrap>
        </SpringIn>
      </div>
    </SceneShell>
  </SceneBg>
);

// ── P5 · 05:11 功能演示②：作业反馈（light，全屏大图+四挡 chips）─────────
const Scene05: React.FC = () => (
  <SceneBg variant="light">
    <AbsoluteFill style={{ padding: "56px 96px 200px", display: "flex", flexDirection: "column" }}>
      <Chrome eyebrow="FEATURE 02 · FEEDBACK" chapter="05 / 11" title="逐题反馈，字数你定" highlight={{ start: 5, end: 9 }} titleSize={120} />
      <SpringIn delay={0.9}>
        <div style={{ marginTop: 16, fontSize: 28, fontWeight: 600, color: MUTED }}>
          作业堂测，同样传图生成 · 逐题反馈，再加总体小结
        </div>
      </SpringIn>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 0 }}>
        <SpringIn delay={0.2}>
          <FloatWrap period={4.6}>
            <IllustCard src="lekao/feature-feedback.png" width={640} tag="逐题 · 四挡字数" />
          </FloatWrap>
        </SpringIn>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 22 }}>
        <SpringIn delay={1.0}>
          <div style={{ fontSize: 30, fontWeight: 700, color: INK }}>字数四挡</div>
        </SpringIn>
        <StaggerList gap={110} direction="left" delay={1.15} style={{ flexDirection: "row", gap: 16 }}>
          {["标准", "×1.5", "×2", "×3"].map((t) => (
            <div
              key={t}
              style={{
                padding: "12px 30px",
                borderRadius: 999,
                background: "#FFFFFF",
                border: `1px solid ${COLOR.line}`,
                fontFamily: t.startsWith("×") ? FONT.mono : FONT.sans,
                fontSize: 26,
                fontWeight: 700,
                color: INK,
                boxShadow: `${SHADOW.card}, ${SHADOW.contact}`,
              }}
            >
              {t}
            </div>
          ))}
        </StaggerList>
      </div>
    </AbsoluteFill>
  </SceneBg>
);

// ── P6 · 06:11 功能演示③：错题集（light，镜像双栏+大数字）───────────────
const Scene06: React.FC = () => (
  <SceneBg variant="light">
    <AbsoluteFill style={{ padding: "56px 96px 160px", display: "flex", flexDirection: "column" }}>
      <Chrome eyebrow="FEATURE 03 · MISTAKE BOOK" chapter="06 / 11" title="五分钟，全班一本" highlight={{ start: 4, end: 8 }} titleSize={120} />
      <div style={{ display: "flex", flex: 1, minHeight: 0, marginTop: 26, gap: 56 }}>
        <div style={{ flex: 1, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <SpringIn delay={0.2}>
            <FloatWrap period={4.2}>
              <IllustCard src="lekao/feature-mistake.png" width={560} tag="Word 成品" />
            </FloatWrap>
          </SpringIn>
        </div>
        <div style={{ flex: "0 0 44%", display: "flex", flexDirection: "column", justifyContent: "center", gap: 26 }}>
          <StaggerList gap={120} delay={0.4}>
            <StepItem no="01" name="填 Excel 模板" desc="按模板登记错题信息" />
            <StepItem no="02" name="拖入题目图片" desc="批量拖拽上传" />
            <StepItem no="03" name="浏览器生成 Word" desc="本地完成 · 不消耗 T-Coin" />
          </StaggerList>
          <SpringIn delay={0.9}>
            <CountUp to={5} suffix=" 分钟 · 全班一本" size={60} color={INK} suffixColor={MUTED} delay={0.2} />
          </SpringIn>
        </div>
      </div>
    </AbsoluteFill>
  </SceneBg>
);

// ── P7 · 07:11 数据说服：T-Coin（dark，规则行 + 递增柱图）────────────────
const Scene07: React.FC = () => (
  <SceneBg variant="dark">
    <SceneShell
      tone="dark"
      chapter="07 / 11"
      eyebrow="T-COIN ECONOMY"
      title="签到领币，生成花币"
      highlight={{ start: 0, end: 4 }}
      titleSize={120}
      style={{ paddingBottom: 150 }}
      left={
        <div style={{ display: "flex", flexDirection: "column", gap: 18, justifyContent: "center", flex: 1 }}>
          <StaggerList gap={130} delay={0.4}>
            <RuleRow num="5 币" text="注册即送 · 够生成 5 次" />
            <RuleRow num="1 币" text="AI 生成一次的消耗" />
            <RuleRow num="2 → 8 币" text="连续签到 7 日，每日奖励递增" />
          </StaggerList>
          <SpringIn delay={1.1}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <CoinIcon size={34} />
              <span style={{ fontSize: 28, fontWeight: 700, color: "#e8edf6" }}>生成失败，消耗的币自动退回</span>
            </div>
          </SpringIn>
        </div>
      }
    >
      <SpringIn delay={0.2} style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <ChartGrow
          width={600}
          height={380}
          delay={0.35}
          barColor="#4c6fff"
          valueColor="#f8fafc"
          labelColor={MUTED_DARK}
          axisColor="rgba(255,255,255,0.22)"
          coin
          bars={[
            { label: "第1天", value: 2, unit: "币" },
            { label: "第2天", value: 3, unit: "币" },
            { label: "第3天", value: 4, unit: "币" },
            { label: "第4天", value: 5, unit: "币" },
            { label: "第5天", value: 6, unit: "币" },
            { label: "第6天", value: 7, unit: "币" },
            { label: "第7天", value: 8, unit: "币" },
          ]}
        />
        <div style={{ marginTop: 16, fontSize: 24, fontWeight: 600, color: MUTED_DARK }}>
          连续签到 7 日，每日奖励 2 币递增到 8 币
        </div>
      </SpringIn>
    </SceneShell>
  </SceneBg>
);

// ── P8 · 08:11 体验细节：手机「截图段+深色自绘段」（light）───────────────
const Scene08: React.FC = () => (
  <SceneBg variant="light">
    <SceneShell
      chapter="08 / 11"
      eyebrow="EXPERIENCE"
      title="手机上一样顺手"
      highlight={{ start: 0, end: 2 }}
      titleSize={120}
      style={{ paddingBottom: 150 }}
      left={
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", flex: 1 }}>
          <StaggerList gap={150} delay={0.45}>
            <StepItem no="A" name="图片自动压缩" desc="1280px / 0.4MB 以内，大图不卡" />
            <StepItem no="B" name="流式输出" desc="生成内容实时逐段显示" />
            <StepItem no="C" name="本地历史" desc="记录存浏览器，随时回看" />
          </StaggerList>
        </div>
      }
    >
      <div style={{ position: "relative", width: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <GlowPulse size={480} intensity={0.3} />
        <SpringIn delay={0.2}>
          <FloatWrap period={4.4}>
            <PhoneHeroScreen width={300} />
          </FloatWrap>
        </SpringIn>
      </div>
    </SceneShell>
  </SceneBg>
);

// ── P9 · 09:11 流程说明：三步上手（light，横排大编号卡）──────────────────
const Scene09: React.FC = () => {
  const cards = [
    { no: "01", name: "注册登录", desc: "邮箱 + 验证码", tag: null as string | null },
    { no: "02", name: "上传讲义图", desc: "小结 · 反馈 · 错题集", tag: null as string | null },
    { no: "03", name: "拿结果", desc: "三样成品直接用", tag: "成品" },
  ];
  return (
    <SceneBg variant="light">
      <AbsoluteFill style={{ padding: "56px 96px 160px", display: "flex", flexDirection: "column" }}>
        <Chrome eyebrow="GETTING STARTED" chapter="09 / 11" title="三步上手" highlight={{ start: 0, end: 2 }} titleSize={120} />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 34 }}>
          {cards.map((c, i) => (
            <React.Fragment key={c.no}>
              {i > 0 ? (
                <SpringIn delay={0.5 + i * 0.18}>
                  <div style={{ fontSize: 40, fontWeight: 800, color: BRAND }}>→</div>
                </SpringIn>
              ) : null}
              <SpringIn delay={0.15 + i * 0.18}>
                <FloatWrap phase={i * 1.4} period={4.4} amp={6}>
                  <div style={{ position: "relative" }}>
                    <DropCard tone="light" radius={22} padding="36px 40px" style={{ width: 420 }}>
                      <div style={{ fontFamily: FONT.mono, fontSize: 58, fontWeight: 800, color: BRAND }}>{c.no}</div>
                      <div style={{ fontSize: 30, fontWeight: 800, color: INK, marginTop: 10 }}>{c.name}</div>
                      <div style={{ fontSize: 26, fontWeight: 600, color: MUTED, marginTop: 8 }}>{c.desc}</div>
                    </DropCard>
                    {c.tag ? (
                      <div
                        style={{
                          position: "absolute",
                          top: -14,
                          right: -12,
                          background: BRAND,
                          color: "#fff",
                          fontFamily: FONT.sans,
                          fontSize: 22,
                          fontWeight: 700,
                          padding: "5px 16px",
                          borderRadius: 999,
                          boxShadow: "0 6px 16px rgba(49,87,246,.35)",
                        }}
                      >
                        {c.tag}
                      </div>
                    ) : null}
                  </div>
                </FloatWrap>
              </SpringIn>
            </React.Fragment>
          ))}
        </div>
        <SpringIn delay={1.0}>
          <div style={{ textAlign: "center", fontSize: 26, fontWeight: 600, color: MUTED }}>浏览器即开即用</div>
        </SpringIn>
      </AbsoluteFill>
    </SceneBg>
  );
};

// ── P10 · 10:11 价值主张：150px 金句（dark，对比插画横幅）────────────────
const Scene10: React.FC = () => (
  <SceneBg variant="dark">
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", paddingBottom: 185 }}>
      <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
        <GlowPulse size={720} intensity={0.4} style={{ top: -80 }} />
        <SpringIn delay={0.15}>
          <div style={{ fontSize: 28, fontWeight: 600, color: MUTED_DARK, letterSpacing: "0.1em" }}>记住一句话就够了</div>
        </SpringIn>
        <div style={{ width: 1560 }}>
          <TextReveal
            text="把每次课的 1 到 2 小时，还给教学"
            mode="char"
            size={150}
            weight={800}
            color="#f8fafc"
            align="center"
            delay={0.3}
            highlights={[{ start: 6, end: 14, color: BRAND_LIGHT }]}
          />
        </div>
        <SpringIn delay={0.9}>
          <FloatWrap period={4.8}>
            <IllustCard src="lekao/value-time-comparison.png" width={500} />
          </FloatWrap>
        </SpringIn>
      </div>
    </AbsoluteFill>
  </SceneBg>
);

// ── P11 · 11:11 行动号召：150px CTA + 浏览器特写（dark）──────────────────
const Scene11: React.FC = () => {
  const bw = 620; // 浏览器框宽（标注圈坐标按此计算）
  return (
    <SceneBg variant="dark">
      <AbsoluteFill style={{ flexDirection: "row", alignItems: "center", padding: "0 110px", gap: 60 }}>
        <div style={{ flex: 1, position: "relative", display: "flex", flexDirection: "column", gap: 26 }}>
          <GlowPulse size={520} intensity={0.35} style={{ left: -120, top: -60 }} />
          <Chrome eyebrow="GET STARTED" title="现在就能试" highlight={{ start: 2, end: 5 }} titleSize={150} dark />
          <SpringIn delay={1.0}>
            <div style={{ fontFamily: FONT.mono, fontSize: 34, fontWeight: 800, color: BRAND_LIGHT }}>lekao.asterforge.top</div>
          </SpringIn>
          <SpringIn delay={1.2}>
            <div style={{ fontSize: 30, fontWeight: 600, color: MUTED_DARK }}>每次课，省回 1 到 2 小时</div>
          </SpringIn>
        </div>
        <SpringIn delay={0.25}>
          <FloatWrap period={4.6}>
            <div style={{ position: "relative" }}>
              <DeviceFrameBrowser w={bw} />
              {/* 主体标注：高亮圈圈住地址栏（锁形+域名）+ 角标 */}
              <div
                style={{
                  position: "absolute",
                  top: 47,
                  left: 80,
                  width: bw - 104,
                  height: 38,
                  border: `2px solid ${BRAND_LIGHT}`,
                  borderRadius: 19,
                  boxShadow: "0 0 0 4px rgba(91,125,255,0.15)",
                  zIndex: 5,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: 91,
                  left: 84,
                  background: BRAND,
                  color: "#fff",
                  fontFamily: FONT.sans,
                  fontSize: 13,
                  fontWeight: 700,
                  padding: "4px 12px",
                  borderRadius: 8,
                  zIndex: 5,
                }}
              >
                官方域名
              </div>
            </div>
          </FloatWrap>
        </SpringIn>
      </AbsoluteFill>
    </SceneBg>
  );
};

// P11 浏览器框（DeviceFrame v2 + 官网 hero 特写 1.5x）
const DeviceFrameBrowser: React.FC<{ w: number }> = ({ w }) => (
  <DeviceFrame
    frame="browser"
    tone="dark"
    title="LeKao · AI 智能助教助手"
    domain="lekao.asterforge.top"
    src={staticFile("lekao/lekao-home.png")}
    zoom={1.5}
    offsetY={60}
    width={w}
  />
);

const SCENES: React.FC[] = [Scene01, Scene02, Scene03, Scene04, Scene05, Scene06, Scene07, Scene08, Scene09, Scene10, Scene11];

// 单页：0.5s 交叉溶解（与 v1/v2 同机制），页内为 v3 场景 + 页音频 + 顶部进度条
const V2Page: React.FC<{ index: number; pageSeconds: number }> = ({ index, pageSeconds }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fadeIn = spring({ frame, fps, config: SPRING });
  const fadeOut = spring({
    frame: Math.max(0, frame - Math.round((pageSeconds - deckParams.overlapSeconds) * fps)),
    fps,
    config: SPRING,
  });
  const Scene = SCENES[index - 1];
  const dark = DARK_PAGES.includes(index);
  return (
    <AbsoluteFill style={{ opacity: fadeIn * (1 - fadeOut) }}>
      <Scene />
      <TopProgress
        from={(index - 1) / SCENES.length}
        to={index / SCENES.length}
        color={dark ? BRAND_LIGHT : BRAND}
        trackColor={dark ? "rgba(255,255,255,0.12)" : "rgba(26,34,51,0.10)"}
      />
      <Audio src={staticFile(`deck/audio/page-${index}.wav`)} />
    </AbsoluteFill>
  );
};

export const DeckVideoV2: React.FC = () => {
  const { fps } = useVideoConfig();
  const pageOf = (i: number) => deckParams.pages.find((p) => p.index === i)!;
  // 深底页时间区间（字幕面板换深色调）
  const darkRanges = deckParams.pages
    .filter((p) => DARK_PAGES.includes(p.index))
    .map((p) => ({ from: p.start, to: p.start + p.pageSeconds }));
  // 去重：画面大字与字幕重复段（P1 两段 / P10 两段 / P11 两段）
  const span = (i: number, text: string) => {
    const p = pageOf(i);
    return { from: p.start, to: p.start + p.pageSeconds, text };
  };
  const dedupe = [
    span(1, "LeKao · AI 智能助教助手"),
    span(1, "K12 机构助教的 AI 工作台"),
    span(10, "记住一句话就够了"),
    span(10, "把每次课的 1 到 2 小时，还给教学"),
    span(11, "打开官网，现在就能试"),
    span(11, "每次课，省回 1 到 2 小时"),
  ];
  return (
    // 全局字体接入（F2）：全片任何文字不得落回浏览器默认衬线
    <AbsoluteFill style={{ backgroundColor: "#000", fontFamily: FONT.sans }}>
      {deckParams.pages.map((page) => (
        <Sequence
          key={page.index}
          from={Math.round(page.start * fps)}
          durationInFrames={Math.round((page.pageSeconds + deckParams.overlapSeconds) * fps)}
        >
          <V2Page index={page.index} pageSeconds={page.pageSeconds} />
        </Sequence>
      ))}
      <SubtitleTrack cues={deckCues} theme="panel" darkRanges={darkRanges} dedupe={dedupe} keywords={["LeKao", "T-Coin", "Word", "Excel", "AI"]} />
    </AbsoluteFill>
  );
};
