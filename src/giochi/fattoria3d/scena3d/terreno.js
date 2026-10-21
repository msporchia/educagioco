// Il terreno: l'erba, le strade (una per cella, a istanze), la griglia che si accende mentre si costruisce, i lotti non comprati
// (un velo scuro), il recinto basso attorno a quelli comprati, gli alberi, i sassi e i cespugli (a istanze: si tolgono uno alla volta
// azzerando l'istanza), i laghetti con la riva, le canne e le ninfee, i ciuffi d'erba che ondeggiano col vento e i due edifici di scena.
// Il mondo non ha confini: tutto ciò che è a istanze si rifà per una FINESTRA di lotti attorno alla camera (`FINESTRA`), dentro i lotti
// che il motore ha aperto (i tuoi e due lotti attorno): il peso non cresce con la fattoria. Non sa le regole: legge dal motore cosa è tuo.
// Vedi docs/fattoria3d/mondo-infinito.md.
import * as THREE from 'three'
import { mat, FORME, creaFienile, creaCasa } from './modelli.js'
import { geometriaCespuglio } from './dal-sotterraneo.js'
import { LOTTO, FISSI, lotto, lottoDi, cellaDa } from '../dati/mondo.js'
import { mescola, sequenza } from '../dati/semi.js'

const ZERO = new THREE.Matrix4().makeScale(0, 0, 0)

/** La finestra di lotti attorno alla camera: a per lato, b più avanti (la camera guarda verso -z). 9×9 lotti, mai di più. */
export const FINESTRA = { a0: -4, a1: 4, b0: -5, b1: 3 }
/** Quante istanze al massimo per ogni cosa (il peso è questo, qualunque sia l'estensione). */
export const CAPACITA = { alberi: 700, cespugli: 420, sassi: 420, ciuffi: 1500, strade: 4000, pali: 2400, travi: 4800, veli: 90, griglia: 90, acqua: 200, canne: 120, ninfee: 120 }

function rumore(px, colA, colB, n = 900) {
  const c = document.createElement('canvas'); c.width = c.height = px
  const x = c.getContext('2d'); x.fillStyle = colA; x.fillRect(0, 0, px, px)
  for (let k = 0; k < n; k++) {
    x.fillStyle = colB; x.globalAlpha = 0.12 + Math.random() * 0.2
    const r = 2 + Math.random() * 7; x.beginPath(); x.arc(Math.random() * px, Math.random() * px, r, 0, 6.3); x.fill()
  }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4
  return t
}

export class Terreno {
  constructor(scena, motore) {
    this.scena = scena; this.m = motore
    this.istanzeAlberi = []
    this.decori = { alberi: [], erba: [] }
    this.istanzeOstacoli = []
    this.fumi = []; this.tFumo = 0      // i camini di scena: dove esce il fumo, e quando è uscito l'ultimo
    this.texture = []
    this.tempo = 0
    this.vento = { uT: { value: 0 }, uV: { value: 1 } }       // il tempo e l'intensità del vento, letti dal materiale dei ciuffi (e dell'acqua)
    this.centro = { a: 1e9, b: 1e9 }                          // il lotto al mezzo della finestra
    this.griglia = null; this._grigliaOn = false
    this._suolo(); this._strade(); this._griglia(); this._lotti(); this._alberi(); this._ostacoli(); this._erba(); this._acqua(); this._fisse()
    this.segui(0, 0, true)
  }

