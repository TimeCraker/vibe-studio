import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";

// 柱状图错峰长高（柱条 100ms stagger，1-1.5s 生长），柱顶数值随长高同步滚动。
const SPRING_CONFIG = { damping: 200, stiffness: 120, mass: 1 };
const STAGGER = 0.1; // s
const GROW = 1.2; // s
const ACCENT = "#3157F6";
const INK = "#111722";
const INK_MUTED = "#64748b";

export type ChartBar = { label: string; value: number; unit?: string };

export const ChartGrow: React.FC<{
  bars: ChartBar[];
  width?: number;
  height?: number;
  delay?: number;
  barColor?: string;
  valueColor?: string; // 柱顶滚动数值颜色（深底场景传浅色）
  labelColor?: string; // 底部标签颜色
  axisColor?: string; // 基线颜色
  style?: React.CSSProperties;
}> = ({
  bars,
  width = 680,
  height = 400,
  delay = 0,
  barColor = ACCENT,
  valueColor = INK,
  labelColor = INK_MUTED,
  axisColor = "rgba(17,23,34,0.16)",
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const chartH = height - 96; // 顶部数值 44 + 底部标签 52
  const vmax = Math.max(...bars.map((b) => b.value), 1);
  const gap = 30;
  const barW = (width - gap * (bars.length - 1)) / bars.length;

  return (
    <div style={{ width, ...style }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap, height: chartH }}>
        {bars.map((b, i) => {
          const local = Math.max(0, frame / fps - (delay + i * STAGGER));
          const p = spring({
            frame: local * fps,
            fps,
            config: SPRING_CONFIG,
            durationInFrames: Math.round(GROW * fps), // 生长拉长到 1.2s
          });
          const h = (b.value / vmax) * chartH * p;
          const current = Math.round(b.value * p);
          return (
            <div key={b.label} style={{ width: barW, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: chartH }}>
              <div style={{ fontFamily: "Consolas, monospace", fontSize: 22, fontWeight: 800, color: valueColor, marginBottom: 8, height: 30 }}>
                {current}
                {b.unit ? <span style={{ fontSize: 15, color: labelColor, fontWeight: 700 }}> {b.unit}</span> : null}
              </div>
              <div style={{ width: "100%", height: Math.max(2, h), background: barColor, borderRadius: "8px 8px 0 0", opacity: p < 0.02 ? 0 : 1 }} />
            </div>
          );
        })}
      </div>
      <div style={{ height: 1, background: axisColor, marginTop: 0 }} />
      <div style={{ display: "flex", gap, marginTop: 12 }}>
        {bars.map((b) => (
          <div key={b.label} style={{ width: barW, textAlign: "center", fontSize: 16, fontWeight: 700, color: labelColor }}>
            {b.label}
          </div>
        ))}
      </div>
    </div>
  );
};
