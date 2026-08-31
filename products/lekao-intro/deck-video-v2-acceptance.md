# deck-video v2 · 场景化成片 验收报告（Stage 3）

> spec：`docs/2026-08-30-deck-video-v2-stage-spec.md`；质量底线：`docs/2026-08-30-motion-grammar.md`。
> 设计表 `output/video-motion/lekao-intro/scene-design.md` 已过复核关（用户确认「继续」）。
> 本报告覆盖 Stage 0-3；Stage 4（封面 v2 + SKILL.md 补节 + 配音终稿线）等用户确认后执行。

## 产物

| 产物 | 路径 | 规格 |
|---|---|---|
| v2 成片 | `output/video-motion/lekao-intro/deck-v2.mp4` | 110.07s（3302 帧），1920×1080@30，crf16，19.9 MB |
| v1 对照（未动） | `output/video-motion/lekao-intro/deck.mp4` | 同参数，14.6 MB |
| 场景组件库 | `skills/…/remotion-app/src/scene-kit/`（13 组件） | Stage 0 五基础 + Stage 1 六叙事 + SceneShell tone 扩展 |
| v2 主组件 | `skills/…/remotion-app/src/DeckVideoV2.tsx` | 11 场景按设计表组装；页时长/音频/字幕全走 v1 派生机制 |
| 零件 demo | `output/video-motion/lekao-intro/v2-kit/kit-basics.mp4`（20s）/ `kit-narrative.mp4`（30s） | 验收帧在 `v2-kit/frames-*` |
| 验收抽帧 | `v2-kit/frames-v2/`（101 张）、`v2-kit/compare/`（v1/v2 同时间点 23 张） | 见下文对照表 |
| 设计表 | `output/video-motion/lekao-intro/scene-design.md` | 11 页 × 6 列 + 素材采用/弃用清单 |

提交：Stage 0 `827a502`、Stage 1 `3f2431b`、Stage 2+3 见最新提交（v1 存量 DeckVideo.tsx / cover-index.ts diff 为零，Root.tsx 仅追加 DeckVideoV2 注册）。

## 逐 Stage 结论

| Stage | 内容 | 验收 | 结论 |
|---|---|---|---|
| 0 基础层 | SceneBg(双族)/FloatWrap/TextReveal/StaggerList/SceneShell + `kit-basics` | 渲染 exit 0；16 帧全过，进场中间态逐帧确认（逐字缺字、错峰缺卡、漂浮相位差） | **PASS** |
| 1 叙事层 | TypingTerminal/ChatReplay/CountUp/ChartGrow/DeviceFrame/GlowPulse + `kit-narrative` | 首轮 16/21 → 修 3 项（ChartGrow 深底数值配色 props、手机框换真截图、水印对比度）→ 复查 8/8 | **PASS**（两轮） |
| 2.1 设计表 | `scene-design.md`：六类内容类型判定 + 三条选择规则自查 + 素材弃用理由 | 用户复核通过（「继续」） | **PASS** |
| 2.2 接线 | SceneShell `tone` 扩展（唯一契约扩展）；素材→`public/lekao/`（已 gitignore）；lekao 配音+参数重算；Root.tsx 注册 | `remotion compositions`：DeckVideoV2 = 3302 帧 @30 1920×1080，= Σ页时长×30 | **PASS** |
| 3 渲染+三级 | `deck-v2.mp4` | 见下 | **PASS** |

## Stage 3 三级核查

**L1 程序**：渲染 exit 0；ffprobe 3302 帧 / 1920×1080 / 30fps / 110.12s，与 compositions 规格（3302=round(110.068×30)）对账一致。注：`compositions` 命令曾被模板 FootageOverlay 缺 `public/footage.mp4` 卡死，本次用 ffmpeg 生成 1s 深蓝占位（`*.mp4` 已 gitignore）修复，v1 既有 composition 逻辑零改动。

**L2 抽帧读图（101 张 + 修复复查 8 张，judge 三路）**：
- 场景页序与内容 p01-p06（24 帧）：22 过，2 红 = **P5 字数 chips 与字幕药丸重叠**（chips 底缘 930px 压入字幕区 906px）→ chips 行上移（paddingBottom 150→200）重渲 → 复查 4/4 过，chips 与字幕有清晰间隙。
- 场景 p07-p11（20 帧）：18 过，2 红 = 抽帧时机未踩中动画窗口（p07 柱状图 2.6s 恰好长完、p09 卡片 0.5s 才起跳）→ 重采 +2.0s/+0.75s → 4/4 过：**p07 末柱 7→8 递进、p09 第三卡半透明入场中，错峰铁证坐实**。
- 字幕 27 帧：**27/27 逐字一致**，无叠影无乱码。
- 每场景进场中间态：全部 11 页均有逐字缺字 / 模块半入场 / 错峰缺位证据（`frames-v2/`）。
- 无黑帧、无乱码方块字、无溢出裁切。

**渲染事故记录**：P5 修复后第一次重渲失败（Chrome 渲帧 rejection，日志被管道截断仅剩堆栈尾）；重跑后成功（exit 0 + Encoded 3302/3302）。教训已吸收：渲染退出码不取管道尾（`| tail` 后 `$?` 量到的是 tail），以完整日志 + Encoded 行 + ffprobe 为准。

