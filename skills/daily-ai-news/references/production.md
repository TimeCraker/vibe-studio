# 新建、接手与续跑

此文是模型无关的操作入口。命令从仓库根运行，PowerShell 路径带空格时加引号。不需要旧聊天记录；内容判断、素材取舍和审片仍由执行本技能的 Agent 完成。共用工具不负责凭空生成事实。

## 先确定工程与真实状态

```powershell
node skills/daily-ai-news/scripts/edition.mjs status
node skills/daily-ai-news/scripts/edition.mjs status --project projects/daily-ai-news-YYYY-MM-DD
```

无参数只列工程，不擅自选最近日期。以本次请求的日期/录音所属期为准，读取输出中的 `read` 文件、`next`、发布和归档记录。`edition.json` 保留本期元信息；`timeline.json` 是实际秒/帧/字幕正本；README 补充人工结论和工作交接。旧期 README 中的早期阶段记录不能推翻后面的交接及当前文件证据。

| 状态 | 应做的事 |
|---|---|
| research-and-script | 先独立检索，再读文档，筛选核查，更新两套 TOP15 并写稿 |
| no-video | 正常结束，保留检索与淘汰依据，无需空视频/配音/投稿 |
| research-blocked | 说明来源/核查受阻，不能说今日无值得报道的新闻 |
| waiting-human-recording | 贴出完整口播稿，准备素材，等待用户自然朗读的录音 |
| align-recording / build-inputs | 保存原件、词级 ASR、核对用词/事实、按锚点排镜头 |
| produce / check-or-repair | 按 job 的具体步骤继续；修复变动影响的部分，勿覆盖他人文件 |
| review-and-submission | 核对真实成片/素材；按授权投稿，保留人工点击与结果证据 |

不要从头盲跑已有工程的 job：旧脚本可能重建输入，覆盖已改版式或片段。先读 `job.json`，用 `node scripts/studio.mjs run --project <目录> --step <ID>`；确定后续步骤都适用才用 `--from <ID>`。`studio status` 只反映 runner 日志，制作状态看上面的文件证据。不得为“通过”删除运行锁或改写人工接受状态。

## 新一期只建空输入

```powershell
node skills/daily-ai-news/scripts/edition.mjs init --date YYYY-MM-DD --source "本期文档URL"
```

已存在工程会拒绝初始化。省略日期使用本机北京时间；与客户端日期不一致时明确传客户端日期。生成空的内容/榜单/录音审阅配置、锁定依赖清单、可复用纸白珊瑚版式与 job；不会复制旧新闻、人声或分数。没有文档时可省略 `--source`。

先填下列文件；它们是本期数据，不写进技能默认值：

| 文件 | 最小信息 |
|---|---|
| selection.json | `decision: produce / no-video / blocked`；`independentSearch` 与 `documentSupplement` 分开，`selected`、`rejected`、`notes` 解释取舍。检索记录包含 URL、查阅时间、候选和主要理由 |
| claims.json | 数组：`id, text, status: verified, source: {url 或 path, locator, checkedAt}`；榜单使用 `id: ranking`，其余按实际事实命名 |
| ranking.json | `editionDate, queriedAt, sourceGeneratedAt, entryUrl` 和 `global/domestic` 各 15 条：`id, name, eci, icon`。icon 是 assets 下文件或文件名；保存原始快照/页面证据，不编分、合并版本或沿用旧榜 |
| narration.md | `## 朗读正文` 至 `## 录音说明` 之间为可照读正文；英文全名、发音提示、分镜备注放正文外 |
| assets/sources.json | 素材数组：`file, url 或 sourcePage, sha256, rights, selection`；附查阅/取得状态、视频技术属性及适用判断。找入口、取得文件、实际入片分开 |
| content.json | 封面、资讯总览、逐镜头文字/素材、字体与 BGM，见下文 |

```powershell
node skills/daily-ai-news/scripts/edition.mjs check --project <目录> --phase script
```

通过后把全文贴给用户并保留 narration.md；等待真人录音。新工程的流程不包含测试配音默认项。等待时可备齐官标、图片、视频、字体和音乐，不先导出估时整片。

## 内容数据与版式

`content.json` 字段：

