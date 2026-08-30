import React from "react";
import { COLOR, SHADOW, RIM } from "./tokens";
import { GlowPulse } from "./GlowPulse";

// F1 光影体系统一容器：全片所有卡片/设备框/终端一律经它，不许裸铺色块。
// surface（浅底白卡 / 深底 #1B2338）+ hairline 边 + 双层阴影 + 1px 边光 + 可选卡后品牌衬光。
export const DropCard: React.FC<{
  tone?: "light" | "dark";
  glow?: boolean;
  glowSize?: number;
  bg?: string | "none"; // 覆盖 surface 底色；"none" 透底（设备框自带机身时用）
  radius?: number;
  padding?: React.CSSProperties["padding"];
  shadow?: string; // 覆盖默认阴影（取值仍出自 SHADOW 令牌，如 `${SHADOW.card}, ${SHADOW.contact}`）
  overflow?: React.CSSProperties["overflow"]; // 默认 hidden；侧键等出框细节传 visible
  style?: React.CSSProperties;
  children?: React.ReactNode;
}> = ({
  tone = "light",
  glow = false,
  glowSize = 560,
  bg,
  radius = 20,
  padding,
  shadow,
  overflow = "hidden",
  style,
  children,
}) => {
  const dark = tone === "dark";
  const surface = bg === "none" ? "transparent" : bg ?? (dark ? COLOR.darkCard : COLOR.paperCard);
  const box = shadow ?? (dark ? SHADOW.float : SHADOW.card);
  const rim = dark ? RIM.dark : RIM.light;
  const border = dark ? COLOR.lineDark : COLOR.line;
  return (
    <div style={{ position: "relative", ...style }}>
      {glow ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <GlowPulse size={glowSize} intensity={0.35} />
        </div>
      ) : null}
      <div
        style={{
          position: "relative",
          borderRadius: radius,
          background: surface,
          border: `1px solid ${border}`,
          boxShadow: `${box}, ${rim}`,
          padding,
          overflow,
        }}
      >
        {children}
      </div>
    </div>
  );
};
