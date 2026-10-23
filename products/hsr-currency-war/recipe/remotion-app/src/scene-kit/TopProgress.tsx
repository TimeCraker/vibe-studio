import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { COLOR } from "./tokens";

// F4 专业感：2px 品牌色进度条贴画布顶边，宽度 = 当前页/总页数，页间平滑推进。
// from/to 为页号分数：第 i/total 页传 from=(i-1)/total、to=i/total，rampSeconds 内缓动到位。
export const TopProgress: React.FC<{
  from: number;
  to: number;
  rampSeconds?: number;
  delay?: number;
  color?: string;
  trackColor?: string; // 全宽底轨暗线；"none" 关闭
  height?: number;
  style?: React.CSSProperties;
}> = ({
  from,
  to,
  rampSeconds = 0.45,
  delay = 0,
  color = COLOR.brand,
  trackColor = "rgba(26,34,51,0.10)",
  height = 2,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = Math.min(1, Math.max(0, (frame / fps - delay) / rampSeconds));
  const eased = 1 - Math.pow(1 - p, 3);
  const frac = from + (to - from) * eased;
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height,
        background: trackColor === "none" ? "transparent" : trackColor,
        zIndex: 40,
        ...style,
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${(frac * 100).toFixed(3)}%`,
          background: color,
          borderRadius: "0 1px 1px 0",
        }}
      />
    </div>
  );
};
