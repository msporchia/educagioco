/* GENERATO da strumenti/tara-arena.mjs (`npm run tara:arena`) — non si scrive a mano.

   La scheda del nemico di ogni tappa, per ognuno dei tre livelli di difficoltà (facile, medio, difficile): `forza`
   (le sue truppe rispetto alle tue), `moneteAlSecondo` e `pensa` (ogni quanti secondi decide) sono funzione di una
   sola manopola `d` (0 = quasi inerme, 1 = pari al giocatore bravo), cercata per bisezione perché il bambino di
   prova vinca la quota che il livello promette in quella tappa. Vedi docs/arena/taratura.md. */
export const NEMICO_PER_LIVELLO = {
  facile: {
    scaramuccia: { d: 0.371, moneteAlSecondo: 0.545, pensa: 2.59, forza: 0.748, furbizia: 0 },
    ponte: { d: 0.535, moneteAlSecondo: 0.62, pensa: 2.41, forza: 0.814, furbizia: 0.023 },
    radura: { d: 0.582, moneteAlSecondo: 0.642, pensa: 2.36, forza: 0.833, furbizia: 0.055 },
    melma: { d: 0.504, moneteAlSecondo: 0.606, pensa: 2.45, forza: 0.802, furbizia: 0.003 },
    guado: { d: 0.441, moneteAlSecondo: 0.577, pensa: 2.51, forza: 0.777, furbizia: 0 },
    canneto: { d: 0.449, moneteAlSecondo: 0.581, pensa: 2.51, forza: 0.78, furbizia: 0 },
    valico: { d: 0.52, moneteAlSecondo: 0.613, pensa: 2.43, forza: 0.808, furbizia: 0.013 },
    ghiaccio: { d: 0.637, moneteAlSecondo: 0.667, pensa: 2.3, forza: 0.855, furbizia: 0.091 },
    tormenta: { d: 0.637, moneteAlSecondo: 0.667, pensa: 2.3, forza: 0.855, furbizia: 0.091 },
    cratere: { d: 0.652, moneteAlSecondo: 0.674, pensa: 2.28, forza: 0.861, furbizia: 0.102 },
    fucina: { d: 0.66, moneteAlSecondo: 0.678, pensa: 2.27, forza: 0.864, furbizia: 0.107 },
    trono: { d: 0.699, moneteAlSecondo: 0.695, pensa: 2.23, forza: 0.88, furbizia: 0.133 },
  },
  medio: {
    scaramuccia: { d: 0.535, moneteAlSecondo: 0.62, pensa: 2.41, forza: 0.814, furbizia: 0.023 },
    ponte: { d: 0.621, moneteAlSecondo: 0.66, pensa: 2.32, forza: 0.848, furbizia: 0.081 },
    radura: { d: 0.676, moneteAlSecondo: 0.685, pensa: 2.26, forza: 0.87, furbizia: 0.117 },
    melma: { d: 0.699, moneteAlSecondo: 0.695, pensa: 2.23, forza: 0.88, furbizia: 0.133 },
    guado: { d: 0.691, moneteAlSecondo: 0.692, pensa: 2.24, forza: 0.877, furbizia: 0.128 },
    canneto: { d: 0.707, moneteAlSecondo: 0.699, pensa: 2.22, forza: 0.883, furbizia: 0.138 },
    valico: { d: 0.676, moneteAlSecondo: 0.685, pensa: 2.26, forza: 0.87, furbizia: 0.117 },
    ghiaccio: { d: 0.785, moneteAlSecondo: 0.735, pensa: 2.14, forza: 0.914, furbizia: 0.19 },
    tormenta: { d: 0.785, moneteAlSecondo: 0.735, pensa: 2.14, forza: 0.914, furbizia: 0.19 },
    cratere: { d: 0.793, moneteAlSecondo: 0.738, pensa: 2.13, forza: 0.917, furbizia: 0.195 },
    fucina: { d: 0.816, moneteAlSecondo: 0.749, pensa: 2.1, forza: 0.927, furbizia: 0.211 },
    trono: { d: 0.824, moneteAlSecondo: 0.753, pensa: 2.09, forza: 0.93, furbizia: 0.216 },
  },
  difficile: {
    scaramuccia: { d: 0.551, moneteAlSecondo: 0.627, pensa: 2.39, forza: 0.82, furbizia: 0.034 },
    ponte: { d: 0.621, moneteAlSecondo: 0.66, pensa: 2.32, forza: 0.848, furbizia: 0.081 },
    radura: { d: 0.707, moneteAlSecondo: 0.699, pensa: 2.22, forza: 0.883, furbizia: 0.138 },
    melma: { d: 0.707, moneteAlSecondo: 0.699, pensa: 2.22, forza: 0.883, furbizia: 0.138 },
    guado: { d: 0.723, moneteAlSecondo: 0.706, pensa: 2.21, forza: 0.889, furbizia: 0.148 },
    canneto: { d: 0.723, moneteAlSecondo: 0.706, pensa: 2.21, forza: 0.889, furbizia: 0.148 },
    valico: { d: 0.707, moneteAlSecondo: 0.699, pensa: 2.22, forza: 0.883, furbizia: 0.138 },
    ghiaccio: { d: 0.809, moneteAlSecondo: 0.746, pensa: 2.11, forza: 0.923, furbizia: 0.206 },
    tormenta: { d: 0.848, moneteAlSecondo: 0.764, pensa: 2.07, forza: 0.939, furbizia: 0.232 },
    cratere: { d: 0.855, moneteAlSecondo: 0.767, pensa: 2.06, forza: 0.942, furbizia: 0.237 },
    fucina: { d: 0.863, moneteAlSecondo: 0.771, pensa: 2.05, forza: 0.945, furbizia: 0.242 },
    trono: { d: 0.879, moneteAlSecondo: 0.778, pensa: 2.03, forza: 0.952, furbizia: 0.253 },
  },
}
// quello di mezzo è la scheda di sempre
export const NEMICO = NEMICO_PER_LIVELLO.medio
// la firma dell'equilibrio al momento della taratura (motore/firma.js): se non torna, rilancia la taratura
export const FIRMA = '9kftuk'
