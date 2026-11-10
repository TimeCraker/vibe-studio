# 每日 AI 资讯 · 2026-10-24

状态：153.683333秒真人版本已实际导出，58条字幕和12个场景按实际词时间窗重排，媒体技术检查通过；完整审听与人工终审待完成。旧124秒BGM预览保留，不作为新版时长目标或验收证据。

- [口播稿](narration.md)：已按用户反馈重写为无固定时间码的播报稿；录音直接从“各位观众们，大家好，欢迎收看今日AI资讯”开始，不用先空出榜单时间。开场简述Kimi头条与其他资讯，总览名称清单由画面承载；正文先交代新闻主体，再说明具体变化。可以分段录干声，排行榜和音乐后期加入。
- [本期设计](brief.md)、[取舍与核查](selection.md)、[正式事实与分镜](storyboard.json)。
- 输入正本：[edition.json](edition.json)、[claims.json](claims.json)、[素材来源与音乐署名](assets/sources.json)。
- 当前生成物：[两套榜单](ranking.json)、[时间线](timeline.json)、[同步字幕](captions.srt)、[实际录音核对](audio/recording-review.json)。字幕来自本地ASR词窗口，文本已对照稿件，尚待审听。

本期依次是全球ECI TOP15、国产ECI TOP15、资讯总览、Kimi K3.1 Pro头条、Harness²近期工具观察、VoiceStudio工具选读、回顾。原站全球/国内前15均现场核过，采用同源开源快照两位原始数值，更新时间为北京时间09:52:45。K3.1 Pro尚无ECI，不用K3的分数替代。

## 真人版本与重建

输出为 `render/daily-ai-news-2026-10-24-narrated.mp4`，1920×1080、原生60fps、9221帧/153.683333秒，有用户人声及Carefree配乐。封面为 `render/cover.png`；24秒局部短片为 `render/daily-ai-news-2026-10-24-narrated-sample.mp4`，对应完整片16至40秒。

原始m4a为 `audio/source/narration-original.m4a`，SHA-256为 `0d3c17d9ab040c30522a02b46a82e3d0f3bb6c8a972f945a19feba82f0f4e082`。只使用原录音0.25至136.92秒，内部不裁切、不加速。16秒排行榜后接入配音，首句从16.25秒起。ASR识别的长任务用词疑点（原录音17至18.08秒/片内32.75至33.83秒）优先审听，未替换或生成声音。

当前job已切换为录音后制作链。narration.md保留当时交付稿；edition.json、script.json、timeline.json和captions.srt已更新为真人版。`build-narrated-inputs.mjs`核对原件哈希并读取已保存的转写校订，绝不覆盖narration.md。旧 `build-inputs.mjs` 只适用于历史估时样片，不在当前目录执行；如需复现旧124秒预览，从products/daily-ai-news-2026-10-24的已归档配方恢复到独立目录。

以下在仓库根PowerShell执行。现有精确版本依赖链接不替换；空目录恢复后由deps按锁文件安装Remotion4.0.533。正常重建复用已保存的ASR结果，不需重新下载模型或调用任何配音服务。

```powershell
node projects/daily-ai-news-2026-10-24/scripts/deps.mjs
python projects/daily-ai-news-2026-10-24/scripts/review-recording.py
node projects/daily-ai-news-2026-10-24/scripts/build-narrated-inputs.mjs
node scripts/studio.mjs audio --project projects/daily-ai-news-2026-10-24 --config audio-voice.json --out audio/voice-clean.wav
node scripts/studio.mjs audio --project projects/daily-ai-news-2026-10-24
node projects/daily-ai-news-2026-10-24/scripts/render.mjs stills
node projects/daily-ai-news-2026-10-24/scripts/render.mjs sample
node projects/daily-ai-news-2026-10-24/scripts/render.mjs video
node scripts/studio.mjs qc --project projects/daily-ai-news-2026-10-24 --video render/daily-ai-news-2026-10-24-narrated.mp4 --srt captions.srt --require-audio --out qa/human/media-report.json
node projects/daily-ai-news-2026-10-24/scripts/prepare-publish.mjs
```

