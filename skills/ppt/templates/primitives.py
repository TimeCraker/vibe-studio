# -*- coding: utf-8 -*-
"""
ppt primitives — python-pptx 代码画 PPT 的积木箱
用法：复制本文件改造，或 import 后组装。数据区放项目事实（Step 1 取材结果）。

坐标约定：16:9（13.333 × 7.5 in）· 边距 0.55 · 页码 (12.35, 7.02)
"""
import math

from pptx import Presentation
from pptx.chart.data import CategoryChartData
from pptx.dml.color import RGBColor
from pptx.enum.chart import XL_CHART_TYPE, XL_LABEL_POSITION
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
from pptx.util import Emu, Inches, Pt

# ── 色板（5+1 封闭系统；有项目品牌色则整体替换）────────────────────────
CORAL = "CC785C"       # 主色：强调条 / 关键数字 / 反色块
CORAL_DEEP = "9C4F37"  # 主色深：标题强调
CREAM = "FAF6F0"       # 底色：卡片斑马纹 / 次级底
PAPER = "FFFFFF"       # 纸白：卡片默认底
INK = "1C1917"         # 墨：正文标题
INK_SOFT = "57534E"    # 墨浅：正文
MUTED = "78716C"       # 灰：注释 / 页码（stone-500，白底 4.8:1 达 AA；暗底换 PAPER）
LINE = "E7E0D8"        # 线：卡片描边 / 分隔线

FONT_CN = "Microsoft YaHei"
FONT_MONO = "Consolas"
SW, SH = Inches(13.333), Inches(7.5)
MARGIN = 0.55

C = RGBColor.from_string  # hex -> RGBColor

# ── 数据区（Step 1 取材结果，每项必须有出处）───────────────────────────
META = {
    "title": "PROJECT NAME",
    "subtitle": "项目说明 · Project Brief",
    "date": "YYYY-MM-DD",
    "author": "",
}


def new_deck():
    prs = Presentation()
    prs.slide_width, prs.slide_height = SW, SH
    return prs


def add_slide(prs):
    return prs.slides.add_slide(prs.slide_layouts[6])  # blank


def box(slide, x, y, w, h, fill=None, line=None):
    """矩形块：底色 + 描边（fill/line 是 hex 字符串，None = 透明）"""
    sp = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, x, y, w, h)
    if fill:
        sp.fill.solid(); sp.fill.fore_color.rgb = C(fill)
    else:
        sp.fill.background()
    if line:
        sp.line.color.rgb = C(line); sp.line.width = Pt(0.75)
    else:
        sp.line.fill.background()
    sp.shadow.inherit = False
    return sp


def text(slide, x, y, w, h, content, size=13, color=INK, bold=False,
         align=PP_ALIGN.LEFT, font=FONT_CN, anchor=MSO_ANCHOR.TOP, spacing=1.0):
    """文本框。content: str | [str] | [(text, size, color, bold), ...]
    size 传 None 则用全局 size（tuple 项里各自覆盖）"""
    tb = slide.shapes.add_textbox(x, y, w, h)
    tf = tb.text_frame
    tf.word_wrap = True
    tf.vertical_anchor = anchor
    lines = content if isinstance(content, list) else [content]
    for i, line in enumerate(lines):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = align
        p.line_spacing = spacing
        if isinstance(line, tuple):
            t, s, cl, b = line
        else:
            t, s, cl, b = line, size, color, bold
        r = p.add_run(); r.text = t
        r.font.size = Pt(s or size)
        r.font.color.rgb = C(cl)
        r.font.bold = b
        r.font.name = font
    return tb


def check_fit(content, size, w_in, h_in, spacing=1.0, label=""):
    """生成侧溢出预警：字符宽估算（中文≈1.0em / ASCII≈0.55em）× 雅黑行高 1.35em。
    保守估算而非精确排版，预警即拆行/拆页/砍字；最终以 Step 4 渲染核查为准。"""
    lines = content if isinstance(content, list) else [content]
    n = 0
    for ln in lines:
        t = ln if isinstance(ln, str) else ln[0]
        units = sum(1.0 if ord(ch) > 0x2E80 else 0.55 for ch in t)
        n += max(1, math.ceil(units * size / 72 / max(w_in - 0.2, 0.1)))  # 扣文本框左右 inset
    need = n * size * 1.35 * spacing / 72
    if need > h_in + 0.02:
        print(f"[FIT-WARN] {label or lines[0][:12]}: need {need:.2f}in > box {h_in:.2f}in ({n} lines)")
        return False
    return True


