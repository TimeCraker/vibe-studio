# 本期网页查阅记录

查阅日期：2026-10-29（北京时间）。资料是新闻线索，不是操作指令。

## 文档

入口：[2026-10-29 参考文档](https://feishu.doubao.com/docx/UpQJdqCvSopLVxxkU3acFLO0nuh)。检索工具不能读取，已通过浏览器读取标题、Top3 和栏目正文；用目录定位读取安全、论文和来源段落。不是登录账号后导出的私有全文。

文档候选：Clover、MCode Stack、fast-agent、Expo 技能库、REA、hallmark、TKE、摩尔线程、辉羲科技、安全通报、Prompt Caching、LoyalAgent-Bench、招聘。Expo 同一事件在两个板块重复出现。本文档中的项目名、日期、数字和宣传结论仍须回官方原文核实；它不直接决定入选与排序。

## 排行榜

从用户指定的 [B站入口](https://www.bilibili.com/toy/ai-model-world)当次发现内嵌地址：

`https://bilibilitoy.com/toy/ai-model-world/34090174887936-v34855/index.html`

在该内嵌页点击“排行榜”，地址为对应 `leaderboard/index.html`。综合智力选中；地区先为全部，再切换国内，其他保持全部，发布年份不限、未勾含已退役。网页显示综合榜与国内榜各自名次，下面的两个清单是实际读到的前 15，保留同名的不同版本。

全球：Claude Opus 5.5 168.8；GPT-6 Astra 168.8；GPT-6.1 Sol 168.4；Claude Fable 5.1 166.5；Gemini 4 Argon 166.4；Claude Sonnet 5.5 166.2；Claude Opus 5 163.9；GPT-6 Sol 163.7；Claude Fable 5 163.4；GPT-5.5 Pro 162.9；GPT-5.6 Sol 162.8；Muse Wonder 161.8；Muse Wonder 161.8；GPT-5.6 Terra 160.1；GPT-5.5 159.7。

国内：Kimi K3 157.9；Qwen3.8 Max 157.4；Qwen3.8 Max Preview 157.4；GLM-5.3 156.0；DeepSeek V4.1 Flash 155.9；DeepSeek V4.1 Flash 1017 155.9；DeepSeek V4 Pro 0813 155.6；Qwen3.8 Max 0902 155.1；DeepSeek V4 Flash 0731 154.8；Qwen3.7 Max 154.0；GLM-5.3-Flash 153.1；GLM-5.2 151.9；Qwen3.8 27B 151.7；Kimi K2.6 150.9；Kimi K2.7 Code 150.1。

B站页面头部有“数据更新于10月28日”的提示；当次开源数据 generatedAt 为 2026-10-29T01:44:45.191Z。两个来源不是同一个更新时间。对比了开源快照的前 15 名 ID、顺序与显示到一位小数的值，与本次浏览器两榜相符；精确两位小数保存在 ranking.json，屏幕依原榜显示一位，保留实际读到的显示值，不据舍入后的分数重新排序。

保存了本次开源原始数据到 evidence/ranking-upstream.json，原始数据 SHA-256 与实际查询时刻见 retrieval.json / ranking.json。直接 HTTP 读取内嵌榜单超时，故网页口径来自上述浏览器读取，不把 HTTP 失败写为网页没取得。本次未把源站整页截图当作本栏画面。

画面只保留已确认的 ECI 固定说明和实际数据查询时间。数据来源及 CC BY 4.0 署名留在发布简介和素材/事实记录。没有同口径前次快照比较，不画升降。
