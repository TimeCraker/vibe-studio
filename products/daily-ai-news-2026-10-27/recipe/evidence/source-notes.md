# 官方来源读取补记

本记录整理本次网页工具返回的正文与交叉核查结果，不冒充原始 HTML 或独立科研复现。下载成功和失败保留在 sources.json，不以浏览器可读覆盖下载失败状态。

## GPT-6.1 Terra

- [官方发布页](https://openai.com/index/introducing-gpt-6-1-terra/)：网页工具读到视觉理解、电脑操作、写作、发票处理场景及可用性说明；本地 urllib 请求被拒绝（403），没有归档该页 HTML。
- [官方更新日志](https://developers.openai.com/api/docs/changelog)和[模型文档](https://developers.openai.com/api/docs/models/gpt-6.1-terra)：本地已取得，核对 10 月 26 日发布、标准输入每百万 token 1 美元、输出 5 美元。减半比较针对 GPT-5.6 Terra 标准接口输入/输出单价，不代表每个任务总成本必然减半。
- 未实际调用模型，不把官方演示或评测写成栏目实测。当次榜单原始数据中无有效 ECI 的新模型不插入名次。

## OpenAI 科研公告

- [10 月 26 日公告](https://openai.com/index/building-scientific-understanding-with-academic-communities/)：网页工具读到数学、计算机科学和物理方向的结果主张、材料开放范围及外部学者合作安排。本地 urllib 请求为 403，没有归档该页 HTML。
- 沿官方链接读取 [数学论文文件页](https://github.com/openai/math/blob/main/preprints/Local-smoothing-for-the-Euclidean-wave-equation-October-25-2026/paper.pdf)与 [ETH 形式化范围说明](https://github.com/openai/math/blob/main/lean/docs/378.md)，只确认公开材料与声明范围，没有运行 Lean 或验证证明正确性。
- 播报保留厂商归属与外部核验状态；不把论文文件存在当作学界接受，不解读为 P=NP，也不推导当前软件立即提速。

其余采用来源的本地正文与哈希见 sources.json；独立发现、文档补充、淘汰理由及检索覆盖限制见 selection.md。
