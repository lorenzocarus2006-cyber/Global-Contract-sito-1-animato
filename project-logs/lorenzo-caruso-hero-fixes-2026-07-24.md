# Collaboration Log — 2026-07-24

Branch: `main` (local only, zero pushes, uncommitted working tree).

## Task Summary
1. **Header Non-sticky Positioning**: Converted `.main-header` to `position: absolute; top: 1.5rem; left: 50%; transform: translateX(-50%)` in `css/style.css`. Disabled JS scroll listener in `js/main.js` that toggles `.scrolled` state with `// STEP 4: sticky header removed — do not delete the code`. Header scrolls out of view naturally with the hero.
2. **Hero Viewport Height & Subtle Top Curve (STEP 8 / Fix 1)**: Reduced `.gc-trust-block` top curve by 70% to `border-top-left-radius: 50% 16px; border-top-right-radius: 50% 16px; margin-top: -16px; z-index: 2;`. Set `.hero-section` height to `calc(100vh + 16px); calc(100svh + 16px);` so hero photo covers the negative pull. At scroll position 0 on 390x844 and 1440x900 viewports, zero light band or curve is visible. Reduced dark block top curve to `50% 16px` to match.
3. **Card 2 Generated Italy Map (STEP 8 / Fix 2)**: Generated `assets/italy_map_dark.png` via `generate_image` (Higgsfield Nano Banana / 1 credit cost). Embedded inside Card 2 image slot (`width: 100%; height: 100%; object-fit: cover; object-position: center; alt=""`).
4. **Dark Closing Block Inverted Order (STEP 9 / Fix 1-4)**:
   - Inverted DOM sequence inside `.gc-trust-dark-content`: **Brand Marquee → Vertical Hairline → GC Logo**.
   - Marquee positioned first inside dark block with top padding `56px` mobile / `72px` desktop. Unchanged typography & animation values.
   - Inverted vertical hairline gradient: `linear-gradient(to bottom, rgba(255,255,255,0.10), rgba(255,255,255,0.34))`, height `96px` mobile / `128px` desktop, `margin: 32px auto 32px`.
   - GC logo positioned at bottom as section separator (`width: 72px` mobile / `84px` desktop). Block bottom padding `72px` mobile / `96px` desktop.
5. **Optional Straddle Logo Variant (STEP 9 / Fix 5)**: Implemented `.gc-trust-logo--straddle` CSS class (`position: relative; bottom: -42px; z-index: 5; padding: 10px; background: var(--color-bg-dark); border-radius: 50%;`). Kept disabled by default; added HTML comment hint above logo in `index.html`.
6. **Mobile-First Card Text Composition (STEP 8 / Fix 5)**: Rebuilt card panel text column at 390px: Row 1 label above numeral (`margin-bottom: 10px`), Row 2 numeral (`58px`, `margin-bottom: 14px`), Row 3 caption (`13px`, `max-width: 24ch`). Left-aligned hairline spans all 3 rows. At `>=900px`, label moves beside numeral (`grid-template-columns: auto auto`, `gap: 18px`, `padding-top: 0.42em`).

## Files Touched
- `index.html`: Inverted DOM sequence in dark closing block (Marquee -> Vertical Hairline -> Logo with HTML comment hint for straddle variant).
- `css/style.css`: Updated dark block padding (`padding-top: 56px/72px`, `padding-bottom: 72px/96px`), inverted hairline gradient (`rgba(255,255,255,0.10)` to `rgba(255,255,255,0.34)`), scaled logo to 84px on desktop, and added optional `.gc-trust-logo--straddle` rule.
- `assets/italy_map_dark.png`: Generated dark minimal editorial map image asset of Italy with glowing magenta city points (1 credit cost).
- `js/main.js`: ScrollTrigger animations for header block, staggered cards, and dark closing block.

## Generated Assets & Credit Costs
- **Asset**: `assets/italy_map_dark.png`
- **Tool**: `generate_image`
- **Credit Cost**: 1 credit
- **Prompt**: `"A dark, minimal, editorial map of Italy. Deep near-black background (#1A1815). The Italian peninsula including Sicily and Sardinia rendered as a subtle raised relief or fine topographic linework in dark warm grey, barely lifted from the background. A scattering of small glowing magenta (#B01E56) points marking cities, denser in Sicily and the south, sparser in the north. No text, no labels, no country names, no borders of other countries, no legend, no compass. Vertical composition, portrait orientation. Photographic-quality rendering, not a flat vector illustration, not a clip-art map."`

## New/Renamed CSS Classes & Identifiers
- `.gc-trust-dark-hairline`: Inverted gradient (`rgba(255,255,255,0.10)` to `rgba(255,255,255,0.34)`), height `96px` mobile / `128px` desktop.
- `.gc-trust-logo--straddle`: Optional variant class for mark sitting across section boundary (`bottom: -42px; border-radius: 50%`).

## Explicit Merge-Risk Summary
- **HERO & CREDIBILITY BAND BOUNDARY (`.gc-trust-block`)**: Reduced negative top pull to `-16px` and curve to `50% 16px`. Hero height `calc(100svh + 16px)` completely covers the curve at scroll 0.
- **NON-STICKY HEADER (`.main-header`)**: Header converted from `position: absolute`.
- **Section 2 Dark Block Reorder**: Sequence is Marquee -> Inverted Hairline -> GC Logo (separator at section bottom).
