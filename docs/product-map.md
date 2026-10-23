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

三条线共用受众与事实取材、分镜、美术方向、短样片和最终人工审阅。平台适配由 content-repurpose 选择镜头并重排时间轴，不能只改标题或事后裁剪。publish 只填表，不登录或点发布；content-review 读取真实效果数据。

工具职责与安装以 README.md 为准。流程以 workflows/explainer-video.md 为准。历史 DeckVideo 用于旧片对照，新介绍片默认 DeckVideoV2；保留旧代码不代表推荐旧工艺。

归档保留制作配方与素材/成品哈希。历史记录中的通过不代替当前版本验收；缺原始素材的历史作品在 archive.json 明确记录。
