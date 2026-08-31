# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 仓库定位

自媒体内容工厂：业务 → 文案 → 画面 → 成片。不承载业务代码，只沉淀内容生产能力。结构、五区划分、skill 清单**以 README.md 为唯一事实源**（本文件不复述）；总装流程见 `workflows/explainer-video.md`，质量底线见 `docs/2026-08-30-motion-grammar.md`，历站记录见 `docs/workorder-log.md`。工单多由 Zcode 执行，可能并行施工，**提交时只 add 自己站点的文件**。

## 单一事实源（改文档前先对表，只碰 owner）

| 要改的事实 | 唯一 owner | 别处怎么做 |
|---|---|---|
| 仓库结构 / skill 清单 / 使用方式 | `README.md` | 链接，不复述 |
| 视频工艺怎么做（含查 PAT、回流细节） | `skills/video-motion/SKILL.md` | workflow 只排步骤序 |
| 步骤顺序与调度 | `workflows/explainer-video.md` | 链接各 skill |
| 方案库 / 组件家底 | `assets/patterns.md` / `assets/component-catalog.md` | 被链接 |
| 历史与教训 | `docs/workorder-log.md` | 只追加不回改 |
| 本文件 | agent 行为规则、命令、坑 | — |

改完跑 `python scripts/check-docs.py`（红=漂移，如 README 表与 skills/ 目录不一致、文档引用路径失效、PAT 条目缺字段）。

## 结构要点（只记 README 里没有的）

- `.claude/skills/<name>` 是指向 `skills/<name>` 的本机 junction（Claude Code 只认这个路径；已 gitignore，克隆后按 README「使用」节重建）。
- 施工工程在 `projects/<项目>/remotion-app/`（从 video-motion 模板复制起步，换项目只改 `deck-scenes.tsx`）。

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

动画（可选，Windows + MS Office + pywin32）：gen 脚本内 `Anim(prs)` 默认 `auto_deck()` 自动编排（11 种入场 + 级联），手动 `fx()/stagger()` 微调；`growth_chart / growth_line / growth_donut()` 生成 morph 数据增长两页；`anim.apply(path)` 由 COM 写入并读回自验证。口播稿写 `notes()` 备注；`auto_show()` 按稿估时自动换页。改现有 pptx 用 `deck_replace / deck_recolor`，主题 `use_theme()`。

ppt 验收 = 三级渲染核查：程序初筛 → 模型读图四项（溢出/乱码/对齐/对比度）→ 人工只看终稿。无 MS Office 降级 LibreOffice，两者都无则明确报告「未做视觉核查」。

## 硬约束与坑

- **产物不进 git**（.gitignore 已覆盖）；生成脚本必须可复跑
- **禁手改 pptx**——一切修改走脚本重跑，这是「设计即代码」的前提
- **GBK 控制台**：脚本 print 禁用 `✓` 等非 ASCII 字符，用 `OK`
- **图像分析路径坑**：视觉核查工具读含反斜杠的深路径会解析失败，先复制到 `C:\pc\` 短路径再读；复查修复须换新文件名防缓存
- 提交：Conventional Commits + 中英文对照，例如 `feat(skills): 中文描述 / English description`
- 本仓库文案（README / SKILL.md / docs）遵循 humanizer 的 TimeCraker 偏好：说人话、数字优先于形容词、破折号中英双禁
