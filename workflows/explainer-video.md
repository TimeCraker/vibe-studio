# 项目视频制作流程

适用于产品介绍、科技解说、录像讲解和网页动画成片。先看[产品图](../docs/product-map.md)选择交付物；单独制作 PPT 或封面时直接进入对应 skill。

本文件负责阶段顺序、交接和完成条件；具体工艺在各 skill，文件与状态的正本见[文档维护约定](../docs/documentation.md)。

## 1. 怎么使用：默认路径，按任务裁剪

```text
明确交付 → 选制作线 → 准备稿件与素材 → 代表画面/短样片
        → 正式制作 → 平台版本与验收 → 投稿 → 归档与后续复盘
```

- 已有定稿、素材或审阅结论，直接复用并注明来源；小改动只回到受影响的阶段，不从头重做。
- 简单片可用代表帧、关键片段验证；新风格、复杂镜头、长片优先做短样片。没有固定样片时长或审核轮数。
- A/B/C 可组合：例如 C 线采集真实页面，B 线制作片头，最后在剪映配音剪辑。选择主要制作线，在项目说明中记下组合方式即可。
- 同平台无需改编时复用已验收版本，不为凑齐三平台而强行制作；未公开发布的交付也可以归档。
- 沿用已有授权推进工作，不为同一范围反复确认。无人审阅时可以继续制作待审稿，但不能记录成人工接受或正式发布。

事实来源、素材可用性、最终文件清单和真实状态仍需保留；是否制作某阶段，不能代替对其结果的证据。

## 2. 选制作线并初始化

| 线 | 适合什么 | 初始化带来什么 | 主要工艺 |
|---|---|---|---|
| A：剪映 | 已有录像/截图，人工调整多、快速单片 | 策划与任务契约；剪辑工程另建 | [narration](../skills/narration/SKILL.md)、[humanizer](../skills/humanizer/SKILL.md)、剪映 |
| B：Remotion | 品牌场景、数据、可复用图形动画 | Remotion 模板、依赖安装与类型检查任务；场景/渲染任务由项目补齐 | [video-motion](../skills/video-motion/SKILL.md) |
| C：网页采集 | 已有网页、HTML/SVG 或代码动画 | 可运行采集、短样片、全片、封面、QC 样例；内容需替换 | [web-capture](../skills/web-capture/SKILL.md) |

已有录像只需叠标注时可用 `--line footage` 初始化 Remotion 的 FootageOverlay 工程。PPT 使用 `--line ppt` 与 [ppt](../skills/ppt/SKILL.md)，不必套视频全流程。

以下命令均在仓库根目录的 PowerShell 执行。`demo-video` 是示例 id；同一项目只初始化一次，替换 `--line` 选择制作线。

```powershell
Set-Location 'C:\Users\TimeCraker\Desktop\my_workspace\vibe-studio'
$workProject = 'projects/demo-video'
node scripts/studio.mjs doctor --line c
node scripts/studio.mjs init --id demo-video --line c
```

