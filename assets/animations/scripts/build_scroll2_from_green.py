#!/usr/bin/env python3
"""
Build scroll-2 transparent webp frames (0-119) from green-background sources.

Source:
  assets/animations/scroll-2/frame non ritagliati/frame_NNN_delay-*.jpg
  (1080x1920, clay on green)

Output:
  assets/animations/scroll-2/webp/frame_NNN.webp  (1440x805, RGBA)

Mirrors build_scroll1_from_red.py: GrabCut-based mask per frame, then a
SINGLE fixed crop rectangle (union bbox of the object across every frame)
and a single fixed scale/paste position (TARGET, identical to scroll-1's)
so the hand-off from scroll-1's last frame to scroll-2's first frame is
pixel-aligned - same object size and canvas position, no visible cut.

Usage:
  python build_scroll2_from_green.py --preview --frames 0,30,60,90,119
  python build_scroll2_from_green.py --all
"""

from __future__ import annotations

import argparse
import glob
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

SCRIPT_DIR = Path(__file__).resolve().parent
ANIM_DIR = SCRIPT_DIR.parent
SRC_DIR = ANIM_DIR / "scroll-2" / "frame non ritagliati"
OUT_DIR = ANIM_DIR / "scroll-2" / "webp"
PREVIEW_DIR = ANIM_DIR / "scroll-2" / "preview_from_green"

OUT_W, OUT_H = 1440, 805
# Identical TARGET box scroll-1 uses for every one of its frames, so
# scroll-2 frame 0 lands in exactly the same place as scroll-1's last frame.
TARGET = (95, 14, 1357, 790)
TW = TARGET[2] - TARGET[0]
TH = TARGET[3] - TARGET[1]
PASTE_X, PASTE_Y = TARGET[0], TARGET[1]

NEAR = 55  # px: green closer than this to clay is treated as part of the model (beds)

DEFAULT_PREVIEW_FRAMES = [0, 30, 60, 90, 119]


def list_frames():
    return sorted(glob.glob(str(SRC_DIR / "*.jpg")))


def mask_frame(bgr: np.ndarray) -> np.ndarray:
    """Return uint8 alpha mask (0/255) isolating the clay object via GrabCut,
    identical approach to the standalone chroma4 cutout script."""
    h, w = bgr.shape[:2]
    hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)
    H, S = hsv[..., 0], hsv[..., 1]
    green = ((H >= 30) & (H <= 95) & (S >= 45)).astype(np.uint8)
    clay = (1 - green).astype(np.uint8)
    clay_c = cv2.morphologyEx(clay, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3)))

    dist = cv2.distanceTransform((1 - clay_c).astype(np.uint8), cv2.DIST_L2, 5)

    gc = np.full((h, w), cv2.GC_PR_BGD, np.uint8)
    gc[green.astype(bool) & (dist > NEAR)] = cv2.GC_BGD
    gc[green.astype(bool) & (dist <= NEAR)] = cv2.GC_PR_FGD
    gc[clay_c.astype(bool)] = cv2.GC_PR_FGD
    core = cv2.erode(clay_c, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7)))
    gc[core.astype(bool)] = cv2.GC_FGD

    bgdM = np.zeros((1, 65), np.float64)
    fgdM = np.zeros((1, 65), np.float64)
    try:
        cv2.grabCut(bgr, gc, None, bgdM, fgdM, 3, cv2.GC_INIT_WITH_MASK)
    except cv2.error:
        pass
    fg = np.where((gc == cv2.GC_FGD) | (gc == cv2.GC_PR_FGD), 1, 0).astype(np.uint8)

    fg = cv2.morphologyEx(fg, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5)))
    ff = fg.copy()
    m = np.zeros((h + 2, w + 2), np.uint8)
    cv2.floodFill(ff, m, (0, 0), 1)
    fg[(ff == 0) & (fg == 0)] = 1

    alpha = cv2.GaussianBlur((fg * 255).astype(np.uint8), (3, 3), 0)
    return alpha


def compute_union_bbox(files):
    x0 = y0 = 10**9
    x1 = y1 = -1
    for f in files:
        bgr = cv2.imread(f, cv2.IMREAD_COLOR)
        alpha = mask_frame(bgr)
        ys, xs = np.where(alpha > 10)
        if len(xs) == 0:
            continue
        x0 = min(x0, xs.min()); x1 = max(x1, xs.max())
        y0 = min(y0, ys.min()); y1 = max(y1, ys.max())
    return x0, y0, x1, y1


def build_frame(f, src_rect, scale):
    bgr = cv2.imread(f, cv2.IMREAD_COLOR)
    alpha = mask_frame(bgr)
    rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
    rgba = np.dstack([rgb, alpha])

    sx0, sy0, sx1, sy1 = src_rect
    crop = rgba[sy0:sy1 + 1, sx0:sx1 + 1]
    cw, ch = crop.shape[1], crop.shape[0]
    new_w, new_h = max(1, round(cw * scale)), max(1, round(ch * scale))

    crop_img = Image.fromarray(crop, "RGBA").resize((new_w, new_h), Image.LANCZOS)

    canvas = Image.new("RGBA", (OUT_W, OUT_H), (0, 0, 0, 0))
    canvas.alpha_composite(crop_img, (PASTE_X, PASTE_Y))
    return canvas


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("mode", choices=["preview", "all"], nargs="?", default="preview")
    ap.add_argument("--preview", action="store_true")
    ap.add_argument("--all", action="store_true")
    ap.add_argument("--frames", type=str, default=None)
    args = ap.parse_args()

    mode = "all" if args.all else ("preview" if args.preview else args.mode)

    files = list_frames()
    if not files:
        raise SystemExit(f"No source frames found in {SRC_DIR}")

    print(f"Computing fixed crop rect across {len(files)} frames...")
    src_rect = compute_union_bbox(files)
    sx0, sy0, sx1, sy1 = src_rect
    sw, sh = sx1 - sx0 + 1, sy1 - sy0 + 1
    scale = min(TW / sw, TH / sh)
    print(f"SRC_RECT={src_rect} size={sw}x{sh} SCALE={scale:.4f}")

    if mode == "preview":
        PREVIEW_DIR.mkdir(parents=True, exist_ok=True)
        idxs = [int(x) for x in args.frames.split(",")] if args.frames else DEFAULT_PREVIEW_FRAMES
        for idx in idxs:
            f = files[idx]
            canvas = build_frame(f, src_rect, scale)
            out = PREVIEW_DIR / f"frame_{idx:03d}.png"
            canvas.save(out)
            print("preview:", out)
    else:
        OUT_DIR.mkdir(parents=True, exist_ok=True)
        for idx, f in enumerate(files):
            canvas = build_frame(f, src_rect, scale)
            out = OUT_DIR / f"frame_{idx:03d}.webp"
            canvas.save(out, "WEBP", lossless=False, quality=90, method=6)
            if idx % 20 == 0:
                print(f"frame {idx}/{len(files)}")
        print("done:", OUT_DIR)


if __name__ == "__main__":
    main()
