# 2026-08-30 · deck-video v2 Stage Spec — 场景化重做：PPT 页图 → Remotion 原生动效场景

> 执行者：Zcode（GLM-5.3-Flash）。本 spec 自包含，无需会话上下文。
> 复核：Claude（§4）→ 用户终审看片。
> 动机：v1 成片（`output/video-motion/lekao-intro/deck.mp4`）用户判「太素太单薄」——PPT 整页位图+页间溶解，零元素动画、零视觉主体、无待机运动。v2 **架构反转**：画面主体从"PPT 页图"换成"Remotion 原生组件场景"，PPT 降级为内容来源。

## §0 规则与护栏

- 动效质量底线 = `docs/2026-08-30-motion-grammar.md`（先通读，V1-V4 / M1-M4 逐条对照）。
- **不动 v1 存量**：`DeckVideo.tsx`、`cover-index.ts`、Root.tsx 里已有 composition 一律不碰（v1 保留作对照）；v2 全部新增文件。
- **Remotion 确定性铁律**：渲染函数内禁 `Math.random()` / `Date.now()` / `new Date()`，伪随机一律索引式（如 `(i * 137) % 100`），否则帧不可复现。
- 多站纪律照旧：只 `git add` 本站新增文件，不 push；卡两轮停下报告。
- GBK 控制台 print 全英文；产物/报告路径见 §3。

## §1 环境事实（已核实）

| 项 | 事实 |
|---|---|
| 工程根 | `C:\Users\TimeCraker\Desktop\my_workspace\vibe-studio` |
| Remotion 工程 | `skills/video-motion/templates/remotion-app/`（remotion 4.0.518 已装，Chrome Headless 已配；v1 的 `deck-params.ts` / `deck-cues.ts` 生成机制、`build-deck-params.mjs`、`extract_pages.py` 全部保留复用） |
| 内容源（复用 v1） | `output/video-motion/lekao-intro/script.json`（27 段，ref=page N）；同目录 `deck.pptx`/`pages/` 只当文案参考，**v2 不再用页图当画面** |
| 配音 | `remotion-app/public/deck/audio/page-1..11.wav`（SAPI 测试音，v2 管线验证用；**终稿必须等用户剪映真人配音回填**，见 §3 Stage 4） |
| 素材（指挥官已备） | `output/video-motion/lekao-intro/assets/`：`feature-mistake.png` / `feature-summary.png` / `feature-feedback.png`（三大功能官方示意图）+ `value-time-comparison.png`（价值对比）+ `workflow-pipeline.png`（4 步流程）+ `lekao-mark.svg`（logo）+ `lekao-home.png` / `lekao-fullpage.png`（官网截图）。**接线时复制进 `remotion-app/public/lekao/`**（加 .gitignore 一行 `public/lekao/`） |
| 品牌色 | 钴蓝 `#3157F6`（lekao globals.css 提取）；**双族背景按场景选**：浅色杂志米白 `#F5F1E8`（叙事/内容页）/ 深色科技蓝 `#0a0e1a → #141a2e` 微渐变（数字/科技页），映射见 §2；强调色每屏 ≤2 处 |
| 画布 | 1920×1080@30，页时长机制复用 v1（= 页音频 + 0.4s 呼吸，`deck-params.ts` 重生成即得） |

## §2 scene-kit 组件契约（全部新增于 `src/scene-kit/`）

每个组件独立可 demo、props 契约固定；参数基准见 motion-grammar §三。

| 组件 | 职责 | 关键 props |
|---|---|---|
| `SceneBg.tsx` | **双族场景背景**（V1 规则）：`variant="light"` 米白杂志底（纯色干净+可选细网格线暗纹）或 `"dark"` 深蓝微渐变+轻暗角；按场景内容选，全片不共用一个底、无装饰粒子 | `variant: "light"\|"dark"` |
| `FloatWrap.tsx` | 待机漂浮包裹器：sin ±8px，period 3-5s，`phase` 错开 | `phase?` `amp?` |
| `TextReveal.tsx` | 逐字/逐行上浮入场（spring 0.4-0.6s），支持关键词高亮段 | `text` `mode: "char"\|"line"` `highlights?: {start,end,color}[]` |
| `StaggerList.tsx` | 子元素错峰滑入（间隔 80-120ms） | `gap?` `direction?` |
| `TypingTerminal.tsx` | macOS 风终端窗：逐行打字 + 光标闪烁 + 行高亮 | `lines: string[]` `cps?`（每秒字符数 18-25） |
| `ChatReplay.tsx` | 对话回放：气泡依次弹出 + "正在输入"指示 | `messages: {side:"ai"\|"user",text}[]` |
| `CountUp.tsx` | 数字滚动（0.8-1.2s ease-out），支持单位后缀 | `to: number` `durationInSec?` `suffix?` |
| `ChartGrow.tsx` | 柱状图错峰长高（100ms stagger），柱顶数值随长高同步 | `bars: {label,value,unit?}[]` |
| `DeviceFrame.tsx` | 浏览器/手机框装真实截图（img 静态图 + 框动效入场） | `src` `frame: "browser"\|"phone"` `title?` |
| `GlowPulse.tsx` | 强调脉冲光晕（呼吸 1.5-2s 周期） | `color?` `size?` |
| `SceneShell.tsx` | **杂志式**场景容器（V3 规则）：眉题小字（英文小标签）+ 章节号（01/02…+细分隔线）+ 大标题 TextReveal + **非对称双栏**主体插槽（左文 ~55% / 右主体 ~45%） | `chapter: string` `eyebrow: string` `title: string` `accent?: string` |

