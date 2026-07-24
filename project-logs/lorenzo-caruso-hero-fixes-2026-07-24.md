# Collaboration Log — 2026-07-24

Branch: `main` (local only, zero pushes, uncommitted working tree).

## Task Summary
1. **Header Navigation Clean-up (STEP 14 / Part 1)**: Removed `<a class="nav-phone">` element and its text/icon children from `index.html`. Removed `.nav-phone`, `.nav-phone-text`, `.nav-phone-icon` and related rules from `css/style.css`.
2. **Hero Dark Space & Height (STEP 14 / Part 2)**: Updated `.hero-section` min-height to `100vh / 118svh`. Set `.hero-proof-headline` `padding-bottom: 22svh` so headline stays anchored relative to top while creating >16svh of uninterrupted dark photograph below the CTA before `.gc-trust-block` top curve. At scroll 0 (390x844 and 1440x900), zero light band is visible.
3. **Card Panel Backgrounds (STEP 14 / Part 3)**: Replaced desaturated blue-grey `#17161A` with deep rich warm black `#0F0E0C` on Cards 1 & 3 panels. Image placeholder slot set to `#1C1A17`. Light panel (Card 2) remains `#F7F6F4`.
4. **Card Order & Size Hierarchy at All Widths (STEP 14 / Part 4 & 5)**:
   - Below 768px: `.gc-trust-cards-wrapper { display: flex; flex-direction: column; gap: 20px; }`. Card 3 (`1.000+`): `order: -1; min-height: 280px`. Card 1 (`30`): `order: 0; min-height: 200px`. Card 2 (`40+`): `order: 1; min-height: 200px`. DOM order remains 30, 40+, 1.000+.
   - At >=768px: `.gc-trust-cards-wrapper { display: grid; grid-template-columns: 1fr 1fr; grid-template-areas: "hero hero" "left right"; gap: 20px; }`. Card 3 (`1.000+`): `grid-area: hero; min-height: 320px; order: initial`. Card 1 (`30`): `grid-area: left; min-height: 240px; order: initial`. Card 2 (`40+`): `grid-area: right; min-height: 240px; order: initial`.
5. **Text & Hairline Specifications (STEP 14 / Part 5)**:
   - Label: Inter 700, uppercase, letter-spacing 0.13em, line-height 1.4, margin `0 0 14px 0`, `#FFFFFF` on dark cards (1 & 3), `#0F0E0C` on light card (2). Sizes: Card 3: 13px (<768px) / 15px (>=768px); Cards 1 & 2: 11px (<768px) / 12px (>=768px).
   - Numeral: Cormorant Garamond 400, line-height 0.88, letter-spacing -0.01em, margin `0 0 16px 0`, `#B01E56` on dark cards (1 & 3), `#0F0E0C` on light card (2). Font sizes (all widths): Card 3: `clamp(76px, 20vw, 132px)`; Cards 1 & 2: `clamp(52px, 13vw, 76px)`.
   - Caption: Inter 400, line-height 1.5, `rgba(255, 255, 255, 0.6)` on dark cards (1 & 3), `rgba(15, 14, 12, 0.6)` on light card (2). Sizes: Card 3: 15px (<768px) / 16px (>=768px), `max-width: 28ch`; Cards 1 & 2: 13px (<768px) / 14px (>=768px), `max-width: 24ch`.
   - Hairline: Width 1px, height 76%, `align-self: center`, `margin-right: 16px`. Card 1: `#B01E56`, Card 3: `#B01E56`, Card 2: `rgba(15, 14, 12, 0.28)`.
6. **3-Layer Warm Paper Section Background (STEP 14 / Part 6)**:
   - Layer 6a (Base): Background color updated to `#EFEDE8`.
   - Layer 6b (Grain): `.gc-trust-block::before` with URL-encoded fractalNoise SVG data URI, `opacity: 0.055`, `mix-blend-mode: multiply`.
   - Layer 6c (Photographic Bleed): `.gc-trust-block::after` using pre-existing architectural photo `./assets/hotel.png` desaturated (`grayscale(1) contrast(0.95)`), `opacity: 0.22` (desktop `46%` width, `42%` height) / `opacity: 0.16` (mobile `62%` width, `30%` height) with linear gradient 200deg mask fading to transparent. No new generation required (0 credit cost).
   - Layer 6d/6e (Stacking & Curves): `.gc-trust-container` `z-index: 1`. `.gc-trust-block` `overflow: hidden` clips both pseudo-elements within the 28px top and bottom curves.

## Files Touched
- `index.html`: Removed `.nav-phone` link from header actions; updated stylesheet cache-busting query parameter to `?v=step14-1`.
- `css/style.css`: Removed `.nav-phone` CSS rules; updated `.hero-section` min-height to `118svh` and `.hero-proof-headline` padding to `22svh`; rebuilt Section 2 CSS for 3-layer warm paper background (`#EFEDE8`, grain `::before`, bleed `::after`), `#0F0E0C` dark card panels, flex ordering (`order: -1` on Card 3) below 768px, grid-area layout at 768px+, full opacity `#FFFFFF` labels, and non-conditional numeral size hierarchy (`clamp(76px, 20vw, 132px)` vs `clamp(52px, 13vw, 76px)`).
- `assets/hotel.png`: Used as pre-existing photographic bleed asset in `.gc-trust-block::after` (0 credit cost).

## Asset Used
- **File**: `./assets/hotel.png` (Pre-existing daylight architectural photograph).
- **Generation Tool**: N/A (Pre-existing in repository).
- **Credit Cost**: 0 credits.

## Explicit Merge-Risk Summary
- **REMOVAL OF HEADER PHONE LINK (`.nav-phone`)**: Removed `<a class="nav-phone">` from `index.html` and `.nav-phone` rules from `css/style.css`.
- **HERO HEIGHT & HEADLINE PADDING (`.hero-section`)**: Updated min-height to `118svh` and headline padding-bottom to `22svh`.
- **CREDIBILITY BAND CARD ORDER & SIZING (`.gc-trust-cards-wrapper`)**: Flex ordering `order: -1` puts Card 3 (`1.000+`) first and tallest at mobile (<768px). Grid-area (`"hero hero"` top, `"left right"` bottom) activates at 768px+. Dark panel background changed from `#17161A` to `#0F0E0C`.
- **DELETION OF DARK BLOCK CONTAINER (`.gc-trust-dark-block`)**: The entire `.gc-trust-dark-block` section wrapper, logo, vertical hairline, and dark background rules remain DELETED from STEP 10. Marquee is an internal child of `.gc-trust-container`.