def page_chrome(slide, idx, label):
    """每页统一 chrome：顶部 coral 短杠 + 章节 label + 右下页码 + 底部细线"""
    box(slide, Inches(MARGIN), Inches(0.5), Inches(0.28), Inches(0.055), fill=CORAL)
    text(slide, Inches(MARGIN + 0.4), Inches(0.38), Inches(8), Inches(0.3),
         label.upper(), 10, MUTED, True)
    text(slide, Inches(12.35), Inches(7.02), Inches(0.7), Inches(0.3),
         f"{idx:02d}", 10, MUTED, align=PP_ALIGN.RIGHT)
    box(slide, Inches(MARGIN), Inches(7.18), Inches(13.333 - 2 * MARGIN),
        Emu(9525), fill=LINE)


# ── 页面范式（组合优于发明；坐标用表达式算，不写魔法数）───────────────
def slide_cover(prs, meta):
    s = add_slide(prs)
    box(s, 0, 0, SW, SH, fill=CREAM)
    box(s, Inches(10.2), 0, Inches(3.133), SH, fill=CORAL)          # 右侧竖色块
    box(s, Inches(9.85), Inches(2.1), Inches(0.35), Inches(0.07), fill=INK)
    text(s, Inches(0.9), Inches(1.55), Inches(5), Inches(0.4),
         meta.get("kicker", "PROJECT BRIEF").upper(), 13, CORAL, True)
    text(s, Inches(0.9), Inches(2.15), Inches(8.6), Inches(2.2),
         [(meta["title"], 54, INK, True), (meta["subtitle"], 17, INK_SOFT, False)], spacing=1.05)
    box(s, Inches(0.95), Inches(4.45), Inches(2.2), Emu(19050), fill=CORAL)  # 分隔粗线
    text(s, Inches(0.9), Inches(4.85), Inches(8.4), Inches(1.6),
         [(meta.get("tagline", ""), 13, INK_SOFT, False),
          (f'{meta.get("domain", "")}    {meta.get("version", "")}    {meta["date"]}    {meta["author"]}',
           11, MUTED, False)], spacing=1.4)
    return s


def slide_cards(prs, idx, label, title, cards, cols=4, card_h=3.6):
    """1×cols 卡片页：cards = [(题, '描述行1\\n描述行2'), ...]"""
    s = add_slide(prs); page_chrome(s, idx, label)
    text(s, Inches(MARGIN), Inches(0.95), Inches(12.2), Inches(0.7), title, 30, INK, True)
    gap = 0.2
    card_w = (13.333 - 2 * MARGIN - gap * (cols - 1)) / cols
    for i, (t, d) in enumerate(cards):
        x = Inches(MARGIN + i * (card_w + gap))
        box(s, x, Inches(2.55), Inches(card_w), Inches(card_h), fill=PAPER, line=LINE)
        box(s, x, Inches(2.55), Inches(card_w), Inches(0.07), fill=CORAL)     # 顶 coral 条
        text(s, x + Inches(0.25), Inches(2.9), Inches(card_w - 0.5), Inches(0.5), t, 19, INK, True)
        text(s, x + Inches(0.25), Inches(3.55), Inches(card_w - 0.4), Inches(2.4),
             d.split("\n"), 11.5, INK_SOFT, spacing=1.5)
    return s


def slide_numbers(prs, idx, label, title, nums, cols=3):
    """大数字墙：nums = [(数字, 标签, 注释), ...]，2 行 × cols"""
    s = add_slide(prs); page_chrome(s, idx, label)
    text(s, Inches(MARGIN), Inches(0.95), Inches(12.2), Inches(0.7), title, 30, INK, True)
    rows = (len(nums) + cols - 1) // cols
    gap = 0.28
    card_w = (13.333 - 2 * MARGIN - gap * (cols - 1)) / cols
    card_h = 2.0
    for i, (n, t, d) in enumerate(nums):
        row, col = divmod(i, cols)
        x = Inches(MARGIN + col * (card_w + gap))
        y = Inches(2.1 + row * (card_h + 0.3))
        box(s, x, y, Inches(card_w), Inches(card_h), fill=PAPER, line=LINE)
        text(s, x + Inches(0.28), y + Inches(0.22), Inches(card_w - 0.6), Inches(0.9),
             n, 40, CORAL_DEEP, True)
        text(s, x + Inches(0.3), y + Inches(1.18), Inches(card_w - 0.6), Inches(0.35), t, 13, INK, True)
        text(s, x + Inches(0.3), y + Inches(1.55), Inches(card_w - 0.55), Inches(0.35),
             d, 9.5, MUTED, font=FONT_MONO)
    return s


