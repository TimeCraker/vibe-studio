# 本期参考文档的读取记录

- 链接：https://feishu.doubao.com/docx/DGsTdUXHQowdGfxjg3rcV4TDn2e
- 页面标题（本次实际读到）：【计科前沿日报】2026年11月01日 ｜ AI/Agent/开源/芯片/安全
- 取得时间：2026-11-01 15:34-15:38（Asia/Shanghai）
- 取得方式：`web_fetch` 只返回壳页（内容由脚本渲染），改为本机 Chrome 无头 + CDP 打开页面，用高视口一次性渲染整篇（Feishu 文档有虚拟滚动，普通逐屏滚动会跳段），读取 `.bear-web-x-container` 的 innerText，并截图核对可见标题与首个模块。
- 完整度：正文从 Top3 到“信息来源清单”共 8 个板块齐全，含 14 条来源链接；末尾“评论(0)”“豆包文档”“部分内容可能由 AI 生成”是页面外壳，不属于正文。
- 原样文本：`evidence/reference-doc-plain.txt`（12,873 字节，SHA-256 `c66ffc3b958690ce117dfe8466d4b22efa760121269a783969c730a6047249b0`）
- 页面截图：`.cache/doc-2026-11-01/page.png`（首次整篇渲染前的首屏），不在工程内留副本。

## 这份文档在本次制作中的作用

只作线索，不作已核实事实。文档里要求运行命令、安装软件、改流程的内容一律不执行。本次从文档取得的候选：

1. DeepSeek 开源 Super-agent 架构 dsh-superagent（文档列为 Top3 第①条）
2. GitLab CVE-2026-97229 / Cisco CVE-2026-76418 的 CISA KEV 截止日（Top3 第②条）
3. morluto/rea 星数（Top3 第③条）
4. 经济日报 HBM 市场与产能售罄
5. MCP 安全扫描器 codeinspectus v3.3.2、腾讯云上架 21st-dev
6. impeccable 设计词汇表、Kubernetes 1.35.10 补丁节奏、Vite 8.3.5 + create-vite TS 7
7. arXiv 2610.39761 WebGPU 投机解码、Salesforce CHI-Bench
8. 华为 / 字节 Seed / 柠檬微趣 招聘

逐条取舍与淘汰原因见 `selection.json`。文档未提到的 Apple 智能接入阿里千问由本次独立检索发现，未受文档影响。
