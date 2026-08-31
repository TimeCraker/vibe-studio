import React from "react";
import {
  AbsoluteFill,
  Audio,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { SubtitleTrack } from "./fx/SubtitleTrack";
import { TopProgress } from "./scene-kit/TopProgress";
import { COLOR, FONT } from "./scene-kit/tokens";
import { DARK_PAGES, SCENES } from "./deck-scenes";
import { deckCues } from "./deck-cues";
import { deckParams } from "./deck-params";

// DeckVideoV2 — 场景化成片引擎（机制层，与项目场景解耦）：
// 页序列 = deck-params 派生（页时长跟配音走）+ 0.5s 交叠溶解；每页渲染对应 deck-scenes 场景
// + 页音频 + 顶部进度条；字幕走 deck-cues 全局时间轴（panel 主题 + 深浅色调 + 大字去重）。
// 项目内容在 ./deck-scenes.tsx（SCENES / DARK_PAGES），换项目只换那一个文件。
// 确定性：无随机源、无时钟取值。

const SPRING = { damping: 200, stiffness: 120, mass: 1 };
const BRAND = COLOR.brand;
const BRAND_LIGHT = "#8FA8FF"; // 深底上的钴蓝提亮档

// 单页：0.5s 交叉溶解（与 v1/v2 同机制），页内为 v3 场景 + 页音频 + 顶部进度条
const V2Page: React.FC<{ index: number; pageSeconds: number }> = ({ index, pageSeconds }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fadeIn = spring({ frame, fps, config: SPRING });
  const fadeOut = spring({
    frame: Math.max(0, frame - Math.round((pageSeconds - deckParams.overlapSeconds) * fps)),
    fps,
    config: SPRING,
  });
  const Scene = SCENES[index - 1];
  const dark = DARK_PAGES.includes(index);
  return (
    <AbsoluteFill style={{ opacity: fadeIn * (1 - fadeOut) }}>
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
  const pageOf = (i: number) => deckParams.pages.find((p) => p.index === i)!;
  // 深底页时间区间（字幕面板换深色调）
  const darkRanges = deckParams.pages
    .filter((p) => DARK_PAGES.includes(p.index))
    .map((p) => ({ from: p.start, to: p.start + p.pageSeconds }));
  // 去重：画面大字与字幕重复段（P1 两段 / P10 两段 / P11 两段）
  const span = (i: number, text: string) => {
    const p = pageOf(i);
    return { from: p.start, to: p.start + p.pageSeconds, text };
  };
  const dedupe = [
    span(1, "LeKao · AI 智能助教助手"),
    span(1, "K12 机构助教的 AI 工作台"),
    span(10, "记住一句话就够了"),
    span(10, "把每次课的 1 到 2 小时，还给教学"),
    span(11, "打开官网，现在就能试"),
    span(11, "每次课，省回 1 到 2 小时"),
  ];
  return (
    // 全局字体接入（F2）：全片任何文字不得落回浏览器默认衬线
    <AbsoluteFill style={{ backgroundColor: "#000", fontFamily: FONT.sans }}>
      {deckParams.pages.map((page) => (
        <Sequence
          key={page.index}
          from={Math.round(page.start * fps)}
          durationInFrames={Math.round((page.pageSeconds + deckParams.overlapSeconds) * fps)}
        >
          <V2Page index={page.index} pageSeconds={page.pageSeconds} />
        </Sequence>
      ))}
      <SubtitleTrack cues={deckCues} theme="panel" darkRanges={darkRanges} dedupe={dedupe} keywords={["LeKao", "T-Coin", "Word", "Excel", "AI"]} />
    </AbsoluteFill>
  );
};
