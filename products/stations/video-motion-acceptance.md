# video-motion 首站验收报告

- Spec：`docs/2026-08-29-video-motion-stage-spec.md`
- 执行者：Zcode（GLM-5.3-Flash）
- 环境：Windows 11 / Git Bash / Node v24.16.0 / npm 11.13.0

---

## Stage 0 完成（2026-08-29）

### 动作

1. `git status` 干净（`.playwright-mcp/` 未跟踪属已知例外，忽略）
2. 建 `skills/video-motion/templates/remotion-app/` 骨架：`package.json`（name `video-motion-app`，scripts render/studio/compositions）、`.npmrc`（npmmirror）、`tsconfig.json`（jsx react-jsx / strict）、`remotion/index.ts`（registerRoot）、`src/Root.tsx`（Stage0Test：1920×1080 / fps30 / 90 帧黑底白字）；`skills/video-motion/SKILL.md` 空占位
3. 同批安装：`npm install remotion @remotion/cli @remotion/media` → added 249 packages in 13s，三包版本一致 **4.0.518**（npm 解析联动，无混版本）
4. `npx remotion browser ensure` → Chrome Headless Shell 113.3MB 下载成功（Google 源未超时），落位 `node_modules/.remotion/chrome-headless-shell/win64/`

### 证据

```
$ npx remotion render remotion/index.ts Stage0Test out/stage0-test.mp4
Rendered 90/90
Encoded 90/90
+ out/stage0-test.mp4 144 kB

$ stat -c '%s' out/stage0-test.mp4
144038 bytes
```

### 结论

`out/stage0-test.mp4` 存在且 144KB > 0KB → **Stage 0 PASS**。

---

## Stage 1 完成（2026-08-29）

### 动作

1. 素材就位：仓库 `output/footage/footage.mp4`（118MB）复制到工程 `public/footage.mp4`（123539483 bytes 与源一致）——未走 SyntheticFootage fallback
2. API 落实：spec 点名的 `getVideoMetadata` 位于 `@remotion/media-utils`（`@remotion/media` 只导出 Audio/Video 标签），显式安装 `@remotion/media-utils`（4.0.518，同批联动）；`VideoMetadata` 字段以本地 `.d.ts` 为准：`durationInSeconds / width / height / aspectRatio / isRemote`
3. `src/FootageOverlay.tsx`：`<OffthreadVideo src={staticFile("footage.mp4")} />` 100%×100% objectFit cover 铺满
4. `src/Root.tsx` 注册 `FootageOverlay`：1920×1080 / fps30 / `calculateMetadata` 内 `getVideoMetadata(staticFile('footage.mp4'))` 动态算 `durationInFrames = floor(durationInSeconds * 30)`

### 证据

```
$ npx remotion compositions remotion/index.ts
Stage0Test        30      1920x1080      90 (3.00 sec)
FootageOverlay    30      1920x1080      915 (30.50 sec)

$ npx remotion render remotion/index.ts FootageOverlay out/stage1-footage.mp4
Encoded 915/915
+ out/stage1-footage.mp4 104.8 MB
```

