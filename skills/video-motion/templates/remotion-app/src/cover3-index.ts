import React from "react";
import { Composition, registerRoot } from "remotion";
import { CoverV3 } from "./CoverV3";

// CoverV3 独立入口：不进 Root.tsx / cover-index.ts（v1 存量零改动），与 v1 Cover 并行零冲突。
// 出图：npx remotion still src/cover3-index.ts CoverV3 <out>.png --frame=60
const FPS = 30;
const DURATION_IN_FRAMES = 90; // 需容纳 --frame=60（入场 spring 走完 + 光晕可见相位）

const CoverV3Root: React.FC = () =>
  React.createElement(Composition, {
    id: "CoverV3",
    component: CoverV3,
    durationInFrames: DURATION_IN_FRAMES,
    fps: FPS,
    width: 1920,
    height: 1080,
  });

registerRoot(CoverV3Root);
