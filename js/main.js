/* 
  Global Contract (Krea S.r.l.) - Premium Hero Animations & Controls
  GSAP + Lenis integration with smooth vertical accordion logic
*/

document.addEventListener("DOMContentLoaded", () => {

  // Register GSAP ScrollTrigger
  gsap.registerPlugin(ScrollTrigger);

  // Always start from the very top. Browsers restore the previous scroll
  // position on reload, which would drop the user mid-pin: the hero
  // forced-scroll hijack requires scrollY<=5, so a restored mid-page
  // position silently kills the whole scroll-0 -> scroll-1 choreography
  // (it just free-scrolls into the sections below). Force manual control
  // and reset to top before anything measures scroll.
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  window.scrollTo(0, 0);

  /* -----------------------------------------
     1. INITIALIZE LENIS SMOOTH SCROLL
     ----------------------------------------- */
  const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Custom premium deceleration curve
    smoothWheel: true,
    smoothTouch: false, // Maintain native touch behavior on mobile
    infinite: false,
  });

  // Stop scroll while loading
  lenis.stop();

  // Exposed so scroll-1.js can drive the same smooth-scroll instance for
  // its own forced-scroll hijack (mirrors the Scroll 0 forced tween below).
  window.__lenis = lenis;

  // Connect Lenis to GSAP ticker
  lenis.on('scroll', ScrollTrigger.update);
  
  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });
  
  gsap.ticker.lagSmoothing(0);

  // Hero micro-CTA smooth scroll to Method section (#build-stage)
  const heroMicroCta = document.getElementById('heroMicroCta');
  if (heroMicroCta) {
    heroMicroCta.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.getElementById('build-stage');
      if (target && window.__lenis) {
        window.__lenis.scrollTo(target, { duration: 1.2 });
      }
    });
  }


  const buildStage = document.getElementById("build-stage");
  const buildCanvas = document.getElementById("build-canvas");
  const buildCtx = buildCanvas ? buildCanvas.getContext("2d") : null;

  /* -----------------------------------------
     SCROLL 0 - FRAME SEQUENCE PRELOAD
     Pre-keyed transparent webp frames (background removed offline), so the
     render floats directly on the site's black background: no rectangles,
     no borders, no halos. All frames are preloaded up front; nothing is
     fetched during the scroll itself.
     ----------------------------------------- */
  const SEQ_FRAME_COUNT = 44;
  const seqFrames = [];
  let seqLoadedCount = 0;
  let seqReady = false;
  let lastDrawnFrame = -1;
  let pendingFrame = null;

  function seqFramePath(i) {
    const n = String(i).padStart(3, "0");
    return `./assets/animations/scroll-0/webp/frame_${n}.webp?v=black-1`;
  }

  if (buildCtx) {
    for (let i = 0; i < SEQ_FRAME_COUNT; i++) {
      const img = new Image();
      const onSettled = () => {
        seqLoadedCount++;
        if (seqLoadedCount >= SEQ_FRAME_COUNT) {
          seqReady = true;
        }
        // If this frame was requested by the scrubber before it finished
        // loading, draw it now so the canvas is never left stale/blank.
        if (pendingFrame === i) {
          drawSeqFrame(i);
        }
      };
      img.onload = onSettled;
      img.onerror = onSettled;
      img.src = seqFramePath(i);
      seqFrames.push(img);
    }
  }

  function drawSeqFrame(index) {
    if (!buildCtx) return;
    const clamped = Math.max(0, Math.min(SEQ_FRAME_COUNT - 1, index));
    const img = seqFrames[clamped];
    if (img && img.complete && img.naturalWidth > 0) {
      // Only repaint when the frame actually changes - avoids useless
      // clear/draw work (and flicker) on sub-frame scroll deltas.
      if (clamped === lastDrawnFrame) return;
      buildCtx.clearRect(0, 0, buildCanvas.width, buildCanvas.height);
      buildCtx.drawImage(img, 0, 0, buildCanvas.width, buildCanvas.height);
      lastDrawnFrame = clamped;
      pendingFrame = null;
    } else {
      // Keep showing the last painted frame; repaint as soon as it loads.
      pendingFrame = clamped;
    }
  }



  // Header & Mobile Sticky CTA state on scroll
  lenis.on('scroll', (e) => {
    const header = document.querySelector('.main-header');
    if (header) {
      if (e.scroll > 80) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }

    const stickyCta = document.getElementById('gcStickyCta');
    const consultSection = document.getElementById('contatti');
    if (stickyCta) {
      const heroHeight = window.innerHeight * 0.8;
      const consultRect = consultSection ? consultSection.getBoundingClientRect() : null;
      const isPastHero = e.scroll > heroHeight;
      const isBeforeConsult = consultRect ? consultRect.top > window.innerHeight * 0.5 : true;

      if (isPastHero && isBeforeConsult) {
        stickyCta.classList.add('is-visible');
        stickyCta.setAttribute('aria-hidden', 'false');
      } else {
        stickyCta.classList.remove('is-visible');
        stickyCta.setAttribute('aria-hidden', 'true');
      }
    }
  });

  // Mobile Sticky CTA click smooth scroll
  const gcStickyCtaBtn = document.getElementById('gcStickyCtaBtn');
  if (gcStickyCtaBtn) {
    gcStickyCtaBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.getElementById('contatti');
      if (target && window.__lenis) {
        window.__lenis.scrollTo(target, { duration: 1.2 });
      }
    });
  }  // Initial state setup for loader and nav header
  gsap.set(".loader-logo-container", {
    xPercent: -50,
    yPercent: -50,
    y: -45
  });
  gsap.set(".main-header", { opacity: 0 });

  /* -----------------------------------------
     2. PRELOAD IMAGES & LOADER SYSTEM
     ----------------------------------------- */
  const images = [
    './logo.png',
    './assets/bar_parisi.jpg',
    './assets/hotel.png',
    './assets/gelato.png',
    './assets/bakery.png',
    './assets/pharmacy.png',
    './assets/tobacco.png',
    './assets/retail.png'
  ];

  let loadedCount = 0;
  const totalImages = images.length;
  const progressBar = document.querySelector('.loader-progress-bar-large');

  function updateProgress() {
    loadedCount++;
    const progress = Math.round((loadedCount / totalImages) * 100);
    
    // Animate progress bar smoothly
    if (progressBar) {
      gsap.to(progressBar, {
        width: `${progress}%`,
        duration: 0.4,
        ease: "power2.out"
      });
    }

    if (loadedCount >= totalImages) {
      // Small buffer delay for visual polish
      setTimeout(runEntranceAnimations, 300);
    }
  }

  // Fallback: if images load too slowly, clear loader after 6 seconds max
  const fallbackTimeout = setTimeout(() => {
    if (loadedCount < totalImages) {
      loadedCount = totalImages - 1;
      updateProgress();
    }
  }, 6000);

  // Trigger loading
  images.forEach((src) => {
    const img = new Image();
    img.onload = () => {
      updateProgress();
    };
    img.onerror = () => {
      console.warn(`Error loading image: ${src}`);
      updateProgress(); // Continue progress even on error
    };
    img.src = src;
  });


  /* -----------------------------------------
     3. HERO ENTRANCE COREOGRAPHY (MOTION)
     ----------------------------------------- */
  function runEntranceAnimations() {
    clearTimeout(fallbackTimeout);

    const tl = gsap.timeline({
      onComplete: () => {
        // Start smooth scroll once intro is fully loaded
        lenis.start();
        // Remove loader from DOM to ensure absolute cleanliness
        const loader = document.getElementById("loader");
        if (loader) {
          loader.remove();
        }
        // Re-measure now that the hero is actually on screen at its real size
        if (typeof syncReflectionHeights === 'function') syncReflectionHeights();
      }
    });

    // 1. Fade out the progress container completely before transition starts
    tl.to(".loader-progress-wrapper-large", {
      opacity: 0,
      duration: 0.3,
      ease: "power2.out"
    });

    // 2. Stop the pulsing animation of the logo and smoothly center it
    tl.set(".loader-logo-large", { animation: "none" });
    tl.to(".loader-logo-container", {
      y: 0,
      duration: 0.6,
      ease: "power3.inOut"
    }, "-=0.15");

    // 3. Dissolve the black background, revealing the hero beneath
    tl.to(".loader-bg", {
      opacity: 0,
      duration: 0.9,
      ease: "power2.inOut"
    });

    // Fade in the navbar at the same time
    tl.to(".main-header", {
      opacity: 1,
      duration: 0.6,
      ease: "power2.out"
    }, "<");

    // 4. Move logo from screen center to the navbar left slot
    // Starts 0.15s after centering, during the background dissolve for fluid continuity
    tl.to(".loader-logo-container", {
      x: () => {
        const targetRect = document.querySelector('.nav-logo-img').getBoundingClientRect();
        return targetRect.left + targetRect.width / 2 - window.innerWidth / 2;
      },
      y: () => {
        const targetRect = document.querySelector('.nav-logo-img').getBoundingClientRect();
        return targetRect.top + targetRect.height / 2 - window.innerHeight / 2;
      },
      scale: () => {
        const targetRect = document.querySelector('.nav-logo-img').getBoundingClientRect();
        return targetRect.width / 150; // container base size is 150px
      },
      duration: 1.15, // Confident, refined flight time
      ease: "power3.inOut"
    }, "-=0.75");

    // 5. Land the logo: make the actual navbar logo visible and hide the loader logo
    tl.set([".nav-logo-img", ".logo-text"], { opacity: 1 });
    tl.set(".loader-logo-container", { display: "none" });
  }



  /* -----------------------------------------
     4. HERO CARD GALLERY INTERACTION LOGIC
     ----------------------------------------- */
  const panels = gsap.utils.toArray('.hero-stage .hero-panel');
  const isMobileQuery = window.matchMedia('(max-width: 768px)');
  let activeIndex = null;

  // Resting 3D geometry - a folding-screen / paravent chain where rotation
  // direction ALTERNATES card to card (-,+,-,+,-,+,-), not a fan or a
  // pyramid converging on one frontal centerpiece. Mandatory table. Hover/
  // click tweens away from these values and back to them exactly, so this
  // table is also the single source of truth the state machine resets to
  // (see deactivateAll below) - no separate CSS transform to fall out of
  // sync with.
  const REST = {
    '0': { rotationY: -32, z: -40 },
    '1': { rotationY: 22, z: 0 },
    '3': { rotationY: -25, z: -30 },
    '2': { rotationY: 15, z: 20 },
    '4': { rotationY: -18, z: 0 },
    '5': { rotationY: 24, z: -30 },
    '6': { rotationY: -30, z: -40 },
  };
  // Mirrors the z-index values authored in css/style.css for these same
  // selectors - nearest-to-viewer (highest z) card stacks on top at rest.
  const Z_INDEX_BASE = { '0': 8, '1': 16, '3': 12, '2': 20, '4': 16, '5': 12, '6': 8 };
  const REST_FILTER = 'brightness(0.82)';

  panels.forEach((panel) => {
    const rest = REST[panel.dataset.index];
    gsap.set(panel, { rotationY: rest.rotationY, z: rest.z, transformOrigin: '50% 100%' });
    const face = panel.querySelector('.hero-panel__face');
    if (face) gsap.set(face, { filter: REST_FILTER });
  });

  function initGallery() {
    // Desktop click navigation lives on the hover zones (see initHoverZones
    // below), not on the panels themselves - the zones sit on top and are
    // what actually receives pointer input for a rotated card.

    // Click handlers for mobile gallery
    const mobileCards = document.querySelectorAll('.mobile-gallery .mobile-card');
    mobileCards.forEach((card) => {
      card.addEventListener('click', () => {
        const category = card.getAttribute('data-category');
        if (category) {
          window.location.href = `./projects.html?category=${category}`;
        }
      });
    });
  }

  // Initial initialization
  initGallery();

  // Floor reflections: a flipped clone of each card's image, appended as a
  // sibling inside .desktop-gallery. Built with plain DOM cloning rather
  // than -webkit-box-reflect because that property silently fails to paint
  // on elements living inside ScrollTrigger's pinned/GPU-composited hero.
  function initReflections() {
    const desktopGallery = document.querySelector('.desktop-gallery');
    if (!desktopGallery) return;
    const sourcePanels = desktopGallery.querySelectorAll('.hero-panel');
    const reflections = [];
    sourcePanels.forEach((panel) => {
      const img = panel.querySelector('.hero-panel__img');
      if (!img) return;
      const reflection = document.createElement('div');
      reflection.className = 'card-reflection';
      reflection.dataset.index = panel.dataset.index;
      // Match the source panel's resting angle/depth so the floor plane
      // reads as a continuation of the card standing on it.
      const rest = REST[panel.dataset.index];
      gsap.set(reflection, { rotationY: rest.rotationY, z: rest.z, transformOrigin: '50% 0%' });
      const imgClone = document.createElement('img');
      imgClone.src = img.currentSrc || img.src;
      imgClone.alt = '';
      // transform-origin is intentionally left at its default (center): the
      // element's own box already sits flush at the seam (top:0 inside a
      // container positioned at the panel's bottom edge), and a center-origin
      // flip keeps that box in place while mirroring its content - a
      // top-origin flip looks equivalent on paper but Chrome fails to paint
      // an absolutely positioned <img> at all when scaleY(-1) is combined
      // with a non-center transform-origin.
      imgClone.style.cssText = 'position:absolute; top:0; left:0; width:100%; object-fit:cover; transform:scaleY(-1); filter:brightness(0.65) contrast(1.02);';
      reflection.appendChild(imgClone);
      desktopGallery.appendChild(reflection);
      reflections.push({ panel, imgClone });
    });

    function syncHeights() {
      reflections.forEach(({ panel, imgClone }) => {
        imgClone.style.height = panel.offsetHeight + 'px';
      });
    }
    // A synchronous measurement here can race the layout that resolves the
    // desktop/mobile matchMedia CSS (offsetHeight reads back 0 if it lands
    // before the browser has settled on the real viewport width), so defer
    // the first read a frame and re-sync once the entrance animation - which
    // is when the hero is actually first shown - has finished.
    requestAnimationFrame(syncHeights);
    window.addEventListener('resize', syncHeights);
    return syncHeights;
  }
  const syncReflectionHeights = initReflections();

  // Panel thickness (glass slab pass): real back/side faces, not a
  // stacked-layer illusion. Static geometry only, set once on init - no
  // interaction with hover/click state, and no future motion should ever
  // target the slab or its faces individually (only the .hero-panel wrapper
  // itself).
  function initPanelFaces() {
    document.querySelectorAll('.hero-panel__slab').forEach((slab) => {
      const face = slab.querySelector('.hero-panel__face');
      const back = document.createElement('div');
      back.className = 'hero-panel__back';
      const sideLeft = document.createElement('div');
      sideLeft.className = 'hero-panel__side hero-panel__side--left';
      const sideRight = document.createElement('div');
      sideRight.className = 'hero-panel__side hero-panel__side--right';
      [back, sideLeft, sideRight].forEach((el) => slab.insertBefore(el, face));
    });
  }
  initPanelFaces();

  document.querySelectorAll('.hero-panel').forEach((p) => {
    // .src (not getAttribute) resolves the relative path to an absolute URL -
    // this value lands in a CSS custom property consumed by an external
    // stylesheet, and browsers resolve url() inside custom properties
    // relative to the stylesheet using them, not the document, so a raw
    // relative path here would 404 under css/.
    const src = p.querySelector('.hero-panel__img').src;
    p.querySelector('.hero-panel__slab').style.setProperty('--panel-img', `url("${src}")`);
  });

  /* -----------------------------------------
     4b. HOVER HIT-ZONES (desktop only)
     ----------------------------------------- */
  // WHY THIS EXISTS: measured with a 5x5 elementFromPoint grid test across
  // each panel's own bounding box, cards #0 and #6 (the most steeply
  // rotated, +-35deg) scored 0/20 hits - their actual painted trapezoid is
  // much narrower than their flat CSS box once foreshortened, so milder
  // neighbors (which keep nearly their full flat width) visually cover and
  // steal 100% of their hit area. This isn't a hit-testing engine bug to
  // work around - it's the real geometry of a rotated card in a shared
  // perspective. Fix: decouple "what looks like it's touching" (the visual,
  // overlapping, rotated .hero-panel elements) from "what receives the
  // hover" (flat, non-rotated, NON-overlapping zones tiling the full 0-100%
  // width by the midpoints between each card's center). Every card gets an
  // uncontested slice regardless of how its rotated neighbor paints over it.
  const ZONES = {
    '0': { left: '0%', width: '12.97%' },
    '1': { left: '12.97%', width: '15.39%' },
    '3': { left: '28.36%', width: '14.42%' },
    '2': { left: '42.78%', width: '14.72%' },
    '4': { left: '57.5%', width: '14.73%' },
    '5': { left: '72.23%', width: '13.94%' },
    '6': { left: '86.17%', width: '13.83%' },
  };
  // Mirrors each panel's own CSS height so a zone never reaches above its
  // card into the headline area.
  const ZONE_HEIGHT = {
    '0': 'clamp(368px, 42vh, 460px)',
    '1': 'clamp(294px, 33.6vh, 368px)',
    '3': 'clamp(375px, 42.84vh, 469px)',
    '2': 'clamp(287px, 32.76vh, 359px)',
    '4': 'clamp(375px, 42.84vh, 469px)',
    '5': 'clamp(294px, 33.6vh, 368px)',
    '6': 'clamp(368px, 42vh, 460px)',
  };

  function initHoverZones() {
    const desktopGallery = document.querySelector('.desktop-gallery');
    const zones = {};
    if (!desktopGallery) return zones;
    panels.forEach((panel) => {
      const idx = panel.dataset.index;
      const cfg = ZONES[idx];
      const zone = document.createElement('div');
      zone.className = 'hover-zone';
      zone.dataset.index = idx;
      // translateZ(200px) matters more than the z-index here: .desktop-gallery
      // shares one preserve-3d scene with every card, and inside that scene
      // hit-testing resolves by actual 3D depth, not just CSS stacking order -
      // a card's own translateZ (max +30 at rest) would otherwise still win
      // against this flat zone's implicit z:0 regardless of z-index.
      zone.style.cssText = `position:absolute; bottom:0; left:${cfg.left}; width:${cfg.width}; height:${ZONE_HEIGHT[idx]}; z-index:60; cursor:pointer; transform:translateZ(200px);`;
      desktopGallery.appendChild(zone);
      zones[idx] = zone;
    });
    return zones;
  }
  const hoverZones = initHoverZones();

  const HOVER_INTENT_DELAY = 80;
  let hoverIntentTimer = null;

  function getReflectionFor(panel) {
    return document.querySelector(`.card-reflection[data-index="${panel.dataset.index}"]`);
  }

  // Brightness targets .hero-panel__face, not the .hero-panel wrapper: CSS
  // `filter` forces the element it's on to be pre-composited as a flat 2D
  // bitmap before the filter applies, which silently flattens any nested
  // preserve-3d content - confirmed directly (toggling filter:none on the
  // wrapper made the panel's 3D side faces render immediately). Rotation/
  // position/scale tweens still target the wrapper only, unchanged.
  function getFaceFor(panel) {
    return panel.querySelector('.hero-panel__face');
  }

  function killPanelTweens() {
    panels.forEach((panel) => {
      gsap.killTweensOf(panel);
      const refl = getReflectionFor(panel);
      if (refl) gsap.killTweensOf(refl);
      const face = getFaceFor(panel);
      if (face) gsap.killTweensOf(face);
    });
  }

  // Single exclusive state machine (BUG A fix): activeIndex is the only
  // source of truth, and every call re-derives ALL 7 panels' classes from
  // it in one pass - so no sequence of clicks/hovers, however fast, can
  // ever leave more than one panel marked active. Both hover and click
  // funnel through activatePanel/deactivateAll so the two input paths can
  // never fight each other or desync.
  function activatePanel(panel) {
    const targetIdx = panel.dataset.index;
    if (activeIndex === targetIdx) return;
    killPanelTweens();
    activeIndex = targetIdx;
    panels.forEach((p) => {
      const pIdx = p.dataset.index;
      const refl = getReflectionFor(p);
      const isActive = pIdx === targetIdx;
      p.classList.toggle('is-active', isActive);
      const face = getFaceFor(p);
      if (isActive) {
        p.style.zIndex = 50;
        const rest = REST[pIdx];
        // Straightens PARTIALLY (half its resting angle), never to 0deg -
        // keeps the chain feeling instead of popping frontal (BUG A/B spec).
        gsap.to(p, { rotationY: rest.rotationY / 2, y: -45, z: 120, scale: 1.05, duration: 0.7, ease: 'back.out(1.2)' });
        if (face) gsap.to(face, { filter: 'brightness(1.08)', duration: 0.7, ease: 'back.out(1.2)' });
        if (refl) gsap.to(refl, { rotationY: rest.rotationY / 2, z: 120, scale: 1.1, opacity: 0.5, duration: 0.7, ease: 'back.out(1.2)' });
      } else {
        const dir = p.offsetLeft < panel.offsetLeft ? -1 : 1;
        gsap.to(p, { x: dir * 20, scale: 0.97, duration: 0.6, ease: 'power2.inOut' });
        if (face) gsap.to(face, { filter: 'brightness(0.6)', duration: 0.6, ease: 'power2.inOut' });
      }
    });
  }

  function deactivateAll() {
    if (activeIndex === null) return;
    killPanelTweens();
    activeIndex = null;
    panels.forEach((panel) => {
      panel.classList.remove('is-active');
      panel.style.zIndex = Z_INDEX_BASE[panel.dataset.index];
      const rest = REST[panel.dataset.index];
      gsap.to(panel, { rotationY: rest.rotationY, z: rest.z, y: 0, x: 0, scale: 1, duration: 0.8, ease: 'power3.inOut' });
      const face = getFaceFor(panel);
      if (face) gsap.to(face, { filter: REST_FILTER, duration: 0.8, ease: 'power3.inOut' });
      const refl = getReflectionFor(panel);
      if (refl) gsap.to(refl, { rotationY: rest.rotationY, z: rest.z, scale: 1, opacity: 0.85, duration: 0.8, ease: 'power3.inOut' });
    });
  }

  panels.forEach((panel) => {
    const idx = panel.dataset.index;
    const zone = hoverZones[idx];
    if (!zone) return;
    // Click: first click on an inactive panel raises it (mirrors hover-intent
    // for touch, where there is no hover); clicking the already-active panel
    // navigates - tap-to-preview, tap-again-to-open.
    zone.addEventListener('click', (e) => {
      e.stopPropagation();
      if (activeIndex === idx) {
        const category = panel.getAttribute('data-category');
        if (category) window.location.href = `./projects.html?category=${category}`;
      } else {
        activatePanel(panel);
      }
    });
    zone.addEventListener('mouseenter', () => {
      if (isMobileQuery.matches) return;
      clearTimeout(hoverIntentTimer);
      hoverIntentTimer = setTimeout(() => activatePanel(panel), HOVER_INTENT_DELAY);
    });
    zone.addEventListener('mouseleave', () => {
      if (isMobileQuery.matches) return;
      clearTimeout(hoverIntentTimer);
      deactivateAll();
    });
  });

  // Click anywhere outside the gallery returns the raised panel to rest.
  document.addEventListener('click', (e) => {
    if (isMobileQuery.matches) return;
    const desktopGallery = document.querySelector('.desktop-gallery');
    if (desktopGallery && !desktopGallery.contains(e.target)) {
      deactivateAll();
    }
  });



  /* -----------------------------------------
     5. DESKTOP-ONLY PINNED SCROLL & FORCED ASCENT
     ----------------------------------------- */
  // isMobileQuery declared above (section 4, now the sectors-section gallery).
  let heroExitTL = null;

  const mm = gsap.matchMedia();

  // Pin range is reduced by approximately 65% for a denser, more immediate transition: the hero is
  // pinned for exactly 0.35 viewport heights of scroll travel.
  const PIN_VH_FRACTION = 0.35;

  mm.add("(min-width: 769px)", () => {
    // 1. Initialize Scrubbed Exit Timeline (no pin). Was pin:true - but a
    // GSAP pin reserves a "runway" in the page's actual layout equal to the
    // pin's scroll distance (PIN_VH_FRACTION * innerHeight, ~300px+), which
    // sits as blank space between the hero and whatever comes right after
    // it in the DOM. That was invisible before (the old #build-stage sat
    // right there and was reached via the forced-descent auto-scroll, never
    // manually scrolled through). Now .gc-marquee sits right after the hero
    // and must be visible in the FIRST viewport with zero scroll (brief
    // requirement) - a pin-runway of any size would push it below the fold.
    // Dropping pin:true (keeping scrub:true) removes the runway entirely:
    // the hero still fades/rises on the first bit of scroll, it just isn't
    // held fixed in place while doing it.
    heroExitTL = gsap.timeline({
      defaults: { duration: 1, ease: "power2.inOut" },
      scrollTrigger: {
        trigger: ".hero-section",
        start: "top top",
        end: () => `+=${window.innerHeight * PIN_VH_FRACTION}`,
        scrub: true,
        invalidateOnRefresh: true,
      }
    });

    // PROOF HERO retarget (was: staggered .hero-panel/.card-reflection exit).
    // .hero-proof-block was removed (replaced by .gc-marquee below the hero) -
    // only the photo/headline block animates on exit now.
    heroExitTL.to(".hero-proof-photo", {
      y: () => -window.innerHeight * 0.9,
      opacity: 0,
      duration: 1,
    }, 0);

    return () => {
      if (heroExitTL) heroExitTL.kill();
      heroExitTL = null;
      gsap.set(".hero-proof-photo", { y: 0, opacity: 1 });
    };
  });

  // Pin lengths as fractions of the viewport height. The build-stage pin
  // now spans BOTH sequences: scroll-0 plays over the first fraction, then
  // hands off in place to scroll-1 for the remaining fraction (no page
  // travel between them). Shared with the forced tweens' targets so the
  // descents always land exactly on the hand-off / unpin points.
  // Scroll 0 pin length is reduced by 65% for a denser, faster canvas frame sequence.
  const SCROLL0_PIN_FRACTION = 0.525;
  const SCROLL1_PIN_FRACTION = 1.8;
  const SCROLL2_PIN_FRACTION = 1.8;
  const SCROLL3_PIN_FRACTION = 1.8;
  const TOTAL_PIN_FRACTION =
    SCROLL0_PIN_FRACTION + SCROLL1_PIN_FRACTION + SCROLL2_PIN_FRACTION + SCROLL3_PIN_FRACTION;
  const HANDOFF = SCROLL0_PIN_FRACTION / TOTAL_PIN_FRACTION;
  const HANDOFF2 = (SCROLL0_PIN_FRACTION + SCROLL1_PIN_FRACTION) / TOTAL_PIN_FRACTION;
  const HANDOFF3 =
    (SCROLL0_PIN_FRACTION + SCROLL1_PIN_FRACTION + SCROLL2_PIN_FRACTION) / TOTAL_PIN_FRACTION;

  /* -----------------------------------------
     SCROLL 0 + SCROLL 1 - ONE PINNED SCROLL-SCRUBBED SEQUENCE
     The section pins for TOTAL_PIN_FRACTION extra viewport heights. The
     first SCROLL0_PIN_FRACTION worth of scroll scrubs the scroll-0 frame
     sequence; past the HANDOFF point the .reveal-layer overlay (scroll-1)
     takes over in the exact same screen position - the page never visibly
     moves between the two, it reads as one continuous animation. Fully
     bidirectional - down plays forward, up plays backward.
     ----------------------------------------- */
  if (buildStage && buildCtx) {
    const scroll0Copy = [".build-eyebrow", ".build-headline", ".build-sub"];
    const revealLayer = document.getElementById("reveal-layer");
    const revealLayer2 = document.getElementById("reveal-layer-2");
    const revealLayer3 = document.getElementById("reveal-layer-3");
    // Tracks which of the 4 sequences is active (0=scroll0, 1=scroll1,
    // 2=scroll2, 3=scroll3) so the canvas swap only fires when a boundary
    // is actually crossed (not on every update).
    let activePhase = null;

    // Neutralize the CSS entrance offsets (they belonged to the old
    // autoplay choreography): the canvas is always visible inside the
    // pinned stage, the copy is driven purely by the scrubbed timeline.
    gsap.set(".build-canvas-container", { opacity: 1, x: 0 });
    gsap.set(scroll0Copy, { opacity: 0, x: 0, y: 36 });

    function setPhase(phase) {
      // Runs on both desktop and mobile now: the layer visibility swap is what
      // makes each sequence appear in turn as the pin scrubs.
      if (activePhase === phase) return;
      activePhase = phase;
      // Instant swap: each sequence's frame 0 sits pixel-aligned over the
      // previous sequence's last frame, so flipping visibility is
      // invisible to the eye.
      gsap.set(".build-canvas-container", { autoAlpha: phase === 0 ? 1 : 0 });
      if (revealLayer) gsap.set(revealLayer, { autoAlpha: phase === 1 ? 1 : 0 });
      if (revealLayer2) gsap.set(revealLayer2, { autoAlpha: phase === 2 ? 1 : 0 });
      if (revealLayer3) gsap.set(revealLayer3, { autoAlpha: phase === 3 ? 1 : 0 });
      // The scroll-0 copy lives in .build-stage-content (not in the canvas
      // layer), so it must be hidden here too: it belongs ONLY to phase 0 and
      // must not linger over scroll-1/2/3. Toggle VISIBILITY only (opacity is
      // owned by the scrubbed scroll0TL fade-in, so touching opacity here would
      // fight it). In phase 0 the timeline drives the fade; outside phase 0 the
      // copy is force-hidden regardless of its leftover opacity value.
      scroll0Copy.forEach((sel) => {
        document.querySelectorAll(sel).forEach((el) => {
          el.style.visibility = phase === 0 ? "" : "hidden";
        });
      });
    }

    // Hysteresis at the phase boundaries: an auto-scroll stops EXACTLY on a
    // boundary (e.g. HANDOFF2). We want the phase that just finished to stay
    // shown there (its copy full, its last frame on screen) until the NEXT
    // auto-scroll actually advances past the boundary. Without this, the
    // ease-out settle can nudge progress a hair past the boundary and flip to
    // the next phase, hiding the just-finished copy. So a phase only ADVANCES
    // once progress is a touch beyond the boundary.
    const PH_EPS = 0.004;

    function renderPinned(progress) {
      if (progress <= HANDOFF + PH_EPS) {
        setPhase(0);
        const p0 = HANDOFF > 0 ? clamp01(progress / HANDOFF) : 0;
        drawSeqFrame(Math.round(p0 * (SEQ_FRAME_COUNT - 1)));
        if (typeof window.__scroll1Render === "function") window.__scroll1Render(0);
        if (typeof window.__scroll2Render === "function") window.__scroll2Render(0);
        if (typeof window.__scroll3Render === "function") window.__scroll3Render(0);
      } else if (progress <= HANDOFF2 + PH_EPS) {
        setPhase(1);
        drawSeqFrame(SEQ_FRAME_COUNT - 1);
        const p1 = clamp01((progress - HANDOFF) / (HANDOFF2 - HANDOFF));
        if (typeof window.__scroll1Render === "function") window.__scroll1Render(p1);
        if (typeof window.__scroll2Render === "function") window.__scroll2Render(0);
        if (typeof window.__scroll3Render === "function") window.__scroll3Render(0);
      } else if (progress <= HANDOFF3 + PH_EPS) {
        setPhase(2);
        drawSeqFrame(SEQ_FRAME_COUNT - 1);
        if (typeof window.__scroll1Render === "function") window.__scroll1Render(1);
        const p2 = clamp01((progress - HANDOFF2) / (HANDOFF3 - HANDOFF2));
        if (typeof window.__scroll2Render === "function") window.__scroll2Render(p2);
        if (typeof window.__scroll3Render === "function") window.__scroll3Render(0);
      } else {
        setPhase(3);
        drawSeqFrame(SEQ_FRAME_COUNT - 1);
        if (typeof window.__scroll1Render === "function") window.__scroll1Render(1);
        if (typeof window.__scroll2Render === "function") window.__scroll2Render(1);
        const p3 = clamp01((progress - HANDOFF3) / (1 - HANDOFF3));
        if (typeof window.__scroll3Render === "function") window.__scroll3Render(p3);
      }
    }
    // Local clamp (renderPinned runs before the per-phase clamp01 defs).
    function clamp01(v) { return Math.max(0, Math.min(1, v)); }

    // The pinned, scrubbed build-stage runs on BOTH desktop and mobile: the
    // four sequences scrub through their frames exactly the same way. The only
    // difference is the model's left/right travel, which is suppressed on
    // mobile (the card stays centred) — handled in scroll-1/2.js render().
    // Timeline authored on a 10-unit scale: positions map directly to
    // fractions of the pin's scroll range (scrub does the time mapping).
    const scroll0TL = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: "#build-stage",
        start: "top top",
        end: () => "+=" + (window.innerHeight * TOTAL_PIN_FRACTION),
        pin: true,
        scrub: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          renderPinned(self.progress);
        },
        onRefresh: (self) => {
          // Positions for scroll-1.js's forced-scroll hijack: the hand-off
          // lock point and the pin end, in page scroll coordinates.
          window.__scroll0Meta = {
            start: self.start,
            handoffY: self.start + window.innerHeight * SCROLL0_PIN_FRACTION,
            handoff2Y: self.start + window.innerHeight * (SCROLL0_PIN_FRACTION + SCROLL1_PIN_FRACTION),
            handoff3Y: self.start + window.innerHeight * (SCROLL0_PIN_FRACTION + SCROLL1_PIN_FRACTION + SCROLL2_PIN_FRACTION),
            endY: self.start + window.innerHeight * TOTAL_PIN_FRACTION,
          };
          renderPinned(self.progress);
        }
      }
    });

    // ========================================================================
    // AUTO-SCROLL PER PHASE
    // Inside the pinned build-stage the four sequences (scroll-0..3) each play
    // as a SELF-RUNNING clip: a single scroll gesture in a direction (any
    // strength) triggers a fixed-duration programmatic scroll that carries the
    // page from the current phase boundary to the adjacent one, replaying that
    // sequence first->last (down) or last->first (up). The animation then stops
    // at the boundary and waits for the next gesture. The GSAP scrub still
    // drives the frame rendering off the (now programmatically driven) scroll
    // position, so the frames animate smoothly during the auto-scroll.
    // ========================================================================
    const AUTO_DUR = 1.4;              // fixed seconds per phase
    const BOUNDARY_EPS = 6;            // px tolerance when testing "at boundary"
    let autoScrolling = false;

    // The 5 phase boundaries in absolute page-Y, in order. Rebuilt from the
    // ScrollTrigger meta (kept fresh by onRefresh).
    function boundaries() {
      const m = window.__scroll0Meta;
      if (!m) return null;
      return [m.start, m.handoffY, m.handoff2Y, m.handoff3Y, m.endY];
    }

    // Index of the boundary at (or nearest below) the current scroll position.
    function currentBoundaryIndex(y, bs) {
      let idx = 0;
      for (let i = 0; i < bs.length; i++) {
        if (y >= bs[i] - BOUNDARY_EPS) idx = i;
      }
      return idx;
    }

    function runAutoScroll(dir) {
      const bs = boundaries();
      if (!bs) return;
      const y = lenis.scroll ?? window.scrollY;
      // Only hijack while we are inside the pinned range.
      if (y < bs[0] - BOUNDARY_EPS || y > bs[bs.length - 1] + BOUNDARY_EPS) return;

      const cur = currentBoundaryIndex(y, bs);
      let target = null;
      if (dir > 0 && cur < bs.length - 1) target = bs[cur + 1];
      else if (dir < 0 && cur > 0) target = bs[cur - 1];
      if (target == null) return; // at an end, let the page scroll normally

      autoScrolling = true;
      lenis.scrollTo(target, {
        duration: AUTO_DUR,
        easing: (t) => 1 - Math.pow(1 - t, 3), // easeOutCubic
        lock: true, // ignore user scroll during the tween
        onComplete: () => { autoScrolling = false; },
      });
    }

    // Intercept the first gesture of each phase. Capture phase so we win over
    // Lenis's own handler; preventDefault stops the native/scrub scroll so the
    // motion is fully programmatic.
    function onWheel(e) {
      const bs = boundaries();
      if (!bs) return;
      const y = lenis.scroll ?? window.scrollY;
      if (y < bs[0] - BOUNDARY_EPS || y > bs[bs.length - 1] + BOUNDARY_EPS) return;
      e.preventDefault();
      if (autoScrolling) return;
      runAutoScroll(Math.sign(e.deltaY) || 1);
    }

    let touchStartY = null;
    function onTouchStart(e) { touchStartY = e.touches[0].clientY; }
    function onTouchMove(e) {
      const bs = boundaries();
      if (!bs) return;
      const y = lenis.scroll ?? window.scrollY;
      if (y < bs[0] - BOUNDARY_EPS || y > bs[bs.length - 1] + BOUNDARY_EPS) return;
      e.preventDefault();
      if (autoScrolling || touchStartY == null) return;
      const dy = touchStartY - e.touches[0].clientY;
      if (Math.abs(dy) < 4) return;
      runAutoScroll(Math.sign(dy));
      touchStartY = null;
    }
    function onKey(e) {
      const bs = boundaries();
      if (!bs) return;
      const y = lenis.scroll ?? window.scrollY;
      if (y < bs[0] - BOUNDARY_EPS || y > bs[bs.length - 1] + BOUNDARY_EPS) return;
      const downKeys = ["ArrowDown", "PageDown", " ", "Spacebar"];
      const upKeys = ["ArrowUp", "PageUp"];
      if (downKeys.includes(e.key)) { e.preventDefault(); if (!autoScrolling) runAutoScroll(1); }
      else if (upKeys.includes(e.key)) { e.preventDefault(); if (!autoScrolling) runAutoScroll(-1); }
    }

    window.addEventListener("wheel", onWheel, { passive: false, capture: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true, capture: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false, capture: true });
    window.addEventListener("keydown", onKey, { capture: true });

    // The scroll-0 copy lives ENTIRELY inside the scroll-0 phase of the
    // combined pin. On the 10-unit scale that phase is [0 .. S0], where
    // S0 = HANDOFF*10 (~0.89 with the current fractions). The fade-in is
    // authored as a fraction of S0 so it scales with SCROLL0_PIN_FRACTION;
    // once in, the copy stays at full opacity through the rest of scroll-0
    // (setPhase() hides the whole canvas layer in one frame at the hand-off
    // instead).
    const S0 = HANDOFF * 10;

    // Copy in: fade + upward drift over the first ~40% of scroll-0. It then
    // stays fully visible for the whole middle of scroll-0 so the reader
    // keeps the text right up to the hand-off.
    scroll0TL.to(scroll0Copy, {
      opacity: 1,
      y: 0,
      duration: S0 * 0.28,
      stagger: S0 * 0.05
    }, S0 * 0.08);

    // No copy-out: the scroll-0 copy stays at full opacity through the LAST
    // frame of scroll-0 (it is hidden in one frame at the hand-off by
    // setPhase() swapping the whole canvas layer). This guarantees the copy is
    // complete on the final scroll-0 frame, matching scroll-1/2/3.

    // Pad the timeline to the full 10-unit scale so the scrub maps the
    // authored positions 1:1 onto the whole (extended) pin range.
    scroll0TL.to({}, { duration: 0.1 }, 9.9);
  }

  // Mobile menu toggle & overlay logic (no lenis.stop(), 3-way close, capture-phase event protection)
  const mobileToggle = document.querySelector('.mobile-menu-toggle');
  const mobileOverlay = document.querySelector('.mobile-menu-overlay');
  const mobileLinks = document.querySelectorAll('.mobile-nav-item');

  if (mobileToggle && mobileOverlay) {
    const openMenu = () => {
      mobileToggle.classList.add('active');
      mobileOverlay.classList.add('active');
      mobileOverlay.classList.add('open');
      document.body.classList.add('menu-open');
    };

    const closeMenu = () => {
      mobileToggle.classList.remove('active');
      mobileOverlay.classList.remove('active');
      mobileOverlay.classList.remove('open');
      document.body.classList.remove('menu-open');
    };

    mobileToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = mobileOverlay.classList.contains('open') || mobileOverlay.classList.contains('active');
      if (isOpen) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    // Close when tapping overlay backdrop outside nav menu
    mobileOverlay.addEventListener('click', (e) => {
      if (e.target === mobileOverlay) {
        closeMenu();
      }
    });

    // Close when pressing Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && (mobileOverlay.classList.contains('open') || mobileOverlay.classList.contains('active'))) {
        closeMenu();
      }
    });

    // Stop propagation of wheel & touchmove in capture phase when menu is open so Lenis cannot intercept
    const blockMenuScroll = (e) => {
      if (document.body.classList.contains('menu-open')) {
        e.stopPropagation();
      }
    };
    window.addEventListener('wheel', blockMenuScroll, { capture: true, passive: false });
    window.addEventListener('touchmove', blockMenuScroll, { capture: true, passive: false });

    // Menu links close menu first and scroll via Lenis with lock: true (never lenis.stop())
    mobileLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        closeMenu();
        if (href && href.startsWith('#') && href.length > 1) {
          e.preventDefault();
          const targetEl = document.querySelector(href);
          if (targetEl && window.__lenis) {
            window.__lenis.scrollTo(targetEl, {
              lock: true,
              onComplete: () => {}
            });
          }
        }
      });
    });
  }

  /* -----------------------------------------
     3D INTERACTIVE TILT GALLERY & PROJECT DETAIL POP-UP (PC ONLY)
     Calculates global vector deltas from cursor to cards
     and combines them with a gentle continuous floating animation.
     ----------------------------------------- */
  const detailsSection = document.querySelector('.details-section');
  const galleryContainer = document.querySelector('.floating-gallery-container');
  const floatingCards = document.querySelectorAll('.floating-card');

  if (detailsSection && galleryContainer && floatingCards.length > 0) {
    let globalMouseX = window.innerWidth / 2;
    let globalMouseY = window.innerHeight / 2;
    let mouseActive = false;

    // Track mouse coordinates globally on the window
    window.addEventListener('mousemove', (e) => {
      globalMouseX = e.clientX;
      globalMouseY = e.clientY;
      mouseActive = true;
    });

    // Reset when mouse leaves the page
    document.addEventListener('mouseleave', () => {
      mouseActive = false;
    });

    // Map each card to its specific animation parameters to ensure independent floating phases
    const cardData = Array.from(floatingCards).map((card, index) => {
      const speed = parseFloat(card.getAttribute('data-speed')) || 1.0;
      const isOutline = card.classList.contains('decorative-outline');
      
      // Calculate static center relative to the gallery container to prevent layout thrashing
      const centerX = card.offsetLeft + card.offsetWidth / 2;
      const centerY = card.offsetTop + card.offsetHeight / 2;

      // Determine initial offset values for fluid entrance animation
      let entranceOffsetX = 0;
      let entranceOffsetY = 0;
      let entranceRotX = 0;
      let entranceRotY = 0;
      let entranceScale = 0.65;

      if (card.classList.contains('card-bar') || card.classList.contains('card-bakery') || card.classList.contains('dec-outline-1')) {
        // Left side cards fly in from the left
        entranceOffsetX = -350;
        entranceRotY = -35;
      } else if (card.classList.contains('card-gelato') || card.classList.contains('card-enoteca') || card.classList.contains('dec-outline-3')) {
        // Right side cards fly in from the right
        entranceOffsetX = 350;
        entranceRotY = 35;
      } else {
        // Center/middle cards fly in from bottom/center
        entranceOffsetY = 220;
        entranceRotX = 35;
        entranceScale = 0.45;
      }

      // Pre-set cards state to hidden and scaled down to prevent FOUC
      gsap.set(card, {
        opacity: 0,
        scale: entranceScale
      });

      return {
        element: card,
        speed: speed,
        isOutline: isOutline,
        centerX: centerX,
        centerY: centerY,
        // Distinct phases for sine/cosine oscillations so they float out of sync
        phaseX: index * 1.7,
        phaseY: index * 2.3,
        phaseRotX: index * 1.2,
        phaseRotY: index * 0.9,
        // Amplitude scaling factor
        ampScale: isOutline ? 1.5 : 1.0,
        // Entrance animation parameters
        entranceOffsetX: entranceOffsetX,
        entranceOffsetY: entranceOffsetY,
        entranceRotX: entranceRotX,
        entranceRotY: entranceRotY,
        entranceScale: entranceScale,
        entranceBlend: 0, // Animates from 0 to 1 on ScrollTrigger entrance
        // Keep track of current values for smooth interpolation (Lerp)
        currentX: entranceOffsetX,
        currentY: entranceOffsetY,
        currentRotX: entranceRotX,
        currentRotY: entranceRotY
      };
    });

    // Create ScrollTrigger timeline for staggering entrance animation
    cardData.forEach((data, index) => {
      // Animate the entrance blend factor from 0 to 1
      gsap.to(data, {
        entranceBlend: 1,
        duration: 1.6,
        delay: index * 0.08,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ".details-section",
          start: "top 85%",
          toggleActions: "play none none none"
        }
      });

      // Animate the actual card element opacity and scale to full
      gsap.to(data.element, {
        opacity: 1,
        scale: 1,
        duration: 1.6,
        delay: index * 0.08,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ".details-section",
          start: "top 85%",
          toggleActions: "play none none none"
        }
      });
    });

    let time = 0;
    let wasDesktop = window.innerWidth >= 1024;

    const updateGallery = () => {
      const isDesktop = window.innerWidth >= 1024;
      if (!isDesktop) {
        if (wasDesktop) {
          // Reset all transforms when transitioning to mobile
          cardData.forEach((data) => {
            gsap.set(data.element, { clearProps: "all" });
          });
          wasDesktop = false;
        }
        return;
      }
      wasDesktop = true;

      const rect = galleryContainer.getBoundingClientRect();
      // Performance optimization: skip processing if the section is completely off-screen
      if (rect.bottom < -150 || rect.top > window.innerHeight + 150) {
        return;
      }

      const containerWidth = rect.width;
      const containerHeight = rect.height;

      // Mouse position relative to the gallery container coordinates
      const mouseX = globalMouseX - rect.left;
      const mouseY = globalMouseY - rect.top;

      time += 0.008; // Controls the speed of idle floating

      cardData.forEach((data) => {
        // 1. Idle Floating Animation (sine/cosine waves) - Dampened for stability
        const idleX = Math.sin(time + data.phaseX) * 5 * data.ampScale;
        const idleY = Math.cos(time + data.phaseY) * 5 * data.ampScale;
        const idleRotX = Math.sin(time + data.phaseRotX) * 0.5;
        const idleRotY = Math.cos(time + data.phaseRotY) * 0.5;

        let targetX = idleX;
        let targetY = idleY;
        let targetRotX = idleRotX;
        let targetRotY = idleRotY;

        // 2. Mouse Tracking Interactivity (global cursor position, relative to container)
        if (mouseActive) {
          // Vector delta from cached static center to mouse cursor coordinates
          const dx = mouseX - data.centerX;
          const dy = mouseY - data.centerY;

          // Normalize differences relative to the container size
          const pctX = dx / containerWidth;
          const pctY = dy / containerHeight;

          // Calculate interactive tilt (pointing/facing the cursor) - Dampened to 3deg max
          const maxAngleX = data.isOutline ? 6 : 3;
          const maxAngleY = data.isOutline ? 6 : 3;
          const tiltRotX = -pctY * maxAngleX;
          const tiltRotY = pctX * maxAngleY;

          // Calculate interactive translation (slight attraction towards cursor) - Dampened to 15px max
          const maxTransX = 15;
          const maxTransY = 15;
          const tiltTransX = pctX * maxTransX * data.speed;
          const tiltTransY = pctY * maxTransY * data.speed;

          targetX += tiltTransX;
          targetY += tiltTransY;
          targetRotX += tiltRotX;
          targetRotY += tiltRotY;
        }

        // 3. Interpolation (Lerp) for elastic, liquid smoothness
        data.currentX += (targetX - data.currentX) * 0.08;
        data.currentY += (targetY - data.currentY) * 0.08;
        data.currentRotX += (targetRotX - data.currentRotX) * 0.08;
        data.currentRotY += (targetRotY - data.currentRotY) * 0.08;

        // 4. Blend the interpolated floating value with the entrance offset
        const blend = data.entranceBlend;
        const finalX = data.currentX * blend + (1 - blend) * data.entranceOffsetX;
        const finalY = data.currentY * blend + (1 - blend) * data.entranceOffsetY;
        const finalRotX = data.currentRotX * blend + (1 - blend) * data.entranceRotX;
        const finalRotY = data.currentRotY * blend + (1 - blend) * data.entranceRotY;

        // 5. Apply transformations to the DOM
        gsap.set(data.element, {
          x: finalX,
          y: finalY,
          rotateX: finalRotX,
          rotateY: finalRotY,
          overwrite: "auto"
        });
      });
    };

    // Add to GSAP ticker
    gsap.ticker.add(updateGallery);

    /* -----------------------------------------
       PROJECT DETAILS POP-UP MODAL LOGIC
       ----------------------------------------- */
    const projectDetailsData = {
      "card-bar": {
        category: "BAR",
        title: "Caffè del Duomo",
        image: "./assets/bar_parisi.jpg",
        location: "Milano, Italia",
        date: "Marzo 2025",
        services: "Interior design, arredo su misura di prestigio, bancone bar artigianale con marmo retroilluminato, illuminotecnica, allestimento chiavi in mano.",
        description: "Un restyling completo progettato per coniugare l'eleganza storica della location e flussi di servizio ultra-rapidi. Il fulcro dell'ambiente è il maestoso bancone bar retroilluminato con finiture in ottone spazzolato e marmi selezionati."
      },
      "card-restaurant": {
        category: "RISTORANTE",
        title: "Ristorante Mare Blu",
        image: "./assets/restaurant.png",
        location: "Rimini, Italia",
        date: "Giugno 2025",
        services: "Pianificazione dello spazio, fornitura arredi contract di alto livello, pannelli acustici a soffitto, arredo terrazza panoramica.",
        description: "Un'atmosfera marittima contemporanea e sofisticata. Le ampie vetrate collegano lo spazio interno con l'orizzonte marino, mentre l'uso di legni chiari sbiancati e tessuti naturali esalta il legame visivo e tattile con il territorio."
      },
      "card-pizza": {
        category: "PIZZERIA",
        title: "Pizzeria 900",
        image: "./assets/restaurant.png",
        location: "Napoli, Italia",
        date: "Settembre 2025",
        services: "Rivestimento forno a cupola artistico, layout sedute ottimizzato, carpenteria metallica su disegno, impianti di estrazione fumi.",
        description: "Pizzeria dal carattere urbano e post-industriale. Il design ruota interamente attorno al forno a vista, rivestito in mosaico scuro. Materiali solidi come cemento a vista, metalli crudi e legno di recupero scaldano l'ambiente."
      },
      "card-gelato": {
        category: "GELATERIA",
        title: "Gelateria Dolcevita",
        image: "./assets/gelato.png",
        location: "Roma, Italia",
        date: "Aprile 2025",
        services: "Ingegnerizzazione vetrine gelato ad alta efficienza, scaffalature espositive retroilluminate, palette cromatica personalizzata, pavimentazione continua.",
        description: "Uno spazio di vendita allegro, luminoso e ad alte prestazioni commerciali. Progettato appositamente per valorizzare la visibilità delle carapine artigianali e massimizzare i flussi d'acquisto durante le ore di punta."
      },
      "card-hotel": {
        category: "HOTEL",
        title: "Hotel Artemisia",
        image: "./assets/hotel.png",
        location: "Firenze, Italia",
        date: "Novembre 2025",
        services: "Produzione arredi camere standard, suite e corridoi, reception desk monolitico, lighting design scenografico della hall.",
        description: "Progetto contract chiavi in mano per una raffinata struttura alberghiera di prestigio. L'integrazione di sistemi domotici intelligenti si sposa armonicamente con l'uso di boiserie classiche e caldi velluti di manifattura italiana."
      },
      "card-bakery": {
        category: "PASTICCERIA",
        title: "Dolci Tentazioni",
        image: "./assets/bakery.png",
        location: "Torino, Italia",
        date: "Dicembre 2025",
        services: "Vetrine pasticceria refrigerate su misura, isola caffetteria, porte laboratori complanari, posa carta da parati e modanature murali.",
        description: "Un accogliente salotto dal sapore parigino rétro. Dettagli dorati, modanature sagomate e una studiata combinazione di tinte pastello creano l'ambiente perfetto per un'esperienza di degustazione indimenticabile."
      },
      "card-enoteca": {
        category: "ENOTECA",
        title: "Enoteca Vinum",
        image: "./assets/retail.png",
        location: "Verona, Italia",
        date: "Ottobre 2025",
        services: "Scaffalature vino modulari in ferro e rovere, tavoli da degustazione, illuminazione d'atmosfera regolabile, pareti divisorie in metallo e vetro.",
        description: "Un tempio del vino moderno ed essenziale. Espositori minimalisti in ferro nero e rovere massiccio mettono in risalto l'importanza delle bottiglie storiche, mentre l'illuminazione a binario crea nicchie d'ombra intime."
      }
    };

    const modal = document.getElementById('projectModal');
    const modalImg = modal.querySelector('.modal-project-img');
    const modalCategory = modal.querySelector('.modal-project-category');
    const modalTitle = modal.querySelector('.modal-project-title');
    const modalLocation = document.getElementById('modal-detail-location');
    const modalDate = document.getElementById('modal-detail-date');
    const modalServices = document.getElementById('modal-detail-services');
    const modalDesc = modal.querySelector('.modal-project-desc');
    const closeBtn = modal.querySelector('.modal-close-btn');
    const backdrop = modal.querySelector('.modal-backdrop');

    const openModal = (cardKey) => {
      const data = projectDetailsData[cardKey];
      if (!data) return;

      // Populate data
      modalImg.src = data.image;
      modalImg.alt = data.title;
      modalCategory.textContent = data.category;
      modalTitle.textContent = data.title;
      modalLocation.textContent = data.location;
      modalDate.textContent = data.date;
      modalServices.textContent = data.services;
      modalDesc.textContent = data.description;

      // Prevent background scrolling
      if (lenis) lenis.stop();

      // Show modal
      modal.classList.add('active');
      modal.setAttribute('aria-hidden', 'false');
    };

    const closeModal = () => {
      modal.classList.remove('active');
      modal.setAttribute('aria-hidden', 'true');

      // Re-enable page scrolling
      if (lenis) lenis.start();

      // Reset image src after transition to prevent layout flash next time
      setTimeout(() => {
        modalImg.src = '';
      }, 500);
    };

    // Gestione click ultra-stabile sulle card fluttuanti usando pointerdown/pointerup
    floatingCards.forEach((card) => {
      if (card.classList.contains('decorative-outline')) return;

      const classes = Array.from(card.classList);
      const cardKey = classes.find(c => c.startsWith('card-'));

      if (cardKey) {
        let startX = 0;
        let startY = 0;
        let startTime = 0;

        // La freccia apre sempre il modal, senza euristiche di distanza/tempo
        const arrowBtn = card.querySelector('.card-arrow-btn');
        if (arrowBtn) {
          arrowBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            openModal(cardKey);
          });
        }

        card.addEventListener('pointerdown', (e) => {
          if (e.button !== 0) return; // Solo click sinistro o tap primario
          startX = e.clientX;
          startY = e.clientY;
          startTime = Date.now();
          // Cattura il puntatore: il pointerup arriva alla card anche se
          // l'animazione la sposta da sotto il cursore durante il click.
          // Niente cattura se il click parte dalla freccia: la cattura
          // ritargetterebbe il click sulla card, saltando l'handler dedicato.
          if (!(e.target.closest && e.target.closest('.card-arrow-btn'))) {
            try { card.setPointerCapture(e.pointerId); } catch (_) {}
          }
        });

        card.addEventListener('pointerup', (e) => {
          if (e.button !== 0) return; // Solo click sinistro o tap primario
          try { card.releasePointerCapture(e.pointerId); } catch (_) {}

          // Ignora i click partiti dalla freccia (gestiti dal suo handler dedicato)
          if (e.target.closest && e.target.closest('.card-arrow-btn')) return;

          const diffX = e.clientX - startX;
          const diffY = e.clientY - startY;
          const distance = Math.sqrt(diffX * diffX + diffY * diffY);
          const elapsed = Date.now() - startTime;

          // Click valido se il rilascio avviene entro 500ms con spostamento
          // del cursore inferiore a 24px, indipendentemente dal movimento della card.
          if (elapsed < 500 && distance < 24) {
            openModal(cardKey);
          }
        });
      }
    });

    // Close listeners
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (backdrop) backdrop.addEventListener('click', closeModal);

    // Escape key press close support
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('active')) {
        closeModal();
      }
    });
  }



  // ============================================================
  // MOBILE/TABLET PROJECT COVER FLOW (GSAP-driven, infinite loop)
  // ============================================================
  initMobileCarousel();

  function initMobileCarousel() {
    const carousel = document.getElementById('mCarousel');
    const track = document.getElementById('mCarouselTrack');
    const prevBtn = document.getElementById('mCarouselPrev');
    const nextBtn = document.getElementById('mCarouselNext');
    if (!carousel || !track || !prevBtn || !nextBtn || typeof gsap === 'undefined') return;

    const viewport = carousel.querySelector('.m-carousel-viewport');
    const slides = Array.from(track.children);
    const count = slides.length;
    if (count === 0) return;

    // --- Cover-flow geometry (tuned to the reference composition) ---
    const SIDE_SHIFT = 64;     // % of card width the neighbors slide outward
    const SIDE_SCALE = 0.8;    // neighbors scaled to ~80%
    const SIDE_ROT = 3;        // deg of inward Y-rotation (subtle, near-flat)
    const SIDE_OPACITY = 0.28; // neighbors barely suggested
    const SIDE_DEPTH = -140;   // px pushed back in Z (behind the focal card)

    // `pos` is a continuous float: 0 = slide 0 centred, 1 = slide 1 centred.
    // Fractional values (drag) are fully supported, so motion is physical.
    let pos = 0;
    const state = { pos: 0 };
    let tween = null;

    // Shortest signed circular distance between a slide index and pos.
    function offsetFor(i, p) {
      let d = i - p;
      d = ((d % count) + count) % count; // 0..count
      if (d > count / 2) d -= count;      // -count/2 .. count/2
      return d;
    }

    // Lay out every slide from the current continuous position.
    function layout(p) {
      slides.forEach((slide, i) => {
        const d = offsetFor(i, p);
        const ad = Math.abs(d);
        let x, scale, rotY, opacity, z, zIndex, focal;

        if (ad <= 1) {
          // Interpolate between focal (d=0) and neighbor (|d|=1) states.
          const t = ad; // 0..1
          const dir = d === 0 ? 0 : Math.sign(d);
          x = dir * SIDE_SHIFT * t;
          scale = 1 + (SIDE_SCALE - 1) * t;
          rotY = -dir * SIDE_ROT * t;      // rotate inward toward centre
          opacity = 1 + (SIDE_OPACITY - 1) * t;
          z = SIDE_DEPTH * t;
          zIndex = Math.round(100 - t * 60);
          focal = t < 0.5;
        } else {
          // Beyond the two neighbors: parked further out and hidden.
          const dir = Math.sign(d);
          x = dir * (SIDE_SHIFT + 40);
          scale = SIDE_SCALE - 0.06;
          rotY = -dir * SIDE_ROT;
          opacity = 0;
          z = SIDE_DEPTH - 60;
          zIndex = 0;
          focal = false;
        }

        gsap.set(slide, {
          xPercent: x,
          scale: scale,
          rotationY: rotY,
          z: z,
          opacity: opacity,
          zIndex: zIndex,
          pointerEvents: ad < 0.5 ? 'auto' : 'none',
        });
        slide.classList.toggle('is-focal', focal);
      });
    }

    // Animate to a target integer position with a physical, no-fade motion.
    function animateTo(target) {
      if (tween) tween.kill();
      tween = gsap.to(state, {
        pos: target,
        duration: 0.85,
        ease: 'power3.inOut',
        onUpdate: () => layout(state.pos),
        onComplete: () => {
          // Normalise into [0,count) without a visual jump so the loop
          // never accumulates large numbers.
          state.pos = ((target % count) + count) % count;
          pos = state.pos;
          layout(state.pos);
        },
      });
      pos = target;
    }

    function next() { animateTo(Math.round(state.pos) + 1); }
    function prev() { animateTo(Math.round(state.pos) - 1); }

    prevBtn.addEventListener('click', prev);
    nextBtn.addEventListener('click', next);

    // --- Drag / swipe: 1:1 physical follow, then settle to nearest ---
    let dragStartX = 0;
    let dragStartPos = 0;
    let dragging = false;
    let moved = false;

    function onStart(x) {
      if (tween) tween.kill();
      dragging = true;
      moved = false;
      dragStartX = x;
      dragStartPos = state.pos;
    }
    function onMove(x) {
      if (!dragging) return;
      const dx = x - dragStartX;
      if (Math.abs(dx) > 6) moved = true;
      // Dragging left (negative dx) advances position forward.
      state.pos = dragStartPos - dx / viewport.offsetWidth;
      layout(state.pos);
    }
    function onEnd() {
      if (!dragging) return;
      dragging = false;
      const mo15 = state.pos - dragStartPos;
      let target;
      if (mo15 > 0.12) target = Math.ceil(dragStartPos + 0.001);
      else if (mo15 < -0.12) target = Math.floor(dragStartPos - 0.001);
      else target = Math.round(dragStartPos);
      animateTo(target);
    }

    viewport.addEventListener('touchstart', (e) => onStart(e.touches[0].clientX), { passive: true });
    viewport.addEventListener('touchmove', (e) => onMove(e.touches[0].clientX), { passive: true });
    viewport.addEventListener('touchend', onEnd);

    // Tap a side card to bring it to centre; block link nav after a swipe.
    slides.forEach((slide, i) => {
      slide.addEventListener('click', (e) => {
        if (moved) {
          e.preventDefault();
          moved = false;
          return;
        }
        const d = offsetFor(i, state.pos);
        if (Math.abs(d) >= 0.5) {
          e.preventDefault();
          animateTo(Math.round(state.pos) + Math.round(d));
        }
      });
    });

    layout(0);
  }

  // Refresh ScrollTrigger after section reordering and layout setup
  if (typeof ScrollTrigger !== 'undefined') {
    ScrollTrigger.refresh();
  }

});
