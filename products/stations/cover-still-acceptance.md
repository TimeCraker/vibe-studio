# cover-still 验收报告（2026-08-29）

> Spec：`docs/2026-08-29-cover-still-stage-spec.md`。Stage 0–2 自验收全绿，Stage 3（SKILL.md / README 收尾）待用户确认后执行。
> 本站 commit：`74467ea feat(video-motion): Cover 静态封面出图 / cover still composition via remotion still`

## §0 并行硬边界执行

- 禁区零触碰：`git show --stat 74467ea` 仅 3 文件——`.gitignore`(+1 行)、`src/Cover.tsx`、`src/cover-index.ts`。`Root.tsx` / `DeckVideo.tsx` / `deck-*.ts` / `scripts/` / `public/deck/` / `package.json` / lockfile 均未动。
- 提交逐文件 add，未用 `git add -A` / `git commit -a`。
- 并行施工提示：本站施工期间 deck 站落了 `32c5d00`（CLAUDE.md / README.md / SKILL.md），与本站文件零交集，无冲突。
- 独立入口机制实测有效：默认入口（`remotion/index.ts` → Root.tsx）会炸在 deck 站 `getVideoMetadata(footage.mp4)` 404，本站所有渲染显式传 `src/cover-index.ts`，全程无一次触碰 Root 注册。

## 夹具（产物在 output/ 与 gitignore 目录，均不进 git）

| 夹具 | 位置 | 说明 |
|---|---|---|
| bg-grad.png | `templates/remotion-app/public/covers/` | ffmpeg `gradients` 滤镜直出（1920×1080，testsrc2 未启用） |
| photo.json | `output/video-motion/covers/` | 12 字标题 + subtitle + bg + preset=photo |
| dark.json | 同上 | 仅 title（22 字纯 CJK 超长）+ preset=dark，无 bg |
| clean.json | 同上 | title + subtitle + badge 三要素齐，preset=clean |
| smoke.json / smoke.png | 同上 | Stage 0 完成标准用临时 props |

## 渲染命令（--props 实测结论）

```
cd skills/video-motion/templates/remotion-app
npx remotion still src/cover-index.ts Cover ../../../../output/video-motion/covers/<name>.png --props=../../../../output/video-motion/covers/<name>.json
```

- **`--props` 接受 JSON 文件路径**（源码实证：`@remotion/cli/dist/get-input-props.js` 先 `path.resolve(cwd)` → `existsSync` → `readFileSync utf-8`），中文 JSON 无 GBK 问题，未启用内联 JSON + PowerShell 编码方案。
- `still --help` 探针不可用：该版本 CLI 先打包默认入口再校验参数，help 文本够不到（顺带踩出 deck 站 404，反证独立入口必要）。

## L1 程序核验（全绿）

| 产物 | exit | 尺寸（System.Drawing） |
|---|---|---|
| photo.png | 0 | 1920×1080 |
| dark.png | 0 | 1920×1080 |
| clean.png | 0 | 1920×1080 |

（Stage 0 smoke.png 同样 exit 0、1920×1080。）

## L2 读图核查（全绿，PNG 经 `C:\pc\` 短路径读取）

- **photo**：标题「AI 驱动的视频动效引擎」单行完整不截断；底部向上 55% 黑色渐变遮罩在位，白标题/白副标题对比度可读（验收项过）；bg 渐变图 objectFit cover 铺满。
- **dark**：22 字超长标题两行折行（15 字 + 7 字），完整无截断（折行验收线过）；#0F1115→#1A1D24 对角渐变在位，副标题金色 #F5C518。
- **clean**：#FAFAF7 浅底 + 顶部细线（安全边距 96px 处）在位；标题/副标题/badge 三要素齐，badge 深灰。
- 三张均无乱码方块（Microsoft YaHei 正常渲染）；badge 右下角 letter-spacing 0.3em 字距正常。

## 行为备注（非红项，留待终审拍板）

Remotion `defaultProps` 为**浅合并**：`--props` 未传的键会回落到 `cover-index.ts` 样例值。表现为 dark.png 出现样例副标题「封面静态出图样例」、photo.png 出现样例 badge「ASTERFORGE」。当前视觉成立（全片带品牌角标），但「省略键即不渲染」的产品语义未满足。若终审要求改语义，方案是把 `defaultCoverProps` 收窄为 `{ title, preset: "dark" }` 后重渲三夹具（约 1 分钟），不动其他文件。

## Git / 产物边界核验

- `git status --porcelain` 干净：`public/covers/`（.gitignore 第 17 行）与 `output/`（第 32 行）均命中 ignore，`git check-ignore -v` 实证。
- props JSON 全部在 `output/video-motion/covers/`，产物不进 git。

## 遗留

1. **Stage 3 未做（等用户确认）**：video-motion `SKILL.md` 增「封面出图」节 + `README.md` Skills 表补行。
2. **defaultProps 浅合并语义**（见行为备注）待拍板：维持现状 or 收窄样例。
3. photo 遮罩下标题位于画面垂直居中（约 45%–55% 高度带），处于遮罩上沿过渡区；本次底图下对比度实测可读。若换高亮底图，建议把标题带下移或加深遮罩——留作后续调参空间，不阻塞验收。
