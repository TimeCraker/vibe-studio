# 本期制作说明（2026-11-01）

当前进度：**2/5**。已做到口播稿交付，等用户真人录音。没有时间线、字幕、代表帧或成片。

| 阶段 | 状态 | 证据 |
|---|---|---|
| 1 检索与筛选 | 完成 | `selection.json`、`evidence/reference-doc.md` |
| 2 两套 TOP15 | 完成 | `ranking.json`、`evidence/browser-observations.md`、`evidence/ranking-*.txt` |
| 3 口播稿交付 | 完成，等录音 | `narration.md`、`script.json` |
| 4 素材准备 | 部分 | `assets/sources.json`（官标、Mol-1 官方图、字体、BGM 已就位；苹果侧无官方配图） |
| 5 按录音制作 | 未开始 | 需要 `audio/recording.*` |

## 本期的三条内容

1. **头条**：DeepSeek 公开 Super-agent 架构并开源研究原型 dsh-superagent-prototype（10 月 31 日晚）。落在四镜：是什么、五模块架构、初步实验数字、研究原型限定。
2. **次重点**：Apple 智能国行首批功能接入阿里千问（11 月 4 日开发者 Beta、12 月随 iOS 27.3）。两镜：入口与隐私口径、时间表与机型门槛。
3. **简讯**：觅深知源开源生物分子模型 Mol-1。两镜：覆盖哪几类复合物、FoldBench-AB 与湿实验数字。

## 画面意图

`content.json` 里每个场景有 `presentation.intent`，写的是这一镜该画什么、不要画什么。要点：

- 榜单按用户首选构图：左侧前三名（冠军珊瑚实底白字）、右侧 4-15 名，两榜平齐；每行模型名前放对应官标；底部只写实际查询时间。
- 五模块架构图用细线方框和虚线回路，不用黑底流程卡。
- 数字页用等宽数字与细线分隔，实验数字角落标“作者自述初步实验，合成负载”。
- Apple 那条没有官方配图，用千问官标配文字说明，不放手机样机渲染；Mol-1 那条用官方柱状图，页脚固定标“厂商自报，第三方未复核”。

## 渲染前要确认的事

- `assets/fonts/sans.ttf` 的 name 表写的是 Noto Sans SC，样式是 Thin。之前几期都用这个文件，本期没换；正文字幕会不会偏细，要在代表帧里看实际效果，必要时在按期代码里调字重而不是换字体。
- 榜单 15 行在 1080p 下的最小字号与行高，按实际代表帧核对，不靠估计。
- 60fps 要从本期 Composition 的帧率常量和秒帧换算落实，不能末尾复制帧转码。

## 已跑过的检查

```powershell
node skills/daily-ai-news/scripts/edition.mjs check --project projects/daily-ai-news-2026-11-01 --phase script
node projects/daily-ai-news-2026-11-01/scripts/verify-inputs.mjs --write
python skills/narration/templates/verify_narration.py projects/daily-ai-news-2026-11-01/script.json
npm test
```

结果：script 阶段 0 错误 0 警告；输入自检 0 失败 1 警告（预期：尚无录音）；口播检查 PASS（307.7 秒 / 预算 360 秒）；仓库测试 43/43。`python scripts/check-docs.py` 全仓 135 条失败，全部是他人未跟踪的 10-24 产品档案，本期新增 0 条。这些只证明输入自洽，不证明成片、视听或人工接受。

## 2026-11-01 的三次改稿

1. 初稿 329.9 秒。用户看过后确认三条都保留，但两处数字段落压短：DeepSeek 省掉订阅直通的 token 数字，Apple 把 15 Pro 与 Pro Max 合成「15 Pro 系列」。降到 307.7 秒。
2. 用户再反馈「太长、不像口播稿」，整篇重写。做法：架构从五块逐项念改成三层白话（派活、干活、看门狗），实验数字从四组减到一组，Mol-1 的四类复合物压成「抗体、蛋白、小分子这几类」，全篇拆成短句和独立小段。降到 196.9 秒。
3. 重写后补了三处精度：飞书是可选接入、Apple 是「部分体验」接入、机型与语言条件写明。字数只增了 4 秒。

被省掉的数字仍留在画面（`content.json` 的 bullets）和 `claims.json` 里，只是不再逐字念。画面上的机型清单仍写全 15 Pro 与 Pro Max 两个型号。

## 接手方式

读 `README.md` 的交接段，收到录音后按 `skills/daily-ai-news/references/production.md#录音到制作输入` 走 recording → transcribe → 校订对齐 → align。`narration.md` 不要被生成器覆盖，锚点要在 ASR 结果里重新填。
