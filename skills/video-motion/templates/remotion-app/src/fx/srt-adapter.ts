import { parseSrt } from "@remotion/captions";
import type { SubtitleCue } from "../cues";

// SRT → SubtitleCue[](@remotion/captions parseSrt):接 auto-subtitle skill 的 srt 产物,
// 字段(start/end/text)与 video-motion 字幕契约逐字对齐,免手抄时间轴。
export const srtToCues = (srt: string): SubtitleCue[] =>
  parseSrt({ input: srt }).map((c) => ({
    start: c.startInSeconds,
    end: c.endInSeconds,
    text: c.text,
  }));
