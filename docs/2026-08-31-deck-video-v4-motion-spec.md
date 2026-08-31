# deck-video v4 转场与进场动效 Stage Spec — 硬切转场 + 旁白同步编排

> 目标：解掉「动画元素的引入不够好」——v3 修的是静帧质感（F1-F5 全绿），但页间交叉溶解 + 页首 1 秒内全落位的进场方式没动，观感仍是「会动的 PPT」。本站在不动素材、不动文案、不动音频的前提下，重造**转场**与**进场动效**两层。
> 依据：2026-08-31 对标杆片 BV1fShG6LETU 的重测量（证据在 §2，方法可复现）。
> 产物：`products/lekao-intro/deck-v4.mp4`（DeckVideoV2 渲染，composition 名不变）。

## §0 规则与护栏

1. **v3 已封箱**（HEAD 应见 3f8874e）。本站改动仅限：`src/DeckVideoV2.tsx`、`src/scene-kit/`（新增 entrance-kit 组件）、`scripts/build-deck-params.mjs` 一处常量、Stage 4 时的 `SKILL.md` / `docs/2026-08-30-motion-grammar.md`。**deck.mp4 / deck-v2.mp4 / deck-v3.mp4 / cover-v3.png 及 v1 全部存量文件零触碰**（字节与 mtime 不变，是对照基准）。
2. **v3 的资产全保留**：scene-kit 18 组件、tokens、M2 微事件（打字/CountUp/柱生长/流动虚线）、M3 待机动画、F1-F5 质感——本站是「重排时刻 + 加转场动词」，**不是重写页面**。发现要推翻 v3 画面设计时停下报告，不许自行改。
3. 只 `git add` 本站文件，不 push。同一问题连续 2 轮修复仍有红项 → 停下报告。
4. 确定性铁律：渲染函数内禁 `Math.random()` / `Date.now()` / `new Date()`；伪随机用索引式（`(i * 137) % 100`）。
5. 画面自拟文案照查禁词表：付费/充值/价格/收费/免费/退款/成本/花钱/赋能/闭环/沉淀/矩阵/生态/一站式/端到端。

## §1 环境与现状（先核实再动手）

工程：`projects/lekao-intro/remotion-app/`（依赖已装，直接可用）。渲染：

```bash
npx remotion render remotion/index.ts DeckVideoV2 <仓库>/products/lekao-intro/deck-v4.mp4 --crf=16
```

**当前转场机制（要改掉的东西，动手前先读一遍源码核实）**：

- `scripts/build-deck-params.mjs:9`：`const OVERLAP_SECONDS = 0.5`——每页 Sequence 窗 = `pageSeconds + 0.5`，相邻页交叠 0.5s，总时长 = 末页 end + 0.5。
- `src/DeckVideoV2.tsx` 的 `V2Page`：`opacity: fadeIn * (1 - fadeOut)`（两个 spring）→ 交叠期双方半透明 = **交叉溶解**。这就是要消灭的动词。
- 音频无交叠（页 wav 长度 = `audioSeconds ≈ pageSeconds - 0.4`，先于切点结束），overlap→0 后音频接线零变化。
- 页时长表（进场时刻表的换算基准，页内秒 = 全局秒 − start）：

| 页 | start(s) | pageSeconds | 末秒 |
|---|---|---|---|
| 1 | 0 | 7.71 | 7.71 |
| 2 | 7.71 | 9.37 | 17.08 |
| 3 | 17.08 | 9.14 | 26.22 |
| 4 | 26.22 | 13.06 | 39.28 |
| 5 | 39.28 | 11.79 | 51.07 |
| 6 | 51.07 | 11.04 | 62.11 |
| 7 | 62.11 | 13.22 | 75.33 |
| 8 | 75.33 | 11.48 | 86.81 |
| 9 | 86.81 | 8.15 | 94.95 |
| 10 | 94.95 | 7.18 | 102.14 |
| 11 | 102.14 | 7.43 | 109.57 |

