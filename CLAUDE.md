# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 仓库定位

自媒体内容工厂：项目 README → 介绍 PPT → 逐页动效 → 视频成片的一条流水线。不承载业务代码，只沉淀内容生产能力（Skills / Workflows / Assets）。当前 `ppt`、`humanizer`、`video-motion`、`narration` 四个 skill 已上线；`video-motion`（Remotion 视频动效合成，吸收原 `vibe-motion` + `deck-to-video` 两项规划）首站「视频底材叠动效」已交付（spec：`docs/2026-08-29-video-motion-stage-spec.md`），第二站 PPT 逐页成片开发中。第二站 `auto-subtitle`（faster-whisper 自动转写出 `SubtitleCue`，对接 video-motion 契约）开发中，spec 在 `docs/2026-08-29-auto-subtitle-stage-spec.md`；第三站 `narration`（结构化口播稿 + 程序校验，配音走剪映、不做语音合成）已上线，spec 在 `docs/2026-08-29-narration-stage-spec.md`；第四站 `deck-video`（PPT 逐页成片：pptx 页图 + 逐页配音 → Remotion 直出 mp4，复用 video-motion 引擎与 SubtitleTrack）spec 在 `docs/2026-08-29-deck-video-stage-spec.md`。后几站同样由 Zcode 执行，多站可能并行施工，**提交时只 add 自己站点的文件**。

## 结构与架构

- `skills/<name>/SKILL.md` — skill 本体，frontmatter 含 `name` / `description`（description 即触发条件，要写清用户会怎么说的触发词）
- `skills/<name>/templates/` — skill 自带的模板代码（如 ppt 的 `primitives.py` 版式原语、`animate.py` 逐元素动画、`verify.py` 渲染核查初筛）
- `assets/` — 品牌资源与 SVG
- `output/` — 产物工作台：各 skill 产物按 `<skill 名>/` 分目录（`footage/` 为素材库），不入 git；skill 只放工具不放产物
- `docs/` — 决策记录（选了什么、放弃了什么、为什么）；目录尚未建立，首次决策时创建

skill 的设计单元是**自包含**：每个 skill 可独立运行、自带模板、不依赖本仓库外文件。分发方式是复制或软链到目标项目 `.claude/skills/`。`.claude/skills/` 下是指向 `skills/` 同名目录的本机 junction（Claude Code 只认这个路径；已 gitignore，克隆后按 README「使用」节跑一次 setup）。

改动 skill 时同步 README.md 的 Skills 表与结构图（历史上漏过：ppt-deck 改名 ppt、收录 humanizer 都事后补过 README）。

## 常用命令

无构建 / lint / 测试体系，本仓库的产物是 skill 文档与 PPT 生成脚本。ppt 相关：

```powershell
# 依赖（首次；清华镜像）
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
# 程序化溢出初筛：读 PDF 文本块真实 bbox，报每页 [OK]/[OVERFLOW] + 占位符扫描 + 对比度 WCAG 初筛，退出码 1=有问题
python skills/ppt/templates/verify.py <输出>.pdf
```

动画（可选，Windows + MS Office + pywin32）：gen 脚本内 `Anim(prs)` 默认 `auto_deck()` 按组件适配表自动编排（11 种入场 + 级联节奏），手动 `fx()/stagger()` 微调；`growth_chart / growth_line / growth_donut()` 生成 morph 数据增长两页（柱/条/线/环，真补间，PowerPoint 2019+，线环走等顶点 freeform 逐点插值）；`prs.save()` 之后 `anim.apply(path)` 由 COM 写入并读回自验证。每页口播稿写 `notes()` 演讲者备注（deck-to-video 消费）；`auto_show()` 按口播稿估时设自动换页，整份 PPT 自动播完可录屏出粗片。改现有 pptx 用 `deck_replace / deck_recolor`，主题用 `use_theme()`。

验收标准就是 ppt skill 的三级渲染核查：程序初筛（页级溢出）→ 模型读图四项（溢出 / 乱码 / 对齐 / 对比度）→ 人工只看终稿；发现问题改脚本重跑。无 MS Office 时降级 LibreOffice `soffice --convert-to pdf`，两者都无则明确报告「未做视觉核查」。

## 硬约束与坑

- **产物不进 git**（.gitignore 已排除 pptx / pdf / 视频）；生成脚本必须可复跑
- **禁手改 pptx**——一切修改走脚本重跑，这是「设计即代码」的前提
- **GBK 控制台**：脚本 print 禁用 `✓` 等非 ASCII 字符，用 `OK`
- **图像分析路径坑**：视觉核查工具读含反斜杠的路径会解析失败，先把 PNG 复制到 `C:\pc\` 这类短路径再读
- 提交：Conventional Commits + 中英文对照，例如 `feat(skills): 中文描述 / English description`
- 本仓库文案（README / SKILL.md / docs）遵循 humanizer 的 TimeCraker 偏好：说人话、数字优先于形容词、破折号中英双禁
