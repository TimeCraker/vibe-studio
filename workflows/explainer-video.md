# Explainer Video · 项目介绍视频总装图

从一个业务（README / 官网 / 截图）到一条可发布视频。本图只做**调度**：每一步的活归对应 skill，质量关归各 skill 的核查流程，总装只多一道终审。

| | |
|---|---|
| 输入 | 一个业务 / 项目的说明材料（README、官网、截图、口碑） |
| 输出 | 成片 mp4 + 封面 PNG，落 `products/<项目名>/`（投稿表单填写见 `publish`） |
| 用到的 skill | narration · humanizer · video-motion（引擎/组件/验收）· auto-subtitle（校准）；A 线另有 ppt；C 线走 web-capture + publish |
| 仓库五区 | skills 工具 · workflows 蓝图（本图）· assets 资产库 · projects 施工区 · products 产出 |

---

## 第一步 · 选线

| | A 线（剪映全包） | B 线（Remotion 场景化成片） | C 线（代码化采集成片） |
|---|---|---|---|
| 什么时候选 | 要快、发一次就完的单片 | 要品牌统一、质感动效、可复用沉淀，或矩阵批量 | 画面已经是一个能跑的网页 / HTML / SVG 代码动画 |
| 画面怎么来 | 剪映里素材剪辑（可用 ppt skill 出 deck 当底稿） | scene-kit 组件直绘动效场景 | 无头浏览器逐帧采集已有页面（虚拟时钟保证可复现） |
| 字幕配音 | 剪映识别字幕 + 配音一步到位 | 稿驱动：narration 出稿，Remotion 渲字幕；配音剪映回填 | 字幕声明在导演页数据里，烧进画面；配音后期自行加 |
| 配乐 | 剪映 | 剪映 | 程序化生成（`scripts/make_music.py`），与画面共用同一张段落网格 |
| vibe-studio 出什么 | 只出稿（+可选 PPT）和封面 | 全链出片 + 资产回流 | 全链出片 + 封面（`web-capture` 的 `--cover`） |

判据分两句，**先看画面从哪来，再看要不要沉淀**：

1. **画面已经存在且是程序生成的**（网页/HTML/SVG 动画）→ C 线。另两条线做不出这个画面。
2. 否则：**观众只看一遍的走 A，要沉淀成内容资产的走 B。**

---

## B 线 · 九步（闭环）

```
【0 开工】 ⚙ video-motion
   新建 projects/<项目>/，复制 skills/video-motion/templates/remotion-app
   为施工工程（自带引擎 + scene-kit 组件 + MG 武器库 + vendor 精选 + tokens + 示例场景），
   npm install 即跑；第 3 步设计前先查 assets/component-catalog.md 选武器
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
【8 发布与清场（Publish & Cleanup）】 ⚙ publish
   node skills/publish/templates/run.mjs --project projects/<项目>
   跨平台填报发布；封面、发稿元数据、验收报告沉淀至 products/<项目>/；
   ★ 施工现场即刻清场：彻底删除 projects/<项目>/ 施工工程及中间帧，零历史包袱
```

**可选校准**：对成片音轨跑 auto-subtitle，比对 cues 与片内字幕时间差——漂移 >0.5s 回第 5 步。
**旁路**：已有视频素材 → FootageOverlay 叠动效（cues 声明式）；封面 → cover still 一条命令。

## C 线 · 八步（代码化采集）

```
【0 开工】 ⚙ web-capture
   新建 projects/<项目>/，准备 capture/shots.json 与 edit/（导演页 + timeline + sections）
【1 定性】
   brief.md：给谁看 / 放哪 / 多长——与 A/B 同一套三问
【2 探明】 ⚙ web-capture · probe-ui / probe-anchors
   列出真实控件清单（决定动作能触发什么）
   量出元素真实坐标（标注锚点必须是量出来的，不是估的）
   ── 先探明再写脚本，不要凭记忆写选择器 ──
【3 采集】 ⚙ web-capture · capture-all
   注入 vclock.js（虚拟时钟 + 随机数按帧重播种）→ 分块并行逐帧截图
   同一帧永远长得一样：可重跑、可 diff、可并行
【4 剪辑】 项目自带 edit/timeline.js（单元 / 取景窗 / 字幕）
   ★ 渲染前先跑项目的 validate-plan：区间、锚点、字幕节奏、越界全部过一遍
【5 配乐】 ⚙ scripts/make_music.py
   段落边界与画面共用一张网格（sections.json），改边界音乐跟着走
【6 渲染 + 核查】 ⚙ web-capture · render-director + scripts 里的核查小工具
   render-director 逐帧驱动导演页 → 截图直进 ffmpeg（不落中间 PNG）
   核查：contact_sheet 抽帧审图 / audio_report 响度与频谱 / 项目自带 verify-master 对 PSNR
【7 终审（人工，不可跳）】
   抽首/中/尾看音画同步；封面按平台比例自查（见 publish SKILL.md 的中心安全要求）
【8 发布与清场（Publish & Cleanup）】 ⚙ publish
   同 B 线：跨平台表单填报发布 → 成品信息沉淀归档至 products/<项目>/ → 施工现场即刻清场
```

**与 B 线的关键差别**：B 线是「写组件画画面」，C 线是「采集别人已经画好的画面」。
所以 C 线的可复现性靠**虚拟时钟**而不是靠 React 的帧派生，画面本身不归我们控制，
一旦源页改版就必须重采。

## A 线 · 四步

1. 定受众（同 B1，brief.md）。
2. narration 出整稿（不分页，预算按目标片长倒推）。
3. humanizer 过稿 + 出声读。
4. 剪映：导入素材（可先用 ppt skill 出 deck 当底稿）→ 配音 → 识别字幕 → 微调 → 出片；cover-still 补封面。

---

## 约定

- 五区各归其位：施工在 `projects/<项目>/`（临时作业沙盒）；产出沉淀在 `products/<项目>/`（README 标注入库，二进制大文件不入）；**交付完成后施工现场即刻清场**；可复用沉淀进 `skills/` 与 `assets/`。
- 质量关不重复建设：各 skill 的核查流程就是关卡，本图只加终审。
- **复用闭环**：开工复制模板（带出）→ 查 PAT 套方案（复用）→ 验收回流组件 + 登记方案（增值）→ 交付清场（零负担）。
- 明确不做：多语种。**配音仍走人工**（剪映或后期自行处理），vibe-studio 不做语音合成。
- **已推翻的两条旧禁令**（2026-10-02 更正）：本图原写「不做自动 BGM 混音、不做自动发布」。
  前者已被 `scripts/make_music.py` 推翻（C 线的配乐就是程序化生成再混音），
  后者已被 [`skills/publish/`](../skills/publish/SKILL.md) 推翻（表单填写自动化，发布仍由人点）。
  两条都不是禁令了，但都保留了人工节点：配乐要人审听，发布要人点。
