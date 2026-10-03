import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";

// M3 规则：进完场不是死画。主体待机漂浮 sin ±8px，period 3-5s，phase 错开。
// 只管待机运动；子元素自己的进场动画（spring/scale）由各自组件负责。
export const FloatWrap: React.FC<{
  phase?: number;
  amp?: number;
  period?: number;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}> = ({ phase = 0, amp = 8, period = 4, style, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const y = Math.sin((2 * Math.PI * t) / period + phase) * amp;
  return (
    <div style={{ ...style, transform: `translateY(${y.toFixed(2)}px)` }}>
      {children}
    </div>
  );
};
