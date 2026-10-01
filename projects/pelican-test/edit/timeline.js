/**
 * The cut, as data.
 *
 * Every unit is one visual beat. `a`..`b` are absolute times in the finished
 * video. Source clips are the 3840x2160 captures in frames/<shot>/; `src` is the
 * time to read from inside that clip. `view` is the window into the capture, in
 * normalised source coordinates, so the app's own UI chrome can be cropped out.
 *
 * `label` prints in the caption band's left slot, `meta` in its right slot.
 *
 * Reads edit/sections.json for the section grid, so picture and music cannot drift.
 */
const FPS = 60;
const VIDEO_END = 63.4; // 62.4s of music + a 1.0s ring-out over the end card

// --------------------------------------------------------------------------- //
// views into the 4K capture (normalised cx, cy, w, h).
// The footage plate is 1920x888 (2.162:1), so a view of size s shows
// cy +- s*0.411 of the source height.
// --------------------------------------------------------------------------- //
const VIEWS = {
  // Version A — full-bleed seaside app, chrome at top and bottom
  aFull:   { cx: 0.500, cy: 0.500, w: 1.00, h: 1.00 }, // whole app, chrome cropped by the plate
  aScene:  { cx: 0.500, cy: 0.475, w: 0.95, h: 0.95 }, // clean cinematic crop
  aBike:   { cx: 0.430, cy: 0.610, w: 0.60, h: 0.60 }, // bike + pelican body
  aMid:    { cx: 0.500, cy: 0.545, w: 0.56, h: 0.56 }, // handlebar, bell, crank
  aWheel:  { cx: 0.455, cy: 0.670, w: 0.50, h: 0.50 }, // drivetrain
  aHead:   { cx: 0.480, cy: 0.255, w: 0.44, h: 0.44 }, // head, beak, pouch
  aSplit:  { cx: 0.470, cy: 0.500, w: 0.68, h: 0.68 }, // comparison plate (1.42:1)

  // Version B — app card floating on navy
  bFull:   { cx: 0.500, cy: 0.500, w: 1.00, h: 1.00 },
  bCard:   { cx: 0.500, cy: 0.500, w: 0.74, h: 0.74 }, // just the card
  bImmers: { cx: 0.500, cy: 0.500, w: 0.92, h: 0.92 }, // immersive full-bleed
  bBike:   { cx: 0.500, cy: 0.625, w: 0.58, h: 0.58 },
  bSplit:  { cx: 0.500, cy: 0.500, w: 0.70, h: 0.70 },
};

// --------------------------------------------------------------------------- //
// camera: z = zoom, x/y = pan in fractions of the view size
// --------------------------------------------------------------------------- //
const cam = (z0, z1, x0 = 0, x1 = 0, y0 = 0, y1 = 0, ease = 'inOut') =>
  ({ z: [z0, z1], x: [x0, x1], y: [y0, y1], ease });

