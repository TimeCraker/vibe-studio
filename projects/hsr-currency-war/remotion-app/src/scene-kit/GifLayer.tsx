import React from "react";
import { Gif } from "@remotion/gif";
import { staticFile } from "remotion";

// GIF 资产层(@remotion/gif):循环小动效(loading 圈、手绘抖动强调等)。
// src 是 staticFile 相对路径(assets/media 复制进项目 public/ 后用);
// 确定性由 GIF 自身逐帧解码保证。
export const GifLayer: React.FC<{
  src: string; // staticFile 相对路径,如 "media/test-spinner.gif"
  width: number;
  height?: number; // 默认 = width
  fit?: "contain" | "cover" | "fill";
  style?: React.CSSProperties;
}> = ({ src, width, height, fit = "contain", style }) => (
  <Gif src={staticFile(src)} width={width} height={height ?? width} fit={fit} style={style} />
);
