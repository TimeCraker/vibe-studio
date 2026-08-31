# LeKao 产品介绍视频 · 验收报告

流水线：vibe-studio explainer-video **B 线（Remotion 成片）**，首次真实项目运行。
产物目录：`output/video-motion/lekao-intro/`。git 零 commit，仓库源文件零改动。

## 受众三问（brief.md，待用户确认）

1. **给谁看**：K12 培训机构助教 / 学管 / 班主任，每次课要抄错题、写小结、写反馈的一线人员。
2. **已知道什么**：知道自己在重复劳动上耗 1-2 小时/次课；会用手机、Excel、Word；对 AI 的认知多半停在聊天机器人，不知道"传图出成品文档"已可行。
3. **看完复述三句**：① 传一张讲义图，小结和逐题反馈直接生成，格式固定能用；② 错题集五分钟出全班 Word，浏览器里生成，不消耗 T-Coin；③ 每天签到领 T-Coin，AI 生成一次花 1 币，失败自动退回。

## 产物清单

| 产物 | 路径 | 规格 |
|---|---|---|
| 受众三问 | `output/video-motion/lekao-intro/brief.md` | 标注「待用户确认，先按此执行」 |
| deck 生成脚本 | `lekao-intro/gen-lekao-deck.py` + `primitives.py` | 色板已换 LeKao 品牌色（globals.css 提取：钴蓝 #3157F6 / 墨 #111722 / 暖纸白） |
| 幻灯片 | `lekao-intro/deck.pptx` | **11 页**，64 KB |
| 分段口播稿 | `lekao-intro/script.json` | **27 段**，ref 逐页 `page N`，verify PASS |
| Remotion 工程 | `lekao-intro/remotion-app/` | 模板整目录副本 + npm install；页图 `public/deck/pages/`，配音 `public/deck/audio/` |
| 成片 | `lekao-intro/deck.mp4` | **1 分 50 秒**（110.07s，3302 帧），1920×1080@30，--crf=16，14.6 MB |
| 封面 | `lekao-intro/cover.png` | 1920×1080，preset=dark，badge 回落 ASTERFORGE，1.1 MB |
| 核查工具 | `lekao-intro/gen_video_check_frames.py`、`lekao-intro/pages/deck.pdf` | 成片抽帧脚本 / ppt 核查 PDF 证据 |

## 各级核查结论

| 关卡 | 核查 | 结论 |
|---|---|---|
| ppt L1 程序初筛 | COM 转 PDF + `verify.py`（溢出 / 占位符 / WCAG 对比度） | **PASS**：11 页 0 issue |
| ppt L2 视觉盲看 | judge 无上下文逐页四项查 + 观众复述测试（前 4 页三问） | **PASS**（第 1 轮 p-2/p-3/p-5 卡片与页面下半空白 fail → 压缩卡高 + 底部 takeaway 横条修复 → 第 2 轮 3 页全 pass；复述测试三问全部清晰答出） |
| ppt L3 用户终审 | 人工看成稿 | **待用户**（本报告完成后终审看片） |
| narration 程序校验 | `verify_narration.py`（结构 / 段长≤20 / 预算 / 破折号 / AI 腔 / 修饰密度） | **PASS**：fail=0 warn=0，67.1s vs 预算 75s（under，OK） |
| 成片 L1 程序对账 | 渲染退出码 0；ffprobe：3302 帧 = 110.068s×30fps，1920×1080@30 | **PASS**。注：`remotion compositions` 命令被模板 FootageOverlay 的 `getVideoMetadata(public/footage.mp4)` 404 中断（素材线遗留物，与 DeckVideo 无关）；以渲染帧数 + ffprobe 作为 DeckVideo spec 证据 |
| 成片 L2 抽帧读图 | judge 读 75 帧：页序 11 帧 + 转场 10 帧 + 字幕 54 帧 | **PASS**：页序 11/11 对应无错乱；转场无花屏黑屏；27 条字幕出现帧文本逐字一致、退场帧无叠影错乱 |
| 封面读图 | judge 读 cover.png | **PASS**：标题一行完整无截断，副标题 / 角标在位，无乱码 |
| 成片 L3 用户终审 | 首中尾三页听音画同步 | **待用户终审** |

