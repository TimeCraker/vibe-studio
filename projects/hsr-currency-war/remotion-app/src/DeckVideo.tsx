import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { deckCues } from "./deck-cues";
import { deckParams } from "./deck-params";
import { SubtitleTrack } from "./fx/SubtitleTrack";

const SPRING_CONFIG = { damping: 200 };
const RISE_PX = 24; // 淡入时的上浮距离

// 单页：前 overlap 淡入 + 上浮，后 overlap 淡出 → 相邻页交叉溶解
const DeckPage: React.FC<{ index: number; pageSeconds: number }> = ({
  index,
  pageSeconds,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fadeIn = spring({ frame, fps, config: SPRING_CONFIG });
  const fadeOut = spring({
    frame: Math.max(
      0,
      frame - Math.round((pageSeconds - deckParams.overlapSeconds) * fps),
    ),
    fps,
    config: SPRING_CONFIG,
  });
  return (
    <AbsoluteFill
      style={{
        opacity: fadeIn * (1 - fadeOut),
        transform: `translateY(${(1 - fadeIn) * RISE_PX}px)`,
      }}
    >
      <Img
        src={staticFile(`deck/pages/p-${index}.png`)}
        style={{ width: "100%", height: "100%", objectFit: "contain" }}
      />
      <Audio src={staticFile(`deck/audio/page-${index}.wav`)} />
    </AbsoluteFill>
  );
};

// PPT 逐页成片：页图 + 逐页配音，页时长 = 音频 + 呼吸，页间 0.5s 交叉溶解，
// 字幕按分段稿时间轴（build-deck-params.mjs 摊时生成）顶层叠加。
export const DeckVideo: React.FC = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {deckParams.pages.map((page) => (
        <Sequence
          key={page.index}
          from={Math.round(page.start * fps)}
          durationInFrames={Math.round(
            (page.pageSeconds + deckParams.overlapSeconds) * fps,
          )}
        >
          <DeckPage index={page.index} pageSeconds={page.pageSeconds} />
        </Sequence>
      ))}
      <SubtitleTrack cues={deckCues} />
    </AbsoluteFill>
  );
};
