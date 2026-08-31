# deck-video v3 质感攻坚 · 四级验收报告（L1/L2/L2.5/L3）

> 执行依据：`docs/2026-08-30-deck-video-v3-fidelity-spec.md` + 复核修订单（6 条，2026-08-30）。
> 产物：`output/video-motion/lekao-intro/deck-v3.mp4`（1920×1080@30，3302 帧 / 110.07s，crf16，28.1MB）。
> 设计表：`output/video-motion/lekao-intro/scene-design.md`（v3 八列版，修订单后修订，不再送审直接执行）。
> 提交链：70b0d24（Stage 0 光影地基）→ a2020aa（Stage 1 道具拟真）→ 768339c（Stage 2.2 接线）→ 05e54b4（验收修复轮）。
> 证据：`output/video-motion/lekao-intro/v3-kit/`（kit-v3a/b 零件 demo + frames-v3 71 张 + compare/ v2v3 对照 22 张）。

## 结论

**四级验收全绿，PPT 感一票否决解除（修复轮 2 轮后 4/4 抽查帧判「违和」）。** 等用户终审看片。

## L1 程序验收

| 项 | 结果 |
|---|---|
| 渲染退出码 | TRUE_EXIT=0（完整日志落盘 /c/pc/v3-deck-render*.log，未取管道尾） |
| 帧数对账 | Encoded 3302/3302；ffprobe nb_frames=3302、duration=110.067s；`remotion compositions` DeckVideoV2 = 3302 (110.07s) 三方一致 |
| v1/v2 存量 | DeckVideo.tsx / cover-index.ts / Root.tsx 对 HEAD diff 为零；deck.mp4（v1，14.6MB）、deck-v2.mp4（19.9MB）字节与 mtime 未变 |
| 确定性 | 渲染路径 grep `Math.random` / `Date.now` / `new Date` = CLEAN（噪点用固定 seed 的 feTurbulence data-URI） |
| 禁词 | DeckVideoV2 画面自拟文案 grep 付费/充值/价格/收费/免费/退款/成本/花钱/赋能/闭环/沉淀/矩阵/生态/一站式/端到端 = CLEAN（截图内「免费开始」按钮为素材原貌） |
| 依赖 | 零新 npm 依赖（全程系统字体 + SVG/shadow）；public/lekao/ 素材未入 git |

## L2 抽帧验收（71 张：每页 4 张 + 27 字幕帧）

- **场景帧 44/44 pass**（分三轮 judge；每页均抓到进场中间态 = 动画真实存在）。
- **字幕 27/27 逐字一致**（含标点），面板双色调正确（浅底白 85% / 深底黑 55%），LeKao/T-Coin/Word/Excel 关键词品牌色，底带 y≈940-1050 无道具侵入。
- **去重 6/6**：P1 两段、P10 两段、P11 两段字幕抑制生效（画面大字在场、无面板），其余 21 段正常显示。
- **道具 200% 放大帧**：浏览器标签条/锁形地址、手机侧键/贴顶灵动岛/玻璃高光、壳内聊头像尾巴、终端同底色等宽 $ 提示符、柱图基线网格/末柱高亮/T 币锚全部不穿帮。

### 修复轮记录（根因 → 修法 → 复验）

| 轮 | judge 发现 | 根因 | 修法 | 复验 |
|---|---|---|---|---|
| 1 | P5 插画卡盖住主标题（P4/P6 连带风险） | IllustCard/ScanCard 丢了 width 约束，DropCard 块级撑满容器 | 两卡显式 `style={{width}}` | P3-P8 21/21 pass |
| 2 | P8 手机屏无深色段、高亮圈错位（P3 连带） | **PhoneShell 从未把 width 落到机身**，直接用壳时撑满列宽（机身实测 700px，应 300） | PhoneShell 根部 `style={{width}}`；标注圈比例余量调整；P7 放大框右移 | 21/21 pass，P8 九宫格无全空格（按钮下空区 ~90px < 屏高 20%） |
| 3 | **PPT 感一票否决 3/3 打回**：完成态帧无进行时痕迹，"就是静态幻灯片" | 稳定帧缺"活着"的视觉证据 | P3 聊天壳加输入条+530ms 闪烁块光标；P7 柱图末点加呼吸扩散光环；P9 箭头改流动虚线 SVG + 首卡品牌衬光 | P3/P7/P9 复验全部判「违和」（pass） |
| 3b | P10 金句「小时」拆跨行、「时」孤行 | 150px 行宽实测超容器 1560，自动换行抢在手动 \n 前 | 容器放宽 1700 + 显式两行断行 | p10 判「违和」（pass） |

## L2.5 静音测试（不看声音只看画面）

