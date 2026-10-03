import React from "react";
import { Freeze, spring, useCurrentFrame, useVideoConfig } from "remotion";

// 进场残影(@remotion/motion-blur Trail 同构):元素快速进位时拖出运动残影——
// 「快的东西带 blur」是 MG 贵感的第一来源。组件内置 SlideGroup 同款 spring 进位,
// 残影按帧滞后采样,确定性(frame 驱动,无随机)。
// 结构坑(S6 实战踩过):官方 <Trail> 根是 AbsoluteFill(absolute 铺满,页级覆盖语义),
// 元素级使用时若无定位父级内容会从页顶排。本组件做 relative 化改造:
// 主层在流内(撑起容器尺寸),残影层 absolute 叠加,opacity/滞后公式与官方一致。
// 成本:每层重渲一遍子树 ×layers,重元素(视频/大 SVG)慎用大 layers。
export const BlurTrail: React.FC<{
  direction?: "left" | "right" | "up" | "down"; // 进位来向,默认 left
  distance?: number; // 位移 px,默认 0.33×画宽
  dur?: number; // 进位时长(s),默认 0.5
  delay?: number; // s
  layers?: number; // 残影层数,默认 8
  lagInFrames?: number; // 层间滞后,默认 2
  trailOpacity?: number; // 残影不透明度,默认 0.36
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({
  direction = "left",
  distance,
  dur = 0.5,
  delay = 0,
  layers = 8,
  lagInFrames = 2,
  trailOpacity = 0.36,
  style,
  children,
}) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const dist = distance ?? width * 0.33;
  const p = spring({ frame: Math.max(0, frame - delay * fps), fps, config: { damping: 200, stiffness: 120, mass: 1 }, durationInFrames: Math.round(dur * fps) });
  const offset = (1 - p) * dist;
  const transform =
    direction === "left" ? `translateX(${-offset}px)` :
    direction === "right" ? `translateX(${offset}px)` :
    direction === "up" ? `translateY(${-offset}px)` :
    `translateY(${offset}px)`;
  return (
    <div style={{ position: "relative", ...style }}>
      {/* 残影层:滞后帧采样,absolute 叠加(不占布局) */}
      {new Array(layers).fill(true).map((_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            inset: 0,
            opacity: trailOpacity - ((layers - i) / layers) * trailOpacity,
          }}
        >
          <Freeze frame={frame - lagInFrames * (layers - i)}>
            <div style={{ transform }}>{children}</div>
          </Freeze>
        </div>
      ))}
      {/* 主层:本帧,流内——容器尺寸由它撑起 */}
      <div style={{ transform }}>{children}</div>
    </div>
  );
};
