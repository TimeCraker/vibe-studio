import React from "react";
import { AbsoluteFill, Composition, interpolate, Series, useCurrentFrame } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { mgFixtures } from "./fixtures";
import { DrawPath } from "./scene-kit/DrawPath";
import { FitText } from "./scene-kit/FitText";
import { NoiseField } from "./scene-kit/NoiseField";
import { ShapeMorph } from "./scene-kit/ShapeMorph";
import {
  CameraPush,
  CascadeList,
  ExposureIn,
  GrowIn,
  PopRotate,
  SlideGroup,
  TextBreath,
  WipeIn,
} from "./scene-kit/entrance-kit";
import { exposure, slideIn } from "./transitions";
import { COLOR, FONT, TYPE } from "./scene-kit/tokens";

// MG 武器库 demo:独立入口 remotion/mg-index.ts,不碰 Root.tsx 七组合契约。
// MgUtilityDemo = S1 纯函数武器,8 段 × 90 帧 = 720 帧;后续站在此文件追加新组合。

// 画布常量与 Root.tsx 契约一致(1920×1080@30)
const FPS = 30;
const WIDTH = 1920;
const HEIGHT = 1080;
const SEG = 90;

// 段标签:左上角 mono 小字,标段号与武器名(读图定位用)
const SegLabel: React.FC<{ n: number; text: string; dark?: boolean }> = ({ n, text, dark }) => (
  <div
    style={{
      position: "absolute",
      left: 64,
      top: 56,
      fontFamily: FONT.mono,
      fontSize: TYPE.monoMin,
      color: dark ? "rgba(255,255,255,.55)" : "rgba(26,34,51,.5)",
      letterSpacing: 1,
    }}
  >
    {String(n).padStart(2, "0")} / {text}
  </div>
);

const lightBg: React.CSSProperties = { backgroundColor: COLOR.paper };
const darkBg: React.CSSProperties = { backgroundColor: COLOR.dark0 };

// 1) 下划线生长
const SegUnderline: React.FC = () => (
  <AbsoluteFill style={lightBg}>
    <SegLabel n={1} text={mgFixtures.underlineCaption} />
    <div style={{ position: "absolute", left: 640, top: 420 }}>
      <div style={{ fontSize: TYPE.display, fontWeight: 800, color: COLOR.ink, fontFamily: FONT.sans }}>
        {mgFixtures.drawTitle}
      </div>
      <DrawPath shape="underline" width={640} height={60} dur={0.7} delay={0.4} endDot />
    </div>
  </AbsoluteFill>
);

// 2) 引线箭头:指向右下卡片
const SegArrow: React.FC = () => (
  <AbsoluteFill style={lightBg}>
    <SegLabel n={2} text={mgFixtures.arrowCaption} />
    <div
      style={{
        position: "absolute",
        left: 200,
        top: 300,
        width: 420,
        padding: "28px 32px",
        backgroundColor: COLOR.paperCard,
        borderRadius: 18,
        boxShadow: "0 2px 6px rgba(15,23,42,.07), 0 14px 40px rgba(15,23,42,.12)",
        fontSize: TYPE.body,
        fontFamily: FONT.sans,
        color: COLOR.ink,
        fontWeight: 600,
      }}
    >
      目标卡片
    </div>
    <div style={{ position: "absolute", left: 660, top: 460 }}>
      <DrawPath shape="arrow" width={480} height={90} dur={0.8} delay={0.5} endDot strokeWidth={7} />
    </div>
  </AbsoluteFill>
);

// 3) 圈注:圈住数字徽章
const SegCircle: React.FC = () => (
  <AbsoluteFill style={lightBg}>
    <SegLabel n={3} text={mgFixtures.circleCaption} />
    <div
      style={{
        position: "absolute",
        left: 810,
        top: 330,
        width: 300,
        height: 300,
        borderRadius: "50%",
        backgroundColor: COLOR.paperCard,
        boxShadow: "0 8px 20px rgba(5,10,20,.35), 0 32px 80px rgba(5,10,20,.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 130,
        fontWeight: 800,
        fontFamily: FONT.sans,
        color: COLOR.brand,
      }}
    >
      3
    </div>
    <div style={{ position: "absolute", left: 770, top: 290 }}>
      <DrawPath shape="circle" width={380} height={380} dur={0.9} delay={0.4} strokeWidth={7} />
    </div>
  </AbsoluteFill>
);

