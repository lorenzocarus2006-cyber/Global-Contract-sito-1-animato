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
      duration: 1.8, // Faster forced descent, same sinuous power3.inOut curve
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

    // Copy out: an elegant scrubbed dissolve in the LAST sliver of scroll-0
    // (last ~12%), finishing exactly at the hand-off. The copy therefore
    // survives to the final scroll-0 frame and only fades as scroll-1 begins
    // to take over - no early disappearance, no hard cut.
    scroll0TL.to(scroll0Copy, {
      opacity: 0,
      y: -24,
      duration: S0 * 0.12,
      stagger: S0 * 0.02
    }, S0 * 0.88);

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

});
