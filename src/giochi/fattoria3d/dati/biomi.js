/* Il bioma di ogni lotto, deciso solo dalle sue coordinate: prato (il solito), bosco (alberi fitti), laghetto (uno stagno al mezzo) e
   la geografia grande: il MARE a ovest (lotti a ≤ −2: tutta acqua; a = −1 è la costa, con la spiaggia) e i LAGHI a est (lotti a ≥ 8). Il
   rettangolo storico dei 42 lotti è sempre prato (i suoi alberi e sassi non cambiano); un laghetto non è mai attaccato a un altro (di
   lato; in diagonale c'è sempre terra fra le due acque) e non cade mai nel quadrato di partenza.
   L'acqua grande NON è «per lotto»: la forma dell'acqua è una funzione continua della cella (i, j) (la riva del mare ondeggia con la riga,
   un lago è un'ellisse irregolare con i suoi isolotti), quindi attraversa i confini fra due lotti: comprando i lotti vicini si scopre più
   lago. Il perché e i numeri: docs/fattoria3d/geografia-e-pesca.md. Una cella di riva è il posto candidato per un molo.
   Tre generazioni (`gen`): 0 = prima della geografia grande, 1 = mare e laghi con i laghetti-pozzanghera di 5–7 celle, 2 = quella di oggi, coi laghi dolci
   naturali nella fascia di mezzo (docs/fattoria3d/laghi.md). Un salvataggio tiene la generazione dei suoi lotti già comprati. Puro. */
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

/** Il bioma della generazione 1 (mare e laghi grandi, laghetti-pozzanghera): i lotti comprati in un salvataggio con `geo: 1` dove ora cambierebbe qualcosa restano così. */
export function biomaV1(a, b) {
  const l = lotto(a, b)
  if (eStorico(l)) return 'prato'
  if (a <= ZONA.mareFinoA) return 'mare'
  if (a === ZONA.costaA) return 'costa'
  if (a >= ZONA.lagoDaA) return haLago(l) ? 'lago' : (mescola(a, b, 2) < P_BOSCO ? 'bosco' : 'prato')      // a est niente laghetti: c'è il lago, o terra
  return biomaVecchio(a, b)
}

