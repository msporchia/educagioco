/* GENERATO da strumenti/tara-arena.mjs (`npm run tara:arena`) — non si scrive a mano.

   La scheda del nemico di ogni tappa, per ognuno dei tre livelli di difficoltà (facile, medio, difficile): `forza`
   (le sue truppe rispetto alle tue), `moneteAlSecondo` e `pensa` (ogni quanti secondi decide) sono funzione di una
   sola manopola `d` (0 = quasi inerme, 1 = pari al giocatore bravo), cercata per bisezione perché il bambino di
   prova vinca la quota che il livello promette in quella tappa. Vedi docs/arena/taratura.md. */
export const NEMICO_PER_LIVELLO = {
  facile: {
    scaramuccia: { d: 0.199, moneteAlSecondo: 0.311, pensa: 2.78, forza: 0.68, furbizia: 0 },
    ponte: { d: 0.441, moneteAlSecondo: 0.385, pensa: 2.51, forza: 0.777, furbizia: 0 },
    radura: { d: 0.488, moneteAlSecondo: 0.399, pensa: 2.46, forza: 0.795, furbizia: 0 },
    melma: { d: 0.441, moneteAlSecondo: 0.385, pensa: 2.51, forza: 0.777, furbizia: 0 },
    guado: { d: 0.41, moneteAlSecondo: 0.375, pensa: 2.55, forza: 0.764, furbizia: 0 },
    canneto: { d: 0.426, moneteAlSecondo: 0.38, pensa: 2.53, forza: 0.77, furbizia: 0 },
    valico: { d: 0.48, moneteAlSecondo: 0.397, pensa: 2.47, forza: 0.792, furbizia: 0 },
    ghiaccio: { d: 0.582, moneteAlSecondo: 0.428, pensa: 2.36, forza: 0.833, furbizia: 0.055 },
    tormenta: { d: 0.59, moneteAlSecondo: 0.43, pensa: 2.35, forza: 0.836, furbizia: 0.06 },
    cratere: { d: 0.613, moneteAlSecondo: 0.437, pensa: 2.33, forza: 0.845, furbizia: 0.076 },
    fucina: { d: 0.668, moneteAlSecondo: 0.454, pensa: 2.27, forza: 0.867, furbizia: 0.112 },
    trono: { d: 0.676, moneteAlSecondo: 0.456, pensa: 2.26, forza: 0.87, furbizia: 0.117 },
  },
  medio: {
    scaramuccia: { d: 0.488, moneteAlSecondo: 0.399, pensa: 2.46, forza: 0.795, furbizia: 0 },
    ponte: { d: 0.621, moneteAlSecondo: 0.44, pensa: 2.32, forza: 0.848, furbizia: 0.081 },
    radura: { d: 0.691, moneteAlSecondo: 0.461, pensa: 2.24, forza: 0.877, furbizia: 0.128 },
    melma: { d: 0.684, moneteAlSecondo: 0.459, pensa: 2.25, forza: 0.873, furbizia: 0.122 },
    guado: { d: 0.699, moneteAlSecondo: 0.464, pensa: 2.23, forza: 0.88, furbizia: 0.133 },
    canneto: { d: 0.777, moneteAlSecondo: 0.488, pensa: 2.14, forza: 0.911, furbizia: 0.185 },
    valico: { d: 0.699, moneteAlSecondo: 0.464, pensa: 2.23, forza: 0.88, furbizia: 0.133 },
    ghiaccio: { d: 0.785, moneteAlSecondo: 0.49, pensa: 2.14, forza: 0.914, furbizia: 0.19 },
    tormenta: { d: 0.824, moneteAlSecondo: 0.502, pensa: 2.09, forza: 0.93, furbizia: 0.216 },
    cratere: { d: 0.824, moneteAlSecondo: 0.502, pensa: 2.09, forza: 0.93, furbizia: 0.216 },
    fucina: { d: 0.902, moneteAlSecondo: 0.526, pensa: 2.01, forza: 0.961, furbizia: 0.268 },
    trono: { d: 0.918, moneteAlSecondo: 0.53, pensa: 1.99, forza: 0.967, furbizia: 0.279 },
  },
  difficile: {
    scaramuccia: { d: 0.504, moneteAlSecondo: 0.404, pensa: 2.45, forza: 0.802, furbizia: 0.003 },
    ponte: { d: 0.566, moneteAlSecondo: 0.423, pensa: 2.38, forza: 0.827, furbizia: 0.044 },
    radura: { d: 0.723, moneteAlSecondo: 0.471, pensa: 2.21, forza: 0.889, furbizia: 0.148 },
    melma: { d: 0.777, moneteAlSecondo: 0.488, pensa: 2.14, forza: 0.911, furbizia: 0.185 },
    guado: { d: 0.777, moneteAlSecondo: 0.488, pensa: 2.14, forza: 0.911, furbizia: 0.185 },
    canneto: { d: 0.793, moneteAlSecondo: 0.492, pensa: 2.13, forza: 0.917, furbizia: 0.195 },
    valico: { d: 0.793, moneteAlSecondo: 0.492, pensa: 2.13, forza: 0.917, furbizia: 0.195 },
    ghiaccio: { d: 0.863, moneteAlSecondo: 0.514, pensa: 2.05, forza: 0.945, furbizia: 0.242 },
    tormenta: { d: 0.941, moneteAlSecondo: 0.538, pensa: 1.96, forza: 0.977, furbizia: 0.294 },
    cratere: { d: 0.98, moneteAlSecondo: 0.55, pensa: 1.92, forza: 0.992, furbizia: 0.32 },
    fucina: { d: 1.129, moneteAlSecondo: 0.556, pensa: 1.76, forza: 1, furbizia: 0.419 },
    trono: { d: 1.254, moneteAlSecondo: 0.556, pensa: 1.62, forza: 1, furbizia: 0.503 },
  },
}
// quello di mezzo è la scheda di sempre
export const NEMICO = NEMICO_PER_LIVELLO.medio
// la firma dell'equilibrio al momento della taratura (motore/firma.js): se non torna, rilancia la taratura
export const FIRMA = '1loe6mz'
