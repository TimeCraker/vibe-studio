# pelican-test — 「鹈鹕测试」生成效果展示片

把两个第三方生成的「鹈鹕骑自行车」SVG 动画 HTML，做成一条可直接发布的 63 秒成片：
4K 逐帧采集 → 代码化剪辑（运镜 / 图版 / 字幕）→ 程序化配乐 → 合成母版。

**内容定位**：主体是**展示 Antigravity 生成出来的东西**（79% 时长是生成画面），
不是评测这道题。4.0 的怀疑只出现在最后 10 秒。
剪辑数据里没有「难点拆解」「逐项核对」这类讲解型单元，改动文案时请保持这个口径。

产物在 [`products/pelican-test/`](../../products/pelican-test/)（含发布文案 `PUBLISH.md`）。

## 素材来源（不在本仓库）

| 版本 | 文件 |
|---|---|
| A · 鹈鹕的海滨骑行之旅 | `~/.gemini/antigravity/scratch/pelican-bike/index.html` |
| B · 佩利漫游记 | `~/.gemini/antigravity/scratch/pelican-cycling/index.html` |

路径写在 `capture/shots.json` 的 `htmlA` / `htmlB`。

## 为什么不是 Remotion / 剪辑软件

两条硬约束决定了技术选型：

1. **原动画是 `requestAnimationFrame` + `performance.now()` 驱动的。**
   直接录屏会掉帧、不可复现。所以把墙钟、`setTimeout`、`Math.random` 全部虚拟化
   （`tools/vclock.js`），逐帧推进虚拟时间后截图。同一帧永远长得一样，可重跑、可 diff。
   `Math.random` 每帧按绝对虚拟时间重新播种，所以分片并行采集和单进程采集**逐字节一致**。

2. **成片需要大量精确的运镜与排版。**
   与其拼 ffmpeg 滤镜图，不如写一个只有 ~450 行的「导演页」（`edit/director.js`）：
   canvas 负责画面与运镜，DOM 负责排版，`render(i)` 是帧号的纯函数。
   一帧 5ms 渲染完，剩下的时间全花在浏览器截屏上。

## 视觉系统：印刷图鉴风

叙事型内容用浅色纸面（对齐 `docs/2026-08-30-motion-grammar.md` 的 V1 条：浅色杂志风给叙事页、
深色给数字页）。第一版做成了「深蓝底 + 琥珀发光 + 圆角胶囊 + 等宽小标签」，
那是同一条规则的反面，所以整体推倒重做：

| 元素 | 做法 | 反例（不要） |
|---|---|---|
| 底 | 暖白纸 `#F4EFE6` + 半分辨率烘焙的细纸纹 | 深色渐变 + 径向光晕 + 暗角 |
| 标题 | Noto Serif SC Black，紧行距 | 无衬线粗体 + 文字发光 |
| 画面 | 2.162:1 的「印刷图版」，上下留纸 | 满屏铺底 + 渐变蒙版压字 |
| 字幕 | 下沿**实心纸面字幕带**，黑字压纸 | 半透明黑药丸 / 白字描边 |
| 规格信息 | **点线引导**表格（`模型 ····· Gemini 3.8 Flash`） | 圆角信息胶囊 |
| 图注 | 实心纸片 + 细引线 + 方点 | 发光圆点 + 模糊投影 |
| 结论页 | 翻成墨底纸字，全片唯一一次明暗转折 | 从头到尾一个底色 |

设计变量集中在 `edit/director.html` 的 `#viewport { --paper / --ink / --hot ... }`，
翻页配色只需给单元加 `dark: true`。改模板看 `edit/director.js` 里的
`renderHook / renderStatement / renderVerdict / renderOutro / notesHTML`。

## 流水线

```
capture/shots.json ──► tools/capture-all.mjs ──► frames/<shot>/f#####.png   (4K, 60fps, 3540 帧)
                                                     │
edit/sections.json ──┐                               │
edit/timeline.js   ──┴─► tools/validate-plan.mjs ────┤  （先校验再渲染）
                                                     ▼
                       tools/render-director.mjs ──► render/video.mp4      (无声画面)
                                                     │
                       tools/make_music.py ─────────► audio/music.wav      (62.4s 配乐)
                                                     ▼
                       tools/assemble.mjs ──────────► products/pelican-test/
```

### 工具清单

