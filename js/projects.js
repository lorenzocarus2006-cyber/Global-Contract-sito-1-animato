/**
 * Projects Showroom Page Scripts
 * Handles Lenis smooth scroll initialization, URL search params filtering,
 * and fluid GSAP staggered grid sorting animations.
 */

document.addEventListener("DOMContentLoaded", () => {
  // Initialize Lenis Smooth Scroll
  const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    gestureOrientation: "vertical"
  });

  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);

  // Set initial scroll trigger refresh on resize
  window.addEventListener('resize', () => {
    ScrollTrigger.refresh();
  });

  // Filtering Logic
  const filterBtns = document.querySelectorAll(".filter-btn");
  const projectCards = document.querySelectorAll(".project-card");

  function filterProjects(category, isInitial = false) {
    // 1. Update filter buttons active states
    filterBtns.forEach(btn => {
      if (btn.getAttribute("data-filter") === category) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

    // 2. Select target elements
    const toShow = [];
    const toHide = [];

    projectCards.forEach(card => {
      const cardCategory = card.getAttribute("data-category");
      if (category === "all" || cardCategory === category) {
        toShow.push(card);
      } else {
        toHide.push(card);
      }
    });

    // 3. Animate transition
    if (isInitial) {
      // Immediate load state, no out-animation
      toHide.forEach(card => {
        card.style.display = "none";
        gsap.set(card, { opacity: 0, y: 30, scale: 0.98 });
      });
      toShow.forEach(card => {
        card.style.display = "flex";
        gsap.set(card, { opacity: 1, y: 0, scale: 1 });
      });
      // Trigger scroll refresh to recalculate page height for Lenis
      ScrollTrigger.refresh();
    } else {
      // Smooth interactive transition
      const tl = gsap.timeline({
        onComplete: () => {
          ScrollTrigger.refresh();
          lenis.resize();
        }
      });

      if (toHide.length > 0) {
        tl.to(toHide, {
          opacity: 0,
          y: 20,
          scale: 0.98,
          duration: 0.25,
          ease: "power2.inOut",
          onComplete: () => {
            toHide.forEach(card => card.style.display = "none");
          }
        });
      }

      tl.call(() => {
        toShow.forEach(card => {
          card.style.display = "flex";
        });
      });

      tl.fromTo(toShow,
        { opacity: 0, y: 30, scale: 0.98 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.45,
          stagger: 0.05,
          ease: "power3.out"
        },
        "+=0.05"
      );
    }
  }

  // Handle URL Query Params
  const urlParams = new URLSearchParams(window.location.search);
  const categoryParam = urlParams.get("category");
  const validCategories = [
    "bar-restaurants",
    "hotels",
    "gelaterie-pasticcerie",
    "salumerie-panifici",
    "farmacie-parafarmacie",
    "tabacchi",
    "commercial-spaces"
  ];

  let initialCategory = "all";
  if (categoryParam && validCategories.includes(categoryParam)) {
    initialCategory = categoryParam;
  }

  // Filter immediately on load
  filterProjects(initialCategory, true);

  // Bind Click Listeners on Filter Buttons
  filterBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const selectedCategory = btn.getAttribute("data-filter");
      
      // Update URL query parameter without page reload
      const newUrl = new URL(window.location.href);
      if (selectedCategory === "all") {
        newUrl.searchParams.delete("category");
      } else {
        newUrl.searchParams.set("category", selectedCategory);
      }
      window.history.pushState({ path: newUrl.href }, "", newUrl.href);

      // Perform smooth filter animation
      filterProjects(selectedCategory, false);
    });
  });

  // Handle browser back/forward buttons (popstate)
  window.addEventListener("popstate", () => {
    const activeParams = new URLSearchParams(window.location.search);
    const activeCategory = activeParams.get("category") || "all";
    filterProjects(activeCategory, false);
  });
});
