# LOG MODIFICHE E RESTRUTTURAZIONE FUNNEL — GLOBAL CONTRACT

Data: 2026-07-22
Branch: `main` (locale)

Questo documento sintetizza tutte le modifiche strutturali, grafiche e di codice effettuate sul branch `main` per consentire una facile integrazione e unione (merge) successiva con il lavoro di Luis.

---

## 1. NUOVA ARCHITETTURA DELLE SEZIONI (Ordine da cima a fondo)

```
  S0. Preloader + Navbar                      [Invariati]
  S1. HERO (+ micro-CTA "SCOPRI COME LAVORIAMO")
  S2. TRUST BLOCK (NUOVO: 3 numeri + marquee clienti in fascia scura #0D0D0D)
  S3. SECTOR CARDS (Relocata subito dopo il Trust Block)
  S4. METHOD ANIMATION (De-hijacked: scroll naturale senza blocchi o takeover)
  S5. PROJECTS (Pagina progetti ripristinata + copy sezione aggiornato)
  S6. VINCENZO (NUOVA: Sezione editoriale del fondatore con slot foto 4:5)
  S7. FINAL CTA (Copy aggiornato + Selettore Settore HoReCa + Sticky Mobile CTA)
  S8. Footer                                  [Invariato]
```

---

## 2. FILE TOCCATI E SINTESI MODIFICHE

