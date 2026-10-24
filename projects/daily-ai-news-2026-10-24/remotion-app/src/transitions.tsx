import React from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import type { TransitionPresentation } from "@remotion/transitions";

// house 转场件(@remotion/transitions 自定义 presentation):动词→页间过渡的映射。
// v4 转场律:**fade() 全片禁用**(末页 0.5s 收黑唯一例外);本文件提供的三种全部
// 「enter 侧动、exit 侧恒等(旧页冻结)」。硬切(hardCut)在引擎里就是不放
// Transition(Series 直切零占时),这里的 hardCut() 仅供 demo/对拍用。
// 注意:TransitionSeries 的转场时长会吃掉相邻页时长——成片引擎用零转场(硬切)+ 页内动词,
// 页间过渡件只用于确需 push/wipe 语义的场合。

type PresentationFactory = (durationInFrames?: number) => TransitionPresentation<Record<string, unknown>>;

const makePresentation: (enter: (p: number, width: number) => React.CSSProperties) => PresentationFactory =
  (enter) => () => ({
    component: ({ presentationProgress, presentationDirection, children }) => {
      const { width } = useVideoConfig();
      return (
        <AbsoluteFill style={presentationDirection === "entering" ? enter(presentationProgress, width) : undefined}>
          {children}
        </AbsoluteFill>
      );
    },
    props: {},
  });

// 整页滑入盖场:新页从一侧滑上来,旧页冻结在下面
export const slideIn: PresentationFactory = makePresentation((p, width) => ({
  transform: `translateX(${((1 - p) * width * 0.33).toFixed(1)}px)`,
}));

// 曝光渐起:亮度 0.25 → 1 + 微推,「灯打上来」的页级版
export const exposure: PresentationFactory = makePresentation((p) => ({
  filter: `brightness(${(0.25 + 0.75 * p).toFixed(3)})`,
  transform: `scale(${(1.04 - 0.04 * p).toFixed(4)})`,
}));

// 恒等硬切:两侧都不动(纯时间切换,对拍用)
export const hardCut: PresentationFactory = makePresentation(() => ({}));
