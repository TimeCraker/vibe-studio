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
import { ChartGrow } from "./scene-kit/ChartGrow";
import { ChatReplay } from "./scene-kit/ChatReplay";
import { CountUp } from "./scene-kit/CountUp";
import { DeviceFrame } from "./scene-kit/DeviceFrame";
import { FloatWrap } from "./scene-kit/FloatWrap";
import { GlowPulse } from "./scene-kit/GlowPulse";
import { SceneBg } from "./scene-kit/SceneBg";
import { SceneShell } from "./scene-kit/SceneShell";
import { StaggerList } from "./scene-kit/StaggerList";
import { SubtitleTrack } from "./fx/SubtitleTrack";
import { TextReveal } from "./scene-kit/TextReveal";
import { TypingTerminal } from "./scene-kit/TypingTerminal";
import { deckCues } from "./deck-cues";
import { deckParams } from "./deck-params";
import { FONT } from "./scene-kit/tokens";

// DeckVideoV2 — 场景化成片（v2）：画面主体为 Remotion 原生动效场景（scene-kit 组合），
// PPT 降级为内容来源。页时长/起点/音频/字幕时间轴全部复用 v1 派生机制
// （build-deck-params.mjs 生成的 deck-params.ts / deck-cues.ts），换配音后重跑即换音。
// 场景设计依据：output/video-motion/lekao-intro/scene-design.md（已复核）。
// 确定性：无随机源、无时钟取值。

const SPRING = { damping: 200, stiffness: 120, mass: 1 };
const ACCENT = "#3157F6";
const ACCENT_LIGHT = "#8FA8FF"; // 深底上的钴蓝提亮档
const INK = "#111722";
const MUTED = "#64748b";
const MUTED_DARK = "#94a3b8";
const HAIRLINE = "rgba(17,23,34,0.14)";

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

// 杂志 chrome（SceneShell 之外的镜像/全屏构图复用）：眉题 + 标题 + 细线
const Chrome: React.FC<{
  eyebrow: string;
  chapter?: string;
  title: string;
  highlight?: { start: number; end: number };
  titleSize?: number;
  dark?: boolean;
}> = ({ eyebrow, chapter, title, highlight, titleSize = 58, dark = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: Math.max(0, frame - 0.05 * fps), fps, config: SPRING });
  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: "0.32em", textTransform: "uppercase", color: dark ? ACCENT_LIGHT : ACCENT, opacity: p }}>
          {eyebrow}
        </div>
        {chapter ? (
          <div style={{ fontFamily: "Consolas, monospace", fontSize: 18, fontWeight: 700, color: dark ? MUTED_DARK : MUTED, opacity: p }}>
            {chapter}
          </div>
        ) : null}
      </div>
      <div style={{ marginTop: 20 }}>
        <TextReveal
          text={title}
          mode="char"
          size={titleSize}
          weight={800}
          color={dark ? "#f8fafc" : INK}
          delay={0.12}
          highlights={highlight ? [{ start: highlight.start, end: highlight.end, color: dark ? ACCENT_LIGHT : ACCENT }] : []}
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
        marginTop: 24,
        height: 1,
        background: dark ? "rgba(255,255,255,0.16)" : HAIRLINE,
        transformOrigin: "left center",
        transform: `scaleX(${p.toFixed(3)})`,
      }}
    />
  );
};

// 插画卡：圆角白卡装官方示意插画，spring 入场由外层 SpringIn 负责
const IllustCard: React.FC<{ src: string; width: number; style?: React.CSSProperties }> = ({ src, width, style }) => (
  <div
    style={{
      width,
      borderRadius: 20,
      overflow: "hidden",
      background: "#FFFFFF",
      boxShadow: "0 30px 80px rgba(17,23,34,0.18)",
      border: "1px solid rgba(17,23,34,0.08)",
      ...style,
    }}
  >
    <Img src={staticFile(src)} style={{ width: "100%", display: "block" }} />
  </div>
);

