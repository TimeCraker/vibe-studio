import React from "react";
import { Composition, staticFile } from "remotion";
import { getVideoMetadata } from "@remotion/media-utils";
import { DataBarsDemo, SpotlightDemo, SubtitleDemo } from "./Demos";
import { FootageOverlay } from "./FootageOverlay";
import { footageParams } from "./footage-params";

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;
const DEMO_DURATION = 5 * FPS;

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
        fps={footageParams.fps}
        width={footageParams.width}
        height={footageParams.height}
        defaultProps={{}}
        calculateMetadata={async () => {
          const { durationInSeconds } = await getVideoMetadata(
            staticFile("footage.mp4"),
          );
          return {
            durationInFrames: Math.floor(durationInSeconds * footageParams.fps),
            width: footageParams.width,
            height: footageParams.height,
            fps: footageParams.fps,
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
