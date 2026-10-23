---
name: content-review
description: 用真实发布数据和制作成本复盘内容表现，支持同平台同观察窗口的系列对照。适用于内容复盘、完播/点击/转粉与制作效率分析；不抓取账号凭证、不代发内容、不编造缺失数据。
metadata:
  category: 4. 交付与运营
---

# 内容复盘

把平台导出或人工核对的数字填入 metrics.json。每行记录 contentId/platform/publishedAt/observedAt、videoSeconds、metrics、production（minutes/revisions）和 source；示例见 `templates/metrics.example.json`。保留原始导出或截图来源路径、口径与观察窗口。

运行 `node skills/content-review/scripts/report.mjs --project <项目>`，输出 `review/summary.json` 和 `review/review.md`。工具计算有分子/分母的点击率、完播率、千次观看转粉、平均观看时长及每分钟制作成本对应的观看量；缺失项保留 null，分母为零不强行给百分比。

先按平台、系列和观察窗口对照，再检查钩子、镜头、标题与封面的变化。播放量不等于收益，单条内容的结果也不足以证明因果。给出下一条可验证的改动及保持不变的条件，不把不同平台的播放定义直接混为一张排名。

未发布或没有真实数据时只准备空表和采集说明；不为了完成流程生成数据。数据整理与内容制作分开，原始作品与制作配方保持不变。

归档后可在作品的 operations 目录继续复盘，命令的 --project 指向该目录；metrics.json 的 source.path 相对此目录，所指原始数据必须实际存在。保存位置、脱敏/备份和作品状态入口见[文档维护约定](../../docs/documentation.md#作品状态记录)。无需为补统计改动 recipe 或重建整套制作工程。
