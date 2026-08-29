# Stage Spec · auto-subtitle 第二站：音视频自动转写出 SubtitleCue（faster-whisper）

- **日期**：2026-08-29
- **状态**：待执行
- **执行者**：Zcode（GLM-5.3-Flash），在 vibe-studio 仓库内工作
- **上游决策**：技术选型 SYSTRAN/faster-whisper（25.1k stars；对比 openai/whisper、whisper.cpp、whisperX、pyvideotrans 后拍板。理由：同一套 Whisper 权重的 CTranslate2 高效实现——纯 pip 安装、CPU int8 快 4 倍、段级秒时间戳直接对齐本站数据契约、自带 Silero VAD 静音过滤防幻觉字幕）

---

## §0 背景与目标

vibe-studio 是 TimeCraker 的自媒体内容工厂（Skills / Assets / 决策记录，不承载业务代码）。已有 `ppt`、`humanizer` 两个上线 skill；`video-motion`（Remotion 视频动效）首站由**另一个 Zcode 会话并行施工中**。本站建第四个 skill **`auto-subtitle`**：音视频文件进、字幕 JSON 出——把流水线里最重的体力活（手写字幕时间轴）自动化。

**MVP 验收一句话**：一条命令把含语音的音视频转写成 `{"subtitles": [{start, end, text}]}` JSON（字段与 video-motion 的 `SubtitleCue` 逐字一致），中文语音测试素材整体识别相似度 ≥0.85，无语音素材（纯枪声音乐）不产幻觉长句，Zcode 三级自验收全绿。

**明确不做**（后续站点）：说话人分离、词级时间戳、翻译、TTS 配音。

### 执行者须知（必读）

1. **开工前先过并行护栏**（见 §3 Stage 0 第 0 步）：首站未完工时默认停下问用户，未经明确同意不并行。
2. **按 Stage 0 → 4 顺序连续推进**，每站末尾有「完成标志」，达标才进下一站；Stage 5（收尾沉淀）在验收全绿、用户确认后执行。
3. **任何一步连续失败 2 次**：立即停下，向用户报告——失败命令、完整报错、已尝试的两种方案。禁止：盲目重试、跳站、臆造 API、改用其他框架。
4. 本 spec 未覆盖的技术问题：先查 §5 资料；解决不了 → 停下报告。
5. **边执行边留痕**：每完成一个 Stage，向 `output/auto-subtitle-acceptance.md` 追加一节「Stage N 完成」+ 证据（命令 + 关键输出）。这个文件从 Stage 0 就创建，最后长成完整验收报告。
6. 硬约束：
   - **不改** `skills/ppt/`、`skills/humanizer/`、**`skills/video-motion/`** 下的任何文件（首站在施工）
   - **git 提交纪律（并行施工保命条）**：只 `git add` 本站文件（`skills/auto-subtitle/`，Stage 5 再加 README.md / CLAUDE.md），**禁止 `git add -A` / `git add .` / `git commit -a`**——另一个会话的未提交改动可能躺在工作树里， sweeps 式提交会把别人的半成品卷进你的 commit
   - `.venv/` 与 `output/` 已被 .gitignore 覆盖，**不要改 .gitignore**
   - 模型缓存 `~/.cache/huggingface` 天然在仓库外，无需处理
   - 控制台输出全英文（Windows GBK 环境禁非 ASCII print）；写文件一律显式 `encoding="utf-8"`
   - 正式提交信息用 Conventional Commits + 中英文对照，格式见各 Stage

---

## §1 环境事实与已知坑

