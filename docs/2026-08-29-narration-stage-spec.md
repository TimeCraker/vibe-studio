# Stage Spec · narration 第三站：结构化口播稿工坊（分段稿 + 程序校验）

- **日期**：2026-08-29
- **状态**：待执行
- **执行者**：Zcode（GLM-5.3-Flash），在 vibe-studio 仓库内工作
- **上游决策**：口播稿按「带时间结构的数据」处理（不是文章）——分段声明、程序校验、人只管语感终审。TTS 配音用市面产品（剪映），**本站不做语音合成**。设计对齐仓库哲学「设计即代码」：ppt 有 verify.py，video-motion 有抽帧核查，narration 补上流水线头号工件的校验闭环。

---

## §0 背景与目标

vibe-studio 流水线「README → 文案 → PPT/视频 → 成片」。`ppt`（成稿流程含受众三问）、`humanizer`（去 AI 腔）已上线，管住了「写得对、写得像人」；但**视频口播稿**特有的三样东西没人管：①时长工程（中文 4.5 字/秒，字数即秒数）②视频叙事（钩子开头、讲画面、留白）③文画对齐（哪句话配哪个画面段）。首站 demo 的 8 条字幕是 Zcode 现学现卖的，质量可以但无规范可抄。

本站建第五个 skill **`narration`**：把口播稿变成结构化分段稿（JSON），配一个程序校验器，红绿分明。

**MVP 验收一句话**：一份分段稿 JSON 喂进 `verify_narration.py`，合法稿全绿退出 0；三种典型错误（字幕段超长 / 总时长超预算 / 破折号禁令）各自被抓红退出 1，Zcode 三级自验收全绿。

**明确不做**：语音合成（剪映人工配音）、时间轴精确对齐（auto-subtitle 站负责）、竖屏文案。

### 执行者须知（必读）

1. **按 Stage 0 → 3 顺序连续推进**，每站末尾有「完成标志」；Stage 4（收尾沉淀）在验收全绿、用户确认后执行。
2. **任何一步连续失败 2 次**：停下报告用户——失败命令、完整报错、已尝试的两种方案。禁盲目重试、跳站、臆造 API。
3. **边执行边留痕**：每完成一个 Stage 向 `output/narration-acceptance.md` 追加一节（命令 + 关键输出）。
4. 硬约束：
   - **纯 Python 标准库**（json/re/sys/argparse）——不 pip 安装任何东西，不用 venv
   - **不改** `skills/ppt/`、`skills/humanizer/`、`skills/video-motion/`、`skills/auto-subtitle/` 下任何文件（多站可能并行施工）
   - **git 提交纪律**：只 `git add skills/narration`（Stage 4 再加 README.md / CLAUDE.md），**禁 `git add -A` / `git add .` / `git commit -a`**
   - 测试产物落 `output/narration/`（已 gitignore）
   - 控制台 print 全英文（GBK）；写文件显式 `encoding="utf-8"`
   - 提交信息 Conventional Commits + 中英文对照，见各 Stage

---

## §1 环境事实

| 事实 | 说明 |
|---|---|
| Python | 3.11.9 在 PATH，纯 stdlib 实现，零依赖 |
| 测试预算 | 首站素材 30.5s（CS2）；口播预算应留呼吸，fixture 用 **22s**（约为素材 72%） |
| 节奏基准 | 中文 4.5 字/秒（可 `--cps` 覆盖）；20 字 ≈ 4.4 秒，正好是一条字幕的上限 |

---

## §2 产物结构与数据契约

```
skills/narration/
├── SKILL.md                       # Stage 4 才写，前期空占位
└── templates/
    ├── verify_narration.py        # 校验器（本站唯一代码）
    └── script.example.json        # 样例分段稿（fixture 同源，教学用）
```

### 分段稿 JSON 契约（字段不许改）

```json
{
  "meta": {
    "title": "CS2 回合解说",
    "lang": "zh",
    "budgetSeconds": 22,
    "charsPerSecond": 4.5,
    "bannedWords": []
  },
  "segments": [
    { "id": 1, "kind": "subtitle", "text": "这一局我们打 B 区。", "ref": "footage 0:00-0:04" },
    { "id": 5, "kind": "voiceover", "text": "平台安放 C4，同时留意回防。", "ref": "footage 0:11-0:14" }
  ]
}
```

