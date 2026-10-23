// VENDORED from Onda (https://onda-video.vercel.app) — registry/transitions/depth-push
// Source repo: github.com/degueba/onda | License: MIT (code; name/brand excluded) | Fetched: 2026-09-01
// Local intake changes:
//   - stripped zod schema validation (options typed directly, same defaults)
//   - that's it — presentation logic is upstream code, unchanged
// Reads as a camera dolly: outgoing scene scales down slightly as it pushes off,
// incoming scales from slightly larger. Pair with
// linearTiming({ durationInFrames: 18, easing: Easing.bezier(0.16, 1, 0.3, 1) }).

import React from "react";
import type {
  TransitionPresentation,
  TransitionPresentationComponentProps,
} from "@remotion/transitions";
import { AbsoluteFill } from "remotion";

export type DepthPushDirection = "left" | "right" | "up" | "down";
export type DepthPushOptions = {
  /** Direction the camera move travels. Default "left". */
  direction?: DepthPushDirection;
  /**
   * Amount of parallax scale. Outgoing scene scales down by this factor
   * as it pushes off; incoming scales from `1 + scaleAmount` toward 1.
   * Default 0.05 (subtle by design), max 0.3.
   */
  scaleAmount?: number;
};

type DepthPushProps = { direction: DepthPushDirection; scaleAmount: number };

const VECTOR: Record<DepthPushDirection, { x: number; y: number }> = {
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
};

const DepthPushPresentation: React.FC<TransitionPresentationComponentProps<DepthPushProps>> = ({
  presentationProgress,
  presentationDirection,
  children,
  passedProps,
}) => {
  const { x, y } = VECTOR[passedProps.direction];
  const isEntering = presentationDirection === "entering";
  const s = passedProps.scaleAmount;

  // Same translation as push, layered with a scale that gives depth:
  //   Outgoing: 1.0 -> 1.0 - s (recedes slightly as it pushes off)
  //   Incoming: 1.0 + s -> 1.0 (approaches from slightly large)
  const translateX = isEntering
    ? -x * 100 * (1 - presentationProgress)
    : x * 100 * presentationProgress;
  const translateY = isEntering
    ? -y * 100 * (1 - presentationProgress)
    : y * 100 * presentationProgress;
  const scale = isEntering
    ? 1 + s * (1 - presentationProgress)
    : 1 - s * presentationProgress;

  return (
    <AbsoluteFill style={{ transform: `translate(${translateX}%, ${translateY}%) scale(${scale})` }}>
      {children}
    </AbsoluteFill>
  );
};

export function depthPush(options?: DepthPushOptions): TransitionPresentation<DepthPushProps> {
  const { direction = "left", scaleAmount = 0.05 } = options ?? {};
  return {
    component: DepthPushPresentation,
    props: { direction, scaleAmount },
  };
}

export default depthPush;
