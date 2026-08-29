import React from "react";
import { AbsoluteFill, OffthreadVideo, staticFile, useVideoConfig } from "remotion";
import { cues } from "./cues";
import { DataBars } from "./fx/DataBars";
import { Spotlight } from "./fx/Spotlight";
import { SubtitleTrack } from "./fx/SubtitleTrack";

// 画布规格随素材自动适配（footage-params.ts 由 scripts/probe-footage.mjs 生成）；
// 动效 cues 按 1080p 设计坐标书写，在此按画布实际宽度整体缩放适配
const DESIGN_WIDTH = 1920;
const DESIGN_HEIGHT = 1080;

export const FootageOverlay: React.FC = () => {
  const { width } = useVideoConfig();
  return (
    <AbsoluteFill>
      <OffthreadVideo
        src={staticFile("footage.mp4")}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
      <AbsoluteFill
        style={{
          width: DESIGN_WIDTH,
          height: DESIGN_HEIGHT,
          transform: `scale(${width / DESIGN_WIDTH})`,
        }}
      >
        <Spotlight marks={cues.spotlights} />
        <DataBars bars={cues.dataBars} />
        <SubtitleTrack cues={cues.subtitles} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
