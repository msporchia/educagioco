/* GENERATO da strumenti/tara-arena.mjs (`npm run tara:arena`) — non si scrive a mano.

   La scheda del nemico di ogni tappa, trovata giocando: `forza` (le sue truppe
   rispetto alle tue), `moneteAlSecondo` e `pensa` (ogni quanti secondi decide)
   sono funzione di una sola manopola `d` (0 = quasi inerme, 1 = pari al giocatore
   bravo), cercata per bisezione perché il bambino di prova vinca la quota
   che la tappa promette. Vedi docs/arena/taratura.md. */
export const NEMICO = {
  scaramuccia: { d: 0.134, moneteAlSecondo: 0.203, pensa: 2.79, forza: 0.574 },
  ponte: { d: 0.266, moneteAlSecondo: 0.285, pensa: 2.58, forza: 0.646 },
  radura: { d: 0.184, moneteAlSecondo: 0.234, pensa: 2.71, forza: 0.601 },
  melma: { d: 0.222, moneteAlSecondo: 0.258, pensa: 2.65, forza: 0.622 },
  guado: { d: 0.284, moneteAlSecondo: 0.296, pensa: 2.54, forza: 0.656 },
  canneto: { d: 0.291, moneteAlSecondo: 0.3, pensa: 2.54, forza: 0.66 },
  valico: { d: 0.234, moneteAlSecondo: 0.265, pensa: 2.63, forza: 0.629 },
  ghiaccio: { d: 0.247, moneteAlSecondo: 0.273, pensa: 2.6, forza: 0.636 },
  tormenta: { d: 0.278, moneteAlSecondo: 0.292, pensa: 2.55, forza: 0.653 },
  cratere: { d: 0.291, moneteAlSecondo: 0.3, pensa: 2.54, forza: 0.66 },
  fucina: { d: 0.316, moneteAlSecondo: 0.316, pensa: 2.5, forza: 0.674 },
  trono: { d: 0.347, moneteAlSecondo: 0.335, pensa: 2.44, forza: 0.691 },
}
// la firma dell'equilibrio al momento della taratura (motore/firma.js): se non torna, rilancia la taratura
export const FIRMA = '1bzbecq'
