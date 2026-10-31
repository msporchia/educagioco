// La roba per terra nella discesa in 3D: il modello della cosa (roba3d.js), non lo sprite dipinto (docs/sotterraneo/anteprime-3d.md).
// Sempre la versione semplice (`appiattisci`): una chiamata per pezzo, niente aloni né fiamme (il chiarore per terra lo mette cose.js).
// Un modello per figura, fatto la prima volta che serve e copiato per ogni pezzo (geometria e materiale in comune). Una cosa senza
// modello (le armature, che sono vesti da indossare; i tre gioielli di base) torna null, e cose.js tiene lo sprite.
import { Box3, Group, Vector3 } from 'three'
import { creaPezzo, appiattisci } from './roba3d.js'
import { consumabile3dDi, pezzo3dDi } from './anteprime3d-pura.js'
import { haModelloPerTerra } from './per-terra-pura.js'

export const LATO_PER_TERRA = 0.6   // in celle: il lato più lungo del pezzo per terra
// quanto si piega all'indietro: la telecamera guarda dall'alto, e una spada in piedi da lassù è una riga sottile
const INCLINA = 0.95

/** `gruppo`: dove si aggiungono. A ogni fotogramma `inizia`, una `metti` per cosa vista, `chiudi` toglie le altre. */
export function creaRobaPerTerra(gruppo) {
  const stampi = new Map()   // figura → Group pronto da copiare, o null se non ha modello
  const presi = new Map()    // roba del piano → la sua copia in scena (o null)
  const usati = new Set()
  const box = new Box3(), dim = new Vector3(), centro = new Vector3()

  function stampoDi(k) {
    if (!haModelloPerTerra(k)) return null
    const u = consumabile3dDi(k), p = u || pezzo3dDi(k)
    const id = u ? `usa:${u.consumabile}` : `${p.figura || '-'}|${p.id || '-'}`
    if (stampi.has(id)) return stampi.get(id)
    let g = null
    try {
      g = creaPezzo(p, { alone: false, semplice: true })
      if (g && !g.userData.semplice) g = appiattisci(g)   // il ripiego della collezione non passa da `semplice`
    } catch (e) { g = null }
    let s = null
    if (g) {
      // coi piedi a terra e al centro della cella, lungo LATO_PER_TERRA dal lato più lungo, piegato verso chi guarda dall'alto
      g.updateMatrixWorld(true)
      box.setFromObject(g); box.getSize(dim); box.getCenter(centro)
      g.position.x -= centro.x; g.position.y -= box.min.y; g.position.z -= centro.z
      const piega = new Group()
      piega.add(g)
      piega.rotation.x = -INCLINA
      s = new Group()
      s.add(piega)
      s.scale.setScalar(LATO_PER_TERRA / Math.max(dim.x, dim.y, dim.z, 1e-3))
    }
    stampi.set(id, s)
    return s
  }

  return {
    inizia() { usati.clear() },
    /** La cosa `r` (chiave `k`) in (x, y, z), girata di `giro`; false se non ha modello (si disegna lo sprite). */
    metti(r, k, x, y, z, giro) {
      let g = presi.get(r)
      if (g === undefined) {
        const s = stampoDi(k)
        g = s ? s.clone() : null
        if (g) gruppo.add(g)
        presi.set(r, g)
      }
      if (!g) return false
      g.visible = true
      g.position.set(x, y, z)
      g.rotation.y = giro
      usati.add(r)
      return true
    },
    // chi non si è messo in questo fotogramma (preso, fuori dalla luce) si toglie: la copia costa poco, la geometria è dello stampo
    chiudi() {
      for (const [r, g] of presi) {
        if (usati.has(r)) continue
        if (g) gruppo.remove(g)
        presi.delete(r)
      }
    },
    /** Un piano nuovo: le copie del piano di prima si tolgono (gli stampi restano: sono le stesse figure). */
    svuota() { for (const g of presi.values()) if (g) gruppo.remove(g); presi.clear() },
    /** [[roba, gruppo]] di quelle in vista, per il dito (dito.js, `modellate`). */
    get modellati() { return [...presi].filter(([, g]) => g && g.visible) },
    get quante() { return usati.size },
    via() {
      this.svuota()
      for (const s of stampi.values()) if (s) s.traverse(o => { if (o.geometry) o.geometry.dispose() })
      stampi.clear()
    },
  }
}
