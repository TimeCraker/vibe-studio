import React from "react";
import { Img, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLOR, FONT, SHADOW } from "./tokens";
import { DropCard } from "./DropCard";

// 设备框 v2（F2 道具拟真）：经得起 200% 放大——
//  browser：标签条（活动标签 favicon+标题+×，旁灰化空标签）→ 工具栏（进/退/刷 SVG + 锁形地址胶囊）→ 内容区；
//  phone：外圆角 64 / 屏圆角 44 偏心、右侧电源键、左侧音量键 ×2、灵动岛贴顶 12px、
//         中框 1px 高光、屏幕玻璃对角高光、接触阴影；截图满幅（溢出裁切），
//         长图走 scrollDistance 匀速滚动或 zoom/offsetY 裁切特写——禁止整图缩到文字不可读。
// 全部光影取值出自 tokens（DropCard 承载）；spring 入场 scale 0.92→1 + y 28→0。
const SPRING_CONFIG = { damping: 200, stiffness: 120, mass: 1 };

const smooth = (p: number) => p * p * (3 - 2 * p);

// 屏幕玻璃对角高光（白 5-8% 线性渐变扫过，静态）
const GlassHighlight: React.FC = () => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      background:
        "linear-gradient(125deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 26%, rgba(255,255,255,0) 46%)",
      pointerEvents: "none",
      zIndex: 6,
    }}
  />
);

// 手机壳（ChatReplay 进壳复用）：children = 屏幕满幅内容
export const PhoneShell: React.FC<{
  width: number;
  screenH?: number; // 屏幕高（默认 width×1.95-24）
  tone?: "light" | "dark";
  style?: React.CSSProperties;
  children?: React.ReactNode;
}> = ({ width, screenH, tone = "light", style, children }) => {
  const dark = tone === "dark";
  const sh = screenH ?? width * 1.95 - 24;
  const keyColor = dark ? "#39445c" : "#2a3346";
  return (
    <DropCard
      tone={tone}
      bg="#111722"
      radius={64}
      overflow="visible"
      shadow={dark ? SHADOW.float : `${SHADOW.card}, ${SHADOW.contact}`}
      style={{ width, flexShrink: 0, ...style }}
    >
      {/* 右侧电源键 / 左侧音量键 ×2（框外 3px 细条） */}
      <div style={{ position: "absolute", right: -3, top: "26%", width: 3, height: 74, borderRadius: 2, background: keyColor }} />
      <div style={{ position: "absolute", left: -3, top: "21%", width: 3, height: 44, borderRadius: 2, background: keyColor }} />
      <div style={{ position: "absolute", left: -3, top: "21%", marginTop: 58, width: 3, height: 44, borderRadius: 2, background: keyColor }} />
      {/* 屏幕（圆角 44，偏心于机身 64） */}
      <div
        style={{
          position: "relative",
          margin: 12,
          borderRadius: 44,
          overflow: "hidden",
          background: "#0b0f16",
          height: sh,
        }}
      >
        {children}
        <GlassHighlight />
        {/* 灵动岛：贴顶 12px */}
        <div
          style={{
            position: "absolute",
            top: 12,
            left: "50%",
            transform: "translateX(-50%)",
            width: 86,
            height: 24,
            borderRadius: 12,
            background: "#04060c",
            zIndex: 7,
          }}
        />
      </div>
    </DropCard>
  );
};

// SVG 小件：锁形 / 箭头（拟真 chrome 用）
const LockIcon: React.FC<{ color: string }> = ({ color }) => (
  <svg width="11" height="13" viewBox="0 0 11 13" style={{ flexShrink: 0 }}>
    <rect x="1" y="5.5" width="9" height="6.5" rx="1.5" fill={color} />
    <path d="M3 5.5 V4 a2.5 2.5 0 0 1 5 0 V5.5" stroke={color} strokeWidth="1.4" fill="none" />
  </svg>
);

