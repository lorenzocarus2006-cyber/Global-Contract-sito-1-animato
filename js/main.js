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
