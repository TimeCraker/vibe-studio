---
name: publish
description: 视频的发布与运营：按需准备平台画幅、切片、标题封面和投稿物料，辅助 B 站/抖音/小红书上传填表，或用真实数据做发布后复盘。可只执行其中一阶段；视频制作走对应制作技能，用户登录并亲自点击发布。
metadata:
  category: 4. 发布与运营
---

# 发布与运营

先确定任务是准备、投稿还是复盘，仅读取对应说明；三个阶段可以独立使用，不强制走完。

| 阶段 | 按需读取 | 入口 |
|---|---|---|
| 发布前准备 | [平台适配与物料](references/preparation.md) | `node scripts/studio.mjs derive --project <项目>` |
| 投稿填表 | [平台驱动与人工核对](references/submission.md) | `node skills/publish/templates/run.mjs --project <项目> --dry` |
| 发布后复盘 | [真实数据与观察窗口](references/analytics.md) | `node scripts/studio.mjs review --project <项目或operations>` |

平台版本实际渲染后调用 media-qc，确认视频、字幕、封面和表单对应同一版本。没有改编需要就复用已有版本。准备物料不代表已上传，填表不代表已发布；用户自行登录和点击发布。只统计已有真实来源，无发布数据就保持未知。

标题/封面可以给出有明确差异的候选：观众问题、可验证结果或过程展示；说明各自承诺和正文如何兑现。需要改开头或镜头时回到 content-director 与制作工具，发布模块不偷偷改写成片。

旧 content-repurpose / content-review 已合并到本技能，原 studio derive/review 命令不变；直接脚本改用 skills/publish/scripts/derive.mjs 和 report.mjs。历史制作配方保留当时快照。
