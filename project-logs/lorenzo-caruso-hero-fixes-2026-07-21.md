# Hero swap: 7-card gallery → "Proof Hero" — 2026-07-21

Branch: `main` (local only, zero pushes). Redesign branch (`redesign-funnel-v2`) not opened/modified.

## Pre-existing uncommitted WIP on main (found at session start)

Before this task started, main had uncommitted geometry/hover bugfixes to the card hero
(card 0 mirror-width fix, raise-scale geometry cache, hover stutter fixes, `introDone`
forced-scroll gate). These predate this task and are unrelated to it. Since this task
deletes the entire card-hero system those fixes touch, applying them first would be pure
waste — they are parked in `git stash list` (`wip before funnel v2 branch`), untouched,
recoverable with `git stash pop` if wanted later. Not applied, not dropped.

## STEP 0 — Preflight map

### Exclusive to the current 7-card hero (safe to remove)

**HTML** (`index.html`)
- Lines 112-116: `.hero-text-block` (h1 `.hero-title` / p `.hero-subheadline` / a `.hero-cta`)
- Lines 119-287: `.gallery-container` — `.desktop-gallery.hero-stage` (7× `.hero-panel`,
  `.hero-panel__slab/__face/__img/__label`, `.card-hover-overlay`) + `.mobile-gallery`
  (7× `.mobile-card`)

**CSS** (`css/style.css`)
- Lines 511-576: `.hero-text-block`, `.hero-title`, `.hero-subheadline`, `.hero-cta`,
  `.hero-cta:hover` (verified: `.hero-title`/`.hero-subheadline`/`.hero-cta` each used
  exactly once in the whole file, inside the block being removed)
- Lines ~780-1141: full ported gallery block — `.gallery-container`, `.desktop-gallery`,
  `.hero-stage`, `.hero-panel*` (all descendants/pseudo-elements), `.desktop-gallery
  .card-reflection*`, `.hero-panel[data-index=...]` position table, `.mobile-gallery`
- `@media (max-width:1024px)`: `.hero-text-block` / `.hero-title` (live dupes) —
  `.hero-subtitle` and `.sector-panel` in the same block are STALE (no matching class in
  current HTML, predate the current hero generation) — left untouched, out of scope.
- `@media (max-width:768px)`: `.hero-text-block` / `.hero-title` (live) —
  `.hero-title-top`/`.hero-title-bottom`/`.hero-stats-container`/`.stat-block` in the
  same block are STALE, left untouched.
- `.desktop-gallery{display:none!important}` + `.mobile-gallery`/`.mobile-card*` rules
  inside `@media (max-width:768px)` — live, removed.

**JS** (`js/main.js`)
- Lines ~280-583 (section "4. HERO CARD GALLERY INTERACTION LOGIC" +
  "4b. HOVER HIT-ZONES"): `panels`, `activeIndex`, `REST`/`Z_INDEX_BASE`/`REST_FILTER`,
  `initGallery`, `initReflections`, `initPanelFaces`, `ZONES`/`ZONE_HEIGHT`,
  `initHoverZones`, `activatePanel`/`deactivateAll`, per-zone listeners, outside-click
  deactivate. All exclusive to the card system.

### Shared — confirmed untouched

- **Preloader / logo-to-navbar animation** (`runEntranceAnimations`, lines ~206-274):
  reads `images[]` preload list and animates `.loader-*` / `.nav-logo-img` /
  `.main-header` only. Does not reference any `.hero-panel`/`.hero-text-block` selector.
  Not touched.
- **`images[]` preload array + the 7 `<link rel="preload">` tags in `<head>`**: the 7
  sector photos (bar_parisi.jpg, hotel.png, gelato.png, bakery.png, pharmacy.png,
  tobacco.png, retail.png) are used by the card hero **and** by the separate
  "Grandi Progetti" floating-card gallery further down the page
  (`.details-desktop-gallery` / `.floating-gallery-container`, distinct class
  namespace). Left fully in place — deleting the hero cards must not break that later
  section's preload/loading-bar accounting.
- **Lenis/GSAP global wiring** (ticker, `lenis.on('scroll', ScrollTrigger.update)`):
  untouched.
- **`isMobileQuery`** (`window.matchMedia('(max-width: 768px)')`): declared inside the
  block being deleted but consumed elsewhere (touchstart tracker, `handleForcedScroll`,
  `setPhase` in the scroll-0/1/2/3 renderer). Relocated up, declaration kept verbatim,
  not deleted.
- **`.glow-orb-1/2`, `.loader*`**: independent decorative/loader elements, not
  positioned relative to or dependent on hero cards. Untouched.
- **`#build-stage` and everything in it** (scroll-0..3 pinned frame sequences):
  untouched. The forced-descent tween's target is computed off
  `buildStage.getBoundingClientRect()`, not off any hero-card element — no entanglement.