| 事实 | 说明 |
|---|---|
| 系统 | Windows 11；shell 为 Git Bash / PowerShell，命令按实际 shell 调整 |
| Python | 3.11.9 已在 PATH（ctranslate2 有 3.11 Windows 轮子，零兼容风险）|
| ffmpeg | 9.0 full build 在 PATH，`ffprobe` 可用（核对音频时长用）|
| pip 网络 | 中国网络。安装命令显式带 `-i https://pypi.tuna.tsinghua.edu.cn/simple`（清华镜像）|
| 模型下载 | HuggingFace 默认源在国内不通。`transcribe.py` 内置 `HF_ENDPOINT=https://hf-mirror.com`（见 §2 契约），无需命令行再设。模型缓存 `~/.cache/huggingface`：`small` ≈484MB，`large-v3-turbo` ≈1.6GB。**下载失败 2 次停下报告，不盲试大文件** |
| 输入解码 | faster-whisper 依赖 PyAV 直接吃 mp4/wav/flac 等；万一解码报错，fallback：`ffmpeg -i in.mp4 -vn -ac 1 -ar 16000 out.wav` 再喂 wav |
| 中文语音 | 系统 TTS 有 **Microsoft Huihui Desktop [zh-CN]**，`make_fixture.ps1` 用它离线生成语音测试素材（SAPI 默认输出 22kHz 16bit mono PCM wav，whisper 直接吃）|
| 测试素材 | `output/footage/footage.mp4`——CS2 录像 30.5s，**无语音**（枪声+音乐），做 VAD 负向测试：期望不出幻觉长句 |
| 编码坑 | Python print 全英文；写 JSON/SRT/txt 一律 `encoding="utf-8"`；JSON `ensure_ascii=False` 保留中文可读 |
| 并行坑 | video-motion 首站可能同时施工：见 §0 git 提交纪律 |

---

## §2 目标产物结构与数据契约

```
skills/auto-subtitle/
├── SKILL.md                       # Stage 5 才写，前期建空占位
└── templates/asr/
    ├── requirements.txt           # 单行：faster-whisper（不写死版本）
    ├── make_fixture.ps1           # SAPI 离线生成中文语音测试 wav + 原文 txt
    ├── transcribe.py              # 主脚本：一条命令出 cues.json + srt
    └── .venv/                     # 独立虚拟环境（已 gitignore）
```

测试产物统一落 `output/auto-subtitle-tests/`（已 gitignore）：`fixture-zh.wav` / `fixture-zh.txt` / `fixture-zh.cues.json` / `fixture-zh.srt` / `footage.cues.json` 等。

### 数据契约（与 video-motion 首站逐字对齐，字段不许改）

video-motion 首站 spec（`docs/2026-08-29-video-motion-stage-spec.md` §2）的契约原文：

```ts
export interface SubtitleCue {
  start: number;   // 秒，出现时刻
  end: number;     // 秒，消失时刻
  text: string;    // 单行字幕文本（长句拆成多条 cue）
}
```

本站输出 `*.cues.json`：

```json
{
  "subtitles": [
    { "start": 0.52, "end": 2.31, "text": "大家好，欢迎来到本期视频。" }
  ]
}
```

- `start` / `end` 秒，保留 3 位小数；`text` 已清洗（见管线）；`ensure_ascii=False`，indent 2，UTF-8
- `*.srt` 同内容预览格式：序号从 1 连续递增，时间戳行 `HH:MM:SS,mmm --> HH:MM:SS,mmm`

### transcribe.py CLI 契约

```
.venv/Scripts/python.exe transcribe.py <input.mp4|wav> [--model large-v3-turbo] [--lang zh] [--outdir <dir>]
```

