import React from "react";
import { AbsoluteFill, staticFile } from "remotion";
import { DeviceFrame } from "./scene-kit/DeviceFrame";
import { FloatWrap } from "./scene-kit/FloatWrap";
import { GlowPulse } from "./scene-kit/GlowPulse";
import { SceneBg } from "./scene-kit/SceneBg";
import { TextReveal } from "./scene-kit/TextReveal";
import { TopProgress } from "./scene-kit/TopProgress";
import { COLOR, FONT } from "./scene-kit/tokens";

// CoverV3 — 介绍成片的封面模板：封面即成片语言。
// 深族底（径向渐变 + 暗角 + 网格 + 噪点）+ 浏览器框官网特写 + 超大金句 +
// 三枚功能 chips + mono 域名 + 顶部进度条语言。所有零件与成片同源（scene-kit + tokens），
// 所以封面不会和片子脱节。
//
// 回流说明：本组件原为 projects/lekao-intro 的项目专属实现，2026-10-02 抽成模板并把
// 所有文案/素材改成 props。此前 README 与 product-map 把 `CoverV3` 定为介绍成片的封面入口，
// 但它只存在于那一个项目里，新项目复制模板只能拿到通用 `Cover.tsx`，按文档走是死路。
//
// 用法：改 `cover-props.ts` 里的 DEFAULT_COVER_V3_PROPS（项目文案与截图），然后
//   npx remotion still src/cover3-index.ts CoverV3 <out>.png --frame=60
// --frame=60 是让入场 spring 走完、GlowPulse/FloatWrap 落在可见相位，保证出图确定性。
//
// 版面是照搬已验证实现（lekao 封面实际出过片），只把字符串与截图路径换成 props。
// 模板不带 node_modules，所以本组件在模板里无法渲染自测；接了项目第一次出图时再目检一次。
export type CoverV3Props = {
  /** 左上角品牌眉题，例："LEKAO · AI 智能助教助手" */
  brand: string;
  /** 右上角 mono 副标，例："K12 TEACHING WORKBENCH" */
  tagline: string;
  /** 超大金句，用 \n 手动断行防拆字 */
  headline: string;
  /** 金句里要高亮强调的字符区间（按展开后的字符序号计） */
  highlight?: { start: number; end: number };
  /** 三枚功能 chips */
  chips: string[];
  /** 域名 */
  domain: string;
  /** 副行说明 */
  subtitle: string;
  /** 浏览器框里的官网截图，走 staticFile，路径相对 public/ */
  screenshot: string;
  /** 浏览器框地址栏标题 */
  browserTitle: string;
  /** 主色，缺省用 tokens 里的品牌浅色 */
  accent?: string;
};

export const DEFAULT_COVER_V3_PROPS: CoverV3Props = {
  brand: "BRAND · 一句话定位",
  tagline: "PRODUCT CATEGORY",
  headline: "把最值钱的那件事\n还给人",
  highlight: { start: 6, end: 14 },
  chips: ["功能一", "功能二", "功能三"],
  domain: "example.com",
  subtitle: "一句副行说明 · 具体到做什么",
  screenshot: "cover/hero.png",
  browserTitle: "产品名",
};

const BRAND_LIGHT_FALLBACK = "#8FA8FF";

export const CoverV3: React.FC<CoverV3Props> = ({
  brand,
  tagline,
  headline,
  highlight,
  chips,
  domain,
  subtitle,
  screenshot,
  browserTitle,
  accent,
}) => {
  const brandColor = accent ?? BRAND_LIGHT_FALLBACK;
  return (
    <AbsoluteFill style={{ backgroundColor: "#000", fontFamily: FONT.sans }}>
      <SceneBg variant="dark">
        {/* 顶部进度条语言元素（装饰性，不满宽） */}
        <TopProgress from={0} to={0.55} rampSeconds={0.01} trackColor="rgba(255,255,255,0.12)" />
        <AbsoluteFill style={{ padding: "72px 110px 60px", display: "flex", flexDirection: "column" }}>
          {/* 眉题 */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: "0.32em", textTransform: "uppercase", color: brandColor }}>
              {brand}
            </div>
            <div style={{ fontFamily: FONT.mono, fontSize: 24, fontWeight: 700, color: "#94a3b8" }}>
              {tagline}
            </div>
          </div>
          {/* 超大金句（两行断行防拆字） */}
          <div style={{ width: 1700, marginTop: 26 }}>
            <TextReveal
              text={headline}
              mode="char"
              size={150}
              weight={800}
              color="#f8fafc"
              delay={0.1}
              highlights={highlight ? [{ start: highlight.start, end: highlight.end, color: brandColor }] : []}
            />
          </div>
          {/* 下排：左副行（chips + 域名 + meta）/ 右浏览器框官网特写 */}
          <div style={{ flex: 1, minHeight: 0, display: "flex", alignItems: "center", gap: 48, marginTop: 10 }}>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 26 }}>
              <div style={{ display: "flex", gap: 16 }}>
                {chips.map((t) => (
                  <div
                    key={t}
                    style={{
                      padding: "12px 30px",
                      borderRadius: 999,
                      background: COLOR.darkCard,
                      border: "1px solid rgba(255,255,255,0.14)",
                      fontFamily: FONT.sans,
                      fontSize: 24,
                      fontWeight: 700,
                      color: "#e2e8f0",
                      boxShadow: "0 8px 20px rgba(5,10,20,.35), inset 0 1px 0 rgba(255,255,255,.14)",
                    }}
                  >
                    {t}
                  </div>
                ))}
              </div>
              <div style={{ fontFamily: FONT.mono, fontSize: 34, fontWeight: 800, color: brandColor }}>
                {domain}
              </div>
              <div style={{ fontSize: 28, fontWeight: 600, color: "#94a3b8" }}>
                {subtitle}
              </div>
            </div>
            <div style={{ position: "relative", flexShrink: 0 }}>
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                <GlowPulse size={620} intensity={0.42} />
              </div>
              <FloatWrap period={4.6}>
                <DeviceFrame
                  frame="browser"
                  tone="dark"
                  title={browserTitle}
                  domain={domain}
                  src={staticFile(screenshot)}
                  zoom={1.5}
                  offsetY={60}
                  width={640}
                />
              </FloatWrap>
            </div>
          </div>
        </AbsoluteFill>
      </SceneBg>
    </AbsoluteFill>
  );
};
