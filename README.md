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

| 技能 | 用途 |
|---|---|
| [content-director](skills/content-director/) | 受众、事实来源、分镜、美术简报与短样片 |
| [humanizer](skills/humanizer/) | 保持事实不变，改口语与文风 |
| [narration](skills/narration/) | 分段口播、字幕与时长预算 |
| [auto-subtitle](skills/auto-subtitle/) | 词级时间戳转写、字幕对齐 |
| [media-qc](skills/media-qc/) | 解码、规格、字幕、响度、抽帧证据与待人工清单 |
| [content-repurpose](skills/content-repurpose/) | 选镜头、重排时间轴、画幅、安全区与平台文案 |
| [publish](skills/publish/) | B 站/抖音/小红书填表，按平台选视频与封面 |
| [content-review](skills/content-review/) | 真实发布数据、制作成本与系列复盘 |

美术需要位图时，content-director 按当前环境可用的 imagegen 工具生成素材，再走 assets/art 登记与消费；真实界面和结构图仍使用截图或 SVG。没有工具时保留简报，不声称已生图。

另接入 [Remotion 官方技能](https://www.remotion.dev/docs/ai/skills) 作为技术参考，来源固定在 `skills/video-motion/references/upstream.json`。参考包版本与渲染包版本分别管理；本仓 Remotion 继续锁定 4.0.533，新增 API 先做类型检查和实际渲染，不自动升级依赖。许可见 [Remotion 官方条款](https://www.remotion.dev/license)。

## 开始使用

环境：Node 22+、Python 3.10+、Chrome、FFmpeg/ffprobe。PPT 的渲染核查还需要 MS Office 或 LibreOffice；各线的额外依赖由 doctor 报告。

```powershell
# 创建项目本地的 Claude Code / Codex 技能发现链接
node scripts/setup-skills.mjs
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

B/录像线 `init --line b|footage` 复制 Remotion 模板并配置依赖安装和类型检查。具体场景、配音与渲染命令按对应 skill 施工后加入 job.json；A/PPT 线先生成策划契约，再由对应工具生成内容。CLI 不把人工制作环节伪装成已自动完成。

## 编排、派生与归档

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

```
vibe-studio/
├── skills/            # 技能正本、脚本与模板
│   ├── ppt/
│   ├── humanizer/
│   ├── narration/
│   ├── video-motion/
│   ├── auto-subtitle/
│   ├── web-capture/
│   ├── publish/
│   ├── content-director/
│   ├── media-qc/
│   ├── content-repurpose/
│   └── content-review/
├── workflows/         # 制作总装流程
├── assets/            # 版式、组件登记、美术、品牌素材
├── projects/          # 在研施工区，临时帧与依赖可清理
├── products/          # 配方、成品清单、字幕、封面、来源与验收记录
├── scripts/           # CLI、归档、环境诊断、配乐等通用工具
├── tests/             # 数据、故障、归档与浏览器回归
└── docs/              # 产品边界、质量规范、Stage Spec 与工单台账
```

## 维护检查

文档正本、按改动更新的对照表，以及“制作中项目 README → 归档后作品 README”的状态交接见[文档与作品状态维护](docs/documentation.md)。目录说明不维护“全部项目已完成”等动态结论；技术运行状态与人工接受分别记录。

```powershell
npm test
python scripts/check-docs.py
node tests/browser-capture.mjs
npm run verify:workflow
```

测试通过只代表对应技术范围。交付前按 [质量规范](docs/2026-08-30-motion-grammar.md) 看真实画面、听音频、检查手机尺寸。Stage 进度与本轮证据见 [生产工作流修复](docs/2026-10-23-production-workflow-spec.md)。