| File | Stato | Descrizione |
|---|---|---|
| `index.html` | MODIFICATO | Riorganizzata la sequenza delle sezioni S0–S8. Inserito micro-CTA in Hero; creato `.gc-trust-block` in sostituzione sia della vecchia marquee che della sezione numeri bianca; spostata la sezione `.sectors-section#settori` prima del `#build-stage`; aggiornati tutti i testi di intro (S3, S4, S5, S7); inserita la nuova sezione `.gc-founder-section#vincenzo`; integrato il selettore settore in CTA finale e la sticky bar mobile `.gc-sticky-cta`. Rimossi i tag di `scroll-stats.css` e `scroll-stats.js`. |
| `css/style.css` | MODIFICATO | Aggiunte le regole per `.hero-micro-cta`, `.gc-trust-*` (placca scura #0D0D0D), `.sectors-subline`, `.gc-founder-*` (grid editoriale e slot 4:5), `.gc-cta-select`, e `.gc-sticky-cta-*` (bar fissa mobile con sfocatura). Rimosse le regole della vecchia sezione numeri bianca `.stats-section`. |
| `js/main.js` | MODIFICATO | Aggiunti i gestori di scroll per micro-CTA Hero e Sticky CTA mobile. **ELIMINATE COMPLETAMENTE** le funzioni e le variabili di blocco/hijack dello scroll: `runForcedScrollTween()`, `forcedDescentTrigger`, `unlockStage()`, `blockInput()`, `isStageLocked`, `isTweening`, `unlockTimeout`, `transitionDone`, e i listener `wheel`/`touchmove`/`keydown`. Il `#build-stage` ora è una sezione scrollabile standard gestita via GSAP ScrollTrigger (`pin: true`, `scrub: true`). |
| `js/scroll-1.js` | MODIFICATO | Eliminate le funzioni di hijack/blocco `runForcedScroll()`, `handleForcedScroll()`, `blockDuringTween()`, `atHandoff()` ed i relativi listener globali. Preservato il callback di render `window.__scroll1Render`. |
| `js/scroll-2.js` | MODIFICATO | Eliminate le funzioni di hijack/blocco `runForcedScroll()`, `handleForcedScroll()`, `blockDuringTween()`, `atHandoff()` ed i relativi listener globali. Preservato il callback di render `window.__scroll2Render`. |
| `js/scroll-3.js` | MODIFICATO | Eliminate le funzioni di hijack/blocco `runForcedScroll()`, `handleForcedScroll()`, `blockDuringTween()`, `atHandoff()` ed i relativi listener globali. Preservato il callback di render `window.__scroll3Render`. |
| `css/scroll-stats.css` | CANCELLATO | Eliminato dal progetto (sostituito dalla nuova placca dark S2). |
| `js/scroll-stats.js` | CANCELLATO | Eliminato dal progetto (sostituito dalla nuova placca dark S2). |
| `projects.html` | RIPRISTINATO | Pagina progetti ripristinata dal commit `2d66066` e collegata al link "Progetti" della navbar. |

---

## 3. COSE ELIMINATE / ELIMINATE DEFINITIVAMENTE

1. **Vecchia Sezione Numeri Bianca (`.stats-section#numeri` e `.stats-bg`)**: Rimosso totalmente l'impianto a card bianche con icone. Il refuso `"parlanodi"` / `"esperienzanel"` è stato eradicato dal codice (0 occorrenze).
2. **Forced-Scroll Machinery (Input Locking)**: Rimosso completamente qualsiasi meccanismo di blocco del mouse (`wheel`), touch (`touchmove`) o tastiera (`keydown`) che impediva l'uso del normale scroll da parte dell'utente.

---

## 4. NUOVE CLASSI E PREFISSI UTILIZZATI

- `.hero-micro-cta` (Bottone/link sobrio in Hero con hit area min 44px)
- `.gc-trust-` (Prefisso per la nuova placca scura S2: `.gc-trust-block`, `.gc-trust-numbers`, `.gc-trust-figure`, `.gc-trust-label`, `.gc-trust-marquee`, `.gc-trust-caption`)
- `.sectors-subline` (Sottotitolo descrittivo per S3 Settori)
- `.gc-founder-` (Prefisso per la nuova sezione Vincenzo S6: `.gc-founder-section`, `.gc-founder-grid`, `.gc-founder-photo-slot`, `.gc-founder-monogram`, `.gc-founder-content`)
- `.gc-cta-select` (Dropdown elegante per la scelta del settore in S7 Final CTA)
- `.gc-sticky-cta-` (Barra mobile fissa in basso che compare dopo l'Hero: `.gc-sticky-cta`, `.gc-sticky-cta-btn`)

---

## 5. LAUNCH BLOCKERS (DA COMPLETARE PRIMA DEL LANCIO)

1. **[BLOCKER 1] Nomi Progetti Placeholder**: I nomi dei progetti nella sezione S5 ("Caffè del Duomo", "Ristorante Mare Blu", "Hotel Artemisia", etc.) sono dei placeholder temporanei. È stato inserito un blocco commento HTML di avviso `<!-- PLACEHOLDER PROJECT NAMES — MUST be replaced with real delivered projects before launch -->` sopra la sezione. Devono essere sostituiti con i reali progetti consegnati.
2. **[BLOCKER 2] Foto Reale di Vincenzo Pietradura**: Lo slot foto nella sezione S6 Vincenzo è attualmente un box neutro `#1A1A1A` 4:5 con il monogramma "GC". Prima del lancio va inserita la vera fotografia di Vincenzo Pietradura.
3. **[BLOCKER 3] Approvazione Nomi Clienti Marquee**: I nomi di riferimento nella marquee del Trust Block (Hard Rock Café, Grand Hotel Villa Igea, Università di Catania, etc.) necessitano dell'approvazione finale di Vincenzo.
4. **[BLOCKER 4] Collegamento Backend Form CTA**: Il selettore di settore e il modulo di consulenza catturano correttamente i dati via JS, ma il collegamento backend (endpoint Supabase / servizio email Resend) andrà implementato nel pass successivo.

---

## 6. ISTRUZIONI PER IL MERGE CON IL LAVORO DI LUIS

Quando Luis andrà ad unire il suo lavoro sul nuovo tipo di scroll con questo branch `main`:

1. **Ordine delle sezioni in `index.html`**: L'ordine del DOM è cambiato (S0 Navbar -> S1 Hero -> S2 Trust Block -> S3 Settori -> S4 Metodo -> S5 Progetti -> S6 Vincenzo -> S7 Final CTA -> S8 Footer). Qualsiasi ancora o ID aggiunto da Luis deve rispettare questa nuova sequenza.
2. **Rimozione dei Flag di Forced Scroll**: Le variabili `isStageLocked`, `isTweening`, `transitionDone`, `window.__scroll0Done`, etc. sono state eliminate. Luis non deve ripristinarle o ri-agganciare i listener di blocco scroll (`preventDefault()` su wheel/touchmove).
3. **ScrollTrigger e Pinned Sections**: La sezione `#build-stage` ora usa un normale `ScrollTrigger` con `pin: true` e `scrub: true`. Qualsiasi nuova animazione o pin creata da Luis deve eseguire `ScrollTrigger.refresh()` dopo il caricamento della pagina.
4. **CSS Custom Properties e Namespace**: Tutte le nuove classi usano prefissi puliti (`.gc-trust-`, `.gc-founder-`, `.gc-sticky-cta-`). Le variabili di design system in `:root` sono conservate ed allineate.
