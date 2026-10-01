# 工单台账（已完成）

> 跑完一份工单就在这里整理进一节：目标 / 结果 / 关键决策与理由 / 数据 / 教训遗留。
> 详细验收证据在 `products/`（按项目/站点），原始 spec 完成后并入本档不再单独留存（git 历史可查）。
> 在跑工单仍是独立文件（如 v4 spec），完成并验收后收编进本档。

---

## 2026-08-29 · video-motion 首站 — 视频底材叠动效（Remotion）

**目标**：第三个 skill——真实视频上叠字幕/数据柱/圈注三层动效，一条命令出 mp4。
**结果**：ALL GREEN 验收（demo.mp4 30s，退出码/抽帧/用户看片三级过）。

**关键决策与理由**
- 选型 Remotion（对比 Motion Canvas / Revideo / manim）：视频素材叠加动效是一等公民、官方有 AI 代理文档、一套引擎覆盖未来「PPT 逐页成片」。
- 设计即代码：坐标/时刻/文本全声明在 `src/cues.ts`，fx 组件零硬编码；分辨率帧率随素材走（`probe-footage.mjs` ffprobe 探针生成 footage-params.ts）。
- 三层动效契约定死：`SubtitleTrack` / `DataBars` / `Spotlight`（circle/arrow/box）。

**验收后修复工单**（用户看片反馈两条）
- ① 1080p30 相比素材 1440p60 双降 → `3818e59` FootageOverlay 升原生规格 + `7b42f10` 探针脚本，重渲 `2560×1440@60`（compositions 1831 帧验证）。
- ② 产物落在 skill 内 `out/` 违反目录法 → 迁出到项目根 output/，确立「skill 是纯工具，产物一律放项目产出区」。

**教训**：产物目录纪律从第一天就要执行，不然后面要开修复工单。

---

## 2026-08-29 · auto-subtitle 第二站 — faster-whisper 自动字幕

**目标**：音视频进、`SubtitleCue[]` JSON 出（字段与 video-motion 逐字一致），消灭手写字幕时间轴。
**结果**：全绿上线。中文测试素材相似度达标，纯音效素材零幻觉长句。

**关键决策与理由**
- 选型 SYSTRAN/faster-whisper（对比 whisper.cpp / whisperX / pyvideotrans）：纯 pip、CPU int8 快 4 倍、段级秒时间戳直接对齐契约、Silero VAD 静音过滤防幻觉。
- 明确不做：说话人分离、词级时间戳、翻译、TTS。
- HF 下载走 `hf-mirror.com` 镜像（China 网络）。

---

## 2026-08-29 · narration 第三站 — 口播稿工坊

**目标**：口播稿当「带时间结构的数据」处理——分段稿 JSON + 程序校验器，红绿分明。
**结果**：全绿上线。`verify_narration.py`：合法稿退出 0；段超长/总时长超预算/破折号禁令各抓红退出 1。

**关键决策与理由**
- 中文 4.5 字/秒口径，字数即秒数（时长工程程序化）。
- TTS 配音用剪映（人工），**不做语音合成**——SAPI 只许占位。
- 设计对齐仓库哲学：ppt 有 verify.py、video-motion 有抽帧核查，narration 补上头号工件的校验闭环。

---

## 2026-08-29 · deck-video 第四站 — PPT 逐页成片（v1）

**目标**：pptx 页图 + 逐页配音 → Remotion 直出 mp4；页时长跟配音实际长度走。
**结果**：全绿（deck-test 10 页链路打通，页序/页时长/0.5s 交叉溶解/字幕时间轴全部按声明工作）。

**关键决策与理由**
- 复用 video-motion 引擎（兑现「一套引擎」选型），不建新工程。
- 派生值哲学：`build-deck-params.mjs`（ffprobe 逐页音频时长 → deck-params.ts；script.json 按字数摊时 → deck-cues.ts），生成物禁手改。
- 页图管线复用 ppt skill 的 COM→PDF→pymupdf（200dpi）。

**遗留**：字幕按字数比例摊时，页内误差 ≤0.5s（够用，精校属 auto-subtitle 线）。

---

## 2026-08-29 · cover-still — 封面静态出图

**目标**：video-motion 第三能力——`remotion still` 一条命令出 1920×1080 封面 PNG。
**结果**：全绿（photo/dark/clean 三 preset + 遮罩可读性核查）。

**关键决策与理由**
- 独立入口 `cover-index.ts` 自己 registerRoot，不碰 Root.tsx——与 deck 站并行施工零冲突的机制保证。
- props 契约：`{ title, subtitle?, badge?, bg?, preset }`，subtitle 省略即不渲染。

---

## 2026-08-30 · deck-video v2 — 场景化重做（架构反转）

