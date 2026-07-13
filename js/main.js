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


  // In-memory only (no sessionStorage): every fresh page load/reload starts
  // false, so the forced full-run always replays on refresh. It only stays
  // true for the lifetime of this script execution, so scrolling back up
  // and down again without reloading does not retrigger it.
  let transitionDone = false;
  // Gate for scroll-1.js's own forced-scroll hijack: only arms once Scroll 0
  // has genuinely finished, so a not-yet-refreshed ScrollTrigger on the
  // reveal layer can never mistakenly hijack the very first hero scroll.
  window.__scroll0Done = false;
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
    tl.set(".nav-logo-img", { opacity: 1 });
    tl.set(".loader-logo-container", { display: "none" });
  }


  /* -----------------------------------------
     4. ACCORDION PANELS GALLERY LOGIC
     ----------------------------------------- */
  const gallery = document.getElementById('gallery-container');
  const panels = gsap.utils.toArray('.sector-panel');
  
  const isMobileQuery = window.matchMedia('(max-width: 768px)');
  
  let hoverTimeout = null;
  let activeIndex = null;
  let activeMobileIndex = -1;
  let mobileScrollListener = null;

  function initGallery() {
    // Clear any previous state or event listeners
    gallery.classList.remove('has-active');
    if (hoverTimeout) clearTimeout(hoverTimeout);
    if (mobileScrollListener) {
      window.removeEventListener('scroll', mobileScrollListener);
      mobileScrollListener = null;
    }
    
    // Reset panels state
    panels.forEach((panel) => {
      panel.classList.remove('active');
      const body = panel.querySelector('.panel-body');
      const desc = panel.querySelector('.panel-description');
      const cta = panel.querySelector('.panel-cta');
      
      gsap.killTweensOf(panel);
      if (body) gsap.killTweensOf(body);
      if (desc) gsap.killTweensOf(desc);
      if (cta) gsap.killTweensOf(cta);

      // Clean inline styles - clearProps (not a hardcoded flexBasis:0) so the
      // mobile height-tween isn't fought by a leftover inline flex-basis,
      // which takes priority over height as the column flex main-axis size.
      gsap.set(panel, { clearProps: "flexGrow,flexBasis,height" });
      if (body) gsap.set(body, { clearProps: "all" });
      if (desc) gsap.set(desc, { clearProps: "all" });
      if (cta) gsap.set(cta, { clearProps: "all" });
    });

    if (isMobileQuery.matches) {
      // MOBILE SCROLL-DRIVEN ACCORDION
      activeMobileIndex = -1;
      
      // Initial call to set active panel on load
      updateMobileActivePanel();
      
      mobileScrollListener = updateMobileActivePanel;
      window.addEventListener('scroll', mobileScrollListener);
    } else {
      // DESKTOP HOVER ACCORDION
      activeIndex = 0;
      
      // Set initial desktop state
      panels.forEach((panel) => {
        const body = panel.querySelector('.panel-body');
        gsap.set(body, { opacity: 0, y: 20 });
      });

      // Default focus: Bar & Restaurants active by default on load
      animateAccordionState(0);

      // Register interactions based on touch/mouse
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      if (!isTouchDevice) {
        // Desktop: Hover with Intent
        panels.forEach((panel, idx) => {
          const enterHandler = () => {
            if (window.scrollY > 5) return; // Ignore hover if scrolled down
            if (isTweening || isStageLocked) return; // Forced-scroll owns the panels right now
            if (hoverTimeout) clearTimeout(hoverTimeout);
            hoverTimeout = setTimeout(() => {
              if (isTweening || isStageLocked) return; // Re-check: forced-scroll may have started mid-debounce
              if (activeIndex !== idx) {
                animateAccordionState(idx);
              }
            }, 100);
          };
          panel._enterHandler = enterHandler;
          panel.addEventListener('mouseenter', enterHandler);

          const focusHandler = () => {
            if (window.scrollY > 5) return; // Ignore focus if scrolled down
            if (isTweening || isStageLocked) return; // Forced-scroll owns the panels right now
            if (hoverTimeout) clearTimeout(hoverTimeout);
            animateAccordionState(idx);
          };
          panel._focusHandler = focusHandler;
          panel.addEventListener('focus', focusHandler);
        });

        // Reset when mouse leaves the entire gallery area to the default first category
        const leaveHandler = () => {
          if (isTweening || isStageLocked) return; // Forced-scroll owns the panels right now
          if (hoverTimeout) clearTimeout(hoverTimeout);
          animateAccordionState(0);
        };
        gallery._leaveHandler = leaveHandler;
        gallery.addEventListener('mouseleave', leaveHandler);
      } else {
        // Tablet / Fallback (Touch but not phone <768px): Tap-to-expand
        panels.forEach((panel, idx) => {
          const clickHandler = (e) => {
            if (panel.classList.contains('active')) {
              return;
            }
            if (isTweening || isStageLocked) return; // Forced-scroll owns the panels right now
            e.preventDefault();
            animateAccordionState(idx);
          };
          panel._clickHandler = clickHandler;
          panel.addEventListener('click', clickHandler);
        });
      }
    }
  }

  function updateMobileActivePanel() {
    const scrollY = window.scrollY || window.pageYOffset;
    
    // Force first panel active when scrolled to the top area
    if (scrollY < 120) {
      if (activeMobileIndex !== 0) {
        activeMobileIndex = 0;
        animateMobileAccordionState(0);
      }
      return;
    }
    
    // Force last panel active when scrolled to the bottom area
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    if (scrollY > maxScroll - 120) {
      const lastIndex = panels.length - 1;
      if (activeMobileIndex !== lastIndex) {
        activeMobileIndex = lastIndex;
        animateMobileAccordionState(lastIndex);
      }
      return;
    }

    const viewportCenter = window.innerHeight / 2;
    let closestIndex = 0;
    let minDistance = Infinity;

    panels.forEach((panel, idx) => {
      const rect = panel.getBoundingClientRect();
      const panelCenter = rect.top + rect.height / 2;
      const distance = Math.abs(panelCenter - viewportCenter);
      
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = idx;
      }
    });

    if (closestIndex !== activeMobileIndex) {
      activeMobileIndex = closestIndex;
      animateMobileAccordionState(closestIndex);
    }
  }

  function animateMobileAccordionState(targetIndex) {
    if (targetIndex !== -1 && targetIndex !== null) {
      gallery.classList.add('has-active');
    } else {
      gallery.classList.remove('has-active');
    }

    panels.forEach((panel, idx) => {
      const isActive = idx === targetIndex;
      const targetHeight = isActive ? 380 : 240;
      const desc = panel.querySelector('.panel-description');
      const cta = panel.querySelector('.panel-cta');
      // Fade only the description/cta - the label has no rotated collapsed
      // stand-in on mobile (unlike desktop), so it must stay legible always.
      const fadeTargets = [desc, cta].filter(Boolean);

      // Stop running tweens to prevent overlapping visual state collisions
      gsap.killTweensOf(panel);
      if (fadeTargets.length) gsap.killTweensOf(fadeTargets);

      // Animate height on mobile column layout instead of flex-grow
      gsap.to(panel, {
        height: targetHeight,
        duration: 0.5,
        ease: "power2.out"
      });

      if (isActive) {
        panel.classList.add('active');
        if (fadeTargets.length) {
          gsap.to(fadeTargets, {
            opacity: 1,
            y: 0,
            duration: 0.4,
            delay: 0.1,
            ease: "power2.out"
          });
        }
      } else {
        panel.classList.remove('active');
        if (fadeTargets.length) {
          gsap.to(fadeTargets, {
            opacity: 0,
            y: 10,
            duration: 0.22,
            ease: "power2.out"
          });
        }
      }
    });
  }

  function animateAccordionState(targetIndex) {
    activeIndex = targetIndex;
    
    // Toggle has-active class on gallery container to coordinate brightness dimming
    if (targetIndex !== null) {
      gallery.classList.add('has-active');
    } else {
      gallery.classList.remove('has-active');
    }
    
    panels.forEach((panel, idx) => {
      const isActive = idx === targetIndex;
      const isGalleryReset = targetIndex === null;
      const targetGrow = isGalleryReset ? 1 : (isActive ? 4.6 : 0.4);
      const body = panel.querySelector('.panel-body');

      // overwrite:"auto" (not killTweensOf(panel)) - killTweensOf(panel) would
      // also wipe this panel's unrelated heroExitTL y-exit tween whenever the
      // scroll pin resets the accordion (onUpdate below), freezing the ascent
      // dead. killTweensOf(body) is safe on its own: heroExitTL never targets
      // .panel-body, only the panel itself and .hero-text-block. It's needed
      // here on top of overwrite:"auto" because the active-state tween below
      // carries a delay - under fast repeated hover switching, overwrite:auto
      // can race with a still-delayed (not yet started) tween and leave the
      // body's opacity/transform stuck rather than reset, a rare ghost-text
      // state that only shows up under rapid input.
      gsap.to(panel, {
        flexGrow: targetGrow,
        duration: 1.0, // Heavy, physically smooth deceleration glide
        ease: "expo.out", // Premium Apple-style exponential ease
        overwrite: "auto"
      });

      gsap.killTweensOf(body);

      if (isActive) {
        panel.classList.add('active');
        gsap.to(body, {
          opacity: 1,
          y: 0,
          duration: 0.85,
          delay: 0.12, // Let the panel expand first, preventing text overlap jitter
          ease: "power3.out"
        });
      } else {
        panel.classList.remove('active');
        gsap.to(body, {
          opacity: 0,
          y: 20,
          duration: 0.45,
          ease: "power3.out"
        });
      }
    });
  }

  // Initial initialization
  initGallery();

  // Watch for breakpoint transitions to prevent event listener conflicts
  isMobileQuery.addEventListener('change', () => {
    // Remove listeners before re-initializing
    panels.forEach(panel => {
      if (panel._enterHandler) panel.removeEventListener('mouseenter', panel._enterHandler);
      if (panel._focusHandler) panel.removeEventListener('focus', panel._focusHandler);
      if (panel._clickHandler) panel.removeEventListener('click', panel._clickHandler);
    });
    if (gallery._leaveHandler) gallery.removeEventListener('mouseleave', gallery._leaveHandler);
    
    initGallery();
  });

  // Make the entire panel clickable to navigate (applies to both desktop & mobile when active)
  panels.forEach((panel) => {
    panel.addEventListener('click', (e) => {
      if (panel.classList.contains('active')) {
        const sectorLabel = panel.querySelector('.panel-label');
        if (!sectorLabel) return;
        const sectorName = sectorLabel.innerText.replace(/\n/g, ' ').trim().toLowerCase();
        let catParam = "";
        if (sectorName.includes("bar")) catParam = "bar-restaurants";
        else if (sectorName.includes("alberghiero") || sectorName.includes("hotel")) catParam = "hotels";
        else if (sectorName.includes("gelaterie")) catParam = "gelaterie-pasticcerie";
        else if (sectorName.includes("salumerie")) catParam = "salumerie-panifici";
        else if (sectorName.includes("farmacie")) catParam = "farmacie-parafarmacie";
        else if (sectorName.includes("tabacchi")) catParam = "tabacchi";
        else if (sectorName.includes("commerciali") || sectorName.includes("commercial")) catParam = "commercial-spaces";
        
        if (catParam) {
          window.location.href = `./projects.html?category=${catParam}`;
        }
      }
    });
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
          if (self.progress > 0.001) {
            if (activeIndex !== null) {
              animateAccordionState(null);
            }
          } else {
            if (activeIndex !== 0) {
              animateAccordionState(0);
            }
          }
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
      heroExitTL.to(panel, {
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

    // Target: the scroll-0/scroll-1 HAND-OFF point (mid-pin). One scroll
    // gesture from the hero rides through the hero exit AND the entire
    // scroll-0 frame sequence (the scrubbed canvas follows the scroll
    // position), locking there. Scroll-1's own forced tween then covers
    // the rest of the pin on the next input.
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
        // replays the sequence in reverse, freely. Scroll 1's own forced
        // tween (scroll-1.js) only fires on a fresh scroll input once the
        // user reaches its pin - it is not chained automatically.
        unlockStage(true);
      }
    });
  }

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
      // Mobile shows all blocks statically (scroll-1.js/scroll-2.js mobile
      // branches); the visibility swap is a desktop-only mechanic.
      if (isMobileQuery.matches) return;
      if (activePhase === phase) return;
      activePhase = phase;
      // Instant swap: each sequence's frame 0 sits pixel-aligned over the
      // previous sequence's last frame, so flipping visibility is
      // invisible to the eye.
      gsap.set(".build-canvas-container", { autoAlpha: phase === 0 ? 1 : 0 });
      if (revealLayer) gsap.set(revealLayer, { autoAlpha: phase === 1 ? 1 : 0 });
      if (revealLayer2) gsap.set(revealLayer2, { autoAlpha: phase === 2 ? 1 : 0 });
      if (revealLayer3) gsap.set(revealLayer3, { autoAlpha: phase === 3 ? 1 : 0 });
    }

    function renderPinned(progress) {
      if (progress <= HANDOFF) {
        setPhase(0);
        const p0 = HANDOFF > 0 ? progress / HANDOFF : 0;
        drawSeqFrame(Math.round(p0 * (SEQ_FRAME_COUNT - 1)));
        if (typeof window.__scroll1Render === "function") window.__scroll1Render(0);
        if (typeof window.__scroll2Render === "function") window.__scroll2Render(0);
        if (typeof window.__scroll3Render === "function") window.__scroll3Render(0);
      } else if (progress <= HANDOFF2) {
        setPhase(1);
        drawSeqFrame(SEQ_FRAME_COUNT - 1);
        const p1 = (progress - HANDOFF) / (HANDOFF2 - HANDOFF);
        if (typeof window.__scroll1Render === "function") window.__scroll1Render(p1);
        if (typeof window.__scroll2Render === "function") window.__scroll2Render(0);
        if (typeof window.__scroll3Render === "function") window.__scroll3Render(0);
      } else if (progress <= HANDOFF3) {
        setPhase(2);
        drawSeqFrame(SEQ_FRAME_COUNT - 1);
        if (typeof window.__scroll1Render === "function") window.__scroll1Render(1);
        const p2 = (progress - HANDOFF2) / (HANDOFF3 - HANDOFF2);
        if (typeof window.__scroll2Render === "function") window.__scroll2Render(p2);
        if (typeof window.__scroll3Render === "function") window.__scroll3Render(0);
      } else {
        setPhase(3);
        drawSeqFrame(SEQ_FRAME_COUNT - 1);
        if (typeof window.__scroll1Render === "function") window.__scroll1Render(1);
        if (typeof window.__scroll2Render === "function") window.__scroll2Render(1);
        const p3 = (progress - HANDOFF3) / (1 - HANDOFF3);
        if (typeof window.__scroll3Render === "function") window.__scroll3Render(p3);
      }
    }

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

    // The scroll-0 copy lives ENTIRELY inside the scroll-0 phase of the
    // combined pin. On the 10-unit scale that phase is [0 .. S0], where
    // S0 = HANDOFF*10 (~0.89 with the current fractions). Both the fade-in
    // and the fade-out are authored as fractions of S0 so they scale with
    // SCROLL0_PIN_FRACTION and never bleed into scroll-1/2/3 - the copy is
    // fully faded out by the hand-off and stays gone for the rest of the pin.
    const S0 = HANDOFF * 10;

    // Copy in: fade + upward drift over the first ~40% of scroll-0.
    scroll0TL.to(scroll0Copy, {
      opacity: 1,
      y: 0,
      duration: S0 * 0.28,
      stagger: S0 * 0.05
    }, S0 * 0.08);

    // Copy out: leaves over the last stretch of scroll-0, fully gone before
    // the hand-off (~0.85*S0 end) so scroll-1/2/3 never show the build copy.
    scroll0TL.to(scroll0Copy, {
      opacity: 0,
      x: -36,
      duration: S0 * 0.20,
      stagger: S0 * 0.03
    }, S0 * 0.68);

    // Pad the timeline to the full 10-unit scale so the scrub maps the
    // authored positions 1:1 onto the whole (extended) pin range.
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
      window.__scroll0Done = true;
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

  /* -----------------------------------------
     3D INTERACTIVE TILT GALLERY (PC ONLY)
     Calculates vector deltas from cursor to cards
     and drives tilt rotation/translation smoothly via GSAP.
     ----------------------------------------- */
  const detailsSection = document.querySelector('.details-section');
  const galleryContainer = document.querySelector('.floating-gallery-container');
  const floatingCards = document.querySelectorAll('.floating-card');

  if (detailsSection && galleryContainer && floatingCards.length > 0) {
    const handleMouseMove = (e) => {
      // Don't run on screen sizes below desktop breakpoint
      if (window.innerWidth < 1024) return;

      const rect = galleryContainer.getBoundingClientRect();
      const containerWidth = rect.width;
      const containerHeight = rect.height;

      // Mouse position relative to the gallery container
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      floatingCards.forEach((card) => {
        // Find card center relative to container
        const cardCenterX = card.offsetLeft + card.offsetWidth / 2;
        const cardCenterY = card.offsetTop + card.offsetHeight / 2;

        // Vector differences
        const dx = mouseX - cardCenterX;
        const dy = mouseY - cardCenterY;

        // Percentages of difference relative to the container size
        const pctX = dx / containerWidth;
        const pctY = dy / containerHeight;

        // Base max rotation angles (degrees)
        const isOutline = card.classList.contains('decorative-outline');
        const maxAngleX = isOutline ? 20 : 12;
        const maxAngleY = isOutline ? 20 : 12;

        // Tilt logic:
        // dx > 0 (cursor right) -> rotate around Y axis positively
        // dy > 0 (cursor down) -> rotate around X axis negatively
        const targetRotateY = pctX * maxAngleY;
        const targetRotateX = -pctY * maxAngleX;

        // Dynamic translation based on data-speed for depth parallax
        const speed = parseFloat(card.getAttribute('data-speed')) || 1.0;
        const targetTransX = pctX * 30 * speed;
        const targetTransY = pctY * 30 * speed;

        gsap.to(card, {
          rotateX: targetRotateX,
          rotateY: targetRotateY,
          x: targetTransX,
          y: targetTransY,
          duration: 0.6,
          ease: "power2.out",
          overwrite: "auto"
        });
      });
    };

    const handleMouseLeave = () => {
      floatingCards.forEach((card) => {
        gsap.to(card, {
          rotateX: 0,
          rotateY: 0,
          x: 0,
          y: 0,
          duration: 0.8,
          ease: "power2.out",
          overwrite: "auto"
        });
      });
    };

    detailsSection.addEventListener('mousemove', handleMouseMove);
    detailsSection.addEventListener('mouseleave', handleMouseLeave);
  }

});
