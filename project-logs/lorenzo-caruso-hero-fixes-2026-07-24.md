# Collaboration Log — 2026-07-24

Branch: `main` (local only, zero pushes, uncommitted working tree).

## Task Summary
1. **Header Navigation Clean-up (STEP 14 / Part 1)**: Removed `<a class="nav-phone">` element and its text/icon children from `index.html`. Removed `.nav-phone`, `.nav-phone-text`, `.nav-phone-icon` and related rules from `css/style.css`.
2. **Hero Dark Space & Height (STEP 14 / Part 2)**: Updated `.hero-section` min-height to `100vh / 118svh`. Set `.hero-proof-headline` `padding-bottom: 22svh` so headline stays anchored relative to top while creating >16svh of uninterrupted dark photograph below the CTA before `.gc-trust-block` top curve. At scroll 0 (390x844 and 1440x900), zero light band is visible.
3. **Card Panel Backgrounds (STEP 14 / Part 3)**: Replaced desaturated blue-grey `#17161A` with deep rich warm black `#0F0E0C` on Cards 1 & 3 panels. Image placeholder slot set to `#1C1A17`. Light panel (Card 2) remains `#F7F6F4`.
4. **Card Order & Size Hierarchy at All Widths (STEP 14 / Part 4 & 5 & STEP 15 / FIX 1)**:
   - Below 768px: `.gc-trust-cards-wrapper { display: flex; flex-direction: column; gap: 20px; }`. Card 3 (`1.000+`): `order: -1; min-height: 250px`. Card 1 (`30`): `order: 0; min-height: 215px`. Card 2 (`40+`): `order: 1; min-height: 215px`. DOM order remains 30, 40+, 1.000+.
   - At >=768px: `.gc-trust-cards-wrapper { display: grid; grid-template-columns: 1fr 1fr; grid-template-areas: "hero hero" "left right"; gap: 20px; }`. Card 3 (`1.000+`): `grid-area: hero; min-height: 290px; order: initial`. Card 1 (`30`): `grid-area: left; min-height: 250px; order: initial`. Card 2 (`40+`): `grid-area: right; min-height: 250px; order: initial`.
   - Numeral Clamps (STEP 15 / FIX 1): Card 3 (`1.000+`): `clamp(64px, 13vw, 96px)`; Cards 1 & 2 (`30` and `40+`): `clamp(54px, 11vw, 76px)`.
   - Label Sizes (STEP 15 / FIX 1): Card 3 (`1.000+`): `12px` (<768px) / `14px` (>=768px); Cards 1 & 2: `11px` (<768px) / `12px` (>=768px).
   - Caption Sizes (STEP 15 / FIX 1): Card 3 (`1.000+`): `14px` (<768px) / `15px` (>=768px); Cards 1 & 2: `13px` (<768px) / `14px` (>=768px).
5. **Panel Composition — Side-by-Side Numeral and Text Block (STEP 15 / FIX 2)**:
   - Rebuilt panel interior: `[vertical hairline (100% height)] [18px gap] [numeral (flex: 0 0 auto, white-space: nowrap)] [22px gap] [text block (flex: 1 1 auto)]`.
   - Text block contains: label (`padding-top: 0.14em` for optical alignment), short horizontal rule (`height: 1px`, `max-width: 140px`, `rgba(255,255,255,0.18)` / `rgba(15,14,12,0.18)`), and caption (`max-width: 26ch`).
   - Side-by-side flex row holds at ALL widths including 390px (mobile gap `16px`).
6. **3-Layer Warm Paper Section Background & Grain (STEP 15 / FIX 3 & FIX 4)**:
   - Base Layer `#EFEDE8`.
   - Grain Layer `::before`: URL-encoded fractalNoise SVG data URI with `opacity: 0.07`, `mix-blend-mode: multiply`. Computed background-image resolved.
   - Photographic Bleed `::after`: Positioned `top: 0; right: 0;` (width `38%` desktop / `52%` mobile, height `34%` desktop / `22%` mobile, `opacity: 0.30` desktop / `0.18` mobile) with diagonal gradient mask. Corner exterior facade image asset `building_corner_bleed.png` approval gate submitted (1 credit cost).

## Files Touched
- `index.html`: Updated cards markup for side-by-side numeral + text block layout with horizontal dividers; removed `.nav-phone` link from header; updated stylesheet query parameter to `?v=step15-1`.
- `css/style.css`: Rebuilt Section 2 CSS for side-by-side layout (`.gc-trust-card-content-group`, `.gc-trust-text-block`, `.gc-trust-card-divider`), adjusted font-size clamps (`clamp(64px, 13vw, 96px)` vs `clamp(54px, 11vw, 76px)`), updated card min-heights, updated grain opacity to `0.07`, and configured top-right exterior corner bleed rules.

## Asset Used / Approval Gate
- **Status**: Pending explicit user approval.
- **Proposed Asset Filename**: `building_corner_bleed.png`
- **Target Path**: `/Users/lorenzocaruso/Desktop/GC, FINAL/assets/building_corner_bleed.png`
- **Generation Tool**: `generate_image`
- **Credit Cost**: 1 credit
- **Proposed Prompt**: `"The upper corner of a contemporary commercial building photographed from below against an overcast bright white sky. Clean concrete and glass facade with strong diagonal geometry, hard linear shadows, no signage, no text, no people, no cars. Muted natural daylight, documentary architectural photography, sharp architectural focus, photographic quality, not a 3D render, not an illustration."`

## Explicit Merge-Risk Summary
- **PANEL INTERIOR STRUCTURE (`.gc-trust-text-block`, `.gc-trust-card-divider`)**: Rebuilt DOM inside `.gc-trust-card-panel` to place numeral and text block side-by-side. Added `.gc-trust-card-divider` hairline below labels.
- **CARD HIERARCHY & CLAMPS (`.gc-trust-num`)**: Reduced clamp ranges to `clamp(64px, 13vw, 96px)` (Card 3) and `clamp(54px, 11vw, 76px)` (Cards 1 & 2). Reduced card min-heights.
- **GRAIN OPACITY (`.gc-trust-block::before`)**: Increased grain opacity to `0.07`.
- **TOP-RIGHT BLEED GEOMETRY (`.gc-trust-block::after`)**: Updated bleed geometry to `38%` width / `34%` height (desktop) and `52%` width / `22%` height (mobile) with `linear-gradient(215deg, ...)` mask.
