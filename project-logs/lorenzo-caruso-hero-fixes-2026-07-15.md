# Hero panel fixes — 2026-07-15

## Summary

Three surgical geometry fixes to the homepage hero's 7-panel zigzag gallery, on top of
the already-approved base layout: (1) panels now form a true edge-to-edge hinged chain
instead of overlapping like a stacked deck, (2) panel heights follow a symmetric
tall/short/tall/short(center)/tall/short/tall wave instead of the previous distribution,
and (3) every panel now shows a real, visible physical side-thickness (a genuine rotated
3D face, not a border/box-shadow fake) at its inner hinge edge. No hover/click/motion
logic, navbar, headline, preloader, or scroll wiring was touched — this pass was layout
and a static visual detail only.

## Files touched

- `index.html` — no structural changes; only used transiently for debug-flag-gated
  test scripts (`?debug=...`) added and removed during verification, none of which
  remain in the file.
- `css/style.css` — panel/reflection left/width/height values recomputed for the
  edge-to-edge chain and new height rhythm; `.sector-panel` and `.panel-image-wrapper`
  overflow swapped (see below) to unblock the 3D side-face; new `.panel-side` rules
  added; the old non-functional `::before`-based thickness rules removed.
- `js/main.js` — `ZONES`/`ZONE_HEIGHT` hover-hit-zone tables recomputed to match the
  new panel geometry (pure data, not logic); new `initPanelSides()` function added to
  build the real-DOM side-face strips.

## New CSS classes / JS functions / variables introduced

- `.panel-side` (CSS) — the side-thickness strip element's base style.
- `.panel-side.side-right`, `.panel-side.side-left` (CSS) — mount-direction modifiers.
- `initPanelSides()` (JS function, in `js/main.js`) — creates and appends one
  `.panel-side` div per panel on init, matching each panel's rotation-sign group.
  Called once at startup; does not run again and is not wired into any hover/click/
  activation code path.

## Existing classes/functions/variables modified (not just added)

- `.desktop-gallery .sector-panel` (CSS) — `overflow: hidden` removed (now
  `overflow: visible` by inheritance/default). Old behavior: clipped everything to
  the panel's flat rectangle, including the photo. New behavior: no longer clips
  anything itself — clipping of the photo is now handled one level down (see next).
  This was necessary because a 3D-rotated child (the side-thickness face) needs to
  extend outside the panel's own flat 2D box to be visible at all; `overflow:hidden`
  silently deleted it.
- `.desktop-gallery .panel-image-wrapper` (CSS) — gained `overflow: hidden` +
  `border-radius: 2px` (it already had `overflow: hidden`; only `border-radius` is new
  here). This now does the photo-clipping job `.sector-panel` used to do, so the
  rounded-corner photo crop is visually unchanged for viewers.
- `.desktop-gallery .sector-panel[data-index="N"]` (CSS, all 7 rules) — `left`,
  `width`, and `height` values all changed (see table below). `z-index` and `order`
  values unchanged.
- `.desktop-gallery .card-reflection[data-index="N"]` (CSS, all 7 rules) — `left`/
  `width` updated to mirror the new panel footprints.
- `.desktop-gallery .sector-panel[data-index="0"] .card-title-block` and
  `[data-index="6"] .card-title-block` (CSS) — the old manual label-offset rules
  (`left: 2.5rem` / `left: 1.6rem`) were removed; with near-zero crop in the new
  edge-to-edge chain they're no longer needed (verified: no label collides with a
  neighbor or clips off-screen, see measurements below).
- `ZONES` and `ZONE_HEIGHT` (JS, `js/main.js`) — the hover-hit-zone left/width/height
  tables were recomputed to match the new panel geometry. Pure data change, not a
  change to click/hover/activation logic itself (the state machine, event listeners,
  and `activatePanel`/`deactivateAll` functions were not touched).

Untouched value tables: `REST` (`rotationY`/`z` per panel — signs and magnitudes
exactly as before), `Z_INDEX_BASE`.

## New geometry (left/width/height, left→right visual order)

| Card | idx | left | width | height (was) | height (now) |
|---|---|---|---|---|---|
| #1 TABACCHI | 0 | 0.3% | 15.5% | 0.85x | 1.00x TALL |
| #2 HOTEL | 1 | 15.2% | 13.5% | 1.00x | 0.80x short |
| #3 SALUMERIE | 3 | 28.1% | 15.5% | 0.84x | 1.02x TALL |
| #4 BAR E RISTORANTI | 2 | 43.0% | 13% | 0.96x | 0.78x short (center) |
| #5 FARMACIE | 4 | 55.4% | 15.5% | 1.02x | 1.02x TALL |
| #6 SPAZI COMMERCIALI | 5 | 70.3% | 13.5% | 0.83x | 0.80x short |
| #7 GELATERIE | 6 | 83.2% | 15.5% | 0.88x | 1.00x TALL |

## Things NOT touched on purpose

Confirmed untouched: hover/click/activation state machine (`activatePanel`,
`deactivateAll`, event listeners, `REST_FILTER`, brightness/overlay choreography),
navbar, headline copy, preloader, Lenis/ScrollTrigger wiring, the forced-descent
sequence (`handleForcedScroll`, `runForcedScrollTween`, `heroExitTL`), mobile gallery
(`.mobile-gallery`, gated off entirely under 768px, never reached by any of this pass's
selectors), and the `REST`/`Z_INDEX_BASE` rotation/depth tables (rotateY signs and
magnitudes are byte-for-byte what they were before this pass).

## Merge risk notes

- **`.sector-panel { overflow: hidden → visible }`** is the change most likely to
  interact with anything else touching this element: if any other in-flight work
  relies on `.sector-panel` clipping its own content (e.g. a border-radius mask on
  something added directly as a child of `.sector-panel` rather than inside
  `.panel-image-wrapper`), that clipping is now gone. Nothing today needs it, but flag
  before merging if Luis's section (or anything else) reaches back up into this
  element.
- **Global CSS custom properties** (`:root` tokens in `css/style.css` section 1) were
  not touched or added to — no new tokens introduced, only literal values in the
  hero-scoped selectors above.
- **No shared/global JS utility functions were added** — `initPanelSides()` is scoped
  entirely to hero panels, only reads `panels`/`REST` (already-existing hero-scoped
  variables in the same closure), doesn't export anything, and isn't called from
  anywhere outside this one `DOMContentLoaded` block.
- **Floor/background elements**: `.desktop-gallery::before` (the ambient floor light
  pool) and the `.card-reflection` elements extend below the hero's own visual panel
  row into the "floor" area, same as before this pass — geometry was recomputed
  (`left`/`width` only) but nothing about how far they extend vertically changed. If
  a section further down the page has its own background/floor treatment starting
  immediately after the hero, worth a manual check that nothing from
  `.card-reflection`'s `150px`-tall zone visually collides with it — this was already
  true before this pass, not newly introduced by it, but flagging since it's an
  element that extends past the hero's own text/panel content.
