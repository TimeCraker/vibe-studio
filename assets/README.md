# assets/ — 资产库（跨项目可复用）

三层资产三个家，本目录管「知识资产」，登记全部家底：

| 分区 | 文件 | 是什么 |
|---|---|---|
| 成页方案库 | [`patterns.md`](patterns.md) | 已验证的成页方案（PAT 条目）：情景 → 版式 → 组件 → 参数 → 参考帧 |
| 组件登记簿 | [`component-catalog.md`](component-catalog.md) | scene-kit / fx 组件清单与用法（代码本体在 video-motion 模板内，此处登记） |
| 方案代表帧 | `patterns-frames/` | 每个 PAT 一张压缩帧（p01-p11 + cover，jpg ~150KB/张） |
| Lottie 资产 | `lottie/` | 免费商用 Lottie JSON（登记表与收录铁律见 [`lottie/README.md`](lottie/README.md)；项目用时复制进项目 public/lottie/） |
| 美术资产 | `art/` | SVG 插画与 AI 出图，画面主体载体（登记表与收录铁律见 [`art/README.md`](art/README.md)；项目用时复制进项目 public/art/） |
| 测试素材 | `media/`、`footage/footage.mp4` | GIF 等循环小动效测试素材；FootageOverlay 测试底材 |
| 品牌素材 | `lekao-screens/`、`pipeline.svg` | 截图与品牌图形 |

## 项目专用与共用素材

项目专用截图、配音、插画、时间轴先放在项目目录，不因生成了一张图就加入共用库。使用本库资产时，把实际使用版本复制到项目，记录来源；归档依靠项目保存的输入，不依赖共用库未来保持原样。历史 lekao-screens 等素材沿用现有位置，新素材按此边界收录。

确认来源、使用条件和复用价值后，再将通用素材回流本库。项目特有文案、数据、品牌内容和临时修补不直接写回通用模板。

## 有复用价值时回流

1. **组件回流**：验证过的通用 scene-kit 组件与 tokens，回写 `skills/video-motion/templates/remotion-app/src/scene-kit/`，同步登记簿；项目专用实现保留在项目里。
2. **方案登记**：有复用价值的新成页方案，在 `patterns.md` 登记 PAT，或给已有 PAT 补复用记录；没有新方案就无需新增条目。
3. **教训入账**：有实际缺陷或可复用经验时追加 `docs/workorder-log.md`，普通制作不另写一套流水账。

复用闭环 = 开工复制模板（带出）→ 查 PAT 套方案（复用）→ 验收回流（增值）。
