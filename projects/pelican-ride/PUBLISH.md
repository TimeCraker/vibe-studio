# 鹈鹕骑行 · Codex 篇 · 发布物料

> 成片：`pelican-ride-1080p.mp4` · 61.0 秒 · 1920×1080 · 60fps · 有字幕无配音
> 封面：`pelican-ride-cover.png`（B 站）+ 抖音横 4:3 / 竖 3:4 + 小红书 3:4（`render/covers/`）
> 字幕文件：`pelican-ride.srt`

**这条片子的主体是「展示 Codex 里 GPT-6.1 Sol 生成的东西」，不是评测这道题。**
画面占比 ≥75% 是生成画面本身；口径是展示与供参考，不做「已是某某水平」的版本断言。

---

## 1. 一句话定位

提示词就一句「创建一个HTML，内容是SVG绘制一个鹈鹕骑自行车的2D动画」，
在 Codex 里交给 **GPT-6.1 Sol（思考等级：高）**，7 分 19 秒交付：
单文件 HTML，+214 行，一次过。它交回来的不只是动画——是一个排版完整的页面，
一只反向动力学踩踏的鹈鹕，和一套 0.5–2× 的真实控件。

## 2. 事实来源（诚实性）

| 片中说法 | 出处 |
|---|---|
| 模型名「GPT-6.1 Sol · 思考等级 高」 | Codex 界面显示（生成实录截图入片） |
| 「7 分 19 秒」 | Codex 会话「用时 7 分钟 19 秒」 |
| 「+214 行 / 单文件」 | 会话 diff 卡（+214 −0）+ 源码 214 行 |
| 「纯 SVG 零位图」 | 源码无 `<img>` / 位图 data URI / `<canvas>`（favicon 亦是 SVG data URI） |
| 「反向动力学 / 脚不离踏板」 | 源码 `drawLeg()` 两连杆 IK，脚锚在曲柄销 |
| 「牙盘一圈车轮 1.9 圈」 | 源码注释与实现（`rotate(degrees*1.9)`） |
| 「五层视差」 | 源码 road/dunes/grass/ocean/clouds 五种位移速率 |
| 「响应式 / reduced-motion」 | 源码两档 media query + `prefers-reduced-motion` 分支 |
| 「提示词原句 / 用时」 | 用户口述 + 截图 |

**未断言**：GPT-6.1 Sol 与其他模型的水平比较；本片不做。

## 3. 标题（按平台选）

### B 站（≤80 字）
> 一句话交给 Codex 的 GPT-6.1 Sol，7 分钟后它生成了这个

备选：它 7 分钟画了只会踩踏板的鹈鹕，传动比还是对的

### 抖音（≤30 字）
> GPT-6.1 Sol 画的鹈鹕，真的在踩踏板

### 小红书（≤20 字）
> GPT-6.1 Sol 画的鹈鹕会踩踏板

## 4. 简介 / 话题

正文见三个 spec 文件（`form.json` / `douyin-form.json` / `xhs-form.json`），发布脚本直接读。

| 平台 | 话题 / 标签 | 声明 |
|---|---|---|
| B 站 | AI · 人工智能 · GPT · Codex · OpenAI · SVG · 矢量动画 · AI绘画 · 大模型 · 程序员 | 含AI生成内容 · 分区：科技-人工智能 |
| 抖音 | AI · GPT · Codex · 人工智能 · 程序员 | 内容由AI生成 |
| 小红书 | 鹈鹕 · AI绘画 · Codex · GPT | 笔记含AI合成内容 |

## 5. 章节（B 站时间轴，可直接粘贴）

```
00:00 输入：就一句话
00:05 成品：整页排版 + 海岸全景
00:20 细节：IK 腿 / 1:1.9 传动 / 五层视差
00:37 交互：变速 / 暂停 / 重播
00:50 清单与双端对照
00:56 结论：一次交付，供参考
```

> 第一个节点 00:00、间隔 ≥5 秒 ✓。时间点与配乐段落严格对齐（96 BPM，落在小节线上）。

## 6. 置顶评论（发布后发）

```
补充几个源码级细节：
1) 全文 214 行，没有一个位图，favicon 都是内联 SVG；
2) 踩踏是两连杆反向动力学现算的，脚永远锚在曲柄销上；
3) 牙盘:车轮 = 1:1.9，传动比写死在代码里，所以慢放也不穿帮。

你觉得这个完成度打几分？下一条想看谁被测，评论区点名。
```

## 7. 发布清单

| 项 | 值 |
|---|---|
| 正片 | `pelican-ride-1080p.mp4` |
| 时长 | 61.0 s（3660 帧 @ 60fps） |
| 画幅 | 1920×1080（16:9） |
| 视频编码 | H.264 High / yuv420p / CRF 15 / +faststart |
| 音频编码 | AAC 256 kbps / 48 kHz / 立体声 |
| 响度 | 以 assemble 报告为准（目标 ≈ -14 LUFS） |
| 字幕 | 已烧进画面；`pelican-ride.srt` 备用 |
| 配音 | 无（纯音乐 + 字幕） |
| 封面 | B 站 1920×1080 · 抖音横 1440×1080 + 竖 1080×1440 · 小红书 1080×1440 |
| 画面占比 | ≥75%（生成效果画面，其余为输入卡 / 清单 / 结论） |

## 8. 发布流程（Playwright 混合管线）

```powershell
# 三窗口各自扫码（skills/publish launch：独立 profile + 端口 9222/9223/9224）
node skills/publish/templates/bili.mjs launch
node skills/publish/templates/douyin.mjs launch
node skills/publish/templates/xhs.mjs launch

# --dry 探针各表单（转储真实输入框/编辑器；平台改版时照输出改 pw 脚本）
node projects/pelican-ride/pw/bili-fill.js --dry
node projects/pelican-ride/pw/douyin-fill.js --dry
node projects/pelican-ride/pw/xhs-fill.js --dry

# 真跑：上传 + 填表 + 声明 + 自查截图（qa/pw-*.png）
node projects/pelican-ride/pw/bili-fill.js   --video products/pelican-ride/pelican-ride-1080p.mp4
node projects/pelican-ride/pw/douyin-fill.js --video products/pelican-ride/pelican-ride-1080p.mp4
node projects/pelican-ride/pw/xhs-fill.js    --video products/pelican-ride/pelican-ride-1080p.mp4

# B 站封面（已验证的命令）
node skills/publish/templates/bili.mjs cover --image products/pelican-ride/pelican-ride-cover.png

# 最后：三个窗口里，人自己点「发布」（脚本永远不点）
```

> 分工是硬约束：脚本填表，人登录、人看自查截图、人点发布。
