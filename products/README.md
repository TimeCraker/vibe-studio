# products/ — 产出成品档案库

按项目 / 按主题一目录。成片、PPT 和 PDF 大文件不入 Git；`recipe/` 制作配方、`archive.json` 哈希清单、字幕、发布元数据、封面和生成脚本入库。`media/` 保存原始大媒体副本，不入 Git，须单独备份。

四个历史视频项目已从清场前提交恢复制作配方。`archive.json` 记录来源提交、逐文件 SHA-256 和已知缺失输入；这证明源码恢复，不代表历史成片已经完成重渲染验收。恢复后在施工目录执行配方，勿在只读归档中施工。新交付的 `deliverables/` 包含交付清单显式列出的最终文件与质检证据；大成片单独备份，小型报告与抽帧证据入 Git。

作品根 README 可持续记录发布和下一步，operations 保存后续统计与复盘；固定快照及 archive.json 内的文件不原地改动。位置、可入库格式与独立备份要求见[文档维护约定](../docs/documentation.md#归档后的持续记录)。下表是历史交付索引，当前限制与证据以各作品记录为准。

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
> `projects/` 是施工区；交付时保存源码、发布配置、输入和成品清单。归档哈希校验、试恢复与大媒体备份通过后再清场；仅有成片或源码草稿不能作为清场依据。
