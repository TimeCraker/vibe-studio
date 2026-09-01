# 组件登记簿（scene-kit / fx）

> 代码本体在 `skills/video-motion/templates/remotion-app/src/`（skill 是分发单元，组件跟引擎走）；本簿登记家底与用法，验收后新组件在此登记 + 回写模板。
> 质量底线见 `docs/2026-08-30-motion-grammar.md`；成页方案见 `patterns.md`。

## scene-kit（场景积木，13 + MG 武器 4）

| 组件 | 干什么 | 关键参数 / 坑 |
|---|---|---|
| `SceneBg` | 双族背景（浅米白杂志 / 深蓝科技），背景是「空间」：网格+柔光斑 / 径向渐变+暗角+噪点 | `variant: light/dark`；同场景不变族 |
| `SceneShell` | 杂志双栏页骨架：眉题+超大标题+细线+章节号，左内容右主体（或反） | `left` 传左栏；`paddingBottom: 150` 给字幕底带留位 |
| `DropCard` | 卡片光影基座（双层阴影+1px 边光），一切悬浮元素的统一承载 | `tone/radius/padding/shadow`；**包装它必须显式透传 width** |
| `DeviceFrame` | 浏览器框（标签条+锁形地址+进退刷）/ 手机壳（侧键+灵动岛+玻璃高光）装截图 | `scrollDistance` 长图滚动 / `zoom+offsetY` 裁切特写；缩到文字不可读必改滚动或特写 |
| `PhoneShell` | 纯手机壳（配合屏内自绘内容） | `width` 必传；灵动岛贴顶 12px 安全区 |
| `ChatReplay` | 聊天回放：气泡逐个弹出、双侧头像、尾巴、时间戳 | `shell` 进手机壳；**聊天头名称用 `shellTitle` 传（默认 AI 助手）** |
| `TypingTerminal` | 终端打字机（$ 品牌提示符+块光标闪烁） | `cps 16` 节奏自然；进行时证据担当 |
| `ChartGrow` | 柱状图生长（基线+网格+柱身渐变+末柱高亮） | `coin` 加币锚；柱条错峰 100ms；末点呼吸光环 |
| `CountUp` | 数字滚动（0.8-1.2s ease-out） | 数字口径必须有真实出处 |
| `TextReveal` | 大字逐字入场 + 关键词高亮 | `mode="char"`；150px 大字容器留 ~10% 宽度余量 |
| `StaggerList` | 兄弟元素错峰入场 | `gap` 毫秒；横排 `direction="left"` |
| `FloatWrap` | 待机漂浮（sin ±8px，period 3-5s） | 各元素 `phase` 错开，禁止同步浮动 |
| `GlowPulse` | 光晕呼吸（深底氛围/主体衬光） | `size/intensity`；浅底慎用大光晕 |
| `TopProgress` | 顶部进度条（页序指示） | 深浅页自动换色由引擎管 |
| `DrawPath` | 真路径生长（@remotion/paths）：下划线/引线箭头/圈注/矩形按真实路径长度画出来，`endDot` 生长端点冒点 | `shape` 或 `path` 二选一；**4.0.518 的 evolvePath 返回 strokeDasharray/offset 属性对**，不是裁剪后的 path |
| `ShapeMorph` | 形状渐变（interpolatePath 真顶点插值）：rect/circle/triangle/star 互变 | `progress` 外驱可接力两段 morph；**interpolatePath 签名是 (value, from, to) 三独立参数**；triangle 边长参数是 `length` |
| `NoiseField` | 有机颗粒流场（noise3D）：点阵网格逐点漂移+明暗呼吸，叠 SceneBg 上当活背景 | `variant` 双族；seed 固定数字保确定性；22×12 网格每帧 720 次 noise3D，性能无压力 |
| `FitText` | 程序排版：字号由测量算出，盒内不溢出不截断，免手动断行留余量 | 单行走 fitText（`withinWidth`）；**中文多行不能直接用 fitTextOnNLines（按空格分词）**，组件内置字符等分兜底；字体须先装载再测量 |
| `BlurTrail` | 进场残影（@remotion/motion-blur Trail）：快速进位拖出运动残影，内置 spring 位移 | layers(8) / lagInFrames(2) / trailOpacity(0.36)；成本 = 子树重渲 ×layers，重元素慎用 |
| `ShutterBlur` | 快门模糊（CameraMotionBlur）：整帧自然 motion blur，拖影跟运动方向 | shutterAngle(180) / samples(10)；成本 ×samples，**spot-only，重武器每片 ≤1 处** |
| `LottieLayer` | Lottie 资产层：吃 AE 生态成品（assets/lottie/） | 内联 animationData 优先；src 走 fetch+delayRender；playbackRate 自动 = compFps/lottieFr；**intake 禁带 expressions 的 JSON** |
| `GifLayer` | GIF 循环小动效（@remotion/gif） | src 是 public/ 相对路径（assets/media 复制进项目后用） |
| `ThreeStage` | 3D 运镜容器（@remotion/three ThreeCanvas）：真透视/光影/相机运动 | **内部禁 r3f useFrame**，动画与运镜一律 useCurrentFrame 派生（相机动画用 useThree 拿 camera 按 frame 赋值）；只 WebGL；性能：简单场景 ~17 帧/s（vs 2D 21.6），复杂 3D 段单帧可到数倍，成片「重武器每片 ≤1 处」；remotion.config.ts 无需建（SwiftShader 开箱可用，S4 已验证） |

