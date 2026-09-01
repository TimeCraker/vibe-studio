import React from "react";
import { Trail } from "@remotion/motion-blur";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";

// 进场残影(@remotion/motion-blur Trail):元素快速进位时拖出运动残影——
// 「快的东西带 blur」是 MG 贵感的第一来源。组件内置 SlideGroup 同款 spring 进位,
// 残影由 Trail 按帧滞后采样,确定性(frame 驱动,无随机)。
// 成本:每层重渲一遍子树 ×layers,重元素(视频/大 SVG)慎用大 layers。
export const BlurTrail: React.FC<{
  direction?: "left" | "right" | "up" | "down"; // 进位来向,默认 left
  distance?: number; // 位移 px,默认 0.33×画宽
  dur?: number; // 进位时长(s),默认 0.5
  delay?: number; // s
  layers?: number; // 残影层数,默认 8
  lagInFrames?: number; // 层间滞后,默认 2
  trailOpacity?: number; // 残影不透明度,默认 0.36
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({
  direction = "left",
  distance,
  dur = 0.5,
  delay = 0,
  layers = 8,
  lagInFrames = 2,
  trailOpacity = 0.36,
  style,
  children,
}) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const dist = distance ?? width * 0.33;
  const p = spring({ frame: Math.max(0, frame - delay * fps), fps, config: { damping: 200, stiffness: 120, mass: 1 }, durationInFrames: Math.round(dur * fps) });
  const offset = (1 - p) * dist;
  const transform =
    direction === "left" ? `translateX(${-offset}px)` :
    direction === "right" ? `translateX(${offset}px)` :
    direction === "up" ? `translateY(${-offset}px)` :
    `translateY(${offset}px)`;
  return (
    <Trail layers={layers} lagInFrames={lagInFrames} trailOpacity={trailOpacity}>
      <div style={{ transform, ...style }}>{children}</div>
    </Trail>
  );
};
