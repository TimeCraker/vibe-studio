/**
 * The cut, as data.
 *
 * 主语声明：这片子的主语是「Codex 里的 GPT-6.1 Sol 生成出来的这个东西」，
 * 不是评测这道题。画面占比目标 >=75%，讲解只出现在输入卡与生成清单。
 * 口径：展示与供参考，不做「已是某某水平」的版本断言。
 *
 * 每个单元是一个视觉节拍。a..b 是成片绝对时间。源片段是 frames/<shot>/ 的
 * 4K/5.5K 逐帧采集，src 是从片段内哪里开始读。view 是源帧上的归一化取景窗。
 * 所有 src 都落在单块 chunk 安全区内（validate-plan 会拦跨界读取）。
 *
 * Reads edit/sections.json for the section grid, so picture and music cannot drift.
 */
const FPS = 60;
const VIDEO_END = 61.0; // 60.0s 音乐 + 1.0s 环出压在尾卡上

// --------------------------------------------------------------------------- //
// 取景窗（归一化 cx/cy/w/h）
//
// page-* 采集是 1920x1180 CSS（dsf2 = 3840x2360 实采），坐标来自
// probe-anchors 实测（探针 1080 高，y 已按 1080/1180 换算）。
// scene-* 采集是 2880x1560 CSS 图版模式（5760x3120 实采），SVG 铺满画面，
// 归一化坐标 = svg_x/1200、svg_y/650，直接由 viewBox 换算。
// --------------------------------------------------------------------------- //
const VIEWS = {
  // 整页镜头
  pFull:  { cx: 0.500, cy: 0.453, w: 1.000, h: 0.753 }, // 页面主带：标题顶到控制台底（2.162 图版刚好装下）
  pScene: { cx: 0.500, cy: 0.518, w: 0.640, h: 0.575 }, // 场景区（probe 实测）
  pCtl:   { cx: 0.795, cy: 0.836, w: 0.300, h: 0.300 }, // 滑杆簇特写（标签+轨道+数值；整行 1245px 装不进 2.162 图版）
  pMid:   { cx: 0.500, cy: 0.563, w: 1.000, h: 0.753 }, // 场景 + 控制台中带（暂停状态机：图注与按钮都要在）
  nFull:  { cx: 0.500, cy: 0.500, w: 1.000, h: 1.000 }, // 390px 窄屏整页

  // 场景镜头（SVG 1200x650 直接归一化）
  sWide:  { cx: 0.500, cy: 0.500, w: 1.000, h: 1.000 },
  sRide:  { cx: 0.467, cy: 0.515, w: 0.440, h: 0.700 }, // 鹈鹕 + 整车
  sLegs:  { cx: 0.460, cy: 0.569, w: 0.260, h: 0.230 }, // 双腿与踏板
  sDrive: { cx: 0.392, cy: 0.640, w: 0.280, h: 0.340 }, // 牙盘 + 链条 + 后轮
  sWheel: { cx: 0.583, cy: 0.660, w: 0.260, h: 0.360 }, // 前轮辐条
  sScarf: { cx: 0.452, cy: 0.360, w: 0.270, h: 0.300 }, // 围巾 + 翅膀
  sHead:  { cx: 0.517, cy: 0.308, w: 0.290, h: 0.320 }, // 眼睛 + 大喙 + 喉囊
};

// --------------------------------------------------------------------------- //
// camera: z = zoom, x/y = pan in fractions of the view size
// --------------------------------------------------------------------------- //
const cam = (z0, z1, x0 = 0, x1 = 0, y0 = 0, y1 = 0, ease = 'inOut') =>
  ({ z: [z0, z1], x: [x0, x1], y: [y0, y1], ease });

