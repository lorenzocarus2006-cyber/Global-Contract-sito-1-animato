# Page reorder + client marquee — 2026-07-22

Branch: `main` (local only, zero pushes). `redesign-funnel-v2` not checked out,
not modified — confirmed clean (`git status` on its worktree: "nothing to
commit, working tree clean") before and after this pass.

## Summary

- Hero proof-numbers block (`.hero-proof-block`: 30/850+/Sicilia lockups,
  Hard Rock/Villa Igea client line, "SCOPRI COME LAVORIAMO" link) removed
  entirely from the hero. Hero keeps only the photo + headline + subline
  (`.hero-proof-photo`), now filling the hero's full height.
- New `.gc-marquee` client-logo-strip section added directly below the hero.
- Page reordered top -> bottom:
  1. Hero (proof photo/headline/subline only)
  2. **Client marquee (new)**
  3. Numeri ("Numeri che parlano di affidabilità" stats section) - **moved up**
  4. Forced-descent build-stage (scroll-0..3 sequence) - unchanged position
     relative to numeri/sectors, but numeri now precedes it instead of
     following it
  5. Sector cards (`#settori`) - unchanged position (still right after
     build-stage)
  6. Realized projects (`#dettagli`) - untouched, same position
  7. Final CTA (`#contatti`) - untouched, same position
- Forced-descent entry trigger changed from a global "first scroll at page
  top" hijack to a ScrollTrigger `onEnter` on `#build-stage` itself (see
  TRIGGER CHANGE below) - required because build-stage no longer sits
  immediately below the hero.
- Hero's own exit pin (`heroExitTL`) had `pin: true` removed (see LAYOUT FIX
  below) - required so the marquee is visible in the first viewport with
  zero scroll, per the brief.

## Files touched

- `index.html` - removed `.hero-proof-block` markup; added `.gc-marquee`
  section (2 duplicated `.gc-marquee-group` tracks, 10 client names each);
  moved the `#stats-bg` + `#numeri` block from between `#settori` and
  `#dettagli` to between the marquee and `#build-stage`.
