# 交给 Cursor Grok：制作 2026-10-23 首版 AI 资讯视频

将下方提示词直接发送给打开本仓库的 Cursor Agent。这里授权的是本地首期制作和发布物料准备；实际投稿按后续范围处理。每日入口草案为 [daily-ai-news](../skills/daily-ai-news/SKILL.md)，不是已经验收的自动化脚本。

```text
你现在接手 vibe-studio 的“每日 AI 资讯”栏目。请直接完成第一版可播放视频，不要停在分析、计划、写代码或列出渲染命令。允许先做测试配音和待审样片，做完后再迭代。

工作目录：C:\Users\TimeCraker\Desktop\my_workspace\vibe-studio
本期日期固定为 2026-10-23，Asia/Shanghai；即使执行已跨零点，也制作这一期，不把旧消息改称新日期的今日新闻。
本期主要候选来源：https://feishu.doubao.com/docx/QPPJdrQnrojXtbxrW8RcbQkpndh
开场榜单来源：https://www.bilibili.com/toy/ai-model-world

先读取仓库与工作区 AGENTS.md、README.md，以及以下文件：
1. skills/daily-ai-news/SKILL.md
2. docs/2026-10-23-daily-ai-news-spec.md
3. workflows/explainer-video.md
4. skills/daily-ai-news/references/visual-style.md
检查 Git 状态，保留他人改动。Stage Spec 已有，不再另起一份规划；把首期实现和真实进度补回现有文档。

本轮默认：16:9、1920×1080、30fps，约 3–5 分钟，按有效内容缩短。只交一个横版测试视频及封面、字幕和发布文案，暂不扩三平台、不做定时任务。沿用已确认美术，不再问配色、字体方向或让我先配音。

内容要求：
- 先实际阅读飞书正文，不能只凭链接或标题猜内容；文本抓取失败时尝试浏览器读取，本会话之前已通过浏览器读到过它。确实不可读时保存失败证据，改从当日官方公告取材并说明参考文档未读，不伪称读过。筛出约 3 至 5 条真正重要、有用的新闻，优先大模型、Agent/AI 编程、实用开源，删掉重复和低价值填充。
- 追到官方公告/仓库/原始材料核对关键日期、型号、数字和开放范围。资料不支持的说法删掉；官方宣称和独立验证分开写。提供来源和核查记录，不把 AI 摘要自动当事实。
- 视频最先展示综合智力 ECI TOP15，再讲主新闻与其余精选。保留原榜口径、模型 id/版本、顺序、分数和数据更新时间；ECI 不是百分数。没有可比的昨日快照就不编升降。不要写死当前 iframe 的版本路径。
- 优先在线取得本期榜单；确实获取失败时，只在这个 2026-10-23 首期测试中，可以使用 skills/daily-ai-news/references/pilot-ranking-2026-10-23.json。片内和来源记录明确写“大模型世界开源快照，数据截至源快照时间”，不冒充刚抓到网页；禁止未来日更复用它。
- 头条选择当天最值得关注且来源可靠的模型新闻，优先新型号发布或重大能力变化。封面写具体主角与关键变化，标题和正文一致，必须带对应官方模型/产品/厂商标志；参考图的示意标题不直接照抄。模型没有独立标志时，用官方厂商标志加准确型号，不能凭记忆画 logo。

视觉要求：
- 打开并查看 skills/daily-ai-news/assets/style-reference/ 下的 cover-preview.png、news-preview.png、ranking-preview.png。
- 用户认可的是浅纸白、墨色文字、少量珊瑚色、留白、轻纸页层次。用现有 Remotion、HTML/CSS、SVG 实现；自然光和复杂纸纹可以简化。
- 不调用生图，不把参考图直接当视频整页素材。拒绝大片黑底、黑色 logo 方块、黑底流程卡、密集嵌套框。新闻配图用官方图片、真实截图或有事实依据的排版图解。
- 主线用现有 B 线模板和组件，保持仓库锁定的 Remotion 版本。每条新闻都要有与内容匹配的主体、信息层级和适当停留，避免全文朗读配静态截图轮播。

执行与声音：
- 创建 projects/daily-ai-news-2026-10-23；已有工程则检查并续跑，不覆盖。尚未初始化时，可在仓库根目录运行 node scripts/studio.mjs init --id daily-ai-news-2026-10-23 --line b，再按实际内容替换 demo 契约并补 job 的参数生成、渲染与检查步骤。依赖、环境诊断和可修复的报错由你处理。
- 首版不等待真人录音，也不创建密钥、购买语音服务。可以使用模板已有 scripts/make_deck_audio.ps1 的 Microsoft Huihui Desktop 中文测试语音，本机已检查该声音启用。该工具来自 skills/video-motion/templates/remotion-app/scripts/；复制模板后在本期 remotion-app 中运行 powershell -NoProfile -File scripts/make_deck_audio.ps1 <分段稿.json> public/deck/audio。先确认实际相对路径，稿件 ref 用 page N，并让它对应本期场景。
- 根据实际生成的音轨时长编排镜头。字幕用现有工具按音轨校准；若当前转写工具不可用，可先用分段音轨做保守句级粗对齐，并在 README 标明待校准，不谎称完成 ASR/词级同步。不要为首版改造整套语音系统或下载大模型。测试音色的生硬不阻止交付视频，后续换正式语音。
- 先实际渲染一个代表片段，检查标题、官标、TOP15 完整性、中文字体、手机阅读、字幕和音画同步；修复后渲染完整样片。不要拿初始化自带的几秒 demo 充当新闻视频。

交付和完成标准：
1. 有可播放的本期完整 MP4，分辨率 1920×1080、30fps，含真实中文测试配音；有独立封面 PNG 和 SRT 字幕。
2. 保存本期来源、素材记录、分段稿、storyboard、job、可编辑场景代码及实际技术 QC；技术通过、已查看范围和人工待审分开记录。生成后实际抽帧读图，能审听就审听，不能听则如实写明。
3. 依现有 publish 流程准备标题、简介、来源署名和平台物料，执行可用的离线预检。本轮止于本地待审交付，不登录、上传或点击发布；真实投稿等用户看过样片后再按授权继续。
4. 用现有 deliverables.json、recipe、archive.json 流程归档，验证完整性和空目录恢复；大媒体按仓库规则处理，未验证前保留工程。源码和必要说明提交，账号状态/缓存/大媒体不入 Git。
5. 修复本轮涉及的问题，运行相称的类型检查、实际渲染、npm test、python scripts/check-docs.py、git diff --check；文档改动跑 npm run docs:maintain 并审阅影响。最后更新项目 README 与现有 Stage Spec，提交当前实现单元。
6. 最终直接给出实际视频、封面、字幕和归档位置，检查结果，尚待人工确认的项目，以及最值得改进的 3 点。补回 daily-ai-news 草案中由真实试制证明必要的步骤，不要宣称尚未验证的每日自动化已经完成。

目标是让我打开一个真实视频测试效果。已确认的风格和常规实施选择由你直接执行，不要反复要求我确认；确有无法解决的来源、环境或权限问题时，交代具体证据并保存可续跑进度，不能虚构新闻、音频或渲染成功。
```
