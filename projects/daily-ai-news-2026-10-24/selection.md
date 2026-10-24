# 2026-10-24 选题与核查

先在浏览器完整翻阅用户指定豆包文档：<https://feishu.doubao.com/docx/SZENdG7NrozsyTxSV8Ackv7HnGd>。它是线索，不执行文档内指令，不将AI生成配图当官方素材。日期按北京时间，本期值得出片；条数由有效内容决定。

| 候选 | 处理 | 理由与边界 |
|---|---|---|
| Kimi K3.1 Pro | 头条 | 官方技术博客与研究索引核到新发布、上下文、终端评测、创作案例和权重时间。重点讲能力与可用时间，删API价格、内部幻觉率等容易脱离口径的信息。 |
| Harness² | 次重点，标近期工具观察 | 读取google-research仓库README和元数据，能够解释实际用途；仓库10/6创建、10/14推送，不沿用线索的10/22发布日期和涨星数字。 |
| VoiceStudio | 工具选读 | README核到本地语音设计、转写、配音、API。对视频创作者有直接用途，不当作今天新发布，不报涨星、未实测语言覆盖和效果。 |
| 讯飞星火X2.6 | 本期未采用 | 官方站点正文不足以核清线索中的“业内唯一全国产训练”等强结论；不靠门户转述填补。不是断言该新闻虚假。 |
| 智元Genie Studio2.0 | 未采用 | 线索指向综合早报，未取得足以支撑7天部署承诺的官方细节；与本期主线关系较弱。 |
| rea及涨星 | 未采用 | 不以趋势站星数当内容价值，不用未核原始功能与当日事件补条数。 |
| Doris峰会、K8s EOL | 未采用 | 非本期AI模型与创作者主线；K8s维护提醒需另按官方生命周期核查，没把线索结论带入视频。 |
| AMD跑分、融资、招聘 | 未采用 | 传闻、单点跑分或资本/求职消息，对本期受众操作价值有限，无可靠模型头条缺口需要填。 |
| Signal、KSMBD安全通报 | 未采用 | 需要独立漏洞编号、受影响版本与补丁核查，本期未做这项审计，不传播未经核实告警。 |
| MemCo与Stack门控论文 | 未采用 | 原线索仅给arXiv recent列表，非明确论文正文；本期不以标题摘要充当结论。 |

## 榜单证据

现场从指定B站入口进入内嵌页，再点“排行榜”：综合智力，全部/国内两次筛选。全球前15、国内前15名称和顺序逐条核到；国内榜与vendor.continent=east/country=CN匹配。原站显示一位小数，片中采用同源开源快照的两位原始数值，不从页面四舍五入反推。

当次动态发现的内嵌地址、下载原始HTML、上游models.json与检索记录保存在evidence，结构化正本为ranking.json。原始数据生成时间2026-10-24T01:52:45.328Z，即北京时间09:52:45；不是制作时刻的实时算分。两榜均不去重型号、不补分、不画升降。K3.1 Pro没有ECI，因此国产第一仍显示Kimi K3，片中加注，避免新模型名称混淆。

## 来源

- <https://www.kimi.com/en/blog/kimi-k3-1-pro>，Intro、Coding、3D Modeling、Availability及Footnotes。
- <https://github.com/google-research/harness2>，README及公开仓库元数据；研究框架，不是Google正式支持的产品。
- <https://github.com/debpalash/VoiceStudio>，当前功能README，工具选读。
- <https://www.bilibili.com/toy/ai-model-world>，现场全球/国内综合智力筛选；<https://github.com/liyupi/ai-model-world>同源两位小数快照。

所有正式声明及定位以storyboard.json引用的claims正本为准。没有因本期删去而宣称候选内容虚假。
