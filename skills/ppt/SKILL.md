---
name: ppt
description: 用 python-pptx 代码生成专业 PPT / 幻灯片 / 演示文稿（deck / slides / pptx）。品牌色板提取 + 网格纪律 + 代码 primitives + Office COM 渲染核查闭环。用户说「做个 PPT / 幻灯片 / 演示文稿 / 项目介绍 deck / 把项目做成 slides」时使用；改现有 pptx 同样适用。
user-invocable: true
---

# ppt — 代码生成专业 PPT

核心方法论：**代码画 PPT，不拖模板**。收益：可复跑（改数据重跑脚本）、可进 git、坐标精确到 0.01 英寸。代价：无所见即所得，靠 Step 4 渲染核查兜底。

## Step 1 · 取材（禁止编造）

内容必须来自项目真实资料：README / CLAUDE.md / package.json / docs。动笔前列「事实清单」（项目名、数字指标、技术栈、部署拓扑），每个数字有出处。**没有出处的数字不进 PPT**。

## Step 2 · 设计系统（写代码前定案，全程不改）

| 维度 | 规则 |
|---|---|
| **色板** | 从项目设计语言提取（README 视觉章节 / 站点主色）。无则用默认暖色系：主色 `CC785C` / 深 `9C4F37` / 底 `FAF6F0` / 墨 `1C1917` / 灰 `A8A29E` / 线 `E7E0D8`。**5+1 色封闭系统，中途禁加色** |
| **网格** | 16:9（13.333 × 7.5 in）· 统一边距 0.55 · 页码右下 (12.35, 7.02) · 每页顶部 coral 短杠 + 章节 label |
| **字号阶梯** | 54 封面 / 40 大数字 / 30 页标题 / 19 卡片题 / 13 正文 / 11 次要 / 9 注释。**禁用阶梯外的中间值** |
| **字体** | 中文 Microsoft YaHei；代码 / 域名 / 数字 / 版本号一律 Consolas。技术感一半来自等宽字体的克制使用 |
| **密度** | 每页一个核心论点。文字超 3 行考虑拆页；表格超 6 行改双栏或砍行 |

## Step 3 · 生成

1. `pip install python-pptx -i https://pypi.tuna.tsinghua.edu.cn/simple`（首次）
2. 复制本 skill 的 `templates/primitives.py` 到目标项目 `scripts/gen-<name>-deck.py`，改造数据区
3. 用 primitives 组装页面，**坐标用表达式算**（如 `Inches(0.55 + i * 3.13)`），不写魔法数

**页面范式速查**（覆盖 90% 技术场景，组合优于发明）：

| 范式 | 用途 | 关键布局 |
|---|---|---|
| 封面 | 开场 | 大标题 54 + 右侧竖色块 + 元信息行 |
| 四象限卡 | 项目角色/模块 | 2×2 或 1×4 卡片，顶 coral 条 0.07 |
| 大数字墙 | 指标 | 2×3 数字卡，数字 40 coral，注释 9 Consolas |
| 链路图 | 架构 | 横排 box + `→` 文本，中间节点反色强调 |
| 双栏清单 | 技术栈/配置 | 左右两组斑马行条 |
| 表格页 | 路由/API | pptx 里少用真表格，用行条模拟更可控 |
| 尾页 | 联系 | ink 反色整页 + coral logo 块 |

## Step 4 · 渲染核查闭环（必做，不可跳）

纯代码画 PPT 最易翻车：文字溢出、字体缺失。交付前必须人眼/视觉模型核查每页：

```powershell
# 1. Office COM 转 PDF（Windows + MS Office）
$p = New-Object -ComObject PowerPoint.Application
$pres = $p.Presentations.Open("<绝对路径>.pptx", $true, $false, $false)
$pres.SaveAs("<输出>.pdf", 32); $pres.Close(); $p.Quit()
```

```python
# 2. pymupdf 渲染 PNG
import fitz
pdf = fitz.open("<输出>.pdf")
for i in range(len(pdf)):
    pdf[i].get_pixmap(dpi=100).save(f"slide-{i}.png")
```

3. 逐页核查四项：**溢出**（文字超框/超页边）、**乱码**（缺字形/方块）、**对齐**（间距不等/箭头错位）、**对比度**（暗底灰字看不清）。发现问题改脚本重跑，**禁手改 pptx**。
4. 视觉核查用图像分析工具时，路径含反斜杠会被解析失败——先复制到 `C:\pc\` 这类短路径再读。

## Step 5 · 交付

报告：页数 + 页面清单 / 文件路径与大小 / 渲染核查结论（逐页过或列出已修问题）/ 生成脚本位置（可复跑）。在 git 仓库内则提交脚本 + pptx。

## 边界与坑

- **无 MS Office**（如 Linux）→ Step 4 降级 LibreOffice `soffice --convert-to pdf`；两者都无 → 明确报告「未做视觉核查」，交付风险自负
- **GBK 控制台**：脚本 print 禁用 `✓` 等非 ASCII 字符，用 `OK`
- **pptx 真表格列宽失控** → 一律用行条（box + text）模拟
- **中文缺字形** → run 级设置 `font.name` 为雅黑（模板 primitives 已处理）
- 同一方法可做 docx（python-docx）/ xlsx（openpyxl），primitives 思路通用；但那两个是「编辑部/工作簿」范式，页面范式表仅适用 pptx
