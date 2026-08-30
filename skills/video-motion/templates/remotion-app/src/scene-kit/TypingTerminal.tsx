import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";

// macOS 风终端窗：逐行打字 + 光标闪烁 + 当前行高亮（M2 微叙事：0.5-2s 一个事件）。
// 确定性：打字进度全部由 (t - lineStart) × cps 推导，无随机源。
const LINE_PAUSE = 0.25; // s，行间停顿
const BG = "#141a24";
const BORDER = "rgba(255,255,255,0.09)";
const DONE_COLOR = "#7d8590";
const TYPING_COLOR = "#e6edf3";

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
  // 光标落在最后一条已开始（未完或刚完）的行尾
  const activeIdx = rows.findIndex((r) => r.state === "typing");
  const lastStarted = [...rows].reverse().find((r) => r.state !== "pending");
  const cursorVisible = Math.floor(frame / 18) % 2 === 0;

  return (
    <div
      style={{
        width,
        borderRadius: 14,
        background: BG,
        border: `1px solid ${BORDER}`,
        boxShadow: "0 30px 80px rgba(0,0,0,0.35)",
        overflow: "hidden",
        ...style,
      }}
    >
      <div
        style={{
          height: 42,
          display: "flex",
          alignItems: "center",
          paddingLeft: 16,
          position: "relative",
          borderBottom: `1px solid ${BORDER}`,
        }}
      >
        {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
          <div key={c} style={{ width: 12, height: 12, borderRadius: 6, background: c, marginRight: 8 }} />
        ))}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            textAlign: "center",
            fontFamily: "Consolas, monospace",
            fontSize: 13,
            color: "#8b949e",
          }}
        >
          {title}
        </div>
      </div>
      <div style={{ padding: "20px 24px 24px", fontFamily: "Consolas, 'Microsoft YaHei', monospace", fontSize: 17, lineHeight: 1.8 }}>
        {rows.map((r, i) => {
          const isTyping = r.state === "typing";
          const showCursor = cursorVisible && (isTyping || (activeIdx === -1 && lastStarted === r && r.state === "done" && i === rows.length - 1));
          return (
            <div key={i} style={{ color: r.state === "done" ? DONE_COLOR : TYPING_COLOR, fontWeight: isTyping ? 700 : 400, whiteSpace: "pre-wrap", minHeight: "1.8em" }}>
              {r.line.slice(0, r.typed)}
              {showCursor ? <span style={{ color: ACCENT_CURSOR }}>▋</span> : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ACCENT_CURSOR = "#58a6ff";
