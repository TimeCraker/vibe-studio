import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";

// 数字滚动：0.8-1.2s ease-out 到目标值，支持单位后缀；数字走等宽字体。
const easeOutCubic = (p: number) => 1 - Math.pow(1 - p, 3);

const groupDigits = (n: number) => {
  const s = String(n);
  let out = "";
  for (let i = 0; i < s.length; i++) {
    const fromRight = s.length - i;
    out += s[i];
    if (fromRight > 1 && (fromRight - 1) % 3 === 0) out += ",";
  }
  return out;
};

export const CountUp: React.FC<{
  to: number;
  suffix?: string;
  durationInSec?: number;
  delay?: number;
  size?: number;
  color?: string;
  suffixColor?: string;
  style?: React.CSSProperties;
}> = ({
  to,
  suffix = "",
  durationInSec = 1.0,
  delay = 0,
  size = 96,
  color = "#111722",
  suffixColor = "#64748b",
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = easeOutCubic(
    Math.min(1, Math.max(0, (frame / fps - delay) / durationInSec)),
  );
  const value = Math.round(to * p);
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 10, ...style }}>
      <span
        style={{
          fontFamily: "Consolas, monospace",
          fontSize: size,
          fontWeight: 800,
          color,
          letterSpacing: "-0.02em",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {groupDigits(value)}
      </span>
      {suffix ? (
        <span style={{ fontSize: size * 0.38, fontWeight: 700, color: suffixColor }}>{suffix}</span>
      ) : null}
    </div>
  );
};
