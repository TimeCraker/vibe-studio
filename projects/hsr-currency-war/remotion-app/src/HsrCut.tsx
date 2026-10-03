import React from "react";
import { AbsoluteFill, OffthreadVideo, staticFile, useVideoConfig } from "remotion";
import { DataBars } from "./fx/DataBars";
import { Spotlight } from "./fx/Spotlight";
import { SubtitleTrack } from "./fx/SubtitleTrack";
import { hsrCues } from "./hsr-cues";
import { ChapterCard, DamageCard, EndCard, NameBanner, TitleCard, ttlFrames } from "./hsr-fx";

// 设计坐标系：1920x1080（与横版画布一致，scale 恒 1；保留变换以便未来换规格）
const DESIGN_WIDTH = 1920;
const DESIGN_HEIGHT = 1080;

const SUBTITLE_KEYWORDS = ["银狼", "昔涟", "GM 操作台", "1000%", "三星", "完整体", "万亿", "13/13", "3-7"];

export const HsrCut: React.FC = () => {
  const { fps, width } = useVideoConfig();
  const scale = width / DESIGN_WIDTH;
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
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        {hsrCues.chapterCards.map((c, i) => (
          <ChapterCard key={"ch" + i} cue={c} durationInFrames={ttlFrames(c.ttl, fps)} />
        ))}
        {hsrCues.nameBanners.map((c, i) => (
          <NameBanner key={"nb" + i} cue={c} durationInFrames={ttlFrames(c.ttl, fps)} />
        ))}
        {hsrCues.damageCards.map((c, i) => (
          <DamageCard key={"dc" + i} cue={c} durationInFrames={ttlFrames(c.ttl, fps)} />
        ))}
        <Spotlight marks={hsrCues.spotlights} />
        <DataBars bars={hsrCues.dataBars} />
        <SubtitleTrack
          cues={hsrCues.subtitles}
          theme="panel"
          darkRanges={hsrCues.darkRanges}
          keywords={SUBTITLE_KEYWORDS}
        />
        {hsrCues.titleCards.map((c, i) => (
          <TitleCard key={"tc" + i} cue={c} durationInFrames={ttlFrames(c.ttl, fps)} />
        ))}
        <EndCard cue={hsrCues.endCard} durationInFrames={ttlFrames(hsrCues.endCard.ttl, fps)} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
