import React from "react";
import {
  AbsoluteFill,
  Composition,
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
import { TextReveal } from "./scene-kit/TextReveal";
import { TypingTerminal } from "./scene-kit/TypingTerminal";

// scene-kit 零件 demo：kit-basics（Stage 0 基础层）与 kit-narrative（Stage 1 叙事组件）。
// 独立入口 remotion/demo-index.ts，不进 Root.tsx；段内 useCurrentFrame 均为段本地帧。
// 确定性铁律：无随机源、无时钟取值，动画全部 spring/sin/interpolate 派生。
const FPS = 30;
const WIDTH = 1920;
const HEIGHT = 1080;
const ACCENT = "#3157F6";
const INK = "#111722";
const INK_MUTED = "#64748b";
const PAPER = "#FFFFFF";

const SPRING_CONFIG = { damping: 200, stiffness: 120, mass: 1 };

// 段首说明标签（左下角小字，demo 导航用）
const SegmentTag: React.FC<{ label: string }> = ({ label }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame, fps, config: SPRING_CONFIG });
  return (
    <div
      style={{
        position: "absolute",
        left: 48,
        bottom: 40,
        fontFamily: "Consolas, monospace",
        fontSize: 20,
        fontWeight: 700,
        color: "rgba(100,116,139,0.95)",
        opacity: p,
      }}
    >
      {label}
    </div>
  );
};

// ── kit-basics 段落 ──────────────────────────────────────────────────────
const SegBgLight: React.FC = () => (
  <SceneBg variant="light">
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <TextReveal text={"SceneBg · light\n杂志米白 #F5F1E8，纯色干净"} mode="line" size={54} align="center" />
    </AbsoluteFill>
    <SegmentTag label="01 SceneBg light" />
  </SceneBg>
);

const SegBgDark: React.FC = () => (
  <SceneBg variant="dark">
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <TextReveal text={"SceneBg · dark\n深蓝微渐变 + 轻暗角"} mode="line" size={54} align="center" color="#f8fafc" />
    </AbsoluteFill>
    <SegmentTag label="02 SceneBg dark" />
  </SceneBg>
);

const SegFloat: React.FC = () => (
  <SceneBg variant="light">
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 60, flexDirection: "row" }}>
      <FloatWrap phase={0} period={3.6}>
        <div style={{ width: 260, height: 170, borderRadius: 18, background: PAPER, boxShadow: "0 24px 60px rgba(17,23,34,0.14)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 700, color: INK }}>
          卡片 A · phase 0
        </div>
      </FloatWrap>
      <FloatWrap phase={2.1} period={4.4}>
        <div style={{ width: 260, height: 170, borderRadius: 18, background: PAPER, boxShadow: "0 24px 60px rgba(17,23,34,0.14)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 700, color: INK }}>
          卡片 B · phase 2.1
        </div>
      </FloatWrap>
    </AbsoluteFill>
    <SegmentTag label="03 FloatWrap · sin ±8px 相位错开" />
  </SceneBg>
);

const SegTextChar: React.FC = () => (
  <SceneBg variant="light">
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 1200 }}>
        {/* 高亮区间按字符序号：每次课，省回 1-2 小时 → 1-2 = [7, 10) */}
        <TextReveal text="每次课，省回 1-2 小时" mode="char" size={88} highlights={[{ start: 7, end: 10, color: ACCENT }]} />
        <div style={{ marginTop: 28, fontSize: 22, color: INK_MUTED, fontFamily: "Consolas, monospace" }}>
          TextReveal · char · highlights [7,10)
        </div>
      </div>
    </AbsoluteFill>
    <SegmentTag label="04 TextReveal char + 高亮" />
  </SceneBg>
);

const SegTextLine: React.FC = () => (
  <SceneBg variant="light">
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <TextReveal
        text={"上传一张讲义图\nAI 识别学科、章节、知识点\n10 条反馈加一段小结"}
        mode="line"
        size={58}
        highlights={[{ start: 1, end: 2, color: ACCENT }]}
      />
    </AbsoluteFill>
    <SegmentTag label="05 TextReveal line · 0.12s 错峰" />
  </SceneBg>
);

const SegStagger: React.FC = () => (
  <SceneBg variant="light">
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 860 }}>
        <StaggerList gap={110} direction="up">
          {["抄错题：每节课后重新整理一遍", "写小结：每节课都要写一段", "写反馈：作业逐题给出反馈"].map((t) => (
            <div key={t} style={{ background: PAPER, borderRadius: 14, padding: "22px 30px", fontSize: 26, fontWeight: 700, color: INK, boxShadow: "0 16px 40px rgba(17,23,34,0.10)" }}>
              {t}
            </div>
          ))}
        </StaggerList>
      </div>
    </AbsoluteFill>
    <SegmentTag label="06 StaggerList · 110ms 错峰" />
  </SceneBg>
);

