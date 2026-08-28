---
name: ppt
description: 用 python-pptx 代码生成专业 PPT / 幻灯片 / 演示文稿（deck / slides / pptx）。品牌色板提取 + 网格纪律 + 代码 primitives + Office COM 渲染核查闭环。用户说「做个 PPT / 幻灯片 / 演示文稿 / 项目介绍 deck / 把项目做成 slides」时使用；改现有 pptx 同样适用。
user-invocable: true
---

# ppt — 代码生成专业 PPT

核心方法论：**代码画 PPT，不拖模板**。收益：可复跑（改数据重跑脚本）、可进 git、坐标精确到 0.01 英寸。代价：无所见即所得，靠 Step 4 渲染核查兜底。

## Step 1 · 取材（禁止编造）

内容必须来自项目真实资料：README / CLAUDE.md / package.json / docs。动笔前列「事实清单」（项目名、数字指标、技术栈、部署拓扑），每个数字有出处。**没有出处的数字不进 PPT**。取材同时为每页写口播稿（1~3 句，讲这页时的原话），生成时写进 `notes()` 演讲者备注——它是 deck-to-video 与现场讲稿的数据源。

## Step 2 · 设计系统（写代码前定案，全程不改）

| 维度 | 规则 |
|---|---|
| **色板** | 从项目设计语言提取（README 视觉章节 / 站点主色）。无则用默认暖色系或 `use_theme('tech' / 'forest')` 切预设（warm 珊瑚 / tech 冷蓝 / forest 墨绿，均过对比度）。**5+1 色封闭系统，中途禁加色**；换色板时小字（注释/页码）对底色对比度 ≥4.5:1（WCAG AA） |
| **网格** | 16:9（13.333 × 7.5 in）· 统一边距 0.55 · 页码右下 (12.35, 7.02) · 每页顶部 coral 短杠 + 章节 label |
| **字号阶梯** | 54 封面 / 40 大数字 / 30 页标题 / 19 卡片题 / 13 正文 / 11 次要 / 9 注释。**禁用阶梯外的中间值** |
| **字体** | 中文 Microsoft YaHei；代码 / 域名 / 数字 / 版本号一律 Consolas。技术感一半来自等宽字体的克制使用 |
| **密度** | 每页一个核心论点。文字超 3 行考虑拆页；表格超 6 行改双栏或砍行 |

## Step 3 · 生成

1. `pip install python-pptx -i https://pypi.tuna.tsinghua.edu.cn/simple`（首次）
2. 复制本 skill 的 `templates/primitives.py` 到目标项目 `scripts/gen-<name>-deck.py`，改造数据区
3. 用 primitives 组装页面，**坐标用表达式算**（如 `Inches(0.55 + i * 3.13)`），不写魔法数
4. 文本框塞内容前用 `check_fit()` 预检（字符宽估算 vs 框高），`[FIT-WARN]` 即拆行/拆页/砍字；估算保守，最终以 Step 4 为准

**动画（可选；Windows + MS Office + pywin32）**——默认走 **auto 编排**（组件适配表的代码化，扫 primitives 系统命名一键落地），手动 `fx()/stagger()` 只做微调：

```python
import primitives as P
from animate import Anim
# 生成范式页面 + 每页口播稿：
P.notes(s2, "这一页讲级联节奏：卡片 0.12s 一拍进来，重点是重叠不是排队。")
# 动画默认路径——全 deck 自动：
anim = Anim(prs)
anim.auto_deck()                       # 封面四级级联/卡片 float_up/数字 zoom/链路 wipe/尾页 grow_turn
anim.chart(gf, 'series')               # auto 之外的补充：图表动画手动声明（line 擦入即画线）
anim.fx(footer, 'fade', dur=0.4)       # 特殊元素手动补一枪
P.set_transition(prs, 'fade')          # 统一转场：fade / push-left（morph 页自动跳过）
prs.save('deck.pptx')                  # apply 必须在 save 之后
anim.apply('deck.pptx')                # COM 写入 + 读回自验证（数量/类型不齐直接报错）
```

**自动放映**（内容工厂直出视频草稿）：`P.auto_show(prs)` 按每页口播稿字数估时设 `advTm` 自动换页，配合 auto_deck 的 after/with 链 → 整 deck 放着不管自动播完，录屏即粗片；`override={页号: 秒}` 微调个别页。

**改现有 pptx**（改也是脚本改，禁手改；save 到新文件名）：

```python
from pptx import Presentation
prs = Presentation('旧文件.pptx')
P.deck_replace(prs, {'旧产品名': '新产品名'})                # 全文替换（含备注页）
P.deck_recolor(prs, dict(zip(P.THEMES['warm'].values(),     # 整 deck 换主题色
                             P.THEMES['tech'].values())))
prs.save('新文件.pptx')
```

手动挡（auto 未覆盖或要微调时）：

```python
anim.fade(title, dur=0.5)              # 淡入 + 缓出（dur 给定自动 SmoothEnd）
anim.fx(num, 'zoom', dur=0.6, delay=0.2)  # 通用入口：词表 11 种入场任选
anim.stagger(P.shape_groups(s, 'card'), 'float_up', step=0.12)
                                      # 级联：组内同进、组间 delay 递增——真重叠节奏
anim.wipe(card, 'up')                  # 方向感：up / down / left / right
# 数据增长叙事（真补间，非擦入）——auto 自动跳过其动画，占两页页码：
s0, s1 = P.growth_chart(prs, 6, 'Growth', '标题', cats, vals, highlight=2)  # 柱/条
g0, g1 = P.growth_line(prs, 8, 'Trend', '标题', cats, vals, highlight=5)    # 趋势线
d0, d1 = P.growth_donut(prs, 10, 'Mix', '标题', cats, vals)                 # 占比环
```

