---
name: web-capture
description: 把已有网页、HTML 或 SVG 动画逐帧采集并通过导演页剪成视频。适用于网页动画导出视频、逐帧采集和 web capture；有状态页面预跑重放，纯 seek 页面可直接定位。介绍成片走 workflows/explainer-video.md，已有录像叠动效走 video-motion。
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

- Node 22 以上、Chrome（可用 `CHROME_PATH` 指定）和 FFmpeg 是运行依赖；不需要安装 npm 包。
- 默认 `mode: "replay"`：每个分块从第零帧执行相同的 rAF、计时器和动作历史，只在所属区间截图。有状态动画不能直接跳过前面的帧。
- `mode: "seek"`：页面必须提供纯函数 `window.__captureSeek(ms)`，可直接定位。此模式不允许额外 UI actions，状态由适配器负责。
- rAF 每次推进只执行一次队列快照，下一次 rAF 留到下一帧；随机数按帧播种是辅助条件，不能代替状态重放。
- 保证范围限固定浏览器、字体、输入和支持的时钟。CSS/WAAPI、媒体播放、Worker、网络与 crypto 随机源不由虚拟时钟接管，需显式适配或换采集方式；不要承诺任意网页都逐字节一致。

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

**shots.json 镜头视口**：每镜可选 `"viewport": {"width": 2880, "height": 1560}` 单独指定采集视口，同一批里整页版式 1920×1180 与图版模式 2880×1560 混用时不再分批传参。优先级
shot > `--width/--height`（含 shots.json 顶层 `width`/`height`）> 默认 1920×1080。非法值（缺一边、非正整数）整组忽略并 warn，回落全局。每镜实际生效尺寸记录在 `frames/index.json` 与 `frames/<shot>/clip.json` 的 `width`/`height`，补采前先 `--dry` 核对。

**anchor-targets.json 条目视口**：条目可选同款 `"viewport"` 字段——该组按什么视口开页、量锚；缺省 1920×1080，非法值同规则 warn 回落。**量锚视口要与该场景的采集视口一致**，anchors.json 里的归一化比例才能直接复用到对应帧上；非默认视口采集的镜头，量锚时记得带上同一份 viewport。

**导演页契约**（这是工具与项目之间唯一的接口）：

| 函数 | 作用 |
|---|---|
| `window.__boot()` | 返回 `{ shots, units, cues, frames, sectionDrift }`；`frames` 决定总帧数 |
| `window.__frame(i)` | 渲染第 i 帧。**必须是帧号的纯函数**，可被乱序调用 |
| `window.__debug()` | 返回 `{ missing }`，报告缺哪些源帧 |
| `window.__cover(opts)` | 渲染封面用的单帧 |

历史参考制作配方在 `products/pelican-test/recipe/` 与 `products/pelican-ride/recipe/`。先恢复到施工区再修改，不在归档中施工。版式与文案属于项目；新任务优先用本 skill 的通用 project 模板。

`templates/project/` 自带源页面、镜头表、导演页、时间轴、视频规格、音频段落网格和两种封面。复制到新施工目录后直接采集与渲染即可验证管线，再替换内容。示例是采集测试素材，不是已经通过终审的品牌成片。

导演页读取 `edit/video.json` 的 width/height/fps，工具也接受同名 CLI 覆盖。横竖版分别设计主体取景和文字位置；先 `--sample` 审图。`render-director --audio audio/music.wav` 可把现有配乐混入成片；短音频会补静音，不截短视频。`--seconds N` 生成短样片；渲染报告标明是否全片。

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
- **失败退出**：CDP 请求与 worker 有超时；浏览器断连会拒绝未完成请求。失败分块不替换上一份完整帧。已有帧目录需带本工具的 `.capture-owner.json`，无标记时使用新的输出目录。
- **回归**：`node tests/browser-capture.mjs` 用真实浏览器比较带状态、随机数、计时器与动作的顺序/分块 PNG。

## 边界与不做

- **不做画面创作**：页面本身从哪来不归本 skill 管（可能是别的工具生成的）。
- **不做剪辑决策**：哪些镜头、什么字幕、怎么运镜，是项目 `timeline.js` 的事。
- **不做配乐**：程序化配乐是独立工具（`scripts/make_music.py`），与本 harness 解耦。
- **不做竖版**：改画幅要动项目的取景窗与字幕位置。
- 更紧的特写会放大发虚：采集分辨率决定可用取景窗下限，`w < 0.42` 明显变软，
  需要更近就得「缩放页面再采」重采一次。
