// Il banco dei pezzi fermi: aiuole, panchine, pozzi, ponti, passerelle, tavoli… Più copie dello stesso tipo condividono geometria e materiale
// (la cache dei modelli), quindi diventano una InstancedMesh per (geometria, materiale): dieci aiuole = una draw call, non dieci.
// Le mesh originali restano nel gruppo, **invisibili**: servono al dito (`intersectObjects` non guarda `visible`), al centro e al nome dei gruppi
// che i test cercano; ciò che si vede è il banco. Il gruppo continua a comandare: posizione, giro, scala (il rimbalzo di quando nasce, il saltello)
// e `visible` (un pezzo sollevato) si leggono a ogni fotogramma e il banco ricopia solo se sono cambiati.
// Adotta solo ciò che è fermo: niente `userData.anima`, niente trasparenti, niente istanze o materiali a lista.
// Come si aggiunge un pezzo: docs/fattoria3d/scena.md, «Come si aggiunge un pezzo istanziato».
import * as THREE from 'three'
import { PEZZI } from '../dati/catalogo.js'
import { segna } from '../../../grafica/elementi3d.js'

/** I tipi che si adottano: pezzi fermi, uguali a ogni copia (si aggiunge un tipo qui e basta: i controlli sono in `adotta`). I fiori e l'arredo (W8, W12) si
    ripetono più di ogni altra decorazione: ogni copia di uno stesso id è una draw call sola. Quelli che si muovono (il mulinello) non entrano: `adotta` li rifiuta da sé. */
export const STATICI = new Set(['aiuola', 'panchina', 'pozzo', 'bancarella', 'ponte', 'passerella', 'tavolo', 'molo', 'molo_v', 'trattore', 'zucca_intagliata', 'zucche_mucchio', 'pupazzo_neve', 'bastoni_zucchero', 'bastoni_zucchero_fila', 'pacchi_regalo',
  ...Object.entries(PEZZI).filter(([, p]) => p.decoro && (p.categoria === 'fiori' || p.categoria === 'arredo')).map(([id]) => id)])

const REL = new THREE.Matrix4(), W = new THREE.Matrix4(), SFERA = new THREE.Sphere(), SC = new THREE.Vector3()
export const MARGINE_VISTA = 3         // quanto fuori dall'inquadratura si tiene un pezzo: la sua ombra (≤ 3 unità) può cadere dentro

export class BancoStatici {
  constructor(scena) {
    this.scena = scena
    this.voci = new Map()         // gruppo → { parti: [{ chiave, rel }], t: [x, y, z, rotY, scala], mondo: Matrix4, visto }
    this.gruppi = new Map()       // chiave → { mesh, geo, materiale, cast, recv }
    this.sporco = false
  }

  /** Prende un gruppo già messo al suo posto. Torna false (e non tocca niente) se non è fermo come serve. */
  adotta(g) {
    if (g.userData.anima) return false
    const parti = []
    let valido = true
    g.traverse(o => {
      if (o === g || !valido) return
      if (o.isMesh) {
        if (o.isInstancedMesh || o.isSkinnedMesh || Array.isArray(o.material) || o.material.transparent || !o.geometry) valido = false
        else parti.push(o)
      } else if (o.isPoints || o.isLine || o.isSprite || o.isLight) valido = false
    })
    if (!valido || !parti.length) return false
    g.updateMatrixWorld(true)
    const voce = { parti: [], t: [NaN, 0, 0, 0, 0], mondo: new THREE.Matrix4(), visto: g.visible, scatola: new THREE.Box3(), centro: new THREE.Vector3(), raggio: 0 }
    for (const o of parti) {
      if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere()
      REL.identity()
      for (let n = o; n && n !== g; n = n.parent) { n.updateMatrix(); REL.premultiply(n.matrix) }
      const chiave = `${o.geometry.uuid}|${o.material.uuid}|${o.castShadow ? 1 : 0}${o.receiveShadow ? 1 : 0}`
      if (!this.gruppi.has(chiave)) this.gruppi.set(chiave, { mesh: null, geo: o.geometry, materiale: o.material, cast: o.castShadow, recv: o.receiveShadow, senzaNeve: !!g.userData.senzaNeve })
      voce.parti.push({ chiave, rel: REL.clone() })
      SFERA.copy(o.geometry.boundingSphere).applyMatrix4(REL)
      voce.scatola.expandByPoint(SC.copy(SFERA.center).addScalar(SFERA.radius)).expandByPoint(SC.copy(SFERA.center).addScalar(-SFERA.radius))
      o.visible = false
    }
    voce.scatola.getBoundingSphere(SFERA); voce.centro.copy(SFERA.center); voce.raggio = SFERA.radius        // nel riferimento del gruppo
    this.voci.set(g, voce); this.sporco = true
    return true
  }
  lascia(g) { if (this.voci.delete(g)) this.sporco = true }

