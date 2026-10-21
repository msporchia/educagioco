/* Il mondo: celle intere (i, j) qualunque, raccolte in lotti da 4×4 con coordinate intere (a, b) qualunque, anche negative
   (`i = -14 + 4a`, `j = -12 + 4b`, id `a_b`). Non ha confini: si compra qualunque lotto che confina con uno proprio, e il prezzo
   si auto-limita (dati/regole.js). I 42 lotti 7×6 di prima (a 0..6, b 0..5) sono i lotti «storici»: il quadrato di partenza,
   i posti degli edifici e le strade di serie stanno lì. Dato puro, niente disegno. Vedi docs/fattoria3d/mondo-infinito.md. */
import { EDIFICI } from './catalogo.js'

export const LOTTO = 4
export const ORIGINE = { i: -14, j: -12 }                      // l'angolo del lotto 0_0

// ── la chiave di una cella: un intero solo, senza collisioni, per le mappe sparse del motore ──
const SPAZIO = 1 << 21, META = 1 << 20                          // 2^21 valori per asse: ±1 milione di celle
export const chiave = (i, j) => (i + META) * SPAZIO + (j + META)
export const cellaDa = k => [Math.floor(k / SPAZIO) - META, k % SPAZIO - META]
export const dentro = (i, j) => Number.isFinite(i) && Number.isFinite(j) && Math.abs(i) < META - 2 && Math.abs(j) < META - 2   // «nel mondo»: ormai ogni cella, salvo numeri impossibili

// ── il mondo di prima, per leggere gli id salvati ──
// Un id salvato (una strada disegnata, un sasso tolto, un albero tagliato) vale per una cella. Dentro il rettangolo storico è
// l'indice della vecchia griglia (come prima); fuori è la chiave impacchettata, sempre più grande: nessuna collisione e il
// salvataggio di ieri si legge uguale. `idCella` e `cellaDaId` sono una l'inversa dell'altra.
const I0 = -16, J0 = -13, GW = 32, GH = 26
export const LIM = { i0: -14, i1: 14, j0: -12, j1: 12 }          // il rettangolo dei 42 lotti storici
export const nelRettangolo = (i, j) => i >= LIM.i0 && i < LIM.i1 && j >= LIM.j0 && j < LIM.j1
export const idCella = (i, j) => nelRettangolo(i, j) ? (j - J0) * GW + (i - I0) : chiave(i, j)
export function cellaDaId(id) {
  if (!Number.isInteger(id) || id < 0) return null
  if (id < GW * GH) return [id % GW + I0, Math.floor(id / GW) + J0]
  const c = cellaDa(id)
  return dentro(c[0], c[1]) ? c : null
}

// ── i lotti ──
const cacheLotti = new Map()
export const chiaveLotto = (a, b) => (a + META) * SPAZIO + (b + META)
/** Il lotto (a, b): un oggetto sempre uguale a sé stesso { id, a, b, i, j, w, d }. */
export function lotto(a, b) {
  const k = chiaveLotto(a, b)
  let l = cacheLotti.get(k)
  if (!l) { l = { id: a + '_' + b, a, b, i: ORIGINE.i + a * LOTTO, j: ORIGINE.j + b * LOTTO, w: LOTTO, d: LOTTO, k }; cacheLotti.set(k, l) }
  return l
}
export const lottoDaChiave = k => lotto(Math.floor(k / SPAZIO) - META, k % SPAZIO - META)
export const lottoDi = (i, j) => lotto(Math.floor((i - ORIGINE.i) / LOTTO), Math.floor((j - ORIGINE.j) / LOTTO))
export function lottoPerId(id) {
  const m = typeof id === 'string' && /^(-?\d{1,4})_(-?\d{1,4})$/.exec(id)
  return m ? lotto(+m[1], +m[2]) : null
}
export const vicinoDi = (l, da, db) => lotto(l.a + da, l.b + db)
export const VICINI_4 = [[1, 0], [-1, 0], [0, 1], [0, -1]]
/** I lotti che un rettangolo di celle tocca (per gli snapshot dei vicini: i lotti di un edificio sono suoi) */
export function lottiDelPosto(i, j, w, d) {
  const out = new Map()
  for (let a = 0; a < w; a++) for (let b = 0; b < d; b++) { const l = lottoDi(i + a, j + b); out.set(l.id, l) }
  return [...out.values()]
}

// i 42 lotti storici (7×6) e il quadrato di partenza (3×3 nel mezzo)
export const LOTTI_STORICI = []
for (let b = 0; b < 6; b++) for (let a = 0; a < 7; a++) LOTTI_STORICI.push(lotto(a, b))
export const eStorico = l => l.a >= 0 && l.a < 7 && l.b >= 0 && l.b < 6
export const LOTTI_INIZIALI = {}
for (let b = 2; b <= 4; b++) for (let a = 2; a <= 4; a++) LOTTI_INIZIALI[a + '_' + b] = true

export const PARTENZA = { x: 0.5, z: 5.5 }                      // dove sta l'eroe all'inizio
export const PEZZO_DI_PARTENZA = { tipo: 'campo', i: -5, j: 0 }  // un campo vuoto, per cominciare subito

