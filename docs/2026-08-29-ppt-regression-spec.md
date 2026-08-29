# 2026-08-29 · ppt 版式回归电池 Stage Spec — 17 范式全量夹具与自动核查

> 执行者：Zcode（GLM-5.3-Flash）。本 spec 自包含，无需会话上下文。
> 复核：Claude（spec §4）→ 用户终审。
> 性质：**只新增回归工具与产物，三模板零改动**。

## §0 规则与护栏

- **为什么要做**：ppt skill 是本仓最重的资产（`primitives.py` 989 行 × 17 范式 × 3 主题 × 动画），且没有任何回归保护——改一处坏别处不会被发现。本站建一套「一条命令跑完全部范式的渲染核查」电池。
- **铁律一（三模板零改动）**：`primitives.py` / `animate.py` / `verify.py` 的 diff 必须为 0。电池**发现**的溢出 / 乱码 / 对齐问题只记进报告，不修（修不修用户决定）。
- **铁律二**：只新增 `skills/ppt/templates/regression.py`（工具，进 git）+ `output/ppt-fixtures/`（产物，不进 git）。
- **铁律三**：以各文件 docstring 与 `skills/ppt/SKILL.md` 为准调用 API，不臆造参数；参数拿不准就读源码签名。
- GBK 控制台 print 全英文；读图前 PNG 复制 `C:\pc\` 短路径；连续 2 轮同一红项停下报告。

## §1 环境事实（已核实）

| 项 | 事实 |
|---|---|
| 模板 | `skills/ppt/templates/{primitives.py(989 行), animate.py(270), verify.py(125)}` |
| 范式函数 | `slide_cover / slide_cards / slide_numbers / slide_chain / slide_rows / slide_section / slide_timeline / slide_versus / slide_quote / slide_closing / slide_media / slide_table / slide_dense` + 图表 `bar_chart / line_chart / donut_chart` + 增长三件 `growth_chart / growth_line / growth_donut`（morph）+ `picture` |
| 主题 | `use_theme('warm' | 'tech' | 'forest')`，三套全测 |
| 动画 | `Anim(prs)` 声明式（fade / wipe / fx / auto_deck 等，以 docstring 为准）+ `auto_show()` 自动换页 |
| 核查链 | ppt skill 三级：`verify.py <pdf>`（exit 0/1）→ COM 转 PDF → pymupdf 渲 PNG → 读图 |
| 依赖 | python-pptx / pymupdf 全局在位；MS Office 在；ffmpeg 在 |

## §2 契约

### regression.py（工具，进 git）

```
python skills/ppt/templates/regression.py --set <all|paradigms|charts|edge|themes|anim> --out <目录，默认 output/ppt-fixtures>
```

- 生成五组夹具到 out 目录，stdout 一行英文摘要/组（`set=X pages=N out=<path>`），任一组生成失败 exit 1。
- 夹具内容自拟但**必须真实合理**（产品介绍语境的假数据，不 lorem），且刻意压边界。

| 组 | 文件 | 内容 |
|---|---|---|
| paradigms | `paradigms.pptx` | 全部 13 个 slide_* 范式各一页（media/dense 需要 img：先 `ffmpeg -f lavfi -i gradients=s=1200x800:d=1 -frames:v 1 <out>/assets/fixture.png` 造图） |
| charts | `charts.pptx` | bar（横/竖各一）+ line + donut + growth 三件（morph 前后两页） |
| edge | `edge.pptx` | 边界轰炸：最长合理标题、满 bullets、8 卡片、10×8 密表、单字标题、空 points 的 section |
| themes | `theme-<warm\|tech\|forest>.pptx` ×3 | 同一份 6 页代表 deck 换主题生成，验主题平价 |
| anim | `anim.pptx` | paradigms 子集 deck：`Anim(prs)` + `auto_deck()` 全自动编排 + `auto_show()`；`apply` 后走 animate 自验证 |

### 核查链（regression.py 只生成，核查由执行流程跑）

1. 每组 pptx：COM 转 PDF（`Presentations.Open(abs, $true, $false, $false)` + `SaveAs(pdf, 32)`，绝对路径）
2. `python skills/ppt/templates/verify.py <每个 pdf>`——**edge 组的溢出命中不意外**，逐条记录（这就是电池要抓的东西）；其余组溢出 = 红项
3. pymupdf `get_pixmap(dpi=100)` 渲 PNG
4. 读图抽核：每组首末页 + 任选 3 个范式页，查乱码 / 对齐 / 对比度

## §3 任务分 Stage

- **Stage 0 盘点**：通读三模板 docstring，回填「范式 × 必填参数」清单进报告草稿；与 §1 清单核对，发现 spec 遗漏的范式补进电池。
- **Stage 1**：写 `regression.py`，`--set paradigms` 出片成功。commit：`feat(ppt): regression.py 回归电池生成器 / regression battery generator`
- **Stage 2**：五组全量生成 → 核查链 1-4 跑完，结果矩阵（范式 × 页 × verify 结果 × 读图结论）记入报告。
- **Stage 3 三级自验收（停下等确认）**：L1 全部命令 exit 0（edge 溢出记录在案不算失败）；L2 `git diff` 三模板为 0、产物全在 output/；L3 报告 `output/ppt-fixtures/report.md`（矩阵 + 发现清单 + 复跑命令）。停。
- **Stage 4 收尾（用户确认后）**：ppt SKILL.md 增「回归电池」小节（一条命令 + 何时跑：改 primitives 后必跑）；README 表 ppt 行补一句。

## §4 验收清单（Claude 复核用）

- [ ] 五组夹具齐全；verify.py 链路全跑（exit code 留档）
- [ ] 三模板 diff = 0；产物零入库
- [ ] 每个 slide_* 范式至少出现一页（对照 Stage 0 清单）
- [ ] 读图抽核无乱码；edge 发现的问题成清单未修
- [ ] regression.py print 全英文、可 `--set` 单组复跑

## §5 参考

- 调用惯例：`skills/ppt/SKILL.md`、各模板 docstring
- COM/PDF/读图坑：vibe-studio CLAUDE.md「常用命令」与「硬约束与坑」
