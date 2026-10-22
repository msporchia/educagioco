/* GENERATO da strumenti/tara-arena.mjs (`npm run tara:arena`) — non si scrive a mano.

   La scheda del nemico di ogni tappa, per ognuno dei tre livelli di difficoltà (facile, medio, difficile): `forza`
   (le sue truppe rispetto alle tue), `moneteAlSecondo` e `pensa` (ogni quanti secondi decide) sono funzione di una
   sola manopola `d` (0 = quasi inerme, 1 = pari al giocatore bravo), cercata per bisezione perché il bambino di
   prova vinca la quota che il livello promette in quella tappa. Vedi docs/arena/taratura.md. */
export const NEMICO_PER_LIVELLO = {
  facile: {
    scaramuccia: { d: 0.371, moneteAlSecondo: 0.545, pensa: 2.59, forza: 0.748, furbizia: 0 },
    ponte: { d: 0.566, moneteAlSecondo: 0.635, pensa: 2.38, forza: 0.827, furbizia: 0.044 },
    radura: { d: 0.598, moneteAlSecondo: 0.649, pensa: 2.34, forza: 0.839, furbizia: 0.065 },
    melma: { d: 0.551, moneteAlSecondo: 0.627, pensa: 2.39, forza: 0.82, furbizia: 0.034 },
    guado: { d: 0.52, moneteAlSecondo: 0.613, pensa: 2.43, forza: 0.808, furbizia: 0.013 },
    canneto: { d: 0.52, moneteAlSecondo: 0.613, pensa: 2.43, forza: 0.808, furbizia: 0.013 },
    valico: { d: 0.551, moneteAlSecondo: 0.627, pensa: 2.39, forza: 0.82, furbizia: 0.034 },
    ghiaccio: { d: 0.746, moneteAlSecondo: 0.717, pensa: 2.18, forza: 0.898, furbizia: 0.164 },
    tormenta: { d: 0.754, moneteAlSecondo: 0.721, pensa: 2.17, forza: 0.902, furbizia: 0.169 },
    cratere: { d: 0.793, moneteAlSecondo: 0.738, pensa: 2.13, forza: 0.917, furbizia: 0.195 },
    fucina: { d: 0.793, moneteAlSecondo: 0.738, pensa: 2.13, forza: 0.917, furbizia: 0.195 },
    trono: { d: 0.809, moneteAlSecondo: 0.746, pensa: 2.11, forza: 0.923, furbizia: 0.206 },
  },
  medio: {
    scaramuccia: { d: 0.566, moneteAlSecondo: 0.635, pensa: 2.38, forza: 0.827, furbizia: 0.044 },
    ponte: { d: 0.73, moneteAlSecondo: 0.71, pensa: 2.2, forza: 0.892, furbizia: 0.154 },
    radura: { d: 0.785, moneteAlSecondo: 0.735, pensa: 2.14, forza: 0.914, furbizia: 0.19 },
    melma: { d: 0.902, moneteAlSecondo: 0.789, pensa: 2.01, forza: 0.961, furbizia: 0.268 },
    guado: { d: 0.879, moneteAlSecondo: 0.778, pensa: 2.03, forza: 0.952, furbizia: 0.253 },
    canneto: { d: 0.895, moneteAlSecondo: 0.785, pensa: 2.02, forza: 0.958, furbizia: 0.263 },
    valico: { d: 0.785, moneteAlSecondo: 0.735, pensa: 2.14, forza: 0.914, furbizia: 0.19 },
    ghiaccio: { d: 0.895, moneteAlSecondo: 0.785, pensa: 2.02, forza: 0.958, furbizia: 0.263 },
    tormenta: { d: 0.895, moneteAlSecondo: 0.785, pensa: 2.02, forza: 0.958, furbizia: 0.263 },
    cratere: { d: 0.895, moneteAlSecondo: 0.785, pensa: 2.02, forza: 0.958, furbizia: 0.263 },
    fucina: { d: 0.926, moneteAlSecondo: 0.799, pensa: 1.98, forza: 0.97, furbizia: 0.284 },
    trono: { d: 0.965, moneteAlSecondo: 0.817, pensa: 1.94, forza: 0.986, furbizia: 0.31 },
  },
  difficile: {
    scaramuccia: { d: 0.66, moneteAlSecondo: 0.678, pensa: 2.27, forza: 0.864, furbizia: 0.107 },
    ponte: { d: 0.793, moneteAlSecondo: 0.738, pensa: 2.13, forza: 0.917, furbizia: 0.195 },
    radura: { d: 0.809, moneteAlSecondo: 0.746, pensa: 2.11, forza: 0.923, furbizia: 0.206 },
    melma: { d: 1.223, moneteAlSecondo: 0.833, pensa: 1.66, forza: 1, furbizia: 0.482 },
    guado: { d: 0.957, moneteAlSecondo: 0.814, pensa: 1.95, forza: 0.983, furbizia: 0.305 },
    canneto: { d: 1.035, moneteAlSecondo: 0.833, pensa: 1.86, forza: 1, furbizia: 0.357 },
    valico: { d: 0.895, moneteAlSecondo: 0.785, pensa: 2.02, forza: 0.958, furbizia: 0.263 },
    ghiaccio: { d: 0.934, moneteAlSecondo: 0.803, pensa: 1.97, forza: 0.973, furbizia: 0.289 },
    tormenta: { d: 0.973, moneteAlSecondo: 0.821, pensa: 1.93, forza: 0.989, furbizia: 0.315 },
    cratere: { d: 1.043, moneteAlSecondo: 0.833, pensa: 1.85, forza: 1, furbizia: 0.362 },
    fucina: { d: 1.098, moneteAlSecondo: 0.833, pensa: 1.79, forza: 1, furbizia: 0.398 },
    trono: { d: 1.168, moneteAlSecondo: 0.833, pensa: 1.72, forza: 1, furbizia: 0.445 },
  },
}
// quello di mezzo è la scheda di sempre
export const NEMICO = NEMICO_PER_LIVELLO.medio
// la firma dell'equilibrio al momento della taratura (motore/firma.js): se non torna, rilancia la taratura
export const FIRMA = '9uffjj'
