# 每日 AI 2026-10-23

待审横版。1920×1080，原生 60fps，约 4 分 58 秒。声音是本机 Microsoft Huihui Desktop，不是已经接受的正式音色。没有上传。

## 成片

| 文件 | 说明 |
|---|---|
| `render/daily-ai-news-2026-10-23.mp4` | 17858 帧，`avg_frame_rate` 60/1，视频时长 297.633 秒，含 AAC |
| `render/cover.png` | 封面：M3.1 Flash 开放权重，MiniMax 官方组织标志 |
| `captions.srt` | 87 条。句级粗对齐，待校准，不是 ASR，也不是词级同步 |
| `qa/media-report.json` | 技术通过，人工待审。视频 SHA-256 `fab47ecd0193dae639188f5917f643fcc9d0638bda5a1abe9b5b9d27cd6ce899` |

技术报告标了静止区间。榜单和新闻页在口播结束后会停住，方便阅读，这是故意的。

抽帧看过成片 2.5 秒和质检接触表。第 20 帧和第 21 帧哈希不同。没有审听。

## 这一期讲什么

1. 综合智力 ECI 前 15。开源 `models.json` 生成于 2026-10-23 21:46（北京时间）。没有昨日榜，不标升降。
2. MiniMax M3.1 Flash 当天开放权重。
3. Recursive Flint，10 月 21 日。官方自测和笔记本速度分开说。
4. TypeScript 7.1 beta 与 tsrs，日期是 10 月 20 日。8 倍对照的是 7.0。

选题和淘汰原因在 `selection.md`。事实在 `storyboard.json`。

## 重跑

在仓库根目录：

```powershell
node scripts/studio.mjs run --project projects/daily-ai-news-2026-10-23 --step deps
node scripts/studio.mjs run --project projects/daily-ai-news-2026-10-23 --from brands
```

渲染脚本会把 TEMP 指到仓库 `.cache/daily-ai-news-render`。这台机器上，Remotion 自带的 ffmpeg 不能往用户 Temp 写文件，直接渲染会在最后封装时报权限错误。

字幕生成不按字数摊进音轨。每句先用同一只 Huihui 单独合成，再按这些时长的比例放进整页音轨。整页音轨仍是 `make_deck_audio.ps1` 的连续朗读，所以边界仍是粗对齐。
