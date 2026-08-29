import React from "react";
import { Composition, staticFile } from "remotion";
import { getVideoMetadata } from "@remotion/media-utils";
import { FootageOverlay } from "./FootageOverlay";

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;

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
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={{}}
        calculateMetadata={async () => {
          const { durationInSeconds } = await getVideoMetadata(
            staticFile("footage.mp4"),
          );
          return {
            durationInFrames: Math.floor(durationInSeconds * FPS),
            fps: FPS,
            width: WIDTH,
            height: HEIGHT,
          };
        }}
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
