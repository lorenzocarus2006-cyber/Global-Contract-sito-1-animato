# Collaboration Log — 2026-07-24

Branch: `main` (local only, zero pushes, uncommitted working tree).

## Task Summary
1. **Header Non-sticky Positioning**: Converted `.main-header` to `position: absolute; top: 1.5rem; left: 50%; transform: translateX(-50%)` in `css/style.css`. Disabled JS scroll listener in `js/main.js` that toggles `.scrolled` state with `// STEP 4: sticky header removed — do not delete the code`. Header scrolls out of view naturally with the hero.
2. **Hero Viewport Height & Dual 28px Curves (STEP 11 / Fix 1)**: Set `.gc-trust-block` `border-top-radius: 50% 28px; border-bottom-radius: 50% 28px; margin-top: -28px; margin-bottom: -28px; z-index: 6;`. Stacking context `z-index: 6` elevates `.gc-trust-block` above `.sectors-section` (`z-index: var(--z-content)` [5]) so the 28px bottom curve renders visibly over the dark background. Set `.hero-section` height to `calc(100vh + 28px); calc(100svh + 28px);` so hero photo covers the negative top pull; zero light band is visible at scroll position 0.
3. **Card Inverted Hierarchy (STEP 12 / Fix 1 & 4)**: Quiet label on all cards (`font-weight: 600`, `font-size: 11px` mobile / `12px` desktop, `letter-spacing: 0.14em`, `color: rgba(255,255,255,0.5)` on dark panels, `rgba(26,26,26,0.5)` on light panel, `margin-bottom: 12px`). Hairline height capped at 76% of text group (`align-self: center`, opacity 0.7 on Card 3). Numeral dominates visually above caption.
4. **Desktop 2-Row Grid Layout (STEP 12 / Fix 2 & 3)**: At `>=900px`, `.gc-trust-cards-wrapper` uses a 2-row CSS Grid:
   - `grid-template-areas: "hero hero" "left right"; gap: 20px;`
   - Top Card 3 (`1.000+`): `grid-area: hero; min-height: 300px; grid-template-columns: 58% 42%; panel padding: 40px 36px; numeral clamp(88px, 7vw, 124px); label 13px; caption 15px max-width 30ch`.
   - Bottom Left Card 1 (`30`): `grid-area: left; min-height: 230px; grid-template-columns: 62% 38%; panel padding: 30px 28px; numeral clamp(56px, 4vw, 72px); label 12px; caption 14px max-width 24ch`.
   - Bottom Right Card 2 (`40+`): `grid-area: right; min-height: 230px; grid-template-columns: 38% 62%; panel padding: 30px 28px; numeral clamp(56px, 4vw, 72px); label 12px; caption 14px max-width 24ch`.
   - DOM order remains unchanged: Card 1 (`30`), Card 2 (`40+`), Card 3 (`1.000+`).
5. **Ultra-Wide Viewport Rule (STEP 12 / Fix 5)**: At `>=1600px`, `.gc-trust-container` max-width rises to `1360px`, top card numeral caps at `124px`, and `.gc-trust-card-content-group` has `max-width: 620px` (left-aligned) to prevent empty dead zones.
6. **Card 2 Generated Italy Map (STEP 8 / Fix 2)**: Generated `assets/italy_map_dark.png` via `generate_image` (Higgsfield Nano Banana / 1 credit cost). Embedded inside Card 2 image slot (`width: 100%; height: 100%; object-fit: cover; object-position: center; alt=""`).
7. **Dark Closing Block Deletion (STEP 10 / Fix 1)**: Removed `.gc-trust-dark-block` container element and all associated rules.
8. **Marquee Absorbed into Light Band (STEP 10 / Fix 2 & 3)**: Relocated marquee into `.gc-trust-container` directly after Card 3. Substantial typography tokens (700 weight 26px/34px `#1A1A1A`).

