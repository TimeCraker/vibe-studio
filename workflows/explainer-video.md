# Explainer Video · 项目介绍视频总装图

从一个业务（README / 官网 / 截图）到一条可发布视频。本图只做**调度**：每一步的活归对应 skill，质量关归各 skill 的核查流程，总装只多一道终审。

| | |
|---|---|
| 输入 | 一个业务 / 项目的说明材料（README、官网、截图、口碑） |
| 输出 | 成片 mp4 + 封面 PNG，落 `products/<项目名>/` |
| 用到的 skill | narration · humanizer · video-motion（引擎/组件/验收）· auto-subtitle（校准）；A 线另有 ppt |
| 仓库五区 | skills 工具 · workflows 蓝图（本图）· assets 资产库 · projects 施工区 · products 产出 |

---

## 第一步 · 选线

| | A 线（剪映全包） | B 线（Remotion 场景化成片） |
|---|---|---|
| 什么时候选 | 要快、发一次就完的单片 | 要品牌统一、质感动效、可复用沉淀，或矩阵批量 |
| 画面怎么来 | 剪映里素材剪辑（可用 ppt skill 出 deck 当底稿） | scene-kit 组件直绘动效场景 |
| 字幕配音 | 剪映识别字幕 + 配音一步到位 | 稿驱动：narration 出稿，Remotion 渲字幕；配音剪映回填 |
| vibe-studio 出什么 | 只出稿（+可选 PPT）和封面 | 全链出片 + 资产回流 |

一句话判据：**观众只看一遍的走 A，要沉淀成内容资产的走 B。**

---

## B 线 · 八步（闭环）

```
【0 开工】 ⚙ video-motion
   新建 projects/<项目>/，复制 skills/video-motion/templates/remotion-app
   为施工工程（自带引擎 + scene-kit 组件 + tokens + 示例场景），npm install 即跑
【1 定性】
   brief.md：给谁看 / 放哪 / 多长 / 要观众做什么——之后所有取舍用它裁决
【2 文案】 ⚙ narration（可叠 ⚙ humanizer 深度过稿）
   script.json 分段口播稿（钩子→痛点→方案→证明→CTA），verify_narration.py 全绿
【3 画面设计】 ⚙ video-motion 场景设计方法（六类内容 + 三条规则）
   ★ 先查 assets/patterns.md：同类情景有 PAT → 套用改参数；无 → 从零设计
   逐页设计表（文案摘要→内容类型→主体→背景族→组件组合→信息包出处）
   ── 设计表送审（门禁），过了才写代码 ──
【4 画面施工】 ⚙ video-motion · scene-kit + tokens
   只改施工工程的 deck-scenes.tsx（SCENES / DARK_PAGES）；素材进 public/
   （截图先验空白率；插画过 200% 放大关；口径只取真实文档）
【5 配音】
   SAPI 占位跑通管线 → 剪映逐页真人配音 page-N.wav 回填
   build-deck-params.mjs 派生页时长/字幕时刻（生成物禁手改）
【6 渲染 + 四级验收】 ⚙ video-motion
   render DeckVideoV2 → products/<项目>/deck.mp4
   L1 程序对账 / L2 每页 4 帧 + 道具 200% / L2.5 静音盲答 / L3 报告
   底线 = docs/motion-grammar（八问 + F1-F5 + PPT 感一票否决）
【7 终审（人工，不可跳）+ 回流】
   抽首/中/尾听音画同步；封面文字完整；BGM 剪映加、别盖人声
   ★ 回流铁律：组件改进回写 skill 模板；新成页方案登记 assets/patterns.md；
     教训进 docs/workorder-log.md（详见 assets/README.md）
```

**可选校准**：对成片音轨跑 auto-subtitle，比对 cues 与片内字幕时间差——漂移 >0.5s 回第 5 步。
**旁路**：已有视频素材 → FootageOverlay 叠动效（cues 声明式）；封面 → cover still 一条命令。

## A 线 · 四步

1. 定受众（同 B1，brief.md）。
2. narration 出整稿（不分页，预算按目标片长倒推）。
3. humanizer 过稿 + 出声读。
4. 剪映：导入素材（可先用 ppt skill 出 deck 当底稿）→ 配音 → 识别字幕 → 微调 → 出片；cover-still 补封面。

---

## 约定

- 五区各归其位：施工在 `projects/<项目>/`（代码+设计文档入库，素材 public/ 不入）；产出在 `products/<项目>/`（README 标注入库，二进制不入）；复用家底在 `assets/`。
- 质量关不重复建设：各 skill 的核查流程就是关卡，本图只加终审。
- **复用闭环**：开工复制模板（带出）→ 查 PAT 套方案（复用）→ 验收回流组件 + 登记方案（增值）。
- 明确不做：自动 BGM 混音（剪映手动）、自动发布、多语种。
