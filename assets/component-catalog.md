# 组件登记簿（scene-kit / fx）

> 代码本体在 `skills/video-motion/templates/remotion-app/src/`（skill 是分发单元，组件跟引擎走）；本簿登记家底与用法，验收后新组件在此登记 + 回写模板。
> 质量底线见 `docs/2026-08-30-motion-grammar.md`；成页方案见 `patterns.md`。

## scene-kit（场景积木，13 个）

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

## 引擎（DeckVideoV2 机制层）

页序列 = deck-params 派生（页时长跟配音走）；每页渲 `deck-scenes.tsx` 对应场景 + 页音频 + TopProgress；字幕走 deck-cues 全局时间轴。
**换项目只换 `deck-scenes.tsx`**（SCENES / DARK_PAGES 两个导出）。
