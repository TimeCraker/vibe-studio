import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLOR } from "./tokens";

// 柱状图 v2（F2 拟真）：0 基线 2px 实线 + 3 条水平淡网格线；柱身纵向渐变（顶亮底暗）；
// 末柱高亮（brandBright + 数值加大 + 微光晕）强调递增叙事；柱顶连线折线带小圆点，
// 随错峰逐段画出；coin=true 时数值旁加 T 币图形锚（圆形币 + T 字，讲币必画币）。
const SPRING_CONFIG = { damping: 200, stiffness: 120, mass: 1 };
const STAGGER = 0.1; // s
const GROW = 1.2; // s

export type ChartBar = { label: string; value: number; unit?: string };

// hex 提亮/压暗（纯函数确定性）
const shade = (hex: string, pct: number) => {
  const m = hex.replace("#", "");
  const full = m.length === 3 ? m.split("").map((c) => c + c).join("") : m;
  const n = parseInt(full, 16);
  const ch = (v: number) => Math.min(255, Math.max(0, v + Math.round(255 * pct)));
  const r = ch((n >> 16) & 255);
  const g = ch((n >> 8) & 255);
  const b = ch(n & 255);
  return `rgb(${r},${g},${b})`;
};

// T 币图形锚：金色圆币 + 深金 T 字（导出供规则行等复用，「讲币必画币」）
export const CoinIcon: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" style={{ flexShrink: 0 }}>
    <circle cx="10" cy="10" r="9" fill="#F5C518" stroke="rgba(122,82,0,.45)" strokeWidth="1.5" />
    <text
      x="10"
      y="14.2"
      textAnchor="middle"
      fontFamily="Consolas, monospace"
      fontSize="11"
      fontWeight="800"
      fill="#7a5200"
    >
      T
    </text>
  </svg>
);

export const ChartGrow: React.FC<{
  bars: ChartBar[];
  width?: number;
  height?: number;
  delay?: number;
  barColor?: string;
  valueColor?: string; // 柱顶滚动数值颜色（深底场景传浅色）
  labelColor?: string; // 底部标签颜色
  axisColor?: string; // 基线/网格颜色
  highlightLast?: boolean; // 末柱高亮（默认开）
  highlightColor?: string; // 末柱色（默认 brandBright）
  connect?: boolean; // 柱顶连线生长折线（默认开）
  coin?: boolean; // T 币图形锚
  style?: React.CSSProperties;
}> = ({
  bars,
  width = 680,
  height = 400,
  delay = 0,
  barColor = COLOR.brand,
  valueColor = COLOR.ink,
  labelColor = COLOR.inkSoft,
  axisColor = "rgba(17,23,34,0.16)",
  highlightLast = true,
  highlightColor = COLOR.brandBright,
  connect = true,
  coin = false,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const chartH = height - 96; // 顶部数值 44 + 底部标签 52
  const vmax = Math.max(...bars.map((b) => b.value), 1);
  const gap = 30;
  const barW = (width - gap * (bars.length - 1)) / bars.length;

  // 各柱当前进度（供柱体/连线/圆点共用）
  const progresses = bars.map((_, i) => {
    const local = Math.max(0, frame / fps - (delay + i * STAGGER));
    return spring({ frame: local * fps, fps, config: SPRING_CONFIG, durationInFrames: Math.round(GROW * fps) });
  });
  const heights = bars.map((b, i) => (b.value / vmax) * chartH * progresses[i]);
  const centerX = (i: number) => i * (barW + gap) + barW / 2;

  // 连线逐段画出：段 i（柱 i → 柱 i+1）随柱 i+1 的进度画
  const segLens = bars.slice(0, -1).map((_, i) => {
    const dx = centerX(i + 1) - centerX(i);
    const dy = heights[i + 1] - heights[i];
    return Math.max(1, Math.hypot(dx, dy));
  });

  return (
    <div style={{ width, ...style }}>
      <div style={{ position: "relative" }}>
        {/* 水平淡网格线 ×3 */}
        {[0.25, 0.5, 0.75].map((f) => (
          <div
            key={f}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: chartH * f,
              height: 1,
              background: axisColor,
              opacity: 0.5,
            }}
          />
        ))}
        {/* 柱顶连线 SVG（逐段描画 + 圆点） */}
        {connect ? (
          <svg
            width={width}
            height={chartH}
            style={{ position: "absolute", left: 0, top: 0, pointerEvents: "none" }}
          >
            {bars.slice(0, -1).map((_, i) => {
              const q = Math.min(1, Math.max(0, progresses[i + 1]));
              const x1 = centerX(i);
              const y1 = chartH - heights[i];
              const x2 = centerX(i + 1);
              const y2 = chartH - heights[i + 1];
              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={highlightLast && i === bars.length - 2 ? highlightColor : valueColor}
                  strokeWidth={2}
                  strokeLinecap="round"
                  opacity={0.75}
                  strokeDasharray={segLens[i]}
                  strokeDashoffset={(1 - q) * segLens[i]}
                />
              );
            })}
            {bars.map((_, i) => {
              const p = progresses[i];
              return p < 0.05 ? null : (
                <circle
                  key={`d${i}`}
                  cx={centerX(i)}
                  cy={chartH - heights[i]}
                  r={4}
                  fill={highlightLast && i === bars.length - 1 ? highlightColor : valueColor}
                  opacity={Math.min(1, p)}
                />
              );
            })}
          </svg>
        ) : null}
        {/* 柱区 */}
        <div style={{ display: "flex", alignItems: "flex-end", gap, height: chartH }}>
          {bars.map((b, i) => {
            const p = progresses[i];
            const h = heights[i];
            const current = Math.round(b.value * p);
            const isLast = i === bars.length - 1;
            const hi = highlightLast && isLast;
            const base = hi ? highlightColor : barColor;
            return (
              <div key={b.label} style={{ width: barW, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: chartH, position: "relative" }}>
                <div
                  style={{
                    fontFamily: "Consolas, monospace",
                    fontSize: hi ? 27 : 22,
                    fontWeight: 800,
                    color: valueColor,
                    marginBottom: 8,
                    height: 32,
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    textShadow: hi ? `0 0 16px ${highlightColor}80` : "none",
                  }}
                >
                  {coin ? <CoinIcon size={hi ? 22 : 18} /> : null}
                  {current}
                  {b.unit ? <span style={{ fontSize: 15, color: labelColor, fontWeight: 700 }}> {b.unit}</span> : null}
                </div>
                <div
                  style={{
                    width: "100%",
                    height: Math.max(2, h),
                    background: `linear-gradient(180deg, ${shade(base, 0.20)} 0%, ${shade(base, -0.08)} 100%)`,
                    borderRadius: "8px 8px 0 0",
                    opacity: p < 0.02 ? 0 : 1,
                    boxShadow: hi ? `0 0 22px ${highlightColor}55` : "none",
                  }}
                />
              </div>
            );
          })}
        </div>
        {/* 0 基线 2px 实线 */}
        <div style={{ height: 2, background: axisColor, marginTop: 0 }} />
      </div>
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