// 4) 形状渐变:前半 rect→circle,后半 circle→star(progress 外驱)
const SegMorph: React.FC = () => {
  const frame = useCurrentFrame();
  const p =
    frame < SEG / 2
      ? interpolate(frame, [0, SEG / 2], [0, 0.5])
      : interpolate(frame, [SEG / 2, SEG], [0.5, 1]);
  return (
    <AbsoluteFill style={lightBg}>
      <SegLabel n={4} text={mgFixtures.morphCaption} />
      <div style={{ position: "absolute", left: 850, top: 420 }}>
        <ShapeMorph from="rect" to="star" width={220} height={220} progress={p} />
      </div>
    </AbsoluteFill>
  );
};

// 5) 颗粒场 · 浅族
const SegNoiseLight: React.FC = () => (
  <AbsoluteFill style={lightBg}>
    <NoiseField variant="light" />
    <SegLabel n={5} text={mgFixtures.noiseCaptionLight} />
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: 460,
        textAlign: "center",
        fontSize: TYPE.display,
        fontWeight: 800,
        fontFamily: FONT.sans,
        color: COLOR.ink,
      }}
    >
      {mgFixtures.noiseTitleLight}
    </div>
  </AbsoluteFill>
);

// 6) 颗粒场 · 深族
const SegNoiseDark: React.FC = () => (
  <AbsoluteFill style={darkBg}>
    <NoiseField variant="dark" />
    <SegLabel n={6} text={mgFixtures.noiseCaptionDark} dark />
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: 460,
        textAlign: "center",
        fontSize: TYPE.display,
        fontWeight: 800,
        fontFamily: FONT.sans,
        color: "#FFFFFF",
      }}
    >
      {mgFixtures.noiseTitleDark}
    </div>
  </AbsoluteFill>
);

// 7) FitText 单行:超长标题自动缩号
const SegFitSingle: React.FC = () => (
  <AbsoluteFill style={lightBg}>
    <SegLabel n={7} text={mgFixtures.fitCaptionSingle} />
    <div style={{ position: "absolute", left: 160, top: 430 }}>
      <FitText text={mgFixtures.fitLong} targetWidth={1600} targetHeight={220} />
    </div>
  </AbsoluteFill>
);

// 8) FitText 两行封顶
const SegFitTwo: React.FC = () => (
  <AbsoluteFill style={lightBg}>
    <SegLabel n={8} text={mgFixtures.fitCaptionTwo} />
    <div style={{ position: "absolute", left: 260, top: 320 }}>
      <FitText text={mgFixtures.fitTwoLine} targetWidth={1400} targetHeight={440} maxLines={2} />
    </div>
  </AbsoluteFill>
);

export const MgUtilityDemo: React.FC = () => (
  <Series>
    <Series.Sequence durationInFrames={SEG}>
      <SegUnderline />
    </Series.Sequence>
    <Series.Sequence durationInFrames={SEG}>
      <SegArrow />
    </Series.Sequence>
    <Series.Sequence durationInFrames={SEG}>
      <SegCircle />
    </Series.Sequence>
    <Series.Sequence durationInFrames={SEG}>
      <SegMorph />
    </Series.Sequence>
    <Series.Sequence durationInFrames={SEG}>
      <SegNoiseLight />
    </Series.Sequence>
    <Series.Sequence durationInFrames={SEG}>
      <SegNoiseDark />
    </Series.Sequence>
    <Series.Sequence durationInFrames={SEG}>
      <SegFitSingle />
    </Series.Sequence>
    <Series.Sequence durationInFrames={SEG}>
      <SegFitTwo />
    </Series.Sequence>
  </Series>
);

export const MgDemoRoot: React.FC = () => (
  <>
    <Composition
      id="MgUtilityDemo"
      component={MgUtilityDemo}
      durationInFrames={8 * SEG}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
    />
    <Composition
      id="MgTransitionDemo"
      component={MgTransitionDemo}
      durationInFrames={11 * 60}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
    />
  </>
);

// ============ MgTransitionDemo(S2):九动词 + 两种页间转场,11 段 × 60 帧 ============

const TSEG = 60;

const TCard: React.FC<{ text: string; dark?: boolean }> = ({ text, dark }) => (
  <div
    style={{
      padding: "36px 48px",
      borderRadius: 20,
      backgroundColor: dark ? COLOR.darkCard : COLOR.paperCard,
      color: dark ? "#fff" : COLOR.ink,
      fontFamily: FONT.sans,
      fontSize: TYPE.title,
      fontWeight: 800,
      boxShadow: dark
        ? "0 8px 20px rgba(5,10,20,.35), 0 32px 80px rgba(5,10,20,.45)"
        : "0 2px 6px rgba(15,23,42,.07), 0 14px 40px rgba(15,23,42,.12)",
    }}
  >
    {text}
  </div>
);

