# products/ — 产出成品档案库

按项目 / 按主题一目录，每个目录带说明。成品二进制（大文件 mp4 / pptx / pdf）按规范默认由 .gitignore 排除，不可变元数据（封面 PNG、字幕 SRT、发稿配置 PUBLISH.md、验收报告与可复跑脚本）入库登记。

| 目录 | 交付物与形态 | 状态与说明 |
|---|---|---|
| `hsr-currency-war/` | 崩铁「货币战争」成片、横版/竖版封面、三端发稿说明 | 已发布归档（B 线 Remotion 场景成片） |
| `pelican-ride/` | 「鹈鹕测试」Codex 篇成片、多比例封面、字幕、三端发布说明 | 已发布归档（C 线代码采集 + 三端发布） |
| `pelican-test/` | HTML 动画逐帧采集实验成片、封面、字幕、发布说明 | 已发布归档（C 线逐帧采集首个项目） |
| `lekao-intro/` | lekao 产品介绍成片（v1→v3）、封面、四级验收报告、复跑脚本 | 已交付归档（B 线 scene-kit 首作） |
| `lekao-deck/` | lekao 项目介绍 PPT（pptx / pdf） | 已交付归档（ppt skill） |
| `vibe-studio-deck/` | vibe-studio 自我介绍 PPT（pptx / pdf + 生成脚本） | 已交付归档（ppt skill 首站） |
| `asterforge-landscape/` | AsterForge 产品全景 PPT（pptx / pdf + 生成脚本） | 已交付归档（ppt skill） |
| `ddd-architecture/` | DDD 架构实战深度拆解演示文稿（44 slides + 动效生成脚本） | 已交付归档（ppt skill） |
| `ddd-paper/` | DDD 实战技术分享论文与演讲底稿（1.3万字 / 7章实证） | 已交付归档 |
| `stations/` | 各 skill 站点开发期的测试产物与验收报告 | 历史基线验收 |

> **工作流边界**：
> `projects/` 是施工流水线（Ephemeral Workspace），负责干活；**活干完交付后，最终产出与发布配置归档沉淀到本目录（`products/`），`projects/` 施工现场即刻清场**。
