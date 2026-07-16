/* 
  Global Contract (Krea S.r.l.) - Premium Hero Animations & Controls
  GSAP + Lenis integration with smooth vertical accordion logic
*/

document.addEventListener("DOMContentLoaded", () => {
  
  // Prevent browser scroll restoration and force page to top on reload
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }
  window.scrollTo(0, 0);
  
  // Register GSAP ScrollTrigger
  gsap.registerPlugin(ScrollTrigger);

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

  // Connect Lenis to GSAP ticker
  lenis.on('scroll', ScrollTrigger.update);
  
  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });
  
  gsap.ticker.lagSmoothing(0);


  // In-memory only (no sessionStorage): every fresh page load/reload starts
  // false, so the forced full-run always replays on refresh. It only stays
  // true for the lifetime of this script execution, so scrolling back up
  // and down again without reloading does not retrigger it.
  let transitionDone = false;
  let isStageLocked = false;
  let isTweening = false;
  let unlockTimeout = null;

  // Revisit state handling on load.
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
  const SEQ_FRAME_COUNT = 198;
  const seqFrames = [];
  let seqLoadedCount = 0;
  let seqReady = false;
  let lastDrawnFrame = -1;
  let pendingFrame = null;

  function seqFramePath(i) {
    const n = String(i).padStart(3, "0");
    return `./assets/animations/scroll-0/webp/frame_${n}.webp`;
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



  // Header state on scroll
  lenis.on('scroll', (e) => {
    const header = document.querySelector('.main-header');
    if (header) {
      if (e.scroll > 50) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }
  });  // Initial state setup for loader and nav header
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
    const src = p.querySelector('.hero-panel__img').getAttribute('src');
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
  let heroExitTL = null;
  let touchStartY = 0;

  const mm = gsap.matchMedia();

  // Pin range is reduced by approximately 65% for a denser, more immediate transition: the hero is
  // pinned for exactly 0.35 viewport heights of scroll travel.
  const PIN_VH_FRACTION = 0.35;

  mm.add("(min-width: 769px)", () => {
    // 1. Initialize Pinned Timeline & ScrollTrigger
    heroExitTL = gsap.timeline({
      defaults: { duration: 1, ease: "power2.inOut" },
      scrollTrigger: {
        trigger: ".hero-section",
        start: "top top",
        end: () => `+=${window.innerHeight * PIN_VH_FRACTION}`,
        scrub: true,
        pin: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        // Reset the hover accordion once descent starts, restore primary index 0 when scrolled back to 0.
        onUpdate: (self) => {
          // No accordion state to reset
        }
      }
    });

    // Staggered panel exits - wide stagger + long soft travel for a majestic,
    // weighty ascent (tuning point #1). The timeline is authored in units
    // that match the forced scroll tween's real seconds (~4.2s, see
    // runForcedScrollTween) so the scrub progress maps ~1:1 to wall-clock
    // time - the ascent must consume nearly the whole forced run, not
    // finish early and leave a dead black gap before the build stage.
    //
    // Staggered by VISUAL (CSS `order`) position, not DOM/data-index - the
    // gallery is reordered on screen so Bar & Ristoranti sits centered, and
    // staggering by data-index would fire the centered card first instead of
    // in its actual left-to-right screen position, breaking the staircase.
    // Every panel travels the exact same distance so the rhythm comes purely
    // from the stagger delay - a uniform step, not a widening spread.
    const staggerDelay = 0.12;
    const panelTravelDuration = 3.4;
    panels.forEach((panel) => {
      const visualIndex = parseInt(getComputedStyle(panel).order, 10) || 0;
      const reflection = document.querySelector(`.card-reflection[data-index="${panel.dataset.index}"]`);
      heroExitTL.to(reflection ? [panel, reflection] : panel, {
        y: () => -window.innerHeight - 320,
        duration: panelTravelDuration,
      }, visualIndex * staggerDelay);
    });

    // No opacity animation on .gallery-blend-overlay so it remains active and masks the seam throughout transition

    // Headline and scroll indicator exits
    heroExitTL.to(".hero-text-block", {
      y: () => -window.innerHeight * 0.8,
      opacity: 0,
    }, 0);

    // Landing stretch: brief dwell once the last panel clears, right before
    // the pin range ends (positioned explicitly so it lands after the last
    // panel's travel instead of GSAP's implicit "end of previous add" which
    // undercounted the staggered panels).
    const lastPanelEnd = (panels.length - 1) * staggerDelay + panelTravelDuration;
    heroExitTL.to({}, { duration: 0.08 }, lastPanelEnd);

    return () => {
      if (heroExitTL) heroExitTL.kill();
      heroExitTL = null;
      // Reset any transforms on elements
      panels.forEach(panel => gsap.set(panel, { y: 0 }));
      gsap.set(document.querySelectorAll('.card-reflection'), { y: 0 });
      gsap.set(".hero-text-block", { y: 0, opacity: 1 });
    };
  });

  // Track touchstart for mobile/touch devices
  window.addEventListener('touchstart', (e) => {
    if (isMobileQuery.matches) return;
    if (transitionDone) return;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  // Hijack first scroll downward
  function handleForcedScroll(e) {
    if (isMobileQuery.matches) return;
    if (transitionDone || isTweening) return;

    // Only trigger if we are at the very top (scrollY <= 5)
    const isAtTop = window.scrollY <= 5;
    if (!isAtTop) return;

    let isDownward = false;

    if (e.type === 'wheel') {
      if (e.deltaY > 0) {
        isDownward = true;
      }
    } else if (e.type === 'touchmove') {
      const touchEndY = e.touches[0].clientY;
      if (touchEndY < touchStartY) { // Finger moved up -> scrolls page down
        isDownward = true;
      }
    } else if (e.type === 'keydown') {
      const keys = ['ArrowDown', 'PageDown', ' ', 'Spacebar'];
      if (keys.includes(e.key)) {
        isDownward = true;
      }
    }

    if (isDownward) {
      e.preventDefault();
      e.stopPropagation();
      runForcedScrollTween();
    }
  }

  // Scroll 0 pin length is reduced by 65% for a denser, faster canvas frame sequence.
  const SCROLL0_PIN_FRACTION = 0.525;

  function runForcedScrollTween() {
    if (isTweening || transitionDone) return;

    isTweening = true;
    isStageLocked = true;
    // NOTE: no lenis.stop() here. The .lenis-stopped class sets
    // overflow:hidden on <html>, which makes the page unscrollable and
    // silently kills the descent. We let Lenis itself drive the scroll
    // (lock:true blocks user input for the whole animation).

    // Safety net: if lenis.scrollTo's onComplete never fires for any reason
    // (backgrounded tab throttling the rAF loop, a resize invalidating the
    // target mid-tween, etc.) isTweening/isStageLocked would stay true
    // forever - and blockInput/handleForcedScroll block wheel/touch/keydown
    // on those flags, so the page would only be scrollable by dragging the
    // native scrollbar thumb. Force an unlock no later than 6s so a stuck
    // tween can never hijack scroll permanently.
    clearTimeout(unlockTimeout);
    unlockTimeout = setTimeout(() => unlockStage(true), 6000);

    // Target: the END of the Scroll 0 pin. One scroll gesture from the
    // hero rides through the hero exit AND the entire frame sequence
    // (the scrubbed canvas follows the scroll position), unlocking only
    // when the section unpins.
    const stageTop = buildStage
      ? buildStage.getBoundingClientRect().top + window.scrollY
      : window.innerHeight * (1 + PIN_VH_FRACTION);
    const targetScroll = stageTop + window.innerHeight * SCROLL0_PIN_FRACTION;

    lenis.scrollTo(targetScroll, {
      duration: 2.8, // Proportionally reduced from 8s to match compressed scroll length
      // power3.inOut
      easing: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
      lock: true,
      onComplete: () => {
        isTweening = false;
        // Scroll 0 fully played. Page unlocks here; scrolling back up
        // replays the sequence in reverse, freely.
        unlockStage(true);
      }
    });
  }

  /* -----------------------------------------
     SCROLL 0 - PINNED SCROLL-SCRUBBED SEQUENCE
     The section pins for an extra 150% of viewport height (~250vh of page
     travel in total). Scroll progress maps 1:1 onto the frame index, fully
     bidirectional - down plays forward, up plays backward. No autoplay,
     no time-based timelines. The copy fades in with a slight vertical
     drift early in the pin and then stays fully visible - it must not
     disappear before the section actually unpins into Scroll 1.
     ----------------------------------------- */
  if (buildStage && buildCtx) {
    const scroll0Copy = [".build-eyebrow", ".build-headline", ".build-sub"];

    // Neutralize the CSS entrance offsets (they belonged to the old
    // autoplay choreography): the canvas is always visible inside the
    // pinned stage, the copy is driven purely by the scrubbed timeline.
    gsap.set(".build-canvas-container", { opacity: 1, x: 0 });
    gsap.set(scroll0Copy, { opacity: 0, x: 0, y: 36 });

    // Timeline authored on a 10-unit scale: positions map directly to
    // fractions of the pin's scroll range (scrub does the time mapping).
    const scroll0TL = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: "#build-stage",
        start: "top top",
        end: () => "+=" + (window.innerHeight * SCROLL0_PIN_FRACTION),
        pin: true,
        scrub: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          drawSeqFrame(Math.round(self.progress * (SEQ_FRAME_COUNT - 1)));
        },
        onRefresh: (self) => {
          drawSeqFrame(Math.round(self.progress * (SEQ_FRAME_COUNT - 1)));
        }
      }
    });

    // Copy in: fade + upward drift over the first ~20% of the pin. No
    // fade-out - it stays on screen for the rest of the pin and only
    // leaves when the section unpins and the page moves on to Scroll 1.
    scroll0TL.to(scroll0Copy, {
      opacity: 1,
      y: 0,
      duration: 1.4,
      stagger: 0.25
    }, 0.4);

    // Pad the timeline to the same 10-unit scale as before: keeps the
    // fade-in fast and early (~20% of the pin) instead of the scrub
    // stretching it across the whole reduced timeline now that the
    // fade-out tween (which used to anchor the far end) is gone.
    scroll0TL.to({}, { duration: 0.1 }, 9.9);
  }

  function unlockStage(markComplete = true) {
    if (!isStageLocked) return;
    isStageLocked = false;
    isTweening = false;
    clearTimeout(unlockTimeout);

    lenis.start();

    // Only a genuinely completed sequence may mark it done - a
    // safety-timeout bailout must stay retryable within the same page load.
    if (markComplete) {
      transitionDone = true;
      if (buildStage) {
        buildStage.classList.add("transition-done");
      }
    }
    console.log("Stage building complete. Page unlocked.");
  }

  // Capture phase: these fire BEFORE Lenis's own wheel/touch handlers,
  // so stopPropagation() genuinely blocks Lenis from scrolling too.
  window.addEventListener('wheel', handleForcedScroll, { passive: false, capture: true });
  window.addEventListener('touchmove', handleForcedScroll, { passive: false, capture: true });
  window.addEventListener('keydown', handleForcedScroll, { passive: false, capture: true });

  // Hard input block during the forced descent AND the build sequence.
  function blockInput(e) {
    if (isTweening || isStageLocked) {
      e.preventDefault();
      e.stopPropagation();
    }
  }
  window.addEventListener('wheel', blockInput, { passive: false, capture: true });
  window.addEventListener('touchmove', blockInput, { passive: false, capture: true });
  window.addEventListener('keydown', (e) => {
    if (isTweening || isStageLocked) {
      const keys = ['ArrowDown', 'PageDown', 'ArrowUp', 'PageUp', ' ', 'Spacebar', 'Home', 'End'];
      if (keys.includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
      }
    }
  }, { passive: false, capture: true });

  // Mobile menu toggle logic
  const mobileToggle = document.querySelector('.mobile-menu-toggle');
  const mobileOverlay = document.querySelector('.mobile-menu-overlay');
  const mobileLinks = document.querySelectorAll('.mobile-nav-item');

  if (mobileToggle && mobileOverlay) {
    mobileToggle.addEventListener('click', () => {
      const isActive = mobileToggle.classList.toggle('active');
      mobileOverlay.classList.toggle('active');
      document.body.classList.toggle('menu-open', isActive);
      
      if (isActive) {
        lenis.stop(); // Stop scroll when menu is open
      } else {
        lenis.start();
      }
    });

    mobileLinks.forEach(link => {
      link.addEventListener('click', () => {
        mobileToggle.classList.remove('active');
        mobileOverlay.classList.remove('active');
        document.body.classList.remove('menu-open');
        lenis.start();
      });
    });
  }

});