## 内容纪律自查

- 数字与功能全部溯源 `lekao/README.md`：1-2 小时/次课、10 条反馈+一段小结、4 挡字数（标准/×1.5/×2/×3）、5 分钟错题集、纯前端 docx、注册补发 5 币、连签 7 日 2→8 币、1 币/次、失败自动退回、1280px/0.4MB 压缩、流式输出、IndexedDB 本地历史、邮箱+验证码。
- 全片无付费 / 充值 / 价格 / 收费 / 免费 / 退款类表述（script.json 将其列入 meta.bannedWords 兜底，校验 0 命中）。
- 稿子按页下钻到该页具体能力与使用场景，破折号中英双禁（校验 0 命中）。

## 遗留与建议

1. **配音是 SAPI 测试替身**（Microsoft Huihui）：节奏与语感仅作流程验证，正式发布前在剪映逐页念稿，导出 `page-1.wav`…`page-11.wav` 同名覆盖 `remotion-app/public/deck/audio/`，重跑第 5 步即可（见下方命令链），字幕与页时序会自动跟音频重排。
2. brief 受众三问标注「待用户确认」；若三问有变，改稿后从第 2 步重跑。
3. BGM 未做（工作流约定：剪映里手动加，别盖人声）。
4. `remotion compositions` 对 FootageOverlay 的依赖是模板既有形态，若后续仍要跑该命令，可考虑给模板补一张占位 `footage.mp4` 或让 calculateMetadata 容错（本次未动仓库源文件，留作工单）。

## 复跑命令链

工作目录：`C:\Users\TimeCraker\Desktop\my_workspace\vibe-studio\output\video-motion\lekao-intro`

```powershell
# ① 生成 deck + script.json
python gen-lekao-deck.py

# ② deck 三级核查（L1；L2 复制 pages/*.png 到 C:\pc 短路径后交 judge 读图）
python ..\..\..\skills\video-motion\templates\remotion-app\scripts\extract_pages.py deck.pptx pages\
python ..\..\..\skills\ppt\templates\verify.py pages\deck.pdf

# ③ narration 校验
python ..\..\..\skills\narration\templates\verify_narration.py script.json

# ④ 页图 + SAPI 测试配音（正式流程改为：剪映逐页导出 page-N.wav 放入 remotion-app\public\deck\audio\）
python remotion-app\scripts\extract_pages.py deck.pptx remotion-app\public\deck\pages
powershell -NoProfile -ExecutionPolicy Bypass -File remotion-app\scripts\make_deck_audio.ps1 script.json remotion-app\public\deck\audio

# ⑤ 重算参数 + 渲染成片
cd remotion-app
node scripts/build-deck-params.mjs ../script.json public/deck
npx remotion render remotion/index.ts DeckVideo ../deck.mp4 --crf=16
cd ..

# ⑥ 成片 L2 抽帧（页序 / 转场 / 字幕）→ C:\pc 短路径交 judge 读图
python gen_video_check_frames.py deck.mp4 C:\pc\lekao-vcheck

# ⑦ 封面
cd remotion-app
npx remotion still src/cover-index.ts Cover ../cover.png --props=../cover-lekao.json
cd ..
```

**换剪映正式配音后的重跑（只动第 5 步）**：

```powershell
# 1) 剪映逐页念稿，导出 page-1.wav … page-11.wav，同名覆盖 remotion-app\public\deck\audio\
# 2) 重算页时长（字幕摊时随音频自动重排）+ 重渲成片
cd remotion-app
node scripts/build-deck-params.mjs ../script.json public/deck
npx remotion render remotion/index.ts DeckVideo ../deck.mp4 --crf=16
# 3) 重跑 ⑥ 抽帧核查后终审
```
