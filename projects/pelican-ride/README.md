# pelican-ride — 「鹈鹕测试」Codex 篇（GPT-6.1 Sol）

把 Codex 里的 **GPT-6.1 Sol（思考等级：高）** 一次生成的「海风骑行 · 鹈鹕的慢旅行」
SVG 动画 HTML，做成一条 61 秒可直接发布的成片：
4K/5.5K 逐帧采集 → 代码化导演页剪辑（运镜 / 揭幕动词 / 图注）→ 程序化配乐（海风系）→ 合成母版。

**内容定位**：主语是「Codex 生成出来的这个东西」，不是评测这道题。
展示与供参考口径，不做「已是某某水平」的版本断言；模型名与用时取自 Codex 界面显示。

| 事实 | 值 | 出处 |
|---|---|---|
| 提示词 | 创建一个HTML，内容是SVG绘制一个鹈鹕骑自行车的2D动画 | 用户原话 |
| 模型 / 档位 | GPT-6.1 Sol · 思考等级 高 | Codex 界面截图 |
| 用时 | 7 分 19 秒 | 同上 |
| 产物 | 单文件 HTML，+214 −0 | 同上 + 源码行数 |

产物在 [`products/pelican-ride/`](../../products/pelican-ride/)（成片 / SRT / 封面 / `PUBLISH.md`）。

## 素材来源

| 素材 | 本项目内副本 | 原始位置 |
|---|---|---|
| 动画源文件 | `capture/src/pelican-ride.html` | `~/Documents/Codex/2026-10-03/html-svg-2d/outputs/pelican-ride.html` |
| Codex 生成实录截图 | `capture/assets/codex-session.png` | 会话粘贴板（2559×1439，顶部 FPS 悬浮窗入镜前裁掉） |

副本是权威采集源：原始位置在仓库外、可能被清理，别直接引用。

## 采集设计（capture/）

单 HTML 多镜头，两档视口 + 一个移动断点，全部 60fps / dsf 2：

| 镜头 | 视口 | 用途 |
|---|---|---|
| `page-*` | 1920×1180（3840×2360 实采） | 整页版式：成品页本身就是产物的一部分 |
| `scene-*` | 2880×1560（5760×3120 实采） | 图版特写：boot 注入 `plate-*.js` 隐藏镶边、场景铺满画面。2880 是算过的——最紧特写区域 ≥1613px 源像素（旧片 w<0.42 发软线） |
| `page-narrow` | 390×844 | 移动断点，响应式对照页（capture-clip 直采） |

控件驱动全走真实 DOM（`speed-*.js` 设滑杆值 + input 事件、actions 点 `toggle` / `restart`），
不碰 IIFE 内部 state。`finalize-frames.mjs` 给直采镜头补 clip.json 并重建 `frames/index.json`
（capture-all 每批运行会覆盖 index，两批 + 直采需要合并视图）。

## 与上集（pelican-test）的差异

- **发布改 Playwright**：launch 仍用 `skills/publish`（独立 profile / 端口 / 扫码），填表走 `pw/`
  脚本（connectOverCDP 附着），Playwright 复用 `../../hsr-currency-war/pw/node_modules` 的已装包。
  脚本**永远不点发布**：填完表 + 全页自查截图（`qa/pw-*.png`），人看完自己点。选择器失灵时脚本
  自动转储表单探针（`dumpForm`），照着真实 DOM 现场改。
- **动效密度按 motion-grammar 拉满**：每单元 3–5 批错峰进场；点线表格画入、数字滚动、图注引线
  生长 + 端点脉冲；揭幕动词 wipe-l / wipe-r / iris 相邻剪辑点不重型；长单元全程缓动慢推；
  无交叉溶解，fade 只在环出。
- **封面一次出齐三端**（上集工单留的待办）：`covers.json` 四方案 + `tools/export-covers.py`
  居中裁切（B 站 16:9 / 抖音横 4:3 / 抖音竖 3:4 / 小红书 3:4），v34 竖版文字收中心 810×1080。
- **配乐换海风系**：`make_music.py --style seabreeze`（详见 scripts/README）。

## 复跑

```powershell
cd vibe-studio/projects/pelican-ride
$S = '../../skills/web-capture/templates'

node $S/probe-ui.mjs --html capture/src/pelican-ride.html          # 控件清单
node $S/probe-anchors.mjs --project .                              # 页面模式锚点
node $S/capture-all.mjs --project . --only page-main,page-2x,page-05x,page-pause,page-restart
node $S/capture-all.mjs --project . --only scene-main,scene-2x,scene-05x --width 2880 --height 1560
node $S/capture-clip.mjs --project . --html capture/src/pelican-ride.html --out frames/page-narrow --fps 60 --seconds 8 --width 390 --height 844 --dsf 2 --port 9500 --label page-narrow
node capture/finalize-frames.mjs
node tools/validate-plan.mjs
node $S/render-director.mjs --project . --out render/video.mp4 --crf 15
python ../../scripts/make_music.py --project . --style seabreeze
node tools/assemble.mjs
node tools/verify-master.mjs
node $S/render-director.mjs --project . --cover
python tools/export-covers.py
```

改文案：`edit/timeline.js` 的 `UNITS` / `CUES`。改配乐结构：`edit/sections.json`（96 BPM，
段落边界必须落在小节线上）。改运镜 / 揭幕动词：单元的 `cam` / `reveal`。出样帧审图：
`node $S/render-director.mjs --project . --sample 150,1200,2300 --out qa/x`。

## 发布（Playwright 混合管线）

```powershell
# 1) 三个窗口各自扫码（沿用 skills/publish 的 launch：独立 profile + 调试端口）
node ../../skills/publish/templates/bili.mjs launch     # 9222
node ../../skills/publish/templates/douyin.mjs launch   # 9223
node ../../skills/publish/templates/xhs.mjs launch      # 9224

# 2) 先 --dry 探针各表单（转储真实输入框/编辑器，选择器有变就地改 pw 脚本）
node pw/bili-fill.js --dry
node pw/douyin-fill.js --dry
node pw/xhs-fill.js --dry

# 3) 真跑：上传 + 填表 + 声明 + 自查截图（qa/pw-*.png）
node pw/bili-fill.js   --video ../../products/pelican-ride/pelican-ride-1080p.mp4
node pw/douyin-fill.js --video ../../products/pelican-ride/pelican-ride-1080p.mp4
node pw/xhs-fill.js    --video ../../products/pelican-ride/pelican-ride-1080p.mp4

# 4) B 站封面单独传（已验证的命令）
node ../../skills/publish/templates/bili.mjs cover --image ../../products/pelican-ride/pelican-ride-cover.png

# 5) 三个窗口里，你自己点「发布」
```

## 已知边界

- 采集 4K/5.5K、成片 1080p；`sLegs` 级特写约 1.3× 上采样，矢量边缘可接受，再紧就要缩放页面重采。
- 成片 16:9 横版；抖音竖版封面单独出（`export-covers.py`），视频本体不再出 9:16。
- 无配音，音乐纯器乐；字幕烧录 + SRT 备用。
- `pw/` 选择器按 2026-10 投稿页 DOM 写，平台改版时先 `--dry` 看探针输出再改。
