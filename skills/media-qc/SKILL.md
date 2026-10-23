---
name: media-qc
description: 对粗样片或成片做媒体技术检查，并记录绑定实际视频版本、带时间码的视听审稿观察与局部返修建议。适用于制作中和交付前审查；工具不自动看片听音，技术通过不代替人工接受。
metadata:
  category: 3. 成片审查
---

# 成片审查

运行 `node skills/media-qc/scripts/check.mjs --project <项目> --video render/video.mp4`。依赖 FFmpeg/ffprobe，不需要 npm 包；可选 `--srt captions.srt`、`--require-audio`、`--allow-preview`。输出项目 `qa/media-report.json` 和抽帧图。

项目可提供 `qc.json`，设置 width/height/fps/duration、字幕阅读速度、响度范围和真峰值上限。这些是项目交付参数，不声称是所有平台的统一标准。

检查容器/编码/帧率/时长、完整解码、全黑片、静止区间、字幕顺序/越界/阅读速度和音频响度。读取同名渲染报告时拒绝把部分渲染当全片，报告 DOM 溢出。静止镜头和短黑场先标记人工检查，不单凭像素判定叙事质量。

机器报告为 technical-pass-needs-human-review 或 failed。人工必须看：手机尺寸可读性、画面主体与事实一致、进出镜节奏、旁白同步、音乐是否盖人声、封面及平台控件遮挡。记录看片者和结论；没有人工记录就保留 pending。

产品演示额外对照导演的[演示安排](../content-director/references/product-demo.md)，看起点、关键操作与对应结果是否真实连续，鼠标/圈注是否指向当时对象。系列内容按[系列一致性](../content-director/references/series-continuity.md)对照本期与实际系列样例，检查字幕、封面及声音；这两项属于实际观察，现有技术检查不会自动判断。

只对已知制作输入做修复；字幕识别问题交 auto-subtitle，画面设计交 content-director，来源问题回事实材料核查。不要为了绿色报告放宽目标或自动填入人工通过。

实际看片/听音后按[视听审稿与返修](references/editorial-review.md)记录观察：`node scripts/studio.mjs inspect --project <项目>`。技术报告附 videoSha256，审稿需绑定实际已查看版本；只记录已查看的区间，未听音就标未审听。再次使用结果用 inspect --verify 校验媒体版本，改片后受影响部分需重审。这个工具负责记录和一致性检查，不生成审美判断或人类批准。
