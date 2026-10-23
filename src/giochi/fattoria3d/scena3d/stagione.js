// Le stagioni in scena: il cielo e la luce di Natale e di Halloween, i fiocchi di neve (o le lucciole arancioni), le chiazze di neve sul
// prato, le lucine, le stelle e gli alberelli accanto agli edifici. Tutto effimero: non si salva, non occupa niente. Peso: ogni famiglia è
// UNA draw call a istanze (o un solo `Points`), il moto dei fiocchi sta nel vertex shader. Quando non è festa non esiste niente (nessun
// oggetto, nessuna chiamata). Cosa c'è e dove lo dicono i dati (dati/stagioni3d.js). Vedi docs/fattoria3d/stagioni.md.
import * as THREE from 'three'
import { segna } from '../../../grafica/elementi3d.js'
import { ASPETTI, PARTICELLE, addobbiNatale, chiazzeDiNeve, semeDelGiorno } from '../dati/stagioni3d.js'

const RAGGIO = 17                  // celle: le chiazze si spargono attorno alla telecamera, in una scacchiera quantizzata a QUANTO
const QUANTO = 6                   // la scacchiera si rifà quando la camera ha cambiato quadrato (non a ogni passo)
const CAP = { chiazze: 160, stelle: 40, alberelli: 40, luci: 700 }
const _o = new THREE.Object3D(), _c = new THREE.Color()

const VERT = `
  uniform float uT, uAlto, uLato, uDim, uPx, uSu;
  uniform vec2 uCentro;
  attribute vec2 aS;
  varying float vA;
  void main() {
    float v = 0.35 + aS.x * 0.5;
    float fase = fract(position.y + (uSu > 0.5 ? 1.0 : -1.0) * uT * v / uAlto * 2.2);
    vec2 base = position.xz * uLato;
    vec2 giro = base - uCentro;
    giro = (fract(giro / uLato + 0.5) - 0.5) * uLato;                     // la scatola segue la camera, i fiocchi restano fermi nel mondo
    vec3 p = vec3(uCentro.x + giro.x + sin(uT * 0.7 + aS.y * 40.0) * 0.5, fase * uAlto, uCentro.y + giro.y + cos(uT * 0.5 + aS.y * 30.0) * 0.4);
    vec4 mv = viewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uDim * uPx * (0.6 + aS.x * 0.8) * 34.0 / max(1.0, -mv.z);
    vA = smoothstep(0.0, 0.08, fase) * (1.0 - smoothstep(0.92, 1.0, fase)) * (uSu > 0.5 ? 0.55 + 0.45 * sin(uT * 3.0 + aS.y * 50.0) : 0.95);
  }`
const FRAG = `
  uniform vec3 uColore;
  varying float vA;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    gl_FragColor = vec4(uColore, vA * (1.0 - smoothstep(0.25, 0.5, d)));
  }`

