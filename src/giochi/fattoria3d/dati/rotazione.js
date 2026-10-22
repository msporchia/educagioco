/* Ruotare i pezzi: un quarto di giro alla volta (`rot` 0–3 sulla cosa; assente = 0). Dato puro: dice cosa si può girare e che
   misure ha un pezzo girato. Un pezzo girato di 90° (rot dispari) occupa d×w; il disegno gira attorno al centro dell'impronta.
   Vedi docs/fattoria3d/rotazione.md. */
import { PEZZI, EDIFICI } from './catalogo.js'

/** Si gira tutto tranne ciò che ha una direzione che conta per le regole (acqua, ponti e moli, porticciolo: hanno già le loro
    versioni «girate») e il campo (quadrato, non ha un davanti). */
export function ruotabile(tipo) {
  const d = PEZZI[tipo] || EDIFICI[tipo]
  return !!d && tipo !== 'campo' && !d.acqua && !d.calpestabile && !d.riva
}

const girate = new Map()
/** Le misure di un tipo girato di 90°: w e d scambiati, tutto il resto uguale. */
export function misureGirate(tipo, d) {
  let g = girate.get(tipo)
  if (!g) { g = { ...d, w: d.d, d: d.w }; girate.set(tipo, g) }
  return g
}

/** Dove guarda il davanti di una cosa girata di `rot` quarti: (0, +1) di serie, poi (+1, 0), (0, −1), (−1, 0). */
export const DAVANTI = [[0, 1], [1, 0], [0, -1], [-1, 0]]

/** Una rotazione letta da uno stato: un intero 0–3, o 0 (normalizza non lancia mai). */
export function rotLetta(r) { return Number.isInteger(r) ? ((r % 4) + 4) % 4 : 0 }
