(() => {
  'use strict';

  gsap.registerPlugin(ScrollTrigger);

  const body = document.body;
  body.classList.add('is-loading');

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = window.matchMedia('(max-width: 760px)').matches;

  /* =========================================================
     0. LENIS  <->  GSAP / ScrollTrigger WIRING
  ========================================================= */
  let lenis = null;
  if (!isMobile && !reduceMotion) {
    lenis = new Lenis({
      duration: 1.1,
      smoothWheel: true,
      wheelMultiplier: 1,
    });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  /* =========================================================
     1. PRELOADER — real asset progress -> 0..100 counter
     Gated on every .hero-depth-layer image (base + every real cutout,
     so none can pop in late/raw after the entrance already ran past
     it) PLUS the ambient loop video, the living resting state.
  ========================================================= */
  const preloader = document.getElementById('preloader');
  const counterEl = document.getElementById('preloaderCount');
  const barEl = document.getElementById('preloaderBar');
  const depthLayerImgs = gsap.utils.toArray('.hero-depth-layer');
  const heroSteam = document.getElementById('heroSteam');

  const assetsToLoad = [
    ...depthLayerImgs.map((el) => ({ type: 'image', el })),
    { type: 'video', el: heroSteam },
  ];

  let displayed = 0;
  let target = 0;

  function setTarget(pct) {
    target = Math.max(target, Math.min(100, pct));
  }

  function tickCounter() {
    displayed += (target - displayed) * 0.18;
    if (target - displayed < 0.15) displayed = target;
    const shown = Math.round(displayed);
    counterEl.textContent = shown;
    barEl.style.width = shown + '%';
    if (displayed < target || target < 100) {
      requestAnimationFrame(tickCounter);
    } else {
      finishPreload();
    }
  }
  requestAnimationFrame(tickCounter);

  function loadAsset(asset) {
    return new Promise((resolve) => {
      if (asset.type === 'image') {
        if (asset.el.complete && asset.el.naturalWidth) return resolve();
        asset.el.addEventListener('load', resolve, { once: true });
        asset.el.addEventListener('error', resolve, { once: true });
      } else if (asset.type === 'video') {
        if (asset.el.readyState >= 2) return resolve();
        asset.el.addEventListener('loadeddata', resolve, { once: true });
        asset.el.addEventListener('error', resolve, { once: true });
      } else {
        resolve();
      }
    });
  }

  let loadedCount = 0;
  const total = assetsToLoad.length;
  let assetsReady = false;
  let minTimeElapsed = false;
  setTarget(8);

  function maybeComplete() {
    if (assetsReady && minTimeElapsed) setTarget(100);
  }

  Promise.all(
    assetsToLoad.map((asset) =>
      loadAsset(asset).then(() => {
        loadedCount += 1;
        setTarget(8 + (loadedCount / total) * 82);
      })
    )
  ).then(() => {
    assetsReady = true;
    maybeComplete();
  });

  // local/cached assets resolve near-instantly; floor the count over a
  // believable minimum so it never feels like a fake instant 100%.
  const minDurationStart = performance.now();
  const MIN_MS = 1500;
  (function floorProgress() {
    const elapsed = performance.now() - minDurationStart;
    const floor = Math.min(96, (elapsed / MIN_MS) * 96);
    setTarget(floor);
    if (elapsed < MIN_MS) {
      requestAnimationFrame(floorProgress);
    } else {
      minTimeElapsed = true;
      maybeComplete();
    }
  })();

  let preloadFinished = false;
  function finishPreload() {
    if (preloadFinished) return;
    preloadFinished = true;

    gsap.timeline({
      defaults: { ease: 'power3.inOut' },
      onComplete: () => {
        preloader.style.display = 'none';
        // body stays scroll-locked (is-loading) through the entrance too —
        // released only once the forced-descent listeners are attached and
        // #heroPin is correctly sized, so no wheel/touch input can ever
        // sneak through before the system is ready to catch it (see FIX in
        // initForcedDescentTrigger).
        runDepthEntrance();
      },
    })
      .to(preloader, { delay: 0.15, duration: 0.7, yPercent: -100 })
      .set(preloader, { display: 'none' });
  }

  /* =========================================================
     2. DEPTH ENTRANCE — layered 3D settle
     .hero-depth-layer images are real alpha cutouts of the SAME
     source photo, so once every offset returns to identity they
     reassemble into the original frame with zero seams. Four real
     elements now pop at distinct depths (counter, table, chair,
     plant) instead of just one.
  ========================================================= */
  const heroDepth = document.getElementById('heroDepth');
  const heroShimmer = document.getElementById('heroShimmer');
  const textLayers = gsap.utils.toArray('.hero-layer');
  const scrollCue = document.getElementById('heroScrollCue');

  gsap.set(textLayers, { transformPerspective: 1400 });

  // Base is ALWAYS fully opaque — never opacity:0, never faded out later
  // either (v8 FIX1: it stays the permanent resting frame, completely
  // locked) — so the whole café scene is present from frame one, just
  // dimmed; it only brightens up. No black void, ever. The real cutouts
  // (counter, table, chair) only carry a SUBTLE depth offset over that
  // already-visible scene, settling to identity quickly — never a
  // fade-in-from-nothing over black.
  gsap.set('.hero-depth-layer--base', { opacity: 1, filter: 'brightness(0.6)' });
  gsap.set('.hero-depth-layer--counter', { z: 50, y: -12, x: 9, scale: 1.035, opacity: 0 });
  gsap.set('.hero-depth-layer--table', { z: 38, y: 14, x: -8, scale: 1.028, opacity: 0 });
  gsap.set('.hero-depth-layer--chair', { z: 34, y: 10, x: -7, scale: 1.024, opacity: 0 });
  gsap.set(heroShimmer, { opacity: 0 });
  gsap.set(heroSteam, { opacity: 0 });

  gsap.set('.hero-layer--logo', { z: 160, y: -28, opacity: 0 });
  gsap.set('.hero-layer--eyebrow', { z: 110, y: -22, opacity: 0 });
  gsap.set('.hero-layer--headline', { z: 200, y: 46, opacity: 0 });
  gsap.set('.hero-layer--cta', { z: 90, y: 28, opacity: 0 });
  gsap.set(scrollCue, { opacity: 0, y: 10 });

  function runDepthEntrance() {
    const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });

    tl.to('.hero-depth-layer--base', { filter: 'brightness(1)', duration: 0.6 }, 0)
      .to(heroShimmer, { opacity: 1, duration: 1.1 }, 0.05)
      .to('.hero-depth-layer--counter', { z: 0, y: 0, x: 0, scale: 1, opacity: 1, duration: 0.55 }, 0.1)
      .to('.hero-depth-layer--chair', { z: 0, y: 0, x: 0, scale: 1, opacity: 1, duration: 0.5 }, 0.16)
      .to('.hero-depth-layer--table', { z: 0, y: 0, x: 0, scale: 1, opacity: 1, duration: 0.55 }, 0.22)
      .to('.hero-layer--logo', { z: 0, y: 0, opacity: 1, duration: 1.0 }, 0.32)
      .to('.hero-layer--eyebrow', { z: 0, y: 0, opacity: 1, duration: 1.0 }, 0.42)
      .to('.hero-layer--headline', { z: 0, y: 0, opacity: 1, duration: 1.1 }, 0.5)
      .to('.hero-layer--cta', { z: 0, y: 0, opacity: 1, duration: 0.9 }, 0.66)
      .to(scrollCue, { opacity: 1, y: 0, duration: 0.8 }, 0.82)
      .add(() => {
        revealSteam();
        initDescentScroll();
      });
  }

  /* =========================================================
     2b. ENTRANCE -> AMBIENT STEAM HANDOFF (v8 FIX1)
     The base photo is NEVER faded out — it stays the permanently locked
     resting frame. heroSteam is a full-frame video that is
     pixel-identical to it everywhere except the small steam patch, so
     simply fading heroSteam in on top (without ever touching the base's
     opacity) introduces only that one small moving element, with zero
     counter-slide / zoom / framing drift and zero loop-reset visible
     (the source clip is a forward+reverse "boomerang" loop).
  ========================================================= */
  function revealSteam() {
    const playPromise = heroSteam.play();
    if (playPromise && playPromise.catch) playPromise.catch(() => {});
    gsap.to(heroSteam, { opacity: 1, duration: 0.7, ease: 'power2.inOut' });
  }

  /* =========================================================
     3. DESCENT SCROLL — flat vertical poster, à la vaulk.com
     #descentStack is one tall block: the café surface, then (in
     normal flow) a flat photo continuation of the SAME shot, cropped
     straight out of the cross-section image so the floor line lines
     up pixel-for-pixel. Scroll POSITION (however it got there — by
     hand, or driven by the forced auto-descent in section 4) only
     ever translates this block upward inside the pinned #heroStage
     "window" — no perspective, no camera, no video-scrub. The three
     real cutouts (counter, table, chair) additionally drift upward
     faster than the rest of the stack and fade out over the first
     ~22% of progress, separating from the floor as a different
     depth/level. The hero text fades out a little earlier (~15%) so
     the landing in white is clean.
  ========================================================= */
  // No cursor/idle parallax: depth separation is visible ONLY at entrance
  // (above) and at exit, here, when the scroll progresses. At rest
  // (progress 0) every term below is exactly 0 — the only motion at rest
  // is the cinemagraph itself.
  const parallaxLayers = [
    { el: document.querySelector('.hero-depth-layer--counter'), factor: 1.8 },
    { el: document.querySelector('.hero-depth-layer--table'), factor: 1.5 },
    { el: document.querySelector('.hero-depth-layer--chair'), factor: 1.65 },
  ];
  const PARALLAX_FADE_DONE_AT = 0.22;
  const TEXT_FADE_DONE_AT = 0.15;
  // v8 FIX2: over the tail of the descent, dissolve a solid var(--gc-white)
  // overlay in (fixed to the viewport, painted above the scrim+pipes) so
  // by the time the pin releases into #landingWhite the screen is already
  // 100% that exact white — no hard line between a grey pipe-fade and the
  // page's true white background.
  const heroDescentWhiteout = document.getElementById('heroDescentWhiteout');
  const WHITEOUT_START_AT = 0.68;
  const WHITEOUT_DONE_AT = 0.94;

  let scrollDistance = 0;
  let scrollProgress = 0;

  function applyLayerTransforms() {
    const p = scrollProgress;
    const fadeP = Math.min(1, p / PARALLAX_FADE_DONE_AT);

    gsap.set(heroShimmer, { opacity: 1 - fadeP });
    parallaxLayers.forEach(({ el, factor }) => {
      gsap.set(el, { y: -p * scrollDistance * (factor - 1), opacity: 1 - fadeP });
    });

    const textFadeP = Math.min(1, p / TEXT_FADE_DONE_AT);
    gsap.set(textLayers, { opacity: 1 - textFadeP });
    gsap.set(scrollCue, { opacity: 1 - textFadeP });

    const whiteoutP = Math.max(0, Math.min(1, (p - WHITEOUT_START_AT) / (WHITEOUT_DONE_AT - WHITEOUT_START_AT)));
    gsap.set(heroDescentWhiteout, { opacity: whiteoutP });
  }

  function initDescentScroll() {
    const heroPin = document.getElementById('heroPin');
    const descentStack = document.getElementById('descentStack');
    const undergroundImg = document.getElementById('descentUnderground');

    function sizeStack() {
      const viewportH = window.innerHeight;
      const naturalRatio = undergroundImg.naturalHeight / undergroundImg.naturalWidth;
      const undergroundH = undergroundImg.clientWidth
        ? undergroundImg.clientWidth * naturalRatio
        : window.innerWidth * naturalRatio;
      scrollDistance = undergroundH;
      heroPin.style.height = (viewportH + undergroundH) + 'px';
      ScrollTrigger.refresh();
    }

    function buildScrollTimeline() {
      sizeStack();
      window.addEventListener('resize', sizeStack);

      ScrollTrigger.create({
        trigger: heroPin,
        start: 'top top',
        end: 'bottom bottom',
        scrub: true,
        pin: '#heroStage',
        anticipatePin: 1,
        onUpdate: (self) => {
          scrollProgress = self.progress;
          gsap.set(descentStack, { y: -scrollProgress * scrollDistance });
          applyLayerTransforms();
        },
      });

      initForcedDescentTrigger(heroPin);

      // Only now is everything correctly sized and the forced-descent
      // listeners fully attached — only now is it safe to let the body
      // scroll at all. This closes the race condition that let a very
      // early flick slip through unintercepted (see FIX in v7).
      body.classList.remove('is-loading');
    }

    if (undergroundImg.complete && undergroundImg.naturalWidth) {
      buildScrollTimeline();
    } else {
      undergroundImg.addEventListener('load', buildScrollTimeline, { once: true });
    }
  }

  /* =========================================================
     4. FORCED DESCENT — one scroll input plays the whole descent
     The first downward scroll/touch/key input at the top is
     intercepted and replaced by a single programmatic, eased scroll
     ALL THE WAY to the fully white landing section (~2.2s) — the
     descent is only the path, white is the destination, so there is
     no stop at its foggy bottom (FIX A). All further input is locked
     out until it lands, so it can never stop halfway. ScrollTrigger
     (section 3) just reads scroll position as it always does, so the
     descent visual advances itself — this is purely a scroll DRIVER,
     the descent's look/choreography above is untouched. Fires once;
     afterwards scrolling is free forever in both directions (manual
     scroll back up still works normally, the descent stays a real,
     unremoved scrollable section).

     These listeners are attached with ZERO delta/distance threshold —
     ANY downward wheel/touch/key, however small, fires it — and they
     are only ever attached once body's scroll-lock has just been
     lifted (see buildScrollTimeline), so there's no earlier window
     where an impatient flick could slip through un-intercepted and
     leave scrollY stuck at a small non-zero value forever blocking
     the trigger. {capture:true} also makes sure this runs before
     Lenis's own (bubble-phase) listener gets to consume the event.
  ========================================================= */
  let transitionDone = false;
  let forcing = false;

  function forcedScrollTo(targetY, duration, onComplete) {
    if (lenis) lenis.stop();
    const proxy = { y: window.scrollY };
    gsap.to(proxy, {
      y: targetY,
      duration,
      ease: 'power2.inOut',
      onUpdate: () => window.scrollTo(0, proxy.y),
      onComplete: () => {
        if (lenis) lenis.start();
        onComplete && onComplete();
      },
    });
  }

  function initForcedDescentTrigger(heroPin) {
    function triggerForcedDescent() {
      if (transitionDone || forcing) return;
      forcing = true;
      // Target the FULL white landing section, not the pin's release
      // point: scrolling to heroPin's bottom edge (no viewport-height
      // subtraction) leaves #landingWhite filling the entire viewport,
      // a clean page change rather than a stop at the descent's tail.
      const rect = heroPin.getBoundingClientRect();
      const targetY = window.scrollY + rect.bottom;
      forcedScrollTo(targetY, 2.2, () => {
        forcing = false;
        transitionDone = true;
      });
    }

    window.addEventListener('wheel', (e) => {
      if (forcing) { e.preventDefault(); return; }
      if (transitionDone || window.scrollY > 2) return;
      if (e.deltaY > 0) { e.preventDefault(); e.stopImmediatePropagation(); triggerForcedDescent(); }
    }, { passive: false, capture: true });

    let touchStartY = null;
    window.addEventListener('touchstart', (e) => { touchStartY = e.touches[0].clientY; }, { passive: true, capture: true });
    window.addEventListener('touchmove', (e) => {
      if (forcing) { e.preventDefault(); return; }
      if (transitionDone || window.scrollY > 2 || touchStartY == null) return;
      if (touchStartY - e.touches[0].clientY > 0) { e.preventDefault(); e.stopImmediatePropagation(); triggerForcedDescent(); }
    }, { passive: false, capture: true });

    window.addEventListener('keydown', (e) => {
      if (forcing) {
        if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(e.key)) e.preventDefault();
        return;
      }
      if (transitionDone || window.scrollY > 2) return;
      if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        e.stopImmediatePropagation();
        triggerForcedDescent();
      }
    }, { capture: true });
  }

  /* =========================================================
     5. LANDING — minimal reveal as the white section arrives
  ========================================================= */
  const landingMark = document.querySelector('.landing-white__mark');
  if (landingMark) {
    ScrollTrigger.create({
      trigger: '#landingWhite',
      start: 'top 85%',
      onEnter: () => gsap.to(landingMark, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' }),
    });
  }
})();
