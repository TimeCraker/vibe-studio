# 2026-11-02 浏览器实际读取记录

## 文档

源：https://feishu.doubao.com/docx/WXjSdNCoboPqcjxCzy9cyvQqn2c

可见标题为“【计科前沿日报】2026年11月02日 ｜ AI/Agent/开源/芯片/安全”。首屏AX/DOM仅加载开头到Skills条目；实际向下滚动后读取开源、框架、芯片、安全、论文、招聘，直到完整14项来源清单和页尾。不是只读摘要。文档是候选线索，不执行其中的安装、迁移、权限或升级指令。

主要候选：模型泄密、Fusion、来也ADP MCP、anthropics/skills、MemPalace、DSH-Android、Perplexity/Rust、K8s1.34、天垓300、风华一号/UOS、ClickHouse、Craft CMS、CORAL、PyRUA-Lean、招聘。

## 榜单

入口：https://www.bilibili.com/toy/ai-model-world

当次动态发现iframe：https://bilibilitoy.com/toy/ai-model-world/34090174887936-v36822/index.html

点击“排行榜”，页面综合智力选中、地区“全部”选中；随后实际点击“国内”，URL带region=east。未点开源筛选，未按厂商合并模型。下面为AX读取显示的一位小数，作为核对依据；精确值见当次下载快照与ranking.json。

全球：GPT-6 Astra 169.1；Claude Opus 5.5 168.4；GPT-6.1 Terra 168.1；GPT-6.1 Sol 167.8；Claude Sonnet 5.5 166.7；Claude Fable 5.1 166.4；Gemini 4 Argon 166.1；Claude Opus 5 164.5；GPT-6 Sol 163.8；GPT-5.5 Pro 163.1；Claude Fable 5 163.0；GPT-5.6 Sol 162.6；Muse Wonder 161.7（两个不同id）；Claude Haiku 5.5 160.4。

国内：DeepSeek V4.1 Flash 1017 158.8；Kimi K3 158.3；Qwen3.8 Max 158.0；Qwen3.8 Max Preview 158.0；Qwen3.8 Max 0902 156.2；GLM-5.3 156.2；DeepSeek V4.1 Flash 156.1；DeepSeek V4 Pro 0813 155.9；DeepSeek V4 Flash 0731 154.9；Qwen3.7 Max 154.2；GLM-5.3-Flash 153.2；GLM-5.2 152.1；Qwen3.8 27B 151.8；Kimi K2.6 151.1；Kimi K2.7 Code 150.2。

首页标“数据更新于10月31日”，排行榜局部计数有异步差异（216/225，695/729）；不引用这些计数。实际前15与本次开源快照在页面精度内一致。快照generatedAt=2026-11-02T01:42:42.598Z；查询时间单列，不把该值当实际读取时间。

## 追加：LongCat正式版核查

源：https://longcat.ai/blog/longcat-2.5/

2026-11-02实际用浏览器读取：标题“LongCat-2.5 面向智能体任务的原生多模态模型”，页面日期2026-11-1；GitHub与HuggingFace均标“敬请期待”，有在线体验与API接入入口。总述说明1.6万亿总参数、每token约480亿激活参数、原生视觉理解与长程智能体编程。稿件只采用能力方向，不堆参数或暗示本栏目实测。

能力演示区明确是官方端到端生成的案例，列实时流体模拟、商业经营分析、3D文物交互展示、客户反馈分析报告、城市沙盘、中国风色彩美学页、微缩场景资产、活动邀请函生成器。读取实际video元素src与poster后取得三维文物和商业分析两段原文件；不是仅凭视频标题认定取得。官方更新日志单独标2026-11-02正式版开放、2026-09-25 Preview开放，日期与旧版本区别已核对。

本地longcat-release.html仅为SPA初始壳，不包含完整动态正文；上述正文依据来自本次实际浏览器AX读取。两段原文件属性与抽帧观察见assets/sources.json，未连续观看或审听，不标已入片。