```json
{
  "headline": {"title": "发布方＋具体变化", "subtitle": "正文能兑现的补充", "logo": "assets/official-logo.svg", "source": "准确的来源/必要限定"},
  "stories": [{"title": "谁发布或更新了什么", "detail": "具体变化或用途"}],
  "scenes": [
    {"id": "overview", "title": "今日 AI 资讯", "section": "今日 AI 资讯", "source": "本期来源摘要", "anchor": "各位观众们", "claimIds": []},
    {"id": "lead-update", "title": "主体＋具体结论", "section": "模型头条", "source": "官方材料；是否为实测", "anchor": "实际录音里本段开头的唯一短句", "claimIds": ["本期事实id"], "lead": "观众应理解的变化", "bullets": ["具体要点"], "media": {"kind": "image", "file": "assets/official.png", "label": "官方配图与必要说明"}}
  ],
  "fonts": {"sans": "assets/fonts/sans.ttf", "mono": "assets/fonts/mono.ttf"},
  "music": {"file": "assets/bgm.mp3", "credit": "音乐作者、原始链接、许可和署名"}
}
```

示例是字段说明，不是可照搬的新闻。`stories` 随内容组织主次；太多时拆总览镜头并延续口播，不缩成密密麻麻的清单。`scenes` 是实际口播镜头，可一条新闻多个镜头，数量不限；第一项 overview。每项 `anchor` 在 ASR 核对后填录音实际用词，不按旧稿猜时间。开场两榜由工具自动加入，不放在 scenes 中。主标题要明确主体，正文每页只承担这段解说；通用版式是起点，必要时在本期 src 扩展图解/比较页并实际渲染，不能所有新闻只换字。

视频素材：`media.kind: video`，同样填写 file/label，再加 `sourceIn` / `sourceOut`（原片秒数，保持原速）。片段不足以覆盖该镜头时指定相关 `poster` 图片承接后续；否则缩短或拆镜头，不能默默拉慢视频或用无关宣传片填充。对齐命令生成 `media-plan.json.shots[].videoClips`；渲染报告记录真实采用范围，检查器核对画面接线与来源。下载后先用 ffprobe/解码及关键帧确认内容，找不到时换官方渠道再评估替代，不能只说“有视频链接”。

将实际可用且允许用于本地成片的字体存入本期 assets/fonts 并记来源；可复用已验证工程的本地字体文件，不能只依赖旧 public 或远程字体。中文字体必须覆盖实际稿件。官标、音乐、图片、视频按本期使用条件保存，不提交账号状态或大媒体。

## 录音到制作输入

本节共用命令适用于 `edition.mjs init` 建立的工程。接手已有旧工程时保留其录音/采用稿，读取该工程 job.json 的 recording-review / inputs 步骤；旧工程没有 recording.json / content.json 时不要直接套本节覆盖原输入。

```powershell
node skills/daily-ai-news/scripts/edition.mjs recording --project <目录> --file "用户录音绝对路径"
node skills/daily-ai-news/scripts/edition.mjs transcribe --project <目录>
```

第一条保存带哈希的原件和当时稿件快照，生成 48k PCM 与 16k ASR 副本。以解码 PCM 为时钟，不改原件、不加速。重复导入同一录音保留原件；新录音生成新文件并使旧对齐失效。第二条使用仓库外 `~/.cache/vibe-studio/asr-venv`，没有时按 auto-subtitle 技能安装固定 requirements；可用 `--python <EXE>` / `--model <本地模型目录或名称>`，不买服务/创建密钥。它输出 `audio/asr/raw-words.json` 与原始转写，原声和 ASR 输入哈希必须吻合。

读原转写、原稿和实际变化，核对模型名、数字、日期、归属及额外口语。填 `audio/alignment.json`：

```json
{"review":{"status":"reviewed","reviewer":"本次实际核对的Agent标识","notes":"核对的名词/数字和事实差异；人工审听范围另记"},"corrections":[{"old":"ASR错字","new":"实际读音对应文字","reason":"具体校订依据"}],"sourceIn":null,"sourceOut":null}
```

无错字用空 corrections；不为了贴稿删用户补充评论。事实性读错先核清受影响句子，不伪造音轨。sourceIn/Out 可留 null 按首尾真实词窗保留小余量，只裁首尾空白；低相似度时需在 `actualChangesExplained` 说明录音实际增删与事实核查。将各镜头 anchor 更新为实际转写里的连续原词；第一镜头覆盖问候语。

```powershell
node skills/daily-ai-news/scripts/edition.mjs align --project <目录>
node skills/daily-ai-news/scripts/edition.mjs check --project <目录> --phase render
```

