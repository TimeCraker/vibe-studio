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

// 动效剧本：CS2 Dust2 回合实录（output/footage/footage.mp4，30.5s）。
// 剧情线：上隧道推进 → B 口交火双杀 → 进 B 区换弹 → 下 C4 → 守包 → 回合胜利 3 杀 MVP。
export const cues = {
  subtitles: [
    { start: 0.8,  end: 2.8,  text: '上隧道出口推进，直奔 B 区' },
    { start: 4.0,  end: 6.0,  text: 'B 口交接火，配合队友双杀' },
    { start: 8.0,  end: 10.0, text: '进入 B 区，换弹完毕随时接战' },
    { start: 12.0, end: 14.0, text: 'B 区平台下包，安放 C4' },
    { start: 16.0, end: 18.0, text: '炸弹已安放，40 秒倒计时' },
    { start: 20.0, end: 22.0, text: '卡住方向守包，静待敌人回防' },
    { start: 24.4, end: 26.4, text: '回合胜利，三杀拿下 MVP' },
    { start: 27.0, end: 29.0, text: '本回合击杀贡献（真实对局数据）' },
  ] as SubtitleCue[],
  dataBars: [
    {
      t: 26.8,
      x: 700,
      y: 400,
      scale: 1,
      bars: [
        { label: '接火双杀', value: 2, unit: '杀', color: '#e8a33d' },
        { label: '残局收割', value: 1, unit: '杀', color: '#4a9eff' },
        { label: '回合总击杀', value: 3, unit: '杀', color: '#7bc96f' },
      ],
    },
  ] as DataBarGroup[],
  spotlights: [
    { t: 4.2,  ttl: 2.5, kind: 'box',    x: 1380, y: 70,  w: 530, h: 85,  text: '双杀时刻' },
    { t: 11.2, ttl: 1.4, kind: 'circle', x: 850,  y: 470, w: 330, h: 350, text: '安放 C4' },
    { t: 16.4, ttl: 2.6, kind: 'arrow',  x: 1085, y: 825, w: 680, h: 0,   text: '倒计时 40 秒' },
  ] as SpotlightCue[],
};