### 11 页 → 场景映射（DeckVideoV2；V2 规则——主体是内容的具象化，V1 规则——背景按内容选族）

| 页 | 背景族 | 场景组合（主体 = 内容具象化） |
|---|---|---|
| 1 开场 | dark | 黑场→GlowPulse 光晕绽放→logo 浮现(FloatWrap)→主标题逐行 TextReveal（"错题本，不再一道道粘贴"） |
| 2 痛点 | **light** | 杂志排版：左列眉题+大标题，右侧 TypingTerminal 逐行打出助教重复劳动清单（主体=痛点清单本身） |
| 3-5 三大功能 | **light** | 左列眉题+大标题+文案 TextReveal，右 45% DeviceFrame(browser) 装 feature-*.png 官方图 + GlowPulse 强调「免费/1币」标签——对标标杆片「左文右手机」版式；三页结构同、素材不同 |
| 6 价值 | dark | CountUp（30 人 × 3 题 = 90 道）+ ChartGrow（手抄 vs Lekao 分钟对比柱）——数字页用深底 |
| 7 流程 | **light** | 4 步 StaggerList 横排卡（01-04 编号+细线连接依次点亮） |
| 8 T-Coin | **light** | 签到 ChatReplay 对话回放（用户签到→+1 币→失败退回）+ 结论 GlowPulse |
| 9 隐私安心 | **light** | 三卡片 StaggerList 级联 + FloatWrap 待机 |
| 10 结尾 CTA | dark | logo FloatWrap + TextReveal 大字 + 免费开始按钮 GlowPulse |
| 11 片尾 | dark | logo + 域名 lekao.asterforge.top |

字幕仍挂 `deck-cues.ts`（复用 v1）；`DeckVideoV2.tsx` 每页一个 `<Sequence>`，页时长读 `deck-params.ts`。

## §3 任务分 Stage

- **Stage 0 基础层**：SceneBg（light/dark 双 variant 都要演示）/ FloatWrap / TextReveal / StaggerList / SceneShell + demo composition `kit-basics`（20s，各组件依次演示）。验收：渲染 exit 0 + 抽帧 ≥8 张含进场中间态。
- **Stage 1 叙事组件**：TypingTerminal / ChatReplay / CountUp / ChartGrow / DeviceFrame / GlowPulse + demo `kit-narrative`（30s）。同样抽帧验收。
- **Stage 2 全片接线**：素材复制进 `public/lekao/`（.gitignore 加行）→ 11 场景按 §2 映射组进 `DeckVideoV2.tsx` → Root.tsx 注册（只加一行）→ `npx remotion compositions` 帧数对账（= Σ 页时长×30）。
- **Stage 3 渲染+三级验收**：渲染到 `output/video-motion/lekao-intro/deck-v2.mp4`。L1：exit 0 + ffprobe 对账；L2：抽帧 ≥40 张——**每场景必须抽到元素半入场的中间帧**（证明动画存在，这是 v1→v2 的核心差异点）+ 字幕帧逐字核对 + 无黑帧；L3：报告 `output/deck-video-v2-acceptance.md`（含与 v1 同时间点画面对照表）。**停下等确认。**
- **Stage 4（用户确认后）**：封面 v2——新 composition `CoverV2`（SceneBg dark + DeviceFrame 装官网截图 + 大标题 TextReveal 冻结态 + GlowPulse），`npx remotion still` 出 `cover-v2.png`；配音终稿线：提示用户拿 `script.json` 去剪映配音，回填 `public/deck/audio/` 后重跑 build-deck-params + 渲染两步即换音。SKILL.md 补「场景化成片 v2」流程节（本 spec 为准）。

## §4 验收清单（Claude 复核用）

- [ ] v1 存量零改动（DeckVideo.tsx / cover-index.ts / Root.tsx 既有项 diff 为零）
- [ ] 确定性：grep 渲染路径无 `Math.random` / `Date.now`
- [ ] 每场景抽帧含进场中间态（动画真实存在的证据）
- [ ] motion-grammar 四视觉规则抽查：背景选族正确（light/dark 与 §2 映射一致）/ 主体是内容具象化 / 杂志式排版（眉题+大标题+细线）/ 强调色每屏 ≤2
- [ ] 字幕与 script.json 逐字一致；无付费/充值词（复用 v1 bannedWords 校验）
- [ ] 渲染 exit 0、ffprobe 时长 = compositions 帧数/30 对账
- [ ] 素材未入 git（public/lekao/ 已忽略）；分支内提交、零 push

## §5 参考

- 动效语法（质量底线）：`docs/2026-08-30-motion-grammar.md`
- v1 机制（复用不改）：`docs/2026-08-29-deck-video-stage-spec.md`
- Remotion API：`spring()` / `interpolate(..., {extrapolateRight:"clamp"})` / `<Sequence>` / `<Img>` / `<Audio>`
