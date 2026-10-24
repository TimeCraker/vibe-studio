# vibe-studio

自媒体内容工作台：从事实材料和镜头设计，到 PPT、讲解视频、产品介绍片与网页动画成片。

## 先选交付物

| 交付物 | 入口 | 制作方式 |
|---|---|---|
| PPT | [ppt](skills/ppt/) | Python 生成、动画、PDF/图片核查 |
| 每日 AI 资讯（试制） | [daily-ai-news](skills/daily-ai-news/) | 按价值决定是否出片；值得时取得 TOP15，用现有代码渲染链制作有重点的待审片 |
| 已有录像做讲解 | [video-motion](skills/video-motion/) | FootageOverlay 叠字幕、数据与标注 |
| 从项目材料做介绍片 | [总装工作流](workflows/explainer-video.md) | 快速单片走剪映，品牌场景走 DeckVideoV2，封面 CoverV3 |
| 已有网页或代码动画转视频 | [web-capture](skills/web-capture/) | 状态重放或显式 seek 采集，导演页剪辑 |

边界与决策见 [产品图](docs/product-map.md)。登录、配音、分镜/成片终审、点击发布保留人工节点；机器检查和人工接受分别记录。

每日 AI 资讯已有[技能流程草案](skills/daily-ai-news/SKILL.md)、[本地视觉参考](skills/daily-ai-news/references/visual-style.md)与 [Cursor 首期任务](docs/2026-10-23-daily-ai-news-cursor-prompt.md)。风格已确认，不依赖生图；条数与时长随内容，无合适资讯可以不出片。2026-10-23 首期的 65 秒无声版已被用户否定，另有独立重制版待审，入口与重跑方式见[本期简报](projects/daily-ai-news-2026-10-23/brief.md)。采集适配、正式自动语音和下一期续跑还没验证，进度见[栏目规划](docs/2026-10-23-daily-ai-news-spec.md)。

视频质量流程：先分析参考并确定视觉方向，按需用分镜图和临时配音做可播放粗样片；调整结构后制作正式画面与混音，再依据实际视频的时间码返修。方法与裁剪方式统一见[制作流程](workflows/explainer-video.md)，不要求所有任务遍历全部步骤。

设计、生图复用环境已有技能；技术可视化、Lottie、3D 和 Remotion 专项融入导演与制作分支。按需从[视觉能力选路](skills/content-director/references/visual-routing.md)进入，不额外增加项目技能入口；没有相应工具或素材时明确交付范围。

缺现成素材用 [asset-scout](skills/asset-scout/)选材并保留来源；产品操作按[演示导演](skills/content-director/references/product-demo.md)安排真实任务与结果，连续栏目按[系列一致性](skills/content-director/references/series-continuity.md)复用方案并落实到本期工程。后两项融入现有技能，不增加重复入口或进度表。

## 工具与职责

内容技能分四个板块，板块来自各技能的元信息；日常按交付物调用，不要求每个任务遍历所有技能。工作区文档维护由 `config/workspace-tools` 管理，已移出本项目的技能列表。

<!-- docs:auto skills -->
| 板块 | 技能 | 用途（来自 SKILL.md） |
|---|---|---|
| 策划与文案 | [content-director](skills/content-director/) | 为产品介绍、科技讲解和内容视频做受众定位、参考分析、事实核查、产品演示设计、系列一致性、分镜与粗样片迭代。按镜头需要调度选材、设计和技术可视化；已有定稿的采集和渲染交给对应制作技能。 |
| 策划与文案 | [daily-ai-news](skills/daily-ai-news/) | 每日 AI 资讯的选题判断与视频工作流：先筛选核查并决定是否出片，值得报道时再做 TOP15、口播字幕、代码成片和发布物料。条数和时长随内容，无合适资讯可不出片。用于今日 AI 日报或继续本栏目；当前为待实作验证的流程草案。 |
| 策划与文案 | [humanizer](skills/humanizer/) | 中英文去 AI 味改写：识别并去除 AI 生成文本痕迹，让文字像真人写的。 去 AI 腔、润色中文、去营销腔、去套话、humanize English prose。 基于 blader/humanizer 英文体系与中文社区去 AI 味研究（三毒机制、四层自检… |
| 策划与文案 | [narration](skills/narration/) | 口播稿工具，不是成片入口。把讲稿写成带画面引用的分段稿 JSON，字数与秒数由程序派生，校验器红绿分明，交付剪映配音。用户说「写口播稿 / 视频文案 / 配音稿 / 分段稿 / narration」时使用。用户说做 PPT 走 ppt；说做介绍视频走 work… |
| 内容制作 | [asset-scout](skills/asset-scout/) | 按分镜搜集和筛选截图、录像、图片、音乐、音效及模型，交付实际可用素材、镜头对应关系与来源和使用条件。适用于缺素材、找替代素材和整理选材；生成图片、实际采集和后期制作交给对应技能。 |
| 内容制作 | [audio-post](skills/audio-post/) | 对真人录音或 TTS 已生成音轨做声音后期：剪取与编排、增益和基础滤波、音乐自动避让、音效混合、淡入淡出、两遍响度处理及测量。适用于配音完成后的混音，不生成配音、不代替人工审听。 |
| 内容制作 | [auto-subtitle](skills/auto-subtitle/) | 转写工具，不是成片入口。faster-whisper 把 mp4/wav/flac 转成 cues.json + srt，字段与 video-motion SubtitleCue 对齐。用户说「自动字幕 / 语音转字幕 / 转写 / 出字幕文件 / faste… |
| 内容制作 | [ppt](skills/ppt/) | 用 python-pptx 代码生成专业 PPT / 幻灯片 / 演示文稿（deck / slides / pptx）。用户说「做个 PPT / 幻灯片 / 演示文稿 / 项目介绍 deck / 把项目做成 slides」时使用；改现有 pptx 同样适用。用… |
| 内容制作 | [video-motion](skills/video-motion/) | 用 Remotion 制作录像标注、技术可视化、介绍片场景与封面，落实系列视觉模板，并按需接入 Lottie、3D 和官方专项指导。适用于视频图形与动效制作；介绍片由总装工作流调度，已有网页动画走 web-capture。 |
| 内容制作 | [web-capture](skills/web-capture/) | 把已有本地网页、HTML 或 SVG 动画逐帧采集并通过导演页剪成视频，按既定演示方案执行可重放操作。适用于网页动画导出、逐帧采集和 web capture；线上产品录屏需另用实际可用的录制工具，已有录像叠动效走 video-motion。 |
| 成片审查 | [media-qc](skills/media-qc/) | 对粗样片或成片做媒体技术检查，并记录绑定实际视频版本、带时间码的视听审稿观察与局部返修建议。适用于制作中和交付前审查；工具不自动看片听音，技术通过不代替人工接受。 |
| 发布与运营 | [publish](skills/publish/) | 视频的发布与运营：按需准备平台画幅、切片、标题封面和投稿物料，辅助 B 站/抖音/小红书上传填表，或用真实数据做发布后复盘。可只执行其中一阶段；视频制作走对应制作技能，用户登录并亲自点击发布。 |
<!-- /docs:auto -->

