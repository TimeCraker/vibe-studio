import React from "react";
import { AbsoluteFill, Composition } from "remotion";

const Stage0Test: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#000",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div style={{ color: "#fff", fontFamily: "sans-serif", fontSize: 80 }}>
        video-motion stage0
      </div>
    </AbsoluteFill>
  );
};

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="Stage0Test"
      component={Stage0Test}
      durationInFrames={90}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
