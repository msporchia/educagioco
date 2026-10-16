// Lo scontro del motore messo in scena sul pavimento vero: quando il motore apre il foglio dello scontro i combattenti vanno ai
// loro posti (scena3d/palco.js) e i muri alti alle spalle si abbassano; la telecamera si avvicina e inquadra il palco; il dito
// sceglie il bersaglio toccando un mostro (un tocco durante il racconto lo accorcia, e per CIECA ms dopo un tocco non sceglie:
// il click fantasma, docs/core/il-dito.md). Qui anche gli anelli (il tocco, l'arrivo, il bersaglio), la bolla, il buco nei muri
// attorno all'eroe e gli agganci delle scritte di viste/Scontro3d.vue sopra le figure. Il palco resta finché il racconto finisce.
import { disponiPalco } from './palco.js'
import { MARGINE_DITO } from './costanti.js'

export function creaScontro({ S, cam, eroe, getPiano, getCose, getFigure, anelli, cieca }) {
  let palco = null, eraAttivo = false, liberoDa = 0, tTocco = 9, tArrivo = 9, mira = null
  const agganci = new Map()
  const punti = []
  const p = { x: 0, y: 0 }, q = { x: 0, y: 0 }

  function apri(corsa, sc) {
    if (palco) for (const s of palco.stati) s.meta = null
    const cose = getCose(), piano = getPiano()
    const stati = sc.campo.map(r => cose.stato(r))
    const d = disponiPalco(piano.pianta, piano.ingombri, { x: corsa.eroe.x, z: corsa.eroe.y }, stati.map((s, i) => ({ x: s.x, z: s.z, grande: !!sc.campo[i].grosso })))
    eroe.meta = d.eroe
    stati.forEach((s, i) => { s.meta = d.mostri[i]; s.specchio = d.mostri[i].x > d.eroe.x })
    piano.terreno.abbassa(d.abbassa)
    palco = { campo: [...sc.campo], foglio: sc, stati, agio: d.agio }
  }
  const posDi = chi => (chi === 'eroe' ? eroe.disegnato : palco && palco.stati[chi])

  return {
    get palco() { return palco },
    // a ogni fotogramma: il motore ha aperto (o chiuso) uno scontro? Il palco si chiude solo a racconto finito
    guarda(corsa, fx) {
      const sc = corsa.foglio && corsa.foglio.che === 'scontro' ? corsa.foglio : null
      if (sc && (!palco || palco.foglio !== sc || palco.campo.length !== sc.campo.length)) apri(corsa, sc)
      else if (!sc && palco && !(fx && fx.attivo)) this.chiudi()
      S.campo = palco ? palco.campo : null
      const attivo = !!(fx && fx.attivo)
      if (eraAttivo && !attivo) liberoDa = performance.now() + cieca
      eraAttivo = attivo
    },
    chiudi() {
      if (!palco) return
      for (const s of palco.stati) s.meta = null
      eroe.meta = null
      eroe.ritorno = true
      const piano = getPiano()
      if (piano) piano.terreno.abbassa(null)
      palco = null
      anelli.bersaglio.visible = false
    },
    // dove si accende la luce di scena (i combattenti), o null fuori dallo scontro
    punti() {
      if (!palco) return null
      punti.length = 0
      punti.push(eroe.meta || eroe)
      for (const s of palco.stati) punti.push(s.meta || s)
      return punti
    },
    bersaglio(corsa) { return palco && corsa.foglio && corsa.foglio.chi ? getCose().stato(corsa.foglio.chi) : null },
    // il centro del palco (chi è ancora in piedi), per la telecamera
    centro(v) {
      if (!palco) return false
      const e = eroe.meta || eroe
      let x = e.x, z = e.z, n = 1
      for (const s of palco.stati) { if (s.morente > 1.5) continue; const m = s.meta || s; x += m.x; z += m.z; n++ }
      v.set(x / n, 0, z / n)
      return true
    },
    tocca(pt, fx, { bersaglio, accorcia }) {
      if (fx && fx.attivo) { if (accorcia) accorcia(); return }
      if (performance.now() < liberoDa) return
      const r = getFigure().trova(cam.mira(pt.x, pt.y))
      let i = r ? palco.campo.indexOf(r) : -1
      if (i < 0) {
        let dm = MARGINE_DITO
        palco.stati.forEach((s, k) => {
          if (palco.campo[k].morto) return
          cam.schermo(s.x, (s.alto || 1) * 0.5, s.z, q)
          const d = Math.hypot(q.x - pt.x, q.y - pt.y)
          if (d < dm) { dm = d; i = k }
        })
      }
      if (i >= 0 && !palco.campo[i].morto && bersaglio) bersaglio(i)
    },
    segnaTocco(r, cella) {
      mira = r
      if (r) { const s = r.che === 'mostro' ? getCose().stato(r) : null; anelli.tocco.position.set(s ? s.x : r.x + 0.5, 0.04, s ? s.z : r.y + 0.5); tTocco = 0 }
      if (cella) { anelli.arrivo.position.set(cella.x + 0.5, 0.04, cella.y + 0.5); tArrivo = 0 }
    },
    aggancia(chi, el) { if (el) agganci.set(chi, el); else agganci.delete(chi) },
    // gli anelli, la bolla e le scritte agganciate, a ogni fotogramma
    segni(corsa, dt, inSospeso, t) {
      tTocco += dt; tArrivo += dt
      const a = anelli
      if (inSospeso && inSospeso === mira) {
        const s = inSospeso.che === 'mostro' ? getCose().stato(inSospeso) : null
        if (s) a.tocco.position.set(s.x, 0.04, s.z)
        a.tocco.material.opacity = 0.55 + 0.35 * Math.sin(t * 8)
      } else a.tocco.material.opacity = Math.max(0, 0.9 - tTocco * 1.8)
      a.tocco.scale.setScalar(1 + Math.max(0, 0.4 - tTocco) * 1.5)
      a.tocco.visible = a.tocco.material.opacity > 0.01
      a.arrivo.material.opacity = Math.max(0, 0.8 - tArrivo * 1.6)
      a.arrivo.visible = a.arrivo.material.opacity > 0.01
      const b = this.bersaglio(corsa)
      a.bersaglio.visible = !!(b && !(b.morente > 0))
      if (b) { a.bersaglio.position.set(b.x + (b.dx || 0), 0.03, b.z + (b.dz || 0) + 0.05); a.bersaglio.material.opacity = 0.6 + 0.3 * Math.sin(t * 6) }
      S.tBolla += dt
      const d = eroe.disegnato
      a.bolla.visible = S.tBolla < 0.9
      if (a.bolla.visible) { a.bolla.position.set(d.x, 0.75, d.z + 0.1); a.bolla.scale.setScalar(0.7 + Math.min(1, S.tBolla * 4) * 0.5); a.bolla.material.opacity = 0.32 * Math.sin(Math.min(1, S.tBolla / 0.9) * Math.PI) }
      for (const [chi, el] of agganci) {
        const s = posDi(chi)
        if (!s) continue
        const x = chi === 'eroe' ? s.x : s.x + (s.dx || 0), z = chi === 'eroe' ? s.z : s.z + (s.dz || 0)
        cam.schermo(x, (chi === 'eroe' ? eroe.alto : s.alto || 1) + 0.12, z, p)
        const rx = Math.round(p.x), ry = Math.round(p.y)
        if (el._x !== rx || el._y !== ry) { el._x = rx; el._y = ry; el.style.transform = `translate(${rx}px, ${ry}px)` }
      }
    },
    // il buco nei muri: attorno all'eroe, o attorno a tutto lo scontro (solo i pezzi a sud del più a nord di loro)
    buco(u, centro) {
      let bz = eroe.disegnato.z
      if (palco) for (const s of palco.stati) bz = Math.min(bz, s.z)
      cam.schermo(centro.x, 0.7, centro.z, p)
      cam.schermo(centro.x + (palco ? 2.8 : 1.5), 0.7, centro.z, q)
      u.uBucoUV.value.set(p.x / cam.L, 1 - p.y / cam.A)
      u.uBucoR.value = Math.abs(q.x - p.x) / cam.A
      u.uBucoZ.value = (palco ? bz - 0.5 : bz) + 0.15
    },
  }
}
