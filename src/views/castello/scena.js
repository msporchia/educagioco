// Dal motore alla scena: entra un motore, esce una lista di cose da
// disegnare (niente Vue, niente eventi, nessuno stato). Lo strato dice il
// piano (-1 per terra, 0 in piedi, 1 in volo); le piazzole si accendono
// solo quando toccarle serve a qualcosa (c'è l'energia per una torre nuova).
import { costoSalita } from '../../data/castello.js'
import { RESPINTO } from '../../motore/castello/nemico.js'

// Da che parte guarda chi cammina (1 destra, -1 sinistra, 0 dritto): si
// guarda un po' avanti e non solo il passo dopo, o su una strada a squadra
// si girerebbe a ogni angolo.
function versoDi(via, d, p) {
  for (let s = 10; s <= 60; s += 10) {
    const dx = via.puntoA(d + s).x - p.x
    if (Math.abs(dx) > 1) return Math.sign(dx)
  }
  return 0
}

export function scenaDi(motore, { S, trascino = null, tetto = 10, energia = 0,
                                  occupato = false, costoNuova = Infinity, mira = null }) {
  const roba = []
  if (!motore) return roba

  const inMano = trascino && trascino.mosso ? trascino.torre : null
  const mirata = mira && mira.piazzola != null ? mira.piazzola : -1
  const posso = (energia >= costoNuova && !occupato) || !!(mira && mira.muovendo)

  const sciolta = inMano || (mira && mira.muovendo ? mira.torre : null)
  motore.postazioni.forEach((p, i) => {
    if (!motore.libera(i, sciolta)) return
    const scelta = inMano ? trascino.posto === i : i === mirata
    // spenta: c'è la piazzola sul fondale, ma niente che inviti a toccarla
    if (!scelta && !posso && !inMano) return
    roba.push({ che: 'piazzola', strato: -1, x: p.x, y: p.y, scelta, viva: !inMano && !scelta })
  })

  const anteprima = mira && mira.raggio
    ? { x: mira.x, y: mira.y, r: mira.raggio, tipo: mira.tipo }
    : inMano ? { x: inMano.x, y: inMano.y, r: inMano.raggio(S), tipo: inMano.tipo } : null
  if (anteprima) roba.push({ che: 'raggio', strato: -1, ...anteprima })

  if (motore.percorso.quanteVie > 1) {
    const bocca = motore.bocca
    motore.percorso.vie.forEach((v, k) => {
      const q = v.puntoA(0)
      roba.push({ che: 'ingresso', strato: -1, x: q.x, y: q.y - 16 * S,
                  acceso: bocca === k || bocca < 0 })
    })
  }

  for (const s of motore.schizzi)
    roba.push({ che: 'schizzo', strato: -1, x: s.x, y: s.y, r: s.r,
                vita: s.vita, tipo: s.tipo, gelo: s.gelo, dividi: s.dividi })

  for (const t of motore.torri)
    roba.push({ che: 'torre', x: t.x, y: t.y, tipo: t.tipo, lv: t.lv, ramo: t.ramo,
                potenziabile: t.lv < tetto && !occupato,
                posso: energia >= costoSalita(t.lv, t.tipo),
                alone: !!(mira && mira.torre === t) })

  for (const n of motore.nemici) {
    const via = motore.viaDi(n)
    const p = via.puntoA(n.d)
    roba.push({ che: 'mostro', x: p.x, y: p.y, bestia: n.bestia, vola: n.vola,
                vita: n.quota, gelo: n.gelo, verso: versoDi(via, n.d, p),
                taglia: n.taglia, capo: n.capo, aTerra: n.aTerra > 0,
                respinto: n.respinto / RESPINTO })
  }

  for (const c of motore.colpi)
    roba.push({ che: 'colpo', strato: 1, x: c.x, y: c.y, tx: c.tx, ty: c.ty, t: c.t, tipo: c.tipo })
  return roba
}
