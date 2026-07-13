#!/usr/bin/env python3
"""
Build scroll-1 transparent webp frames (0–115) from red-background sources.

Source:
  assets/animations/scroll-1/red_src/frame_000..115.jpg  (1080x1920, clay on red)

Output:
  assets/animations/scroll-1/webp/frame_000..115.webp    (1440x805, RGBA)

The script applies a simple chroma key on the red background, then crops a
fixed rectangle around the object and pastes it onto the scroll canvas with
fixed scale and position, so there is no per-frame jitter in size/position.

Usage:
  python build_scroll1_from_red.py --preview --frames 0,50,75,110
  python build_scroll1_from_red.py --all
"""

from __future__ import annotations

import argparse
import glob
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter


SCRIPT_DIR = Path(__file__).resolve().parent
ANIM_DIR = SCRIPT_DIR.parent
SRC_DIR = ANIM_DIR / "scroll-1" / "red_src"
OUT_DIR = ANIM_DIR / "scroll-1" / "webp"
PREVIEW_DIR = ANIM_DIR / "scroll-1" / "preview_from_red"

OUT_W, OUT_H = 1440, 805
TARGET = (95, 14, 1357, 790)  # match scroll-0 frame_197 bbox
TW = TARGET[2] - TARGET[0]
TH = TARGET[3] - TARGET[1]

# Fixed crop in the 1080x1920 red source, derived from frame_075 analysis.
# This rectangle must fully contain the object in all frames 0–115.
SRC_RECT = (0, 226, 1079, 1919)  # x0, y0, x1, y1

# Fixed scale so SRC_RECT fits inside TARGET once and for all.
SRC_W = SRC_RECT[2] - SRC_RECT[0] + 1
SRC_H = SRC_RECT[3] - SRC_RECT[1] + 1
SCALE = min(TW / SRC_W, TH / SRC_H)

PASTE_X, PASTE_Y = TARGET[0], TARGET[1]

DEFAULT_PREVIEW_FRAMES = [0, 50, 75, 110]


def load_red_frame(index: int) -> Image.Image:
    path = SRC_DIR / f"frame_{index:03d}.jpg"
    return Image.open(path).convert("RGB")


def chroma_key_red(im: Image.Image) -> Image.Image:
    """Return RGBA image where red background is transparent."""
    rgb = np.asarray(im).astype(np.float32)
    R, G, B = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]

    # Candidate red pixels include saturated red background and darker red
    # floor shadows. Keep thresholds strict enough to avoid eating warm clay.
    sat = rgb.max(axis=2) - rgb.min(axis=2)
    red_score = R - np.maximum(G, B)
    red_candidate = (
        (R > 120) &
        (red_score > 40) &
        (G < 105) &
        (B < 105) &
        (sat > 45)
    )

    h, w = red_candidate.shape
    bg_red = np.zeros_like(red_candidate, dtype=bool)
    q: deque[tuple[int, int]] = deque()

    for x in range(w):
        for y in (0, h - 1):
            if red_candidate[y, x] and not bg_red[y, x]:
                bg_red[y, x] = True
                q.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if red_candidate[y, x] and not bg_red[y, x]:
                bg_red[y, x] = True
                q.append((y, x))

    while q:
        y, x = q.popleft()
        for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and red_candidate[ny, nx] and not bg_red[ny, nx]:
                bg_red[ny, nx] = True
                q.append((ny, nx))

    alpha = np.where(bg_red, 0, 255).astype(np.uint8)

    # Final cleanup: remove tiny red leaks that survive the key around
    # external edges/wall shadows. Keep the structural core untouched.
    solid = alpha > 200
    core = solid.copy()
    for _ in range(2):
        up = np.zeros_like(core)
        down = np.zeros_like(core)
        left = np.zeros_like(core)
        right = np.zeros_like(core)
        up[1:, :] = core[:-1, :]
        down[:-1, :] = core[1:, :]
        left[:, 1:] = core[:, :-1]
        right[:, :-1] = core[:, 1:]
        core = core & up & down & left & right

    red_like = (R > 95) & ((R - G) > 28) & ((R - B) > 28)
    leak = red_like & ~core
    alpha[leak] = 0

    # Soften edges a bit and remove tiny halos.
    a_img = Image.fromarray(alpha, mode="L").filter(ImageFilter.GaussianBlur(radius=0.7))
    a_np = np.asarray(a_img).copy()
    a_np[a_np < 24] = 0
    a_np[a_np > 230] = 255

    rgba = np.dstack([rgb.astype(np.uint8), a_np.astype(np.uint8)])
    return Image.fromarray(rgba, mode="RGBA")


def composite_to_canvas(rgba: Image.Image) -> Image.Image:
    """Crop fixed SRC_RECT, scale once, and paste at fixed TARGET."""
    src = rgba.crop(SRC_RECT)
    src_w, src_h = src.size
    dst_w = max(1, int(src_w * SCALE))
    dst_h = max(1, int(src_h * SCALE))

    scaled = src.resize((dst_w, dst_h), Image.Resampling.LANCZOS)

    canvas = Image.new("RGBA", (OUT_W, OUT_H), (0, 0, 0, 0))
    canvas.paste(scaled, (PASTE_X, PASTE_Y), scaled)
    return canvas


def process_frame(index: int) -> Image.Image:
    im = load_red_frame(index)
    rgba = chroma_key_red(im)
    return composite_to_canvas(rgba)


def run_preview(frames: list[int]) -> None:
    PREVIEW_DIR.mkdir(parents=True, exist_ok=True)
    for idx in frames:
        canvas = process_frame(idx)
        out_path = PREVIEW_DIR / f"frame_{idx:03d}_black.png"
        # Composite on site background black for QA.
        bg = Image.new("RGBA", canvas.size, (6, 6, 8, 255))
        bg.alpha_composite(canvas)
        bg.convert("RGB").save(out_path, "PNG")
        print(f"preview -> {out_path}")


def run_all() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    files = sorted(glob.glob(str(SRC_DIR / "frame_*.jpg")))
    print(f"Building {len(files)} frames from red_src/")

    for path in files:
        name = Path(path).name
        idx = int(name.split("_")[1].split(".")[0])
        canvas = process_frame(idx)
        out_path = OUT_DIR / f"frame_{idx:03d}.webp"
        canvas.save(out_path, "WEBP", quality=85, method=5)
        print(f"  -> {out_path.name}")


def parse_frames(value: str) -> list[int]:
    return [int(x.strip()) for x in value.split(",") if x.strip()]


def main() -> None:
    parser = argparse.ArgumentParser(description="Build scroll-1 webp frames 0-115 from red-bg sources")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--preview", action="store_true")
    group.add_argument("--all", action="store_true")
    parser.add_argument(
        "--frames",
        default=",".join(str(f) for f in DEFAULT_PREVIEW_FRAMES),
        help="Comma-separated frame indices for preview",
    )
    args = parser.parse_args()

    if args.preview:
        run_preview(parse_frames(args.frames))
    else:
        run_all()


if __name__ == "__main__":
    main()