- `--model` 默认 `large-v3-turbo`；`--lang` 默认 `zh`（whisper 语种代码，`en` 等同理）；`--outdir` 缺省 = 输入文件所在目录
- 输出与输入同名换扩展：`<stem>.cues.json` + `<stem>.srt`
- **内部管线（按序实现）**：
  1. **第一行可执行代码**（import faster_whisper 之前）：`os.environ.setdefault("HF_ENDPOINT", "https://hf-mirror.com")` ——把镜像烙进脚本，命令行不用再设
  2. `WhisperModel(args.model, device="cpu", compute_type="int8")`
  3. `segments, info = model.transcribe(str(input), language=args.lang, vad_filter=True, beam_size=5)`
  4. 段落清洗：`text.strip()` → 内部空白折叠为一个空格 → 若 `lang` 为 `zh` 再整体去空格（whisper 中文输出常带多余空格）
  5. 长段切分：单条 `text` > 20 字 → 在标点（。！？；，、）处切，每片 ≤ 20 字（20 字窗口内无标点则硬切 20）；时长按字符数线性内插分配：第 k 片 `start = S + D * (前 k-1 片字符数 / 总字符数)`，`end = S + D * (前 k 片字符数 / 总字符数)`，S/D 为原段起止/时长；切完丢弃句尾标点后的空片
  6. 写双产物 + stdout 英文摘要一行：`segments=N total_audio=XX.Xs model=<model> lang=<lang> out=<outdir>`
- 异常 → print 英文错误 + `sys.exit(1)`；成功退出码 0

### make_fixture.ps1 契约

- `System.Speech.Synthesis`，`SelectVoice("Microsoft Huihui Desktop")`，`SetOutputToWaveFile` 输出 wav
- 5 句固定文本（PromptBuilder 逐句 `AppendText`，句间 `AppendBreak` 1.8 秒静音——给 VAD 留出切段间隙）：

```
1. 大家好，欢迎来到本期视频。
2. 今天我们来看一个智能硬件项目的整体架构。
3. 这个系统分为三层，分别是设备端、服务端和网页端。
4. 设备端每一秒钟上报一次传感器数据，服务端收到后立即转发给所有在线的网页客户端，整体延迟低于两百毫秒。
5. 下一期我们讲语音识别的具体实现，感谢观看。
```

- 同一脚本把 5 句原文写进 `fixture-zh.txt`（UTF-8）——txt 与语音同源，杜绝比对基准漂移；第 4 句 49 字，专门留给长段切分测试
- 产物：`output/auto-subtitle-tests/fixture-zh.wav` + `fixture-zh.txt`；脚本末尾打印时长与文件路径（英文）

---

## §3 分站任务

### Stage 0 · 环境与依赖

0. **并行护栏**：`git log --oneline -30 | grep "Stage 4"` 查首站是否已交 Stage 4（提交信息含 `test(video-motion): Stage 4`）。**未见 → 停下报告用户**：「video-motion 首站仍在施工，本站是否并行？」未经用户明确同意不继续。用户同意并行 → 记录在验收文件里，后续按 §0 提交纪律走
1. 建目录骨架：`skills/auto-subtitle/SKILL.md`（空文件占位）、`skills/auto-subtitle/templates/asr/requirements.txt`（单行 `faster-whisper`）
2. `cd skills/auto-subtitle/templates/asr`，`python -m venv .venv`
3. `.venv/Scripts/python.exe -m pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple`
4. 冒烟测试：`.venv/Scripts/python.exe -c "import faster_whisper, ctranslate2; print('faster-whisper', faster_whisper.__version__, '| ctranslate2', ctranslate2.__version__)"`

**完成标志**：第 4 步打印出两个版本号。创建 `output/auto-subtitle-acceptance.md` 并追加 Stage 0 小节。
**提交**：`git add skills/auto-subtitle` → `feat(auto-subtitle): Stage 0 环境与依赖 / stage 0 env and dependencies`

### Stage 1 · 语音测试素材 + 小模型链路验证

1. 按 §2 契约写 `make_fixture.ps1`，在仓库根运行 → 生成 `output/auto-subtitle-tests/fixture-zh.wav` + `fixture-zh.txt`
2. `ffprobe -v error -show_entries format=duration -of csv=p=0 output/auto-subtitle-tests/fixture-zh.wav` 核对时长在 10–30s 区间（5 句 + 4 段 1.8s 静音的合理范围）
3. 小模型链路验证（临时跑，不落正式脚本）：设置镜像环境变量后用 `small` 模型对 fixture 转写（首次自动下载 ≈484MB），打印全部段文本
4. 肉眼比对打印文本与 `fixture-zh.txt`：大体可读对上即可（硬指标 Stage 4 才算分）

