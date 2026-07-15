/*
  Scroll 2 - physical cutout object travelling left -> center.
  Rendered in the .reveal-layer-2 overlay INSIDE the pinned #build-stage:
  main.js's merged ScrollTrigger drives it via window.__scroll2Render, so
  the hand-off from scroll-1 happens in place with zero page travel.
  Transparent webp cutouts, same 1440x805 canvas as Scroll 0 / Scroll 1,
  same fixed object framing so scroll-1's last frame and scroll-2's first
  frame line up pixel-for-pixel (no visible cut when the layers swap).
*/

document.addEventListener("DOMContentLoaded", () => {
  if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") return;
  gsap.registerPlugin(ScrollTrigger);

  const layer = document.getElementById("reveal-layer-2");
  const content = layer && layer.querySelector(".reveal-layer-2-content");
  const slot = document.getElementById("reveal-object-slot-2");
  const canvas = document.getElementById("reveal-canvas-2");
  if (!layer || !content || !slot || !canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const FRAME_COUNT = 121;
  const FRAME_CACHE_BUST = "v=6";
  const frames = [];
  let lastDrawn = -1;
  let pendingFrame = null;

  function framePath(i) {
    return `./assets/animations/scroll-2/webp/frame_${String(i).padStart(3, "0")}.webp?${FRAME_CACHE_BUST}`;
  }

  // Frames are pre-normalized to the 1440x805 canvas: each one already has the
  // object scaled to a constant on-screen size (temporally smoothed) and
  // centered, so it only rotates in place instead of growing/shrinking. Draw
  // the whole frame 1:1 into the canvas.
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
  // Elegant scrubbed dissolve in the last sliver, finishing at the
  // scroll-2 -> scroll-3 hand-off (copy survives to the last scroll-2 frame).
  const COPY_OUT_START = 0.9;
  const COPY_OUT_END = 1.0;
  const leftCopyEls = [
    layer.querySelector(".reveal-copy-2-left .reveal-eyebrow"),
    layer.querySelector(".reveal-copy-2-left .reveal-headline"),
  ].filter(Boolean);
  const rightCopyEls = [
    layer.querySelector(".reveal-copy-2-right .reveal-sub"),
  ].filter(Boolean);
  const copyEls = [...leftCopyEls, ...rightCopyEls];

  // Horizontal travel: the slot starts at left:0 (the exact spot scroll-1's
  // slot ends at) and moves right by a quarter of the content width, which
  // lands its center exactly on the page/content center.
  function travelDistance() {
    return content.offsetWidth * 0.25;
  }

  function render(progress) {
    drawFrame(Math.round(progress * (FRAME_COUNT - 1)));

    const x = travelDistance() * progress;
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
    // this with the normalized scroll-2 progress (0 at the second
    // hand-off, 1 at the end of the pin).
    window.__scroll2Render = render;
    render(0);

    // Gate for scroll-3.js's own forced-scroll hijack: only arms once
    // Scroll 2 has genuinely finished (mirrors window.__scroll1Done).
    window.__scroll2Done = false;

    // Forced scroll hijack: once the page sits at the scroll-1/scroll-2
    // hand-off point (locked mid-pin), the next fresh scroll/keypress
    // input of any length drives the whole Scroll 2 sequence to its last
    // frame in one uninterruptible tween, mirroring scroll-1.js.
    let done = false;
    let tweening = false;
    let touchStartY = 0;

    function atHandoff() {
      // window.__scroll1Done is the gate: it stays false for the entire
      // scroll-0 -> scroll-1 run, so this can never mistakenly hijack
      // those earlier scrolls.
      const meta = window.__scroll0Meta;
      return (
        window.__scroll1Done === true &&
        meta &&
        window.scrollY >= meta.handoff2Y - 5 &&
        window.scrollY < meta.handoff3Y - 10
      );
    }

    function runForcedScroll() {
      if (tweening || done) return;
      const lenis = window.__lenis;
      const meta = window.__scroll0Meta;
      if (!lenis || !meta) return;
      tweening = true;

      const targetScroll = meta.handoff3Y;
      lenis.scrollTo(targetScroll, {
        duration: 4.5,
        easing: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
        lock: true,
        onComplete: () => {
          tweening = false;
          done = true;
          window.__scroll2Done = true;
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
      if (window.__scroll2Render === render) delete window.__scroll2Render;
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

  // Dev shortcut: ?scroll2=1 jumps to the second hand-off point after load
  // (skips the hero + scroll-0 + scroll-1 run).
  if (new URLSearchParams(location.search).has("scroll2")) {
    const jumpToScroll2 = () => {
      window.__scroll0Done = true;
      window.__scroll1Done = true;
      const lenis = window.__lenis;
      const meta = window.__scroll0Meta;
      if (!lenis || !meta) return;
      lenis.scrollTo(meta.handoff2Y, { duration: 1.4 });
    };

    const waitForReady = setInterval(() => {
      const loader = document.getElementById("loader");
      if (window.__lenis && window.__scroll0Meta && !loader) {
        clearInterval(waitForReady);
        setTimeout(jumpToScroll2, 400);
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