  /** A fine fotogramma: se un gruppo si è mosso, girato, ingrandito, nascosto o è entrato/uscito dall'inquadratura (`frustum`, con un margine),
      ricopia le matrici. Fuori dall'inquadratura non si disegna e non proietta (le mesh sciolte lo facevano da sole; un'istanza no). */
  aggiorna(frustum = null) {
    for (const [g, v] of this.voci) {
      const t = v.t, p = g.position
      let mosso = false
      if (p.x !== t[0] || p.y !== t[1] || p.z !== t[2] || g.rotation.y !== t[3] || g.scale.x !== t[4]) {
        v.t = [p.x, p.y, p.z, g.rotation.y, g.scale.x]; g.updateMatrixWorld(); v.mondo.copy(g.matrixWorld); mosso = true
        SFERA.center.copy(v.centro).applyMatrix4(v.mondo); v.cw = (v.cw || new THREE.Vector3()).copy(SFERA.center); v.rw = v.raggio * g.scale.x
      }
      const dentro = !frustum || (v.cw ? frustum.intersectsSphere(SFERA.set(v.cw, v.rw + MARGINE_VISTA)) : true)
      const visto = g.visible && dentro
      if (mosso || visto !== v.visto) { v.visto = visto; this.sporco = true }
    }
    if (!this.sporco) return
    this.sporco = false
    for (const [chiave, gr] of this.gruppi) this._copia(chiave, gr)
  }

  _copia(chiave, gr) {
    let tot = 0
    for (const [, v] of this.voci) if (v.visto) for (const p of v.parti) if (p.chiave === chiave) tot++
    if (tot && (!gr.mesh || tot > gr.mesh.instanceMatrix.count)) this._rifai(gr, Math.max(8, Math.ceil(tot * 1.5)))
    const m = gr.mesh; if (!m) return
    let k = 0
    if (tot) {
      const arr = m.instanceMatrix.array
      for (const [, v] of this.voci) {
        if (!v.visto) continue
        for (const p of v.parti) if (p.chiave === chiave) { W.multiplyMatrices(v.mondo, p.rel).toArray(arr, k * 16); k++ }
      }
      const a = m.instanceMatrix; a.clearUpdateRanges(); a.addUpdateRange(0, k * 16); a.needsUpdate = true
    }
    m.count = k; m.visible = k > 0
  }

  _rifai(gr, capienza) {
    if (gr.mesh) { this.scena.remove(gr.mesh); gr.mesh.dispose() }
    const m = new THREE.InstancedMesh(gr.geo, gr.materiale, capienza)
    m.frustumCulled = false; m.count = 0; m.visible = false; m.castShadow = gr.cast; m.receiveShadow = gr.recv; m.name = 'statici'; segna(m, 'pezzi'); if (gr.senzaNeve) m.userData.senzaNeve = true
    this.scena.add(m); gr.mesh = m
  }

  /** Quante istanze (mesh) il banco disegna adesso, per i conteggi. */
  meshes() { return [...this.gruppi.values()].map(g => g.mesh).filter(Boolean) }
  via() {
    this.voci.clear()
    for (const gr of this.gruppi.values()) if (gr.mesh) { this.scena.remove(gr.mesh); gr.mesh.dispose(); gr.mesh = null }
    this.gruppi.clear()
  }
}
