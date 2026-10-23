# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 仓库定位

自媒体内容工厂：业务 → 文案 → 画面 → 成片。不承载业务代码，只沉淀内容生产能力。**开工先确定交付物，再打开 skill**；已有明确目标时直接执行。产品与工具的权威入口是 [`docs/product-map.md`](docs/product-map.md)，清单不在本文件复述；新介绍片默认 DeckVideoV2。结构与 skill 清单以 README.md 为准；总装流程见 `workflows/explainer-video.md`，质量底线见 `docs/2026-08-30-motion-grammar.md`，历站记录见 `docs/workorder-log.md`。提交只包含本次任务文件，保留其他人的改动。

## 文档维护

信息正本、更新触发条件和作品状态统一见[文档维护约定](docs/documentation.md)，本文件不另维护一张 owner 表。收尾按本次 diff 同步受影响的入口、命令、skill 与进度，在同一提交完成；无需改说明时简述原因。

改完跑 `python scripts/check-docs.py`；检查通过不能代替文字承诺、当前状态与实际实现的人工核对。

`docs/` 下的 spec 首行统一写一行 `> 状态：活跃` 或 `> 状态：已存档（被 X 吸收）`。被吸收的 spec 里那些「本就不该再生产」的产物路径，check-docs 对标记已存档的文档跳过检查；没有这个标记，那几条 WARN 永远消不掉，只会训练人忽略 WARN。

## 结构要点（只记 README 里没有的）

- 技能发现链接由 `node scripts/setup-skills.mjs` 维护，正本与安装方式以 README 为准。
- `projects/` 是制作施工区，入口与保存边界见 [projects 说明](projects/README.md)。归档后允许保留有复用价值的现场，不为了目录整洁提前删除唯一输入。

## 常用命令

```powershell
# ppt 依赖（首次；清华镜像）
pip install python-pptx -i https://pypi.tuna.tsinghua.edu.cn/simple
pip install pymupdf -i https://pypi.tuna.tsinghua.edu.cn/simple

# 渲染核查第一步：Office COM 转 PDF（Windows + MS Office）
$p = New-Object -ComObject PowerPoint.Application
$pres = $p.Presentations.Open("<绝对路径>.pptx", $true, $false, $false)
$pres.SaveAs("<输出>.pdf", 32); $pres.Close(); $p.Quit()
```

```python
# 第二步：pymupdf 渲染 PNG
import fitz
pdf = fitz.open("<输出>.pdf")
for i in range(len(pdf)):
    pdf[i].get_pixmap(dpi=100).save(f"slide-{i}.png")
```

```bash
# 程序化溢出初筛：报每页 [OK]/[OVERFLOW] + 占位符扫描 + WCAG 初筛，退出码 1=有问题
python skills/ppt/templates/verify.py <输出>.pdf
# 元文档漂移检查（README↔skills 对齐 / 引用路径有效 / PAT 字段齐全）
python scripts/check-docs.py
```

动画（可选，Windows + MS Office + pywin32）：gen 脚本内 `Anim(prs)` 默认 `auto_deck()` 按组件适配表自动编排（11 种入场 + 级联节奏），手动 `fx()/stagger()` 微调；`growth_chart / growth_line / growth_donut()` 生成 morph 数据增长两页（柱/条/线/环，真补间，PowerPoint 2019+，线环走等顶点 freeform 逐点插值）；`prs.save()` 之后 `anim.apply(path)` 由 COM 写入并读回自验证。每页口播稿写 `notes()` 演讲者备注（介绍成片工作流的文案源与现场讲稿）；`auto_show()` 按口播稿估时设自动换页，整份 PPT 自动播完可录屏出粗片。改现有 pptx 用 `deck_replace / deck_recolor`，主题用 `use_theme()`。

ppt 验收 = 三级渲染核查：程序初筛 → 模型读图四项（溢出/乱码/对齐/对比度）→ 人工只看终稿。无 MS Office 降级 LibreOffice，两者都无则明确报告「未做视觉核查」。

## 硬约束与坑

- 大媒体与缓存不进 Git；生成脚本、配方、字幕、封面、发布配置和验收元数据按归档清单保留
- **禁手改 pptx**——一切修改走脚本重跑，这是「设计即代码」的前提
- **GBK 控制台**：脚本 print 禁用 `✓` 等非 ASCII 字符，用 `OK`
- **图像分析路径坑**：视觉核查工具读含反斜杠的深路径会解析失败，先复制到 `C:\pc\` 短路径再读；复查修复须换新文件名防缓存
- 提交：Conventional Commits + 中英文对照，例如 `feat(skills): 中文描述 / English description`
- **施工区清场**：先验证 recipe、素材与 deliverables 哈希并试恢复，再清理现场。草稿源码备份或仅有成片不能代替完整交付归档。
- 本仓库文案（README / SKILL.md / docs）遵循 humanizer 的 TimeCraker 偏好：说人话、数字优先于形容词、破折号中英双禁