const TSeg: React.FC<{ n: number; text: string; dark?: boolean; children: React.ReactNode }> = ({ n, text, dark, children }) => (
  <AbsoluteFill style={dark ? darkBg : lightBg}>
    <SegLabel n={n} text={text} dark={dark} />
    <div style={{ position: "absolute", left: 0, right: 0, top: 440, display: "flex", justifyContent: "center", alignItems: "center" }}>
      {children}
    </div>
  </AbsoluteFill>
);

const MgTransitionDemo: React.FC = () => (
  <Series>
    <Series.Sequence durationInFrames={TSEG}>
      <TSeg n={9} text="SlideGroup · left">
        <SlideGroup direction="left">
          <TCard text="方向性滑入" />
        </SlideGroup>
      </TSeg>
    </Series.Sequence>
    <Series.Sequence durationInFrames={TSEG}>
      <TSeg n={10} text="SlideGroup · up">
        <SlideGroup direction="up">
          <TCard text="自下进位" />
        </SlideGroup>
      </TSeg>
    </Series.Sequence>
    <Series.Sequence durationInFrames={TSEG}>
      <TSeg n={11} text="ExposureIn · 曝光渐起" dark>
        <ExposureIn>
          <TCard text="灯打上来" dark />
        </ExposureIn>
      </TSeg>
    </Series.Sequence>
    <Series.Sequence durationInFrames={TSEG}>
      <TSeg n={12} text="WipeIn · 擦亮">
        <WipeIn>
          <TCard text="从左揭示" />
        </WipeIn>
      </TSeg>
    </Series.Sequence>
    <Series.Sequence durationInFrames={TSEG}>
      <TSeg n={13} text="GrowIn · 生长">
        <GrowIn>
          <TCard text="长大落位" />
        </GrowIn>
      </TSeg>
    </Series.Sequence>
    <Series.Sequence durationInFrames={TSEG}>
      <TSeg n={14} text="PopRotate · 弹落摇摆">
        <PopRotate>
          <TCard text="落定回弹" />
        </PopRotate>
      </TSeg>
    </Series.Sequence>
    <Series.Sequence durationInFrames={TSEG}>
      <TSeg n={15} text="CascadeList · 280ms 级联">
        <CascadeList stepMs={280}>
          <TCard text="第一项" />
          <TCard text="第二项" />
          <TCard text="第三项" />
        </CascadeList>
      </TSeg>
    </Series.Sequence>
    <Series.Sequence durationInFrames={TSEG}>
      <TSeg n={16} text="CameraPush · 慢推(演示档 2%/s)">
        <CameraPush ratePerSec={0.02}>
          <TCard text="整页缓推" />
        </CameraPush>
      </TSeg>
    </Series.Sequence>
    <Series.Sequence durationInFrames={TSEG}>
      <TSeg n={17} text="TextBreath · 呼吸(演示档 4%)">
        <TextBreath amp={0.04} period={1.5}>
          <TCard text="活着的大字" />
        </TextBreath>
      </TSeg>
    </Series.Sequence>
    <Series.Sequence durationInFrames={TSEG}>
      {/* 页间转场真机演示:slideIn 盖场(旧页冻结)——转场 20 帧吃掉相邻页各半,40+40-20=60 */}
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={40}>
          <TSeg n={18} text="Transition · slideIn 盖场">
            <TCard text="旧页(会被盖住)" />
          </TSeg>
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition timing={linearTiming({ durationInFrames: 20 })} presentation={slideIn()} />
        <TransitionSeries.Sequence durationInFrames={40}>
          <TSeg n={18} text="Transition · slideIn 盖场">
            <TCard text="新页滑上来" dark />
          </TSeg>
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </Series.Sequence>
    <Series.Sequence durationInFrames={TSEG}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={40}>
          <TSeg n={19} text="Transition · exposure 曝光" dark>
            <TCard text="暗场" dark />
          </TSeg>
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition timing={linearTiming({ durationInFrames: 20 })} presentation={exposure()} />
        <TransitionSeries.Sequence durationInFrames={40}>
          <TSeg n={19} text="Transition · exposure 曝光">
            <TCard text="亮场" />
          </TSeg>
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </Series.Sequence>
  </Series>
);
