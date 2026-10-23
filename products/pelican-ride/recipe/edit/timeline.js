/**
 * The cut, as data. · v2 剪辑版（40s）
 *
 * 主语声明：这片子的主语是「Codex 里的 GPT-6.1 Sol 生成出来的这个东西」，
 * 不是评测这道题。口径：展示与供参考，不做「已是某某水平」的版本断言。
 *
 * v2（用户反馈：更短、精髓密度更高、美术排版升级）：
 * - 61s → 40s：砍掉慢速过渡（r4/r5/d3/i1），每拍都带一个硬事实；
 * - 字幕 16 条全部带具体信息（数字 / 文案 / 源码事实），拒绝氛围词；
 * - 图版加印刷件例：Fig. 编号、对版十字线、分区色键线（详见 director.js）。
 *
 * Every unit is one visual beat. a..b 是成片绝对时间。src 全部落在单块 chunk
 * 安全区内（validate-plan 会拦跨界读取）。
 */
const FPS = 60;
const VIDEO_END = 41.0; // 40.0s 音乐 + 1.0s 环出压在尾卡上

// --------------------------------------------------------------------------- //
// 取景窗（归一化 cx/cy/w/h）
// page-* 源 1920×1180 CSS（dsf2）；scene-* 源 2880×1560 CSS 图版模式（dsf2），
// 归一化 = svg_x/1200、svg_y/650。锚点来自 probe-anchors 实测（y 已按 1180 换算）。
// --------------------------------------------------------------------------- //
const VIEWS = {
  pFull:  { cx: 0.500, cy: 0.453, w: 1.000, h: 0.753 }, // 主带：标题顶到场景底
  pScene: { cx: 0.500, cy: 0.518, w: 0.640, h: 0.575 }, // 场景区（probe 实测）
  pCtl:   { cx: 0.795, cy: 0.836, w: 0.300, h: 0.300 }, // 滑杆簇特写
  pMid:   { cx: 0.500, cy: 0.563, w: 1.000, h: 0.753 }, // 场景+控制台中带（暂停状态机）
  nFull:  { cx: 0.500, cy: 0.500, w: 1.000, h: 1.000 }, // 390px 窄屏整页

  sWide:  { cx: 0.500, cy: 0.500, w: 1.000, h: 1.000 },
  sRide:  { cx: 0.467, cy: 0.515, w: 0.440, h: 0.700 }, // 鹈鹕 + 整车
  sLegs:  { cx: 0.460, cy: 0.569, w: 0.260, h: 0.230 }, // 双腿与踏板
  sDrive: { cx: 0.392, cy: 0.640, w: 0.280, h: 0.340 }, // 牙盘 + 链条 + 后轮
  sHead:  { cx: 0.517, cy: 0.308, w: 0.290, h: 0.320 }, // 眼睛 + 大喙 + 喉囊
};

// --------------------------------------------------------------------------- //
// camera: z = zoom, x/y = pan in fractions of the view size
// --------------------------------------------------------------------------- //
const cam = (z0, z1, x0 = 0, x1 = 0, y0 = 0, y1 = 0, ease = 'inOut') =>
  ({ z: [z0, z1], x: [x0, x1], y: [y0, y1], ease });

