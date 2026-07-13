#!/usr/bin/env python3
"""
Build scroll-1 transparent cutout webp sequence (1440x805).

Pipeline: rembg (birefnet-general) + edge flood-fill (cream/shadow removal) +
hole fill for interior floor + shape cutout (no external shadows).
Frame 000 is copied from scroll-0 frame_197 for a pixel-perfect hand-off.

Usage:
  python build_scroll1_cutout.py --preview --frames 0,50,75,110,160,221
  python build_scroll1_cutout.py --all
"""

from __future__ import annotations

import argparse
import glob
import os
import shutil
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

os.environ.setdefault("U2NET_HOME", "/tmp/.u2net")

from rembg import new_session, remove  # noqa: E402

SCRIPT_DIR = Path(__file__).resolve().parent
ANIM_DIR = SCRIPT_DIR.parent
SRC_DIR = ANIM_DIR / "scroll-1"
S0_LAST = ANIM_DIR / "scroll-0" / "webp" / "frame_197.webp"
OUT_DIR = SRC_DIR / "webp"
PREVIEW_DIR = SRC_DIR / "preview_v2"

OUT_W, OUT_H = 1440, 805
TARGET = (95, 14, 1357, 790)
TW = TARGET[2] - TARGET[0]
TH = TARGET[3] - TARGET[1]
TCX = (TARGET[0] + TARGET[2]) // 2
TCY = (TARGET[1] + TARGET[3]) // 2

LETTERBOX_LAST = 74
BAR_TOP, BAR_BOT = 1317, 2522
CROP_Y0, CROP_Y1 = 1120, 2920

CAD_START = 160
CAD_BLEND_FRAMES = 30

# External cast shadows: nearly invisible on the site's black background.
EXTERNAL_SHADOW_ALPHA_MIN = 8
EXTERNAL_SHADOW_ALPHA_MAX = 36

DEFAULT_MODEL = "birefnet-general"
DEFAULT_PREVIEW_FRAMES = [0, 50, 75, 110, 160, 221]

BG_BLACK = (6, 6, 8)
BG_RED = (255, 0, 0)


def fill_letterbox(rgb: np.ndarray) -> np.ndarray:
    samples = [rgb[1400, 100], rgb[1400, 2000], rgb[2450, 100], rgb[2450, 2000]]
    cream = np.median(np.stack(samples), axis=0).astype(np.uint8)
    out = rgb.copy()
    out[:BAR_TOP, :, :] = cream
    out[BAR_BOT + 1 :, :, :] = cream
    return out


