/* GENERATO da strumenti/tara-arena.mjs (`npm run tara:arena`) — non si scrive a mano.

   La scheda del nemico di ogni tappa, trovata giocando: `forza` (le sue truppe
   rispetto alle tue), `moneteAlSecondo` e `pensa` (ogni quanti secondi decide)
   sono funzione di una sola manopola `d` (0 = quasi inerme, 1 = pari al giocatore
   bravo), cercata per bisezione perché il bambino di prova vinca la quota
   che la tappa promette. Vedi docs/arena/taratura.md. */
export const NEMICO = {
  scaramuccia: { d: 0.504, moneteAlSecondo: 0.606, pensa: 2.45, forza: 0.802, furbizia: 0.003 },
  ponte: { d: 0.746, moneteAlSecondo: 0.717, pensa: 2.18, forza: 0.898, furbizia: 0.164 },
  radura: { d: 0.441, moneteAlSecondo: 0.577, pensa: 2.51, forza: 0.777, furbizia: 0 },
  melma: { d: 0.652, moneteAlSecondo: 0.674, pensa: 2.28, forza: 0.861, furbizia: 0.102 },
  guado: { d: 0.676, moneteAlSecondo: 0.685, pensa: 2.26, forza: 0.87, furbizia: 0.117 },
  canneto: { d: 0.715, moneteAlSecondo: 0.703, pensa: 2.21, forza: 0.886, furbizia: 0.143 },
  valico: { d: 0.793, moneteAlSecondo: 0.738, pensa: 2.13, forza: 0.917, furbizia: 0.195 },
  ghiaccio: { d: 0.824, moneteAlSecondo: 0.753, pensa: 2.09, forza: 0.93, furbizia: 0.216 },
  tormenta: { d: 0.863, moneteAlSecondo: 0.771, pensa: 2.05, forza: 0.945, furbizia: 0.242 },
  cratere: { d: 0.918, moneteAlSecondo: 0.796, pensa: 1.99, forza: 0.967, furbizia: 0.279 },
  fucina: { d: 0.926, moneteAlSecondo: 0.799, pensa: 1.98, forza: 0.97, furbizia: 0.284 },
  trono: { d: 1.043, moneteAlSecondo: 0.833, pensa: 1.85, forza: 1, furbizia: 0.362 },
}
// la firma dell'equilibrio al momento della taratura (motore/firma.js): se non torna, rilancia la taratura
export const FIRMA = 'q7h27c'