**L3 用户终审**：待看片确认（本报告即停点）。

## v1 / v2 同时间点画面对照表

同一时间点（每页开始 +2.0s）抽帧对照，证据在 `v2-kit/compare/`（cmp-v1-pNN / cmp-v2-pNN；P5 用修复后 `r2-cmp-v2-p05.png`）：

| 时间点 | v1（PPT 页图轮播） | v2（原生动效场景） |
|---|---|---|
| 2.0s | 浅米色封面整页位图，静止 | 深蓝场景：logo 漂浮 + 大字逐字刚落定，光晕呼吸中 |
| 9.7s | 痛点页整页位图，静止 | 终端窗正逐行打字（第 2-3 行进行中），标题入场刚完成 |
| 19.1s | 三卡片页位图，静止 | 对话回放第 2-3 条气泡弹出，「正在输入」三点闪烁 |
| 28.2s | 链路图页位图，静止 | 插画卡漂浮 + 三步卡错峰进场，光晕后衬 |
| 41.3s | 三卡片页位图，静止 | 大插画卡漂浮，字数四挡 chips 刚横向滑入完毕 |
| 53.1s | 错题集链路页位图，静止 | 镜像双栏：插画漂浮 + 01/02/03 步骤刚错峰到位 |
| 64.1s | 数字墙位图，静止 | 柱状图第 5-7 根仍在长高（错峰中间态），大数字滚动落定 |
| 77.3s | 行清单页位图，静止 | 手机框真截图入场漂浮，三行要点落定 |
| 88.8s | 三节点链路位图，静止 | 三张编号大卡错峰入场（第三张刚到） |
| 97.0s | 金句页位图，静止 | 金句逐字落定 + 对比插画横幅入场中 |
| 104.1s | 深底尾页位图，静止 | CTA 大字 + 域名落定，浏览器框官网真截图漂浮 |

核心差异：v1 帧间画面零变化（只有页间溶解）；v2 每个时间点都能抓到「动画进行中」的中间态。

## §4 验收清单核对

- [x] v1 存量零改动（DeckVideo.tsx / cover-index.ts diff 为零；Root.tsx 仅追加注册）
- [x] 确定性：渲染路径 grep 无随机源/时钟取值（`DETERMINISM CLEAN`）
- [x] 每场景抽帧含进场中间态（11/11，judge 确认）
- [x] motion-grammar 四规则抽查：背景按内容选族（light 7 页 / dark 4 页）；主体均为内容具象化（终端/对话/插画/步骤/柱图/手机框/对比图/产品真容）；杂志式排版（眉题+大标题+细线+章节号，SceneShell/Chrome 双实现）；强调色每屏 ≤2（标题高亮 + 单一主体强调）
- [x] 设计表经复核；同类型多页构图不重复（演示 3 页三式、流程 2 页两式）
- [x] 字幕与 script.json 逐字一致（27/27）；bannedWords 复用 v1 校验（0 命中）
- [x] 渲染 exit 0、ffprobe = compositions 帧数对账
- [x] 素材未入 git（public/lekao/ 已忽略）；分支内提交、零 push

## 遗留与建议

1. **配音仍是 SAPI 测试替身**：v2 页时长/字幕随音频自动重排，剪映真人配音回填 `public/deck/audio/` 后重跑两步即换音（命令见下）。
2. 进场相位整体偏晚 0.3-0.5s（judge 系统性观察，不构成缺陷）：右栏模块普遍 delay 0.4-0.5s 起跳，前 0.4s 画面只有标题在动；如想更满可全局前移，属调优非修复。
3. 渲染日志管道截断会掩盖失败头部，复跑脚本应整日志落盘（本次已按此执行）。
4. 零件 demo 里 ChartGrow 示例数据为「演示数据」标注口径；正片 P7 柱图为 README 口径（连签 7 日 2→8 币递增）。

## 复跑命令链

工作目录：`C:\Users\TimeCraker\Desktop\my_workspace\vibe-studio\skills\video-motion\templates\remotion-app`

```powershell
# 换稿/换配音后（上游 script.json、public/deck/audio/ 已更新时）：
node scripts/build-deck-params.mjs ..\..\..\output\video-motion\lekao-intro\script.json public/deck
npx remotion render remotion/index.ts DeckVideoV2 ..\..\..\output\video-motion\lekao-intro\deck-v2.mp4 --crf=16
# 对账 + 抽帧：
npx remotion compositions remotion/index.ts
python ..\..\..\output\video-motion\lekao-intro\gen_v2_check_frames.py `
  ..\..\..\output\video-motion\lekao-intro\deck-v2.mp4 `
  ..\..\..\output\video-motion\lekao-intro\deck.mp4 C:\pc\v2-check
# 零件 demo 重渲：
npx remotion render remotion/demo-index.ts kit-basics <out>\kit-basics.mp4 --crf=16
npx remotion render remotion/demo-index.ts kit-narrative <out>\kit-narrative.mp4 --crf=16
```

剪映配音回填（Stage 4 终稿线）：逐页导出 `page-1.wav … page-11.wav` 覆盖 `skills/video-motion/templates/remotion-app/public/deck/audio/`，跑上面前两行即可，页时长与字幕自动跟随。
