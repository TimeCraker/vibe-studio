import React from "react";
import { AbsoluteFill } from "remotion";

// V1 规则：双族背景。浅色杂志米白给叙事/内容页，深蓝微渐变给数字/科技页。
// 背景干净：纯色或极微渐变，无装饰粒子；同一场景内不变。
const LIGHT_BG = "#F5F1E8";
const GRID_LINE = "rgba(17, 23, 34, 0.045)";
const DARK_FROM = "#0a0e1a";
const DARK_TO = "#141a2e";

export const SceneBg: React.FC<{
  variant: "light" | "dark";
  grid?: boolean;
  children?: React.ReactNode;
}> = ({ variant, grid = false, children }) => {
  if (variant === "light") {
    return (
      <AbsoluteFill style={{ backgroundColor: LIGHT_BG }}>
        {grid ? (
          <AbsoluteFill
            style={{
              backgroundImage: `linear-gradient(${GRID_LINE} 1px, transparent 1px), linear-gradient(90deg, ${GRID_LINE} 1px, transparent 1px)`,
              backgroundSize: "120px 120px",
            }}
          />
        ) : null}
        {children}
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill
      style={{ background: `linear-gradient(160deg, ${DARK_FROM} 0%, ${DARK_TO} 100%)` }}
    >
      {/* 轻暗角聚焦（V4），不做装饰粒子 */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,0.38) 100%)",
        }}
      />
      {children}
    </AbsoluteFill>
  );
};
