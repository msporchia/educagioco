/* GENERATO da strumenti/tara-arena.mjs (`npm run tara:arena`) — non si scrive a mano.

   La scheda del nemico di ogni tappa, trovata giocando: `forza` (le sue truppe
   rispetto alle tue), `moneteAlSecondo` e `pensa` (ogni quanti secondi decide)
   sono funzione di una sola manopola `d` (0 = quasi inerme, 1 = pari al giocatore
   bravo), cercata per bisezione perché il bambino di prova vinca la quota
   che la tappa promette. Vedi docs/arena/taratura.md. */
export const NEMICO = {
  scaramuccia: { d: 0.166, moneteAlSecondo: 0.223, pensa: 2.73, forza: 0.591 },
  ponte: { d: 0.253, moneteAlSecondo: 0.277, pensa: 2.59, forza: 0.639 },
  radura: { d: 0.197, moneteAlSecondo: 0.242, pensa: 2.69, forza: 0.608 },
  melma: { d: 0.228, moneteAlSecondo: 0.261, pensa: 2.63, forza: 0.625 },
  guado: { d: 0.272, moneteAlSecondo: 0.289, pensa: 2.56, forza: 0.65 },
  canneto: { d: 0.278, moneteAlSecondo: 0.292, pensa: 2.55, forza: 0.653 },
  valico: { d: 0.216, moneteAlSecondo: 0.254, pensa: 2.65, forza: 0.619 },
  ghiaccio: { d: 0.216, moneteAlSecondo: 0.254, pensa: 2.65, forza: 0.619 },
  tormenta: { d: 0.234, moneteAlSecondo: 0.265, pensa: 2.63, forza: 0.629 },
  cratere: { d: 0.253, moneteAlSecondo: 0.277, pensa: 2.59, forza: 0.639 },
  fucina: { d: 0.259, moneteAlSecondo: 0.281, pensa: 2.58, forza: 0.643 },
  trono: { d: 0.278, moneteAlSecondo: 0.292, pensa: 2.55, forza: 0.653 },
}
// la firma dell'equilibrio al momento della taratura (motore/firma.js): se non torna, rilancia la taratura
export const FIRMA = '13wfa6h'
