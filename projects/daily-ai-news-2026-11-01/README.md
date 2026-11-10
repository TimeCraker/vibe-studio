# 每日 AI 资讯 · 2026-11-01

当前：**真人录音已收、已剪口、已对齐、已渲出成片，等人工审听与终审**。没有归档，没有投稿。

- 成片：`render/daily-ai-news-2026-11-01.mp4`，1920×1080、60fps、11025 帧、183.75 秒，SHA-256 `dbaee59a5fe762f24e99be9925f40f3105fb84a25010ca07d941721cddf63fc6`。
- 字幕：[captions.srt](captions.srt)，71 条，来自实际词窗。
- 录音：[audio/edit-decision.json](audio/edit-decision.json) 记录 7 处剪口与保留区间；采用轨 `audio/source/narration-adopted-v1.wav`，169.07 秒，原件与未剪解码都保留。
- 实际朗读稿：[narration-recorded.md](narration-recorded.md)；交付稿 [narration.md](narration.md) 未被覆盖。
- 取舍：[selection.json](selection.json)：独立检索两轮在前，飞书文档补充在后，逐条写了入选理由与淘汰原因。
- 事实：[claims.json](claims.json)，15 条全部 `verified`，每条有 URL 与定位段。
- 榜单：[ranking.json](ranking.json)，全球与国产各 15 条，原始快照 `evidence/ranking-upstream.json`，实际核对过程见 [evidence/browser-observations.md](evidence/browser-observations.md)。
- 素材正本：[assets/sources.json](assets/sources.json)。官标 8 个、Mol-1 官方图 2 张、字体 2 个、BGM 1 首，逐项有哈希与使用条件。实际文件在 `assets/` 下，按 `.gitignore` 不入库。
- 画面意图与进度：[brief.md](brief.md)。

## 本期做了什么

独立检索覆盖 10 月 30 日至 11 月 1 日的模型、产品、开源与安全方向，再读用户给的飞书文档作补充。入选三条：DeepSeek 开源 Super-agent 原型（头条）、Apple 智能国行接入阿里千问（次重点）、国产 Mol-1 开源生物分子模型（简讯）。

两条看起来是当天大消息的模型发布（GPT-6.1 Terra、Gemini 4 Carbon）回查后分别是 10 月 26 日和 28 日的发布，已在 [10-27](../daily-ai-news-2026-10-27/narration.md) 与 [10-29](../daily-ai-news-2026-10-29/selection.json) 两期做过头条，本期不重复首发。文档 Top3 里的 GitLab CVE 截止日核实成立，但它是运维截止提醒、不是技术突破，进 `rejected` 并写明理由。

本期之后，栏目的选题标准已放宽到不限于 AI（材料、能源、芯片、生物医药等前沿突破和影响面大的民生变革同样可入选），见 [SKILL.md](../../skills/daily-ai-news/SKILL.md) 与 [Stage Spec](../../docs/2026-10-23-daily-ai-news-spec.md)。本期三条恰好都是 AI，没有因此删减。

## 录音剪口

原件 185.73 秒，剪掉 16.66 秒，采用轨 169.07 秒，未变速。

| 位置（原件秒） | 内容 | 处理 |
|---|---|---|
| 14.20 到 15.58 | “Apple 智能”后没说完的“订入” | 剪掉，接“接入了阿里千问” |
| 64.18 到 68.02 | “看门狗”后“专门 / 这个 watchdog / 这个”三遍重来 | 剪掉，接第三遍“专门盯每个任务” |
| 72.60 到 73.88 | 只有“文章”两个字的假起手 | 剪掉 |
| 105.29 到 106.60 | 第一次“国航版”没接下去 | 剪掉，接“国行版 Apple 智能要来了” |
| 146.88 到 150.65 | “国内的”之后 3.7 秒空停 | 剪掉 |
| 0 到 0.40 / 181.05 到 185.73 | 片头准备声、片尾余音 | 剪掉 |

第一版有两处剪点切进了字里：68 秒前切在“watchdog”尾巴，106.83 切在“国”的起音上，采用轨分别被识别成“做个专门钉”“行版”。已分别改到 68.02 和 106.60，重新识别为“看门狗，专门钉每一个任务”“国行版 Apple 智能要来了”。

