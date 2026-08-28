# -*- coding: utf-8 -*-
"""
verify.py — 渲染核查初筛（三级管线第一级）：
① 文本块 bbox 对页边界报溢出；② 占位符扫描；③ 文本对比度 WCAG 初筛。

用法：python verify.py deck.pdf [deck2.pdf ...]     # 在 COM/soffice 转 PDF 之后跑
输出：每页 [OK] / [OVERFLOW]；[PLACEHOLDER] 命中行；[CONTRAST] 对比度不足行；
退出码 0=全过 1=有问题。

对比度策略：span 字色 vs 周边采样底色算 WCAG 比率，阈值 bold 或 ≥18pt 取 3.0、
其余 4.5（-0.2 容差）。底色采样不均匀（图上/渐变）跳过；比率 <1.6 的近隐形文本
视为 morph 零状态脚手架跳过。本筛只保证「没出框、没占位符、没有明显低对比」，
乱码 / 对齐仍需视觉自查。依赖 pymupdf。
"""
import re
import sys

import fitz

sys.stdout.reconfigure(errors="replace")  # GBK 控制台下中文摘要打成 ? 也不崩

TOL = 2.0   # pt 容差，小于此越界视为渲染噪声
DPI = 100   # 对比度底色采样用渲染精度
PLACEHOLDER = re.compile(
    r"lorem|ipsum|\bTODO\b|\[insert|placeholder|XXX+|PROJECT NAME|PROJECT BRIEF|YYYY-MM-DD",
    re.IGNORECASE,
)


def _lum(rgb):
    def ch(c):
        c /= 255.0
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = rgb[:3]
    return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b)


def _ratio(fg, bg):
    l1, l2 = sorted((_lum(fg), _lum(bg)), reverse=True)
    return (l1 + 0.05) / (l2 + 0.05)


def contrast_issues(page, pix, scale):
    """逐 span：字色对采样底色算 WCAG 比率，低于阈值报 [CONTRAST]。"""
    issues = []
    for block in page.get_text("dict")["blocks"]:
        if block["type"] != 0:
            continue
        for line in block["lines"]:
            for sp in line["spans"]:
                col = sp["color"]
                fg = ((col >> 16) & 255, (col >> 8) & 255, col & 255)
                x0, y0, x1, y1 = sp["bbox"]
                pts = [(max(x0 - 4, 0), (y0 + y1) / 2),
                       (min(x1 + 4, page.rect.width - 1), (y0 + y1) / 2),
                       ((x0 + x1) / 2, max(y0 - 4, 0))]
                samples = []
                for px, py in pts:
                    ix, iy = int(px * scale), int(py * scale)
                    if 0 <= ix < pix.width and 0 <= iy < pix.height:
                        samples.append(pix.pixel(ix, iy)[:3])
                if len(samples) < 2:
                    continue
                spread = max(max(s[c] for s in samples) - min(s[c] for s in samples)
                             for c in range(3))
                if spread > 40:       # 底色不均匀（图上/渐变/边缘）→ 交给视觉自查
                    continue
                bg = sorted(samples)[len(samples) // 2]
                r = _ratio(fg, bg)
                if r < 1.6:           # 近隐形 = morph 零状态脚手架，设计意图
                    continue
                need = 3.0 if (sp["flags"] & 16 or sp["size"] >= 18) else 4.5
                if r < need - 0.2:
                    t = sp["text"].strip().replace("\n", " ")[:14]
                    issues.append(f"[CONTRAST] p{page.number + 1} [{t}] {r:.2f} < {need} "
                                  f"#{col:06x} on #{bg[0]:02x}{bg[1]:02x}{bg[2]:02x}")
    return issues


def check(pdf_path):
    doc = fitz.open(pdf_path)
    pages = len(doc)
    bad = 0
    fulltext = []
    for i, page in enumerate(doc, 1):
        W, H = page.rect.width, page.rect.height
        issues = []
        for x0, y0, x1, y1, txt, _, btype in page.get_text("blocks"):
            fulltext.append(txt)
            if btype != 0:  # 只查文本块；形状/图片贴边是设计，不报警
                continue
            t = txt.strip().replace("\n", " ")[:36]
            if x0 < -TOL:
                issues.append(f"L{x0:.0f}pt [{t}]")
            elif x1 > W + TOL:
                issues.append(f"R+{x1 - W:.0f}pt [{t}]")
            elif y0 < -TOL:
                issues.append(f"T{y0:.0f}pt [{t}]")
            elif y1 > H + TOL:
                issues.append(f"B+{y1 - H:.0f}pt [{t}]")
        if issues:
            bad += 1
            print(f"[OVERFLOW] page {i}: " + "; ".join(issues))
        else:
            print(f"[OK] page {i}")
        pix = page.get_pixmap(dpi=DPI)
        for msg in contrast_issues(page, pix, DPI / 72):
            bad += 1
            print(msg)
    ph = PLACEHOLDER.findall("\n".join(fulltext))
    if ph:
        bad += 1
        print(f"[PLACEHOLDER] {set(ph)} — 模板默认值未改，交付前必须处理")
    doc.close()
    print(f"{'FAIL' if bad else 'PASS'} {pdf_path}: {bad} issue(s)")
    return bad == 0


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(2)
    sys.exit(0 if all(check(p) for p in sys.argv[1:]) else 1)
