<div align="center">

<img src="assets/pipeline.svg" alt="vibe-studio" width="880"/>

# vibe-studio

**自媒体内容工厂** — 从项目说明到成片的一条流水线。

</div>

---

## 定位

TimeCraker 的内容创作工作台。不承载业务代码，只沉淀**内容生产能力**：

- **Skills** — 可独立运行的创作技能，自带模板代码，零外部依赖
- **Workflows** — 端到端总装图：项目 README → 介绍 PPT → 逐页动效 → 视频成片（[`explainer-video`](workflows/explainer-video.md)，A 线剪映全包 / B 线 Remotion 成片）
- **Assets** — 跨项目共享的品牌资源：色板、字体 token、版式范式

## Skills

| Skill | 做什么 | 状态 |
|---|---|---|
| [`ppt`](skills/ppt/) | python-pptx **代码画 PPT**：17 种页面范式（章节/时间轴/对比/金句/图文/增长柱线环…）+ 3 套主题预设 + 动画 auto 编排（11 入场 + 级联 + morph 真补间）+ 口播稿备注 + 自动放映 + 改写现有 pptx + 三级渲染核查（含对比度初筛） | 已上线 |
| [`humanizer`](skills/humanizer/) | 中英文**去 AI 腔**改写（blader 英文体系 × 中文三毒/L1-L4 工程体系融合 v5） | 已上线 |
| [`video-motion`](skills/video-motion/) | **视频动效合成**：视频底材叠字幕 / 数据动效 / 圈注 + PPT 逐页成片 + 场景化成片（scene-kit 直绘动效场景，八问口诀+质感工艺）+ 静态封面出图（一套 Remotion 引擎四种产物） | 已上线（[首站 Spec](docs/2026-08-29-video-motion-stage-spec.md) · [逐页成片 Spec](docs/2026-08-29-deck-video-stage-spec.md) · [场景化 v2 Spec](docs/2026-08-30-deck-video-v2-stage-spec.md) · [质感 v3 Spec](docs/2026-08-30-deck-video-v3-fidelity-spec.md) · [封面 Spec](docs/2026-08-29-cover-still-stage-spec.md)） |
| [`auto-subtitle`](skills/auto-subtitle/) | **自动字幕**：faster-whisper 转写音视频 → `SubtitleCue[]` JSON（直接喂 video-motion），词级时间戳对齐真实语音窗口、长句自动切分、VAD 防幻觉 | 已上线（[Stage Spec](docs/2026-08-29-auto-subtitle-stage-spec.md)） |
| [`narration`](skills/narration/) | **口播稿工坊**：分段稿 JSON + 程序校验（字数↔秒数、段长、禁令初筛），直出剪映配音与 cues（video-motion / deck-video 消费） | 已上线（[Stage Spec](docs/2026-08-29-narration-stage-spec.md)） |

> **为什么代码画 PPT**：设计即代码——网格坐标、字号阶梯、色板全部显式声明，可复跑、可 diff、可版本化；渲染核查闭环保证「所见即所写」。

## 使用

Claude Code 只从 `.claude/skills/` 发现 skill。本仓库真身在 `skills/`，`.claude/skills/` 下是指过去的 junction（Windows 免管理员）——**克隆后跑一次**：

```powershell
git clone https://github.com/TimeCraker/vibe-studio
cd vibe-studio
New-Item -ItemType Directory -Force .claude/skills | Out-Null
foreach ($s in 'ppt', 'humanizer', 'video-motion', 'narration', 'auto-subtitle') {
    New-Item -ItemType Junction -Path "$PWD\.claude\skills\$s" -Target "$PWD\skills\$s" | Out-Null
}
```

之后进 vibe-studio 会话，skill 自动生效（新会话生效，已在开的会话不含）。在**其他项目**用某 skill，同法复制或链接对应目录到该项目 `.claude/skills/`：

```bash
ln -s ~/Desktop/my-workspace/vibe-studio/skills/ppt <project>/.claude/skills/ppt
```

## 结构

```
vibe-studio/
├── skills/
│   ├── ppt/          # PPT 生成 skill
│   │   ├── SKILL.md       # 五步决策流程
│   │   └── templates/
│   │       ├── primitives.py   # 版式原语（网格/文本/图形/图表/转场）
│   │       ├── animate.py      # 逐元素动画（COM：fade/wipe/图表生长）
│   │       └── verify.py       # 渲染核查初筛（溢出检测 + 占位符扫描）
│   ├── video-motion/      # 视频动效合成（Remotion）
│   │   ├── SKILL.md       # 流程与验收
│   │   └── templates/remotion-app/   # 最小 Remotion 工程模板
│   ├── auto-subtitle/     # 自动字幕（faster-whisper）
│   │   ├── SKILL.md       # 流程与验收
│   │   └── templates/asr/       # 转写脚本 + 语音素材生成
│   ├── narration/         # 口播稿工坊（分段稿 + 程序校验）
│   │   ├── SKILL.md       # 流程与验收
│   │   └── templates/     # verify_narration.py 校验器
│   └── humanizer/         # 中英文去 AI 腔改写
│       └── SKILL.md       # v5 融合版（中英双体系）
├── workflows/
│   └── explainer-video.md # 项目介绍视频总装图（A/B 双线）
└── assets/                # 品牌资源与 SVG
```

## 约定

- 每个 skill 必须可独立运行（自带模板，不依赖本仓库外文件）
- **skill 是纯工具**：只放流程（SKILL.md）、脚本与模板；素材、产物、中间文件一律不进 skill
- **产物统一放项目根 `output/<skill 名>/`**（不入 git，脚本可复跑）——工具包管能力，工作台管产出
- 决策记录进 `docs/`——选了什么、放弃了什么、为什么，避免后人重新踩
- 提交：Conventional Commits + 中英文对照

---

<div align="center">
<sub>© 2026 TimeCraker · <a href="https://asterforge.top">asterforge.top</a></sub>
</div>