环境与技能安装见 [README](../README.md#开始使用)。新建项目后替换默认 demo 简报、分镜、平台文案和交付配置；初始化成功不代表内容已完成。

## 3. 共用准备：稿件、分镜与素材

| 阶段 | 输入与执行者 | 应留下什么 | 交接依据 |
|---|---|---|---|
| 定目标与事实 | 用户目标、项目材料；content-director 辅助 | brief.md、storyboard.json 中的事实与来源 | 受众、核心承诺、片长、画幅、交付范围清楚 |
| 口播与镜头 | 已有稿或 narration 起稿，humanizer 润色 | 口播稿、逐镜说明、实际音轨（有配音时） | 事实不变；旁白、画面和时长相容 |
| 素材准备 | 截图、录像、SVG、插画、音频 | 项目内原始输入、来源与用途记录 | 必要素材可读取，缺项明确，临时占位已标注 |
| 样片验证 | 选定制作线、代表镜头 | 代表帧/短样片、审阅结论或待审项 | 能判断构图、阅读、节奏和主要技术风险 |

策划由 [content-director](../skills/content-director/SKILL.md) 指导；真实界面优先使用截图/录像，结构图可用 SVG。需要插画时按美术简报调用当前可用的 imagegen 工具；工具不可用就保留简报与缺项，不声称已生成素材。

项目专用素材先保存在项目中，Remotion 消费的文件放 `remotion-app/public/` 对应目录；有跨项目价值时再按[资产库约定](../assets/README.md)回流。使用共用资产也要把实际使用版本带入项目，不能只依赖库里同名文件。

时间安排先按稿件估算，再以实际配音调整；[auto-subtitle](../skills/auto-subtitle/SKILL.md) 用于转写与词级对齐。正式配音保留人工环节；占位音频要标记，不能当作正式交付。

```powershell
node scripts/studio.mjs validate --project $workProject
# 已有明确的人工分镜接受记录时，可用此命令检查记录是否齐备
node scripts/studio.mjs validate --project $workProject --require-reviewed
```

`--require-reviewed` 读取 storyboard.json 的 review.status，不会请求或生成批准，也不代表成片已经审阅。人工结论与证据的记录位置见[状态约定](../docs/documentation.md#作品状态记录)。

## 4. 按制作线完成样片与全片

### A：剪映剪辑

1. 将原始录像、截图、正式配音和字幕整理到项目目录，再导入剪映；先确定主要画幅，保留剪辑工程及素材对应关系。
2. 按口播与分镜粗剪，检查关键片段；需要图形场景时可接 B 线，需要网页画面时可接 C 线。
3. 调整字幕、配乐与节奏；导出样片或全片到项目 `render/`。剪辑工程路径、编辑器版本与外部依赖写在项目 README 中。
4. 用 media-qc 检查导出文件，人工看画面、听声音。将最终视频、封面、字幕和质检证据加入 deliverables.json。

A 线初始化没有自动控制剪映或导出成片的任务。可把已确认可复用的脚本加入 job.json，人工编辑仍记录实际进展。保存编辑器工程不等于已备齐其引用的原始素材。

### B：Remotion 场景

1. 初始化时选 `--line b`（录像叠加选 footage），执行依赖安装：

   ```powershell
   node scripts/studio.mjs run --project $workProject --step deps
   ```

2. 按分镜写项目场景，参考版式与现有组件。新介绍片默认 DeckVideoV2，封面参考 CoverV3；先渲染代表镜头，避免直接投入全片。
3. 正式配音就绪后，按 video-motion 的 build-deck-params 工具从稿件与实际音轨生成参数；生成物不手改，需调整时改上游稿件/配置再生成。
4. 将本项目参数生成与渲染命令、输入、输出、超时加入 job.json。先做类型检查，再执行实际渲染；初始化只带 deps/typecheck，不预置业务成片。
5. 按项目内容检查镜头、字幕和音画同步。需要时将通用组件改进回流模板；项目专用内容留在项目里。

### C：网页/代码动画采集

1. 初始化时选 `--line c`。先确认样例在当前机器可运行，再替换 `capture/` 下源网页、镜头表和 storyboard.json；量锚与采集使用相同视口，适配细节见 web-capture。
2. 在 `edit/timeline.js` 调整取景、字幕和节奏；`edit/video.json` 管画幅/帧率，`edit/sections.json` 管配乐段落。分镜变化时同步时间轴，二者不是自动双向同步。
3. 正式内容建议分段运行，在样片后留出观察或修改的机会：

   ```powershell
   node scripts/studio.mjs run --project $workProject --step capture
   node scripts/studio.mjs run --project $workProject --step preview
   # 查看样片并记录结论；需要修改就改源文件后重跑相关步骤
   node scripts/studio.mjs run --project $workProject --from render
   ```

4. 验证样例，或已有充分审阅且适合连续运行时，可直接 `node scripts/studio.mjs run --project $workProject`。它会连续执行全片，不会自动等待人工批准。`--step` 不会补跑前置步骤，`--from` 执行该步及后续步骤。
5. 配乐可按需使用 make_music.py，音频合入方式见 web-capture；将实际音轨与渲染参数纳入 job.json 的输入/命令后再交付。默认样例成功不证明正式配音、配乐已加入。

C 线默认通过状态重放保证支持范围内的采集一致性；显式 seek、CSS/媒体/Worker 等限制见 skill。失败时看项目 `.studio/logs/`，按输入依赖重跑受影响步骤；缓存命中不能代替审阅。

## 5. 平台版本与成片验收

先确认需要投哪些平台、是否需要不同镜头/画幅。使用 [content-repurpose](../skills/content-repurpose/SKILL.md) 时，按真实内容修改 variants.json 后再派生；它可能覆盖生成的投稿计划，手动改动应先回到上游配置。

```powershell
node scripts/studio.mjs derive --project $workProject
# C 线示例；B 线按派生 render-spec 重新排版，A 线在剪辑工程中适配
node skills/web-capture/templates/render-director.mjs --project $workProject --variant douyin --out render/douyin.mp4
node scripts/studio.mjs qc --project $workProject --video render/douyin.mp4 --config exports/douyin/qc.json --srt exports/douyin/captions.srt --out qa/douyin-report.json
```

每个实际交付版本分别看视频规格、字幕、安全区、画面和声音；需要声音的版本在 QC 命令加 `--require-audio`。技术报告解释见 [media-qc](../skills/media-qc/SKILL.md)，美术与阅读判断见[质量规范](../docs/2026-08-30-motion-grammar.md)。无字幕或音频的作品按实际内容选择检查，不强行补造。

人工结论记录检查对象/版本与证据，改动画面或音轨后重新检查受影响内容。机器报告通过、人工待审、人工接受分别保留；待审稿可以交付预览，不能描述为已接受的成片。

## 6. 投稿与发布记录

按 [publish](../skills/publish/SKILL.md) 准备真实视频、封面与平台文案，先执行离线预检：

```powershell
node skills/publish/templates/run.mjs --project $workProject --dry
```

真实填表依照已有投稿授权执行，用户自行登录；脚本完成上传/填表后仍需用户核对视频、封面、分区、话题和声明，并亲自点击发布。`filled-needs-human-check` 只表示填表阶段；封面等 manualPending 项需实际处理，不能写成已应用。

发布后把平台链接、实际时间与可核实状态记入作品 README。没有点击发布或没有结果证据，就保留待发布/未知；不要求每个交付作品都公开发布。

## 7. 归档、清场与后续复盘

deliverables.json 明确列出所有最终文件与质检证据，不能只写横版而漏掉竖版。先归档、校验完整性，再向另一个空目录试恢复；大媒体另做备份，确认可取回后才清理施工区。

```powershell
node scripts/studio.mjs archive --project $workProject
node scripts/studio.mjs verify-archive --archive products/demo-video/archive.json
node scripts/studio.mjs restore --archive products/demo-video/archive.json --project projects/demo-video-restore-check
```

源码草稿备份用 `archive --source-only`，不等于完整交付。已有归档不覆盖，修订版用新的 `--id`；试恢复成功证明文件可取回，重新渲染成功需要另行验证。上述命令不会自动清场。

制作配方与清单是固定快照；归档后可持续维护作品根 README 与 `operations/` 下的发布/复盘数据，位置和保存边界见[状态约定](../docs/documentation.md#作品状态记录)。不要直接改 recipe、已归档成品或清单内文件。

[content-review](../skills/content-review/SKILL.md) 读取真实 metrics.json 与原始统计来源；没有数据就保持空表，不生成效果结论。复盘可以晚于归档，制作区无需为等统计长期保留。确认可复用的素材/组件再回流资产库；只有产生可复用经验或实际缺陷时才追加工单台账。
