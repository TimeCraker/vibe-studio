# 每日 AI 资讯 · 2026-10-27

新会话接手先执行 `node skills/daily-ai-news/scripts/edition.mjs status --project projects/daily-ai-news-2026-10-27`，再读其列出的证据。当前已完成 r2 成片和三平台物料/上传交接：B 站仅用户反馈已投递，抖音与小红书记录为待用户点击发布，尚未独立核验线上结果。下文制作阶段及修订经过保留为历史，最新交接在末尾及 qa/multiplatform-handoff.json。本期沿用自己的 job 与 scripts，不改为新 init 工程；新一期方法见[运行手册](../../skills/daily-ai-news/references/production.md)。

## 本期制作范围与验收

按 [daily-ai-news](../../skills/daily-ai-news/SKILL.md) 续用已确认栏目方案。本期候选来自主动检索与用户指定的[豆包日报](https://feishu.doubao.com/docx/QCE7dxQuroPzwax098Rc3tg2n1e)，文档只作补充线索，事实以当次原始来源核查为准。本次曾先读文档，随后补做独立检索并调整选题；技能已改为日后先独立检索，实际经过见 selection.md。

本阶段先完成新闻筛选、原始证据、当次查询的全球/国产 ECI TOP15、可直接朗读的稿件及素材准备。交稿后等待本期真人录音，收到后再用实际音轨安排字幕、镜头和音乐，不复用上一期录音，不提前输出估时整片。

后续制作沿用纸白＋珊瑚色报刊风、1920×1080、原生 60fps。榜单每行有官标，固定说明为“综合能力评分（ECI），分数越高，模型综合表现越好。”画面页脚只放实际数据查询时间，完整来源和署名保留在来源记录与简介。配乐采用已有许可且适合栏目的轻松 BGM；官方图/演示片段按实际内容取用，不以字卡填满全片。

制作交付进度：5/5。成片与技术检查完成；完整审听、连续观看终审与最终发布仍待用户。

录音制作已完成：采用本期真人 MP3，原件与 SHA-256 保留；原容器约 261 秒，成片 272.75 秒。词级转写与稿件相似度约 0.948，保留“像 Skill”的个人评论与实际改词。按真实词窗口生成 98 条字幕、19 个正文镜头和两页榜单；原生 60fps 已实际渲染，未改变语速。

- [x] N1：主动检索并合并文档线索，核查主要候选及日期，记录采用与淘汰理由。
- [x] N2：当次查询并保存两套 TOP15、原始证据与数据口径。
- [x] N3：准备可照读的连续播报稿及结构化分段稿，核对文案和镜头意图；素材记录区分已取得与候选。
- [x] N4：收到本期录音后保留原件、转写校准，按音轨制作并实际渲染 60fps 视频。
- [x] N5：核查实际视频和字幕、交付待人工审阅版本，保全制作配方与归档。登录和最终发布由用户完成。

旧工程和未提交改动均保留。本期不修改上一期视频，不自动上传或发布。

## 录音前素材准备

用户授权在等待录音时继续准备。验收以本地可读媒体、真实尺寸/时长、来源和镜头对应关系为准；视频片段先标原素材 in/out，最终剪辑长度由真人音轨决定。保留用户正在修改的 narration.md，不提前锁字幕或导出整片。

- [x] M1：补查头条官方视频/动图并实际取得可访问素材；失败时记录替代画面。
- [x] M2：整理本期各条配图、论文与发布状态截图，实际查看并给出裁切/采用判断。
- [x] M3：准备已有许可的 BGM，记录文件与署名；混音和完整审听等待人声。
- [x] M4：保存可续跑的镜头素材映射和缺项，核验文件完整性。

素材准备进度：4/4（包含已记录的视频替代方案）。每条资讯已有本地主要输入，可在收到最终文稿/真人录音后接入制作。高清介绍片非必需依赖，实际成片、字幕、混音和人工终审仍待完成。

## 交接与续跑

朗读正文见 [narration.md](narration.md)，选题理由见 [selection.md](selection.md)，导演意图见 [brief.md](brief.md)。本期真人录音已采用，ASR 字幕与成片已生成；storyboard.json 和 timeline.json 现为实际词窗口与帧时间线。已取得配图、官标和候选视频见 assets/sources.json；Carefree 原文件已复制并核对哈希、许可署名，已混音并做响度与自动避让处理，完整审听仍待用户。

镜头素材对应见 [media-plan.json](media-plan.json)，可查看 [素材预检页](media-preview.html)；需要本地 HTTP 服务时运行 `python -m http.server 3481 --bind 127.0.0.1 --directory projects/daily-ai-news-2026-10-27`。预检页是素材工作台，不是最终视频版式。三张中文解释图的 SVG 正本在 graphics/，PDF 裁切、原始动图转码和来源登记可通过 `python projects/daily-ai-news-2026-10-27/scripts/prepare-media.py` 复现，不在渲染时联网抓素材。新素材检查及访问缺项保留在 qa/media-review.json 与 media-plan.json。

稿件若需要修改，先编辑 narration.md，再运行 `python projects/daily-ai-news-2026-10-27/scripts/prepare-script.py`。它只读取朗读正文，不覆盖交付稿；段落数量改变时必须人工复核镜头映射。可用 `python skills/narration/templates/verify_narration.py projects/daily-ai-news-2026-10-27/script.json` 和 `node skills/content-director/scripts/validate-plan.mjs projects/daily-ai-news-2026-10-27` 检查输入。

收到本期最终文稿/录音后先保留原件、核对实际措辞与事实，再进入转写、字幕校准和 Remotion 制作。用户正在修改 narration.md，本轮素材准备未覆盖或提交这份改动；实际采用文本另存 narration-recorded.md，script/storyboard/timeline 已由实际录音生成。本期 Remotion 工程、job、字幕及混音均已建立；没有沿用旧期语音或估时。prepare-script.py 在采用真人录音后会拒绝覆盖，续改应走实际录音的 review-recording.py 与 build-narrated-inputs.py。

本阶段已检查：首次口播稿及分镜输入校验通过；本轮核对 36 份来源/派生文件哈希、全部镜头输入路径，整段 MP4/MP3 解码通过，Python/SVG/JSON 可读。实际浏览器载入 11 张主图/解释图、备用短片和 BGM，查看三张 SVG 的中文与布局、PDF 裁切及主要来源配图并记录取舍；仓库测试 23/23、文档维护和 diff 空白检查通过。完整 check-docs 仍受既有 10 月 24 日归档未入 Git 的 135 项错误阻塞，与本期新增目录分开记录。素材预检不代表完整视频、混音或人工终审通过。


## 本期成片交付

观看视频 `render/daily-ai-news-2026-10-27.mp4` · 封面 `render/cover.png` · [同步字幕](captions.srt) · [实际录音文本](narration-recorded.md)。1920×1080、60fps、16365 帧，时长 4 分 32.75 秒，约 20.2 MB。

技术报告 `qa/media-report.json`、真实 MP4 抽帧 `qa/render-evidence.json`、声音时间检查 `qa/alignment-report.json`、视听审阅状态 `qa/editorial-review.json`。完整解码、格式、响度与字幕顺序/越界检查通过；首中尾三处波形比对偏移为 0ms。技术提示仍有“静止区间需编辑审阅”，完整连续观看和完整审听没有代填通过。qa/media-review.json 是录音前素材预检，不能当成片检查。

原始录音保存在 audio/source/narration-original.mp3；MP3 解码有坏包提示，原件保留，所有词窗口与混音统一以保留的 48kHz PCM 为时钟。仅去首部 1.15 秒和 259.1 秒后的尾空白，内部停顿与个人评论保留。语义核对、同音用字与专有名词校订保存在 audio/recording-review.json；录音没有念完整英文项目名时由画面明确主体，没有替用户生成声音。

本机 Studio：http://localhost:3482/DailyAI20261027 。锁定 Remotion 4.0.533，未升级旧项目。job.json 已 validate 与 dry-run，各制作命令已逐项执行；没有为了缓存再从头跑完整份 job，也未宣称每日全自动流程全部验证。

复跑顺序：review-recording.py → build-narrated-inputs.py → studio audio（audio-voice.json 输出 audio/voice-clean.wav）→ studio audio（audio.json）→ render.mjs stills/video → media-qc。各脚本均在本期 scripts/ 下，命令从仓库根目录执行。渲染命令：`node projects/daily-ai-news-2026-10-27/scripts/render.mjs video`。原始转写使用 `C:/Users/TimeCraker/.cache/vibe-studio/asr-venv/Scripts/python.exe` 运行本期 `scripts/transcribe-recording.py --model .cache/asr-models/large-v3-turbo`；模型路径相对仓库根目录，输入改变后必须重建解码与 ASR，不能套旧词窗口。

B 站标题、简介、来源署名、封面和同版 98 条 SRT 已准备到 exports/bili/；只做本地派生与投稿 dry-run，未上传、未登录、未发布。

保全入口：`node skills/daily-ai-news/scripts/edition.mjs archive --project projects/daily-ai-news-2026-10-27 --destination <新的未占用备份目录>`。最新已验证归档路径查看 qa/archive-verification.json（目前 r6，201 项恢复）；旧脚本的默认 r2 已占用，不要无参重跑。归档按 recipe / media / deliverables 保留实际输入和 archive.json；工作目录不清场，空目录恢复不代表已重渲染认证。

## 视频片段补齐

首版用户反馈“还可以”并要求发布，随后因没有相关视频片段暂停发布；本期视频尚未上传或发布。

- [x] V1：取得并审看匹配本期口播的官方视频，记录来源、实际起止和用途。
- [x] V2：按现有真人音轨接入适合的片段，渲染局部预览和修订版。
- [x] V3：核查修订版、保存实际媒体及归档，交用户重新审阅。

补齐进度：3/3。修订版技术检查通过，r2 归档已校验并在空目录恢复 186 个文件；用户重新审阅与发布仍待完成。

修订版实际采用 OpenAI 官方视频原片 9.0–22.3 秒，位于成片 00:33.367–00:46.667，展示电车照片到 Blender 建模及结果；1920×1080 / 60fps / 272.75 秒不变，官方源视频为 24fps 并保留原播放速度。独立版本文件为 `render/daily-ai-news-2026-10-27-r2.mp4`，主交付路径也已更新为相同内容；13.3 秒局部预览 `render/daily-ai-news-2026-10-27-footage-preview.mp4` 直接截自完整新版。

修订版完整 AAC 流与首版哈希一致，录音、混音、字幕和时间线未改。新版实际抽帧与检查记录已更新，未冒用首版人工接受；Oracle 视频仍未取得，未宣称每条资讯均已加入视频。发布继续暂停，等待用户看新版。

## B 站投稿交接

用户再次要求发布后，已上传 `render/daily-ai-news-2026-10-27-r2.mp4`，填好标题、简介及来源署名、5 个标签、人工智能分区和“含AI生成内容”声明。平台页面显示上传完成、必填项齐全；最后“立即投稿”仍待用户点击，当前没有发布成功或投稿链接。此前其他视频的旧草稿已保存，未覆盖。

实际使用封面 `render/cover-bili-safe.png`：将 `render/cover.png` 从 1920×1080 等比缩小到 1440×810，居中置于纸色 1440×1080 画布，分别检查平台 4:3 和 16:9 预览。校验材料与视频哈希见 `qa/publish-handoff.json`；该记录只表示已填表，不能当成发布成功。

## 抖音与小红书投稿交接

用户表示 B 站已投递，平台审核与链接尚未独立核验。抖音和小红书均已上传同一版 1080p60 视频，完成标题、简介、素材署名、自定义封面与 AI 内容声明的页面核对；两端仍待用户各自点击发布。抖音横封面使用 `render/cover-bili-safe.png`、竖封面使用 `render/cover-vertical-34.png`；小红书使用同一张 3:4 竖封面。竖封面由[本期绘制脚本](scripts/make-social-cover.py)和本地微软雅黑／Consolas 字体绘制，实际文件另行归档。

两端话题自动插入时曾打断正文链接，已移除话题并重新核对完整正文；最终页面未添加话题。自动填表旧报告的失败状态保留为过程记录，实际手工修复和未发布状态见 `qa/multiplatform-handoff.json`。
