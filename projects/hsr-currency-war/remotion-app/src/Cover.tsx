import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";

// 尺寸/边距/字号常量集中此处（spec：派生值不散落硬编码）
const TITLE_FONT_SIZE = 104;
const TITLE_LINE_HEIGHT = 1.15;
const TITLE_MAX_WIDTH = "82%";
const SUBTITLE_FONT_SIZE = 44;
const SUBTITLE_MARGIN_TOP = 28;
const BADGE_FONT_SIZE = 28;
const BADGE_LETTER_SPACING = "0.3em";
const SAFE_MARGIN = 96;
const TOP_LINE_HEIGHT = 2;
const FONT_STACK = '"Microsoft YaHei", "PingFang SC", sans-serif';

const PHOTO_GRADIENT_HEIGHT = "55%";
const PHOTO_GRADIENT =
  "linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0) 100%)";
const DARK_GRADIENT = "linear-gradient(135deg, #0F1115 0%, #1A1D24 100%)";
const DARK_SUBTITLE_COLOR = "#F5C518";
const CLEAN_BG = "#FAFAF7";
const CLEAN_TEXT = "#16181D";
const CLEAN_BADGE_COLOR = "#6B6F76";
const PHOTO_BADGE_COLOR = "rgba(255,255,255,0.75)";

export type CoverPreset = "photo" | "dark" | "clean";

export type CoverProps = {
  title: string;
  subtitle?: string;
  badge?: string;
  // public/ 下相对路径，组件内 staticFile() 解析
  bg?: string;
  preset?: CoverPreset;
};

export const Cover: React.FC<CoverProps> = ({
  title,
  subtitle,
  badge,
  bg,
  preset = "dark",
}) => {
  // photo 缺 bg 时退 dark 渐变底，避免空图出图
  const isPhoto = preset === "photo" && Boolean(bg);
  const isClean = preset === "clean";
  const titleColor = isClean ? CLEAN_TEXT : "#FFFFFF";
  const subtitleColor = isClean
    ? CLEAN_TEXT
    : preset === "dark"
      ? DARK_SUBTITLE_COLOR
      : "#FFFFFF";
  const badgeColor = isClean ? CLEAN_BADGE_COLOR : PHOTO_BADGE_COLOR;

  return (
    <AbsoluteFill
      style={{
        fontFamily: FONT_STACK,
        background: isClean ? CLEAN_BG : DARK_GRADIENT,
      }}
    >
      {isPhoto && bg ? (
        <>
          <Img
            src={staticFile(bg)}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
          {/* 底部向上 55% 黑色渐变遮罩，保白字对比度（验收项） */}
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: PHOTO_GRADIENT_HEIGHT,
              background: PHOTO_GRADIENT,
            }}
          />
        </>
      ) : null}
      {isClean ? (
        <div
          style={{
            position: "absolute",
            left: SAFE_MARGIN,
            right: SAFE_MARGIN,
            top: SAFE_MARGIN,
            height: TOP_LINE_HEIGHT,
            backgroundColor: CLEAN_TEXT,
            opacity: 0.9,
          }}
        />
      ) : null}
      <AbsoluteFill
        style={{
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            fontSize: TITLE_FONT_SIZE,
            fontWeight: 800,
            lineHeight: TITLE_LINE_HEIGHT,
            maxWidth: TITLE_MAX_WIDTH,
            textAlign: "center",
            color: titleColor,
          }}
        >
          {title}
        </div>
        {subtitle ? (
          <div
            style={{
              fontSize: SUBTITLE_FONT_SIZE,
              lineHeight: 1.3,
              marginTop: SUBTITLE_MARGIN_TOP,
              textAlign: "center",
              color: subtitleColor,
            }}
          >
            {subtitle}
          </div>
        ) : null}
      </AbsoluteFill>
      {badge ? (
        <div
          style={{
            position: "absolute",
            right: SAFE_MARGIN,
            bottom: SAFE_MARGIN,
            fontSize: BADGE_FONT_SIZE,
            fontWeight: 600,
            letterSpacing: BADGE_LETTER_SPACING,
            color: badgeColor,
          }}
        >
          {badge}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