- 字幕段时刻（同步锚点）在 `src/deck-cues.ts`（派生物，**禁手改**）；换音频重跑 `node scripts/build-deck-params.mjs` 后它自动重算。
- v3 现状进场：各 scene 内元素 spring 0.4-0.6s、错峰 80-120ms，~1s 内全落位——**本站替换对象**。

## §2 标杆片证据（2026-08-31 重测，硬规则的全部依据）

测量方法（可复现）：yt-dlp 拉 720p → ffmpeg `select='gt(scene,0.30)'` 切出 14 个 cut → cv2 对每场景首尾稳态帧做全局 scale 粗搜（0.96-1.04 步长 0.002）+ phase correlate 测 pan → 转场/进场各取 9 帧时间序列条带（0.133s / 0.3s 间隔）视觉判读。

### A. 全局运镜：不是主角

15 个场景里 11 个全局缩放静止（±0.036%/s 为检测地板），3 个有 0.3-0.7%/s 慢推慢拉，2 个有 ~10px/s（480 宽基准）横向漂移。**标杆片的「镜头感」大头不来自全局运镜**——来自转场动词和元素级编排。

### B. 转场动词（14 处抽 5）：全部硬切，零交叉溶解

| 抽样 | 动词 | 实测 |
|---|---|---|
| cut01 | 硬切 + **整组方向性滑入** | 新场景主体群（含字幕）从左滑入，0.27-0.4s 走约 1/3 画宽，强 ease-out；旧场景冻结退场，零退场动画 |
| cut05 | 硬切 + **曝光渐起+慢推** | 切到近黑帧，0.4-0.5s 亮度爬升到全曝光，同时数个百分点慢推——新页「还在落位」的感觉 |
| cut08 | **静止硬切** | 新页第一帧即完整到位、0 运动；能量由页内元素事件（badge 后续 pop）接手 |
| cut11 | 静止硬切 | 同上，屏内 UI 打字/更新立即开始承担动态 |
| 旁白 | J-cut | 叙事音频先于切点——我们页音频天然连续，等效自带 |

旧场景一律**冻结退场**：保持静止到最后一帧，被硬切掉，无滑出无淡出。

### C. 进场编排（2 段深剖）：分批进场，不是一次落位

两段进场剖析同构，规律：

- **顺序**：背景即显 → 主体（slide ~1.5s 减速 / 集合主体逐个级联 ~0.3s/个）→ 标注（下划线 draw-in / 高亮块 mask-wipe 左→右）→ **大字 scale-grow 晚至 ~2.1s** → 注解卡 fade。
- **分批进场**：每批落位后**停 0.3-1.2s** 再来下一批；进场总跨度 2.5-3s——切点后前 3 秒画面一直在「长」。
- **动词按元素类型分配**（不是全家用同一个 spring）：主体 slide/级联、大字 scale-grow、下划线 draw、高亮 wipe、角标 rotate、注解 fade。
- **settle 之后**：大字持续 scale 呼吸、角标持续 ±3° wobble、堆叠主体继续微沉降——永远有东西在动。

### D. 推论 → 本站硬规则

1. **转场律**：禁交叉溶解。硬切为底，每页从三动词择一承担入场：整组方向性滑入 / 曝光渐起+慢推 / 静止硬切（页内事件接手）。旧页冻结退场。**唯一例外：末页保留 0.5s 淡出收尾**（成片收黑，标准做法）。
2. **旁白同步律**：元素到场时刻对齐字幕段 start——旁白说到什么，什么元素此刻到场或起变化（±0.3s）。把动画铺到整页的字幕时刻轴上，**不是页首一次性放完**。这条统一了 v3 的 M1 与 M2：微事件（打字/柱生长/CountUp）的开始时刻也重排到对应字幕锚点。
3. **进场节奏律**：页首 2.5-3s 内安排 3-5 批（页长 <8s 的页按页长 1/3 封顶），批间停顿 0.3-0.8s，批与批动词不同型。
4. **待机律**：v3 的漂浮/呼吸全保留；新增大字 scale 呼吸（±1.5%，period 3s）与角标 wobble（±3°，period 2.4s）。
5. **慢推律**：页长 >10s 的页，页面根加 CameraPush 0.3-0.5%/s（整页 3-5% 缓慢放大）。
6. **收尾律**：新事件起势时刻 ≤ 该页末字幕段 start + 1s——页尾不再开多段新事件，否则硬切会把它「掐断在半路」。