- `meta.budgetSeconds`：说话总时长预算（秒）。**要给画面留呼吸**，一般 ≤ 素材时长的 75%
- `meta.charsPerSecond` / `meta.bannedWords`：可选，缺省 4.5 / 空
- `segments[].kind`：`subtitle`（≤20 字，直接当字幕）/ `voiceover`（长口播段，只计入时长不查段长）。缺省 `subtitle`
- `segments[].ref`：画面引用（素材时间段或 PPT 页码），只校验非空
- **字数与秒数是派生值，作者不写、校验器算**——声明意图，数字交给程序

### 校验规则（verify_narration.py 给死）

CLI：`python verify_narration.py <script.json> [--cps 4.5] [--budget-seconds 22]`（命令行参数覆盖 meta）

**字数统计**：`text` 先做禁令检查（原文），再剥掉空白与标点后计字符数；剥离集给死：空格 `\t\n` 与 `，。！？；：、""''（）《》…—, .!?;:'"()`。秒数 = 字数 ÷ cps，保留 1 位小数。

| # | 检查 | 级别 | 规则 |
|---|---|---|---|
| 1 | 结构 | FAIL | JSON 可解析；meta.lang/budgetSeconds 存在；segments 非空；每段有 id/text/ref |
| 2 | 字幕段长 | FAIL | kind=subtitle 的段，剥后字数 ≤20 |
| 3 | 时长对账 | FAIL | 各段秒数之和 vs budgetSeconds，偏差 >10% |
| 4 | 破折号禁令 | FAIL | 原文含 `——` `—` `–` 任一 |
| 5 | AI 腔词表 | WARN | 命中默认词表（写死在脚本顶部常量：首先/其次/最后/总而言之/值得注意的是/众所周知/综上所述/不仅…而且/极大地/有效地）∪ meta.bannedWords |
| 6 | 修饰密度 | WARN | 修饰词表（非常/十分/特别/超级/真的/其实/基本/大概）每千字 >12 个 |

**输出**：逐段一行 `[OK]/[WARN]/[FAIL] id=N kind=.. chars=.. sec=.. text`；末尾汇总（FAIL 数 / WARN 数 / 总秒数 vs 预算）；FAIL >0 → `sys.exit(1)`，否则 0。全英文。

---

## §3 分站任务

### Stage 0 · 骨架

建 `skills/narration/SKILL.md`（空占位）、`templates/` 目录；创建 `output/narration-acceptance.md` 写入抬头。

**完成标志**：目录就位。**提交**：`feat(narration): Stage 0 骨架 / stage 0 skeleton`

### Stage 1 · 校验器

按 §2 契约实现 `verify_narration.py` 与 `script.example.json`（example 即下方 fixture 的拷贝）。

**完成标志**：`python skills/narration/templates/verify_narration.py skills/narration/templates/script.example.json` 退出码 0。**提交**：`feat(narration): Stage 1 分段稿校验器 / stage 1 segment script verifier`

### Stage 2 · 正例 + 故障注入实测

1. **正例 fixture**：`output/narration/script-cs2.json`——8 段口播稿（budgetSeconds 22），文本给死照抄：

```
1 subtitle 这一局我们打 B 区。            ref footage 0:00-0:04
2 subtitle 上隧道推进，队友先顶出去。      ref footage 0:04-0:08
3 subtitle B 口接火，配合队友直接双杀。    ref footage 0:08-0:12
4 subtitle 进 B 换弹，准备下包。          ref footage 0:12-0:15
5 subtitle 平台安放 C4，同时留意回防。     ref footage 0:15-0:19
6 subtitle 包已下好，四十秒倒计时。        ref footage 0:19-0:22
7 subtitle 卡住方向守包，等对手来撞。      ref footage 0:22-0:26
8 subtitle 回合胜利，三杀拿下 MVP。        ref footage 0:26-0:30
```

   跑校验 → 退出码 0，记录输出（8 行 OK + 总秒数 ≈21s vs 22s 预算）