**目标**：v1 被判「太素太单薄」（PPT 整页位图+页间溶解）→ 画面主体换成 Remotion 原生组件场景，PPT 降级为内容来源。
**结果**：全绿交付，但用户看片判「太 low」——静帧质感不过关（裸色块/衬线字/无光影），引出 v3。

**关键决策与理由**
- 前置产出《动效语法》`motion-grammar.md`（拆 B 站标杆片 BV1fShG6LETU 得 V1-V4/M1-M4 规则）作为质量底线——先立规矩再施工。
- 场景设计表前置复核（每页文案→内容类型→主体→组件组合→理由），过了才写代码。
- v1 存量零触碰（对照保留）。

**教训**：v2 暴露「会动的 PPT 仍是 PPT」——动效语法管住了动，没管住质感，引出 v3 的 F1-F5。

---

## 2026-08-30 · deck-video v3 — 质感攻坚（F1-F5 质感层）

**目标**：解「太 low」——光影成体系、道具经得起放大、无死空间、版面一体、信息自足。
**结果**：四级验收全绿（3302 帧/110.07s，deck-v3.mp4 28.1MB），用户终审「勉强及格」，Stage 4 封箱（CoverV3 + SKILL 质感工艺节，commit 链 70b0d24→3f8874e）。

**关键决策与理由**
- 质感层五条硬关 F1-F5 并入 motion-grammar（§三.5），八问口诀 + PPT 感一票否决 + 静音测试双门禁。
- 取值单源 tokens.ts（COLOR/SHADOW/RIM/TYPE/FONT），DropCard 统一承载卡片光影。
- 四级验收：L1 程序（真退出码，禁管道尾）→ L2 每页 4 帧含 200% 道具放大 → L2.5 静音盲答 11/11 → L3 报告 + 新旧对照表。
- 修复轮三大根因全部沉淀为规则：完成态帧必须有进行时证据（光标/呼吸光环/流动虚线）；包装组件必须显式透传 `width`；长截图先验空白率再定滚动/裁切。

**遗留**（用户拍板的后续线）：配音（剪映真人声回填 page-N.wav）；插画素材升级（AI 出图，提示词单在 projects/lekao-intro/asset-prompts.md）；运镜与进场动效（→ v4 spec）。

---

## 2026-08-31 · 仓库五区重组 — 分类法落地

**目标**：用户拍板分类法：skills（纯工具）/ workflows（蓝图）/ assets（资产库）/ projects（施工区）/ products（产出），解散 output/，docs 收编。
**结果**：见当次提交。

**关键决策与理由**
- lekao 施工工程整体迁出 skill → `projects/lekao-intro/`（项目隔离，代码入库）；skill 模板重建为纯净态（引擎 + demo 场景 + 示例数据，开箱可渲，`compositions` 七项全过验证）。
- **引擎/场景拆分**：DeckVideoV2.tsx 拆为引擎（页序/字幕/音频机制，模板与项目同源）+ deck-scenes.tsx（项目场景，换项目只换这一个文件）；ChatReplay 硬编码的「LeKao 智能助教」表头改为 `shellTitle` prop。拆分后 compositions 3302 帧与 v3 封箱态逐帧一致（零行为变化）。
- 素材归属三规则：项目素材跟项目（projects/<p>/…/public/）、可复用测试素材进 assets/（footage.mp4）、成品进 products/。
- docs 不设 archive：完成工单收编本台账一节，原文不单独留存；产物 README 标注入库、二进制不入库。
- v4 工单同步改名（「编舞」→「进场动效」术语全部说人话）+ 路径更新。

**教训**：分类法第一天不执行，第二天就要开重组工单——目录纪律和代码纪律同级。

---

## 2026-09-01 · MG 武器库 S0-S6 — 全副武装的 Remotion 成片线

**目标**：v1-v3「全绿验收但看片被否」根因 = 只用 Remotion 的 DOM/CSS 子集 + 缺 MG（Motion Graphics）工艺。用户拍板：官方包全量装、做极致 MG、社区库精选入库、lekao P7 实战验证。
**结果**：七站全部提交，P7 武装版四级验收全绿，5 项回流完成。

**关键决策与理由**
- **吸收合并**：未施工的 v4 进场动效工单整体吸收进本工单（S2 承接其 Stage 0），v4 文件转证据存档——两份 spec 并行必打架。
- **版本纪律**：17 个 `@remotion/*` 精确锁 4.0.518 不带 `^`；three 走 React 19 兼容的 fiber@9。
- **社区库走 vendor**：RemotionUI/Onda/snapcn 都是 shadcn 式 copy-paste 源码库（npm 包只是 CLI），精选 2 件（cursor-track/depth-push，双 MIT 一手验证）进 `src/vendor/`，intake 四纪律管住。
- **引擎律落地**：页间硬切为底（OVERLAP 0.5→0，全片 3302→3287 帧）、动词全在页内内容层、相邻页动词不同型——进 motion-grammar M5-M7。

