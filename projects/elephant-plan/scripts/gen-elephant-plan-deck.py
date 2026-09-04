# -*- coding: utf-8 -*-
"""elephant-e-ai 2a 冲刺两人并行排期图（2 页）。

数据源：docs/openspec-sdd-plan.md §2 依赖表（origin/master 22c5ba4，2026-09-04）
+ 本工作会话的分工结论。受众：2 人开发团队（内行），用于快速迭代对照。
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from primitives import (  # noqa: E402
    CREAM, FONT_CN, FONT_MONO, INK, INK_SOFT, LINE, MUTED, PAPER,
    PP_ALIGN, MSO_ANCHOR, Inches, Pt, add_slide, box, check_fit,
    new_deck, page_chrome, text, use_theme,
)

use_theme("tech")

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "elephant-2a-plan.pptx")

# ── 通用卡片：标题(13 bold) + 描述(11) ────────────────────────────────
def card(s, x, y, w, h, title, desc, border, fill=CREAM, desc_color=INK_SOFT,
         title_color=INK, star=None):
    box(s, Inches(x), Inches(y), Inches(w), Inches(h), fill=fill, line=border)
    lines = [(title, 13, title_color, True)]
    for d in (desc if isinstance(desc, list) else [desc]):
        lines.append((d, 11, desc_color, False))
    for d in (desc if isinstance(desc, list) else [desc]):
        check_fit(d, 11, w - 0.16, h - 0.42, label="desc")
    text(s, Inches(x + 0.08), Inches(y + 0.07), Inches(w - 0.16), Inches(h - 0.14),
         lines, anchor=MSO_ANCHOR.MIDDLE, spacing=1.05)
    if star:
        text(s, Inches(x + w - 0.5), Inches(y - 0.16), Inches(0.5), Inches(0.24),
             star, size=11, color=MUTED, align=PP_ALIGN.RIGHT)


def vbar(s, x, y0, y1, color=None):
    assert y1 > y0, f"vbar negative height: {y0} -> {y1}"  # PowerPoint 判损坏的红线
    box(s, Inches(x - 0.015), Inches(y0), Inches(0.03), Inches(y1 - y0), fill=color or MUTED)


def hbar(s, x0, x1, y, color=None):
    box(s, Inches(x0), Inches(y - 0.015), Inches(x1 - x0), Inches(0.03), fill=color or MUTED)


prs = new_deck()

# ══ 第 1 页：两人并行总图 ═══════════════════════════════════════════
s = add_slide(prs)
page_chrome(s, 1, "elephant-e-ai · 2a 冲刺排期")
text(s, Inches(0.55), Inches(0.66), Inches(12.2), Inches(0.5),
     "两人并行总图：从今天到账号运营三页", size=30, color=INK, bold=True)
text(s, Inches(0.55), Inches(1.22), Inches(12.2), Inches(0.3),
     "依赖取自 docs/openspec-sdd-plan.md §2 · 基线 origin/master 22c5ba4 · 2026-09-04",
     size=11, color=MUTED)

BX, BW = 0.75, 3.7          # B 线列
AX, AW = 5.35, 7.4          # A 线列
R0, R1, R2, R3 = 2.05, 3.35, 4.65, 5.95
CH = 0.95

text(s, Inches(BX), Inches(1.62), Inches(BW), Inches(0.28),
     "B 线 · 你（executor / ETS）", size=13, color="274CA0", bold=True)
text(s, Inches(AX), Inches(1.62), Inches(AW), Inches(0.28),
     "A 线 · 队友（数据 / 平台底座）", size=13, color="9C4F37", bold=True)

# tech 主题下用主蓝/深蓝区分两线；弹性件用灰
B_COLOR, A_COLOR = "3B6FE0", "9C4F37"

card(s, BX, R0, BW, CH, "2-6 · 执行器指令通道",
     ["无前置依赖，简报已备，今天开工", "WS 指令通道 + 浏览器池"], B_COLOR)
card(s, BX, R1, BW, CH, "弹性件 · 空窗期消化",
     ["1-6 密钥托管（须赶在 2-10 前）", "2-5 审计待办（4-20 前落地）"], MUTED, fill=PAPER)
card(s, BX, R2, BW, CH, "2-12 · ETS 批量导入",
     ["★同步点1：等 A 线交 2-10 / 2-11", "2a 硬门禁最后一环"], B_COLOR)

card(s, AX, R0, AW, CH, "1-4 · 租户上下文",
     ["最小版：agent_id 注入 + 跨租户 403 · 一锁锁一串，先解锁 2-1"], A_COLOR)
card(s, AX, R1, AW, CH, "2-1 · 主数据实体补齐",
     ["2a 全套 + 大半 L3 页面的地基 · 阶段 2 几乎都等它"], A_COLOR)

TW, TG = 2.347, 0.18        # A 线三并列卡
for i, (t, d) in enumerate([
    ("2-10 · 卡池", ["须先落地 1-6", "属 2a 硬门禁"]),
    ("2-11 · 花名册", ["只依赖 2-1 · 拖期可转 B"]),
    ("4-1 · 工作台 BFF", ["通了 4-x 页才能连后端"]),
]):
    card(s, AX + i * (TW + TG), R2, TW, CH, t, d, A_COLOR)

# 汇合卡（主色反白）
box(s, Inches(2.6), Inches(R3), Inches(9.0), Inches(0.85), fill=B_COLOR)
text(s, Inches(2.76), Inches(R3 + 0.08), Inches(8.7), Inches(0.7),
     [("4-20 · 账号运营三页（卡池 / 花名册 / 导入任务）— 对照原型交付", 13, "FFFFFF", True),
      ("★同步点2：两线在此合流 · 前置 2-5 已由弹性件消化", 11, "FFFFFF", False)],
     anchor=MSO_ANCHOR.MIDDLE, spacing=1.05)

# 连接线
bc, ac = BX + BW / 2, AX + AW / 2
vbar(s, bc, R0 + CH, R1)            # 2-6 → 弹性件
vbar(s, bc, R1 + CH, R2)            # 弹性件 → 2-12
vbar(s, bc, R2 + CH, R3)            # 2-12 → 4-20
vbar(s, ac, R0 + CH, R1)            # 1-4 → 2-1
TEE = R1 + CH + (R2 - R1 - CH) / 2  # 三岔口取 2-1 底与三卡顶的中点
vbar(s, ac, R1 + CH, TEE)           # 2-1 ↓ 三岔口
centers = [AX + i * (TW + TG) + TW / 2 for i in range(3)]
hbar(s, centers[0], centers[2], TEE)               # 三岔横杆
for c0 in centers:
    vbar(s, c0, TEE, R2)                            # 三落点
    vbar(s, c0, R2 + CH, R3)                       # 三卡 → 4-20

# ══ 第 2 页：盯三件事 ═══════════════════════════════════════════════
s = add_slide(prs)
page_chrome(s, 2, "elephant-e-ai · 2a 冲刺排期")
text(s, Inches(0.55), Inches(0.66), Inches(12.2), Inches(0.5),
     "盯这三件事，其余都可排后", size=30, color=INK, bold=True)
text(s, Inches(0.55), Inches(1.22), Inches(12.2), Inches(0.3),
     "两线各自动，见面只在两个同步点 · 9 月中 2a 硬提交为锚点", size=11, color=MUTED)

CW2, CH2 = 5.9, 2.35
cards = [
    (0.75, 1.75, "① 关键路径在 A 线", [
        ("1-4 → 2-1 → 2-10 → 2-12 → 4-20", None, None, None),
        ("共 5 步最长，队友这条线不能窝工；", 11, INK_SOFT, False),
        ("B 线的 2-6 时间宽裕，空窗正好消化弹性件。", 11, INK_SOFT, False),
    ]),
    (6.95, 1.75, "② 两个硬同步点", [
        ("★1 · 2-12 开工前：B 的 2-6 + A 的 2-10 / 2-11 三方汇齐；", 11, INK_SOFT, False),
        ("★2 · 4-20 开工前：上图全部 + 2-5 审计待办落地。", 11, INK_SOFT, False),
        ("其余时间两线互不等待，从第一天起真并行。", 11, INK_SOFT, False),
    ]),
    (0.75, 4.35, "③ 风险与预案", [
        ("2-1 拖期 → B 线弹性件做完后接手 2-11 花名册", 11, INK_SOFT, False),
        ("（只依赖 2-1，不绑定 A 线本人）；", 11, INK_SOFT, False),
        ("1-6 必须赶在 2-10 之前，别让它卡进关键路径。", 11, INK_SOFT, False),
    ]),
    (6.95, 4.35, "④ 明确暂缓（防蔓延）", [
        ("2-2 MCP · 2-3 企微发群 · 2-4 成绩模板 · R3 布置全套", 11, INK_SOFT, False),
        ("等 9 月中 2a 硬提交完成后再排期。", 11, INK_SOFT, False),
    ]),
]
for x, y, title, lines in cards:
    box(s, Inches(x), Inches(y), Inches(CW2), Inches(CH2), fill=CREAM, line=LINE)
    text(s, Inches(x + 0.18), Inches(y + 0.16), Inches(CW2 - 0.36), Inches(0.35),
         title, size=19, color=INK, bold=True)
    rendered = []
    for ln in lines:
        t, sz, cl, b = ln
        if sz is None:  # mono 链路行
            rendered.append((t, 13, "274CA0", True))
        else:
            rendered.append((t, sz, cl, b))
    text(s, Inches(x + 0.18), Inches(y + 0.62), Inches(CW2 - 0.36), Inches(CH2 - 0.78),
         rendered, spacing=1.25)

prs.save(os.path.normpath(OUT))
print("OK saved:", os.path.normpath(OUT))
