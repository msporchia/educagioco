// Il banco dei campi: le piante di TUTTI i campi in scena stanno in una InstancedMesh per forma (≤17 draw call in tutto, prima 17 a campo).
// Ogni campo tiene le sue matrici (già nel mondo) e i suoi colori in array suoi (`userData.grano.parti[forma].mat/col`, `modelli-colture.js`);
// il banco li copia uno dopo l'altro nella mesh condivisa, dando a ogni campo la sua «fetta» (`da`, `n`). Ricopia solo quando un campo
// ha posato di nuovo (`segna()`), è apparso, sparito o si è nascosto. Una mesh che non basta si rifà più grande (capienza ×1,5).
// Come si agganciano le cose nuove: docs/fattoria3d/scena.md, «Come si aggiunge un pezzo istanziato».
import * as THREE from 'three'
import { formaDi } from './modelli-colture.js'
import { MARGINE_VISTA } from './statici-istanze.js'

const SFERA = new THREE.Sphere(), RAGGIO = 1.5 + 1.3      // mezza diagonale della terra + l'altezza della pianta più alta (il mais)

export class BancoCampi {
  constructor(scena) {
    this.scena = scena
    this.campi = new Map()          // gruppo → { visto }  (visto: era visibile l'ultima volta che si è ricopiato)
    this.mesh = {}                  // forma → InstancedMesh condivisa
    this.fette = {}                 // forma → [{ g, da, n }]: a chi appartengono le istanze (per il dito)
    this.ombra = {}                 // forma → proietta ombra? (lo decide `alleggeriOmbre` sul campo da solo, prima dell'adozione)
    this.sporco = false
  }

  /** Prende un campo appena creato (con le sue mesh): le toglie, e da qui le sue istanze vivono nel banco. */
  adotta(g) {
    const st = g.userData.grano
    for (const [nome, p] of Object.entries(st.parti)) {
      if (!p.mesh) continue
      this.ombra[nome] = this.ombra[nome] || p.mesh.castShadow
      g.remove(p.mesh); p.mesh.dispose(); p.mesh = null
    }
    st.banco = this; this.campi.set(g, { visto: g.visible }); this.sporco = true
  }
  lascia(g) {
    if (!this.campi.delete(g)) return
    const st = g.userData.grano; if (st) st.banco = null
    this.sporco = true
  }
  /** Il campo si disegna adesso (visibile e nell'inquadratura)? Uno che non si disegna non ha bisogno di riporre le piante. */
  visto(g) { const c = this.campi.get(g); return !c || c.visto }
  /** Un campo ha posato di nuovo le sue piante. */
  segna() { this.sporco = true }

  /** A fine fotogramma (dopo che i pezzi si sono aggiornati): ricopia se è cambiato qualcosa. Un campo fuori dall'inquadratura (`frustum`, con un
      margine) non si disegna e non proietta. */
  aggiorna(frustum = null) {
    for (const [g, c] of this.campi) {
      const visto = g.visible && (!frustum || frustum.intersectsSphere(SFERA.set(g.position, RAGGIO * g.scale.x + MARGINE_VISTA)))
      if (visto !== c.visto) { c.visto = visto; this.sporco = true }
    }
    if (!this.sporco) return
    this.sporco = false
    const nomi = new Set(Object.keys(this.mesh))
    for (const g of this.campi.keys()) for (const n of Object.keys(g.userData.grano.parti)) nomi.add(n)
    for (const nome of nomi) this._copia(nome)
  }

  _copia(nome) {
    let tot = 0
    for (const g of this.campi.keys()) if (this.campi.get(g).visto) { const p = g.userData.grano.parti[nome]; if (p) tot += Math.min(p.n, p.max) }
    let m = this.mesh[nome]
    if (tot && (!m || tot > m.instanceMatrix.count)) m = this._rifai(nome, Math.max(32, Math.ceil(tot * 1.5)))
    if (!m) return
    const fette = this.fette[nome] = []
    let k = 0
    if (tot) {
      const am = m.instanceMatrix.array, ac = m.instanceColor.array
      for (const g of this.campi.keys()) {
        if (!this.campi.get(g).visto) continue
        const p = g.userData.grano.parti[nome]; if (!p) continue
        const n = Math.min(p.n, p.max); if (!n) continue
        am.set(p.mat.subarray(0, n * 16), k * 16); ac.set(p.col.subarray(0, n * 3), k * 3)
        fette.push({ g, da: k, n }); k += n
      }
      for (const a of [m.instanceMatrix, m.instanceColor]) { a.clearUpdateRanges(); a.addUpdateRange(0, k * a.itemSize); a.needsUpdate = true }
    }
    m.count = k; m.visible = k > 0; m.castShadow = !!this.ombra[nome]
  }

  _rifai(nome, capienza) {
    const vecchia = this.mesh[nome]
    if (vecchia) { this.scena.remove(vecchia); vecchia.dispose() }
    const { geo, materiale } = formaDi(nome)
    const m = new THREE.InstancedMesh(geo, materiale, capienza)
    m.frustumCulled = false; m.setColorAt(0, new THREE.Color(0xffffff)); m.count = 0; m.visible = false; m.name = `campi:${nome}`
    m.castShadow = !!this.ombra[nome]; m.receiveShadow = false
    this.scena.add(m); this.mesh[nome] = m
    return m
  }

  /** Le mesh condivise vive (per il dito e per i conteggi). */
  meshes() { return Object.values(this.mesh) }
  /** Di che campo è l'istanza `id` di quella mesh? (il gruppo del campo, o null) */
  campoDi(mesh, id) {
    const nome = Object.keys(this.mesh).find(n => this.mesh[n] === mesh); if (!nome) return null
    const f = (this.fette[nome] || []).find(x => id >= x.da && id < x.da + x.n)
    return f ? f.g : null
  }
  via() {
    for (const g of [...this.campi.keys()]) this.lascia(g)
    for (const m of Object.values(this.mesh)) { this.scena.remove(m); m.dispose() }
    this.mesh = {}; this.fette = {}
  }
}