// 步骤条目：mono 编号 + 加粗步骤名 + 弱化说明，左侧钴蓝竖线
const StepItem: React.FC<{ no: string; name: string; desc: string }> = ({ no, name, desc }) => (
  <div style={{ borderLeft: `4px solid ${ACCENT}`, paddingLeft: 22, paddingTop: 4, paddingBottom: 4 }}>
    <div style={{ fontFamily: "Consolas, monospace", fontSize: 14, fontWeight: 700, color: ACCENT, letterSpacing: "0.2em" }}>
      {no}
    </div>
    <div style={{ fontSize: 24, fontWeight: 700, color: INK, marginTop: 4 }}>{name}</div>
    <div style={{ fontSize: 16, fontWeight: 600, color: MUTED, marginTop: 4 }}>{desc}</div>
  </div>
);

// ── P1 · 01:11 品牌开场（dark）───────────────────────────────────────────
const Scene01: React.FC = () => (
  <SceneBg variant="dark">
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 34 }}>
        <GlowPulse size={620} intensity={0.5} style={{ top: -140 }} />
        <SpringIn delay={0.2}>
          <FloatWrap period={4.2}>
            <Img src={staticFile("lekao/lekao-mark.svg")} style={{ width: 150, height: 150 }} />
          </FloatWrap>
        </SpringIn>
        <TextReveal
          text="LeKao · AI 智能助教助手"
          mode="char"
          size={92}
          weight={800}
          color="#f8fafc"
          align="center"
          delay={0.7}
          highlights={[{ start: 0, end: 5, color: ACCENT_LIGHT }]}
        />
        <SpringIn delay={1.5}>
          <div style={{ fontSize: 26, fontWeight: 600, color: MUTED_DARK }}>
            K12 机构助教的 AI 工作台 · lekao.asterforge.top
          </div>
        </SpringIn>
      </div>
    </AbsoluteFill>
  </SceneBg>
);

