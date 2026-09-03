# ddd-architecture — DDD 架构深度拆解与实战精要演示文稿

**交付物**：14 页 16:9 幻灯片（带 183 个原生入场动效 + 演讲者备注全量口播稿 + 矢量架构图 + `verify.py` 14 页零错误全通）。

| 文件 | 说明 |
|---|---|
| `ddd-architecture-deck.pptx` | 终稿演示文稿（183 个 COM 入场动画，自动放映 14 页） |
| `ddd-architecture-deck.pdf` | 高清矢量讲义（Office COM 导出） |
| `slides/slide-*.png` | 14 页逐页 120 DPI 渲染图（视觉核查证据库） |

## 对应脚本与入口

- 生成脚本：`scripts/gen-ddd-deck.py`（入库可复跑，严禁手改 pptx）
- 规范主题：`ddd_tech`（冷蓝系 7+1 封闭色板，WCAG 达标）
- 渲染核查：`python skills/ppt/templates/verify.py products/ddd-architecture/ddd-architecture-deck.pdf` (14/14 PASS)