**效果词表**（全部 COM 实测验证，写入后 EffectType 读回一致）：`fade / wipe / appear` 基础三件；`float_up / float_down`（Float In 上浮下沉，现代高级感主力）；`zoom`（柔缩放）；`grow_turn`（Grow & Turn，图标 logo）；`ease_in / split / wheel / stretch` 备选。90 年代花活（百叶窗/棋盘/螺旋）明确不收。

**组件适配表**（默认推荐，按叙事可微调；已代码化为 `anim.auto_deck()`，一行全代劳）：

| 组件 | 推荐 |
|---|---|
| 页标题 | fade 0.5s |
| 卡片/行条 | float_up 级联，step 0.12 |
| 大数字 | zoom 0.6s（或 wipe up） |
| 链路节点 | wipe 按流向依次，step 0.1 |
| 图标/logo | grow_turn |
| 数据图表 | 一律 `growth_*`：柱/条 `growth_chart`、线 `growth_line`、环 `growth_donut`（morph 真补间）；原生 chart 仅交付后要改数据时用 |
| 封面 | kicker → 标题 → 元信息，三级 fade 级联 |
| 尾页 | logo grow_turn + 文案 fade |

**节奏 > 花活**：高级感来自时长 0.4~0.6s + 级联间隔 0.1~0.2s + 缓出，不是效果种类堆砌；一页 ≤2 种效果；chrome/背板不动；动画服务叙事节奏，不是炫技。动画在 PDF 里不可见——verify 只验 XML 结构与静态页；morph 生效可程序化验证：COM 读 `SlideShowTransition.EntryEffect == 3954`；最终动效由人工终审确认；无 Office 环境直接跳过动画做静态交付。

**页面范式速查**（覆盖 90% 技术场景，组合优于发明）：

| 范式 | 用途 | 关键布局 |
|---|---|---|
| 封面 | 开场 | 大标题 54 + 右侧竖色块 + 元信息行 |
| 章节分隔页 | 长稿导航 | `slide_section()` ink 反色 + 巨大序号 wipe up + 要点行 |
| 时间轴 | 演进/路线图 | `slide_timeline()` 横轴上下交替，hi 高亮当前位置，节点按流向 wipe |
| 对比页 | 方案 A/B、前后对比 | `slide_versus()` 左 PAPER 右 CREAM 双面板 + 中缝 VS 圆标 |
| 金句页 | 观点/转场 | `slide_quote()` 巨引号 grow_turn + 大字引用 + mono 出处 |
| 四象限卡 | 项目角色/模块 | 2×2 或 1×4 卡片，顶 coral 条 0.07 |
| 大数字墙 | 指标 | 2×3 数字卡，数字 40 coral，注释 9 Consolas |
| 柱/条图 | 数据对比 | `bar_chart()` 原生可编辑图表，Consolas 数值标签，值轴淡化 |
| 增长柱/条图 | 数据增长叙事 | `growth_chart()` 零状态→终态两页，morph 真补间（需 PowerPoint 2019+，WPS 不支持则降级 fade） |
| 增长趋势线 | 时间序列叙事 | `growth_line()` 等顶点 freeform 折线，morph 逐点插值：线从基线长出、点与标签升起 |
| 增长占比环 | 构成叙事 | `growth_donut()` 等顶点楔形扇区，morph 扫开整环绽放；环心总数 + 右图例 |
| 趋势线 · 占比环（原生） | 交付后还要在 PowerPoint 里改数据 | `line_chart / donut_chart()` 原生可编辑；动画 bldChart 只是擦入，**不做增长叙事** |
| 图文页 | 截图/产品图 + 要点 | `slide_media()` 图左文右，`picture()` 等比缩放 + 品牌边框 + 图注 |
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
# 全文扫描占位符（未改的模板默认值 / lorem / TODO）；
# 文本对比度 WCAG 初筛（bold/≥18pt 阈 3.0，其余 4.5；底色不均与近隐形 morph 脚手架跳过）。
# 退出码 1=有问题
python <本skill>/templates/verify.py <输出>.pdf
```

初筛只保证「没出页、没占位符、没明显低对比」；框级溢出生成侧已由 `check_fit` 预警。报红即改脚本重跑。

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

报告：页数 + 页面清单 / 文件路径与大小 / 三级核查结论（初筛 + 视觉逐页过，或列出已修问题）/ 口播稿页数（notes 备注，供 deck-to-video 消费）/ 自动放映总时长（auto_show 估时）/ 生成脚本位置（可复跑）。在 git 仓库内则提交脚本 + pptx。

## 边界与坑

- **无 MS Office**（如 Linux）→ Step 4 降级 LibreOffice `soffice --convert-to pdf`；两者都无 → 明确报告「未做视觉核查」，交付风险自负
- **GBK 控制台**：脚本 print 禁用 `✓` 等非 ASCII 字符，用 `OK`
- **pptx 真表格列宽失控** → 一律用行条（box + text）模拟
- **中文缺字形** → run 级设置 `font.name` 为雅黑（模板 primitives 已处理）
- **动画定位坑**：shape_id 每页独立编号不唯一，animate.py 已按 XML 树身份定位；二次开发勿按全 deck 搜 id。pywin32 依赖：`pip install pywin32 -i https://pypi.tuna.tsinghua.edu.cn/simple`
- 同一方法可做 docx（python-docx）/ xlsx（openpyxl），primitives 思路通用；但那两个是「编辑部/工作簿」范式，页面范式表仅适用 pptx