读图核对（PNG 经 `C:\pc\` 短路径读取）：
- f60（2s）：CS2 Dust2 实录，AK-47 | 传承第一人称，计分板 9:10、雷达、$50/100HP，画面铺满无拉伸
- f600（20s）：同局推进到 B 区（"炸弹安放区 B"），$950/30 发，画面无花屏

### 结论

时长 915 帧 = 30.50s = 素材时长；1920×1080 / fps30 与预期一致；画面 = 素材内容（尚无动效）→ **Stage 1 PASS**。

---

## Stage 2 完成（2026-08-29）

### 动作

1. `src/cues.ts`：照抄 spec §2 数据契约（SubtitleCue / DataBarGroup / SpotlightCue / cues 空数组），字段未动
2. `src/fx/SubtitleTrack.tsx`：底部居中黑底白字字幕条，每条 cue 一个 `<Sequence>`，spring 淡入淡出（damping 200）+ 轻微上浮
3. `src/fx/DataBars.tsx`：柱高按 value/max 归一 spring 升起（damping 200），柱顶数值 `interpolate` 0→value 滚动（clamp），label 柱底，整组支持 scale
4. `src/fx/Spotlight.tsx`：SVG 绘制 circle（椭圆圈注）/ arrow（从画面右侧伸入指向 (x,y)，w=伸出长度，spring 画线+箭头）/ box（描边框）；0.5s 周期 sin 呼吸脉冲 ±2%；ttl 到点 spring 淡出；可选 text 标签黑底白字浮于标注上方
5. `src/Demos.tsx` 三个 5s 演示 Composition（纯色背景 + 硬编码演示参数）注册进 Root：SubtitleDemo / DataBarsDemo / SpotlightDemo

### 证据（渲染 + 抽帧读图，PNG 经 `C:\pc\` 读取）

```
$ npx remotion render remotion/index.ts <comp> out/stage2-<comp>.mp4   # 三个均成功
out/stage2-SubtitleDemo.mp4  305.5 kB
out/stage2-DataBarsDemo.mp4  274.9 kB
out/stage2-SpotlightDemo.mp4 397.5 kB
```

| demo | 帧 | 期望 | 实际 | PASS/FAIL |
|---|---|---|---|---|
| SubtitleDemo | f45 (1.5s) | 字幕#1 "Subtitle demo line one" 可见 | 底部居中黑底白字字幕条，文本一致 | PASS |
| SubtitleDemo | f81 (2.7s) | 空窗（#1 已退 2.5s，#2 未进 3.0s） | 纯背景无字幕 | PASS |
| SubtitleDemo | f117 (3.9s) | 字幕#2 "Subtitle demo line two" 可见 | 文本一致 | PASS |
| DataBarsDemo | f15 (0.5s) | 无柱（组 t=0.8s 未到） | 纯背景 | PASS |
| DataBarsDemo | f60 (2.0s) | 3 柱升满，高度 42<58<76 成比例，顶数值/底标签 | 42% / 76% / 58% 与 Alpha/Beta/Gamma 全对，颜色区分 | PASS |
| SpotlightDemo | f45 (1.5s) | circle 椭圆圈注 + "Target area" 标签 | 黄色椭圆落在 (640,280,380,240)，标签在上 | PASS |
| SpotlightDemo | f84 (2.8s) | 空窗（circle ttl 到点退出，arrow t=2.8 刚起） | 纯背景 | PASS |
| SpotlightDemo | f105 (3.5s) | arrow 从右侧伸入指向 (860,620) + "Look here" | 箭头伸入到位，箭头尖指向目标点，标签在上 | PASS |

### 结论

三个演示 mp4 各自动效可见且行为正确（出现/空窗/退场时刻、文本、比例、落点全对）→ **Stage 2 PASS**。

---

## Stage 3 完成（2026-08-29）

### 看素材（7 帧铺开抽帧读图）

素材叙事线（CS2 Dust2，T 方 TimeCraker 第一视角，AK-47 | 传承）：

| 帧 | 时刻 | 画面 |
|---|---|---|
| f0/f120/f240 | 0/4/8s | 上隧道推进（队友 在东莞找爱情 前出）→ B 口交火 killfeed 双杀（$650）→ 进 B 区换弹完毕 |
| f360 | 12s | B 区平台安放 C4（炸弹码 7355608 特写，聊天栏「炸弹安放中」） |
| f480/f600 | 16/20s | 中央提示「炸弹已被安放。离引爆还剩 40 秒。」→ 卡点守包 |
| f720/f870 | 24/29s | 「回合胜利」+ 最多击杀 MVP（3杀）TimeCraker，$4500，持刀走出隧道 |

### cues.ts 动效剧本（全走声明，组件零硬编码）

- **字幕 8 条**（≥5，每条 2.0s）：推进 / 双杀 / 换弹 / 下包 / 倒计时 / 守包 / 胜利 MVP / 数据口径说明
- **数据柱 1 组**（≥1）：t=26.8s 起，「接火双杀 2 杀 / 残局收割 1 杀 / 回合总击杀 3 杀」——数值取自对局 killfeed 与回合结算真实数据，字幕口径「真实对局数据」
- **圈注 3 处**（≥2，circle+arrow+box 全型覆盖）：
  - box (4.2s, ttl 2.5)：框住右上 killfeed 双杀行，标签「双杀时刻」
  - circle (12.4s, ttl 2.6)：圈住画面中央 C4 炸弹，标签「安放 C4」
  - arrow (16.4s, ttl 2.6)：从右侧伸入指向「离引爆还剩 40 秒」提示条，标签「倒计时 40 秒」

### 证据

```
$ npx remotion render remotion/index.ts FootageOverlay out/demo.mp4
Encoded 915/915
+ out/demo.mp4 104.9 MB
```

Sanity 抽帧（完整逐条核对见 Stage 4 L2 表）：
- f45：字幕「上隧道出口推进，直奔 B 区」中文渲染正常（Microsoft YaHei 回退生效，无豆腐块）
- f849：三根数据柱升满（2杀<3杀比例正确），与 MVP 横幅、底部 HUD 无遮挡

### 结论

一条命令出完整 demo.mp4（915 帧），无报错 → **Stage 3 PASS**。

---

## Stage 4 完成（2026-08-29）：三级自验收

### L1 程序级

1. **渲染退出码 0**（复跑验证可复现）：

```
$ npx remotion render remotion/index.ts FootageOverlay out/demo.mp4
render exit code: 0
Encoded 915/915
○ out/demo.mp4 104.9 MB
```

2. **compositions 元数据 vs 素材**：

```
$ npx remotion compositions remotion/index.ts
FootageOverlay    30 fps    1920x1080    915 (30.50 sec)
SubtitleDemo      30 fps    1920x1080    150 (5.00 sec)
DataBarsDemo      30 fps    1920x1080    150 (5.00 sec)
SpotlightDemo     30 fps    1920x1080    150 (5.00 sec)
```

FootageOverlay 915 帧 = 30.50s = getVideoMetadata(footage.mp4).durationInSeconds × 30，1920×1080 / fps30 与素材预期一致 ✓

3. **抽帧 ≥8**：按 spec 公式抽 **24 帧**（PNG 落 `out/frames/f-<n>.png`，经 `C:\pc\vm\` 短路径读图）：
   - 字幕 8 条 ×（start+0.3s, end-0.3s）：f33/f75, f129/f171, f249/f291, f369/f411, f489/f531, f609/f651, f741/f783, f819/f861
   - 数据柱 ×（t-0.3s, t+1.5s）：f795, f849
   - 圈注 3 处 ×（t+0.5s, t+ttl+0.3s）：box f141/f210, circle f351/f387（修订后）, arrow f507/f579

### L2 读图核对全表（24 帧）

| cue | 帧 | 期望 | 实际 | PASS/FAIL |
|---|---|---|---|---|
| 字幕#1 start+0.3 | f33 (1.1s) | 出现，文本「上隧道出口推进，直奔 B 区」 | 底部居中黑底白字，文本一致 | PASS |
| 字幕#1 end-0.3 | f75 (2.5s) | 仍在显（淡出中） | 可见，文本一致 | PASS |
| 字幕#2 start+0.3 | f129 (4.3s) | 出现「B 口交接火，配合队友双杀」；box 刚入场淡入 | 字幕一致；box 淡入中（spring 进行时） | PASS |
| 字幕#2 end-0.3 | f171 (5.7s) | 仍在显；box ttl 内 | 均可见 | PASS |
| box t+0.5 | f141 (4.7s) | 描边框套住右上 killfeed 双杀行 +「双杀时刻」 | 框住两行 killfeed（TimeCraker 双杀），标签清晰 | PASS |
| box t+ttl+0.3 | f210 (7.0s) | box 已退场 | 无 box 无字幕，空窗干净 | PASS |
| 字幕#3 start+0.3 | f249 (8.3s) | 出现「进入 B 区，换弹完毕随时接战」 | 可见，文本一致，画面=AK 特写 | PASS |
| 字幕#3 end-0.3 | f291 (9.7s) | 仍在显 | 可见（素材本身为队友闪光过曝帧，字幕仍清晰） | PASS |
| 字幕#4 start+0.3 | f369 (12.3s) | 出现「B 区平台下包，安放 C4」 | 可见，文本一致 | PASS |
| 字幕#4 end-0.3 | f411 (13.7s) | 仍在显 | 可见 | PASS |
| circle t+0.5 | f351 (11.7s) | 椭圆圈注套住 C4 炸弹特写 +「安放 C4」 | 圈住输码中的 C4（LCD --73556），标签在上 | PASS（修订后） |
| circle t+ttl+0.3 | f387 (12.9s) | circle 已退场 | 无圈注，画面干净 | PASS（修订后） |
| 字幕#5 start+0.3 | f489 (16.3s) | 出现「炸弹已安放，40 秒倒计时」 | 可见，文本一致 | PASS |
| 字幕#5 end-0.3 | f531 (17.7s) | 仍在显；arrow ttl 内 | 均可见 | PASS |
| arrow t+0.5 | f507 (16.9s) | 箭头从右侧伸入指向「40 秒」提示条 +「倒计时 40 秒」 | 箭头尖精准落在提示条右缘，标签就位 | PASS |
| arrow t+ttl+0.3 | f579 (19.3s) | arrow 已退场 | 无箭头无字幕，空窗干净 | PASS |
| 字幕#6 start+0.3 | f609 (20.3s) | 出现「卡住方向守包，静待敌人回防」 | 可见，文本一致 | PASS |
| 字幕#6 end-0.3 | f651 (21.7s) | 仍在显 | 可见 | PASS |
| 字幕#7 start+0.3 | f741 (24.7s) | 出现「回合胜利，三杀拿下 MVP」，与画面 MVP 横幅对应 | 可见，画面正是 最多击杀 MVP(3杀) TimeCraker | PASS |
| 字幕#7 end-0.3 | f783 (26.1s) | 仍在显 | 可见 | PASS |
| 数据柱 t-0.3 | f795 (26.5s) | 柱未出现 | 无柱（画面为素材本身记分板） | PASS |
| 字幕#8 start+0.3 | f819 (27.3s) | 出现「本回合击杀贡献（真实对局数据）」，柱升起 | 字幕一致，三柱已基本升满 | PASS |
| 数据柱 t+1.5 | f849 (28.3s) | 柱升满：2杀<3杀、1杀<3杀 比例正确，标签齐全 | 2杀/1杀/3杀 高度成比例，接火双杀/残局收割/回合总击杀全对 | PASS |
| 字幕#8 end-0.3 | f861 (28.7s) | 仍在显 | 可见，柱持续显示 | PASS |

**底材核查**：24 帧底材均为 CS2 素材原画面，无花屏、无拉伸（2560×1440 → 1920×1080 cover 正常）、无乱码；动效层文字（含中文）全部正常渲染（Microsoft YaHei 回退生效）。

### 红项与修复记录（1 轮闭环）

- **红项**：首轮 circle cue 设 t=12.4s，但素材 12.3s 已从炸弹特写切到持枪视角——f387/f411 中圈注落在木门框上而非 C4（落点维度 FAIL，其余维度正常）。
- **修复**：抽 f336（11.2s）确认炸弹特写时段后，cue 改为 `t: 11.2, ttl: 1.4`（覆盖输码全程 11.2→12.6s），坐标不变。
- **重查**：重渲染（exit 0）后 f351（圈住 C4 ✓）、f360（圈+字幕#4 同显 ✓）、f387（按时退场 ✓）；对照帧 f507（arrow 不受影响，确认渲染确定性）✓。

### 结论

L1 全过（退出码 0、元数据一致、24 帧 ≥8）；L2 全表 PASS（含红项修复后复验）；底材/文字/乱码核查无异常。

**ALL GREEN**

---

## 验收后修复（2026-08-29，工单 docs/2026-08-29-video-motion-post-review-fix.md）——B 站红项，中断于任务 B

> Interim 记录：按工单任务 B 指令「任一落点漂移 → 停下报告」，任务 C（产物迁出）/ D（完整留痕）未执行，等指挥官定夺。

### 任务 A · 1440p60 重渲染 — PASS

```
$ npx remotion render remotion/index.ts FootageOverlay ../../../../output/video-motion/demo.mp4 --crf=16
render exit code: 0
Encoded 1831/1831
+ output/video-motion/demo.mp4 281.8 MB

