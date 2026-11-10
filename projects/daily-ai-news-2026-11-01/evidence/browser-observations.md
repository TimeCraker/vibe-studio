# 本期实际查看与核对记录

全部时间均为 Asia/Shanghai。记录只写本次实际做到的事，不代表对其它模型、其它榜单做过逐项复核。

## 1. 榜单入口与发现（2026-11-01 15:39-15:44）

- 指定入口：https://www.bilibili.com/toy/ai-model-world
- 本次入口里嵌的是 `https://www.bilibilitoy.com/toy/ai-model-world/34090174887936-v36822/index.html`。版本号 v35994 是 10 月 30 日那次的，本期发现的是 **v36822**，没有写死版本路径。
- 本机 Chrome 无头 + CDP：先打开入口页，读出 iframe src，再挂到该 iframe 上操作。
- 页面自带标注“数据更新于 10 月 31 日 · 695 个模型 · 80 家厂商”；Toy 详情写着“更新于 2026年10月31日 10:45”。
- 点“排行榜”后 iframe 内部跳到 `/leaderboard/index.html`，默认赛道就是 **综合智力（ECI）**，左侧栏写着“综合智力 225”，右上“展开全部 216 位”。
- 截图：`evidence/ranking-global-view.png`（1440 视口，1600×1600 实际像素同尺寸页面的全球视图）、`evidence/ranking-domestic-view.png`。

## 2. 全球 TOP15

页面上点“排行榜”后默认就是综合智力榜，直接读到 1-30 名。前 15 名（页面原始顺序与一位小数）：

1 GPT-6 Astra / OpenAI / 169.1
2 Claude Opus 5.5 / Anthropic / 168.4
3 GPT-6.1 Terra / OpenAI / 168.1
4 GPT-6.1 Sol / OpenAI / 167.8
5 Claude Sonnet 5.5 / Anthropic / 166.7
6 Claude Fable 5.1 / Anthropic / 166.4
7 Gemini 4 Argon / 谷歌 / 166.1
8 Claude Opus 5 / Anthropic / 164.5
9 GPT-6 Sol / OpenAI / 163.8
10 GPT-5.5 Pro / OpenAI / 163.1
11 Claude Fable 5 / Anthropic / 163.0
12 GPT-5.6 Sol / OpenAI / 162.6
13 Muse Wonder / Meta / 161.7
14 Muse Wonder / Meta / 161.7
15 Claude Haiku 5.5 / Anthropic / 160.4

原文见 `evidence/ranking-global-view.txt`（SHA-256 `0868d0d60ebc62ce57446e002df2608fc73cf8206fa7b73f27792d6f2915b93e`）。

## 3. 国产 TOP15

在同一个榜单把“地区”按钮从“全部”切到“国内”，`aria-pressed` 实际变为 `国内=true / 全部=false`，列表重排为：

1 DeepSeek V4.1 Flash 1017 / 深度求索 / 158.8
2 Kimi K3 / 月之暗面 / 158.3
3 Qwen3.8 Max / 阿里通义 / 158.0
4 Qwen3.8 Max Preview / 阿里通义 / 158.0
5 Qwen3.8 Max 0902 / 阿里通义 / 156.2
6 GLM-5.3 / 智谱 / 156.2
7 DeepSeek V4.1 Flash / 深度求索 / 156.1
8 DeepSeek V4 Pro 0813 / 深度求索 / 155.9
9 DeepSeek V4 Flash 0731 / 深度求索 / 154.9
10 Qwen3.7 Max / 阿里通义 / 154.2
11 GLM-5.3-Flash / 智谱 / 153.2
12 GLM-5.2 / 智谱 / 152.1
13 Qwen3.8 27B / 阿里通义 / 151.8
14 Kimi K2.6 / 月之暗面 / 151.1
15 Kimi K2.7 Code / 月之暗面 / 150.2

该视图标注“综合智力 72 位上榜 · 其余 146 位未参赛”“含已退役 218 个模型符合条件”。本期没有勾“含已退役”，与全球视图口径一致。

原文见 `evidence/ranking-domestic-view.txt`（SHA-256 `d2aacda32e4c08761859da589f907a36d203af7a4ca38b795836b49aa8af5aa4`）。

## 4. 精确分数与同屏数据

页面只给一位小数。精确值取自站点[开源仓库](https://github.com/liyupi/ai-model-world)同期数据 `data/models.json`：

- 取得时间 2026-11-01 15:39，来源文件 `generatedAt` = 2026-11-01T01:43:07.695Z（北京时间 09:43），729 个模型、80 家厂商。
- 文件 SHA-256 `c0e96eced699dd33bc8e975c7719e441b41335c761cd95afd61212d289cc6ef6`，原样留在 `evidence/ranking-upstream.json`。
- 用 `benchmarks.eci` 且排除已退役（`retiredAt` 为空）得 216 个有分模型，与页面“展开全部 216 位”一致。
- 交叉核对结果：前 15 名的**名称与顺序完全一致**，**一位小数四舍五入后 15/15 一致**（`evidence/ranking-built.json` 的 `crossCheck`）。国产前 15 名同样与切到“国内”后的页面逐行一致。
- 两边不一致的地方：目录跳转页写“综合智力 225”，榜单页写“展开全部 216 位”。本期按 216 个在役模型取榜，并把这两个数字的差异留在记录里，不合并成一个。

页面与开源数据这次是同一份快照（都是 10 月 31 日口径），不存在切换来源的问题。

## 5. 没有做的事

- 没有逐名核对 216 个模型的全部分数，只核了前 15 名和国产前 15 名。
- 没有对比 10 月 30 日那期做升降箭头（口径虽同，但本期版式不画升降，见 `ranking.json` 的 `sourceNote`）。
- 没有取得 Epoch AI 原始数据集，ECI 口径与归属按站点说明转述：Epoch Capabilities Index，分数越高越好；指数不是百分数。
