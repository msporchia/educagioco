/* GENERATO da strumenti/tara-arena.mjs (`npm run tara:arena`) — non si scrive a mano.

   La scheda del nemico di ogni tappa, per ognuno dei tre livelli di difficoltà (facile, medio, difficile): `forza`
   (le sue truppe rispetto alle tue), `moneteAlSecondo` e `pensa` (ogni quanti secondi decide) sono funzione di una
   sola manopola `d` (0 = quasi inerme, 1 = pari al giocatore bravo), cercata per bisezione perché il bambino di
   prova vinca la quota che il livello promette in quella tappa. Vedi docs/arena/taratura.md. */
export const NEMICO_PER_LIVELLO = {
  facile: {
    scaramuccia: { d: 0.521, moneteAlSecondo: 0.409, pensa: 2.43, forza: 0.809, furbizia: 0.014 },
    ponte: { d: 0.58, moneteAlSecondo: 0.427, pensa: 2.36, forza: 0.832, furbizia: 0.053 },
    radura: { d: 0.592, moneteAlSecondo: 0.431, pensa: 2.35, forza: 0.837, furbizia: 0.061 },
    melma: { d: 0.58, moneteAlSecondo: 0.427, pensa: 2.36, forza: 0.832, furbizia: 0.053 },
    guado: { d: 0.619, moneteAlSecondo: 0.439, pensa: 2.32, forza: 0.848, furbizia: 0.079 },
    canneto: { d: 0.635, moneteAlSecondo: 0.444, pensa: 2.3, forza: 0.854, furbizia: 0.09 },
    valico: { d: 0.607, moneteAlSecondo: 0.436, pensa: 2.33, forza: 0.843, furbizia: 0.072 },
    ghiaccio: { d: 0.74, moneteAlSecondo: 0.476, pensa: 2.19, forza: 0.896, furbizia: 0.16 },
    tormenta: { d: 0.74, moneteAlSecondo: 0.476, pensa: 2.19, forza: 0.896, furbizia: 0.16 },
    cratere: { d: 0.717, moneteAlSecondo: 0.469, pensa: 2.21, forza: 0.887, furbizia: 0.145 },
    fucina: { d: 0.783, moneteAlSecondo: 0.489, pensa: 2.14, forza: 0.913, furbizia: 0.189 },
    trono: { d: 0.807, moneteAlSecondo: 0.496, pensa: 2.11, forza: 0.923, furbizia: 0.204 },
  },
  medio: {
    scaramuccia: { d: 0.529, moneteAlSecondo: 0.412, pensa: 2.42, forza: 0.812, furbizia: 0.02 },
    ponte: { d: 0.58, moneteAlSecondo: 0.427, pensa: 2.36, forza: 0.832, furbizia: 0.053 },
    radura: { d: 0.615, moneteAlSecondo: 0.438, pensa: 2.32, forza: 0.846, furbizia: 0.077 },
    melma: { d: 0.58, moneteAlSecondo: 0.427, pensa: 2.36, forza: 0.832, furbizia: 0.053 },
    guado: { d: 0.639, moneteAlSecondo: 0.445, pensa: 2.3, forza: 0.855, furbizia: 0.092 },
    canneto: { d: 0.658, moneteAlSecondo: 0.451, pensa: 2.28, forza: 0.863, furbizia: 0.105 },
    valico: { d: 0.643, moneteAlSecondo: 0.446, pensa: 2.29, forza: 0.857, furbizia: 0.095 },
    ghiaccio: { d: 0.838, moneteAlSecondo: 0.506, pensa: 2.08, forza: 0.935, furbizia: 0.225 },
    tormenta: { d: 0.842, moneteAlSecondo: 0.507, pensa: 2.07, forza: 0.937, furbizia: 0.228 },
    cratere: { d: 0.861, moneteAlSecondo: 0.513, pensa: 2.05, forza: 0.945, furbizia: 0.241 },
    fucina: { d: 0.959, moneteAlSecondo: 0.543, pensa: 1.95, forza: 0.984, furbizia: 0.306 },
    trono: { d: 1, moneteAlSecondo: 0.556, pensa: 1.9, forza: 1, furbizia: 0.333 },
  },
  difficile: {
    scaramuccia: { d: 0.58, moneteAlSecondo: 0.427, pensa: 2.36, forza: 0.832, furbizia: 0.053 },
    ponte: { d: 0.615, moneteAlSecondo: 0.438, pensa: 2.32, forza: 0.846, furbizia: 0.077 },
    radura: { d: 0.689, moneteAlSecondo: 0.461, pensa: 2.24, forza: 0.876, furbizia: 0.126 },
    melma: { d: 0.639, moneteAlSecondo: 0.445, pensa: 2.3, forza: 0.855, furbizia: 0.092 },
    guado: { d: 0.678, moneteAlSecondo: 0.457, pensa: 2.25, forza: 0.871, furbizia: 0.118 },
    canneto: { d: 0.752, moneteAlSecondo: 0.48, pensa: 2.17, forza: 0.901, furbizia: 0.168 },
    valico: { d: 0.787, moneteAlSecondo: 0.491, pensa: 2.13, forza: 0.915, furbizia: 0.191 },
    ghiaccio: { d: 0.838, moneteAlSecondo: 0.506, pensa: 2.08, forza: 0.935, furbizia: 0.225 },
    tormenta: { d: 0.877, moneteAlSecondo: 0.518, pensa: 2.04, forza: 0.951, furbizia: 0.251 },
    cratere: { d: 0.959, moneteAlSecondo: 0.543, pensa: 1.95, forza: 0.984, furbizia: 0.306 },
    fucina: { d: 1, moneteAlSecondo: 0.556, pensa: 1.9, forza: 1, furbizia: 0.333 },
    trono: { d: 1, moneteAlSecondo: 0.556, pensa: 1.9, forza: 1, furbizia: 0.333 },
  },
}
// quello di mezzo è la scheda di sempre
export const NEMICO = NEMICO_PER_LIVELLO.medio
// la firma dell'equilibrio al momento della taratura (motore/firma.js): se non torna, rilancia la taratura
export const FIRMA = '63yhg1'
