import React from "react";
import { CameraMotionBlur } from "@remotion/motion-blur";

// 快门模糊(@remotion/motion-blur CameraMotionBlur):模拟真实相机的快门开角,
// 给整帧运动加自然 motion blur(拖影方向跟运动方向)。**成本 = 子树重渲 ×samples,
// spot-only**(快速横移的一瞬间用,不整页长开;重武器每片 ≤1 处)。
export const ShutterBlur: React.FC<{
  shutterAngle?: number; // 快门开角(度,0-360),默认 180
  samples?: number; // 采样数,默认 10
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ shutterAngle = 180, samples = 10, style, children }) => (
  <CameraMotionBlur shutterAngle={shutterAngle} samples={samples}>
    <div style={style}>{children}</div>
  </CameraMotionBlur>
);