/** Un solo `Points`: `n` punti che cadono (neve) o salgono (lucciole). I numeri 0–1 sono la loro fase e la loro sorte; non si ricalcola mai niente. */
function creaPunti(n, alto, colore, dim, su) {
  const pos = new Float32Array(n * 3), sorte = new Float32Array(n * 2)
  for (let k = 0; k < n; k++) {
    // una successione fissa (nessun Math.random: stessa scena a ogni apertura)
    pos[k * 3] = (k * 0.6180339887) % 1; pos[k * 3 + 1] = (k * 0.7548776662) % 1; pos[k * 3 + 2] = (k * 0.5698402910) % 1
    sorte[k * 2] = (k * 0.3247179572) % 1; sorte[k * 2 + 1] = (k * 0.2207440846) % 1
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aS', new THREE.BufferAttribute(sorte, 2))
  const m = new THREE.ShaderMaterial({
    vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false,
    uniforms: { uT: { value: 0 }, uAlto: { value: alto }, uLato: { value: 34 }, uDim: { value: dim }, uPx: { value: 1 }, uSu: { value: su ? 1 : 0 },
                uCentro: { value: new THREE.Vector2() }, uColore: { value: new THREE.Color(colore) } },
  })
  const p = new THREE.Points(g, m); p.frustumCulled = false; p.renderOrder = 5
  return p
}

export class Stagione {
  /** `nome`: 'natale' | 'halloween'. Prende il cielo, la nebbia e le luci della scena e le tinge; `via()` li rimette. */
  constructor({ scena, emisfero, sole, motore, pezzi, camera, qualita, nome }) {
    this.scena = scena; this.emisfero = emisfero; this.sole = sole; this.m = motore; this.pezzi = pezzi; this.camera = camera; this.q = qualita
    this.nome = nome; this.A = ASPETTI[nome]; this.seme = semeDelGiorno(new Date())
    this.gruppo = segna(new THREE.Group(), 'stagione'); this.gruppo.name = 'stagione'; scena.add(this.gruppo)
    this.prima = {
      cielo: scena.background.clone(), nebbia: scena.fog.color.clone(), emisfero: [emisfero.color.clone(), emisfero.groundColor.clone(), emisfero.intensity],
      sole: [sole.color.clone(), sole.intensity],
    }
    this._tinge()
    this.punti = null; this.chiazze = null; this.stelle = null; this.alberelli = null; this.lucine = null; this.quadrato = null
    if (nome === 'natale') this._costruisciNatale()
    this._particelle()
    this.rinfresca(true)
  }

  /** Le distanze della nebbia di questa festa (la scena le usa se la nebbia è accesa). */
  get nebbia() { return this.A.nebbia }

  _tinge() {
    const { cielo, emisfero: [a, b, i], sole: [cs, is] } = this.A
    this.scena.background.set(cielo); this.scena.fog.color.set(cielo)
    this.emisfero.color.set(a); this.emisfero.groundColor.set(b); this.emisfero.intensity = i
    this.sole.color.set(cs); this.sole.intensity = is
  }

  _istanze(geo, materiale, cap) {
    const im = new THREE.InstancedMesh(geo, materiale, cap)
    im.count = 0; im.frustumCulled = false; this.gruppo.add(im); return im
  }
  _costruisciNatale() {
    this.chiazze = this._istanze(new THREE.CircleGeometry(1, 9).rotateX(-Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: 0xf6f9ff, emissive: 0x8a96a6, roughness: 1, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }), CAP.chiazze)
    this.chiazze.receiveShadow = true
    this.stelle = this._istanze(new THREE.OctahedronGeometry(0.17), new THREE.MeshBasicMaterial({ color: 0xffffff }), CAP.stelle)
    this.stelle.setColorAt(0, _c.set(0xffffff))
    const albero = new THREE.ConeGeometry(0.34, 0.95, 7).translate(0, 0.475, 0)
    this.alberelli = this._istanze(albero, new THREE.MeshStandardMaterial({ color: 0x2f7a3c, roughness: 0.9, flatShading: true }), CAP.alberelli)
    this.cime = this._istanze(new THREE.ConeGeometry(0.17, 0.4, 7).translate(0, 0.78, 0), new THREE.MeshStandardMaterial({ color: 0xf6f9ff, roughness: 1, flatShading: true }), CAP.alberelli)
    this.lucine = this._istanze(new THREE.SphereGeometry(0.05, 4, 3), new THREE.MeshBasicMaterial({ color: 0xffffff }), CAP.luci)
    this.lucine.setColorAt(0, _c.set(0xffffff))
  }

  _particelle() {
    const P = PARTICELLE[this.nome]
    this.punti = this.nome === 'natale' ? creaPunti(P.n, P.alto, 0xffffff, 1.5, false) : creaPunti(P.n, P.alto, 0xffa83a, 1.7, true)
    this.punti.visible = !!this.q.particelle
    this.scena.add(segna(this.punti, 'stagione'))
  }

  /** Le opzioni di qualità sono cambiate: il basso spegne i fiocchi (si vede lo stesso il resto). */
  applica(q) { this.q = q; if (this.punti) this.punti.visible = !!q.particelle }

  /** Qualcosa è cambiato in mappa (o la camera ha cambiato quadrato): rifà le chiazze, le lucine e gli alberelli. */
  rinfresca(forza = false) {
    if (this.nome !== 'natale') return
    const cam = this.camera, qi = Math.floor(cam.x / QUANTO), qj = Math.floor(cam.z / QUANTO)
    if (!forza && this.quadrato && this.quadrato[0] === qi && this.quadrato[1] === qj && !this._sporca) return
    this._sporca = false; this.quadrato = [qi, qj]
    const m = this.m, ci = qi * QUANTO + QUANTO / 2, cj = qj * QUANTO + QUANTO / 2
    // le chiazze: celle vuote del prato (nessuna cosa, strada, acqua o sasso)
    const vuota = (i, j) => !m.occupata(i, j) && !m.acqua(i, j) && !m.ostacoloSu(i, j)
    const ch = chiazzeDiNeve(Math.floor(ci - RAGGIO), Math.floor(cj - RAGGIO), Math.ceil(ci + RAGGIO), Math.ceil(cj + RAGGIO), vuota, this.seme)
    ch.forEach((c, n) => { _o.position.set(c.x, 0.022, c.z); _o.scale.set(c.r, 1, c.r * 0.85); _o.rotation.set(0, n, 0); _o.updateMatrix(); this.chiazze.setMatrixAt(n, _o.matrix) })
    this.chiazze.count = ch.length; this.chiazze.instanceMatrix.needsUpdate = true
    // gli edifici: la stella sul tetto, le lucine sotto la gronda, l'alberello accanto
    const alti = []
    for (const v of this.pezzi.voci.values()) {
      if (!v.edificio) continue
      alti.push({ i: v.c.i, j: v.c.j, w: v.d.w, d: v.d.d, alto: v.grp.userData.altezza || 2.6 })
    }
    const libera = (i, j) => m.cellaPropria(i, j) && !m.occupata(i, j) && !m.acqua(i, j)
    const ad = addobbiNatale(alti, libera, this.seme)
    ad.stelle.slice(0, CAP.stelle).forEach((s, n) => {
      _o.position.set(s.x, s.y, s.z); _o.scale.setScalar(s.campana ? 0.8 : 1); _o.rotation.set(0, n, 0); _o.updateMatrix()
      this.stelle.setMatrixAt(n, _o.matrix); this.stelle.setColorAt(n, _c.set(s.campana ? 0xffa83a : 0xffe34a))
    })
    this.stelle.count = Math.min(ad.stelle.length, CAP.stelle); this.stelle.instanceMatrix.needsUpdate = true; if (this.stelle.instanceColor) this.stelle.instanceColor.needsUpdate = true
    ad.alberelli.slice(0, CAP.alberelli).forEach((a, n) => {
      _o.position.set(a.x, 0, a.z); _o.scale.setScalar(1); _o.rotation.set(0, n * 1.7, 0); _o.updateMatrix()
      this.alberelli.setMatrixAt(n, _o.matrix); this.cime.setMatrixAt(n, _o.matrix)
    })
    this.alberelli.count = this.cime.count = Math.min(ad.alberelli.length, CAP.alberelli)
    this.alberelli.instanceMatrix.needsUpdate = this.cime.instanceMatrix.needsUpdate = true
    ad.luci.slice(0, CAP.luci).forEach((l, n) => {
      _o.position.set(l.x, l.y, l.z); _o.scale.setScalar(1); _o.rotation.set(0, 0, 0); _o.updateMatrix()
      this.lucine.setMatrixAt(n, _o.matrix); this.lucine.setColorAt(n, _c.set(l.rosso ? 0xff3a3a : 0xffd84a))
    })
    this.lucine.count = Math.min(ad.luci.length, CAP.luci); this.lucine.instanceMatrix.needsUpdate = true; if (this.lucine.instanceColor) this.lucine.instanceColor.needsUpdate = true
  }
  /** La mappa è cambiata (un pezzo messo, spostato, girato, tolto): al prossimo fotogramma si rifà. */
  sporca() { this._sporca = true }

  /** Ogni fotogramma: il tempo e il centro della scatola dei fiocchi. Solo due uniform; niente da ricalcolare. */
  aggiorna(tt, pxRatio = 1) {
    const u = this.punti.material.uniforms
    u.uT.value = tt; u.uPx.value = pxRatio; u.uCentro.value.set(this.camera.x, this.camera.z)
    if (this._sporca || this.nome === 'natale') this.rinfresca()
  }

  via() {
    const p = this.prima
    this.scena.background.copy(p.cielo); this.scena.fog.color.copy(p.nebbia)
    this.emisfero.color.copy(p.emisfero[0]); this.emisfero.groundColor.copy(p.emisfero[1]); this.emisfero.intensity = p.emisfero[2]
    this.sole.color.copy(p.sole[0]); this.sole.intensity = p.sole[1]
    this.scena.remove(this.gruppo, this.punti)
    this.gruppo.traverse(o => { if (o.isMesh) { o.geometry.dispose(); o.material.dispose() } })
    this.punti.geometry.dispose(); this.punti.material.dispose()
  }
}
