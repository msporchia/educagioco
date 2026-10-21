/* Il bioma di ogni lotto, deciso solo dalle sue coordinate: prato (il solito), bosco (alberi fitti), laghetto (uno stagno al mezzo).
   Il rettangolo storico dei 42 lotti è sempre prato (i suoi alberi e sassi non cambiano); un laghetto non è mai attaccato a un
   altro (di lato; in diagonale c'è sempre terra fra le due acque) e non cade mai nel quadrato di partenza. Lo stagno è un blob di celle nel lotto; una cella di riva
   è il posto candidato per un molo (la pesca arriverà lì: docs/fattoria3d/laghi.md). Puro. */
import { lotto, eStorico, chiave } from './mondo.js'
import { mescola, sequenza } from './semi.js'

export const BIOMI = ['prato', 'bosco', 'laghetto']
export const P_LAGHETTO = 0.25       // chi può essere laghetto (poi ne resta uno solo per vicinato: vedi `eLaghetto`)
export const P_BOSCO = 0.18          // fra i lotti che non sono laghetti

const candidato = (a, b) => !eStorico(lotto(a, b)) && mescola(a, b, 1) < P_LAGHETTO
const VICINI_4 = [[1, 0], [-1, 0], [0, 1], [0, -1]]

/** Un laghetto è un candidato che ha il sorteggio più basso fra i candidati che lo toccano di lato: due laghetti mai vicini, e senza guardare lotti lontani. */
export function eLaghetto(a, b) {
  if (!candidato(a, b)) return false
  const h = mescola(a, b, 1)
  for (const [da, db] of VICINI_4) if (candidato(a + da, b + db) && mescola(a + da, b + db, 1) <= h) return false
  return true
}

export function biomaDi(a, b) {
  if (eStorico(lotto(a, b))) return 'prato'
  if (eLaghetto(a, b)) return 'laghetto'
  return mescola(a, b, 2) < P_BOSCO ? 'bosco' : 'prato'
}

// Lo stagno: il quadrato centrale 2×2 più da una a tre celle del bordo (al più una per lato, mai un angolo): le quattro celle d'angolo
// e almeno tre per lato restano terra, il lotto si compra e si attraversa dai lati (un ponte da 3 supera i 2 di acqua).
const CENTRO = [[1, 1], [2, 1], [1, 2], [2, 2]]
const BORDO = [[[1, 0], [2, 0]], [[1, 3], [2, 3]], [[0, 1], [0, 2]], [[3, 1], [3, 2]]]     // per lato: nord, sud, ovest, est

/** Le celle d'acqua di un lotto laghetto (globali, [i, j]); vuoto per gli altri. */
export function acquaDelLotto(l) {
  if (biomaDi(l.a, l.b) !== 'laghetto') return []
  const caso = sequenza(l.a, l.b, 3)
  const celle = [...CENTRO]
  const lati = [0, 1, 2, 3]                                   // l'ordine dei lati lo dà il caso del lotto (un rimescolo a mano: `sort` col caso non è lo stesso su ogni motore)
  for (let k = 3; k > 0; k--) { const h = Math.floor(caso() * (k + 1)); [lati[k], lati[h]] = [lati[h], lati[k]] }
  const quanti = 1 + Math.floor(caso() * 3)
  for (let k = 0; k < quanti; k++) { const opz = BORDO[lati[k]]; celle.push(opz[Math.floor(caso() * opz.length)]) }
  return celle.map(([x, y]) => [l.i + x, l.j + y])
}

/** Il posto di un molo: una cella di terra del lotto che tocca l'acqua (4 direzioni), con il verso dell'acqua. Null se non è un laghetto. */
export function moloDelLotto(l, acqua = acquaDelLotto(l)) {
  if (!acqua.length) return null
  const a = new Set(acqua.map(([i, j]) => chiave(i, j)))
  const caso = sequenza(l.a, l.b, 4), cand = []
  for (let y = 0; y < l.d; y++) for (let x = 0; x < l.w; x++) {
    const i = l.i + x, j = l.j + y
    if (a.has(chiave(i, j))) continue
    for (const [di, dj] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) if (a.has(chiave(i + di, j + dj))) { cand.push({ i, j, verso: [di, dj] }); break }
  }
  return cand.length ? cand[Math.floor(caso() * cand.length)] : null
}

export function guastiDeiBiomi() {
  const g = []
  for (let b = -30; b < 30; b++) for (let a = -30; a < 30; a++) {
    const l = lotto(a, b), bio = biomaDi(a, b)
    if (!BIOMI.includes(bio)) g.push(`${l.id}: bioma ${bio}`)
    if (eStorico(l) && bio !== 'prato') g.push(`${l.id}: un lotto storico non è prato`)
    if (bio === 'laghetto') {
      for (const [da, db] of VICINI_4) if (biomaDi(a + da, b + db) === 'laghetto') g.push(`${l.id}: laghetti attaccati`)
      const acqua = acquaDelLotto(l)
      if (acqua.length < 5 || acqua.length > 7) g.push(`${l.id}: ${acqua.length} celle d'acqua`)
      if (!moloDelLotto(l, acqua)) g.push(`${l.id}: nessun posto per il molo`)
    }
  }
  return g.slice(0, 10)
}
