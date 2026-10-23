import React from "react";
import { evolvePath, getLength, getPointAtLength } from "@remotion/paths";
import { makeRect } from "@remotion/shapes";
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { COLOR, FONT } from "./tokens";

// 真路径生长(@remotion/paths evolvePath):下划线 / 引线箭头 / 圆圈 / 矩形按真实路径长度
// 逐段画出来,取代 scaleX 假生长(v4 的 DrawIn 由本件替代关闭)。endDot 在生长端点冒实心点。
// 确定性:只吃 props + useCurrentFrame。
export const DrawPath: React.FC<{
  shape?: "underline" | "arrow" | "circle" | "rect"; // 默认 underline
  path?: string; // 直接给 SVG d(优先于 shape)
  width?: number; // 画布宽,默认 420
  height?: number; // 画布高,默认 80(circle/rect 按比例)
  stroke?: string; // 默认品牌蓝
  strokeWidth?: number; // 默认 6
  dur?: number; // 生长时长(s),默认 0.6
  delay?: number; // 起始延迟(s),默认 0
  endDot?: boolean; // 生长端点冒点,默认 false
  style?: React.CSSProperties;
}> = ({
  shape = "underline",
  path,
  width = 420,
  height = 80,
  stroke = COLOR.brand,
  strokeWidth = 6,
  dur = 0.6,
  delay = 0,
  endDot = false,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 按 shape 生成 d:全部单子路径,evolvePath 按长度生长无歧义
  const d =
    path ??
    (() => {
      switch (shape) {
        // 箭头走"上撇—顶点—下撇"折线,生长时先扬再落,带手绘感
        case "arrow":
          return `M 0 ${height / 2} L ${width - 16} ${height / 2 - 9} L ${width} ${height / 2} L ${width - 16} ${height / 2 + 9}`;
        case "circle": // 起点在圆左侧,两段半圆拼闭合圈,沿圈生长
          return `M 0 ${height / 2} A ${width / 2} ${height / 2} 0 1 1 ${width} ${height / 2} A ${width / 2} ${height / 2} 0 1 1 0 ${height / 2}`;
        case "rect":
          return makeRect({ width, height }).path;
        case "underline":
        default:
          return `M 0 ${height / 2} H ${width}`;
      }
    })();

  const progress = interpolate(
    frame,
    [delay * fps, (delay + dur) * fps],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.ease) },
  );

  // evolvePath 返回 dash 属性对(strokeDasharray/offset),直接挂 path 上实现按长度生长
  const { strokeDasharray, strokeDashoffset } = evolvePath(progress, d);
  const total = getLength(d);
  const tip = endDot ? getPointAtLength(d, progress * total) : null;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ display: "block", fontFamily: FONT.sans, ...style }}
    >
      <path
        d={d}
        stroke={stroke}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={strokeDasharray}
        strokeDashoffset={strokeDashoffset}
      />
      {tip ? <circle cx={tip.x} cy={tip.y} r={strokeWidth * 1.3} fill={stroke} /> : null}
    </svg>
  );
};