**教训**
- **transform 包装双坑**（S6 同日两炸）：带 transform 的包装动词包 absolute 子树 → containing block 变换 + 流内高度塌 0 → 整页顶格溢出。修法：组件根自足（CameraPush 根 inset 0；BlurTrail 主层流内、残影层 absolute——官方 Trail 根是 AbsoluteFill 页级语义，元素级必须 relative 化）。像素定位（coin 金色 y 扫描）比读图快且硬。
- **4.0.518 文档与实现有出入**：evolvePath/interpolatePath/fitText/parseSrt 四处实测纠偏，全部回写 SKILL.md——版本升级后「记忆里的 API」不可信，先 node -e 打真实返回形状。
- **esbuild 容忍 ≠ 类型干净**：cursor-track 重复 import、mg-demos 重复 useCurrentFrame 在渲染链路永远不炸，tsc 一过就现形——每站该跑 tsc 而不只是渲绿。

---

## 2026-09-01 · S6 武装版交付被否 — 终审复盘

**用户终审**：「还不如之前没有武器库的效果」。deck-armed.mp4 归档为 deck-armed-REJECTED.mp4，**deck-v3.mp4 恢复为当前交付版**。

**为什么武装版比 v3 更差（四条，按权重）**
1. **画面美术层空缺是根子**：全片几乎没有真正的「图」，CSS 排版冒充画面。动效越花哨，底子越空，反差越大——「小作坊」感的来源，不是动效不够，是底下没有美术。
2. **一页塞九种动效没有主次**：滑入/级联/下划线/残影/呼吸环/揭示/颗粒/慢推/标题呼吸同页全开，互相抢注意力，读作乱而不是贵。
3. **硬切引擎只配套了 1 页**：其余 10 页是 v3 弱进场（透明度淡入），硬切后 0.3s 近空版面——比 v3 的软溶解更生硬。引擎律和场景动词必须成套落地，半套就是双输。
4. **交付前未看全片**：agent 只验了 P7 单页和程序对账，两处切点黑帧（孤儿取整）流出到用户眼前。

**处置**：武器库代码留在模板库存（demo 验证过单件质量），**不再默认往成片里堆**；成片线以 v3 为准。下一方向若继续，验证点是 AI 生图美术层（底图/插画）+ 克制动效，而非更多动效武器。

---

## 2026-09-04 · elephant-plan — elephant-e-ai 2a 冲刺排期图（ppt skill）

> 补录 2026-09-30：事后补记，证据为 git 历史（b59cc59 → eb916d1）与脚本现场。

**目标**：给 elephant-e-ai 2a 冲刺出两人并行排期 deck（2 页）：P1 依赖分层图（每卡显式前置 + 依赖箭头：相邻层实线 / 跨层虚线 / 关键路径粗黑线），P2 盯三件事。
**结果**：v3 两页图交付并入库（projects/elephant-plan/plan-v3-p1.png、plan-v3-p2.png），生成脚本可复跑。

**关键决策与理由**
- 数据源取上游仓库的 openspec 计划文档 §2 依赖表（origin/master 22c5ba4，2026-09-04），排期事实不在本仓重写。
- 双线配色区分人（B 线蓝 / A 线红，弹性件灰），关键路径单独用粗黑线压过双色。
- eb916d1 把绘图函数抽取为 scripts/primitives.py 积木箱（989 行，含 check_fit 溢出自检），gen 脚本只留页面编排——该积木箱随后被 eai-ops-training 整份复用（两份文件哈希一致）。

---

## 2026-09-08 · eai-ops-training — 小象智汇执行器运营培训教材（ppt skill）

> 补录 2026-09-30：事后补记，证据为 git 历史（5db4390）与脚本现场。

**目标**：给小象智汇「成绩执行器」的代理商运营 / 装机负责人（外行，不写代码）出一套可复跑的运营培训教材 deck；受众三问先行，主线「8 分钟完成装机配置，之后日常导出全自动」。
**结果**：单笔提交（5db4390）入库 5 件共 1800 行：gen 脚本 345 行（封面主张「装一次，之后全自动」，四章：网页配置 3 分钟 / 安装 3 分钟 / 验证 2 分钟 / 日常全自动）+ primitives 积木箱 + animate（动画编排）+ annotate（截图圈注）+ verify（渲染核查）。

**关键决策与理由**
- 外行受众：装机步骤全程截图圈注（annotate），每章章节页带分钟数承诺，单列一页打消「装完以后要不要管它」。
- 积木箱抽取后首个带全链工艺的工单：animate / annotate / verify 与 gen 同仓配套，工艺链完整沉淀在项目内。

