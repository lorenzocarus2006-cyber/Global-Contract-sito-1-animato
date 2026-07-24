# Collaboration Log — 2026-07-24

Branch: `main` (local only, zero pushes, uncommitted working tree).

## Task Summary
1. **Header Non-sticky Positioning**: Converted `.main-header` to `position: absolute; top: 1.5rem; left: 50%; transform: translateX(-50%)` in `css/style.css`. Disabled JS scroll listener in `js/main.js` that toggles `.scrolled` state with `// STEP 4: sticky header removed — do not delete the code`. Header scrolls out of view naturally with the hero.
2. **Hero Viewport Height & Curved Top Edge (STEP 7 / Fix 4)**: Set `.gc-trust-block` `border-top-left-radius: 50% 56px; border-top-right-radius: 50% 56px; margin-top: -56px; z-index: 2;` to create a smooth curved top transition over the hero photo. Hero photo remains full height (`100svh`) behind it; zero light band is visible at scroll position 0.
3. **Card 2 Italy SVG Map (STEP 7 / Fix 2)**: Rendered an inline SVG map of Italy (`.gc-trust-italy-map`, `viewBox="0 0 300 360"`) inside Card 2's image slot with mainland boot outline, Sardinia, Sicily, and a scattered constellation of ~55 `#B01E56` city circles (denser in Sicily/South).
4. **Card Hierarchy & Optical Alignment (STEP 7 / Fix 3)**:
   - Switched `.gc-trust-num-label-flex` to `align-items: flex-start`. Added `padding-top: 0.42em; max-width: 12ch` on `.gc-trust-card-label` to optically align its first line with the top of the numeral digits.
   - Left-aligned caption (`margin-top: 16px; max-width: 26ch`) with numeral inside `.gc-trust-card-right-group`.
   - Updated Card 3 label to two lines: `LOCALI PROGETTATI<br>E COSTRUITI`.
5. **Marquee Position, Scale & Mask Fix (STEP 7 / Fix 1)**:
   - Placed marquee IMMEDIATELY below tagline with `margin-top: 36px`. Section closes right after marquee with dark block bottom padding (`48px` mobile / `64px` desktop).
   - Increased typography scale: brand names 20px/26px (`rgba(255,255,255,0.88)`), sectors 15px/18px (`rgba(255,255,255,0.42)`), middots 18px with 36px/48px margins.
   - Corrected CSS mask gradient syntax from center-transparent to center-opaque: `linear-gradient(90deg, transparent 0%, #000 6%, #000 94%, transparent 100%)`.

## Files Touched
- `index.html`: Rebuilt Section 2 (`.gc-trust-block`) HTML with inline SVG Italy map in Card 2, updated Card 3 label markup, and restructured dark block elements.
- `css/style.css`: Added curved top edge on `.gc-trust-block` (`margin-top: -56px`, `border-top-radius: 50% 56px`), updated Card panel layout and label optical alignment, added SVG map styles, and updated dark block marquee placement, scale, and mask.
- `js/main.js`: ScrollTrigger animations for header block, staggered cards, and dark closing block.

## New/Renamed CSS Classes & Identifiers
- `.gc-trust-block`: Added `border-top-left-radius: 50% 56px; border-top-right-radius: 50% 56px; margin-top: -56px; z-index: 2;`.
- `.gc-trust-card-content-group`, `.gc-trust-card-right-group`: Flex layout containers for hairline, numeral+label, and caption.
- `.gc-trust-italy-map`: Inline SVG map styling inside Card 2 placeholder container.
- `.gc-trust-dark-block .gc-trust-marquee-wrapper`: Placed immediately below tagline (`margin-top: 36px`), edge fade mask `linear-gradient(90deg, transparent 0%, #000 6%, #000 94%, transparent 100%)`.
- `.gc-trust-brand-name`, `.gc-trust-brand-sector`, `.gc-trust-middot`: Scaled typography tokens.

## Explicit Merge-Risk Summary
- **HERO & CREDIBILITY BAND BOUNDARY (`.gc-trust-block`)**: Negative margin `-56px` and curved top edge overlap the hero bottom. Hero stays `100svh`.
- **NON-STICKY HEADER (`.main-header`)**: Header converted from `position: fixed` to `position: absolute`.
- **Section 2 Rebuild**: Staggered cards, Italy SVG, and dark closing block with marquee positioned immediately below tagline.
