# 2026-08-30 · deck-video v3 Stage Spec — 质感攻坚：从「会动的 PPT」到「动效作品」

> 执行者：Zcode（GLM-5.3-Flash）。本 spec 自包含，无需会话上下文。
> 复核：Claude（§4）→ 用户终审看片。
> 动机：v2 成片（`output/video-motion/lekao-intro/deck-v2.mp4`）流程全绿但**用户判「太 low，和标杆片差距太远」**；Claude 对 8/11 页逐帧 merciless 审图，结论一致——v2 修好了"不动"，没修"廉价"。
> **v2 的 Stage 4（封面/收尾）作废，由本 spec Stage 4 替代。**

## §0 规则与护栏

- 质量底线 = `docs/2026-08-30-motion-grammar.md` **全部规则**（v3 新增质感层 F1-F5 + 八问口诀 + PPT 感一票否决，先通读）。
- **v1 存量仍不动**（`DeckVideo.tsx` / `cover-index.ts` / Root.tsx 既有注册）。**v2 文件原地升级**：scene-kit 组件 props 只增不改语义，`DeckVideoV2.tsx` 原地改；产物渲成 **`deck-v3.mp4`**（v2 mp4 保留作对照，不覆盖）。
- Remotion 确定性铁律照旧：渲染函数内禁 `Math.random()` / `Date.now()` / `new Date()`。
- **禁装新 npm 依赖**：本 spec 全部用系统字体 + SVG/shadow 实现，不走网络装包。
- 多站纪律照旧：只 `git add` 本站文件，不 push；卡两轮停下报告；GBK 控制台 print 全英文。
- **支撑文案禁止编造**：画面上出现的每个数字/功能/事实，只能来自 §1 列出的真实来源；不许发明 README 里没有的功能或数字。

## §1 环境事实（已核实）

| 项 | 事实 |
|---|---|
| 工程根 | `C:\Users\TimeCraker\Desktop\my_workspace\vibe-studio` |
| Remotion 工程 | `skills/video-motion/templates/remotion-app/`（remotion 4.0.518；v1/v2 的 deck-params / deck-cues / build-deck-params.mjs / 字幕机制全部沿用，页时长与音频不变） |
| 现有 scene-kit | `src/scene-kit/` 13 组件（v2 产物，本 spec 原地升级） |
| 素材 | `remotion-app/public/lekao/`（已 gitignore）：三张 feature 插画、value-time-comparison.png、lekao-mark.svg、lekao-home.png / lekao-fullpage.png 截图 |
| 品牌色 | 钴蓝 `#3157F6`；浅族米白 `#F5F1E8`；深族 `#0a0e1a → #141a2e` |
| 字体 | **系统字体零依赖**：正文/标题栈 `'Microsoft YaHei', 'PingFang SC', 'Noto Sans SC', sans-serif`（标题 weight 700）；等宽栈 `Consolas, 'SF Mono', 'Courier New', monospace`（中文回落 YaHei）。**全片任何文字不得落回浏览器默认衬线**（v2 气泡内衬线字穿帮的根因） |
| 真实文案来源（画面信息包唯一取材处） | ① `output/video-motion/lekao-intro/script.json`（27 段口播稿本体）；② `C:\Users\TimeCraker\Desktop\my_workspace\lekao\README.md`（功能与 T-Coin 口径，如连签 7 日 2→8 币、注册送 5 币、生成 1 币失败退回）；③ 截图素材本身可见内容。禁付费/充值词（lekao 免费模式） |
| 画布 | 1920×1080@30；页时长/页序与 v2 完全一致（P1 7.7s … P11 7.4s，页间 0.5s 交叉溶解） |

## §2 v2 审图缺陷 → v3 契约（逐条对应修法）

### 2.1 Claude 审图实录（缺陷定位，spec 自包含证据）

