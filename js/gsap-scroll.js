/* ===================================================
   KREA Global Contract — gsap-scroll.js
   GSAP 3 + ScrollTrigger · Canvas Scroll Sequence
   Hero: 288 frame JPG scrubbed via scroll progress
=================================================== */

(function () {
  'use strict';

  /* ─────────────────────────────────────────────
     0. GUARD
  ───────────────────────────────────────────── */
  if (typeof gsap === 'undefined') {
    console.warn('[krea] GSAP not found — scroll animations disabled.');
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  /* ─────────────────────────────────────────────
     1. CANVAS SEQUENCE — 288 frame scroll-scrub
  ───────────────────────────────────────────── */
  const FRAME_DIR   = 'assets/videos/ffffff-ezgif-1f1a4f3ee7716729-webp-jpg/';
  const FRAME_COUNT = 288;          // frame_000 … frame_287
  const FRAME_PAD   = 3;            // zero-padding (000)

  // Genera tutti i path delle immagini
  const framePaths = Array.from({ length: FRAME_COUNT }, (_, i) => {
    const n = String(i).padStart(FRAME_PAD, '0');
    return `${FRAME_DIR}frame_${n}_delay-0.055s.jpg`;
  });

  const canvas = document.getElementById('heroCanvas');
  const ctx    = canvas ? canvas.getContext('2d') : null;

  if (!canvas || !ctx) {
    console.warn('[krea] #heroCanvas not found — sequence disabled.');
    return;
  }

  /* ── Canvas sizing (adatta per schermi Retina) ── */
  function resizeCanvas() {
    canvas.width  = window.innerWidth  * window.devicePixelRatio;
    canvas.height = window.innerHeight * window.devicePixelRatio;
    canvas.style.width  = window.innerWidth  + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas, { passive: true });

  /* ── Image Cache ── */
  const images = new Array(FRAME_COUNT).fill(null);
  let   currentFrame = 0;

  function drawFrame(img) {
    if (!img || !img.complete || img.naturalWidth === 0) return;
    const cW = canvas.width  / window.devicePixelRatio;
    const cH = canvas.height / window.devicePixelRatio;
    const iW = img.naturalWidth;
    const iH = img.naturalHeight;

    // Object-fit: cover centrato
    const scale  = Math.max(cW / iW, cH / iH);
    const dw     = iW * scale;
    const dh     = iH * scale;
    const dx     = (cW - dw) / 2;
    const dy     = (cH - dh) / 2;

    ctx.clearRect(0, 0, cW, cH);
    ctx.drawImage(img, dx, dy, dw, dh);
  }

  function loadFrame(idx) {
    if (images[idx]) return; // Già caricato
    const img = new Image();
    img.src = framePaths[idx];
    img.onload = () => {
      images[idx] = img;
      if (idx === currentFrame) {
        drawFrame(img);
      }
    };
    images[idx] = img; // Segna come in caricamento
  }

  /* ── Preload Strategy:
        Carica subito i primi 36 frame per la visualizzazione immediata,
        poi carica gli altri in background. ── */
  function preloadAll() {
    // Priorità alta: primi 36 frame
    for (let i = 0; i <= 35; i++) loadFrame(i);
    // Background load: resto dei frame
    setTimeout(() => {
      for (let i = 36; i < FRAME_COUNT; i++) loadFrame(i);
    }, 500);
  }
  preloadAll();

  // Forza il disegno del primo frame all'inizio
  const firstImg = new Image();
  firstImg.src = framePaths[0];
  firstImg.onload = () => {
    images[0] = firstImg;
    drawFrame(firstImg);
  };

  /* ── Scroll progress -> frame render ── */
  function updateFrame(progress) {
    const idx = Math.min(
      Math.floor(progress * (FRAME_COUNT - 1)),
      FRAME_COUNT - 1
    );
    if (idx === currentFrame) return;
    currentFrame = idx;
    if (images[idx] && images[idx].complete) {
      drawFrame(images[idx]);
    } else {
      // Se non è pronto in cache, carica on-demand e renderizza appena possibile
      loadFrame(idx);
    }
  }

  /* ── ScrollTrigger per il Canvas ── */
  ScrollTrigger.create({
    trigger:  '#hero',
    start:    'top top',
    end:      'bottom bottom',
    scrub:    1.5, // scrub fluido con leggero ritardo
    onUpdate: (self) => updateFrame(self.progress),
  });

  // Re-draw sul resize
  window.addEventListener('resize', () => {
    if (images[currentFrame] && images[currentFrame].complete) {
      drawFrame(images[currentFrame]);
    }
  }, { passive: true });


  /* ─────────────────────────────────────────────
     2. NARRATIVE BEATS TIMELINE
     Gestiamo l'entrata/uscita dei 4 beat
  ───────────────────────────────────────────── */

  function beatTimeline(el, startPct, endPct) {
    if (!el) return;
    const fadeWindow = 0.08; // Finestra di transizione (8% dello scroll)

    // Animazione di Fade-In
    gsap.fromTo(el,
      { opacity: 0, y: 30 },
      {
        opacity: 1, y: 0,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: '#hero',
          start:   `${startPct}% top`,
          end:     `${startPct + fadeWindow * 100}% top`,
          scrub:   1,
        },
      }
    );

    // Animazione di Fade-Out
    gsap.to(el, {
      opacity: 0, y: -30,
      ease: 'power2.in',
      scrollTrigger: {
        trigger: '#hero',
        start:   `${endPct - fadeWindow * 100}% top`,
        end:     `${endPct}% top`,
        scrub:   1,
      },
    });
  }

  // Beat A: 0% – 22%
  beatTimeline(document.getElementById('beatA'), 0, 22);

  // Beat B: 25% – 48%
  beatTimeline(document.getElementById('beatB'), 25, 48);

  // Beat C: 50% – 72%
  beatTimeline(document.getElementById('beatC'), 50, 72);

  // Beat D: 75% – 97%
  beatTimeline(document.getElementById('beatD'), 75, 97);

  // Staggering delle card all'interno del Beat C
  const beatCCards = document.querySelectorAll('#beatC .hero-beat__card');
  if (beatCCards.length) {
    gsap.fromTo(
      beatCCards,
      { opacity: 0, y: 20 },
      {
        opacity: 1, y: 0,
        stagger: 0.12,
        ease:    'power2.out',
        scrollTrigger: {
          trigger: '#hero',
          start:   '52% top',
          end:     '60% top',
          scrub:   1,
        },
      }
    );
  }

  /* ─────────────────────────────────────────────
     3. SCROLL HINT (scompare a 10% scroll progress)
  ───────────────────────────────────────────── */
  const scrollHint = document.getElementById('heroScrollHint');
  if (scrollHint) {
    gsap.to(scrollHint, {
      opacity: 0,
      y: 15,
      ease: 'none',
      scrollTrigger: {
        trigger: '#hero',
        start:   'top top',
        end:     '10% top',
        scrub:   1,
        onLeave: () => { scrollHint.style.pointerEvents = 'none'; },
      },
    });
  }

  /* ─────────────────────────────────────────────
     SERVICES CANVAS SCROLL SEQUENCE
     Replica identica della logica Hero Canvas,
     applicata alla sezione #servizi
  ───────────────────────────────────────────── */

  const SVC_FRAME_DIR   = 'assets/videos2/ffffff-ezgif-59ce2a7ecde549b7-webp-jpg/';
  const SVC_FRAME_COUNT = 286; 
  const SVC_FRAME_PAD   = 3;

  const svcFramePaths = Array.from({ length: SVC_FRAME_COUNT }, (_, i) => {
    const n = String(i).padStart(SVC_FRAME_PAD, '0');
    return `${SVC_FRAME_DIR}frame_${n}_delay-0.076s.jpg`;
  });

  const svcCanvas = document.getElementById('servicesCanvas');
  const svcCtx    = svcCanvas ? svcCanvas.getContext('2d') : null;

  if (svcCanvas && svcCtx) {

    // Sizing Retina identico alla Hero
    function resizeSvcCanvas() {
      svcCanvas.width  = window.innerWidth  * window.devicePixelRatio;
      svcCanvas.height = window.innerHeight * window.devicePixelRatio;
      svcCanvas.style.width  = window.innerWidth  + 'px';
      svcCanvas.style.height = window.innerHeight + 'px';
      svcCtx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }
    resizeSvcCanvas();
    window.addEventListener('resize', resizeSvcCanvas, { passive: true });

    const svcImages = new Array(SVC_FRAME_COUNT).fill(null);
    let svcCurrentFrame = 0;

    function drawSvcFrame(img) {
      if (!img || !img.complete || img.naturalWidth === 0) return;
      const cW = svcCanvas.width  / window.devicePixelRatio;
      const cH = svcCanvas.height / window.devicePixelRatio;
      const scale = Math.max(cW / img.naturalWidth, cH / img.naturalHeight);
      const dw = img.naturalWidth  * scale;
      const dh = img.naturalHeight * scale;
      svcCtx.clearRect(0, 0, cW, cH);
      svcCtx.drawImage(img, (cW - dw) / 2, (cH - dh) / 2, dw, dh);
    }

    function loadSvcFrame(idx) {
      if (svcImages[idx]) return;
      const img = new Image();
      img.src = svcFramePaths[idx];
      img.onload = () => {
        svcImages[idx] = img;
        if (idx === svcCurrentFrame) drawSvcFrame(img);
      };
      svcImages[idx] = img;
    }

    // Preload: prime 36 frame immediate, resto in background
    for (let i = 0; i <= Math.min(35, SVC_FRAME_COUNT - 1); i++) loadSvcFrame(i);
    setTimeout(() => {
      for (let i = 36; i < SVC_FRAME_COUNT; i++) loadSvcFrame(i);
    }, 500);

    // Primo frame immediato
    const svcFirstImg = new Image();
    svcFirstImg.src = svcFramePaths[0];
    svcFirstImg.onload = () => { svcImages[0] = svcFirstImg; drawSvcFrame(svcFirstImg); };

    function updateSvcFrame(progress) {
      const idx = Math.min(Math.floor(progress * (SVC_FRAME_COUNT - 1)), SVC_FRAME_COUNT - 1);
      if (idx === svcCurrentFrame) return;
      svcCurrentFrame = idx;
      if (svcImages[idx] && svcImages[idx].complete) {
        drawSvcFrame(svcImages[idx]);
      } else {
        loadSvcFrame(idx);
      }
    }

    // ScrollTrigger per il canvas servizi
    ScrollTrigger.create({
      trigger:  '#servicesSeq',
      start:    'top top',
      end:      'bottom bottom',
      scrub:    1.5,
      onUpdate: (self) => updateSvcFrame(self.progress),
    });

    window.addEventListener('resize', () => {
      if (svcImages[svcCurrentFrame]?.complete) drawSvcFrame(svcImages[svcCurrentFrame]);
    }, { passive: true });

    /* ── Beat Timelines (identici alla Hero, trigger su #servicesSeq) ── */
    function svcBeatTimeline(el, startPct, endPct) {
      if (!el) return;
      const duration = endPct - startPct;
      const fw = 8; // fade window duration (matches original 8%)
      
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: '#servicesSeq',
          start: `${startPct}% top`,
          end: `${endPct}% top`,
          scrub: 1
        }
      });
      
      tl.fromTo(el, 
        { opacity: 0, y: 30 }, 
        { opacity: 1, y: 0, ease: 'power2.out', duration: fw }
      )
      .to(el, 
        { opacity: 0, y: -30, ease: 'power2.in', duration: fw }, 
        `+=${duration - 2 * fw}`
      );
    }

    svcBeatTimeline(document.getElementById('svcBeatA'),  0, 22);
    svcBeatTimeline(document.getElementById('svcBeatB'), 25, 48);
    svcBeatTimeline(document.getElementById('svcBeatC'), 50, 72);
    svcBeatTimeline(document.getElementById('svcBeatD'), 75, 97);

    /* ── Scroll hint scompare al 10% ── */
    const svcHint = document.getElementById('svcScrollHint');
    if (svcHint) {
      gsap.to(svcHint, {
        opacity: 0, y: 15, ease: 'none',
        scrollTrigger: {
          trigger: '#servicesSeq',
          start: 'top top',
          end:   '10% top',
          scrub: 1,
          onLeave: () => { svcHint.style.pointerEvents = 'none'; }
        }
      });
    }
  }

})();
