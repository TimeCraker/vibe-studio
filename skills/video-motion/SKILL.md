---
name: video-motion
description: 用 Remotion 在真实视频底材上叠加动效图层——字幕跟随、数据柱升起、圈注箭头标注（触发词：视频动效 / 视频加字幕 / 屏录标注 / 把视频做成讲解视频 / Remotion）。素材 + 一份 cues 时间轴声明，一条命令渲染成片。给录像 / 屏录 / 游戏录像做讲解视频、加字幕或数据动画时使用。
user-invocable: true
---

# video-motion — 视频底材叠动效（Remotion）

**设计即代码**：坐标 / 时刻 / 文本全部声明在 `src/cues.ts`（数据契约，字段不许改），fx 组件零硬编码；改 cues 重跑一条命令即复跑成片。三层动效：字幕 `SubtitleTrack` / 数据柱 `DataBars` / 圈注 `Spotlight`（circle / arrow / box）。

## Step 1 · 剧本设计（看素材，不猜画面）

1. **抽帧看素材**：`npx remotion still remotion/index.ts FootageOverlay <输出>/f-<n>.png --frame=<n>`，帧号铺开抽 6-8 张；PNG 先复制到 `C:\pc\` 类短路径再读图（反斜杠路径解析坑）
2. **写 `src/cues.ts` 动效剧本**：
   - **字幕讲画面**：说观众此刻看到的事，每条 ≤2s
   - **圈注指实物**：circle / arrow / box 指向画面中真实存在且值得注意的元素，坐标先用抽帧核实落点
   - **数字要口径**：数据柱数值取真实来源（画面 HUD / 结算面板 / 后台数据），取不到就在字幕标明「演示数据」
3. **通用要求：解读必须下钻到细节层，cue 密度按细节铺满素材，不以大事件凑数**——HUD 数字变化、killfeed、聊天栏、提示条、场景切换都是 cue 素材；「推进 → 交火 → 胜利」三笔带过一条 30 秒素材就是没下钻

## Step 2 · 工程与规格（随素材自适应）

1. 复制 `templates/remotion-app/` 到工作目录，`npm install`（Remotion 各子包必须同批安装，版本严格联动）
2. **原生规格**：`node scripts/probe-footage.mjs <素材路径>` 用 ffprobe 生成 `src/footage-params.ts`——输出分辨率 / 帧率随素材走，不写死；换素材重跑该脚本即可
3. **素材不进 skill**：渲染带 `--public-dir <素材目录>`（`staticFile` 直读项目素材库）；只有不便带参数时才把素材复制为 `public/footage.mp4`
4. cues 按 **1080p 设计坐标**书写，`FootageOverlay` 已内置 `transformOrigin: "top left"` 整体缩放适配任意画布——换分辨率不改 cues，动效落点不漂移

## Step 3 · 生成（一条命令）

```bash
cd <remotion-app>
npx remotion render remotion/index.ts FootageOverlay <项目根>/output/video-motion/demo.mp4 --crf=16 --public-dir <素材目录>
```

产物住**项目根 `output/<skill 名>/`**（目录法：skill 是纯工具，产物不落 skill 内）；`--crf=16` 高质量。大素材渲染放后台跑（1440p60 × 30s 约 10 分钟），以退出码 + ffprobe 验收，不凭进度条。

## Step 4 · 三级核查（必做，不可跳）

**① 程序**：渲染退出码 0；`npx remotion compositions remotion/index.ts` 输出的 durationInFrames / 宽 / 高 / fps 与素材元数据一致；`npx remotion still` 按 cue 公式抽帧 ≥8 张——每条字幕 start+0.3s / end-0.3s、数据柱 t-0.3s / t+1.5s、圈注 t+0.5s / t+ttl+0.3s（素材 60fps 时帧号 = 秒 × 60，以 compositions 输出的 fps 为准）。

**② 读图**：PNG 复制 `C:\pc\` 短路径逐帧核对：出现 / 消失时刻与文本、柱高比例与数值标签、圈注类型与落点、底材无花屏无拉伸、全帧无乱码（中文走 Microsoft YaHei 回退）。有红项改 cues 重渲染重查，连续 2 轮仍有红 → 停下报告。

**③ 用户看片**：前两级清零机械问题后，用户终审成片。

## Step 5 · 交付

报告：成片路径与大小 / 分辨率帧率（=素材原生）/ 三级核查结论（含抽帧核对表）/ `cues.ts` 位置（可复跑）。产物与 mp4 一律不进 git。

## PPT 逐页成片（DeckVideo，第二种成片）

一套引擎两种成片：上面 Steps 是「视频底材叠动效」，这一节是「PPT 逐页」——pptx 页图 + 逐页配音直出成片，页时长跟配音实际长度走，字幕按分段稿时间轴出现。

1. **pptx 与分段稿**：ppt skill 产物 pptx；写 narration 分段稿 `script.json`，`ref` 写 `"page N"`（N=页号），先过 `python skills/narration/templates/verify_narration.py <script.json>` 全绿。每段剥后 ≤20 字（字幕单行药丸直接显示段文本），页内多段以句号连接成该页口播
2. **页图**：`python scripts/extract_pages.py <in.pptx> public/deck/pages`——COM 转 PDF 后 fitz 渲 200dpi，出 `p-<N>.png`（2667×1500，画布 contain 铺满）
3. **配音**：测试走 `powershell -File scripts/make_deck_audio.ps1 <script.json> public/deck/audio`（SAPI Huihui 逐页出 `page-N.wav`）；正式流程人工在剪映逐页配音，导出同名 `page-N.wav` 放同目录，下游无感
4. **接线与渲染**：`node scripts/build-deck-params.mjs <script.json> public/deck` 生成 `src/deck-params.ts` + `src/deck-cues.ts`（页起点 / 总时长 / 字幕摊时全是派生值，勿手改）→ `npx remotion render remotion/index.ts DeckVideo <项目根>/output/video-motion/<项目名>/deck.mp4 --crf=16`
5. **三级核查**：同 Step 4 三级（程序 ffprobe / compositions 对账 + 抽帧读图 + 用户看片）。L2 抽帧要点：每页首帧+0.3s 查页序；交叠中点取**下页 start+0.25s**（交叠尾在页窗尾部，0.5s 交叉溶解）；字幕 start+0.3s / end+0.3s 查文本与退场。页首帧+0.3s 处 spring 淡入未满、整帧偏灰，是转场中间态不是缺陷

页图与配音住 `public/deck/`（.gitignore 已覆盖，不入 git）；画布 1920×1080@30 常量在 `build-deck-params.mjs` 顶部，改两行即 4K。

## 边界与坑

- 读图坑：路径含反斜杠解析失败 → 先复制 `C:\pc\` 短路径；复查修复效果必须换新文件名（同路径图片会被缓存返回旧图）
- GBK 控制台：print 全英文
- Chrome Headless Shell 首次 `npx remotion browser ensure` 从 Google 源下载（百 MB 级），中国网络可能超时——失败即报，不反复重试大文件下载
- mp4 / PNG / node_modules / out/ 不进 git（仓库 .gitignore 已覆盖）
