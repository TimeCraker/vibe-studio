# 成页方案库（Scene Patterns）

> 已验证的成页方案。画面设计（流程第 3 步）先来这里查：同类情景有方案 → 套用改参数；没有 → 按「场景设计方法」（video-motion SKILL.md）新设计，**做完回来登记**。
> 参考帧都在 `products/<项目>/` 下（验收抽帧证据）。
> 新条目模板见文末。命名 `PAT-<序号>`，序号只增不改。

## 索引

| 编号 | 情景 | 一句话版式 | 出处 |
|---|---|---|---|
| PAT-01 | 品牌开场 | 深底光晕 + logo 漂浮 + 大字 + 功能 chips | lekao P1 |
| PAT-02 | 叙事痛点 | 左拆项清单 + 右终端打字待办 | lekao P2 |
| PAT-03 | 产品总览/对话演示 | 左三件事清单 + 右手机壳聊天回放 | lekao P3 |
| PAT-04 | 功能演示·上传识别类 | 左三步 + 成品清单卡 + 右扫描线插画 | lekao P4 |
| PAT-05 | 功能演示·规格选择类 | 全屏眉题 + 大插画角标卡 + 底部规格 chips | lekao P5 |
| PAT-06 | 功能演示·速度优势类 | 镜像双栏：插画角标卡 + 步骤 + CountUp 大数字 | lekao P6 |
| PAT-07 | 数据说服·规则+增长 | 左规则行（币锚+mono 数字）+ 右递增柱图 | lekao P7 |
| PAT-08 | 体验细节·移动端 | 左 A/B/C 要点 + 右手机屏「截图段+自绘段」 | lekao P8 |
| PAT-09 | 流程说明·三步上手 | 横排大编号卡 + 流动虚线箭头 + 衬光 | lekao P9 |
| PAT-10 | 价值金句 | 深底光晕 + 引导句 + 150px 两行金句 + 对比插画 | lekao P10 |
| PAT-11 | 行动号召 CTA | 左 150px CTA + mono 域名 + 右浏览器特写高亮圈 | lekao P11 |
| PAT-12 | 封面出图 | 深族底 + 浏览器 hero 特写 + 金句 + chips + 进度条 | lekao 封面 |

---

## PAT-01 · 品牌开场

- **适用**：第一页，建立品牌与产品名
- **版式**（深族）：GlowPulse 光晕（680，intensity 0.5）居中上衬 + logo 漂浮（FloatWrap 4.2s）+ 130px TextReveal 大字（品牌名品牌色高亮）+ 副标 + mono 域名 + 三功能 chips（StaggerList 横排，深色卡片+边光）
- **组件**：SceneBg(dark) / GlowPulse / FloatWrap / TextReveal / StaggerList / SpringIn
- **坑**：chips 要双层阴影+1px 边光（深底无阴影=贴纸）；域名用等宽字体
- **参考帧**：`products/lekao-intro/v3-kit/frames-v3/p01-*.png`

## PAT-02 · 叙事痛点

- **适用**：讲用户现状之苦（重复劳动/耗时工序）
- **版式**（浅族，SceneShell 双栏）：左 StepItem×3（mono 编号+竖线）+ 一句总结；右 TypingTerminal 打字待办清单（$ 品牌提示符+块光标）
- **组件**：SceneBg(light) / SceneShell / StepItem / TypingTerminal / StaggerList
- **坑**：清单文案与终端文案同源（同一组事实两个视角）；终端是「进行时证据」（打字+光标闪烁）
- **参考帧**：`products/lekao-intro/v3-kit/frames-v3/p02-*.png`

## PAT-03 · 产品总览（对话演示）

- **适用**：一句话讲清产品做什么，用对话具象化
- **版式**（浅族双栏）：左 StepItem×3（产品三件事，每条带交付物口径）+ 引导句；右 ChatReplay 手机壳（shell）对话回放：用户抱怨→AI 应答→交付
- **组件**：SceneShell / StepItem / ChatReplay(shell, shellTitle=品牌名)
- **坑**：对话要短（≤5 条）、有交付感；聊天头名称用 shellTitle 传品牌名
- **参考帧**：`products/lekao-intro/v3-kit/frames-v3/p03-*.png`

## PAT-04 · 功能演示（上传→识别→生成）

- **适用**：功能 = 传入素材自动处理出成品
- **版式**（浅族双栏）：左 StepItem×3（STEP 编号）+ DropCard 成品清单卡（品牌色左边线+mono 小标）；右 ScanCard 插画（扫描线 2.8s 周期+「AI 识别中」角标）
- **组件**：SceneShell / StepItem / DropCard / ScanCard / GlowPulse / FloatWrap
- **坑**：ScanCard 的 width 必须显式传（包装组件丢 width = 撑爆版面）；扫描线 = 进行时证据
- **参考帧**：`products/lekao-intro/v3-kit/frames-v3/p04-*.png`

## PAT-05 · 功能演示（规格/档位选择）

