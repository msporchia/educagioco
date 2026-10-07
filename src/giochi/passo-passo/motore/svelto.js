/* IL RISOLUTORE SVELTO DEI PASCOLI — la stessa ricerca in ampiezza di
   `risolvi` (motore/risolutore.js), ma solo per i posti del cane senza
   massi né salti, e con lo stato in un numero invece che in una parola:
   un pascolo con tre o quattro pecore ha decine di migliaia di stati, e
   il sentiero ne prova tanti prima di tenerne uno. Le regole sono quelle
   di `motore/mondo.js`, riscritte qui per gli interi: il test
   `unita/passo-passo-sentiero` le confronta col motore vero su centinaia
   di pascoli, e il generatore rigioca col motore vero la strada che
   trova. Vedi docs/passo-passo/sentiero.md. */
import { PASSI, VERSI, VISTA } from '../dati/mondo.js'

const DIREZIONI = PASSI.map(v => [VERSI[v].dx, VERSI[v].dy])
const PERSO = -1, VINTO = 1, VA = 0
const MAX_PECORE = 6

/* si può usare dove il mondo ha solo cane, pecore, ghiaccio, buche,
   acqua e ostacoli: niente massi (lo stato non li tiene), niente salti,
   e non più di sei pecore (lo stato sta in un numero intero) */
export const vaBene = liv => liv.cane && !liv.massi.length && !liv.salti && liv.n <= 99 &&
  liv.pecore.length <= MAX_PECORE

function tavole(liv) {
  const n = liv.n, W = liv.colonne, H = liv.righe
  const vicino = new Int16Array(n * 4).fill(-1)
  for (let i = 0; i < n; i++) {
    const x = i % W, y = (i / W) | 0
    DIREZIONI.forEach(([dx, dy], d) => {
      const u = x + dx, v = y + dy
      if (u >= 0 && v >= 0 && u < W && v < H) vicino[i * 4 + d] = v * W + u
    })
  }
  const flag = k => Uint8Array.from({ length: n }, (_, i) => (k(i) ? 1 : 0))
  return {
    vicino,
    ostacolo: flag(i => !!liv.ostacolo[i]),
    alto: flag(i => liv.alto(i)),
    acqua: flag(i => liv.terreno[i] === 'acqua'),
    ghiaccio: flag(i => liv.terreno[i] === 'ghiaccio'),
    recinto: flag(i => liv.terreno[i] === 'recinto'),
    tana: flag(i => i === liv.tana),
    buca: flag(i => liv.terreno[i] === 'buca' && liv.gemella[i] >= 0),
    incastro: flag(i => !!(liv.incastro && liv.incastro[i])),
    gemella: Int16Array.from(liv.gemella),
    carota: liv.carota,
  }
}

/* lo stato di adesso: il cane, la carota, le pecore ancora fuori */
let P = 0, PRESA = 0, N = 0
const PEC = new Int16Array(MAX_PECORE)

const pecoraIn = i => { for (let j = 0; j < N; j++) if (PEC[j] === i) return j; return -1 }
const libero = (T, i) => i >= 0 && !T.ostacolo[i] && pecoraIn(i) < 0 && !T.acqua[i] && !T.tana[i] && !T.buca[i]

/* una mossa del cane: torna VINTO, PERSO o VA */
function muovi(T, d) {
  const { vicino } = T
  const q = vicino[P * 4 + d]
  if (q < 0 || T.ostacolo[q] || T.recinto[q] || T.acqua[q] || pecoraIn(q) >= 0) return PERSO
  P = q
  /* arriva: la carota, le buche, la scivolata */
  for (let c = q; ;) {
    if (c === T.carota) PRESA = 1
    if (T.tana[c]) return VINTO
    if (T.buca[c]) { P = T.gemella[c]; break }
    if (!T.ghiaccio[c]) break
    const n = vicino[c * 4 + d]
    if (n < 0 || T.ostacolo[n] || T.recinto[n] || pecoraIn(n) >= 0) break
    if (T.acqua[n]) return PERSO
    P = n
    c = n
  }
  /* spaventa: la prima pecora su ogni linea, nell'ordine fisso */
  for (let e = 0; e < 4; e++) {
    let c = P
    for (let passo = 1; passo <= VISTA; passo++) {
      c = vicino[c * 4 + e]
      if (c < 0) break
      const k = pecoraIn(c)
      if (k >= 0) { fuggi(T, k, e); break }
      if (T.alto[c]) break
    }
  }
  if (!N) return VINTO
  for (let j = 0; j < N; j++) if (T.incastro[PEC[j]]) return PERSO
  return VA
}

const FILA = new Int16Array(MAX_PECORE + 1)
function fuggi(T, k, e) {
  const { vicino } = T
  let lunga = 1
  FILA[0] = PEC[k]
  let r = vicino[FILA[0] * 4 + e]
  while (r >= 0 && pecoraIn(r) >= 0) { FILA[lunga++] = r; r = vicino[r * 4 + e] }
  if (!libero(T, r)) return
  for (let j = lunga - 1; j >= 0; j--) {
    const q = pecoraIn(FILA[j])
    let c = vicino[FILA[j] * 4 + e]
    while (!T.recinto[c] && T.ghiaccio[c]) {
      const n = vicino[c * 4 + e]
      if (!libero(T, n)) break
      c = n
    }
    if (T.recinto[c]) { for (let i = q; i < N - 1; i++) PEC[i] = PEC[i + 1]; N-- } else PEC[q] = c
  }
}

/* lo stato in un numero: le pecore in ordine, così due pecore scambiate
   sono lo stesso stato (come in `Mondo.chiave`) */
