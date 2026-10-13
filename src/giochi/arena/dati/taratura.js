/* GENERATO da strumenti/tara-arena.mjs (`npm run tara:arena`) — non si scrive a mano.

   La scheda del nemico di ogni tappa, trovata giocando: `forza` (le sue truppe
   rispetto alle tue), `moneteAlSecondo` e `pensa` (ogni quanti secondi decide)
   sono funzione di una sola manopola `d` (0 = quasi inerme, 1 = pari al giocatore
   bravo), cercata per bisezione perché il bambino di prova vinca la quota
   che la tappa promette. Vedi docs/arena/taratura.md. */
export const NEMICO = {
  scaramuccia: { d: 0.416, moneteAlSecondo: 0.378, pensa: 2.33, forza: 0.729 },
  ponte: { d: 0.391, moneteAlSecondo: 0.362, pensa: 2.38, forza: 0.715 },
  radura: { d: 0.409, moneteAlSecondo: 0.374, pensa: 2.34, forza: 0.725 },
  melma: { d: 0.353, moneteAlSecondo: 0.339, pensa: 2.44, forza: 0.694 },
  guado: { d: 0.428, moneteAlSecondo: 0.385, pensa: 2.31, forza: 0.735 },
  canneto: { d: 0.578, moneteAlSecondo: 0.478, pensa: 2.08, forza: 0.818 },
  valico: { d: 0.591, moneteAlSecondo: 0.486, pensa: 2.05, forza: 0.825 },
  ghiaccio: { d: 0.603, moneteAlSecondo: 0.494, pensa: 2.03, forza: 0.832 },
  tormenta: { d: 0.653, moneteAlSecondo: 0.525, pensa: 1.95, forza: 0.859 },
  cratere: { d: 0.678, moneteAlSecondo: 0.54, pensa: 1.91, forza: 0.873 },
  fucina: { d: 0.678, moneteAlSecondo: 0.54, pensa: 1.91, forza: 0.873 },
  trono: { d: 0.678, moneteAlSecondo: 0.54, pensa: 1.91, forza: 0.873 },
}
// la firma dell'equilibrio al momento della taratura (motore/firma.js): se non torna, rilancia la taratura
export const FIRMA = 'whg98y'
