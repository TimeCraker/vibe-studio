# Stage Spec · video-motion 首站：视频底材叠动效图层（Remotion）

- **日期**：2026-08-29
- **状态**：待执行
- **执行者**：Zcode（GLM-5.3-Flash），在 vibe-studio 仓库内工作
- **上游决策**：技术选型 Remotion（对比 Motion Canvas / Revideo / manim 后拍板，理由：视频素材叠加动效是一等公民、官方有 AI 代理文档、一套引擎同时覆盖未来"PPT 逐页成片"）

---

## §0 背景与目标

vibe-studio 是 TimeCraker 的自媒体内容工厂（Skills / Assets / 决策记录，不承载业务代码）。已有 `ppt`（代码画 PPT）与 `humanizer`（去 AI 腔）两个 skill。本站目标：新建第三个 skill **`video-motion`**——在真实视频底材上叠加动效图层，做出「人讲话时字幕跟着出、讲到数据时柱状条升起、关键点旁浮出圈注箭头」的知识区视频效果。

**MVP 验收一句话**：一条命令渲染出 mp4，底材视频全程正常播放，其上字幕 / 数据柱 / 圈注三层动效按时间轴声明准确出现与消失，Zcode 自验收三级核查全绿。

**明确不做**（后续站点）：PPT 逐页转视频、whisper 自动字幕、音频处理、竖屏适配。

### 执行者须知（必读）

1. **按 Stage 0 → 4 顺序连续推进**，每站末尾有「完成标志」，达标才进下一站；Stage 5（收尾沉淀）在验收全绿、用户确认后执行。
2. **任何一步连续失败 2 次**：立即停下，向用户报告——失败命令、完整报错、已尝试的两种方案。禁止：盲目重试、跳站、臆造 API、改用其他框架。
3. 本 spec 未覆盖的技术问题：先查 §5 官方文档；文档也解决不了 → 停下报告。
4. **边执行边留痕**：每完成一个 Stage，向 `output/video-motion-acceptance.md` 追加一节「Stage N 完成」+ 证据（命令 + 关键输出）。这个文件从 Stage 0 就创建，最后长成完整验收报告。
5. 硬约束：
   - **不改** `skills/ppt/`、`skills/humanizer/` 下的任何文件
   - mp4 / PNG / node_modules / out/ 一律不进 git（.gitignore 已配好，不要改动它）
   - 控制台输出用英文（Windows GBK 环境禁非 ASCII print）
   - 正式提交信息用 Conventional Commits + 中英文对照，格式见各 Stage

---

## §1 环境事实与已知坑

| 事实 | 说明 |
|---|---|
| 系统 | Windows 11；shell 为 Git Bash / PowerShell，命令按实际 shell 调整 |
| Node | v24.16.0 / npm 11.13.0 已装，无需安装 |
| npm 网络 | 中国网络。项目内 `.npmrc` 写 npmmirror 镜像（Stage 0 配置） |
| Chrome Headless Shell | `npx remotion browser ensure` 首次运行会把 Chrome Headless Shell 下载进项目 node_modules（百 MB 级）。**下载源是 Google 服务器，中国网络可能超时**。失败 → 报告用户，不要反复重试大文件下载 |
| 视频读图坑 | 视觉核查读图时，**路径含反斜杠可能解析失败**；先把 PNG 复制到 `C:\pc\` 这类短路径再读（ppt skill 已踩过的坑） |
| 素材 | 用户将提供 `footage.mp4`（可能无声音、无字幕——无所谓，字幕和动效本来就是叠上去的层）。**若执行时素材未到位**：走 Stage 1 的程序合成素材 fallback，不阻塞 |
| Remotion 版本 | 安装时不写死版本号，全部同批 `npm install` 让 npm 解析一致的最新版（Remotion 各子包版本必须严格联动，混版本必报错） |

---

## §2 目标产物结构与数据契约

```
skills/video-motion/
├── SKILL.md                       # Stage 5 才写，前期建空占位
└── templates/remotion-app/        # 最小可跑的 Remotion 工程（模板即资产）
    ├── package.json
    ├── .npmrc                     # npmmirror
    ├── tsconfig.json
    ├── remotion/index.ts          # registerRoot 入口
    ├── public/footage.mp4         # 视频底材（用户提供；不进 git）
    ├── out/                       # 渲染产物 mp4 + 抽帧 PNG（不进 git）
    └── src/
        ├── Root.tsx               # Composition 注册（1080p / fps30 / 时长=素材）
        ├── FootageOverlay.tsx     # 主合成：底材 + 三层动效
        ├── cues.ts                # 动效时间轴声明（设计即代码的核心）
        ├── SyntheticFootage.tsx   # fallback 素材（Stage 1 按需创建）
        └── fx/
            ├── SubtitleTrack.tsx
            ├── DataBars.tsx
            └── Spotlight.tsx