const SegShell: React.FC = () => (
  <SceneBg variant="light" grid>
    <SceneShell
      chapter="01 / 03"
      eyebrow="LEKAO · CLASS SUMMARY"
      title="课堂小结：一张图出一份成品"
      highlight={{ start: 5, end: 9 }}
      left={
        <StaggerList gap={120} delay={0.5}>
          {["上传讲义图片，拍照或截图均可", "AI 读图识别学科、章节、知识点", "按固定格式生成，直接能用"].map((t) => (
            <div key={t} style={{ fontSize: 24, fontWeight: 600, color: INK, lineHeight: 1.5, paddingLeft: 22, borderLeft: `4px solid ${ACCENT}` }}>
              {t}
            </div>
          ))}
        </StaggerList>
      }
    >
      <FloatWrap phase={0.8}>
        <div style={{ width: 560, height: 360, borderRadius: 20, background: PAPER, boxShadow: "0 30px 80px rgba(17,23,34,0.16)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 700, color: INK_MUTED }}>
          主体插槽（右 45%）
        </div>
      </FloatWrap>
    </SceneShell>
    <SegmentTag label="07 SceneShell · 眉题+章节号+大标题+细线+双栏" />
  </SceneBg>
);

// 段长（秒）：3 / 3 / 3 / 3 / 2 / 2 / 4 = 20s
export const KitBasics: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <Sequence from={0} durationInFrames={3 * FPS}><SegBgLight /></Sequence>
      <Sequence from={3 * FPS} durationInFrames={3 * FPS}><SegBgDark /></Sequence>
      <Sequence from={6 * FPS} durationInFrames={3 * FPS}><SegFloat /></Sequence>
      <Sequence from={9 * FPS} durationInFrames={3 * FPS}><SegTextChar /></Sequence>
      <Sequence from={12 * FPS} durationInFrames={2 * FPS}><SegTextLine /></Sequence>
      <Sequence from={14 * FPS} durationInFrames={2 * FPS}><SegStagger /></Sequence>
      <Sequence from={16 * FPS} durationInFrames={4 * FPS}><SegShell /></Sequence>
    </AbsoluteFill>
  );
};

// ── kit-narrative 段落（Stage 1 叙事组件）─────────────────────────────
const SegTerminal: React.FC = () => (
  <SceneBg variant="light">
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <TypingTerminal
        title="lekao · generate"
        lines={[
          "$ lekao upload lecture-0413.png",
          "reading image ... ok",
          "subject: math  chapter: quadratic",
          "generating 10 feedback items ...",
          "done in 8.2s  (1 coin)",
        ]}
        cps={20}
      />
    </AbsoluteFill>
    <SegmentTag label="01 TypingTerminal · 逐行打字 + 光标" />
  </SceneBg>
);

const SegChat: React.FC = () => (
  <SceneBg variant="light">
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <ChatReplay
        messages={[
          { side: "user", text: "第四节课的小结好了吗？" },
          { side: "ai", text: "已读取讲义，识别：数学 · 二次函数" },
          { side: "ai", text: "10 条反馈 + 一段小结，生成完毕" },
          { side: "user", text: "反馈发我一份" },
          { side: "ai", text: "已生成，字数用标准挡" },
        ]}
      />
    </AbsoluteFill>
    <SegmentTag label="02 ChatReplay · 气泡弹出 + 正在输入" />
  </SceneBg>
);

const SegCountUp: React.FC = () => (
  <SceneBg variant="dark">
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <GlowPulse size={480} intensity={0.55} />
          <CountUp to={120} suffix=" 分钟" size={150} color="#f8fafc" suffixColor="#F5C518" delay={0.4} durationInSec={1.2} />
        </div>
        <div style={{ fontSize: 24, fontWeight: 600, color: "#94a3b8" }}>
          每次课省回的时间（演示数据）· CountUp + GlowPulse
        </div>
      </div>
    </AbsoluteFill>
    <SegmentTag label="03 CountUp + GlowPulse" />
  </SceneBg>
);

const SegChart: React.FC = () => (
  <SceneBg variant="dark">
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div>
        <ChartGrow
          width={760}
          bars={[
            { label: "抄错题", value: 35, unit: "min" },
            { label: "写小结", value: 25, unit: "min" },
            { label: "写反馈", value: 40, unit: "min" },
          ]}
          delay={0.4}
          barColor="#4c6fff"
          valueColor="#f8fafc"
          labelColor="#94a3b8"
          axisColor="rgba(255,255,255,0.22)"
        />
        <div style={{ marginTop: 26, textAlign: "center", fontSize: 20, color: "#94a3b8", fontWeight: 600 }}>
          每次课三件重复事耗时（演示数据）· ChartGrow
        </div>
      </div>
    </AbsoluteFill>
    <SegmentTag label="04 ChartGrow · 错峰长高" />
  </SceneBg>
);

const SegBrowser: React.FC = () => (
  <SceneBg variant="light">
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <DeviceFrame frame="browser" title="lekao.asterforge.top" src={staticFile("lekao/lekao-home.png")} />
    </AbsoluteFill>
    <SegmentTag label="05 DeviceFrame · browser（真实截图）" />
  </SceneBg>
);

const SegPhone: React.FC = () => (
  <SceneBg variant="light">
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <DeviceFrame frame="phone" src={staticFile("lekao/lekao-fullpage.png")} width={330} />
    </AbsoluteFill>
    <SegmentTag label="06 DeviceFrame · phone（真实截图）" />
  </SceneBg>
);

// 段长（秒）：7 / 6 / 4 / 5 / 4 / 4 = 30s
export const KitNarrative: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <Sequence from={0} durationInFrames={7 * FPS}><SegTerminal /></Sequence>
      <Sequence from={7 * FPS} durationInFrames={6 * FPS}><SegChat /></Sequence>
      <Sequence from={13 * FPS} durationInFrames={4 * FPS}><SegCountUp /></Sequence>
      <Sequence from={17 * FPS} durationInFrames={5 * FPS}><SegChart /></Sequence>
      <Sequence from={22 * FPS} durationInFrames={4 * FPS}><SegBrowser /></Sequence>
      <Sequence from={26 * FPS} durationInFrames={4 * FPS}><SegPhone /></Sequence>
    </AbsoluteFill>
  );
};

export const KitDemoRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="kit-basics"
        component={KitBasics}
        durationInFrames={20 * FPS}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="kit-narrative"
        component={KitNarrative}
        durationInFrames={30 * FPS}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
    </>
  );
};
