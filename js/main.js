/* 
  Global Contract (Krea S.r.l.) - Premium Hero Animations & Controls
  GSAP + Lenis integration with smooth vertical accordion logic
*/

document.addEventListener("DOMContentLoaded", () => {
  
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
  if (scrollExploreBtn) {
    scrollExploreBtn.addEventListener('click', () => {
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
      }
    });

    // Fade out and slide loader upwards
    tl.to("#loader", {
      yPercent: -100,
      duration: 1.2,
      ease: "power4.inOut"
    });

    // Bring in Nav Logo & Menu
    tl.from("#nav-logo", {
      y: -30,
      opacity: 0,
      duration: 1.0,
      ease: "power3.out"
    }, "-=0.6");

    tl.from(".nav-item", {
      y: -20,
      opacity: 0,
      duration: 0.8,
      stagger: 0.08,
      ease: "power3.out"
    }, "-=0.8");

    tl.from("#nav-actions", {
      x: 30,
      opacity: 0,
      duration: 0.8,
      ease: "power3.out"
    }, "-=0.8");

    // Reveal Headline Title
    tl.from(".hero-title", {
      y: 40,
      opacity: 0,
      duration: 1.2,
      ease: "power4.out"
    }, "-=0.8");

    // Reveal Subtitle
    tl.from(".hero-subtitle", {
      y: 30,
      opacity: 0,
      duration: 1.0,
      ease: "power3.out"
    }, "-=1.0");

    // Reveal Mouse Scroll indicator
    tl.from(".scroll-explore", {
      y: 20,
      opacity: 0,
      duration: 0.8,
      ease: "power3.out"
    }, "-=0.8");
  }


  /* -----------------------------------------
     4. ACCORDION PANELS GALLERY LOGIC
     ----------------------------------------- */
  const gallery = document.getElementById('gallery-container');
  const panels = gsap.utils.toArray('.sector-panel');
  
  // Detect touch device
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  // Set initial sizes: all 7 panels EQUAL width on-load
  panels.forEach((panel) => {
    gsap.set(panel, {
      flexGrow: 1,
      flexBasis: 0
    });
    
    const body = panel.querySelector('.panel-body');
    panel.classList.remove('active');
    gsap.set(body, { opacity: 0, y: 20 });
  });

  let hoverTimeout = null;
  let activeIndex = null;

  // Master expansion function
  function animateAccordionState(targetIndex) {
    activeIndex = targetIndex;
    
    panels.forEach((panel, idx) => {
      const isActive = idx === targetIndex;
      const isGalleryReset = targetIndex === null;
      
      // If targetIndex is null, all panels go to 1.
      // If a panel is active, it goes to 4.6. Others go to 0.4.
      const targetGrow = isGalleryReset ? 1 : (isActive ? 4.6 : 0.4);
      const body = panel.querySelector('.panel-body');
      
      // Animate Flex-Grow with slower architectural ease (0.8s, power2.inOut)
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

  // Register interactions based on device capabilities
  if (!isTouchDevice) {
    // Desktop: Hover with Intent
    panels.forEach((panel, idx) => {
      panel.addEventListener('mouseenter', () => {
        // Clear any pending transition
        if (hoverTimeout) clearTimeout(hoverTimeout);
        
        // Wait 100ms before initiating the hover expansion
        hoverTimeout = setTimeout(() => {
          if (activeIndex !== idx) {
            animateAccordionState(idx);
          }
        }, 100);
      });
      
      // Keyboard focus support
      panel.addEventListener('focus', () => {
        if (hoverTimeout) clearTimeout(hoverTimeout);
        animateAccordionState(idx);
      });
    });

    // Reset when mouse leaves the entire gallery area
    gallery.addEventListener('mouseleave', () => {
      if (hoverTimeout) clearTimeout(hoverTimeout);
      animateAccordionState(null);
    });
  } else {
    // Mobile/Touch: Tap-to-expand Fallback
    panels.forEach((panel, idx) => {
      panel.addEventListener('click', (e) => {
        // If panel is already active, let the link click go through
        if (panel.classList.contains('active')) {
          return;
        }
        
        e.preventDefault();
        animateAccordionState(idx);
      });
    });
  }

  // Make the entire panel clickable to navigate
  panels.forEach((panel) => {
    panel.addEventListener('click', (e) => {
      if (panel.classList.contains('active')) {
        const sectorName = panel.querySelector('.panel-label').innerText.replace(/\n/g, ' ');
        console.log(`Navigating to sector: ${sectorName}`);
      }
    });
  });

});
