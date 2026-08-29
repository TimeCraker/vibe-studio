# Explainer Video · 项目介绍视频总装图

从一份项目 README 到一条可发布的介绍视频。本图只做**调度**：每一步的活归对应 skill，质量关也归各 skill 的三级核查，总装只多一道终审。

| | |
|---|---|
| 输入 | 一个项目的 README（或等价的项目说明） |
| 输出 | 成片 mp4 + 封面 PNG，落在 `output/video-motion/<项目名>/` |
| 用到的 skill | ppt · narration · humanizer · video-motion（含 deck-video 与 cover-still）· auto-subtitle（B 线可选校准） |

---

## 第一步 · 选线

| | A 线（剪映全包） | B 线（Remotion 成片） |
|---|---|---|
| 什么时候选 | 要快、发一次就完的单片 | 要品牌统一、数据动效、圈注讲解，或同模板批量复用 |
| 字幕配音在哪做 | 剪映里识别字幕 + 配音 + 烧录，一步到位 | 稿驱动：narration 出稿，Remotion 渲染字幕 |
| vibe-studio 出什么 | 只出稿和封面 | 全链出片 |

一句话判据：**观众只看一遍的走 A，要沉淀成内容资产的走 B。**

---

## B 线 · 七步

1. **定受众**：读项目 README，答 ppt skill 的受众三问（给谁看 / 已知道什么 / 看完要能复述哪三句）。答案写在 `output/video-motion/<项目名>/brief.md`，之后所有取舍用它裁决。
2. **出 deck**：ppt skill 画介绍 PPT。三级渲染核查全绿才进步。
3. **出稿**：narration skill 写 `script.json`，`ref` 逐页写 `page N`。校验器全绿 + humanizer 深度过稿 + 出声读一遍。
4. **配音**：剪映里逐页念稿，导出 `page-N.wav` 放进 `public/deck/audio/`（SAPI 只是测试替身，正式出片一律剪映：音色、语气、情绪归人管）。
5. **成片**：`build-deck-params.mjs` 重算页时长（跟配音实际长度走）→ `npx remotion render` 出 mp4。换稿换配音后从这步重跑，上游不动。
6. **封面**：cover-still 出 1920×1080 PNG，title 用视频标题。省略 subtitle 即不渲染，badge 自动带品牌角标。
7. **终审（人工，不可跳）**：抽首 / 中 / 尾三页听音画同步；字幕不吞静音、不闪现；封面文字完整；BGM 若要加，在剪映里加，混音别盖人声。

**可选校准**：对成片音轨跑一次 auto-subtitle，比对输出 cues 与片内字幕的时间差——明显漂移（>0.5s）说明配音或摊时出了问题，回第 5 步。

## A 线 · 四步

1. 定受众（同 B1）。
2. narration 出整稿（不分页，预算按目标片长倒推）。
3. humanizer 过稿 + 出声读。
4. 剪映：导入素材与稿 → 配音 → 识别字幕 → 手动微调 → 出片。cover-still 补封面。

---

## 约定

- 一个项目一个目录：`output/video-motion/<项目名>/` 下放 deck.pptx、script.json、audio/、deck.mp4、cover.png 与 brief.md，复跑命令写在 brief.md 末尾（命令即资产，产物不进 git）。
- 质量关不重复建设：各 skill 的三级核查就是关卡，本图只加第 7 步终审。
- 明确不做：自动 BGM 混音（剪映手动）、自动发布、多语种。
