// I pesciolini che nuotano sotto il pelo dell'acqua e ogni tanto saltano: UNA sola InstancedMesh per tutta la scena (tetto `MAX_PESCI`),
// mossa tutta nello shader col tempo dell'acqua (`uTPesci`): niente matrici da aggiornare a ogni fotogramma e niente allocazioni. Ogni pesce
// ha un centro (una cella d'acqua), un raggio, una velocità, una fase e (uno su quattro) un salto ogni tanto; si ricalcolano solo quando
// cambia la finestra o uno stagno. Stanno nei laghi del terreno, nel mare, nei laghetti e negli stagni che il bambino costruisce. Si
// spengono con l'opzione dei ciuffi (`q.erba`) e col degrado adattivo (`mondo.livello`). Vedi docs/fattoria3d/geografia-e-pesca.md.
import * as THREE from 'three'
import { mescola } from '../dati/semi.js'
import { PEZZI } from '../dati/catalogo.js'

export const MAX_PESCI = 220
export const uTPesci = { value: 0 }
const Y_PELO = 0.045                          // appena sopra la lastra d'acqua (0,03): il pesce si vede attraverso il suo velo
const OGNI = 0.1                              // un pesce ogni dieci celle d'acqua circa

/** La sagoma di un pesce (naso verso +x, in piano x-z): corpo a goccia e coda a V, lungo ~0,55 celle. */
function sagoma () {
  const s = new THREE.Shape()
  s.moveTo(0.2, 0); s.quadraticCurveTo(0.1, 0.085, -0.06, 0.05); s.lineTo(-0.2, 0.1); s.lineTo(-0.16, 0); s.lineTo(-0.2, -0.1); s.lineTo(-0.06, -0.05); s.quadraticCurveTo(0.1, -0.085, 0.2, 0)
  return new THREE.ShapeGeometry(s, 4).rotateX(-Math.PI / 2).scale(1.35, 1, 1.35)
}

export class Pesci {
  constructor(scena, motore) {
    this.m = motore
    const geo = sagoma()
    this.attr = new THREE.InstancedBufferAttribute(new Float32Array(MAX_PESCI * 4), 4)
    geo.setAttribute('aF', this.attr)
    const mt = new THREE.ShaderMaterial({
      uniforms: { uT: uTPesci },
      transparent: true, depthWrite: false, side: THREE.DoubleSide,
      vertexShader: `
        uniform float uT;
        attribute vec4 aF;                 // x: raggio · y: velocità angolare (con segno: il verso) · z: fase · w: fase del salto (< 0: non salta mai)
        varying float vSalto;
        void main() {
          vec3 centro = vec3(instanceMatrix[3].x, 0.0, instanceMatrix[3].z);
          float sc = instanceMatrix[0].x;
          float th = uT * aF.y + aF.z;
          vec2 t = vec2(-sin(th), cos(th)) * sign(aF.y);                  // la tangente del giro: dove guarda il naso
          float a = -atan(t.y, t.x);
          float c = cos(a), s = sin(a);
          float u = aF.w < 0.0 ? 1.0 : fract(uT / 17.0 + aF.w);              // un salto ogni ~17 secondi, lungo ~1,6
          float k = clamp(u / 0.095, 0.0, 1.0);
          float inSalto = aF.w < 0.0 ? 0.0 : step(u, 0.095);
          float quota = inSalto * 0.55 * sin(3.14159 * k);
          float beccheggio = inSalto * 1.0 * cos(3.14159 * k);               // il naso in su all'inizio, in giù alla fine
          vec3 p = position * sc;
          float px = p.x * cos(beccheggio) - 0.0, py = p.x * sin(beccheggio);
          vec3 q = vec3(px * c + p.z * s, py, -px * s + p.z * c);
          vec3 mondo = centro + vec3(cos(th) * aF.x, ${Y_PELO} + quota, sin(th) * aF.x) + q;
          vSalto = inSalto * sin(3.14159 * k);
          gl_Position = projectionMatrix * viewMatrix * vec4(mondo, 1.0);
        }`,
      fragmentShader: `
        varying float vSalto;
        void main() {
          vec3 sotto = vec3(0.10, 0.28, 0.45), su = vec3(1.0, 0.72, 0.30);
          gl_FragColor = vec4(mix(sotto, su, vSalto), mix(0.42, 1.0, vSalto));
        }`,
    })
    this.mesh = new THREE.InstancedMesh(geo, mt, MAX_PESCI)
    this.mesh.frustumCulled = false; this.mesh.count = 0; this.mesh.renderOrder = 2
    scena.add(this.mesh)
    this.chiave = ''
    this.acceso = true; this.degradato = false
  }

  /** Le opzioni (i ciuffi d'erba) e il degrado adattivo (`mondo.livello` > 0) li spengono: spenti non si disegnano. */
  imposta(si) { this.acceso = !!si; this._vis() }
  degrada(si) { this.degradato = !!si; this._vis() }
  _vis() { this.mesh.visible = this.acceso && !this.degradato }

  /** Rifà i pesci per i lotti della finestra (`lotti`: iterabile di { l, dati }) e gli stagni costruiti. Salta se non è cambiato niente (`forza` no). */
  ridisegna(lotti, forza = false) {
    const m = this.m, stagni = []
    for (const c of m.cose) if (PEZZI[c.tipo] && PEZZI[c.tipo].acqua) stagni.push(`${c.i},${c.j},${c.tipo}`)
    const lista = [...lotti], k = lista.map(e => e.l.id).join() + '|' + stagni.join(';')
    if (!forza && k === this.chiave) return
    this.chiave = k
    const d = new THREE.Matrix4(), s = new THREE.Vector3(), q = new THREE.Quaternion(), p = new THREE.Vector3()
    let n = 0
    const aggiungi = (i, j) => {
      if (n >= MAX_PESCI || mescola(i, j, 21) >= OGNI) return
      const orto = (m.acqua(i + 1, j) ? 1 : 0) + (m.acqua(i - 1, j) ? 1 : 0) + (m.acqua(i, j + 1) ? 1 : 0) + (m.acqua(i, j - 1) ? 1 : 0)
      const raggio = 0.16 + 0.12 * orto, scala = 0.85 + mescola(i, j, 22) * 0.6
      p.set(i + 0.5, 0, j + 0.5); s.set(scala, scala, scala); d.compose(p, q, s); this.mesh.setMatrixAt(n, d)
      const salta = mescola(i, j, 23) < 0.28
      const veloce = 0.5 + mescola(i, j, 24) * 0.7, verso = mescola(i, j, 25) < 0.5 ? -1 : 1
      this.attr.setXYZW(n, raggio, veloce * verso, mescola(i, j, 26) * 6.283, salta ? mescola(i, j, 27) : -1)
      n++
    }
    for (const { l, dati } of lista) {
      if (!dati.acqua.length) continue
      for (const [i, j] of dati.acqua) aggiungi(i, j)
    }
    for (const c of m.cose) {
      const dd = PEZZI[c.tipo]
      if (!dd || !dd.acqua) continue
      for (let a = 0; a < dd.w; a++) for (let b = 0; b < dd.d; b++) aggiungi(c.i + a, c.j + b)
    }
    this.mesh.count = n
    this.mesh.instanceMatrix.needsUpdate = true; this.attr.needsUpdate = true
  }

  /** Il tempo: scritto a ogni fotogramma dal terreno (nessuna altra cosa si muove in JS). */
  muovi(t) { uTPesci.value = t }

  via() { this.mesh.geometry.dispose(); this.mesh.material.dispose() }
}

