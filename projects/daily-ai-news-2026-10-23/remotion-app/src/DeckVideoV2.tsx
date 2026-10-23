import React from "react";
import {
  AbsoluteFill,
  Audio,
  Sequence,
  staticFile,
  useVideoConfig,
} from "remotion";
import { SubtitleTrack } from "./fx/SubtitleTrack";
import { TopProgress } from "./scene-kit/TopProgress";
import { COLOR, FONT } from "./scene-kit/tokens";
import { DARK_PAGES, SCENES, SUBTITLE_CONFIG } from "./deck-scenes";
import { deckCues } from "./deck-cues";
import { deckParams } from "./deck-params";

// DeckVideoV2 — 场景化成片引擎（机制层，与项目场景解耦）：
// 页序列 = deck-params 派生（页时长跟配音走），页间**硬切为底**（v4 转场律：
// 禁交叉溶解、旧页冻结退场、新页进场动词在场景内容层由 entrance-kit 承担）；
// 每页渲对应 deck-scenes 场景 + 页音频 + 顶部进度条；字幕走 deck-cues 全局时间轴。
// 项目内容在 ./deck-scenes.tsx（SCENES / DARK_PAGES），换项目只换那一个文件。
// 确定性：无随机源、无时钟取值。

const BRAND = COLOR.brand;
const BRAND_LIGHT = "#8FA8FF"; // 深底上的钴蓝提亮档

// 单页：硬切进出（无透明度动画），页内为场景 + 页音频 + 顶部进度条
const V2Page: React.FC<{ index: number }> = ({ index }) => {
  const Scene = SCENES[index - 1];
  const dark = DARK_PAGES.includes(index);
  return (
    <AbsoluteFill>
      <Scene />
      <TopProgress
        from={(index - 1) / SCENES.length}
        to={index / SCENES.length}
        color={dark ? BRAND_LIGHT : BRAND}
        trackColor={dark ? "rgba(255,255,255,0.12)" : "rgba(26,34,51,0.10)"}
      />
      <Audio src={staticFile(`deck/audio/page-${index}.wav`)} />
    </AbsoluteFill>
  );
};

export const DeckVideoV2: React.FC = () => {
  const { fps } = useVideoConfig();
  // 深底页时间区间（字幕面板换深色调）
  const darkRanges = deckParams.pages
    .filter((p) => DARK_PAGES.includes(p.index))
    .map((p) => ({ from: p.start, to: p.start + p.pageSeconds }));
  // 去重：画面大字与字幕重复段（项目在 deck-scenes 的 SUBTITLE_CONFIG 里按页号声明）
  const dedupe = SUBTITLE_CONFIG.dedupe.map(({ page, text }) => {
    const p = deckParams.pages.find((row) => row.index === page);
    if (!p) throw new Error(`SUBTITLE_CONFIG.dedupe 引用了不存在的页号 ${page}`);
    return { from: p.start, to: p.start + p.pageSeconds, text };
  });
  return (
    // 全局字体接入（F2）：全片任何文字不得落回浏览器默认衬线
    <AbsoluteFill style={{ backgroundColor: "#000", fontFamily: FONT.sans }}>
      {/* 页序列帧排布：累计取整（前页结束帧=后页起始帧），末页吃总长余数。
          独立 round 各页 start 会在小数舍入方向不一致时挤出孤儿帧 → 切点黑闪。 */}
      {(() => {
        const totalFrames = Math.round(deckParams.totalSeconds * fps);
        const slots: { index: number; from: number; dur: number }[] = [];
        let acc = 0;
        deckParams.pages.forEach((page, i) => {
          const isLast = i === deckParams.pages.length - 1;
          const dur = isLast ? totalFrames - acc : Math.round(page.pageSeconds * fps);
          slots.push({ index: page.index, from: acc, dur });
          acc += dur;
        });
        return slots.map(({ index, from, dur }) => (
          <Sequence key={index} from={from} durationInFrames={dur}>
            <V2Page index={index} />
          </Sequence>
        ));
      })()}
      <SubtitleTrack cues={deckCues} theme="panel" darkRanges={darkRanges} dedupe={dedupe} keywords={SUBTITLE_CONFIG.keywords} />
    </AbsoluteFill>
  );
};
