# 每日 AI 资讯 · 2026-10-30

当前：录音定稿v2已交付，等待用户真人录音。本期从新工程开始；10月29日已按用户指示取消，不续做旧稿。

- 正文：[narration.md](narration.md)为当前采用录音定稿v2；[narration-first-draft.md](narration-first-draft.md)仅供历史对照。从“朗读正文”开始；榜单只放BGM，不用念模型名单。
- 取舍：[selection.json](selection.json)；事实：[claims.json](claims.json)；本期状态：[edition.json](edition.json)。
- 镜头与文案：[content.json](content.json)、[script.json](script.json)。这些是创作输入，尚无正式时间线/字幕或成片。
- 素材正本：[assets/sources.json](assets/sources.json)，实际文件在本期assets下。Pika两段官方样例各15.08秒、有音轨；SFX官网25.8秒视频无音轨，不当声音试听。代表帧在qa，连续视听待审。
- 榜单：[ranking.json](ranking.json)，原始快照evidence/ranking-upstream.json；本次入口与核对见[evidence/browser-observations.md](evidence/browser-observations.md)。不要在录音跨日后静默替换新闻或分数。
- 进度和画面意图：[brief.md](brief.md)，当前3/5。官标、BGM、字体仅复用已校验文件，不复用旧新闻内容。

接手时先读skills/daily-ai-news/SKILL.md及[生产手册](../../skills/daily-ai-news/references/production.md)，运行：

```powershell
node skills/daily-ai-news/scripts/edition.mjs status --project projects/daily-ai-news-2026-10-30
node skills/daily-ai-news/scripts/edition.mjs check --project projects/daily-ai-news-2026-10-30 --phase script
```

收到本期录音后按手册recording → transcribe → 校订/对齐 → align；保留本稿和原音频，实际增删与数字以录音核对，不按估时造字幕。若用户允许局部剪辑，再无损保全原件并记录剪除依据。

content.json的presentation不是自动实现好的场景。按录音在本期remotion-app/src落实必要的图解/对照/视频镜头；先代表帧/短片再1920×1080、60fps完整渲染。模板依赖锁定，不升级。当前不生成TTS，不先导出估时整片。正式交付通过共用archive/finalize归档至products；不把技术检查当成人工接受或发布成功。

本次校验：script阶段无错误/警告，口播校验零失败/零警告；素材20项文件哈希/两榜官标和文稿场景引用一致。仓库测试43/43通过，docs:maintain无新增链接问题。全仓check-docs仍报告既有10月24日产品档案135项未跟踪问题，不属于本期改动，不冒称全仓文档检查通过。

定稿v2：删去独立参数/许可口播页，Mistral聚焦权重开放和一项编程评测；Pika加入耳机与乒乓球两段样例的解说，制作时按录音拆镜；ElevenLabs合并为一条简讯。没有用户录音、字幕或成片。