- `css/style.css` - removed `.hero-proof-block` and all its descendant rules
  (`.hero-proof-lockups/-lockup/-figure/-qualifier/-dot/-clients/-link`) plus
  their `min-width:769px` overrides; `.hero-proof-photo` changed
  `flex: 0 0 72%` -> `flex: 1 1 auto` (now the hero's only child, fills 100%);
  new root var `--gc-marquee-h: clamp(48px, 6vw, 64px)` (44px on mobile);
  `.hero-section` height changed `100vh` -> `calc(100vh - var(--gc-marquee-h))`
  (see LAYOUT FIX); new self-contained `.gc-marquee-*` block appended at end
  of file (own mobile media query + `prefers-reduced-motion` override).
- `js/main.js` - removed the dead `#heroProofLink` micro-link handler (target
  element no longer exists); `heroExitTL` no longer targets the removed
  `.hero-proof-block`; removed `pin: true`/`anticipatePin` from `heroExitTL`'s
  ScrollTrigger (see LAYOUT FIX); removed the old `handleForcedScroll`
  function, its `touchstart`/`touchStartY` tracking, and its 3 top-level
  `wheel`/`touchmove`/`keydown` listener registrations; added a new
  `ScrollTrigger.create({ trigger: "#build-stage", start: "top top", onEnter
  })` inside the existing desktop-only `mm.add` block (see TRIGGER CHANGE).
  `runForcedScrollTween`, `blockInput`, `unlockStage`, and the whole
  scroll-0..3 pinned/scrubbed sequence logic: untouched, byte-for-byte.

## What MOVED (from -> to)

- `#stats-bg` + `<section class="stats-section" id="numeri">`: **from**
  between `#settori` and `#dettagli` **to** between the new `.gc-marquee`
  section and `#build-stage`. Markup copied verbatim (cards, SVG icons,
  copy, data-target attributes) - nothing inside it edited.
- Nothing else changed position: `#build-stage` and `#settori` were already
  adjacent in this order in the current `main` working tree (from the prior
  2026-07-21 pass), so only `#numeri` needed to move for the target 1-7 order.

`js/scroll-stats.js` needed **zero changes** - it selects `.stats-section` /
`#stats-bg` by class/ID, not by position, and `.stats-bg` is `position:fixed`
(z-index 6, above the z-index 5 opaque dark sections, below the header) so
the cream-backdrop cross-fade works identically regardless of where
`#numeri` sits in the DOM. Verified live (screenshot) - bg-fade and the
3-card fly-in both fire correctly at the new position.

## TRIGGER CHANGE (forced descent) - read carefully

**OLD mechanism:** a global `wheel`/`touchmove`/`keydown` listener
(`handleForcedScroll`, capture phase) fired on the very first downward
gesture while `window.scrollY <= 5` (i.e. at the literal top of the page) -
this worked because `#build-stage` used to sit immediately below the hero,
so "first scroll at page top" and "user is about to reach build-stage" were
the same moment.

**Why it had to change:** with the marquee + numbers section now between the
hero and `#build-stage`, "scrollY<=5" fires while the user is still at/near
the hero, hijacking their scroll into the auto-tween before they've even
seen the marquee/numbers - wrong moment entirely.

**NEW mechanism:** `ScrollTrigger.create({ trigger: "#build-stage", start:
"top top", onEnter: () => { if (transitionDone || isTweening) return;
runForcedScrollTween(); } })`, registered inside the existing desktop-only
(`min-width: 769px`) `mm.add` block (auto-torn-down on breakpoint change,
same as `heroExitTL`). Fires exactly when `#build-stage`'s top crosses the
viewport top scrolling down - i.e. the instant normal scroll actually reaches
the section that needs the forced descent. `onEnterBack` is intentionally
NOT bound, so scrolling back up into the section from below never
retriggers it (same one-shot spirit as before).

**What did NOT change:** `runForcedScrollTween()`'s body - duration (1.8s),
easing, `lock: true`, the `stageTop`/`targetScroll` math, the 6s safety
unlock timeout - is untouched. It still computes
`buildStage.getBoundingClientRect().top + window.scrollY` at call time, which
is correct regardless of how the user arrived there. `transitionDone` /
`isTweening` / `isStageLocked` one-shot flags: same in-memory (no
sessionStorage) flags as before, same semantics.

**`?replay` note:** the brief mentions "`?replay` still resets it" as an
existing invariant to preserve. Confirmed (as the 2026-07-21 log already
noted) - this codebase has **no** `?replay` handling and **no**
`sessionStorage` persistence for `transitionDone` anywhere; it's an
in-memory flag that resets on every full page reload regardless. That
CLAUDE.md-documented behavior belongs to an older/different implementation
than what's actually in `js/main.js`. Nothing here changes that status -
still no `?replay`, still resets on reload, exactly as before this pass.

## LAYOUT FIX (not in the original brief, required to satisfy A2)

Acceptance criterion A2 requires the marquee "visible in the first viewport
under the hero without scrolling." The hero's own exit ScrollTrigger
(`heroExitTL`) had `pin: true` with a scroll-distance of `PIN_VH_FRACTION *
innerHeight` (~315px at 900px viewport height). **Any** GSAP pin reserves
that distance as real, permanent layout space (a `.pin-spacer` div) right
after the pinned element - completely independent of scroll position - so
whatever sits next in the DOM (the marquee) would always start ~315px below
the hero's bottom edge, pushed below the fold. This was invisible before
(the old `#build-stage` sat right there and was only ever reached via the
forced-descent auto-scroll, never manually scrolled past), but breaks the
new marquee requirement outright - no CSS-only fix, since the extra space is
inserted by ScrollTrigger's own layout, not styling.

Fix: removed `pin: true` / `anticipatePin: 1` from `heroExitTL`'s
`ScrollTrigger` config (kept `scrub: true`, same `start`/`end` range, same
`.hero-proof-photo` fade+rise tween). The hero now fades/rises as the user
scrolls the first ~35% of a viewport height, without being held fixed in
place while doing it - no more reserved runway, so the marquee sits flush
against the hero's own (now `calc(100vh - var(--gc-marquee-h))`) height.
Verified live: `.gc-marquee`'s `getBoundingClientRect().top` sits exactly
at the hero's `getBoundingClientRect().bottom` (836px on a 900px-tall
viewport, 64px marquee filling the rest) with zero scroll, on both a fresh
1512px and 390px viewport.

## New `.gc-marquee-*` classes + client-name source

Self-contained CSS block appended at the end of `css/style.css` (own mobile
`max-width:768px` query + `prefers-reduced-motion` override). Two identical
`.gc-marquee-group` tracks side by side inside a `width:max-content` flex
track; the track animates `transform: translateX(-50%) -> translateX(0%)`
on an infinite linear loop, so it shifts exactly one group's width per cycle
- seamless wrap, pure CSS (no GSAP/JS), GPU-composited (transform only).
Confirmed animating live (`.gc-marquee-track`'s `left` measured at two
points 1.5s apart, moved from -1584px to -1478px).

