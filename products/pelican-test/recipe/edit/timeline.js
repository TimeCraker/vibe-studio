/**
 * The cut, as data.
 *
 * 这条片子的主体是**展示平台生成的东西**，不是评测这道题：画面占比 ~78%，
 * 讲解型单元全部移除，4.0 的怀疑只在最后一段出现。
 *
 * Every unit is one visual beat. `a`..`b` are absolute times in the finished
 * video. Source clips are the 3840x2160 captures in frames/<shot>/; `src` is the
 * time to read from inside that clip. `view` is the window into the capture, in
 * normalised source coordinates, so the app's own UI chrome can be cropped out.
 *
 * `label` prints in the caption band's left slot, `meta` in its right slot —
 * both are presentational (which version, what is on screen), never analysis.
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
// the units — 20 beats, section boundaries on the music grid
// --------------------------------------------------------------------------- //
const UNITS = [
  // ===== 01 · 输入 (0.0 - 4.8) — 提示词卡 + 三张缩略图 =================== //
  {
    id: 'prompt', kind: 'hook', a: 0.0, b: 4.8,
    label: '01 · 输入',
    kicker: '输入',
    title: ['画一只骑自行车的鹈鹕'],
    titleSize: 96,
    body: ['纯 SVG，没有一张位图'],
    footnote: '同一个题目，独立跑了两遍',
    side: {
      rows: [
        ['平台', 'Antigravity'],
        ['模型', 'Gemini 3.8 Flash'],
        ['档位', 'Flash · 轻量档'],
        ['产物', '可交互网页 · 纯 SVG'],
      ],
    },
    thumbs: [
      { shot: 'a-day', src: 2.00, view: 'aScene', label: '第一版 · 白昼' },
      { shot: 'b-full', src: 1.60, view: 'bImmers', label: '第二版 · 晚霞' },
      { shot: 'b-night', src: 1.20, view: 'bImmers', label: '第二版 · 星夜' },
    ],
  },

  // ===== 02 · 第一版（4.8 - 19.2，纯展示）============================== //
  {
    id: 'a1', kind: 'clip', a: 4.80, b: 8.00, shot: 'a-day', src: 1.00,
    view: 'aFull', cam: cam(1.00, 1.05),
    label: '02 · 第一版', meta: '全屏场景 · 白昼',
  },
  {
    id: 'a2', kind: 'clip', a: 8.00, b: 11.20, shot: 'a-day', src: 2.60,
    view: 'aBike', cam: cam(1.02, 1.14, -0.015, 0.02, 0.02, -0.01),
    label: '02 · 第一版', meta: '中景 · 骑行',
  },
  {
    id: 'a3', kind: 'clip', a: 11.20, b: 14.20, shot: 'a-sunset', src: 0.60,
    view: 'aScene', cam: cam(1.00, 1.08),
    label: '02 · 第一版', meta: '主题 · 晚霞',
  },
  {
    id: 'a4', kind: 'clip', a: 14.20, b: 16.80, shot: 'a-night', src: 1.00,
    view: 'aScene', cam: cam(1.02, 1.10),
    label: '02 · 第一版', meta: '主题 · 星夜',
  },
  {
    id: 'a5', kind: 'clip', a: 16.80, b: 19.20, shot: 'a-day', src: 11.50,
    view: 'aHead', cam: cam(1.00, 1.10, -0.02, 0.02, 0.02, -0.02),
    label: '02 · 第一版', meta: '细节 · 喉囊',
    notes: [{ at: 0.55, x: 0.4975, y: 0.2491, text: '点它，鱼会跳出来', dir: 'right' }],
  },

  // ===== 03 · 第二版（19.2 - 36.0，6 × 2.8s）========================== //
  {
    id: 'b1', kind: 'clip', a: 19.20, b: 22.00, shot: 'b-day', src: 0.40,
    view: 'bFull', cam: cam(1.00, 1.05),
    label: '03 · 第二版', meta: '完整界面 · 可交互',
  },
  {
    id: 'b2', kind: 'clip', a: 22.00, b: 24.80, shot: 'b-day', src: 3.20,
    view: 'bCard', cam: cam(1.02, 1.10),
    label: '03 · 第二版', meta: '底部控制台',
  },
  {
    id: 'b3', kind: 'clip', a: 24.80, b: 27.60, shot: 'b-full', src: 0.70,
    view: 'bImmers', cam: cam(1.00, 1.10, 0, -0.02),
    label: '03 · 第二版', meta: '全屏模式',
  },
  {
    id: 'b4', kind: 'clip', a: 27.60, b: 30.40, shot: 'b-full', src: 3.60,
    view: 'bBike', cam: cam(1.06, 1.14, 0.03, -0.03),
    label: '03 · 第二版', meta: '速度档位',
  },
  {
    id: 'b5', kind: 'clip', a: 30.40, b: 33.20, shot: 'b-night', src: 0.50,
    view: 'bImmers', cam: cam(1.00, 1.07),
    label: '03 · 第二版', meta: '主题 · 星夜',
  },
  {
    id: 'b6', kind: 'clip', a: 33.20, b: 36.00, shot: 'b-sunset', src: 0.30,
    view: 'bImmers', cam: cam(1.00, 1.06),
    label: '03 · 第二版', meta: '主题 · 晚霞',
  },

  // ===== 04 · 生成清单与细节（36.0 - 52.8）============================ //
  {
    id: 'manifest', kind: 'statement', a: 36.00, b: 40.20,
    label: '04 · 生成清单',
    eyebrow: '这次生成',
    title: ['一次生成，出来了这些'],
    titleSize: 92,
    body: ['没有人补刀，直接可用'],
    factGlyph: 'num',
    facts: [
      ['场景', '海滨、棕榈、灯塔、渐变天色'],
      ['角色', '戴帽鹈鹕、围巾、车筐里的鱼'],
      ['动效', '骑行、视差、眨眼、呼吸、围巾'],
      ['交互', '按铃、逗鱼、变速滑杆、三套主题'],
    ],
    side: { stat: ['2', '两个版本，各生成一次'] },
  },
  {
    id: 'compare', kind: 'split', a: 40.20, b: 43.80,
    left: { shot: 'a-day', src: 1.20, view: 'aSplit', label: '版本一', sub: '海滨骑行' },
    right: { shot: 'b-day', src: 8.20, view: 'bSplit', label: '版本二', sub: '佩利漫游记' },
    cam: cam(1.00, 1.05), label: '04 · 对照',
  },
  {
    id: 'detail-a', kind: 'clip', a: 43.80, b: 48.30, shot: 'a-day', src: 9.40,
    view: 'aWheel', cam: cam(1.02, 1.14, -0.03, 0.03),
    label: '04 · 细节', meta: '第一版 · 车轮与传动',
    notes: [
      { at: 0.60, x: 0.3428, y: 0.7024, text: '辐条是等分的', dir: 'left' },
      { at: 1.60, x: 0.4557, y: 0.6985, text: '链条咬着牙盘', dir: 'right' },
    ],
  },
  {
    id: 'detail-b', kind: 'clip', a: 48.30, b: 52.80, shot: 'b-day', src: 8.60,
    view: 'bBike', cam: cam(1.04, 1.16, 0.02, -0.02),
    label: '04 · 细节', meta: '第二版 · 腿与踏板',
    notes: [
      { at: 0.60, x: 0.4806, y: 0.5471, text: '膝盖不反折', dir: 'right' },
      { at: 1.60, x: 0.4930, y: 0.6356, text: '脚掌贴着踏板', dir: 'left' },
    ],
  },

  // ===== 05 · 怀疑（52.8 - 63.4）======================================= //
  {
    id: 'night-pair', kind: 'split', a: 52.80, b: 55.80,
    left: { shot: 'a-night', src: 0.60, view: 'aSplit', label: '版本一', sub: '星夜' },
    right: { shot: 'b-night', src: 0.60, view: 'bSplit', label: '版本二', sub: '星夜' },
    cam: cam(1.02, 1.06), label: '05 · 结论',
  },
  {
    id: 'night-wide', kind: 'clip', a: 55.80, b: 58.80, shot: 'a-night', src: 2.60,
    view: 'aScene', cam: cam(1.03, 1.10),
    label: '05 · 结论', meta: '第一版 · 星夜',
  },
  {
    id: 'verdict', kind: 'verdict', a: 58.80, b: 61.20, dark: true,
    label: '05 · 结论',
    eyebrow: '我的怀疑',
    kicker: '但有一点对不上',
    title: ['标称 3.8 Flash', '水平更像 Gemini 4.0'],
    titleSize: 76, railNarrow: true,
    body: ['Flash 是轻量档，不是旗舰档'],
    pull: '没有别的解释，只能往版本上想',
    side: {
      rows: [
        ['场景', '全屏 · 三套天色'],
        ['动效', '骑行 · 视差 · 呼吸'],
        ['交互', '按铃 · 逗鱼 · 变速'],
        ['生成', '一次成型 · 无报错'],
      ],
    },
  },
  {
    id: 'outro', kind: 'outro', a: 61.20, b: VIDEO_END,
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
// subtitles (no narration — these carry the audio channel's meaning).
// Showcase voice: describe what is on screen, never why the task is hard.
// Every cue is checked against the on-screen text by tools/validate-plan.mjs.
// --------------------------------------------------------------------------- //
const CUES = [
  { a: 0.60, b: 2.40, text: '提示词就这一句' },
  { a: 2.60, b: 4.70, text: '两版，各生成一次' },

  { a: 4.90, b: 7.90, text: '版本一：一个全屏的 SVG 场景' },
  { a: 8.10, b: 11.10, text: '车轮、脚踏、围巾，全都在动' },
  { a: 11.30, b: 14.10, text: '点一下，天色就换了' },
  { a: 14.30, b: 16.70, text: '星夜：车灯、星光、地面光晕' },
  { a: 16.90, b: 19.10, text: '喉囊里还藏了一条鱼' },

  { a: 19.30, b: 21.90, text: '版本二：直接做成了网页应用' },
  { a: 22.10, b: 24.70, text: '底部一整排控件，全都能点' },
  { a: 24.90, b: 27.50, text: '一键切成沉浸全屏' },
  { a: 27.70, b: 30.30, text: '冲刺档拉到 42 km/h' },
  { a: 30.50, b: 33.10, text: '星夜：车灯、星光、光晕' },
  { a: 33.30, b: 35.90, text: '同一个场景，重新打一遍光' },

  { a: 36.10, b: 40.10, text: '这是它的原始输出' },
  { a: 40.30, b: 43.70, text: '同一个提示词，两次生成' },
  { a: 43.90, b: 48.20, text: '凑近看，传动是对得上的' },
  { a: 48.40, b: 52.70, text: '换个美术，动作一样成立' },

  { a: 52.90, b: 55.70, text: '两版都是一次跑通' },
  { a: 55.90, b: 58.70, text: '看着看着，就有点不对劲了' },
  { a: 58.90, b: 61.10, text: '完成度不太像轻量档' },
  { a: 61.30, b: 63.30, text: '评论区留下你的判断' },
];