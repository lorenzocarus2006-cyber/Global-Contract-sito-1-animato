/*
  Scroll 3 - the space materialises in place.
  Rendered in the .reveal-layer-3 overlay INSIDE the pinned #build-stage:
  main.js's merged ScrollTrigger drives it via window.__scroll3Render, so
  the hand-off from scroll-2 happens in place with zero page travel.
  Frame 0 sits pixel-aligned over scroll-2's centered last frame; the
  object stays centered while its 169-frame sequence scrubs, flanked by
  copy on both sides. Same 1440x805 canvas as the other sequences.
*/

document.addEventListener("DOMContentLoaded", () => {
  if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") return;
  gsap.registerPlugin(ScrollTrigger);

  const layer = document.getElementById("reveal-layer-3");
  const content = layer && layer.querySelector(".reveal-layer-3-content");
  const slot = document.getElementById("reveal-object-slot-3");
  const canvas = document.getElementById("reveal-canvas-3");
  if (!layer || !content || !slot || !canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const FRAME_COUNT = 169;
  const FRAME_CACHE_BUST = "v=1";
  const frames = [];
  let lastDrawn = -1;
  let pendingFrame = null;

  function framePath(i) {
    return `./assets/animations/scroll-3/webp/frame_${String(i).padStart(3, "0")}.webp?${FRAME_CACHE_BUST}`;
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
  const COPY_START = 0.55;
  const COPY_END = 0.8;
  const copyEls = [
    layer.querySelector(".reveal-copy-3-left .reveal-eyebrow"),
    layer.querySelector(".reveal-copy-3-left .reveal-headline"),
    layer.querySelector(".reveal-copy-3-right .reveal-sub"),
  ].filter(Boolean);

  function render(progress) {
    // Object stays centered (continuous from scroll-2's centered end); the
    // animation is the frame sequence scrubbing as the space materialises.
    drawFrame(Math.round(progress * (FRAME_COUNT - 1)));

    const c = clamp01((progress - COPY_START) / (COPY_END - COPY_START));
    copyEls.forEach((el, idx) => {
      const staggered = clamp01(c - idx * 0.07);
      gsap.set(el, { opacity: staggered, x: 24 * (1 - staggered) });
    });
  }

  const mm = gsap.matchMedia();

  mm.add("(min-width: 769px)", () => {
    // No ScrollTrigger of its own: main.js's merged build-stage pin calls
    // this with the normalized scroll-3 progress (0 at the third hand-off,
    // 1 at the end of the pin).
    window.__scroll3Render = render;
    render(0);

    // Forced scroll hijack: once the page sits at the scroll-2/scroll-3
    // hand-off point (locked mid-pin), the next fresh scroll/keypress input
    // drives the whole Scroll 3 sequence to its last frame in one
    // uninterruptible tween, mirroring scroll-2.js.
    let done = false;
    let tweening = false;
    let touchStartY = 0;

    function atHandoff() {
      const meta = window.__scroll0Meta;
      return (
        window.__scroll2Done === true &&
        meta &&
        window.scrollY >= meta.handoff3Y - 5 &&
        window.scrollY < meta.endY - 10
      );
    }

    function runForcedScroll() {
      if (tweening || done) return;
      const lenis = window.__lenis;
      const meta = window.__scroll0Meta;
      if (!lenis || !meta) return;
      tweening = true;

      const targetScroll = meta.endY;
      lenis.scrollTo(targetScroll, {
        duration: 8,
        easing: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
        lock: true,
        onComplete: () => {
          tweening = false;
          done = true;
          window.__scroll3Done = true;
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
      if (window.__scroll3Render === render) delete window.__scroll3Render;
      window.removeEventListener("wheel", handleForcedScroll, { capture: true });
      window.removeEventListener("touchmove", handleForcedScroll, { capture: true });
      window.removeEventListener("keydown", handleForcedScroll, { capture: true });
      window.removeEventListener("touchstart", handleTouchStart, { capture: true });
      window.removeEventListener("wheel", blockDuringTween, { capture: true });
      window.removeEventListener("touchmove", blockDuringTween, { capture: true });
      copyEls.forEach((el) => gsap.set(el, { clearProps: "opacity,transform" }));
    };
  });

  // Dev shortcut: ?scroll3=1 jumps to the third hand-off point after load.
  if (new URLSearchParams(location.search).has("scroll3")) {
    const jumpToScroll3 = () => {
      window.__scroll0Done = true;
      window.__scroll1Done = true;
      window.__scroll2Done = true;
      const lenis = window.__lenis;
      const meta = window.__scroll0Meta;
      if (!lenis || !meta) return;
      lenis.scrollTo(meta.handoff3Y, { duration: 1.4 });
    };

    const waitForReady = setInterval(() => {
      const loader = document.getElementById("loader");
      if (window.__lenis && window.__scroll0Meta && !loader) {
        clearInterval(waitForReady);
        setTimeout(jumpToScroll3, 400);
      }
    }, 150);
  }

  mm.add("(max-width: 768px)", () => {
    drawFrame(0);
    copyEls.forEach((el) => gsap.set(el, { opacity: 1, x: 0 }));
    return () => {};
  });
});
