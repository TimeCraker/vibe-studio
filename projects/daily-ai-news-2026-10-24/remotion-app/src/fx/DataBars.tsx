import React from "react";
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { DataBarGroup } from "../cues";

const FONT_FAMILY = '"Segoe UI", "Microsoft YaHei", "PingFang SC", sans-serif';
const SPRING_CONFIG = { damping: 200 };
const DEFAULT_COLOR = "#e8a33d";
const BAR_WIDTH = 116;
const BAR_GAP = 30;
const MAX_BAR_HEIGHT = 230;
const VALUE_AREA = 52;
const LABEL_AREA = 58;
const RISE_FRAMES = 27;

const formatValue = (value: number, unit?: string) =>
  `${Math.round(value)}${unit ? ` ${unit}` : ""}`;

const BarGroupView: React.FC<{ group: DataBarGroup }> = ({ group }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({ frame, fps, config: SPRING_CONFIG });
  const maxValue = Math.max(...group.bars.map((b) => Math.abs(b.value)), 1);
  const totalWidth =
    group.bars.length * BAR_WIDTH + (group.bars.length - 1) * BAR_GAP;
  return (
    <div
      style={{
        position: "absolute",
        left: group.x,
        top: group.y,
        width: totalWidth,
        height: VALUE_AREA + MAX_BAR_HEIGHT + LABEL_AREA,
        transform: `scale(${group.scale ?? 1})`,
        transformOrigin: "top left",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: VALUE_AREA,
          height: MAX_BAR_HEIGHT,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          gap: BAR_GAP,
        }}
      >
        {group.bars.map((bar, index) => {
          const height =
            (Math.abs(bar.value) / maxValue) * MAX_BAR_HEIGHT * progress;
          const rolled = interpolate(frame, [0, RISE_FRAMES], [0, bar.value], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          return (
            <div
              key={index}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-end",
                width: BAR_WIDTH,
                height: VALUE_AREA + MAX_BAR_HEIGHT,
              }}
            >
              <div
                style={{
                  backgroundColor: "rgba(0, 0, 0, 0.72)",
                  color: "#ffffff",
                  fontFamily: FONT_FAMILY,
                  fontSize: 30,
                  lineHeight: 1.2,
                  padding: "4px 14px",
                  borderRadius: 8,
                  whiteSpace: "nowrap",
                  marginBottom: 10,
                }}
              >
                {formatValue(rolled, bar.unit)}
              </div>
              <div
                style={{
                  width: BAR_WIDTH,
                  height,
                  backgroundColor: bar.color ?? DEFAULT_COLOR,
                  borderRadius: "8px 8px 0 0",
                }}
              />
            </div>
          );
        })}
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: LABEL_AREA,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          gap: BAR_GAP,
        }}
      >
        {group.bars.map((bar, index) => (
          <div
            key={index}
            style={{
              width: BAR_WIDTH,
              display: "flex",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                backgroundColor: "rgba(0, 0, 0, 0.72)",
                color: "#ffffff",
                fontFamily: FONT_FAMILY,
                fontSize: 26,
                lineHeight: 1.3,
                padding: "4px 12px",
                borderRadius: 8,
                whiteSpace: "nowrap",
              }}
            >
              {bar.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const DataBars: React.FC<{ bars: DataBarGroup[] }> = ({ bars }) => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      {bars.map((group, index) => (
        <Sequence key={index} from={Math.round(group.t * fps)} layout="none">
          <BarGroupView group={group} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
