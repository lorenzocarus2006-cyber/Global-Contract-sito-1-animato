# Collaboration Log — 2026-07-24

Branch: `main` (local only, zero pushes, uncommitted working tree).

## Task Summary
1. **Part 1 — Non-sticky Header**: Converted `.main-header` from `position: fixed` to `position: absolute; top: 1.5rem; left: 50%; transform: translateX(-50%)` in `css/style.css`. Disabled JS scroll listener in `js/main.js` that toggles `.scrolled` state with `// STEP 4: sticky header removed — do not delete the code`. Header now resides over the hero and scrolls out of view naturally.
2. **Part 2 — Credibility Band Shell**: Section background set to `#EDEAE5` (warm paper tone), ink `#111111`, vertical padding `clamp(56px, 9vh, 112px)`, container max-width 1200px (padding 20px mobile / 24px desktop), hard cut against adjacent dark sections.
3. **Part 3 & 4 — Asymmetric Statistic Cards**:
   - Mobile (<900px): `grid-template-columns: 1fr 1fr` (Card A & Card B side by side), Card C spanning both columns below (`grid-column: 1 / -1`).
   - Desktop (>=900px): `grid-template-columns: repeat(4, 1fr)` (Card A span 1, Card B span 1, Card C span 2 on a single row).
   - Light Cards (A & B): `#FFFFFF` fill, `rgba(17,17,17,0.08)` border, 10px radius, padding 18px 16px (24px desktop), min-height 132px (240px desktop). Micro-labels `DAL 1995` and `TERRITORIO` in Inter 500 10px (11px desktop) uppercase (`rgba(17,17,17,0.45)`). Numerals `30` and `40+` in Cormorant Garamond 500 `lining-nums tabular-nums` (#111111).
   - Anchor Card C: `#111111` fill, 10px radius, padding 22px 20px (32px desktop), min-height 190px (240px desktop), relative positioning with overflow hidden. Inset hairline detail (`border: 1px solid rgba(255,255,255,0.14)`, 6px radius). Micro-label `REALIZZAZIONI`. Numeral `1.000` in Cormorant Garamond 500 clamp(64px, 18vw, 110px) set in brand magenta `#B01E56` (the ONLY magenta accent in this section).
4. **Part 5 — GC Rhombus Watermark Mark**: Rotated 45° square SVG mark (`width: 150px/210px`, `stroke: rgba(255,255,255,0.16)`, `bottom: -34px; right: -28px`) inside Card C, partially cropped.
5. **Part 6 — Thesis Block**: Centred thesis "Non arrediamo spazi. Progettiamo attività." (Cormorant Garamond 500 clamp(28px, 7vw, 46px)) + support "Ogni locale nasce da un metodo collaudato in trent’anni di cantiere." (Inter 400 15px/17px).
6. **Part 7 — Hairline, Eyebrow & Marquee**: Hairline (24px gap), eyebrow `HANNO SCELTO GLOBAL CONTRACT` (Inter 500 10px/11px uppercase), brand marquee with 16px/20px brand names and 13px/15px sector labels.
7. **Part 8 — Entrance Animation**: Updated GSAP ScrollTrigger selector in `js/main.js` to target `.gc-trust-card, .gc-trust-card-anchor` in DOM order.

## Files Touched
- `index.html`: Updated Section 2 (`.gc-trust-block`) HTML for STEP 4 asymmetric layout with Card A (`DAL 1995`), Card B (`TERRITORIO`), Card C (`REALIZZAZIONI` with inline rhombus SVG watermark), thesis block, hairline, eyebrow, and marquee.
- `css/style.css`: Updated `.main-header` to `position: absolute`, cleared `.main-header.scrolled` background. Rebuilt `.gc-trust-block` CSS rules (`#EDEAE5` warm paper tone, asymmetric grid layout, `#FFFFFF` light cards A/B, `#111111` anchor card C with inset hairline and `#B01E56` magenta numeral, Cormorant Garamond 500 `lining-nums tabular-nums`, inline rhombus SVG watermark, thesis block, and upgraded marquee font sizes).
- `js/main.js`: Disabled header scroll listener (`// STEP 4: sticky header removed — do not delete the code`). Updated S2 ScrollTrigger entrance animation selector to `.gc-trust-card, .gc-trust-card-anchor`.

## New/Renamed CSS Classes & Identifiers
- `.gc-trust-card`: Light card container (`background: #FFFFFF`, `border-radius: 10px`, `border: 1px solid rgba(17,17,17,0.08)`).
- `.gc-trust-card-anchor`: Dark anchor card C container (`background: #111111`, `border-radius: 10px`, `grid-column: 1 / -1` on mobile / `span 2` on desktop).
- `.gc-trust-card-mark`: Inline SVG watermark mark inside Card C (`position: absolute; bottom: -34px; right: -28px`).
- `.gc-trust-card-label`: Micro-label typography (`Inter 500 10px/11px`, letter-spacing `0.16em`, uppercase).
- `.gc-trust-card-bottom`: Flex row baseline alignment container for numeral and caption.
- `.gc-trust-num`: Numeral typography (`Cormorant Garamond 500`, `lining-nums tabular-nums`).
- `.gc-trust-card-caption`: Caption typography (`Inter 400 13px/14px`, `rgba(17,17,17,0.6)` on A/B, `rgba(255,255,255,0.7)` on C).
- `.gc-trust-thesis`, `.gc-trust-thesis-title`, `.gc-trust-thesis-sub`: Editorial thesis block elements.

## Explicit Merge-Risk Summary
- **NON-STICKY HEADER (`.main-header`)**: Header converted from `position: fixed` to `position: absolute`. It no longer remains pinned to the top of the viewport when scrolling down. **HIGH MERGE RISK**: Any parallel work or other page relying on sticky header behavior will be affected; changes are isolated to `index.html` header positioning and `js/main.js` scroll listener comment.
- **Section 2 (`.gc-trust-block`) Markup & Styles**: Completely rebuilt into an asymmetric `#EDEAE5` band with 2 light cards + 1 dark anchor card C + thesis + marquee. Any parallel branch targeting Section 2 must align with `.gc-trust-card` and `.gc-trust-card-anchor`.
