---
name: ppt
description: 用 python-pptx 代码生成专业 PPT / 幻灯片 / 演示文稿（deck / slides / pptx）。品牌色板提取 + 网格纪律 + 代码 primitives + Office COM 渲染核查闭环。用户说「做个 PPT / 幻灯片 / 演示文稿 / 项目介绍 deck / 把项目做成 slides」时使用；改现有 pptx 同样适用。
user-invocable: true
---

# ppt — 代码生成专业 PPT

**代码画 PPT，不拖模板**：可复跑（改数据重跑脚本）、可进 git、坐标精确到 0.01 英寸；无所见即所得，靠 Step 4 渲染核查兜底。

## Step 1 · 取材与文案（禁止编造）

素材只取项目真实资料（README / CLAUDE.md / docs / 数据后台，按类型选源）。**没有出处的数字不进 PPT**。

**挖内容，不摘名词**：光收数字和功能名不算取材。按 deck 类型挖——技术/产品：设计决策 + 效果对比；作品集：作品细节与取舍；数据报告：口径与基线；叙事品牌：人物、场景、转折。

挖完写**逐页文案稿**（标题 + 要点 + 口播稿；口播稿生成时进 `notes()` 演讲者备注，是 deck-to-video 与现场讲稿的数据源）。四条标准：

1. **不许空转**：要点带细节（功能带设计理由或效果、数据带口径），裸名词陈列删掉
2. **数字带语境**：数值 + 口径 + 构成或对比；挖不到语境的数字不当主视觉
3. **每页 ≥3 件可溯源的具体事实**；遮住排版只读文字，是在「讲」不是「列清单」
4. **槽位规则**：大字槽（封面主标题 / 尾页大字 / 章节名）只放主张句或身份句（有观点、念得出口号）；域名、版本号、日期、统计数字一律退副题 / 元信息位

风格：黑话零容忍（赋能 / 闭环 / 沉淀 / 矩阵 / 生态 / 一站式 / 端到端）；数字优先于形容词；标题写观点不写名词短语；破折号中英双禁。重要项目文案稿先给用户过目再排版。

## Step 2 · 设计系统（写代码前定案，全程不改）

| 维度 | 规则 |
|---|---|
| 色板 | 从项目设计语言提取（README 视觉节 / 站点主色 / 品牌 VI）；无则 `use_theme('warm' / 'tech' / 'forest')`。**5+1 封闭系统，中途禁加色**；小字对底色 ≥4.5:1 |
| 网格 | 16:9（13.333 × 7.5 in）· 边距 0.55 · 页码 (12.35, 7.02) · 顶部 coral 短杠 + 章节 label |
| 字号 | 54 封面 / 40 大数字 / 30 页标题 / 19 卡片题 / 13 正文 / 11 次要 / 9 注释，**禁用中间值** |
| 字体 | 中文雅黑；代码 / 域名 / 数字 / 版本号一律 Consolas |
| 密度 | 每页一个论点；文字超 3 行拆页，表格超 6 行砍行 |

## Step 3 · 生成

1. `pip install python-pptx -i https://pypi.tuna.tsinghua.edu.cn/simple`（首次）
2. 复制 `templates/primitives.py` + `animate.py` 到目标项目 `scripts/`，写 `gen-<name>-deck.py`
3. 坐标用表达式算（如 `Inches(0.55 + i * 3.13)`），不写魔法数；塞文本前 `check_fit()` 预检，`[FIT-WARN]` 即拆行 / 拆页

**动画**（可选；Windows + MS Office + pywin32）。默认 `auto_deck()` 全代劳（封面级联 / 卡片 float_up / 数字 zoom / 链路 wipe / 表格行 0.06s 快级联 / 章节序号 wipe up），手动只做微调：

```python
anim = Anim(prs)
anim.auto_deck()                       # 全 deck 自动编排
anim.fx(footer, 'fade', dur=0.4)       # 特殊元素补一枪
anim.chart(gf, 'series')               # 原生图表按系列擦入
P.set_transition(prs, 'fade')          # 统一转场（morph 页自动跳过）
P.auto_show(prs)                       # 口播稿估时自动换页：整 deck 自动播完，录屏即粗片
prs.save('deck.pptx')
anim.apply('deck.pptx')                # 必须在 save 后；COM 写入 + 读回自验证
# 微调：anim.stagger(P.shape_groups(s, 'card'), 'float_up', step=0.12)
# 增长叙事（morph 真补间，占两页页码，auto 自动跳过；生效验证 EntryEffect==3954；2019+，WPS 降级 fade）：
P.growth_chart(prs, 6, 'Growth', '标题', cats, vals, highlight=2)   # 柱/条
P.growth_line(prs, 8, 'Trend', '标题', cats, vals, highlight=5)     # 折线
P.growth_donut(prs, 10, 'Mix', '标题', cats, vals)                  # 占比环
```