// --------------------------------------------------------------------------- //
// the units
// --------------------------------------------------------------------------- //
const UNITS = [
  // ===== 01 · hook (0.0 - 4.8) ============================================ //
  {
    id: 'hook', kind: 'hook', a: 0.0, b: 4.8, num: '01',
    label: '01 · 开场',
    kicker: '不同模型实测 · 第一期',
    title: ['鹈鹕测试'],
    body: ['看着幼稚，其实很考验结构与运动学'],
    footnote: '同一个题目，独立跑了两遍',
    side: {
      rows: [
        ['模型', 'Gemini 3.8 Flash'],
        ['来源', 'Antigravity'],
        ['输出', '纯 SVG 单文件 · 可交互'],
      ],
    },
    agenda: {
      title: '本片看点',
      items: [
        '骨骼动力学：双腿 IK 反解算，不是循环贴图',
        '交互：按铃、逗鱼、变速、三套昼夜主题',
        '逐项核对：车轮、传动、腿部结构',
      ],
    },
  },

  // ===== 02 · version A (4.8 - 19.2) ====================================== //
  {
    id: 'a-full', kind: 'clip', a: 4.80, b: 7.10, shot: 'a-day', src: 0.40,
    view: 'aFull', cam: cam(1.00, 1.05),
    label: '02 · 版本一', meta: '3840×2160 · 60fps',
  },
  {
    id: 'a-bike', kind: 'clip', a: 7.10, b: 9.40, shot: 'a-day', src: 3.00,
    view: 'aBike', cam: cam(1.02, 1.16, -0.015, 0.02, 0.02, -0.01),
    label: '02 · 版本一', meta: '矢量骨骼动力学',
    notes: [{ at: 1.20, x: 0.4557, y: 0.6985, text: '轮速是踏频的 1.5 倍', dir: 'right' }],
  },
  {
    id: 'a-legs', kind: 'clip', a: 9.40, b: 11.70, shot: 'a-day', src: 8.25,
    view: 'aMid', cam: cam(1.04, 1.12, -0.05, 0.05),
    label: '02 · 版本一', meta: '腿部 · 踏板',
    notes: [{ at: 0.55, x: 0.4693, y: 0.7093, text: '脚掌始终踩在踏板上', dir: 'right' }],
  },
  {
    id: 'a-head', kind: 'clip', a: 11.70, b: 14.00, shot: 'a-day', src: 11.45,
    view: 'aHead', cam: cam(1.00, 1.10, -0.02, 0.02, 0.02, -0.02),
    label: '02 · 版本一', meta: '喉囊 / 眨眼 / 呆毛',
    notes: [{ at: 0.62, x: 0.4975, y: 0.2491, text: '鱼就从这儿蹦出来', dir: 'right' }],
  },
  {
    id: 'a-wide', kind: 'clip', a: 14.00, b: 16.60, shot: 'a-day', src: 5.60,
    view: 'aScene', cam: cam(1.12, 1.00),
    label: '02 · 版本一', meta: '视差背景无缝横移',
  },
  {
    id: 'a-sunset', kind: 'clip', a: 16.60, b: 19.20, shot: 'a-sunset', src: 0.55,
    view: 'aScene', cam: cam(1.00, 1.06),
    label: '02 · 版本一', meta: '主题 · 晚霞',
  },

  // ===== 03 · version B (19.2 - 36.0) ===================================== //
  {
    id: 'b-card', kind: 'clip', a: 19.20, b: 21.70, shot: 'b-day', src: 0.40,
    view: 'bCard', cam: cam(1.00, 1.05),
    label: '03 · 版本二', meta: '全新美术方向',
  },
  {
    id: 'b-app', kind: 'clip', a: 21.70, b: 24.40, shot: 'b-day', src: 3.20,
    view: 'bFull', cam: cam(1.00, 1.04),
    label: '03 · 版本二', meta: '可交互应用 · 底部控制台',
  },
  {
    id: 'b-immersive', kind: 'clip', a: 24.40, b: 27.00, shot: 'b-full', src: 0.30,
    view: 'bImmers', cam: cam(1.00, 1.08, 0, -0.02),
    label: '03 · 版本二', meta: '显示模式',
  },
  {
    id: 'b-sprint', kind: 'clip', a: 27.00, b: 29.70, shot: 'b-full', src: 3.10,
    view: 'bBike', cam: cam(1.06, 1.14, 0.03, -0.03),
    label: '03 · 版本二', meta: '速度档位',
  },
  {
    id: 'b-night', kind: 'clip', a: 29.70, b: 32.30, shot: 'b-night', src: 0.55,
    view: 'bImmers', cam: cam(1.00, 1.07),
    label: '03 · 版本二', meta: '主题 · 星夜',
  },
  {
    id: 'b-sunset', kind: 'clip', a: 32.30, b: 34.60, shot: 'b-sunset', src: 0.30,
    view: 'bImmers', cam: cam(1.00, 1.06),
    label: '03 · 版本二', meta: '主题 · 晚霞',
  },
  {
    id: 'b-out', kind: 'clip', a: 34.60, b: 36.00, shot: 'b-day', src: 6.40,
    view: 'bCard', cam: cam(1.06, 1.00),
    label: '03 · 版本二', meta: '三档速度 · 三套主题',
  },

  // ===== 04 · why it is hard (36.0 - 52.8) ================================ //
  {
    id: 'why', kind: 'statement', a: 36.00, b: 39.00, num: '04',
    label: '04 · 为什么难',
    eyebrow: '难点拆解',
    title: ['佩利骑自行车'],
    body: ['看着幼稚，考的全是硬功夫'],
    pull: '比例错一点、关节反一次，整只鸟就废了',
    side: {
      rows: [
        ['难点 01', '车轮与车架的比例'],
        ['难点 02', '双腿骨骼运动学'],
        ['难点 03', '细节各自独立驱动'],
      ],
    },
  },
  {
    id: 'compare', kind: 'split', a: 39.00, b: 43.20,
    left: { shot: 'a-day', src: 1.20, view: 'aSplit', label: '版本 A', sub: '海滨骑行者' },
    right: { shot: 'b-day', src: 8.20, view: 'bSplit', label: '版本 B', sub: '佩利漫游记' },
    cam: cam(1.00, 1.05), label: '04 · 对照',
  },
  {
    id: 'check-wheel', kind: 'clip', a: 43.20, b: 46.80, shot: 'a-day', src: 9.60,
    view: 'aWheel', cam: cam(1.02, 1.14, -0.03, 0.03),
    label: '04 · 逐项核对', meta: '车轮与传动',
    notes: [
      { at: 0.55, x: 0.3428, y: 0.7024, text: '车轮正圆，辐条等分', dir: 'left' },
      { at: 1.50, x: 0.4557, y: 0.6985, text: '牙盘与链条对齐', dir: 'right' },
    ],
  },
  {
    id: 'check-legs', kind: 'clip', a: 46.80, b: 50.40, shot: 'b-day', src: 8.60,
    view: 'bBike', cam: cam(1.04, 1.16, 0.02, -0.02),
    label: '04 · 逐项核对', meta: '腿部与踏板',
    notes: [
      { at: 0.55, x: 0.4806, y: 0.5471, text: '膝盖不反折', dir: 'right' },
      { at: 1.50, x: 0.4930, y: 0.6356, text: '脚掌贴合踏板', dir: 'left' },
    ],
  },
  {
    id: 'no-break', kind: 'statement', a: 50.40, b: 52.80, num: '04',
    label: '04 · 核对结果',
    eyebrow: '逐项核对',
    title: ['两版都没崩'],
    facts: [
      ['结构', '车轮正圆、辐条等分、车架比例成立'],
      ['运动', '双脚 IK 闭合，无穿模、无缺件'],
      ['细节', '眨眼、呼吸、围巾飘动各自独立驱动'],
    ],
    side: { stat: ['3/3', '检查项全部通过'] },
  },

  // ===== 05 · verdict (52.8 - 63.4) ====================================== //
  {
    id: 'old-question', kind: 'split', a: 52.80, b: 55.50,
    left: { shot: 'a-night', src: 0.60, view: 'aSplit', label: '版本 A', sub: '星夜' },
    right: { shot: 'b-night', src: 0.60, view: 'bSplit', label: '版本 B', sub: '星夜' },
    cam: cam(1.02, 1.06), label: '05 · 结论',
  },
  {
    id: 'unlike', kind: 'clip', a: 55.50, b: 58.40, shot: 'a-night', src: 2.60,
    view: 'aScene', cam: cam(1.03, 1.10),
    label: '05 · 结论', meta: '同一题面 · 两版',
  },
  {
    id: 'verdict', kind: 'verdict', a: 58.40, b: 61.00, num: '05', dark: true,
    label: '05 · 结论',
    eyebrow: '结论',
    kicker: '所以我的判断是',
    title: ['合理怀疑', '已是 Gemini 4.0 的水平'],
    titleSize: 88, railNarrow: true,
    body: ['标称的是 3.8 Flash 轻量档', '但这个完成度不像轻量档该有的样子'],
    pull: '题目没变难，是答卷变强了',
    side: {
      rows: [
        ['车轮', '正圆 · 辐条等分'],
        ['双腿', 'IK 闭合 · 无穿模'],
        ['主题', '昼 / 晚霞 / 星夜'],
        ['跑通', '一次成型 · 无报错'],
      ],
    },
  },
  {
    id: 'outro', kind: 'outro', a: 61.00, b: VIDEO_END,
    label: '06 · 完',
    eyebrow: '下一期',
    title: ['你觉得呢？'],
    body: ['这一版到底是不是 4.0'],
    pull: '想让我测哪个模型，评论区点名',
    handle: '@TimeCraker',
    side: { stat: ['+ 关注', '不错过下一期'] },
  },
];

