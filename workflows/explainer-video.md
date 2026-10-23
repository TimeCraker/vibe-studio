# 项目视频总装流程

本文件只排步骤；工艺、数据契约和检查归对应 skill。产品入口见 docs/product-map.md。

## 共用前段

1. 定受众、目标行为、片长、画幅与交付清单。content-director 写 brief 和 storyboard，事实逐条留来源。
2. narration 出口播，humanizer 保持事实不变地打磨表达。按字数估预算，以实际配音时长和词级对齐为准。
3. 定镜头与美术：真实操作/截图优先；结构图用 SVG；插画需要时用可用的 imagegen 工具，登记至 assets/art。
4. 先做代表画面与短样片，检查主体、信息、运动作用和手机阅读；保留人工审阅记录，再投入全片。

## 选制作线

| 线 | 画面来源 | 使用场景 | 工具 |
|---|---|---|---|
| A | 剪映剪辑已有素材 | 快速单片或人工调整多 | narration、humanizer、剪映 |
| B | Remotion 组件直绘 | 品牌介绍、数据与功能演示 | video-motion 的 DeckVideoV2 / CoverV3 |
| C | 已有网页/代码动画 | 保留原程序画面 | web-capture 的状态重放或显式 seek |

画面来源决定引擎，交付要求决定投入。渲染器、数据和技能正本保持分离，不把项目素材塞进模板。

## B 线

1. `studio init --id <名称> --line b` 复制工程；`studio run --step deps` 安装锁定依赖。
2. 按 storyboard 与版式库写项目 deck-scenes；用既有 tokens、组件与真实素材。画幅从策划开始确定。
3. 先预览代表镜头；SAPI 只可作为明确标注的占位音频。正式配音人工在剪映完成。
4. build-deck-params 从稿和实际音轨派生时间轴，生成物不手改；必要时用 auto-subtitle 对齐词级时间。
5. 把本项目 params/render 命令、输入、输出和超时加入 job.json；类型检查后渲染。素材缺失时失败，不用空壳画面冒充成片。
6. media-qc 做技术报告，实际抽帧和听音；人工确认设计与音画同步，必要组件回流模板。

## C 线

1. `studio init --id <名称> --line c` 带出完整采集/导演页样例；先用样例跑通当前机器。
2. probe-ui/probe-anchors 探真实页面，替换源网页、镜头表与 storyboard；量锚与采集使用同一视口。
3. 默认 replay 分块从零预跑；显式纯函数 seek 页面可直接定位。CSS、媒体、Worker 等另行适配，不在通用确定性保证内。
4. 在 edit/timeline 定取景、字幕与节奏；video.json 管画幅和帧率，sections.json 管配乐段落。
5. `studio run` 执行声明的采集、短样片、全片、封面与技术质检；输入/输出变化失效缓存。失败看 .studio 日志，从失败步骤重跑。
6. 配乐可用 scripts/make_music.py，再用 render-director 的 --audio 合入。最终音量和风格仍需听审。

## 平台交付与回流

1. content-repurpose 根据同一事实底稿选择各平台镜头、标题与字幕，配置画幅、安全区和封面；派生结果仍是待审版本。
2. C 线按 --variant 渲染；B 线按 render-spec 重新排版场景。每版单独做 media-qc 和手机尺寸检查。
3. publish --dry 只做离线预检。真实填表需用户已登录，输出 filled-needs-human-check；用户核对视频、封面、分区、话题和声明后亲自点发布。
4. 组件/版式经验回流 skills/assets，教训追加 docs/workorder-log.md。
5. deliverables.json 列出所有正式成品；studio archive 保存配方、原始输入和成品，verify-archive 校验后试恢复。媒体单独备份，完成后再清理施工现场。草稿源码备份不等于交付。
6. 发布后把真实数据和来源录入 metrics.json，content-review 计算系列指标。无数据就保留空表，不产生效果结论。

技术检查、视觉审阅、人工接受、投稿填表、实际发布是分别记录的状态；任一阶段不能代替其他阶段的证据。
