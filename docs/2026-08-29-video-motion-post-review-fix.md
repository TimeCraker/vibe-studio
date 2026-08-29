# 修复工单 · video-motion 验收后修复：原生规格重渲染 + 产物迁出 skill

- **日期**：2026-08-29
- **执行者**：Zcode（GLM-5.3-Flash），在 vibe-studio 仓库内工作
- **背景**：首站 Stage 0-4 已验收 ALL GREEN，用户看片后两条反馈：① 成片 1080p30 相比素材 1440p60 清晰度帧率双降；② 产物落在 skill 内 `out/`，违反新立的目录法（skill 是纯工具，产物一律放项目根 `output/<skill 名>/`，见 README「约定」）。
- **已完成（指挥官，你不用做）**：画质参数已修好并提交——`3818e59`（FootageOverlay 升原生规格）+ `7b42f10`（`scripts/probe-footage.mjs` ffprobe 探针生成 `src/footage-params.ts`，输出参数随素材自动适配，不写死）。`npx remotion compositions` 已验证输出 `2560x1440 / 60fps / 1831 帧`。

## 规则（同首站 spec §0）

- 任何一步连续失败 2 次：停下报告用户，禁盲目重试
- 渲染若因内存 / 超时报错：报告，**不许自行降参数**
- `auto-subtitle` 站可能并行施工：**只 `git add` 本工单明确点名的文件，禁 `git add -A` / `git add .`**
- 控制台 print 全英文；产物 / output/ 不入 git
- **不执行 Stage 5**（SKILL.md 等用户另确认）

## 任务 A · 重渲染正片（原生 2560×1440 @ 60fps）

```bash
cd skills/video-motion/templates/remotion-app
mkdir -p ../../../../output/video-motion
npx remotion render remotion/index.ts FootageOverlay ../../../../output/video-motion/demo.mp4 --crf=16
```

**完成标志**：退出码 0；`output/video-motion/demo.mp4` 存在且 >100MB；`ffprobe -v error -show_entries stream=width,height,r_frame_rate -of csv=p=0` 输出含 `2560,1440,60/1`。

## 任务 B · 抽帧复核（确认分辨率提升后动效落点无漂移）

60fps 下帧号 = 秒 × 60。抽 3 帧到 `output/video-motion/frames-1440p/`：

```bash
npx remotion still remotion/index.ts FootageOverlay ../../../../output/video-motion/frames-1440p/f-<n>.png --frame=<n>
```

| 帧 | 时刻 | 期望（与 1080p 版相同的落点，仅更清晰） |
|---|---|---|
| f-282 | 4.7s | box 描边框套住右上 killfeed 双杀行 + 标签「双杀时刻」 |
| f-1014 | 16.9s | arrow 从右侧伸入指向「离引爆还剩 40 秒」提示条 + 标签「倒计时 40 秒」 |
| f-1698 | 28.3s | 三根数据柱（接火双杀 2杀 / 残局收割 1杀 / 回合总击杀 3杀）高度比例 2<3、1<3，不遮挡 HUD |

读图走 `C:\pc\` 短路径（首站踩过的坑）。任一落点漂移 → 停下报告，不要自行改 cues。

## 任务 C · 产物迁出 skill（目录法落地）

1. `output/video-motion/demo.mp4` 确认完好后（任务 A 完成标志），迁移 `skills/video-motion/templates/remotion-app/out/` 下：`frames/` 整目录、`stage0-test.mp4`、`stage2-SubtitleDemo.mp4`、`stage2-DataBarsDemo.mp4`、`stage2-SpotlightDemo.mp4` → 全部移入 `output/video-motion/`
2. **删除冗余大文件**（都是可复跑产物）：`out/stage1-footage.mp4`（纯素材重编码、无动效）、`out/demo.mp4`（1080p 旧版正片，已被 1440p 版替代）；`render-log*.txt` 一并删
3. 迁移完成后删除空的 `out/` 目录
4. **素材直读试验**（快验证，不整段渲染）：
   ```bash
   npx remotion compositions remotion/index.ts --public-dir ../../../../output/footage
   ```
   能算出 `1831` 帧 → 说明 `staticFile` 可直读项目素材库 → 删除 `public/footage.mp4`（118MB 副本，skill 里不留素材），把用法记进验收文件；失败 → 保留副本不动，**不试第二次**，如实报告

## 任务 D · 留痕

1. 向 `output/video-motion-acceptance.md` 追加「验收后修复」一节：
   - 前后参数对比表：1920×1080@30（104.9MB）→ 2560×1440@60（实测大小）；码率 = 大小×8/30.5s，两行都算
   - 迁移清单：移入 / 删除各哪些文件、释放多少 MB
   - 任务 B 三帧核对表（期望 / 实际 / PASS-FAIL）
   - 素材直读试验结果
2. 本工单全部动作发生在 gitignored 区域（output/、out/、*.mp4），**预期 git 零变化、无需提交**——若 `git status` 出现本工单之外的异常条目，停下报告（可能是并行站施工，别碰）

**总完成标志**：A + B + C 全过，验收报告更新，报告结论行 `ALL GREEN` 或红项清单。
