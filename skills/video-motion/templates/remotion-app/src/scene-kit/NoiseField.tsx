import React from "react";
import { noise3D } from "@remotion/noise";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { COLOR } from "./tokens";

// 有机颗粒流场(@remotion/noise noise3D):点阵网格逐点做噪声漂移与明暗呼吸,
// 叠在 SceneBg 之上给背景「活着的」质层(与静态 feTurbulence 微噪点互补)。
// 确定性:seed 固定数字,坐标由索引推导,禁 random/Date。
export const NoiseField: React.FC<{
  variant?: "light" | "dark"; // 浅族墨点 / 深族亮点,默认 light
  width?: number; // 默认 1920
  height?: number; // 默认 1080
  cols?: number; // 点阵列数,默认 22
  rows?: number; // 点阵行数,默认 12
  maxShift?: number; // 单点最大漂移(px),默认 26
  dotRadius?: number; // 默认 3
  noiseScale?: number; // 噪声空间频率,默认 0.35(小=大片缓动,大=碎)
  speedSec?: number // 一个呼吸周期(s),默认 4
  seed?: number; // 默认 42
  opacity?: number; // 整层透明度,默认 light .32 / dark .45
  style?: React.CSSProperties;
}> = ({
  variant = "light",
  width = 1920,
  height = 1080,
  cols = 22,
  rows = 12,
  maxShift = 26,
  dotRadius = 3,
  noiseScale = 0.35,
  speedSec = 4,
  seed = 42,
  opacity,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const baseColor = variant === "light" ? COLOR.inkSoft : COLOR.brandBright;
  const baseOpacity = opacity ?? (variant === "light" ? 0.32 : 0.45);
  const t = frame / (fps * speedSec);

  const dots: React.CSSProperties[] = [];
  for (let ri = 0; ri < rows; ri++) {
    for (let ci = 0; ci < cols; ci++) {
      const nx = noise3D(seed, ci * noiseScale, ri * noiseScale, t);
      const ny = noise3D(seed + 17, ci * noiseScale, ri * noiseScale, t);
      const nb = noise3D(seed + 41, ci * noiseScale, ri * noiseScale, t * 0.7);
      const x = ((ci + 0.5) / cols) * width + nx * maxShift;
      const y = ((ri + 0.5) / rows) * height + ny * maxShift;
      const breathe = 0.35 + 0.65 * (nb * 0.5 + 0.5); // 0.35-1 明暗呼吸
      dots.push({
        position: "absolute",
        left: x,
        top: y,
        width: dotRadius * 2,
        height: dotRadius * 2,
        borderRadius: "50%",
        backgroundColor: baseColor,
        opacity: baseOpacity * breathe,
      });
    }
  }

  return (
    <div style={{ position: "relative", width, height, pointerEvents: "none", ...style }}>
      {dots.map((s, i) => (
        <div key={i} style={s} />
      ))}
    </div>
  );
};
