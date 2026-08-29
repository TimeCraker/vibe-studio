import React from "react";
import { AbsoluteFill, OffthreadVideo, staticFile } from "remotion";
import { cues } from "./cues";
import { DataBars } from "./fx/DataBars";
import { Spotlight } from "./fx/Spotlight";
import { SubtitleTrack } from "./fx/SubtitleTrack";

// 画布 2560x1440（素材原生规格）；动效 cues 按 1080p 设计坐标书写，在此整体放大适配
const DESIGN_WIDTH = 1920;
const DESIGN_HEIGHT = 1080;
const DESIGN_SCALE = 2560 / DESIGN_WIDTH;

export const FootageOverlay: React.FC = () => {
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
          transform: `scale(${DESIGN_SCALE})`,
        }}
      >
        <Spotlight marks={cues.spotlights} />
        <DataBars bars={cues.dataBars} />
        <SubtitleTrack cues={cues.subtitles} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
