import React from "react";
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { SpotlightCue } from "../cues";

const FONT_FAMILY = '"Segoe UI", "Microsoft YaHei", "PingFang SC", sans-serif';
const SPRING_CONFIG = { damping: 200 };
const STROKE_COLOR = "#ffd54a";
const STROKE_WIDTH = 5;
const PULSE_PERIOD_SECONDS = 0.5;
const PULSE_AMPLITUDE = 0.02;
const FADE_SECONDS = 0.4;
const ARROW_HEAD = 30;
const LABEL_FONT_SIZE = 30;

const MarkView: React.FC<{ mark: SpotlightCue }> = ({ mark }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const appear = spring({ frame, fps, config: SPRING_CONFIG });
  const fadeOut = spring({
    frame: Math.max(
      0,
      frame - Math.round((mark.ttl - FADE_SECONDS) * fps),
    ),
    fps,
    config: SPRING_CONFIG,
  });
  const opacity = appear * (1 - fadeOut);
  const pulse =
    1 +
    PULSE_AMPLITUDE *
      Math.sin((frame / fps) * ((Math.PI * 2) / PULSE_PERIOD_SECONDS));

  const shape =
    mark.kind === "circle" ? (
      <ellipse
        cx={mark.x + mark.w / 2}
        cy={mark.y + mark.h / 2}
        rx={mark.w / 2}
        ry={mark.h / 2}
        fill="rgba(255, 213, 74, 0.08)"
        stroke={STROKE_COLOR}
        strokeWidth={STROKE_WIDTH}
      />
    ) : mark.kind === "box" ? (
      <rect
        x={mark.x}
        y={mark.y}
        width={mark.w}
        height={mark.h}
        rx={10}
        fill="rgba(255, 213, 74, 0.08)"
        stroke={STROKE_COLOR}
        strokeWidth={STROKE_WIDTH}
      />
    ) : (
      <g>
        <line
          x1={mark.x + mark.w}
          y1={mark.y}
          x2={mark.x + (1 - appear) * mark.w}
          y2={mark.y}
          stroke={STROKE_COLOR}
          strokeWidth={STROKE_WIDTH + 2}
          strokeLinecap="round"
        />
        <polygon
          points={`${mark.x},${mark.y} ${mark.x + ARROW_HEAD},${
            mark.y - ARROW_HEAD * 0.6
          } ${mark.x + ARROW_HEAD},${mark.y + ARROW_HEAD * 0.6}`}
          fill={STROKE_COLOR}
          opacity={interpolate(appear, [0.7, 1], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })}
        />
      </g>
    );

  const label = mark.text
    ? (() => {
        const textWidth = mark.text.length * LABEL_FONT_SIZE * 0.9 + 36;
        const lx = Math.min(
          Math.max(8, mark.x + mark.w / 2 - textWidth / 2),
          width - textWidth - 8,
        );
        let ly = mark.y - 58;
        if (ly < 8) {
          ly = mark.y + mark.h + 16;
        }
        return (
          <g>
            <rect
              x={lx}
              y={ly}
              width={textWidth}
              height={48}
              rx={10}
              fill="rgba(0, 0, 0, 0.72)"
            />
            <text
              x={lx + textWidth / 2}
              y={ly + 34}
              textAnchor="middle"
              fill="#ffffff"
              fontSize={LABEL_FONT_SIZE}
              fontFamily={FONT_FAMILY}
            >
              {mark.text}
            </text>
          </g>
        );
      })()
    : null;

  const anchorX = mark.kind === "arrow" ? mark.x : mark.x + mark.w / 2;
  const anchorY = mark.kind === "arrow" ? mark.y : mark.y + mark.h / 2;

  return (
    <g
      opacity={opacity}
      transform={`translate(${anchorX} ${anchorY}) scale(${pulse}) translate(${-anchorX} ${-anchorY})`}
    >
      {shape}
      {label}
    </g>
  );
};

export const Spotlight: React.FC<{ marks: SpotlightCue[] }> = ({ marks }) => {
  const { fps, width, height, durationInFrames } = useVideoConfig();
  return (
    <AbsoluteFill>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ position: "absolute", left: 0, top: 0 }}
      >
        {marks.map((mark, index) => {
          const from = Math.round(mark.t * fps);
          const dur = Math.max(
            1,
            Math.min(Math.round(mark.ttl * fps), durationInFrames - from),
          );
          return (
            <Sequence key={index} from={from} durationInFrames={dur} layout="none">
              <MarkView mark={mark} />
            </Sequence>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
