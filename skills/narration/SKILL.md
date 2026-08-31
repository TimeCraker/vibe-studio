---
name: narration
description: 视频口播稿 / 配音稿结构化工坊：把讲稿写成带画面引用的分段稿 JSON，字数↔秒数由程序派生，verify_narration.py 程序校验红绿分明，交付剪映配音。用户说「写口播稿 / 视频文案 / 配音稿 / 写脚本 / 分段稿 / narration」时使用；视频成片前的文案环节。
user-invocable: true
---

# narration — 结构化口播稿工坊

**口播稿是带时间结构的数据，不是文章**：分段声明、程序校验、人只管语感终审。视频口播稿特有的三件事由契约 + 校验器管住——时长工程（中文 ≈4.5 字/秒，字数即秒数）、视频叙事（钩子开头 / 讲画面 / 留白）、文画对齐（`ref` 声明哪句话配哪段画面）。**本 skill 不做语音合成**：配音用剪映人工完成。

## 契约与工具

- 分段稿 JSON：`meta`（title / lang / budgetSeconds / charsPerSecond / bannedWords）+ `segments[]`（id / kind / text / ref）。`kind=subtitle`（≤20 字，直接当字幕）或 `voiceover`（长口播段，只计时长不查段长），缺省 subtitle；`ref` 写画面引用（素材时间段如 `footage 0:00-0:04`，或 PPT 页码）。字段不许改，样例见 `templates/script.example.json`。
- **字数与秒数是派生值，作者不写、校验器算**——声明意图，数字交给程序。
- 校验器：`python skills/narration/templates/verify_narration.py <script.json> [--cps 4.5] [--budget-seconds 22]`。查结构、字幕段长（≤20 字）、时长对账（只罚超预算 10%，低于预算是留白）、破折号禁令（`——` `—` `–`）、AI 腔词表与 meta.bannedWords（WARN）、修饰密度（WARN）；FAIL 退出 1，全绿退出 0。

## Step 1 · 受众与预算

**先答受众三问再动笔**（复用 ppt skill）：给谁看？观众对主题已知道什么？看完要能复述哪三句话？答案写在分段稿头部，之后所有取舍用它裁决。

预算从素材倒推：**budgetSeconds ≈ 素材时长 × 75%**——要给画面留呼吸，素材 30s 别把 30s 全说满。速算：中文 4.5 字/秒，20 字 ≈ 4.4 秒 ≈ 一条字幕的上限。

## Step 2 · 分段成稿

写 `projects/<项目名>/script.json`：逐段 text + ref + kind，段 id 顺叙事排。

**通用写稿要求：讲稿解读下钻到细节层。** 不停在概念、模块、功能名的层面复述——每段至少落到一个具体细节（具体画面、具体操作、具体数字、具体场景），观众听到的是细节不是抽象名词；挖不出细节的段回 Step 1 换素材，不硬凑空话。

分段的度：一条 subtitle ≈ 一口气的画面单元（≤20 字校验器兜底）；钩子开头放第一段；voiceover 只用于不被画面切分的连续讲解长段。

## Step 3 · 程序校验（全绿才进步）

跑校验器，**红了改稿不是改规则**：段长超 → 拆段或删字；超预算 → 删内容，不是改 budgetSeconds；破折号 → 换逗号或冒号；AI 腔命中 → humanizer 过一遍。全绿才进 Step 4。

## Step 4 · 人工打磨

humanizer 深度过稿；然后**出声读一遍**——喘不上气的段拆两段，拗口的换词，书面语换口头语。校验器管住底线，语感终审靠人。

## Step 5 · 交付

1. 分段稿逐段贴**剪映**配音（市面产品人工操作，无自动化环节）；音频回来放 `projects/<项目名>/remotion-app/public/deck/audio/`
2. 段文本进 video-motion 的 `cues.subtitles`，时间轴由 auto-subtitle 校准
3. 分段稿与校验记录属项目工作区（`projects/`），成片产物落 `products/<项目名>/`

## 节奏速查表

4.5 字/秒：30s ≈ 135 字 · 1min ≈ 270 字 · 5min ≈ 1350 字

## 边界与坑

- 不做语音合成（剪映人工配音）、不做时间轴精确对齐（auto-subtitle 站负责）、不做竖屏文案
- 破折号中英双禁，原文含 `——` `—` `–` 任一直接红
- 控制台 print 全英文（GBK），分段稿文件显式 utf-8
- 校验器词表 / 阈值是底线不是绊脚石：红了改稿，但也不许为过稿放水改规则
