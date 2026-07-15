# Log Modifiche

Registro cronologico delle modifiche al sito. Voce piu' recente in alto.

---

## 2026-07-15 — Migrazione a font self-hosted (Newsreader + General Sans)

**Autore:** Lorenzo Rubino (via Claude Code)

### Cosa e' cambiato
Il sito passa da **Google Fonts** (Cormorant Garamond + Inter, caricati via
`<link>` nell'`<head>`) a **font self-hosted** serviti dal repo:
- `--font-serif: 'Newsreader', Georgia, serif` — titoli/display
- `--font-sans: 'General Sans', ...` — corpo testo/UI/nav
- `--font-serif-cards: 'Cormorant Garamond'` e `--font-sans-cards: 'Inter'`
  restano SOLO per le floating-card della home (e per la sezione Numeri).

Aggiunte le regole `@font-face` in cima a `css/style.css` che puntano ai file
locali, e i file font in `assets/fonts/` (~1.2M):
- `assets/fonts/newsreader/` — Newsreader variable (regular + italic, TTF)
- `assets/fonts/general-sans/` — General Sans variable (woff2 + ttf, regular + italic)

### Perche'
Meno dipendenza da CDN esterni, coerenza tipografica e controllo sul rendering.

### File
- `css/style.css` — blocco `@font-face` + token `--font-serif`/`--font-sans`.
- `assets/fonts/**` — file font (nuovi, tracciati in git, NON gitignored).

### Nota
Sostituisce di fatto la voce "Verifica font utilizzati nel sito" piu' in basso
(quella fotografava lo stato PRIMA della migrazione: Cormorant + Inter).

---

## 2026-07-15 — Sezione "Numeri": count-up, hover interattivo, box piu' piccole, rimossa etichetta angolo

**Autore:** Lorenzo Rubino (via Claude Code)

### Richiesta
Su richiesta, dopo l'ok al cambio-sfondo: (1) rimuovere l'etichetta in alto a
sinistra "I NOSTRI NUMERI / 04"; (2) rimpicciolire un po' le box; (3) numeri
interattivi che salgono da 0 al valore quando la sezione entra in viewport;
(4) box interattive all'hover.

### Fatto
- **Rimossa** etichetta `NOSTRI NUMERI / 04` (HTML `.stats-index`/`.stats-kicker`
  + relative regole CSS).
- **Box piu' piccole:** padding `3.2/2/3rem → 2.4/1.6/2.2rem`, numero
  `clamp(4,6vw,5.6) → clamp(3,4.5vw,4.2)`, gap `2 → 1.5rem`, icona `34 → 30px`,
  max-width sezione `1280 → 1160px`, testi/label leggermente ridotti.
- **Count-up:** cifre in `<span class="stat-num-value" data-target="N">0</span>`
  (il `+` resta fisso). GSAP conta `0 → target` lineare 1.2s, **una sola volta**
  (`ScrollTrigger once`, start `top 78%`). `prefers-reduced-motion` → valore
  finale statico.
- **Hover combo:** card sale 6px + ombra piu' profonda + alone/bordo magenta +
  sfondo leggermente piu' bianco; numero e icona virano/scalano. Transizioni
  0.4s (token del sito). Solo desktop (mobile non ha hover).
- **Nota tecnica:** il fly-in ora e' `gsap.fromTo(... clearProps:"transform")`
  cosi' non resta un `transform` inline che bloccherebbe il `:hover` translate;
  lo stato iniziale nascosto e' solo `opacity:0` in CSS (niente transform).

### File modificati
- `index.html` — rimossa etichetta; cifre wrappate con `data-target`; cache `?v=4`.
- `css/scroll-stats.css` — box piu' piccole, hover combo, num-value transition.
- `js/scroll-stats.js` — count-up + fly-in `fromTo`/`clearProps`.

---

## 2026-07-15 — Nuova mini-sezione "Numeri" (interludio chiaro tra scroll-3 e le finestre fluttuanti)

**Autore:** Lorenzo Rubino (via Claude Code)

### Richiesta
Dopo l'ultimo scroll-3, prima della sezione con le 7 finestre fluttuanti
(`.details-section`), inserire una mini-sezione che presenta i numeri
dell'azienda (30+ anni, 1000+ progetti, 25+ marchi partner). Requisito
chiave: lo **sfondo della PAGINA** deve cambiare colore (nero → crema con
schizzo architettonico), non deve sembrare un semplice stacco di sezione.
Poi torna nero per le finestre fluttuanti. Le tre box entrano in scroll.

### Decisioni
- Sfondo crema + schizzo generato **in CSS** (nessun asset esterno).
- Lo sfondo **torna nero** uscendo dalla sezione (transizione bidirezionale).
- **Scroll normale** (non pinnato): le box entrano quando la sezione arriva
  in viewport.

### Come funziona
Un backdrop **fisso** a tutto schermo (`#stats-bg`, `position:fixed`,
`z-index:1`) sta dietro alle sezioni scure opache (che hanno
`z-index: var(--z-content)=5`). La `.stats-section` è trasparente: solo lì
il crema si vede. `js/scroll-stats.js` fa il cross-fade dell'opacità del
backdrop con una curva a trapezio (ramp-in → hold → ramp-out) legata al
passaggio della sezione in viewport → l'intero sfondo pagina vira a crema e
poi torna nero. Le 3 box e il blocco titolo entrano con fly-in staggered
(ScrollTrigger, una sola volta). Rispetta `prefers-reduced-motion`.

### File creati
- `css/scroll-stats.css` — layer crema+schizzo, layout 3 box, tipografia,
  stato iniziale nascosto, responsive.
- `js/scroll-stats.js` — cross-fade backdrop + fly-in box/titolo.

### File modificati
- `index.html` — nuova `<section class="stats-section" id="numeri">` +
  `<div id="stats-bg">` inseriti tra `#build-stage` e `.details-section`;
  link a `css/scroll-stats.css` e `js/scroll-stats.js`.

### Fix post-revisione (stessa sessione)
1. **Collisione classi con l'hero.** L'hero usa gia' `.stat-number` e
   `.stat-label` (blocchi "30+ / 1000+ / Turnkey / Attivi"). Il CSS nuovo,
   non scoped, li aveva ristilizzati (serif enormi, colore scuro → quasi
   invisibili su nero). NESSUN testo dell'hero era stato cambiato, solo lo
   stile per collisione. Fix: tutte le classi `.stat-*` della nuova sezione
   ora scoped sotto `.stats-section` (CSS) e il selettore JS `.stat-card` →
   `.stats-section .stat-card`. Hero ripristinato.
2. **Stacco netto nero/crema (seam).** Il backdrop crema stava DIETRO le
   sezioni (z 1) → visibile solo dentro il box trasparente della sezione,
   con linea di confine dura. Fix: `#stats-bg` portato a `z-index:6` (SOPRA
   le sezioni scure opache z 5, sotto l'header z 100) e `.stats-section`
   content a `z-index:7`. Ora il backdrop copre l'INTERO viewport e il
   cross-fade vela tutto lo schermo in modo uniforme: si percepisce un
   cambio di sfondo totale, non uno stacco di sezione. Cache-bust `?v=2`.

---

## 2026-07-15 — Forced-scroll piu' veloce (stesso easing sinuoso)

**Autore:** Lorenzo Rubino (via Claude Code)

### Richiesta
Le animazioni forced-scroll perdevano troppo tempo a scorrere. Renderle
piu' veloci mantenendo la curva sinuosa (nessun cambio di easing).

### Fix
Ridotta solo la `duration` dei tween `lenis.scrollTo` forzati, easing
invariato (`power3.inOut`, la curva sinuosa esistente):
- `js/scroll-1.js` — forced-scroll `8` → `4.5`
- `js/scroll-2.js` — forced-scroll `8` → `4.5`
- `js/scroll-3.js` — forced-scroll `8` → `4.5`
- `js/main.js` — discesa hero→scroll-0 `2.8` → `1.8`

Non toccati gli easing ne' le durate dei dev-shortcut (`1.4`).

### File modificati
- `js/scroll-1.js`, `js/scroll-2.js`, `js/scroll-3.js`, `js/main.js`

---

## 2026-07-15 — Copy scroll-0/1/2: resta fino all'ultimo frame, poi dissolvenza elegante all'hand-off

**Autore:** Lorenzo Rubino (via Claude Code)

### Comportamento voluto
Il copy di ogni fase deve restare leggibile fino all'ultimo frame della
sua sequenza, poi dissolversi in modo elegante (scrubbato, non a scatto)
proprio quando inizia la fase successiva:
- scroll-0: copy visibile fino all'ultimo frame → si dissolve quando parte scroll-1
- scroll-1: copy visibile fino all'ultimo frame → si dissolve quando parte scroll-2
- scroll-2: idem verso scroll-3
- scroll-3: ultima fase, nessuno scroll successivo → copy resta fino a
  fine pin (nessun fade-out aggiunto).

### Storia del bug
1. Originariamente scroll-0 aveva un fade-out troppo precoce (partiva al
   68% della fase) → testo spariva molto prima dell'ultimo frame.
2. Primo tentativo: rimosso del tutto il fade-out → il copy pero' restava
   fisso e veniva nascosto di colpo dallo swap istantaneo del layer
   (`setPhase` autoAlpha) → sparizione a scatto, non elegante.
3. Fix finale (questo): fade-out riposizionato nell'ultimo tratto della
   fase, come dissolvenza scrubbata legata allo scroll.

### Fix
- `js/main.js` (`scroll0TL`): fade-out del copy spostato all'ultimo ~12%
  della fase scroll-0 (`S0*0.88` → `S0*1.0`), con leggero drift `y:-24`.
  Finisce esattamente all'hand-off, bidirezionale con lo scrub.
- `js/scroll-1.js` e `js/scroll-2.js` (`render()`): aggiunte costanti
  `COPY_OUT_START = 0.9` / `COPY_OUT_END = 1.0` e un secondo fattore di
  opacita' `out` (con stagger) moltiplicato al fade-in — il copy si
  dissolve nell'ultimo 10% della fase con drift `x -= 24*out`.
- `js/scroll-3.js`: invariato (ultima fase, il copy deve restare).

### File modificati
- `js/main.js` — `scroll0TL`: `.to(scroll0Copy,{opacity:0,y:-24})` a `S0*0.88`
- `js/scroll-1.js` — `COPY_OUT_START/END` + fade-out in `render()`
- `js/scroll-2.js` — `COPY_OUT_START/END` + fade-out in `render()`

---

## 2026-07-15 — Sezione CTA consulenza (#contatti): fix lag, layout in una schermata, bottone coerente

**Autore:** Lorenzo Rubino (via Claude Code)

### Richiesta
La sezione "Dall'idea alla realta'..." (CTA finale consulenza) laggava,
non stava tutta in una schermata, e il bottone "RICHIEDI UNA CONSULENZA"
doveva essere reso coerente con il bottone "SCOPRI TUTTI I PROGETTI" della
sezione con le finestre fluttuanti (`#dettagli`).

### 1. Fix lag
Causa: `.consult-cta-orbit` (alone che orbita dietro il bottone) ha
`animation: consultOrbit 7s linear infinite` combinato a `filter: blur(24px)`
— gira per sempre anche a sezione fuori dallo schermo, pesando sul
compositor durante tutta la sessione di scroll (Lenis/GSAP condividono lo
stesso rAF).
Fix (`index.html`): aggiunto un `IntersectionObserver` sulla sezione
`#contatti` che mette l'animazione in pausa (`animationPlayState = 'paused'`)
quando la sezione non e' visibile, e la fa ripartire quando rientra.

### 2. Layout in una schermata
`css/style.css` — `.consult-section`: da padding fisso (5rem/5.5rem) a
`min-height: 100vh` + `align-items: center` + padding ridotto (2.5rem).
Ridimensionati in proporzione: `.consult-title` (clamp 4rem→3.2rem),
`.consult-sub`, margini di `.consult-cta-wrap`/`.consult-reassure`,
`.consult-features` (gap/margin/icone 58px→44px, svg 24px→19px). Mobile:
`.consult-section` padding mobile da `6rem/7rem` a `3rem` uniforme.

### 3. Bottone coerente con "SCOPRI TUTTI I PROGETTI"
`.consult-cta` da blocco pieno con gradiente magenta + cerchio icona a
sinistra, a pill in vetro scuro coerente con `.floating-card.floating-cta`:
`background: rgba(9,9,11,.55)` + `backdrop-filter: blur(10px)`, bordo
magenta sottile (`rgba(230,35,106,.35)`), niente piu' gradiente pieno.
Rimosso `.consult-cta-icon` (cerchio icona sinistra, ora `display:none`,
markup HTML lasciato intatto). Freccia destra ridotta a 32px (era 46px) per
matchare `.discover-arrow-btn`. Ripulite regole CSS duplicate/morte
(`svg` size doppia, `.consult-cta-icon`/`-arrow` override mobile non piu'
necessari).

### File modificati
- `index.html` — script IntersectionObserver per pausa animazione orbit
- `css/style.css` — `.consult-section`, `.consult-title`, `.consult-sub`,
  `.consult-cta-wrap`, `.consult-cta`, `.consult-cta-icon`,
  `.consult-cta-label`, `.consult-cta-arrow`, `.consult-reassure`,
  `.consult-features`, `.consult-feature-icon`, media query mobile
  `#contatti`

---

## 2026-07-15 — Verifica font utilizzati nel sito

**Autore:** Lorenzo Rubino (via Claude Code)
**Esito:** Nessuna modifica al codice — solo verifica/risposta informativa.

Richiesta: sapere quali font sono attualmente in uso in tutto il sito.

Confermato tramite grep su `index.html` + tutti i CSS: **2 font**, entrambi
Google Fonts caricati nell'`<head>` di `index.html` e riusati ovunque tramite
custom property CSS (mai hardcoded altrove):
- `--font-serif: 'Cormorant Garamond', Georgia, serif` — titoli/headline
- `--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif` — corpo testo/UI/nav

Definiti in `css/style.css:21-22`, usati in `style.css`, `scroll-1/2/3.css`,
`projects.css` via `var(--font-serif)` / `var(--font-sans)`.

---

## 2026-07-15 — Scroll-3 integrato nel sito + fix definitivo Scroll-2 (ritaglio + raccordo con Scroll-1)

**Autore:** Lorenzo Rubino (via Claude Code)

### 1. Scroll-3: nuova sequenza aggiunta dopo Scroll-2

Terza fase del pin `#build-stage`, con lo stesso meccanismo di hand-off in
place usato tra scroll-0 e scroll-1 (nessun avanzamento di pagina visibile
tra le sequenze).

- **HTML** (`index.html`): nuovo overlay `.reveal-layer-3` dentro
  `#build-stage`, con canvas centrato (`#reveal-canvas-3`) e copy su entrambi
  i lati (`.reveal-copy-3-left` / `-right`, testo "IL TUO LOCALE" + sub).
- **CSS** (`css/scroll-3.css`, nuovo file): oggetto centrato a canvas pieno
  (stato di arrivo di scroll-2), copy fissa ai due lati, branch mobile
  (stack verticale) coerente con scroll-1/scroll-2.
- **JS** (`js/scroll-3.js`, nuovo file): carica 169 frame da
  `scroll-3/webp/`, li scrub in place (l'ambiente si materializza: da
  pallido/vuoto ad arredato e illuminato) restando centrato — nessuno
  spostamento orizzontale come invece fa scroll-1/scroll-2. Include il
  proprio hijack di forced-scroll (mirror di scroll-1.js/scroll-2.js) e lo
  shortcut dev `?scroll3=1`.
- **`js/main.js`**: pin esteso da 3 a 4 fasi
  (`SCROLL0..3_PIN_FRACTION = 1.5/1.8/1.8/1.8`, totale 6.9 viewport-height),
  aggiunto `HANDOFF3`, `setPhase()` reso a 4 stati, `renderPinned()` esteso
  con il ramo scroll-3, aggiunto `handoff3Y` ai metadati di scroll condivisi
  (`window.__scroll0Meta`).
- **`js/scroll-2.js`**: il suo forced-tween ora punta a `handoff3Y` (prima
  puntava alla fine pin, che ora e' molto piu' avanti), e imposta
  `window.__scroll2Done` come gate per l'hijack di scroll-3.

### 2. Pipeline di ritaglio Scroll-3 (sfondo verde/crema → trasparenza)

Diversi tentativi fino al risultato buono, tutti su
`assets/animations/scripts/` e script temporanei in scratchpad (non tenuti
nel repo):
- Approccio iniziale chroma-key + GrabCut sul verde (funziona sui frame con
  sfondo verde saturo, ma lascia aloni/ombra su alcuni frame).
- Sistemati singolarmente i frame con residuo verde tramite maschera piu'
  aggressiva (verde G-dominante, non solo hue) + rimozione ombra proiettata.
- Fonte "definitivo" con sfondo **crema** (non verde): chroma-key non
  applicabile → uso di una **sagoma di riferimento fissa** (alpha del
  frame_001, camera statica su tutta la sequenza) applicata a ogni frame,
  con GrabCut per agganciare i bordi reali dei muri invece di un bbox fisso.
- Risultato finale rigenerato in `scroll-3/webp/` (169 frame, 1440x805,
  RGBA), verificato via preview su sfondo nero prima di sostituire.

### 3. Pulizia cartelle Scroll-3

Rimosse (scarti di lavorazione, non piu' necessari):
`frame ritagliati definitivo`, `frame ritagliati definitivo_backup`,
`webp_recut`, `_preview_taglio`, file di test sparsi
(`crop_test_*`, `frame_005_perimeter_*`).
Rimaste: `webp/` (sito) e `frame non ritagliati definitivo/` (sorgente,
tenuta per eventuali ri-tagli futuri).

### 4. Scroll-2: fix definitivo (era gia' stato "sistemato" nella voce del
   13/07 ma restavano due problemi grossi)

Problemi riportati dall'utente:
- L'oggetto **cambiava forma/dimensione in modo visibile** durante la
  rotazione (cresce e rimpicciolisce frame dopo frame) → sembrava un
  ritaglio fatto male, in realta' era un **crop fisso** (`SRC` hardcoded in
  `scroll-2.js`) che non teneva conto che l'oggetto reale cambia bbox
  ruotando (vista dall'alto piatta → isometrica).
- I frame erano **RGB pieni su sfondo nero**, non RGBA trasparenti → si
  vedeva un rettangolo nero dietro l'oggetto nel sito.
- Al passaggio scroll-1 → scroll-2 l'oggetto **cambiava improvvisamente
  dimensione** (ultimo frame scroll-1 molto piu' grande del primo frame
  scroll-2): l'animazione non sembrava continua.

Fix applicato (`assets/animations/scroll-2/`):
- Per ogni frame: isolato l'oggetto dallo sfondo nero (soglia + fill-holes +
  largest-component + edge anti-alias), ritagliato al bounding box, poi
  **scalato a un'altezza target costante** cosi' la dimensione non varia
  piu' mentre ruota — solo la rotazione resta visibile.
- **Smoothing temporale** (media mobile finestra 7) sulla scala per
  eliminare micro-jitter frame-a-frame.
- Salvato come **RGBA trasparente** (canvas 1440x805, ~77% area
  trasparente) invece di RGB su nero.
- **Altezza target tarata sull'ultimo frame di scroll-1** (misurato bbox
  reale: h776, y14-789) cosi' il primo frame di scroll-2 ha esattamente la
  stessa grandezza/posizione verticale dell'ultimo di scroll-1 → passaggio
  senza salto percepito.
