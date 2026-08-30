import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLOR, FONT, SHADOW } from "./tokens";
import { PhoneShell } from "./DeviceFrame";

// 对话回放（F2 拟真 v2）：气泡依次弹出 + AI 回复前的"正在输入"指示（M2 微叙事）。
// shell=true 时整段对话装进 PhoneShell 手机壳——顶部聊天头（头像+名称+在线状态）、
// 浅灰壁纸、气泡 18px 圆角带尾巴、两侧头像、组间时间戳、字体 FONT.sans（禁衬线穿帮）。
// 时间轴由索引推导（纯函数），进场 spring scale 0.9→1 + y 16→0。
const SPRING_CONFIG = { damping: 200, stiffness: 120, mass: 1 };
const AI_TYPING_SECONDS = 0.8; // AI 气泡前的输入指示时长
const USER_GAP_SECONDS = 0.4; // 用户气泡前静默
const INK = "#111722";
const ACCENT = COLOR.brand;

export type ChatMessage = { side: "ai" | "user"; text: string };

const appearTimes = (messages: ChatMessage[]) => {
  const appear: number[] = [];
  let cursor = 0;
  messages.forEach((m) => {
    cursor += m.side === "ai" ? AI_TYPING_SECONDS : USER_GAP_SECONDS;
    appear.push(cursor);
    cursor += 0.35; // 气泡阅读停留
  });
  return appear;
};

// ── 壳内 UI ─────────────────────────────────────────────────────────────
const Avatar: React.FC<{ side: "ai" | "user"; size: number }> = ({ side, size }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      background: side === "ai" ? ACCENT : "#C2CAD6",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
      boxShadow: "0 1px 4px rgba(15,23,42,.18)",
    }}
  >
    {side === "ai" ? (
      <div style={{ fontFamily: FONT.sans, fontSize: size * 0.36, fontWeight: 800, color: "#fff" }}>AI</div>
    ) : null}
  </div>
);

const BubbleTail: React.FC<{ side: "ai" | "user"; bg: string }> = ({ side, bg }) => (
  <div
    style={{
      position: "absolute",
      bottom: 10,
      [side === "ai" ? "left" : "right"]: -3,
      width: 10,
      height: 10,
      background: bg,
      transform: "rotate(45deg)",
      borderRadius: 2,
    }}
  />
);