美术需要位图时，content-director 按当前环境可用的 imagegen 工具生成素材，先放项目内，确认可复用后再登记到共用资产库；真实界面和结构图仍使用截图或 SVG。没有工具时保留简报，不声称已生图。

另接入 [Remotion 官方技能](https://www.remotion.dev/docs/ai/skills) 作为技术参考，来源固定在 `skills/video-motion/references/upstream.json`。参考包版本与渲染包版本分别管理，实际渲染声明如下表；新增 API 先做类型检查和实际渲染，不自动升级依赖。许可见 [Remotion 官方条款](https://www.remotion.dev/license)。

<!-- docs:auto versions source="skills/video-motion/templates/remotion-app/package.json" -->
| 运行 / 渲染依赖（来自配置） | 声明版本 |
|---|---|
| node（运行要求） | >=22 |
| Remotion / @remotion/* | 4.0.533 |
<!-- /docs:auto -->

## 开始使用

环境：Node（版本要求见上表）、Python 3.10+、Chrome、FFmpeg/ffprobe。PPT 的渲染核查还需要 MS Office 或 LibreOffice；各线的额外依赖由 doctor 报告。

```powershell
# 安装固定版本的离线文档工具依赖（单独 clone 也可用）
npm ci --ignore-scripts --no-audit --no-fund
# 创建项目本地的 Claude Code / Codex 技能发现链接
node scripts/setup-skills.mjs
# 安装本仓库提交检查；既有自定义钩子默认保留
node scripts/docs.mjs hooks
# 可选官方技术参考：固定提交，验证已有缓存，不覆盖本地修改
python scripts/install-upstream-skills.py
node scripts/setup-skills.mjs
# 检查当前制作线的依赖
node scripts/studio.mjs doctor --line c
# C 线完整测试样例，可在替换真实内容前验证管线
node scripts/studio.mjs init --id first-video --line c
node scripts/studio.mjs validate --project projects/first-video
node scripts/studio.mjs run --project projects/first-video --dry
node scripts/studio.mjs run --project projects/first-video
```

技能正本在 skills/；`.claude/skills/` 与 `.agents/skills/` 是本机链接，不入 Git。新增技能由后续会话发现；安装脚本不会改全局技能或覆盖其他链接。Codex 入口依据 [OpenAI 的仓库技能说明](https://developers.openai.com/blog/skills-agents-sdk)。

平台适配、投稿填表和发布后复盘统一由 publish 按阶段处理；成片质检独立于是否发布。导演定目标和镜头，narration 写结构化口播，humanizer 润色，已有素材或定稿可直接进入对应制作环节。

B/录像线 `init --line b|footage` 复制 Remotion 模板并配置依赖安装和类型检查。具体场景、配音与渲染命令按对应 skill 施工后加入 job.json；A/PPT 线先生成策划契约，再由对应工具生成内容。CLI 不把人工制作环节伪装成已自动完成。

## 编排、派生与归档

命令速查与 CLI 帮助来自同一声明，生成区域无需手改：

<!-- docs:auto commands source="scripts/studio-commands.json" -->
| 命令（node scripts/studio.mjs 后的参数） | 用途 |
|---|---|
| `init --id NAME --line a\|b\|c\|ppt\|footage [--project DIR]` | 初始化制作工程与契约 |
| `doctor [--line LINE] [--project DIR]` | 检查制作环境 |
| `validate --project DIR [--require-reviewed]` | 校验任务、分镜与已有审阅记录 |
| `run --project DIR [--step ID \| --from ID] [--dry]` | 运行、预检或续跑声明步骤 |
| `status --project DIR` | 查看技术步骤状态 |
| `audio --project DIR [--config FILE] [--out FILE]` | 编排音轨、音乐避让、混音与两遍响度处理 |
| `animatic --project DIR [--config FILE] [--out FILE]` | 按分镜时间生成带预览标记的动态分镜 |
| `inspect --project DIR [--input FILE --out FILE \| --verify FILE]` | 记录有时间码的视听审稿观察，或校验审稿对象版本 |
| `qc --project DIR --video FILE [--srt FILE] [--config FILE] [--require-audio] [--allow-preview] [--out FILE]` | 检查实际媒体与字幕 |
| `derive --project DIR` | 按配置派生平台物料 |
| `review --project DIR` | 根据真实统计生成复盘 |
| `archive --project DIR [--id NEW-REVISION] [--source-only]` | 保存制作配方、输入与指定交付物 |
| `verify-archive --archive FILE [--source-only]` | 校验归档完整性 |
| `restore --archive FILE --project DIR [--source-only]` | 恢复到不存在或空的目录 |
<!-- /docs:auto -->

job.json 为命令数组声明输入、输出、工作目录和超时；命令不经 shell 拼接。状态与日志在项目 .studio，输入、工具或输出变化会使缓存失效。

```powershell
node scripts/studio.mjs run --project projects/first-video --from render
node scripts/studio.mjs status --project projects/first-video
# 按真实内容修改 variants.json，再生成各平台物料
node scripts/studio.mjs derive --project projects/first-video
node skills/web-capture/templates/render-director.mjs --project projects/first-video --variant douyin --out render/douyin.mp4
node scripts/studio.mjs qc --project projects/first-video --video render/douyin.mp4 --config exports/douyin/qc.json --out qa/douyin-report.json
# --dry 仅本地预检，不连接浏览器或上传
node skills/publish/templates/run.mjs --project projects/first-video --dry
# 发布后录入真实 metrics.json；空表只生成待采集说明
node scripts/studio.mjs review --project projects/first-video
# 交付清单列出所有最终文件，包括后来增加的竖版
node scripts/studio.mjs archive --project projects/first-video
node scripts/studio.mjs verify-archive --archive products/first-video/archive.json
node scripts/studio.mjs restore --archive products/first-video/archive.json --project projects/first-video-restored
```

归档保存 recipe 制作配方、原始媒体与 deliverables.json 指定的成品，并逐文件记录 SHA-256。恢复校验通过、媒体备份完成后才清场；没有成品时 `archive --source-only` 只做草稿备份，不代表交付。大媒体与成片不入 Git，克隆后只校验源文件可用 `verify-archive --source-only`，它不会把缺失媒体说成完整恢复。

## 结构

<!-- docs:auto tree -->
```
vibe-studio/
├── .github/
├── assets/
├── docs/
├── products/
├── projects/
├── scripts/
├── skills/
│   ├── asset-scout/
│   ├── audio-post/
│   ├── auto-subtitle/
│   ├── content-director/
│   ├── daily-ai-news/
│   ├── humanizer/
│   ├── media-qc/
│   ├── narration/
│   ├── ppt/
│   ├── publish/
│   ├── video-motion/
│   └── web-capture/
├── tests/
├── tools/
├── workflows/
├── AGENTS.md
├── CLAUDE.md
├── README.md
└── package.json
```
<!-- /docs:auto -->

## 维护检查

Agent 收尾运行 `npm run docs:maintain`，自动更新技能/目录/命令生成区并定位相关说明；按实际 diff 修订现有段落即可。提交钩子检查暂存区，不自动改写或暂存。workspace 检索与接入见[文档维护说明](docs/documentation.md)，无需再维护一份中央项目文档副本。

```powershell
npm test
npm run docs:check
python scripts/check-docs.py
node tests/browser-capture.mjs
npm run verify:workflow
npm run verify:quality
npm run verify:visual
```

测试通过只代表对应技术范围。交付前按 [质量规范](docs/2026-08-30-motion-grammar.md) 看真实画面、听音频、检查手机尺寸。当前整理与验证范围见 [Agent 视频质量流程](docs/2026-10-23-agent-video-quality-spec.md)，前期修复保留在 [生产工作流修复](docs/2026-10-23-production-workflow-spec.md)。

视觉能力接入、Lottie 修复与文档核对见[视觉接入记录](docs/2026-10-23-visual-integration-spec.md)。verify:visual 首次在 .cache 内安装锁定模板依赖，使用已有 Chrome（可设 CHROME_PATH），不下载浏览器或模型；产物为技术验证，不是对正式作品的美术接受。
