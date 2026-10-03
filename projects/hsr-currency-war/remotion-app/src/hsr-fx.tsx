import React from "react";
import {
  AbsoluteFill,
  Sequence,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { COLOR, FONT, RIM, SHADOW } from "./scene-kit/tokens";
import type {
  ChapterCardCue,
  DamageCardCue,
  EndCardCue,
  NameBannerCue,
  TitleCardCue,
} from "./hsr-cues";

// 规矩：spring/淡出一律取 Sequence 内的局部帧（内层组件），外层只负责 Sequence 的 from/dur。
// 呼吸进行时证据：frame 的纯函数（确定性），完成态帧不读作定格。

const useBreath = (amp = 0.012, period = 90) => {
  const frame = useCurrentFrame();
  const s = Math.sin((frame / period) * Math.PI * 2);
  return 1 + (s * amp) / 2 + amp / 2; // 1 .. 1+amp
};

const useFade = (durationInFrames: number, fadeSeconds = 0.3) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const inS = spring({ frame, fps, config: { damping: 200 } });
  const outAt = durationInFrames - Math.round(fadeSeconds * fps);
  const outS = 1 - spring({ frame: Math.max(0, frame - outAt), fps, config: { damping: 200 } });
  return { inS, outS, opacity: inS * outS };
};