def estimate_bg_color(rgb: np.ndarray) -> np.ndarray:
    h, w, _ = rgb.shape
    pts = [
        rgb[0, 0],
        rgb[0, -1],
        rgb[-1, 0],
        rgb[-1, -1],
        rgb[h // 2, 0],
        rgb[h // 2, -1],
        rgb[0, w // 2],
        rgb[-1, w // 2],
    ]
    valid = [p for p in pts if p.mean() > 20]
    return np.median(np.stack(valid if valid else pts), axis=0).astype(np.uint8)


def flood_with_barrier(seed: np.ndarray, barrier: np.ndarray) -> np.ndarray:
    """Flood studio background from edges; barrier (walls/paper) blocks entry into the object."""
    h, w = seed.shape
    reachable = np.zeros((h, w), dtype=bool)
    q: deque[tuple[int, int]] = deque()

    for x in range(w):
        for y in (0, h - 1):
            if seed[y, x] and not barrier[y, x] and not reachable[y, x]:
                reachable[y, x] = True
                q.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if seed[y, x] and not barrier[y, x] and not reachable[y, x]:
                reachable[y, x] = True
                q.append((y, x))

    while q:
        y, x = q.popleft()
        for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)):
            ny, nx = y + dy, x + dx
            if (
                0 <= ny < h
                and 0 <= nx < w
                and not reachable[ny, nx]
                and not barrier[ny, nx]
                and seed[ny, nx]
            ):
                reachable[ny, nx] = True
                q.append((ny, nx))

    return reachable


def flood_from_edges(seed: np.ndarray) -> np.ndarray:
    """BFS flood-fill from image borders through True seed pixels."""
    h, w = seed.shape
    reachable = np.zeros((h, w), dtype=bool)
    q: deque[tuple[int, int]] = deque()

    for x in range(w):
        for y in (0, h - 1):
            if seed[y, x] and not reachable[y, x]:
                reachable[y, x] = True
                q.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if seed[y, x] and not reachable[y, x]:
                reachable[y, x] = True
                q.append((y, x))

    while q:
        y, x = q.popleft()
        for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and not reachable[ny, nx] and seed[ny, nx]:
                reachable[ny, nx] = True
                q.append((ny, nx))

    return reachable


def background_seed_mask(rgb: np.ndarray, idx: int) -> np.ndarray:
    """
    Pixels that belong to the studio background: cream panna, cast shadows, black bars.
    External cast shadows must be removable via edge flood-fill.
    """
    rgb_f = rgb.astype(np.float32)
    bg = estimate_bg_color(rgb).astype(np.float32)
    diff = np.linalg.norm(rgb_f - bg, axis=2)
    lum = rgb_f.mean(axis=2)
    sat = rgb_f.max(axis=2) - rgb_f.min(axis=2)
    bg_lum = float(bg.mean())

    is_black = lum < 15
    is_cream = (diff < 42) | ((lum > 196) & (sat < 42))
    # Cast shadows on panna: darker than bg, still low saturation, hue-close to cream.
    is_shadow = (diff < 72) & (lum < bg_lum - 6) & (lum > 28) & (sat < 52)

    if idx >= CAD_START:
        # CAD: flood cream margins + shadows, keep the paper sheet body.
        is_margin = (diff < 38) & (lum > 208) & (sat < 32)
        return is_black | is_shadow | is_margin

    return is_black | is_cream | is_shadow


def cast_shadow_pixels(rgb: np.ndarray, idx: int) -> np.ndarray:
    """Soft cast-shadow tones (studio floor shadow), not solid structure."""
    if idx >= CAD_START:
        return np.zeros(rgb.shape[:2], dtype=bool)

    rgb_f = rgb.astype(np.float32)
    bg = estimate_bg_color(rgb).astype(np.float32)
    diff = np.linalg.norm(rgb_f - bg, axis=2)
    lum = rgb_f.mean(axis=2)
    sat = rgb_f.max(axis=2) - rgb_f.min(axis=2)
    bg_lum = float(bg.mean())

    return (diff < 72) & (lum < bg_lum - 6) & (lum > 28) & (sat < 52)


def largest_component(mask: np.ndarray) -> np.ndarray:
    labeled, n = ndimage.label(mask)
    if n == 0:
        return mask
    sizes = ndimage.sum(mask, labeled, range(1, n + 1))
    keep = int(np.argmax(sizes)) + 1
    return labeled == keep


def build_wall_barrier(rembg_fg: np.ndarray, idx: int) -> np.ndarray:
    """Morphological wall shell that blocks background flood from entering the interior."""
    struct = ndimage.generate_binary_structure(2, 2)
    closed = ndimage.binary_closing(rembg_fg, structure=struct, iterations=4 if idx < CAD_START else 2)
    dilate_iters = 16 if idx < CAD_START else 5
    return ndimage.binary_dilation(closed, structure=struct, iterations=dilate_iters)


def build_object_mask(rgb: np.ndarray, alpha_rembg: np.ndarray, idx: int) -> tuple[np.ndarray, np.ndarray]:
    """
    Object = complement of background flood blocked by wall shell.
    Returns (object_mask, wall_barrier).
    """
    rembg_fg = alpha_rembg > 127
    seed = background_seed_mask(rgb, idx)
    barrier = build_wall_barrier(rembg_fg, idx)
    reachable = flood_with_barrier(seed, barrier)

    obj = ~reachable
    obj |= rembg_fg & ~reachable

    obj = largest_component(obj)
    struct = ndimage.generate_binary_structure(2, 1)
    obj = ndimage.binary_opening(obj, structure=struct, iterations=1)
    return obj, barrier


def alpha_from_mask(rgb: np.ndarray, obj_mask: np.ndarray, barrier: np.ndarray, idx: int) -> np.ndarray:
    """
    Opaque core + feathered outer edge.
    External cast shadows get very low alpha so the object appears to float on black.
    """
    if not obj_mask.any():
        return np.zeros(obj_mask.shape, dtype=np.uint8)

    struct = ndimage.generate_binary_structure(2, 2)
    is_shadow = cast_shadow_pixels(rgb, idx)
    footprint = ndimage.binary_fill_holes(barrier)

    # Interior zone: floor + furniture — keep fully opaque (incl. internal shading).
    interior_safe = ndimage.binary_erosion(footprint & obj_mask, structure=struct, iterations=6)

    # External cast shadows: shadow-toned pixels outside the safe interior.
    external_shadow = obj_mask & is_shadow & ~interior_safe

    lum = rgb.mean(axis=2).astype(np.float32)
    bg_lum = float(estimate_bg_color(rgb).mean())

    alpha = np.zeros(obj_mask.shape, dtype=np.uint8)
    alpha[obj_mask & ~external_shadow] = 255

    if external_shadow.any():
        strength = np.clip((bg_lum - lum) / max(bg_lum - 35.0, 1.0), 0.0, 1.0)
        shadow_alpha = (
            EXTERNAL_SHADOW_ALPHA_MIN
            + strength * (EXTERNAL_SHADOW_ALPHA_MAX - EXTERNAL_SHADOW_ALPHA_MIN)
        ).astype(np.uint8)
        alpha[external_shadow] = shadow_alpha[external_shadow]

    # 1px soft edge on the solid silhouette.
    solid = alpha > 200
    edge = solid & ~ndimage.binary_erosion(solid, structure=struct, iterations=1)
    alpha[edge] = np.clip(alpha[edge], 210, 240)

    return alpha


def apply_cad_invert(rgb: np.ndarray, alpha: np.ndarray, idx: int) -> np.ndarray:
    if idx < CAD_START:
        return rgb

    blend = min(1.0, (idx - CAD_START) / CAD_BLEND_FRAMES)
    if blend <= 0:
        return rgb

    fg = alpha > 0
    rgb_f = rgb.astype(np.float32)
    inverted = 255.0 - rgb_f
    rgb_f[fg] = rgb_f[fg] * (1.0 - blend) + inverted[fg] * blend
    return np.clip(rgb_f, 0, 255).astype(np.uint8)


def tight_bbox(alpha: np.ndarray, thresh: int = 40):
    ys, xs = np.where(alpha > thresh)
    if len(xs) == 0:
        return None
    return int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())


def resize_rgba_separate(rgba: np.ndarray, size: tuple[int, int]) -> np.ndarray:
    nw, nh = size
    rgb = rgba[:, :, :3]
    alpha = rgba[:, :, 3]

    rgb_img = Image.fromarray(rgb, "RGB").resize((nw, nh), Image.Resampling.LANCZOS)
    alpha_img = Image.fromarray(alpha, "L").resize((nw, nh), Image.Resampling.LANCZOS)
    alpha_np = np.asarray(alpha_img).astype(np.uint8)

    return np.dstack([np.asarray(rgb_img), alpha_np])


def composite_to_canvas(rgba: np.ndarray) -> Image.Image:
    alpha = rgba[:, :, 3]
    bb = tight_bbox(alpha)
    if bb is None:
        return Image.new("RGBA", (OUT_W, OUT_H), (0, 0, 0, 0))

    x0, y0, x1, y1 = bb
    crop = rgba[y0 : y1 + 1, x0 : x1 + 1]
    ch, cw = crop.shape[0], crop.shape[1]
    scale = min(TW / cw, TH / ch)
    nw = max(1, int(cw * scale))
    nh = max(1, int(ch * scale))

    piece = Image.fromarray(resize_rgba_separate(crop, (nw, nh)), "RGBA")
    canvas = Image.new("RGBA", (OUT_W, OUT_H), (0, 0, 0, 0))
    canvas.paste(piece, (TCX - nw // 2, TCY - nh // 2), piece)
    return canvas


def composite_on_bg(canvas: Image.Image, bg_rgb: tuple[int, int, int]) -> Image.Image:
    bg = Image.new("RGBA", canvas.size, (*bg_rgb, 255))
    bg.alpha_composite(canvas)
    return bg.convert("RGB")


def process_frame(idx: int, src_path: Path, session) -> Image.Image:
    if idx == 0:
        return Image.open(S0_LAST).convert("RGBA")

    im = Image.open(src_path).convert("RGB")
    rgb = np.asarray(im)

    if idx <= LETTERBOX_LAST:
        rgb = fill_letterbox(rgb)

    cropped = rgb[CROP_Y0:CROP_Y1, 0:2160, :]

    out_rembg = remove(Image.fromarray(cropped, "RGB"), session=session)
    alpha_rembg = np.asarray(out_rembg.split()[3])

    obj_mask, barrier = build_object_mask(cropped, alpha_rembg, idx)
    alpha = alpha_from_mask(cropped, obj_mask, barrier, idx)

    rgb_out = apply_cad_invert(cropped, alpha, idx)
    rgba = np.dstack([rgb_out, alpha])
    return composite_to_canvas(rgba)


def write_preview_html(frame_indices: list[int]) -> None:
    rows = []
    for idx in frame_indices:
        label = f"frame_{idx:03d}"
        rows.append(
            f"""<div class="card">
  <h2>{label}</h2>
  <div class="pair">
    <figure><img src="{label}_red.webp" alt="{label} red"><figcaption>Rosso (halo QA)</figcaption></figure>
    <figure><img src="{label}_black.webp" alt="{label} black"><figcaption>Nero sito</figcaption></figure>
  </div>
</div>"""
        )

    html = f"""<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="utf-8">
  <title>scroll-1 preview_v2</title>
  <style>
    body {{ background:#111; color:#eee; font-family:system-ui,sans-serif; margin:24px; }}
    h1 {{ font-weight:500; }}
    .grid {{ display:grid; gap:24px; }}
    .card {{ background:#1a1a1a; border-radius:12px; padding:16px; }}
    .pair {{ display:grid; grid-template-columns:1fr 1fr; gap:16px; }}
    img {{ width:100%; height:auto; border-radius:8px; background:#000; }}
    figcaption {{ opacity:.7; font-size:13px; margin-top:8px; }}
  </style>
</head>
<body>
  <h1>scroll-1 cutout preview (v2)</h1>
  <div class="grid">
{chr(10).join(rows)}
  </div>
</body>
</html>"""
    (PREVIEW_DIR / "index.html").write_text(html, encoding="utf-8")


def run_preview(frame_indices: list[int], model: str) -> None:
    PREVIEW_DIR.mkdir(parents=True, exist_ok=True)
    (PREVIEW_DIR / "png").mkdir(exist_ok=True)
    files = sorted(glob.glob(str(SRC_DIR / "frame_*.jpg")))
    session = new_session(model)

    print(f"Preview: {len(frame_indices)} frames, model={model}")
    for idx in frame_indices:
        if idx == 0:
            canvas = Image.open(S0_LAST).convert("RGBA")
        else:
            src = Path(files[idx])
            print(f"  processing {src.name}...")
            canvas = process_frame(idx, src, session)

        for suffix, bg in [("red", BG_RED), ("black", BG_BLACK)]:
            out = composite_on_bg(canvas, bg)
            stem = f"frame_{idx:03d}_{suffix}"
            out.save(PREVIEW_DIR / f"{stem}.webp", "WEBP", quality=90, method=5)
            out.save(PREVIEW_DIR / "png" / f"{stem}.jpg", "JPEG", quality=92)
            print(f"    -> {stem}.webp")

    write_preview_html(frame_indices)
    print(f"Preview HTML: {PREVIEW_DIR / 'index.html'}")


def run_all(model: str) -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    files = sorted(glob.glob(str(SRC_DIR / "frame_*.jpg")))
    session = new_session(model)

    print(f"Batch: {len(files)} frames, model={model}")
    shutil.copy2(S0_LAST, OUT_DIR / "frame_000.webp")
    print("  frame_000.webp = scroll-0 frame_197 (hand-off)")

    for idx in range(1, len(files)):
        canvas = process_frame(idx, Path(files[idx]), session)
        canvas.save(OUT_DIR / f"frame_{idx:03d}.webp", "WEBP", quality=85, method=5)
        if idx % 10 == 0 or idx == len(files) - 1:
            print(f"  frame_{idx:03d}.webp done")

    total = sum(f.stat().st_size for f in OUT_DIR.glob("*.webp"))
    print(f"DONE {len(files)} webp, {total / 1024 / 1024:.1f} MB")


def parse_frames(value: str) -> list[int]:
    return [int(x.strip()) for x in value.split(",") if x.strip()]


def main() -> None:
    parser = argparse.ArgumentParser(description="Build scroll-1 transparent cutout webps")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--preview", action="store_true")
    group.add_argument("--all", action="store_true")
    parser.add_argument(
        "--frames",
        default=",".join(str(f) for f in DEFAULT_PREVIEW_FRAMES),
    )
    parser.add_argument("--model", default=DEFAULT_MODEL)
    args = parser.parse_args()

    if args.preview:
        run_preview(parse_frames(args.frames), args.model)
    else:
        run_all(args.model)


if __name__ == "__main__":
    main()
