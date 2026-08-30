import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";

// 对话回放：气泡依次弹出 + AI 回复前的"正在输入"指示（M2 微叙事）。
// 时间轴由索引推导（纯函数），气泡进场 spring scale 0.9→1 + y 16→0。
const SPRING_CONFIG = { damping: 200, stiffness: 120, mass: 1 };
const AI_TYPING_SECONDS = 0.8; // AI 气泡前的输入指示时长
const USER_GAP_SECONDS = 0.4; // 用户气泡前静默
const INK = "#111722";
const ACCENT = "#3157F6";

export type ChatMessage = { side: "ai" | "user"; text: string };

export const ChatReplay: React.FC<{
  messages: ChatMessage[];
  width?: number;
  delay?: number;
  style?: React.CSSProperties;
}> = ({ messages, width = 560, delay = 0, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = Math.max(0, frame / fps - delay);

  // 出现时刻：t_i = t_{i-1} + gap_i（AI 前置输入指示，用户短静默）
  const appear: number[] = [];
  let cursor = 0;
  messages.forEach((m, i) => {
    cursor += m.side === "ai" ? AI_TYPING_SECONDS : USER_GAP_SECONDS;
    appear.push(cursor);
    cursor += 0.35; // 气泡阅读停留
  });

  return (
    <div
      style={{
        width,
        display: "flex",
        flexDirection: "column",
        gap: 14,
        ...style,
      }}
    >
      {messages.map((m, i) => {
        const local = t - appear[i];
        if (local < 0) {
          // 若这是 AI 气泡且正处于它的输入指示窗口，显示"正在输入"
          const typingWindow = m.side === "ai" && local > -AI_TYPING_SECONDS + 0.05;
          return typingWindow ? <TypingIndicator key={i} /> : null;
        }
        const p = spring({ frame: local * fps, fps, config: SPRING_CONFIG });
        const isAI = m.side === "ai";
        return (
          <div
            key={i}
            style={{
              alignSelf: isAI ? "flex-start" : "flex-end",
              maxWidth: "82%",
              padding: "13px 18px",
              borderRadius: isAI ? "4px 18px 18px 18px" : "18px 4px 18px 18px",
              background: isAI ? "#FFFFFF" : ACCENT,
              color: isAI ? INK : "#FFFFFF",
              fontSize: 20,
              fontWeight: 600,
              lineHeight: 1.5,
              boxShadow: "0 14px 34px rgba(17,23,34,0.14)",
              opacity: p,
              transform: `translateY(${((1 - p) * 16).toFixed(2)}px) scale(${(0.9 + 0.1 * p).toFixed(3)})`,
            }}
          >
            {m.text}
          </div>
        );
      })}
    </div>
  );
};

const TypingIndicator: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  return (
    <div
      style={{
        alignSelf: "flex-start",
        padding: "12px 16px",
        borderRadius: "4px 16px 16px 16px",
        background: "rgba(17,23,34,0.08)",
        display: "flex",
        gap: 6,
      }}
    >
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            background: INK_MUTED_DOT,
            opacity: 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(2 * Math.PI * (t * 1.6 + i * 0.22))),
          }}
        />
      ))}
    </div>
  );
};

const INK_MUTED_DOT = "#64748b";