效果词表（COM 实测）：`fade / wipe / appear / float_up / float_down / zoom / grow_turn / ease_in / split / wheel / stretch`；90 年代花活不收。节奏 > 花活：时长 0.4~0.6s、级联间隔 0.1~0.2s、一页 ≤2 种效果、页面固定装饰（顶部短杠 / 页码 / 底线）不进动画；数据图表一律 `growth_*`，原生 chart 仅交付后要在 PowerPoint 改数据时用。

**改现有 pptx**（脚本改，禁手改，save 到新文件名）：`P.deck_replace(prs, {'旧名': '新名'})` 全文替换（含备注）；`P.deck_recolor(prs, dict(zip(P.THEMES['warm'].values(), P.THEMES['tech'].values())))` 整 deck 换主题。

**页面范式**（字典非 checklist，按文案取用；密度靠 Step 1 喂饱，不靠范式本身）：

| 范式 | 函数 | 用途 |
|---|---|---|
| 封面 | `slide_cover` | 开场：大标题 54 + 右竖色块 |
| 章节页 | `slide_section` | 12+ 页长稿导航，杂志风（框架线 + 暗纹序号 + 条目） |
| 时间轴 | `slide_timeline` | 演进 / 路线图，hi 高亮当前位置 |
| 对比页 | `slide_versus` | A/B、前后对比，中缝 VS 圆标 |
| 金句页 | `slide_quote` | 一句值得整页的话（12+ 页 deck） |
| 卡片阵 | `slide_cards` | 并列职能 / 模块，自动换行 |
| 数字墙 | `slide_numbers` | 等权指标一览 |
| 图文页 | `slide_media` | 截图 + 要点；`sidebar=` 大图六成 + 圈注 + 脚注 |
| 高密度分区 | `slide_dense` | 一页讲透子系统：主区 60% + 侧区分组清单 |
| 真表格 | `slide_table` | API / 模型 / 清单对照，6~9 行，列宽层级 |
| 链路图 | `slide_chain` | 架构流向，hi 反色强调 + subs 卡 |
| 双栏清单 | `slide_rows` | 技术栈 / 配置 |
| 增长图 | `growth_chart / line / donut` | 数据增长 morph 真补间 |
| 原生图表 | `bar / line / donut_chart` | 交付后要在 PowerPoint 改数据 |
| 尾页 | `slide_closing` | 联系方式；`slogan=` 自定义大字（主张句） |

## Step 4 · 渲染核查（必做，不可跳）

三级管线，自动化优先，人工只看终稿：

**① 程序初筛**：Office COM 转 PDF（`Presentations.Open` 后 `SaveAs("<输出>.pdf", 32)`）→ `python <本skill>/templates/verify.py <输出>.pdf`。查页级溢出、占位符、对比度 WCAG（≥72pt 装饰大字豁免）；退出码 1 = 有问题，改脚本重跑。

**② 视觉盲看**：pymupdf 渲 PNG（`fitz` + `get_pixmap(dpi=100)`）→ 交**无生成上下文**的子代理逐页查四项：溢出 / 乱码 / 对齐 / 对比度。盲看提示里不要预设豁免（不说「这是故意的」）：被页缘裁切的元素、超大低对比装饰字这类可疑形态，同样交新鲜眼光当疑点报。发现问题改脚本重跑，**禁手改 pptx**。

读图坑：路径含反斜杠会解析失败，先复制到 `C:\pc\` 类短路径；复查修复效果必须换新文件名（CDN 缓存会返回旧图）。

**③ 用户终审**：前两级清零机械问题后，用户只看成稿。

## Step 5 · 交付

报告：页数 + 页面清单 / 文件路径与大小 / 三级核查结论 / 口播稿页数 / 自动放映总时长 / 生成脚本位置（可复跑）。git 仓库内提交脚本（pptx 产物不进 git）。

## 边界与坑

- 无 MS Office → Step 4 降级 LibreOffice `soffice --convert-to pdf`；两者都无 → 明确报告「未做视觉核查」
- GBK 控制台：print 禁用非 ASCII 字符，用 `OK`
- pptx 原生表格列宽失控 → 一律自绘行条（box + text）
- 中文缺字形 → run 级设雅黑（primitives 已处理）
- shape_id 每页独立编号不唯一，animate.py 已按 XML 树定位，二次开发勿全 deck 搜 id；pywin32：`pip install pywin32 -i https://pypi.tuna.tsinghua.edu.cn/simple`
- docx / xlsx 可复用 primitives 思路，但页面范式表仅适用 pptx