- **适用**：功能卖点 = 可选规格（字数/时长/档位）
- **版式**（浅族全屏）：Chrome 眉题+120px 标题 + 副句 + 居中 IllustCard 大插画（640，角标「规格口径」）+ 底部规格 chips 一排（StaggerList）
- **组件**：Chrome / IllustCard / StaggerList / FloatWrap
- **坑**：chips 数字档位用 mono 字体；角标口径必须取自真实文档（禁编造）
- **参考帧**：`products/lekao-intro/v3-kit/frames-v3/p05-*.png`

## PAT-06 · 功能演示（速度/效率优势）

- **适用**：卖点 = 快/省时（镜像布局与前页呼应）
- **版式**（浅族）：左 IllustCard 插画（角标「成品格式」）+ 右 StepItem×3 + CountUp 大数字（如「5 分钟」）
- **组件**：Chrome / IllustCard / StepItem / CountUp
- **坑**：CountUp 数字要有出处；「不消耗 XX」类承诺只取真实文档
- **参考帧**：`products/lekao-intro/v3-kit/frames-v3/p06-*.png`

## PAT-07 · 数据说服（规则 + 增长曲线）

- **适用**：积分/额度/定价/增长规则说明
- **版式**（深族双栏）：左 RuleRow×3（CoinIcon/币锚 + mono 数字 + 说明，分隔线）+ 一句兜底（如失败退回）；右 ChartGrow 递增柱图（末柱高亮 + 呼吸光环 + 币锚）+ 说明行
- **组件**：SceneShell(dark) / RuleRow / ChartGrow / CoinIcon / GlowPulse
- **坑**：柱值与规则行必须同源同口径（出处标进设计表）；末柱光环 = 进行时证据
- **参考帧**：`products/lekao-intro/v3-kit/frames-v3/p07-*.png`

## PAT-08 · 体验细节（移动端）

- **适用**：讲端上体验（压缩/流式/本地存储等工程细节）
- **版式**（浅族双栏）：左 StepItem×3（字母编号 A/B/C）；右手机屏两段式 = 上段官网截图特写（高亮圈+「官网首屏」角标）+ 下段深色自绘功能行列表（干净水平分界）
- **组件**：SceneShell / StepItem / PhoneShell / DeviceFrame(scroll/zoom)
- **坑**：**长截图先验空白率**（懒加载空图滚动=死空气），内容截断在 54% 以内就改「裁切特写+自绘续接」；灵动岛压浅色段
- **参考帧**：`products/lekao-intro/v3-kit/frames-v3/p08-*.png`

## PAT-09 · 流程说明（三步上手）

- **适用**：上手步骤 / 使用流程
- **版式**（浅族全屏横排）：三张 DropCard 大编号卡（mono 58px 编号）+ 卡间 FlowArrow 流动虚线箭头 + 首卡 GlowPulse 衬光 + 末卡「成品」角标 + 底部一句
- **组件**：Chrome / DropCard / FlowArrow / GlowPulse / FloatWrap
- **坑**：三卡错峰漂浮（phase 错开）；箭头虚线 dashoffset 流动 = 进行时证据
- **参考帧**：`products/lekao-intro/v3-kit/frames-v3/p09-*.png`

## PAT-10 · 价值金句

- **适用**：全片记忆点，一句话总结价值
- **版式**（深族居中）：GlowPulse + 引导句（弱化）+ 150px 两行金句（关键词品牌色高亮，手动断行）+ IllustCard 对比插画（小，500）
- **组件**：SceneBg(dark) / GlowPulse / TextReveal / IllustCard / FloatWrap
- **坑**：150px 行宽实测会超估算，容器留 ~10% 余量 + 显式 `\n`（自动换行会拆词跨行）
- **参考帧**：`products/lekao-intro/v3-kit/frames-v3/p10-*.png`

## PAT-11 · 行动号召 CTA

- **适用**：末页，给入口给动作
- **版式**（深族左右）：左 Chrome 眉题 + 150px CTA + mono 域名（品牌亮色）+ 利益句；右 DeviceFrame 浏览器特写（真标签栏+锁形地址）+ 高亮圈圈地址栏 +「官方域名」角标
- **组件**：SceneBg(dark) / Chrome / DeviceFrame(browser) / GlowPulse / FloatWrap
- **坑**：浏览器必须有标签条+锁形（F2 放大关）；高亮圈坐标按浏览器宽计算
- **参考帧**：`products/lekao-intro/v3-kit/frames-v3/p11-*.png`

## PAT-12 · 封面出图

- **适用**：发布配图（1920×1080 静帧）
- **版式**（深族）：SceneBg + 浏览器 hero 特写（zoom 1.5 + GlowPulse 后衬 + DropCard + rim）+ 150px 金句 + 三功能 chips + mono 域名 + 顶部 2px 装饰进度条
- **组件**：CoverV3 全套（独立入口 cover3-index.ts，still --frame=60）
- **坑**：still 帧号要容纳入场 spring（frame=60 走完）；复查须换新文件名防缓存
- **参考帧**：`products/lekao-intro/cover-v3.png`

---

## 新条目模板

```markdown
## PAT-<NN> · <方案名>
- **适用**：<什么情景用>
- **版式**（<族>）：<版式描述，含关键尺寸/字号>
- **组件**：<组件清单>
- **坑**：<本方案踩过的坑，一句话>
- **参考帧**：`products/<项目>/…`
- **复用记录**：<哪个项目套用过、改了什么>（首登时省略）
```
