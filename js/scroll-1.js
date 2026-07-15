/*
  Scroll 1 - physical cutout object travelling right -> left.
  Rendered in the .reveal-layer overlay INSIDE the pinned #build-stage:
  main.js's merged ScrollTrigger drives it via window.__scroll1Render, so
  the hand-off from scroll-0 happens in place with zero page travel.
  Transparent webp cutouts on black, same 1440x805 canvas as Scroll 0.
*/

document.addEventListener("DOMContentLoaded", () => {
  if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") return;
  gsap.registerPlugin(ScrollTrigger);

  const layer = document.getElementById("reveal-layer");
  const content = layer && layer.querySelector(".reveal-layer-content");
  const slot = document.getElementById("reveal-object-slot");
  const canvas = document.getElementById("reveal-canvas");
  if (!layer || !content || !slot || !canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const FRAME_COUNT = 116;
  const FRAME_CACHE_BUST = "v=4";
  const frames = [];
  let lastDrawn = -1;
  let pendingFrame = null;

  function framePath(i) {
    return `./assets/animations/scroll-1/webp/frame_${String(i).padStart(3, "0")}.webp?${FRAME_CACHE_BUST}`;
  }

  function drawFrame(index) {
    const clamped = Math.max(0, Math.min(FRAME_COUNT - 1, index));
    const img = frames[clamped];
    if (img && img.complete && img.naturalWidth > 0) {
      if (clamped === lastDrawn) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      lastDrawn = clamped;
      pendingFrame = null;
    } else {
      pendingFrame = clamped;
    }
  }

  for (let i = 0; i < FRAME_COUNT; i++) {
    const img = new Image();
    const settled = () => {
      if (pendingFrame === i) drawFrame(i);
    };
    img.onload = settled;
    img.onerror = settled;
    img.src = framePath(i);
    frames.push(img);
  }

  if (frames[0].complete) drawFrame(0);
  else frames[0].addEventListener("load", () => drawFrame(0), { once: true });

  const clamp01 = (v) => Math.max(0, Math.min(1, v));
  const COPY_START = 0.62;
  const COPY_END = 0.86;
  // Copy fades back out in the last sliver of the phase, finishing right at
  // the scroll-1 -> scroll-2 hand-off: the text stays through the final
  // scroll-1 frame, then dissolves elegantly as scroll-2 begins.
  const COPY_OUT_START = 0.9;
  const COPY_OUT_END = 1.0;
  const copyEls = [
    layer.querySelector(".reveal-eyebrow"),
    layer.querySelector(".reveal-headline"),
    layer.querySelector(".reveal-sub"),
  ].filter(Boolean);

  // Horizontal travel: one full column width (right -> left), matching the
  // gap between Scroll 0's copy column and canvas column.
  function travelDistance() {
    return content.offsetWidth * 0.5;
  }

  function render(progress) {
    drawFrame(Math.round(progress * (FRAME_COUNT - 1)));

    const x = -travelDistance() * progress;
    gsap.set(slot, { x, yPercent: -50 });

    const c = clamp01((progress - COPY_START) / (COPY_END - COPY_START));
    const out = clamp01((progress - COPY_OUT_START) / (COPY_OUT_END - COPY_OUT_START));
    copyEls.forEach((el, idx) => {
      const staggered = clamp01(c - idx * 0.07);
      const staggeredOut = clamp01(out - idx * 0.07);
      const op = staggered * (1 - staggeredOut);
      gsap.set(el, { opacity: op, x: 36 * (1 - staggered) - 24 * staggeredOut });
    });
  }

  const mm = gsap.matchMedia();

  mm.add("(min-width: 769px)", () => {
    // No ScrollTrigger of its own: main.js's merged build-stage pin calls
    // this with the normalized scroll-1 progress (0 at the hand-off, 1 at
    // the scroll-1/scroll-2 boundary).
    window.__scroll1Render = render;
    render(0);

    // Gate for scroll-2.js's own forced-scroll hijack: only arms once
    // Scroll 1 has genuinely finished (mirrors window.__scroll0Done above).
    window.__scroll1Done = false;

    // Forced scroll hijack: once the page sits at the hand-off point
    // (scroll-0 fully played, locked mid-pin), the next fresh
    // scroll/keypress input of any length drives the whole Scroll 1
    // sequence to its last frame in one uninterruptible tween, mirroring
    // runForcedScrollTween() in main.js for the hero -> hand-off descent.
    // Requires a new user input - it does not fire automatically when
    // Scroll 0 finishes.
    let done = false;
    let tweening = false;
    let touchStartY = 0;

    function atHandoff() {
      // window.__scroll0Done is the primary gate: it stays false for the
      // entire hero -> Scroll 0 run, so this can never mistakenly hijack
      // that very first scroll. __scroll0Meta comes from the merged
      // ScrollTrigger's onRefresh in main.js.
      // The zone spans from the hand-off point to just before the pin end,
      // not a tight +-5px window: trackpad momentum trailing past the
      // scroll-0 unlock can drift scrollY beyond the exact hand-off before
      // the user's next deliberate input, and that input must still force
      // the full scroll-1 run instead of free-scrolling into the sections
      // below.
      const meta = window.__scroll0Meta;
      return (
        window.__scroll0Done === true &&
        meta &&
        window.scrollY >= meta.handoffY - 5 &&
        window.scrollY < meta.handoff2Y - 10
      );
    }

    function runForcedScroll() {
      if (tweening || done) return;
      const lenis = window.__lenis;
      const meta = window.__scroll0Meta;
      if (!lenis || !meta) return;
      tweening = true;

      const targetScroll = meta.handoff2Y;
      lenis.scrollTo(targetScroll, {
        duration: 4.5,
        easing: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
        lock: true,
        onComplete: () => {
          tweening = false;
          done = true;
          window.__scroll1Done = true;
        },
      });
    }

    function handleForcedScroll(e) {
      if (done || tweening || !atHandoff()) return;

      let isDownward = false;
      if (e.type === "wheel") {
        isDownward = e.deltaY > 0;
      } else if (e.type === "touchmove") {
        isDownward = e.touches[0].clientY < touchStartY;
      } else if (e.type === "keydown") {
        isDownward = ["ArrowDown", "PageDown", " ", "Spacebar"].includes(e.key);
      }

      if (isDownward) {
        e.preventDefault();
        e.stopPropagation();
        runForcedScroll();
      }
    }

    function handleTouchStart(e) {
      if (done || tweening || !atHandoff()) return;
      touchStartY = e.touches[0].clientY;
    }

    function blockDuringTween(e) {
      if (tweening) {
        e.preventDefault();
        e.stopPropagation();
      }
    }

    window.addEventListener("wheel", handleForcedScroll, { passive: false, capture: true });
    window.addEventListener("touchmove", handleForcedScroll, { passive: false, capture: true });
    window.addEventListener("keydown", handleForcedScroll, { passive: false, capture: true });
    window.addEventListener("touchstart", handleTouchStart, { passive: true, capture: true });
    window.addEventListener("wheel", blockDuringTween, { passive: false, capture: true });
    window.addEventListener("touchmove", blockDuringTween, { passive: false, capture: true });

    return () => {
      if (window.__scroll1Render === render) delete window.__scroll1Render;
      window.removeEventListener("wheel", handleForcedScroll, { capture: true });
      window.removeEventListener("touchmove", handleForcedScroll, { capture: true });
      window.removeEventListener("keydown", handleForcedScroll, { capture: true });
      window.removeEventListener("touchstart", handleTouchStart, { capture: true });
      window.removeEventListener("wheel", blockDuringTween, { capture: true });
      window.removeEventListener("touchmove", blockDuringTween, { capture: true });
      gsap.set(slot, { clearProps: "transform" });
      copyEls.forEach((el) => gsap.set(el, { clearProps: "opacity,transform" }));
    };
  });

  // Dev shortcut: ?scroll1=1 jumps to the hand-off point after load
  // (skips the hero + scroll-0 run).
  if (new URLSearchParams(location.search).has("scroll1")) {
    const jumpToScroll1 = () => {
      window.__scroll0Done = true;
      const lenis = window.__lenis;
      const meta = window.__scroll0Meta;
      if (!lenis || !meta) return;
      lenis.scrollTo(meta.handoffY, { duration: 1.4 });
    };

    const waitForReady = setInterval(() => {
      const loader = document.getElementById("loader");
      if (window.__lenis && window.__scroll0Meta && !loader) {
        clearInterval(waitForReady);
        setTimeout(jumpToScroll1, 400);
      }
    }, 150);
  }

  mm.add("(max-width: 768px)", () => {
    drawFrame(0);
    gsap.set(slot, { clearProps: "transform" });
    copyEls.forEach((el) => gsap.set(el, { opacity: 1, x: 0 }));
    return () => {};
  });
});
