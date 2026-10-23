import { parseSrt } from "@remotion/captions";
import type { SubtitleCue } from "../cues";

// SRT → SubtitleCue[](@remotion/captions parseSrt):接 auto-subtitle skill 的 srt 产物,
// 字段(start/end/text)与 video-motion 字幕契约逐字对齐,免手抄时间轴。
// 4.0.518 事实:parseSrt 返回 { captions: [...] },时间为 **startMs/endMs 毫秒**。
export const srtToCues = (srt: string): SubtitleCue[] =>
  parseSrt({ input: srt }).captions.map((c) => ({
    start: c.startMs / 1000,
    end: c.endMs / 1000,
    text: c.text,
  }));
