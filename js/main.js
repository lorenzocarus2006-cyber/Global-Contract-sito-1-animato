/* 
  Global Contract (Krea S.r.l.) - Premium Hero Animations & Controls
  GSAP + Lenis integration with smooth vertical accordion logic
*/

document.addEventListener("DOMContentLoaded", () => {
  
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

  // Scroll explore button interaction
  const scrollExploreBtn = document.getElementById('scroll-explore');
  let transitionDone = sessionStorage.getItem("gc_hero_transition_done") === "true";
  let isStageLocked = false;
  let isTweening = false;
  let unlockTimeout = null;

  // Revisit state handling on load.
  const buildStage = document.getElementById("build-stage");
  const buildCanvas = document.getElementById("build-canvas");
  const buildCtx = buildCanvas ? buildCanvas.getContext("2d") : null;

  /* -----------------------------------------
     FRAME SEQUENCE PRELOAD (behind the curtain)
     ----------------------------------------- */
  const SEQ_FRAME_COUNT = 121;
  const SEQ_DURATION = 5.0; // seconds, matches the retimed source clip
  const seqFrames = [];
  let seqLoadedCount = 0;
  let seqReady = false;

  function seqFramePath(i) {
    const n = String(i + 1).padStart(4, "0");
    return `./assets/hero/build_seq/frame_${n}.webp`;
  }

  // Guaranteed-loadable failsafe: a single small JPG of the final frame,
  // shown if the full sequence isn't ready in time.
  const posterImg = new Image();
  posterImg.src = "./assets/hero/build_final_poster.jpg";

  if (buildCtx) {
    for (let i = 0; i < SEQ_FRAME_COUNT; i++) {
      const img = new Image();
      img.onload = () => {
        seqLoadedCount++;
        if (seqLoadedCount >= SEQ_FRAME_COUNT) {
          seqReady = true;
        }
      };
      img.onerror = () => {
        seqLoadedCount++;
        if (seqLoadedCount >= SEQ_FRAME_COUNT) {
          seqReady = true;
        }
      };
      img.src = seqFramePath(i);
      seqFrames.push(img);
    }
  }

  function drawSeqFrame(index) {
    if (!buildCtx) return;
    const clamped = Math.max(0, Math.min(SEQ_FRAME_COUNT - 1, index));
    const img = seqFrames[clamped];
    buildCtx.clearRect(0, 0, buildCanvas.width, buildCanvas.height);
    if (img && img.complete && img.naturalWidth > 0) {
      buildCtx.drawImage(img, 0, 0, buildCanvas.width, buildCanvas.height);
    } else if (posterImg.complete && posterImg.naturalWidth > 0) {
      buildCtx.drawImage(posterImg, 0, 0, buildCanvas.width, buildCanvas.height);
    }
  }

  if (transitionDone) {
    if (buildStage) {
      buildStage.classList.add("transition-done");
    }
    // Draw the final frame once frames are available - no animation, no lock.
    // Falls back to the poster after a short wait if the sequence never
    // loads, so a revisit is never left blank.
    const revisitDeadline = Date.now() + 4000;
    const drawFinalWhenReady = () => {
      if (seqReady || Date.now() > revisitDeadline) {
        drawSeqFrame(SEQ_FRAME_COUNT - 1);
      } else {
        requestAnimationFrame(drawFinalWhenReady);
      }
    };
    drawFinalWhenReady();
  }

  if (scrollExploreBtn) {
    scrollExploreBtn.addEventListener('click', () => {
      // Mark transition done to prevent scroll locks
      sessionStorage.setItem("gc_hero_transition_done", "true");
      transitionDone = true;
      if (buildStage) {
        buildStage.classList.add("transition-done");
      }
      drawSeqFrame(SEQ_FRAME_COUNT - 1);
      isStageLocked = false;
      isTweening = false;
      clearTimeout(unlockTimeout);
      lenis.start();
      lenis.scrollTo('#dettagli', {
        duration: 1.4,
        ease: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
      });
    });
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
  });


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
  const progressBar = document.querySelector('.loader-progress-bar');
  const percentageVal = document.querySelector('.loader-percentage');

  function updateProgress() {
    loadedCount++;
    const progress = Math.round((loadedCount / totalImages) * 100);
    
    // Animate progress bar and text smoothly
    gsap.to(progressBar, {
      width: `${progress}%`,
      duration: 0.4,
      ease: "power2.out"
    });
    
    percentageVal.textContent = `${progress}%`;

    if (loadedCount >= totalImages) {
      // Small buffer delay for visual polish
      setTimeout(runEntranceAnimations, 600);
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

    // Fade out loader content
    tl.to(".loader-content", {
      opacity: 0,
      duration: 0.4,
      ease: "power2.out"
    });

    // Show the hairline seam
    tl.to(".curtain-seam", {
      opacity: 1,
      duration: 0.3,
      ease: "power2.out"
    }, "-=0.2");

    // Split the curtains
    tl.to(".curtain-left", {
      xPercent: -100,
      duration: 1.2,
      ease: "power3.inOut"
    }, "+=0.1");

    tl.to(".curtain-right", {
      xPercent: 100,
      duration: 1.2,
      ease: "power3.inOut"
    }, "<");

    tl.to(".curtain-seam", {
      opacity: 0,
      duration: 0.3,
      ease: "power3.inOut"
    }, "<");
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

      // Clean inline styles
      gsap.set(panel, { flexGrow: 1, flexBasis: 0 });
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
      activeIndex = null;
      
      // Set initial desktop state
      panels.forEach((panel) => {
        const body = panel.querySelector('.panel-body');
        gsap.set(body, { opacity: 0, y: 20 });
      });

      // Register interactions based on touch/mouse
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      if (!isTouchDevice) {
        // Desktop: Hover with Intent
        panels.forEach((panel, idx) => {
          const enterHandler = () => {
            if (window.scrollY > 5) return; // Ignore hover if scrolled down
            if (hoverTimeout) clearTimeout(hoverTimeout);
            hoverTimeout = setTimeout(() => {
              if (activeIndex !== idx) {
                animateAccordionState(idx);
              }
            }, 100);
          };
          panel._enterHandler = enterHandler;
          panel.addEventListener('mouseenter', enterHandler);
          
          const focusHandler = () => {
            if (window.scrollY > 5) return; // Ignore focus if scrolled down
            if (hoverTimeout) clearTimeout(hoverTimeout);
            animateAccordionState(idx);
          };
          panel._focusHandler = focusHandler;
          panel.addEventListener('focus', focusHandler);
        });

        // Reset when mouse leaves the entire gallery area
        const leaveHandler = () => {
          if (hoverTimeout) clearTimeout(hoverTimeout);
          animateAccordionState(null);
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
    panels.forEach((panel, idx) => {
      const isActive = idx === targetIndex;
      const targetGrow = isActive ? 5.8 : 1.0;
      
      gsap.to(panel, {
        flexGrow: targetGrow,
        duration: 0.6,
        ease: "power2.out",
        overwrite: "auto"
      });

      const desc = panel.querySelector('.panel-description');
      const cta = panel.querySelector('.panel-cta');

      if (isActive) {
        panel.classList.add('active');
        if (desc && cta) {
          gsap.fromTo([desc, cta], 
            { opacity: 0, y: 10 },
            { opacity: 1, y: 0, duration: 0.4, ease: "power2.out", overwrite: "auto", delay: 0.1 }
          );
        }
      } else {
        panel.classList.remove('active');
        if (desc && cta) {
          gsap.set([desc, cta], { opacity: 0, y: 10 });
        }
      }
    });
  }

  function animateAccordionState(targetIndex) {
    activeIndex = targetIndex;
    
    panels.forEach((panel, idx) => {
      const isActive = idx === targetIndex;
      const isGalleryReset = targetIndex === null;
      const targetGrow = isGalleryReset ? 1 : (isActive ? 4.6 : 0.4);
      const body = panel.querySelector('.panel-body');
      
      gsap.to(panel, {
        flexGrow: targetGrow,
        duration: 0.8,
        ease: "power2.inOut",
        overwrite: "auto"
      });

      if (isActive) {
        panel.classList.add('active');
        gsap.to(body, {
          opacity: 1,
          y: 0,
          duration: 0.7,
          delay: 0.05,
          ease: "power2.inOut",
          overwrite: "auto"
        });
      } else {
        panel.classList.remove('active');
        gsap.to(body, {
          opacity: 0,
          y: 20,
          duration: 0.5,
          ease: "power2.inOut",
          overwrite: "auto"
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
        const sectorName = panel.querySelector('.panel-label').innerText.replace(/\n/g, ' ');
        console.log(`Navigating to sector: ${sectorName}`);
      }
    });
  });


  /* -----------------------------------------
     5. DESKTOP-ONLY PINNED SCROLL & FORCED ASCENT
     ----------------------------------------- */
  let heroScrollTrigger = null;
  let heroExitTL = null;
  let touchStartY = 0;

  const mm = gsap.matchMedia();

  // Pin range is SHORT (~30vh of scroll travel) - the build stage lives
  // inside this same pinned box, so no extra scroll distance is needed to
  // reach it; the forced tween below rides this exact range.
  const PIN_VH_FRACTION = 0.3;

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
        // Reset the hover accordion once descent actually starts, and make
        // the gallery container's own background transparent so it stops
        // blocking the build stage sitting behind it at a lower z-index
        // (the container's box never moves, only its child panels do).
        onUpdate: (self) => {
          if (self.progress > 0.001) {
            if (activeIndex !== null) {
              animateAccordionState(null);
            }
            if (gallery) gallery.classList.add("revealed");
          } else if (gallery) {
            gallery.classList.remove("revealed");
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
    const staggerDelay = 0.12;
    const panelTravelDuration = 3.4;
    panels.forEach((panel, index) => {
      // Parallax: Panels exit upward. Speed difference by varying travel distance.
      heroExitTL.to(panel, {
        y: () => -window.innerHeight - 320 - (index * 70),
        duration: panelTravelDuration,
      }, index * staggerDelay);
    });

    // Headline and scroll indicator exits
    heroExitTL.to(".hero-text-block", {
      y: () => -window.innerHeight * 0.8,
      opacity: 0,
    }, 0);

    heroExitTL.to(".hero-bottom-block", {
      y: () => -window.innerHeight * 0.8,
      opacity: 0,
    }, 0);

    // Landing stretch: brief dwell once the last panel clears, right before
    // the pin range ends (positioned explicitly so it lands after the last
    // panel's travel instead of GSAP's implicit "end of previous add" which
    // undercounted the staggered panels).
    const lastPanelEnd = (panels.length - 1) * staggerDelay + panelTravelDuration;
    heroExitTL.to({}, { duration: 0.08 }, lastPanelEnd);

    heroScrollTrigger = heroExitTL.scrollTrigger;

    return () => {
      if (heroExitTL) heroExitTL.kill();
      heroScrollTrigger = null;
      heroExitTL = null;
      // Reset any transforms on elements
      panels.forEach(panel => gsap.set(panel, { y: 0 }));
      gsap.set(".hero-text-block", { y: 0, opacity: 1 });
      gsap.set(".hero-bottom-block", { y: 0, opacity: 1 });
      if (gallery) gallery.classList.remove("revealed");
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
    if (transitionDone) return;

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
      runForcedScrollTween();
    }
  }

  function runForcedScrollTween() {
    if (isTweening || transitionDone) return;

    isTweening = true;
    isStageLocked = true;
    lenis.stop();

    // Target the (short) end of the pin range - the build stage lives inside
    // this same pinned box, so settling here already fills the viewport with
    // it. No extra scroll distance needed.
    const targetScroll = heroScrollTrigger ? heroScrollTrigger.end : window.innerHeight * PIN_VH_FRACTION;

    const scrollObj = { y: window.scrollY };

    // Majestic descent: ~4.2s total, power3.inOut (tuning point #1)
    gsap.to(scrollObj, {
      y: targetScroll,
      duration: 4.2,
      ease: "power3.inOut",
      onUpdate: () => {
        window.scrollTo(0, scrollObj.y);
        lenis.scrollTo(scrollObj.y, { immediate: true });
        ScrollTrigger.update();
      },
      onComplete: () => {
        isTweening = false;
        startBuildSequence();
      }
    });
  }

  // Sequential labels synced to the sequence's ACTUAL elapsed playback time
  // (a plain rAF-driven canvas player, no video element, so there is no
  // currentTime to read or write). Reference: vaulk.com hero, each line pops
  // in exactly when that part of the object takes shape.
  const LABEL_TIMINGS = { headline: 1.6, sub: 3.4 };
  let headlineShown = false;
  let subShown = false;
  let seqRafId = null;
  let seqStartTime = null;

  function showHeadline() {
    if (headlineShown) return;
    headlineShown = true;
    gsap.to(".build-headline", { opacity: 1, x: 0, duration: 0.7, ease: "power3.out" });
  }

  function showSub() {
    if (subShown) return;
    subShown = true;
    gsap.to(".build-sub", { opacity: 1, x: 0, duration: 0.7, ease: "power3.out" });
  }

  function seqTick(now) {
    if (seqStartTime === null) seqStartTime = now;
    const elapsed = (now - seqStartTime) / 1000;

    if (elapsed >= LABEL_TIMINGS.headline) showHeadline();
    if (elapsed >= LABEL_TIMINGS.sub) showSub();

    if (elapsed >= SEQ_DURATION) {
      drawSeqFrame(SEQ_FRAME_COUNT - 1);
      finishBuildSequence();
      return;
    }

    const frameIndex = Math.floor((elapsed / SEQ_DURATION) * SEQ_FRAME_COUNT);
    drawSeqFrame(frameIndex);
    seqRafId = requestAnimationFrame(seqTick);
  }

  function startBuildSequence() {
    // Canvas object enters from off-screen right and starts building
    // immediately - no dead frozen frame before playback.
    gsap.to(".build-canvas-container", {
      opacity: 1,
      x: 0,
      duration: 1.0,
      ease: "power3.out"
    });

    // t=0.0 - bare floor slab visible
    gsap.to(".build-eyebrow", { opacity: 1, x: 0, duration: 0.7, ease: "power3.out" });

    seqStartTime = null;
    if (seqRafId) cancelAnimationFrame(seqRafId);
    seqRafId = requestAnimationFrame(seqTick);

    // Hard safety cap: never leave the user locked if the sequence isn't
    // ready/decoded in time (~6s max lock)
    unlockTimeout = setTimeout(() => {
      if (isStageLocked) {
        console.warn("Build sequence lock safety fallback timeout fired.");
        drawSeqFrame(SEQ_FRAME_COUNT - 1);
        finishBuildSequence();
      }
    }, 6000);
  }

  function finishBuildSequence() {
    if (seqRafId) {
      cancelAnimationFrame(seqRafId);
      seqRafId = null;
    }
    // Failsafe: if the sequence ended before reaching a label's timing,
    // reveal it anyway so the copy is never left missing.
    showHeadline();
    showSub();
    unlockStage();
  }

  function unlockStage() {
    if (!isStageLocked) return;
    isStageLocked = false;
    isTweening = false;
    clearTimeout(unlockTimeout);

    lenis.start();
    transitionDone = true;
    sessionStorage.setItem("gc_hero_transition_done", "true");

    if (buildStage) {
      buildStage.classList.add("transition-done");
    }
    console.log("Stage building complete. Page unlocked.");
  }

  // Register listeners with passive: false so we can preventDefault
  window.addEventListener('wheel', handleForcedScroll, { passive: false });
  window.addEventListener('touchmove', handleForcedScroll, { passive: false });
  window.addEventListener('keydown', handleForcedScroll, { passive: false });

  // Block inputs during tweening and stage lock
  function blockInput(e) {
    if (isTweening || isStageLocked) {
      e.preventDefault();
    }
  }
  window.addEventListener('wheel', blockInput, { passive: false });
  window.addEventListener('touchmove', blockInput, { passive: false });
  window.addEventListener('keydown', (e) => {
    if (isTweening || isStageLocked) {
      const keys = ['ArrowDown', 'PageDown', 'ArrowUp', 'PageUp', ' ', 'Spacebar', 'Home', 'End'];
      if (keys.includes(e.key)) {
        e.preventDefault();
      }
    }
  }, { passive: false });

});
