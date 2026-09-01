# MG 武器库全量升级 Stage Spec — 官方包 + 社区库 + Lottie 资产

> 目标:解「介绍成片质感三连否」(v1 太素 → v2 太 low → v3 勉强及格)的装备层根因:Remotion 官方 30+ 包模板只装 4 个,只用 DOM/CSS 子集画画面。本站把 MG(Motion Graphics)武器全量装进 `skills/video-motion/templates/remotion-app/`,并吸收合并未施工的 v4 转场/进场工单。
> 定位校准:我们要做的是 MG(行业成熟学科,AE 生态为参照),Remotion 是代码版 MG 工具;天花板 = 网页视觉全栈(Vox / Kurzgesagt / 苹果发布会图文级),不是 AI 生成实拍颗粒。
> 产物:模板升级(13 个官方包 + 三件套社区库 vendor + assets 资产目录)+ lekao P7 一页全副武装对照 + 回流五连。

## §0 规则与护栏(继承 v4 §0,整体有效)

1. **v3 已封箱**(HEAD 应见 3f8874e)。S6 之前所有改动只落在 `skills/video-motion/templates/remotion-app/` 与依赖文件;S6 起进入 `projects/lekao-intro/remotion-app/`,改动仅限:`src/deck-scenes.tsx`、`src/DeckVideoV2.tsx`、`src/scene-kit/`、build-deck-params.mjs 一处常量(各 remotion-app 工程的 scripts/ 内)、设计文档与验收文档。**deck.mp4 / deck-v2.mp4 / deck-v3.mp4 / cover-v3.png 及 v1 存量零触碰**(字节与 mtime 不变)。
2. **Root.tsx 七 compositions 契约全程不动**(Stage0Test / FootageOverlay / DeckVideo / DeckVideoV2 / SubtitleDemo / DataBarsDemo / SpotlightDemo);武器库 demo 全部走独立入口 `remotion/mg-index.ts`(registerRoot,沿用 lekao `remotion/demo-index.ts` 先例)。
3. 只 `git add` 本站文件,不 push。同一问题连续 2 轮修复仍有红项 → 停下报告。
4. 确定性铁律:渲染函数内禁 `Math.random()` / `Date.now()` / `new Date()`;伪随机用索引式(`(i * 137) % 100`)。**验收含同帧双渲 PNG hash 一致**(Lottie/Noise/Three 段必测)。
5. 画面自拟文案照查禁词表:付费/充值/价格/收费/免费/退款/成本/花钱/赋能/闭环/沉淀/矩阵/生态/一站式/端到端。
6. 模板 `public/` 不被 gitignore 覆盖:媒体验证素材用完必须删除再提交(git status 证零残留)。

## §1 依赖批装(S0)

模板与 lekao 两工程同批执行(npmmirror 已配 `.npmrc`):

```bash
npm i @remotion/motion-blur@4.0.518 @remotion/paths@4.0.518 @remotion/noise@4.0.518 \
  @remotion/transitions@4.0.518 @remotion/layout-utils@4.0.518 @remotion/animation-utils@4.0.518 \
  @remotion/lottie@4.0.518 @remotion/three@4.0.518 @remotion/shapes@4.0.518 \
  @remotion/captions@4.0.518 @remotion/google-fonts@4.0.518 @remotion/fonts@4.0.518 \
  @remotion/gif@4.0.518 three@^0.185.1 @react-three/fiber@^9.7.0 @types/three lottie-web@^5.13.0
```

- **版本铁律**:新包精确 `4.0.518` 不带 `^`(存量锁死,浮版即 Remotion 硬报错);`@remotion/three` 的 remotion peer 本就精确 4.0.518,双保险。
- React 19 → `@react-three/fiber` 必须 v9(v8 只配 React 18);只走 WebGL,WebGPU canvas 不入 headless 渲染链。
- `zod` 随 S5 vendor 引入,不在本批。
- `@remotion/google-fonts` 渲染时从 fonts.gstatic.com 拉字模,中国网络大概率卡:包装依赖、装载工具单列 `src/fonts.ts`,**不进确定性验收链**;生产走自托管 woff2(项目区)。

