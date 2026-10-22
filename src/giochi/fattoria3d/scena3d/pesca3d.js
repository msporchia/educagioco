// La lenza in scena: il galleggiante sull'acqua (uno per banco con la lenza in acqua), il filo che lo lega alla canna del contadino, e il
// cartello che dice a colpo d'occhio come sta la pesca, in tre stadi come le bestie: acqua calma (niente) → il galleggiante dondola piano
// (in attesa) → il galleggiante si immerge, gli anelli si allargano e compare «🐟» (abbocca!: tocca per ritirare). Se il contadino è ancora
// lì a pescare e il pesce abbocca, ritira da sé. Non sa le regole: legge `motore.lenze()`. Vedi docs/fattoria3d/geografia-e-pesca.md.
import * as THREE from 'three'

const GEO_CIMA = new THREE.SphereGeometry(0.085, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2)
const GEO_BASE = new THREE.SphereGeometry(0.085, 8, 5, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2)
const GEO_ASTA = new THREE.CylinderGeometry(0.012, 0.012, 0.16, 4).translate(0, 0.16, 0)
const GEO_ANELLO = new THREE.RingGeometry(0.16, 0.2, 22).rotateX(-Math.PI / 2)
const M_ROSSO = new THREE.MeshStandardMaterial({ color: 0xe8392b, roughness: 0.6 })
const M_BIANCO = new THREE.MeshStandardMaterial({ color: 0xfaf6ec, roughness: 0.6 })
const M_ANELLO = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6, depthWrite: false, side: THREE.DoubleSide })
const Y_ACQUA = 0.05

/** Il galleggiante (rosso e bianco, con l'anello sull'acqua): uno per banco con la lenza in acqua. Esportato per il catalogo 3D. */
export function galleggiante () {
  const g = new THREE.Group(), boa = new THREE.Group()
  const cima = new THREE.Mesh(GEO_CIMA, M_ROSSO), base = new THREE.Mesh(GEO_BASE, M_BIANCO), asta = new THREE.Mesh(GEO_ASTA, M_BIANCO)
  boa.add(cima, base, asta); boa.scale.setScalar(1.4)
  const anello = new THREE.Mesh(GEO_ANELLO, M_ANELLO.clone()); anello.position.y = 0.005
  g.add(boa, anello); g.userData = { boa, anello }
  return g
}