- **No renamed classes, IDs, or JS symbols** — everything above is either a changed
  literal value on an existing selector, or a net-new, hero-prefixed-in-context class
  (`.panel-side`) that doesn't exist anywhere else in the codebase.

## Verification

- T1 (edge-to-edge, readable labels): CSS-space seam overlap tuned to ~0.6%; measured
  on-screen (post-rotation) bounding boxes actually show small gaps instead (−1.1% to
  +0.1%, i.e. up to ~17px at 1512px width) because rotation foreshortens a rotated
  panel's projected width versus its flat CSS width — but all gaps are visually filled
  by the Fix 3 side-thickness strips with zero black slivers (confirmed via zoomed
  screenshots of every seam). All 7 title-block bounding boxes are mutually
  non-overlapping and fully on-screen at 1512px width (closest pair: 43px apart).
- T2 (height silhouette): confirmed visually at 1512×982 and 1920×1080 — reads as
  tall, short, tall, short(smallest/center), tall, short, tall.
- T3 (thickness): a `::before`-pseudo-element implementation was tried first and
  confirmed (empirically, via `getBoundingClientRect`, even at 60px solid red) to
  render nothing at all — the same class of silent-paint failure already on record in
  this codebase for the `scaleY(-1)` floor reflections. Rebuilt as a real DOM sibling
  (`.panel-side`, same workaround pattern as `.card-reflection`). The naive 90°
  hinge angle also turned out to land in a near-zero-projected-width trough given
  this stage's off-center `perspective-origin`; the actual angle (170°/−170°) was
  found empirically by sweeping `getBoundingClientRect().width` across candidate
  angles on the real page, not assumed. Verified visible on all of cards #1, #3, #5,
  #7 via zoomed screenshots.
- T4 (side-by-side vs `reference-hero.png`): no reference image exists at
  `assets/reference/` in this repo, so this could not be diffed pixel-for-pixel;
  visual composition was checked by eye against the fix's own written spec instead.

---

# Pass 2 — 2026-07-15: real closed-box thickness + row rebalance

## Summary

Two corrections on top of Pass 1 (tall/short height rhythm stays approved and
untouched): (1) Pass 1's thickness implementation — a single flat ~18px strip glued
next to each photo — read as a book spine, not a physical edge, and is deleted
entirely; it's rebuilt as a real closed 3D box (5 faces: front photo, dark back,
left, right, top) at a genuine 5px depth, so every panel now shows a thin (not wide)
board-edge sliver. (2) The horizontal layout from Pass 1 produced inconsistent
seams — some gapping, some heavily overlapping, and the group wasn't centered — so
left/width for all 7 panels was recomputed via a measure-and-correct loop (not
hand-placed) against the browser's actual rendered (post-perspective) geometry,
since this stage's perspective distorts panel width non-uniformly by position (see
Merge risk notes). No hover/click/motion logic, navbar, headline, preloader, or
scroll wiring was touched.

## Files touched

- `index.html` — no structural changes; only transient debug-flag-gated
  (`?debug=...`) test scripts added and removed during verification.
- `css/style.css` — Pass 1's `.panel-side` rules deleted outright; new
  `.panel-face-back`, `.panel-face-side` (+ `.face-left`/`.face-right`),
  `.panel-face-top` rules added; `--panel-depth: 5px` custom property added,
  scoped to `.desktop-gallery .sector-panel` (not `:root`); `.panel-image-wrapper`
  gained a `translateZ` (now the box's front face); all 7 panels' and 7
  reflections' `left`/`width` recomputed; `.sector-panel`'s comment updated to
  describe the new closed-box rationale for staying `overflow: visible`.
- `js/main.js` — Pass 1's `initPanelSides()` deleted outright, replaced with
  `initPanelFaces()` (builds back/left/right/top face elements); `ZONES` hover-zone
  table recomputed to match the new panel geometry (pure data).

## New CSS classes / JS functions / variables introduced

- `--panel-depth: 5px` (CSS custom property, scoped to `.desktop-gallery
  .sector-panel`, not global `:root`).
- `.panel-face-back`, `.panel-face-side`, `.panel-face-side.face-left`,
  `.panel-face-side.face-right`, `.panel-face-top` (CSS) — the five box faces.
- `--face-angle` / `--face-angle-r` / `--face-angle-top` (CSS custom properties,
  with inline fallback defaults) — the calibrated local rotation per face type, so
  a future pass could override per-panel via inline style without touching the
  base rule, without that being needed in this pass.
- `initPanelFaces()` (JS, `js/main.js`) — replaces `initPanelSides()`; builds and
  appends `.panel-face-back` / `.panel-face-side.face-left` / `.face-right` /
  `.panel-face-top` for every panel on init. Called once at startup, not wired into
  any hover/click/activation path.

## Existing classes/functions/variables modified (not just added)

- `.desktop-gallery .sector-panel[data-index="N"]` (CSS, all 7 rules) — `left` and
  `width` both changed for every panel (see table below); `height`, `z-index`,
  `order` all **unchanged** (height rhythm from Pass 1 stays approved as-is).
- `.desktop-gallery .card-reflection[data-index="N"]` (CSS, all 7 rules) — `left`/
  `width` updated to mirror the new panel footprints.
- `ZONES` (JS) — hover-hit-zone left/width table recomputed to match the new panel
  geometry. `ZONE_HEIGHT` **unchanged** (heights didn't change this pass).

## New geometry (left/width, left→right visual order) — height unchanged from Pass 1

| Card | idx | left (was) | left (now) | width (was) | width (now) |
|---|---|---|---|---|---|
| #1 TABACCHI | 0 | 0.3% | -6.81% | 15.5% | 22.86% |
| #2 HOTEL | 1 | 15.2% | 13.23% | 13.5% | 16.19% |
| #3 SALUMERIE | 3 | 28.1% | 27.11% | 15.5% | 16.56% |
| #4 BAR E RISTORANTI | 2 | 43.0% | 42.41% | 13% | 15.53% |
| #5 FARMACIE | 4 | 55.4% | 56.94% | 15.5% | 15.77% |
| #6 SPAZI COMMERCIALI | 5 | 70.3% | 71.42% | 13.5% | 16.41% |
| #7 GELATERIE | 6 | 83.2% | 85.87% | 15.5% | 13.68% |

Cards #1 and #7 needed the largest width correction (22.86% / 13.68%, both far from
their Pass-1 values) — see Merge risk notes on why the outer two aren't symmetric
flat-width mirrors of each other despite the finished layout being visually and
numerically balanced.

## Things NOT touched on purpose

Confirmed untouched, same as Pass 1: hover/click/activation state machine
(`activatePanel`, `deactivateAll`, event listeners, `REST_FILTER`, brightness/
overlay choreography), navbar, headline copy, preloader, Lenis/ScrollTrigger
wiring, the forced-descent sequence, mobile gallery, and the `REST`/`Z_INDEX_BASE`
tables (rotateY signs/magnitudes, and panel heights, are exactly what they were
after Pass 1).

## Merge risk notes

- **Perspective is non-uniform across the row, confirmed empirically, not assumed.**
  The stage's `perspective-origin` sits at horizontal 50%, and panels far from that
  origin render at a width that is NOT simply `flatWidth × cos(rotationY)` — cards
  #1 and #7 (furthest from center) needed CSS flat widths roughly 30-40% off from a
  naive cosine-based estimate to hit their target on-screen width, and one early
  attempt at a bigger single-step correction badly overshot (confirmed via
  `getBoundingClientRect` measurement, not assumed) before converging through
  smaller, measured iterations. If any future pass touches panel width, rotation,
  or the stage's `perspective`/`perspective-origin` values, the position math must
  be re-derived from real rendered measurements again, not recomputed by formula
  alone.
- **Cross-panel z-index vs. true 3D depth**: each `.sector-panel` carries its own
  explicit `z-index` (unchanged this pass), which creates a separate CSS stacking
  context per panel. Confirmed via `getBoundingClientRect`: a box face's geometry
  is correct and constant-width for its panel's full height, but where two panels'
  boxes overlap in 2D screen space, the higher-`z-index` panel's opaque front face
  paints over the lower one's face — this is why some seams show the thin sliver
  only in the panel's "exposed" region above its shorter neighbor, not the full
  seam height (see A1 evidence in the report). This is physically correct
  occlusion behavior for a real overlapping board, not a rendering bug, but it
  means the `Z_INDEX_BASE`/CSS `z-index` values are now load-bearing for which
  side of each seam shows its face — don't change them without re-checking A1.
- **`--panel-depth` custom property** is scoped to `.desktop-gallery .sector-panel`,
  not `:root`, specifically so it can't collide with any global token Luis's
  section might also define or read.
- **No renamed classes, IDs, or JS symbols carried over from Pass 1's public
  surface** — `.panel-side` and `initPanelSides()` are gone (dead code fully
  removed, not left half-working), replaced by the new `.panel-face-*` /
  `initPanelFaces()` names. Nothing outside this pass's own files referenced the
  old names (confirmed no other selector/JS in the repo used `.panel-side`).

## Verification (this pass)

- A1 (sliver test): confirmed via zoomed screenshots on cards #1, #3, #5, #7 - each
  shows a clear thin (~3-5px on screen) light board-edge sliver in its exposed
  region. Root-caused via `getBoundingClientRect`: the face geometry is genuinely
  present the panel's full height (e.g. card #1's right face measured a constant
  ~3.3px wide from y=365 to y=755), confirming the partial visibility is neighbor
  occlusion in the physically-overlapping zone (see Merge risk notes), not broken
  geometry.