// --------------------------------------------------------------------------- //
// the units — 15 beats, section boundaries on the 96 BPM grid (bar = 2.5s)
// --------------------------------------------------------------------------- //
const UNITS = [
  // ===== 01 · 输入（0.0 - 5.0）========================================= //
  {
    id: 'prompt', kind: 'hook', a: 0.0, b: 5.0,
    label: '01 · 输入', chapter: 'SEC 01 / 05',
    kicker: 'CODEX 实测 · GPT-6.1 SOL',
    title: ['一句话，7 分 19 秒'],
    titleSize: 108,
    quote: '创建一个HTML，内容是SVG绘制一个鹈鹕骑自行车的2D动画',
    footnote: '提示词原文，未删改',
    stamp: '输入',
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
      crop: { x: 0.005, y: 0.085, w: 0.545, h: 0.60 },
      kb: { z: [1.0, 1.07], x: [0.0, 0.02], y: [0.0, -0.015] },
      label: 'Codex 生成实录 · 7 分 19 秒交付',
    },
  },

  // ===== 02 · 成品（5.0 - 12.5）======================================== //
  {
    id: 'r1', kind: 'clip', a: 5.00, b: 7.00, shot: 'page-main', src: 0.30,
    view: 'pFull', cam: cam(1.00, 1.04), reveal: 'wipe-l', fig: 'Fig. 01',
    label: '02 · 成品', chapter: 'SEC 02 / 05', meta: '整页 · 排版即产物',
  },
  {
    id: 'r2', kind: 'clip', a: 7.00, b: 9.50, shot: 'scene-main', src: 0.30,
    view: 'sWide', cam: cam(1.00, 1.05), reveal: 'iris', fig: 'Fig. 02',
    label: '02 · 成品', chapter: 'SEC 02 / 05', meta: '场景 · 全景',
  },
  {
    id: 'r3', kind: 'clip', a: 9.50, b: 12.50, shot: 'scene-main', src: 0.40,
    view: 'sRide', cam: cam(1.02, 1.10, 0.02, -0.02), fig: 'Fig. 03',
    label: '02 · 成品', chapter: 'SEC 02 / 05', meta: '中景 · 骑行',
    notes: [
      { at: 0.50, x: 0.450, y: 0.354, text: '锈红围巾，随风摆', dir: 'right' },
      { at: 1.60, x: 0.497, y: 0.455, text: '翅膀搭在车把上', dir: 'left' },
    ],
  },

  // ===== 03 · 细节（12.5 - 22.5）======================================= //
  {
    id: 'd1', kind: 'clip', a: 12.50, b: 15.00, shot: 'scene-main', src: 0.50,
    view: 'sLegs', cam: cam(1.00, 1.10), reveal: 'iris', fig: 'Fig. 04',
    label: '03 · 细节', chapter: 'SEC 03 / 05', meta: '反向动力学 · 双腿',
    notes: [
      { at: 0.40, x: 0.459, y: 0.626, text: '脚掌始终贴着踏板', dir: 'left' },
      { at: 1.30, x: 0.427, y: 0.497, text: '两条腿反相踩踏', dir: 'right' },
    ],
  },
  {
    id: 'd2', kind: 'clip', a: 15.00, b: 17.50, shot: 'scene-main', src: 6.30,
    view: 'sDrive', cam: cam(1.03, 1.12, 0.012, -0.012), fig: 'Fig. 05',
    label: '03 · 细节', chapter: 'SEC 03 / 05', meta: '传动 · 1:1.9',
    notes: [
      { at: 0.40, x: 0.459, y: 0.626, text: '传动比 1.9，写在代码里', dir: 'right' },
      { at: 1.30, x: 0.417, y: 0.662, text: '链条真咬着齿', dir: 'left' },
    ],
  },
  {
    id: 'd4', kind: 'clip', a: 17.50, b: 20.00, shot: 'scene-main', src: 12.40,
    view: 'sWide', cam: cam(1.00, 1.04, 0, 0, 0.01, -0.012), fig: 'Fig. 06',
    label: '03 · 细节', chapter: 'SEC 03 / 05', meta: '视差 · 五层',
    notes: [
      { at: 0.40, x: 0.208, y: 0.231, text: '云最慢，草最快', dir: 'right' },
      { at: 1.30, x: 0.333, y: 0.865, text: '中间还有海和沙丘', dir: 'left' },
    ],
  },
  {
    id: 'd5', kind: 'clip', a: 20.00, b: 22.50, shot: 'scene-05x', src: 0.20,
    view: 'sHead', cam: cam(1.02, 1.10), reveal: 'iris', fig: 'Fig. 07',
    label: '03 · 细节', chapter: 'SEC 03 / 05', meta: '鹈鹕 · 标志件',
    notes: [
      { at: 0.40, x: 0.633, y: 0.308, text: '大喙，还有喉囊', dir: 'left' },
      { at: 1.30, x: 0.501, y: 0.274, text: '眼睛有高光', dir: 'right' },
    ],
  },

  // ===== 04 · 交互（22.5 - 32.5）======================================= //
  {
    id: 's1', kind: 'clip', a: 22.50, b: 25.00, shot: 'page-2x', src: 5.40,
    view: 'pCtl', cam: cam(1.00, 1.05), reveal: 'wipe-r', fig: 'Fig. 08',
    label: '04 · 交互', chapter: 'SEC 04 / 05', meta: '控制台',
    notes: [
      { at: 0.40, x: 0.758, y: 0.836, text: '轻拖，即时生效', dir: 'left' },
      { at: 1.40, x: 0.812, y: 0.836, text: '数值跟着变', dir: 'right' },
    ],
  },
  {
    id: 's2', kind: 'clip', a: 25.00, b: 27.50, shot: 'page-pause', src: 0.60,
    view: 'pMid', cam: cam(1.00, 1.04), fig: 'Fig. 09',
    label: '04 · 交互', chapter: 'SEC 04 / 05', meta: '暂停 · 状态机',
    notes: [
      { at: 0.40, x: 0.320, y: 0.836, text: '空格暂停', dir: 'right' },
      { at: 1.30, x: 0.275, y: 0.266, text: '标签换成「歇一歇」', dir: 'right' },
    ],
  },
  {
    id: 's3', kind: 'split', a: 27.50, b: 30.00,
    left:  { shot: 'page-narrow', src: 1.00, view: 'nFull',  label: '手机', sub: '390PX 断点' },
    right: { shot: 'page-main',   src: 12.60, view: 'pScene', label: '桌面', sub: '1920PX' },
    cam: cam(1.00, 1.05), label: '04 · 双端', chapter: 'SEC 04 / 05',
  },
  {
    id: 'i4', kind: 'clip', a: 30.00, b: 32.50, shot: 'page-restart', src: 1.40,
    view: 'pScene', cam: cam(1.02, 1.08), fig: 'Fig. 10',
    label: '04 · 交互', chapter: 'SEC 04 / 05', meta: '重播 · 一键归位',
  },

  // ===== 05 · 清单与结论（32.5 - 41.0）================================= //
  {
    id: 'manifest', kind: 'statement', a: 32.50, b: 35.50,
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
    id: 'verdict', kind: 'verdict', a: 35.50, b: 38.00, dark: true,
    label: '05 · 结论', chapter: 'SEC 05 / 05',
    eyebrow: '结论',
    title: ['思考拉满的 GPT-6.1 Sol', '交出这样的完成度'],
    titleSize: 72, railNarrow: true,
    body: ['一次生成，直接能跑'],
    pull: '供大家参考', seal: true,
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
    id: 'outro', kind: 'outro', a: 38.00, b: VIDEO_END,
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
// 字幕（无配音，字幕扛信息）。v2：16 条全部带具体事实，拒绝氛围词。
// 时间、语速（7 字/秒）、与画面大字去重由 validate-plan 把关。
// --------------------------------------------------------------------------- //
const CUES = [
  { a: 0.50, b: 2.30, text: '就这一句话' },
  { a: 2.50, b: 4.80, text: '档位拉满，直接开跑' },

  { a: 5.20, b: 6.90, text: '标题排版也是它排的' },
  { a: 7.10, b: 9.30, text: '先看全景：海、路、草、云' },
  { a: 9.60, b: 12.30, text: '围巾是锈红色的，一直在飘' },

  { a: 12.70, b: 14.90, text: '腿是现算的，不是循环贴图' },
  { a: 15.20, b: 17.40, text: '牙盘一圈，车轮转 1.9 圈' },
  { a: 17.60, b: 19.40, text: '云、海、沙、路、草，五层' },
  { a: 20.10, b: 22.30, text: '大喙、喉囊、眼睛里的高光' },

  { a: 22.70, b: 24.90, text: '滑杆 0.5 到 2，随手拖' },
  { a: 25.20, b: 27.40, text: '空格一按，标签说歇一歇' },
  { a: 27.70, b: 29.90, text: '390px 的手机，也排好了' },
  { a: 30.20, b: 32.30, text: '重播，路面直接归位' },

  { a: 32.70, b: 35.30, text: '清单在这，逐项能对源码' },
  { a: 35.60, b: 37.80, text: '七分多钟，一次交付' },
  { a: 38.10, b: 40.60, text: '你的分数，评论区见' },
];