**S0 验收**:两工程 `npm ls --depth=0` 全部 `@remotion/*` 版本逐个一致;两边 compositions 七项帧数/宽高/fps 与装前基线完全一致(依赖新增零行为变化);`python scripts/check-docs.py` 退出 0。

## §2 目录规划

```
skills/video-motion/templates/remotion-app/
├── package.json / package-lock.json   # +13 @remotion/* + three 全家 + lottie-web(+zod@S5)
├── remotion/mg-index.ts               # 武器库 demo 独立入口(不动 index.ts)
└── src/
    ├── mg-demos.tsx + fixtures.ts     # 五 demo 组合 + 内联 fixture(含极简 lottie JSON 对象,保模板零素材)
    ├── fonts.ts                       # 字体装载工具(网络可选,不进验收链)
    ├── transitions.tsx                # exposure()/slideIn()/hardCut() + 动词映射
    ├── DeckVideoV2.tsx                # S2 改造为 TransitionSeries 引擎
    ├── scene-kit/                     # 现有 13 组件 + entrance-kit.tsx + 9 武器组件
    ├── fx/srt-adapter.ts              # parseSrt → SubtitleCue[],接 auto-subtitle 产物
    └── vendor/{README.md, onda/, remotion-ui/, snapcn/}   # S5 社区库精选(头注:来源/版本/许可证/改动)

assets/
├── lottie/    # README 清单(文件→来源→许可证) + 免费商用 JSON 首批 2-3 个(S3)
└── media/     # 可复用测试素材(test-spinner.gif 等,S3)
```

五区对表:新组件全是代码,模板零媒体入库;Lottie JSON / GIF 是可复用资产进 assets(json/gif 不在 .gitignore,正常入库);项目用时复制进 `projects/*/remotion-app/public/`(已 gitignore)。

**社区库三件的事实修正**(调研核实):RemotionUI / Onda / snapcn 都是 shadcn 式 copy-paste 源码库(npm 包只是 CLI),不能当运行时依赖直装 → 精选子集进 vendor;snapcn 真身在 snapcn.dev(snapcn.com 是停靠域名);RemotionUI CLI 会自动 patch Root.tsx,**只能在 scratch 目录跑**。

## §3 组件清单(props 显式,只吃 props + useCurrentFrame)

**entrance-kit.tsx(九动词,吸收 v4 §3,默认值 = v4 标杆实测)**

| 组件 | 关键 props(默认值) |
|---|---|
| `SlideGroup` | direction("left") / distance(0.33×画宽) / dur(0.35) / delay |
| `ExposureIn` | brightnessFrom(0.25) / dur(0.45) / delay |
| `WipeIn` | direction("left") / dur(0.45) / delay — clip-path 揭示 |
| `GrowIn` | from(0.6) / delay — spring damping200/stiffness120 |
| `PopRotate` | settleDur(0.3) / wobbleDeg(3) / wobblePeriod(2.4) / delay |
| `CascadeList` | stepMs(280) / direction("column") — 「数得出来」的叙事节奏 |
| `CameraPush` | ratePerSec(0.004) — CSS 慢推,全页通用零成本 |
| `TextBreath` | amp(0.015) / period(3) |
| BlurIn 组合示例 | SlideGroup/GrowIn + BlurTrail 残影 |

**武器组件(一组件一文件)**

| 组件 | 底座 | 干什么 |
|---|---|---|
| `DrawPath` | `@remotion/paths` evolvePath | 真路径生长:下划线/引线/箭头/圆弧(shape 参数)+ endDot 端点;**取代 v4 DrawIn**(scaleX 假生长) |
| `ShapeMorph` | interpolatePath + `@remotion/shapes` | 形状渐变(from/to 由 shapes 产 path) |
| `NoiseField` | `@remotion/noise` noise3D | 背景有机颗粒流场,叠 SceneBg 之上,双族 variant |
| `FitText` | `@remotion/layout-utils` | fitText/fitTextOnNLines 程序算字号(解 150px 大字手动断行坑);多行测量异步,须字体装载后再测(实现检查点写头注释) |
| `BlurTrail` | `@remotion/motion-blur` Trail | 进场残影 layers(8) / decay(0.8) |
| `ShutterBlur` | CameraMotionBlur | 全帧快门模糊(spot-only,成本 ×samples) |
| `LottieLayer` | `@remotion/lottie` | goToAndStop 逐帧确定性;playbackRate = compFps / lottieFr;intake 禁带 expressions 的 JSON |
| `GifLayer` | `@remotion/gif` | GIF 嵌入 |
| `ThreeStage` | `@remotion/three` ThreeCanvas | 3D 运镜容器,内禁 useFrame,运镜只由 useCurrentFrame 派生 |

