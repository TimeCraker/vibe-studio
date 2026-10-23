# -*- coding: utf-8 -*-
"""
extract_pages.py - pptx to page images (PDF intermediate, 200 dpi PNG).

Usage: python extract_pages.py <in.pptx> <outDir>

Pipeline: PowerPoint COM opens read-only without window, SaveAs PDF
(format 32), then PyMuPDF renders each page at dpi=200 to p-<N>.png
(1-based, N = PDF page order). deck.pdf stays in outDir as evidence.

Prints "pages=N dpi=200 out=<outDir>" on success; exit code 1 on failure.
Console output is English only (GBK console).
"""
import os
import sys


def pptx_to_pdf(pptx_path, pdf_path):
    import win32com.client

    app = win32com.client.Dispatch("PowerPoint.Application")
    pres = None
    try:
        # ReadOnly=True, Untitled=False, WithWindow=False (blocks popups)
        pres = app.Presentations.Open(
            os.path.abspath(pptx_path), True, False, False
        )
        pres.SaveAs(os.path.abspath(pdf_path), 32)  # 32 = ppSaveAsPDF
    finally:
        if pres is not None:
            pres.Close()
        app.Quit()


def render_pages(pdf_path, out_dir, dpi=200):
    import fitz

    doc = fitz.open(pdf_path)
    try:
        os.makedirs(out_dir, exist_ok=True)
        for i, page in enumerate(doc, 1):
            pix = page.get_pixmap(dpi=dpi)
            pix.save(os.path.join(out_dir, f"p-{i}.png"))
        return len(doc)
    finally:
        doc.close()


def main():
    if len(sys.argv) != 3:
        print("usage: python extract_pages.py <in.pptx> <outDir>")
        return 1
    pptx_path, out_dir = sys.argv[1], sys.argv[2]
    if not os.path.isfile(pptx_path):
        print(f"ERROR: input not found: {pptx_path}")
        return 1
    os.makedirs(out_dir, exist_ok=True)
    pdf_path = os.path.join(out_dir, "deck.pdf")
    try:
        pptx_to_pdf(pptx_path, pdf_path)
        count = render_pages(pdf_path, out_dir)
    except Exception as e:  # noqa: BLE001 - report any COM/fitz failure
        print(f"ERROR: {e}")
        return 1
    print(f"pages={count} dpi=200 out={out_dir}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
