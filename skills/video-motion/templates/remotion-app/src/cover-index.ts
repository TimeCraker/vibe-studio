import React from "react";
import { Composition, registerRoot } from "remotion";
import { Cover } from "./Cover";
import type { CoverProps } from "./Cover";

// 独立入口：不进 Root.tsx，渲染命令显式传本文件。
// spec 固定 .ts 扩展名，esbuild 不解析 .ts 内 JSX，故用 createElement。
// still 只取首帧，fps / durationInFrames 是注册必填，不影响出图。
const FPS = 30;
const DURATION_IN_FRAMES = 30;
export const COVER_WIDTH = 1920;
export const COVER_HEIGHT = 1080;

const defaultCoverProps: CoverProps = {
  title: "ASTERFORGE 视频引擎",
  subtitle: "封面静态出图样例",
  badge: "ASTERFORGE",
  preset: "dark",
};

const CoverRoot: React.FC = () =>
  React.createElement(Composition, {
    id: "Cover",
    component: Cover,
    durationInFrames: DURATION_IN_FRAMES,
    fps: FPS,
    width: COVER_WIDTH,
    height: COVER_HEIGHT,
    defaultProps: defaultCoverProps,
  });

registerRoot(CoverRoot);
