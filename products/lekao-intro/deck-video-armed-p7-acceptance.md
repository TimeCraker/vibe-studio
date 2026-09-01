# P7 全副武装版验收（MG 武器库 S6 · 2026-09-01）

> 依据 `projects/lekao-intro/mg-armed-design.md`（送审通过版）施工。
> **不动**：文案 / 音频 / 素材 / P7 以外任何页；v1-v3 存量产物零触碰（git status products/ 空）。
> 施工文件：`projects/lekao-intro/remotion-app/src/deck-scenes.tsx`（Scene07 重写，布局从 SceneShell 改自由双栏以便标题组整体挂动词）。

## L1 程序对账 — PASS

| 项 | 结果 |
|---|---|
| 渲染退出码 | 0 |
| ffprobe 帧数 | **3287 帧 = 3287（与 S2 硬切引擎一致）**，109.567s @30fps |
| 确定性 grep（deck-scenes + scene-kit） | clean（无 random/Date） |
| v1-v3 存量 diff | 零（products/ 无改动） |
| P6→P7 切点亮度 | 1860/1861/1862 三帧全等 228.0（P6 浅底冻结）→ 1863 直落 21.6（P7 深底），**无混合帧硬切** |
| 模板回归（MgMediaDemo 540f） | 渲绿，public/ 零残留 |
| tsc | 武装版文件零错（Demos/cover-index 2 处为 v3 存量，范围外） |

## L2 条带 + 特写 + 放大 + 字幕同步 — PASS

**进场条带**（判分批 / 停顿 / 动词型）：
- P1 页首（0-3s，13 格）：批1 标题组滑入（0.00）→ 批2 规则级联逐行（0.40，280ms/项）→ 批3 下划线生长（0.90）——三批分明
- P2（4.4-5.9s，7 格）：格1 空 → 格2 柱图**残影进位** → 柱逐根错峰升起 + 环挂出（5.0）
- P3（8.2-9.0s，6 格）：退币行未出 → **WipeIn 半揭示** → 完整 → 「自动退回」下划线生长

**字幕同步**（元素到场 vs 字幕段 start）：批1@帧1863 vs 段1 1863.3、批4@1998 vs 段2 1998.1、批6@2112 vs 段3 2112.3 —— 到场差均 **<0.1s**（±0.3s 达标）。

**200% 道具放大**（F2 关）：柱图（标签/币锚/连线/渐变干净无 artifact）、左栏规则行（文字 crisp）、退币行（下划线精确贴「自动退回」四字）三张全过。裁切框截断为截图裁剪所致，非渲染缺陷。

## L2.5 静音盲答 — PASS

盲测（单帧无上下文）：主旨一句话命中「T-Coin 签到经济：签到得币、生成花币」；6 组支撑信息全部正确提取（5 币注册送 / 1 币消耗 / 2→8 递增柱图 / 失败退回 / 底部标语 / 07-11 页码）；3 秒可懂判定 yes。反馈的唯一建议（挣/花信息分栏）为 v3 同款信息架构，S6 明确不动文案，记为后续站候选。

## L3 v3 vs 武装版对照 — PASS

同页稳态帧对照（`p07-full.png` vs 武装末态）：

| 元素 | v3 | 武装版 |
|---|---|---|
| 标题关键词下划线（DrawPath endDot） | 无 | ✅ 带 endDot 端点 |
| spin-ring 呼吸环（LottieLayer，标题右端） | 无 | ✅ 虚线弧在场 |
| 背景颗粒场（NoiseField dark 0.28） | 无 | ✅ 全页颗粒 |
| 「自动退回」下划线（DrawPath） | 无 | ✅ 精确四字宽 |
| 布局（左栏四行 / 柱图 / 标题位） | — | **零变化**（内容不动只加武器） |
| 页长 / 切点 / 音画 | — | 与 S2 引擎完全一致（3287 帧对账） |

盲审判词：*identical structure, B layers on decorative depth… the polished "armed" pass of the same frame*。

## 施工中修掉的武器库真 bug（双工程已同步）

1. **CameraPush 布局塌陷**：transform 根在流内被 absolute 子树塌成 0 高 → 整页顶格溢出。修复：根元素 `position:absolute; inset:0`。症状：规则行叠标题（coin 像素 y146-172 实测）。
2. **BlurTrail 页顶漂移**：官方 `<Trail>` 根是 AbsoluteFill（页级覆盖语义），元素级使用无定位父级时内容从画布顶排（末柱数值实测 y16 爆顶）。修复：relative 化——主层流内撑尺寸、残影层 absolute 叠加，opacity/滞后公式与官方一致。
3. **srt-adapter 返回形状错**（S1 遗留）：4.0.518 `parseSrt` 返回 `{captions:[{text,startMs,endMs}]}`（毫秒），非 `startInSeconds`。已修为 `.captions` + `/1000`。
4. **cursor-track 重复 import + 解构残留 theme/mode**（S5 intake 笔误，esbuild 容忍故渲绿）；**mg-demos 重复 useCurrentFrame import**。均已清。

> 1/2 的通用教训已回写 motion-grammar（transform 包装坑）与 entrance-kit / BlurTrail 组件头注释。

## 产物（本机保留，不入 git）

- 武装版成片：`products/lekao-intro/deck-armed.mp4`（3287 帧 / 109.57s / 1080p30）
- 关键帧与条带：`C:/pc/mg-s6/`（施工期临时，可清理）
