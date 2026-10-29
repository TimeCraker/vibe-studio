# 每日 AI 资讯 · 2026-10-29

当前阶段：口播稿和前置素材已准备，等待用户录音。未生成配音、时间线或成片；未上传。

本期内容：扩散智能 Clover 模型为头条；MiniMax 工程技能、Expo 10月27日新工具、缓存研究为其余精选。新闻条数是本次筛选结果。Expo 旧技能库不作今日首发，未核实的财报、安全或星数不进入稿件。

请先阅读 [口播稿](narration.md)。榜单只放音乐；从问候语开始录，按自然语速，不用为榜单留空白。英文全名和来源主要由画面承担，发音提示放在正文外。稿件约900个汉字，朗读时长仅作预算，最终由实际音轨决定。

已取得两套当期TOP15、八家官标、Clover官方图标及评测图、两段官方视频、MCode中文技能地图、Expo官方发布图、论文图、本地字体和有署名记录的BGM。Clover模拟桌面视频2240×1080/30fps/52.83秒，拟用结果段；网页任务视频1280×720/25fps/29.72秒，仅备用，源片含加速。最终图形和字幕按原生1080p60制作，原素材保持自身帧率和源片速度。

素材“已取得”和“已剪入”分开：本期尚未入片。对应记录见 [素材来源](assets/sources.json)；画面构思、选题与核查分别见 [制作简报](brief.md)、[选题记录](selection.json)、[事实输入](claims.json)。本期 content.json 的 presentation 是镜头意图，不表示通用模板已经实现该图解；收到录音后在本期代码落实并实际渲染。

接手命令：

```powershell
node skills/daily-ai-news/scripts/edition.mjs status --project projects/daily-ai-news-2026-10-29
node skills/daily-ai-news/scripts/edition.mjs check --project projects/daily-ai-news-2026-10-29 --phase script
node skills/daily-ai-news/scripts/edition.mjs recording --project projects/daily-ai-news-2026-10-29 --file "用户录音绝对路径"
node skills/daily-ai-news/scripts/edition.mjs transcribe --project projects/daily-ai-news-2026-10-29
```

随后核对真实转写，填写audio/alignment.json并把content.json的anchor改成实际连续原词；按[运行手册](../../skills/daily-ai-news/references/production.md)align。narration.md为本次交付稿，不由生成器覆盖；prepare-editorial.py只派生输入和记录，不能擅自改原稿。正文的精确秒数、字幕和剪辑不以估读预算代替。

验证：script阶段检查通过；口播结构校验无失败，“最后”两处普通顺序用词警告已人工语义复核。两段源视频完整解码通过、已看关键帧；这不是完整连续审听或用户接受。分镜终审、录音、整片、投稿与归档仍待后续完成。

当前是projects内的在制工程。正式视频交付时统一archive到products，finalize验证备份/恢复/差异后清场；不将等录音的草稿写成成品，也不只把外部备份当作正式归档。
