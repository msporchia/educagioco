// Il fiato nel freddo di Natale: ogni tanto una nuvoletta bianca esce dalla bocca del contadino e dei compagni (cane e gatti), sale un
// poco, si allarga e svanisce. Un solo `Points` con pochi posti a giro: la nuvoletta si muove nel vertex shader (nata a, verso), il JS
// scrive solo il posto di quella nuova. Spento con le particelle (il preset basso). Vedi docs/fattoria3d/stagioni.md.
import * as THREE from 'three'
import { segna } from '../../../grafica/elementi3d.js'

const POSTI = 32
const VITA = 1.5                   // secondi di una nuvoletta
const OGNI = [1.8, 2.8]            // fra un respiro e l'altro (secondi, a caso fra i due)

const VERT = `
  uniform float uT, uPx;
  attribute float aNata;
  attribute vec2 aVerso;
  varying float vA;
  void main() {
    float eta = uT - aNata;
    float f = clamp(eta / ${VITA.toFixed(1)}, 0.0, 1.0);
    vec3 p = position + vec3(aVerso.x * f * 0.32, f * 0.22, aVerso.y * f * 0.32);
    vec4 mv = viewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    bool viva = eta > 0.0 && eta < ${VITA.toFixed(1)};
    gl_PointSize = viva ? uPx * (0.22 + f * 0.4) * 1100.0 / max(1.0, -mv.z) : 0.0;             // in metri: da 22 a 62 cm
    vA = viva ? smoothstep(0.0, 0.1, f) * (1.0 - f * f) * 0.85 : 0.0;
  }`
const FRAG = `
  varying float vA;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    gl_FragColor = vec4(0.96, 0.98, 1.0, vA * (1.0 - smoothstep(0.08, 0.5, d)));
  }`

/** Dove sta la bocca di chi respira, nel suo gruppo: alta come una parte della sua altezza, un po' avanti. Per tipo (`dati` di `chi()`). */
const BOCCA = { contadino: [0.8, 0.3], cane: [0.78, 0.45], gatto: [0.72, 0.3] }      // il contadino più avanti: sotto la tesa del cappello non si vedrebbe

export class Fiato {
  /** `chi()`: [{ grp, tipo: 'contadino' | 'cane' | 'gatto' }] adesso (si richiede a ogni fotogramma: il contadino si riveste, i compagni arrivano). */
  constructor(scena, chi) {
    this.scena = scena; this.chi = chi
    this.altezze = new WeakMap(); this.prossimo = new WeakMap(); this.k = 0; this.t = 0
    const g = new THREE.BufferGeometry()
    this.pos = new THREE.BufferAttribute(new Float32Array(POSTI * 3), 3)
    this.nata = new THREE.BufferAttribute(new Float32Array(POSTI).fill(-99), 1)
    this.verso = new THREE.BufferAttribute(new Float32Array(POSTI * 2), 2)
    g.setAttribute('position', this.pos); g.setAttribute('aNata', this.nata); g.setAttribute('aVerso', this.verso)
    const m = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false, uniforms: { uT: { value: 0 }, uPx: { value: 1 } } })
    this.punti = new THREE.Points(g, m); this.punti.frustumCulled = false; this.punti.renderOrder = 5
    scena.add(segna(this.punti, 'stagione'))
  }

  _alto(grp) {
    let h = this.altezze.get(grp)
    if (h === undefined) { const b = new THREE.Box3().setFromObject(grp); h = Math.max(0.2, b.max.y - grp.position.y); this.altezze.set(grp, h) }
    return h
  }

  /** Ogni fotogramma: chi è il suo momento butta fuori una nuvoletta. */
  aggiorna(tt, pxRatio = 1) {
    const u = this.punti.material.uniforms; u.uT.value = tt; u.uPx.value = pxRatio
    if (!this.punti.visible) return
    for (const { grp, tipo } of this.chi()) {
      if (!grp || !grp.visible) continue
      const quando = this.prossimo.get(grp)
      if (quando === undefined) { this.prossimo.set(grp, tt + OGNI[0] * Math.random()); continue }
      if (tt < quando) continue
      this.prossimo.set(grp, tt + OGNI[0] + (OGNI[1] - OGNI[0]) * Math.random())
      const [su, avanti] = BOCCA[tipo] || BOCCA.contadino, h = this._alto(grp), a = grp.rotation.y, vx = Math.sin(a), vz = Math.cos(a)
      const k = this.k; this.k = (k + 1) % POSTI
      this.pos.setXYZ(k, grp.position.x + vx * avanti * h, grp.position.y + su * h, grp.position.z + vz * avanti * h)
      this.verso.setXY(k, vx, vz); this.nata.setX(k, tt)
      this.pos.needsUpdate = this.verso.needsUpdate = this.nata.needsUpdate = true
    }
  }

  applica(q) { this.punti.visible = !!q.particelle }

  via() { this.scena.remove(this.punti); this.punti.geometry.dispose(); this.punti.material.dispose() }
}