2. **故障注入三例**（每例单独文件 `output/narration/fault-N.json`，基于正例改）：
   - fault-1：段 3 文本改为 25 字长句 → 段长 FAIL
   - fault-2：budgetSeconds 改 15 → 时长对账 FAIL（总 21s 超预算 40%）
   - fault-3：段 6 文本插入一个 `——` → 破折号 FAIL
   各自跑校验 → 退出码 1，红项定位到正确段落

**完成标志**：1 绿 3 红全部符合预期。**提交**：`test(narration): Stage 2 正例与故障注入 / stage 2 fixture and fault injection`

### Stage 3 · Zcode 三级自验收

- **L1 程序级**：五个文件的退出码矩阵（正例 0；fault-1/2/3 均 1）；example.json 校验 0
- **L2 数值核对**：手算抽查——段 1「这一局我们打 B 区。」剥后 9 字 → 2.0s；段 8 剥后 11 字（MVP 计 3）→ 2.4s；八段合计与程序输出一致；fault-2 偏差百分比复算
- **L3 报告**：`output/narration-acceptance.md` 汇总 L1+L2 表、四组命令完整输出、结论行 `ALL GREEN` 或红项清单

**完成标志**：全绿报告落盘。**提交**：`test(narration): Stage 3 三级自验收 / stage 3 three-tier self acceptance`

### Stage 4 · 沉淀与收尾（用户确认验收后执行）

1. **写 `skills/narration/SKILL.md`**（对齐 ppt skill 流程式写法）：
   - frontmatter：`name: narration`、`description`（触发词：口播稿 / 视频文案 / 配音稿 / 写脚本 / 分段稿 / narration）、`user-invocable: true`
   - 五步：①受众与预算（复用 ppt 受众三问；素材时长 → budgetSeconds ≈ 时长 75%）②分段成稿（写 script.json：文本 + ref + kind，**字数秒数不手写**）③程序校验（verify_narration.py 全绿才进步；红了改稿不是改规则）④人工打磨（humanizer 深度过稿 + 出声读一遍，喘不上气的段拆两段）⑤交付（分段稿逐段贴**剪映**配音；音频回来后段文本进 video-motion 的 `cues.subtitles`，时间轴由 auto-subtitle 校准；产物与分段稿放 `output/narration/`）
   - 附：节奏速查表（4.5 字/秒 → 30s≈135 字 / 1min≈270 字 / 5min≈1350 字）
2. junction（PowerShell，`.claude/skills/` 已 gitignore）：
   ```powershell
   New-Item -ItemType Directory -Force C:\Users\TimeCraker\Desktop\my_workspace\vibe-studio\.claude\skills | Out-Null
   New-Item -ItemType Junction -Path C:\Users\TimeCraker\Desktop\my_workspace\vibe-studio\.claude\skills\narration -Target C:\Users\TimeCraker\Desktop\my_workspace\vibe-studio\skills\narration | Out-Null
   ```
3. README.md / CLAUDE.md 同步（改前 `git diff` 确认无并行未提交改动）：Skills 表 `narration` 行状态改「已上线」
4. 提交：`git add skills/narration README.md CLAUDE.md` → `feat(narration): SKILL.md 与路线图收尾 / skill doc and roadmap finalize`

---

## §4 总验收清单（Claude 复核用）

- [ ] `verify_narration.py` 对 example.json / 正例 fixture 退出 0
- [ ] 三例故障各自退出 1 且红项定位正确
- [ ] `output/narration-acceptance.md` 存在、结论 ALL GREEN、数值抽查一致
- [ ] Stage 0-3 各有规范提交；`git status` 无泄漏（本站零第三方依赖，应天然干净）
- [ ] SKILL.md / README / CLAUDE.md 同步（Stage 4 后）

## §5 参考资料

- 对齐对象：`skills/ppt/templates/verify.py`（校验器输出风格：逐项 OK/FAIL + 退出码）
- 契约下游：`docs/2026-08-29-video-motion-stage-spec.md` §2（cues.subtitles 消费段文本）、`docs/2026-08-29-auto-subtitle-stage-spec.md` §2（时间轴校准）
- 配音：剪映（市面产品，人工操作，无自动化环节——不建工具）