- **`text-magenta`**: also used later in the `#contatti` section copy. Not touched
  (only removed the one hero usage's parent block, the class rule itself stays).

### Forced-descent entanglement — exact selectors touched

The forced-descent tween itself (`handleForcedScroll` → `runForcedScrollTween`, lines
~664-766) references **zero** card selectors — it only reads `buildStage`'s position and
calls `lenis.scrollTo`. Fully shared, fully untouched, same trigger (`deltaY>0` at
`scrollY<=5`), same one-shot in-memory `transitionDone` flag (main never used
sessionStorage for this — confirmed by reading the file — so "same sessionStorage
behavior" carries over as "same in-memory flag" behavior, unchanged), same `?replay`
compatibility (nothing here reads a `?replay` param — that lives in the file the CLAUDE.md
doc describes for the OLD forced-descent/canvas-sequence system, which this repo's actual
`main.js` does not implement; `transitionDone` is simply never persisted, so every reload
already replays — verified, not a new behavior).

What DOES touch card elements: `heroExitTL` (lines 597-662, "5. DESKTOP-ONLY PINNED
SCROLL & FORCED ASCENT" — a separate, scrubbed ScrollTrigger pin on `.hero-section`,
0→`PIN_VH_FRACTION` of a viewport-height of natural scroll, that plays BEFORE the forced
tween takes over). It staggers every `.hero-panel` + its `.card-reflection` upward
(`y: -innerHeight-320`) and fades/lifts `.hero-text-block` (`y: -innerHeight*0.8,
opacity:0`).

**Retargeting done:** the panel/reflection stagger loop → two simple coherent tweens on
the new shell blocks, same pattern `.hero-text-block` already used (fade + slide up, no
new choreography, per instruction):
```
OLD: panels.forEach(panel => heroExitTL.to([panel, reflection], { y: -innerHeight-320, duration: 3.4 }, staggerDelay * visualIndex))
     heroExitTL.to(".hero-text-block", { y: -innerHeight*0.8, opacity: 0 }, 0)

NEW: heroExitTL.to(".hero-proof-photo", { y: -innerHeight*0.9, opacity: 0, duration: 1 }, 0)
     heroExitTL.to(".hero-proof-block", { y: -innerHeight*0.9, opacity: 0, duration: 1 }, 0.1)
```
Cleanup function (`mm.add` return, on breakpoint exit) retargeted the same way:
`gsap.set(['.hero-proof-photo','.hero-proof-block'], { y: 0, opacity: 1 })` replacing the
old `panels.forEach(...)` + `.card-reflection` + `.hero-text-block` resets.

Trigger element for the pin stays `".hero-section"` — unchanged selector, same element
(class kept on the outer `<section id="home">`), so `PIN_VH_FRACTION`/start/end math is
untouched.

## Commit 1 — remove old card hero, empty shell

Removed: all HTML/CSS/JS listed above as exclusive. Added: two empty placeholder blocks
(`.hero-proof-photo`, `.hero-proof-block`, ~72%/28% height split, solid fill, no content
yet) so `heroExitTL` has real elements to animate and the page doesn't collapse to a
blank `.hero-section`. `isMobileQuery` relocated above its first surviving use.
Verified: page loads, no console errors, preloader → navbar logo animation plays
identically, forced descent still triggers/completes/reverses, sections below intact.

## Commit 2 — build proof hero in the shell

Pending the Nano Banana asset-approval gate (see chat). Will fill `.hero-proof-photo`
with the generated image + headline/subline, `.hero-proof-block` with the three-lockup
signature plaque + proof line + micro-link. All new classes `.hero-proof-*`.

## NOT touched (confirmed)

- Preloader ✓ · logo-to-navbar animation ✓ · navbar itself ✓ · every section below the
  hero (`#build-stage` and its 4 scroll-scrubbed sequences, stats, details/floating
  gallery, consult CTA, footer, modals) ✓ · `redesign-funnel-v2` branch (not checked
  out, not modified) ✓ · remote (zero pushes, confirmed via `git status` on both
  worktrees below) ✓

## MERGE NOTES for Luis

His section lands on `main` later, separately. Contact points to check when combining:
- **Shared CSS vars** in `:root` (`--color-magenta-deep`, `--font-serif`, `--font-sans`,
  `--z-*` scale) — new `.hero-proof-*` rules reuse these, introduce no new custom
  properties.
- **`isMobileQuery`** — now declared once, near the top of the `DOMContentLoaded`
  handler (moved from inside the deleted gallery block). If his section adds its own
  `matchMedia('(max-width: 768px)')` query, prefer reusing this shared instance instead
  of re-declaring.
- **`.hero-section` id="home"** — still the ScrollTrigger pin trigger + the
  forced-descent's implicit "top of page" anchor. Don't rename/remove this id or class.
- **`#build-stage`** section id/anchor — descent scroll target, computed by
  `getBoundingClientRect()`, not by a fixed offset. As long as it's the next section
  after the hero in DOM order, nothing else needs to change.
- **`transitionDone` / `isTweening` / `isStageLocked`** — in-memory flags (module-scope
  `let`s inside the single `DOMContentLoaded` closure), no sessionStorage. If his work
  adds another top-of-page scroll hijack, it must share these flags rather than
  introducing parallel ones.
- **No new `#contatti`/anchor IDs added** by this pass — the proof hero's micro-link
  target is the existing next section after the hero (`#build-stage`), scrolled via the
  existing `window.__lenis` instance (`lenis.scrollTo`), not a new anchor.