**Client names used** (10, deduplicated, most-recognizable subset):
Hard Rock Café, Grand Hotel Villa Igea, Aeroporto di Catania, Università di
Catania, Profumeria La Gardenia, Bugatti Station, Terranova, Costa Caffè,
Camomilla, Mango.

**Source:** Hard Rock Café / Terranova / Costa Caffè / Profumeria La
Gardenia / Università di Catania / Camomilla were given explicitly in the
brief. The rest (Grand Hotel Villa Igea, Aeroporto di Catania, Bugatti
Station, Mango) were pulled from `redesign-funnel-v2`'s own `.references`
section (`index.html`, its `S2 — REFERENCES` block) and `.proof-line` /
`.mobile-card-proof` copy, read via the existing read-only worktree preview
at `:8001` - not invented, not copied/edited into that branch. Two names
from that section (Grand Hotel dell'Etna, Blu Serena Serenusa Village) were
deliberately left out to keep the loop to the most recognizable set, per
the brief's "clean deduplicated set" instruction.

## What was NOT touched (confirmed)

- Navbar, preloader, logo-to-navbar animation ✓ (no selector overlap, not
  referenced by anything changed in this pass)
- `#dettagli` (realized projects / floating gallery) - markup, CSS, JS,
  copy, position: untouched
- `#contatti` (final CTA) - markup, CSS, JS, copy, position: untouched
- Sector cards (`#settori`) - markup/CSS/JS/order/labels/hover-click state
  machine: untouched, only its page position is unchanged too (still right
  after build-stage)
- The scroll-0..3 pinned/scrubbed sequence itself (`renderPinned`,
  `setPhase`, `scroll0TL`, `SCROLL0..3_PIN_FRACTION`, `HANDOFF*`): untouched
- `redesign-funnel-v2` branch/worktree: not checked out, not modified,
  confirmed clean

## ACCEPTANCE - verified via headless Chromium (Playwright), both localhosts

- **A1** - screenshots taken at 390px and 1512px, full top-to-bottom flow.
- **A2** - marquee confirmed animating (translateX drift measured over
  1.5s), visible with zero scroll on both viewport sizes, real names only.
- **A3** - numbers section bg cream cross-fade + stat-card fly-in confirmed
  working at the new (earlier) position.
- **A4** - forced descent confirmed firing exactly once on reaching
  `#build-stage` via real wheel-driven scroll (not synthetic
  `scrollIntoView`, which does not reproduce Lenis's scroll-event flow and
  gave a false negative during testing - noted here so nobody re-"fixes"
  the trigger based on that artifact). Mid-animation screenshot captured.
  `transition-done` class confirmed added exactly once; scrolling back up
  past `#build-stage` and back down again did **not** re-fire it (console
  log "Stage building complete..." printed exactly once across the whole
  test).
- **A5** - sector cards render, hover-raise state confirmed live (cursor
  parked over the "Bar e Ristoranti" zone), floor reflections intact.
- **A6** - `#dettagli` and `#contatti` screenshots match pre-existing
  content/layout, unchanged.
- **A7** - both localhosts confirmed up (main :8000, `redesign-funnel-v2`
  preview :8001); `redesign-funnel-v2` worktree `git status`: clean.
- No console/page errors in any of the above runs (desktop or mobile).

No commits, no pushes - everything above is in the `main` working tree only,
pending your review.

## MERGE NOTES for Luis

Same shared-touch-point risk as the 2026-07-21 log flagged, now with more
surface area since section order itself moved:

- **Section ordering in `index.html`** - the DOM order is now hero ->
  `.gc-marquee` -> `#numeri` -> `#build-stage` -> `#settori` -> `#dettagli`
  -> `#contatti`. If your work also touches section order/position, diff
  against this list first - reordering is the single riskiest thing to
  merge blind here.
- **`#stats-bg` + `#numeri` moved** - if you have any pending changes to the
  stats section, they'll apply cleanly content-wise (nothing inside it
  changed), but expect a position conflict in the diff since it's no longer
  between `#settori` and `#dettagli`.
