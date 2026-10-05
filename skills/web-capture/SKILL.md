---
name: web-capture
description: 把已有的网页 / HTML / SVG / 代码动画逐帧采集，再用代码化「导演页」剪成成片（触发词：HTML 动画成片 / 网页动画导出视频 / SVG 动画做成视频 / 逐帧采集 / web capture）。零依赖 CDP 逐帧截图、虚拟时钟保证可复现、ffmpeg 直出，不装 npm 包也不用 Playwright。用户说做介绍成片走 workflows/explainer-video.md；已有录像叠动效走 video-motion。
user-invocable: true
---

# web-capture — 网页/代码动画 → 成片

**画面来源是「已经存在的网页」。** 这和另两条成片线的差别不在快慢，而在画面从哪来：

| 线 | 画面来源 |
|---|---|
| A 线（剪映全包） | 剪辑现成素材 |
| B 线（video-motion） | Remotion 组件直绘 |
| **C 线（本 skill）** | **已有网页 / HTML / SVG / 代码动画，逐帧采集** |

所以本 skill 不生产画面，只负责「把浏览器里跑的东西，一帧不差地搬进视频」。

## 核心机制：虚拟时钟

这是整条线可复现的前提。注入 `templates/vclock.js` 后会接管 `performance.now` / `Date.now` /
`requestAnimationFrame` / `setTimeout` / `setInterval` / `Math.random`：

- 时间由帧号推出，**同一帧永远长得一样**，可重跑、可 diff、可并行分块采集。
- `Math.random` 每帧用绝对虚拟时间重新播种（mulberry32），所以并行分块的结果和单进程逐帧**逐字节一致**。
- 页面里的动画不需要改代码，只要它走 rAF 或定时器。

没有这一步，采集出来的片子每次都不一样，也就没法迭代。

## 契约：项目要提供什么

本 skill 是工具，项目是数据。工具靠 `--project` 找到项目（缺省当前目录），项目要有：

```
projects/<项目>/
├── capture/
│   ├── shots.json            镜头表（每镜的 html / 主题 / 时长 / 动作触发时刻）
│   └── anchor-targets.json   probe-anchors 要量的元素 id
├── edit/
│   ├── director.html         导演页：canvas 管画面、DOM 管排版
│   ├── director.js           必须暴露 __boot / __frame(i) / __debug / __cover(opts)
│   ├── covers.json           --cover 的取景方案
│   ├── timeline.js           剪辑数据：单元 / 字幕 / 取景窗
│   └── sections.json         段落边界（画面与配乐共用同一张网格）
└── frames/<shot>/f#####.png  采集产物（不入库）
```

**导演页契约**（这是工具与项目之间唯一的接口）：

| 函数 | 作用 |
|---|---|
| `window.__boot()` | 返回 `{ shots, units, cues, frames, sectionDrift }`；`frames` 决定总帧数 |
| `window.__frame(i)` | 渲染第 i 帧。**必须是帧号的纯函数**，可被乱序调用 |
| `window.__debug()` | 返回 `{ missing }`，报告缺哪些源帧 |
| `window.__cover(opts)` | 渲染封面用的单帧 |

导演页怎么写：从项目施工目录起步（首例参考实现见 pelican-test 项目，成片已归档至 `products/pelican-test/`），
或按契约自己写。**版式与文案属于项目，不属于本 skill**。

## 命令

全部在项目目录里跑，或从任意位置加 `--project <dir>`：

```bash
S=skills/web-capture/templates

# 1. 先探明，再写脚本（不要凭记忆写选择器）
node $S/probe-ui.mjs --html <页面>              # 真实控件清单
node $S/probe-anchors.mjs --project <项目>       # 元素真实坐标 → capture/anchors.json

# 2. 4K 逐帧采集（多进程并行，按 shot 分块）
node $S/capture-all.mjs --project <项目> [--only a-day,b-day] [--dry]

# 3. 渲染：整片 / 抽帧审图 / 出封面
node $S/render-director.mjs --project <项目> --out render/video.mp4 --crf 15
node $S/render-director.mjs --project <项目> --sample 150,2250 --out qa/x
node $S/render-director.mjs --project <项目> --cover
```

单镜重采（调试用）：`capture-clip.mjs --html <页面> --out <dir> --theme night --speed 2`。

## 坑（都是实测踩出来的）

- **`__frame(i)` 必须 await**：它要异步加载源帧，不等它 settle 就截图，截到的是上一帧。
  脚本里已带 `awaitPromise: true`，自己写调用时别忘了。
- **截图是唯一瓶颈**：一帧渲染约 5ms，截图 300–600ms。所以先测截屏格式再决定（实测 PNG
  `optimizeForSpeed` 330ms、默认 586ms、JPEG q95 210ms）。想快就优化截图，不要优化渲染。
- **别把 `HERE` 当项目根**：`HERE` 是这个 harness 自己的位置（用来找 `cdp.mjs` / `vclock.js`），
  项目根来自 `--project`。这两个混在一起正是这些工具以前必须每个项目复制一份的原因。
- **ffmpeg 的 preset 不影响画质**：固定 CRF 时只影响体积与耗时。满屏纸纹/噪点的画面会打爆
  x264 的跳块，`slow` 曾经只有 2.5fps，`medium` 4.8fps。
- **配置文件里的 `_comment` 键**：读取时要过滤掉 `_` 前缀的元数据键，否则会被当成条目遍历（踩过）。
- **录制顺序**：先定 `sections.json` 的段落边界，画面和配乐共用同一张网格，
  这样剪辑点、音乐重拍、章节时间轴三者天然对齐，改一处不用手工对齐另外两处。

## 边界与不做

- **不做画面创作**：页面本身从哪来不归本 skill 管（可能是别的工具生成的）。
- **不做剪辑决策**：哪些镜头、什么字幕、怎么运镜，是项目 `timeline.js` 的事。
- **不做配乐**：程序化配乐是独立工具（`scripts/make_music.py`），与本 harness 解耦。
- **不做竖版**：改画幅要动项目的取景窗与字幕位置。
- 更紧的特写会放大发虚：采集分辨率决定可用取景窗下限，`w < 0.42` 明显变软，
  需要更近就得「缩放页面再采」重采一次。
