/* GENERATO da strumenti/tara-arena.mjs (`npm run tara:arena`) — non si scrive a mano.

   La scheda del nemico di ogni tappa, trovata giocando: `forza` (le sue truppe
   rispetto alle tue), `moneteAlSecondo` e `pensa` (ogni quanti secondi decide)
   sono funzione di una sola manopola `d` (0 = quasi inerme, 1 = pari al giocatore
   bravo), cercata per bisezione perché il bambino di prova vinca la quota
   che la tappa promette. Vedi docs/arena/taratura.md. */
export const NEMICO = {
  scaramuccia: { d: 0.278, moneteAlSecondo: 0.292, pensa: 2.55, forza: 0.653 },
  ponte: { d: 0.291, moneteAlSecondo: 0.3, pensa: 2.54, forza: 0.66 },
  radura: { d: 0.034, moneteAlSecondo: 0.141, pensa: 2.94, forza: 0.519 },
  melma: { d: 0.172, moneteAlSecondo: 0.227, pensa: 2.73, forza: 0.595 },
  guado: { d: 0.303, moneteAlSecondo: 0.308, pensa: 2.51, forza: 0.667 },
  canneto: { d: 0.309, moneteAlSecondo: 0.312, pensa: 2.5, forza: 0.67 },
  valico: { d: 0.128, moneteAlSecondo: 0.199, pensa: 2.79, forza: 0.57 },
  ghiaccio: { d: 0.209, moneteAlSecondo: 0.25, pensa: 2.67, forza: 0.615 },
  tormenta: { d: 0.209, moneteAlSecondo: 0.25, pensa: 2.67, forza: 0.615 },
  cratere: { d: 0.259, moneteAlSecondo: 0.281, pensa: 2.58, forza: 0.643 },
  fucina: { d: 0.278, moneteAlSecondo: 0.292, pensa: 2.55, forza: 0.653 },
  trono: { d: 0.303, moneteAlSecondo: 0.308, pensa: 2.51, forza: 0.667 },
}
// la firma dell'equilibrio al momento della taratura (motore/firma.js): se non torna, rilancia la taratura
export const FIRMA = '1rlqpz5'
