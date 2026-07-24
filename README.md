# Global-Contract

Sito web professionale per Global-Contract — vendita di macchinari professionali (forni, cucine industriali, frigoriferi commerciali) per ristoranti, hotel e industrie alimentari.

## Struttura del progetto

```
Global-Contract/
├── index.html          # Homepage (hero, chi siamo, missione, prodotti in evidenza)
├── products.html       # Catalogo prodotti per categoria
├── shop.html           # Shop online con carrello
├── contact.html        # Contatti + prenotazione consulenza
├── css/
│   └── style.css       # Tutti gli stili (responsive, dark navy + gold)
├── js/
│   ├── main.js         # Navbar, animazioni, prodotti homepage
│   └── shop.js         # Dati prodotti, carrello (localStorage), filtri
└── assets/             # Immagini e risorse (da aggiungere)
```

## Funzionalità

- **Homepage** — Hero animato, categorie, chi siamo, missione, prodotti in evidenza, CTA
- **Catalogo** — Panoramica delle 3 categorie con link allo shop
- **Shop** — 9 prodotti con filtri per categoria, ordinamento, carrello persistente (localStorage)
- **Carrello** — Sidebar slide-in, quantità modificabili, checkout → prenotazione consulenza
- **Contatti** — Form di contatto + form prenotazione consulenza con scelta orario
- **Responsive** — Mobile, tablet e desktop

## Come lavorare in team

1. Clona il repo: `git clone https://github.com/lorenzor22092006-tech/Global-Contract.git`
2. Crea un branch per le tue modifiche: `git checkout -b feature/nome-modifica`
3. Fai le modifiche, poi: `git add . && git commit -m "Descrizione"`
4. Pusha il branch: `git push origin feature/nome-modifica`
5. Apri una Pull Request su GitHub

## Sviluppo futuro

- Aggiungere immagini reali nella cartella `assets/`
- Integrare un backend per i form (es. Formspree, Netlify Forms)
- Aggiungere pagina pagamento reale
- SEO e meta tag Open Graph
