# Collaboration Log — 2026-07-24

Branch: `main` (local only, zero pushes, uncommitted working tree).

## Task Summary
Redesigned Section 2 (`.gc-trust-block`) into an inverted light credibility band (#F4F3F1) translating the shadcn/Tailwind reference component to vanilla CSS:
1. Three cards (`.gc-trust-card`) with fixed height 240px, flex column layout (`justify-content: space-between`), 8px border radius, white fill (#FFFFFF), hairline border `rgba(17,17,17,0.07)`, and padding 24px.
2. Card top micro-label (`Dal 1995, senza interruzioni`, `Realizzazioni completate`, `Presenza sul territorio`) in Inter 400 14px sentence case.
3. Card bottom numeral in Inter 600 60px `lining-nums tabular-nums` (#111111) + caption in Inter 400 16px (0.8 opacity).
4. Centred editorial thesis block (`.gc-trust-thesis`): title "Non arrediamo spazi. Progettiamo attività." in Cormorant Garamond 500 clamp(32px, 3.6vw, 48px) + subline "Ogni locale nasce da un metodo collaudato in trent’anni di cantiere." in Inter 400 18px.
5. Marquee repositioned below thesis block with upgraded typography: brand names Inter 500 20px uppercase (0.85 opacity), sectors Inter 400 15px lowercase (0.4 opacity), em-dash separator (0.3 opacity), middots (margin 44px, 16px size).

Applied hero-level fixes: headline magenta removal with 0.7/1.0 opacity hierarchy, typographic apostrophes (`’`) across all visible Italian copy, desktop inline navigation (`Metodo`, `Settori`, `Progetti`, `Azienda`), telephone link (`095 713 2699` / icon on mobile) with CSS reset, and single-magenta-per-viewport enforcement.

## Files Touched
- `index.html`: Rebuilt Section 2 (`.gc-trust-block`) HTML with 3 fixed-height cards, thesis block, single hairline, active eyebrow, and upgraded marquee items. Updated cache-busting query parameter to `?v=light-credibility-1`. Fixed unclosed `div/section` tags at end of sectors section.
- `css/style.css`: Rebuilt `.gc-trust-block` CSS rules (light background `#F4F3F1`, 3-card grid with 240px fixed height flex layout, Inter 600 60px numerals, Inter 400 14px top labels, Cormorant Garamond 500 thesis title, Inter 18px thesis subline, single hairline `rgba(17,17,17,0.12)`, marquee animation 70s linear infinite with `:hover` pause, `prefers-reduced-motion` fallback, edge fade mask, and upgraded 20px/15px marquee typography). Added `.nav-phone, .nav-phone:visited` reset styling.
- `js/main.js`: Added GSAP ScrollTrigger entrance animation for `.gc-trust-card` (fade + rise `y: 16 -> 0`, stagger `0.08s`, duration `0.6s`, no number count-up).
- `projects.html`: Replaced straight apostrophes with typographic apostrophes (`’`) in all visible Italian copy.

## New/Renamed CSS Classes & Identifiers
- `.gc-trust-stats-grid`: 3-column grid for statistics cards (`gap: 16px`).
- `.gc-trust-card`: Fixed-height (240px) card container (`flex-direction: column`, `justify-content: space-between`, `background: #FFFFFF`, `border-radius: 8px`, `padding: 24px`).
- `.gc-trust-card-top`: Card top flex group for micro-label.
- `.gc-trust-card-label`: Micro-label typography (`Inter 400 14px`, sentence case, `rgba(17,17,17,0.45)`).
- `.gc-trust-card-bottom`: Card bottom flex group for numeral and caption.
- `.gc-trust-num`: Numeral typography (`Inter 600 60px`, `lining-nums tabular-nums`, `#111111`).
- `.gc-trust-card-caption`: Caption typography (`Inter 400 16px`, `rgba(17,17,17,0.8)`).
- `.gc-trust-thesis`: Centred editorial thesis container (`padding: 80px 24px`, `max-width: 760px`).
- `.gc-trust-thesis-title`: Thesis title (`Cormorant Garamond 500 clamp(32px, 3.6vw, 48px)`).
- `.gc-trust-thesis-sub`: Supporting subline (`Inter 400 18px`).
- `.gc-trust-divider`: Single 1px hairline (`rgba(17,17,17,0.12)`).
- `.gc-trust-eyebrow`: Active eyebrow heading (`HANNO SCELTO GLOBAL CONTRACT`, `Inter 500 11px uppercase`).
- `.gc-trust-marquee-wrapper`: Overflow container with edge fade mask (`linear-gradient(90deg, transparent 0%, #000 12%, #000 88%, transparent 100%)`).
- `.gc-trust-brand-item`, `.gc-trust-brand-name`, `.gc-trust-brand-sep`, `.gc-trust-brand-sector`, `.gc-trust-middot`: Marquee item typography (20px brand / 15px sector) & separator elements.

## Modified CSS Custom Properties
- No CSS custom properties were renamed or deleted.

## Explicit Merge-Risk Summary
- **Section 2 (`.gc-trust-block`) Markup & Styles**: Rebuilt from 3-column simple stats to 3 fixed-height cards + thesis block + upgraded marquee. Any parallel branch targeting old `.gc-trust-numbers` or `.gc-trust-figure` must adapt to `.gc-trust-card` and `.gc-trust-thesis`.
- **Restored Closing Tags (`index.html`)**: Restored `</div></div></section>` after `.dec-outline-3` in `index.html`. If parallel work on `main` modifies the sectors gallery or founder section boundaries, this structural restoration must be preserved.
- **Hero Headline Markup & Color**: Magenta was completely removed from the hero headline. Headline uses `.hero-proof-title-line1` and `.hero-proof-title-line2`. Parallel work assuming `.hero-proof-title-accent` will need to align with the pure white + opacity hierarchy.
- **Navigation Bar**: Added `.nav-phone` link and updated `.nav-menu` items (`Metodo`, `Settori`, `Progetti`, `Azienda`). Responsive breakpoint at 1024px hides `.nav-menu` and toggles phone text to icon.
