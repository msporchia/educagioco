/* Il bioma di ogni lotto, deciso solo dalle sue coordinate: prato (il solito), bosco (alberi fitti), laghetto (uno stagno al mezzo) e
   la geografia grande: il MARE a ovest (lotti a ≤ −2: tutta acqua; a = −1 è la costa, con la spiaggia) e i LAGHI a est (lotti a ≥ 8). Il
   rettangolo storico dei 42 lotti è sempre prato (i suoi alberi e sassi non cambiano); un laghetto non è mai attaccato a un altro (di
   lato; in diagonale c'è sempre terra fra le due acque) e non cade mai nel quadrato di partenza.
   L'acqua grande NON è «per lotto»: la forma dell'acqua è una funzione continua della cella (i, j) (la riva del mare ondeggia con la riga,
   un lago è un'ellisse irregolare con i suoi isolotti), quindi attraversa i confini fra due lotti: comprando i lotti vicini si scopre più
   lago. Il perché e i numeri: docs/fattoria3d/geografia-e-pesca.md. Una cella di riva è il posto candidato per un molo. Puro. */
import { lotto, eStorico, chiave } from './mondo.js'
import { mescola, sequenza } from './semi.js'

export const BIOMI = ['prato', 'bosco', 'laghetto', 'costa', 'mare', 'lago']
export const P_LAGHETTO = 0.25       // chi può essere laghetto (poi ne resta uno solo per vicinato: vedi `eLaghetto`)
export const P_BOSCO = 0.18          // fra i lotti che non sono laghetti

// ── dove stanno il mare e i laghi (coordinate di lotto: a cresce verso est) ──
export const ZONA = {
  mareFinoA: -2,        // i lotti con a ≤ −2 sono mare (quattro lotti dal bordo ovest del quadrato di partenza, a = 2: i lotti 1, 0, −1 e −2)
  costaA: -1,           // il lotto della spiaggia: terra con la riva che ondeggia e un po' di mare nelle sue prime colonne
  lagoDaA: 8,           // da qui in là, a est, ci sono i laghi grandi (quattro lotti dal bordo est del quadrato di partenza, a = 4: i lotti 5, 6, 7 e poi l'8)
}
const MARE_I = -19      // l'ultima colonna di mare che c'è sempre (il lotto a = −2 va da i = −22 a −19): la riva ondeggia da qui verso est
const LAGO_I0 = -14 + 4 * ZONA.lagoDaA, LAGO_J0 = -12        // l'angolo della prima supercella dei laghi (cella)
const SC_W = 20, SC_H = 12                                   // una supercella dei laghi: 5×3 lotti, al più un lago ciascuna, tutto dentro

// ── il mare a ovest ──
/** Quante colonne del lotto della costa sono ancora mare alla riga `j` (0, 1 o 2): la riva ondeggia piano, uguale per tutti i lotti della colonna. */
export function rivaDelMare(j) {
  const x = Math.sin(j * 0.43 + 0.7) + 0.8 * Math.sin(j * 0.17 + 2.1) + 0.5 * Math.sin(j * 0.91 + 4.0)
  return x < -0.4 ? 0 : x < 0.9 ? 1 : 2
}
/** La cella è mare? Dipende solo dalla cella, non dal lotto. */
export const eMare = (i, j) => i <= MARE_I + rivaDelMare(j)
/** La cella è spiaggia (sabbia in riva, terra che si cammina)? Due o tre colonne dopo il mare, mai oltre i = −15 (dentro il lotto della costa). */
export const eSpiaggia = (i, j) => !eMare(i, j) && i <= Math.min(-15, MARE_I + rivaDelMare(j) + 2 + (mescola(i, j, 41) < 0.35 ? 1 : 0))

