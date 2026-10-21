// La telecamera: segue l'eroe da sopra, a distanza scelta (e zoomabile con due dita); un dito che scorre la stacca dall'eroe
// («libera») finché non lo si manda da qualche parte. Non sa le regole: riceve cosa inquadrare.
import * as THREE from 'three'

const LONTANO = 30          // fin dove la camera trascinata si allontana dall'eroe (celle)

export class Camera {
  constructor(sole) {
    this.cam = new THREE.PerspectiveCamera(50, 1, 0.5, 160)
    this.sole = sole
    this.x = 0; this.z = 0; this.d = 22; this.p = 55
    this.libera = { on: false, x: 0, z: 0 }       // la camera trascinata col dito
    this.zoom = 1
    this.larghezza = 1; this.altezza = 1
  }

  adatta(larghezza, altezza) {
    this.larghezza = larghezza; this.altezza = altezza
    this.cam.aspect = larghezza / altezza
    this.cam.updateProjectionMatrix()
  }

  segui() { this.libera.on = false }
  /** Sposta la camera libera di quanto il dito ha mosso un punto del suolo (da `p0` a `p1`), senza ritardo. */
  trascina(p0, p1) {
    const L = this.libera
    if (!L.on) { L.on = true; L.x = this.x; L.z = this.z }
    L.x -= p1.x - p0.x; L.z -= p1.z - p0.z
    this.x = L.x; this.z = L.z
  }

  /** Scorre la camera di (`dx`, `dz`) celle (il dito contro il bordo con un pezzo in mano), senza ritardo e non oltre `LONTANO` dall'eroe. */
  scorri(dx, dz) {
    const L = this.libera, e = this.eroe || { x: this.x, z: this.z }
    if (!L.on) { L.on = true; L.x = this.x; L.z = this.z }
    L.x = Math.max(e.x - LONTANO, Math.min(e.x + LONTANO, L.x + dx)); L.z = Math.max(e.z - LONTANO, Math.min(e.z + LONTANO, L.z + dz))
    this.x = L.x; this.z = L.z
  }

  /** `eroe`: { x, z, vel }; `distanza`: la base (dalle opzioni). */
  muovi(dt, { eroe, distanza }) {
    this.eroe = eroe
    let tx = eroe.x, tz = eroe.z, td = distanza * this.zoom, tp = 55
    if (this.libera.on) { tx = this.libera.x; tz = this.libera.z }
    if (this.libera.on) { tx = Math.max(eroe.x - LONTANO, Math.min(eroe.x + LONTANO, tx)); tz = Math.max(eroe.z - LONTANO, Math.min(eroe.z + LONTANO, tz)) }   // niente confini, ma la vista libera non si perde nel vuoto
    const k = 1 - Math.exp(-(eroe.vel > 7 && !this.libera.on ? 9 : 5) * dt)
    this.x += (tx - this.x) * k; this.z += (tz - this.z) * k; this.d += (td - this.d) * k; this.p += (tp - this.p) * k
    const p = this.p * Math.PI / 180
    this.cam.position.set(this.x, this.d * Math.sin(p), this.z + this.d * Math.cos(p)); this.cam.lookAt(this.x, 0.3, this.z)
    this.sole.position.set(this.x - 8, 17, this.z + 6); this.sole.target.position.set(this.x, 0, this.z)
    const ombra = Math.max(12, Math.min(26, this.d * 0.9))
    Object.assign(this.sole.shadow.camera, { left: -ombra, right: ombra, top: ombra, bottom: -ombra }); this.sole.shadow.camera.updateProjectionMatrix()
  }
}