const ShellChat: React.FC<{ messages: ChatMessage[]; delay: number; width: number }> = ({
  messages,
  delay,
  width,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = Math.max(0, frame / fps - delay);
  const appear = appearTimes(messages);

  return (
    <PhoneShell width={width} style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
        {/* 聊天头：背景延伸到灵动岛下方，内容沉入安全区（island 贴顶 12+24px） */}
        <div
          style={{
            paddingTop: 42,
            paddingBottom: 10,
            flexShrink: 0,
            background: "#FFFFFF",
            borderBottom: `1px solid ${COLOR.line}`,
            display: "flex",
            alignItems: "center",
            padding: "42px 14px 10px",
            gap: 10,
          }}
        >
          <Avatar side="ai" size={30} />
          <div>
            <div style={{ fontFamily: FONT.sans, fontSize: 14, fontWeight: 700, color: COLOR.ink }}>
              LeKao 智能助教
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 1 }}>
              <div style={{ width: 6, height: 6, borderRadius: 3, background: "#2E9E5B" }} />
              <div style={{ fontFamily: FONT.sans, fontSize: 10, fontWeight: 600, color: "#6b7686" }}>在线</div>
            </div>
          </div>
        </div>
        {/* 壁纸 + 消息流 */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            background: "#E9EDF2",
            padding: "12px 12px 10px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
            overflow: "hidden",
          }}
        >
          {messages.map((m, i) => {
            const local = t - appear[i];
            const isAI = m.side === "ai";
            const newGroup = i > 0 && messages[i - 1].side !== m.side;
            if (local < 0) {
              const typingWindow = isAI && local > -AI_TYPING_SECONDS + 0.05;
              return typingWindow ? <ShellTypingIndicator key={i} /> : null;
            }
            const p = spring({ frame: local * fps, fps, config: SPRING_CONFIG });
            const bg = isAI ? "#FFFFFF" : ACCENT;
            return (
              <React.Fragment key={i}>
                {newGroup ? (
                  <div
                    style={{
                      alignSelf: "center",
                      fontFamily: FONT.sans,
                      fontSize: 10,
                      fontWeight: 600,
                      color: "#7c8698",
                      opacity: p,
                    }}
                  >
                    刚刚
                  </div>
                ) : null}
                <div
                  style={{
                    display: "flex",
                    flexDirection: isAI ? "row" : "row-reverse",
                    alignItems: "flex-end",
                    gap: 8,
                    opacity: p,
                    transform: `translateY(${((1 - p) * 14).toFixed(2)}px) scale(${(0.92 + 0.08 * p).toFixed(3)})`,
                    transformOrigin: isAI ? "left bottom" : "right bottom",
                  }}
                >
                  <Avatar side={m.side} size={26} />
                  <div
                    style={{
                      position: "relative",
                      maxWidth: "74%",
                      padding: "10px 13px",
                      borderRadius: 18,
                      background: bg,
                      color: isAI ? COLOR.ink : "#FFFFFF",
                      fontFamily: FONT.sans,
                      fontSize: 15,
                      fontWeight: 600,
                      lineHeight: 1.5,
                      boxShadow: isAI ? SHADOW.card : "0 4px 14px rgba(49,87,246,.30)",
                    }}
                  >
                    <BubbleTail side={m.side} bg={bg} />
                    {m.text}
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>
        {/* 输入条：静帧里的"进行时"证据——块光标 530ms 闪烁（确定性） */}
        <div
          style={{
            flexShrink: 0,
            background: "#FFFFFF",
            borderTop: `1px solid ${COLOR.line}`,
            padding: "8px 10px",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <div
            style={{
              flex: 1,
              background: "#F1F3F7",
              borderRadius: 16,
              padding: "7px 12px",
              display: "flex",
              alignItems: "center",
              fontFamily: FONT.sans,
              fontSize: 12,
              fontWeight: 600,
              color: "#9aa3b5",
            }}
          >
            输入消息
            <span style={{ color: ACCENT, marginLeft: 2, opacity: Math.floor(frame / (0.53 * fps)) % 2 === 0 ? 1 : 0 }}>▋</span>
          </div>
          <div style={{ width: 28, height: 28, borderRadius: 14, background: ACCENT, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="13" height="13" viewBox="0 0 13 13">
              <path d="M2 6.5 H10 M6.8 3 L10.3 6.5 L6.8 10" stroke="#fff" strokeWidth="1.7" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </div>
    </PhoneShell>
  );
};

const ShellTypingIndicator: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  return (
    <div style={{ display: "flex", flexDirection: "row", alignItems: "flex-end", gap: 8 }}>
      <Avatar side="ai" size={26} />
      <div
        style={{
          position: "relative",
          padding: "12px 16px",
          borderRadius: 18,
          background: "#FFFFFF",
          display: "flex",
          gap: 6,
          boxShadow: SHADOW.card,
        }}
      >
        <BubbleTail side="ai" bg="#FFFFFF" />
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: 7,
              height: 7,
              borderRadius: 4,
              background: "#8a93a6",
              opacity: 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(2 * Math.PI * (t * 1.6 + i * 0.22))),
            }}
          />
        ))}
      </div>
    </div>
  );
};

// ── 无壳旧模式（存量兼容）：布局同 v2，仅补 FONT.sans 禁衬线穿帮 ────────
export const ChatReplay: React.FC<{
  messages: ChatMessage[];
  width?: number;
  delay?: number;
  shell?: boolean; // v3：装进手机壳（聊天头/壁纸/尾巴/头像/时间戳）
  style?: React.CSSProperties;
}> = ({ messages, width = 560, delay = 0, shell = false, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = Math.max(0, frame / fps - delay);
  const appear = appearTimes(messages);

  if (shell) {
    return <ShellChat messages={messages} delay={delay} width={width || 340} />;
  }

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
              fontFamily: FONT.sans,
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
            background: "#64748b",
            opacity: 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(2 * Math.PI * (t * 1.6 + i * 0.22))),
          }}
        />
      ))}
    </div>
  );
};