需要重新转写时，先保留原音频、转成16kHz单声道WAV，然后用现有ASR venv执行本期脚本。模型固定上游mobiuslabsgmbh/faster-whisper-large-v3-turbo提交0a363e9161cbc7ed1431c9597a8ceaf0c4f78fcf，model.bin SHA-256为e76620f83d5f5b69efd3d87e3dc180c1bd21df9fbebacfd4335e5e1efcc018da；模型缓存不随作品归档。字幕使用原始词窗口聚合，不使用现成转写入口的段内字数插值。换录音或转写后必须重新人工核对本期分镜映射及校订，不能复用旧时间。

```powershell
ffmpeg -i projects/daily-ai-news-2026-10-24/audio/source/narration-original.m4a -ac 1 -ar 16000 -c:a pcm_s16le -y projects/daily-ai-news-2026-10-24/audio/source/narration-asr.wav
& "$env:USERPROFILE\.cache\vibe-studio\asr-venv\Scripts\python.exe" projects/daily-ai-news-2026-10-24/scripts/transcribe-recording.py --model .cache/asr-models/large-v3-turbo
```

## 交付边界

发布物料仅准备B站横版，见variants.json及exports/bili；没有制作竖屏版本，没有登录、上传或发布。BGM为Carefree，Kevin MacLeod，CC BY4.0；简介保留完整署名、许可链接及音量/裁切调整说明。

技术、已观察画面、审听与用户接受分开记录。新版媒体检查与绑定版本的审稿记录在qa/human；旧qa根报告仅对应124秒预览。完整审听、连续观看和人工音画终审仍待完成。榜单的4至15名以及软件截图细字适合横屏/暂停，不声称小缩图全部可读。

## 真人版本验证

实际MP4为1920×1080、60/1、9221帧/153.683333秒、H264+AAC，16,190,341字节，SHA-256为 `eab466fa9f9f19f66515500310c68c7646dc7c08653b709e64af6d4e7d977272`。完整解码通过，无黑片，58条字幕无顺序/越界/阅读速度错误；最终AAC为-15.92LUFS、-1.30dBTP。阅读静止区警告保留，技术检查不能证明观看节奏获接受。

已查看实际MP4的7/15/34/65/104/127/140秒单帧和接触表；短片与整片有浏览器播放抽查，未完整连续审阅或审听。27秒起0.3秒解码18帧，18个帧哈希不同。字幕对照稿件规整后相似度99.25%，该数值是文本检查，不是听感或逐音素同步认证。新报告在qa/human，并绑定上述视频哈希；声音、同步、叙事与事实终审保留待审。

23项现有测试、类型/语法检查、分镜校验通过。稿件校验有“首先”“最后”两个词表提醒，保留用户实际朗读词，不为消除提醒改写录音。投稿仅离线预检通过，没有打开账号或上传。

## 本版保全

真人版保存在products/daily-ai-news-2026-10-24-narrated-r1，实际校验与恢复状态见该作品根README。旧products/daily-ai-news-2026-10-24/archive.json保持原124秒BGM快照。原始m4a、采用音轨、混音与成片在作品media/deliverables中另备份；这些大媒体不随Git克隆自动取得。

## 历史124秒BGM预览验证

最终MP4：7440帧、124秒、60/1、H264+AAC，SHA-256为`6b04c5e39ad9bcd5d677e6129e4fff46fa7306f3dcffe4d6f51c0f21939a4fd7`。完整解码通过，无全黑片；44条字幕无顺序/越界/阅读速度错误；26.15秒起0.3秒实际解码18帧，18个哈希均不同。

实际MP4已查7、15、34、97、112秒抽帧和接触表；浏览器也播放过最终文件，但这些不算全片连续审阅。BGM为-25.27 LUFS、真峰值-7.96dBTP；因为尚无人声并保留背景音乐电平，技术报告保留低于默认节目响度和静止阅读区间警告，未放宽阈值。

Windows长片的逐帧volume回调在最后音频处理中失败，现改为audio-post预合成开场/正文音乐电平与淡化；Remotion原生60fps渲染画面，FFmpeg复制视频流合入实际混音。没有末端复制帧提速。job可离线预检，分步实际执行，不能把它写成已跑过完整一键发布流程。
