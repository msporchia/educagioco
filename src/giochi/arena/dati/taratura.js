/* GENERATO da strumenti/tara-arena.mjs (`npm run tara:arena`) — non si scrive a mano.

   La scheda del nemico di ogni tappa, per ognuno dei tre livelli di difficoltà (facile, medio, difficile): `forza`
   (le sue truppe rispetto alle tue), `moneteAlSecondo` e `pensa` (ogni quanti secondi decide) sono funzione di una
   sola manopola `d` (0 = quasi inerme, 1 = pari al giocatore bravo), cercata per bisezione perché il bambino di
   prova vinca la quota che il livello promette in quella tappa. Vedi docs/arena/taratura.md. */
export const NEMICO_PER_LIVELLO = {
  facile: {
    scaramuccia: { d: 0.488, moneteAlSecondo: 0.399, pensa: 2.46, forza: 0.795, furbizia: 0 },
    ponte: { d: 0.676, moneteAlSecondo: 0.456, pensa: 2.26, forza: 0.87, furbizia: 0.117 },
    radura: { d: 0.652, moneteAlSecondo: 0.449, pensa: 2.28, forza: 0.861, furbizia: 0.102 },
    melma: { d: 0.699, moneteAlSecondo: 0.464, pensa: 2.23, forza: 0.88, furbizia: 0.133 },
    guado: { d: 0.699, moneteAlSecondo: 0.464, pensa: 2.23, forza: 0.88, furbizia: 0.133 },
    canneto: { d: 0.77, moneteAlSecondo: 0.485, pensa: 2.15, forza: 0.908, furbizia: 0.18 },
    valico: { d: 0.699, moneteAlSecondo: 0.464, pensa: 2.23, forza: 0.88, furbizia: 0.133 },
    ghiaccio: { d: 0.785, moneteAlSecondo: 0.49, pensa: 2.14, forza: 0.914, furbizia: 0.19 },
    tormenta: { d: 0.824, moneteAlSecondo: 0.502, pensa: 2.09, forza: 0.93, furbizia: 0.216 },
    cratere: { d: 0.824, moneteAlSecondo: 0.502, pensa: 2.09, forza: 0.93, furbizia: 0.216 },
    fucina: { d: 0.902, moneteAlSecondo: 0.526, pensa: 2.01, forza: 0.961, furbizia: 0.268 },
    trono: { d: 0.918, moneteAlSecondo: 0.53, pensa: 1.99, forza: 0.967, furbizia: 0.279 },
  },
  medio: {
    scaramuccia: { d: 0.504, moneteAlSecondo: 0.404, pensa: 2.45, forza: 0.802, furbizia: 0.003 },
    ponte: { d: 0.566, moneteAlSecondo: 0.423, pensa: 2.38, forza: 0.827, furbizia: 0.044 },
    radura: { d: 0.715, moneteAlSecondo: 0.468, pensa: 2.21, forza: 0.886, furbizia: 0.143 },
    melma: { d: 0.777, moneteAlSecondo: 0.488, pensa: 2.14, forza: 0.911, furbizia: 0.185 },
    guado: { d: 0.777, moneteAlSecondo: 0.488, pensa: 2.14, forza: 0.911, furbizia: 0.185 },
    canneto: { d: 0.801, moneteAlSecondo: 0.495, pensa: 2.12, forza: 0.92, furbizia: 0.201 },
    valico: { d: 0.785, moneteAlSecondo: 0.49, pensa: 2.14, forza: 0.914, furbizia: 0.19 },
    ghiaccio: { d: 0.863, moneteAlSecondo: 0.514, pensa: 2.05, forza: 0.945, furbizia: 0.242 },
    tormenta: { d: 0.941, moneteAlSecondo: 0.538, pensa: 1.96, forza: 0.977, furbizia: 0.294 },
    cratere: { d: 0.98, moneteAlSecondo: 0.55, pensa: 1.92, forza: 0.992, furbizia: 0.32 },
    fucina: { d: 1.129, moneteAlSecondo: 0.556, pensa: 1.76, forza: 1, furbizia: 0.419 },
    trono: { d: 1.254, moneteAlSecondo: 0.556, pensa: 1.62, forza: 1, furbizia: 0.503 },
  },
  difficile: {
    scaramuccia: { d: 0.574, moneteAlSecondo: 0.425, pensa: 2.37, forza: 0.83, furbizia: 0.049 },
    ponte: { d: 0.629, moneteAlSecondo: 0.442, pensa: 2.31, forza: 0.852, furbizia: 0.086 },
    radura: { d: 0.785, moneteAlSecondo: 0.49, pensa: 2.14, forza: 0.914, furbizia: 0.19 },
    melma: { d: 0.816, moneteAlSecondo: 0.499, pensa: 2.1, forza: 0.927, furbizia: 0.211 },
    guado: { d: 0.801, moneteAlSecondo: 0.495, pensa: 2.12, forza: 0.92, furbizia: 0.201 },
    canneto: { d: 0.816, moneteAlSecondo: 0.499, pensa: 2.1, forza: 0.927, furbizia: 0.211 },
    valico: { d: 0.816, moneteAlSecondo: 0.499, pensa: 2.1, forza: 0.927, furbizia: 0.211 },
    ghiaccio: { d: 0.926, moneteAlSecondo: 0.533, pensa: 1.98, forza: 0.97, furbizia: 0.284 },
    tormenta: { d: 0.957, moneteAlSecondo: 0.542, pensa: 1.95, forza: 0.983, furbizia: 0.305 },
    cratere: { d: 0.973, moneteAlSecondo: 0.547, pensa: 1.93, forza: 0.989, furbizia: 0.315 },
    fucina: { d: 0.996, moneteAlSecondo: 0.554, pensa: 1.9, forza: 0.998, furbizia: 0.331 },
    trono: { d: 1.012, moneteAlSecondo: 0.556, pensa: 1.89, forza: 1, furbizia: 0.341 },
  },
}
// quello di mezzo è la scheda di sempre
export const NEMICO = NEMICO_PER_LIVELLO.medio
// la firma dell'equilibrio al momento della taratura (motore/firma.js): se non torna, rilancia la taratura
export const FIRMA = '1loe6mz'
