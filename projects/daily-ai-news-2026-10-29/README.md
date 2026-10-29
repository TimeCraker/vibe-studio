# 每日 AI 资讯 · 2026-10-29

当前阶段：选题与视听素材返修，暂缓录音。用户明确反馈两方面质量均不足，首轮稿件不作为可直接录制的采用稿。未生成配音、时间线或成片；未上传。

首轮内容已撤回采用：Clover、MiniMax工程技能、Expo工具、缓存研究偏开发，素材表现力也不足。重新核到了10月28日Google官方公布的Gemini 4 Carbon，列为新头条候选；Clover降为次重点候选。Expo、缓存研究移出，MiniMax仅在有明确用途与演示时考虑简讯，不凑条数。

[原口播稿](narration.md)保留，不覆盖已交付文本，目前暂不要按该稿录音。先完成新选题及对应画面判断，再交采用稿。两套榜单仍是本期已取得输入。

已取得两套当期TOP15、八家官标、Clover官方图标及评测图、两段官方视频、MCode中文技能地图、Expo官方发布图、论文图、本地字体和有署名记录的BGM。Clover模拟桌面视频2240×1080/30fps/52.83秒，拟用结果段；网页任务视频1280×720/25fps/29.72秒，仅备用，源片含加速。最终图形和字幕按原生1080p60制作，原素材保持自身帧率和源片速度。

素材“已取得”和“已剪入”分开：本期尚未入片。对应记录见 [素材来源](assets/sources.json)；画面构思、选题与核查分别见 [制作简报](brief.md)、[选题记录](selection.json)、[事实输入](claims.json)。本期 content.json 的 presentation 是镜头意图，不表示通用模板已经实现该图解；收到录音后在本期代码落实并实际渲染。

接手先读selection.json的review/proposed与brief.md。selection.decision=pending表示选题尚未采用，script检查当前应阻止向后制作；status仅依据已有稿件可能仍显示waiting-human-recording，不能据该提示要求用户录旧稿。以下录音命令只在新稿明确交付后使用：

```powershell
node skills/daily-ai-news/scripts/edition.mjs status --project projects/daily-ai-news-2026-10-29
node skills/daily-ai-news/scripts/edition.mjs check --project projects/daily-ai-news-2026-10-29 --phase script
node skills/daily-ai-news/scripts/edition.mjs recording --project projects/daily-ai-news-2026-10-29 --file "用户录音绝对路径"
node skills/daily-ai-news/scripts/edition.mjs transcribe --project projects/daily-ai-news-2026-10-29
```

随后核对真实转写，填写audio/alignment.json并把content.json的anchor改成实际连续原词；按[运行手册](../../skills/daily-ai-news/references/production.md)align。narration.md为本次交付稿，不由生成器覆盖；prepare-editorial.py只派生输入和记录，不能擅自改原稿。正文的精确秒数、字幕和剪辑不以估读预算代替。

首轮技术记录：script阶段与口播结构校验曾通过，两段源视频完整解码通过、已看关键帧；这些不代表新闻和画面值得采用。本轮已保存用户否定反馈、原选题历史、新官方来源与两张Carbon候选图；尚未取得Carbon对应功能演示视频，不能拿旧Gemini画面冒充。新稿、分镜、录音、整片、投稿与归档仍待后续完成。

当前是projects内的在制工程。正式视频交付时统一archive到products，finalize验证备份/恢复/差异后清场；不将等录音的草稿写成成品，也不只把外部备份当作正式归档。
