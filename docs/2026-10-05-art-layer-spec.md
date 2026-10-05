# 美术层 Stage Spec — 画面主体升级为 SVG/AI 图一等公民

> 状态：活跃
> 2026-10-05 立项。兑现 S6 复盘指定的「下一方向」；用户拍板开工并定调技术路线：**CSS 画图不如 SVG 画图**——真矢量、程序可生成、无限缩放、可接 @remotion/paths 动画管线。

## 背景与根因

S6 武装版终审被否（2026-09-01）的根因诊断：**画面美术层空缺**——全片几乎没有真正的「图」，CSS 排版冒充画面，动效越花哨底子越空，反差越大（「小作坊感」的技术来源）。处置原话：「下一方向验证点是 AI 生图美术层（底图/插画）+ 克制动效，而非更多动效武器」。

## 判据（画面来源分层，三者职责不互换）

| 层 | 承担者 | 纪律 |
|---|---|---|
| 画面主体 | **真图**：SVG 插画（首选）/ AI 出图 raster（第二通道） | 底图是「空间」不是贴图：必须过 F1 光影（vignette/tint/SHADOW 同 tokens），与 SceneBg 空间语言连续 |
| 排版 | CSS（flex/网格/字阶） | CSS 只做版面语言（F4），不再冒充画面 |
| 动效 | 克制运镜 + 既有组件 | kenBurns ≤1.05 线性慢推，「可感不可察」；S6 铁训：动效服务画面不抢画面 |

## Station 分解

- **S1 ArtLayer 组件**（scene-kit 第 24 件）：`svg` 内联字符串（程序化插画，零 IO，模板 demo 自足）/ `src` 文件（staticFile 引用 public/）双通道；kenBurns 运镜；vignette/tint/SHADOW/radius 光影钩子。transform 只落在 `<Img>` 叶子上，absolute 遮罩层做兄弟节点（规避 transform-containing-block 坑）。
- **S2 assets/art/ 资产流**：登记表五字段（文件/来源/许可/分辨率/用途）+ 收录铁律（只收可商用；源图分辨率 ≥ 目标画布；风格须与项目背景族匹配；kebab-case）。照抄 lottie 资产流范式。
- **S3 工艺回写**：SKILL.md 质感工艺新增 F6；component-catalog 登记（标题 23→24，与 SKILL.md 声明数三方互锁，check-docs 3.5 看管）。
- **S4 Demo 与验证**：ArtLayerDemo（内联 SVG 程序化插画，全出血 + 卡片双模式同帧）；typecheck 0 错；compositions 注册 + 8 项全过；still 出图用户终审。

## 明确不做（本 spec 边界）

- **不做 AI 出图生成器**：生图发生在外部工具（反重力/Codex 等），本仓只管 intake 纪律与消费组件
- **不做矢量路径动画**：evolvePath/interpolatePath 逐帧描线/形变，等首个真项目需求再立 Stage 2
- **不扩充动效武器**：S6 终审教训，武器库不再默认往成片里堆
