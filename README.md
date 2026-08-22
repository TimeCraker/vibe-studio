# vibe-studio

> 内容创作工作台 — Content Creation Studio
>
> 自媒体内容工厂：PPT/deck 生成 → 动效（vibe motion / Remotion）→ 视频成片的工作流集合。

## 定位

TimeCraker 的内容创作工作台。不承载业务代码，只放**内容生产能力**：

- **Skills**：可复用的创作技能（当前 `ppt-deck`，后续 motion / 视频 / 配音…）
- **Workflows**：端到端工作流（如「项目 README → 项目介绍 deck → 逐页动画 → 成片」）
- **Assets**：跨项目共享的品牌资源（色板、字体、模板）

## 工作区位置

```
my_workspace/
└── vibe-studio/          # 本仓库（内容创作，非业务项目）
    ├── skills/
    │   └── ppt-deck/     # python-pptx 代码生成专业 PPT
    │       ├── SKILL.md
    │       └── templates/primitives.py
    └── docs/             # 规划、决策记录
```

## Skills

| Skill | 用途 | 用法 |
|---|---|---|
| `ppt-deck` | python-pptx 代码画 PPT：品牌色板 + 网格纪律 + 页面范式 + 渲染核查闭环 | 说「做个 PPT / 项目介绍 slides」，或按 SKILL.md 五步走 |

> skills 挂载方式：进 vibe-studio 会话时其 `.claude/skills/` 自动生效；在其他项目用某 skill 时，复制或软链对应目录到该项目 `.claude/skills/`。

## 路线图

- [x] `ppt-deck` — PPT 生成 skill（源自 my-portfolio 项目说明三件套的实践）
- [ ] `vibe-motion` — 动效脚本（motion / GSAP / Remotion 选型后落位）
- [ ] `deck-to-video` — deck 逐页渲染 → Remotion 合成视频
- [ ] 品牌资源中心 — 统一色板 / 字体 token，跨 skill 共享

## 约定

- 每个 skill 必须可独立运行（自带模板代码，不依赖本仓库外文件）
- 决策记录进 `docs/`（选型、放弃的理由），避免后人重新踩
- 提交：Conventional Commits + 中英文对照

---

© 2026 TimeCraker · [asterforge.top](https://asterforge.top)
