# deck-video 第四站验收 · PPT 逐页成片

- **Spec**: `docs/2026-08-29-deck-video-stage-spec.md`
- **执行**: Zcode(GLM-5.3-Flash),2026-08-29
- **护栏核对**(§0):① `output/video-motion-acceptance.md` 末节「验收后修复」结论 **ALL GREEN** ✓ ② `ce76edc feat(video-motion): SKILL.md 与路线图收尾` 提交在 ✓ → 开工

---

## Stage 0 · 页图管线 — PASS

- 实现 `skills/video-motion/templates/remotion-app/scripts/extract_pages.py`(契约 2):COM `Presentations.Open(abs, True, False, False)` → `SaveAs(deck.pdf, 32)` → `Close()`+`Quit()`;fitz `get_pixmap(dpi=200)` 逐页存 `p-<N>.png`;全英文 print,异常退出码 1。
- 运行:`python scripts/extract_pages.py ../../../../output/vibe-studio-deck.pptx public/deck/pages` → 控制台 `pages=10 dpi=200 out=public/deck/pages`,退出码 0。
- 产物:`public/deck/pages/p-1.png … p-10.png` 共 10 张 + `deck.pdf` 中间产物(gitignored,不入 git)。
- 抽查(p-1、p-5 复制 `C:\pc\` 读图):均完整清晰页图,非空非黑、文字锐利;p-1 封面版式完整,p-5 WORKFLOW 五步列表与正文清晰可读。
- 像素尺寸:p-1 / p-5 均 **2667×1500**(预期约 2667×1500 ✓)。

**完成标志达成**:10 张页图齐全且抽查通过。
**提交**:`feat(deck-video): Stage 0 pptx 页图管线 / stage 0 pptx page extraction`

---

## Stage 1 · 口播稿与逐页配音 — PASS

- 写 `output/video-motion/deck-test/script.json`:28 段(每页 2-4 段),内容对页图真实内容负责(封面讲定位、内容页讲该页要点、尾页收束)。拆段理由:契约 4 字幕按「页内各段」摊时,首站 `SubtitleTrack` 为单行 nowrap 药丸,段剥后 ≤20 字才能单行可读;契约 3 原生支持页内多段句号连接聚合。
- `verify_narration.py` **全绿**:fail=0 warn=0;总剥后 368 字 ≈ 82.1s,vs 预算 94s(12.7% under,OK);无 AI 味词、无破折号、修饰词 0。
- 实现 `scripts/make_deck_audio.ps1`(契约 3):纯 ASCII 源(PS 5.1 无 BOM 按 ANSI 解析的坑),`[char]0x3002` 表示中文句号,音色按 `*Huihui*` 动态匹配(实际全名 `Microsoft Huihui Desktop - Chinese (Simplified)`)。
- 运行:10 页 → `public/deck/audio/page-1..10.wav` 全部生成,退出码 0。
  - 一次失败记录:`SetOutputToWaveFile($null)` 抛「path 不能为空字符串」→ 改 `SetOutputToNull()` 修复(第 1 次失败即定位修复,非同类连续失败)。
- **ffprobe 逐页时长(后续对账基准)**:

| 页 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| 秒 | 12.546 | 14.060 | 12.226 | 13.555 | 13.086 | 13.716 | 9.606 | 9.746 | 8.597 | 9.532 |

  合计 116.67s;Huihui 实际语速 ≈3.2 字/s(慢于 4.5 预估,页时长以实际音频为准,符合 spec)。

**完成标志达成**:稿全绿 + 10 个 wav 齐全。
**提交**:`feat(deck-video): Stage 1 分段稿与逐页配音 / stage 1 script and per-page audio`

### 插曲 · spec 矛盾修正(参数级,留痕)

Spec §2 称「.gitignore 已加 public/deck/」,实际 `.gitignore:15` 的 `public/deck/` 锚定仓库根,盖不住 `skills/video-motion/templates/remotion-app/public/deck/`——Stage 1 后 png/wav 全部处于未跟踪态(`?? public/`),存在误 add 泄漏风险(deck.pdf 仅被全局 `*.pdf` 误中)。按「参数级拍板修+留痕」惯例:补一行真实路径并提交 `fix(deck-video): gitignore 补 skill 内 public/deck/ 实际路径`;`git check-ignore` 复验三个产物路径全部命中。

---

## Stage 2 · 接线与元数据验证 — PASS

- 实现 `scripts/build-deck-params.mjs`(契约 4):ffprobe 逐页 wav 时长 → `pageSeconds = audioSeconds + 0.4` → `start` 累计 → `totalSeconds = Σ + 0.5`;字幕按剥后字数比例在页音频窗内线性摊时(剥离集与 verify_narration.py 一致);产出 `src/deck-params.ts` + `src/deck-cues.ts`(字段与首站 SubtitleCue 逐字段一致:start/end/text)。
- 生成结果:10 页、28 cues、`totalSeconds = 121.17`(手算对账:Σ音频 116.669 + 呼吸 4.0 + 交叠尾 0.5 = 121.169 ✓)。
- 实现 `src/DeckVideo.tsx`(契约 5):每页一个 Sequence(渲染窗 = pageSeconds + overlap 交叠尾),前 0.5s spring 淡入(damping 200)+ 24px 上浮、后 0.5s 淡出 → 相邻页交叉溶解;`<Img>` objectFit contain 铺满;`<Audio>` 在页 Sequence 内随页起止;顶层复用首站 `<SubtitleTrack cues={deckCues} />`(零改动)。
- `Root.tsx` 注册 `DeckVideo`(fps/width/height 取 deckParams,`durationInFrames = Math.round(121.17×30)`),仅追加不动首站注册项。
- **compositions 对账**:`DeckVideo 30 1920x1080 3635 (121.17 sec)`,3635 = round(121.17×30) ✓;首站 `FootageOverlay 60 2560x1440 1831` 未受影响 ✓。

**完成标志达成**:compositions 输出与 deck-params 对账一致。
**提交**:`feat(deck-video): Stage 2 逐页组合接线 / stage 2 per-page composition wiring`(58c5657)

---

## Stage 3 · 渲染 + 三级自验收 — ALL GREEN

渲染:`npx remotion render remotion/index.ts DeckVideo ../../../../output/video-motion/deck-test/deck.mp4 --crf=16` → `Encoded 3635/3635`,产物 15.8MB,退出码 0。

### L1 程序级 — PASS

| 项 | 期望 | 实际 | 结论 |
|---|---|---|---|
| 渲染退出码 | 0 | 0(3635/3635 帧) | PASS |
| ffprobe 时长 | 121.17±1s | 121.216s(差 0.046s) | PASS |
| 分辨率 | 1920×1080 | 1920×1080 | PASS |
| 帧率 | 30fps | 30/1 | PASS |
| 总帧数 | 3635 | 3635 | PASS |
| 音轨 | 有 | aac | PASS |
| compositions 对账 | 3635 帧 | 3635 (121.17 sec) | PASS |

### L2 抽帧 17 张 — PASS(帧 PNG 在 `output/video-motion/deck-test/frames/`,经 `C:\pc\` 读图)

页序(每页首帧+0.3s,10 帧):

| 帧 | 期望页 | 实际 | 结论 |
|---|---|---|---|
| f-9 | p1 封面 | p1 封面 + 字幕「这是 vibe-studio,开源内容车间。」 | PASS |
| f-397 | p2 | p2 定位三问 + 字幕「一个开源仓库,装做内容的手艺。」 | PASS |
| f-831 | p3 | p3 管线 + 字幕「左边进 README,右边出视频。」 | PASS |
| f-1210 | p4 | p4 理念对比 + 字幕「手拖文本框,改一处周围全破。」 | PASS |
| f-1629 | p5 | p5 工作流五步 + 字幕「说一句话,拿走一份 deck。」 | PASS |
| f-2033 | p6 | p6 质量三关 + 字幕「质量三道关。」 | PASS |
| f-2457 | p7 | p7 humanizer + 字幕「AI 写稿有机器味,爱用套话和破折号。」 | PASS |
| f-2757 | p8 | p8 演进时间轴 + 字幕「一周,30 个 commit,攒出这些能力。」 | PASS |
| f-3061 | p9 | p9 路线三卡 + 字幕「还剩两站:逐页动效,直出成片。」 | PASS |
| f-3331 | p10 | p10 深色尾页 + 字幕「把内容手艺写成代码。」 | PASS |

页序 p-1…p-10 依次出现,无跳页无重复。

页间交叠(5 帧):spec L2 括号「下页 start − 0.25s」与契约 5「交叠尾在页窗尾部」不符(交叠区实为 [下页 start, 下页 start+0.5]),按契约 5 以 **+0.25s** 抽样,并补双影峰值帧;参数级矛盾修正,留痕。

| 帧 | 时刻 | 实际 | 结论 |
|---|---|---|---|
| f-392 | 13.07s(p1→p2 叠影峰值) | p1「vibe-studio」大字与 p2「三个问题」两页叠影渐变清晰可见 | PASS |
| f-396 | 13.20s(p1→p2 中点) | p2 接管近稳态,溶解收尾 | PASS |
| f-381 | 12.70s(交叠区前段) | p1 淡出平滑 | PASS |
| f-2017 | 67.22s(交叠区前段) | p5 淡出平滑 | PASS |
| f-2032 | 67.72s(p5→p6 中点) | p6 接管 | PASS |

全程无黑帧。

字幕(3 帧):

| 帧 | 时刻 | 期望 | 实际 | 结论 |
|---|---|---|---|---|
| f-1326 | 44.2s(cue#11 start+0.3) | 「pptx 是二进制,git 看不懂。」在场 | 药丸显示该文本,页面稳态全亮 | PASS |
| f-3417 | 113.9s(cue#27 start+0.3) | 「仓库开源,MIT 协议,clone 就能用。」在场 | 药丸显示该文本 | PASS |
| f-819 | 27.3s(cue#6 end+0.3) | 字幕已退 | 画面无任何字幕(cue#7 27.41s 才入场) | PASS |

**观察说明(非缺陷)**:每页首帧+0.3s 抽样点处于淡入中间态(damping 200 spring 约 0.8 透明度,黑底透出致整帧偏灰),页序完全可辨;稳态帧(f-1326/f-3417)全亮清晰,证明灰为转场自然过程。

### L3 报告与提交边界

- 本报告即 L3 汇总,渲染/抽帧/报告均在 gitignored 区。
- Stage 3 无新增跟踪文件,按 spec 不提交。
- **首站文件零改动核对**:`git diff 91561a7..HEAD --stat -- fx/ cues.ts Demos.tsx FootageOverlay.tsx skills/{ppt,narration,auto-subtitle,humanizer}` 输出为空 ✓;本站 4 提交仅触及点名文件(Root.tsx 仅 +10 行注册)✓;`git status` 干净、无 public/deck/ 泄漏 ✓。
- 期间并行站 dad39ff / de01c8e 提交了各自 spec 文档(docs/ 下新增文件),与本站无交集。

### 结论

L1 七项 + L2 十八项(页序 10 + 交叠 5 + 字幕 3)全部 PASS,零红项。

**ALL GREEN**

---

## 待用户确认

Stage 0-3 已完成且自验收全绿;**Stage 4(SKILL.md 增「PPT 逐页成片」流程节 + README/CLAUDE.md 同步)按 spec 需用户确认验收后执行**。产物:`output/video-motion/deck-test/deck.mp4`(121.2s,1920×1080@30,15.8MB),建议看片后确认。

---

## Stage 4 · 收尾 — 完成(用户确认后执行)

- `skills/video-motion/SKILL.md` 增「**PPT 逐页成片(DeckVideo,第二种成片)**」节(Step 5 与边界与坑之间),五步:①pptx 与分段稿(verify_narration 全绿、每段 ≤20 字、ref 指页)②页图(extract_pages.py)③配音(测试 SAPI / 正式剪映同名 page-N.wav 下游无感)④接线与渲染(build-deck-params.mjs → DeckVideo,产物 `output/video-motion/<项目名>/`)⑤三级核查(含本站经验:交叠中点取下页 start+0.25s、页首帧+0.3s 偏灰是淡入中间态非缺陷)。
- README.md:27 video-motion 状态「已上线(首站)· 逐页成片开发中」→「已上线(双 spec 链接)」;CLAUDE.md 定位段「第二站 PPT 逐页成片开发中」→「首站与 PPT 逐页成片均已交付」。改前 `git diff` 核对:仅并行站遗留(Cover.tsx / cover-index.ts 未跟踪 + .gitignore 1 行,均非本站文件,不碰)。
- **提交**:`feat(deck-video): 流程文档与路线图收尾 / workflow doc and roadmap finalize`(32c5d00,仅 add 三点名文件)。

## §4 总验收清单复核

- [x] `output/video-motion/deck-test/deck.mp4` 存在,1920×1080@30,121.216s ≈ Σ(页音频 116.67)+呼吸 4.0+交叠尾 0.5
- [x] L2 抽帧表全 PASS(页序 10 + 交叠 5 + 字幕 3)
- [x] 本验收文件 ALL GREEN 且与产物一致
- [x] Stage 0-2 规范提交可追溯(46f065a / b0511ee / 58c5657 + 插曲 fix 8e23823);`git status` 无 public/deck/ 泄漏
- [x] 首站文件(FootageOverlay / cues / fx/* / Demos)零改动(`git diff 91561a7..HEAD --stat` 专项核对为空)
- [x] SKILL.md 增节 + README/CLAUDE.md 同步(32c5d00)




