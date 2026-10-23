# 实际视频的视听审稿与返修

先跑技术检查，再实际观看/审听能访问的片段。抽帧只覆盖静态构图和文字；节奏、运镜、转场和同步要播放连续片段，音乐和人声要听实际音轨。没有播放/听音能力就标未审，不以截图、波形或模型自述替代观看证据。

粗样片可优先查叙事和节奏，正式片再核对目标画幅与终混；没有固定审稿轮数。发现问题应能定位到时间码和源文件，修复后检查原问题与相邻衔接。改镜头顺序、长度或音轨时，还需重新确认全片叙事和同步。

## 记录观察，不自动批准

checkMedia 的报告提供 videoSha256；动态分镜的报告也带该值。针对实际检查的那版视频准备 qa/inspection-input.json：

```json
{
  "schemaVersion": 1,
  "video": "render/video.mp4",
  "videoSha256": "填实际已查看视频的SHA256",
  "reviewer": "实际检查者或Agent标识",
  "inspection": {
    "visual": [{ "start": 0, "end": 6 }],
    "audio": []
  },
  "checks": [
    { "kind": "visual", "status": "issue", "start": 1.2, "end": 2.1,
      "note": "结果面板尚未显示就切走，读不清结果",
      "fix": { "path": "edit/timeline.js", "suggestion": "延长结果停留，并相应调整后镜头" } },
    { "kind": "audio", "status": "unreviewed", "note": "当前未实际审听" }
  ]
}
```

时间区间必须位于真实视频内，且 pass/issue 不能超出声明的观看/听音范围。kind 可为 visual/audio/sync/story/facts，status 可为 pass/issue/unreviewed。事实判断另给 evidence 数组，指向项目中已阅读的来源文件；fix.path 指向实际存在的源文件。范围按实际已查看部分记录，不为填字段宣称看过全片。

运行 `node scripts/studio.mjs inspect --project <项目>` 生成 qa/editorial-review.json。该命令只校验并记录输入观察，不自动分析画面、听音或证明观察正确；整体状态始终为待人工审阅。缺项显式列为 unreviewedKinds，不自动补齐。

再次使用审稿结果先运行 `node scripts/studio.mjs inspect --project <项目> --verify qa/editorial-review.json`。视频哈希变化时返回 stale-review 和非零退出码，回到受影响内容重审。这个命令只比较媒体版本，不确认审美、事实或人工接受。

作品 README 链接技术报告与视听审稿报告；人工接受仍只记录实际已有的人类结论及其对象版本。归档时将有交付价值的报告列入 deliverables.json，正式交付只引用对应版本。
