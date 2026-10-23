---
name: content-director
description: 为产品介绍、科技讲解和内容视频做受众定位、参考分析、事实核查、视觉能力选路、分镜与粗样片迭代。按镜头需要调度设计、生图、技术可视化及专项素材；已有定稿的采集和渲染交给对应制作技能。
metadata:
  category: 1. 策划与文案
---

# 内容导演

开始新片型或当前画面/节奏不理想时，读取[参考分析与审稿方法](references/quality-loop.md)，把实际观察补进已有 brief.md。先提炼适合本片的方法，确定代表画面与声音节奏，再批量制作；不要求每次重新写一套策划文档。

需要设计、生图、技术可视化、Lottie、3D 或地图/Studio 专项时，按[视觉能力选路](references/visual-routing.md)选择实际可用的工具和制作分支。共享技能只按需读取；本片品牌和视频帧驱动约束优先，不复制技能、不强制使用所有效果。

先明确受众、核心承诺、目标行为和发布画幅。把可核实的说法写进 `storyboard.json` 的 claims；记录原始文档/网址、定位和核查日期，不把估计写成已核实。

逐镜说明这段要解释什么、主体是什么、旁白与画面的关系、为何需要运动。数据镜头强调关系，演示镜头展示真实操作，故事镜头允许留白；不要求每镜填满信息或持续运动。默认品牌风格可沿用当前 tokens，但不替内容决定构图。

项目契约示例由 `node scripts/studio.mjs init --id <名称> --line c` 生成。字段：schemaVersion、audience、goal、profile、claims[]、scenes[]、review。profile 为 demo/product/data/story/tutorial；scene 声明 id/start/end/title/purpose/subject/claimIds，图片另给 asset.brief。已有项目可直接按这些字段补稿。

运行 `node skills/content-director/scripts/validate-plan.mjs <项目>` 查事实引用、片段区间与输入。`--require-reviewed` 只用于交付前核对已有人工审阅记录；校验器不会代替人批准分镜。

校验器能检查来源和字段，不能替代阅读来源或核实说法；外部事实、数字与版本仍按实际材料核查，未确认的 claims 保留 needs-check，不为通过校验而填 verified。

按[制作流程](../../workflows/explainer-video.md)选择制作线，再按风险用代表帧或短样片验证镜头；已有定稿可复用，小改只回到受影响阶段，不固定样片时长或重复要求确认。画面主体优先真实截图/录像或合适的 SVG；需要插画时使用当前环境可用的 imagegen 工具，并按 [美术简报](references/art-brief.md) 提供构图。生图工具不可用时交付简报，不声称已经生成图片。项目专用素材先留在项目，确认可复用后才回流共用库。

需要先判断全片叙事与节奏时，按[动态分镜说明](references/animatic.md)将参考图和临时音轨拼成可播放粗样片：`node scripts/studio.mjs animatic --project <项目>`。先看完整时间结构，再精修画面；已有成熟制作方案时按需跳过，不把预览当正式成片。

画面设计与口播可以迭代，narration 校验口播；PPT、Remotion 场景或网页采集由对应 skill 实现。人工结论按[状态约定](../../docs/documentation.md#作品状态记录)记录，不把技术通过自动标成审美通过；无人审阅时可交待审稿，不能代填人工接受。
