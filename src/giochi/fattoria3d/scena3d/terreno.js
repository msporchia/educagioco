// Il terreno: l'erba, le strade (una per cella, a istanze), la griglia che si accende mentre si costruisce, i lotti non comprati
// (un velo scuro), il recinto basso attorno a quelli comprati, gli alberi e i sassi e cespugli (a istanze: si tolgono uno alla volta
// azzerando l'istanza, anche nei lotti comprati), i ciuffi d'erba che ondeggiano col vento e i
// due edifici di scena. Non sa le regole: legge dal motore cosa è tuo.
import * as THREE from 'three'
import { mat, FORME, creaFienile, creaCasa } from './modelli.js'
import { geometriaCespuglio } from './dal-sotterraneo.js'
import { LOTTI, LIM, LOTTO, GW, GH, I0, J0, dentro, idx, FISSI } from '../dati/mondo.js'

const ZERO = new THREE.Matrix4().makeScale(0, 0, 0)

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
    this.vento = { uT: { value: 0 }, uV: { value: 1 } }       // il tempo e l'intensità del vento, letti dal materiale dei ciuffi
    this._suolo(); this._strade(); this._griglia(); this._lotti(); this._alberi(); this._ostacoli(); this._erba(); this._fisse()
    this.ridisegnaLotti(); this.ridisegnaStrade(); this.ridisegnaErba()
  }

  _suolo() {
    const erba = rumore(256, '#79b84a', '#5e9a38'); this.sabbia = rumore(256, '#dcc796', '#c9b07c', 500)
    this.texture.push(erba, this.sabbia)
    const t = erba.clone(); t.needsUpdate = true; t.repeat.set(30, 30)
    const m = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), new THREE.MeshStandardMaterial({ map: t, roughness: 1 }))
    m.rotation.x = -Math.PI / 2; m.receiveShadow = true; this.scena.add(m)
    this.suolo = m
  }

  _strade() {
    this.stradeMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.03, 1), new THREE.MeshStandardMaterial({ map: this.sabbia, roughness: 1 }), GW * GH)
    this.stradeMesh.receiveShadow = true; this.stradeMesh.frustumCulled = false; this.stradeMesh.setColorAt(0, new THREE.Color())
    this.scena.add(this.stradeMesh)
  }
  ridisegnaStrade() {
    const d = new THREE.Object3D(), c = new THREE.Color(), strada = this.m.strada; let n = 0
    for (let k = 0; k < strada.length; k++) {
      if (!strada[k]) continue
      const i = k % GW + I0, j = Math.floor(k / GW) + J0
      d.position.set(i + 0.5, 0.015, j + 0.5); d.updateMatrix(); this.stradeMesh.setMatrixAt(n, d.matrix)
      const t = 0.93 + ((i * 7 + j * 13) % 9) * 0.014; this.stradeMesh.setColorAt(n, c.setRGB(t, t * 0.99, t * 0.96)); n++
    }
    this.stradeMesh.count = n; this.stradeMesh.instanceMatrix.needsUpdate = true; this.stradeMesh.instanceColor.needsUpdate = true
    if (this.ciuffi) this.ridisegnaErba()                 // un ciuffo non cresce sulla strada
  }

  // la griglia di costruzione: un riquadro per lotto, solo mentre si costruisce
  _griglia() {
    const c = document.createElement('canvas'); c.width = c.height = 64
    const x = c.getContext('2d'); x.strokeStyle = 'rgba(255,255,255,.8)'; x.lineWidth = 3; x.strokeRect(0, 0, 64, 64)
    const tex = new THREE.CanvasTexture(c); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; this.texture.push(tex)
    this.griglia = new THREE.Group(); this.griglia.visible = false; this.scena.add(this.griglia)
    this.grigliaLotto = {}
    for (const l of LOTTI) {
      const t = tex.clone(); t.needsUpdate = true; t.repeat.set(l.w, l.d)
      const m = new THREE.Mesh(new THREE.PlaneGeometry(l.w, l.d), new THREE.MeshBasicMaterial({ map: t, transparent: true, opacity: 0.5, depthWrite: false }))
      m.rotation.x = -Math.PI / 2; m.position.set(l.i + l.w / 2, 0.035, l.j + l.d / 2); this.griglia.add(m); this.grigliaLotto[l.id] = m
    }
  }
  mostraGriglia(si) {
    this.griglia.visible = si
    if (si) for (const l of LOTTI) this.grigliaLotto[l.id].visible = this.m.posseduto(l)
  }

  // i lotti non comprati e il recinto basso attorno a quelli comprati
  _lotti() {
    this.velo = new THREE.InstancedMesh(new THREE.PlaneGeometry(LOTTO, LOTTO), new THREE.MeshStandardMaterial({ color: 0x35542a, transparent: true, opacity: 0.74, roughness: 1, depthWrite: false }), LOTTI.length)
    this.velo.frustumCulled = false; this.velo.receiveShadow = true
    this.pali = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.06, 0.07, 0.7, 6).translate(0, 0.35, 0), mat(0x7a5232), 800)
    this.travi = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.07, 0.05), mat(0x93622f), 1600)
    for (const m of [this.pali, this.travi]) { m.castShadow = true; m.frustumCulled = false }
    this.scena.add(this.velo, this.pali, this.travi)
  }
  ridisegnaLotti() {
    const d = new THREE.Object3D(); let nv = 0
    for (const l of LOTTI) {
      if (this.m.posseduto(l)) continue
      d.position.set(l.i + 2, 0.05, l.j + 2); d.rotation.set(-Math.PI / 2, 0, 0); d.scale.set(1, 1, 1); d.updateMatrix(); this.velo.setMatrixAt(nv++, d.matrix)
    }
    this.velo.count = nv; this.velo.instanceMatrix.needsUpdate = true
    this.ricostruisciRecinti()
    if (this.griglia.visible) this.mostraGriglia(true)
  }
  /** un recinto basso lungo ogni lato di un lotto tuo che confina con uno non tuo (o con il bordo del mondo) */
  ricostruisciRecinti() {
    const d = new THREE.Object3D(), vistiPali = new Set(); let np = 0, nt = 0
    const propria = (i, j) => this.m.cellaPropria(i, j)
    const palo = (x, z) => { const k = x + ',' + z; if (vistiPali.has(k)) return; vistiPali.add(k); d.position.set(x, 0, z); d.rotation.set(0, 0, 0); d.scale.set(1, 1, 1); d.updateMatrix(); this.pali.setMatrixAt(np++, d.matrix) }
    const trave = (x, z, giu) => { for (const y of [0.28, 0.52]) { d.position.set(x, y, z); d.rotation.set(0, giu ? Math.PI / 2 : 0, 0); d.updateMatrix(); this.travi.setMatrixAt(nt++, d.matrix) } }
    for (let j = LIM.j0; j < LIM.j1; j++) for (let i = LIM.i0; i < LIM.i1; i++) {
      if (!propria(i, j)) continue
      if (!propria(i, j - 1)) { palo(i, j); palo(i + 1, j); trave(i + 0.5, j, false) }
      if (!propria(i, j + 1)) { palo(i, j + 1); palo(i + 1, j + 1); trave(i + 0.5, j + 1, false) }
      if (!propria(i - 1, j)) { palo(i, j); palo(i, j + 1); trave(i, j + 0.5, true) }
      if (!propria(i + 1, j)) { palo(i + 1, j); palo(i + 1, j + 1); trave(i + 1, j + 0.5, true) }
    }
    this.pali.count = np; this.travi.count = nt; this.pali.instanceMatrix.needsUpdate = true; this.travi.instanceMatrix.needsUpdate = true
  }

  // gli alberi: dentro il mondo si abbattono, fuori è bosco
  _alberi() {
    const alberi = this.m.alberi
    const tronchi = new THREE.InstancedMesh(FORME.tronco, mat(0x7a5232), alberi.length)
    const chiome = new THREE.InstancedMesh(FORME.chioma, mat(0xffffff), alberi.length)
    const chiome2 = new THREE.InstancedMesh(FORME.chioma2, mat(0xffffff), alberi.length)
    for (const x of [tronchi, chiome, chiome2]) { x.castShadow = true; x.receiveShadow = true }
    const d = new THREE.Object3D(), col = new THREE.Color()
    for (const a of alberi) {
      d.position.set(a.i + 0.5, 0, a.j + 0.5); d.rotation.y = a.c * 6; d.scale.setScalar(a.s); d.updateMatrix()
      tronchi.setMatrixAt(a.n, d.matrix); chiome.setMatrixAt(a.n, d.matrix); chiome2.setMatrixAt(a.n, d.matrix)
      col.setHSL(0.27 + a.c * 0.05, 0.5, 0.3 + a.c * 0.1); chiome.setColorAt(a.n, col); chiome2.setColorAt(a.n, col)
    }
    this.istanzeAlberi = [tronchi, chiome, chiome2]
    this.scena.add(tronchi, chiome, chiome2); this.decori.alberi = this.istanzeAlberi
    for (const a of alberi) if (a.tagliato) this.togliAlbero(a.n)
  }
  // i sassi e i cespugli: pochi per lotto, anche dopo l'acquisto. Si tolgono toccandoli (🪙 1): l'istanza si azzera, come un albero.
  _ostacoli() {
    const lista = this.m.ostacoli
    const cespugli = lista.filter(o => o.tipo === 'cespuglio'), sassi = lista.filter(o => o.tipo === 'sasso')
    const mc = new THREE.InstancedMesh(geometriaCespuglio(), mat(0xffffff, { vertexColors: true }), Math.max(1, cespugli.length))   // il cespuglio del Sotterraneo (dal-sotterraneo.js)
    const ms = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.32, 0), mat(0xffffff), Math.max(1, sassi.length))
    this.istanzeOstacoli = [mc, ms]
    this._indiceOstacoli = new Map([[mc, cespugli.map(o => o.n)], [ms, sassi.map(o => o.n)]])
    mc.count = cespugli.length; ms.count = sassi.length
    const d = new THREE.Object3D(), col = new THREE.Color()
    cespugli.forEach((o, k) => {
      d.position.set(o.x, 0, o.z); d.rotation.set(0, o.ang, 0); d.scale.set(1.2 * o.s, 1.05 * o.s, 1.2 * o.s); d.updateMatrix()
      mc.setMatrixAt(k, d.matrix); mc.setColorAt(k, col.setHSL(0.27 + o.c * 0.06, 0.55, 0.26 + o.c * 0.12))
    })
    sassi.forEach((o, k) => {
      d.position.set(o.x, 0.15, o.z); d.rotation.set(o.c * 2, o.ang, 0); d.scale.set(1.1 * o.s, 0.75 * o.s, 1 * o.s); d.updateMatrix()
      ms.setMatrixAt(k, d.matrix); ms.setColorAt(k, col.setHSL(0.1, 0.05, 0.5 + o.c * 0.14))
    })
    for (const x of this.istanzeOstacoli) { x.castShadow = true; x.receiveShadow = true; x.frustumCulled = false; x.instanceMatrix.needsUpdate = true; if (x.instanceColor) x.instanceColor.needsUpdate = true }
    this.scena.add(mc, ms)
    for (const o of lista) if (o.tolto) this.togliOstacolo(o.n)
  }
  /** Il numero (nella lista del motore) dell'ostacolo che sta nell'istanza `k` della mesh `mesh`. */
  ostacoloDi(mesh, k) { return (this._indiceOstacoli.get(mesh) || [])[k] }
  togliOstacolo(n) {
    for (const [mesh, ns] of this._indiceOstacoli) { const k = ns.indexOf(n); if (k >= 0) { mesh.setMatrixAt(k, ZERO); mesh.instanceMatrix.needsUpdate = true } }
  }

  // i ciuffi d'erba: un gruppetto di tre fili, a istanze, su ogni cella del prato che non sia occupata (si rifanno a ogni cambio) e
  // fuori dal mondo. Ondeggiano col vento nel vertex shader: ogni ciuffo ha la sua fase, e la punta si muove più della base.
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
    // dentro il mondo: una candidata per cella (il caso la tiene o no); fuori: sparsi dove c'è il bosco
    let r = 11
    const caso = () => { r = (r * 9301 + 49297) % 233280; return r / 233280 }
    this.cespiErba = []
    for (let j = LIM.j0; j < LIM.j1; j++) for (let i = LIM.i0; i < LIM.i1; i++) {
      const tieni = caso() < 0.5, x = i + 0.15 + caso() * 0.7, z = j + 0.15 + caso() * 0.7, ang = caso() * 6.3, sc = 0.9 + caso() * 0.6, c = caso()
      if (tieni) this.cespiErba.push({ i, j, x, z, ang, sc, c, dentro: true })
    }
    for (let n = 0; n < 360; n++) {
      const x = (caso() - 0.5) * 76, z = (caso() - 0.5) * 62, ang = caso() * 6.3, sc = 1 + caso() * 0.7, c = caso()
      if (dentro(Math.floor(x), Math.floor(z))) continue
      this.cespiErba.push({ x, z, ang, sc, c, dentro: false })
    }
    const ciuffi = new THREE.InstancedMesh(geo, materiale, this.cespiErba.length)
    ciuffi.receiveShadow = true; ciuffi.frustumCulled = false
    const col = new THREE.Color()
    this.cespiErba.forEach((e, k) => ciuffi.setColorAt(k, col.setHSL(0.25 + e.c * 0.06, 0.6, 0.27 + e.c * 0.13)))
    this.scena.add(ciuffi); this.decori.erba = [ciuffi]; this.ciuffi = ciuffi
  }
  /** Un ciuffo non cresce dove sta una cosa: strada, pezzo, edificio, albero, sasso. Si rilegge a ogni cambio. */
  ridisegnaErba() {
    const d = new THREE.Object3D(), m = this.m
    this.cespiErba.forEach((e, k) => {
      const libera = !e.dentro || (!m.strada[idx(e.i, e.j)] && !m.cellaCosa[idx(e.i, e.j)] && !m.bloccoFisso[idx(e.i, e.j)] && !m.cellaEdificio[idx(e.i, e.j)])
      d.position.set(e.x, 0, e.z); d.rotation.set(0, e.ang, 0); d.scale.setScalar(libera ? e.sc : 0); d.updateMatrix(); this.ciuffi.setMatrixAt(k, d.matrix)
    })
    this.ciuffi.instanceMatrix.needsUpdate = true; this.ciuffi.instanceColor.needsUpdate = true
  }

  togliAlbero(n) { for (const x of this.istanzeAlberi) { x.setMatrixAt(n, ZERO); x.instanceMatrix.needsUpdate = true } }

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