| 缺陷 | 审图铁证（8/11 页） |
|---|---|
| 无光影 | 卡片无投影无边光"贴上去的色块"；深底"是色板不是空间"（无暗角/光晕/氛围）；元素像贴纸浮在纯色上——8/8 页 |
| 道具穿帮 | 终端=「设计稿里的终端」（标题栏色差、非等宽）；聊天气泡无壳无头像裸漂+衬线字；手机框=「剪影级」（无侧键、灵动岛错位、屏幕 60% 死灰、截图文字不可读）；浏览器「无标签页无图标，是画了个浏览器」 |
| 死空间 | P2 中部 400px 真空带、P4 三分之一画面零信息、P7 上部 40% 空置、P8 手机屏下半全灰——6/8 页 |
| 字幕条廉价 | 黑药丸+剪映默认感、与画面大字 100% 重复（P1/P10/P11）、风格三张皮——5 页点名"廉价感第一" |
| 冲击力弱 | 主标题仅占画高 7-9%（专业片头 12-15%）；P1 底部黑条字号反超副标题（层级倒挂） |
| 内容空洞 | 画面只有"一句标题+一个道具"，全靠字幕扛信息；静音看不懂这页在讲什么 |

### 2.2 设计令牌 `scene-kit/tokens.ts`（新增，全部组件唯一取值处）

```ts
export const COLOR = { brand:"#3157F6", brandBright:"#5B7DFF", ink:"#1A2233",
  paper:"#F5F1E8", paperCard:"#FFFFFF", dark0:"#0a0e1a", dark1:"#141a2e",
  darkCard:"#1B2338", inkSoft:"#4A5568", line:"rgba(26,34,51,.10)", lineDark:"rgba(255,255,255,.10)" };
export const SHADOW = { // 双层阴影体系，光源统一左上
  card:  "0 2px 6px rgba(15,23,42,.07), 0 14px 40px rgba(15,23,42,.12)",   // 浅底卡片
  float: "0 8px 20px rgba(5,10,20,.35), 0 32px 80px rgba(5,10,20,.45)",    // 深底悬浮主体
  contact:"0 3px 10px rgba(10,14,26,.25)" };                               // 接触阴影
export const RIM  = { light:"inset 0 1px 0 rgba(255,255,255,.9)",          // 浅底卡顶光
  dark:"inset 0 1px 0 rgba(255,255,255,.14), inset 0 0 0 1px rgba(255,255,255,.06)" }; // 深底边光
export const TYPE = { displayL:"clamp:≥150px", display:"120px", title:"64px",
  body:"42px", meta:"30px", monoMin:"26px" };  // 主标题 ≥ 画高 11%（120px/1080）
export const FONT = { sans:"'Microsoft YaHei','PingFang SC','Noto Sans SC',sans-serif",
  mono:"Consolas,'SF Mono','Courier New',monospace" };
```

### 2.3 光影系统（F1）

- **SceneBg v2**：`light` = 米白底 + 80px 极淡网格线（ink 3% 透明度）+ 右上角落柔光斑（品牌蓝径向渐变 6-8% 透明度，大圆溢出裁切）+ 四周轻暗角；`dark` = 中心 `#141a2e` → 边缘 `#0a0e1a` 径向渐变 + 加强暗角 + 白 3% 网格 + 噪点纹理（inline SVG `feTurbulence` data-URI，3% 透明度，静态确定性）。仍禁粒子。
- **DropCard.tsx（新增）**：统一悬浮卡容器——surface（浅底白 / 深底 `#1B2338`）+ hairline 边（`line`/`lineDark`）+ `SHADOW.card`/`float` + `RIM` + 可选 `glow`（卡后品牌色光晕）。**全片所有卡片/设备框/终端一律经它**，不许再裸铺色块。
- **GlowPulse v2**：只用作主体后衬光（大而柔，呼吸 2s），不许当独立装饰。

### 2.4 道具 v2 拟真契约（F2，逐条可勾选）

