# narration 第三站 · 验收留痕

- **日期**：2026-08-29
- **执行者**：Zcode（GLM-5.3-Flash），vibe-studio 仓库内
- **Spec**：`docs/2026-08-29-narration-stage-spec.md`
- **产物**：`skills/narration/`（工具，进 git）+ `output/narration/`（测试产物，gitignore）

## 进度总览

| Stage | 内容 | 状态 | 提交 |
|---|---|---|---|
| 0 | 骨架 | ✅ 完成 | `132d449` |
| 1 | 分段稿校验器 | ✅ 完成 | `9e625d0` |
| 2 | 正例 + 故障注入 | ✅ 完成 | `ab9b69c`（空提交，产物在 gitignore 的 output/，沿用 auto-subtitle 站先例） |
| 3 | 三级自验收 | ✅ 完成 | `236b755` |
| 4 | 沉淀与收尾 | ✅ 完成（SKILL.md 含追加要求「讲稿解读下钻到细节层」；junction 已建；README/CLAUDE.md 已同步） | `14d82da` |

---

## Stage 0 · 骨架

- 建 `skills/narration/SKILL.md`（占位）、`skills/narration/templates/`、`output/narration/`
- 提交只 `git add skills/narration`，工作树无泄漏

## Stage 1 · 校验器

- `templates/verify_narration.py`：纯 stdlib（json/re/sys/argparse），CLI `--cps` / `--budget-seconds` 覆盖 meta；print 全英文，文件读写显式 utf-8；输出风格对齐 `skills/ppt/templates/verify.py`（逐段 `[OK]/[WARN]/[FAIL]` + 汇总 + 退出码）
- `templates/script.example.json`：与正例 fixture 同源拷贝
- 完成标志：example 校验退出 0 ✅（输出见 L1）

## Stage 2 · 正例 + 故障注入

- 正例 `output/narration/script-cs2.json`：8 段文本照 spec 给死抄录 → 退出 0，8 行 OK，总 18.4s vs 22s 预算
- fault-1（段 3 改 25 字长句）→ 退出 1，红项定位段 3 `oversize 25>20`
- fault-2（budgetSeconds 改 15）→ 退出 1，红项定位 budget 检查
- fault-3（段 6 插入 `——`）→ 退出 1，红项定位段 6 `em-dash banned`
- 冒烟（spec 矩阵外的实现合理性验证）：`smoke-voiceover-warn.json` → voiceover 35 字不查段长只计时长（7.8s）✓；「首先」命中 AI 腔词表 WARN ✓；修饰密度 20.4/千字 > 12 触发全局 WARN ✓；退出 0（仅 WARN 无 FAIL）

---

## Stage 3 · 三级自验收

### L1 程序级 · 退出码矩阵

| # | 命令 | 预期 | 实际 | 红项定位 |
|---|---|---|---|---|
| 1 | `python …/verify_narration.py skills/narration/templates/script.example.json` | 0 | **0** | — |
| 2 | `python …/verify_narration.py output/narration/script-cs2.json` | 0 | **0** | — |
| 3 | `python …/verify_narration.py output/narration/fault-1.json` | 1 | **1** | 段 3 `oversize 25>20` ✅ |
| 4 | `python …/verify_narration.py output/narration/fault-2.json` | 1 | **1** | budget `exceeds 15.0s by 22.7%` ✅ |
| 5 | `python …/verify_narration.py output/narration/fault-3.json` | 1 | **1** | 段 6 `em-dash banned` ✅ |

### L2 数值核对（独立复核，不复用校验器正则）

复核脚本 `output/narration/l2_recheck.py` 按逐字符判断独立实现剥离计数，结果与校验器输出逐项一致：

| 段 | 文本 | 手算字数 | 手算秒数 | 程序输出 | 一致 |
|---|---|---|---|---|---|
| 1 | 这一局我们打 B 区。 | 8 | 8/4.5 = 1.8s | chars=8 sec=1.8 | ✅ |
| 8 | 回合胜利，三杀拿下 MVP。 | 11（MVP 计 3） | 11/4.5 = 2.4s | chars=11 sec=2.4 | ✅ |
| 合计 | 8 段 | 83 | 18.4s | total 18.4s | ✅ |
| fault-1 段 3 | 25 字 | 25 | 5.6s | chars=25 sec=5.6 | ✅ |
| fault-2 偏差 | (18.4−15)/15 | — | 22.7% > 10% | by 22.7% | ✅ |

与 spec 手算稿的差异（spec 侧笔误，程序与独立复核一致为准）：

- 段 1 spec 写「剥后 9 字 → 2.0s」，实际剥后 **8 字 → 1.8s**（9 字是含句号的数法，剥离规则不含标点）
- 总秒数 spec 写「≈21s」，按给死文本实为 **18.4s**（83 字）；「≈21s」是未实际数数的估计
- fault-2 spec 写「超预算 40%」（基于其 21s 估计），按给死文本实为 **22.7%**，仍远超 10% 阈值，红项成立

### L3 · 命令完整输出

**① example.json（EXIT=0）**

