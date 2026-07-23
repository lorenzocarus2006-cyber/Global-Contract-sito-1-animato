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

  const FRAME_COUNT = 41;
  const FRAME_CACHE_BUST = "v=black-1";
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

    return () => {
      if (window.__scroll3Render === render) delete window.__scroll3Render;
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
    // Mobile scrubs like desktop (main.js pin drives via __scroll3Render).
    // scroll-3 has no left/right travel, so nothing to suppress.
    window.__scroll3Render = render;
    render(0);

    return () => {
      if (window.__scroll3Render === render) delete window.__scroll3Render;
      copyEls.forEach((el) => gsap.set(el, { clearProps: "opacity,transform" }));
    };
  });
});
