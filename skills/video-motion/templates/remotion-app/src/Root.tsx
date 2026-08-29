import React from "react";
import { Composition, staticFile } from "remotion";
import { getVideoMetadata } from "@remotion/media-utils";
import { DataBarsDemo, SpotlightDemo, SubtitleDemo } from "./Demos";
import { FootageOverlay } from "./FootageOverlay";

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;
const DEMO_DURATION = 5 * FPS;
// 正片随素材原生规格：2560x1440 @ 60fps（动效层在 FootageOverlay 内按 1080p 设计坐标放大适配）
const FOOTAGE_FPS = 60;
const FOOTAGE_WIDTH = 2560;
const FOOTAGE_HEIGHT = 1440;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Stage0Test"
        component={Stage0Test}
        durationInFrames={90}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="FootageOverlay"
        component={FootageOverlay}
        durationInFrames={1}
        fps={FOOTAGE_FPS}
        width={FOOTAGE_WIDTH}
        height={FOOTAGE_HEIGHT}
        defaultProps={{}}
        calculateMetadata={async () => {
          const { durationInSeconds } = await getVideoMetadata(
            staticFile("footage.mp4"),
          );
          return {
            durationInFrames: Math.floor(durationInSeconds * FOOTAGE_FPS),
            fps: FOOTAGE_FPS,
            width: FOOTAGE_WIDTH,
            height: FOOTAGE_HEIGHT,
          };
        }}
      />
      <Composition
        id="SubtitleDemo"
        component={SubtitleDemo}
        durationInFrames={DEMO_DURATION}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="DataBarsDemo"
        component={DataBarsDemo}
        durationInFrames={DEMO_DURATION}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="SpotlightDemo"
        component={SpotlightDemo}
        durationInFrames={DEMO_DURATION}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
    </>
  );
};

const Stage0Test: React.FC = () => {
  return (
    <div
      style={{
        flex: 1,
        backgroundColor: "#000",
        justifyContent: "center",
        alignItems: "center",
        display: "flex",
      }}
    >
      <div style={{ color: "#fff", fontFamily: "sans-serif", fontSize: 80 }}>
        video-motion stage0
      </div>
    </div>
  );
};