export class Pesca3d {
  /** `fx`: gli effetti (i cartelli, gli spruzzi); `vista.proietta` dice dove cade un punto sullo schermo. */
  constructor(scena, motore, eroe, fx, vista) {
    this.scena = scena; this.m = motore; this.eroe = eroe; this.fx = fx; this.vista = vista
    this.oggetti = new Map()                      // id del lotto → { g, badge, stato, x, z }
    this.lenze = []                               // la lista di `motore.lenze()`, rinfrescata un paio di volte al secondo
    this.tLista = -9
    this.sulAbbocca = null                        // chi ritira quando il pesce abbocca e il contadino è lì (lo mette il mondo)
    // il filo: tre punti (la punta della canna, un po' di pancia, il galleggiante); un solo oggetto, riusato
    const pt = new Float32Array(9)
    this.filoGeo = new THREE.BufferGeometry(); this.filoGeo.setAttribute('position', new THREE.BufferAttribute(pt, 3))
    this.filo = new THREE.Line(this.filoGeo, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 }))
    this.filo.frustumCulled = false; this.filo.visible = false; scena.add(this.filo)
    this._v = new THREE.Vector3()
  }

  /** Dove sta il galleggiante di un banco (Vector3 di scena) o null. */
  posizioneDi(lotto) { const o = this.oggetti.get(lotto); return o && o.g.visible ? o.g.position : null }

  aggiorna(dt, tt) {
    if (tt - this.tLista > 0.4) {
      this.tLista = tt; this.lenze = this.m.lenze()
      const vive = new Set()
      for (const e of this.lenze) {
        vive.add(e.lotto)
        let o = this.oggetti.get(e.lotto)
        if (!o) { o = { g: galleggiante(), badge: this.fx.nuovoBadge(), stato: '', x: 0, z: 0 }; this.scena.add(o.g); this.oggetti.set(e.lotto, o) }
        o.g.visible = true
        if (o.x !== e.i || o.z !== e.j) { o.x = e.i; o.z = e.j; o.g.position.set(e.i + 0.5, Y_ACQUA, e.j + 0.5); this.fx.scoppietta(o.g.position.clone().setY(0.1), 0xbfe6ff, 8, 1.1, 1.6) }
        o.stato = e.stato
      }
      for (const [id, o] of this.oggetti) if (!vive.has(id)) { o.g.visible = false; o.badge.imposta(''); o.stato = ''; o.x = 0; o.z = 0 }
      if (this.eroe.pescando && !vive.has(this.eroe.pescando.lotto)) this.eroe.pescando = null         // la lenza non c'è più (tolto il molo): la canna si abbassa
    }
    for (const o of this.oggetti.values()) {
      if (!o.g.visible) continue
      const { boa, anello } = o.g.userData
      if (o.stato === 'abbocca') {                                 // il galleggiante si immerge a scatti e gli anelli si allargano
        boa.position.y = -0.045 + Math.abs(Math.sin(tt * 9)) * 0.05; boa.rotation.z = Math.sin(tt * 13) * 0.2
        const k = (tt * 1.6) % 1; anello.scale.setScalar(0.8 + k * 3); anello.material.opacity = 0.85 * (1 - k)
        o.badge.imposta('🐟 Abbocca!', 'pronto')
      } else {                                                     // in attesa: dondola piano
        boa.position.y = Math.sin(tt * 2.4 + o.x) * 0.012; boa.rotation.z = Math.sin(tt * 1.7 + o.z) * 0.07
        const k = (tt * 0.35 + o.x * 0.1) % 1; anello.scale.setScalar(0.7 + k * 1.1); anello.material.opacity = 0.35 * (1 - k)
        o.badge.imposta('', '')
      }
      if (o.stato === 'abbocca') {
        const [x, y, visto] = this.vista.proietta(o.g.position, 0.9)
        o.badge.metti(x, y, visto)
      }
    }
    this._filo(tt)
    // il pesce abbocca e il contadino è ancora lì con la canna in mano: ritira da sé
    const e = this.eroe
    if (e.pescando && e.fermo && !e.dopo && this.sulAbbocca) {
      const o = this.oggetti.get(e.pescando.lotto)
      if (o && o.g.visible && o.stato === 'abbocca') this.sulAbbocca(e.pescando.lotto)
    }
  }

  /** Il filo dalla punta della canna al galleggiante del banco su cui il contadino sta pescando (finché ha la canna alzata). */
  _filo(tt) {
    const e = this.eroe, p = e.pescando, o = p && this.oggetti.get(p.lotto)
    if (!o || !o.g.visible || e.az && e.az.tipo !== 'pesca' && e.az.tipo !== 'ritira') { this.filo.visible = false; return }
    const a = this.filoGeo.attributes.position, punta = e.puntaCanna(this._v), g = o.g.position
    a.setXYZ(0, punta.x, punta.y, punta.z)
    a.setXYZ(1, (punta.x + g.x) / 2, Math.min(punta.y, g.y + 0.2) - 0.18 + Math.sin(tt * 2) * 0.01, (punta.z + g.z) / 2)
    a.setXYZ(2, g.x, g.y + o.g.userData.boa.position.y + 0.25, g.z)
    a.needsUpdate = true
    this.filo.visible = true
  }

  via() {
    for (const o of this.oggetti.values()) { this.scena.remove(o.g); o.badge.togli() }
    this.oggetti.clear(); this.scena.remove(this.filo); this.filoGeo.dispose()
  }
}
