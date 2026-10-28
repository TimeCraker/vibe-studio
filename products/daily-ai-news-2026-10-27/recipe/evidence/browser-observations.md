# 浏览器观察整理

这是 Agent 对本次工具返回的可访问性文本的整理，不是原始 HTML 导出，也不声称已保全截图或网络请求。

## 豆包日报

2026-10-27 读取 https://feishu.doubao.com/docx/QCE7dxQuroPzwax098Rc3tg2n1e 。标题为“【计科前沿日报】2026年10月27日 ｜ AI/Agent/开源/芯片/安全”。滚动读取模型、Agent、开源、云原生、芯片、安全、学术、行业八个板块。

主要线索原意：Mistral 今日放权重；Kimi 会员额度跟进；AAIF 新增四项目；REA/Cindy/Gemini CLI 涨星；K8s 1.34 EOL；芯片融资与 IPO；iOS 与 rclone 安全；Phronix、Salesforce Koa；实习招聘。这里只记录线索，真实取舍与纠错见 selection.md。

## 当次指定榜单

入口 https://www.bilibili.com/toy/ai-model-world ，当次发现 iframe https://bilibilitoy.com/toy/ai-model-world/34090174887936-v32787/index.html 。点击排行榜，再点“国内”。不在生成器里写死这个带版本号的内嵌地址；它只作为本次观察位置。

全球前 15 的页面显示：Claude Opus 5.5 168.8；GPT-6 Astra 168.8；GPT-6.1 Sol 168.4；Claude Fable 5.1 166.5；Gemini 4 Argon 166.4；Claude Sonnet 5.5 166.2；Claude Opus 5 163.9；GPT-6 Sol 163.7；Claude Fable 5 163.4；GPT-5.5 Pro 162.9；GPT-5.6 Sol 162.8；Muse Wonder 161.8；Muse Wonder（另一 ID）161.8；GPT-5.6 Terra 160.1；GPT-5.5 159.7。

国内前 15 的页面显示：Kimi K3 157.9；Qwen3.8 Max 157.4；Qwen3.8 Max Preview 157.4；GLM-5.3 156.0；DeepSeek V4.1 Flash 155.9；DeepSeek V4.1 Flash 1017 155.9；DeepSeek V4 Pro 0813 155.6；Qwen3.8 Max 0902 155.1；DeepSeek V4 Flash 0731 154.8；Qwen3.7 Max 154.0；GLM-5.3-Flash 153.1；GLM-5.2 151.9；Qwen3.8 27B 151.7；Kimi K2.6 150.9；Kimi K2.7 Code 150.1。

浏览器页面保留一位小数，部分浮点显示与通常十进制四舍五入略有差异。ranking.json 保存本次上游原数值、ID 与查询时间，未根据页面显示反推精确分数。当前两套前十五顺序一致，不依据广场缓存里“最新模型”标签自动改排名。
