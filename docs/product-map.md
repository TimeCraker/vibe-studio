> 状态：活跃

# 产品图

开工先选交付物，工具按需要调用。

| 交付物 | 默认入口 | 配套工具 |
|---|---|---|
| PPT | ppt | content-director 定受众与材料，humanizer 过文案 |
| 录像讲解 | video-motion / FootageOverlay | auto-subtitle、media-qc |
| 产品介绍片 | workflows/explainer-video.md | content-director、narration、video-motion、media-qc |
| 网页/代码动画成片 | web-capture | 导演页、配乐、media-qc |
| 独立通用封面 | video-motion / Cover | 三种预设；介绍片封面使用 CoverV3 |

先判断画面来源：已有网页走 C 线采集；现成素材可走 A 线剪映；需要组件直绘走 B 线 Remotion。已有录像只需叠标注时直接用 FootageOverlay。

三条线可混用，默认阶段与裁剪方式见[视频制作流程](../workflows/explainer-video.md)。各技能职责见 [README](../README.md#工具与职责)，不在此复述完整制作与投稿规则。

工具职责与安装以 README.md 为准。流程以 workflows/explainer-video.md 为准。历史 DeckVideo 用于旧片对照，新介绍片默认 DeckVideoV2；保留旧代码不代表推荐旧工艺。

高质量视频先用 content-director 确定参考方法与视觉方向，按需生成可播放动态分镜；正式画面与实际配音稳定后由 audio-post 做声音处理，media-qc 核查实际成片并记录视听观察。平台适配、投稿与发布后复盘统一归 publish，三个阶段可独立使用。

各类画面素材与专项能力的职责统一见[视觉选路](../skills/content-director/references/visual-routing.md)：通用设计与位图生图按环境调用，技术图解/Lottie/3D 由 video-motion 的相关分支实现，不另复制一套工具清单。

缺现成素材进入 [asset-scout](../skills/asset-scout/SKILL.md)，由其交接实际输入和来源；产品实操由 content-director 的[演示方法](../skills/content-director/references/product-demo.md)安排，连续栏目按[系列一致性](../skills/content-director/references/series-continuity.md)实施。本地可重放页面交 C 线；线上产品使用实际可用工具取得录像，再交 A/B 线，不把线上录屏视为现有逐帧采集器的能力。

作品状态与历史证据的解释见[文档维护约定](documentation.md#作品状态记录)。
