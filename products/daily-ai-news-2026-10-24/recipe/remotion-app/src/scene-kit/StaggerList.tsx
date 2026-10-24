import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";

// 子元素错峰滑入（间隔 80-120ms，M1），direction 控制滑入方向。
const SPRING_CONFIG = { damping: 200, stiffness: 120, mass: 1 };
const RISE_PX = 28;
const SLIDE_PX = 36;

export const StaggerList: React.FC<{
  gap?: number; // ms，兄弟元素间隔（80-120ms 基准）
  direction?: "up" | "left";
  delay?: number; // s，整组起始延迟
  itemStyle?: React.CSSProperties;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}> = ({ gap = 100, direction = "up", delay = 0, itemStyle, style, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const items = React.Children.toArray(children);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, ...style }}>
      {items.map((child, i) => {
        const local = Math.max(0, frame - (delay + (i * gap) / 1000) * fps);
        const p = spring({ frame: local, fps, config: SPRING_CONFIG });
        const off = direction === "up" ? (1 - p) * RISE_PX : (1 - p) * SLIDE_PX;
        return (
          <div
            key={i}
            style={{
              ...itemStyle,
              opacity: p,
              transform:
                direction === "up"
                  ? `translateY(${off.toFixed(2)}px)`
                  : `translateX(${off.toFixed(2)}px)`,
            }}
          >
            {child}
          </div>
        );
      })}
    </div>
  );
};
