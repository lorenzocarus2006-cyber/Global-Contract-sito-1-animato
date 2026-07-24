/* =====================================================
   KREA GLOBAL CONTRACT — Shop Controller
   Filters · Lazy Loading · Reveal Animations · Dialog
   Powered by Motion (Local ESM)
===================================================== */

import { animate, inView } from "./motion.js";

(function () {
  'use strict';

  /* ─────────────────────────────────────────────
     1. CATEGORY FILTERS
  ───────────────────────────────────────────── */
  const filterPills = document.querySelectorAll('.filter-pill');
  const productCards = document.querySelectorAll('.product-card');

  if (filterPills.length > 0 && productCards.length > 0) {
    filterPills.forEach(pill => {
      pill.addEventListener('click', () => {
        // Rimuove la classe active da tutte le pill
        filterPills.forEach(p => p.classList.remove('active'));
        // Aggiunge la classe active alla pill cliccata
        pill.classList.add('active');

        const filterVal = pill.getAttribute('data-filter');

        productCards.forEach(card => {
          const cardCat = card.getAttribute('data-category');

          if (filterVal === 'tutti' || cardCat === filterVal) {
            // Rende visibile la card e la anima in entrata con Motion
            card.classList.remove('hidden');
            animate(card, { 
              opacity: [0, 1], 
              scale: [0.96, 1], 
              y: [15, 0] 
            }, { 
              duration: 0.4, 
              easing: [0.16, 1, 0.3, 1] 
            });
          } else {
            // Effetto fade-out e scale-down prima di nascondere con Motion
            animate(card, { 
              opacity: 0, 
              scale: 0.96, 
              y: 15 
            }, { 
              duration: 0.25, 
              easing: [0.16, 1, 0.3, 1] 
            }).then(() => {
              card.classList.add('hidden');
            });
          }
        });

        // Trigger manuale di ScrollTrigger/Resize per ricalcolare posizioni se necessario
        if (typeof ScrollTrigger !== 'undefined') {
          ScrollTrigger.refresh();
        }
      });
    });
  }

  /* ─────────────────────────────────────────────
     2. REVEAL ANIMATIONS (NATIVE INTERSECTION OBSERVER)
  ───────────────────────────────────────────── */
  if (productCards.length > 0) {
    if ('IntersectionObserver' in window) {
      const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      }, {
        root: null,
        rootMargin: '0px 0px -50px 0px',
        threshold: 0.1
      });
      productCards.forEach(card => revealObserver.observe(card));
    } else {
      productCards.forEach(card => card.classList.add('visible'));
    }
  }

  /* ─────────────────────────────────────────────
     3. INFO REQUEST DIALOG (MODAL)
  ───────────────────────────────────────────── */
  const dialog = document.getElementById('infoDialog');
  const dialogClose = document.getElementById('dialogClose');
  const productNameInput = document.getElementById('dialogProductName');
  const dialogTitleProd = document.getElementById('dialogProductTitle');
  const consultBtns = document.querySelectorAll('.btn-consult');

  if (dialog && consultBtns.length > 0) {
    consultBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const card = btn.closest('.product-card');
        const prodName = card ? card.querySelector('.product-name').textContent : 'Prodotto';

        // Precompila il form della dialog
        if (productNameInput) productNameInput.value = prodName;
        if (dialogTitleProd) dialogTitleProd.textContent = prodName;

        // Apri dialog
        dialog.showModal();
        document.body.style.overflow = 'hidden';

        // Animazione fade del dialog tramite Motion
        animate(dialog, { opacity: [0, 1] }, { duration: 0.3, easing: "ease-out" });
      });
    });

    // Chiudi dialog con animazione
    function closeDialog() {
      document.body.style.overflow = '';
      animate(dialog, { opacity: 0 }, { duration: 0.25, easing: "ease-in" }).then(() => {
        dialog.close();
      });
    }

    if (dialogClose) {
      dialogClose.addEventListener('click', closeDialog);
    }

    // Chiudi cliccando sullo sfondo
    dialog.addEventListener('click', (e) => {
      const rect = dialog.getBoundingClientRect();
      const isInDialog = (rect.top <= e.clientY && e.clientY <= rect.top + rect.height &&
        rect.left <= e.clientX && e.clientX <= rect.left + rect.width);
      if (!isInDialog) {
        closeDialog();
      }
    });

    // Submit del form
    const form = dialog.querySelector('form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const prod = productNameInput ? productNameInput.value : '';
        alert(`Richiesta inviata con successo per: ${prod}. Ti contatteremo entro 24 ore.`);
        closeDialog();
        form.reset();
      });
    }
  }

})();
