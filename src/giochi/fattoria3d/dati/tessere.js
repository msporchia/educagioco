/* Le tessere con i vicini: per una cella, cosa le sta attorno. È la base comune degli strati del terreno (strade oggi; staccionate e acqua
   disegnabile domani): ognuno dice `aspettoDi(i, j)` (cosa c'è lì, `null` se niente) e `unisce(a, b)` (due aspetti si fondono?), e riceve
   i lati e gli angoli da bordare. Puro, senza three.js. Vedi docs/fattoria3d/terreno.md «Gli strati del terreno». */

/** I quattro lati, in senso orario da nord (la camera guarda verso −j): [di, dj]. */
export const LATI = [[0, -1], [1, 0], [0, 1], [-1, 0]]
/** I quattro angoli, in senso orario da nord-est: [di, dj]. */
export const ANGOLI = [[1, -1], [1, 1], [-1, 1], [-1, -1]]

/**
 * I vicini di (i, j): `lati[s]` è 'unito' (c'è un vicino che si fonde: niente bordo), 'altro' (un vicino che non si fonde: confine netto, senza
 * bordo) o 'vuoto' (niente: qui va il bordo); `angoli[c]` è true dove i due lati accanto sono uniti ma la diagonale è vuota (un angolo
 * rientrante, che vuole il suo pezzo). Torna `null` se la cella non ha niente.
 */
export function viciniDi(aspettoDi, unisce, i, j) {
  const me = aspettoDi(i, j)
  if (!me) return null
  const lati = LATI.map(([di, dj]) => {
    const v = aspettoDi(i + di, j + dj)
    return !v ? 'vuoto' : unisce(me, v) ? 'unito' : 'altro'
  })
  const angoli = ANGOLI.map(([di, dj], c) => lati[c] === 'unito' && lati[(c + 1) % 4] === 'unito' && !aspettoDi(i + di, j + dj))
  return { me, lati, angoli }
}

/** Un numero da 0 a 1 sempre uguale per la stessa cella e lo stesso `sale`: la variazione dei pezzi non deve ballare a ogni ridisegno. */
export function caso(i, j, sale = 0) {
  let h = (Math.imul(i, 73856093) ^ Math.imul(j, 19349663) ^ Math.imul(sale + 1, 83492791)) >>> 0
  h = Math.imul(h ^ (h >>> 15), 2246822519) >>> 0
  h = Math.imul(h ^ (h >>> 13), 3266489917) >>> 0
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}
