/* =====================================================
   KREA GLOBAL CONTRACT — Fullscreen Horizontal Timeline
   Timeline animation controller using GSAP + ScrollTrigger
===================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const sticky = document.getElementById("timelineSticky");
  const track = document.getElementById("timelineTrack");
  const prevBtn = document.getElementById("timelinePrev");
  const nextBtn = document.getElementById("timelineNext");
  const progressLine = document.getElementById("timelineProgressLine");
  const activeDot = document.getElementById("timelineActiveDot");
  const dotItems = document.querySelectorAll(".timeline-dot-item");
  const peekSliver = document.getElementById("peekSliver");
  const peekTexts = document.querySelectorAll(".peek-text");
  const panels = document.querySelectorAll(".timeline-panel");
  const navBar = document.querySelector(".timeline-nav-bar");
  
  if (!sticky || !track) return;

  let currentPanel = 0;
  const totalPanels = 4;
  let isAnimating = false;

  function updateTimelineUI(index) {
    // Update track position
    track.style.transform = `translateX(-${index * 25}%)`;

    // Update active panel class for scale animation
    panels.forEach((panel, i) => {
      if (i === index) {
        panel.classList.add("active-panel");
      } else {
        panel.classList.remove("active-panel");
      }
    });

    // Update nav bar dark mode
    if (navBar) {
      if (index === 0) {
        navBar.classList.remove("dark-mode");
      } else {
        navBar.classList.add("dark-mode");
      }
    }

    // Update progress line and active dot
    const progressPercent = (index / (totalPanels - 1)) * 100;
    if (progressLine) progressLine.style.width = `${progressPercent}%`;
    if (activeDot) activeDot.style.left = `${progressPercent}%`;

    // Update dot labels and nodes
    dotItems.forEach((item, i) => {
      const label = item.querySelector(".dot-label");
      const node = item.querySelector(".dot-node");
      if (i === index) {
        if (label) {
          label.style.color = "#ffffff";
          label.style.fontWeight = "700";
        }
        if (node) {
          node.style.width = "12px";
          node.style.height = "12px";
          node.style.backgroundColor = "var(--color-bg-warm)";
          node.style.borderColor = "rgba(255, 255, 255, 0.4)";
        }
      } else if (i < index) {
        if (label) {
          label.style.color = "rgba(255, 255, 255, 0.5)";
          label.style.fontWeight = "600";
        }
        if (node) {
          node.style.width = "8px";
          node.style.height = "8px";
          node.style.backgroundColor = "#4A2C6B";
          node.style.borderColor = "#4A2C6B";
        }
      } else {
        if (label) {
          label.style.color = "rgba(255, 255, 255, 0.7)";
          label.style.fontWeight = "600";
        }
        if (node) {
          node.style.width = "12px";
          node.style.height = "12px";
          node.style.backgroundColor = "var(--color-bg-warm)";
          node.style.borderColor = "rgba(255, 255, 255, 0.4)";
        }
      }
    });

    // Update Arrows
    if (prevBtn) {
      if (index === 0) {
        prevBtn.style.opacity = "0";
        prevBtn.style.pointerEvents = "none";
      } else {
        prevBtn.style.opacity = "1";
        prevBtn.style.pointerEvents = "auto";
      }
    }
    
    if (nextBtn) {
      if (index === totalPanels - 1) {
        nextBtn.style.opacity = "0";
        nextBtn.style.pointerEvents = "none";
      } else {
        nextBtn.style.opacity = "1";
        nextBtn.style.pointerEvents = "auto";
      }
    }

    // Update Peek Sliver
    if (peekSliver) {
      if (index === totalPanels - 1) {
        peekSliver.style.opacity = "0";
        peekSliver.style.pointerEvents = "none";
      } else {
        peekSliver.style.opacity = "1";
        peekSliver.style.pointerEvents = "auto";
        
        // Update peek text
        peekTexts.forEach(text => {
          text.style.opacity = "0";
          text.classList.remove("active");
        });
        
        let targetPeekClass = "";
        if (index === 0) targetPeekClass = ".peek-text--1999";
        else if (index === 1) targetPeekClass = ".peek-text--2006";
        else if (index === 2) targetPeekClass = ".peek-text--2026";
        
        if (targetPeekClass) {
          const activePeek = document.querySelector(targetPeekClass);
          if (activePeek) {
            activePeek.style.opacity = "0.75";
            activePeek.classList.add("active");
          }
        }
      }
    }
  }

  function goToPanel(index) {
    if (isAnimating || index < 0 || index >= totalPanels || index === currentPanel) return;
    
    isAnimating = true;
    currentPanel = index;
    updateTimelineUI(currentPanel);
    
    // Unlock animation after transition duration matches CSS (0.6s)
    setTimeout(() => {
      isAnimating = false;
    }, 600);
  }

  // Initial UI Setup
  updateTimelineUI(currentPanel);

  // Wheel Event for Swipe
  sticky.addEventListener("wheel", (e) => {
    // Prevent default only if we are swiping horizontally
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      e.preventDefault();
      
      if (!isAnimating) {
        if (e.deltaX > 30) {
          goToPanel(currentPanel + 1);
        } else if (e.deltaX < -30) {
          goToPanel(currentPanel - 1);
        }
      }
    }
  }, { passive: false });

  // Touch Events for Swipe
  let touchStartX = 0;
  let touchEndX = 0;
  let touchStartY = 0;
  let touchEndY = 0;

  sticky.addEventListener("touchstart", (e) => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
  }, { passive: true });

  sticky.addEventListener("touchend", (e) => {
    touchEndX = e.changedTouches[0].screenX;
    touchEndY = e.changedTouches[0].screenY;
    
    const diffX = touchStartX - touchEndX;
    const diffY = touchStartY - touchEndY;
    
    if (Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX > 50) {
        goToPanel(currentPanel + 1); // Swipe left -> next
      } else if (diffX < -50) {
        goToPanel(currentPanel - 1); // Swipe right -> prev
      }
    }
  }, { passive: true });

  // Click Handlers for Arrows
  if (prevBtn) {
    prevBtn.addEventListener("click", () => goToPanel(currentPanel - 1));
  }
  if (nextBtn) {
    nextBtn.addEventListener("click", () => goToPanel(currentPanel + 1));
  }

  // Click Handlers for Dots
  dotItems.forEach(item => {
    item.addEventListener("click", () => {
      const targetState = parseInt(item.getAttribute("data-state"), 10);
      goToPanel(targetState);
    });
  });
});
