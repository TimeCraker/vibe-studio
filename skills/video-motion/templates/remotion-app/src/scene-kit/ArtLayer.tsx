import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { SHADOW } from "./tokens";

// 美术层（S6 复盘根因修复，spec: docs/2026-10-05-art-layer-spec.md）：
// 画面主体从「CSS 排版冒充画面」升级为真图一等公民——SVG 插画（首选，程序可生成、
// 无限缩放、可接 @remotion/paths 动画管线）或 AI 出图 raster（第二通道）。
//
// 设计约束：
// - 双通道：svg 内联字符串（零 IO，模板 demo 自足） / src 文件（staticFile 相对路径，
//   AI 图从 assets/art/ 复制进项目 public/ 后引用——与 LottieLayer 资产流同构）
// - 底图是「空间」不是贴图（F1）：vignette 暗角默认开、tint 色温层把图纳入全片光影体系
// - 运镜克制（S6 铁训）：kenBurns 慢推 ≤1.05 线性，「可感不可察」；transform 只落在
//   <Img> 叶子上，absolute 遮罩层为兄弟节点——规避 transform-containing-block 坑（SKILL 铁律）
export const ArtLayer: React.FC<{
  svg?: string; // 内联 SVG 标记（与 src 二选一）
  src?: string; // staticFile 相对路径（.svg/.png/.jpg）
  width: number;
  height?: number; // 默认 = width
  fit?: "contain" | "cover"; // 默认 cover
  kenBurns?: { from?: number; to?: number }; // 缺省关；开启默认 1 -> 1.04 线性慢推
  pan?: { x?: [number, number]; y?: [number, number] }; // 伴随平移，单位 %（克制）
  vignette?: boolean; // 默认 true：四周暗角把图折进空间
  tint?: string; // 色温层（低透明度 CSS 色，如 "rgba(49,87,246,0.06)"）
  shadow?: "card" | "float"; // tokens 双层阴影（卡片/悬浮道具形态用）
  radius?: number; // 圆角（与 DropCard 版面语言一致）
  style?: React.CSSProperties;
}> = ({ svg, src, width, height, fit = "cover", kenBurns, pan, vignette = true, tint, shadow, radius = 0, style }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const span = [0, Math.max(1, durationInFrames - 1)];
  const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

  if (!svg && !src) throw new Error("ArtLayer: svg 与 src 必须提供其一");
  if (svg && src) throw new Error("ArtLayer: svg 与 src 只能取其一");

  const scale = kenBurns
    ? interpolate(frame, span, [kenBurns.from ?? 1, kenBurns.to ?? 1.04], clamp)
    : 1;
  const px = pan?.x ? interpolate(frame, span, pan.x, clamp) : 0;
  const py = pan?.y ? interpolate(frame, span, pan.y, clamp) : 0;
  const source = svg ? "data:image/svg+xml;utf8," + encodeURIComponent(svg) : staticFile(src as string);

  return (
    <div
      style={{
        width,
        height: height ?? width,
        borderRadius: radius,
        boxShadow: shadow ? SHADOW[shadow] : undefined,
        overflow: "hidden",
        position: "relative",
        ...style,
      }}
    >
      <Img
        src={source}
        style={{
          width: "100%",
          height: "100%",
          objectFit: fit,
          transform: `scale(${scale}) translate(${px}%, ${py}%)`,
          transformOrigin: "center",
          display: "block",
        }}
      />
      {tint ? (
        <AbsoluteFill style={{ background: tint, pointerEvents: "none" }} />
      ) : null}
      {vignette ? (
        <AbsoluteFill
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,0.22) 100%)",
            pointerEvents: "none",
          }}
        />
      ) : null}
    </div>
  );
};
