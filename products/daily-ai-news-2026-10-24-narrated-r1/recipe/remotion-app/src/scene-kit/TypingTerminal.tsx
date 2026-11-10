import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { COLOR, FONT, SHADOW } from "./tokens";
import { DropCard } from "./DropCard";

// 终端窗 v2（F2 拟真）：标题栏与内容同底色（去分割线）、三灯左置、标题 mono 居中、
// 正文纯 #0d1117 + FONT.mono、$ 提示符品牌色、块状光标 530ms 闪烁；
// 整窗经 DropCard（SHADOW.float + RIM.dark 顶光）承载，逐行打字（M2 微叙事）。
const LINE_PAUSE = 0.25; // s，行间停顿
const BODY_BG = "#0d1117";
const DONE_COLOR = "#7d8590";
const TYPING_COLOR = "#e6edf3";
const CURSOR_PERIOD_S = 0.53; // 块状光标闪烁周期

export const TypingTerminal: React.FC<{
  lines: string[];
  cps?: number; // 每秒字符数（18-25 基准）
  width?: number;
  title?: string;
  delay?: number;
  style?: React.CSSProperties;
}> = ({ lines, cps = 20, width = 680, title = "terminal", delay = 0, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = Math.max(0, frame / fps - delay);

  const starts: number[] = [];
  let acc = 0;
  for (const l of lines) {
    starts.push(acc);
    acc += l.length / cps + LINE_PAUSE;
  }

  const rows = lines.map((line, i) => {
    const typed = Math.min(line.length, Math.max(0, Math.floor((t - starts[i]) * cps)));
    const state = typed <= 0 ? "pending" : typed < line.length ? "typing" : "done";
    return { line, typed, state };
  });
  const activeIdx = rows.findIndex((r) => r.state === "typing");
  const lastStarted = [...rows].reverse().find((r) => r.state !== "pending");
  const cursorVisible = Math.floor(t / CURSOR_PERIOD_S) % 2 === 0;

  return (
    <DropCard tone="dark" bg={BODY_BG} radius={14} shadow={SHADOW.float} style={style}>
      {/* 标题栏：与内容同底色，无分割线 */}
      <div style={{ height: 40, display: "flex", alignItems: "center", paddingLeft: 16, position: "relative" }}>
        {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
          <div key={c} style={{ width: 12, height: 12, borderRadius: 6, background: c, marginRight: 8 }} />
        ))}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            textAlign: "center",
            fontFamily: FONT.mono,
            fontSize: 13,
            color: "#8b949e",
          }}
        >
          {title}
        </div>
      </div>
      <div style={{ padding: "14px 24px 24px", fontFamily: FONT.mono, fontSize: 17, lineHeight: 1.8 }}>
        {rows.map((r, i) => {
          const isTyping = r.state === "typing";
          const showCursor = cursorVisible && (isTyping || (activeIdx === -1 && lastStarted === r && r.state === "done" && i === rows.length - 1));
          const hasPrompt = r.line.startsWith("$");
          return (
            <div key={i} style={{ color: r.state === "done" ? DONE_COLOR : TYPING_COLOR, fontWeight: isTyping ? 700 : 400, whiteSpace: "pre-wrap", minHeight: "1.8em" }}>
              {hasPrompt ? (
                <>
                  <span style={{ color: COLOR.brandBright, fontWeight: 800 }}>$</span>
                  {r.line.slice(0, Math.max(1, r.typed)).slice(1)}
                </>
              ) : (
                r.line.slice(0, r.typed)
              )}
              {showCursor ? <span style={{ color: COLOR.brandBright }}>▋</span> : null}
            </div>
          );
        })}
      </div>
    </DropCard>
  );
};
