/* =====================================================
   KREA GLOBAL CONTRACT — Testimonials Scroll Carousel
===================================================== */

(function () {
  'use strict';

  const track = document.getElementById('testimonialsTrack');
  const btnPrev = document.getElementById('carouselPrev');
  const btnNext = document.getElementById('carouselNext');

  if (!track || !btnPrev || !btnNext) return;

  function getScrollAmount() {
    // Calcola la larghezza di una card + il gap
    const card = track.querySelector('.testimonial-card');
    if (!card) return 320 + 24;
    
    const style = window.getComputedStyle(track);
    const gap = parseFloat(style.gap) || 24;
    return card.offsetWidth + gap;
  }

  btnNext.addEventListener('click', () => {
    const scrollAmount = getScrollAmount();
    track.scrollBy({
      left: scrollAmount,
      behavior: 'smooth'
    });
  });

  btnPrev.addEventListener('click', () => {
    const scrollAmount = getScrollAmount();
    track.scrollBy({
      left: -scrollAmount,
      behavior: 'smooth'
    });
  });

  // Disabilita i bottoni se siamo arrivati al limite dello scroll
  function updateButtons() {
    const scrollLeft = track.scrollLeft;
    const maxScroll = track.scrollWidth - track.clientWidth;

    // Disabilita freccia sinistra all'inizio
    if (scrollLeft <= 5) {
      btnPrev.style.opacity = '0.35';
      btnPrev.style.pointerEvents = 'none';
    } else {
      btnPrev.style.opacity = '1';
      btnPrev.style.pointerEvents = 'auto';
    }

    // Disabilita freccia destra alla fine
    if (scrollLeft >= maxScroll - 5) {
      btnNext.style.opacity = '0.35';
      btnNext.style.pointerEvents = 'none';
    } else {
      btnNext.style.opacity = '1';
      btnNext.style.pointerEvents = 'auto';
    }
  }

  // Monitora lo scroll per aggiornare lo stato delle frecce
  track.addEventListener('scroll', updateButtons, { passive: true });
  window.addEventListener('resize', updateButtons, { passive: true });

  // Inizializza pulsanti al caricamento
  setTimeout(updateButtons, 300);

})();
