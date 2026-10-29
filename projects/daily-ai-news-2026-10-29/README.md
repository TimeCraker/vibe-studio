# 每日 AI 资讯 · 2026-10-29

当前：用户已同意Carbon头条、Clover次重点的方向。两条修订稿已交付，等待真人录音；未制作成片、未上传，视听终审待完成。

[当前口播稿](narration.md)可自然朗读，从问候语开始；榜单只放BGM，不用留空白或追秒。[首轮稿](narration-first-draft.md)已停用，仅保留历史。采用主线、事实、素材分别见[简报](brief.md)、[事实记录](claims.json)、[素材来源](assets/sources.json)。

已保留同一期两套TOP15及官标。Carbon有官方主图、评测表，用于身份与重点比较；尚未取得对应功能演示视频。Clover有真实官方桌面演示，拟用26至42秒结果段；其另一段带加速的WebMCP演示继续备用，不强行加入。所有素材尚未剪入成片。

本期content.json的presentation是镜头意图，尚未实现的图解和局部比较须在录音后本期代码落实并实际渲染。Carbon长段要随语义拆镜或分步更新要点，不能整段停在一张文字页。目标仍是纸白珊瑚报刊风、原生1920×1080、60fps。

接手命令：

```powershell
node skills/daily-ai-news/scripts/edition.mjs status --project projects/daily-ai-news-2026-10-29
node skills/daily-ai-news/scripts/edition.mjs check --project projects/daily-ai-news-2026-10-29 --phase script
node skills/daily-ai-news/scripts/edition.mjs recording --project projects/daily-ai-news-2026-10-29 --file "用户录音绝对路径"
node skills/daily-ai-news/scripts/edition.mjs transcribe --project projects/daily-ai-news-2026-10-29
```

核对转写与实际改词后，填写audio/alignment.json，更新content.json的真实连续词anchor，再按[运行手册](../../skills/daily-ai-news/references/production.md)align。prepare-editorial.py现在只从现有采用内容派生稿件结构，不重写口播、选题或榜单，收到录音后禁止用它重新生成草稿。精确时长、字幕和镜头切点以录音为准。

修订稿script阶段检查和口播校验通过，无失败/警告；此项不代替内容或视听接受。两条源视频此前已完整解码、看过关键帧。正式成品后统一archive到products，再经finalize验证备份、恢复和差异后清场；当前projects目录是等待录音的在制工程。