## Files Touched
- `css/style.css`: Updated card label hierarchy rules (weight 600, 50% opacity), capped hairline height at 76% (opacity 0.7 on Card 3), added desktop 2-row grid layout for cards (`"hero hero" "left right"`), and added 1600px wide-viewport max-width rule (`1360px`).
- `index.html`: (Unchanged in STEP 12; DOM order remains 30, 40+, 1.000+).
- `assets/italy_map_dark.png`: Generated dark minimal editorial map image asset of Italy with glowing magenta city points (1 credit cost).
- `js/main.js`: ScrollTrigger animations for header block and staggered cards.

## Values Changed (STEP 12)
- `.gc-trust-cards-wrapper` (>=900px): `display: grid; grid-template-columns: 1fr 1fr; grid-template-areas: "hero hero" "left right"; gap: 20px;`
- `.gc-trust-card-3` (>=900px): `grid-area: hero; min-height: 300px; grid-template-columns: 58% 42%;`
- `.gc-trust-card-3 .gc-trust-card-panel`: `padding: 40px 36px;`
- `.gc-trust-card-3 .gc-trust-num`: `font-size: clamp(88px, 7vw, 124px);`
- `.gc-trust-card-3 .gc-trust-card-label`: `font-size: 13px;`
- `.gc-trust-card-3 .gc-trust-card-caption`: `font-size: 15px; max-width: 30ch;`
- `.gc-trust-card-1` (>=900px): `grid-area: left; min-height: 230px; grid-template-columns: 62% 38%;`
- `.gc-trust-card-2` (>=900px): `grid-area: right; min-height: 230px; grid-template-columns: 38% 62%;`
- `.gc-trust-card-1 .gc-trust-card-panel`, `.gc-trust-card-2 .gc-trust-card-panel`: `padding: 30px 28px;`
- `.gc-trust-card-1 .gc-trust-num`, `.gc-trust-card-2 .gc-trust-num`: `font-size: clamp(56px, 4vw, 72px);`
- `.gc-trust-card-1 .gc-trust-card-label`, `.gc-trust-card-2 .gc-trust-card-label`: `font-size: 12px;`
- `.gc-trust-card-1 .gc-trust-card-caption`, `.gc-trust-card-2 .gc-trust-card-caption`: `font-size: 14px; max-width: 24ch;`
- `.gc-trust-card-label` (all): `font-weight: 600; font-size: 11px; letter-spacing: 0.14em; color: rgba(255,255,255,0.5) [light: rgba(26,26,26,0.5)]; margin-bottom: 12px;`
- `.gc-trust-hairline`: `height: 76%; align-self: center; background: #B01E56 (Card 3: rgba(176,30,86,0.7));`
- `.gc-trust-container` (>=1600px): `max-width: 1360px;`
- `.gc-trust-card-content-group` (>=1600px): `max-width: 620px;`

## Explicit Merge-Risk Summary
- **CARD DESKTOP GRID LAYOUT (`.gc-trust-cards-wrapper`)**: Replaced alternating horizontal offset percentages with 2-row CSS Grid (`"hero hero"` top, `"left right"` bottom). Card 3 (`1.000+`) is top hero, Card 1 (`30`) is left, Card 2 (`40+`) is right.
- **HERO & CREDIBILITY BAND BOUNDARIES (`.gc-trust-block`)**: Dual 28px curves with `-28px` negative margins at both top and bottom of `.gc-trust-block`. `.gc-trust-block` has `z-index: 6` so bottom curve renders visibly over `.sectors-section` (`z-index: 5`). Hero height `calc(100svh + 28px)` completely covers top curve at scroll 0.
- **DELETION OF DARK BLOCK CONTAINER (`.gc-trust-dark-block`)**: The entire `.gc-trust-dark-block` section wrapper, logo, vertical hairline, and dark background rules have been DELETED. Marquee is now an internal child of `.gc-trust-container`.
- **NON-STICKY HEADER (`.main-header`)**: Header converted from `position: absolute`.
