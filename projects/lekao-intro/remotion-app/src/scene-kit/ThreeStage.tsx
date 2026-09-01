import React from "react";
import { ThreeCanvas } from "@remotion/three";

// 3D 运镜容器(@remotion/three ThreeCanvas):真透视、真光影、相机运动。
// 铁律:内部**禁 r3f 的 useFrame**(帧不 确定),动画与运镜一律 useCurrentFrame 派生
// (官方模式);相机动画用 useThree 拿 camera 后按 frame 直接赋值,同样确定。
// 只走 WebGL(WebGPU canvas 不进 headless 渲染链)。成本提示:3D 段单帧耗时可到
// 2D 段的数倍,成片「重武器每片 ≤1 处」;SwiftShader 下尤甚。
// 用法:ThreeStage 里放 R3F 元素(mesh/boxGeometry/meshStandardMaterial/自定义 CamRig)。
export const ThreeStage: React.FC<{
  width: number;
  height: number;
  cameraZ?: number; // 相机 z,默认 4.2
  fov?: number; // 默认 50
  dpr?: number; // 默认 1
  style?: React.CSSProperties;
  children: React.ReactNode; // 3D 场景(R3F 元素)
}> = ({ width, height, cameraZ = 4.2, fov = 50, dpr = 1, style, children }) => (
  <div style={style}>
    <ThreeCanvas
      width={width}
      height={height}
      dpr={dpr}
      camera={{ position: [0, 0, cameraZ], fov }}
      gl={{ antialias: true }}
    >
      <ambientLight intensity={0.72} />
      <directionalLight position={[3, 4, 5]} intensity={1.35} />
      <directionalLight position={[-4, -2, -3]} intensity={0.35} color="#8FA8FF" />
      {children}
    </ThreeCanvas>
  </div>
);
