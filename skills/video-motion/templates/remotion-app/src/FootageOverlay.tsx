import React from "react";
import { AbsoluteFill, OffthreadVideo, staticFile } from "remotion";

export const FootageOverlay: React.FC = () => {
  return (
    <AbsoluteFill>
      <OffthreadVideo
        src={staticFile("footage.mp4")}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    </AbsoluteFill>
  );
};
