# Collaboration Log — 2026-07-24

Branch: `main` (local only, zero pushes, uncommitted working tree).

## Task Summary
1. **Header Non-sticky Positioning**: Converted `.main-header` to `position: absolute; top: 1.5rem; left: 50%; transform: translateX(-50%)` in `css/style.css`. Disabled JS scroll listener in `js/main.js` that toggles `.scrolled` state with `// STEP 4: sticky header removed — do not delete the code`. Header scrolls out of view naturally with the hero.
2. **Hero Viewport Height & Dual 28px Curves (STEP 11 / Fix 1)**: Set `.gc-trust-block` `border-top-radius: 50% 28px; border-bottom-radius: 50% 28px; margin-top: -28px; margin-bottom: -28px; z-index: 6;`. Stacking context `z-index: 6` elevates `.gc-trust-block` above `.sectors-section` (`z-index: var(--z-content)` [5]) so the 28px bottom curve renders visibly over the dark background. Set `.hero-section` height to `calc(100vh + 28px); calc(100svh + 28px);` so hero photo covers the negative top pull; zero light band is visible at scroll position 0.
3. **Substantial Marquee Typography (STEP 11 / Fix 2)**: Scaled brand name in marquee to Inter 700 weight, 26px mobile / 34px desktop, letter-spacing 0.02em, `#1A1A1A` full opacity. Sector label: Inter 400, 15px mobile / 18px desktop, `color: rgba(176, 30, 86, 0.8)`. Em-dash: `rgba(26,26,26,0.28)`. Middot: 20px, `rgba(26,26,26,0.2)`, margin 0 44px mobile / 0 56px desktop. Wrapper vertical padding: `6px 0`.
4. **Card 2 Generated Italy Map (STEP 8 / Fix 2)**: Generated `assets/italy_map_dark.png` via `generate_image` (Higgsfield Nano Banana / 1 credit cost). Embedded inside Card 2 image slot (`width: 100%; height: 100%; object-fit: cover; object-position: center; alt=""`).
5. **Dark Closing Block Deletion (STEP 10 / Fix 1)**: Removed `.gc-trust-dark-block` container element and all associated rules from both `index.html` and `css/style.css`. Removed GC logo (`.gc-trust-logo-img`), straddle variant (`.gc-trust-logo--straddle`), vertical hairline (`.gc-trust-dark-hairline`), background texture (`.gc-trust-dark-texture`), and `.gc-trust-dark-content`.
6. **Marquee Absorbed into Light Band (STEP 10 / Fix 2 & 3)**: Relocated marquee into `.gc-trust-container` directly after Card 3. Added horizontal hairline above marquee (`.gc-trust-horizontal-hairline`, `width: 100%; height: 1px; background: rgba(26,26,26,0.14); margin-top: 56px/72px; margin-bottom: 28px;`). Section bottom padding after marquee: `64px` mobile / `88px` desktop.
7. **Mobile-First Card Text Composition (STEP 8 / Fix 5)**: Rebuilt card panel text column at 390px: Row 1 label above numeral (`margin-bottom: 10px`), Row 2 numeral (`58px`, `margin-bottom: 14px`), Row 3 caption (`13px`, `max-width: 24ch`). Left-aligned hairline spans all 3 rows. At `>=900px`, label moves beside numeral (`grid-template-columns: auto auto`, `gap: 18px`, `padding-top: 0.42em`).

## Files Touched
- `css/style.css`: Updated `.hero-section` height to `calc(100svh + 28px)`. Set `.gc-trust-block` top and bottom radii to `50% 28px`, negative top/bottom margins to `-28px`, and `z-index: 6`. Scaled marquee brand names to 700 weight 26px/34px `#1A1A1A`, wrapper padding `6px 0`, and middots 44px/56px.
- `index.html`: (Unchanged in STEP 11).
- `assets/italy_map_dark.png`: Generated dark minimal editorial map image asset of Italy with glowing magenta city points (1 credit cost).
- `js/main.js`: ScrollTrigger animations for header block and staggered cards.

## Values Changed (STEP 11)
- `.hero-section`: `height: calc(100vh + 28px); height: calc(100svh + 28px);`
- `.gc-trust-block`: `border-top-left-radius: 50% 28px; border-top-right-radius: 50% 28px; border-bottom-left-radius: 50% 28px; border-bottom-right-radius: 50% 28px; margin-top: -28px; margin-bottom: -28px; z-index: 6;`
- `.gc-trust-brand-name`: `font-weight: 700; font-size: 26px (34px desktop); letter-spacing: 0.02em; color: #1A1A1A;`
- `.gc-trust-brand-sector`: `font-size: 15px (18px desktop); color: rgba(176, 30, 86, 0.8);`
- `.gc-trust-brand-sep`: `color: rgba(26, 26, 26, 0.28); margin: 0 0.5rem;`
- `.gc-trust-middot`: `margin: 0 44px (56px desktop); color: rgba(26, 26, 26, 0.2); font-size: 20px;`
- `.gc-trust-marquee-wrapper`: `padding: 6px 0;`

## Generated Assets & Credit Costs
- **Asset**: `assets/italy_map_dark.png`
- **Tool**: `generate_image`
- **Credit Cost**: 1 credit
- **Prompt**: `"A dark, minimal, editorial map of Italy. Deep near-black background (#1A1815). The Italian peninsula including Sicily and Sardinia rendered as a subtle raised relief or fine topographic linework in dark warm grey, barely lifted from the background. A scattering of small glowing magenta (#B01E56) points marking cities, denser in Sicily and the south, sparser in the north. No text, no labels, no country names, no borders of other countries, no legend, no compass. Vertical composition, portrait orientation. Photographic-quality rendering, not a flat vector illustration, not a clip-art map."`

## Explicit Merge-Risk Summary
- **HERO & CREDIBILITY BAND BOUNDARIES (`.gc-trust-block`)**: Dual 28px curves with `-28px` negative margins at both top and bottom of `.gc-trust-block`. `.gc-trust-block` has `z-index: 6` so bottom curve renders visibly over `.sectors-section` (`z-index: 5`). Hero height `calc(100svh + 28px)` completely covers top curve at scroll 0.
- **DELETION OF DARK BLOCK CONTAINER (`.gc-trust-dark-block`)**: **CRITICAL MERGE RISK**. The entire `.gc-trust-dark-block` section wrapper, logo, vertical hairline, and dark background rules have been DELETED. Marquee is now an internal child of `.gc-trust-container`. If parallel work on `main` attempts to target or modify `.gc-trust-dark-block`, git merge conflicts will occur in both `index.html` and `css/style.css`.
- **NON-STICKY HEADER (`.main-header`)**: Header converted from `position: absolute`.
