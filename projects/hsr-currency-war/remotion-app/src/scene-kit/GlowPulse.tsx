import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";

// 强调脉冲光晕：呼吸 1.5-2s 周期（M3 待机微动），确定性 sin 驱动。
// 父容器需 position: relative/absolute；本组件自身 absolute，默认居中于父元素。
export const GlowPulse: React.FC<{
  color?: string; // 6 位 hex
  size?: number;
  period?: number; // s（1.5-2 基准）
  intensity?: number; // 0-1 峰值不透明度系数
  style?: React.CSSProperties;
}> = ({ color = "#3157F6", size = 420, period = 1.75, intensity = 0.5, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const breathe = 0.5 + 0.5 * Math.sin((2 * Math.PI * t) / period);
  return (
    <div
      style={{
        position: "absolute",
        width: size,
        height: size,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${color}66 0%, ${color}00 68%)`,
        opacity: (intensity * (0.45 + 0.55 * breathe)).toFixed(3),
        transform: `scale(${(0.9 + 0.1 * breathe).toFixed(3)})`,
        pointerEvents: "none",
        ...style,
      }}
    />
  );
};