// ── P2 · 02:11 叙事痛点：清单终端（light）────────────────────────────────
const Scene02: React.FC = () => (
  <SceneBg variant="light" grid>
    <SceneShell
      chapter="02 / 11"
      eyebrow="PAIN POINT · EVERY CLASS"
      title="每次课，1-2 小时耗在重复劳动上"
      highlight={{ start: 4, end: 10 }}
      titleSize={58}
      left={
        <div style={{ display: "flex", flexDirection: "column", gap: 26, justifyContent: "center", flex: 1 }}>
          <SpringIn delay={1.0}>
            <div style={{ fontSize: 24, fontWeight: 700, color: INK, lineHeight: 1.65 }}>
              抄错题、写小结、写反馈，
              <br />
              周而复始，全是手工活。
            </div>
          </SpringIn>
          <SpringIn delay={1.4}>
            <div style={{ fontSize: 18, fontWeight: 600, color: MUTED }}>每个班、每节课，都在重复同一套工序</div>
          </SpringIn>
        </div>
      }
    >
      <SpringIn delay={0.5} style={{ width: "100%", display: "flex", justifyContent: "center" }}>
        <TypingTerminal
          title="助教 · 晚间待办"
          cps={16}
          width={640}
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

// ── P3 · 03:11 产品总览：对话回放（light）────────────────────────────────
const Scene03: React.FC = () => (
  <SceneBg variant="light">
    <SceneShell
      chapter="03 / 11"
      eyebrow="LEKAO · TAKE OVER"
      title="三件事，LeKao 一次接走"
      highlight={{ start: 4, end: 9 }}
      titleSize={62}
      left={
        <div style={{ display: "flex", flexDirection: "column", gap: 24, justifyContent: "center", flex: 1 }}>
          <SpringIn delay={1.0}>
            <div style={{ fontSize: 24, fontWeight: 700, color: INK }}>课堂小结 · 作业反馈 · 错题集</div>
          </SpringIn>
          <SpringIn delay={1.4}>
            <div style={{ fontSize: 18, fontWeight: 600, color: MUTED, lineHeight: 1.6 }}>
              传一张讲义图，出来就是
              <br />
              能直接交的成品。
            </div>
          </SpringIn>
        </div>
      }
    >
      <SpringIn delay={0.4} style={{ width: "100%", display: "flex", justifyContent: "center" }}>
        <ChatReplay
          width={560}
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

// ── P4 · 04:11 功能演示：课堂小结（light，双栏 + 插画卡）─────────────────
const Scene04: React.FC = () => (
  <SceneBg variant="light" grid>
    <SceneShell
      chapter="04 / 11"
      eyebrow="FEATURE 01 · CLASS SUMMARY"
      title="一张讲义图，出一份成品"
      highlight={{ start: 7, end: 11 }}
      titleSize={60}
      left={
        <div style={{ display: "flex", flexDirection: "column", gap: 30, justifyContent: "center", flex: 1 }}>
          <StaggerList gap={150} delay={0.8}>
            <StepItem no="STEP 01" name="上传讲义图片" desc="拍照或截图均可" />
            <StepItem no="STEP 02" name="AI 读图识别" desc="学科 · 章节 · 知识点" />
            <StepItem no="STEP 03" name="生成成品" desc="10 条反馈 + 一段小结" />
          </StaggerList>
        </div>
      }
    >
      <div style={{ position: "relative", width: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <GlowPulse size={560} intensity={0.4} />
        <SpringIn delay={0.5}>
          <FloatWrap period={4.4}>
            <IllustCard src="lekao/feature-summary.png" width={600} />
          </FloatWrap>
        </SpringIn>
      </div>
    </SceneShell>
  </SceneBg>
);

// ── P5 · 05:11 功能演示：作业反馈（light，全屏大图 + 字数 chips）─────────
const Scene05: React.FC = () => (
  <SceneBg variant="light">
    <AbsoluteFill style={{ padding: "60px 96px 200px", display: "flex", flexDirection: "column" }}>
      <Chrome eyebrow="FEATURE 02 · FEEDBACK" chapter="05 / 11" title="逐题反馈，字数你定" highlight={{ start: 5, end: 9 }} titleSize={58} />
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 0 }}>
        <SpringIn delay={0.5}>
          <FloatWrap period={4.6}>
            <IllustCard src="lekao/feature-feedback.png" width={740} />
          </FloatWrap>
        </SpringIn>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 22 }}>
        <SpringIn delay={1.0}>
          <div style={{ fontSize: 20, fontWeight: 700, color: INK }}>字数四挡</div>
        </SpringIn>
        <StaggerList gap={110} direction="left" delay={1.2} style={{ flexDirection: "row", gap: 16 }}>
          {["标准", "×1.5", "×2", "×3"].map((t) => (
            <div
              key={t}
              style={{
                padding: "10px 26px",
                borderRadius: 999,
                background: "#FFFFFF",
                border: `1px solid ${HAIRLINE}`,
                fontFamily: t.startsWith("×") ? "Consolas, monospace" : "inherit",
                fontSize: 20,
                fontWeight: 700,
                color: INK,
                boxShadow: "0 10px 26px rgba(17,23,34,0.08)",
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

// ── P6 · 06:11 流程+演示：错题集（light，镜像双栏）───────────────────────
const Scene06: React.FC = () => (
  <SceneBg variant="light">
    <AbsoluteFill style={{ padding: "60px 96px 72px", display: "flex", flexDirection: "column" }}>
      <Chrome eyebrow="FEATURE 03 · MISTAKE BOOK" chapter="06 / 11" title="错题集：五分钟，全班一本" highlight={{ start: 4, end: 7 }} titleSize={58} />
      <div style={{ display: "flex", flex: 1, minHeight: 0, marginTop: 34, gap: 56 }}>
        <div style={{ flex: 1, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <SpringIn delay={0.5}>
            <FloatWrap period={4.2}>
              <IllustCard src="lekao/feature-mistake.png" width={580} />
            </FloatWrap>
          </SpringIn>
        </div>
        <div style={{ flex: "0 0 46%", display: "flex", flexDirection: "column", justifyContent: "center", gap: 30 }}>
          <StaggerList gap={140} delay={0.8}>
            <StepItem no="01" name="填 Excel 模板" desc="按模板登记错题信息" />
            <StepItem no="02" name="拖入题目图片" desc="批量拖拽上传" />
            <StepItem no="03" name="浏览器生成 Word" desc="5 分钟，全班一份" />
          </StaggerList>
          <SpringIn delay={1.8}>
            <div style={{ fontSize: 16, fontWeight: 600, color: MUTED }}>全程浏览器本地完成，不消耗 T-Coin</div>
          </SpringIn>
        </div>
      </div>
    </AbsoluteFill>
  </SceneBg>
);

// ── P7 · 07:11 数据说服：T-Coin（dark，递增柱状图）───────────────────────
const Scene07: React.FC = () => (
  <SceneBg variant="dark">
    <SceneShell
      tone="dark"
      chapter="07 / 11"
      eyebrow="T-COIN ECONOMY"
      title="T-Coin：签到领币，生成花币"
      highlight={{ start: 0, end: 5 }}
      titleSize={58}
      left={
        <div style={{ display: "flex", flexDirection: "column", gap: 32, justifyContent: "center", flex: 1 }}>
          <SpringIn delay={0.9}>
            <CountUp to={5} suffix=" 币 · 注册即送" size={62} color="#f8fafc" suffixColor={MUTED_DARK} delay={0.3} />
          </SpringIn>
          <SpringIn delay={1.3}>
            <CountUp to={1} suffix=" 币 · AI 生成一次" size={62} color="#f8fafc" suffixColor={MUTED_DARK} delay={0.5} />
          </SpringIn>
          <SpringIn delay={1.8}>
            <div style={{ fontSize: 20, fontWeight: 600, color: MUTED_DARK }}>生成失败，消耗的币自动退回</div>
          </SpringIn>
        </div>
      }
    >
      <SpringIn delay={0.5} style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <ChartGrow
          width={620}
          height={370}
          delay={0.8}
          barColor="#4c6fff"
          valueColor="#f8fafc"
          labelColor={MUTED_DARK}
          axisColor="rgba(255,255,255,0.22)"
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
        <div style={{ marginTop: 18, fontSize: 16, fontWeight: 600, color: MUTED_DARK }}>连续签到 7 日，每日奖励 2 币递增到 8 币</div>
      </SpringIn>
    </SceneShell>
  </SceneBg>
);

// ── P8 · 08:11 体验细节：手机好用的三件事（light，手机框真截图）──────────
const Scene08: React.FC = () => (
  <SceneBg variant="light">
    <SceneShell
      chapter="08 / 11"
      eyebrow="EXPERIENCE"
      title="手机上一样顺手"
      highlight={{ start: 0, end: 2 }}
      titleSize={60}
      left={
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", flex: 1 }}>
          <StaggerList gap={160} delay={0.8}>
            <StepItem no="A" name="图片自动压缩" desc="1280px / 0.4MB 以内，大图不卡" />
            <StepItem no="B" name="流式输出" desc="生成内容实时逐段显示" />
            <StepItem no="C" name="本地历史" desc="记录存浏览器，随时回看" />
          </StaggerList>
        </div>
      }
    >
      <div style={{ position: "relative", width: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <GlowPulse size={480} intensity={0.3} />
        <SpringIn delay={0.5}>
          <FloatWrap period={4.4}>
            <DeviceFrame frame="phone" src={staticFile("lekao/lekao-fullpage.png")} width={280} />
          </FloatWrap>
        </SpringIn>
      </div>
    </SceneShell>
  </SceneBg>
);

// ── P9 · 09:11 流程说明：三步上手（light，横排大编号卡）──────────────────
const Scene09: React.FC = () => {
  const cards = [
    { no: "01", name: "注册登录", desc: "邮箱 + 验证码" },
    { no: "02", name: "上传讲义图", desc: "小结 · 反馈 · 错题集" },
    { no: "03", name: "拿结果", desc: "Word 成品直接用" },
  ];
  return (
    <SceneBg variant="light">
      <AbsoluteFill style={{ padding: "60px 96px 72px", display: "flex", flexDirection: "column" }}>
        <Chrome eyebrow="GETTING STARTED" chapter="09 / 11" title="三步上手" highlight={{ start: 0, end: 2 }} titleSize={62} />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 40 }}>
          {cards.map((c, i) => (
            <React.Fragment key={c.no}>
              {i > 0 ? (
                <SpringIn delay={0.9 + i * 0.18}>
                  <div style={{ fontSize: 36, fontWeight: 800, color: ACCENT }}>→</div>
                </SpringIn>
              ) : null}
              <SpringIn delay={0.5 + i * 0.18}>
                <FloatWrap phase={i * 1.4} period={4.4} amp={6}>
                  <div
                    style={{
                      width: 420,
                      borderRadius: 22,
                      background: "#FFFFFF",
                      border: `1px solid ${HAIRLINE}`,
                      boxShadow: "0 24px 60px rgba(17,23,34,0.12)",
                      padding: "38px 40px",
                    }}
                  >
                    <div style={{ fontFamily: "Consolas, monospace", fontSize: 58, fontWeight: 800, color: ACCENT }}>{c.no}</div>
                    <div style={{ fontSize: 27, fontWeight: 800, color: INK, marginTop: 12 }}>{c.name}</div>
                    <div style={{ fontSize: 17, fontWeight: 600, color: MUTED, marginTop: 8 }}>{c.desc}</div>
                  </div>
                </FloatWrap>
              </SpringIn>
            </React.Fragment>
          ))}
        </div>
      </AbsoluteFill>
    </SceneBg>
  );
};

// ── P10 · 10:11 价值主张：金句（dark，对比插画横幅）──────────────────────
const Scene10: React.FC = () => (
  <SceneBg variant="dark">
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 30 }}>
        <GlowPulse size={680} intensity={0.4} style={{ top: -60 }} />
        <SpringIn delay={0.2}>
          <div style={{ fontSize: 25, fontWeight: 700, color: MUTED_DARK, letterSpacing: "0.1em" }}>记住一句话就够了</div>
        </SpringIn>
        <TextReveal
          text="把每次课的 1 到 2 小时，还给教学"
          mode="char"
          size={72}
          weight={800}
          color="#f8fafc"
          align="center"
          delay={0.5}
          highlights={[{ start: 6, end: 14, color: ACCENT_LIGHT }]}
        />
        <SpringIn delay={1.3}>
          <FloatWrap period={4.8}>
            <IllustCard src="lekao/value-time-comparison.png" width={560} />
          </FloatWrap>
        </SpringIn>
      </div>
    </AbsoluteFill>
  </SceneBg>
);

// ── P11 · 11:11 行动号召：CTA（dark，官网真截图）─────────────────────────
const Scene11: React.FC = () => (
  <SceneBg variant="dark">
    <AbsoluteFill style={{ flexDirection: "row", alignItems: "center", padding: "0 110px", gap: 64 }}>
      <div style={{ flex: 1, position: "relative", display: "flex", flexDirection: "column", gap: 30 }}>
        <GlowPulse size={520} intensity={0.35} style={{ left: -120, top: -60 }} />
        <Chrome eyebrow="GET STARTED" title="打开官网，现在就能试" highlight={{ start: 5, end: 10 }} titleSize={56} dark />
        <SpringIn delay={1.1}>
          <div style={{ fontFamily: "Consolas, monospace", fontSize: 30, fontWeight: 800, color: ACCENT_LIGHT }}>lekao.asterforge.top</div>
        </SpringIn>
        <SpringIn delay={1.4}>
          <div style={{ fontSize: 21, fontWeight: 600, color: MUTED_DARK }}>每次课，省回 1 到 2 小时</div>
        </SpringIn>
      </div>
      <SpringIn delay={0.6}>
        <FloatWrap period={4.6}>
          <DeviceFrame frame="browser" title="lekao.asterforge.top" src={staticFile("lekao/lekao-home.png")} width={640} />
        </FloatWrap>
      </SpringIn>
    </AbsoluteFill>
  </SceneBg>
);

const SCENES: React.FC[] = [Scene01, Scene02, Scene03, Scene04, Scene05, Scene06, Scene07, Scene08, Scene09, Scene10, Scene11];

// 单页：0.5s 交叉溶解（与 v1 同机制），页内为 v2 动效场景 + 页音频
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
  return (
    <AbsoluteFill style={{ opacity: fadeIn * (1 - fadeOut) }}>
      <Scene />
      <Audio src={staticFile(`deck/audio/page-${index}.wav`)} />
    </AbsoluteFill>
  );
};

export const DeckVideoV2: React.FC = () => {
  const { fps } = useVideoConfig();
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
      <SubtitleTrack cues={deckCues} />
    </AbsoluteFill>
  );
};
