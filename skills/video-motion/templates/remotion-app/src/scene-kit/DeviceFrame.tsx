import React from "react";
import { Img, spring, useCurrentFrame, useVideoConfig } from "remotion";

// 设备框装真实截图（V2：主体 = 内容的具象化；讲界面就上真截图）。
// img 静态；框整体 spring 入场 scale 0.92→1 + y 28→0。
const SPRING_CONFIG = { damping: 200, stiffness: 120, mass: 1 };
const INK = "#111722";

export const DeviceFrame: React.FC<{
  src: string;
  frame: "browser" | "phone";
  title?: string;
  width?: number;
  delay?: number;
  style?: React.CSSProperties;
}> = ({ src, frame, title = "", width, delay = 0, style }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = Math.max(0, f - delay * fps);
  const p = spring({ frame: local, fps, config: SPRING_CONFIG });

  const isBrowser = frame === "browser";
  const w = width ?? (isBrowser ? 760 : 320);

  const imgEl = (
    <Img
      src={src}
      style={{
        width: "100%",
        display: "block",
        objectFit: "cover",
        objectPosition: "top",
        height: isBrowser ? w * 0.58 : w * 1.95,
        background: "#ECE9E0",
      }}
    />
  );

  return (
    <div
      style={{
        width: w,
        opacity: p,
        transform: `translateY(${((1 - p) * 28).toFixed(2)}px) scale(${(0.92 + 0.08 * p).toFixed(3)})`,
        filter: "drop-shadow(0 30px 60px rgba(17,23,34,0.22))",
        ...style,
      }}
    >
      {isBrowser ? (
        <div style={{ borderRadius: 14, overflow: "hidden", border: "1px solid rgba(17,23,34,0.10)", background: "#E9E6DE" }}>
          <div style={{ height: 44, display: "flex", alignItems: "center", paddingLeft: 14, position: "relative" }}>
            {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
              <div key={c} style={{ width: 11, height: 11, borderRadius: 6, background: c, marginRight: 7 }} />
            ))}
            <div style={{ position: "absolute", left: 0, right: 0, textAlign: "center", fontFamily: "Consolas, monospace", fontSize: 13, fontWeight: 700, color: "#57606a" }}>
              {title}
            </div>
          </div>
          {imgEl}
        </div>
      ) : (
        <div style={{ borderRadius: 42, border: `10px solid ${INK}`, overflow: "hidden", position: "relative", background: "#000" }}>
          <div style={{ position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)", width: 92, height: 20, borderRadius: 10, background: INK, zIndex: 2 }} />
          {imgEl}
        </div>
      )}
    </div>
  );
};
