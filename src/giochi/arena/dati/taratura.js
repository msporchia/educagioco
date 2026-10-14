/* GENERATO da strumenti/tara-arena.mjs (`npm run tara:arena`) — non si scrive a mano.

   La scheda del nemico di ogni tappa, trovata giocando: `forza` (le sue truppe
   rispetto alle tue), `moneteAlSecondo` e `pensa` (ogni quanti secondi decide)
   sono funzione di una sola manopola `d` (0 = quasi inerme, 1 = pari al giocatore
   bravo), cercata per bisezione perché il bambino di prova vinca la quota
   che la tappa promette. Vedi docs/arena/taratura.md. */
export const NEMICO = {
  scaramuccia: { d: 0.592, moneteAlSecondo: 0.487, pensa: 2.05, forza: 0.825 },
  ponte: { d: 0.885, moneteAlSecondo: 0.669, pensa: 1.58, forza: 0.987 },
  radura: { d: 0.721, moneteAlSecondo: 0.567, pensa: 1.85, forza: 0.896 },
  melma: { d: 0.768, moneteAlSecondo: 0.596, pensa: 1.77, forza: 0.922 },
  guado: { d: 1.178, moneteAlSecondo: 0.85, pensa: 1.12, forza: 1.148 },
  canneto: { d: 1.178, moneteAlSecondo: 0.85, pensa: 1.12, forza: 1.148 },
  valico: { d: 1.213, moneteAlSecondo: 0.872, pensa: 1.06, forza: 1.167 },
  ghiaccio: { d: 1.213, moneteAlSecondo: 0.872, pensa: 1.06, forza: 1.167 },
  tormenta: { d: 1.33, moneteAlSecondo: 0.945, pensa: 0.87, forza: 1.232 },
  cratere: { d: 1.412, moneteAlSecondo: 0.996, pensa: 0.74, forza: 1.277 },
  fucina: { d: 1.471, moneteAlSecondo: 1.032, pensa: 0.65, forza: 1.309 },
  trono: { d: 1.471, moneteAlSecondo: 1.032, pensa: 0.65, forza: 1.309 },
}
// la firma dell'equilibrio al momento della taratura (motore/firma.js): se non torna, rilancia la taratura
export const FIRMA = 'rveod6'
