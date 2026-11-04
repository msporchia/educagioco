// Il bagno nella tinozza: l'animale ci salta dentro, la camera si avvicina, il dito strofina e lo sporco se ne va sotto gli occhi; alla fine si paga, esce e si
// scrolla. Se si lascia a metà non si paga niente. Non sa le regole: le chiede a `Cura`. Vedi docs/fattoria3d/cura-sul-prato.md.
import * as THREE from 'three'
import { sporcoDi } from '../dati/bestie.js'
import { ZOOM_MIN } from '../dati/mondo.js'
import { impostaSporco } from './sporco.js'
import { schiumaTinozza } from './modelli-cura.js'

export const STROFINATA = 1300                      // i pixel di dito che ci vogliono per un bagno intero
const PASSO_FUMATA = 90, ZOOM_BAGNO = 0.42

export class Bagno {
  constructor (mondo) { this.w = mondo; this.c = null }
  get attivo () { return !!this.c }

  /** Comincia, se la tinozza c'è e l'animale ci può arrivare. `gesto`: come si pagherà, alla fine. */
  inizia (id, gesto) {
    const w = this.w, t = w.m.cura.tinozza()
    if (!t || this.c) return false
    const d = w.m.misureCosa(t), x = t.i + d.w / 2, z = t.j + d.d / 2
    const amico = w.compagni.alBagno(id, { id: t.id, tipo: t.tipo, i: t.i, j: t.j, x, z })
    if (!amico) return false
    const cam = w.camera
    this.c = { id, gesto, amico, t, fatto: 0, resto: 0, sporco0: sporcoDi(w.m.cura.stato(id).pelo), prima: { zoom: cam.zoom, libera: { ...cam.libera } } }
    cam.libera.on = true; cam.libera.x = x; cam.libera.z = z; cam.zoom = Math.max(ZOOM_MIN, ZOOM_BAGNO)
    w.ui.bagno?.({ id, fatto: 0 })
    return true
  }
  _tinozza () { const v = this.w.pezzi.voce(this.c.t.id); return v && v.grp }

  /** Il dito ha strofinato di `px` pixel: conta solo quando l'animale è dentro. */
  strofina (px) {
    const c = this.c, w = this.w
    if (!c || !c.amico.inBagno || !c.amico.inBagno.dentro) return
    c.fatto = Math.min(1, c.fatto + px / STROFINATA); c.resto += px
    impostaSporco(c.amico.grp, c.sporco0 * (1 - c.fatto))
    const g = this._tinozza(); if (g) schiumaTinozza(g, Math.min(1, c.fatto * 1.6))
    if (c.resto > PASSO_FUMATA) { c.resto = 0; w.fx.fumata(new THREE.Vector3(c.amico.x + (Math.random() - 0.5) * 0.7, 0.8, c.amico.z + (Math.random() - 0.5) * 0.7)) }
    w.ui.bagno?.({ id: c.id, fatto: c.fatto })
    if (c.fatto >= 1) this._fine()
  }
  _fine () {
    const c = this.c, w = this.w, r = w.m.cura.lava(c.id, c.gesto)
    this._chiudi()
    w.compagni.esceDalBagno(c.id, true)
    if (r.ok) { if (r.premio) w.fx.volo(`+${r.premio.xp} ⭐`, c.amico.grp.position, 1.6); w.ui.cambio() } else w.ui.avviso?.('Il bagno non è riuscito: riprova')
  }
  /** Lasciato a metà: l'animale esce com'era e non si paga. */
  annulla () {
    const c = this.c; if (!c) return
    this._chiudi()
    impostaSporco(c.amico.grp, c.sporco0)
    this.w.compagni.esceDalBagno(c.id, false)
  }
  _chiudi () {
    const c = this.c, cam = this.w.camera, g = this._tinozza()
    if (g) schiumaTinozza(g, 0)
    cam.zoom = c.prima.zoom; Object.assign(cam.libera, c.prima.libera)
    this.c = null
    this.w.ui.bagno?.(null)
  }
}