// ── i laghi dolci naturali della fascia di mezzo (generazione 2) ──
// La fascia (a da 0 a 7, fuori dal rettangolo storico) è divisa in supercelle di 4×3 lotti (16×12 celle) allineate al rettangolo storico: ciascuna ha
// con probabilità P_LAGO_DOLCE un lago, e il lago sta tutto dentro con una cella di margine, quindi fra due laghi c'è sempre una striscia di terra di
// almeno due celle e la terra della fascia resta tutta d'un pezzo. Tre taglie (piccolo, medio, grande), ognuna un'ellisse inclinata dal contorno
// ondulato, con uno o due lobi nei laghi medi e grandi e a volte un isolotto: forme che non sono mai un quadrato e che attraversano i confini fra i lotti.
export const P_LAGO_DOLCE = 0.52          // la probabilità che una supercella abbia un lago (la terra giocabile: docs/fattoria3d/laghi.md)
const FASCIA_A0 = 0, FASCIA_A1 = 7
const SD_W = 16, SD_H = 12, SD_I0 = -14, SD_J0 = -12
const laghiDolci = new Map()
const nelBlob = (B, x, y) => {
  const dx = x - B.cx, dy = y - B.cy, u = (dx * B.c + dy * B.s) / B.rx, v = (-dx * B.s + dy * B.c) / B.ry, t = Math.atan2(v, u)
  return Math.hypot(u, v) < 1 + B.m1 * Math.sin(2 * t + B.f1) + B.m2 * Math.sin(3 * t + B.f2) + B.m3 * Math.sin(5 * t + B.f3)
}
function lagoDolceDi(ci, cj) {
  const k = ci * 100003 + cj
  if (laghiDolci.has(k)) return laghiDolci.get(k)
  let L = null
  if (ci >= 0 && ci <= 1 && cj !== 0 && cj !== 1 && mescola(ci, cj, 51) < P_LAGO_DOLCE) {
    const q = mescola(ci, cj, 52), classe = q < 0.38 ? 0 : q < 0.8 ? 1 : 2                      // piccolo, medio, grande
    const R = [[3.0, 0.9, 2.2, 0.7], [4.2, 1.2, 3.0, 0.9], [5.6, 0.9, 3.9, 0.7]][classe]
    const blob = (rx, ry, cx, cy, sale) => {
      const th = mescola(ci, cj, sale) * Math.PI
      const ex = Math.hypot(rx * Math.cos(th), ry * Math.sin(th)) * 1.15, ey = Math.hypot(rx * Math.sin(th), ry * Math.cos(th)) * 1.15       // quanto sporge, con l'ondulazione
      return { cx: Math.min(Math.max(cx, 1 + ex), SD_W - 1 - ex), cy: Math.min(Math.max(cy, 1 + ey), SD_H - 1 - ey), rx, ry, c: Math.cos(th), s: Math.sin(th),
        m1: 0.07 + 0.06 * mescola(ci, cj, sale + 1), m2: 0.05 + 0.05 * mescola(ci, cj, sale + 2), m3: 0.02 + 0.04 * mescola(ci, cj, sale + 3),
        f1: mescola(ci, cj, sale + 4) * 6.28, f2: mescola(ci, cj, sale + 5) * 6.28, f3: mescola(ci, cj, sale + 6) * 6.28 }
    }
    const rx = R[0] + mescola(ci, cj, 53) * R[1], ry = R[2] + mescola(ci, cj, 54) * R[3]
    const cx = SD_W * (0.35 + 0.3 * mescola(ci, cj, 55)), cy = SD_H * (0.38 + 0.24 * mescola(ci, cj, 56))
    const blobs = [blob(rx, ry, cx, cy, 100)]
    const lobi = classe === 0 ? 0 : classe === 1 ? (mescola(ci, cj, 57) < 0.5 ? 1 : 0) : 1 + (mescola(ci, cj, 57) < 0.5 ? 1 : 0)
    for (let n = 0; n < lobi; n++) {
      const ang = mescola(ci, cj, 70 + n) * Math.PI * 2, f = 0.42 + 0.2 * mescola(ci, cj, 72 + n)
      blobs.push(blob(rx * f, ry * (f + 0.1), cx + Math.cos(ang) * rx * 0.85, cy + Math.sin(ang) * ry * 0.85, 120 + 10 * n))
    }
    const isole = []
    if (classe === 2 && mescola(ci, cj, 58) < 0.55) isole.push({ x: cx + (mescola(ci, cj, 59) - 0.5) * rx * 0.7, y: cy + (mescola(ci, cj, 61) - 0.5) * ry * 0.7, r: 0.9 + 0.5 * mescola(ci, cj, 62) })
    L = { blobs, isole }
  }
  laghiDolci.set(k, L)
  return L
}
/** La cella è acqua di un lago dolce naturale della fascia di mezzo? Dipende solo dalla cella: la forma attraversa i confini fra i lotti. */
export function eLagoDolce(i, j) {
  if (i < SD_I0 || i >= SD_I0 + 2 * SD_W) return false
  const ci = Math.floor((i - SD_I0) / SD_W), cj = Math.floor((j - SD_J0) / SD_H)
  const L = lagoDolceDi(ci, cj)
  if (!L) return false
  const lx = i - SD_I0 - ci * SD_W, ly = j - SD_J0 - cj * SD_H
  if (lx < 1 || ly < 1 || lx >= SD_W - 1 || ly >= SD_H - 1) return false              // il margine di terra è una regola, non una speranza
  const x = lx + 0.5, y = ly + 0.5
  if (!L.blobs.some(B => nelBlob(B, x, y))) return false
  for (const o of L.isole) if (Math.hypot(x - o.x, y - o.y) < o.r) return false
  return true
}
const nellaFascia = l => !eStorico(l) && l.a >= FASCIA_A0 && l.a <= FASCIA_A1
function celleLagoDolce(l) {
  const out = []
  for (let y = 0; y < l.d; y++) for (let x = 0; x < l.w; x++) if (eLagoDolce(l.i + x, l.j + y)) out.push([l.i + x, l.j + y])
  return out
}
const SOGLIA_LAGHETTO = 3          // da tre celle d'acqua in su il lotto è un «laghetto» (cartello, pochi alberi); sotto è un prato o un bosco con una riva

