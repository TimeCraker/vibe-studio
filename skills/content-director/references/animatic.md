# 可播放的动态分镜

用于正式精修前判断全片叙事、镜头顺序与配音节奏。直接读取已有 storyboard.json 的 scenes/start/end，不再维护第二套时长。

项目 animatic.json 示例：

```json
{
  "schemaVersion": 1,
  "width": 640,
  "height": 360,
  "fps": 24,
  "audio": "audio/temporary-voice.wav",
  "frames": { "intro": "art/intro.png", "demo": "art/demo.jpg" }
}
```

frames 的键为本项目真实 scene id，值为 PNG/JPEG/WebP。音轨可为临时配音、正式配音或粗混音；省略 audio 时只能判断画面和信息顺序，不能声称完成听音和口播节奏审查。工具不负责生成音轨。

执行 `node scripts/studio.mjs animatic --project <项目>`，默认输出 preview/animatic.mp4、同名 .json 和 .srt。画面带 ANIMATIC / NOT FINAL 标记，MP4 内含可开关的字幕轨，字幕来自 scene.caption 或 title；SRT 同时保留，字幕不是语音词级对齐结果。

新项目默认允许显式占位（allowPlaceholders:true），便于搭时间结构；替换实际参考图后关闭此选项检查缺图。占位在报告中逐镜标记，不当成完成的画面设计。短音轨补静音；长音轨默认拒绝，先调整分镜，确需截断才设 audioTrim:true。

时长按帧取整，报告保留原始时长与实际时长。源分镜、配置、参考图与音轨均记录哈希。粗样片 fullRender:false，即使覆盖完整时间轴也不能当成正式成片；技术检查须显式使用 --allow-preview。

先完整播放粗样片，再选择有问题或高风险的片段局部返修，按需要重复。将修改回写原分镜、口播或源素材后重渲染，不手改生成时间轴。加入 job.json 时声明配置、分镜、参考图、音轨为 inputs，三份输出为 outputs，不强制所有项目新增此步骤。
