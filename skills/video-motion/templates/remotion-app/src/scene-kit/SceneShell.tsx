import React from "react";
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { TextReveal } from "./TextReveal";

// V3 规则：杂志式场景容器——眉题小字（英文小标签）+ 章节号 + 超大加粗标题
// （可带一处关键词高亮）+ 细分隔线 + 非对称双栏主体（左文 ~55% / 右主体 ~45%）。
// 背景由页面层叠 SceneBg 提供；左栏插槽 left（弱化副文案/要点），children = 右侧主体。
const SPRING_CONFIG = { damping: 200, stiffness: 120, mass: 1 };
const DEFAULT_ACCENT = "#3157F6";
const INK = "#111722";
const INK_MUTED = "#64748b";
const HAIRLINE = "rgba(17, 23, 34, 0.14)";

export const SceneShell: React.FC<{
  chapter: string;
  eyebrow: string;
  title: string;
  accent?: string;
  highlight?: { start: number; end: number };
  titleSize?: number;
  left?: React.ReactNode;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}> = ({
  chapter,
  eyebrow,
  title,
  accent = DEFAULT_ACCENT,
  highlight,
  titleSize = 66,
  left,
  style,
  children,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const chromeP = spring({ frame: Math.max(0, frame - 0.05 * fps), fps, config: SPRING_CONFIG });
  const lineP = spring({ frame: Math.max(0, frame - 0.3 * fps), fps, config: SPRING_CONFIG });
  const titleHighlights = highlight
    ? [{ start: highlight.start, end: highlight.end, color: accent }]
    : [];

  return (
    <AbsoluteFill style={{ padding: "64px 96px 72px", display: "flex", flexDirection: "column", ...style }}>
      {/* 眉题 + 章节号 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: "0.32em",
            textTransform: "uppercase",
            color: accent,
            opacity: chromeP,
            transform: `translateY(${((1 - chromeP) * 12).toFixed(2)}px)`,
          }}
        >
          {eyebrow}
        </div>
        <div
          style={{
            fontFamily: "Consolas, monospace",
            fontSize: 18,
            fontWeight: 700,
            color: INK_MUTED,
            opacity: chromeP,
          }}
        >
          {chapter}
        </div>
      </div>

      {/* 超大加粗标题 */}
      <div style={{ marginTop: 22 }}>
        <TextReveal text={title} mode="char" size={titleSize} weight={800} color={INK} delay={0.12} highlights={titleHighlights} />
      </div>

      {/* 细分隔线 */}
      <div
        style={{
          marginTop: 26,
          height: 1,
          background: HAIRLINE,
          transformOrigin: "left center",
          transform: `scaleX(${lineP.toFixed(3)})`,
        }}
      />

      {/* 非对称双栏：左文 55% / 右主体 45% */}
      <div style={{ display: "flex", flex: 1, minHeight: 0, marginTop: 38, gap: 56 }}>
        <div style={{ flex: "0 0 52%", maxWidth: "52%", display: "flex", flexDirection: "column" }}>
          {left}
        </div>
        <div style={{ flex: 1, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {children}
        </div>
      </div>
    </AbsoluteFill>
  );
};