**完成标志**：small 模型转写出可读中文文本。验收文件追加 Stage 1 小节。
**提交**：`git add skills/auto-subtitle` → `feat(auto-subtitle): Stage 1 语音素材与链路验证 / stage 1 speech fixture and pipeline check`

### Stage 2 · 主脚本 transcribe.py

1. 按 §2 契约实现 `transcribe.py`（六步管线、内置 HF 镜像、双产物、退出码）
2. 首跑默认模型 `large-v3-turbo`（首次自动下载 ≈1.6GB，走 hf-mirror；失败 2 次停下报告）：对 fixture 全流程
   `cd skills/auto-subtitle/templates/asr && .venv/Scripts/python.exe transcribe.py ../../../../output/auto-subtitle-tests/fixture-zh.wav --outdir ../../../../output/auto-subtitle-tests`
3. 校验：`.venv/Scripts/python.exe -c "import json; d=json.load(open('../../../../output/auto-subtitle-tests/fixture-zh.cues.json', encoding='utf-8')); print(len(d['subtitles']), 'cues')"` 可解析且段数合理（5 句 ± 切分，预期 5–10 条）

**完成标志**：一条命令同时产出 `.cues.json` 与 `.srt`，JSON 可 `json.load`。验收文件追加 Stage 2 小节。
**提交**：`git add skills/auto-subtitle` → `feat(auto-subtitle): Stage 2 转写主脚本 / stage 2 transcribe script`

### Stage 3 · 正负双向实测

1. **正向**：Stage 2 的 fixture 产物即正向结果，确认双产物齐
2. **负向**：`.venv/Scripts/python.exe transcribe.py ../../../../output/footage/footage.mp4 --lang zh --outdir ../../../../output/auto-subtitle-tests` → 检查 `footage.cues.json`：`subtitles` 应为空数组，或 ≤2 条且每条 ≤10 字（无语音素材不出幻觉长句）
3. **切分**：在 fixture 正向产物里定位第 4 句（49 字）对应的段落——它必须已被切成多条 ≤20 字的 cue，而不是一整条长段
4. 三组结果的命令与关键输出记进验收文件

**完成标志**：三组结果落盘并记录。验收文件追加 Stage 3 小节。
**提交**：`git add skills/auto-subtitle` → `feat(auto-subtitle): Stage 3 正负双向实测 / stage 3 positive and negative tests`

### Stage 4 · Zcode 三级自验收（本站质量闸门）

**L1 程序级**（写一段校验代码跑，逐项记录 PASS/FAIL）：
1. fixture 与 footage 两条转写命令退出码均为 0
2. JSON：`json.load` 通过；`subtitles` 为数组；每条恰有 `start` / `end` / `text` 三字段；`start < end`；条目间 `start` 单调不减；最后一条 `end` ≤ ffprobe 时长 + 1s；数值保留 3 位小数
3. SRT：时间戳行匹配 `^\d{2}:\d{2}:\d{2},\d{3} --> \d{2}:\d{2}:\d{2},\d{3}$`，序号从 1 连续

**L2 准确性核对**（`difflib.SequenceMatcher`，标准库，写脚本算分填表）：
- **整体相似度**：转写全文（所有 `text` 拼接、去标点去空白）vs `fixture-zh.txt` 同样规整后 → 相似度 ≥ **0.85** 判 PASS
- **逐句命中**：5 句原文各自在转写段集合中找最高相似度的段，每句 ≥ **0.70** 判 PASS（段有切分/合并，取 max）
- **负向**：footage 段数 ≤2 且每条 ≤10 字
- **切分**：fixture 产物中不存在 >20 字的 cue
- 核对表落报告：

| 检查项 | 阈值 | 实测 | PASS/FAIL |
|---|---|---|---|
| 整体相似度 | ≥0.85 | | |
| 句1–句5 逐句 | 各≥0.70 | | |
| CS2 负向 | ≤2 段且每条 ≤10 字 | | |
| 长句切分 | 无 >20 字 cue | | |