// ── i laghi grandi a est ──
const laghi = new Map()
/** Il lago della supercella (ci, cj), o null: un'ellisse irregolare (centro, raggi e fasi dal seme) con zero, uno o due isolotti. */
function lagoDi(ci, cj) {
  const k = ci * 100003 + cj
  if (laghi.has(k)) return laghi.get(k)
  let L = null
  if (mescola(ci, cj, 31) < 0.75) {
    const rx = 5 + mescola(ci, cj, 32) * 1.6, ry = 3.4 + mescola(ci, cj, 33) * 1.0
    const lox = rx + 1.4, hix = SC_W - rx - 1.4, loy = ry + 1.3, hiy = SC_H - ry - 1.3
    const cx = LAGO_I0 + ci * SC_W + lox + mescola(ci, cj, 34) * Math.max(0, hix - lox)
    const cy = LAGO_J0 + cj * SC_H + loy + mescola(ci, cj, 35) * Math.max(0, hiy - loy)
    const isole = []
    const n = Math.floor(mescola(ci, cj, 36) * 3)                       // 0, 1 o 2
    for (let q = 0; q < n; q++) {
      const ang = mescola(ci, cj, 37 + q) * Math.PI * 2, dist = 0.15 + mescola(ci, cj, 40 + q) * 0.4
      isole.push({ x: cx + Math.cos(ang) * dist * rx, y: cy + Math.sin(ang) * dist * ry, r: 1.0 + mescola(ci, cj, 44 + q) * 0.7 })
    }
    L = { cx, cy, rx, ry, f1: mescola(ci, cj, 46) * 6.28, f2: mescola(ci, cj, 47) * 6.28, f3: mescola(ci, cj, 48) * 6.28, isole }
  }
  laghi.set(k, L)
  return L
}
/** La cella è acqua di un lago grande? Dipende solo dalla cella: la forma attraversa i confini fra i lotti. */
export function eLago(i, j) {
  if (i < LAGO_I0) return false
  const ci = Math.floor((i - LAGO_I0) / SC_W), cj = Math.floor((j - LAGO_J0) / SC_H)
  const L = lagoDi(ci, cj)
  if (!L) return false
  const x = i + 0.5, y = j + 0.5, dx = (x - L.cx) / L.rx, dy = (y - L.cy) / L.ry, t = Math.atan2(dy, dx)
  const bordo = 1 + 0.10 * Math.sin(2 * t + L.f1) + 0.07 * Math.sin(3 * t + L.f2) + 0.04 * Math.sin(5 * t + L.f3)
  if (Math.hypot(dx, dy) >= bordo) return false
  for (const o of L.isole) if (Math.hypot(x - o.x, y - o.y) < o.r) return false         // un isolotto è terra in mezzo all'acqua
  return true
}
/** L'acqua della cella è di mare o dolce (lago, laghetto, stagno)? Decide la pesca. */
export const tipoAcqua = (i, j) => eMare(i, j) ? 'mare' : 'dolce'

const conLago = new Map()
function haLago(l) {
  let v = conLago.get(l.k)
  if (v === undefined) {
    v = false
    for (let y = 0; y < l.d && !v; y++) for (let x = 0; x < l.w && !v; x++) if (eLago(l.i + x, l.j + y)) v = true
    conLago.set(l.k, v)
  }
  return v
}

// ── i laghetti di prima: il sorteggio per lotto ──
const candidato = (a, b) => !eStorico(lotto(a, b)) && mescola(a, b, 1) < P_LAGHETTO
const VICINI_4 = [[1, 0], [-1, 0], [0, 1], [0, -1]]

/** Un laghetto è un candidato che ha il sorteggio più basso fra i candidati che lo toccano di lato: due laghetti mai vicini, e senza guardare lotti lontani. */
export function eLaghetto(a, b) {
  if (!candidato(a, b)) return false
  const h = mescola(a, b, 1)
  for (const [da, db] of VICINI_4) if (candidato(a + da, b + db) && mescola(a + da, b + db, 1) <= h) return false
  return true
}

/** Il bioma di prima della geografia grande (prato, bosco, laghetto): i lotti già comprati in un salvataggio vecchio restano così (`generaLotto(.., { vecchio })`). */
export function biomaVecchio(a, b) {
  if (eStorico(lotto(a, b))) return 'prato'
  if (eLaghetto(a, b)) return 'laghetto'
  return mescola(a, b, 2) < P_BOSCO ? 'bosco' : 'prato'
}

