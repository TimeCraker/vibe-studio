#!/usr/bin/env python3
"""Probe a rendered frame numerically: look for banding / rectangle edges in the
background and report text contrast, so design problems are measured, not guessed.

    python scripts/probe_frame.py <frame.png> [<frame2.png> ...]

Takes one or more files. The band/column coordinates below are tuned for a
1920x1080 title-card layout; they still print useful numbers on other sizes.
"""
from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
from PIL import Image


def probe(p: Path) -> None:
    im = np.asarray(Image.open(p).convert('RGB')).astype(np.float32)
    h, w, _ = im.shape
    lum = im.mean(axis=2)
    print(f'{p.name}  {w}x{h}')

    # horizontal scan across an empty background band (rows 380-430 on a title card)
    band = lum[380:430, :].mean(axis=0)
    steps = np.abs(np.diff(band))
    top = np.argsort(steps)[-6:][::-1]
    print('  background row-band 380-430: luminance range '
          f'{band.min():.1f}..{band.max():.1f}')
    print('  largest horizontal steps (x, delta):  ' +
          '  '.join(f'{int(i)}:{steps[i]:+.2f}' for i in sorted(top)))

    # vertical scan down an empty column
    col = lum[:, 300:340].mean(axis=1)
    vsteps = np.abs(np.diff(col))
    vtop = np.argsort(vsteps)[-6:][::-1]
    print('  largest vertical steps (y, delta):    ' +
          '  '.join(f'{int(i)}:{vsteps[i]:+.2f}' for i in sorted(vtop)))

    # 2x2 block means on a coarse grid, to expose rectangular regions
    print('  coarse 6x4 block means:')
    for by in range(4):
        row = []
        for bx in range(6):
            blk = lum[by * h // 4:(by + 1) * h // 4, bx * w // 6:(bx + 1) * w // 6]
            row.append(f'{blk.mean():6.1f}')
        print('    ' + ' '.join(row))

    # text contrast: brightest 0.5% vs its local background
    flat = lum.ravel()
    hi = np.percentile(flat, 99.5)
    print(f'  p99.5 luminance {hi:.0f}, median {np.median(flat):.0f}')


def main():
    if len(sys.argv) < 2:
        print(__doc__.strip())
        raise SystemExit(2)
    for raw in sys.argv[1:]:
        probe(Path(raw))


if __name__ == '__main__':
    main()