**11/11 pass**——judge 逐页复述主旨全部正确，叙事线完整：品牌开场 → 痛点（1-2 小时） → 三件事接走 → 课堂小结 → 作业反馈 → 错题集 → T-Coin 规则 → 手机体验 → 三步上手 → 价值金句 → CTA。

## PPT 感一票否决（§4 抽查）

抽 p03/p07/p09（+修复中带验 p10）四帧终判全部「违和」= pass。未抽查页携带同源进行时证据：P2 终端光标、P4 扫描线、P5 角标+chips、P6 CountUp+角标、P8 高亮圈+屏内分区、P11 高亮圈+rim light、P1 光晕+chips。

## 八问口诀逐页自评（V1-V4 / M3 / F1-F3 / F5）

| 页 | V1 背景族 | V2 主体=内容 | V3 杂志排版 | V4 层次 | M3 待机运动 | F1 光影 | F2 经得起放大 | F3 无死区 | F5 静音自足 | 判 |
|---|---|---|---|---|---|---|---|---|---|---|
| P1 | 深✓ | logo+大字✓ | 130px✓ | ✓ | 光晕呼吸+logo 漂浮 | ✓ | ✓ | ✓ | ✓ | 过 |
| P2 | 浅✓ | 待办终端✓ | 120px✓ | ✓ | 打字+光标闪烁 | ✓ | ✓ | ✓ | ✓ | 过 |
| P3 | 浅✓ | 壳内对话✓ | 120px✓ | ✓ | 气泡弹出+光标 | ✓ | ✓ | ✓ | ✓ | 过 |
| P4 | 浅✓ | 插画+扫描线✓ | 120px✓ | ✓ | 扫描线+漂浮 | ✓ | ✓ | ✓ | ✓ | 过 |
| P5 | 浅✓ | 大插画+chips✓ | 120px✓ | ✓ | 漂浮+chips 错峰 | ✓ | ✓ | ✓ | ✓ | 过 |
| P6 | 浅✓ | 插画+步骤✓ | 120px✓ | ✓ | 漂浮+CountUp | ✓ | ✓ | ✓ | ✓ | 过 |
| P7 | 深✓ | 递增柱图✓ | 120px✓ | ✓ | 末点光环呼吸 | ✓ | ✓ | ✓ | ✓ | 过 |
| P8 | 浅✓ | 手机屏分区✓ | 120px✓ | ✓ | 漂浮+圈注 | ✓ | ✓ | ✓（<20%） | ✓ | 过 |
| P9 | 浅✓ | 编号卡+流向✓ | 120px✓ | ✓ | 流动箭头+漂浮 | ✓ | ✓ | ✓ | ✓ | 过 |
| P10 | 深✓ | 150px 金句✓ | 150px✓ | ✓ | 光晕+漂浮 | ✓ | ✓ | ✓ | ✓ | 过 |
| P11 | 深✓ | 浏览器特写✓ | 150px✓ | ✓ | 漂浮+rim | ✓ | ✓ | ✓ | ✓ | 过 |

## v2 → v3 同时间点对照（各自 0.58×页秒处稳定帧，对照图见 v3-kit/compare/）

| 时间点 | v2（会动的 PPT） | v3（动效作品） |
|---|---|---|
| 4.47s P1 | 92px 标题+裸深底 | 130px 大字+光晕呼吸+三功能 chips+域名 mono+进度条 |
| 13.14s P2 | 58px 标题+普通终端 | 120px 标题+三步拆项清单+DropCard 终端（$ 品牌色/块光标） |
| 22.38s P3 | 裸气泡漂在页面上 | 320px 手机壳内真实聊天（聊天头/双侧头像/尾巴/时间戳/输入条+闪烁光标） |
| 33.79s P4 | 插画裸卡 | DropCard+「AI 识别中」扫描线+成品清单卡（10 条反馈+1 段小结） |
| 46.12s P5 | 插画裸白卡 | 640px DropCard+「逐题 · 四挡字数」角标+四挡 chips 双层阴影 |
| 57.47s P6 | 镜像裸卡 | DropCard+「Word 成品」角标+「5 分钟」CountUp |
| 69.77s P7 | 平面柱状图 | 基线网格+柱身渐变+末柱高亮+呼吸光环+T 币锚+连线+「注册送 5 币 · 够生成 5 次」规则行 |
| 81.98s P8 | 手机屏 60% 死灰长图 | 截图段（官网首屏到按钮）+深色三功能行分区+高亮圈+「官网首屏」角标 |
| 91.53s P9 | 三白卡+文字箭头 | DropCard+「成品」角标+流动虚线箭头+首卡衬光 |
| 99.12s P10 | 72px 金句+裸插画 | 150px 两行金句（高亮不断行）+DropCard 对比插画 |
| 106.45s P11 | 无标签浏览器+56px CTA | 真标签栏+锁形地址栏+高亮圈「官方域名」+150px CTA+rim light |