// --------------------------------------------------------------------------- //
// subtitles (no narration — these carry the audio channel's meaning)
// --------------------------------------------------------------------------- //
const CUES = [
  { a: 0.55, b: 2.35, text: '一道 AI 圈的老题目' },
  { a: 2.45, b: 4.70, text: '画一只骑自行车的鹈鹕' },

  { a: 4.90, b: 7.00, text: '版本一：纯 SVG 矢量动画' },
  { a: 7.20, b: 9.30, text: '车轮在转，脚踏在蹬' },
  { a: 9.50, b: 11.60, text: '两条腿是 IK 反解算的' },
  { a: 11.80, b: 13.90, text: '点一下，从喉囊里吐条鱼' },
  { a: 14.10, b: 16.50, text: '眨眼、呼吸、围巾都在动' },
  { a: 16.70, b: 19.10, text: '一天三套天色，都是写好的' },

  { a: 19.30, b: 21.60, text: '同一道题，再让它答一次' },
  { a: 21.80, b: 24.30, text: '滑轮、按键、主题，全都能点' },
  { a: 24.50, b: 26.90, text: '一键切成沉浸全屏' },
  { a: 27.10, b: 29.60, text: '冲刺档：42 km/h' },
  { a: 29.80, b: 32.20, text: '车灯、星光、地面光晕全都在' },
  { a: 32.40, b: 34.50, text: '同一个场景，重打一遍光' },
  { a: 34.70, b: 36.00, text: '同一套骨骼动力学' },

  { a: 36.10, b: 38.90, text: '先说说这题到底难在哪' },
  { a: 39.10, b: 43.10, text: '同一个题面，两种解法' },
  { a: 43.30, b: 46.70, text: '放大看，每个细节都成立' },
  { a: 46.90, b: 50.30, text: '两条腿都闭合，没有穿模' },
  { a: 50.50, b: 52.70, text: '两版都经得起放大看' },

  { a: 52.90, b: 55.40, text: '老题目，难度没变' },
  { a: 55.60, b: 58.30, text: '但答卷的水平不太像 Flash 档' },
  { a: 58.50, b: 61.00, text: '这只是推断，不是定论' },
  { a: 61.10, b: 63.30, text: '下期继续测别的大模型' },
];