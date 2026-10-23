// Chiudere un renderer davvero (docs/sotterraneo/prestazioni-3d-perdite.md). three, caricando una geometria, un materiale o una trama,
// le appende un ascoltatore di `dispose` che tiene il renderer, e `renderer.dispose()` non lo toglie: le cose che i moduli tengono in
// cache per tutta la pagina (le parti dell'eroe, le trame delle aure, i materiali delle persone…) tenevano vivi tutti i renderer chiusi,
// coi loro contesti WebGL. Qui ogni renderer `seguito` annota gli ascoltatori che appende mentre lavora, e `rilascia` li toglie, butta
// il renderer e perde il contesto (la memoria della GPU torna subito, senza aspettare il GC).
import { EventDispatcher } from 'three'

let attivo = null                 // il registro del renderer che sta lavorando adesso
const diChi = new WeakMap()       // ascoltatore → registro del renderer che l'ha appeso
const P = EventDispatcher.prototype
const aggiungi = P.addEventListener, togli = P.removeEventListener
P.addEventListener = function (tipo, fn) {
  if (tipo === 'dispose' && attivo && !(this._listeners && this._listeners.dispose && this._listeners.dispose.includes(fn))) {
    let rif = attivo.rif.get(this)
    if (!rif) { rif = new WeakRef(this); attivo.rif.set(this, rif) }
    attivo.cose.add(rif)
    diChi.set(fn, attivo)
    // chi muore senza `dispose` (i materiali degli effetti, tenuti apposta: effetti3d/gestore.js) lascia un WeakRef vuoto: ogni tanto si spazza
    if (++attivo.nuovi > 1024) { attivo.nuovi = 0; for (const r of attivo.cose) if (!r.deref()) attivo.cose.delete(r) }
  }
  return aggiungi.call(this, tipo, fn)
}
P.removeEventListener = function (tipo, fn) {
  if (tipo === 'dispose') { const r = diChi.get(fn), rif = r && r.rif.get(this); if (rif) r.cose.delete(rif) }
  return togli.call(this, tipo, fn)
}

/** Da chiamare appena creato il renderer: i suoi metodi annotano gli ascoltatori che three appende mentre girano. */
export function segui(renderer) {
  const reg = { rif: new WeakMap(), cose: new Set(), nuovi: 0 }
  for (const k of Object.keys(renderer)) {
    const f = renderer[k]
    if (typeof f !== 'function') continue
    renderer[k] = function (...a) {
      const prima = attivo
      attivo = reg
      try { return f.apply(this, a) } finally { attivo = prima }
    }
  }
  renderer.__rilascio = reg
  return renderer
}

/** Toglie gli ascoltatori appesi dal renderer alle cose che restano vive, lo butta e ne perde il contesto. */
export function rilascia(renderer) {
  if (!renderer) return
  const reg = renderer.__rilascio
  if (reg) {
    for (const rif of reg.cose) {
      const o = rif.deref(), l = o && o._listeners && o._listeners.dispose
      if (!l) continue
      for (let i = l.length - 1; i >= 0; i--) if (diChi.get(l[i]) === reg) l.splice(i, 1)
    }
    reg.cose.clear()
  }
  try { renderer.dispose() } catch (e) { /* già andato */ }
  try { if (!renderer.getContext().isContextLost()) renderer.forceContextLoss() } catch (e) { /* già perso */ }
}
