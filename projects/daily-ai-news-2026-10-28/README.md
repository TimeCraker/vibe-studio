# 每日 AI 资讯 · 2026-10-28

当前阶段：口播稿和录音前素材准备完成，等待本期真人录音。日期固定为 2026-10-28，Asia/Shanghai。采用共用初始化与生产入口；不复制上一期新闻、榜单、录音或日期脚本。

先执行 `node skills/daily-ai-news/scripts/edition.mjs status --project projects/daily-ai-news-2026-10-28`，再读[本期稿件](narration.md)、[选题与淘汰理由](selection.json)、[制作简报和进度](brief.md)、[事实来源](claims.json)。后续命令见[运行手册](../../skills/daily-ai-news/references/production.md)。

## 录音前已完成

先进行三轮独立检索，再提取用户提供的日报作为补充线索，随后继续扩搜和回查官方材料。本期采用 LFM3、MiniCPM-OCR/Jev、Spark、Ling 权重开放及 .NET 安全提醒。日报中的 Meta OPT 旧闻、LangChain 过期日期和漏洞评分差异已处理，具体原因只维护在 selection.json，不照抄文档里的运维或迁移指令。

全球／国产 ECI TOP15 均在指定 B 站的实际 iframe 内切换筛选读取，再逐行对照当次下载的上游原始快照。生成时间、真实查询时间、模型 ID、排序和分数证据分别保存在 ranking.json、evidence/ranking-live.json、evidence/ranking-validation.json，保留不同版本、缺分不补分、不编造升降。图标仅复用已核实的官方原文件，未复用旧排名数据。

稿件共 11 个口播段落；script.json 为结构化文稿，content.json 为镜头文字与素材意图。现阶段没有精确字幕和时间线，anchor 仍为空，draftAnchor 不是已核对 ASR。录音后才运行 align 生成实际 storyboard/timeline/captions；不为检查通过而制造假音轨或假时间线。

Remotion 锁定依赖已按共用入口核验为 4.0.533，并复用本机相同版本运行库；未升级依赖。原始 DOCX、含内嵌大图的完整发布网页、GIF／视频、音乐与字体保留在本期本地目录，大文件不入 Git；来源提取文本、获取记录与哈希保留在源码配方，最终媒体归档时还需带上实际输入，不清场。

已取得 MiniCPM-OCR 官方中文示例动图、Jev 质量评分示例、Liquid AI 官方标志与图表，以及沿用的许可 BGM 和本地字体。中文动图原片为 2400×1200、23 帧、18.4 秒，已原速转为 1920×960 的 MP4，帧率仍为原素材的 5/4；不将其声称为原生 60fps 的实机录像。最终栏目输出仍由 Remotion 原生 60fps 制作。已查看实际 0.8 秒对照帧与 Jev 示例，完整成片及视听接受待完成。

LFM3 d1-2B 的匹配官方演示入口已找到，但公开下载要求登录验证，未读取用户 cookie 或绕过登录。另查官方 d1-2B、LFM3-VL-2B 仓库未发现可下载视频，相关社交检索也未取得匹配片段；暂保留来源明确的图解／发布页画面方案。素材状态和采用范围以 assets/sources.json、media-plan.json 为准，找到入口、取得文件、实际入片分开记录，当前没有宣称任何片段已经剪入最终成片。

## 接手与后续

用户可整段或分段录干声，从问候语开始，不录榜单空白、不追秒。若用户先改稿，直接改 narration.md；`projects/daily-ai-news-2026-10-28/scripts/prepare-editorial.py` 只读取稿件，段落数量变化会拒绝未经复核的映射。原稿在录音导入时还会形成独立快照。

```powershell
node skills/daily-ai-news/scripts/edition.mjs recording --project projects/daily-ai-news-2026-10-28 --file "本期录音绝对路径"
node skills/daily-ai-news/scripts/edition.mjs transcribe --project projects/daily-ai-news-2026-10-28
```

随后核对 ASR 名词、数字、实际改词及事实，更新 audio/alignment.json 和 content.json 的实际 anchor，按真实语义调整素材区间；运行 align，再按 job 的 voice/audio/stills/render/qc 步骤推进。OCR 演示宜用宽幅展示，Jev 示例只放当前解释的区域；标题、官标、手机阅读、字幕和镜头节奏留到实际渲染验证。原始示例低帧率保持原速，不擅自拉慢或加速人声。尚未独立评测模型，不将官方例子标成本栏目实测。

本期输出约定为 1920×1080 原生 60fps、纸白珊瑚报刊风；最终长度由实际音轨决定。人工录音、音画终审、登录和最终发布均保留人工状态。未生成成片、未上传或发布，也未把源码备份称为完整媒体归档。

## 验证范围

录音前执行稿件校验、当期 script 检查、原始证据和素材 SHA-256 核对、两榜实际筛选与逐行对照、OCR 转码时长及解码检查。单独的检查输出不能证明事实为真；本期正文由 Agent 逐项阅读保留的原始来源后核对。精确音画同步、完整渲染与媒体 QC 必须等本期录音，不能套用上一期 PASS。

本次 31 项仓库回归通过，稿件校验无错误或警告，script 检查通过；原始来源与素材哈希、Python/JSON/Node 语法和 OCR 完整解码检查通过。docs:maintain 无生成漂移或坏链；check-docs 本期无新增错误，仍有 135 项既有 10 月 24 日未跟踪归档异常，未改动或提交旧期。原始证据与许可文本通过本期 .gitattributes 保留原字节，避免换行归一化破坏来源哈希。
