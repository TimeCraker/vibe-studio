# 2026-08-29 · cover-still Stage Spec — 封面静态出图（video-motion 第三能力）

> 执行者：Zcode（GLM-5.3-Flash）。本 spec 自包含，无需会话上下文。
> 复核：Claude（spec §4）→ 用户终审看图。

## §0 规则与护栏

- **定位一句话**：video-motion 的 Remotion 引擎已有「视频底材叠动效」（首站）、deck-video 站在铺「PPT 逐页成片」，本站补**静态封面/缩略图**：标题大字 + 背景 + 角标 → 一条 `remotion still` 命令出 1920×1080 PNG。
- **并行施工硬边界**：deck-video 站正在同一 remotion-app 施工。本站**禁止触碰**：`src/Root.tsx`（deck 站要注册 DeckVideo）、`src/DeckVideo.tsx`、`src/deck-*.ts`、`scripts/` 全目录、`public/deck/`、`package.json` / lockfile。本站只新增：`src/Cover.tsx`、`src/cover-index.ts`、`public/covers/`（gitignore）、`.gitignore` 一行。
- **独立入口**：封面用 `src/cover-index.ts` 自己 `registerRoot`，渲染命令显式传入口文件——这是不碰 Root.tsx 的机制保证。
- **CLI 用法以实测为准**：先跑 `npx remotion still --help` 确认 `--props` 是否接受 JSON 文件路径；若只支持内联 JSON，用 PowerShell `Get-Content -Raw -Encoding UTF8` 读文件内容传入（中文内联 JSON 的 GBK 坑见 §1）。
- 提交只 add 本站文件；禁 `git add -A` / `git commit -a`。
- 连续 2 轮同一红项 → 停下出报告；spec 矛盾 → 停下报告。

## §1 环境事实（已核实）

| 项 | 事实 |
|---|---|
| 工程 | `skills/video-motion/templates/remotion-app/`，remotion 4.0.518 已装，Chrome Headless Shell 已下（首站 render/still 均验证可用） |
| 素材现状 | `public/footage.mp4` **已不在**（首站后清理）；测试底图用 ffmpeg 合成（见 Stage 1） |
| 索引参考 | `src/Root.tsx` 的 Composition 注册写法（只读参照，不改它） |
| GBK 坑 | PowerShell 传中文 JSON 给 CLI 前 `[Console]::OutputEncoding = [Text.Encoding]::UTF8` |
| 读图坑 | 模型读 PNG 前先复制到 `C:\pc\` 短路径（含反斜杠深路径解析失败） |
| 尺寸核验 | `Add-Type -AssemblyName System.Drawing; $i=[System.Drawing.Image]::FromFile(<p>); "$($i.Width)x$($i.Height)"; $i.Dispose()` |

## §2 契约

### 输入：props JSON（产物，放 output/ 不进 git）

`output/video-motion/covers/<name>.json`：

```json
{ "title": "主标题（可长，自动折行）", "subtitle": "可选副标题", "badge": "ASTERFORGE", "bg": "covers/bg-1.png", "preset": "photo" }
```

- `bg` 是 `public/` 下相对路径（组件内 `staticFile()` 解析）；`preset` ∈ `photo | dark | clean`；除 `title` 外全可省，缺省 `preset: "dark"`。

### 组件：`src/Cover.tsx` + `src/cover-index.ts`

- cover-index.ts：Composition id 固定 `Cover`，1920×1080，fps 30、durationInFrames 30（still 不吃 fps 但注册必须有），`defaultProps` 给一个合法样例，组件 props 类型化接收 `--props` 覆盖。
- 尺寸/边距/字号常量集中文件顶部（派生值不散落硬编码）。

三 preset（全部居中版式，安全边距 ≥96px）：

| preset | 底 | 字色 | 要点 |
|---|---|---|---|
| `photo` | bg 图 objectFit cover 铺满 + 底部向上 55% 高黑色线性渐变遮罩（底 rgba(0,0,0,0.82) → 透明） | 白 | 遮罩保对比度是验收项 |
| `dark` | #0F1115 → #1A1D24 对角渐变 | 白，subtitle 金 #F5C518 | 无 bg 时的默认 |
| `clean` | #FAFAF7 浅底 + 顶部细线 | 深 #16181D | badge 深灰 |

- title：104px / weight 800 / 行高 1.15 / `maxWidth: 82%` / 居中自动折行；subtitle：44px；badge：28px / letter-spacing 0.3em / 右下角。字体栈 `"Microsoft YaHei", "PingFang SC", sans-serif`。
- **折行验收线：给定标题须 ≤2 行完整放下**（测折行，不测截断）。

### 渲染命令

```
cd skills/video-motion/templates/remotion-app
npx remotion still src/cover-index.ts Cover ..\..\..\..\output\video-motion\covers\<name>.png --props=<按 §0 实测确定>
```

产物 1920×1080 PNG，落 `output/video-motion/covers/`。

## §3 任务分 Stage

### Stage 0 · 实现

`Cover.tsx` + `cover-index.ts` + `.gitignore` 追加一行 `public/covers/`。
完成标准：对临时 props 出 PNG、exit 0。
commit：`feat(video-motion): Cover 静态封面出图 / cover still composition via remotion still`

### Stage 1 · 三夹具出图

先造测试底图（public/ 无素材）：

```
ffmpeg -f lavfi -i gradients=s=1920x1080:d=1 -frames:v 1 public/covers/bg-grad.png
```

（`gradients` 滤镜不存在则退 `testsrc2=s=1920x1080`。）然后三个 props：

1. `photo.json` — 用 bg-grad.png；title ≈12 字 + subtitle。
2. `dark.json` — 无 bg；**title 22 字超长标题，验证两行折行**。
3. `clean.json` — title + subtitle + badge 三要素齐。

三个 PNG 渲染落 `output/video-motion/covers/`。

### Stage 2 · 三级自验收（停下等确认）

- **L1**：三次渲染 exit 0；每张 PNG 尺寸 1920×1080（§1 命令核验）。
- **L2**：PNG 复制到 `C:\pc\` 后逐张读图核查：标题完整不截断、dark 两行折行、photo 遮罩下文字可读、无乱码方块（字体缺失特征）、badge 字距正常。
- **L3**：报告 `output/cover-still-acceptance.md`（夹具、命令、L1/L2 结果、遗留）。停下等用户确认。

### Stage 3 · 收尾（用户确认后才做）

- video-motion `SKILL.md` 增「封面出图」节：props 契约 + 一条 still 命令 + L2 读图检查（≤15 行）。
- `README.md` Skills 表 video-motion 行补「静态封面出图」。
- commit：`docs(video-motion): SKILL.md 增封面出图 / document cover still`

## §4 验收清单（Claude 复核用）

- [ ] 三 PNG exit 0 且 1920×1080
- [ ] `git show --stat`：未触碰 Root.tsx / DeckVideo* / scripts/ / package.json
- [ ] dark 超长标题两行折行、无截断；photo 文字对比度可读
- [ ] `public/covers/` 已进 .gitignore
- [ ] props JSON 全在 `output/`（产物不进 git）

## §5 参考

- 引擎与命令惯例：`docs/2026-08-29-video-motion-stage-spec.md`
- Composition 注册参照：`src/Root.tsx`（只读）
- Remotion still 官方文档：remotion.dev/docs/cli/still