$ ffprobe -v error -show_entries stream=width,height,r_frame_rate -of csv=p=0 output/video-motion/demo.mp4
2560,1440,60/1,     <- 视频流
0/0                 <- 音频流（无 width/height 条目）
```

| 参数 | 旧版（1080p30） | 新版（1440p60 原生） |
|---|---|---|
| 分辨率 / 帧率 | 1920×1080 @ 30fps | 2560×1440 @ 60fps（=素材原生） |
| 大小 | 104.9MB | 281.8MB |
| 码率（大小×8/30.5s） | ≈27.5 Mbps | ≈73.9 Mbps |

注：工单命令里 `../../../../../output/...` 为 5 层 `../`，会落到仓库外 `my_workspace/output/`；remotion-app 距项目根实为 4 层，已按目录法意图改用 `../../../../output/video-motion/`。

### 任务 B · 三帧复核 — FAIL（落点系统性漂移，3/3 帧异常）

抽帧落盘 `output/video-motion/frames-1440p/`（f-282 / f-1014 / f-1698），经 `C:\pc\` 读图：

| 帧 | 期望 | 实际 | PASS/FAIL |
|---|---|---|---|
| f-282 (4.7s) | box 套住右上 killfeed 双杀行 +「双杀时刻」 | 黄框压在顶部玩家条上、大半出画；标签被裁掉不可见；字幕#2 正常 | **FAIL** |
| f-1014 (16.9s) | arrow 指向「40 秒」提示条右缘 +「倒计时 40 秒」 | 箭头落在提示条左上方墙面（偏上约 135px、偏左约 320px）；字幕#5 正常 | **FAIL** |
| f-1698 (28.3s) | 三柱比例 2<3、1<3，不遮挡 | 比例正确、底部 HUD 无遮挡，但绿色柱撞上 MVP 横幅（1080p 版无此遮挡） | **FAIL** |

**根因**（已定位，未改动任何文件）：`src/FootageOverlay.tsx:21-27` 缩放容器 `transform: scale(2560/1920)` 未设 `transformOrigin`，CSS 默认按元素中心 (960,540) 缩放，等效映射 `x' = 960+(x−960)×1.333`，与设计意图 `x' = x×1.333`（左上原点）不符。三帧偏差与该公式精确吻合（box 顶 y→−87 出画、arrow→(1127,920)、柱组→(613,353)）。1080p 验收时 scale=1（中心缩放=恒等）故此前未暴露。

**修复建议**（一行，未执行）：该容器补 `transformOrigin: "top left"`；cues 无需改动（与 3818e59「cues 零改动」承诺一致）。修复后需重渲染并复跑任务 B 三帧核对。

### 状态

- 任务 A：PASS（demo.mp4 281.8MB 已落 `output/video-motion/`）
- 任务 B：FAIL —— 停下报告
- 任务 C：未执行（关键理由：C 要删的 1080p 旧正片是当前唯一落点正确的成片，1440p 版未过 B 核对前不删）
- 任务 D：本 interim 节即留痕；完整前后对比与迁移清单待修复后补记
- git：零变化（HEAD 仍 97a3b3a；仅 auto-subtitle 并行站的既有未跟踪文件）

---

## 验收后修复（续）——红项闭环，全任务完成（2026-08-29）

> 指挥官提交 `1f4b9a1`：`FootageOverlay.tsx` 缩放容器补 `transformOrigin: "top left"`（红项根因修复），工单相对路径 5 层误写同步更正为 4 层。从任务 A 重新执行。

### 任务 A（重跑）· 1440p60 重渲染 — PASS

```
$ npx remotion render remotion/index.ts FootageOverlay ../../../../output/video-motion/demo.mp4 --crf=16
render exit code: 0
Encoded 1831/1831

