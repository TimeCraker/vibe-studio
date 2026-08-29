export interface SubtitleCue {
  start: number;   // 秒，出现时刻
  end: number;     // 秒，消失时刻
  text: string;    // 单行字幕文本（长句拆成多条 cue）
}

export interface DataBarGroup {
  t: number;       // 秒，整组柱开始升起的时刻
  x: number;       // 组左上角 x（px，1080p 坐标系）
  y: number;       // 组左上角 y（px）
  scale?: number;  // 整体缩放，默认 1
  bars: { label: string; value: number; unit?: string; color?: string }[];
}

export interface SpotlightCue {
  t: number;                       // 秒，出现时刻
  ttl: number;                     // 秒，停留时长（到点退出）
  kind: 'circle' | 'arrow' | 'box';
  x: number; y: number;            // 目标区域左上角（arrow 时为指向点）
  w: number; h: number;            // 目标区域宽高（arrow 时 w=箭头伸出长度）
  text?: string;                   // 可选标签，浮在标注旁
}

export const cues = {
  subtitles: [] as SubtitleCue[],
  dataBars:   [] as DataBarGroup[],
  spotlights: [] as SpotlightCue[],
};
