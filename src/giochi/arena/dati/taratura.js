/* GENERATO da strumenti/tara-arena.mjs (`npm run tara:arena`) — non si scrive a mano.

   La scheda del nemico di ogni tappa, trovata giocando: `forza` (le sue truppe
   rispetto alle tue), `moneteAlSecondo` e `pensa` (ogni quanti secondi decide)
   sono funzione di una sola manopola `d` (0 = quasi inerme, 1 = pari al giocatore
   bravo), cercata per bisezione perché il bambino di prova vinca la quota
   che la tappa promette. Vedi docs/arena/taratura.md. */
export const NEMICO = {
  scaramuccia: { d: 0.447, moneteAlSecondo: 0.397, pensa: 2.29, forza: 0.746 },
  ponte: { d: 0.503, moneteAlSecondo: 0.432, pensa: 2.19, forza: 0.777 },
  radura: { d: 0.297, moneteAlSecondo: 0.304, pensa: 2.52, forza: 0.663 },
  melma: { d: 0.403, moneteAlSecondo: 0.37, pensa: 2.35, forza: 0.722 },
  guado: { d: 0.434, moneteAlSecondo: 0.389, pensa: 2.3, forza: 0.739 },
  canneto: { d: 0.453, moneteAlSecondo: 0.401, pensa: 2.27, forza: 0.749 },
  valico: { d: 0.428, moneteAlSecondo: 0.385, pensa: 2.31, forza: 0.735 },
  ghiaccio: { d: 0.434, moneteAlSecondo: 0.389, pensa: 2.3, forza: 0.739 },
  tormenta: { d: 0.453, moneteAlSecondo: 0.401, pensa: 2.27, forza: 0.749 },
  cratere: { d: 0.478, moneteAlSecondo: 0.416, pensa: 2.23, forza: 0.763 },
  fucina: { d: 0.491, moneteAlSecondo: 0.424, pensa: 2.21, forza: 0.77 },
  trono: { d: 0.497, moneteAlSecondo: 0.428, pensa: 2.21, forza: 0.773 },
}
// la firma dell'equilibrio al momento della taratura (motore/firma.js): se non torna, rilancia la taratura
export const FIRMA = '1uusd90'
