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
  // MgMediaDemo 段
  blurCaption: "BlurTrail · 进场残影",
  shutterCaption: "ShutterBlur · 快门模糊",
  lottieInlineCaption: "LottieLayer · 内联 animationData",
  lottieSrcCaption: "LottieLayer · staticFile 路径",
  gifCaption: "GifLayer · 循环小动效",
  comboCaption: "组合 · 残影进场 + Lottie 徽章",
};

// 内联极简 lottie 动画(spin-ring:虚线圆环旋转+缩放呼吸,90 帧@30fps)。
// 与 assets/lottie/spin-ring.json 同构——模板零素材铁律下 demo 用内联对象,
// staticFile 模式的通道验证用 assets 副本临时复制进 public/。
export const spinRingLottie = {
  v: "5.7.4",
  fr: 30,
  ip: 0,
  op: 90,
  w: 200,
  h: 200,
  nm: "spin-ring",
  ddd: 0,
  assets: [] as [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: "ring",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: {
          a: 1,
          k: [
            { t: 0, s: [0], i: { x: [0.5], y: [0.5] }, o: { x: [0.5], y: [0.5] } },
            { t: 90, s: [360] },
          ],
        },
        p: { a: 0, k: [100, 100, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: {
          a: 1,
          k: [
            { t: 0, s: [80, 80, 100], i: { x: [0.42], y: [1] }, o: { x: [0.58], y: [0] } },
            { t: 45, s: [110, 110, 100], i: { x: [0.42], y: [1] }, o: { x: [0.58], y: [0] } },
            { t: 90, s: [80, 80, 100] },
          ],
        },
      },
      ao: 0,
      shapes: [
        {
          ty: "gr",
          it: [
            { ty: "el", p: { a: 0, k: [0, 0] }, s: { a: 0, k: [140, 140] }, nm: "ellipse" },
            {
              ty: "st",
              c: { a: 0, k: [0.192, 0.341, 0.965, 1] },
              o: { a: 0, k: 100 },
              w: { a: 0, k: 16 },
              lc: 2,
              lj: 2,
              d: [
                { n: "d", nm: "dash", v: { a: 0, k: 70 } },
                { n: "g", nm: "gap", v: { a: 0, k: 220 } },
              ],
              nm: "stroke",
            },
            {
              ty: "tr",
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 },
              nm: "transform",
            },
          ],
          nm: "ring-group",
        },
      ],
      ip: 0,
      op: 90,
      st: 0,
      bm: 0,
    },
  ],
};
