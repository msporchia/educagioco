/* I sassi e i cespugli: pochi per lotto, sempre gli stessi, anche dopo aver comprato il lotto. Il bambino li toglie toccandoli,
   per 🪙 1 ciascuno. L'id di salvataggio è la cella (`idCella`): non dipende dall'ordine di generazione, quindi un edificio nuovo
   che toglie un posto non fa scorrere gli altri; nei lotti storici è l'indice di sempre, negli altri la chiave impacchettata.
   Mai sulle strade di serie, sui posti degli edifici, sul campo di partenza, sulla partenza dell'eroe, sul fienile e la casa, sull'acqua,
   né sotto un albero. Vedi docs/fattoria3d/terreno.md e mondo-infinito.md. */
import { LOTTI_STORICI, FISSI, chiave, idCella, celleRiservate } from './mondo.js'

export const PER_LOTTO = { min: 2, max: 5 }                      // il prato
export const PER_BIOMA = { prato: PER_LOTTO, bosco: { min: 1, max: 3 }, laghetto: { min: 1, max: 3 } }

let riservateStoriche = null
/** Le celle dove un lotto storico non ha sassi, tolti gli alberi (quelli li dà chi chiama): strade, posti degli edifici, fienile e casa. */
export function riservateDeiLottiStorici() {
  if (!riservateStoriche) {
    riservateStoriche = celleRiservate()
    for (const f of FISSI) for (let a = 0; a < f.w; a++) for (let b = 0; b < f.d; b++) riservateStoriche.add(chiave(f.i + a, f.j + b))
  }
  return riservateStoriche
}

/** Gli ostacoli di un lotto. `riservate`: chiavi di cella da lasciare libere (alberi, acqua, e per i storici anche i posti fissi). */
export function ostacoliDelLotto(l, riservate, bioma = 'prato') {
  const { min, max } = PER_BIOMA[bioma] || PER_LOTTO
  let r = (Math.imul(l.a + 1, 73856093) ^ Math.imul(l.b + 1, 19349663) ^ 0x9e3779b9) >>> 0       // mulberry32: lotti vicini non hanno lo stesso sorteggio
  const caso = () => { r = (r + 0x6d2b79f5) >>> 0; let t = Math.imul(r ^ (r >>> 15), 1 | r); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return (((t ^ (t >>> 14)) >>> 0) / 4294967296) }
  const voluti = min + Math.floor(caso() * (max - min + 1))
  const presi = []
  for (let prova = 0; prova < 40 && presi.length < voluti; prova++) {
    const i = l.i + Math.floor(caso() * l.w), j = l.j + Math.floor(caso() * l.d)
    const sasso = caso() < 0.4, s = 0.7 + caso() * 0.7, ang = caso() * 6.3, c = caso(), dx = 0.2 + caso() * 0.6, dz = 0.2 + caso() * 0.6
    if (riservate.has(chiave(i, j)) || presi.some(p => Math.abs(p.i - i) + Math.abs(p.j - j) < 2)) continue      // mai due vicini: il lotto non diventa un muro
    presi.push({ i, j, sasso, s, ang, c, dx, dz })
  }
  return presi.map(p => { const id = idCella(p.i, p.j); return { n: id, id, tipo: p.sasso ? 'sasso' : 'cespuglio', i: p.i, j: p.j, x: p.i + p.dx, z: p.j + p.dz, s: p.s, ang: p.ang, c: p.c } })
}

export function guastiDegliOstacoli(lista, alberi) {
  const g = []
  if (new Set(lista.map(o => o.id)).size !== lista.length) g.push('due ostacoli sulla stessa cella')
  const riservate = riservateDeiLottiStorici()
  for (const o of lista) if (riservate.has(chiave(o.i, o.j))) g.push(`ostacolo ${o.n} su una cella riservata`)
  for (const l of LOTTI_STORICI) {
    const n = lista.filter(o => o.i >= l.i && o.i < l.i + l.w && o.j >= l.j && o.j < l.j + l.d).length
    if (n > PER_LOTTO.max) g.push(`lotto ${l.id}: ${n} ostacoli`)
  }
  if (lista.length < LOTTI_STORICI.length) g.push(`pochi ostacoli: ${lista.length}`)
  if (alberi) { const a = new Set(alberi.map(x => chiave(x.i, x.j))); for (const o of lista) if (a.has(chiave(o.i, o.j))) g.push(`ostacolo ${o.n} sotto un albero`) }
  return g
}
