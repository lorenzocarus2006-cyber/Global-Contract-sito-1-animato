/*
  Stats / "Numeri" mini-section controller.
  Two jobs, both ScrollTrigger-driven:
   1) Cross-fade the fixed cream backdrop (#stats-bg) as .stats-section passes
      through the viewport, so the whole PAGE background reads as turning cream
      then back to black — a trapezoid opacity curve (ramp in, hold, ramp out).
   2) Fly the three .stat-card boxes in with a staggered entrance the first
      time the section reaches the viewport.
  Desktop and mobile both run; on reduced motion we just show everything.
*/

document.addEventListener("DOMContentLoaded", () => {
  if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") return;
  gsap.registerPlugin(ScrollTrigger);

  const section = document.querySelector(".stats-section");
  const bg = document.getElementById("stats-bg");
  const cards = gsap.utils.toArray(".stats-section .stat-card");
  if (!section || !bg) return;

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const numEls = gsap.utils.toArray(".stats-section .stat-num-value");
  const setNum = (el, v) => { el.textContent = String(Math.round(v)); };

  if (reduce) {
    gsap.set(bg, { opacity: 1 });
    cards.forEach((c) => gsap.set(c, { opacity: 1, clearProps: "transform" }));
    numEls.forEach((el) => setNum(el, parseFloat(el.dataset.target) || 0));
    return;
  }

  // --- 1) Backdrop cross-fade (page background turns cream, then back) ---
  // Progress 0 -> 1 spans the section fully entering to fully leaving.
  // Opacity trapezoid: fade in over the first RAMP, hold, fade out over the
  // last RAMP. Clamp keeps it flat at 1 in the middle.
  const RAMP = 0.28;
  const clamp01 = (v) => Math.max(0, Math.min(1, v));

  ScrollTrigger.create({
    trigger: section,
    start: "top bottom",   // section top hits viewport bottom -> begin fade in
    end: "bottom top",     // section bottom leaves viewport top -> fully faded out
    scrub: true,
    onUpdate: (self) => {
      const p = self.progress;
      const fadeIn = clamp01(p / RAMP);
      const fadeOut = clamp01((1 - p) / RAMP);
      bg.style.opacity = String(Math.min(fadeIn, fadeOut));
    },
  });

  // --- 2) Staggered card fly-in (once, on first reveal) ---
  // fromTo with clearProps:"transform" so no inline transform lingers to block
  // the CSS :hover lift. opacity stays inline at 1 (not cleared) -> no re-hide.
  gsap.fromTo(
    cards,
    { opacity: 0, y: 40, scale: 0.96 },
    {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 1.1,
      ease: "power3.out",
      stagger: 0.14,
      clearProps: "transform",
      scrollTrigger: {
        trigger: section,
        start: "top 78%",
        toggleActions: "play none none none",
      },
    }
  );

  // --- 3) Count-up: numbers tick 0 -> target, once, linear ~1.2s ---
  numEls.forEach((el) => setNum(el, 0));
  ScrollTrigger.create({
    trigger: section,
    start: "top 78%",
    once: true,
    onEnter: () => {
      numEls.forEach((el) => {
        const target = parseFloat(el.dataset.target) || 0;
        const obj = { v: 0 };
        gsap.to(obj, {
          v: target,
          duration: 1.2,
          ease: "none",
          onUpdate: () => setNum(el, obj.v),
        });
      });
    },
  });

  // Heading block: gentle rise-in alongside the cards.
  const headEls = gsap.utils.toArray(
    ".stats-eyebrow, .stats-title, .stats-sub"
  );
  gsap.from(headEls, {
    opacity: 0,
    y: 26,
    duration: 1,
    ease: "power3.out",
    stagger: 0.1,
    scrollTrigger: {
      trigger: section,
      start: "top 82%",
      toggleActions: "play none none none",
    },
  });
});
