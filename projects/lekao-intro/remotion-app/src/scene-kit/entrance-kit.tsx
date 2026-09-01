import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";

// 进场动词库(v4 §3,吸收进 MG 武器库):九个进场/待机/运镜动词,默认值 = 标杆片实测基准。
// 确定性:全部 frame 派生,禁 random/Date。
// 页间转场是硬切(引擎 Series 直切),动词全部发生在**页内内容层**——这是 v4 转场律的架构:
// 禁交叉溶解、硬切为底、旧页冻结退场、新页按动词进场、相邻页动词不同型。
const SPRING = { damping: 200, stiffness: 120, mass: 1 };

// 整组方向性滑入:0.35s spring 从画面外 1/3 处进位
export const SlideGroup: React.FC<{
  direction?: "left" | "right" | "up" | "down"; // 滑入来向(从左进=从左侧画面外滑到原位)
  distance?: number; // 位移 px,默认 0.33 × 画宽
  dur?: number; // 默认 0.35s
  delay?: number; // s
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ direction = "left", distance, dur = 0.35, delay = 0, style, children }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const dist = distance ?? width * 0.33;
  const p = spring({ frame: Math.max(0, frame - delay * fps), fps, config: SPRING, durationInFrames: Math.round(dur * fps) });
  const offset = (1 - p) * dist;
  const transform =
    direction === "left" ? `translateX(${-offset}px)` :
    direction === "right" ? `translateX(${offset}px)` :
    direction === "up" ? `translateY(${-offset}px)` :
    `translateY(${offset}px)`;
  return <div style={{ transform, ...style }}>{children}</div>;
};

// 曝光渐起:亮度 0.25 → 1 + 微慢推,「灯打上来」的进场
export const ExposureIn: React.FC<{
  brightnessFrom?: number; // 默认 0.25
  dur?: number; // 默认 0.45s
  delay?: number;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ brightnessFrom = 0.25, dur = 0.45, delay = 0, style, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: Math.max(0, frame - delay * fps), fps, config: SPRING, durationInFrames: Math.round(dur * fps) });
  const brightness = brightnessFrom + (1 - brightnessFrom) * p;
  const scale = 1.04 - 0.04 * p; // 慢推收束
  return (
    <div style={{ filter: `brightness(${brightness.toFixed(3)})`, transform: `scale(${scale.toFixed(4)})`, ...style }}>
      {children}
    </div>
  );
};

// 揭示进场:clip-path 从一侧擦亮
export const WipeIn: React.FC<{
  direction?: "left" | "right"; // 揭示来向,默认 left
  dur?: number; // 默认 0.45s
  delay?: number;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ direction = "left", dur = 0.45, delay = 0, style, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: Math.max(0, frame - delay * fps), fps, config: SPRING, durationInFrames: Math.round(dur * fps) });
  const revealed = (p * 100).toFixed(2);
  const clip = direction === "left" ? `inset(0 ${100 - Number(revealed)}% 0 0)` : `inset(0 0 0 ${100 - Number(revealed)}%)`;
  return <div style={{ clipPath: clip, ...style }}>{children}</div>;
};

// 生长进场:从 from 比例 spring 到 1
export const GrowIn: React.FC<{
  from?: number; // 默认 0.6
  delay?: number;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ from = 0.6, delay = 0, style, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: Math.max(0, frame - delay * fps), fps, config: SPRING });
  const scale = from + (1 - from) * p;
  return <div style={{ transform: `scale(${scale.toFixed(4)})`, ...style }}>{children}</div>;
};

// 弹落 + 落位后小幅摇摆:settle 后 wobble 给「落定回弹」的生命感
export const PopRotate: React.FC<{
  settleDur?: number; // 默认 0.3s
  wobbleDeg?: number; // 默认 3
  wobblePeriod?: number; // 默认 2.4s
  delay?: number;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ settleDur = 0.3, wobbleDeg = 3, wobblePeriod = 2.4, delay = 0, style, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: Math.max(0, frame - delay * fps), fps, config: SPRING, durationInFrames: Math.round(settleDur * fps) });
  const t = Math.max(0, frame - delay * fps - settleDur * fps) / fps;
  const wobble = Math.sin((t / wobblePeriod) * Math.PI * 2) * wobbleDeg * (1 - Math.min(1, t / (wobblePeriod * 2)));
  return <div style={{ transform: `scale(${p.toFixed(3)}) rotate(${wobble.toFixed(2)}deg)`, ...style }}>{children}</div>;
};

// 级联列表:逐项大步长进场(280ms/项,「数得出来」的叙事节奏,= StaggerList 的大步长档)
export const CascadeList: React.FC<{
  stepMs?: number; // 默认 280
  direction?: "column" | "row";
  slide?: "left" | "right" | "up" | "down"; // 每项滑入来向,默认 up
  style?: React.CSSProperties;
  itemStyle?: React.CSSProperties;
  children: React.ReactNode[];
}> = ({ stepMs = 280, direction = "column", slide = "up", style, itemStyle, children }) => (
  <div style={{ display: "flex", flexDirection: direction, gap: 18, ...style }}>
    {children.map((child, i) => (
      <SlideGroup key={i} direction={slide} distance={72} dur={0.4} delay={(i * stepMs) / 1000} style={itemStyle}>
        {child}
      </SlideGroup>
    ))}
  </div>
);

// 慢推运镜:整页匀速缓推(页长 >10s 时给),rate 0.3-0.5%/s
export const CameraPush: React.FC<{
  ratePerSec?: number; // 默认 0.004(0.4%/s)
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ ratePerSec = 0.004, style, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scale = 1 + ratePerSec * (frame / fps);
  return (
    <div style={{ transform: `scale(${scale.toFixed(4)})`, transformOrigin: "center", ...style }}>{children}</div>
  );
};

// 待机呼吸:落位后大字 ±1.5% / 3s 缩放呼吸(进行时证据,防 PPT 感)
export const TextBreath: React.FC<{
  amp?: number; // 默认 0.015
  period?: number; // 默认 3s
  delay?: number; // 呼吸起始延迟,默认 0.8s(等进场落位)
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ amp = 0.015, period = 3, delay = 0.8, style, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = Math.max(0, frame / fps - delay);
  const scale = 1 + Math.sin((t / period) * Math.PI * 2) * amp;
  return <div style={{ transform: `scale(${scale.toFixed(4)})`, ...style }}>{children}</div>;
};
