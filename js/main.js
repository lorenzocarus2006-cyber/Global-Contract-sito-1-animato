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

  // Revisit state handling on load
  const whiteStage = document.getElementById("white-stage");
  const stageVideo = document.getElementById("stage-video");

  if (transitionDone) {
    if (whiteStage) {
      whiteStage.classList.add("transition-done");
    }
    if (stageVideo) {
      stageVideo.playbackRate = 1.4;
      stageVideo.addEventListener('loadedmetadata', () => {
        stageVideo.currentTime = stageVideo.duration - 0.01;
      });
      if (stageVideo.readyState >= 1) {
        stageVideo.currentTime = stageVideo.duration - 0.01;
      }
    }
  }

  if (scrollExploreBtn) {
    scrollExploreBtn.addEventListener('click', () => {
      // Mark transition done to prevent scroll locks
      sessionStorage.setItem("gc_hero_transition_done", "true");
      transitionDone = true;
      if (whiteStage) {
        whiteStage.classList.add("transition-done");
      }
      if (stageVideo) {
        stageVideo.playbackRate = 1.4;
        stageVideo.currentTime = stageVideo.duration - 0.01;
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
      scrollTrigger: {
        trigger: ".hero-section",
        start: "top top",
        end: () => `+=${window.innerHeight * 0.25}`, // 25% of viewport height
        scrub: true,
        pin: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      }
    });

    // Staggered panel exits
    const staggerDelay = 0.06;
    panels.forEach((panel, index) => {
      // Parallax: Panels exit upward. Speed difference by varying travel distance.
      heroExitTL.to(panel, {
        y: () => -window.innerHeight - 200 - (index * 50),
        ease: "power2.in"
      }, index * staggerDelay);
    });

    // Headline and scroll indicator exits
    heroExitTL.to(".hero-text-block", {
      y: () => -window.innerHeight * 0.8,
      opacity: 0,
      ease: "power2.in"
    }, 0);

    heroExitTL.to(".hero-bottom-block", {
      y: () => -window.innerHeight * 0.8,
      opacity: 0,
      ease: "power2.in"
    }, 0);

    // Empty space for 0.85 -> 1.0 (black stretch)
    // 6 * 0.06 + 1.0 = 1.36s. Total duration = 1.36 / 0.85 = 1.6s.
    // Remaining time = 0.24s.
    heroExitTL.to({}, { duration: 0.24 });

    heroScrollTrigger = heroExitTL.scrollTrigger;

    // Reset accordion if scroll starts
    ScrollTrigger.create({
      trigger: ".hero-section",
      start: "top top",
      end: () => `+=${window.innerHeight * 0.25}`,
      onUpdate: (self) => {
        if (self.progress > 0.01) {
          if (activeIndex !== null) {
            animateAccordionState(null);
          }
        }
      }
    });

    return () => {
      if (heroExitTL) heroExitTL.kill();
      heroScrollTrigger = null;
      heroExitTL = null;
      // Reset any transforms on elements
      panels.forEach(panel => gsap.set(panel, { y: 0 }));
      gsap.set(".hero-text-block", { y: 0, opacity: 1 });
      gsap.set(".hero-bottom-block", { y: 0, opacity: 1 });
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

    // Determine target position
    const targetScroll = heroScrollTrigger ? heroScrollTrigger.end : window.innerHeight * 0.25;

    const scrollObj = { y: window.scrollY };
    
    // Forced tween over ~3.2-3.8s (3.5s total)
    gsap.to(scrollObj, {
      y: targetScroll,
      duration: 3.5,
      ease: "power3.inOut",
      onUpdate: () => {
        window.scrollTo(0, scrollObj.y);
        lenis.scrollTo(scrollObj.y, { immediate: true });
        ScrollTrigger.update();
      },
      onComplete: () => {
        isTweening = false;

        // Play the building interior video at 1.4x playback rate
        if (stageVideo) {
          stageVideo.playbackRate = 1.4;
          stageVideo.play().catch(err => {
            console.warn("Autoplay block or loading error:", err);
          });

          // Setup freeze frame event listeners
          // 1. Ended event
          stageVideo.addEventListener('ended', freezeVideoAndUnlock);

          // 2. Timeupdate safety
          stageVideo.addEventListener('timeupdate', checkVideoTimeUpdate);
        }

        // Slide in video from off-screen right
        gsap.to(".stage-video-container", {
          opacity: 1,
          x: 0,
          duration: 1.1,
          ease: "power3.out"
        });

        // Staggered slide in copy block from left
        gsap.to([".stage-eyebrow", ".stage-headline", ".stage-sub"], {
          opacity: 1,
          x: 0,
          duration: 1.1,
          stagger: 0.12,
          ease: "power3.out"
        });

        // Set hard safety timeout to unlock scroll if video fails/blocks (5.5s max lock)
        unlockTimeout = setTimeout(() => {
          if (isStageLocked) {
            console.warn("Autoplay safety fallback timeout fired.");
            freezeVideoAndUnlock();
          }
        }, 5500);
      }
    });
  }

  function checkVideoTimeUpdate() {
    if (stageVideo && stageVideo.duration && stageVideo.currentTime >= stageVideo.duration - 0.05) {
      freezeVideoAndUnlock();
    }
  }

  function freezeVideoAndUnlock() {
    if (stageVideo) {
      stageVideo.removeEventListener('ended', freezeVideoAndUnlock);
      stageVideo.removeEventListener('timeupdate', checkVideoTimeUpdate);
      stageVideo.pause();
      if (stageVideo.duration) {
        stageVideo.currentTime = stageVideo.duration - 0.01;
      }
    }
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
