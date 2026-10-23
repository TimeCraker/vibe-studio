# lekao-intro — 施工工程

lekao 产品介绍视频的项目工作区（项目彼此隔离：本目录的素材 / 场景代码 / 生成数据只属于本项目）。

```
lekao-intro/
├── remotion-app/        施工工程（从 skill 模板复制起步）
│   ├── src/deck-scenes.tsx      ★ 本项目的 11 页场景（SCENES / DARK_PAGES）
│   ├── src/DeckVideoV2.tsx      引擎（页序/字幕/音频接线，换项目不动）
│   ├── src/deck-params.ts / deck-cues.ts   生成数据（build-deck-params.mjs 派生，禁手改）
│   ├── src/CoverV3.tsx + cover3-index.ts   本项目封面（v3 光影版）
│   ├── src/kit-demos.tsx + remotion/demo-index.ts  scene-kit 零件 demo（v3 施工证据）
│   ├── public/lekao/            项目素材（官网截图 / mark / hero 特写）
│   └── public/deck/             页图 + 配音（page-N.wav，剪映真人配音同名回填）
├── script.json          口播稿（27 段，narration 校验过）
├── scene-design.md      11 页场景设计表（v3 八列版）
├── brief.md             项目简报
└── asset-prompts.md     插画素材生产单（即梦/豆包提示词，等额度）
```

## 常用命令

```bash
cd remotion-app
# 换配音后重算时间轴 + 重渲
node scripts/build-deck-params.mjs ../script.json public/deck
npx remotion render remotion/index.ts DeckVideoV2 ../../products/lekao-intro/deck-v4.mp4 --crf=16
# 封面
npx remotion still src/cover3-index.ts CoverV3 ../../products/lekao-intro/cover-v3.png --frame=60
```

产物与验收报告在 `products/lekao-intro/`；在跑工单见 `docs/`（v4 转场与进场动效 spec）。
