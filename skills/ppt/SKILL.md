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
| **色板** | 从项目设计语言提取（README 视觉章节 / 站点主色）。无则用默认暖色系：主色 `CC785C` / 深 `9C4F37` / 底 `FAF6F0` / 墨 `1C1917` / 灰 `78716C` / 线 `E7E0D8`。**5+1 色封闭系统，中途禁加色**；换色板时小字（注释/页码）对底色对比度 ≥4.5:1（WCAG AA） |
| **网格** | 16:9（13.333 × 7.5 in）· 统一边距 0.55 · 页码右下 (12.35, 7.02) · 每页顶部 coral 短杠 + 章节 label |
| **字号阶梯** | 54 封面 / 40 大数字 / 30 页标题 / 19 卡片题 / 13 正文 / 11 次要 / 9 注释。**禁用阶梯外的中间值** |
| **字体** | 中文 Microsoft YaHei；代码 / 域名 / 数字 / 版本号一律 Consolas。技术感一半来自等宽字体的克制使用 |
| **密度** | 每页一个核心论点。文字超 3 行考虑拆页；表格超 6 行改双栏或砍行 |

## Step 3 · 生成

1. `pip install python-pptx -i https://pypi.tuna.tsinghua.edu.cn/simple`（首次）
2. 复制本 skill 的 `templates/primitives.py` 到目标项目 `scripts/gen-<name>-deck.py`，改造数据区
3. 用 primitives 组装页面，**坐标用表达式算**（如 `Inches(0.55 + i * 3.13)`），不写魔法数
4. 文本框塞内容前用 `check_fit()` 预检（字符宽估算 vs 框高），`[FIT-WARN]` 即拆行/拆页/砍字；估算保守，最终以 Step 4 为准

**动画（可选；Windows + MS Office + pywin32）**——按元素声明，按元素类型自选效果：

```python
from animate import Anim
anim = Anim(prs)
anim.fade(title, 'with')            # 淡入；逐个声明 = 逐条接力进入
anim.wipe(card, 'up')               # 方向感：up / down / left / right
anim.appear(footer)                 # 直出
anim.chart(gf, 'category')          # 图表逐类目擦入：allAtOnce / series / category
P.set_transition(prs, 'fade')       # 统一转场：fade / push-left（morph 页自动跳过）
# 数据增长叙事（真补间，非擦入）——柱子从 0 平滑长到位：
s0, s1 = P.growth_chart(prs, 6, 'Growth', '标题', cats, vals, highlight=2)  # 占两页
prs.save('deck.pptx')               # apply 必须在 save 之后
anim.apply('deck.pptx')             # COM 写入；此后才做 Step 4
```

选择纪律：标题 fade；卡片/行条逐个 fade 接力；大数字 wipe up；链路节点按流向 wipe 依次；**数据图表首选 `growth_chart`（纵向柱 / 横向条，morph 真补间的增长感）；原生 `bar_chart` 的 bldChart 只是逐类目擦入、无高度补间，仅当交付后还要在 PowerPoint 里改数据时用它**。一页 ≤2 种效果；chrome/背板不动；动画服务叙事节奏，不是炫技。动画在 PDF 里不可见——verify 只验 XML 结构与静态页；morph 生效可程序化验证：COM 读 `SlideShowTransition.EntryEffect == 3954`；最终动效由人工终审确认；无 Office 环境直接跳过动画做静态交付。

**页面范式速查**（覆盖 90% 技术场景，组合优于发明）：

| 范式 | 用途 | 关键布局 |
|---|---|---|
| 封面 | 开场 | 大标题 54 + 右侧竖色块 + 元信息行 |
| 四象限卡 | 项目角色/模块 | 2×2 或 1×4 卡片，顶 coral 条 0.07 |
| 大数字墙 | 指标 | 2×3 数字卡，数字 40 coral，注释 9 Consolas |
| 柱/条图 | 数据对比 | `bar_chart()` 原生可编辑图表，Consolas 数值标签，值轴淡化 |
| 增长柱图 | 数据增长叙事 | `growth_chart()` 零状态→终态两页，morph 真补间（需 PowerPoint 2019+，WPS 不支持则降级 fade） |
| 链路图 | 架构 | 横排 box + `→` 文本，中间节点反色强调 |
| 双栏清单 | 技术栈/配置 | 左右两组斑马行条 |
| 表格页 | 路由/API | pptx 里少用真表格，用行条模拟更可控 |
| 尾页 | 联系 | ink 反色整页 + coral logo 块 |

## Step 4 · 渲染核查闭环（必做，不可跳）

纯代码画 PPT 最易翻车：文字溢出、字体缺失。三级管线，自动化优先，人工只看终稿：

**① 转 PDF + 程序初筛（自动）**

```powershell
# Office COM 转 PDF（Windows + MS Office）
$p = New-Object -ComObject PowerPoint.Application
$pres = $p.Presentations.Open("<绝对路径>.pptx", $true, $false, $false)
$pres.SaveAs("<输出>.pdf", 32); $pres.Close(); $p.Quit()
```

```bash
# 初筛：读 PDF 每个文本块的真实渲染 bbox，报页级溢出（方向+溢出量）；
# 顺带全文扫描占位符（未改的模板默认值 / lorem / TODO）。退出码 1=有问题
python <本skill>/templates/verify.py <输出>.pdf
```

初筛只保证「没出页」；框级溢出生成侧已由 `check_fit` 预警。报红即改脚本重跑。

**② 视觉自查（模型读图，四项）**

```python
# pymupdf 渲染 PNG
import fitz
pdf = fitz.open("<输出>.pdf")
for i in range(len(pdf)):
    pdf[i].get_pixmap(dpi=100).save(f"slide-{i}.png")
```

逐页核查：**溢出**（残余/元素重叠）、**乱码**（缺字形/方块）、**对齐**（间距不等/箭头错位）、**对比度**（暗底灰字看不清）。发现问题改脚本重跑，**禁手改 pptx**。
**盲看**：渲染图交给无生成上下文的子代理核查——写生成代码的模型看图会脑补预期，新鲜眼光才看得出真问题。

图像工具读图坑：路径含反斜杠会解析失败，先复制到 `C:\pc\` 类短路径；同一文件路径重复上传会命中 CDN 缓存返回旧图——**复查修复效果必须换新文件名再传**（可在图上画个标记框自证拿到的是新图）。

**③ 人工终审**：用户只看成稿确认——前两级已把机械问题清零。

## Step 5 · 交付

报告：页数 + 页面清单 / 文件路径与大小 / 三级核查结论（初筛 + 视觉逐页过，或列出已修问题）/ 生成脚本位置（可复跑）。在 git 仓库内则提交脚本 + pptx。

## 边界与坑

- **无 MS Office**（如 Linux）→ Step 4 降级 LibreOffice `soffice --convert-to pdf`；两者都无 → 明确报告「未做视觉核查」，交付风险自负
- **GBK 控制台**：脚本 print 禁用 `✓` 等非 ASCII 字符，用 `OK`
- **pptx 真表格列宽失控** → 一律用行条（box + text）模拟
- **中文缺字形** → run 级设置 `font.name` 为雅黑（模板 primitives 已处理）
- **动画定位坑**：shape_id 每页独立编号不唯一，animate.py 已按 XML 树身份定位；二次开发勿按全 deck 搜 id。pywin32 依赖：`pip install pywin32 -i https://pypi.tuna.tsinghua.edu.cn/simple`
- 同一方法可做 docx（python-docx）/ xlsx（openpyxl），primitives 思路通用；但那两个是「编辑部/工作簿」范式，页面范式表仅适用 pptx