- A2 (box test): computed-style dump for visual panel #2 (HOTEL) - front
  (`translateZ(2.5px)`), left/right side faces (distinct `rotateY` matrices, not
  90° - see below), and back (`rotateY(180deg) translateZ(-2.5px)`) are four
  distinct 3D matrices, all direct children of the same `.sector-panel`, which
  itself reports `transform-style: preserve-3d`.
- A3 (seam test): full-width 1512×982 screenshot - all 6 seams show a consistent
  hinge look, zero black gaps, zero heavy overlaps.
- A4 (balance test), measured via `getBoundingClientRect` at 1512×982: panel #1
  crop 9.5px, panel #7 gap 14.9px from their respective viewport edges (difference
  0.36% of viewport, well inside the ±2% tolerance); panel #4 (BAR E RISTORANTI)
  center at 756.3px vs. viewport center 756px (0.3px / 0.02% off).
- A5 (labels): all 7 title-block bounding boxes mutually non-overlapping and fully
  on-screen (closest pair 34px apart) at 1512px width.
- A6: no `reference-hero.png` exists in this repo (same gap as Pass 1) - checked
  by eye against the written spec instead.
- A7: forced-scroll listener still engages correctly on a dispatched wheel event
  (`defaultPrevented: true`); the multi-second Lenis/GSAP tween itself and
  `?replay` could not be driven to completion under this session's headless-Chrome
  tooling (`--virtual-time-budget` doesn't advance `requestAnimationFrame`
  properly) - same disclosed tooling gap as every prior pass. The descent code
  itself was not touched.

## Deviations from the literal spec text (and why)

