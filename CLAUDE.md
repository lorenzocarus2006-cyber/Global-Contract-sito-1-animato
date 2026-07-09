# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Global Contract (Krea S.r.l.) — Italian marketing site for a HoReCa/contract fit-out company. Static site: plain HTML/CSS/JS, no framework, no bundler, no build step. `package.json` only declares one dependency (`motion`, unused — GSAP and Lenis are loaded via CDN `<script>` tags in `index.html`, not npm).

## Running locally

No build/lint/test commands exist. Serve the directory with any static file server and open in a browser, e.g.:

```
npx serve .
# or
python3 -m http.server 8000
```

Open `index.html` directly via `file://` will break Lenis/GSAP smooth-scroll behavior in some cases — prefer a local server.

## Architecture

Multi-page site:
1. **Homepage** (`index.html` + `css/style.css` + `js/main.js`): Interactive showroom experience, preloader, forced scrolling canvas animation, and accordion gallery.
2. **Projects page** (`projects.html` + `css/projects.css` + `js/projects.js`): Premium showroom gallery with an editorial masonry layout and immediate/dynamic category filtration.

Navigation deep-links between pages: Clicking an active category panel on the homepage redirects to `./projects.html?category=<slug>`, which triggers immediate filter selection on load. Clicking selector tabs updates URL search parameters seamlessly without page reload via history state updates.

Everything is desktop/mobile dual-path: most interactive behaviors branch on `window.matchMedia('(max-width: 768px)')` or GSAP's `gsap.matchMedia()`, with separate code paths for mobile vs desktop rather than one shared implementation. When editing scroll/gallery logic, check both branches.

### Key mechanisms in `js/main.js`

1. **Lenis smooth scroll** drives all page scrolling instead of native scroll; it's wired into GSAP's ticker (`gsap.ticker.add`) and `ScrollTrigger.update`. Native `window.scrollTo` calls must be paired with `lenis.scrollTo(..., { immediate: true })` or GSAP's ScrollTrigger will desync from actual scroll position.

2. **Loader/curtain intro**: preloads hero images, animates a progress bar, then plays a curtain-split GSAP timeline (`runEntranceAnimations`) before calling `lenis.start()` — scrolling is deliberately blocked (`lenis.stop()`) until this completes.

3. **7-panel accordion gallery** (`#gallery-container` / `.sector-panel`): desktop uses hover-intent (100ms debounce) to grow the hovered panel via `flexGrow` tweens; touch/tablet uses tap-to-expand; phone-width uses scroll-position-driven "closest panel to viewport center" logic (`updateMobileActivePanel`). All three paths are torn down and rebuilt (`initGallery`) on `matchMedia` breakpoint changes — event listeners are tracked on the DOM nodes themselves (e.g. `panel._enterHandler`) so they can be removed.

4. **Forced-descent hero-to-build-stage transition** (desktop only, `min-width: 769px`): the first downward scroll/wheel/touch/keydown gesture at the top of the page is intercepted (`handleForcedScroll`) and replaced with a scripted ~4.5s GSAP tween (`runForcedScrollTween`) that scrolls the page programmatically to the `#build-stage` section while a canvas-based frame sequence plays (`seqTick`, `drawSeqFrame` — 121 WebP frames in `assets/hero/build_seq/`, ~5s at native timing, with `assets/hero/build_final_poster.jpg` as a loading failsafe). Input is hard-blocked (`blockInput`) during the tween via `preventDefault` on wheel/touchmove/keydown. Once complete, `transitionDone` is persisted to `sessionStorage` (`gc_hero_transition_done`) so revisits within the session skip straight to the final frame with no lock/replay. A hard 6s safety timeout (`unlockTimeout`) guarantees the page never gets stuck locked if frames fail to decode in time.

5. Hero panels also have a separate GSAP `ScrollTrigger`-pinned exit animation (`heroExitTL`, desktop only) that staggers panels upward as the hero section is pinned for one viewport height before the forced-descent tween takes over — the pin's scroll distance (`PIN_VH_FRACTION`) and the forced-scroll tween's duration are tuned together so the ascent animation doesn't finish early and leave a dead gap.

### CSS structure (`css/style.css`)

- Section 1 defines all design tokens as CSS custom properties on `:root` (colors, fonts, transition easings, z-index scale) — reuse these rather than hardcoding values.
- Mobile overrides live in a media-query block near the end of the file (search `max-width: 768px`), not interleaved with desktop rules.
- Fonts are Google Fonts (`Cormorant Garamond` serif for display type, `Inter` for body/UI), loaded via `<link>` in `index.html`'s `<head>`.

### Assets

- `assets/hero/build_seq/` — numbered WebP frame sequence (`frame_0001.webp` … ) driving the canvas "build" animation; frame count is hardcoded in `main.js` as `SEQ_FRAME_COUNT`. If frames are added/removed/re-encoded, update that constant and `SEQ_DURATION` together.
- Sector images (`assets/*.png`, `assets/bar_parisi.jpg`) are preloaded both via `<link rel="preload">` in `index.html` and via the JS loader's `images` array — keep both lists in sync when adding/removing sector panels.