def slide_chain(prs, idx, label, title, nodes, hi=2, sub_title=None, subs=None):
    """横向链路图：nodes = [(名称, 子注释), ...]，hi = 反色强调的节点下标"""
    s = add_slide(prs); page_chrome(s, idx, label)
    text(s, Inches(MARGIN), Inches(0.95), Inches(12.2), Inches(0.7), title, 30, INK, True)
    gap = 0.37
    bw = (13.333 - 2 * MARGIN - gap * (len(nodes) - 1)) / len(nodes)
    for i, (t, d) in enumerate(nodes):
        x = Inches(MARGIN + i * (bw + gap))
        hot = i == hi
        box(s, x, Inches(2.3), Inches(bw), Inches(1.35),
            fill=CORAL if hot else PAPER, line=None if hot else LINE)
        text(s, x + Inches(0.12), Inches(2.52), Inches(bw - 0.24), Inches(0.4), t,
             12, PAPER if hot else INK, True, PP_ALIGN.CENTER)
        text(s, x + Inches(0.12), Inches(3.05), Inches(bw - 0.24), Inches(0.35), d,
             9, PAPER if hot else MUTED, align=PP_ALIGN.CENTER, font=FONT_MONO)
        if i < len(nodes) - 1:
            text(s, x + Inches(bw - 0.02), Inches(2.62), Inches(gap + 0.06), Inches(0.5),
                 "→", 20, CORAL, True, PP_ALIGN.CENTER)
    if sub_title and subs:
        text(s, Inches(MARGIN), Inches(4.1), Inches(4), Inches(0.4), sub_title, 13, INK, True)
        sgap = 0.2
        scw = (13.333 - 2 * MARGIN - sgap * (len(subs) - 1)) / len(subs)
        for i, (u, t) in enumerate(subs):
            x = Inches(MARGIN + i * (scw + sgap))
            box(s, x, Inches(4.6), Inches(scw), Inches(1.15), fill=CREAM, line=LINE)
            text(s, x + Inches(0.15), Inches(4.78), Inches(scw - 0.3), Inches(0.35), t, 11.5, INK, True)
            text(s, x + Inches(0.15), Inches(5.18), Inches(scw - 0.25), Inches(0.35),
                 u, 9, MUTED, font=FONT_MONO)
    return s


def slide_rows(prs, idx, label, title, rows, col_split=None):
    """双栏清单（技术栈等）：rows = [(左标签, 左值, 右标签, 右值), ...]
    或单栏：rows = [(标签, 值), ...] + col_split=None 时每行全宽"""
    s = add_slide(prs); page_chrome(s, idx, label)
    text(s, Inches(MARGIN), Inches(0.95), Inches(12.2), Inches(0.7), title, 30, INK, True)
    if col_split:
        half = (len(rows) + 1) // 2
        for ri, (l1, v1, l2, v2) in enumerate(rows[:half]):
            y = Inches(1.95 + ri * 0.82)
            for ci, (lab, val) in enumerate([(l1, v1), (l2, v2)]):
                if not lab:
                    continue
                x = Inches(MARGIN + ci * 6.3)
                box(s, x, y, Inches(5.9), Inches(0.7), fill=PAPER if ri % 2 == 0 else CREAM, line=LINE)
                text(s, x + Inches(0.18), y + Inches(0.06), Inches(1.5), Inches(0.3), lab, 9, MUTED)
                text(s, x + Inches(0.18), y + Inches(0.32), Inches(5.5), Inches(0.32),
                     val, 11.5, INK, True, font=FONT_MONO)
    else:
        for ri, (lab, val) in enumerate(rows):
            y = Inches(1.95 + ri * 0.82)
            box(s, Inches(MARGIN), y, Inches(12.23), Inches(0.7),
                fill=PAPER if ri % 2 == 0 else CREAM, line=LINE)
            text(s, Inches(MARGIN + 0.18), y + Inches(0.06), Inches(1.8), Inches(0.3), lab, 9, MUTED)
            text(s, Inches(MARGIN + 0.18), y + Inches(0.32), Inches(11.5), Inches(0.32),
                 val, 11.5, INK, True)
    return s