  // ── la finestra ──
  /** I lotti della finestra che il motore ha aperto: { l, dati }. */
  *lottiInFinestra() {
    const { a, b } = this.centro
    for (let q = b + FINESTRA.b0; q <= b + FINESTRA.b1; q++) for (let p = a + FINESTRA.a0; p <= a + FINESTRA.a1; p++) {
      const e = this.m.lottiAperti.get(lotto(p, q).k)
      if (e) yield e
    }
  }
  dentroFinestra(i, j) {
    const l = lottoDi(i, j)
    return l.a >= this.centro.a + FINESTRA.a0 && l.a <= this.centro.a + FINESTRA.a1 && l.b >= this.centro.b + FINESTRA.b0 && l.b <= this.centro.b + FINESTRA.b1
  }
  /** Chiamata a ogni fotogramma con la posizione della camera: il suolo la segue, e se è cambiato il lotto al mezzo si rifà la finestra. */
  segui(x, z, forza = false) {
    const g = 4                                              // il suolo scorre a passi di una ripetizione della texture: non si vede muovere
    this.suolo.position.set(Math.round(x / g) * g, 0, Math.round(z / g) * g)
    const l = lottoDi(Math.floor(x), Math.floor(z))
    if (forza || l.a !== this.centro.a || l.b !== this.centro.b) { this.centro = { a: l.a, b: l.b }; this.ridisegnaTutto() }
  }
  ridisegnaTutto() { this.ridisegnaLotti(); this.ridisegnaStrade(); this._ridisegnaAlberi(); this._ridisegnaOstacoli(); this._ridisegnaAcqua(); this._ridisegnaErba() }

