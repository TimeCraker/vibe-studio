// mg-demos 内联 fixture(模板零素材铁律:不 import 任何 public/ 文件,全部字面量)。

export const mgFixtures = {
  // DrawPath 段
  drawTitle: "真路径生长",
  underlineCaption: "下划线 · evolvePath",
  arrowCaption: "引线箭头 · 手绘折返",
  circleCaption: "圈注 · 沿圆生长",
  morphCaption: "形状渐变 · interpolatePath",
  // NoiseField 段
  noiseTitleLight: "活着的背景",
  noiseTitleDark: "呼吸颗粒场",
  noiseCaptionLight: "NoiseField · light 族",
  noiseCaptionDark: "NoiseField · dark 族",
  // FitText 段
  fitLong:
    "这条标题真的特别长,字号是程序量出来的,刚好放得下不用猜",
  fitTwoLine:
    "两行封顶的长文案:fitTextOnNLines 会把字号缩到恰好两行装完,多余的宽度不吃,行高也不再靠手调余量",
  fitCaptionSingle: "FitText · 单行自动缩号",
  fitCaptionTwo: "FitText · maxLines=2",
};
