/* GENERATO da strumenti/tara-arena.mjs (`npm run tara:arena`) — non si scrive a mano.

   La scheda del nemico di ogni tappa, trovata giocando: `forza` (le sue truppe
   rispetto alle tue), `moneteAlSecondo` e `pensa` (ogni quanti secondi decide)
   sono funzione di una sola manopola `d` (0 = quasi inerme, 1 = pari al giocatore
   bravo), cercata per bisezione perché il bambino di prova vinca la quota
   che la tappa promette. Vedi docs/arena/taratura.md. */
export const NEMICO = {
  scaramuccia: { d: 0.391, moneteAlSecondo: 0.362, pensa: 2.38, forza: 0.715 },
  ponte: { d: 0.491, moneteAlSecondo: 0.424, pensa: 2.21, forza: 0.77 },
  radura: { d: 0.247, moneteAlSecondo: 0.273, pensa: 2.6, forza: 0.636 },
  melma: { d: 0.228, moneteAlSecondo: 0.261, pensa: 2.63, forza: 0.625 },
  guado: { d: 0.366, moneteAlSecondo: 0.347, pensa: 2.42, forza: 0.701 },
  canneto: { d: 0.366, moneteAlSecondo: 0.347, pensa: 2.42, forza: 0.701 },
  valico: { d: 0.372, moneteAlSecondo: 0.351, pensa: 2.4, forza: 0.705 },
  ghiaccio: { d: 0.378, moneteAlSecondo: 0.354, pensa: 2.4, forza: 0.708 },
  tormenta: { d: 0.378, moneteAlSecondo: 0.354, pensa: 2.4, forza: 0.708 },
  cratere: { d: 0.397, moneteAlSecondo: 0.366, pensa: 2.36, forza: 0.718 },
  fucina: { d: 0.434, moneteAlSecondo: 0.389, pensa: 2.3, forza: 0.739 },
  trono: { d: 0.453, moneteAlSecondo: 0.401, pensa: 2.27, forza: 0.749 },
}
// la firma dell'equilibrio al momento della taratura (motore/firma.js): se non torna, rilancia la taratura
export const FIRMA = '10d2hf0'
