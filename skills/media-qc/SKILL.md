---
name: media-qc
description: 对完成的视频或短样片做技术质检、字幕时间检查、响度测量和抽帧取证。适用于渲染后核查与交付前验收；技术检查不代替人工看片、听音或品牌视觉终审。
---

# 媒体质检

运行 `node skills/media-qc/scripts/check.mjs --project <项目> --video render/video.mp4`。依赖 FFmpeg/ffprobe，不需要 npm 包；可选 `--srt captions.srt`、`--require-audio`、`--allow-preview`。输出项目 `qa/media-report.json` 和抽帧图。

项目可提供 `qc.json`，设置 width/height/fps/duration、字幕阅读速度、响度范围和真峰值上限。这些是项目交付参数，不声称是所有平台的统一标准。

检查容器/编码/帧率/时长、完整解码、全黑片、静止区间、字幕顺序/越界/阅读速度和音频响度。读取同名渲染报告时拒绝把部分渲染当全片，报告 DOM 溢出。静止镜头和短黑场先标记人工检查，不单凭像素判定叙事质量。

机器报告为 technical-pass-needs-human-review 或 failed。人工必须看：手机尺寸可读性、画面主体与事实一致、进出镜节奏、旁白同步、音乐是否盖人声、封面及平台控件遮挡。记录看片者和结论；没有人工记录就保留 pending。

只对已知制作输入做修复；字幕识别问题交 auto-subtitle，画面设计交 content-director，来源问题回事实材料核查。不要为了绿色报告放宽目标或自动填入人工通过。
