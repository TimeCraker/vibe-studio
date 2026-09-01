# -*- coding: utf-8 -*-
"""A4 简历 HTML → PDF。用本机 Chrome / Edge 无头打印。"""
from __future__ import annotations

import pathlib
import subprocess
import sys

HERE = pathlib.Path(__file__).resolve().parent
BROWSERS = [
    pathlib.Path(r"C:\Program Files\Google\Chrome\Application\chrome.exe"),
    pathlib.Path(r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"),
]


def render(html: pathlib.Path, out: pathlib.Path) -> None:
    browser = next((p for p in BROWSERS if p.exists()), None)
    if browser is None:
        raise SystemExit("Chrome / Edge not found")
    out.parent.mkdir(parents=True, exist_ok=True)
    cmd = [
        str(browser),
        "--headless=new",
        "--disable-gpu",
        "--no-pdf-header-footer",
        "--virtual-time-budget=8000",
        "--allow-file-access-from-files",
        f"--print-to-pdf={out}",
        html.resolve().as_uri(),
    ]
    subprocess.run(cmd, check=True)
    print(f"OK {out} ({out.stat().st_size} bytes)")


def main() -> None:
    if len(sys.argv) >= 3:
        html = pathlib.Path(sys.argv[1])
        out = pathlib.Path(sys.argv[2])
    elif len(sys.argv) == 2:
        html = HERE / "index.html"
        out = pathlib.Path(sys.argv[1])
    else:
        html = HERE / "index.html"
        out = HERE / "张桓睿_简历.pdf"
    render(html, out)


if __name__ == "__main__":
    main()
