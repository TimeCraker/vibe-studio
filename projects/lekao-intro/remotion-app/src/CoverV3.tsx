import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { DeviceFrame } from "./scene-kit/DeviceFrame";
import { DropCard } from "./scene-kit/DropCard";
import { FloatWrap } from "./scene-kit/FloatWrap";
import { GlowPulse } from "./scene-kit/GlowPulse";
import { SceneBg } from "./scene-kit/SceneBg";
import { TextReveal } from "./scene-kit/TextReveal";
import { TopProgress } from "./scene-kit/TopProgress";
import { COLOR, FONT } from "./scene-kit/tokens";

// CoverV3 — v3 封面：封面即成片语言。深族底（径向渐变+暗角+网格+噪点）+
// 浏览器框官网 hero 特写（P11 同款 zoom 1.5）+ 150px 金句（稿25）+ 三功能 chips（README）+
// 域名 mono + 顶部进度条语言。全部组件与成片同源（scene-kit + tokens）。
// 静帧出图：npx remotion still src/cover3-index.ts CoverV3 <out>.png --frame=60
//（--frame=60 让入场 spring 走完、GlowPulse/FloatWrap 处于可见相位，确定性）。
const BRAND_LIGHT = "#8FA8FF";

export const CoverV3: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#000", fontFamily: FONT.sans }}>
      <SceneBg variant="dark">
        {/* 顶部进度条语言元素（装饰性，不满宽） */}
        <TopProgress from={0} to={0.55} rampSeconds={0.01} trackColor="rgba(255,255,255,0.12)" />
        <AbsoluteFill style={{ padding: "72px 110px 60px", display: "flex", flexDirection: "column" }}>
          {/* 眉题 */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: "0.32em", textTransform: "uppercase", color: BRAND_LIGHT }}>
              LEKAO · AI 智能助教助手
            </div>
            <div style={{ fontFamily: FONT.mono, fontSize: 24, fontWeight: 700, color: "#94a3b8" }}>
              K12 TEACHING WORKBENCH
            </div>
          </div>
          {/* 150px 金句（稿25，两行断行防拆字） */}
          <div style={{ width: 1700, marginTop: 26 }}>
            <TextReveal
              text={"把每次课的 1 到 2 小时\n还给教学"}
              mode="char"
              size={150}
              weight={800}
              color="#f8fafc"
              delay={0.1}
              highlights={[{ start: 6, end: 14, color: BRAND_LIGHT }]}
            />
          </div>
          {/* 下排：左副行（chips + 域名 + meta）/ 右浏览器框官网特写 */}
          <div style={{ flex: 1, minHeight: 0, display: "flex", alignItems: "center", gap: 48, marginTop: 10 }}>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 26 }}>
              <div style={{ display: "flex", gap: 16 }}>
                {["课堂小结", "作业反馈", "错题集"].map((t) => (
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
              <div style={{ fontFamily: FONT.mono, fontSize: 34, fontWeight: 800, color: BRAND_LIGHT }}>
                lekao.asterforge.top
              </div>
              <div style={{ fontSize: 28, fontWeight: 600, color: "#94a3b8" }}>
                K12 机构助教的 AI 工作台 · 传一张讲义图，出三样成品
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
                  title="LeKao · AI 智能助教助手"
                  domain="lekao.asterforge.top"
                  src={staticFile("lekao/lekao-home.png")}
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
