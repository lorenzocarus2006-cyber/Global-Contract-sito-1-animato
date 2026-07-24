# Collaboration Log — 2026-07-24

Branch: `main` (local only, zero pushes, uncommitted working tree).

## Task Summary
1. **Header Non-sticky Positioning**: Converted `.main-header` to `position: absolute; top: 1.5rem; left: 50%; transform: translateX(-50%)` in `css/style.css`. Disabled JS scroll listener in `js/main.js` that toggles `.scrolled` state with `// STEP 4: sticky header removed — do not delete the code`. Header scrolls out of view naturally with the hero.
2. **Hero Viewport Height Fix (STEP 6 / Fix 1)**: Fixed `.hero-section` height to `height: 100vh; height: 100svh; margin-bottom: 0;`. Hero photo fills 100svh completely on mobile viewports so no part of the credibility band peeks through before scrolling.
3. **Card Separation (STEP 6 / Fix 2)**: Removed negative vertical overlap (`margin-bottom: -18px` deleted). Set `margin-bottom: 28px` on mobile, `36px` on desktop (last card keeps `margin-bottom: 0`). Removed z-index stacking. Strengthened shadows (`box-shadow: 0 20px 44px rgba(26,26,26,0.13)`). Updated Card 2 placeholder background to `#262320` with `box-shadow: inset 0 0 0 1px rgba(255,255,255,0.06)`. Preserved horizontal alternating offsets (`margin-right: 4%/8%` on Cards 1 & 3, `margin-left: 4%/8%` on Card 2).
4. **Dark Closing Block Order & Real Logo (STEP 6 / Fix 3)**:
   - Replaced SVG rhombus with real brand logo image (`./logo.png`, `width: 72px; height: auto; display: block; margin: 0 auto; alt="Global Contract"`).
   - Top padding above logo: `56px` mobile / `72px` desktop.
   - Vertical hairline directly below logo: `width: 1px; height: 36px; background: rgba(255,255,255,0.22); margin: 18px auto 20px;`.
   - Tagline immediately below hairline: `"METODO. CONTINUITÀ. PRESENZA REALE."`.
   - Marquee moved to the LAST position inside the block (below tagline) with `margin-top: 44px; margin-bottom: 0; z-index: 2;`.
5. **Seamless Dark Block Background (STEP 6 / Fix 4)**: Set `.gc-trust-dark-block` background to `var(--color-bg-dark)` (matching `.sectors-section` below, `#060608`). Updated marquee edge fade mask to fade to `var(--color-bg-dark)`. Removed borders, outlines, and margins at the boundary.
6. **Barely Perceptible Texture (STEP 6 / Fix 5)**: Reduced `.gc-trust-dark-texture` opacity to `rgba(255,255,255,0.015)` with radial offset `circle at 15% -20%` and 90px ring spacing, removing radial symmetry around the logo.

## Files Touched
- `index.html`: Rebuilt Section 2 (`.gc-trust-block`) HTML with header block, 3 separated staggered split cards, and dark closing block with real `./logo.png` image, vertical hairline, tagline, and marquee placed last below the tagline.
- `css/style.css`: Set `.hero-section` height to `100svh`. Rebuilt `.gc-trust-block` CSS rules (separated cards with `margin-bottom: 28px/36px`, real logo `.gc-trust-logo-img`, `var(--color-bg-dark)` background match, subtle texture opacity `0.015`, and marquee positioned below tagline).
- `js/main.js`: ScrollTrigger animations for header block, staggered cards, and dark closing block.

## New/Renamed CSS Classes & Identifiers
- `.hero-section`: Updated height to `100svh`.
- `.gc-trust-card`: Updated `margin-bottom` to `28px` (desktop `36px`), `box-shadow` to `0 20px 44px rgba(26, 26, 26, 0.13)`.
- `.gc-trust-card-img-placeholder`: `#262320` background with `box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.06)`.
- `.gc-trust-dark-block`: Background set to `var(--color-bg-dark)`.
- `.gc-trust-logo-img`: Real brand logo image (`./logo.png`).
- `.gc-trust-dark-hairline`: Hairline below logo (`height: 36px`, `margin: 18px auto 20px`).
- `.gc-trust-tagline`: Tagline below hairline.
- `.gc-trust-dark-block .gc-trust-marquee-wrapper`: Marquee placed last below tagline (`margin-top: 44px`, `z-index: 2`).

## Explicit Merge-Risk Summary
- **HERO HEIGHT (`.hero-section`)**: Updated to `100svh` to prevent any peeking on mobile.
- **NON-STICKY HEADER (`.main-header`)**: Header converted from `position: fixed` to `position: absolute`.
- **Section 2 (`.gc-trust-block`) Rebuild & Seam Match**: Dark closing block background set to `var(--color-bg-dark)` to create a seamless transition into `.sectors-section`.