## 复核修订单 6 条逐条落实

1. **P7① 出处**：改标 CHANGELOG（注册即送 5 枚，够生成 5 次，扣费优先 gift_coin → t_coin）；画面规则行「注册即送 · 够生成 5 次」。✅
2. **P9③ 口径**：「三样成品直接用」（稿6），去掉 Word 窄化。✅
3. **P4⑤**：逐字「讲义拍照上传」（稿7），"截图"演绎已除。✅
4. **P8 屏内方案**：浅色截图段（眉题→按钮）+ 深色自绘三功能行，干净水平分界；灵动岛压浅色段；死标准验证 = 屏内空白 ~90px < 20%，信息包特写帧九宫格无全空格。✅
5. **顺手项**：深底字幕面板加同源 SHADOW.float；DropCard 卡面 3-5% 顶部内高光（透底设备框不施加）。✅ 已入 768339c/05e54b4。
6. **deck-v2.mp4 说明**：v3 Stage 0/1/2/3 全部渲染目标只有 `v3-kit/kit-v3a|v3b.mp4` 与 `deck-v3.mp4`，deck-v2.mp4 **未被触碰**（19,864,934 字节，mtime 2026-08-30 15:41:17，与 v2 报告一致）。其 mtime 早于 v2 验收报告落盘时间（15:45:32）——即 v2 会话内「P5 修复后重渲 → 报告收尾」的正常顺序，不存在 v3 期间重渲。参数与 v2 报告一致（crf16、3302 帧）。✅

## 遗留与建议（不阻塞验收）

1. **素材缺陷（建议重截）**：`lekao-fullpage.png` 行 1070-4815 约 70% 纯空白（站点懒加载未渲染进截图）。P8 已按拍板修走「截图段+深色自绘段」；若重截完整长图，可回切 DeviceFrame 滚动方案（scrollDistance 能力已保留），届时仅需改 P8 一页。
2. P9 卡 01 衬光在个别采样相位不可辨（judge 记 Unverified 不阻塞；流动箭头已独立构成进行时证据）。
3. P4 屏内 meta「自动认。」短句带句号与相邻文风一致，非截断（judge 备查项）。
4. 配音终稿线不变：剪映真人配音回填 `public/deck/audio/page-*.wav` 后重跑 `node scripts/build-deck-params.mjs` + `npx remotion render remotion/index.ts DeckVideoV2 <out> --crf 16` 两步即换音（P8 滚动时长如启用需同步 scrollDurationSec）。

## 下一步（等用户确认）

~~Stage 4：CoverV3 封面 + SKILL.md 补节~~

## Stage 4 收尾记录（2026-08-30，终审「勉强及格，先收尾」后执行）

1. **CoverV3 封面** → `output/video-motion/lekao-intro/cover-v3.png`（1920×1080，`npx remotion still src/cover3-index.ts CoverV3 --frame=60`，frame 60 = 入场 spring 走完 + 光晕可见相位）。成片同源语言全部在位：SceneBg v3 深族（径向渐变+暗角+网格+噪点）、DeviceFrame browser v2 装 lekao-home hero 特写 zoom 1.5（DropCard + SHADOW.float + RIM.dark + GlowPulse 后衬）、150px 金句「把每次课的 1 到 2 小时 / 还给教学」（稿25，高亮断行防拆字）、三功能 chips（README）、域名 mono、顶部 2px 进度条（装饰 55%）。judge 八问逐项 pass + PPT 感一票否决判「违和」（超出 PPT 平铺能力），一次过。代码提交 48941b3（cover3-index 独立入口，v1 cover-index / Root.tsx 零改动）。
2. **SKILL.md 补「场景化成片 v2→v3 质感工艺」节**（commit 3f8874e）：八问口诀 + F1-F5 逐条硬关 + 静音测试/PPT 否决双门禁 + 工艺清单（tokens 单源/DropCard/道具拟真 200% 检查单/字幕面板三规则/信息包方法）+ 三条硬教训（完成态帧必须有进行时证据；包装组件显式透传 width；长截图先验空白率再定滚动/裁切）+ 四级验收流程；frontmatter 触发词同步。README.md video-motion 行同步为「四种产物」并补 v2/v3 spec 链接。
3. 配音回填线归用户：剪映逐页配音导出同名 `page-N.wav` 放回 `public/deck/audio/`，重跑 `node scripts/build-deck-params.mjs` + `npx remotion render remotion/index.ts DeckVideoV2 <out> --crf 16` 两步换音。
