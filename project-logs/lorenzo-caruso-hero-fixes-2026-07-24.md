# Collaboration Log — 2026-07-24

Branch: `main` (local only, zero pushes, uncommitted working tree).

## Task Summary
1. **Header Navigation Clean-up (STEP 14 / Part 1)**: Removed `<a class="nav-phone">` element and its text/icon children from `index.html`. Removed `.nav-phone`, `.nav-phone-text`, `.nav-phone-icon` and related rules from `css/style.css`.
2. **Hero Dark Space & Height (STEP 14 / Part 2)**: Updated `.hero-section` min-height to `100vh / 118svh`. Set `.hero-proof-headline` `padding-bottom: 22svh` so headline stays anchored relative to top while creating >16svh of uninterrupted dark photograph below the CTA before `.gc-trust-block` top curve. At scroll 0 (390x844 and 1440x900), zero light band is visible.
3. **Card Panel Backgrounds (STEP 14 / Part 3)**: Replaced desaturated blue-grey `#17161A` with deep rich warm black `#0F0E0C` on Cards 1 & 3 panels. Image placeholder slot set to `#1C1A17`. Light panel (Card 2) remains `#F7F6F4`.
4. **Card Order & Size Hierarchy (STEP 14 / Part 4 & 5, STEP 15 / FIX 1, STEP 16 / FIX 1 & 3)**:
   - Below 900px: Panel 70% / Image 30% grid split on all three cards. Card 3 (`1.000+`): `order: -1; min-height: 260px`. Card 1 (`30`): `order: 0; min-height: 220px`. Card 2 (`40+`): `order: 1; min-height: 220px`.
   - At >=900px: Two-column grid layout (`"hero hero"` top, `"left right"` bottom). Card 3 (`1.000+`): `grid-area: hero; min-height: 290px; panel 58% / image 42%`. Card 1 (`30`): `grid-area: left; min-height: 250px; panel 62% / image 38%`. Card 2 (`40+`): `grid-area: right; min-height: 250px; image 62% / panel 38%`.
5. **Conditional Panel Composition (STEP 16 / FIX 1)**:
   - Below 900px: **STACKED COMPOSITION** (`flex-direction: column; align-items: flex-start; gap: 0`). Order top to bottom: label (`margin-bottom: 10px`) -> numeral (`margin-bottom: 12px`) -> short rule (`width 100%, max-width 120px, margin: 0 0 12px 0`) -> caption (`margin: 0, max-width: 30ch`).
   - At >=900px: **SIDE-BY-SIDE COMPOSITION** (`flex-direction: row; align-items: flex-start; gap: 22px`). Numeral on left (`flex: 0 0 auto; white-space: nowrap`), text block on right (`flex: 1 1 auto; min-width: 0`).
6. **Clipping Prevention & Caption Width (STEP 16 / FIX 2 & 4)**:
   - Panel: `min-width: 0; overflow: visible; padding-right: 20px;` so text never touches or gets clipped by image boundary.
   - Caption: `min-width: 0; width: 100%; max-width: 30ch` below 900px (`26ch` at >=900px). Renders 29 characters on first line at 390px.
7. **Photographic Bleed Diagnosis & Approval Gate (STEP 16 / FIX 5)**:
   - Diagnostic: Rule targeted `assets/building_corner_bleed.png`, which was not generated in STEP 15 due to approval gate rule, resulting in HTTP 404.
   - Fix applied: Rule set to `display: none;` on `.gc-trust-block::after`. Broken reference removed cleanly. Stopped at Approval Gate for image generation.
8. **Grain Layer Verification (STEP 16 / FIX 6)**:
   - Verbatim data URI resolved cleanly (`opacity: 0.07`, `mix-blend-mode: multiply`).

## Files Touched
- `index.html`: Added `.gc-trust-card-text-container` wrapper inside `.gc-trust-card-content-group` in all three cards to support stacked composition below 900px and side-by-side at 900px+; updated stylesheet query parameter to `?v=step16-1`.
- `css/style.css`: Rebuilt Section 2 CSS for 70/30 panel split below 900px, stacked flex column order (label -> numeral -> divider -> caption) below 900px, side-by-side flex row at 900px+, `min-width: 0; overflow: visible; padding-right: 20px` on panel, and `display: none` on missing photo bleed pseudo-element.

## Approval Gate Request (FIX 5)
- **Proposed Asset Filename**: `building_corner_bleed.png`
- **Target Path**: `/Users/lorenzocaruso/Desktop/GC, FINAL/assets/building_corner_bleed.png`
- **Generation Tool**: `generate_image`
- **Exact Credit Cost**: 1 credit
- **Proposed Prompt**: `"The upper corner of a contemporary commercial building photographed from below against a bright overcast sky, clean concrete and glass, strong diagonal geometry, no signage, no text, no people, no cars, muted natural daylight, documentary architectural photography, not a render, not an illustration."`

## Explicit Merge-Risk Summary
- **STACKED VS SIDE-BY-SIDE BREAKPOINT (`.gc-trust-card-text-container`)**: Below 900px, panel text stacks vertically (`label` -> `numeral` -> `short rule` -> `caption`). At 900px+, panel text is side-by-side (`numeral` left, `text block` right).
- **PANEL GRID SPLIT BELOW 900PX (`70% / 30%`)**: Below 900px, all three card panels take 70% width and image takes 30% width. Card 2 panel is on left (70%) and image is on right (30%) below 900px; reverses to image left (62%) and panel right (38%) at 900px+.
- **BLEED PSEUDO-ELEMENT (`.gc-trust-block::after`)**: Disabled (`display: none`) until user approves generation prompt.
