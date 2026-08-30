import React from "react";
import {
  AbsoluteFill,
  Sequence,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { SubtitleCue } from "../cues";
import { COLOR, FONT } from "../scene-kit/tokens";

// 字幕轨（F4 版面一体）：
//   theme="pill"（默认）= v1 黑药丸，存量 composition 零改动；
//   theme="panel"       = v3 并入版面语言——浅底页白 85% 半透明圆角面板 + ink 字
//                         + 关键词品牌色；深底页黑 55% 面板 + 白字；固定底带 y 940-1050。
//   dedupe: 某段字幕与当页画面大字重复（相似度 ≥0.8）→ 抑制不显示。
// 确定性：相似度为字符多重集交集比，无随机源。
const SPRING_CONFIG = { damping: 200 };
const FADE_SECONDS = 0.4;
const PILL_BOTTOM_MARGIN = 84; // v1 药丸底距（保持不动）
const PANEL_BOTTOM = 30; // v3 面板底距 → 面板落在 y≈940-1050 底带

export type DedupeSpan = { from: number; to: number; text: string };
export type DarkSpan = { from: number; to: number };

const normalize = (s: string) =>
  s.replace(/[\s，。！？；：、·（）【】《》“”‘’—–\-.!?;:'"(),]/g, "").toLowerCase();

// 字符多重集交集 / cue 字符数（≥0.8 视为与画面大字重复）
const similarity = (a: string, b: string) => {
  const na = normalize(a);
  const nb = normalize(b);
  if (!na || !nb) return 0;
  const pool = new Map<string, number>();
  for (const ch of nb) pool.set(ch, (pool.get(ch) ?? 0) + 1);
  let hit = 0;
  for (const ch of na) {
    const c = pool.get(ch) ?? 0;
    if (c > 0) {
      hit += 1;
      pool.set(ch, c - 1);
    }
  }
  return hit / na.length;
};

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// 关键词品牌色：按 keywords 拆分文本着色
const Keywordized: React.FC<{ text: string; keywords: string[]; color: string }> = ({
  text,
  keywords,
  color,
}) => {
  const valid = keywords.filter((k) => k.length > 0);
  if (valid.length === 0) return <>{text}</>;
  const re = new RegExp(valid.map(escapeRe).join("|"), "g");
  const parts: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    parts.push(
      <span key={m.index} style={{ color }}>
        {m[0]}
      </span>,
    );
    last = m.index + m[0].length;
    if (m[0].length === 0) re.lastIndex += 1;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
};

const Pill: React.FC<{ text: string; durationInFrames: number }> = ({
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
        fontFamily: FONT.sans,
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

const Panel: React.FC<{
  text: string;
  durationInFrames: number;
  dark: boolean;
  keywords: string[];
}> = ({ text, durationInFrames, dark, keywords }) => {
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
        backgroundColor: dark ? "rgba(5, 8, 16, 0.55)" : "rgba(255, 255, 255, 0.85)",
        border: `1px solid ${dark ? COLOR.lineDark : COLOR.line}`,
        color: dark ? "#f1f5f9" : COLOR.ink,
        fontFamily: FONT.sans,
        fontSize: 40,
        fontWeight: 600,
        lineHeight: 1.3,
        padding: "16px 44px",
        borderRadius: 14,
        maxWidth: 1600,
        textAlign: "center",
        boxShadow: dark ? "none" : "0 4px 18px rgba(15,23,42,0.08)",
        opacity: fadeIn * (1 - fadeOut),
        transform: `translateY(${(1 - fadeIn) * 14}px)`,
      }}
    >
      <Keywordized text={text} keywords={keywords} color={dark ? "#8FA8FF" : COLOR.brand} />
    </div>
  );
};

export const SubtitleTrack: React.FC<{
  cues: SubtitleCue[];
  theme?: "pill" | "panel";
  darkRanges?: DarkSpan[]; // theme=panel：深底页时间区间（秒）
  dedupe?: DedupeSpan[]; // 与画面大字重复 → 抑制
  keywords?: string[]; // 品牌色关键词
}> = ({ cues, theme = "pill", darkRanges = [], dedupe = [], keywords = [] }) => {
  const { fps, durationInFrames } = useVideoConfig();
  return (
    <AbsoluteFill>
      {cues.map((cue, index) => {
        const mid = (cue.start + cue.end) / 2;
        if (
          theme === "panel" &&
          dedupe.some((d) => mid >= d.from && mid <= d.to && similarity(cue.text, d.text) >= 0.8)
        ) {
          return null;
        }
        const from = Math.round(cue.start * fps);
        const dur = Math.max(
          1,
          Math.min(
            Math.round((cue.end - cue.start) * fps),
            durationInFrames - from,
          ),
        );
        const dark = darkRanges.some((r) => mid >= r.from && mid <= r.to);
        return (
          <Sequence key={index} from={from} durationInFrames={dur}>
            <AbsoluteFill
              style={{
                justifyContent: "flex-end",
                alignItems: "center",
                paddingBottom: theme === "panel" ? PANEL_BOTTOM : PILL_BOTTOM_MARGIN,
              }}
            >
              {theme === "panel" ? (
                <Panel text={cue.text} durationInFrames={dur} dark={dark} keywords={keywords} />
              ) : (
                <Pill text={cue.text} durationInFrames={dur} />
              )}
            </AbsoluteFill>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
