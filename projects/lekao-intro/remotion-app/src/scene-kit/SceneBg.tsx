import React from "react";
import { AbsoluteFill } from "remotion";
import { COLOR } from "./tokens";

// V1 + F1 规则：双族背景是"空间"不是"色板"。
// light = 米白底 + 80px 极淡网格（ink 3%）+ 右上角品牌蓝柔光斑（溢出裁切）+ 四周轻暗角
// dark  = 中心 #141a2e → 边缘 #0a0e1a 径向渐变 + 加强暗角 + 白 3% 网格 + 3% 微噪点
// 噪点 = 内联 SVG feTurbulence data-URI（seed 固定、静态、确定性）；仍禁装饰粒子。
// v3 起网格/柔光斑/噪点为各族默认自带；grid prop 保留兼容（不再改变渲染）。
const LIGHT_BG = COLOR.paper;
const LIGHT_GRID = "rgba(26, 34, 51, 0.03)";
const DARK_GRID = "rgba(255, 255, 255, 0.03)";
const GRID_SIZE = "80px 80px";

const NOISE_DATA_URI =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' seed='7' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='240' height='240' filter='url(#n)'/></svg>`,
  );

export const SceneBg: React.FC<{
  variant: "light" | "dark";
  grid?: boolean;
  children?: React.ReactNode;
}> = ({ variant, children }) => {
  if (variant === "light") {
    return (
      <AbsoluteFill style={{ backgroundColor: LIGHT_BG, overflow: "hidden" }}>
        <AbsoluteFill
          style={{
            backgroundImage: `linear-gradient(${LIGHT_GRID} 1px, transparent 1px), linear-gradient(90deg, ${LIGHT_GRID} 1px, transparent 1px)`,
            backgroundSize: GRID_SIZE,
          }}
        />
        {/* 右上角柔光斑：品牌蓝径向渐变大圆，溢出裁切 */}
        <div
          style={{
            position: "absolute",
            top: -260,
            right: -220,
            width: 920,
            height: 920,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${COLOR.brand}12 0%, ${COLOR.brand}00 65%)`,
          }}
        />
        {/* 四周轻暗角 */}
        <AbsoluteFill
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(15,23,42,0) 62%, rgba(15,23,42,0.10) 100%)",
          }}
        />
        {children}
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at center, ${COLOR.dark1} 0%, ${COLOR.dark0} 100%)`,
      }}
    >
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(${DARK_GRID} 1px, transparent 1px), linear-gradient(90deg, ${DARK_GRID} 1px, transparent 1px)`,
          backgroundSize: GRID_SIZE,
        }}
      />
      {/* 3% 微噪点纹理（静态确定性） */}
      <AbsoluteFill
        style={{
          backgroundImage: `url("${NOISE_DATA_URI}")`,
          backgroundRepeat: "repeat",
          opacity: 0.03,
        }}
      />
      {/* 加强暗角聚焦 */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(0,0,0,0) 46%, rgba(0,0,0,0.50) 100%)",
        }}
      />
      {children}
    </AbsoluteFill>
  );
};
