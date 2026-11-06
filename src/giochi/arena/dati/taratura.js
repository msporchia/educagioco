/* GENERATO da strumenti/tara-arena.mjs (`npm run tara:arena`) — non si scrive a mano.

   La scheda del nemico di ogni tappa, per ognuno dei tre livelli di difficoltà (facile, medio, difficile): `forza`
   (le sue truppe rispetto alle tue), `moneteAlSecondo` e `pensa` (ogni quanti secondi decide) sono funzione di una
   sola manopola `d` (0 = quasi inerme, 1 = pari al giocatore bravo), cercata per bisezione perché il bambino di
   prova vinca la quota che il livello promette in quella tappa. Vedi docs/arena/taratura.md. */
export const NEMICO_PER_LIVELLO = {
  facile: {
    scaramuccia: { d: 0.434, moneteAlSecondo: 0.382, pensa: 2.52, forza: 0.773, furbizia: 0 },
    ponte: { d: 0.52, moneteAlSecondo: 0.409, pensa: 2.43, forza: 0.808, furbizia: 0.013 },
    radura: { d: 0.582, moneteAlSecondo: 0.428, pensa: 2.36, forza: 0.833, furbizia: 0.055 },
    melma: { d: 0.504, moneteAlSecondo: 0.404, pensa: 2.45, forza: 0.802, furbizia: 0.003 },
    guado: { d: 0.574, moneteAlSecondo: 0.425, pensa: 2.37, forza: 0.83, furbizia: 0.049 },
    canneto: { d: 0.629, moneteAlSecondo: 0.442, pensa: 2.31, forza: 0.852, furbizia: 0.086 },
    valico: { d: 0.645, moneteAlSecondo: 0.447, pensa: 2.29, forza: 0.858, furbizia: 0.096 },
    ghiaccio: { d: 0.738, moneteAlSecondo: 0.476, pensa: 2.19, forza: 0.895, furbizia: 0.159 },
    tormenta: { d: 0.77, moneteAlSecondo: 0.485, pensa: 2.15, forza: 0.908, furbizia: 0.18 },
    cratere: { d: 0.816, moneteAlSecondo: 0.499, pensa: 2.1, forza: 0.927, furbizia: 0.211 },
    fucina: { d: 0.879, moneteAlSecondo: 0.519, pensa: 2.03, forza: 0.952, furbizia: 0.253 },
    trono: { d: 0.91, moneteAlSecondo: 0.528, pensa: 2, forza: 0.964, furbizia: 0.273 },
  },
  medio: {
    scaramuccia: { d: 0.457, moneteAlSecondo: 0.39, pensa: 2.5, forza: 0.783, furbizia: 0 },
    ponte: { d: 0.52, moneteAlSecondo: 0.409, pensa: 2.43, forza: 0.808, furbizia: 0.013 },
    radura: { d: 0.676, moneteAlSecondo: 0.456, pensa: 2.26, forza: 0.87, furbizia: 0.117 },
    melma: { d: 0.582, moneteAlSecondo: 0.428, pensa: 2.36, forza: 0.833, furbizia: 0.055 },
    guado: { d: 0.66, moneteAlSecondo: 0.452, pensa: 2.27, forza: 0.864, furbizia: 0.107 },
    canneto: { d: 0.699, moneteAlSecondo: 0.464, pensa: 2.23, forza: 0.88, furbizia: 0.133 },
    valico: { d: 0.715, moneteAlSecondo: 0.468, pensa: 2.21, forza: 0.886, furbizia: 0.143 },
    ghiaccio: { d: 0.879, moneteAlSecondo: 0.519, pensa: 2.03, forza: 0.952, furbizia: 0.253 },
    tormenta: { d: 0.941, moneteAlSecondo: 0.538, pensa: 1.96, forza: 0.977, furbizia: 0.294 },
    cratere: { d: 1.035, moneteAlSecondo: 0.556, pensa: 1.86, forza: 1, furbizia: 0.357 },
    fucina: { d: 1.16, moneteAlSecondo: 0.556, pensa: 1.72, forza: 1, furbizia: 0.44 },
    trono: { d: 1.246, moneteAlSecondo: 0.556, pensa: 1.63, forza: 1, furbizia: 0.497 },
  },
  difficile: {
    scaramuccia: { d: 0.543, moneteAlSecondo: 0.416, pensa: 2.4, forza: 0.817, furbizia: 0.029 },
    ponte: { d: 0.59, moneteAlSecondo: 0.43, pensa: 2.35, forza: 0.836, furbizia: 0.06 },
    radura: { d: 0.762, moneteAlSecondo: 0.483, pensa: 2.16, forza: 0.905, furbizia: 0.174 },
    melma: { d: 0.66, moneteAlSecondo: 0.452, pensa: 2.27, forza: 0.864, furbizia: 0.107 },
    guado: { d: 0.715, moneteAlSecondo: 0.468, pensa: 2.21, forza: 0.886, furbizia: 0.143 },
    canneto: { d: 0.754, moneteAlSecondo: 0.48, pensa: 2.17, forza: 0.902, furbizia: 0.169 },
    valico: { d: 0.809, moneteAlSecondo: 0.497, pensa: 2.11, forza: 0.923, furbizia: 0.206 },
    ghiaccio: { d: 0.918, moneteAlSecondo: 0.53, pensa: 1.99, forza: 0.967, furbizia: 0.279 },
    tormenta: { d: 0.949, moneteAlSecondo: 0.54, pensa: 1.96, forza: 0.98, furbizia: 0.299 },
    cratere: { d: 0.965, moneteAlSecondo: 0.545, pensa: 1.94, forza: 0.986, furbizia: 0.31 },
    fucina: { d: 1.027, moneteAlSecondo: 0.556, pensa: 1.87, forza: 1, furbizia: 0.352 },
    trono: { d: 1.051, moneteAlSecondo: 0.556, pensa: 1.84, forza: 1, furbizia: 0.367 },
  },
}
// quello di mezzo è la scheda di sempre
export const NEMICO = NEMICO_PER_LIVELLO.medio
// la firma dell'equilibrio al momento della taratura (motore/firma.js): se non torna, rilancia la taratura
export const FIRMA = 'hq0ums'
