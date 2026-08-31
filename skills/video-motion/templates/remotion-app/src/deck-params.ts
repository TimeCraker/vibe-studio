// 模板示例数据：让 DeckVideo / DeckVideoV2 开箱即可编译预览。
// 实际项目跑 `node scripts/build-deck-params.mjs <script.json> <public/deck>` 生成覆盖本文件。
export const deckParams = {
  fps: 30,
  width: 1920,
  height: 1080,
  overlapSeconds: 0.5,
  totalSeconds: 8.5,
  pages: [
    { index: 1, start: 0, audioSeconds: 3.8, pageSeconds: 4.2 },
    { index: 2, start: 4.2, audioSeconds: 3.8, pageSeconds: 4.2 },
  ],
};
