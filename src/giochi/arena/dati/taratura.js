/* GENERATO da strumenti/tara-arena.mjs (`npm run tara:arena`) — non si scrive a mano.

   La scheda del nemico di ogni tappa, trovata giocando: `forza` (le sue truppe
   rispetto alle tue), `moneteAlSecondo` e `pensa` (ogni quanti secondi decide)
   sono funzione di una sola manopola `d` (0 = quasi inerme, 1 = pari al giocatore
   bravo), cercata per bisezione perché il bambino di prova vinca la quota
   che la tappa promette. Vedi docs/arena/taratura.md. */
export const NEMICO = {
  scaramuccia: { d: 0.534, moneteAlSecondo: 0.451, pensa: 2.15, forza: 0.794 },
  ponte: { d: 0.547, moneteAlSecondo: 0.459, pensa: 2.13, forza: 0.801 },
  radura: { d: 0.259, moneteAlSecondo: 0.281, pensa: 2.58, forza: 0.643 },
  melma: { d: 0.259, moneteAlSecondo: 0.281, pensa: 2.58, forza: 0.643 },
  guado: { d: 0.403, moneteAlSecondo: 0.37, pensa: 2.35, forza: 0.722 },
  canneto: { d: 0.403, moneteAlSecondo: 0.37, pensa: 2.35, forza: 0.722 },
  valico: { d: 0.416, moneteAlSecondo: 0.378, pensa: 2.33, forza: 0.729 },
  ghiaccio: { d: 0.434, moneteAlSecondo: 0.389, pensa: 2.3, forza: 0.739 },
  tormenta: { d: 0.441, moneteAlSecondo: 0.393, pensa: 2.29, forza: 0.742 },
  cratere: { d: 0.453, moneteAlSecondo: 0.401, pensa: 2.27, forza: 0.749 },
  fucina: { d: 0.466, moneteAlSecondo: 0.409, pensa: 2.25, forza: 0.756 },
  trono: { d: 0.478, moneteAlSecondo: 0.416, pensa: 2.23, forza: 0.763 },
}
// la firma dell'equilibrio al momento della taratura (motore/firma.js): se non torna, rilancia la taratura
export const FIRMA = 'zjiivo'