$ ffprobe -v error -show_entries stream=width,height,r_frame_rate -of csv=p=0 output/video-motion/demo.mp4
2560,1440,60/1,
```

| 参数 | 旧版（1080p30） | 新版（1440p60 原生，transformOrigin 修复后） |
|---|---|---|
| 分辨率 / 帧率 | 1920×1080 @ 30fps | 2560×1440 @ 60fps（=素材原生，1831 帧） |
| 大小 | 104.9MB | 282.3MB（282,291,024 bytes） |
| 码率（大小×8/30.5s） | ≈27.5 Mbps | ≈74.0 Mbps |

### 任务 B（复跑）· 三帧核对 — 全 PASS（红项闭环）

抽帧 `output/video-motion/frames-1440p/`（f-282 / f-1014 / f-1698，覆盖重写），经 `C:\pc\` 读图：

| 帧 | 期望 | 实际 | PASS/FAIL |
|---|---|---|---|
| f-282 (4.7s) | box 套住右上 killfeed 双杀行 + 标签「双杀时刻」 | 黄框精准框住两行 killfeed，标签回位框上方清晰可见；字幕#2 正常 | **PASS** |
| f-1014 (16.9s) | arrow 指向「40 秒」提示条 + 标签「倒计时 40 秒」 | 箭头尖贴回提示条右缘，标签在箭头上方；字幕#5 正常 | **PASS** |
| f-1698 (28.3s) | 三柱比例 2<3、1<3，不遮挡 HUD | 柱比例正确，整体回到 MVP 横幅下方无遮挡（横幅文字完整可读），底部 HUD 无遮挡 | **PASS** |

落点与 1080p 验收版逐一对齐，仅分辨率/帧率更高 → 红项闭环确认。

### 任务 C · 产物迁出 skill（目录法落地）— 完成

迁入 `output/video-motion/`：

| 项 | 说明 |
|---|---|
| `frames/`（48 张 PNG） | 1080p 验收抽帧（Stage 4 留档） |
| `frames-1440p/`（3 张 PNG） | 1440p 复核抽帧（工单任务 B） |
| `stage0-test.mp4` | Stage 0 最小渲染（144KB） |
| `stage2-{Subtitle,DataBars,Spotlight}Demo.mp4` | 三组件演示片（共 ≈0.9MB） |
| `demo.mp4` | 1440p60 正片（282.3MB，transformOrigin 修复后） |
| `render-log.txt` | 本轮渲染日志（留作证据） |

删除（均可复跑，共释放 ≈209.8MB）：

| 项 | 大小 | 原因 |
|---|---|---|
| `out/stage1-footage.mp4` | 104.8MB | 纯素材重编码、无动效 |
| `out/demo.mp4` | 104.9MB | 1080p 旧正片，已被落点验证过的 1440p 版替代 |
| `out/render-log*.txt` | 84KB | 渲染日志 |

`out/` 目录已删除；skill 内不再有任何产物。

### 任务 C.4 · 素材直读试验 — 成功

```
$ npx remotion compositions remotion/index.ts --public-dir ../../../../output/footage
FootageOverlay    60      2560x1440      1831 (30.52 sec)
```

`staticFile("footage.mp4")` 经 `--public-dir` 直指项目素材库 `output/footage/`，时长照常解析（1831 帧）→ `public/footage.mp4`（118MB 副本）已删除，skill 内不留素材。

**用法（写模板用法必读）**：public/ 现为空目录。渲染 / still / compositions 需带 `--public-dir`：
```bash
cd skills/video-motion/templates/remotion-app
npx remotion render remotion/index.ts FootageOverlay ../../../../output/video-motion/demo.mp4 --crf=16 --public-dir ../../../../output/footage
```
（或把素材复制回 `public/footage.mp4` 则免带该参数。）

### git 状态

零变化：本工单全部动作位于 gitignored 区域（output/、out/、*.mp4、public/ 素材副本）。期间 HEAD 由并行站推进（132d449 → 236b755，auto-subtitle 施工），非本工单改动。

### 结论

任务 A PASS（282.3MB @2560×1440/60，退出码 0）+ 任务 B 三帧全 PASS（transformOrigin 红项一轮闭环）+ 任务 C 迁移/清理/直读试验全过 + 任务 D 本节留痕。

**ALL GREEN**
