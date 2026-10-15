// Il giocatore finto: gioca una tappa da solo, senza schermo, e dice com'è
// andata. È l'unico modo di tarare i numeri senza provarli a occhio. Il conto
// non costa tempo (il campo sta fermo mentre si calcola), quindi il giocatore
// finto decide soltanto cosa mettere e dove, e quanto è lento a raccogliere
// i soli. Vedi docs/giardino/taratura.md.
import { Partita } from './partita.js'
import { PIANTE } from '../dati/piante.js'
import { CAMPO } from '../dati/regole.js'

// un caso rifacibile (mulberry32)
export function caso(seme) {
  let a = seme >>> 0
  return () => {
    a = (a + 0x6D2B79F5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/* I tipi di giocatore: quanto ci mette a toccare un sole, ogni quanto decide,
   e quanti girasoli si tiene (per corsia) prima di pensare alla difesa. */
export const GIOCATORI = {
  attento: { reazione: 1,  decide: 0.5, girasoli: 1.2 },
  lento:   { reazione: 4,  decide: 2.5, girasoli: 1 },
  sbadato: { reazione: 7,  decide: 5,   girasoli: 0.6 },
}

export function gioca({ sfida, seme = 1, giocatore = 'attento', tetto = 400 } = {}) {
  const G = typeof giocatore === 'string' ? GIOCATORI[giocatore] : giocatore
  const p = new Partita({ sfida, rnd: caso(seme) })
  const vistoDa = new Map()
  let pensa = 0
  while (!p.fine && p.t < tetto) {
    p.avanza(0.25)
    // i soli: si toccano dopo un po'
    for (let i = p.raccolte.length - 1; i >= 0; i--) {
      const s = p.raccolte[i]
      if (!vistoDa.has(s)) vistoDa.set(s, p.t)
      if (p.t - vistoDa.get(s) >= G.reazione) p.raccogli(i)
    }
    pensa += 0.25
    if (pensa >= G.decide) { pensa = 0; scegli(p, G) }
  }
  return { vinto: p.fine === 'vinto', carretti: p.usati, t: p.t, soli: p.soli, piante: p.piante.length }
}

const quante = (p, id, c) => p.piante.filter(x => x.id === id && (c == null || x.c === c)).length
const minaccia = (p, c) => Math.max(0, ...p.zombi.filter(z => z.c === c).map(z => z.y))

function scegli(p, G) {
  const sfida = p.sfida
  const ha = id => sfida.piante.includes(id)
  const girasoli = quante(p, 'girasole')
  const corsie = [...p.corsie].sort((a, b) => minaccia(p, b) - minaccia(p, a))
  const riga = (c, da) => { for (let r = da; r >= CAMPO.rigaMin; r--) if (p.libera(c, r)) return r; return -1 }
  const metti = (id, c, da) => { const r = riga(c, da); return r >= 0 && p.pianta(id, c, r) }

  // prima i soli: uno o poco più per corsia
  if (girasoli < Math.ceil(p.corsie.length * G.girasoli) && p.puoComprare('girasole')) {
    const c = p.corsie[girasoli % p.corsie.length]
    if (metti('girasole', c, CAMPO.righe - 1)) return
  }
  // poi la difesa, dove la minaccia è più avanti
  for (const c of corsie) {
    if (quante(p, 'tiratore', c) + quante(p, 'doppio', c) === 0) {
      if (ha('doppio') && p.puoComprare('doppio') && metti('doppio', c, CAMPO.righe - 2)) return
      if (p.puoComprare('tiratore') && metti('tiratore', c, CAMPO.righe - 2)) return
    }
  }
  for (const c of corsie) {
    if (minaccia(p, c) > 0 && ha('gelo') && quante(p, 'gelo', c) === 0 && p.puoComprare('gelo') && metti('gelo', c, CAMPO.righe - 3)) return
    if (minaccia(p, c) > 100 && ha('noce') && quante(p, 'noce', c) === 0 && p.puoComprare('noce') && metti('noce', c, CAMPO.rigaMin + 2)) return
  }
  // il resto: più girasoli, poi più tiratori
  if (p.puoComprare('girasole') && girasoli < 8 && metti('girasole', p.corsie[girasoli % p.corsie.length], CAMPO.righe - 1)) return
  for (const c of corsie) {
    const id = ha('doppio') ? 'doppio' : 'tiratore'
    if (quante(p, id, c) < 2 && p.puoComprare(id) && metti(id, c, CAMPO.righe - 3)) return
  }
}
