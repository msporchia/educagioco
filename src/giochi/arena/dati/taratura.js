/* GENERATO da strumenti/tara-arena.mjs (`npm run tara:arena`) — non si scrive a mano.

   La scheda del nemico di ogni tappa, trovata giocando: `forza` (le sue truppe
   rispetto alle tue), `moneteAlSecondo` e `pensa` (ogni quanti secondi decide)
   sono funzione di una sola manopola `d` (0 = quasi inerme, 1 = pari al giocatore
   bravo), cercata per bisezione perché il bambino di prova vinca la quota
   che la tappa promette. Vedi docs/arena/taratura.md. */
export const NEMICO = {
  scaramuccia: { d: 0.73, moneteAlSecondo: 0.71, pensa: 2.2, forza: 0.892, furbizia: 0.154 },
  ponte: { d: 0.785, moneteAlSecondo: 0.735, pensa: 2.14, forza: 0.914, furbizia: 0.19 },
  radura: { d: 0.746, moneteAlSecondo: 0.717, pensa: 2.18, forza: 0.898, furbizia: 0.164 },
  melma: { d: 0.785, moneteAlSecondo: 0.735, pensa: 2.14, forza: 0.914, furbizia: 0.19 },
  guado: { d: 0.926, moneteAlSecondo: 0.799, pensa: 1.98, forza: 0.97, furbizia: 0.284 },
  canneto: { d: 0.973, moneteAlSecondo: 0.821, pensa: 1.93, forza: 0.989, furbizia: 0.315 },
  valico: { d: 1.449, moneteAlSecondo: 0.833, pensa: 1.41, forza: 1, furbizia: 0.633 },
  ghiaccio: { d: 1.59, moneteAlSecondo: 0.833, pensa: 1.25, forza: 1, furbizia: 0.727 },
  tormenta: { d: 1.59, moneteAlSecondo: 0.833, pensa: 1.25, forza: 1, furbizia: 0.727 },
  cratere: { d: 2, moneteAlSecondo: 0.833, pensa: 0.8, forza: 1, furbizia: 1 },
  fucina: { d: 2, moneteAlSecondo: 0.833, pensa: 0.8, forza: 1, furbizia: 1 },
  trono: { d: 2, moneteAlSecondo: 0.833, pensa: 0.8, forza: 1, furbizia: 1 },
}
// la firma dell'equilibrio al momento della taratura (motore/firma.js): se non torna, rilancia la taratura
export const FIRMA = '1s9wwko'
