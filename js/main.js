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

  // Revisit state handling on load. We never write video.currentTime (forbidden
  // in this phase) - the video simply stays unplayed and shows its `poster`
  // attribute (the extracted final frame), which is visually identical to the
  // real freeze frame reached after a first-time playthrough.
  const whiteStage = document.getElementById("white-stage");
  const stageVideo = document.getElementById("stage-video");
  const heroRevealBg = document.getElementById("hero-reveal-bg");

  // Preload behind the curtain: kick off buffering immediately so the video
  // is ready to play instantly once the forced descent settles.
  if (stageVideo && !transitionDone) {
    stageVideo.load();
  }

  if (transitionDone) {
    if (whiteStage) {
      whiteStage.classList.add("transition-done");
    }
    // heroRevealBg color is left dark here on purpose: on reload scrollY is
    // always 0, so the hero must render pixel-identical to baseline until the
    // pinned ScrollTrigger's onUpdate (below) swaps it as the user scrolls in.
  }

  if (scrollExploreBtn) {
    scrollExploreBtn.addEventListener('click', () => {
      // Mark transition done to prevent scroll locks
      sessionStorage.setItem("gc_hero_transition_done", "true");
      transitionDone = true;
      if (whiteStage) {
        whiteStage.classList.add("transition-done");
      }
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

  mm.add("(min-width: 769px)", () => {
    // 1. Initialize Pinned Timeline & ScrollTrigger
    heroExitTL = gsap.timeline({
      defaults: { duration: 1, ease: "power2.inOut" },
      scrollTrigger: {
        trigger: ".hero-section",
        start: "top top",
        end: () => `+=${window.innerHeight * 0.25}`, // 25% of viewport height
        scrub: true,
        pin: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        // Reset accordion if scroll starts + swap the reveal layer to the
        // unified stage color the instant descent begins (instant, no
        // transition, so the swap is invisible behind the still-covering
        // panels). Lives on this trigger (not a separate one) because a
        // second ScrollTrigger sharing the same trigger/start/end never
        // receives onUpdate once this one has pinned the section.
        onUpdate: (self) => {
          if (self.progress > 0.001) {
            if (activeIndex !== null) {
              animateAccordionState(null);
            }
            if (heroRevealBg) heroRevealBg.classList.add("revealed");
            if (gallery) gallery.classList.add("revealed");
          } else {
            if (heroRevealBg) heroRevealBg.classList.remove("revealed");
            if (gallery) gallery.classList.remove("revealed");
          }
        }
      }
    });

    // Staggered panel exits - wide stagger + long soft travel for a majestic,
    // weighty ascent (tuning point #1)
    const staggerDelay = 0.13;
    panels.forEach((panel, index) => {
      // Parallax: Panels exit upward. Speed difference by varying travel distance.
      heroExitTL.to(panel, {
        y: () => -window.innerHeight - 320 - (index * 70),
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

    // Landing stretch: dwell in the unified stage color once panels are clear
    heroExitTL.to({}, { duration: 0.6 });

    heroScrollTrigger = heroExitTL.scrollTrigger;

    return () => {
      if (heroExitTL) heroExitTL.kill();
      heroScrollTrigger = null;
      heroExitTL = null;
      // Reset any transforms on elements
      panels.forEach(panel => gsap.set(panel, { y: 0 }));
      gsap.set(".hero-text-block", { y: 0, opacity: 1 });
      gsap.set(".hero-bottom-block", { y: 0, opacity: 1 });
      if (heroRevealBg) heroRevealBg.classList.remove("revealed");
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

    // Target the white stage itself (not just the end of the pin range) so
    // it fully fills the viewport once settled - the pin's scrub timeline
    // reaches progress 1 well before we get there, so panels are already
    // fully exited and the unified color is already showing for the rest
    // of the ride.
    const targetScroll = whiteStage
      ? whiteStage.getBoundingClientRect().top + window.scrollY
      : (heroScrollTrigger ? heroScrollTrigger.end : window.innerHeight * 0.25);

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

  // Sequential labels synced to the video's ACTUAL playback time (reading
  // currentTime only - writing it is forbidden in this phase). Reference:
  // vaulk.com hero, each line pops in exactly when that part of the object
  // takes shape.
  const LABEL_TIMINGS = { headline: 1.3, sub: 2.8 };
  let headlineShown = false;
  let subShown = false;

  function showHeadline() {
    if (headlineShown) return;
    headlineShown = true;
    gsap.to(".stage-headline", { opacity: 1, x: 0, duration: 0.7, ease: "power3.out" });
  }

  function showSub() {
    if (subShown) return;
    subShown = true;
    gsap.to(".stage-sub", { opacity: 1, x: 0, duration: 0.7, ease: "power3.out" });
  }

  function handleLabelSync() {
    if (stageVideo.currentTime >= LABEL_TIMINGS.headline) showHeadline();
    if (stageVideo.currentTime >= LABEL_TIMINGS.sub) showSub();
    if (stageVideo.duration && stageVideo.currentTime >= stageVideo.duration - 0.05) {
      freezeVideoAndUnlock();
    }
  }

  function startBuildSequence() {
    // Video enters from off-screen right and starts building immediately -
    // no dead frozen frame before playback.
    gsap.to(".stage-video-container", {
      opacity: 1,
      x: 0,
      duration: 1.0,
      ease: "power3.out"
    });

    // t=0.0 - bare floor slab visible
    gsap.to(".stage-eyebrow", { opacity: 1, x: 0, duration: 0.7, ease: "power3.out" });

    if (stageVideo) {
      stageVideo.addEventListener('ended', freezeVideoAndUnlock);
      stageVideo.addEventListener('timeupdate', handleLabelSync);
      stageVideo.play().catch(err => {
        console.warn("Autoplay block or loading error:", err);
      });
    }

    // Hard safety cap: never leave the user locked if the video fails to
    // load/play (~5s max lock)
    unlockTimeout = setTimeout(() => {
      if (isStageLocked) {
        console.warn("Video lock safety fallback timeout fired.");
        freezeVideoAndUnlock();
      }
    }, 5000);
  }

  function freezeVideoAndUnlock() {
    if (stageVideo) {
      stageVideo.removeEventListener('ended', freezeVideoAndUnlock);
      stageVideo.removeEventListener('timeupdate', handleLabelSync);
      stageVideo.pause();
    }
    // Failsafe: if the video never played far enough to trigger a label,
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

    if (whiteStage) {
      whiteStage.classList.add("transition-done");
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
