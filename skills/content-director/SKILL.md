---
name: content-director
description: 为产品介绍、科技讲解或内容视频做受众定位、事实取材、口播与镜头设计。适用于选题、写分镜、画面单薄或正式制作前的策划；已有定稿的采集和渲染交给对应制作 skill。
---

# 内容导演

先明确受众、核心承诺、目标行为和发布画幅。把可核实的说法写进 `storyboard.json` 的 claims；记录原始文档/网址、定位和核查日期，不把估计写成已核实。

逐镜说明这段要解释什么、主体是什么、旁白与画面的关系、为何需要运动。数据镜头强调关系，演示镜头展示真实操作，故事镜头允许留白；不要求每镜填满信息或持续运动。默认品牌风格可沿用当前 tokens，但不替内容决定构图。

项目契约示例由 `node scripts/studio.mjs init --id <名称> --line c` 生成。字段：schemaVersion、audience、goal、profile、claims[]、scenes[]、review。profile 为 demo/product/data/story/tutorial；scene 声明 id/start/end/title/purpose/subject/claimIds，图片另给 asset.brief。已有项目可直接按这些字段补稿。

运行 `node skills/content-director/scripts/validate-plan.mjs <项目>` 查事实引用、片段区间与输入。`--require-reviewed` 只用于交付前核对已有人工审阅记录；校验器不会代替人批准分镜。

按[制作流程](../../workflows/explainer-video.md)选择制作线，再按风险用代表帧或短样片验证镜头；已有定稿可复用，小改只回到受影响阶段，不固定样片时长或重复要求确认。画面主体优先真实截图/录像或合适的 SVG；需要插画时使用当前环境可用的 imagegen 工具，并按 [美术简报](references/art-brief.md) 提供构图。生图工具不可用时交付简报，不声称已经生成图片。项目专用素材先留在项目，确认可复用后才回流共用库。

画面设计与口播可以迭代，narration 校验口播；PPT、Remotion 场景或网页采集由对应 skill 实现。人工结论按[状态约定](../../docs/documentation.md#作品状态记录)记录，不把技术通过自动标成审美通过；无人审阅时可交待审稿，不能代填人工接受。
