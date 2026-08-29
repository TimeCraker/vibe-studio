import React from "react";
import { AbsoluteFill, OffthreadVideo, staticFile } from "remotion";
import { cues } from "./cues";
import { DataBars } from "./fx/DataBars";
import { Spotlight } from "./fx/Spotlight";
import { SubtitleTrack } from "./fx/SubtitleTrack";

export const FootageOverlay: React.FC = () => {
  return (
    <AbsoluteFill>
      <OffthreadVideo
        src={staticFile("footage.mp4")}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
      <Spotlight marks={cues.spotlights} />
      <DataBars bars={cues.dataBars} />
      <SubtitleTrack cues={cues.subtitles} />
    </AbsoluteFill>
  );
};