```

### cues.ts 数据契约（照抄，字段不许改）

```ts
export interface SubtitleCue {
  start: number;   // 秒，出现时刻
  end: number;     // 秒，消失时刻
  text: string;    // 单行字幕文本（长句拆成多条 cue）
}

export interface DataBarGroup {
  t: number;       // 秒，整组柱开始升起的时刻
  x: number;       // 组左上角 x（px，1080p 坐标系）
  y: number;       // 组左上角 y（px）
  scale?: number;  // 整体缩放，默认 1
  bars: { label: string; value: number; unit?: string; color?: string }[];
}

export interface SpotlightCue {
  t: number;                       // 秒，出现时刻
  ttl: number;                     // 秒，停留时长（到点退出）
  kind: 'circle' | 'arrow' | 'box';
  x: number; y: number;            // 目标区域左上角（arrow 时为指向点）
  w: number; h: number;            // 目标区域宽高（arrow 时 w=箭头伸出长度）
  text?: string;                   // 可选标签，浮在标注旁
}

export const cues = {
  subtitles: [] as SubtitleCue[],
  dataBars:   [] as DataBarGroup[],
  spotlights: [] as SpotlightCue[],
};
```

### 组件契约（props 与行为）

```tsx
// 底部居中黑底白字字幕条；每条 cue 用 <Sequence> 控制起止；spring 淡入淡出（damping: 200）
<SubtitleTrack cues={cues.subtitles} />

// 一组柱从 0 高度 spring 升起，柱顶数值用 interpolate 从 0 滚到 value；label 显示在柱底
<DataBars bars={cues.dataBars} />

// SVG 绘制：circle=椭圆圈注 / arrow=从画面右侧伸入指向(x,y) / box=高亮描边框；
// 出现后 0.5s 呼吸脉冲（sin 调制 scale ±2%），ttl 到点淡出
<Spotlight marks={cues.spotlights} />
```

实现纪律（对齐 ppt skill 的「设计即代码」）：坐标 / 时长全走 cues 声明，组件内不写死内容；spring 参数统一 `{damping: 200}`（无过冲的稳态弹入）；文字白色 + 半透明黑底，保证任何底材上可读。

---

## §3 分站任务

### Stage 0 · 环境与最小渲染

1. `cd C:/Users/TimeCraker/Desktop/my_workspace/vibe-studio`，`git status` 确认干净（`.playwright-mcp/` 未跟踪属已知例外，忽略）
2. 建 `skills/video-motion/templates/remotion-app/` 目录骨架（§2 树，SKILL.md 占位空文件）
3. 在 `remotion-app/` 内：
   - 写 `.npmrc`：`registry=https://registry.npmmirror.com`
   - 写 `package.json`（name `video-motion-app`，scripts：`render` / `studio` / `compositions`，见 §5 文档的 CLI 用法）
   - 写 `tsconfig.json`（JSX react-jsx，strict）
   - 写 `remotion/index.ts`：`registerRoot` 指向 `src/Root.tsx`
   - `src/Root.tsx`：注册一个 3 秒测试 Composition（黑底白字 "video-motion stage0"）
   - `npm install remotion @remotion/cli @remotion/media`（同批，让版本联动）