## §3 动词库（scene-kit/entrance-kit，Stage 0 交付）

全部 props 显式、默认值 = §2 实测基准；组件内禁止读取外部状态，只吃 props + useCurrentFrame：

| 组件 | 作用 | 默认参数 |
|---|---|---|
| `SlideGroup` | 页级/组级方向性滑入 | distance = 0.33×画宽，dur 0.35s，ease-out cubic |
| `ExposureIn` | 曝光渐起（深族页入场） | brightness 0.25→1 + opacity 0→1，dur 0.45s |
| `DrawIn` | 下划线/连线 draw | scaleX 0→1，transformOrigin left，dur 0.4s |
| `WipeIn` | 高亮块/色块揭示 | clip-path `inset(0 100% 0 0)` → `inset(0)`，dur 0.45s |
| `GrowIn` | 大字 scale-grow | scale 0.6→1 + opacity，spring（damping 200 / stiffness 120） |
| `PopRotate` | 角标落位 + 持续 wobble | 落位 0.3s，随后 rotate ±3° sin，period 2.4s |
| `CascadeList` | 兄弟姐妹级联 | 步长 280ms/个（不是 v3 的 80-120ms——级联要「数得出来」） |
| `CameraPush` | 页根慢推 | scale 1 → 1 + 0.004×页长秒，线性 |
| `TextBreath` | 大字待机呼吸 | scale ±1.5%，period 3s |

已有微事件动词（typing / countUp / barGrow / flowDash）保留，只重排开始时刻。

### 进场时刻表契约（Stage 1 产物，每页一节）

```markdown
## P<n> 转场动词：<SlideGroup 方向→ / ExposureIn / 静止硬切>（选择理由一句）
| 波 | 元素 | 动词 | start（页内秒） | 同步锚（字幕段文字→全局秒） |
|---|---|---|---|---|
| 0 | 背景 | 即显 | 0 | — |
| 1 | 主体×× | SlideGroup | 0.0 | 段1「……」@全局×.×s |
| 2 | 下划线 | DrawIn | 1.1 | 段2「……」@… |
```

转场动词分配规则（择动词时对照，不预设具体答案）：深族页优先 ExposureIn；内容有流向（流程/递进）的页选与流向同向的 SlideGroup；屏内事件密集的页选静止硬切；**相邻页不用同一动词，同动词不相邻两次同方向**。

## §4 Stage 划分

### Stage 0 机制改造 + 动词库（一次提交）

1. `build-deck-params.mjs` 的 `OVERLAP_SECONDS = 0.5` → `0`，重跑生成 deck-params.ts。预期总时长 110.07s → **109.57s**（3287 帧 ±1）。
2. `V2Page` 改造：删 fadeIn/fadeOut 交叉溶解；改为每页接收进场时刻表指定的入场动词包装（SlideGroup / ExposureIn / 无包装）；**末页（P11）保留 0.5s fadeOut 收尾**。
3. `scene-kit/entrance-kit.tsx` 实现 §3 组件表 + 一个 kit demo composition（每动词一格演示），渲染验证组件可用。
4. 自检：`npx remotion compositions` 总帧数对账；渲染 kit demo mp4 逐格读图。

### Stage 1 进场时刻表设计（产出后停下送审——设计门禁）

逐页产出进场时刻表（§3 契约），写 `projects/lekao-intro/entrance-schedule.md`：

