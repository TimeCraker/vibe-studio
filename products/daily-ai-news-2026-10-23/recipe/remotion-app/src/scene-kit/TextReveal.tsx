import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";

// 逐字/逐行上浮入场（spring 0.4-0.6s 到位），支持关键词高亮段。
// highlights 的 start/end 按"展开后的单元序号"计：char 模式 = 字符序号
// （跨行连续，含空格标点），line 模式 = 行序号。
const SPRING_CONFIG = { damping: 200, stiffness: 120, mass: 1 };
const CHAR_STAGGER = 0.04; // s，逐字错峰
const LINE_STAGGER = 0.12; // s，逐行错峰（M1：80-120ms）
const RISE_PX = 24;

export type TextHighlight = { start: number; end: number; color: string };

export const TextReveal: React.FC<{
  text: string;
  mode?: "char" | "line";
  highlights?: TextHighlight[];
  size?: number;
  color?: string;
  weight?: number;
  lineHeight?: number;
  align?: "left" | "center" | "right";
  delay?: number;
  style?: React.CSSProperties;
}> = ({
  text,
  mode = "char",
  highlights = [],
  size = 64,
  color = "#111722",
  weight = 800,
  lineHeight = 1.2,
  align = "left",
  delay = 0,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const lines = text.split("\n");

  const unitIn = (unitIndex: number) => {
    const stagger = mode === "char" ? CHAR_STAGGER : LINE_STAGGER;
    const local = Math.max(0, frame - (delay + unitIndex * stagger) * fps);
    return spring({ frame: local, fps, config: SPRING_CONFIG });
  };

  const highlightColor = (unitIndex: number) => {
    const hit = highlights.find((h) => unitIndex >= h.start && unitIndex < h.end);
    return hit ? hit.color : undefined;
  };

  let cursor = 0; // 跨行连续单元序号
  return (
    <div
      style={{
        fontSize: size,
        fontWeight: weight,
        lineHeight,
        color,
        textAlign: align,
        ...style,
      }}
    >
      {lines.map((line, li) => {
        if (mode === "line") {
          const p = unitIn(li);
          return (
            <div
              key={li}
              style={{
                opacity: p,
                transform: `translateY(${((1 - p) * RISE_PX).toFixed(2)}px)`,
                whiteSpace: "pre-wrap",
              }}
            >
              <span style={{ color: highlightColor(li) ?? undefined }}>{line}</span>
            </div>
          );
        }
        const spans = [...line].map((ch, ci) => {
          const idx = cursor + ci;
          const p = unitIn(idx);
          return (
            <span
              key={ci}
              style={{
                display: "inline-block",
                whiteSpace: "pre",
                opacity: p,
                transform: `translateY(${((1 - p) * RISE_PX).toFixed(2)}px)`,
                color: highlightColor(idx) ?? undefined,
              }}
            >
              {ch}
            </span>
          );
        });
        cursor += line.length;
        // 换行本身占一个单元序号，保证高亮区间跨行书写时序号稳定
        cursor += 1;
        return (
          <div key={li} style={{ whiteSpace: "pre-wrap" }}>
            {spans}
          </div>
        );
      })}
    </div>
  );
};