**DeviceFrame browser**：标签条（1 个活动标签：favicon 圆点 + 标题文字 + ×；旁 1-2 个灰化空标签）→ 工具栏（后退/前进/刷新三个箭头 SVG + 地址胶囊：锁形 SVG + `https://` + 域名 mono + 右侧两点菜单）→ 内容区。深底上必须 `RIM.dark` 边光 + `SHADOW.float`。
**DeviceFrame phone**：外圆角 64 / 屏幕圆角 44（偏心，不许同曲线缩放）；右侧电源键 + 左侧音量键 ×2（框外 3px 细条）；灵动岛胶囊**贴顶 12px**；中框 1px 高光；屏幕玻璃对角高光（白色 5-8% 线性渐变扫过）；接触阴影。**屏幕内容必须满幅**（overflow mask），长截图改为页内缓慢滚动动画（ease translateY，页时长内匀速走完），**禁止整图缩小到文字不可读**——可读性铁律：缩小后正文 < 24px 等效就必须改滚动或裁切特写（`lekao-fullpage.png` 走滚动；`lekao-home.png` 裁 hero 区特写，可 1.6x 局部放大）。
**ChatReplay v2**：**装进手机壳**（DeviceFrame phone 内）——顶部聊天头（圆形头像 + "LeKao 智能助教" + "在线" 状态）+ 壁纸浅灰；气泡圆角 18px + 尾巴（伪元素三角）、左白右品牌蓝、**两侧头像**、组间时间戳、字体必须 `FONT.sans`；"正在输入"三点在壳内。
**TypingTerminal v2**：标题栏与内容同底色（去分割线），三灯左置、标题 mono 居中；正文纯 `#0d1117`、`FONT.mono`、`$` 提示符品牌色、块状光标 530ms 闪烁；整窗走 DropCard + 顶部 1px 内高光。
**ChartGrow v2**：0 基线 2px 实线 + 2-3 条水平淡网格线；柱身纵向渐变（顶亮底暗）；**末柱高亮**（brandBright + 数值加大 + 微光晕）——递增叙事的视觉强调；柱顶连线生长折线（带小圆点，随错峰逐段画出）；数值旁加 **T 币图形锚**（SVG：圆形币 + "T" 字），"讲币必画币"。

### 2.5 排版与字幕（F4 + 冲击力）

- **字号**：主标题 ≥120px（画高 11%+），金句/CTA 页 150px+；正文 42px、meta 30px、等宽最小 26px；消灭层级倒挂（任何装饰条字号 > 正文即错）。
- **SubtitleTrack v2**：字幕并入版面语言——浅底页：白 85% 半透明圆角面板 + ink 字 + 关键词品牌色；深底页：黑 55% 半透明面板 + 白字；字体 `FONT.sans`；固定底带 **y 940-1050**，任何道具/卡/chips 不得进入底带（v2 的 P5 chips 重叠、P8 caption 压机教训）。**去重规则**：某段字幕文本与当页画面大字重复（≥80% 相同）→ 该段字幕抑制不显示（P1/P10/P11）。
- **顶部进度条**：2px 品牌色细条贴画布顶边，宽度 = 当前页 / 11，页间平滑推进（专业感 + 方位感）。
- **进场相位前移**：v2 全局偏晚 0.3-0.5s——各页右栏模块起跳 delay 从 0.4-0.5s 收到 0.15-0.25s，进场 1.5s 内画面主体全部起跳。

### 2.6 信息密度与画面信息包（F3 + F5，本轮灵魂）

每页（11 页逐页过）在主标题 + 主体道具之外，必须有：
1. **≥2 组支撑信息**：真实数字/步骤/事实行（取材 §1 真实来源，原文口径照抄不推导；如 P2 痛点页给"抄错题 / 写小结 / 写反馈 = 1~2 小时"拆项清单、P4 给"10 条逐题反馈 + 1 段小结"结果清单、P7 给"注册送 5 币 / 生成 1 币 / 失败退回 / 连签 2→8 币"完整规则卡），用 meta 字号 + mono 数字排版，不许编造；
2. **≥1 层主体标注**：箭头 / 高亮圈 / 引线 callout 指向主体里的具体部位（如 P8 手机屏上圈出"上传按钮"、P4 插画上标"AI 识别中"扫描线），标注随主体入场后出现；
3. **单块零信息区域 ≤ 画面的 20%**（自查方式：把帧九宫格切分，任何一格全空即超）。

### 2.7 场景设计表 v3（硬关卡，Stage 2 第一步）