export function biomaDi(a, b) {
  const l = lotto(a, b)
  if (eStorico(l)) return 'prato'
  if (a <= ZONA.mareFinoA) return 'mare'
  if (a === ZONA.costaA) return 'costa'
  if (a >= ZONA.lagoDaA) return haLago(l) ? 'lago' : (mescola(a, b, 2) < P_BOSCO ? 'bosco' : 'prato')      // a est niente laghetti: c'è il lago, o terra
  return biomaVecchio(a, b)
}

// Lo stagno: il quadrato centrale 2×2 più da una a tre celle del bordo (al più una per lato, mai un angolo): le quattro celle d'angolo
// e almeno tre per lato restano terra, il lotto si compra e si attraversa dai lati (un ponte da 3 supera i 2 di acqua).
const CENTRO = [[1, 1], [2, 1], [1, 2], [2, 2]]
const BORDO = [[[1, 0], [2, 0]], [[1, 3], [2, 3]], [[0, 1], [0, 2]], [[3, 1], [3, 2]]]     // per lato: nord, sud, ovest, est

function acquaDelLaghetto(l) {
  const caso = sequenza(l.a, l.b, 3)
  const celle = [...CENTRO]
  const lati = [0, 1, 2, 3]                                   // l'ordine dei lati lo dà il caso del lotto (un rimescolo a mano: `sort` col caso non è lo stesso su ogni motore)
  for (let k = 3; k > 0; k--) { const h = Math.floor(caso() * (k + 1)); [lati[k], lati[h]] = [lati[h], lati[k]] }
  const quanti = 1 + Math.floor(caso() * 3)
  for (let k = 0; k < quanti; k++) { const opz = BORDO[lati[k]]; celle.push(opz[Math.floor(caso() * opz.length)]) }
  return celle.map(([x, y]) => [l.i + x, l.j + y])
}

/** Le celle d'acqua di un lotto (globali, [i, j]): il mare (tutte), la costa (le sue colonne di mare), il lago (la parte del lago che cade qui),
    il laghetto (lo stagno al mezzo); vuoto per gli altri. `vecchio`: la geografia di prima (solo i laghetti). */
export function acquaDelLotto(l, vecchio = false) {
  const bio = vecchio ? biomaVecchio(l.a, l.b) : biomaDi(l.a, l.b)
  if (bio === 'laghetto') return acquaDelLaghetto(l)
  if (bio === 'prato' || bio === 'bosco') return []
  const out = []
  for (let y = 0; y < l.d; y++) for (let x = 0; x < l.w; x++) {
    const i = l.i + x, j = l.j + y
    if (bio === 'mare' || (bio === 'costa' ? eMare(i, j) : eLago(i, j))) out.push([i, j])
  }
  return out
}
/** Le celle di spiaggia di un lotto (solo la costa): sabbia in riva, si cammina. */
export function spiaggiaDelLotto(l) {
  if (biomaDi(l.a, l.b) !== 'costa') return []
  const out = []
  for (let y = 0; y < l.d; y++) for (let x = 0; x < l.w; x++) if (eSpiaggia(l.i + x, l.j + y)) out.push([l.i + x, l.j + y])
  return out
}

/** Il posto di un molo: una cella di terra del lotto che tocca l'acqua (4 direzioni), con il verso dell'acqua. Null se il lotto non ha acqua o è tutto acqua. */
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
    if (bio === 'mare' && acquaDelLotto(l).length !== l.w * l.d) g.push(`${l.id}: un lotto di mare non è tutto acqua`)
    if (bio === 'lago' && !acquaDelLotto(l).length) g.push(`${l.id}: un lotto di lago senza acqua`)
    if (bio === 'costa' && acquaDelLotto(l).some(([i, j]) => !eMare(i, j))) g.push(`${l.id}: acqua di costa che non è mare`)
    if ((bio === 'mare' || bio === 'costa') && (a > ZONA.costaA)) g.push(`${l.id}: mare a est`)
    if (bio === 'lago' && a < ZONA.lagoDaA) g.push(`${l.id}: lago a ovest`)
  }
  return g.slice(0, 10)
}