生成实际采用稿 narration-recorded.md、词级字幕、时间线、分镜和混音配置。原 narration.md 不覆盖；不按字数分摊时间。镜头锚点缺失、词窗重叠、闪现字幕或来源哈希变化就先修正，不伪造 PASS。正文镜头切换跟语义走，榜单各页默认 7 秒只放音乐，可按实际阅读调整 edition.rankingSeconds。

## 制作、检查与续跑

以下共用 render 适用于 init 工程及其 content.json / compositionId。已有旧工程继续用本期 job.json 声明的 render 脚本；不要为适配入口重建现成场景或补一份伪造 content.json。

```powershell
node skills/daily-ai-news/scripts/edition.mjs deps --project <目录>
node scripts/studio.mjs run --project <目录> --step voice
node scripts/studio.mjs run --project <目录> --step audio
node skills/daily-ai-news/scripts/edition.mjs render --project <目录> --mode stills
node skills/daily-ai-news/scripts/edition.mjs render --project <目录> --mode sample --range 起始秒,结束秒
node skills/daily-ai-news/scripts/edition.mjs render --project <目录> --mode video
node scripts/studio.mjs run --project <目录> --step qc
node skills/daily-ai-news/scripts/edition.mjs check --project <目录> --phase delivery
```

deps 按 lock 安装，不升级；本机已有完全同版依赖时可 `--runtime <已有remotion-app目录>`，只在新工程没有 node_modules 时建链接，并验证实际版本。正文/封面可继续在本期代码扩展。渲染前固定输入、官标、字体和媒体，渲染过程不抓远程资源；结束校验输入未变化。edition 的 status/production 只记交接和人工状态，不参与画面；更新它们无需重渲染，内容、榜单和媒体变化则必须重检。sample 是标明范围的局部片段，不能冒充整片。输出 `render/daily-ai-news-日期.mp4`，原生 1080p60；原始演示为 24/30fps 时保持原速，不声称素材本身也是 60fps。

先看代表帧/短片，检查手机缩图、标题/字幕安全区、素材对应与真实播放；必要时局部返修，再完整出片。media-qc 的技术通过与 Agent 实际观察范围、用户连续观看/审听接受分开记录。交付可播放文件与绝对路径，不只给 Studio 或素材预览网页。

## 投稿和归档

按 publish 技能写本期 `variants.json`（已有 schema 见该技能）。同一完整视频三端可复用 16:9；各平台 title/description/limits/cover 独立，sceneIds 与实际时间线相同，format 使用 1920×1080 / 60fps。缩短或竖排的版本要另行制作、对齐和 QC，不能直接复用全片字幕。

```powershell
node skills/daily-ai-news/scripts/edition.mjs publish-materials --project <目录>
node skills/publish/templates/run.mjs --project <目录> --dry
```

物料命令保留实际词窗字幕，不使用 derive 的估时字幕；默认不向抖音/小红书塞话题。核对三平台标题限制、来源署名和 AI 声明；B 站双比例、抖音横/竖封面、小红书 3:4 在真实 UI 看裁切。封面路径存在不代表已应用。

用户审阅并要求发布后，按 publish/references/submission.md 启动对应可见登录窗口；用户登录后逐平台运行 `run.mjs --only bili|douyin|xhs --project <目录>`。已打开其他视频/草稿时保留现场，核对文件身份后续跑，不盲目重传。话题找不到精确项就移除并完整回读正文；声明必须实际选中再确认，失败不能写已完成。控件变更用该平台 --probe / inspect / eval 查真实 DOM，修正受影响步，禁止用最终发布按钮验证。填表与平台提交分开；有用户反馈才记 user-reported，有结果链接/平台回执才能记 verified。

实际输出列入 deliverables.json 后：

```powershell
node skills/daily-ai-news/scripts/edition.mjs archive --project <目录> --destination "新的备份目录及版本号"
```

只用未占用目录；保全 recipe、真实输入、成片/封面/字幕、来源与必要检查结果，验证归档并在空目录恢复。共用生产脚本属于本仓库，恢复制作需要本仓库及锁定依赖；归档不等于打包了完整软件环境。命令不清场、不宣称恢复后已重渲染。账号 profile、登录页面截图和 cookie 不进归档。

## 已有工程参考

[2026-10-27 工程](../../../projects/daily-ai-news-2026-10-27/README.md)提供真人词窗对齐、官方演示和三平台物料的实际例子。它的旧脚本包含当期文章/锚点，不得复制到新日期当作今日内容；接手本期则沿用其 job 和实际输入，先执行 status/check。跨会话接手验证、通用版式实际渲染、真实账号填表与下一期编辑质量是不同验收范围，按实际结果说明。
