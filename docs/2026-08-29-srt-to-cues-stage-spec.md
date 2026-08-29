# 2026-08-29 · srt-to-cues Stage Spec — 剪映 SRT 直转 SubtitleCue（auto-subtitle 手动线补全）

> 执行者：Zcode（GLM-5.3-Flash）。本 spec 自包含，无需会话上下文。
> 复核：Claude（spec §4）→ 用户终审。

## §0 规则与护栏

- **定位一句话**：auto-subtitle 的主路径已定为「剪映识别 + 导出 SRT」的人工线，本站补上 SRT → SubtitleCue 转换器，让手动线即刻接通 video-motion。
- **并行施工**：deck-video 站正在 `skills/video-motion/` 施工。本站只动 `skills/auto-subtitle/`、`output/auto-subtitle-tests/srt/`、`output/srt-to-cues-acceptance.md`。提交只 `git add` 上述路径内文件，禁 `git add -A` / `git commit -a`。
- **人工时间轴神圣不可改写**：转换器只做格式转换与校验，不合并、不切分、不吸附、不微调时间——剪映导出的时间是人工校准结果。
- 控制台 print 全英文（GBK 控制台）；文件读写显式编码。
- 连续 2 轮同一红项 → 停下出报告，禁盲调；发现 spec 自身矛盾 → 停下报告，不自行改契约。

## §1 环境事实（已核实）

| 项 | 事实 |
|---|---|
| 系统 | Windows 11，PowerShell；Python 3.11.9 全局在 PATH |
| 仓库根 | `C:\Users\TimeCraker\Desktop\my_workspace\vibe-studio` |
| 脚本落位 | `skills/auto-subtitle/templates/asr/`（与 transcribe.py 同目录，纯标准库，无需 venv） |
| schema 权威 | 同目录 `transcribe.py` 的 cues.json 输出（`{"subtitles": [{"start", "end", "text"}]}`，秒、3 位小数） |
| 真实夹具 | `output/auto-subtitle-tests/fixture-zh.srt`（9 条，词级对齐后的成品，已存在） |

## §2 契约

### CLI

```
python skills/auto-subtitle/templates/asr/srt_to_cues.py <in.srt> [--outdir DIR]
```

输出 `<stem>.cues.json`（默认输入旁），与 transcribe.py 输出**逐字同 schema**：`ensure_ascii=False`、`indent=2`、键序 start/end/text、秒 `round(x, 3)`。

### 解析规则

- 块按空行分隔。首行纯数字 = 序号，**跳过不校验连续性**（容忍重编号）；时间行匹配 `HH:MM:SS,mmm --> HH:MM:SS,mmm`，毫秒分隔符 `,` 或 `.` 都接受；其余为文本行，多行合并：行间以空格 join 后 `re.sub(r"\s+", " ", ...)` 规整首尾去空白。
- 读文件：先 `utf-8-sig`；UnicodeDecodeError 则 GBK 重读。stdout 摘要注明实际编码。
- 校验（违反即 exit 1 并打印英文错误行；全过 exit 0）：
  - 每条 `start < end`；
  - 相邻条 `start` 单调不减；
  - 输入文件不存在 / 解析后 0 条有效 → exit 1。
- **WARN 不 FAIL**：相邻条时间重叠（`start_i < end_{i-1}`，剪映常有意重叠）；空文本块跳过并计数。
- 摘要行（一行英文）：`cues=N skipped=M warn_overlaps=K encoding=utf-8|gbk out=<abs path>`

## §3 任务分 Stage

### Stage 0 · 实现

实现脚本。完成标准：`python srt_to_cues.py --help` 正常；对 `output/auto-subtitle-tests/fixture-zh.srt` 跑通 exit 0、产出 9 条。
commit：`feat(auto-subtitle): srt_to_cues.py 剪映 SRT 直转 SubtitleCue / srt-to-cues converter for the manual line`

### Stage 1 · 夹具三连

在 `output/auto-subtitle-tests/srt/` 下建三个夹具并全部跑转换：

1. `normal.srt` — 逐字复制 fixture-zh.srt 全文（真产物基准）。
2. `multiline.srt` — 手写 4 条，每条文本占 2 行。
3. `edge.srt` — 手写 4 条：带 UTF-8 BOM、毫秒用 `.` 分隔、序号写成 1/3/3/7（乱序重编号）。

完成标准：三次全 exit 0，cues.json 落位。

### Stage 2 · 三级自验收（停下等确认）

- **L1 程序级**：normal.srt 产物的时间戳与输入**逐条精确相等**（写一次性比对片段：重新序列化 cues.json 的 start/end 与源 SRT 时间戳比对，3 位小数后全等）；键名与 transcribe.py 输出同名同序。
- **L2 行为级**：multiline 产物文本为单行、无换行残留；edge 产物无 BOM 字符混入文本、时间解析正确（`.` 分隔与 `,` 等价）。
- **L3 报告**：`output/srt-to-cues-acceptance.md`（夹具清单、命令、L1/L2 结果、遗留）。出完报告停下等用户确认。

### Stage 3 · 收尾（用户确认后才做）

- `skills/auto-subtitle/SKILL.md`：Step 4 交付节内加「剪映 SRT 手动线」小段（≤4 行）：剪映识别字幕 → 导出 SRT → `python srt_to_cues.py <srt>` → cues.json 直接粘 video-motion；人工时间轴不改写是底线。frontmatter description 追加触发词「SRT 转 cues / 剪映字幕导入」。
- `README.md` Skills 表 auto-subtitle 行补「亦吃剪映导出 SRT 直转」。
- commit：`docs(auto-subtitle): SKILL.md 增剪映 SRT 手动线 / document the manual SRT line`

## §4 验收清单（Claude 复核用）

- [ ] 三夹具 exit 0；normal 时间戳逐条精确相等（无任何自动改时间）
- [ ] cues.json 与 transcribe.py 输出 schema 同名同序
- [ ] BOM / `.` 毫秒 / 乱序序号 / 多行文本四个边界全吃下
- [ ] GBK 控制台全程英文输出
- [ ] `git show --stat` 只含本站文件

## §5 参考

- 输出格式权威：`skills/auto-subtitle/templates/asr/transcribe.py`
- 手动线决策背景：`skills/auto-subtitle/SKILL.md` 边界节、`docs/2026-08-29-auto-subtitle-stage-spec.md`