4. `npx remotion browser ensure`
5. `npx remotion render remotion/index.ts Stage0Test out/stage0-test.mp4`

**完成标志**：`out/stage0-test.mp4` 存在且 >0KB。向验收文件追加 Stage 0 小节。
**提交**：`feat(video-motion): Stage 0 环境与最小渲染 / stage 0 env and minimal render`

### Stage 1 · 底材层

1. 素材：若 `public/footage.mp4` 已由用户放入 → 用它；**否则 fallback**——写 `src/SyntheticFootage.tsx`（10 秒程序合成素材：渐变背景 + 移动色块 + 大数字计时，模拟"有东西可指"的画面），注册 `SyntheticFootage` Composition 渲染出 `public/footage.mp4`，代码中留 `// TODO-REPLACE: 换成用户真实素材后删除本文件`
2. `src/Root.tsx` 改注册 `FootageOverlay`：**1920×1080 横屏**、fps 30、`durationInFrames` 用 `calculateMetadata` + `getVideoMetadata(staticFile('footage.mp4'))` 动态取素材时长（写法见 §5 metadata 文档）
3. `FootageOverlay.tsx`：`<OffthreadVideo src={staticFile('footage.mp4')} />` 铺满
4. `npx remotion render remotion/index.ts FootageOverlay out/stage1-footage.mp4`

**完成标志**：渲染出的 mp4 时长 = 素材时长、画面 = 素材内容（尚无动效）；`npx remotion compositions remotion/index.ts` 输出的 durationInFrames / width / height / fps 与预期一致。
**提交**：`feat(video-motion): Stage 1 底材层 / stage 1 footage layer`

### Stage 2 · 三个动效组件

按 §2 契约实现 `fx/SubtitleTrack.tsx` / `fx/DataBars.tsx` / `fx/Spotlight.tsx`。每个组件写一个 5 秒演示 Composition（纯色背景 + 硬编码演示参数：字幕 2 条 / 柱一组 3 根 / 圈注 circle+arrow 各 1），分别渲染验证。

**完成标志**：三个演示 mp4 各自包含可见且行为正确的对应动效（自读抽帧确认，方法同 Stage 4 L2）。
**提交**：`feat(video-motion): Stage 2 字幕/数据柱/圈注三组件 / stage 2 subtitle, data bars, spotlight components`

### Stage 3 · 时间轴组合（真正的 demo）

1. **先看素材**：对 `public/footage.mp4` 抽 6-8 帧（`npx remotion still`，帧号铺开），读图理解画面内容与节奏
2. **写 `src/cues.ts` 动效剧本**（按素材实际内容设计，这是本站唯一需要判断力的步骤，其余全是体力活）：
   - 字幕 ≥5 条：讲画面里正在发生的事，每条 ≤2 秒
   - 数据柱 ≥1 组：与画面内容相关的数字（取不到真实数据时用演示值，字幕口径写明「演示数据」）
   - 圈注 ≥2 处：kind 至少含 circle 和 arrow 各一，指向画面中真实存在且值得注意的元素
3. `FootageOverlay.tsx` 组合：底材 + `<SubtitleTrack>` + `<DataBars>` + `<Spotlight>`
4. `npx remotion render remotion/index.ts FootageOverlay out/demo.mp4`

**完成标志**：一条命令出完整 demo.mp4，无报错。
**提交**：`feat(video-motion): Stage 3 时间轴组合 demo / stage 3 timeline composition demo`

### Stage 4 · Zcode 三级自验收（本站质量闸门）

**L1 程序级**：
1. 渲染退出码 0
2. `npx remotion compositions remotion/index.ts` 记录 durationInFrames / width / height / fps，与素材元数据比对
3. `npx remotion still remotion/index.ts FootageOverlay out/frames/f-<n>.png --frame=<n>` 抽 **≥8 帧**：每条字幕的 start+0.3s 和 end-0.3s 各 1 帧、数据柱升起前（t-0.3s）与升满后（t+1.5s）、每个圈注出现后（t+0.5s）与消失后（t+ttl+0.3s）——帧号 = 秒 × 30

