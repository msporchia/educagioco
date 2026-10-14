/* GENERATO da strumenti/tara-arena.mjs (`npm run tara:arena`) — non si scrive a mano.

   La scheda del nemico di ogni tappa, trovata giocando: `forza` (le sue truppe
   rispetto alle tue), `moneteAlSecondo` e `pensa` (ogni quanti secondi decide)
   sono funzione di una sola manopola `d` (0 = quasi inerme, 1 = pari al giocatore
   bravo), cercata per bisezione perché il bambino di prova vinca la quota
   che la tappa promette. Vedi docs/arena/taratura.md. */
export const NEMICO = {
  scaramuccia: { d: 0.58, moneteAlSecondo: 0.48, pensa: 2.07, forza: 0.819 },
  ponte: { d: 1.014, moneteAlSecondo: 0.748, pensa: 1.38, forza: 1.058 },
  radura: { d: 0.768, moneteAlSecondo: 0.596, pensa: 1.77, forza: 0.922 },
  melma: { d: 0.838, moneteAlSecondo: 0.639, pensa: 1.66, forza: 0.961 },
  guado: { d: 0.943, moneteAlSecondo: 0.705, pensa: 1.49, forza: 1.019 },
  canneto: { d: 0.943, moneteAlSecondo: 0.705, pensa: 1.49, forza: 1.019 },
  valico: { d: 1.072, moneteAlSecondo: 0.785, pensa: 1.28, forza: 1.09 },
  ghiaccio: { d: 1.119, moneteAlSecondo: 0.814, pensa: 1.21, forza: 1.116 },
  tormenta: { d: 1.213, moneteAlSecondo: 0.872, pensa: 1.06, forza: 1.167 },
  cratere: { d: 1.213, moneteAlSecondo: 0.872, pensa: 1.06, forza: 1.167 },
  fucina: { d: 1.658, moneteAlSecondo: 1.148, pensa: 0.35, forza: 1.412 },
  trono: { d: 1.658, moneteAlSecondo: 1.148, pensa: 0.35, forza: 1.412 },
}
// la firma dell'equilibrio al momento della taratura (motore/firma.js): se non torna, rilancia la taratura
export const FIRMA = 't8mepr'
