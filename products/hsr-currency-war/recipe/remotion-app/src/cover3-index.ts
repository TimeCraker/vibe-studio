import React from "react";
import { Composition, registerRoot } from "remotion";
import { CoverV3, DEFAULT_COVER_V3_PROPS, type CoverV3Props } from "./CoverV3";

// CoverV3 独立入口：不进 Root.tsx，与 v1 的 Cover 并行零冲突。
// 出图：npx remotion still src/cover3-index.ts CoverV3 <out>.png --frame=60
//
// 项目怎么用：把下面的 PROPS 换成这个项目的文案与截图（截图放 public/）。
// 想同时出多版封面，就多注册几个 id（CoverV3a / CoverV3b），共用同一个组件。
const FPS = 30;
const DURATION_IN_FRAMES = 90; // 需容纳 --frame=60（入场 spring 走完 + 光晕可见相位）

const PROPS: CoverV3Props = DEFAULT_COVER_V3_PROPS;

const CoverV3Root: React.FC = () =>
  React.createElement(Composition, {
    id: "CoverV3",
    component: CoverV3 as unknown as React.FC<Record<string, unknown>>,
    defaultProps: PROPS as unknown as Record<string, unknown>,
    durationInFrames: DURATION_IN_FRAMES,
    fps: FPS,
    width: 1920,
    height: 1080,
  });

registerRoot(CoverV3Root);
