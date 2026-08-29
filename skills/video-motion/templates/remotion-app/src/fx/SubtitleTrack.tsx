import React from "react";
import {
  AbsoluteFill,
  Sequence,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { SubtitleCue } from "../cues";

const FONT_FAMILY = '"Segoe UI", "Microsoft YaHei", "PingFang SC", sans-serif';
const SPRING_CONFIG = { damping: 200 };
const FADE_SECONDS = 0.4;
const BOTTOM_MARGIN = 84;

const SubtitlePill: React.FC<{ text: string; durationInFrames: number }> = ({
  text,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fadeIn = spring({ frame, fps, config: SPRING_CONFIG });
  const fadeOut = spring({
    frame: Math.max(
      0,
      frame - (durationInFrames - Math.round(FADE_SECONDS * fps)),
    ),
    fps,
    config: SPRING_CONFIG,
  });
  return (
    <div
      style={{
        backgroundColor: "rgba(0, 0, 0, 0.72)",
        color: "#ffffff",
        fontFamily: FONT_FAMILY,
        fontSize: 46,
        lineHeight: 1.35,
        padding: "14px 40px",
        borderRadius: 10,
        whiteSpace: "nowrap",
        opacity: fadeIn * (1 - fadeOut),
        transform: `translateY(${(1 - fadeIn) * 20}px)`,
      }}
    >
      {text}
    </div>
  );
};

export const SubtitleTrack: React.FC<{ cues: SubtitleCue[] }> = ({ cues }) => {
  const { fps, durationInFrames } = useVideoConfig();
  return (
    <AbsoluteFill>
      {cues.map((cue, index) => {
        const from = Math.round(cue.start * fps);
        const dur = Math.max(
          1,
          Math.min(
            Math.round((cue.end - cue.start) * fps),
            durationInFrames - from,
          ),
        );
        return (
          <Sequence key={index} from={from} durationInFrames={dur}>
            <AbsoluteFill
              style={{
                justifyContent: "flex-end",
                alignItems: "center",
                paddingBottom: BOTTOM_MARGIN,
              }}
            >
              <SubtitlePill text={cue.text} durationInFrames={dur} />
            </AbsoluteFill>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
