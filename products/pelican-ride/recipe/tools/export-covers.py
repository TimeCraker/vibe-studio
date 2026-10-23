#!/usr/bin/env python3
"""Cover exports: crop the director's 1920x1080 cover renders per platform.

  python tools/export-covers.py            # render/covers/*.png -> cropped variants

  cover-bili-16x9.png   -> as-is (Bilibili web + player, content center-safe)
  cover-douyin-4x3      -> center crop 1440x1080 (Douyin horizontal slot)
  cover-douyin-3x4      -> center crop 810x1080, upscale to 1080x1440 (Douyin vertical)
  cover-xhs-3x4         -> center crop 810x1080, upscale to 1080x1440 (Xiaohongshu)

The v34 renders keep all text inside the center 810x1080 (director.js contract),
so a blind center crop never clips a title.
"""
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
COVERS = ROOT / "render" / "covers"


def center_crop(im: Image.Image, cw: int, ch: int) -> Image.Image:
    w, h = im.size
    left = (w - cw) // 2
    top = (h - ch) // 2
    return im.crop((left, top, left + cw, top + ch))


JOBS = [
    # (source render, out name, crop box (w, h) or None, upscale target or None)
    ("cover-bili-16x9.png", "pelican-ride-cover-bili.png", None, None),
    ("cover-douyin-4x3.png", "pelican-ride-cover-douyin-h.png", (1440, 1080), None),
    ("cover-douyin-3x4.png", "pelican-ride-cover-douyin-v.png", (810, 1080), (1080, 1440)),
    ("cover-xhs-3x4.png", "pelican-ride-cover-xhs.png", (810, 1080), (1080, 1440)),
]


def main() -> None:
    for src_name, out_name, box, target in JOBS:
        src = COVERS / src_name
        if not src.exists():
            print(f"[skip] missing {src}")
            continue
        im = Image.open(src).convert("RGB")
        if box:
            im = center_crop(im, *box)
        if target:
            im = im.resize(target, Image.LANCZOS)
        out = COVERS / out_name
        im.save(out, "PNG")
        print(f"[ok] {out.name}  {im.size[0]}x{im.size[1]}")


if __name__ == "__main__":
    main()
