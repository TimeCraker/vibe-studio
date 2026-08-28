# -*- coding: utf-8 -*-
"""
verify.py — 渲染核查初筛：读 PDF 里每个文本块的真实渲染 bbox，对比页面边界，自动报溢出。

用法：python verify.py deck.pdf [deck2.pdf ...]     # 在 COM/soffice 转 PDF 之后跑
输出：每页 [OK] / [OVERFLOW] + 溢出方向、溢出量、文本摘要；退出码 0=全过 1=有溢出。

定位：三级核查管线（程序初筛 → 视觉自查 → 人工终审）的第一级，只保证「没出框」，
不保证好看——乱码 / 对齐 / 对比度仍需视觉自查。依赖 pymupdf。
"""
import sys

import fitz

sys.stdout.reconfigure(errors="replace")  # GBK 控制台下中文摘要打成 ? 也不崩

TOL = 2.0  # pt 容差，小于此越界视为渲染噪声


def check(pdf_path):
    doc = fitz.open(pdf_path)
    pages = len(doc)
    bad = 0
    for i, page in enumerate(doc, 1):
        W, H = page.rect.width, page.rect.height
        issues = []
        for x0, y0, x1, y1, txt, _, btype in page.get_text("blocks"):
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
    doc.close()
    print(f"{'FAIL' if bad else 'PASS'} {pdf_path}: {bad}/{pages} pages overflow")
    return bad == 0


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(2)
    sys.exit(0 if all(check(p) for p in sys.argv[1:]) else 1)