- `js/scroll-2.js`: rimosso il vecchio crop fisso `SRC` in `drawFrame()`,
  ora disegna il frame (gia' pronto/normalizzato) 1:1 nel canvas.
  `FRAME_COUNT` e `FRAME_CACHE_BUST` aggiornati passo per passo
  (`v=3` → `v=6`) man mano che i frame venivano rigenerati, per forzare il
  browser a scaricare le versioni nuove.

Cartelle scroll-2 finali (scarti eliminati su richiesta dell'utente:
`webp_backup`, `preview quasi perfette`, `_preview_normalizzato`):
- `webp/` — quella servita dal sito (121 frame RGBA normalizzati)
- `frame normalizzati/` — copia sincronizzata degli stessi frame
- `frame ritagliati perfetti/` — sorgente RGB su nero da cui sono generati

### File modificati in questa sessione

**Nuovi**
- `css/scroll-3.css`
- `js/scroll-3.js`
- `assets/animations/scripts/build_scroll2_from_green.py` (evoluto in piu'
  iterazioni per lo scroll-3, nome storico)
- `assets/animations/scripts/build_scroll3_webp.py`

**Modificati**
- `index.html` — markup `.reveal-layer-3`, link `scroll-3.css`, script
  `scroll-3.js`
- `js/main.js` — 4 fasi pin, `HANDOFF3`, `handoff3Y`
- `js/scroll-1.js` — hijack target aggiornato a `handoff2Y`
  (gia' in una sessione precedente, verificato coerente)
- `js/scroll-2.js` — hijack target `handoff3Y`, `window.__scroll2Done`,
  rimozione crop fisso in `drawFrame()`, `FRAME_COUNT=121`,
  `FRAME_CACHE_BUST=v6`

**Asset rigenerati**
- `assets/animations/scroll-2/webp/frame_000..120.webp` (121, RGBA
  normalizzati, altezza tarata su scroll-1)
- `assets/animations/scroll-2/frame normalizzati/` (copia sync)
- `assets/animations/scroll-3/webp/frame_000..168.webp` (169, RGBA)

### Nota per il collega
Non toccare l'altezza target (`TARGET_H = 776.0`) in
`build_s2_norm_rgba.py` senza rimisurare il bbox dell'ultimo frame di
scroll-1 (`scroll-1/webp/frame_115.webp`) — e' calibrata apposta per il
raccordo visivo tra le due sequenze.

---

## 2026-07-13 — Verifica sezione Progetti fluttuante (post scroll-3)

**Autore:** Lorenzo Rubino (via Claude Code)
**Esito:** Nessuna modifica al codice — la sezione richiesta era **gia' implementata** e conforme.

### Richiesta
Sezione "progetti" sotto lo scroll-3 con mini-finestre fluttuanti (una per
categoria), visibile **solo da PC**, con le finestre che si orientano/spostano
verso il cursore muovendosi in uno spazio vuoto.

### Stato verificato (gia' presente nel repo)
- **Markup:** `index.html` → `<section class="details-section" id="dettagli">`
  subito dopo `#build-stage` (l'ultimo overlay e' lo scroll-3). Contiene
  `.details-desktop-gallery` (7 card categoria + 3 wireframe decorativi) e
  `.details-mobile-fallback` (testo statico).
- **Solo desktop:** `css/style.css` — `.details-desktop-gallery{display:none}`
  di default, mostrata solo in `@media (min-width:1024px)`; il fallback mobile
  e' nascosto sopra 1024px. Anche il JS gira solo se `innerWidth>=1024`.
- **Attrazione verso il cursore:** `js/main.js` (blocco "3D INTERACTIVE TILT
  GALLERY (PC ONLY)", ~riga 983-1124). Ogni card calcola il vettore
  centro-card → cursore e applica traslazione + tilt verso il cursore, con
  interpolazione Lerp (0.08) per smorzamento elastico.
- **Movimento in spazio vuoto:** oscillazione idle continua sine/cosine
  (traslazione max 12px, rotazione max 1.5°) con fasi distinte per card.
- Card posizionate in absolute con layout sfalsato (`.card-bar`, `.card-restaurant`,
  … `.card-enoteca` + `.dec-outline-1..3`) coerente con l'immagine di riferimento.

### File creati in questa sessione
Nessuno.

### File modificati in questa sessione
- `modifiche/log modifiche.md` — aggiunta questa voce di verifica (unico file toccato).

### Cartella di lavoro confermata
`DEFINITIVO/` (NON `DEFINITIVO-ALT/`). Tutte le modifiche future vanno qui.

---

## 2026-07-13 18:16 — Scroll-2: frame ritagliati + fix draw + alleggerimento repo

**Autore:** Lorenzo Rubino (via Claude Code)
**Commit:** `b4dc01f` — pushato su `globalcontractsicily-alt/DEFINITIVO` (branch `main`)
**Backup locale pre-modifica:** branch `backup-pre-slim` → `488064c`

### Cosa e' stato fatto

1. **Sostituzione frame Scroll-2**
   - I frame webp dello scroll-2 nel sito erano ritagliati male.
   - Rigenerati tutti i 121 frame (`frame_000..120.webp`, quality 90) partendo
     dalla cartella sorgente `assets/animations/scroll-2/frame ritagliati perfetti/`.
   - I nuovi frame sono portrait 1080x1920 (i vecchi erano cutout 1440x805).

2. **Fix rendering (oggetto schiacciato)**
   - Il canvas scroll-2 e' 1440x805 landscape; disegnando i frame portrait a
     tutto canvas venivano schiacciati.
   - `js/scroll-2.js` → `drawFrame()`: ora ritaglia la banda oggetto dalla
     sorgente (`SRC = x40 y585 w1000 h760`) e fa **contain-fit** centrato nel
     canvas → proporzioni corrette, piccoli margini neri laterali che si
     fondono con lo sfondo.
   - `FRAME_CACHE_BUST` alzato a `"v=3"`.
   - `index.html`: tag `<script src="./js/scroll-2.js">` da `?v=1` a `?v=4`
     (bust cache del JS, altrimenti il browser serviva la vecchia versione).

3. **Alleggerimento repository (fix `git push`)**
   - La history conteneva ~762MB di frame sorgente/backup che facevano fallire
     ogni push (HTTP 408).
   - I 5 commit locali non pushati sono stati raggruppati in un unico commit
     pulito sopra la base remota (`98644d8`), tenendo **solo i webp** che il
     sito serve davvero (~43MB totali).
   - `.gitignore` aggiornato: esclude tutto sotto `assets/animations/scroll-*/`
     TRANNE le cartelle `webp/`. I frame sorgente restano sul disco ma non in git.
   - Push finale: da 762MB (bloccato) → 43MB, completato.

### File toccati in questa modifica

**Codice**
- `index.html` — cache-bust `<script>` scroll-2 (`?v=4`)
- `js/scroll-2.js` — fix `drawFrame()` contain-fit + `FRAME_CACHE_BUST v=3`
- `js/scroll-1.js` — pipeline scroll-1 (incluso nel commit raggruppato)
- `js/scroll-3.js` — pipeline scroll-3 (incluso nel commit raggruppato)
- `js/main.js` — timing scroll-0 (`SCROLL0_PIN_FRACTION`/duration)
- `css/scroll-1.css`, `css/scroll-2.css`, `css/scroll-3.css`, `css/style.css`
- `assets/animations/scripts/build_scroll1_cutout.py`
- `assets/animations/scripts/build_scroll1_from_red.py`
- `assets/animations/scripts/build_scroll2_cutout.py`
- `assets/animations/scripts/build_scroll2_from_green.py`
- `assets/animations/scripts/build_scroll3_webp.py`
- `.gitignore` — whitelist solo `webp/` sotto `scroll-*/`
- `CLAUDE.md` — doc progetto (aggiunta al repo)

**Asset webp (serviti dal sito)**
- `assets/animations/scroll-2/webp/frame_000..120.webp` (121 file) — RIGENERATI
- `assets/animations/scroll-1/webp/` (116 file)
- `assets/animations/scroll-3/webp/` (169 file)
- (`scroll-0/webp/` gia' presente, invariato)

**Sorgenti NON committati (restano solo in locale, ignorati da git)**
- `assets/animations/scroll-2/frame ritagliati perfetti/` (sorgente dei nuovi frame)
- tutte le altre cartelle sotto `scroll-*/` diverse da `webp/`
  (frame non ritagliati, red_src, sfondo-rimosso, preview, _inspect, backup)

### Nota per il collega
NON ricommittare i frame sorgente pesanti sotto `assets/animations/scroll-*/`
(diversi da `webp/`): farebbero tornare il push a fallire con HTTP 408. Sono
gia' esclusi dal `.gitignore`.