  _suolo() {
    const erba = rumore(256, '#79b84a', '#5e9a38'); this.sabbia = rumore(256, '#dcc796', '#c9b07c', 500)
    this.texture.push(erba, this.sabbia)
    const t = erba.clone(); t.needsUpdate = true; t.repeat.set(50, 50)
    const m = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshStandardMaterial({ map: t, roughness: 1 }))
    m.rotation.x = -Math.PI / 2; m.receiveShadow = true; this.scena.add(m)
    this.suolo = m
  }

  _strade() {
    this.stradeMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.03, 1), new THREE.MeshStandardMaterial({ map: this.sabbia, roughness: 1 }), CAPACITA.strade)
    this.stradeMesh.receiveShadow = true; this.stradeMesh.frustumCulled = false; this.stradeMesh.setColorAt(0, new THREE.Color())
    this.scena.add(this.stradeMesh)
  }
  ridisegnaStrade() {
    const d = new THREE.Object3D(), c = new THREE.Color(); let n = 0
    for (const [k, v] of this.m.strada) {
      if (!v || n >= CAPACITA.strade) continue
      const [i, j] = cellaDa(k)
      if (!this.dentroFinestra(i, j)) continue
      d.position.set(i + 0.5, 0.015, j + 0.5); d.updateMatrix(); this.stradeMesh.setMatrixAt(n, d.matrix)
      const t = 0.93 + (((i * 7 + j * 13) % 9) + 9) % 9 * 0.014; this.stradeMesh.setColorAt(n, c.setRGB(t, t * 0.99, t * 0.96)); n++
    }
    this.stradeMesh.count = n; this.stradeMesh.instanceMatrix.needsUpdate = true; this.stradeMesh.instanceColor.needsUpdate = true
    if (this.ciuffi) this._ridisegnaErba()                // un ciuffo non cresce sulla strada
  }

  // la griglia di costruzione: un riquadro per lotto tuo della finestra, solo mentre si costruisce
  _griglia() {
    const c = document.createElement('canvas'); c.width = c.height = 64
    const x = c.getContext('2d'); x.strokeStyle = 'rgba(255,255,255,.8)'; x.lineWidth = 3; x.strokeRect(0, 0, 64, 64)
    const tex = new THREE.CanvasTexture(c); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; this.texture.push(tex)
    tex.repeat.set(LOTTO, LOTTO)
    this.griglia = new THREE.InstancedMesh(new THREE.PlaneGeometry(LOTTO, LOTTO), new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.5, depthWrite: false }), CAPACITA.griglia)
    this.griglia.frustumCulled = false; this.griglia.visible = false; this.scena.add(this.griglia)
  }
  mostraGriglia(si) {
    this._grigliaOn = si; this.griglia.visible = si
    if (!si) return
    const d = new THREE.Object3D(); let n = 0
    for (const { l } of this.lottiInFinestra()) {
      if (!this.m.posseduto(l) || n >= CAPACITA.griglia) continue
      d.position.set(l.i + l.w / 2, 0.035, l.j + l.d / 2); d.rotation.set(-Math.PI / 2, 0, 0); d.updateMatrix(); this.griglia.setMatrixAt(n++, d.matrix)
    }
    this.griglia.count = n; this.griglia.instanceMatrix.needsUpdate = true
  }

  // i lotti non comprati e il recinto basso attorno a quelli comprati
  _lotti() {
    this.velo = new THREE.InstancedMesh(new THREE.PlaneGeometry(LOTTO, LOTTO), new THREE.MeshStandardMaterial({ color: 0x35542a, transparent: true, opacity: 0.74, roughness: 1, depthWrite: false }), CAPACITA.veli)
    this.velo.frustumCulled = false; this.velo.receiveShadow = true
    this.pali = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.06, 0.07, 0.7, 6).translate(0, 0.35, 0), mat(0x7a5232), CAPACITA.pali)
    this.travi = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.07, 0.05), mat(0x93622f), CAPACITA.travi)
    for (const m of [this.pali, this.travi]) { m.castShadow = true; m.frustumCulled = false }
    this.scena.add(this.velo, this.pali, this.travi)
  }
  ridisegnaLotti() {
    const d = new THREE.Object3D(); let nv = 0
    for (const { l } of this.lottiInFinestra()) {
      if (this.m.posseduto(l) || nv >= CAPACITA.veli) continue
      d.position.set(l.i + 2, 0.05, l.j + 2); d.rotation.set(-Math.PI / 2, 0, 0); d.scale.set(1, 1, 1); d.updateMatrix(); this.velo.setMatrixAt(nv++, d.matrix)
    }
    this.velo.count = nv; this.velo.instanceMatrix.needsUpdate = true
    this.ricostruisciRecinti()
    if (this._grigliaOn) this.mostraGriglia(true)
  }
  /** un recinto basso lungo ogni lato di un lotto tuo (della finestra) che confina con uno non tuo */
  ricostruisciRecinti() {
    const d = new THREE.Object3D(), vistiPali = new Set(); let np = 0, nt = 0
    const propria = (i, j) => this.m.cellaPropria(i, j)
    const palo = (x, z) => { const k = x + ',' + z; if (vistiPali.has(k) || np >= CAPACITA.pali) return; vistiPali.add(k); d.position.set(x, 0, z); d.rotation.set(0, 0, 0); d.scale.set(1, 1, 1); d.updateMatrix(); this.pali.setMatrixAt(np++, d.matrix) }
    const trave = (x, z, giu) => { for (const y of [0.28, 0.52]) { if (nt >= CAPACITA.travi) return; d.position.set(x, y, z); d.rotation.set(0, giu ? Math.PI / 2 : 0, 0); d.updateMatrix(); this.travi.setMatrixAt(nt++, d.matrix) } }
    for (const { l } of this.lottiInFinestra()) {
      if (!this.m.posseduto(l)) continue
      for (let j = l.j; j < l.j + l.d; j++) for (let i = l.i; i < l.i + l.w; i++) {
        if (!propria(i, j - 1)) { palo(i, j); palo(i + 1, j); trave(i + 0.5, j, false) }
        if (!propria(i, j + 1)) { palo(i, j + 1); palo(i + 1, j + 1); trave(i + 0.5, j + 1, false) }
        if (!propria(i - 1, j)) { palo(i, j); palo(i, j + 1); trave(i, j + 0.5, true) }
        if (!propria(i + 1, j)) { palo(i + 1, j); palo(i + 1, j + 1); trave(i + 1, j + 0.5, true) }
      }
    }
    this.pali.count = np; this.travi.count = nt; this.pali.instanceMatrix.needsUpdate = true; this.travi.instanceMatrix.needsUpdate = true
  }

  // gli alberi: nei lotti aperti, a istanze (tre mesh per albero). Si abbattono nel terreno proprio, azzerando l'istanza.
  _alberi() {
    const n = CAPACITA.alberi
    const tronchi = new THREE.InstancedMesh(FORME.tronco, mat(0x7a5232), n)
    const chiome = new THREE.InstancedMesh(FORME.chioma, mat(0xffffff), n)
    const chiome2 = new THREE.InstancedMesh(FORME.chioma2, mat(0xffffff), n)
    for (const x of [tronchi, chiome, chiome2]) { x.castShadow = true; x.receiveShadow = true; x.frustumCulled = false; x.count = 0 }
    this.istanzeAlberi = [tronchi, chiome, chiome2]
    this.scena.add(tronchi, chiome, chiome2); this.decori.alberi = this.istanzeAlberi
    this._alberiIst = []                                     // l'albero (oggetto del motore) di ogni istanza
  }
  _ridisegnaAlberi() {
    const [tronchi, chiome, chiome2] = this.istanzeAlberi, d = new THREE.Object3D(), col = new THREE.Color()
    this._alberiIst = []
    for (const { dati } of this.lottiInFinestra()) for (const a of dati.alberi) {
      if (a.tagliato || this._alberiIst.length >= CAPACITA.alberi) continue
      const k = this._alberiIst.length; this._alberiIst.push(a)
      d.position.set(a.i + 0.5, 0, a.j + 0.5); d.rotation.y = a.c * 6; d.scale.setScalar(a.s); d.updateMatrix()
      tronchi.setMatrixAt(k, d.matrix); chiome.setMatrixAt(k, d.matrix); chiome2.setMatrixAt(k, d.matrix)
      col.setHSL(0.27 + a.c * 0.05, 0.5, 0.3 + a.c * 0.1); chiome.setColorAt(k, col); chiome2.setColorAt(k, col)
    }
    for (const x of this.istanzeAlberi) { x.count = this._alberiIst.length; x.instanceMatrix.needsUpdate = true; if (x.instanceColor) x.instanceColor.needsUpdate = true }
  }
  /** L'albero (del motore) nell'istanza `k`. */
  alberoDi(k) { return this._alberiIst[k] || null }
  togliAlbero(n) {
    const k = this._alberiIst.findIndex(a => a.n === n)
    if (k >= 0) for (const x of this.istanzeAlberi) { x.setMatrixAt(k, ZERO); x.instanceMatrix.needsUpdate = true }
  }

  // i sassi e i cespugli: pochi per lotto, anche dopo l'acquisto. Si tolgono toccandoli (🪙 1): l'istanza si azzera, come un albero.
  _ostacoli() {
    const mc = new THREE.InstancedMesh(geometriaCespuglio(), mat(0xffffff, { vertexColors: true }), CAPACITA.cespugli)   // il cespuglio del Sotterraneo (dal-sotterraneo.js)
    const ms = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.32, 0), mat(0xffffff), CAPACITA.sassi)
    this.istanzeOstacoli = [mc, ms]
    this._indiceOstacoli = new Map([[mc, []], [ms, []]])
    for (const x of this.istanzeOstacoli) { x.castShadow = true; x.receiveShadow = true; x.frustumCulled = false; x.count = 0 }
    this.scena.add(mc, ms)
  }
  _ridisegnaOstacoli() {
    const [mc, ms] = this.istanzeOstacoli, d = new THREE.Object3D(), col = new THREE.Color()
    const ic = this._indiceOstacoli.get(mc), is = this._indiceOstacoli.get(ms); ic.length = 0; is.length = 0
    for (const { dati } of this.lottiInFinestra()) for (const o of dati.ostacoli) {
      if (o.tolto) continue
      if (o.tipo === 'cespuglio') {
        if (ic.length >= CAPACITA.cespugli) continue
        const k = ic.length; ic.push(o.n)
        d.position.set(o.x, 0, o.z); d.rotation.set(0, o.ang, 0); d.scale.set(1.2 * o.s, 1.05 * o.s, 1.2 * o.s); d.updateMatrix()
        mc.setMatrixAt(k, d.matrix); mc.setColorAt(k, col.setHSL(0.27 + o.c * 0.06, 0.55, 0.26 + o.c * 0.12))
      } else {
        if (is.length >= CAPACITA.sassi) continue
        const k = is.length; is.push(o.n)
        d.position.set(o.x, 0.15, o.z); d.rotation.set(o.c * 2, o.ang, 0); d.scale.set(1.1 * o.s, 0.75 * o.s, 1 * o.s); d.updateMatrix()
        ms.setMatrixAt(k, d.matrix); ms.setColorAt(k, col.setHSL(0.1, 0.05, 0.5 + o.c * 0.14))
      }
    }
    mc.count = ic.length; ms.count = is.length
    for (const x of this.istanzeOstacoli) { x.instanceMatrix.needsUpdate = true; if (x.instanceColor) x.instanceColor.needsUpdate = true }
  }
  /** Il numero (id) dell'ostacolo che sta nell'istanza `k` della mesh `mesh`. */
  ostacoloDi(mesh, k) { return (this._indiceOstacoli.get(mesh) || [])[k] }
  togliOstacolo(n) {
    for (const [mesh, ns] of this._indiceOstacoli) { const k = ns.indexOf(n); if (k >= 0) { mesh.setMatrixAt(k, ZERO); mesh.instanceMatrix.needsUpdate = true } }
  }

  // ── i laghetti: una lastra azzurra per ogni cella d'acqua con un po' di riva di terra chiara sotto, canne sulla riva e ninfee sull'acqua.
  // Un secondo materiale economico, senza ombra e senza luci in più; la superficie luccica col tempo nello shader. ──
  _acqua() {
    const materiale = new THREE.MeshStandardMaterial({ color: 0x4ba6d6, transparent: true, opacity: 0.84, roughness: 0.3, depthWrite: false })
    materiale.onBeforeCompile = sh => {
      sh.uniforms.uT = this.vento.uT
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec2 vWP;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvWP = (modelMatrix * instanceMatrix * vec4(position, 1.0)).xz;')
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec2 vWP;\nuniform float uT;')
        .replace('#include <color_fragment>', `#include <color_fragment>
          float onda = sin(vWP.x * 2.6 + uT * 1.3) * sin(vWP.y * 2.9 - uT * 1.1) + 0.5 * sin((vWP.x + vWP.y) * 4.1 + uT * 2.0);
          diffuseColor.rgb += vec3(0.05, 0.08, 0.10) * onda;`)
    }
    this.lastra = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), materiale, CAPACITA.acqua)
    this.riva = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: this.sabbia, roughness: 1 }), CAPACITA.acqua)
    const lama = (h, ang, dx) => new THREE.ConeGeometry(0.035, h, 4).translate(0, h / 2, 0).rotateZ(0.08).rotateY(ang).translate(dx, 0, 0).toNonIndexed()
    const pos = [lama(0.9, 0, 0), lama(0.7, 2.1, 0.07), lama(1.05, 4.2, -0.06)].flatMap(g => Array.from(g.attributes.position.array))
    const gc = new THREE.BufferGeometry(); gc.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); gc.computeVertexNormals()
    this.canne = new THREE.InstancedMesh(gc, new THREE.MeshStandardMaterial({ color: 0x8aa63a, roughness: 1, flatShading: true, side: THREE.DoubleSide }), CAPACITA.canne)
    this.ninfee = new THREE.InstancedMesh(new THREE.CircleGeometry(0.24, 9).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x4f9a45, roughness: 0.8, side: THREE.DoubleSide }), CAPACITA.ninfee)
    for (const x of [this.lastra, this.riva, this.canne, this.ninfee]) { x.frustumCulled = false; x.count = 0; x.castShadow = false }
    this.lastra.receiveShadow = false; this.riva.receiveShadow = true
    this.scena.add(this.riva, this.lastra, this.canne, this.ninfee)
  }
  _ridisegnaAcqua() {
    const d = new THREE.Object3D(); let na = 0, nc = 0, nn = 0
    for (const { l, dati } of this.lottiInFinestra()) {
      if (!dati.acqua.length || na + dati.acqua.length > CAPACITA.acqua) continue
      for (const [i, j] of dati.acqua) {
        d.position.set(i + 0.5, 0.03, j + 0.5); d.rotation.set(0, 0, 0); d.scale.set(1.0, 1, 1.0); d.updateMatrix(); this.lastra.setMatrixAt(na, d.matrix)
        d.position.y = 0.012; d.scale.set(1.5, 1, 1.5); d.updateMatrix(); this.riva.setMatrixAt(na, d.matrix); na++
      }
      const caso = sequenza(l.a, l.b, 6), acqua = new Set(dati.acqua.map(([i, j]) => i + ',' + j))
      for (let k = 0; k < 2 && nn < CAPACITA.ninfee; k++) {
        const [i, j] = dati.acqua[Math.floor(caso() * dati.acqua.length)]
        d.position.set(i + 0.25 + caso() * 0.5, 0.04, j + 0.25 + caso() * 0.5); d.rotation.set(0, caso() * 6, 0); d.scale.setScalar(0.8 + caso() * 0.5); d.updateMatrix(); this.ninfee.setMatrixAt(nn++, d.matrix)
      }
      for (let k = 0; k < 4 && nc < CAPACITA.canne; k++) {                  // canne: sulle celle di terra che toccano l'acqua
        const i = l.i + Math.floor(caso() * l.w), j = l.j + Math.floor(caso() * l.d)
        const x = caso(), y = caso()
        const riva = !acqua.has(i + ',' + j) && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => acqua.has((i + a) + ',' + (j + b)))
        if (!riva) continue
        d.position.set(i + 0.2 + x * 0.6, 0, j + 0.2 + y * 0.6); d.rotation.set(0, caso() * 6, 0); d.scale.setScalar(0.9 + caso() * 0.5); d.updateMatrix(); this.canne.setMatrixAt(nc++, d.matrix)
      }
    }
    this.lastra.count = this.riva.count = na; this.canne.count = nc; this.ninfee.count = nn
    for (const x of [this.lastra, this.riva, this.canne, this.ninfee]) x.instanceMatrix.needsUpdate = true
  }

  // i ciuffi d'erba: un gruppetto di tre fili, a istanze, su ogni cella del prato che non sia occupata (si rifanno a ogni cambio) e
  // sui lotti aperti della finestra. Ondeggiano col vento nel vertex shader: ogni ciuffo ha la sua fase, e la punta si muove più della base.
  _erba() {
    const lame = [[0, 0.0, 0.0, 0.5], [2.1, 0.22, 0.08, 0.38], [4.2, -0.2, -0.1, 0.32]].map(([ang, dx, dz, h]) => {
      const g = new THREE.ConeGeometry(0.07, h, 3).translate(0, h / 2, 0).rotateZ(0.12).rotateY(ang).translate(dx * 0.5, 0, dz * 0.5)
      return g.toNonIndexed()
    })
    const pos = lame.flatMap(g => Array.from(g.attributes.position.array))
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.computeVertexNormals()
    const materiale = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, flatShading: true, side: THREE.DoubleSide })
    materiale.onBeforeCompile = sh => {
      sh.uniforms.uT = this.vento.uT; sh.uniforms.uV = this.vento.uV
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uT;\nuniform float uV;')
        .replace('#include <begin_vertex>', `#include <begin_vertex>
          float fase = instanceMatrix[3].x * 0.8 + instanceMatrix[3].z * 0.6;
          float raffica = 0.6 + 0.4 * sin(uT * 0.7 + fase * 0.3);
          transformed.x += sin(uT * 2.4 + fase) * 0.34 * position.y * uV * raffica;
          transformed.z += cos(uT * 1.9 + fase * 1.3) * 0.2 * position.y * uV * raffica;`)
    }
    this.cespiErba = []
    const ciuffi = new THREE.InstancedMesh(geo, materiale, CAPACITA.ciuffi)
    ciuffi.receiveShadow = true; ciuffi.frustumCulled = false; ciuffi.count = 0
    ciuffi.setColorAt(0, new THREE.Color())
    this.scena.add(ciuffi); this.decori.erba = [ciuffi]; this.ciuffi = ciuffi
  }
  /** I ciuffi della finestra: una candidata per cella (il caso del mondo la tiene o no, sempre allo stesso modo). Un ciuffo non cresce
      dove sta una cosa (strada, pezzo, edificio, albero, sasso) né sull'acqua. Si rilegge a ogni cambio. */
  _ridisegnaErba() {
    const d = new THREE.Object3D(), m = this.m, col = new THREE.Color(); let n = 0
    for (const { l } of this.lottiInFinestra()) for (let j = l.j; j < l.j + l.d; j++) for (let i = l.i; i < l.i + l.w; i++) {
      if (mescola(i, j, 7) >= 0.5 || n >= CAPACITA.ciuffi) continue
      if (m.occupata(i, j) || m.acqua(i, j)) continue
      const x = i + 0.15 + mescola(i, j, 8) * 0.7, z = j + 0.15 + mescola(i, j, 9) * 0.7, c = mescola(i, j, 10)
      d.position.set(x, 0, z); d.rotation.set(0, mescola(i, j, 11) * 6.3, 0); d.scale.setScalar(0.9 + mescola(i, j, 12) * 0.6); d.updateMatrix()
      this.ciuffi.setMatrixAt(n, d.matrix); this.ciuffi.setColorAt(n, col.setHSL(0.25 + c * 0.06, 0.6, 0.27 + c * 0.13)); n++
    }
    this.ciuffi.count = n; this.ciuffi.instanceMatrix.needsUpdate = true; this.ciuffi.instanceColor.needsUpdate = true
  }
  ridisegnaErba() { this._ridisegnaErba() }

  // il fienile e la casa: solo di scena
  _fisse() {
    for (const f of FISSI) {
      const g = f.tipo === 'fienile' ? creaFienile() : creaCasa()
      g.position.set(f.i + f.w / 2, 0, f.j + f.d / 2); this.scena.add(g)
      if (g.userData.fumo) this.fumi.push(g.position.clone().add(g.userData.fumo))      // il camino della casa
    }
  }

  /** `fx`: gli effetti, per il fumo del camino (di tanto in tanto, piano). */
  muovi(dt, fx = null) {
    this.tempo += dt; this.vento.uT.value = this.tempo
    if (fx && this.fumi.length && this.tempo - this.tFumo > 0.9) { this.tFumo = this.tempo; for (const p of this.fumi) fx.fumata(p) }
  }

  /** Accende e spegne i pezzi che pesano (le opzioni): alberi e ciuffi; e il vento che muove i ciuffi (il grano è dei pezzi). */
  applica(q) {
    for (const m of this.decori.alberi) m.visible = q.alberi
    for (const m of this.decori.erba) m.visible = q.erba
    this.vento.uV.value = q.vento ? 1 : 0
  }

  via() {
    for (const t of this.texture) t.dispose()
    this.scena.traverse(o => { if (o.isMesh) { o.geometry?.dispose(); const m = o.material; for (const x of Array.isArray(m) ? m : [m]) x?.dispose() } })
  }
}