## 实际录音与原稿的差异

三处删减、一处改写，都是用户朗读时的取舍，未补录：

1. 少了“开不开由你自己决定”。
2. 机型只说“需要是 iPhone 16 之后，然后相关的较新的系列”，没有念 Duo、15 Pro 系列和 Air；后面的“Siri 和设备语言要设成中文加英文”“不含下一代 Siri AI，其他功能后面再放”整句没录。
3. Mol-1 的公司名与模型名没念出来，实际是“国内的开源这个模型，权重和代码都放出来了”。

这些事实仍在 `claims.json` 和画面上，只是这一版口播没有覆盖。要不要补录这三句由用户决定。

## 接手

```powershell
node skills/daily-ai-news/scripts/edition.mjs status --project projects/daily-ai-news-2026-11-01
node skills/daily-ai-news/scripts/edition.mjs check --project projects/daily-ai-news-2026-11-01 --phase delivery
```

返修时改 `content.json` 或场景后再跑 `render --mode stills` 与 `--mode video`；改录音要重走 recording → transcribe → align，不能沿用旧时间码。

## 本次实际检查

| 命令 | 结果 |
|---|---|
| `check --phase script` | 0 错误 0 警告 |
| `check --phase render` | 0 错误；1 条预期警告（未使用视频片段，本期用图片与图解） |
| `check --phase delivery` | 0 错误；2 条警告（同上，以及“技术通过不等于人工接受”） |
| `align` | 12 场景、71 条字幕、183.75 秒，与原稿相似度 0.8622 |
| `qc` | 1920×1080 / 60fps / 183.75 秒；混音 -15.9 LUFS、-2.0 dBTP |
| `npm test` | 43/43 |

## 没有做的事

- 没有人耳审听剪口，没有连续看片，没有人工终审。剪点靠能量包络和词窗判断，执行者听不到声音。
- 没有归档，没有投稿，没有登录平台。
- 苹果侧的官方稿件页没有直接读到，依据是央广网转述的阿里公告与 IT之家转述的苹果公布内容。
- 字幕里有少量 ASR 遗留的连写，如“DeepSeekHarness团队”“iPhone16”，不影响理解但可再校。

## Codex 复核：用户要求返修

本次用户明确表示对视频不满意，要求返修选题编辑、文案、素材、画面动效和声音。对应版本仍为上文 SHA-256 `dbaee59a5fe762f24e99be9925f40f3105fb84a25010ca07d941721cddf63fc6`，原成片未被替换；技术通过，栏目质量不接受该版为最终稿。

实际查看了12场景的MP4抽帧，并与10月28日的7个场景抽帧、制作源码及素材记录对照。60–81秒架构图意图只呈现为文字列表，81–95秒关键数字埋在小字中；DeepSeek与千问官标合计占据约49.7秒镜头的主视觉；Mol-1双图没有按核心比较做特写。当前工程没有入片录像，也没有按主要新闻留下演示渠道搜索/失败替代记录，不能据此断言没有相关录像。最终只入选3条，初稿“全选”的过程不能从现存工程还原；brief记载初稿329.9秒，经两次用户要求后压至约197秒，说明第一稿编辑不足。

原声音处理仅65Hz低切与归一化，没有频谱降噪。独立生成了同等人声音量、无BGM的22秒前后对照：`qa/codex-review/before-22s.mp3`、`qa/codex-review/after-22s.mp3`。轻度处理参数、源哈希与客观结果在`qa/codex-review/comparison.json`；13个ASR空隙候选区间的电平下降中位数约2.37dB，但空隙可能含呼吸或漏词，不视为纯底噪或听感通过。未将试听替换入成片，未实际审听。

审稿输入与实际版本绑定的观察为`qa/codex-review/inspection-input.json`、`qa/codex-review/editorial-review.json`；抽帧与对照接触表在同目录。完整连续看片、音画同步、音质自然度及逐条外部事实复查仍待完成。brief早期2/5与“没有成片”说明已过时，当前交接以本README与实际文件为准。

下一步先返修架构/数据/素材代表镜头并审查试听，再决定整片重渲染；不改变已录内容和新闻选择来掩盖问题。相关技能修复与验证范围见`docs/2026-10-28-daily-ai-news-handoff-spec.md`（从仓库根读取）。