function chiude() {
  for (let i = 1; i < N; i++) {
    const v = PEC[i]
    let j = i - 1
    while (j >= 0 && PEC[j] > v) { PEC[j + 1] = PEC[j]; j-- }
    PEC[j + 1] = v
  }
  let k = P + 100 * PRESA
  for (let j = 0; j < N; j++) k = k * 101 + PEC[j] + 1
  return k * 8 + N
}
function apre(k) {
  N = k % 8
  k = (k - N) / 8
  for (let j = N - 1; j >= 0; j--) { const c = k % 101; PEC[j] = c - 1; k = (k - c) / 101 }
  PRESA = k >= 100 ? 1 : 0
  P = k - 100 * PRESA
}

/* gli stati visti: una tavola a indirizzi aperti, riusata */
let BITS = 0, CHIAVI = null, TIMBRI = null, TIMBRO = 0
function prepara(quanti) {
  let bits = 12
  while ((1 << bits) < quanti * 2) bits++
  if (bits > BITS) { BITS = bits; CHIAVI = new Float64Array(1 << bits); TIMBRI = new Int32Array(1 << bits); TIMBRO = 0 }
  TIMBRO++
}
/* torna vero se la chiave è nuova (e la segna) */
function nuova(k) {
  const lo = k % 4294967296, hi = (k - lo) / 4294967296
  let h = Math.imul((lo | 0) ^ Math.imul(hi | 0, 0x9e3779b1), 0x85ebca6b) >>> (32 - BITS)
  const mask = (1 << BITS) - 1
  for (;;) {
    if (TIMBRI[h] !== TIMBRO) { TIMBRI[h] = TIMBRO; CHIAVI[h] = k; return true }
    if (CHIAVI[h] === k) return false
    h = (h + 1) & mask
  }
}

/* la strada più corta, come `risolvi`: con la carota se `carota`, `null`
   se non c'è o se gli stati visti passano `limite` */
export function risolviSvelto(liv, { carota = true, limite = 20000, T = tavole(liv) } = {}) {
  if (!vaBene(liv)) throw new Error('risolviSvelto: solo pascoli senza massi né salti')
  /* la coda: tutti i nodi in fila, col padre e la mossa per ricostruire
     la strada; si ferma a fine livello come `risolvi` */
  const tetto = limite + 4 * limite + 64
  const chiavi = new Float64Array(tetto), padri = new Int32Array(tetto), mosse = new Int8Array(tetto)
  prepara(tetto)
  P = liv.partenza; PRESA = 0; N = liv.pecore.length
  for (let j = 0; j < N; j++) PEC[j] = liv.pecore[j]
  chiavi[0] = chiude(); padri[0] = -1; mosse[0] = -1
  nuova(chiavi[0])
  let visti = 1, coda = 1, fineLivello = 1
  const pec0 = new Int16Array(MAX_PECORE)
  for (let i = 0; i < coda; i++) {
    apre(chiavi[i])
    const p0 = P, presa0 = PRESA, n0 = N
    pec0.set(PEC)
    for (let d = 0; d < 4; d++) {
      if (d) { P = p0; PRESA = presa0; N = n0; PEC.set(pec0) }
      const esito = muovi(T, d)
      if (esito === PERSO) continue
      if (esito === VINTO) {
        if (!carota || PRESA) return strada(padri, mosse, i, d)
        continue
      }
      const k = chiude()
      if (!nuova(k)) continue
      visti++
      if (coda >= tetto) return null
      chiavi[coda] = k; padri[coda] = i; mosse[coda] = d
      coda++
    }
    if (i + 1 === fineLivello) {
      if (visti > limite) return null
      fineLivello = coda
    }
  }
  return null
}

function strada(padri, mosse, i, d) {
  const fuori = [PASSI[d]]
  for (let n = i; padri[n] >= 0; n = padri[n]) fuori.push(PASSI[mosse[n]])
  return fuori.reverse()
}

/* le misure di `misura` che servono al sentiero: prima la strada senza
   carota (se è troppo corta il posto si butta subito), poi con */
export function misuraSvelta(liv, { limite = 20000, corta: minimo = 0 } = {}) {
  const T = tavole(liv)
  const senza = risolviSvelto(liv, { carota: false, limite, T })
  if (!senza || senza.length < minimo) return { corta: senza ? senza.length : null, lunga: null, deviazione: null }
  const con = risolviSvelto(liv, { carota: true, limite: limite * 2, T })
  return { senzaCarota: senza, conCarota: con, corta: senza.length, lunga: con ? con.length : null,
           deviazione: con ? con.length - senza.length : null }
}

/* lo stesso mondo come un numero, con le domande di `Mondo` che servono a
   chi lo clona milioni di volte: la ricerca dei programmi più corti
   (motore/programmi.js). `mossa` torna 'tana', 'sbatte' o null */
const VERSO = Object.fromEntries(PASSI.map((v, d) => [v, d]))
export class MondoSvelto {
  constructor(liv, T = tavole(liv)) {
    this.liv = liv
    this.T = T
    P = liv.partenza; PRESA = 0; N = liv.pecore.length
    for (let j = 0; j < N; j++) PEC[j] = liv.pecore[j]
    this.k = chiude()
    this.p = P
    this.presa = false
  }
  clona() {
    const m = Object.create(MondoSvelto.prototype)
    m.liv = this.liv; m.T = this.T; m.k = this.k; m.p = this.p; m.presa = this.presa
    return m
  }
  chiave() { return this.k }
  lastra() { return this.liv.lastra[this.p] }
  mossa(m) {
    apre(this.k)
    const esito = muovi(this.T, VERSO[m])
    if (esito === PERSO) return 'sbatte'
    this.p = P
    this.presa = PRESA === 1
    this.k = chiude()
    return esito === VINTO ? 'tana' : null
  }
}

