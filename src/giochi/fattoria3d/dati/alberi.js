/* Gli alberi di ogni lotto, sempre gli stessi. Nei 42 lotti storici sono quelli di prima (un caso con il seme, in fila: «l'albero
   numero 32» è lo stesso a ogni avvio e i tagliati si salvano come numeri, `stato.tagliati`). Negli altri lotti nascono a richiesta
   dalle coordinate del lotto (`alberiNuovi`): l'id è la chiave della cella, grande, che non tocca mai i numeri storici.
   Tutti si abbattono nel terreno proprio. Vedi docs/fattoria3d/mondo-infinito.md. */
import { EDIFICI } from './catalogo.js'
import { LOTTI_STORICI, POSTI_STORICI, chiave, celleRiservate, lotto, eStorico } from './mondo.js'
import { sequenza } from './semi.js'

// Gli alberi storici si generano come quando gli edifici erano due: i numeri sono chiavi di salvataggio (`tagliati`) e non devono
// scorrere. Gli edifici arrivati dopo togliono gli alberi che stavano sul loro posto di prima (nascono già `tagliato`, senza legna):
// gli edifici di oggi si mettono dove si vuole, ma i lotti storici restano come erano (docs/fattoria3d/edifici-liberi.md).
const EDIFICI_DEL_PRIMO_GIRO = ['pasticceria', 'mongolfiera']

let storici = null
/** Gli alberi dei 42 lotti storici, con il loro numero di sempre (tutti da abbattere). Calcolati una volta. */
export function alberiStorici() {
  if (storici) return storici
  let r = 7
  const caso = () => { r = (r * 9301 + 49297) % 233280; return r / 233280 }
  const riservate = celleRiservate(EDIFICI_DEL_PRIMO_GIRO)
  const lista = []
  const prova = (i, j) => {
    if (riservate.has(chiave(i, j))) return
    if (lista.some(a => Math.hypot(a.i - i, a.j - j) < 1.9)) return
    lista.push({ i, j, s: 0.8 + caso() * 0.7, c: caso(), tagliabile: true })
  }
  for (const l of LOTTI_STORICI) for (let k = 0; k < 3; k++) prova(l.i + Math.floor(caso() * l.w), l.j + Math.floor(caso() * l.d))
  const sulPosto = new Set()
  for (const [tipo, e] of Object.entries(EDIFICI)) {
    if (EDIFICI_DEL_PRIMO_GIRO.includes(tipo) || POSTI_STORICI[tipo].nuovo) continue
    const slot = POSTI_STORICI[tipo]
    for (let a = 0; a < e.w; a++) for (let b = 0; b < e.d; b++) sulPosto.add(chiave(slot.i + a, slot.j + b))
  }
  storici = lista.map((a, n) => sulPosto.has(chiave(a.i, a.j)) ? { ...a, n, tagliato: true } : { ...a, n })
  return storici
}

const perLotto = new Map()
function storiciDelLotto(l) {
  if (!perLotto.size) for (const x of LOTTI_STORICI) perLotto.set(x.id, [])
  if (!perLotto.get('0_0').length && !perLotto.__pieno) {
    for (const a of alberiStorici()) { const g = perLotto.get(lotto(Math.floor((a.i + 14) / 4), Math.floor((a.j + 12) / 4)).id); if (g) g.push(a) }
    perLotto.__pieno = true
  }
  return perLotto.get(l.id) || []
}

// Quanti tentativi e quanto vicini: il prato ne ha pochi e radi (come prima), il bosco tanti e fitti. Dentro il lotto le celle
// sono 0..2 su ogni asse: due alberi di lotti vicini stanno sempre ad almeno 2 celle.
export const ALBERI_PER_BIOMA = { prato: { prove: 3, minimo: 1.9 }, bosco: { prove: 12, minimo: 1.4 }, laghetto: { prove: 2, minimo: 1.9 }, costa: { prove: 2, minimo: 1.9 }, lago: { prove: 2, minimo: 1.9 } }

/** Gli alberi di un lotto non storico. `occupate`: chiavi di celle dove non si pianta (l'acqua). Il numero è la chiave della cella. */
export function alberiNuovi(l, bioma, occupate = new Set()) {
  const { prove, minimo } = ALBERI_PER_BIOMA[bioma] || ALBERI_PER_BIOMA.prato
  const caso = sequenza(l.a, l.b, 5), lista = []
  const vicini = []                                               // i storici dei lotti accanto: un albero nuovo non gli sta addosso
  for (const [da, db] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
    const v = lotto(l.a + da, l.b + db)
    if (eStorico(v)) vicini.push(...storiciDelLotto(v))
  }
  for (let k = 0; k < prove; k++) {
    const i = l.i + Math.floor(caso() * 3), j = l.j + Math.floor(caso() * 3)
    const s = 0.8 + caso() * 0.7, c = caso()
    if (occupate.has(chiave(i, j))) continue
    if (lista.some(a => Math.hypot(a.i - i, a.j - j) < minimo)) continue
    if (vicini.some(a => Math.hypot(a.i - i, a.j - j) < 1.9)) continue
    lista.push({ n: chiave(i, j), i, j, s, c, tagliabile: true })
  }
  return lista
}

export function guastiDegliAlberi(alberi = alberiStorici()) {
  const g = []
  if (alberi.length < 30) g.push(`pochi alberi da abbattere: ${alberi.length}`)
  for (const a of alberi) {
    if (!a.tagliabile) g.push(`albero ${a.n}: non si abbatte`)
    if (a.n !== alberi.indexOf(a)) g.push(`albero ${a.n}: numero fuori posto`)
  }
  for (const [tipo, e] of Object.entries(EDIFICI)) {
    const slot = POSTI_STORICI[tipo]
    const su = alberi.find(a => !a.tagliato && a.i >= slot.i && a.i < slot.i + e.w && a.j >= slot.j && a.j < slot.j + e.d)
    if (su) g.push(`${tipo}: l'albero ${su.n} sta sul suo posto`)
  }
  return g
}
