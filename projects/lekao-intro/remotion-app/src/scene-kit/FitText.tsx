import React from "react";
import { fitText, fitTextOnNLines } from "@remotion/layout-utils";
import { FONT } from "./tokens";

// 程序排版(@remotion/layout-utils):字号由测量算出,给定盒内不溢出不截断。
// 解掉"150px 大字手动断行留 10% 余量"的历史坑。
//
// 4.0.518 API 事实(踩过):
// - fitText({text, withinWidth, ...}) 返回 {fontSize},只管"单行塞进宽",无高度/行数概念
// - fitTextOnNLines 按空格分词二分——**中文整句会成一个"词"导致字号狂缩**,不可直接用
// 所以:单行走 fitText + 行高封顶;拉丁多行走 fitTextOnNLines;中文多行按字符等分
// maxLines 段后逐行 fitText 取最小字号(中文字等宽,等分即视觉均衡)。
// 实现检查点:测量基于 canvas measureText——**字体必须先装载完成**,否则按回退字体测量失真;
// 默认系统栈(FONT.sans)无此问题。
export const FitText: React.FC<{
  text: string;
  targetWidth: number; // 盒宽(px)
  targetHeight: number; // 盒高(px)
  maxLines?: number; // 默认单行
  fontFamily?: string; // 默认系统 sans 栈
  fontWeight?: number; // 默认 800
  color?: string; // 默认深墨
  align?: "left" | "center" | "right";
  lineHeight?: number; // 默认 1.15
  style?: React.CSSProperties;
}> = ({
  text,
  targetWidth,
  targetHeight,
  maxLines,
  fontFamily = FONT.sans,
  fontWeight = 800,
  color = "#111722",
  align = "left",
  lineHeight = 1.15,
  style,
}) => {
  const { fontSize, rendered } = React.useMemo(() => {
    if (!maxLines) {
      const size = fitText({ text, fontFamily, fontWeight, withinWidth: targetWidth }).fontSize;
      return { fontSize: Math.min(size, targetHeight / lineHeight), rendered: text };
    }
    if (text.includes(" ")) {
      // 拉丁词(有空格):官方 N 行二分,再按总行高封顶
      const r = fitTextOnNLines({ text, maxLines, maxBoxWidth: targetWidth, fontFamily, fontWeight });
      return {
        fontSize: Math.min(r.fontSize, targetHeight / (r.lines.length * lineHeight)),
        rendered: r.lines.join("\n"),
      };
    }
    // CJK:按字符等分 maxLines 段,逐行塞宽取最小字号
    const per = Math.ceil(text.length / maxLines);
    const lines: string[] = [];
    for (let i = 0; i < text.length; i += per) lines.push(text.slice(i, i + per));
    const size = Math.min(
      ...lines.map((l) => fitText({ text: l, fontFamily, fontWeight, withinWidth: targetWidth }).fontSize),
    );
    return { fontSize: Math.min(size, targetHeight / (lines.length * lineHeight)), rendered: lines.join("\n") };
  }, [text, targetWidth, targetHeight, maxLines, fontFamily, fontWeight, lineHeight]);

  return (
    <div
      style={{
        width: targetWidth,
        height: targetHeight,
        fontSize,
        fontFamily,
        fontWeight,
        color,
        textAlign: align,
        lineHeight,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        whiteSpace: "pre-wrap",
        ...style,
      }}
    >
      {rendered}
    </div>
  );
};
