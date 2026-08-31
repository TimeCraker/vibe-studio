---
name: auto-subtitle
description: 音视频自动转写出字幕（faster-whisper 本地推理）。mp4/wav/flac 进、cues.json + srt 双产物出，字段与 video-motion SubtitleCue 逐字对齐；词级时间戳对齐真实语音窗口、长句自动切分、VAD 过滤使无语音素材不产幻觉。用户说「自动字幕 / 语音转字幕 / 转写 / 给视频加字幕 / faster-whisper / 出字幕文件」时使用。
user-invocable: true
---

# auto-subtitle — 音视频自动转写出 SubtitleCue

**一条命令出字幕**：音视频文件进，`<同名>.cues.json` + `<同名>.srt` 双产物出。数据契约与 video-motion `SubtitleCue` 逐字对齐：`{start, end, text}`，秒、3 位小数、单行文本（长句已拆条）——`subtitles` 数组可直接进 video-motion 时间轴。

## Step 1 · 确认素材与语种

- mp4 / wav / flac 皆可（PyAV 直解）。解码报错 → 先转码再喂：`ffmpeg -i in.mp4 -vn -ac 1 -ar 16000 out.wav`
- 确认语种并传 `--lang`：`zh`（默认）/ `en` 等 whisper 语种代码
- **纯音乐/音效素材不用跑**：VAD 会滤出空或极短产物（这是特性不是故障）
- 素材有已知文本（口播稿 / 台词 / 原文）先留档 UTF-8——Step 3 L2 比对的基准，杜绝基准漂移

## Step 2 · 跑转写

venv 已随仓库建好（`templates/asr/.venv`）。重建：`python -m venv .venv` + `.venv/Scripts/python.exe -m pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple`。

```powershell
cd skills/auto-subtitle/templates/asr
.venv\Scripts\python.exe transcribe.py <输入.mp4|wav> --outdir <输出目录>
```

- 模型默认 `large-v3-turbo`（≈1.6GB 首次自动下载，中文质量线）；快速验证加 `--model small`（≈484MB）。模型缓存在 `~/.cache/huggingface`，下载一次全局复用
- **模型下载失败时设 `HF_ENDPOINT` 换源**：默认官方直连（2026-08 实测通）；备用如 `$env:HF_ENDPOINT="https://hf-mirror.com"`（注意：hub 1.x 下该镜像存在 308 回源兼容问题，优先官方）
- stdout 一行英文摘要 `segments=N cues=M total_audio=... model=... lang=... out=...`；exit 0 成功、1 失败

## Step 3 · 三级核查（必做，不可跳）

**L1 程序级**：JSON 可 `json.load`；`subtitles` 是数组且每条恰有 `start`/`end`/`text` 三字段；`start < end` 且跨条单调不减；数值 3 位小数；最后一条 `end` ≤ ffprobe 时长 + 1s。SRT 时间戳行匹配 `HH:MM:SS,mmm --> HH:MM:SS,mmm`，序号从 1 连续。

**L2 准确性**：有已知文本 → `difflib.SequenceMatcher` 比对（双方先去标点去空白规整），整体相似度 ≥0.85、逐句 ≥0.70（对连续 cue 拼接窗口取 max，覆盖切分/合并）；无已知文本 → 抽听首 / 中 / 尾三段核对。

**L2.5 时间轴**（常规检查）：**字幕窗口必须对齐词级语音窗口，句间静音不得有字幕**——审计相邻 cue 的间隙：句间应出现 >1s 的真实静音间隙（句内切分 gap=0 属正常）；不得存在 <0.3s 闪现碎片；首条 start 对齐语音起点、末条 end 不吞尾静音。脚本内部已用词级时间戳（首词 start / 末词 end）定窗口，此步是产物级验证。

**L3 结论行**：全过 = `ALL GREEN`；有红项 → 修切分 / VAD 参数重跑重查，连续 2 轮红 → 停下报告，禁盲调。

## Step 4 · 交付

- 报告：`cues.json` 绝对路径 + cue 数 + 音频时长 + 模型/语种 + 三级核查结论
- **video-motion 对接**：`subtitles` 数组直接粘进 video-motion 工程 `src/cues.ts` 的 `cues.subtitles` 即用，字段零转换
- 明确不做（后续站点）：说话人分离、词级时间戳导出、翻译、TTS 配音

## Step 5 · 复跑命令留档

交付报告末尾附完整复跑命令（输入路径 / `--lang` / `--outdir` / `--model`），保证下个会话或他人可精确复现；产物（cues.json / srt）落产出区（本仓 `products/`，跨仓库用项目根 `output/`）不进 git，命令即资产。

## 边界与坑

- GBK 控制台：脚本 print 全英文；写文件一律显式 `encoding="utf-8"`，JSON `ensure_ascii=False`
- 切分规则：单条 >20 字在标点（。！？；，、）处切，窗口内无标点硬切且尾片保底 3 字（防 1 字碎片）；<0.3s 碎片并前条，合并不破 20 字上限
- 词级时间戳是字幕窗口的唯一正确来源——段级时间戳会吞句间静音导致字幕提前约一个静音段（已修，勿回退 `word_timestamps=False`）
- CPU int8 推理：28s 音频 ≈1 分钟内出结果，长音频按比例估时；large-v3-turbo 首跑含下载，留足超时
- 中文识别里数字常转阿拉伯（「两百毫秒」→「200毫秒」），L2 比对时的正常差异，不算识别错误
