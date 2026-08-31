<div align="center">

<img src="assets/pipeline.svg" alt="vibe-studio" width="880"/>

# vibe-studio

**自媒体内容工厂**：先选交付物，再开工。

</div>

---

## 定位

TimeCraker 的内容工作台。不承载业务代码。产品按**交出去的东西**分三格，技能是干活的手，不跟产品一一对应。

完整决策树：[产品图](docs/product-map.md)。

## 先选交付物

| 你要交什么 | 走哪 | 不要走哪 |
|---|---|---|
| **PPT / 幻灯片** | [`ppt`](skills/ppt/) | 不要打开视频 skill |
| **讲解成片**（已有录像、屏录、游戏录像） | [`video-motion`](skills/video-motion/) · `FootageOverlay` | 不要走介绍成片 |
| **介绍成片**（从项目说明出一条可发布视频） | [`explainer-video`](workflows/explainer-video.md) · 成片 `DeckVideoV2` · 封面 `CoverV3` | 不要用 `DeckVideo` 翻页 PPT；不要把五个 skill 摊开挑 |

只要一张标题封面、没有介绍成片任务：走 `Cover` json 三预设。介绍成片的封面跟成片走 `CoverV3`。

## 产品

| 产品 | 做什么 |
|---|---|
| **PPT** | 代码画幻灯片：17 种页面范式、3 套主题、动画 auto 编排、三级渲染核查。文案过 humanizer。 |
| **讲解成片** | 真实底材叠字幕 / 数据柱 / 圈注。素材 + `cues.ts`，一条命令出片。 |
| **介绍成片** | scene-kit 直绘动效场景（不是 PPT 录屏）。工作流里取材用 ppt、出稿用 narration、配音用剪映、渲染用 `DeckVideoV2`。 |

## 工具（被产品调用）

| 工具 | 干什么 |
|---|---|
| [`humanizer`](skills/humanizer/) | 去 AI 腔。PPT 和口播稿默认过一遍。 |
| [`narration`](skills/narration/) | 分段口播稿 + 程序校验。不做语音合成。 |
| [`auto-subtitle`](skills/auto-subtitle/) | 已有音轨转写成 `SubtitleCue`。 |

施工记录和旧版对照在 [`docs/`](docs/)，新任务以产品图为准。

> 为什么代码画 PPT：网格、字号、色板全部写在脚本里，可复跑、可 diff、可版本化；渲染核查保证所见即所写。

## 使用

Claude Code 只从 `.claude/skills/` 发现 skill。本仓库真身在 `skills/`，`.claude/skills/` 下是指过去的 junction（Windows 免管理员）。克隆后跑一次：

```powershell
git clone https://github.com/TimeCraker/vibe-studio
cd vibe-studio
New-Item -ItemType Directory -Force .claude/skills | Out-Null
foreach ($s in 'ppt', 'humanizer', 'video-motion', 'narration', 'auto-subtitle') {
    New-Item -ItemType Junction -Path "$PWD\.claude\skills\$s" -Target "$PWD\skills\$s" | Out-Null
}
```

之后进 vibe-studio 会话，skill 自动生效（新会话生效，已在开的会话不含）。在其他项目用某 skill，同法复制或链接对应目录到该项目 `.claude/skills/`：

```bash
ln -s ~/Desktop/my-workspace/vibe-studio/skills/ppt <project>/.claude/skills/ppt
```

## 结构

```
vibe-studio/
├── skills/            # 纯工具：五个 skill（SKILL.md + 模板代码，零素材零产物）
│   ├── ppt/           #   python-pptx 代码画 PPT（primitives / animate / verify）
│   ├── humanizer/     #   中英文去 AI 腔改写
│   ├── video-motion/  #   Remotion 引擎（fx 叠动效 + scene-kit 质感组件 + deck 引擎模板）
│   ├── narration/     #   口播稿工坊（verify_narration.py）
│   └── auto-subtitle/ #   faster-whisper 自动字幕
├── workflows/         # 蓝图：explainer-video.md（A 线剪映全包 / B 线 Remotion 成片）
├── assets/            # 资产库：patterns.md 成页方案库 + component-catalog.md 组件登记簿 + 品牌与测试素材
├── projects/          # 施工区：一项目一目录，彼此隔离
│   └── lekao-intro/   #   remotion-app 施工工程（deck-scenes 场景 + 素材 public/）+ 设计文档
├── products/          # 产出：按项目分目录带 README 标注（成品不入 git）
├── docs/              # 决策与规范：product-map 产品图 + motion-grammar 质量底线 + workorder-log 工单台账 + 活跃 spec
└── scripts/           # 一次性生成脚本（ad-hoc deck 等，入库可复跑）
```

## 约定

- 每个 skill 必须可独立运行（自带模板，不依赖本仓库外文件）
- **skill 是纯工具**：只放流程（SKILL.md）、脚本与模板；素材、产物、中间文件一律不进 skill
- **仓库五区**：`skills/` 纯工具（零素材零产物）· `workflows/` 蓝图 · `assets/` 可复用资产 · `projects/` 施工区（一项目一目录，代码入库）· `products/` 产出（按项目标注，README 入库、二进制不入）。素材归属三规则：项目素材跟项目走、可复用测试素材进 `assets/`、成品进 `products/`
- 决策记录进 `docs/`——选了什么、放弃了什么、为什么，避免后人重新踩。**入口以 [产品图](docs/product-map.md) 为准，不以 skill 文件名为准**
- 提交：Conventional Commits + 中英文对照

---

<div align="center">
<sub>© 2026 TimeCraker · <a href="https://asterforge.top">asterforge.top</a></sub>
</div>