更新 `output/video-motion/lekao-intro/scene-design.md` 为 v3 表：在 v2 六列基础上每页**新增两列**——「画面信息包（支撑文案逐条列出 + 取材出处）」「主体标注（标注什么部位、什么形式）」。**产出后停下等 Claude 复核，过了才改代码。**

## §3 任务分 Stage

- **Stage 0 光影地基**：tokens.ts + SceneBg v2 + DropCard + SubtitleTrack v2 + 顶部进度条 + 全局字体接入 → demo `kit-v3a`（20s：双族背景各 8s + 字幕双色调 + 卡片悬浮对比）→ 渲染 exit 0 + 抽帧 ≥10 张过 §4 光影检查。
- **Stage 1 道具重画**：browser / phone / ChatReplay 进壳 / Terminal / ChartGrow 五件 v2 → demo `kit-v3b`（30s）→ 每道具抽 **稳定帧 + 200% 中心放大帧** 各一张（放大帧是拟真度证据，穿帮无处藏）。
- **Stage 2 设计表 v3 + 接线**：① scene-design.md v3（§2.7，**停下等复核**）；② 复核过后按表重组 `DeckVideoV2.tsx`（页时长/音频/字幕机制不动）→ `compositions` 帧数对账 3302。
- **Stage 3 渲染 + 四级验收**：渲 `output/video-motion/lekao-intro/deck-v3.mp4`（crf16）。L1 程序（exit 0 + ffprobe 对账）；L2 抽帧 ≥44 张（每页 4 张：进场中间态 / 稳定全景 / 信息包特写 / 道具 200% 放大）；**L2.5 静音测试**：逐页取稳定帧问 judge"不看声音，这页在讲什么"——答不出本页主旨即 FAIL；L3 报告 `output/deck-video-v3-acceptance.md`（含 v2/v3 同时间点对照 + 八问口诀逐页自评表）。**停下等确认。**
- **Stage 4（用户确认后）**：CoverV3 封面（深底 + DropCard 装官网特写 + 150px 大字 + 光晕 + 顶部进度条语言）出 `cover-v3.png`；SKILL.md 补「场景化成片 v2→v3 质感工艺」节（以 motion-grammar 质感层 + 本 spec 为准）；配音终稿线不变（剪映回填 audio 后重跑两步）。

## §4 验收清单（Claude 复核用）

- [ ] 八问口诀逐页过：V1-V4 / M3 / F1-F3 / F5（报告附逐页自评表）
- [ ] **PPT 感一票否决**：随机抽 3 页稳定帧问"放进 PPT 违和吗"，任一页不违和 = 打回
- [ ] 静音测试 11/11 页通过（judge 能复述每页主旨）
- [ ] 道具 200% 放大帧：浏览器有标签页与锁形图标、手机有侧键与贴顶灵动岛、气泡在壳内有头像有尾巴、终端等宽同底色、图表有基线网格与末柱高亮
- [ ] 字幕：双色调版面语言 + 底带无叠压 + 去重生效（P1/P10/P11 无重复段）+ 27 段逐字一致 + 无付费充值词
- [ ] 信息包：每页 ≥2 组真实支撑信息（逐条对回 script.json / README，零编造）+ ≥1 层主体标注 + 无 >20% 死区
- [ ] 主标题 ≥120px（金句/CTA 150px+），无层级倒挂
- [ ] v1 存量 diff 为零；v2 组件 props 只增不改；deck-v2.mp4 未被覆盖
- [ ] 确定性 grep 干净；零新 npm 依赖；素材未入 git；分支内提交、零 push

## §5 参考

- 质量底线（含 v3 质感层）：`docs/2026-08-30-motion-grammar.md`
- v2 机制与场景结构：`docs/2026-08-30-deck-video-v2-stage-spec.md` + `output/video-motion/lekao-intro/scene-design.md`（v2 版）
- v2 验收报告（页时长与对照基线）：`output/deck-video-v2-acceptance.md`
- Remotion API：`spring()` / `interpolate(...,{extrapolateRight:"clamp"})` / `<Sequence>` / `<Img>` / `<Audio>`
