// Quale cosa sta sotto il dito, con un bersaglio generoso: prima le forme 3D colpite dal raggio (le figure istanziate, la fontana
// e il portale modellati: hanno la precedenza sul pavimento dietro), poi la cosa più vicina entro MARGINE_DITO px a schermo.
// Si prendono solo le cose che si possono usare: già viste (ci si va anche al buio), i mostri solo nella luce di adesso.
import { MARGINE_DITO } from './costanti.js'
import { DA_TOCCARE } from './cose.js'

export function usabile(corsa, r) {
  if (r.presa || r.morto || !DA_TOCCARE.includes(r.che)) return false
  const L = corsa.livello.largo
  if (r.che === 'mostro') return corsa.inLuce(Math.floor(r.fy ?? r.y + 0.5) * L + Math.floor(r.fx ?? r.x + 0.5))
  if (!corsa.visto[r.y * L + r.x]) return false
  if (r.che === 'porta') return !r.aperta
  if (r.che === 'forziere') return !r.aperto
  if (r.che === 'curiosita') return !r.visto
  return true
}

// `figure`: le figure istanziate (scena3d/figure.js), `modellate`: [[roba, gruppo three]] (fontana, portale)
export function scegli(corsa, camera, px, py, { figure, modellate = [] }) {
  const ray = camera.mira(px, py)
  const colpita = figure.trova(ray)
  if (colpita && usabile(corsa, colpita)) return colpita
  for (const [r, gruppo] of modellate) if (usabile(corsa, r) && ray.intersectObject(gruppo, true).length) return r
  let mig = null, dm = MARGINE_DITO
  const p = { x: 0, y: 0 }
  for (const r of corsa.livello.robe) {
    if (!usabile(corsa, r)) continue
    const x = r.fx ?? r.x + 0.5, z = r.fy ?? r.y + 0.5
    for (const y of [0.15, 0.5]) {
      camera.schermo(x, y, z, p)
      const d = Math.hypot(p.x - px, p.y - py)
      if (d < dm) { dm = d; mig = r }
    }
  }
  return mig
}
