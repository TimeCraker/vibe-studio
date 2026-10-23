# 平台版本派生

先决定每个平台保留哪些镜头、观众要理解什么和目标行为，再写标题与简介。variants.json 记录每个平台的 sceneIds、title、description[]、tags[]、format（width/height/fps）、safeArea、video/cover 路径和声明选择。字段示例见 `templates/variants.example.json`；平台限制可用 limits.titleChars 配置，使用时核对平台当前表单。

运行 `node skills/publish/scripts/derive.mjs --project <项目>`。工具只复制既有事实与明确配置，生成 exports/ 下的重排时间轴、渲染规格、SRT 和平台表单，以及 publish-plan.json；不生成或发布运营数据，不替原稿增加未经证实的卖点。

C 线 storyboard 每镜声明 shot/sourceStart（可选 crop）；生成后用 `render-director --variant <平台> --out render/<平台>.mp4` 实际渲染，检查目标画幅和手机阅读。B 线把 render-spec 交 video-motion，重新排版场景，不能把 render-spec 当已生成的竖版视频。

表单中的 video/cover 必须指向该平台最终交付文件。派生不会自动上传。每个版本通过 media-qc 和人工核对后才调用 publish；平台控件、安全区与封面比例以当前真实表单为准。

## 素材署名交接

读取 [asset-scout](../../asset-scout/SKILL.md) 或已有来源记录中本项目实际使用文件的条件与署名文本，按目标平台实际支持的位置落实到简介/交付说明；需要片内声明则回导演与制作。技术 QC 不判断素材使用条件，不另维护一份素材清单；平台文案落实原记录的要求。derive 只使用现有配置，不会自动读取来源记录或补署名，应先在 variants.json 的相关文案中写妥再生成。
