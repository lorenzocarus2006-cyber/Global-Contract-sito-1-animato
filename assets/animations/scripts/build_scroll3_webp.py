#!/usr/bin/env python3
"""
Build scroll-3 webp frames (0-171) for the site from the already-cut PNGs.

Input:  assets/animations/scroll-3/frame ritagliati/frame_NNN_*.png (720x1280 RGBA)
Output: assets/animations/scroll-3/webp/frame_NNN.webp (1440x805 RGBA)

A SINGLE fixed crop (union alpha bbox across all frames) + single fixed
scale/paste into the same 1440x805 canvas and TARGET box scroll-1/scroll-2
use, so scroll-3 frame 0 sits at the same on-screen size/position as
scroll-2's centered last frame (seamless hand-off).
"""
from __future__ import annotations
import glob, os
from pathlib import Path
import numpy as np
from PIL import Image

BASE = Path("/Users/lorenzorubino/SITO GLOBAL DEFINITIVO/DEFINITIVO/assets/animations/scroll-3")
SRC = BASE / "frame ritagliati definitivo"
OUT = BASE / "webp"
OUT.mkdir(parents=True, exist_ok=True)

OUT_W, OUT_H = 1440, 805
TARGET = (95, 14, 1357, 790)
TW = TARGET[2] - TARGET[0]
TH = TARGET[3] - TARGET[1]

files = sorted(glob.glob(str(SRC / "*.png")))
print("frames:", len(files))

# union bbox
x0 = y0 = 10**9
x1 = y1 = -1
for f in files:
    a = np.array(Image.open(f).convert("RGBA"))[..., 3]
    ys, xs = np.where(a > 20)
    if len(xs) == 0:
        continue
    x0 = min(x0, xs.min()); x1 = max(x1, xs.max())
    y0 = min(y0, ys.min()); y1 = max(y1, ys.max())
bw, bh = x1 - x0 + 1, y1 - y0 + 1
scale = min(TW / bw, TH / bh)
new_w, new_h = round(bw * scale), round(bh * scale)
paste_x = TARGET[0] + (TW - new_w) // 2
paste_y = TARGET[1] + (TH - new_h) // 2
print(f"bbox {bw}x{bh} scale {scale:.4f} -> {new_w}x{new_h} paste ({paste_x},{paste_y})")

for idx, f in enumerate(files):
    im = Image.open(f).convert("RGBA")
    crop = im.crop((x0, y0, x1 + 1, y1 + 1)).resize((new_w, new_h), Image.LANCZOS)
    canvas = Image.new("RGBA", (OUT_W, OUT_H), (0, 0, 0, 0))
    canvas.alpha_composite(crop, (paste_x, paste_y))
    canvas.save(OUT / f"frame_{idx:03d}.webp", "WEBP", quality=90, method=6)
    if idx % 30 == 0:
        print("frame", idx)
print("done ->", OUT)