// --------------------------------------------------------------------------- //
// the units — 20 beats, section boundaries on the 96 BPM grid (bar = 2.5s)
// --------------------------------------------------------------------------- //
const UNITS = [
  // ===== 01 · 输入（0.0 - 5.0）— 提示词卡 + Codex 实录截图 ============== //
  {
    id: 'prompt', kind: 'hook', a: 0.0, b: 5.0,
    label: '01 · 输入', chapter: 'SEC 01 / 05',
    kicker: 'CODEX 实测 · GPT-6.1 SOL',
    title: ['一句话，7 分 19 秒'],
    titleSize: 108,
    quote: '创建一个HTML，内容是SVG绘制一个鹈鹕骑自行车的2D动画',
    footnote: '提示词原文，未删改',
    agenda: {
      title: '本片看点',
      items: ['整页排版，也是它排的', '细节：IK 腿 · 传动 · 视差', '交互：变速 · 暂停 · 重播', '清单与双端对照'],
    },
    side: {
      rows: [
        ['平台', 'Codex'],
        ['模型', 'GPT-6.1 Sol'],
        ['思考等级', '高'],
        ['产物', '单文件 HTML'],
        ['规模', '+214 行'],
      ],
    },
    snap: {
      img: 'capture/assets/codex-session.png',
      crop: { x: 0.005, y: 0.085, w: 0.545, h: 0.60 }, // 聚焦对话面板：提示词气泡 / 用时 / diff 卡
      kb: { z: [1.0, 1.07], x: [0.0, 0.02], y: [0.0, -0.015] }, // Ken Burns
      label: 'Codex 生成实录 · 7 分 19 秒交付',
    },
  },

  // ===== 02 · 成品（5.0 - 20.0）======================================== //
  {
    id: 'r1', kind: 'clip', a: 5.00, b: 8.20, shot: 'page-main', src: 0.30,
    view: 'pFull', cam: cam(1.00, 1.045), reveal: 'wipe-l',
    label: '02 · 成品', chapter: 'SEC 02 / 05', meta: '整页 · 排版即产物',
  },
  {
    id: 'r2', kind: 'clip', a: 8.20, b: 11.60, shot: 'scene-main', src: 0.30,
    view: 'sWide', cam: cam(1.00, 1.06), reveal: 'iris',
    label: '02 · 成品', chapter: 'SEC 02 / 05', meta: '场景 · 全景',
  },
  {
    id: 'r3', kind: 'clip', a: 11.60, b: 15.20, shot: 'scene-main', src: 6.40,
    view: 'sRide', cam: cam(1.02, 1.10, 0.02, -0.02),
    label: '02 · 成品', chapter: 'SEC 02 / 05', meta: '中景 · 骑行',
  },
  {
    id: 'r4', kind: 'clip', a: 15.20, b: 17.80, shot: 'scene-05x', src: 0.20,
    view: 'sScarf', cam: cam(1.00, 1.10, -0.015, 0.015), reveal: 'wipe-r',
    label: '02 · 成品', chapter: 'SEC 02 / 05', meta: '0.5× · 慢档',
    notes: [
      { at: 0.60, x: 0.450, y: 0.354, text: '围巾一直在飘', dir: 'right' },
      { at: 1.50, x: 0.497, y: 0.455, text: '翅膀还搭在车把上', dir: 'left' },
    ],
  },
  {
    id: 'r5', kind: 'clip', a: 17.80, b: 20.00, shot: 'page-05x', src: 0.80,
    view: 'pFull', cam: cam(1.04, 1.00),
    label: '02 · 成品', chapter: 'SEC 02 / 05', meta: '慢档 · 收速',
  },

  // ===== 03 · 细节（20.0 - 37.5）======================================= //
  {
    id: 'd1', kind: 'clip', a: 20.00, b: 24.20, shot: 'scene-main', src: 0.50,
    view: 'sLegs', cam: cam(1.00, 1.12), reveal: 'iris',
    label: '03 · 细节', chapter: 'SEC 03 / 05', meta: '反向动力学 · 双腿',
    notes: [
      { at: 0.60, x: 0.459, y: 0.626, text: '脚掌始终贴着踏板', dir: 'left' },
      { at: 1.80, x: 0.427, y: 0.497, text: '两条腿反相踩踏', dir: 'right' },
    ],
  },
  {
    id: 'd2', kind: 'clip', a: 24.20, b: 28.40, shot: 'scene-main', src: 6.30,
    view: 'sDrive', cam: cam(1.04, 1.14, 0.015, -0.015),
    label: '03 · 细节', chapter: 'SEC 03 / 05', meta: '传动 · 1:1.9',
    notes: [
      { at: 0.60, x: 0.459, y: 0.626, text: '传动比 1.9，写在代码里', dir: 'right' },
      { at: 1.90, x: 0.417, y: 0.662, text: '链条真咬着齿', dir: 'left' },
    ],
  },
  {
    id: 'd3', kind: 'clip', a: 28.40, b: 31.60, shot: 'scene-2x', src: 0.30,
    view: 'sWheel', cam: cam(1.00, 1.10), reveal: 'wipe-l',
    label: '03 · 细节', chapter: 'SEC 03 / 05', meta: '2× · 辐条',
  },
  {
    id: 'd4', kind: 'clip', a: 31.60, b: 34.60, shot: 'scene-main', src: 12.40,
    view: 'sWide', cam: cam(1.00, 1.03, 0, 0, 0.01, -0.015),
    label: '03 · 细节', chapter: 'SEC 03 / 05', meta: '视差 · 五层',
    notes: [
      { at: 0.70, x: 0.208, y: 0.231, text: '云最慢，草最快', dir: 'right' },
      { at: 1.90, x: 0.333, y: 0.865, text: '速度全是错落的', dir: 'left' },
    ],
  },
  {
    id: 'd5', kind: 'clip', a: 34.60, b: 37.50, shot: 'scene-05x', src: 3.00,
    view: 'sHead', cam: cam(1.02, 1.10), reveal: 'iris',
    label: '03 · 细节', chapter: 'SEC 03 / 05', meta: '鹈鹕 · 标志件',
    notes: [
      { at: 0.60, x: 0.633, y: 0.308, text: '大喙，还有喉囊', dir: 'left' },
      { at: 1.70, x: 0.501, y: 0.274, text: '眼睛有高光', dir: 'right' },
    ],
  },

  // ===== 04 · 交互（37.5 - 50.0）======================================= //
  {
    id: 'i1', kind: 'clip', a: 37.50, b: 40.80, shot: 'page-2x', src: 0.20,
    view: 'pFull', cam: cam(1.00, 1.05), reveal: 'wipe-r',
    label: '04 · 交互', chapter: 'SEC 04 / 05', meta: '速度 2×',
  },
  {
    id: 'i2', kind: 'clip', a: 40.80, b: 44.20, shot: 'page-2x', src: 5.40,
    view: 'pCtl', cam: cam(1.00, 1.06),
    label: '04 · 交互', chapter: 'SEC 04 / 05', meta: '控制台',
    notes: [
      { at: 0.60, x: 0.758, y: 0.836, text: '0.5 到 2，随手拖', dir: 'left' },
      { at: 1.80, x: 0.812, y: 0.836, text: '数值跟着变', dir: 'right' },
    ],
  },
  {
    id: 'i3', kind: 'clip', a: 44.20, b: 47.40, shot: 'page-pause', src: 0.60,
    view: 'pMid', cam: cam(1.00, 1.04),
    label: '04 · 交互', chapter: 'SEC 04 / 05', meta: '暂停 · 状态机',
    notes: [
      { at: 0.50, x: 0.320, y: 0.836, text: '空格暂停', dir: 'right' },
      { at: 1.60, x: 0.275, y: 0.266, text: '标签换成「歇一歇」', dir: 'right' },
    ],
  },
  {
    id: 'i4', kind: 'clip', a: 47.40, b: 50.00, shot: 'page-restart', src: 1.40,
    view: 'pScene', cam: cam(1.02, 1.08),
    label: '04 · 交互', chapter: 'SEC 04 / 05', meta: '重播 · 一键归位',
  },

  // ===== 05 · 清单与结论（50.0 - 61.0）================================= //
  {
    id: 'manifest', kind: 'statement', a: 50.00, b: 53.40,
    label: '05 · 清单', chapter: 'SEC 05 / 05',
    eyebrow: '这次生成',
    title: ['一次生成，出来了这些'],
    titleSize: 92,
    body: ['逐项对应源码，欢迎暂停核对'],
    factGlyph: 'num',
    facts: [
      ['单文件', 'HTML + 内联 SVG，共 214 行'],
      ['纯矢量', '零位图，放大边缘不糊'],
      ['动效', 'IK 踩踏 · 五层视差 · 围巾'],
      ['交互', '暂停 / 重播 / 0.5–2× 变速'],
      ['周到', '响应式 · reduced-motion 适配'],
    ],
    side: { stat: ['214', '行，一次交付'] },
  },
  {
    id: 'split', kind: 'split', a: 53.40, b: 56.60,
    left:  { shot: 'page-narrow', src: 1.00, view: 'nFull',  label: '手机', sub: '390PX 断点' },
    right: { shot: 'page-main',   src: 12.60, view: 'pScene', label: '桌面', sub: '1920PX' },
    cam: cam(1.00, 1.05), label: '05 · 双端', chapter: 'SEC 05 / 05',
  },
  {
    id: 'verdict', kind: 'verdict', a: 56.60, b: 59.00, dark: true,
    label: '05 · 结论', chapter: 'SEC 05 / 05',
    eyebrow: '结论',
    title: ['思考拉满的 GPT-6.1 Sol', '交出这样的完成度'],
    titleSize: 72, railNarrow: true,
    body: ['一次生成，直接能跑'],
    pull: '供大家参考',
    side: {
      rows: [
        ['用时', '7 分 19 秒'],
        ['产物', '单文件 HTML'],
        ['状态', '一次过'],
        ['判断', '留给你'],
      ],
    },
  },
  {
    id: 'outro', kind: 'outro', a: 59.00, b: VIDEO_END,
    label: '05 · 完', chapter: 'SEC 05 / 05',
    eyebrow: '鹈鹕测试',
    title: ['你打几分？'],
    body: ['下一条想看谁被测，评论区点名'],
    pull: '关注，不错过下一期',
    handle: '@TimeCraker',
    side: { stat: ['关注', 'PELICAN RIDE · 下期见'] },
  },
];

