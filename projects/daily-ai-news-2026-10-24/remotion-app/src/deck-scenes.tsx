import React from "react";
import { AbsoluteFill } from "remotion";
import { DropCard } from "./scene-kit/DropCard";
import { GlowPulse } from "./scene-kit/GlowPulse";
import { SceneBg } from "./scene-kit/SceneBg";
import { SceneShell } from "./scene-kit/SceneShell";
import { TextReveal } from "./scene-kit/TextReveal";
import { TypingTerminal } from "./scene-kit/TypingTerminal";
import { COLOR } from "./scene-kit/tokens";

// 模板示例场景（每项目替换本文件）：演示场景写法——SceneBg 定族、SceneShell 双栏杂志构图、
// 主体 = 内容本身、TextReveal 大字。照 scene-design 设计表逐页替换；渲染命令同 SKILL.md。
// 素材一律放本工程 public/（staticFile 相对路径），不进 skill 模板。

// 深底页示例：光晕 + 大字
const SceneDemoDark: React.FC = () => (
  <SceneBg variant="dark">
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <GlowPulse size={560} intensity={0.4} style={{ top: -140 }} />
      <TextReveal text={"示例开场大字\n换掉这一页"} mode="char" size={120} weight={800} color="#f8fafc" align="center" delay={0.2} />
    </AbsoluteFill>
  </SceneBg>
);

// 浅底页示例：左标题右终端（主体 = 内容）
const SceneDemoLight: React.FC = () => (
  <SceneBg variant="light">
    <SceneShell chapter="02 / 02" eyebrow="DEMO · SCENE" title="右栏放内容主体" titleSize={120}>
      <DropCard tone="light">
        <TypingTerminal
          title="示例终端"
          cps={16}
          width={620}
          lines={["$ 每页场景写在这个文件", "[1] 照设计表逐页替换", "[2] 素材放 public/ 目录入"]}
        />
      </DropCard>
    </SceneShell>
  </SceneBg>
);

export const DARK_PAGES = [1];
export const SCENES: React.FC[] = [SceneDemoDark, SceneDemoLight];

// 项目级字幕配置(引擎 DeckVideoV2 读取):dedupe = 画面大字与字幕的重复段(页号+文本,
// 引擎换算时间窗,重复时字幕让路);keywords = 字幕里要品牌色高亮的词。
export const SUBTITLE_CONFIG = {
  keywords: [] as string[],
  dedupe: [] as { page: number; text: string }[],
};