**L2 读图核对（你的多模态能力是这一步的工具）**：
- PNG 复制到 `C:\pc\` 短路径再读（§1 坑）
- 逐帧核对并填表：

| cue | 期望 | 实际 | PASS/FAIL |
|---|---|---|---|
| 字幕#1 start+0.3s 帧 | 出现且文本=cues 声明 | （读图所见） | |

- 核对维度：字幕出现/消失时刻与文本、柱高度趋势与数值标签、圈注类型与落点、底材无花屏无拉伸、全帧无乱码

**L3 验收报告**：`output/video-motion-acceptance.md` 汇总——L2 全表 + 渲染命令完整输出 + 结论行（`ALL GREEN` 或红项清单+原因）。

**完成标志**：L1 全过、L2 表全 PASS、报告落盘。有红项 → 修组件/cues 重渲染重查，连续 2 轮仍有红 → 停下报告。
**提交**：`test(video-motion): Stage 4 三级自验收 / stage 4 three-tier self acceptance`

### Stage 5 · 沉淀与收尾（用户确认验收后执行）

1. **写 `skills/video-motion/SKILL.md`**（流程式结构，对齐 `skills/ppt/SKILL.md` 的写法与验收风格）：
   - frontmatter：`name: video-motion`、`description`（含触发词：视频动效 / 视频加字幕 / 屏录标注 / 把视频做成讲解视频 / Remotion）、`user-invocable: true`
   - 五步：① 剧本设计（看素材抽帧 → 写 cues，字幕讲画面、圈注指实物、数字要口径）② 工程与 cues（复制 templates/remotion-app，素材放 public/）③ 生成（render 命令）④ 三级核查（程序 → 读图 → 用户看片，still 抽帧法）⑤ 交付（产物路径 / 验收结论 / 脚本可复跑）
2. 建 junction（PowerShell）：
   ```powershell
   New-Item -ItemType Directory -Force C:\Users\TimeCraker\Desktop\my_workspace\vibe-studio\.claude\skills | Out-Null
   New-Item -ItemType Junction -Path C:\Users\TimeCraker\Desktop\my_workspace\vibe-studio\.claude\skills\video-motion -Target C:\Users\TimeCraker\Desktop\my_workspace\vibe-studio\skills\video-motion | Out-Null
   ```
3. **README.md 与 CLAUDE.md 路线图同步**（若上游已改好则跳过，git diff 确认）：Skills 表 `video-motion` 行状态改「已上线」，删除已合并的旧规划行
4. 提交：`feat(video-motion): SKILL.md 与路线图收尾 / skill doc and roadmap finalize`

---

## §4 总验收清单（Claude 复核用）

- [ ] `out/demo.mp4` 渲染成功，时长=素材、1920×1080、fps30
- [ ] ≥8 抽帧核对全 PASS
- [ ] `output/video-motion-acceptance.md` 存在、与实际产物一致、结论 ALL GREEN
- [ ] Stage 0-4 各有规范 commit，`git log --oneline` 可追溯
- [ ] `git status` 无 mp4 / node_modules / out/ 泄漏
- [ ] SKILL.md / README / CLAUDE.md 同步完成（Stage 5 后）

## §5 参考资料

- 总文档：https://www.remotion.dev/docs
- **AI 编码代理官方指引（优先读）**：https://www.remotion.dev/docs/ai/coding-agents
- 逐页：`/docs/offthreadvideo`、`/docs/sequence`、`/docs/spring`、`/docs/interpolate`、`/docs/staticfiles`、`/docs/still`、`/docs/calculate-metadata`、`/docs/cli-render`、`/docs/cli-compositions`
- 仓库内对齐对象：`skills/ppt/SKILL.md`（流程结构、验收写法、「设计即代码」纪律）