def slide_closing(prs, meta, footer_lines):
    """尾页：ink 反色整页 + coral logo 块"""
    s = add_slide(prs)
    box(s, 0, 0, SW, SH, fill=INK)
    box(s, Inches(0.9), Inches(2.35), Inches(0.35), Emu(19050), fill=CORAL)
    text(s, Inches(0.9), Inches(2.75), Inches(10), Inches(1.0),
         [("Let's build something.", 40, PAPER, True),
          (meta.get("domain", "asterforge.top"), 18, CORAL, False)], spacing=1.25)
    text(s, Inches(0.9), Inches(4.9), Inches(11), Inches(1.4), footer_lines,
         spacing=1.5, color=PAPER, font=FONT_MONO, size=12)
    box(s, Inches(11.9), Inches(0.9), Inches(1.3), Inches(1.3), fill=CORAL)
    text(s, Inches(11.9), Inches(1.28), Inches(1.3), Inches(0.5), "TC", 24, PAPER, True, PP_ALIGN.CENTER)
    return s


def bar_chart(slide, x, y, w, h, cats, vals, title=None, horizontal=False, color=CORAL,
              highlight=None, highlight_color=INK):
    """可编辑原生柱/条图（单系列，非贴图）：cats 类目，vals 数值。
    horizontal=True 转横向条形图。highlight=i 时第 i 根强调为 highlight_color（其余 color）。
    品牌化：无 legend、数值标签 Consolas、值轴淡化。
    返回容器 GraphicFrame（供 anim.chart() 等按元素引用）。"""
    cd = CategoryChartData()
    cd.categories = cats
    cd.add_series("s", vals)
    ct = XL_CHART_TYPE.BAR_CLUSTERED if horizontal else XL_CHART_TYPE.COLUMN_CLUSTERED
    gf = slide.shapes.add_chart(ct, x, y, w, h, cd)
    chart = gf.chart
    chart.has_legend = False
    chart.has_title = title is not None
    if chart.has_title:
        chart.chart_title.text_frame.text = title
    plot = chart.plots[0]
    plot.gap_width = 60
    ser = plot.series[0]
    ser.format.fill.solid()
    ser.format.fill.fore_color.rgb = C(color)
    if highlight is not None:
        pt = ser.points[highlight]
        pt.format.fill.solid()
        pt.format.fill.fore_color.rgb = C(highlight_color)
    plot.has_data_labels = True
    dl = plot.data_labels
    dl.font.size = Pt(11); dl.font.name = FONT_MONO; dl.font.color.rgb = C(INK)
    dl.position = XL_LABEL_POSITION.OUTSIDE_END
    ca = chart.category_axis
    ca.tick_labels.font.size = Pt(12); ca.tick_labels.font.name = FONT_CN
    ca.format.line.color.rgb = C(LINE)
    va = chart.value_axis
    va.has_major_gridlines = True
    va.major_gridlines.format.line.color.rgb = C(LINE)
    va.tick_labels.font.size = Pt(9); va.tick_labels.font.name = FONT_MONO
    va.tick_labels.font.color.rgb = C(MUTED)
    return gf


def set_transition(prs, kind="fade"):
    """统一页面转场（XML 注入，save 前调用）：fade / push-left。已有转场的页跳过。"""
    import lxml.etree as etree

    P = "http://schemas.openxmlformats.org/presentationml/2006/main"
    body = '<p:push dir="l"/>' if kind == "push-left" else "<p:fade/>"
    xml = f'<p:transition xmlns:p="{P}" spd="med">{body}</p:transition>'
    for slide in prs.slides:
        el = slide._element
        if el.find(f"{{{P}}}transition") is None and el.find(f"{{{MC}}}AlternateContent") is None:
            # 幂等：已有转场（含 morph 的 AlternateContent 包装）的页跳过，防双 transition
            el.append(etree.fromstring(xml))


P14 = "http://schemas.microsoft.com/office/powerpoint/2010/main"
P159 = "http://schemas.microsoft.com/office/powerpoint/2015/09/main"
MC = "http://schemas.openxmlformats.org/markup-compatibility/2006"