- **`heroExitTL`'s `pin: true` was removed** (see LAYOUT FIX above). If your
  work assumes the hero is still pinned/held-fixed during its exit (e.g. any
  scroll-math computed off "hero pin adds `PIN_VH_FRACTION * innerHeight` of
  runway"), that assumption is now false - there is no runway, the hero
  scrolls away normally while fading.
- **Forced-descent trigger is no longer a global scroll hijack** - it's a
  `ScrollTrigger.create({ trigger: "#build-stage", start: "top top", onEnter
  })` living inside the `mm.add("(min-width: 769px)", ...)` block, cleaned
  up (`.kill()`) alongside `heroExitTL` on breakpoint change. If your work
  adds another top-of-page or position-based scroll hijack, don't re-bind
  to `window.scrollY <= 5` - build-stage (or whatever comes after your
  section) is not "the top" anymore. Share `transitionDone`/`isTweening`/
  `isStageLocked`, don't introduce parallel flags.
- **`handleForcedScroll` no longer exists** - if you had anything depending
  on that function name or its top-level `wheel`/`touchmove`/`keydown`
  listeners, it's gone; the equivalent guard logic now lives inside
  `runForcedScrollTween`'s own one-shot check plus the new `onEnter`
  callback.
- **`.hero-proof-block` and its 6 CSS classes no longer exist** - if your
  branch touches the hero's proof-numbers content, that whole block (markup
  + CSS) was deleted here, replaced by `.gc-marquee`. Check for conflicts if
  you also edited that area.
- **New root CSS var `--gc-marquee-h`** - drives both `.gc-marquee`'s height
  and `.hero-section`'s `calc(100vh - var(--gc-marquee-h))` height. If your
  work touches `.hero-section`'s height/sizing, note it's no longer a flat
  `100vh`.
- **Shared Lenis/GSAP wiring, `--z-*` scale, `isMobileQuery`**: unchanged,
  same as the 2026-07-21 log already described.

---

# FUNNEL RESTRUCTURE — 2026-07-22

Branch: `main` (local only, zero pushes). `redesign-funnel-v2` not checked out, not modified.

## Target Page Architecture (S0–S8) & Psychological Rationale