**L3 验收报告**：`output/auto-subtitle-acceptance.md` 汇总——L1 + L2 全表、两条转写命令的完整输出、结论行（`ALL GREEN` 或红项清单 + 原因）。

**完成标志**：L1 全过、L2 表全 PASS、报告落盘。有红项 → 修脚本/参数（切分逻辑、VAD 参数）重跑重查；连续 2 轮仍有红 → 停下报告。
**提交**：`git add skills/auto-subtitle` → `test(auto-subtitle): Stage 4 三级自验收 / stage 4 three-tier self acceptance`

### Stage 5 · 沉淀与收尾（用户确认验收后执行）

1. **写 `skills/auto-subtitle/SKILL.md`**（流程式结构，对齐 `skills/ppt/SKILL.md` 的写法与验收风格）：
   - frontmatter：`name: auto-subtitle`、`description`（含触发词：自动字幕 / 语音转字幕 / 转写 / 给视频加字幕 / faster-whisper）、`user-invocable: true`
   - 五步：①确认素材与语种（mp4/wav 皆可，`--lang zh|en`）②跑转写（venv 激活与否都给命令；模型默认 `large-v3-turbo`，快速验证可 `--model small`）③三级核查（L1 JSON/SRT 格式、L2 与已知文本比对或抽听核对、L3 结论行）④交付（`cues.json` 路径；`subtitles` 数组直接粘进 video-motion 工程 `src/cues.ts` 的 `cues.subtitles` 即用）⑤复跑命令留档
2. 建 junction（PowerShell，`.claude/skills/` 已 gitignore，junction 不入库）：
   ```powershell
   New-Item -ItemType Directory -Force C:\Users\TimeCraker\Desktop\my_workspace\vibe-studio\.claude\skills | Out-Null
   New-Item -ItemType Junction -Path C:\Users\TimeCraker\Desktop\my_workspace\vibe-studio\.claude\skills\auto-subtitle -Target C:\Users\TimeCraker\Desktop\my_workspace\vibe-studio\skills\auto-subtitle | Out-Null
   ```
3. **README.md 与 CLAUDE.md 同步**（改前 `git diff README.md CLAUDE.md` 确认无并行未提交改动，有 → 停下报告）：README Skills 表 `auto-subtitle` 行状态改「已上线」，结构树若有本站条目则核对；CLAUDE.md 定位段同步
4. 提交：`git add skills/auto-subtitle README.md CLAUDE.md` → `feat(auto-subtitle): SKILL.md 与路线图收尾 / skill doc and roadmap finalize`

---

## §4 总验收清单（Claude 复核用）

- [ ] `output/auto-subtitle-tests/fixture-zh.cues.json` + `.srt` 存在，JSON 字段合规
- [ ] fixture 转写整体相似度 ≥0.85（读验收报告，抽查 JSON 内容）
- [ ] CS2 负向产物空或 ≤2 短段，无幻觉长句
- [ ] `output/auto-subtitle-acceptance.md` 存在、与实际产物一致、结论 ALL GREEN
- [ ] Stage 0-4 各有规范 commit，`git log --oneline` 可追溯
- [ ] `git status` 无 `.venv/` / 模型 / wav / json 泄漏（两者已被 .gitignore 覆盖，应天然干净）
- [ ] SKILL.md / README / CLAUDE.md 同步完成（Stage 5 后）

## §5 参考资料

- 总仓库：https://github.com/SYSTRAN/faster-whisper（README：Quickstart API、GPU/CPU 基准表、VAD 参数、量化说明）
- 模型镜像：https://hf-mirror.com（`HF_ENDPOINT` 环境变量用法）
- 契约对齐对象：本仓库 `docs/2026-08-29-video-motion-stage-spec.md` §2（SubtitleCue 原文出处）
- 写法对齐对象：`skills/ppt/SKILL.md`（流程结构、验收风格、「设计即代码」纪律）
