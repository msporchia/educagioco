/* GENERATO da strumenti/tara-arena.mjs (`npm run tara:arena`) — non si scrive a mano.

   La scheda del nemico di ogni tappa, trovata giocando: `forza` (le sue truppe
   rispetto alle tue), `moneteAlSecondo` e `pensa` (ogni quanti secondi decide)
   sono funzione di una sola manopola `d` (0 = quasi inerme, 1 = pari al giocatore
   bravo), cercata per bisezione perché il bambino di prova vinca la quota
   che la tappa promette. Vedi docs/arena/taratura.md. */
export const NEMICO = {
  scaramuccia: { d: 0.491, moneteAlSecondo: 0.424, pensa: 2.21, forza: 0.77 },
  ponte: { d: 0.534, moneteAlSecondo: 0.451, pensa: 2.15, forza: 0.794 },
  radura: { d: 0.247, moneteAlSecondo: 0.273, pensa: 2.6, forza: 0.636 },
  melma: { d: 0.241, moneteAlSecondo: 0.269, pensa: 2.62, forza: 0.632 },
  guado: { d: 0.378, moneteAlSecondo: 0.354, pensa: 2.4, forza: 0.708 },
  canneto: { d: 0.384, moneteAlSecondo: 0.358, pensa: 2.38, forza: 0.711 },
  valico: { d: 0.403, moneteAlSecondo: 0.37, pensa: 2.35, forza: 0.722 },
  ghiaccio: { d: 0.403, moneteAlSecondo: 0.37, pensa: 2.35, forza: 0.722 },
  tormenta: { d: 0.416, moneteAlSecondo: 0.378, pensa: 2.33, forza: 0.729 },
  cratere: { d: 0.422, moneteAlSecondo: 0.382, pensa: 2.32, forza: 0.732 },
  fucina: { d: 0.428, moneteAlSecondo: 0.385, pensa: 2.31, forza: 0.735 },
  trono: { d: 0.453, moneteAlSecondo: 0.401, pensa: 2.27, forza: 0.749 },
}
// la firma dell'equilibrio al momento della taratura (motore/firma.js): se non torna, rilancia la taratura
export const FIRMA = '10wchck'