1. **S0. Preloader + Navbar** [Untouched] — Preserved logo entrance animation & global nav.
2. **S1. Hero (+ micro-CTA)** [Where am I / Is this for me] — Hero photo, headline, subline verbatim + new `SCOPRI COME LAVORIAMO` micro-CTA smooth scrolling to S4 Method.
3. **S2. Trust Block (NEW)** [Can I trust them — one answer, once] — Compact dark plaque (`#0D0D0D`) combining 3 serif stats (`30`, `850+`, `Sicilia`), thin seamless client marquee loop (10 deduplicated reference names), and centered caption.
4. **S3. Sector Cards [MOVE-ONLY]** [Do they build MY kind of venue] — Relocated directly after Trust Block. Intro copy updated (`I NOSTRI SETTORI` / `Qualunque sia il tuo locale, lo abbiamo già costruito.`).
5. **S4. Method Animation (De-hijacked)** [How do they work] — `#build-stage` section de-hijacked. Forced-scroll input locks deleted; transformed into standard scroll-driven pinned section (`pin: true`, `scrub: true`). Intro copy updated.
6. **S5. Projects (Restored)** [Proof it's real] — `projects.html` navbar link restored; homepage projects section intro copy updated + HTML comment warning for placeholder names.
7. **S6. Vincenzo (NEW)** [Who am I dealing with] — Dark editorial founder section featuring Vincenzo Pietradura's portrait moment with 4:5 monogram placeholder box and verbatim copy.
8. **S7. Final CTA (Upgraded)** [What do I do now] — Upgraded copy, dark HoReCa sector selector, and discreet mobile sticky bottom CTA.
9. **S8. Footer** [Untouched] — Copyright & policy links intact.

## File-by-File Summary

- `index.html`: Restructured sections S0–S8 in exact sequence. Added hero micro-CTA link; introduced `.gc-trust-block` replacing standalone marquee and white stats section; relocated `.sectors-section#settori` before `#build-stage`; updated `#build-stage` intro copy; updated `#dettagli` intro copy and added placeholder warning HTML comment; inserted `.gc-founder-section#vincenzo`; upgraded `#contatti` copy, sector dropdown, and `.gc-sticky-cta`. Removed obsolete `scroll-stats.css` and `scroll-stats.js` references.
- `css/style.css`: Added styles for `.hero-micro-cta`, `.gc-trust-*` plaque layout, `.sectors-subline`, `.gc-founder-*` 4:5 portrait grid, `.gc-cta-select`, and `.gc-sticky-cta-*` mobile bottom bar. Removed obsolete `.stats-section` styles.
- `js/main.js`: Added click handlers for hero micro-CTA and sticky mobile CTA. Removed `runForcedScrollTween()`, `forcedDescentTrigger`, `unlockStage()`, `blockInput()`, input locking listeners, and `transitionDone`/`isStageLocked`/`isTweening` flags.
- `js/scroll-1.js`, `js/scroll-2.js`, `js/scroll-3.js`: Removed `runForcedScroll()`, `handleForcedScroll()`, `blockDuringTween()`, `atHandoff()`, and all input locking event listeners (`wheel`, `touchmove`, `keydown`, `touchstart`). Scrubbed render callbacks (`__scroll1Render`, `__scroll2Render`, `__scroll3Render`) preserved intact.
- `css/scroll-stats.css` & `js/scroll-stats.js`: **DELETED** completely.
- `projects.html`: Restored / verified from commit `2d66066`.

## What MOVED (from -> to)

- **`section.sectors-section#settori`**: Moved from after `#build-stage` to directly after S2 Trust Block (`#trust-block`). Internal card gallery, 3D slab thickness, floor reflections, hover hit-zones, and mobile card layout kept 100% intact.

## What was DELETED

- **White stats section** (`.stats-section#numeri` and `.stats-bg`): Deleted completely. Typo `parlanodi`/`esperienzanel` eradicated from codebase (0 hits).
- **Forced-scroll takeover machinery**: `runForcedScrollTween`, `forcedDescentTrigger`, `unlockStage`, `blockInput`, `isStageLocked`, `isTweening`, `unlockTimeout`, `transitionDone`, `window.__scroll0Done`, `window.__scroll1Done`, `window.__scroll2Done`, `window.__scroll3Done`, `runForcedScroll`, `handleForcedScroll`, `blockDuringTween`, `atHandoff`, and all input locking event listeners across `main.js`, `scroll-1.js`, `scroll-2.js`, and `scroll-3.js`.

## What was CREATED

- `.hero-micro-cta`: Hero text link action (`SCOPRI COME LAVORIAMO`, 44px min hit target).
- `.gc-trust-`: S2 hybrid dark plaque section, 3 serif stats, thin client marquee loop, caption.
- `.sectors-subline`: S3 sector intro subline.
- `.gc-founder-`: S6 Vincenzo dark editorial section, 4:5 monogram placeholder slot, verbatim copy.
- `.gc-cta-select`: S7 upgraded final CTA sector selector.
- `.gc-sticky-cta-`: Mobile sticky bottom bar linking to S7 `#contatti`.

## RESTORED from Git History

- `projects.html`: Dedicated projects page linked from navbar "Progetti", restored from commit `2d66066`.

## LAUNCH BLOCKERS

1. **[LAUNCH BLOCKER 1] Placeholder Project Names**: Current project names ("Caffè del Duomo", "Ristorante Mare Blu", "Hotel Artemisia", etc.) are invented placeholders. MUST be replaced with real delivered projects before launch. HTML comment warning inserted above `#dettagli`.
2. **[LAUNCH BLOCKER 2] Vincenzo Real Photograph**: Vincenzo Pietradura's portrait photo slot currently contains a neutral dark placeholder (`#1A1A1A` with "GC" monogram watermark). Real photograph must be dropped in before launch.
3. **[LAUNCH BLOCKER 3] Client Reference Names Sign-Off**: Client reference names listed in Trust Block marquee (Hard Rock Café, Grand Hotel Villa Igea, etc.) require final sign-off from Vincenzo.
4. **[LAUNCH BLOCKER 4] CTA Backend Wiring**: CTA form & sector selector backend integration (Supabase / Resend endpoint) pending implementation.

## MERGE NOTES FOR LUIS

- **Section Order Shift**: `index.html` section order is now S0 Navbar -> S1 Hero -> S2 Trust Block -> S3 Sectors -> S4 Method -> S5 Projects -> S6 Vincenzo -> S7 Final CTA -> S8 Footer. Any section anchors/IDs added by Luis must account for this shift.
- **Forced Scroll Removal**: Forced scroll takeover code and input locks (`isStageLocked`, `isTweening`, `runForcedScroll`, etc.) have been **permanently deleted**. Luis must NOT attempt to rebind or recreate forced scroll hijack listeners.
- **ScrollTrigger Pinning**: `#build-stage` is now a standard scroll-driven pinned section (`pin: true`, `scrub: true`). Any new ScrollTrigger animations or pins created by Luis must call `ScrollTrigger.refresh()` after page load or dynamic updates.
- **Shared CSS Tokens**: Design system CSS variables in `:root` (`--color-magenta-deep`, `--font-serif-cards`, `--font-sans`) are shared. New CSS classes use prefixes `.gc-trust-`, `.gc-founder-`, `.gc-sticky-cta-`, `.gc-cta-select` to avoid collisions.