**工具件**:`src/transitions.tsx`(house presentations:exposure() 自定义 / slideIn(direction) enter-only / hardCut() 恒等;动词→presentation 映射)、`src/fx/srt-adapter.ts`、`src/fonts.ts`。

## §4 Stage 划分(每站独立提交、独立验收)

| 站 | 动作 | 验收 |
|---|---|---|
| **S0** | 本 spec 落档 + v4 吸收注记 + 两工程批装 | §1 尾行三条 |
| **S1** | 纯函数武器:DrawPath / ShapeMorph / NoiseField / FitText + srt-adapter + fonts.ts + mg-index.ts + MgUtilityDemo(720 帧 8 段,内联 fixture) | demo 渲染退出 0;条带读图(生长方向 / morph 中间态 / noise 双族 / 不溢出不截断);确定性 grep;Root.tsx 零改动(diff 证) |
| **S2** | 转场机制改造(吸收 v4 Stage 0):两工程 `build-deck-params.mjs` OVERLAP_SECONDS 0.5→0 重跑;V2Page 删 fadeIn/fadeOut;页序列改 TransitionSeries(旧页冻结 = exit 恒等,末页保留 0.5s 收黑;`fade()` presentation 全片禁用,收黑唯一例外);entrance-kit + transitions.tsx + MgTransitionDemo(660 帧 11 段) | lekao DeckVideoV2 = **3287±1 帧(109.57s)**;模板 demo deck = 252 帧;切点抽帧(3 切点 × 前后 4 帧)判硬切 + 旧页冻结 + 新页动词;ffprobe 三方对账;v1-v3 存量 diff 零 |
| **S3** | 媒体层:BlurTrail / ShutterBlur / LottieLayer / GifLayer + assets/lottie/(README + 首批 JSON)+ assets/media/ + MgMediaDemo(540 帧 6 段) | 条带判读残影方向 / Lottie 无跳帧;**同帧双渲 PNG hash 一致**;assets/lottie 清单字段齐;模板 public/ 零残留(git status 证);wall-clock 记账(后续基线) |
| **S4** | 3D 运镜:ThreeStage + MgThreeDemo(270 帧:旋转 logo 卡 / 三平面视差 / 相机推拉);remotion.config.ts 仅按需建(建与不建的理由都写本 spec 决策节) | 270 帧对账;still 判透视正确无黑帧(WebGL 起效);ThreeStage 内 grep 无 useFrame;单帧耗时 vs S1 基线,超 3× 记「重武器每片 ≤1 处」限用规则,不阻塞 |
| **S5** | vendor 化:许可证门禁(**snapcn LICENSE 一手验证,非 MIT 即停**)→ scratch 目录拉取(CLI 不碰模板)→ 精选 6-8 件(Onda:transitions 2-3 + graphics 2;RemotionUI:1-2;snapcn:软件 UI 拟物 1-2,补 F2)→ intake 改造(grep random/Date/useState/CSS transition 命中即改写或弃换;色值字体挂 tokens;Onda 的 Clash Display / Space Grotesk 依赖记录取舍,demo 用系统栈)+ zod 依赖 + MgVendorDemo(360 帧) | vendor README 清单齐 + 头注 grep 全命中;demo 对账 + 双渲 hash;check-docs 退出 0 |
| **S6** | **lekao P7 实战**(全副武装重做,页长 13.22s):DrawPath 规则下划线 + 柱图连线、BlurTrail 柱进场、NoiseField 深底、LottieLayer 币锚、CameraPush、进场动词按新时刻表 + P6→P7 切点;设计表 mg-armed-design.md **送审门禁,过了才写码** | 四级验收:L1(退出码 / compositions=ffprobe / 确定性 grep / 存量 diff 零)L2(进场条带 6 帧判分批 + 停顿 + 动词分型 / 武器特写帧 / 200% 道具放大 / 字幕同步 ±0.3s / 切点前后 4 帧)L2.5(P7 静音盲答)L3(验收 md:v3 / v-armed 同时间点对照表 + 武器落实表 + 性能汇总);回流五连(§6) |

