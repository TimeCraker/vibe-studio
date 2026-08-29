import React from "react";
import { AbsoluteFill } from "remotion";
import type { DataBarGroup, SpotlightCue, SubtitleCue } from "./cues";
import { DataBars } from "./fx/DataBars";
import { Spotlight } from "./fx/Spotlight";
import { SubtitleTrack } from "./fx/SubtitleTrack";

// Stage 2 demo fixtures: 5s each, solid background, hardcoded params.
const demoSubtitles: SubtitleCue[] = [
  { start: 0.5, end: 2.5, text: "Subtitle demo line one" },
  { start: 3.0, end: 4.8, text: "Subtitle demo line two" },
];

const demoDataBars: DataBarGroup[] = [
  {
    t: 0.8,
    x: 640,
    y: 360,
    bars: [
      { label: "Alpha", value: 42, unit: "%" },
      { label: "Beta", value: 76, unit: "%", color: "#4a9eff" },
      { label: "Gamma", value: 58, unit: "%", color: "#e8590c" },
    ],
  },
];

const demoSpotlights: SpotlightCue[] = [
  {
    t: 0.5,
    ttl: 2.0,
    kind: "circle",
    x: 640,
    y: 280,
    w: 380,
    h: 240,
    text: "Target area",
  },
  { t: 2.8, ttl: 1.8, kind: "arrow", x: 860, y: 620, w: 520, text: "Look here" },
];

export const SubtitleDemo: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#12262e" }}>
    <SubtitleTrack cues={demoSubtitles} />
  </AbsoluteFill>
);

export const DataBarsDemo: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#101b2c" }}>
    <DataBars bars={demoDataBars} />
  </AbsoluteFill>
);

export const SpotlightDemo: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#2b1d10" }}>
    <Spotlight marks={demoSpotlights} />
  </AbsoluteFill>
);
