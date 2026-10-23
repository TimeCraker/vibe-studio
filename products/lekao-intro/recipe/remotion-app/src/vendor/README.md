# vendor/ — 社区库精选（copy-paste 入库，不是 npm 依赖）

shadcn 式源码登记库（npm 包只是 CLI），组件以「精选 + intake 改造」方式入库：
每个文件头注明来源仓库 / 许可证 / 拉取日期 / 本地改动。**升级 = 重新拉取重做 intake**，
不就地改。

## 收录清单

| 目录.文件 | 来源 | 许可证 | 拉取 | intake 改动 |
|---|---|---|---|---|
| `snapcn/cursor-track` | [snapcn.dev](https://snapcn.dev)（repo: snapcndev/snapcn，registry/r/cursor-track.json） | MIT | `gh api repos/snapcndev/snapcn/contents/public/r/cursor-track.json --jq '.content' \| base64 -d` | 剥 snap-cn-ui 主题系统（默认色挂 scene-kit tokens：ink / 白描边 / 品牌环）；withAlpha 内联；删 "use client" |
| `onda/depth-push` | [onda-video.vercel.app](https://onda-video.vercel.app)（repo: degueba/onda，registry/transitions/depth-push） | MIT（代码；名称商标除外） | `gh api repos/degueba/onda/contents/registry/transitions/depth-push/depthPush.tsx --jq '.content' \| base64 -d` | 剥 zod 校验（props 直传同默认值），逻辑零改动 |

## 评估后未收录（记录原因，避免重复调研）

| 库.组件 | 为什么没进 |
|---|---|
| snapcn/answer-stream | 依赖链深（input 组件 + google-fonts Inter/SourceSerif4 中国网络 + mixOklch 色彩系统），intake 成本高于价值；AI 流式输出场景 scene-kit 的 ChatReplay 已部分覆盖 |
| Onda 的 clockWipe 等包装类转场 | 多数是官方 `@remotion/transitions` presentation 的 zod 包装——**官方件我们已装**（transitions.tsx 可直接 import `@remotion/transitions/clock-wipe` 等），vendor 包装层无净价值；只收录真自定义实现（depth-push） |
| RemotionUI（remotionui.com） | 源码走 CLI 拉取（npm 包 @contentfork/remotion-ui 是 CLI，非运行时），**其 `add` 会自动 patch Root.tsx**——必须在 scratch 目录跑，本轮未施工；后续需要时按 vendor 纪律拉取 |

## intake 纪律（新增组件必过）

1. 许可证一手验证（repo 的 LICENSE 文件），非 MIT 停下报告
2. grep `Math.random` / `Date.now` / `useState` / CSS transition / CSS animation——命中即改写为 frame 派生等价或弃换
3. 主题/字体依赖改挂 `scene-kit/tokens`（社区库自带字体如 Clash Display 一律换系统栈）
4. 文件头五字段：来源 URL / 源 repo / 许可证 / 拉取日期 / 本地改动清单