// I posti di prima degli edifici unici (angolo in alto a sinistra): oggi gli edifici si mettono dove si vuole, ma questi servono a
// tre cose sole: rileggere un salvataggio vecchio (un edificio già comprato sta dove stava), tenere uguali gli alberi e i sassi dei 42
// lotti storici (i numeri sono chiavi di salvataggio) e il posto di partenza dei villaggi. Non si cambiano. docs/fattoria3d/edifici-liberi.md
export const POSTI_STORICI = {
  pasticceria:   { i: -6, j: -4 }, mongolfiera: { i: 2, j: -4 }, mulino: { i: -2, j: -7 }, panificio: { i: -5, j: -7 },
  conserviera:   { i: 2, j: -7 },  gelateria: { i: -9, j: 0 },   caseificio: { i: 6, j: -3 }, telaio: { i: -9, j: -4 },
  zuccherificio: { i: 6, j: 4 },   sartoria: { i: 6, j: 0 },     tintoria: { i: -9, j: 4 },
}

// ciò che c'è sempre e non si sposta: due edifici di scena (non si comprano, ingombrano soltanto)
export const FISSI = [
  { tipo: 'fienile', i: -9, j: -9, w: 4, d: 3 },
  { tipo: 'casa',    i: -2, j: -10, w: 4, d: 3 },
]

// le strade di serie: un incrocio a T davanti ai due edifici unici, e fino alla partenza (chiavi di cella)
export function stradeDiSerie() {
  const out = new Set()
  for (let i = -6; i < 6; i++) out.add(chiave(i, -1))
  for (let j = -1; j <= 7; j++) for (let i = -1; i <= 0; i++) out.add(chiave(i, j))
  return out
}

// dove non nasce nessun albero nei lotti storici: le strade, i posti di prima degli edifici, il campo di partenza e la partenza del contadino
// (chiavi di cella). `tipi`: quali posti contare (gli alberi storici si generano con i primi due soli, perché i numeri non cambino: vedi alberi.js)
export function celleRiservate(tipi = Object.keys(POSTI_STORICI)) {
  const r = new Set(stradeDiSerie())
  const rette = [
    ...tipi.map(t => [POSTI_STORICI[t].i, POSTI_STORICI[t].j, EDIFICI[t].w, EDIFICI[t].d]),
    [PEZZO_DI_PARTENZA.i, PEZZO_DI_PARTENZA.j, 2, 2],
    [-3, 3, 6, 5],
  ]
  for (const [i, j, w, d] of rette) for (let a = -1; a <= w; a++) for (let b = -1; b <= d; b++) r.add(chiave(i + a, j + b))
  return r
}

export function guastiDelMondo() {
  const g = []
  if (LOTTI_STORICI.length !== 42) g.push(`i lotti storici sono ${LOTTI_STORICI.length}, non 42`)
  if (new Set(LOTTI_STORICI.map(l => l.id)).size !== LOTTI_STORICI.length) g.push('lotti con lo stesso id')
  for (const id of Object.keys(LOTTI_INIZIALI)) if (!lottoPerId(id)) g.push(`lotto di partenza ${id} sconosciuto`)
  if (Object.keys(LOTTI_INIZIALI).length !== 9) g.push('il quadrato di partenza non è 3×3')
  const proprio = (i, j) => !!LOTTI_INIZIALI[lottoDi(i, j).id]
  if (!proprio(Math.floor(PARTENZA.x), Math.floor(PARTENZA.z))) g.push('il contadino parte fuori dal terreno suo')
  const strade = stradeDiSerie()
  for (const [tipo, e] of Object.entries(EDIFICI)) {
    if (!POSTI_STORICI[tipo]) { g.push(`${tipo}: manca il posto di prima`); continue }
    const slot = POSTI_STORICI[tipo]
    let fuori = false
    for (let a = 0; a < e.w; a++) for (let b = 0; b < e.d; b++) {
      const i = slot.i + a, j = slot.j + b
      if (!nelRettangolo(i, j)) fuori = true
      else if (strade.has(chiave(i, j))) g.push(`${tipo}: il posto è sopra una strada di serie`)
      if (FISSI.some(f => i >= f.i && i < f.i + f.w && j >= f.j && j < f.j + f.d)) g.push(`${tipo}: il posto è sopra ${FISSI.find(f => i >= f.i && i < f.i + f.w && j >= f.j && j < f.j + f.d).tipo}`)
      if (i >= PEZZO_DI_PARTENZA.i && i < PEZZO_DI_PARTENZA.i + 2 && j >= PEZZO_DI_PARTENZA.j && j < PEZZO_DI_PARTENZA.j + 2) g.push(`${tipo}: il posto è sopra il campo di partenza`)
    }
    if (fuori) g.push(`${tipo}: il posto esce dai lotti storici`)
  }
  for (const f of FISSI) for (let a = 0; a < f.w; a++) for (let b = 0; b < f.d; b++) {
    if (!nelRettangolo(f.i + a, f.j + b)) g.push(`${f.tipo}: esce dai lotti storici`)
  }
  const t = Object.entries(POSTI_STORICI)
  for (let a = 0; a < t.length; a++) for (let b = a + 1; b < t.length; b++) {
    const [ka, x] = t[a], [kb, y] = t[b], A = EDIFICI[ka], B = EDIFICI[kb]
    if (x.i < y.i + B.w && y.i < x.i + A.w && x.j < y.j + B.d && y.j < x.j + A.d) g.push(`${ka} e ${kb}: i posti di prima si sovrappongono`)
  }
  for (const [i, j] of [[0, 0], [-14, -12], [13, 11], [-30, 40], [-1000, 999]]) {
    const c = cellaDaId(idCella(i, j))
    if (!c || c[0] !== i || c[1] !== j) g.push(`l'id di (${i}, ${j}) non torna`)
  }
  return g
}
