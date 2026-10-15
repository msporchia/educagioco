/* GENERATO da strumenti/tara-arena.mjs (`npm run tara:arena`) — non si scrive a mano.

   La scheda del nemico di ogni tappa, trovata giocando: `forza` (le sue truppe
   rispetto alle tue), `moneteAlSecondo` e `pensa` (ogni quanti secondi decide)
   sono funzione di una sola manopola `d` (0 = quasi inerme, 1 = pari al giocatore
   bravo), cercata per bisezione perché il bambino di prova vinca la quota
   che la tappa promette. Vedi docs/arena/taratura.md. */
export const NEMICO = {
  scaramuccia: { d: 0.598, moneteAlSecondo: 0.649, pensa: 2.34, forza: 0.839, furbizia: 0.065 },
  ponte: { d: 0.762, moneteAlSecondo: 0.724, pensa: 2.16, forza: 0.905, furbizia: 0.174 },
  radura: { d: 0.754, moneteAlSecondo: 0.721, pensa: 2.17, forza: 0.902, furbizia: 0.169 },
  melma: { d: 0.777, moneteAlSecondo: 0.731, pensa: 2.14, forza: 0.911, furbizia: 0.185 },
  guado: { d: 0.871, moneteAlSecondo: 0.774, pensa: 2.04, forza: 0.948, furbizia: 0.247 },
  canneto: { d: 0.91, moneteAlSecondo: 0.792, pensa: 2, forza: 0.964, furbizia: 0.273 },
  valico: { d: 0.973, moneteAlSecondo: 0.821, pensa: 1.93, forza: 0.989, furbizia: 0.315 },
  ghiaccio: { d: 1.129, moneteAlSecondo: 0.833, pensa: 1.76, forza: 1, furbizia: 0.419 },
  tormenta: { d: 1.59, moneteAlSecondo: 0.833, pensa: 1.25, forza: 1, furbizia: 0.727 },
  cratere: { d: 2, moneteAlSecondo: 0.833, pensa: 0.8, forza: 1, furbizia: 1 },
  fucina: { d: 2, moneteAlSecondo: 0.833, pensa: 0.8, forza: 1, furbizia: 1 },
  trono: { d: 2, moneteAlSecondo: 0.833, pensa: 0.8, forza: 1, furbizia: 1 },
}
// la firma dell'equilibrio al momento della taratura (motore/firma.js): se non torna, rilancia la taratura
export const FIRMA = 'v291t1'