## §5 与 v4 工单的吸收关系

- v4 **Stage 0(机制 + 动词库)→ 本站 S2 全量吸收**;v4 **Stage 1-3(全片 11 页时刻表 + 逐页 + 全片验收)不删减**,转为本 spec 的后续站(S6 验收通过后按 v4 原文开工);v4 **Stage 4(沉淀)→ 本站 S6 回流吸收**。
- 动词去向:DrawIn 关闭,由 DrawPath(evolvePath 真生长)替代;其余 8 动词保留自研(官方无对应件或语义不同:transitions.slide() 是页级转场件不是组级入场件);转场机制由 TransitionSeries 承载。
- v4 §2 的硬规则(转场律 / 旁白同步律 / 节奏律 / 待机律 / 慢推律 / 收尾律)在 S6 落入 `docs/2026-08-30-motion-grammar.md` 为 M5 / M6 / M7。

## §6 文档同步点

| 文件 | 动什么 | 时点 |
|---|---|---|
| `assets/component-catalog.md` | 逐站登记(S1 四件 / S3 四件 / S5 vendor 节 / S6 entrance-kit 九件) | 各站 |
| `assets/README.md` | 分区表加 lottie/、media/ | S3 |
| `assets/patterns.md` | PAT-13「全副武装数据说服页」(五字段 + 参考帧) | S6 |
| `docs/2026-08-30-motion-grammar.md` | M5 转场律 / M6 旁白同步律 / M7 待机慢推律 + 参数基准表(CascadeList 280ms / BlurTrail layers 8 / DrawPath 0.4-0.8s / Lottie playbackRate / ThreeStage ≤0.5%/s) | S6 |
| `skills/video-motion/SKILL.md` | 「MG 武器库」节:版本批装铁律 / 组件索引 / vendor 拉取纪律 / lottie 资产流 / 新坑(three、lottie expressions、google-fonts 网络) | S6 |
| `workflows/explainer-video.md` + 仓库 `README.md` | B 线第 0 步补「+武器库 + vendor」;结构树 assets 行提 lottie | S6 |
| `docs/workorder-log.md` | 收编本工单一节 | S6 |

`scripts/check-docs.py` 零改动(docs/*.md 自动受检;**本 spec 写未建成路径时一律不带区前缀反引号**,同 commit 建成的路径才可带)。

## §7 风险表

| 风险 | 缓解 |
|---|---|
| 版本错配(新包 ^ 浮高) | 精确 4.0.518;每站 npm ls 对账 |
| three / r3f 匹配(React 19) | fiber@^9;只 WebGL;ThreeStage 禁 useFrame |
| Lottie 不确定性(expressions 逐帧闪烁) | intake 禁带 expressions JSON;playbackRate 换算真实时;同帧双渲 hash 兜底 |
| 渲染性能(ShutterBlur ×samples / three SwiftShader / Trail ×layers) | demo wall-clock 记账;成片「重武器每片 ≤1 处」入 grammar 参数表 |
| snapcn 许可证未验 | S5 进场门禁,非 MIT 停下报告 |
| TransitionSeries 重排页窗 → 音画漂移 | 字幕走全局 deck-cues(与 overlap 无关);音频随 Sequence 迁移后切点抽帧 + ffprobe 对账;3287±1 硬对账 |
| RemotionUI CLI patch Root.tsx / 装 agent skill | 只在 scratch 目录跑,模板手工甄选 |
| Windows GBK / 反斜杠路径读图(既有坑) | C:\pc\ 短路径 + 复查换文件名 + 脚本输出全 ASCII |
