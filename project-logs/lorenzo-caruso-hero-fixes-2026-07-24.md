# Collaboration Log — 2026-07-24

Branch: `main` (local only, zero pushes, uncommitted working tree).

## Task Summary
1. **Header Non-sticky Positioning**: Converted `.main-header` to `position: absolute; top: 1.5rem; left: 50%; transform: translateX(-50%)` in `css/style.css`. Disabled JS scroll listener in `js/main.js` that toggles `.scrolled` state with `// STEP 4: sticky header removed — do not delete the code`. Header scrolls out of view naturally with the hero.
2. **Hero Viewport Height & Subtle Top Curve (STEP 8 / Fix 1)**: Reduced `.gc-trust-block` top curve by 70% to `border-top-left-radius: 50% 16px; border-top-right-radius: 50% 16px; margin-top: -16px; z-index: 2;`. Set `.hero-section` height to `calc(100vh + 16px); calc(100svh + 16px);` so hero photo covers the negative pull. At scroll position 0 on 390x844 and 1440x900 viewports, zero light band or curve is visible. Reduced dark block top curve to `50% 16px` to match.
3. **Card 2 Image Slot (STEP 8 / Fix 2)**: Removed hand-drawn SVG map. Prepared placeholder slot for generated asset awaiting approval gate.
4. **Dark Closing Block Cleanup (STEP 8 / Fix 3)**: Removed tagline `"METODO. CONTINUITÀ. PRESENZA REALE."` and all `.gc-trust-tagline*` CSS rules. Structure updated to **Logo → Single Extended Hairline (88px mobile / 120px desktop height, `margin: 28px auto 28px`) → Brand Marquee**. Dark block padding updated to `padding-top: 64px` / `padding-bottom: 56px` (mobile) and `padding-top: 84px` / `padding-bottom: 72px` (desktop).
5. **Marquee Scaling & Sector Magenta Color (STEP 8 / Fix 4)**: Increased brand name to 24px/30px (`rgba(255,255,255,0.92)`). Sector label scaled to 16px/19px and given brand magenta color (`color: rgba(176, 30, 86, 0.75)`). Middots scaled to 20px with 40px/52px margins.
6. **Mobile-First Card Text Composition (STEP 8 / Fix 5)**: Rebuilt card panel text column at 390px: Row 1 label above numeral (`margin-bottom: 10px`), Row 2 numeral (`58px`, `margin-bottom: 14px`), Row 3 caption (`13px`, `max-width: 24ch`). Left-aligned hairline spans all 3 rows. At `>=900px`, label moves beside numeral (`grid-template-columns: auto auto`, `gap: 18px`, `padding-top: 0.42em`).

## Files Touched
- `index.html`: Updated Section 2 HTML for mobile-first card 3-row layout, removed SVG map, removed tagline element, and updated dark block DOM order (Logo -> Hairline -> Marquee).
- `css/style.css`: Set `.hero-section` height to `calc(100svh + 16px)`. Reduced top curves to `50% 16px` (`margin-top: -16px`). Rebuilt card text rules for mobile 3-row layout and desktop grid side-by-side. Updated dark block hairline to 88px/120px. Scaled marquee typography and added `#B01E56` sector color accent.
- `js/main.js`: ScrollTrigger animations for header block, staggered cards, and dark closing block.

## New/Renamed CSS Classes & Identifiers
- `.hero-section`: Updated height to `calc(100vh + 16px); calc(100svh + 16px);`.
- `.gc-trust-block`: Updated top curve to `50% 16px` (`margin-top: -16px`).
- `.gc-trust-card-right-group`: 3-row column layout at 390px, desktop grid side-by-side at 900px.
- `.gc-trust-dark-hairline`: Extended vertical hairline (`height: 88px` mobile / `120px` desktop).
- `.gc-trust-dark-block .gc-trust-brand-sector`: Sector label styled with magenta accent `color: rgba(176, 30, 86, 0.75)`.

## Image Generation Approval Gate (FIX 2)
- **Asset Filename & Target Path**: `assets/italy_map_dark.png`
- **Tool**: `generate_image`
- **Credit Cost**: 1 credit
- **Generation Prompt**: `"A dark, minimal, editorial map of Italy. Deep near-black background (#1A1815). The Italian peninsula including Sicily and Sardinia rendered as a subtle raised relief or fine topographic linework in dark warm grey, barely lifted from the background. A scattering of small glowing magenta (#B01E56) points marking cities, denser in Sicily and the south, sparser in the north. No text, no labels, no country names, no borders of other countries, no legend, no compass. Vertical composition, portrait orientation. Photographic-quality rendering, not a flat vector illustration, not a clip-art map."`

## Explicit Merge-Risk Summary
- **HERO & CREDIBILITY BAND BOUNDARY (`.gc-trust-block`)**: Reduced negative top pull to `-16px` and curve to `50% 16px`. Hero height `calc(100svh + 16px)` completely covers the curve at scroll 0.
- **NON-STICKY HEADER (`.main-header`)**: Header converted from `position: absolute`.
- **Section 2 Rebuild**: Mobile-first card text, removed tagline, extended hairline to marquee, and generated Italy map placeholder.