## tokens（取值单源）

| 组 | 内容 | 原则 |
|---|---|---|
| `COLOR` | 双族色板 + 品牌蓝 #3157F6 | 全片不许裸铺色值，一律引用 |
| `SHADOW` | 双层阴影体系（card/float/contact） | 光源统一左上 |
| `RIM` | 1px 边光（浅 hairline / 深 rim light） | 悬浮元素必带 |
| `TYPE` | 字号台阶（display 150 / 120 / 64 / 42 / 30 / mono 26） | 主标题 ≥画高 11% |
| `FONT` | sans（YaHei/PingFang）+ mono（Consolas） | 任何文字不得落回浏览器默认衬线 |

## fx（叠动效三件套，FootageOverlay 线）

| 组件 | 干什么 |
|---|---|
| `SubtitleTrack` | 字幕轨（panel 主题/深浅双色调/关键词品牌色/大字去重 dedupe） |
| `DataBars` | 数据柱升起 |
| `Spotlight` | 圈注（circle/arrow/box 指真实元素） |
| `srt-adapter` | parseSrt → SubtitleCue[]，直接吃 auto-subtitle 的 srt 产物（字段逐字对齐字幕契约） |

## MG 武器库工具件（模板 src/ 根）

| 文件 | 干什么 | 坑 |
|---|---|---|
| `fonts.ts` | 字体装载（loadRemoteFont / loadLocalFont 自托管），失败回落系统栈 | **不进确定性验收链**；google-fonts 渲染时拉 gstatic，中国网络慎用 |
| `mg-demos.tsx` + `fixtures.ts` | 武器库 demo（Utility 720 帧 8 段 + Transition 660 帧 11 段 + Media 540 帧 6 段 + Three 270 帧 3 段，内联 fixture 零素材；Media 的 lottie/gif 段渲染时临时复制 assets 副本进 public、渲完删） | 独立入口 remotion/mg-index.ts，不碰 Root.tsx 七组合契约；MgMediaDemo 540 帧 wall-clock ≈25s（后续性能基线） |
| `transitions.tsx` | house 页间转场件：`slideIn()`（滑入盖场）/ `exposure()`（曝光渐起）/ `hardCut()`（恒等，对拍用） | enter 侧动、exit 侧恒等（旧页冻结）；**TransitionSeries 转场吃相邻页时长**，成片引擎默认零转场（Series 硬切）+ 页内动词 |

## entrance-kit（进场动词库，S2 起，一文件九件）

v4 §3 全量吸收，默认值 = 标杆片实测。**架构：页间硬切为底，动词全部发生在页内内容层**（相邻页动词不同型）。

| 组件 | 干什么 | 关键参数（默认） |
|---|---|---|
| `SlideGroup` | 整组方向性滑入 | direction("left") / distance(0.33×画宽) / dur(0.35) / delay |
| `ExposureIn` | 曝光渐起+微慢推收束 | brightnessFrom(0.25) / dur(0.45) |
| `WipeIn` | clip-path 一侧擦亮 | direction("left") / dur(0.45) |
| `GrowIn` | spring 生长落位 | from(0.6) |
| `PopRotate` | 弹落+落定回弹摇摆 | settleDur(0.3) / wobbleDeg(3) / wobblePeriod(2.4) |
| `CascadeList` | 级联列表（「数得出来」的叙事节奏） | stepMs(280) / direction("column") / slide("up") |
| `CameraPush` | 整页匀速慢推（页长 >10s 用） | ratePerSec(0.004) |
| `TextBreath` | 落位后呼吸（进行时证据） | amp(0.015) / period(3) / delay(0.8) |
| （BlurIn 组合） | SlideGroup/GrowIn + S3 的 BlurTrail 残影 | S3 交付 |

**引擎接线变化（S2）**：DeckVideoV2 页序列改硬切（V2Page 删 fadeIn/fadeOut 交叉溶解、Sequence 时长去 overlap）；build-deck-params 的 `OVERLAP_SECONDS` 0.5→0（lekao 全片 3302→**3287 帧** = 109.57s）；字幕去重与关键词从引擎硬编码改为 deck-scenes 的 `SUBTITLE_CONFIG`（页号声明式，项目内容归项目文件）。

## 引擎（DeckVideoV2 机制层）

页序列 = deck-params 派生（页时长跟配音走）；每页渲 `deck-scenes.tsx` 对应场景 + 页音频 + TopProgress；字幕走 deck-cues 全局时间轴。
**换项目只换 `deck-scenes.tsx`**（SCENES / DARK_PAGES 两个导出）。