```
[OK] id=1 kind=subtitle chars=8 sec=1.8 text=这一局我们打 B 区。
[OK] id=2 kind=subtitle chars=11 sec=2.4 text=上隧道推进，队友先顶出去。
[OK] id=3 kind=subtitle chars=12 sec=2.7 text=B 口接火，配合队友直接双杀。
[OK] id=4 kind=subtitle chars=8 sec=1.8 text=进 B 换弹，准备下包。
[OK] id=5 kind=subtitle chars=12 sec=2.7 text=平台安放 C4，同时留意回防。
[OK] id=6 kind=subtitle chars=10 sec=2.2 text=包已下好，四十秒倒计时。
[OK] id=7 kind=subtitle chars=11 sec=2.4 text=卡住方向守包，等对手来撞。
[OK] id=8 kind=subtitle chars=11 sec=2.4 text=回合胜利，三杀拿下 MVP。
budget: total 18.4s vs budget 22.0s (16.4% under, OK)
modifiers: 0 hits, 0.0/1000 chars, OK
SUMMARY: fail=0 warn=0 | total 18.4s vs budget 22.0s
RESULT: PASS
```

**② script-cs2.json 正例（EXIT=0）**：输出与 ① 逐行相同（同源文件）。

**③ fault-1.json（EXIT=1，段长 FAIL）**

```
[OK] id=1 kind=subtitle chars=8 sec=1.8 text=这一局我们打 B 区。
[OK] id=2 kind=subtitle chars=11 sec=2.4 text=上隧道推进，队友先顶出去。
[FAIL] id=3 kind=subtitle chars=25 sec=5.6 text=B 口接火的瞬间配合队友直接完成双人击杀顺势拿下回合。 | oversize 25>20
[OK] id=4 kind=subtitle chars=8 sec=1.8 text=进 B 换弹，准备下包。
[OK] id=5 kind=subtitle chars=12 sec=2.7 text=平台安放 C4，同时留意回防。
[OK] id=6 kind=subtitle chars=10 sec=2.2 text=包已下好，四十秒倒计时。
[OK] id=7 kind=subtitle chars=11 sec=2.4 text=卡住方向守包，等对手来撞。
[OK] id=8 kind=subtitle chars=11 sec=2.4 text=回合胜利，三杀拿下 MVP。
budget: total 21.3s vs budget 22.0s (3.2% under, OK)
modifiers: 0 hits, 0.0/1000 chars, OK
SUMMARY: fail=1 warn=0 | total 21.3s vs budget 22.0s
RESULT: FAIL
```

**④ fault-2.json（EXIT=1，时长对账 FAIL）**

```
[OK] id=1 kind=subtitle chars=8 sec=1.8 text=这一局我们打 B 区。
[OK] id=2 kind=subtitle chars=11 sec=2.4 text=上隧道推进，队友先顶出去。
[OK] id=3 kind=subtitle chars=12 sec=2.7 text=B 口接火，配合队友直接双杀。
[OK] id=4 kind=subtitle chars=8 sec=1.8 text=进 B 换弹，准备下包。
[OK] id=5 kind=subtitle chars=12 sec=2.7 text=平台安放 C4，同时留意回防。
[OK] id=6 kind=subtitle chars=10 sec=2.2 text=包已下好，四十秒倒计时。
[OK] id=7 kind=subtitle chars=11 sec=2.4 text=卡住方向守包，等对手来撞。
[OK] id=8 kind=subtitle chars=11 sec=2.4 text=回合胜利，三杀拿下 MVP。
[FAIL] budget: total 18.4s exceeds budget 15.0s by 22.7% (limit 10%)
modifiers: 0 hits, 0.0/1000 chars, OK
SUMMARY: fail=1 warn=0 | total 18.4s vs budget 15.0s
RESULT: FAIL
```

**⑤ fault-3.json（EXIT=1，破折号 FAIL）**

```
[OK] id=1 kind=subtitle chars=8 sec=1.8 text=这一局我们打 B 区。
[OK] id=2 kind=subtitle chars=11 sec=2.4 text=上隧道推进，队友先顶出去。
[OK] id=3 kind=subtitle chars=12 sec=2.7 text=B 口接火，配合队友直接双杀。
[OK] id=4 kind=subtitle chars=8 sec=1.8 text=进 B 换弹，准备下包。
[OK] id=5 kind=subtitle chars=12 sec=2.7 text=平台安放 C4，同时留意回防。
[FAIL] id=6 kind=subtitle chars=10 sec=2.2 text=包已下好——四十秒倒计时。 | em-dash banned
[OK] id=7 kind=subtitle chars=11 sec=2.4 text=卡住方向守包，等对手来撞。
[OK] id=8 kind=subtitle chars=11 sec=2.4 text=回合胜利，三杀拿下 MVP。
budget: total 18.4s vs budget 22.0s (16.4% under, OK)
modifiers: 0 hits, 0.0/1000 chars, OK
SUMMARY: fail=1 warn=0 | total 18.4s vs budget 22.0s
RESULT: FAIL
```

---

## 执行期决策留痕（spec 偏差，参数级拍板）

**时长对账按单向「超预算」判定，低于预算不罚。** 依据：① spec 字面的双向「偏差 >10%」会让自带正例必红（18.4s vs 22s 偏差 16.4%），与 Stage 2「退出 0、8 行 OK」直接矛盾，spec 无法自洽；② fault-2 注释「总 21s **超预算** 40%」的措辞即单向语义；③ §2「要给画面留呼吸，一般 ≤ 素材时长的 75%」——budgetSeconds 是上限，低于预算是设计意图（留白）不是缺陷。实现：`(total − budget) / budget > 10%` 才 FAIL；输出仍完整打印 under/over 百分比供对账。

## 结论

**ALL GREEN** —— L1 退出码矩阵 5/5 符合预期、L2 数值独立复核逐项一致、L3 报告落盘。Stage 0-3 各有规范提交，`git status` 无泄漏。待用户确认后执行 Stage 4（SKILL.md + junction + README/CLAUDE.md 同步）。