/** Il bioma di oggi (generazione 2): come la 1, ma nella fascia di mezzo un lotto con un lago dolce è `laghetto`, e gli altri sono prato o bosco. */
export function biomaDi(a, b) {
  const l = lotto(a, b)
  if (!nellaFascia(l)) return biomaV1(a, b)
  if (celleLagoDolce(l).length >= SOGLIA_LAGHETTO) return 'laghetto'
  return mescola(a, b, 2) < P_BOSCO ? 'bosco' : 'prato'
}
/** Il bioma di una generazione: 0 = prima della geografia grande, 1 = i laghetti-pozzanghera, 2 = oggi. */
export const biomaDiGen = (a, b, gen) => gen === 0 ? biomaVecchio(a, b) : gen === 1 ? biomaV1(a, b) : biomaDi(a, b)

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

/** La generazione che un argomento `vecchio` indica: `true` = la 0 (come prima), un numero = quella, niente = la 2. */
export const genDi = g => g === true ? 0 : typeof g === 'number' ? g : 2
/** Le celle d'acqua di un lotto (globali, [i, j]): il mare (tutte), la costa (le sue colonne di mare), il lago (la parte del lago che cade qui),
    il laghetto (lo stagno al mezzo o, di oggi, il lago dolce); vuoto per gli altri. `vecchio`: la generazione (`true` = la 0). */
export function acquaDelLotto(l, vecchio = false) {
  const gen = genDi(vecchio)
  if (gen === 2 && nellaFascia(l)) return celleLagoDolce(l)
  const bio = biomaDiGen(l.a, l.b, gen)
  if (bio === 'laghetto') return acquaDelLaghetto(l)
  if (bio === 'prato' || bio === 'bosco') return []
  const out = []
  for (let y = 0; y < l.d; y++) for (let x = 0; x < l.w; x++) {
    const i = l.i + x, j = l.j + y
    if (bio === 'mare' || (bio === 'costa' ? eMare(i, j) : eLago(i, j))) out.push([i, j])
  }
  return out
}
/** Vero se la generazione `gen` dà di questo lotto qualcosa di diverso da oggi (un altro bioma o altra acqua): un lotto comprato così in un salvataggio vecchio resta com'era. */
export function lottoDiversoDa(l, gen) {
  if (biomaDi(l.a, l.b) !== biomaDiGen(l.a, l.b, gen)) return true
  const A = acquaDelLotto(l), B = acquaDelLotto(l, gen)
  return A.length !== B.length || A.some(([i, j], n) => B[n][0] !== i || B[n][1] !== j)
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
      const acqua = acquaDelLotto(l)
      if (acqua.length < SOGLIA_LAGHETTO) g.push(`${l.id}: laghetto con ${acqua.length} celle d'acqua`)
      if (acqua.length < l.w * l.d && !moloDelLotto(l, acqua)) g.push(`${l.id}: nessun posto per il molo`)
      if (!nellaFascia(l)) g.push(`${l.id}: laghetto fuori dalla fascia di mezzo`)
    }
    if (a >= FASCIA_A0 && a <= FASCIA_A1 && !eStorico(l) && bio !== 'laghetto' && acquaDelLotto(l).length >= SOGLIA_LAGHETTO) g.push(`${l.id}: acqua senza il bioma laghetto`)
    if (bio === 'mare' && acquaDelLotto(l).length !== l.w * l.d) g.push(`${l.id}: un lotto di mare non è tutto acqua`)
    if (bio === 'lago' && !acquaDelLotto(l).length) g.push(`${l.id}: un lotto di lago senza acqua`)
    if (bio === 'costa' && acquaDelLotto(l).some(([i, j]) => !eMare(i, j))) g.push(`${l.id}: acqua di costa che non è mare`)
    if ((bio === 'mare' || bio === 'costa') && (a > ZONA.costaA)) g.push(`${l.id}: mare a est`)
    if (bio === 'lago' && a < ZONA.lagoDaA) g.push(`${l.id}: lago a ovest`)
  }
  return g.slice(0, 10)
}
