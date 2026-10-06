// Lo zaino: quante righe può scrivere il bambino in un livello (`zaino`
// nel livello); si contano il principale e i progetti del bambino, non
// gli attrezzi. `srotola` riscrive il programma senza i progetti, per il
// banco. Vedi docs/costruttore/progetti.md.
import { copia } from '../dati/scrivi.js'

const RAMI = ['corpo', 'allora', 'altrimenti']

/* le righe di una fila: ogni istruzione una, e dentro i blocchi le loro */
export const righeDi = fila =>
  (fila || []).reduce((n, i) => n + 1 + RAMI.reduce((m, r) => m + righeDi(i[r]), 0), 0)

/* quelle che ha scritto il bambino: il principale e i suoi progetti */
export const righeScritte = prog =>
  righeDi(prog.principale) + (prog.progetti || []).filter(p => !p.attrezzo).reduce((n, p) => n + righeDi(p.corpo), 0)

/* quello che ha scritto il bambino, senza gli id e gli attrezzi: due programmi
   con la stessa impronta dicono la stessa cosa (il livello lasciato a metà,
   docs/costruttore/scheda.md) */
export const impronta = prog => JSON.stringify({
  principale: (prog && prog.principale) || [],
  progetti: ((prog && prog.progetti) || []).filter(p => !p.attrezzo),
  lavagnette: (prog && prog.lavagnette) || [],
}, (k, v) => (k === 'id' || k === 'prossimo' ? undefined : v))

/* il programma sta nello zaino del livello? (senza zaino, sempre) */
export const ciSta = (prog, zaino) => !zaino || righeScritte(prog) <= zaino

/* ── srotolare ── */
const PROFONDO = 30

/* un valore con le misure sostituite: `{ v: 'alta' }` diventa quello che
   la chiamata aveva passato, anche dentro un conto */
function sostituisci(x, misure) {
  if (Array.isArray(x)) return x.map(y => sostituisci(y, misure))
  if (!x || typeof x !== 'object') return x
  if (typeof x.v === 'string' && Object.keys(x).length === 1 && x.v in misure) return copia(misure[x.v])
  const o = {}
  for (const [k, v] of Object.entries(x)) if (k !== 'id') o[k] = sostituisci(v, misure)
  return o
}

function srotolaFila(fila, prog, misure, profondo) {
  if (profondo > PROFONDO) throw new Error('srotola: un progetto chiama sé stesso')
  const out = []
  for (const i of fila || []) {
    const p = i.tipo === 'chiama' && (prog.progetti || []).find(q => q.id === i.progetto)
    if (p && !p.attrezzo) {
      const nuove = {}
      ;(p.misure || []).forEach((m, k) => { nuove[m] = sostituisci((i.argomenti || [])[k], misure) })
      out.push(...srotolaFila(p.corpo, prog, nuove, profondo + 1))
      continue
    }
    const q = sostituisci({ ...i, corpo: undefined, allora: undefined, altrimenti: undefined }, misure)
    for (const r of RAMI) {
      if (Array.isArray(i[r])) q[r] = srotolaFila(i[r], prog, misure, profondo)
      else delete q[r]
    }
    if (i.tipo === 'se' && i.altrimenti === null) q.altrimenti = null
    out.push(q)
  }
  return out
}

/* Un progetto del bambino che, prima o poi, chiama sé stesso — da solo
   o passando da un altro. Un programma così non si srotola: la torre di
   Hanoi con la sua misura «alta» srotolata sarebbe un'altra per ogni
   altezza, ed è proprio per questo che la ricorsione serve. Il banco lo
   chiede prima di srotolare. */
export function chiamaSeStesso(prog) {
  const suoi = (prog.progetti || []).filter(p => !p.attrezzo)
  const chiamati = corpo => {
    const ids = new Set()
    const giro = fila => {
      for (const i of fila || []) {
        if (i.tipo === 'chiama') ids.add(i.progetto)
        for (const r of RAMI) giro(i[r])
      }
    }
    giro(corpo)
    return ids
  }
  const archi = new Map(suoi.map(p => [p.id, chiamati(p.corpo)]))
  for (const p of suoi) {
    const visti = new Set()
    const fila = [...(archi.get(p.id) || [])]
    while (fila.length) {
      const q = fila.pop()
      if (q === p.id) return true
      if (visti.has(q) || !archi.has(q)) continue
      visti.add(q)
      fila.push(...archi.get(q))
    }
  }
  return false
}

/* il programma senza i progetti del bambino (gli attrezzi restano) */
export function srotola(prog) {
  return {
    principale: srotolaFila(prog.principale, prog, {}, 0),
    progetti: copia((prog.progetti || []).filter(p => p.attrezzo)),
    lavagnette: [...(prog.lavagnette || [])],
  }
}