| 文件 | 作用 |
|---|---|
| `tools/cdp.mjs` | 零依赖 Chrome DevTools Protocol 客户端（Node 24 自带 WebSocket，不需要 npm install） |
| `tools/vclock.js` | 注入页面的虚拟时钟：rAF / 定时器 / `Math.random` 全部确定化 |
| `tools/capture-clip.mjs` | 采集单个片段的逐帧 PNG |
| `tools/capture-all.mjs` | 按 `shots.json` 并行采集全部片段并合并；含动作相机、主题、交互触发 |
| `tools/probe-ui.mjs` | 列出页面所有可交互控件（先探明怎么驱动，再写采集脚本） |
| `tools/probe-anchors.mjs` | 读出动画里各个部件（车铃、膝盖、牙盘…）的**真实屏幕坐标**，供标注锚点使用 |
| `tools/validate-plan.mjs` | 渲染前校验：区间连续、段落对齐、素材越界、标注出画、字幕语速 |
| `tools/render-director.mjs` | 驱动导演页出片；支持 `--sample`（抽帧审图）与 `--cover`（出封面） |
| `tools/make_music.py` | numpy 程序化配乐（numpy 唯一依赖，无 scipy / 无音源文件） |
| `tools/audio_report.py` | 音频体检：波形 + 频谱 + 底鼓对齐节拍网格 + 和声走向核对 |
| `tools/contact_sheet.py` | 抽帧拼图，一眼审全片 |
| `tools/probe_frame.py` | 单帧数值体检（找色带 / 矩形伪影 / 对比度） |
| `tools/assemble.mjs` | 合成母版、导出 SRT、响度报告 |

## 三条「先验证再烧时间」的规矩

1. **采集前先探 UI**（`probe-ui.mjs`）：动画脚本是 IIFE 包起来的，外部拿不到内部 state，
   所以一切控制都走真实 DOM 控件（点按钮、派发 input 事件），不猜内部变量。
2. **渲染前先校验方案**（`validate-plan.mjs`）：曾经靠它拦下「字幕比镜头长」「跨剪辑点」
   「素材读到片段外」三类错误。
3. **不信感觉，量它**：配乐用 `audio_report.py` 量底鼓是否落在节拍网格上（实测中位偏差 +0.5ms）、
   和声是否真的是 Amin 的 Am7-F-C-G（和弦音命中 99%）；画面用 `contact_sheet.py --lint`
   量每帧亮度均值/标准差，抓「死帧」和「过曝」。

## 复跑

```powershell
cd vibe-studio/projects/pelican-test
node tools/capture-all.mjs                    # 4K 逐帧采集（约 15 分钟，12 核并行）
node tools/validate-plan.mjs                  # 校验剪辑方案
node tools/render-director.mjs --out render/video.mp4 --crf 15
python tools/make_music.py                    # 配乐
node tools/assemble.mjs                       # 出母版 + SRT
```

改文案：`edit/timeline.js` 的 `UNITS` / `CUES`。
改配乐结构：`edit/sections.json`（音乐的重拍、riser、impact 自动跟随段落边界）。
改运镜：`UNITS[].view` 引用 `VIEWS` 里的取景窗（源片归一化坐标，`w === h` 保证 16:9）。

## 发布

投稿表单的填写走 [`skills/publish/`](../../skills/publish/)（工具在该 skill 里，本项目不再自带副本）：

```powershell
node ../../skills/publish/templates/bili.mjs launch                                    # 你扫码登录
node ../../skills/publish/templates/bili.mjs video  --path ../../products/pelican-test/pelican-test-1080p.mp4
node ../../skills/publish/templates/bili.mjs declare --option 含AI生成内容
node ../../skills/publish/templates/bili.mjs category --name 人工智能
node ../../skills/publish/templates/bili.mjs fill   --spec form.json
node ../../skills/publish/templates/bili.mjs cover  --image ../../products/pelican-test/pelican-test-cover.png
node ../../skills/publish/templates/bili.mjs check                                      # 自检，然后你自己点发布
```

表单内容在 [`form.json`](form.json)（标题 / 标签 / 简介），改文案只改这个文件。

**封面必须中心安全**：B 站首页推荐按 4:3 裁、个人空间按 16:9 裁，都取画面中心，
所以封面是居中海报式构图，关键内容收在中心 1440×1080 内。
`director.js` 里 `__cover` 的注释写了这条约束。

## 已知边界

- 采集分辨率 4K，成片 1080p。**更紧的特写会放大**：`VIEWS` 里 `w < 0.42` 的取景窗
  会明显变软（源片该区域像素不够）。需要更近的特写，得按「缩放页面再采集」的方式重采。
- 成片是 16:9。竖版要另出：改 `VIEWS` 的取景窗比例与字幕位置。
- 无配音。音乐是纯音乐，后期加人声需要重新配平响度。