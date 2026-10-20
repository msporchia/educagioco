/* I sassi e i cespugli: pochi per lotto (2–5), sempre gli stessi, anche dopo aver comprato il lotto. Il bambino li toglie toccandoli,
   per 🪙 1 ciascuno. L'id di salvataggio è la cella (`idx(i, j)`): non dipende dall'ordine di generazione, quindi un edificio nuovo
   che toglie un posto non fa scorrere gli altri. Mai sulle strade di serie, sui posti degli edifici, sul campo di partenza, sulla
   partenza dell'eroe, sul fienile e la casa, né sotto un albero. Vedi docs/fattoria3d/terreno.md. */
import { LOTTI, FISSI, idx, celleRiservate } from './mondo.js'
import { generaAlberi } from './alberi.js'

export const PER_LOTTO = { min: 2, max: 5 }

export function generaOstacoli() {
  const riservate = celleRiservate()
  for (const f of FISSI) for (let a = 0; a < f.w; a++) for (let b = 0; b < f.d; b++) riservate.add(idx(f.i + a, f.j + b))
  for (const a of generaAlberi()) if (a.tagliabile) riservate.add(idx(a.i, a.j))
  const lista = []
  for (const l of LOTTI) {
    let r = (Math.imul(l.a + 1, 73856093) ^ Math.imul(l.b + 1, 19349663) ^ 0x9e3779b9) >>> 0       // mulberry32: lotti vicini non hanno lo stesso sorteggio
    const caso = () => { r = (r + 0x6d2b79f5) >>> 0; let t = Math.imul(r ^ (r >>> 15), 1 | r); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return (((t ^ (t >>> 14)) >>> 0) / 4294967296) }
    const voluti = PER_LOTTO.min + Math.floor(caso() * (PER_LOTTO.max - PER_LOTTO.min + 1))
    const presi = []
    for (let prova = 0; prova < 40 && presi.length < voluti; prova++) {
      const i = l.i + Math.floor(caso() * l.w), j = l.j + Math.floor(caso() * l.d)
      const k = idx(i, j)
      const sasso = caso() < 0.4, s = 0.7 + caso() * 0.7, ang = caso() * 6.3, c = caso(), dx = 0.2 + caso() * 0.6, dz = 0.2 + caso() * 0.6
      if (riservate.has(k) || presi.some(p => Math.abs(p.i - i) + Math.abs(p.j - j) < 2)) continue      // mai due vicini: il lotto non diventa un muro
      presi.push({ i, j, k, sasso, s, ang, c, dx, dz })
    }
    for (const p of presi) lista.push({ n: lista.length, id: p.k, tipo: p.sasso ? 'sasso' : 'cespuglio', i: p.i, j: p.j, x: p.i + p.dx, z: p.j + p.dz, s: p.s, ang: p.ang, c: p.c })
  }
  return lista
}

export function guastiDegliOstacoli(lista = generaOstacoli()) {
  const g = []
  if (new Set(lista.map(o => o.id)).size !== lista.length) g.push('due ostacoli sulla stessa cella')
  const riservate = celleRiservate()
  for (const o of lista) if (riservate.has(o.id)) g.push(`ostacolo ${o.n} su una cella riservata`)
  for (const l of LOTTI) {
    const n = lista.filter(o => o.i >= l.i && o.i < l.i + l.w && o.j >= l.j && o.j < l.j + l.d).length
    if (n > PER_LOTTO.max) g.push(`lotto ${l.id}: ${n} ostacoli`)
  }
  if (lista.length < LOTTI.length) g.push(`pochi ostacoli: ${lista.length}`)
  return g
}