- 每页先列该页全部字幕段（从 deck-cues.ts 读全局秒，换算页内秒），再把该页现有元素（v3 场景里的主体/标注/大字/微事件）逐个挂到波上；
- 旁白同步律逐行核：元素到场/事件 start 与锚点差 ≤0.3s；
- 转场动词分配 + 理由；CameraPush 判定（页长 >10s：P4/P5/P6/P7/P8）。
- **停下，报告等复核**（同 v3 scene-design 先例：设计表过了才写代码）。

### Stage 2 逐页实现（按页分批提交）

按已审进场时刻表改 11 个 Scene 组件 + V2Page 动词接线；v3 元素一个不删，只改时刻与进场动词。每改 3-4 页渲一次中间产物抽帧自检（时间序列条带法：进场窗 2.5s 内 6 帧 tile，判分批进场真实存在、批间有停顿）。

### Stage 3 全片渲染 + 四级验收

- **L1 程序**：完整日志取退出码（禁管道尾）；`remotion compositions` = ffprobe nb_frames = 3287±1；确定性 grep（random/Date）；禁词 grep；v1-v3 存量 diff 为零。
- **L2 抽帧**：
  - 每页进场时间序列条带（6 帧）判：分批进场存在、批间停顿、动词分型、大字晚落；
  - 11 个转场点各取切点前后 4 帧：判**硬切**（无混合帧）+ 入场动词正确 + 旧页冻结；
  - 字幕同步对照：每页抽 1 段字幕，对应画面事件 start − 字幕 start ∈ [−0.3, +0.3]s；
  - 回归项：200% 道具放大帧抽 3 页（F2 不回退）、字幕面板双色调/去重、底带无侵入。
- **L2.5 静音测试**：11/11 逐页盲答主旨（继承 v3 法）。
- **L3 报告**：`products/lekao-intro/deck-video-v4-acceptance.md`，含 v3/v4 同时间点对照表（每页 0.3×页秒处稳定帧）+ 进场时刻落实表（设计 vs 实测时刻）+ 转场动词核对表（11/11）。

### Stage 4 沉淀（用户终审确认后）

- `SKILL.md`「场景化成片」节增「进场动效层」小节：硬切三动词 + 旁白同步律 + 进场时刻表方法（通用化表述）。
- `docs/2026-08-30-motion-grammar.md` 增补：M5 转场律（硬切为底/禁交叉溶解/旧页冻结）、M6 旁白同步律（元素到场对齐字幕段）；参数基准表补 CascadeList 280ms / 呼吸 ±1.5% / wobble ±3° / CameraPush 0.4%/s。
- README video-motion 行不动（产物计数不变）。

## §5 Claude 复核清单（验收时逐条）

1. git：本站提交只含 §0.1 列的文件；`git diff` 证 deck-v3.mp4 等产物与 v1 存量零变化。
2. compositions / ffprobe / 预期帧数三方对账（3287±1，总时长 109.57s）。
3. 独立抽 3 页时间序列条带判读：分批进场真实、停顿可数、动词分型（不是全家一个 spring）。
4. 独立抽 3 转场点：硬切无混合帧、入场动词与进场时刻表一致。
5. 随机 5 段字幕的同步差 ≤0.3s（拿 deck-cues.ts 时刻对照实测帧）。
6. 回归：F2 抽查、字幕面板/去重、静音测试抽查、PPT 否决抽查（继承 v3 法）。
7. Stage 1 进场时刻表过审记录存在（entrance-schedule.md 有复核痕迹）。

## §6 参考

- 质量底线：`docs/2026-08-30-motion-grammar.md`（V/M/F 全表）
- v3 质感工艺结论与教训：`docs/workorder-log.md` v3 节；v3 验收详单：`products/lekao-intro/deck-video-v3-acceptance.md`
- 标杆片复现：`yt-dlp -f 30064 <BV1fShG6LETU>` → ffmpeg scene cut → cv2 phase correlate（本 spec §2 数据即此法产出）