def _morph(slide, dur_ms=900):
    """给单页设 morph 平滑转场（PowerPoint 2019+；跨页同名 !!shape 补间）。
    morph 元素属 p159 扩展且须 mc:AlternateContent 包装——裸 p14:morph 会被 PowerPoint
    视为无效转场（EntryEffect 读作 0，带修改的保存直接丢弃）。"""
    import lxml.etree as etree

    P = "http://schemas.openxmlformats.org/presentationml/2006/main"
    for el in slide._element.findall(f"{{{P}}}transition"):
        slide._element.remove(el)  # 一页只允许一个 transition
    xml = (
        f'<mc:AlternateContent xmlns:mc="{MC}">'
        f'<mc:Choice xmlns:p159="{P159}" Requires="p159">'
        f'<p:transition xmlns:p="{P}" xmlns:p14="{P14}" spd="slow" p14:dur="{dur_ms}">'
        f'<p159:morph option="byObject"/></p:transition></mc:Choice>'
        f'<mc:Fallback><p:transition xmlns:p="{P}" spd="slow"><p:fade/></p:transition></mc:Fallback>'
        f'</mc:AlternateContent>'
    )
    slide._element.append(etree.fromstring(xml))


def growth_chart(prs, idx, label, title, cats, vals, color=CORAL, highlight=None,
                 x=MARGIN, y=2.2, w=12.23, h=4.2, dur_ms=900):
    """morph 数据增长柱图：一次生成两页——零状态页（柱≈0）+ 终态页。
    翻页时 PowerPoint 对 !! 同名元素做真补间：柱子平滑长高、数值随柱顶升起。
    原生 chart 无逐柱补间（bldChart 只是擦入），数据增长叙事用本范式。
    需 PowerPoint 2019+；占两页页码，后续页 idx 自行 +2。返回 (零状态页, 终态页)。"""
    n = len(vals)
    gap = 0.25
    bw = (w - gap * (n - 1)) / n
    vmax = max(vals) or 1

    def build(page_idx, zero):
        s = add_slide(prs)
        page_chrome(s, page_idx, label)
        text(s, Inches(x), Inches(0.95), Inches(w), Inches(0.7), title, 30, INK, True)
        base = box(s, Inches(x), Inches(y + h), Inches(w), Emu(9525), fill=LINE)
        base.name = "!!gbase"
        for i, (c, v) in enumerate(zip(cats, vals)):
            bx = x + i * (bw + gap)
            bh = 0.04 if zero else max(0.04, v / vmax * (h - 0.8))
            hot = i == highlight
            bar = box(s, Inches(bx), Inches(y + h - bh), Inches(bw), Inches(bh),
                      fill=LINE if zero else (INK if hot else color))
            bar.name = f"!!gbar{i}"
            lab = text(s, Inches(bx), Inches(y + h - bh - 0.42), Inches(bw), Inches(0.4),
                       str(v), 22, LINE if zero else (INK if hot else CORAL_DEEP), True,
                       PP_ALIGN.CENTER, font=FONT_MONO)
            lab.name = f"!!glab{i}"
            cat = text(s, Inches(bx), Inches(y + h + 0.08), Inches(bw), Inches(0.3),
                       c, 11.5, INK_SOFT, True, PP_ALIGN.CENTER)
            cat.name = f"!!gcat{i}"
        return s

    s0 = build(idx, True)
    s1 = build(idx + 1, False)
    _morph(s1, dur_ms)
    return s0, s1


# ── 入口示例 ──────────────────────────────────────────────────────────
if __name__ == "__main__":
    prs = new_deck()
    slide_cover(prs, META)
    slide_cards(prs, 2, "Overview", "一个门面，四种角色", [
        ("展示", "5 个项目详情页\n章节式叙事"),
        ("接单", "小程序定制\n软硬件集成"),
        ("互动", "投票看板\n社区群组"),
        ("运营", "管理后台\n热更新"),
    ])
    slide_numbers(prs, 3, "Numbers", "用数字说话", [
        ("5", "详情页", "static pages"), ("25+", "API", "routes"), ("10", "模型", "models"),
        ("100", "A11y", "lighthouse"), ("60s", "热更新", "ISR"), ("0.008", "CLS", "web vitals"),
    ])
    slide_chain(prs, 4, "Architecture", "请求链路", [
        ("访客浏览器", "HTTPS 443"), ("nginx", "proxy"), ("Next.js", "standalone"),
        ("Prisma", "ORM"), ("SQLite", "file db"),
    ])
    s = add_slide(prs); page_chrome(s, 5, "Chart")
    bar_chart(s, Inches(0.55), Inches(1.6), Inches(8.0), Inches(4.8),
              ["Q1", "Q2", "Q3", "Q4"], [12, 25, 18, 31], title="decks per quarter")
    slide_closing(prs, META, ["github.com/example", "© 2026"])
    prs.save("deck-demo.pptx")
    print("OK deck-demo.pptx")