// ---------- 开场标题卡 ----------
const TitleCardInner: React.FC<{ cue: TitleCardCue; durationInFrames: number }> = ({
  cue,
  durationInFrames,
}) => {
  const { width } = useVideoConfig();
  const narrow = width < 1300;
  const { opacity } = useFade(durationInFrames, 0.35);
  const inS = useFade(durationInFrames, 0.35).inS;
  const breath = useBreath(0.008, 120);
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "flex-start", padding: narrow ? "0 64px" : "0 120px" }}>
      <div
        style={{
          background: "rgba(5, 8, 16, 0.62)",
          border: `1px solid ${COLOR.lineDark}`,
          boxShadow: SHADOW.float,
          borderRadius: 18,
          padding: narrow ? "30px 40px 28px" : "44px 64px 40px",
          maxWidth: narrow ? "100%" : 1420,
          opacity,
          transform: `translateX(${(1 - inS) * -46}px) scale(${breath})`,
        }}
      >
        <div
          style={{
            fontFamily: FONT.sans,
            fontSize: narrow ? 24 : 30,
            fontWeight: 700,
            letterSpacing: 6,
            color: "#8FA8FF",
            marginBottom: 18,
          }}
        >
          {cue.kicker}
        </div>
        <div
          style={{
            fontFamily: FONT.sans,
            fontSize: narrow ? 84 : 128,
            fontWeight: 900,
            lineHeight: 1.12,
            color: "#F5F7FF",
            textShadow: "0 2px 18px rgba(0,0,0,.45)",
          }}
        >
          {cue.title}
        </div>
        {cue.sub ? (
          <div style={{ fontFamily: FONT.sans, fontSize: narrow ? 28 : 34, color: "rgba(235,240,255,.82)", marginTop: 20 }}>
            {cue.sub}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

export const TitleCard: React.FC<{ cue: TitleCardCue; durationInFrames: number }> = ({
  cue,
  durationInFrames,
}) => {
  const { fps } = useVideoConfig();
  return (
    <Sequence from={Math.round(cue.t * fps)} durationInFrames={durationInFrames}>
      <TitleCardInner cue={cue} durationInFrames={durationInFrames} />
    </Sequence>
  );
};

// ---------- 段落卡 ----------
const ChapterCardInner: React.FC<{ cue: ChapterCardCue; durationInFrames: number }> = ({
  cue,
  durationInFrames,
}) => {
  const { opacity, inS } = useFade(durationInFrames);
  return (
    <AbsoluteFill style={{ alignItems: "flex-start" }}>
      <div
        style={{
          marginTop: 250,
          marginLeft: 110,
          display: "flex",
          alignItems: "baseline",
          gap: 18,
          background: "rgba(255,255,255,0.9)",
          border: `1px solid ${COLOR.line}`,
          boxShadow: RIM.light + ", " + SHADOW.float,
          borderRadius: 12,
          padding: "16px 30px",
          opacity,
          transform: `translateX(${(1 - inS) * -30}px)`,
        }}
      >
        <span style={{ fontFamily: FONT.mono, fontSize: 26, fontWeight: 700, color: COLOR.brand }}>
          {cue.index}
        </span>
        <span style={{ fontFamily: FONT.sans, fontSize: 40, fontWeight: 900, color: COLOR.ink }}>
          {cue.name}
        </span>
      </div>
    </AbsoluteFill>
  );
};

export const ChapterCard: React.FC<{ cue: ChapterCardCue; durationInFrames: number }> = ({
  cue,
  durationInFrames,
}) => {
  const { fps } = useVideoConfig();
  return (
    <Sequence from={Math.round(cue.t * fps)} durationInFrames={durationInFrames}>
      <ChapterCardInner cue={cue} durationInFrames={durationInFrames} />
    </Sequence>
  );
};

// ---------- 姓名条 ----------
const NameBannerInner: React.FC<{ cue: NameBannerCue; durationInFrames: number }> = ({
  cue,
  durationInFrames,
}) => {
  const { opacity, inS } = useFade(durationInFrames);
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end" }}>
      <div
        style={{
          marginLeft: 120,
          marginBottom: 190,
          display: "inline-flex",
          alignItems: "baseline",
          gap: 24,
          alignSelf: "flex-start",
          background: "rgba(255,255,255,0.92)",
          borderRadius: 14,
          border: `1px solid ${COLOR.line}`,
          boxShadow: RIM.light + ", " + SHADOW.float,
          padding: "20px 44px",
          opacity,
          transform: `translateY(${(1 - inS) * 36}px)`,
        }}
      >
        <span style={{ fontFamily: FONT.sans, fontSize: 62, fontWeight: 900, color: COLOR.brand }}>
          {cue.name}
        </span>
        <span style={{ fontFamily: FONT.sans, fontSize: 32, fontWeight: 600, color: COLOR.inkSoft }}>
          {cue.tag}
        </span>
      </div>
    </AbsoluteFill>
  );
};

export const NameBanner: React.FC<{ cue: NameBannerCue; durationInFrames: number }> = ({
  cue,
  durationInFrames,
}) => {
  const { fps } = useVideoConfig();
  return (
    <Sequence from={Math.round(cue.t * fps)} durationInFrames={durationInFrames}>
      <NameBannerInner cue={cue} durationInFrames={durationInFrames} />
    </Sequence>
  );
};

// ---------- 伤害重放卡 ----------
const DamageCardInner: React.FC<{ cue: DamageCardCue; durationInFrames: number }> = ({
  cue,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const punch = spring({ frame, fps, config: { damping: 12, mass: 0.7 } });
  const outAt = durationInFrames - Math.round(0.3 * 60);
  const outS = 1 - spring({ frame: Math.max(0, frame - outAt), fps, config: { damping: 200 } });
  const breath = useBreath(0.01, 80);
  return (
    <AbsoluteFill style={{ alignItems: "flex-end" }}>
      <div
        style={{
          marginTop: 250,
          marginRight: 120,
          background: "rgba(255,255,255,0.93)",
          borderRadius: 16,
          border: `1px solid ${COLOR.line}`,
          boxShadow: RIM.light + ", " + SHADOW.float,
          padding: "26px 46px",
          textAlign: "right",
          opacity: punch * outS,
          transform: `scale(${(0.86 + punch * 0.14) * breath})`,
          transformOrigin: "right center",
        }}
      >
        <div style={{ fontFamily: FONT.sans, fontSize: 30, fontWeight: 700, color: COLOR.inkSoft, letterSpacing: 3 }}>
          {cue.label}
        </div>
        <div
          style={{
            fontFamily: FONT.sans,
            fontSize: 96,
            fontWeight: 900,
            lineHeight: 1.1,
            color: COLOR.ink,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {cue.value}
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const DamageCard: React.FC<{ cue: DamageCardCue; durationInFrames: number }> = ({
  cue,
  durationInFrames,
}) => {
  const { fps } = useVideoConfig();
  return (
    <Sequence from={Math.round(cue.t * fps)} durationInFrames={durationInFrames}>
      <DamageCardInner cue={cue} durationInFrames={durationInFrames} />
    </Sequence>
  );
};

// ---------- 收尾数据卡 ----------
const EndCardInner: React.FC<{ cue: EndCardCue; durationInFrames: number }> = ({
  cue,
  durationInFrames,
}) => {
  const { width } = useVideoConfig();
  const narrow = width < 1300;
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const inS = spring({ frame, fps, config: { damping: 200 } });
  const rowsIn = (i: number) => spring({ frame: frame - Math.round((0.35 + i * 0.18) * fps), fps, config: { damping: 200 } });
  const breath = useBreath(0.006, 140);
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", background: "#0A0D16" }}>
      <div style={{ width: narrow ? "86%" : 1240, opacity: inS, transform: `translateY(${(1 - inS) * 26}px) scale(${breath})` }}>
        <div style={{ fontFamily: FONT.mono, fontSize: narrow ? 20 : 26, fontWeight: 700, letterSpacing: 8, color: "#8FA8FF", marginBottom: 16 }}>
          HONKAI: STAR RAIL · CURRENCY WARS
        </div>
        <div style={{ fontFamily: FONT.sans, fontSize: narrow ? 64 : 96, fontWeight: 900, color: "#F5F7FF", lineHeight: 1.15 }}>
          {cue.title}
        </div>
        <div style={{ height: 1, background: "rgba(255,255,255,.16)", margin: "38px 0 10px" }} />
        {cue.rows.map((r, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 16,
              padding: narrow ? "14px 4px" : "18px 4px",
              opacity: rowsIn(i),
              transform: `translateX(${(1 - rowsIn(i)) * 24}px)`,
            }}
          >
            <span style={{ fontFamily: FONT.sans, fontSize: narrow ? 28 : 34, color: "rgba(235,240,255,.72)", whiteSpace: "nowrap" }}>
              {r.label}
            </span>
            <span
              style={{
                flex: 1,
                borderBottom: "2px dotted rgba(255,255,255,.28)",
                transform: "translateY(-8px)",
              }}
            />
            <span style={{ fontFamily: FONT.sans, fontSize: narrow ? 32 : 40, fontWeight: 800, color: "#F0D78C", whiteSpace: "nowrap" }}>
              {r.value}
            </span>
          </div>
        ))}
        <div style={{ fontFamily: FONT.sans, fontSize: narrow ? 26 : 32, color: "rgba(235,240,255,.6)", marginTop: 26 }}>
          {cue.sub}
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const EndCard: React.FC<{ cue: EndCardCue; durationInFrames: number }> = ({
  cue,
  durationInFrames,
}) => {
  const { fps } = useVideoConfig();
  return (
    <Sequence from={Math.round(cue.t * fps)} durationInFrames={durationInFrames}>
      <EndCardInner cue={cue} durationInFrames={durationInFrames} />
    </Sequence>
  );
};

export const ttlFrames = (ttl: number, fps: number) => Math.round(ttl * fps);
