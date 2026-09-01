---
name: video-motion
description: 用 Remotion 在真实视频底材上叠加动效图层——字幕跟随、数据柱升起、圈注箭头标注（触发词：视频动效 / 视频加字幕 / 屏录标注 / 把视频做成讲解视频 / Remotion）。素材 + 一份 cues 时间轴声明，一条命令渲染成片。也给 PPT 逐页成片（DeckVideo）与场景化成片（scene-kit 组件直绘动效场景，v2→v3 质感工艺）与视频封面出图（Cover 静态 PNG，触发词：封面图 / 视频封面 / 出封面 / cover）。给录像 / 屏录 / 游戏录像做讲解视频、加字幕、数据动画、产品介绍片或出封面时使用。
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
npx remotion render remotion/index.ts FootageOverlay <仓库>/products/<项目名>/demo.mp4 --crf=16 --public-dir <素材目录>
```

产物住**仓库 `products/<项目名>/`**（目录法：skill 是纯工具，产物不落 skill 内；跨仓库使用时落该项目根 `output/<skill 名>/`）；`--crf=16` 高质量。大素材渲染放后台跑（1440p60 × 30s 约 10 分钟），以退出码 + ffprobe 验收，不凭进度条。

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
4. **接线与渲染**：`node scripts/build-deck-params.mjs <script.json> public/deck` 生成 `src/deck-params.ts` + `src/deck-cues.ts`（页起点 / 总时长 / 字幕摊时全是派生值，勿手改）→ `npx remotion render remotion/index.ts DeckVideo <仓库>/products/<项目名>/deck.mp4 --crf=16`
5. **三级核查**：同 Step 4 三级（程序 ffprobe / compositions 对账 + 抽帧读图 + 用户看片）。L2 抽帧要点：每页首帧+0.3s 查页序；交叠中点取**下页 start+0.25s**（交叠尾在页窗尾部，0.5s 交叉溶解）；字幕 start+0.3s / end+0.3s 查文本与退场。页首帧+0.3s 处 spring 淡入未满、整帧偏灰，是转场中间态不是缺陷

页图与配音住 `public/deck/`（.gitignore 已覆盖，不入 git）；画布 1920×1080@30 常量在 `build-deck-params.mjs` 顶部，改两行即 4K。

## 场景化成片 v2→v3 质感工艺（scene-kit 直绘，第三种成片）

PPT 逐页成片的升级线：画面主体从「PPT 页图」换成 Remotion 组件直绘的动效场景（`src/scene-kit/` 13+ 组件），页时长/音频/字幕机制沿用 deck-params 派生链。判「素」判「low」对照 `docs/2026-08-30-motion-grammar.md`；本节是质感工艺的硬规则。

### 质量底线（验收硬关，逐条可判）

- **八问口诀**（一屏画面问八句，全过才算不素）：背景选对族了吗（V1 双族：浅米白杂志 / 深蓝科技，按内容切换）？主体是内容本身吗（V2 讲什么用什么当主体）？排版像杂志吗（V3 眉题+超大标题+细线+非对称双栏）？现在动吗（M3 进完场不死画）？有光影吗（F1）？道具经得起放大吗（F2）？有死空间吗（F3）？静音能看懂吗（F5）？
- **F1 光影成体系**：悬浮元素一律双层阴影+1px 边光；背景是「空间」不是「色板」（浅族底色+淡网格+角落柔光斑+暗角；深族径向渐变+暗角+微噪点）。全片取值单源 tokens（COLOR/SHADOW/RIM/TYPE/FONT），卡片/设备框/终端统一走 DropCard，不许裸铺色块。
- **F2 道具经得起放大**：拟物道具 200% 中心放大帧为证——浏览器要有标签条+锁形地址栏、手机要有侧键+贴顶灵动岛+玻璃高光、终端要同底色标题栏+等宽+$ 品牌提示符、图表要基线+网格+末柱高亮；截图缩小后正文不可读必须改滚动或裁切特写；全片字体栈显式声明（sans/mono），任何文字不落浏览器默认衬线。
- **F3 无死空间**：单块零信息区 ≤ 画面 20%（九宫格任一格不全空）；主体之外用次级内容填格（批注/箭头/元信息）。
- **F4 版面一体**：字幕并入版面语言（浅底白半透明面板+深字 / 深底黑半透明面板+白字，同字体同圆角），不贴「黑药丸」；固定底带，任何道具不得侵入；画面大字与字幕重复（相似度 ≥0.8）时字幕让路（去重）。
- **F5 信息自足（静音测试，硬关）**：每页除主标题外 ≥2 组真实支撑信息（数字/步骤/事实，只取材口播稿与项目真实文档，禁编造、禁词表照查）+ ≥1 层主体标注（角标/高亮圈/扫描线/引线）；judge 逐页盲答「这页讲什么」，11/11 答出才算过。
- **PPT 感一票否决（硬关）**：随机抽稳定帧问「放进静态 PPT 违和吗」——完成态帧必须有**静帧可见的进行时证据**（闪烁光标/呼吸光环/流动虚线/扫描线），否则就是幻灯片，打回。
- 主标题 ≥ 画高 11%（1080p 即 ≥120px），金句/CTA 页 ≥150px；手动断行时容器宽度留 ~10% 余量（150px 大字实测行宽会超估算，自动换行会抢在 `\n` 前面把词拆跨行）。

### 场景设计方法（通用，不预设答案）

先查 `assets/patterns.md` 成页方案库——同类情景已有验证过的 PAT 条目就套用改参数（情景→版式→组件→坑→参考帧都在条目里），没有再从零设计。每页文案先定内容类型（叙事痛点/功能演示/数据说服/流程说明/概念/行动号召六类），再按「主体由文案内容定、同类型多页不重复同一视觉方案、背景族服务内容情绪」三条规则定主体形式与组件组合。开工前产出设计表（每页：文案摘要→内容类型→主体形式→背景族→组件组合→理由→画面信息包逐条+出处→主体标注），**设计表前置复核，过了才写代码**；支撑信息逐条标出处（口播稿/项目文档/素材可见内容）。

### 三条换来的硬教训（写成规则）

1. **完成态必须有进行时证据**：稳定帧≠定格帧——聊天加输入条+闪烁光标、图表末点加呼吸光环、流程箭头用流动虚线，否则 PPT 否决必打回。
2. **包装组件必须显式透传 width**：新容器包旧组件时丢 width = 块级元素撑满父容器（插画盖标题、手机壳撑到 700px 宽两轮同根因）；包容器一律 `style={{ width, ...style }}`。
3. **长截图先验空白率再定方案**：拿到长截图先按行算 std/空白占比（PIL 一段脚本），懒加载没渲染进截图的「空长图」滚动即死空气——先裁切特写，素材修复再回切滚动。

## MG 武器库（S0-S6，成片质感的主力弹药）

模板自带全套武器，家底与逐组件用法以 `assets/component-catalog.md` 为准（scene-kit 17 组件 / entrance-kit 九动词 / vendor 社区精选 / fonts），此处只记铁律：

- **版本铁律**：所有 `@remotion/*` 必须精确同版（如 4.0.518，不带 `^`）——版本错配是 Remotion 硬报错不是警告；新增包先对齐存量版本
- **4.0.518 API 事实**（与文档/记忆有出入，已实测）：`evolvePath` 返回 dash 属性对非裁剪 path；`interpolatePath(value, from, to)` 三独立参数；`fitText` 只吃 `withinWidth` 且返回 `{fontSize}` 对象；中文多行不能用 `fitTextOnNLines`（按空格分词）；`parseSrt` 返回 `{captions:[{text,startMs,endMs}]}` 毫秒制
- **transform 包装坑**（S6 双坑实录）：带 transform 的包装动词（CameraPush/SlideGroup/TextBreath/BlurTrail）不得直接包 `position:absolute` 子树——transform 元素是 absolute 后代的 containing block，流内高度塌 0、内容顶格溢出。组件已自足（CameraPush 根 inset 0、BlurTrail 主层流内），使用时仍避免在无尺寸的 absolute 父级里裸包
- **官方 `<Trail>`/`TransitionSeries` 语义**：Trail 根是 AbsoluteFill（页级覆盖语义），元素级残影用 scene-kit 的 BlurTrail（已 relative 化）；TransitionSeries 转场吃相邻页时长，成片引擎默认零转场（Series 硬切）+ 页内动词
- **vendor 纪律**：copy-paste 入库非 npm 依赖；升级=重新拉取重做 intake；纪律四条见模板 `src/vendor/README.md`
- **Lottie 资产流**：免费商用 JSON 进 `assets/lottie/`（README 三字段登记）→ 用时复制进项目 `public/` → `LottieLayer src` 引用；intake 禁带 expressions 的 JSON（渲染不确定）
- **重武器限额**：ShutterBlur（×samples）与 ThreeStage（SwiftShader ~17 帧/s）每片 ≤1 处；BlurTrail 慎包重子树（×layers 重渲）

### 验收流程（四级）

L1 程序（渲染退出码取完整日志，禁管道尾；ffprobe = compositions 帧数对账）；L2 抽帧（每页 4 张：进场中间态/稳定全景/信息包特写/道具 200% 放大 + 字幕帧逐字核对 + 去重证据帧，judge 读图）；L2.5 静音测试（逐页盲答主旨）；L3 报告（含新旧版同时间点对照表 + 八问逐页自评）。**验收全绿后资产回流（铁律）**：改进/新造的 scene-kit 组件与 tokens 回写 skill 模板；新成页方案在 `assets/patterns.md` 登记 PAT 条目（模板见文末）；教训进 `docs/workorder-log.md`。渲染命令同 DeckVideo（composition 换成场景化组件，如 `DeckVideoV2`），封面用 `npx remotion still` 出图（still 帧号要容纳入场 spring 时长）。

## 封面出图（Cover，第四种产物）

不渲视频渲一帧：一条命令出 1920×1080 封面 PNG，发视频时配图用。

1. **props**：`products/<项目名>/cover-<名>.json` 写 `{ title, subtitle?, badge?, bg?, preset }`。`preset` ∈ `photo`（bg 图铺满 + 底部 55% 黑渐变遮罩保对比度）/ `dark`（深色渐变，缺省）/ `clean`（浅底 + 顶部细线）；`bg` 是 remotion-app `public/` 下相对路径。**subtitle 省略即不渲染；badge 省略回落 ASTERFORGE 品牌角标**
2. **渲染**：`npx remotion still src/cover-index.ts Cover <输出>.png --props=<json 文件路径>`（独立入口不经 Root.tsx，与 DeckVideo 并行施工零冲突）
3. **核查**：读图查标题完整不截断（超长标题须两行内折行）、photo 遮罩下文字可读、无乱码方块；读图走 `C:\pc\` 短路径，复查须换新文件名防缓存

## 边界与坑

- 读图坑：路径含反斜杠解析失败 → 先复制 `C:\pc\` 短路径；复查修复效果必须换新文件名（同路径图片会被缓存返回旧图）
- GBK 控制台：print 全英文
- Chrome Headless Shell 首次 `npx remotion browser ensure` 从 Google 源下载（百 MB 级），中国网络可能超时——失败即报，不反复重试大文件下载
- mp4 / PNG / node_modules / out/ 不进 git（仓库 .gitignore 已覆盖）
