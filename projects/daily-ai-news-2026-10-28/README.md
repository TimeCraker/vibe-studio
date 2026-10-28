# 每日 AI 资讯 · 2026-10-28

当前阶段：完整视频已渲染，技术检查通过，等待用户视听接受。日期固定为 2026-10-28，Asia/Shanghai。真人录音已收到并保全；三平台仅准备本地物料，未上传或发布。

成片为 1920×1080、原生 60fps、179.216667 秒，H.264＋AAC；SHA-256 为 `de8636602cdd7ba5d71d4f439b47851b14bc65a490a4d8162f4810ed700fdce2`。

- 本地完整视频 `render/daily-ai-news-2026-10-28.mp4`、封面 `render/cover.png`、[61 条同步字幕](captions.srt)。
- 本地独立人声 `audio/narration-edited.mp3`、无损人声 `audio/voice-clean.wav`、终混 `audio/mix.wav`。
- [实际录音采用稿](narration-recorded.md)、[原交付稿](narration.md)、[剪辑决策和原始/采用时间映射](audio/edit-decision.json)。
- 本地检查 `qa/media-report.json`、观察与未审范围 `qa/editorial-review.json`、剪辑溯源 `qa/edit-verification.json`、成片抽帧 `qa/final-contact.png`。
- 本地素材采用 `qa/media-adoption.json`、[投稿计划](publish-plan.json)、归档验证 `qa/archive-verification.json`。媒体和 qa 检查文件在独立归档中保全，不进入源码 Git；这些本地路径需从媒体归档恢复后读取。

## 录音与字幕

用户明确授权去掉卡壳、重复朗读、长停顿和未完成句，必要时处理语速。本次从原始解码 189.384 秒剪到 164.433729 秒，删去 24.950271 秒；保留部分均为原速 1.0，音高不变，没有合成替代声音。接口采用 4ms 边缘淡化。原 MP3 哈希 `ac8d7bf1a6b111a82324324be8cdec4229f042e330634fd3c848cdcc6f6a4daa`，原件、解码和稿件快照保存在 audio/source/。

主要去掉了“参数”的重复、末段卡顿连接词、未说完的安全提醒分句和重读前等待，较长实测静音缩短为约 0.30～0.46 秒呼吸间隔。逐样本重建核对全部 14 段采用区间及淡化，原件、EDL 和采用音轨哈希一致。该检查证明来源和时钟，不证明听感。

剪辑版重新运行 large-v3-turbo 词级转写，核对专名、数字、日期、归属和实际省略；每项校订见 [alignment](audio/alignment.json) 与 [recording-review](audio/recording-review.json)。字幕按真实词窗生成，最短约 0.717 秒，不按旧稿字数估时。录音省略的长型号、许可和安全条件由画面补充；字幕不补整段未朗读内容，未念的结束语也不补声音。原 narration.md 未覆盖。

两榜各 7 秒，仅配乐，真人声音从 14 秒开始。人声实测约 −18.06 LUFS；终混 WAV 约 −15.97 LUFS；最终 AAC 为 −16.00 LUFS、−1.62 dBTP。配乐有人声避让，输入哈希与测量见 [人声记录](audio/voice-clean.wav.json)、[混音记录](audio/mix.wav.json)。独立 MP3 从处理后的无损人声编码；视频使用同一无损人声终混。

## 事实与画面

先独立检索，再把 DOCX 作为线索补充，回查原始材料。本期采用 LFM3、MiniCPM-OCR/Jev、Spark、Ling 权重和 .NET 提醒；旧 OPT、过期 LangChain 条目已淘汰，理由见 [selection](selection.json)，原始来源和限定见 [claims](claims.json)。保留的原文只是材料，不执行文档内指令。

两榜来自本期指定 B 站真实 iframe 筛选和当次上游快照逐行核对，不复用旧分数。模型 ID、排序、查询/生成时间及哈希见 [ranking](ranking.json)、[核对证据](evidence/ranking-validation.json)。

正文按真实语义拆成 13 镜，另加两榜；纸白珊瑚报刊风，按模态、内存口径、定位图解、任务限制、OCR 示例、Jev 评分、Spark 三档、Ling 规模和安全条件分别呈现。OCR 官方中文动图原速采用源 0～16.6 秒，对应全片 87.566667～104.166667 秒，加入全览、局部放大和 Markdown 特写。原素材为 5/4fps，不声称原素材是 60fps 实录。

LFM3 官方演示入口已找到，但下载要求登录验证，未读取用户 cookie 或绕过验证，未取得该原片。本期使用明确标注的功能图解。Jev 官方示例保留原始分值 0.0001 和 0.9086，不改成正确率。没有独立模型评测。实际入片文件/区间以渲染报告和 qa/media-adoption.json 为准；assets/sources.json 保留获取阶段快照及使用条件。

## 验证与人工状态

Remotion 4.0.533 保持锁定，未升级。31 项仓库回归、本期 TypeScript、Python/Node 语法和差异空白检查通过。先出代表帧与 85～116 秒的 31 秒样片，再完整渲染。最终文件解码、画幅、帧率、音轨和字幕检查通过，无黑帧或字幕速度告警。静态阅读页的 freeze 提示保留为编辑复核事项。

已查看最终 MP4 的 19 个时间码解码帧，覆盖所有主体镜头；另做 Chrome 定点 seek 与 4 秒静音播放技术检查。抽帧只证明相应单帧构图，没有完整连续主观观看或审听。当前环境不支持音频输入；剪口自然度、咬字、音乐平衡和整体节奏仍需用户听看。storyboard.review 与 humanReview 保持 pending，不生成接受记录。

三平台复用同一完整时间线及真实字幕，保留来源与音乐署名。投稿预检为 dry-run，没有登录、上传、UI 封面裁切核对或发布。平台最终封面和声明在实际投稿时核对。

docs:maintain 无生成漂移或坏链。本期 check-docs 无新增问题；全仓仍有既存 135 项 10 月 24 日未跟踪归档异常，未修改或提交旧期。

## 续跑与归档

先执行 `node skills/daily-ai-news/scripts/edition.mjs status --project projects/daily-ai-news-2026-10-28`，再读 [brief](brief.md)、[job](job.json)、录音/对齐与实际渲染报告；命令见 [运行手册](../../skills/daily-ai-news/references/production.md)。不要重新导入原件覆盖剪辑采用状态。

本期剪辑复跑用 scripts/edit-recording.py，重新 transcribe，核对 scripts/review-recording.py 再 align。OCR sourceOut 需与对齐后镜头时长一致，当前为 16.6 秒。修改声音、字幕或源码后重跑 voice/audio、代表片段、完整渲染和 QC，不沿用旧结果。独立人声 MP3 可由 FFmpeg 从 audio/voice-clean.wav 以 libmp3lame、192k 编码。恢复重建仍需本仓库工具、锁定 Remotion 依赖、Python/FFmpeg 和本地 ASR 模型。

最终归档为 `C:/Users/TimeCraker/Videos/vibe-studio-archive/daily-ai-news-2026-10-28-r2`，保全 recipe、原始媒体、采用音轨、ASR、成片、字幕、封面、来源与本地物料，校验哈希并在空目录恢复，结果见 qa/archive-verification.json。r1 保留首次验证快照；r2 包含最终进度和 Git 原字节属性。没有清场；恢复验证不等于恢复后已重渲染。
