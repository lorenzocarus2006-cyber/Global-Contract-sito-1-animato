# Collaboration Log — 2026-07-24

Branch: `main` (local only, zero pushes, uncommitted working tree).

## Task Summary
1. **Header Non-sticky Positioning**: Converted `.main-header` to `position: absolute; top: 1.5rem; left: 50%; transform: translateX(-50%)` in `css/style.css`. Disabled JS scroll listener in `js/main.js` that toggles `.scrolled` state with `// STEP 4: sticky header removed — do not delete the code`. Header scrolls out of view naturally with the hero.
2. **Hero Viewport Height & Subtle Dual Curves (STEP 10 / Fix 4)**: Set `.gc-trust-block` `border-top-radius: 50% 16px; border-bottom-radius: 50% 16px; margin-top: -16px; margin-bottom: -16px; z-index: 2;`. Set `.hero-section` height to `calc(100vh + 16px); calc(100svh + 16px);` so hero photo covers the negative top pull. At scroll position 0 on 390x844 and 1440x900 viewports, zero light band or curve is visible. Negative bottom pull `-16px` pulls `.sectors-section` behind the bottom curve seamlessly.
3. **Card 2 Generated Italy Map (STEP 8 / Fix 2)**: Generated `assets/italy_map_dark.png` via `generate_image` (Higgsfield Nano Banana / 1 credit cost). Embedded inside Card 2 image slot (`width: 100%; height: 100%; object-fit: cover; object-position: center; alt=""`).
4. **Dark Closing Block Deletion (STEP 10 / Fix 1)**: Removed `.gc-trust-dark-block` container element and all associated rules from both `index.html` and `css/style.css`. Removed GC logo (`.gc-trust-logo-img`), straddle variant (`.gc-trust-logo--straddle`), vertical hairline (`.gc-trust-dark-hairline`), background texture (`.gc-trust-dark-texture`), and `.gc-trust-dark-content`.
5. **Marquee Absorbed into Light Band (STEP 10 / Fix 2 & 3)**: Relocated marquee into `.gc-trust-container` directly after Card 3. Added horizontal hairline above marquee (`.gc-trust-horizontal-hairline`, `width: 100%; height: 1px; background: rgba(26,26,26,0.14); margin-top: 56px/72px; margin-bottom: 28px;`). Restyled marquee for warm paper `#EDEAE5` background:
   - Brand name: `24px` mobile / `30px` desktop (`color: rgba(26, 26, 26, 0.85)`).
   - Em-dash: `color: rgba(26, 26, 26, 0.3)`.
   - Sector: `16px` mobile / `19px` desktop (`color: rgba(176, 30, 86, 0.85)`).
   - Middot: `20px` (`color: rgba(26, 26, 26, 0.22)`).
   - Section bottom padding after marquee: `64px` mobile / `88px` desktop.
6. **Mobile-First Card Text Composition (STEP 8 / Fix 5)**: Rebuilt card panel text column at 390px: Row 1 label above numeral (`margin-bottom: 10px`), Row 2 numeral (`58px`, `margin-bottom: 14px`), Row 3 caption (`13px`, `max-width: 24ch`). Left-aligned hairline spans all 3 rows. At `>=900px`, label moves beside numeral (`grid-template-columns: auto auto`, `gap: 18px`, `padding-top: 0.42em`).

## Files Touched
- `index.html`: Removed `.gc-trust-dark-block` container and all its contents (logo, vertical hairline, dark texture). Moved marquee into `.gc-trust-container` after Card 3 and added horizontal hairline `.gc-trust-horizontal-hairline`.
- `css/style.css`: Added dual 16px curved edges to `.gc-trust-block` (`border-top-radius: 50% 16px; border-bottom-radius: 50% 16px; margin-top: -16px; margin-bottom: -16px; padding-bottom: 64px/88px`). Restyled marquee for light background. Removed all dark block CSS selectors.
- `assets/italy_map_dark.png`: Generated dark minimal editorial map image asset of Italy with glowing magenta city points (1 credit cost).
- `js/main.js`: ScrollTrigger animations for header block and staggered cards.

## Elements & CSS Classes Removed
- `<div class="gc-trust-dark-block">` (HTML container deleted)
- `<div class="gc-trust-dark-texture">` (HTML texture deleted)
- `<div class="gc-trust-dark-content">` (HTML wrapper deleted)
- `<div class="gc-trust-dark-hairline">` (HTML vertical hairline deleted)
- `<img class="gc-trust-logo-img">` (HTML logo deleted)
- `.gc-trust-dark-block` (CSS rule removed)
- `.gc-trust-dark-texture` (CSS rule removed)
- `.gc-trust-dark-content` (CSS rule removed)
- `.gc-trust-dark-hairline` (CSS rule removed)
- `.gc-trust-logo-img` (CSS rule removed)
- `.gc-trust-logo--straddle` (CSS rule removed)
- `.gc-trust-dark-block .gc-trust-marquee-wrapper` & descendants (CSS rules removed)

## Generated Assets & Credit Costs
- **Asset**: `assets/italy_map_dark.png`
- **Tool**: `generate_image`
- **Credit Cost**: 1 credit
- **Prompt**: `"A dark, minimal, editorial map of Italy. Deep near-black background (#1A1815). The Italian peninsula including Sicily and Sardinia rendered as a subtle raised relief or fine topographic linework in dark warm grey, barely lifted from the background. A scattering of small glowing magenta (#B01E56) points marking cities, denser in Sicily and the south, sparser in the north. No text, no labels, no country names, no borders of other countries, no legend, no compass. Vertical composition, portrait orientation. Photographic-quality rendering, not a flat vector illustration, not a clip-art map."`

## Explicit Merge-Risk Summary
- **HERO & CREDIBILITY BAND BOUNDARIES (`.gc-trust-block`)**: Dual 16px curves with `-16px` negative margins at both top and bottom of `.gc-trust-block`. Hero height `calc(100svh + 16px)` completely covers the top curve at scroll 0. `.sectors-section` sits behind the bottom curve seamlessly.
- **DELETION OF DARK BLOCK CONTAINER (`.gc-trust-dark-block`)**: **CRITICAL MERGE RISK**. The entire `.gc-trust-dark-block` section wrapper, logo, vertical hairline, and dark background rules have been DELETED. Marquee is now an internal child of `.gc-trust-container`. If parallel work on `main` attempts to target or modify `.gc-trust-dark-block`, git merge conflicts will occur in both `index.html` and `css/style.css`.
- **NON-STICKY HEADER (`.main-header`)**: Header converted from `position: absolute`.
