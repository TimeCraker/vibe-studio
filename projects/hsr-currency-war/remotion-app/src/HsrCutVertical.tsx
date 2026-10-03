import React from "react";
import { AbsoluteFill, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { spring } from "remotion";
import { COLOR, FONT, RIM, SHADOW } from "./scene-kit/tokens";
import { SubtitleTrack } from "./fx/SubtitleTrack";
import { hsrCuesVertical } from "./hsr-cues";
import { EndCard, ttlFrames } from "./hsr-fx";

// 竖版 1080x1920：画面 16:9 填宽置于中上（470-1077），
// 字幕带紧贴画面下沿，伤害卡压在画面内底部，顶部区放钩子标题，底部留平台安全区。

const VTitle: React.FC<{ cue: { t: number; ttl: number; kicker: string; title: string } }> = ({ cue }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const inS = spring({ frame, fps, config: { damping: 200 } });
  return (
    <Sequence from={Math.round(cue.t * fps)} durationInFrames={Math.round(cue.ttl * fps)}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: "0 60px" }}>
        <div style={{ textAlign: "center", opacity: inS, transform: `translateY(${(1 - inS) * 24}px)` }}>
          <div style={{ fontFamily: FONT.sans, fontSize: 34, fontWeight: 700, letterSpacing: 8, color: "#8FA8FF", marginBottom: 20 }}>
            {cue.kicker}
          </div>
          <div
            style={{
              display: "inline-block",
              fontFamily: FONT.sans,
              fontSize: 150,
              fontWeight: 900,
              lineHeight: 1.1,
              color: "#F5F7FF",
              textShadow: "0 4px 26px rgba(0,0,0,.65)",
            }}
          >
            {cue.title}
          </div>
        </div>
      </AbsoluteFill>
    </Sequence>
  );
};

const VDamage: React.FC<{ value: string; label: string }> = ({ value, label }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const punch = spring({ frame, fps, config: { damping: 12, mass: 0.7 } });
  return (
    <div
      style={{
        background: "rgba(10, 13, 22, 0.78)",
        border: `1px solid ${COLOR.lineDark}`,
        borderRadius: 16,
        padding: "16px 44px",
        textAlign: "center",
        opacity: punch,
        transform: `scale(${0.86 + punch * 0.14})`,
      }}
    >
      <div style={{ fontFamily: FONT.sans, fontSize: 24, fontWeight: 700, color: "#8FA8FF", letterSpacing: 4 }}>
        {label}
      </div>
      <div style={{ fontFamily: FONT.sans, fontSize: 76, fontWeight: 900, lineHeight: 1.2, color: "#FFFFFF" }}>
        {value}
      </div>
    </div>
  );
};

export const HsrCutVertical: React.FC = () => {
  const { fps } = useVideoConfig();
  const cues = hsrCuesVertical;
  return (
    <AbsoluteFill style={{ background: "#0A0D16" }}>
      {/* 画面：16:9 填宽，中上 */}
      <div style={{ position: "absolute", top: 470, left: 0, width: 1080, height: 607 }}>
        <OffthreadVideo
          src={staticFile("footage-vertical.mp4")}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>

      {/* 钩子标题：顶部区 */}
      {cues.titleCards.map((c, i) => (
        <VTitle key={"tc" + i} cue={c} />
      ))}

      {/* 伤害卡：画面内底部 */}
      {cues.damageCards.map((c, i) => (
        <Sequence key={"dc" + i} from={Math.round(c.t * fps)} durationInFrames={ttlFrames(c.ttl, fps)}>
          <div style={{ position: "absolute", top: 880, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
            <VDamage value={c.value} label={c.label} />
          </div>
        </Sequence>
      ))}

      {/* 字幕带：紧贴画面下沿 */}
      <div style={{ position: "absolute", top: 1092, left: 0, right: 0, height: 190 }}>
        <SubtitleTrack cues={cues.subtitles} theme="panel" darkRanges={[{ from: 0, to: 999 }]} />
      </div>

      {/* 收尾 */}
      <EndCard cue={cues.endCard} durationInFrames={ttlFrames(cues.endCard.ttl, fps)} />
    </AbsoluteFill>
  );
};
