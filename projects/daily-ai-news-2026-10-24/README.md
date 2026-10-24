# 每日 AI 资讯 · 2026-10-24

状态：口播稿已交付，等待用户真人录音。此前124秒BGM画面预览已导出、技术检查通过；它不是可直接发布的正式成片，也不是后续录音的时长目标。用户认可上一期重制风格，本期已根据Studio反馈加快节奏、补足相关新闻图片。新闻条数和最终片长仍由内容及真人录音决定。

- [口播稿](narration.md)：已改为无固定时间码的自然朗读稿；录音直接从“大家好，欢迎收看今日AI资讯”开始，不用先空出榜单时间。可以分段录干声，排行榜和音乐后期加入。
- [本期设计](brief.md)、[取舍与核查](selection.md)、[正式事实与分镜](storyboard.json)。
- 输入正本：[edition.json](edition.json)、[claims.json](claims.json)、[素材来源与音乐署名](assets/sources.json)。
- 生成物：[两套榜单](ranking.json)、[时间线](timeline.json)、[粗排字幕](captions-preview.srt)。字幕没有ASR或真人对齐，录音回来再校准。

本期依次是全球ECI TOP15、国产ECI TOP15、资讯总览、Kimi K3.1 Pro头条、Harness²近期工具观察、VoiceStudio工具选读、回顾。原站全球/国内前15均现场核过，采用同源开源快照两位原始数值，更新时间为北京时间09:52:45。K3.1 Pro尚无ECI，不用K3的分数替代。

## 预览与重建

2026-10-24用户确认后续默认先交稿、真人录音，再按音轨制作字幕与视频。当前narration.md为录音交接稿；edition.json、script.json、timeline.json、job.json及粗排字幕仍属于旧BGM预览配方，未按新稿和真人录音重建，不能当作当前同步成片。不要为等待录音重复导出整片。

下列命令用于旧预览重建；其中build-inputs会覆盖narration.md。需要复现历史样片时使用products中的已归档配方或独立恢复目录，不在当前录音交接目录直接重跑覆盖稿件。收到录音后先核对采用文本，再更新输入与时序。已归档的124秒预览保持历史快照。

成片输出为 `render/daily-ai-news-2026-10-24-bgm-preview.mp4`，1920×1080、原生60fps、124秒，有Carefree配乐，无人声。封面是 `render/cover.png`。前期171秒版已停止导出，不作为本期交付。24秒样片是正文16至40秒的局部，不是完整视频。

以下命令在仓库根PowerShell执行；本机依赖复用了前一期同锁版本的node_modules链接。依赖步骤会核对已有精确版本并保留本机链接；从空目录恢复缺依赖时运行scripts/deps.mjs，自动按本期package-lock执行npm ci，不升级Remotion4.0.533。原始证据和媒体随archive保全，Git工作区刻意不提交音乐和大证据缓存。

```powershell
node projects/daily-ai-news-2026-10-24/scripts/deps.mjs
node projects/daily-ai-news-2026-10-24/scripts/build-inputs.mjs
node scripts/studio.mjs audio --project projects/daily-ai-news-2026-10-24
node projects/daily-ai-news-2026-10-24/scripts/render.mjs stills
node projects/daily-ai-news-2026-10-24/scripts/render.mjs sample
node projects/daily-ai-news-2026-10-24/scripts/render.mjs video
node scripts/studio.mjs qc --project projects/daily-ai-news-2026-10-24 --video render/daily-ai-news-2026-10-24-bgm-preview.mp4 --srt captions-preview.srt --require-audio
```

`build-inputs`使用本期保存的evidence/models.json，不联网刷新榜单；读取edition.json的语速/时长意图，生成分镜、稿件、时间线、字幕与音频配置。它不生成真人声音，不声称读速估计等于对齐。若新闻/稿件改动，按job.json声明的依赖重跑相关步骤。日更不是把日期换掉后复用这些事实。

## 交付边界

发布物料仅准备B站横版，见variants.json及exports/bili；没有制作竖屏版本，没有登录、上传或发布。BGM为Carefree，Kevin MacLeod，CC BY4.0；简介保留完整署名、许可链接及音量/裁切调整说明。

技术、已观察画面、审听与用户接受分开记录。完整媒体技术检查与绑定版本的审稿记录在qa；BGM审听和真人音画同步仍待完成。榜单的4至15名以及软件截图细字适合横屏/暂停，不声称小缩图全部可读。

## 本次验证

最终MP4：7440帧、124秒、60/1、H264+AAC，SHA-256为`6b04c5e39ad9bcd5d677e6129e4fff46fa7306f3dcffe4d6f51c0f21939a4fd7`。完整解码通过，无全黑片；44条字幕无顺序/越界/阅读速度错误；26.15秒起0.3秒实际解码18帧，18个哈希均不同。

实际MP4已查7、15、34、97、112秒抽帧和接触表；浏览器也播放过最终文件，但这些不算全片连续审阅。BGM为-25.27 LUFS、真峰值-7.96dBTP；因为尚无人声并保留背景音乐电平，技术报告保留低于默认节目响度和静止阅读区间警告，未放宽阈值。

Windows长片的逐帧volume回调在最后音频处理中失败，现改为audio-post预合成开场/正文音乐电平与淡化；Remotion原生60fps渲染画面，FFmpeg复制视频流合入实际混音。没有末端复制帧提速。job可离线预检，分步实际执行，不能把它写成已跑过完整一键发布流程。