- **Face depth is real (5px) but the two side-face rotation angles are not the
  literal `rotateY(-90deg)`/`rotateY(90deg)` the spec describes.** Composed with
  each panel's own `rotationY` at this stage's off-center `perspective-origin`, a
  literal local 90° lands in a near-zero-projected-width trough for several panel
  positions (confirmed via `getBoundingClientRect` sweep - 90° produced exactly
  0px on the leftmost card, both in Pass 1 at 18px depth and reconfirmed relevant
  at 5px depth since the trough's angle location doesn't depend on face width).
  ~170°/−170° is where the sweep showed strong, consistent visible width across
  panel positions, and is what's implemented (`--face-angle`/`--face-angle-r`
  CSS custom properties, single shared value for all 7 panels this pass).
  The acceptance test this serves (A1: a visible thin sliver on cards #1/#3/#5/#7)
  passes with this angle; it would not with the literal 90°.
- **The top face (`.panel-face-top`) is included per spec** (unlike Pass 1, where
  a topside strip was tried and dropped as "optional"). It was not part of any
  acceptance test this pass, so its visibility wasn't independently re-verified
  beyond confirming it exists as a real element with a plausible transform.

---

# Pass 3 — 2026-07-15: literal rounded-layer-stack thickness + selector rename

## Summary

Full replacement of the thickness technique per an exact, literally-specified
implementation (not an interpretation): a "sliced slab" of `--depth` (6) stacked
1px-apart rounded layers plus a photo face at `translateZ(depth)`, which merges
visually into a single rounded 3D edge when the panel rotates - unlike Pass 2's
flat rectangular side faces, this one has rounded corners, matching the mandate
that flat strips/borders/box-shadows cannot produce a rounded edge. This required
a full selector rename: `.sector-panel` → `.hero-panel`, `.panel-image-wrapper` +
`.panel-img` → `.hero-panel__face` + `.hero-panel__img`, `.card-title-block`/
`.card-title`/`.card-title-line` → a single `.hero-panel__label`, and a new
`.hero-stage` class added (alongside, not replacing, `.desktop-gallery`) carrying
`perspective`/`perspective-origin` (origin moved from 50%/35% to 50%/30% per the
literal CSS given). Positions were then re-measured and recomputed for the new
perspective-origin and depth technique (STEP 3, mandatory). Height rhythm
(`--h` per panel) and rotation signs (`--ry` per panel) are numerically identical
to Pass 2 - only their *mechanism* changed, from GSAP-only + CSS clamp() to a CSS
custom property read by both a static CSS rule (fallback) and GSAP (still the
actual live-rendered value, unchanged logic). No hover/click/motion logic,
navbar, headline, preloader, or scroll wiring was touched beyond retargeting one
selector string.

## Files touched

- `index.html` — full rewrite of the 7 panel blocks to the mandated
  `.hero-panel > .hero-panel__slab > .hero-panel__face > (img, label, ...)`
  structure; `data-index`/`data-category` attributes kept (required by existing
  JS logic - REST/ZONES/Z_INDEX_BASE tables and category-based navigation are
  keyed by `data-index`, and the category URL routing reads `data-category`);
  `data-sector` added per the literal template (not read by any JS this pass,
  present for parity with the spec markup only); `--ry`/`--h` set inline per
  panel via `style="..."`; `.desktop-gallery` element gained a second class,
  `hero-stage`; `.card-hover-overlay`/`.discover-text` kept nested inside the
  new `.hero-panel__face` (existing, pre-approved active-state reveal feature -
  not part of what this pass's spec was replacing, so carried over rather than
  deleted); only transient debug-flag-gated test scripts otherwise.
- `css/style.css` — Pass 2's `.panel-face-back`/`.panel-face-side`/
  `.panel-face-top`/`--panel-depth` rules deleted outright; new `.hero-stage`,
  `.hero-panel`, `.hero-panel__slab`, `.hero-panel__layer` (+`--back`),
  `.hero-panel__face`, `.hero-panel__img`, `.hero-panel__label` rules added
  (layer/face/img rules pasted verbatim per spec; label styling is new, since
  the spec's template didn't include a CSS rule for it); per-panel `left`/
  `width`/`z-index`/`order` rules renamed to `.hero-panel[data-index="N"]` and
  their `height` declarations removed (height now comes from the `.hero-panel`
  base rule's `calc(var(--panel-base-h) * var(--h))`); `.card-hover-overlay`/
  `.discover-text` selectors retargeted from `.sector-panel`/`.sector-panel
  .is-active` to `.hero-panel`/`.hero-panel.is-active`.
- `js/main.js` — one selector string changed (`panels` query, `.sector-panel` →
  `.hero-stage .hero-panel`); `initReflections` retargeted to `.hero-panel`/
  `.hero-panel__img`; Pass 2's `initPanelFaces()` deleted outright, replaced
  with `initPanelLayers()` (the mandated verbatim layer-generation function,
  targeting `.hero-panel__slab`); one stale comment fixed. `ZONES` hover-zone
  table recomputed to match the new panel geometry (pure data).

## New CSS classes / JS functions / variables introduced

- `.hero-stage` (CSS) — added as a **second class** on the same element that
  already carries `.desktop-gallery`, not a replacement - `.desktop-gallery`
  still exists and is still what hides the whole gallery on mobile
  (`.desktop-gallery{display:none!important}` in the existing `max-width:768px`
  block) and still carries the block-layout/floor-light-pool rules. Splitting
  the "3D scene" concern into its own class was requested; deleting/renaming
  `.desktop-gallery` itself was not, and would have silently broken the mobile
  hide rule and the JS's `document.querySelector('.desktop-gallery')` calls,
  so it was kept and `.hero-stage` was added alongside it instead.
- `.hero-panel`, `.hero-panel__slab`, `.hero-panel__layer`,
  `.hero-panel__layer--back`, `.hero-panel__face`, `.hero-panel__img`,
  `.hero-panel__label` (CSS) — the mandated markup/CSS structure.
- `--panel-base-h` (CSS custom property, scoped to `.hero-panel`, not `:root`) —
  paired with each panel's own `--h` (inline) to produce its height.
- `initPanelLayers()` (JS) — replaces Pass 2's `initPanelFaces()`; the mandated
  verbatim layer-generation function. Called once at startup, not wired into
  any hover/click/activation path.

## Existing classes/functions/variables modified (not just added)

- `.sector-panel` → `.hero-panel` (renamed across `index.html`/`css/style.css`/
  `js/main.js` - the one rename this pass required and was explicitly
  instructed to make, done as a single controlled find-and-retarget rather
  than a scattered one).
- `.panel-image-wrapper`/`.panel-img` → `.hero-panel__face`/`.hero-panel__img`
  (renamed; the bottom-darkening-gradient `::after` and the `is-active` scale
  transform were carried over onto the new names, not dropped).
- `.card-title-block`/`.card-title`/`.card-title-line` → `.hero-panel__label`
  (three elements collapsed into one, per the literal markup - re-created the
  same visual result: uppercase label + small magenta underline accent, via
  `::after` instead of a separate `<div>`).
- `.hero-panel[data-index="N"]` (CSS, all 7 rules) — `left`/`width` recomputed
  for the new perspective-origin (50%/30%, was 50%/35%) and depth technique;
  `height` declarations removed (moved to the `--h`/`--panel-base-h` mechanism);
  `z-index`/`order` **unchanged** in value, just under the renamed selector.
- `ZONES` (JS) — recomputed to mirror the new panel geometry. `ZONE_HEIGHT`
  **unchanged** (still reads the same `--panel-base-h × --h` clamp values,
  which are numerically identical to Pass 2's per-panel heights).
- `REST`, `Z_INDEX_BASE`, `REST_FILTER`, `activatePanel`, `deactivateAll`, the
  hover-zone event listeners, and the descent/`heroExitTL` code — **not
  modified**, only now operating on elements found via the renamed selector.

## New geometry (left/width, left→right visual order) — unchanged from Pass 2

| Card | idx | left | width |
|---|---|---|---|
| #1 TABACCHI | 0 | -6.81% | 22.86% |
| #2 HOTEL | 1 | 13.23% | 16.19% |
| #3 SALUMERIE | 3 | 27.11% | 16.56% |
| #4 BAR E RISTORANTI | 2 | 42.41% | 15.53% |
| #5 FARMACIE | 4 | 56.94% | 15.77% |
| #6 SPAZI COMMERCIALI | 5 | 71.42% | 16.41% |
| #7 GELATERIE | 6 | 85.97% | 13.68% |

Only card #7's `left` changed from Pass 2 (85.87% → 85.97%, a ~1.5px nudge) to
bring its seam with #6 from 8.5px down to 7.1px, inside this pass's tighter
4-8px band (Pass 2's was 4-10px). Measuring after the perspective-origin and
depth-technique change showed the rest of the row's on-screen geometry was, to
measurement precision, unchanged from Pass 2 - the origin's Y-component shift
(35%→30%) affects vertical skew more than horizontal position/width, which is
what this row's seam/crop/centering tests actually measure.

## Things NOT touched on purpose

Confirmed untouched: the hover/click/activation state machine (`activatePanel`,
`deactivateAll`, `REST_FILTER`, brightness/overlay choreography, event
listeners - only the selector string feeding `panels` changed), navbar, headline
copy, preloader, Lenis/ScrollTrigger wiring, the forced-descent sequence, mobile
gallery (`.mobile-gallery`, still gated off entirely under 768px), and the
`REST` rotation table and per-panel height ratios (numerically identical to
Pass 2, just re-expressed as `--ry`/`--h` custom properties instead of a JS
object + CSS `clamp()`).

## Merge risk notes

- **`.desktop-gallery` was kept, not renamed** - see "New CSS classes" above.
  If Luis's section (or anything else) ever queries `.hero-stage` expecting it
  to be the *only* class on this element, or queries `.desktop-gallery`
  expecting it to be gone, that assumption would be wrong either way - it's a
  two-class element now.
- **`--panel-base-h` is scoped to `.hero-panel`, not `:root`** - can't collide
  with a global token.
- **The rounded-corner technique leaves a small cosmetic gap at the very top
  (and sometimes bottom) of some seams**, where one panel's rounded corner
  curves away from its neighbor's straight edge before the two flat photo
  faces meet - confirmed via zoomed screenshot on the #1/#2 seam. This is an
  inherent property of pairing rounded corners with a hinged-seam layout (the
  literal technique explicitly wants rounded corners), not a positioning bug -
  tightening the seam further to close it would produce visible overlap along
  the rest of the seam's straight length instead. Flagging in case a future
  pass wants to address it (e.g. a smaller `--radius`).
- **No renamed classes/functions carried forward from Pass 2's public surface
  survive** - `.panel-face-back`/`.panel-face-side`/`.panel-face-top` and
  `initPanelFaces()` are gone, fully removed, not left half-working.

## Verification (this pass)

- A1 (rounded sliver test): zoomed screenshots on panels #1, #4, #7 (this
  pass's specified set, different from Pass 2's #1/#3/#5/#7) - each shows a
  thin, rounded light edge continuous with the panel's rounded corner, not a
  straight band.
- A2 (DOM check): panel #2 (HOTEL) slab - `--depth: 6`, `6` generated
  `.hero-panel__layer` elements, `1` `.hero-panel__face` - exact match.
- A3 (seam test): full 1512×982 screenshot - consistent hinge look across all
  6 seams; seam #1-#2 specifically re-verified after the reposition.
- A4 (balance): measured via `getBoundingClientRect` at 1512×982 - panel #1
  edge distance 9.5px vs panel #7's 13.4px (0.26% of viewport, inside ±2%);
  panel #4 center 756.3px vs viewport center 756px (0.02% off).
- A5 (labels + interaction): all 7 `.hero-panel__label` bounding boxes mutually
  non-overlapping and on-screen; dispatching a `mouseenter` on panel #4's hover
  zone correctly applies `.is-active` to the renamed `.hero-panel` element,
  confirming the interaction logic still resolves correctly against the new
  selector.
- A6: no `reference-hero.png` exists in this repo (same gap as every prior
  pass) - checked by eye against the written spec instead.
- A7: forced-scroll listener still engages on a dispatched wheel event
  (`defaultPrevented: true`); full tween completion and `?replay` still can't
  be driven to completion under this session's headless-Chrome tooling
  (`--virtual-time-budget` doesn't advance `requestAnimationFrame` properly) -
  same disclosed gap as every prior pass. The descent code itself, and its
  `getComputedStyle(panel).order` read for stagger sequencing, were not
  touched - `order` per panel is still set in CSS even though it has no visual
  layout effect under `position: absolute`.

## Measured overlaps (this pass's 4-8px target, all 6 seams)

0-1: 5.5px · 1-3: 6.3px · 3-2: 5.5px · 2-4: 7.1px · 4-5: 6.8px · 5-6: 7.1px —
all inside 4-8px.

---

# Pass 4 — 2026-07-15: fringe fix + thickness tuning (no layout/motion changes)

## Summary

Small tuning pass on the existing slab implementation - explicitly no layout or
motion changes; positions/rhythm/rotation values from Pass 3 are untouched. Three
fixes: (1) a dashed white hairline was appearing around every panel at rest,
root-caused to the core layers and the face sharing an identical `inset: 0`
footprint - fixed by insetting the layers 0.5px smaller than the face so their
anti-aliased rounded corners never peek past the face's own edge. (2) Thickness
tuned - `--depth` 6→8, `--radius` 10px→12px (face and layers now match exactly),
edge color darkened to a `#CFCAC3`-centered vertical gradient. Verified the layer
generation itself was never broken (8/8 layers confirmed per panel, all 7), and
via `getBoundingClientRect` marker measurements found the edge width is
strongly position/angle-dependent (as already established for this stage's
perspective in earlier passes) - panel #6 shows a strong, continuous edge
(~6px), panel #2 does not (~2px, confirmed visually near-invisible) - see
"Known limitation" below. (3) Verified BUG 3 (physical solidity during
interaction) was already fully satisfied by existing code with zero changes
needed - confirmed via a rapid hover-sweep-and-exit test.

## Files touched

- `css/style.css` - `.hero-panel__layer` gained `inset: 0.5px` (was implicitly
  `inset: 0` via the shared rule with `.hero-panel__face`) and
  `-webkit-backface-visibility: hidden` alongside the existing unprefixed
  property; same prefix addition on `.hero-panel__face`. `.hero-panel__slab`'s
  `--depth` (6→8), `--edge` (solid `#D8D4CE` → a `linear-gradient` centered
  on `#CFCAC3`), and `--radius` (10px→12px) custom properties changed. No
  selectors added or removed.
- `index.html` - only transient debug-flag-gated test scripts, added and fully
  removed during verification.
- `js/main.js` - **not touched this pass** (verified `initPanelLayers()` was
  already correct - see A2/layer-count evidence below; no tween anywhere
  targets `.hero-panel__slab`/`__face`/`__layer`; `zIndex` bump-on-activate/
  restore-on-deactivate and `gsap.killTweensOf` were already present exactly as
  BUG 3 asked for).

## New CSS classes / JS functions / variables introduced

None. This pass only changed values on existing rules/properties.

## Existing classes/functions/variables modified (not just added)

- `.hero-panel__layer` - added `inset: 0.5px` (previously used the base
  `inset: 0` it shared with `.hero-panel__face`) and
  `-webkit-backface-visibility: hidden`.
- `.hero-panel__face` - added `-webkit-backface-visibility: hidden` (its
  `inset: 0` is unchanged - it's the reference size the layers are now inset
  0.5px smaller than).
- `.hero-panel__slab`'s `--depth`, `--edge`, `--radius` custom property values
  changed (listed above). No selector renamed.

## Things NOT touched on purpose

Confirmed untouched, exactly as instructed: the zigzag layout, height rhythm,
rotation signs/values (`--ry`), and horizontal positions (`left`/`width` per
panel) from Pass 3; `js/main.js` in its entirety (no tween, no selector, no
function signature changed); the hover/click/activation state machine; navbar,
headline, preloader, Lenis/ScrollTrigger wiring, the forced-descent sequence,
mobile gallery.

## Merge risk notes

- **Purely a value-tuning pass** - no new or renamed identifiers, so there's
  nothing new here for a merge to collide with beyond the same
  `--panel-depth`-style custom-property scoping already flagged in Pass 3
  (`--depth`/`--edge`/`--radius` are scoped to `.hero-panel__slab`, not
  `:root`).
- **`inset: 0.5px` is a real, if small, sizing change** to every core layer -
  if a future pass adds content that expects the layer to exactly fill its
  parent (e.g. a full-bleed background), it's now 0.5px short on each edge.
  Unlikely to matter visually, flagging for completeness.

## Known limitation (disclosed, not silently shipped)

**Panel #2's edge does not reach the "4-8px" target and is visually
near-invisible along the seam**, while panel #6's does (see A1/A2 evidence
below). Root-caused via `getBoundingClientRect` marker measurements comparing
the face (`translateZ(depth)`) to the back layer (`translateZ(0)`) - i.e. the
*total* geometric span of the stack, not merely two adjacent 1px layers:

| Panel | idx | rotateY | measured edge (max of L/R) |
|---|---|---|---|
| #1 TABACCHI | 0 | -32° | 7.4px |
| #2 HOTEL | 1 | 22° | **1.9px** |
| #3 SALUMERIE | 3 | -25° | 5.1px |
| #4 BAR E RISTORANTI | 2 | 15° | 3.1px |
| #5 FARMACIE | 4 | -18° | 2.4px |
| #6 SPAZI COMMERCIALI | 5 | 24° | 5.9px |
| #7 GELATERIE | 6 | -30° | 2.0px |

This isn't a uniform function of rotation angle alone (#7 at -30° measures
weaker than #3 at -25°) - consistent with every prior pass's finding that this
stage's perspective distorts panels non-uniformly by their horizontal position,
not by a simple `depth × sin(angle)` formula. Panel #2 specifically sits at a
combination of angle and position that produces a weak geometric offset at the
now-mandated `--depth: 8` - confirmed by direct measurement, not assumed, and
confirmed visually near-invisible along the straight seam (a faint highlight
is still visible right at its exposed top corner, from the rounded-corner
gradient itself, not from side-plane parallax). Fixing this further would
require either changing panel #2's `--ry`/position (frozen this pass) or
raising `--depth` past the explicitly mandated value of 8 - both outside this
pass's authorized scope. Flagging for a future pass rather than silently
reporting full success.

## Verification (this pass)

- BUG 1 (fringe): zoomed screenshots on 3 panels (#1, #4, #7) at rest - zero
  dashed/dotted white lines anywhere on any edge.
- BUG 2.1 (layer generation): logged per-panel layer count for all 7 panels -
  `depth:8, layerCount:8, match:true` on every one; generation was never
  broken.
- BUG 2 (edge reading): panel #6 - confirmed via zoomed screenshot, a clear,
  continuous, rounded ~6px edge along its full height. Panel #2 - does not
  meet the target; see "Known limitation" above for root cause and numbers.
- BUG 3.1 (tween targets): grepped `js/main.js` for any `gsap.to`/`gsap.set`
  touching `.hero-panel__slab`/`__face`/`__layer` - none exist; every tween
  targets the `.hero-panel` wrapper (or `.card-reflection`) only.
- BUG 3.2 (z-index during interaction): confirmed already present -
  `activatePanel` sets `zIndex = 50` on the activating panel;
  `deactivateAll` restores `zIndex = Z_INDEX_BASE[idx]`. No change needed.
- BUG 3.3 (rapid sweep test): dispatched `mouseenter` on all 7 hover zones in
  immediate succession, then `mouseleave` on the last one. After settling:
  `activeCount: 0`, every panel's `zIndex` back to its exact `Z_INDEX_BASE`
  value (8/16/12/20/16/12/8) - no stuck state, no half-raised panel. Screenshot
  of the settled end-state shows a clean resting row, no frozen fringe/flicker.
  Separately screenshotted panel #4 (BAR E RISTORANTI) raised - clean edges,
  neighbors visibly intact (dimmed/scaled per the existing, untouched
  choreography, not glitched).

---

# Pass 5 — 2026-07-15: definitive thickness (real side faces) + a real found-and-fixed bug

## Summary

Replaced the stacked-layer illusion with real side/back/top faces per an exact,
literally-specified implementation - `--depth: 14px`, `rotateY(±90deg)
translateZ(...)` side planes instead of many thin stacked layers. The literal
CSS/JS, pasted verbatim, initially rendered **nothing** - no side face visible
at any angle, confirmed via a solid-color diagnostic (a 40px lime side with
`z-index:999` and even `transform:none` still painted zero pixels). This was
not a transform-math problem (the given spec anticipated "geometry, not a
bug," but that wasn't it either). Root cause, found by direct toggling: **`.hero-panel` had `filter: brightness(0.82)` on itself**, and CSS `filter`
forces the element it's applied to be pre-composited as a flat 2D bitmap
before the filter runs - which silently flattens any `transform-style:
preserve-3d` content nested inside it, regardless of how correct that nested
3D math is. Confirmed decisively: setting `filter: none` on the panel made the
side face appear immediately, with no other change. Fix: moved the brightness
filter (both the CSS fallback and the three GSAP tweens that set it) from
`.hero-panel` to `.hero-panel__face` - a leaf with no 3D children, safe to
filter. Every rotation/position/scale tween still targets `.hero-panel`
exactly as before; only the filter itself now targets the face element,
which is content (existing per the spec's own STEP 3, "keeps the img +
label"), not one of the thickness/layer elements the freeze protects.

## Files touched

- `css/style.css` - old `.hero-panel__layer`(`--back`) rules deleted outright;
  new `.hero-panel__face` (revised: `translateZ(depth/2)`, `box-shadow: inset
  0 0 0 1px rgba(255,255,255,.06)`, and now also carries the `filter:
  brightness(0.82)` fallback), `.hero-panel__back`, `.hero-panel__side` (+
  `--left`/`--right`/`--top`) rules added, pasted verbatim from spec except
  for the filter relocation. `.hero-panel__slab`'s custom properties changed
  to `--depth:14px`, `--radius:8px`, `--edge-light`/`--edge-dark` (replacing
  the old single `--edge` gradient var). `.hero-panel` lost its own `filter`
  declaration (moved to face, see Summary).
- `js/main.js` - `initPanelLayers()` deleted outright, replaced with
  `initPanelFaces()` (creates `.hero-panel__back` + both `.hero-panel__side`
  variants + `.hero-panel__side--top`, inserted before the existing
  `.hero-panel__face` in the exact mandated order). New `getFaceFor(panel)`
  helper. The four places that used to set `filter` on the `.hero-panel`
  wrapper (init, `activatePanel`'s two branches, `deactivateAll`) now set
  `filter` on `getFaceFor(panel)` instead, as a parallel tween/set alongside
  the unchanged wrapper tween. `killPanelTweens()` now also kills tweens on
  the face element.
- `index.html` - only transient debug-flag-gated test scripts, added and
  fully removed during verification.

## New CSS classes / JS functions / variables introduced

- `.hero-panel__back`, `.hero-panel__side`, `.hero-panel__side--left`,
  `.hero-panel__side--right`, `.hero-panel__side--top` (CSS) - the mandated
  real-face thickness structure.
- `getFaceFor(panel)` (JS) - returns `panel.querySelector('.hero-panel__face')`,
  mirroring the existing `getReflectionFor` pattern.

## Existing classes/functions/variables modified (not just added)

- `.hero-panel` - `filter: brightness(0.82)` **removed** (see Summary/root
  cause). Everything else on this rule (position, transform, transform-style,
  box-shadow, cursor, transition) is unchanged.
- `.hero-panel__face` - gained `box-shadow: inset 0 0 0 1px rgba(255,255,255,.06)`
  and `filter: brightness(0.82)` (the relocated fallback); its `transform`
  changed from `translateZ(calc(var(--depth) * 1px))` (old depth semantics)
  to `translateZ(calc(var(--depth) / 2))` (new, matches the mandated
  front/back symmetric-depth model).
- `js/main.js`: `activatePanel`, `deactivateAll`, the init `REST` loop, and
  `killPanelTweens` - each gained one additional `face`-targeted line;
  the pre-existing `panel`/`p`-targeted tweens had only their `filter:` key
  removed, nothing else about them changed (same duration, ease, other
  properties).

## Things NOT touched on purpose

Confirmed untouched: panel positions/widths (`left`, unchanged from Pass 3),
height rhythm (`--h` per panel), rotation signs/values (`--ry` per panel), the
state machine's structure and every tween's duration/easing/other-properties,
`REST`/`Z_INDEX_BASE` tables, event listeners, navbar, headline, preloader,
Lenis/ScrollTrigger wiring, the forced-descent sequence, mobile gallery.

## Merge risk notes

- **`filter` relocation is the one real architectural change this pass made**,
  and it was necessary, not optional - the literal spec's side faces are
  structurally incapable of rendering while `filter` sits on the same element
  as their `preserve-3d` ancestor, per CSS spec (this is universal browser
  behavior, not specific to this codebase). If any future pass reads
  `.hero-panel`'s filter expecting it to reflect the panel's brightness
  state, it needs to read `.hero-panel__face` instead now.
- **No renamed classes/functions carried forward from Pass 4** -
  `.hero-panel__layer`(`--back`) and `initPanelLayers()` are gone, fully
  removed, not left half-working, matching the collaboration rule about not
  shipping dead code.
- Same custom-property scoping note as prior passes: `--depth`/`--radius`/
  `--edge-light`/`--edge-dark` live on `.hero-panel__slab`, not `:root`.

## Truth test (T4) results

- **T4.1** (panel #4 forced to `rotateY(65deg)`, restored after): initial
  attempt via a late `p.style.transform` mutation showed no visible rotation
  in the screenshot despite `getComputedStyle` confirming the correct
  matrix - a headless-Chrome late-3D-mutation compositor quirk already seen
  elsewhere in this project. Re-tested by baking the 65° value into the
  initial `REST` table before page load instead (removing the headless
  timing variable entirely): dramatic, correct foreshortening, and a clear
  ~12px+ light band with the rounded corner flowing into it, exactly as the
  test specifies. Restored to 15° after.
- **T4.2** (panels #1 TABACCHI, #2 HOTEL, #6 SPAZI COMMERCIALI, #7 GELATERIE
  at rest): all four show a thin, continuous, rounded light edge running
  their full visible height - confirmed via zoomed screenshots for each.
- **T4.3** (full-viewport, all 7 panels): zero white dashed/dotted fringes
  anywhere, all photos clean.
- **T4.4** (hover one panel, panel #1 TABACCHI): edge stays attached and
  coherent through the raise; neighbors visibly dim/scale per the existing,
  unchanged choreography, no glitches. Confirmed via `grep` that every
  rotation/position/scale tween still targets `.hero-panel` only - the one
  exception is `filter`, now targeting `.hero-panel__face` for the reason
  documented above.

---

# Pass 6 — 2026-07-15: glass slab edge (photo-derived material) + a real self-inflicted bug found and fixed

## Summary

Replaced Pass 5's plain-color side faces with the mandated "glass mass" material:
each side face now shows the panel's OWN photo (via a `--panel-img` custom
property set from the `<img>`'s `src`), blurred/darkened/desaturated, so the
edge reads as the same physical material continuing around the corner instead
of a separate colored strip - plus a corner-glow inset box-shadow baked into
the front face itself, and the old bottom-darkening gradient relocated to
`::before` to make room for it on `::after`. The `.hero-panel__side--top` face
was deleted per this pass's explicit instruction (front/back/left/right only).

This pass involved an extended, genuinely difficult debugging detour: after
the literal CSS/JS was pasted, the entire panel row rendered as a near-black
sliver. Extensive investigation (documented in full below, in "What actually
went wrong") initially misattributed this to a headless-Chrome rendering/
timing problem - it was not. The real cause was a self-inflicted regression:
transcribing the spec's literal `.hero-panel__slab` rule (which lists only
`--depth`/`--radius`/`transform-style`) as a literal *replacement* dropped the
`position: relative; width: 100%; height: 100%;` that Pass 5's version had and
that this pass never should have removed - undocumented but load-bearing
infrastructure, not a value the spec was asking to change. Once restored, the
row rendered correctly and all six truth-test items (N1-N6) passed cleanly.

## Files touched

- `css/style.css` - `.hero-panel__slab` restored its `position`/`width`/
  `height` (see "What actually went wrong"); `--depth` 14px→18px, `--radius`
  8px→12px (this pass's mandated values); `.hero-panel__face` lost its old
  `box-shadow: inset 0 0 0 1px rgba(255,255,255,.06)` hairline (superseded by
  the new `::after` corner-glow, which includes an equivalent hairline in its
  own box-shadow list) and gained the mandated corner-glow `::after`; the old
  bottom-darkening `::after` moved to `::before` to free up `::after`.
  `.hero-panel__back` background `#101010` (unchanged value, already this
  color from Pass 5). `.hero-panel__side` rebuilt: solid gradient background
  replaced with `background-image: var(--panel-img)` + `background-size` +
  `background-position` (left/right variants) + `filter: blur(7px)
  brightness(.5) saturate(1.15)`. `.hero-panel__side--top` deleted outright.
- `js/main.js` - `initPanelFaces()` no longer creates a top face (three
  children now: back, side-left, side-right). New block sets `--panel-img` on
  every `.hero-panel__slab` from its own `.hero-panel__img`'s `src`, once at
  init.
- `index.html` - only transient debug-flag-gated test scripts, added and
  fully removed during verification (this pass's debugging required an
  unusually large number of these - see below).

## New CSS classes / JS functions / variables introduced

- `--panel-img` (CSS custom property, scoped to `.hero-panel__slab`, set via
  JS, not `:root`) - holds each panel's own `url("...")` reference so the
  side faces can show that same photo as their background-image.
- No new JS functions - the `--panel-img` setter is an inline `forEach`, not
  a named function, matching the literal spec's snippet.

## Existing classes/functions/variables modified (not just added)

- `.hero-panel__slab` - **regression fixed, not a spec change**: restored
  `position: relative; width: 100%; height: 100%;`, which Pass 5 had and this
  pass's literal transcription of the spec's snippet had dropped. `--depth`/
  `--radius` values changed per this pass's explicit mandate (14→18, 8→12).
- `.hero-panel__face` - `box-shadow` (old hairline) removed, `::after`
  content replaced (bottom-darkening → corner-glow, with bottom-darkening
  moved to a new `::before` instead of being lost).
- `.hero-panel__side`, `--left`, `--right` - background mechanism changed
  from flat gradient to photo-derived `background-image` + blur/darken
  filter; `--top` variant deleted.
- `initPanelFaces()` (JS) - stopped creating a fourth (top) child element.

## Things NOT touched on purpose

Confirmed untouched: panel positions/widths/heights, rotation signs (`--ry`),
the hover/click/activation state machine, navbar, headline, preloader, Lenis/
ScrollTrigger wiring, the forced-descent sequence, mobile gallery. The
`filter`-on-`.hero-panel__face`-not-`.hero-panel` architecture from Pass 5
(the fix for CSS `filter` flattening nested `preserve-3d` content) was kept
exactly as-is - re-verified still necessary and still correctly placed during
this pass's debugging.

## What actually went wrong (full account, for whoever reads this before
touching the slab structure again)

The literal spec for `.hero-panel__slab` was:
```css
.hero-panel__slab{ --depth:18px; --radius:12px; transform-style:preserve-3d; }
```
Pass 5's actual working version of this rule additionally had `position:
relative; width: 100%; height: 100%;`. Those three properties are not
decorative - they're what gives the slab a definite size at all. Without an
explicit size, `.hero-panel__slab` is `position: static` with `height: auto`;
since ALL of its children (`face`/`back`/`side`) are `position: absolute`,
none of them contribute to its auto-height, so the slab collapses toward
zero. Normally a `position: static` element with `inset: 0` children would
just let the browser look further up the tree for a positioned ancestor
(`.hero-panel`, which is genuinely `position: absolute`) - except
`transform-style: preserve-3d` **also** makes an element the containing block
for its absolutely-positioned descendants in Chromium, independent of its own
`position` value. So the slab, despite being `static`, still became the
containing block its `inset: 0` children sized against - and since the slab
had collapsed to near-zero height, so did they, all the way down to the
`<img>`.

This was hard to find because every symptom pointed away from CSS layout:
- The panel row rendered as a uniform near-black band, indistinguishable at a
  glance from "the preloader never finished."
- A live probe confirmed the preloader/entrance GSAP timeline's `.loader-bg`
  opacity tween genuinely never progressed past its starting value across
  many real seconds of headless run time, which is a legitimate, separately
  reproducible symptom (GSAP's `requestAnimationFrame`-driven ticker
  appearing to stall under `--virtual-time-budget`) - but it was a
  coincidental **second** issue, not the cause of the dark render. Forcibly
  removing the loader via direct DOM manipulation (for diagnostic purposes
  only) still left the gallery rendering black underneath a now-visible,
  correctly-lit navbar - which is what redirected the investigation back to
  the panels themselves.
- `getComputedStyle` on `.hero-panel` (the wrapper) reported a completely
  normal, correct height (~376px) at every check, because the wrapper's own
  height comes from a different rule (`calc(var(--panel-base-h) * var(--h))`)
  that was never touched - the collapse was one level deeper, on the slab,
  and was only caught by explicitly checking `.hero-panel__img`'s own
  `getBoundingClientRect()`/computed `height`, which read `0px`.
- A `<canvas>` pixel-read of the raw `<img>` bitmap returned real, correct
  color data throughout, which briefly (and wrongly) suggested the problem
  was in compositing/paint rather than layout - `ctx.drawImage()` reads the
  decoded image file directly and bypasses the CSS box model entirely, so it
  never could have caught a `height: 0` layout bug.

Fix: two properties added back to `.hero-panel__slab`. No other change was
needed - once the slab had a real size, the mandated `--depth`/`--radius`/
photo-derived sides all worked exactly as specified on the first subsequent
screenshot.

## Merge risk notes

- **`.hero-panel__slab` sizing is now the single most fragile line in this
  whole structure.** Any future pass that "cleans up" or re-pastes this rule
  from a spec snippet must keep `position: relative; width: 100%; height:
  100%;` even if a given spec's literal CSS block doesn't mention them -
  they're required infrastructure, not tunable values. Flagging explicitly
  so this exact regression doesn't recur a third time.
- **`--panel-img` is scoped to `.hero-panel__slab`**, not `:root` - can't
  collide with a global token or with Luis's section.
- The `filter`-relocation architecture from Pass 5 (brightness lives on
  `.hero-panel__face`, never on `.hero-panel`) remains a load-bearing
  constraint on this structure - re-confirmed during this pass's debugging,
  not re-litigated or changed.
- No renamed classes/functions - `.hero-panel__side--top` and its one
  reference in `initPanelFaces()` were deleted outright, not left half-wired.

## Verification (N1-N6, all pass)

- **N1** (panel #4 forced to `rotateY(65deg)`, restored after): the visible
  side face shows blurred, darkened warm-brown tones clearly derived from the
  bar's own photo, with a soft glow at the rounded corner - confirmed via
  zoomed screenshot. No flat white/gray band.
- **N2** (panels #1, #3, #5, #7 at rest, zoomed on inner edges): all four
  show the photo's own rounded corner flowing directly into the neighboring
  panel with no seam, no white line, no color jump - confirmed via zoomed
  screenshots at each of the four seams.
- **N3** (deletion test, reasoned from N1's evidence): yes - N1 demonstrates
  the side face is genuinely structural (it's what shows the material
  bridging between two rotated panels at an angle); removing it would leave
  a visibly cut, unfinished edge at any non-trivial rotation.
- **N4** (full-viewport screenshot): zero floating hairlines, zero white
  strips anywhere, confirmed on the final, fully-restored render.
- **N5** (hover panel #2 HOTEL, raise + return): screenshot of the raised
  state shows a clean, fused edge, correct rounded corners, neighbors
  dimmed/scaled per the existing choreography, no detach or flicker
  artifacts.
- **N6**: forced-scroll listener still engages on a dispatched wheel event
  (`defaultPrevented: true`); full tween-to-completion and `?replay` remain
  unverifiable end-to-end under this session's headless tooling (same
  disclosed gap as every prior pass, compounded this pass by the separate
  GSAP-ticker-stall symptom described above). The descent code itself was
  not touched.
