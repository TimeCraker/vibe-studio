import React from "react";
import { AbsoluteFill } from "remotion";
import type { DataBarGroup, SpotlightCue, SubtitleCue } from "./cues";
import { DataBars } from "./fx/DataBars";
import { Spotlight } from "./fx/Spotlight";
import { SubtitleTrack } from "./fx/SubtitleTrack";
import { ArtLayer } from "./scene-kit/ArtLayer";
import { FONT } from "./scene-kit/tokens";

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
  { t: 2.8, ttl: 1.8, kind: "arrow", x: 860, y: 620, w: 520, h: 0, text: "Look here" },
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

// 美术层 demo（spec: docs/2026-10-05-art-layer-spec.md）：
// 内联 SVG 程序化插画（零 IO 自足）——全出血底图 + 卡片道具双模式同帧验证。
const demoArtSvg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1600 900'>
  <defs><linearGradient id='sky' x1='0' y1='0' x2='0' y2='1'>
    <stop offset='0' stop-color='#F5F1E8'/><stop offset='1' stop-color='#DCE4F7'/>
  </linearGradient></defs>
  <rect width='1600' height='900' fill='url(#sky)'/>
  <circle cx='1180' cy='250' r='90' fill='#3157F6' opacity='.85'/>
  <circle cx='1180' cy='250' r='132' fill='none' stroke='#3157F6' stroke-opacity='.25' stroke-width='2'/>
  <polygon points='0,900 340,430 620,900' fill='#1A2233' opacity='.92'/>
  <polygon points='420,900 820,340 1180,900' fill='#1A2233' opacity='.72'/>
  <polygon points='900,900 1280,520 1600,900' fill='#1A2233' opacity='.52'/>
  <rect y='830' width='1600' height='70' fill='#1A2233' opacity='.16'/>
</svg>`;

export const ArtLayerDemo: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#F5F1E8" }}>
    {/* 全出血底图模式：cover + kenBurns 慢推 + 品牌蓝色温 + 暗角（底图是「空间」不是贴图） */}
    <ArtLayer
      svg={demoArtSvg}
      width={1920}
      height={1080}
      fit="cover"
      kenBurns={{ from: 1, to: 1.045 }}
      tint="rgba(49,87,246,0.06)"
    />
    {/* 卡片道具模式：同图裁方 + tokens 双层阴影 + 圆角（道具级呈现） */}
    <div style={{ position: "absolute", right: 120, bottom: 96 }}>
      <ArtLayer
        svg={demoArtSvg}
        width={520}
        height={340}
        fit="cover"
        shadow="card"
        radius={18}
        vignette={false}
      />
    </div>
    <div
      style={{
        position: "absolute",
        left: 120,
        bottom: 108,
        fontFamily: FONT.sans,
        color: "#1A2233",
      }}
    >
      <div style={{ fontSize: 30, letterSpacing: 6, opacity: 0.55 }}>ART LAYER / SCENE-KIT</div>
      <div style={{ fontSize: 62, fontWeight: 700, marginTop: 10 }}>画面主体是真图，CSS 只排版</div>
    </div>
  </AbsoluteFill>
);
