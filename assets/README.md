# assets/ — 资产库（跨项目可复用）

三层资产三个家，本目录管「知识资产」，登记全部家底：

| 分区 | 文件 | 是什么 |
|---|---|---|
| 成页方案库 | [`patterns.md`](patterns.md) | 已验证的成页方案（PAT 条目）：情景 → 版式 → 组件 → 参数 → 参考帧 |
| 组件登记簿 | [`component-catalog.md`](component-catalog.md) | scene-kit / fx 组件清单与用法（代码本体在 video-motion 模板内，此处登记） |
| 方案代表帧 | `patterns-frames/` | 每个 PAT 一张压缩帧（p01-p11 + cover，jpg ~150KB/张） |
| Lottie 资产 | `lottie/` | 免费商用 Lottie JSON（登记表与收录铁律见 [`lottie/README.md`](lottie/README.md)；项目用时复制进项目 public/lottie/） |
| 测试素材 | `media/`、`footage/footage.mp4` | GIF 等循环小动效测试素材；FootageOverlay 测试底材 |
| 品牌素材 | `lekao-screens/`、`pipeline.svg` | 截图与品牌图形 |

## 资产回流铁律（每个项目验收全绿后必做）

1. **组件回流**：项目施工中改进/新造的 scene-kit 组件与 tokens，回写 `skills/video-motion/templates/remotion-app/src/scene-kit/`（下个项目复制模板即受益；不回流 = 家底分叉不增长）
2. **方案登记**：本项目验证过的新成页方案，在 `patterns.md` 登记一条 PAT（或给已有 PAT 补「复用记录」）
3. **教训入账**：`docs/workorder-log.md` 台账整理一节

复用闭环 = 开工复制模板（带出）→ 查 PAT 套方案（复用）→ 验收回流（增值）。
