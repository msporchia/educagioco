/* Il mondo: una griglia di celle, 7×6 lotti da 4×4. Si cammina e si costruisce solo nei lotti comprati, e si compra solo
   un lotto che confina con uno tuo. Dato puro, niente disegno. Vedi docs/fattoria3d/terreno.md. */
import { EDIFICI } from './catalogo.js'

export const I0 = -16, J0 = -13, GW = 32, GH = 26             // le celle dell'array: [I0, I0+GW) × [J0, J0+GH)
export const LIM = { i0: -14, i1: 14, j0: -12, j1: 12 }       // il mondo che si può comprare
export const LOTTO = 4
export const idx = (i, j) => (j - J0) * GW + (i - I0)
export const dentro = (i, j) => i >= LIM.i0 && i < LIM.i1 && j >= LIM.j0 && j < LIM.j1

export const LOTTI = []
for (let b = 0; b < 6; b++) for (let a = 0; a < 7; a++) {
  LOTTI.push({ id: a + '_' + b, a, b, i: LIM.i0 + a * LOTTO, j: LIM.j0 + b * LOTTO, w: LOTTO, d: LOTTO })
}
// il quadrato di partenza: 3×3 lotti nel mezzo
export const LOTTI_INIZIALI = {}
for (let b = 2; b <= 4; b++) for (let a = 2; a <= 4; a++) LOTTI_INIZIALI[a + '_' + b] = true

const lottoCella = new Array(GW * GH).fill(null)
for (const l of LOTTI) for (let a = 0; a < l.w; a++) for (let b = 0; b < l.d; b++) lottoCella[idx(l.i + a, l.j + b)] = l
export const lottoDi = (i, j) => dentro(i, j) ? lottoCella[idx(i, j)] : null
export const lottoPerId = id => LOTTI.find(l => l.id === id) || null
export const vicinoDi = (l, da, db) => LOTTI.find(x => x.a === l.a + da && x.b === l.b + db) || null

export const PARTENZA = { x: 0.5, z: 5.5 }                      // dove sta l'eroe all'inizio
export const PEZZO_DI_PARTENZA = { tipo: 'campo', i: -5, j: 0 }  // un campo vuoto, per cominciare subito

// ciò che c'è sempre e non si sposta: due edifici di scena (non si comprano, ingombrano soltanto)
export const FISSI = [
  { tipo: 'fienile', i: -9, j: -9, w: 4, d: 3 },
  { tipo: 'casa',    i: -2, j: -10, w: 4, d: 3 },
]

// le strade di serie: un incrocio a T davanti ai due edifici unici, e fino alla partenza
export function stradeDiSerie() {
  const out = new Set()
  for (let i = -6; i < 6; i++) out.add(idx(i, -1))
  for (let j = -1; j <= 7; j++) for (let i = -1; i <= 0; i++) out.add(idx(i, j))
  return out
}

// dove non nasce nessun albero: le strade, i posti degli edifici unici, il campo di partenza e la partenza dell'eroe
export function celleRiservate() {
  const r = new Set(stradeDiSerie())
  const rette = [
    ...Object.values(EDIFICI).map(e => [e.slot.i, e.slot.j, e.w, e.d]),
    [PEZZO_DI_PARTENZA.i, PEZZO_DI_PARTENZA.j, 2, 2],
    [-3, 3, 6, 5],
  ]
  for (const [i, j, w, d] of rette) for (let a = -1; a <= w; a++) for (let b = -1; b <= d; b++) r.add(idx(i + a, j + b))
  return r
}

export function guastiDelMondo() {
  const g = []
  if (LOTTI.length !== 42) g.push(`i lotti sono ${LOTTI.length}, non 42`)
  if (new Set(LOTTI.map(l => l.id)).size !== LOTTI.length) g.push('lotti con lo stesso id')
  for (const id of Object.keys(LOTTI_INIZIALI)) if (!lottoPerId(id)) g.push(`lotto di partenza ${id} sconosciuto`)
  if (Object.keys(LOTTI_INIZIALI).length !== 9) g.push('il quadrato di partenza non è 3×3')
  const proprio = (i, j) => { const l = lottoDi(i, j); return !!l && !!LOTTI_INIZIALI[l.id] }
  if (!proprio(Math.floor(PARTENZA.x), Math.floor(PARTENZA.z))) g.push('l\'eroe parte fuori dal terreno suo')
  for (const [tipo, e] of Object.entries(EDIFICI)) {
    for (let a = 0; a < e.w; a++) for (let b = 0; b < e.d; b++) {
      if (!proprio(e.slot.i + a, e.slot.j + b)) g.push(`${tipo}: il posto esce dal quadrato di partenza`)
    }
  }
  for (const f of FISSI) for (let a = 0; a < f.w; a++) for (let b = 0; b < f.d; b++) {
    if (!dentro(f.i + a, f.j + b)) g.push(`${f.tipo}: esce dal mondo`)
  }
  return g
}