const ArrowIcon: React.FC<{ color: string; kind: "back" | "fwd" | "refresh" }> = ({ color, kind }) => {
  if (kind === "refresh") {
    return (
      <svg width="15" height="15" viewBox="0 0 15 15">
        <path d="M12.5 7.5 a5 5 0 1 1 -1.6 -3.7" stroke={color} strokeWidth="1.7" fill="none" strokeLinecap="round" />
        <path d="M12.8 1.6 V4.4 H10" stroke={color} strokeWidth="1.7" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  const d = kind === "back" ? "M9.5 3 L5 7.5 L9.5 12" : "M5.5 3 L10 7.5 L5.5 12";
  return (
    <svg width="15" height="15" viewBox="0 0 15 15">
      <path d={d} stroke={color} strokeWidth="1.9" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

export const DeviceFrame: React.FC<{
  src: string;
  frame: "browser" | "phone";
  title?: string;
  width?: number;
  delay?: number;
  tone?: "light" | "dark";
  domain?: string; // browser 地址栏域名
  zoom?: number; // 内容放大（裁切特写）
  offsetY?: number; // 内容上移 px（配合 zoom 取景）
  scrollDistance?: number; // phone 长图滚动距离 px（提供即进入滚动模式）
  scrollDurationSec?: number; // 滚动走完时长（匀速缓动）
  style?: React.CSSProperties;
}> = ({
  src,
  frame,
  title = "",
  width,
  delay = 0,
  tone = "light",
  domain = "",
  zoom = 1,
  offsetY = 0,
  scrollDistance,
  scrollDurationSec = 6,
  style,
}) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = Math.max(0, f - delay * fps);
  const p = spring({ frame: local, fps, config: SPRING_CONFIG });

  const isBrowser = frame === "browser";
  const w = width ?? (isBrowser ? 760 : 320);
  const dark = tone === "dark";

  const chromeText = dark ? "#aab4c8" : "#57606a";
  const stripBg = dark ? "#1d2330" : "#dfe3e9";
  const toolbarBg = dark ? "#232a3a" : "#f0f2f5";
  const activeTabBg = dark ? "#323b50" : "#f7f8fa";
  const ghostTabBg = dark ? "rgba(255,255,255,0.06)" : "rgba(26,34,51,0.05)";
  const pillBg = dark ? "rgba(255,255,255,0.08)" : "rgba(26,34,51,0.06)";

  const contentH = w * 0.58;
  // 滚动 / 裁切位移：scrollDistance 提供时按匀速缓动走完
  const scrollT = Math.min(1, Math.max(0, local / fps / scrollDurationSec));
  const scrolled = scrollDistance !== undefined ? smooth(scrollT) * scrollDistance : 0;
  const ty = -(offsetY + scrolled);

  const imgEl =
    scrollDistance !== undefined || zoom !== 1 ? (
      <Img
        src={src}
        style={{
          width: `${zoom * 100}%`,
          display: "block",
          transform: `translateY(${ty.toFixed(2)}px)`,
        }}
      />
    ) : (
      <Img
        src={src}
        style={{
          width: "100%",
          display: "block",
          objectFit: "cover",
          objectPosition: "top",
          height: isBrowser ? contentH : undefined,
        }}
      />
    );

  const contentArea = (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        height: isBrowser ? contentH : undefined,
        background: "#ECE9E0",
      }}
    >
      {imgEl}
    </div>
  );

  return (
    <div
      style={{
        width: w,
        opacity: p,
        transform: `translateY(${((1 - p) * 28).toFixed(2)}px) scale(${(0.92 + 0.08 * p).toFixed(3)})`,
        ...style,
      }}
    >
      {isBrowser ? (
        <DropCard tone={tone} bg="none" radius={16} shadow={dark ? SHADOW.float : `${SHADOW.card}, ${SHADOW.contact}`}>
          <div style={{ borderRadius: 15, overflow: "hidden", background: stripBg }}>
            {/* 标签条 */}
            <div style={{ height: 46, display: "flex", alignItems: "flex-end", paddingLeft: 14, gap: 8, paddingBottom: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 15 }}>
                {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
                  <div key={c} style={{ width: 11, height: 11, borderRadius: 6, background: c }} />
                ))}
              </div>
              {/* 活动标签：favicon + 标题 + × */}
              <div
                style={{
                  width: 230,
                  height: 34,
                  borderRadius: "10px 10px 0 0",
                  background: activeTabBg,
                  display: "flex",
                  alignItems: "center",
                  padding: "0 10px",
                  gap: 8,
                }}
              >
                <div style={{ width: 10, height: 10, borderRadius: 5, background: COLOR.brand, flexShrink: 0 }} />
                <div style={{ fontFamily: FONT.sans, fontSize: 12, fontWeight: 600, color: dark ? "#dbe3f2" : "#3c465a", whiteSpace: "nowrap", overflow: "hidden", flex: 1 }}>
                  {title}
                </div>
                <div style={{ fontFamily: FONT.sans, fontSize: 13, color: chromeText, opacity: 0.7 }}>×</div>
              </div>
              {/* 灰化空标签 ×2 */}
              {[0, 1].map((i) => (
                <div key={i} style={{ width: 104, height: 30, borderRadius: "9px 9px 0 0", background: ghostTabBg }} />
              ))}
            </div>
            {/* 工具栏：进退刷 + 锁形地址胶囊 + 两点菜单 */}
            <div style={{ height: 42, background: toolbarBg, display: "flex", alignItems: "center", padding: "0 12px", gap: 10 }}>
              <ArrowIcon color={chromeText} kind="back" />
              <ArrowIcon color={chromeText} kind="fwd" />
              <ArrowIcon color={chromeText} kind="refresh" />
              <div
                style={{
                  flex: 1,
                  height: 28,
                  borderRadius: 14,
                  background: pillBg,
                  display: "flex",
                  alignItems: "center",
                  padding: "0 12px",
                  gap: 6,
                }}
              >
                <LockIcon color={chromeText} />
                <div style={{ fontFamily: FONT.mono, fontSize: 12, fontWeight: 600, color: chromeText, whiteSpace: "nowrap" }}>
                  https://{domain || title}
                </div>
                <div style={{ flex: 1 }} />
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <div style={{ width: 3, height: 3, borderRadius: 2, background: chromeText }} />
                  <div style={{ width: 3, height: 3, borderRadius: 2, background: chromeText }} />
                </div>
              </div>
            </div>
            {contentArea}
          </div>
        </DropCard>
      ) : (
        <PhoneShell width={w} tone={tone}>
          {contentArea}
        </PhoneShell>
      )}
    </div>
  );
};
