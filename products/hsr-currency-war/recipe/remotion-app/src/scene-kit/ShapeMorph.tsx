import React from "react";
import { interpolatePath } from "@remotion/paths";
import { makeCircle, makeRect, makeStar, makeTriangle } from "@remotion/shapes";
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { COLOR } from "./tokens";

// 形状渐变(interpolatePath + @remotion/shapes):矩形/圆/三角/星之间真顶点插值 morph,
// 不是切图。from/to 的 path 由 shapes 官方生成,顶点数不齐时 interpolatePath 自动重采样。
export const ShapeMorph: React.FC<{
  from: "rect" | "circle" | "triangle" | "star";
  to: "rect" | "circle" | "triangle" | "star";
  width?: number; // 默认 220
  height?: number; // 默认 220
  fill?: string; // 默认品牌蓝
  dur?: number; // morph 时长(s),默认 0.8
  delay?: number; // 默认 0
  progress?: number; // 外部驱动(0-1,给了就忽略 dur/delay/frame)
  style?: React.CSSProperties;
}> = ({ from, to, width = 220, height = 220, fill = COLOR.brand, dur = 0.8, delay = 0, progress: extProgress, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const { fromPath, toPath } = React.useMemo(() => {
    const pathFor = (s: "rect" | "circle" | "triangle" | "star"): string => {
      switch (s) {
        case "circle":
          return makeCircle({ radius: Math.min(width, height) / 2 }).path;
        case "triangle": // makeTriangle 是等边三角形,边长取短边
          return makeTriangle({ length: Math.min(width, height), direction: "up" }).path;
        case "star":
          return makeStar({ points: 5, innerRadius: Math.min(width, height) * 0.22, outerRadius: Math.min(width, height) / 2 }).path;
        case "rect":
        default:
          return makeRect({ width, height }).path;
      }
    };
    return { fromPath: pathFor(from), toPath: pathFor(to) };
  }, [from, to, width, height]);

  const p =
    extProgress ??
    interpolate(frame, [delay * fps, (delay + dur) * fps], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.inOut(Easing.cubic),
    });

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: "block", ...style }}>
      {/* interpolatePath 签名是 (value, firstPath, secondPath) 三个独立参数 */}
      <path d={interpolatePath(p, fromPath, toPath)} fill={fill} />
    </svg>
  );
};
