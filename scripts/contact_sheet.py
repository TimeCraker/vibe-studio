#!/usr/bin/env python3
"""Tile rendered frames into one contact sheet with timecode labels, so a whole
edit can be reviewed in a single look.

    python tools/contact_sheet.py --dir qa/samples --out qa/sheet.png [--cols 4]
    python tools/contact_sheet.py --dir qa/samples --out qa/sheet.png --lint
"""
from __future__ import annotations

import argparse
import re
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--dir', required=True)
    ap.add_argument('--out', required=True)
    ap.add_argument('--cols', type=int, default=4)
    ap.add_argument('--fps', type=float, default=60.0)
    ap.add_argument('--cell', type=int, default=460)
    ap.add_argument('--lint', action='store_true', help='report per-frame luminance stats')
    ap.add_argument('--glob', default='f*.png', help='filename pattern to collect (default f*.png)')
    a = ap.parse_args()

    files = sorted(Path(a.dir).glob(a.glob))
    if not files:
        raise SystemExit(f'no {a.glob} in {a.dir}')

    cw = a.cell
    ch = int(cw * 9 / 16)
    cols = min(a.cols, len(files))
    rows = (len(files) + cols - 1) // cols
    pad = 10
    label = 26
    W = cols * cw + (cols + 1) * pad
    H = rows * (ch + label) + (rows + 1) * pad
    sheet = Image.new('RGB', (W, H), (18, 20, 28))
    d = ImageDraw.Draw(sheet)

    stats = []
    for i, f in enumerate(files):
        im = Image.open(f).convert('RGB')
        arr = np.asarray(im).astype(np.float32).mean(axis=2)
        stats.append((f.name, arr.mean(), arr.std(), np.percentile(arr, 99)))
        small = im.resize((cw, ch), Image.LANCZOS)
        r, c = divmod(i, cols)
        x = pad + c * (cw + pad)
        y = pad + r * (ch + label + pad)
        sheet.paste(small, (x, y))
        m = re.search(r'f(\d+)', f.name)
        secs = int(m.group(1)) / a.fps if m else 0
        d.text((x + 2, y + ch + 5), f'{f.name}   t={secs:6.2f}s', fill=(150, 200, 255))

    out = Path(a.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(out)
    print(f'{out}  {W}x{H}  ({len(files)} frames)')

    if a.lint:
        print(f'{"frame":<14}{"mean":>8}{"std":>8}{"p99":>8}')
        for n, m, s, p in stats:
            flag = '  <-- flat?' if s < 12 else ('  <-- blown?' if p > 252 else '')
            print(f'{n:<14}{m:>8.1f}{s:>8.1f}{p:>8.0f}{flag}')


if __name__ == '__main__':
    main()