---

## 2026-09-23 · resume — A4 铜版 HTML 简历管线与投递向变体

> 补录 2026-09-30：事后补记，证据为 git 历史（c59db77 → 4191973 → a769d91）与脚本现场。

**目标**：简历走「设计即代码」：HTML/CSS 母版 + 无头浏览器打印 A4 PDF，可复跑、可 diff，按投递方向出变体。
**结果**：三笔提交成线——c59db77（2026-09-01，管线首发：index 母版 + opt-a~d 四方案 + v1 + render-pdf.py，16 文件 2330 行，QA PNG 不入库）→ 4191973（2026-09-03，opt-d 文案打磨）→ a769d91（2026-09-23，方案 D 定稿为母版，build_variants.py 生成三份投递向变体：ai-agent / fullstack-miniprogram / game-client，base.css 母版样式扩展）。

**关键决策与理由**
- 渲染不引 PDF 库：render-pdf.py 自动探测本机 Chrome / Edge 无头打印，零额外依赖。
- opt-a~d 是方案探索留档，D 方案胜出后由 build_variants.py（699 行）承接：母版 D + 分方向配色 / 纹样 / 侧重点。
- 简历属个人产出不入 products/，管线与源码入 scripts/resume/。

---

## 2026-10-01 · pelican-test — 「鹈鹕测试」实测成片（新管线：HTML 动画 → 成片）

**目标**：把两个第三方生成的「鹈鹕骑自行车」SVG 动画 HTML，做成一条 63 秒可直接发布的成片（节奏剪辑 + 配乐 + 字幕，不要配音）。
**结果**：单笔提交 1a24cf4 入库 33 文件 3921 行；成片 63.4s / 1920×1080 / 60fps / 65MB，24 条字幕烧进画面，另出 SRT + 封面 + 各平台标题文案（`products/pelican-test/`）。抽帧 PSNR 6/6 ≥36dB，容器与实际流参数一致。

**关键决策与理由**
- **没走 Remotion**：原动画是 `requestAnimationFrame` + `performance.now()` 驱动，且要精确控制运镜与标注锚点。改用 CDP + 虚拟时钟（`tools/vclock.js` 把墙钟 / `setTimeout` / `Math.random` 全部虚拟化）逐帧推进后截图，成片是帧号的纯函数，可重跑可 diff。`Math.random` 按绝对虚拟时间**每帧重播种**，因此分片并行采集与单进程采集逐字节一致。
- **没拼 ffmpeg 滤镜图**：写了个 ~450 行「导演页」（`edit/director.js`），canvas 管画面与运镜、DOM 管排版。实测一帧渲染只要 5ms，时间全花在浏览器截屏上 —— 所以先测了截屏格式（PNG `optimizeForSpeed` 330ms vs 默认 586ms vs JPEG q95 210ms），选了无损的 PNG 快档，全程省掉一次重渲染。
- **不猜页面内部状态**：动画脚本是 IIFE，`state` 拿不到。先 `probe-ui.mjs` 列出所有真实控件，再用 DOM 事件驱动（点按钮 / 派发 input），主题与速度都靠这方式设定。
- **标注点必须是真的**：`probe-anchors.mjs` 读 `getBoundingClientRect` 拿到车铃 / 膝盖 / 牙盘等元素的真实归一化坐标，标注在源空间锚定后经同一套 view 变换投影到画面 —— 运镜推拉时标注会跟着特征走。写完立刻发现「车铃」和「向日葵车筐」只差 34px，遂把那条标注换成踏板，避免指错。
- **三处「先验证再烧时间」**：采集前探 UI、渲染前 `validate-plan.mjs` 校验（区间连续 / 段落对齐 / 素材越界 / 标注出画 / 字幕语速 / 字幕与画面大字重复）、配乐用 `audio_report.py` 量底鼓落点（中位偏差 +0.5ms）与和声走向（Am7-F-C-G 命中 99%）。
- **配乐不引音源**：numpy 程序合成 100 BPM，段落边界取自 `edit/sections.json`，音乐的重拍 / riser / impact 自动跟随剪辑段落。踩过两个坑：FFT 滤波出的包络会振铃到负数、把压缩器增益打爆（改用前缀和滑动 RMS）；混响 IR 按峰值归一化会让湿声压过干声（改成按能量归一化）。

**遗留**
- 采集 4K、成片 1080p；`VIEWS` 里 `w < 0.42` 的特写会明显变软，需要更近的特写得按「缩放页面再采集」重采。
- 只有 16:9；竖版需另出（改 `VIEWS` 与字幕位）。
- 片中对模型的判断只到「合理怀疑」，未断言提示词是否相同与具体版本 —— 这条口径写进了 `PUBLISH.md`。
