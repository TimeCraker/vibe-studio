# vibe-studio

自媒体内容工作台：从事实材料和镜头设计，到 PPT、讲解视频、产品介绍片与网页动画成片。

## 先选交付物

| 交付物 | 入口 | 制作方式 |
|---|---|---|
| PPT | [ppt](skills/ppt/) | Python 生成、动画、PDF/图片核查 |
| 已有录像做讲解 | [video-motion](skills/video-motion/) | FootageOverlay 叠字幕、数据与标注 |
| 从项目材料做介绍片 | [总装工作流](workflows/explainer-video.md) | 快速单片走剪映，品牌场景走 DeckVideoV2，封面 CoverV3 |
| 已有网页或代码动画转视频 | [web-capture](skills/web-capture/) | 状态重放或显式 seek 采集，导演页剪辑 |

边界与决策见 [产品图](docs/product-map.md)。登录、配音、分镜/成片终审、点击发布保留人工节点；机器检查和人工接受分别记录。

## 工具与职责

内容技能分四个板块，板块来自各技能的元信息；日常按交付物调用，不要求每个任务遍历所有技能。工作区文档维护由 `config/workspace-tools` 管理，已移出本项目的技能列表。

<!-- docs:auto skills -->
| 板块 | 技能 | 用途（来自 SKILL.md） |
|---|---|---|
| 策划与文案 | [content-director](skills/content-director/) | 为产品介绍、科技讲解或内容视频做受众定位、事实取材、口播与镜头设计。适用于选题、写分镜、画面单薄或正式制作前的策划；已有定稿的采集和渲染交给对应制作 skill。 |
| 策划与文案 | [humanizer](skills/humanizer/) | 中英文去 AI 味改写：识别并去除 AI 生成文本痕迹，让文字像真人写的。 去 AI 腔、润色中文、去营销腔、去套话、humanize English prose。 基于 blader/humanizer 英文体系与中文社区去 AI 味研究（三毒机制、四层自检… |
| 策划与文案 | [narration](skills/narration/) | 口播稿工具，不是成片入口。把讲稿写成带画面引用的分段稿 JSON，字数与秒数由程序派生，校验器红绿分明，交付剪映配音。用户说「写口播稿 / 视频文案 / 配音稿 / 分段稿 / narration」时使用。用户说做 PPT 走 ppt；说做介绍视频走 work… |
| 演示文稿 | [ppt](skills/ppt/) | 用 python-pptx 代码生成专业 PPT / 幻灯片 / 演示文稿（deck / slides / pptx）。用户说「做个 PPT / 幻灯片 / 演示文稿 / 项目介绍 deck / 把项目做成 slides」时使用；改现有 pptx 同样适用。用… |
| 视频制作 | [auto-subtitle](skills/auto-subtitle/) | 转写工具，不是成片入口。faster-whisper 把 mp4/wav/flac 转成 cues.json + srt，字段与 video-motion SubtitleCue 对齐。用户说「自动字幕 / 语音转字幕 / 转写 / 出字幕文件 / faste… |
| 视频制作 | [video-motion](skills/video-motion/) | 用 Remotion 给真实录像叠加字幕、数据和圈注，或直绘介绍片场景与封面。适用于视频动效、屏录标注和产品介绍片制作；介绍片由总装工作流调度，已有网页动画走 web-capture。 |
| 视频制作 | [web-capture](skills/web-capture/) | 把已有网页、HTML 或 SVG 动画逐帧采集并通过导演页剪成视频。适用于网页动画导出视频、逐帧采集和 web capture；有状态页面预跑重放，纯 seek 页面可直接定位。介绍成片走 workflows/explainer-video.md，已有录像叠动… |
| 交付与运营 | [content-repurpose](skills/content-repurpose/) | 把同一份已核实视频策划派生成不同画幅、镜头长度、封面与平台文案。适用于横竖版、短切片、三平台物料适配；不负责账号登录或点击发布。 |
| 交付与运营 | [content-review](skills/content-review/) | 用真实发布数据和制作成本复盘内容表现，支持同平台同观察窗口的系列对照。适用于内容复盘、完播/点击/转粉与制作效率分析；不抓取账号凭证、不代发内容、不编造缺失数据。 |
| 交付与运营 | [media-qc](skills/media-qc/) | 对完成的视频或短样片做技术质检、字幕时间检查、响度测量和抽帧取证。适用于渲染后核查与交付前验收；技术检查不代替人工看片、听音或品牌视觉终审。 |
| 交付与运营 | [publish](skills/publish/) | 发布辅助工具，不是成片入口。把已经做好的成片按平台要求填进投稿表单（B 站 / 抖音 / 小红书三端），人机分工是硬约束：你登录、你点发布，脚本只填表。用户说「发 B 站 / 发抖音 / 发小红书 / 投稿 / 帮我填投稿信息 / 自动发布」时使用。片子还没做… |
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

最近新增的内容技能是 content-director、media-qc、content-repurpose、content-review。职责边界：导演定目标和镜头，narration 写结构化口播，humanizer 润色；media-qc 检查交付文件，content-review 分析真实发布表现；content-repurpose 生成平台物料，publish 辅助填表。已有素材或定稿可直接进入对应制作环节。

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
│   ├── auto-subtitle/
│   ├── content-director/
│   ├── content-repurpose/
│   ├── content-review/
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
```

测试通过只代表对应技术范围。交付前按 [质量规范](docs/2026-08-30-motion-grammar.md) 看真实画面、听音频、检查手机尺寸。Stage 进度与本轮证据见 [生产工作流修复](docs/2026-10-23-production-workflow-spec.md)。
