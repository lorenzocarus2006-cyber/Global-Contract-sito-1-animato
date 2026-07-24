# Collaboration Log — 2026-07-24

Branch: `main` (local only, zero pushes, uncommitted working tree).

## Task Summary
1. **Header Non-sticky Positioning**: Converted `.main-header` to `position: absolute; top: 1.5rem; left: 50%; transform: translateX(-50%)` in `css/style.css`. Disabled JS scroll listener in `js/main.js` that toggles `.scrolled` state with `// STEP 4: sticky header removed — do not delete the code`. Header scrolls out of view naturally with the hero.
2. **Section Shell (STEP 5 Rebuild)**: Rebuilt `.gc-trust-block` section into a warm paper background (`#EDEAE5`), `#1A1A1A` primary ink, `#B01E56` brand magenta accent, vertical top padding `clamp(64px, 10vh, 120px)`, bottom padding 0 (sits flush against dark closing block), container max-width 1200px (padding 20px mobile / 32px desktop).
3. **Header Block**: Top-left aligned header block containing eyebrow `HANNO SCELTO GLOBAL CONTRACT` (Inter 600 11px uppercase `#B01E56`), short rule (32px width x 2px height `#B01E56`), Cormorant Garamond 500 headline `"Numeri che<br>costruiscono <span class="gc-trust-italic-accent">fiducia.</span>"` (italic `#B01E56`), and Inter 400 subline `"Trent’anni di metodo, migliaia di locali e una presenza capillare in tutta Italia."`.
4. **Three Staggered Split Cards**:
   - Card 1 (Dark panel left `62%`, image right `38%`): `#17161A` panel background, `bar_parisi.jpg` image with `grayscale(1) contrast(1.05)`. Numeral `30` in `#B01E56` next to magenta hairline, label `ANNI DI CANTIERI` (white), caption `Esperienza concreta, progetti che durano nel tempo.`. Offset: `margin-right: 8%` (4% mobile).
   - Card 2 (Image left `38%`, light panel right `62%`): Image placeholder `#2A2825` with HTML comment, `#F7F6F4` panel background. Numeral `40+` in `#1A1A1A` next to dark hairline (`rgba(26,26,26,0.25)`), label `CITTÀ IN ITALIA` (#1A1A1A), caption `Una rete capillare al servizio dei tuoi progetti.`. Offset: `margin-left: 8%` (4% mobile).
   - Card 3 (Dark panel left `62%`, image right `38%`): `#17161A` panel background, `restaurant.png` image in color. Numeral `1.000+` in `#B01E56` next to magenta hairline, label `LOCALI PROGETTATI E COSTRUITI` (white), caption `Dall’idea alla realtà, sempre chiavi in mano.`. Offset: `margin-right: 8%` (4% mobile).
   - Card overlap: `margin-bottom: -18px`, `border-radius: 14px`, `box-shadow: 0 18px 40px rgba(26,26,26,0.10)`. Numerals set in Cormorant Garamond 400 `lining-nums tabular-nums`.
5. **Dark Closing Block with Curved Top Edge**:
   - Full-bleed `#121113` background (`width: 100vw; margin-left: calc(50% - 50vw)`).
   - Elliptical curved top edge (`border-top-left-radius: 50% 64px; border-top-right-radius: 50% 64px`).
   - Subtle repeating radial gradient texture (`rgba(255,255,255,0.03)`).
   - Sequence: GC rhombus mark SVG (64x64, filled `#B01E56` with white `GC` text) -> Relocated Brand Marquee -> Vertical Hairline (40px height) -> Centred Tagline `"METODO. CONTINUITÀ. PRESENZA REALE."`.
6. **Relocated Brand Marquee**: Positioned inside dark block between GC mark and vertical hairline. Restyled for dark background: Inter 500 15px/18px brand names (`rgba(255,255,255,0.8)`), Inter 400 12px/14px sector labels (`rgba(255,255,255,0.35)`), edge fade mask fading to `#121113`.
7. **Scroll Animation (GSAP)**:
   - Header block: `opacity: 0 -> 1`, `y: 20 -> 0`, stagger `0.08`, duration `0.7s`.
   - Cards: Each triggers independently at `top 82%`, `opacity: 0 -> 1`, `y: 32 -> 0`, Cards 1 & 3 `x: -24 -> 0`, Card 2 `x: 24 -> 0`.
   - Dark closing block: `opacity: 0 -> 1`, duration `0.6s`.
   - Reduced-motion fallback supported.

## Files Touched
- `index.html`: Rebuilt Section 2 (`.gc-trust-block`) HTML with header block, 3 staggered split cards with panel/media layout, and dark closing block with GC mark, relocated marquee, hairline, and tagline.
- `css/style.css`: Updated `.main-header` to `position: absolute`. Rebuilt `.gc-trust-block` CSS rules (`#EDEAE5` warm paper tone, staggered split cards with alternating offsets & vertical overlap, Cormorant Garamond `lining-nums tabular-nums`, `#121113` full-bleed dark closing block with elliptical curved top edge, and dark marquee theme).
- `js/main.js`: Disabled header scroll listener. Updated Section 2 ScrollTrigger animations for header block, staggered cards (alternating `x` offsets), and dark closing block.

## New/Renamed CSS Classes & Identifiers
- `.gc-trust-header-block`, `.gc-trust-rule`, `.gc-trust-title`, `.gc-trust-italic-accent`, `.gc-trust-subline`: Header block elements.
- `.gc-trust-cards-wrapper`, `.gc-trust-card`, `.gc-trust-card-1`, `.gc-trust-card-2`, `.gc-trust-card-3`: Staggered split card containers.
- `.gc-trust-card-panel`, `.gc-trust-card-stat-group`, `.gc-trust-hairline`, `.gc-trust-num-label-flex`, `.gc-trust-num`, `.gc-trust-card-label`, `.gc-trust-card-caption`: Card panel layout and typography elements.
- `.gc-trust-card-media`, `.gc-trust-card-img`, `.gc-trust-card-img-placeholder`: Card media and image placeholder elements.
- `.gc-trust-dark-block`, `.gc-trust-dark-texture`, `.gc-trust-dark-content`, `.gc-trust-mark-wrap`, `.gc-trust-gc-mark`, `.gc-trust-dark-hairline`, `.gc-trust-tagline`, `.gc-trust-tagline-white`, `.gc-trust-tagline-magenta`: Dark closing block elements.

## Explicit Merge-Risk Summary
- **NON-STICKY HEADER (`.main-header`)**: Header converted from `position: fixed` to `position: absolute`. It no longer remains pinned when scrolling.
- **Section 2 (`.gc-trust-block`) Complete Rebuild**: Completely redesigned to match the reference mockup (header block + 3 staggered split cards + full-bleed curved dark closing block). Any parallel work on Section 2 must align with `.gc-trust-card-*` and `.gc-trust-dark-block`.
