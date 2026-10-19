// La telecamera: segue l'eroe da sopra, a distanza scelta (e zoomabile con due dita); un dito che scorre la stacca dall'eroe
// («libera») finché non lo si manda da qualche parte; in costruzione inquadra attorno all'eroe o tutto il terreno, e si sposta
// con due dita. Non sa le regole: riceve cosa inquadrare.
import * as THREE from 'three'

export class Camera {
  constructor(sole) {
    this.cam = new THREE.PerspectiveCamera(50, 1, 0.5, 160)
    this.sole = sole
    this.x = 0; this.z = 0; this.d = 22; this.p = 55; this.off = 0; this.offApplicato = 0
    this.libera = { on: false, x: 0, z: 0 }       // la camera trascinata col dito
    this.zoom = 1
    this.larghezza = 1; this.altezza = 1
  }

  adatta(larghezza, altezza) {
    this.larghezza = larghezza; this.altezza = altezza
    this.cam.aspect = larghezza / altezza
    if (this.offApplicato) this.cam.setViewOffset(larghezza, altezza, 0, altezza * this.offApplicato, larghezza, altezza)
    this.cam.updateProjectionMatrix()
  }

  segui() { this.libera.on = false }
  /** Sposta la camera libera di quanto il dito ha mosso un punto del suolo (da `p0` a `p1`), senza ritardo. */
  trascina(p0, p1) {
    const L = this.libera
    if (!L.on) { L.on = true; L.x = this.x; L.z = this.z }
    L.x = Math.max(-13, Math.min(13, L.x - (p1.x - p0.x))); L.z = Math.max(-11, Math.min(11, L.z - (p1.z - p0.z)))
    this.x = L.x; this.z = L.z
  }

  /**
   * `eroe`: { x, z, vel }; `costruzione`: null o { vista, pan, rettangolo: {i, j, w, d}, conVassoio };
   * `distanza`: la base (dalle opzioni).
   */
  muovi(dt, { eroe, costruzione, distanza }) {
    let tx = eroe.x, tz = eroe.z, td = distanza * this.zoom, tp = 55
    if (costruzione) {
      const q = costruzione.rettangolo, t = Math.tan(this.cam.fov * Math.PI / 360)
      tx = q.i + q.w / 2 + costruzione.pan.x; tz = q.j + q.d / 2 + 0.5 + costruzione.pan.z
      tp = 66
      td = Math.max((q.w + 2) / (2 * t * this.cam.aspect), (q.d + 4) * Math.sin(tp * Math.PI / 180) / (2 * t), 11) * this.zoom
    } else {
      if (this.libera.on) { tx = this.libera.x; tz = this.libera.z }
      tx = Math.max(-13, Math.min(13, tx)); tz = Math.max(-11, Math.min(11, tz))
    }
    const k = 1 - Math.exp(-(eroe.vel > 7 && !this.libera.on ? 9 : 5) * dt)
    const off = costruzione ? 0.12 : 0
    this.off += (off - this.off) * k
    if (Math.abs(this.off - this.offApplicato) > 0.002) {
      this.offApplicato = this.off
      this.cam.setViewOffset(this.larghezza, this.altezza, 0, this.altezza * this.off, this.larghezza, this.altezza)
      this.cam.updateProjectionMatrix()
    }
    this.x += (tx - this.x) * k; this.z += (tz - this.z) * k; this.d += (td - this.d) * k; this.p += (tp - this.p) * k
    const p = this.p * Math.PI / 180
    this.cam.position.set(this.x, this.d * Math.sin(p), this.z + this.d * Math.cos(p)); this.cam.lookAt(this.x, 0.3, this.z)
    this.sole.position.set(this.x - 8, 17, this.z + 6); this.sole.target.position.set(this.x, 0, this.z)
    const ombra = Math.max(12, Math.min(26, this.d * 0.9))
    Object.assign(this.sole.shadow.camera, { left: -ombra, right: ombra, top: ombra, bottom: -ombra }); this.sole.shadow.camera.updateProjectionMatrix()
  }
}