// --------------------------------------------------------------------------- //
// 字幕（无配音，字幕扛信息）。展示向口径：说画面上有什么，不说题难在哪。
// 每条 <=20 字；时间、语速（7 字/秒）、与画面大字去重由 validate-plan 把关。
// --------------------------------------------------------------------------- //
const CUES = [
  { a: 0.60, b: 2.50, text: '就这一句话' },
  { a: 2.70, b: 4.80, text: '档位拉满，它接了单' },

  { a: 5.20, b: 8.00, text: '排版也是它自己排的' },
  { a: 8.40, b: 11.40, text: '海、路、草，一层压一层' },
  { a: 11.80, b: 15.00, text: '它蹬得很认真' },
  { a: 15.40, b: 17.60, text: '围巾和风线都没停' },
  { a: 18.00, b: 19.80, text: '这里已经放到 0.5 倍' },

  { a: 20.40, b: 23.20, text: '腿是现算的，不是循环贴图' },
  { a: 24.60, b: 28.20, text: '脚蹬一圈，轮子转 1.9 圈' },
  { a: 28.60, b: 31.40, text: '二倍速下，辐条照样等分' },
  { a: 31.80, b: 34.40, text: '五层景深，各走各的速度' },
  { a: 34.80, b: 37.30, text: '大喙和喉囊，鹈鹕的标志' },

  { a: 37.70, b: 40.60, text: '拉到二倍速再看一遍' },
  { a: 41.00, b: 44.00, text: '滑杆是真的能拖的' },
  { a: 44.40, b: 47.20, text: '空格一按，整个状态都换' },
  { a: 47.60, b: 49.80, text: '重播，路面直接归位' },

  { a: 50.40, b: 53.20, text: '清单拉出来逐项看' },
  { a: 53.60, b: 56.40, text: '手机上也是排好的' },
  { a: 56.80, b: 58.80, text: '七分多钟，一次交付' },
  { a: 59.20, b: 60.80, text: '你的分数，评论区见' },
];
