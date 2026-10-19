// Il terreno: l'erba, le strade (una per cella, a istanze), la griglia che si accende mentre si costruisce, i lotti non comprati
// (scuri, con cespugli e sassi), il recinto basso attorno a quelli comprati, gli alberi (a istanze: si abbattono uno alla volta
// azzerando l'istanza), i ciuffi d'erba, le nuvole e i due edifici di scena. Non sa le regole: legge dal motore cosa è tuo.
import * as THREE from 'three'
import { mat, FORME, creaFienile, creaCasa } from './modelli.js'
import { LOTTI, LIM, LOTTO, GW, GH, I0, J0, dentro, FISSI } from '../dati/mondo.js'

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
    this.nuvole = []
    this.texture = []
    this._suolo(); this._strade(); this._griglia(); this._lotti(); this._alberi(); this._nuvole(); this._fisse()
    this.ridisegnaLotti(); this.ridisegnaStrade()
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
    this.cespugli = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.4, 0), mat(0xffffff), LOTTI.length * 7)
    this.sassi = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.3, 0), mat(0x8d8d88), LOTTI.length * 3)
    for (const m of [this.velo, this.cespugli, this.sassi]) { m.frustumCulled = false; m.receiveShadow = true }
    this.cespugli.castShadow = true; this.sassi.castShadow = true
    this.cespugli.setColorAt(0, new THREE.Color())
    this.pali = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.06, 0.07, 0.7, 6).translate(0, 0.35, 0), mat(0x7a5232), 800)
    this.travi = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.07, 0.05), mat(0x93622f), 1600)
    for (const m of [this.pali, this.travi]) { m.castShadow = true; m.frustumCulled = false }
    this.scena.add(this.velo, this.cespugli, this.sassi, this.pali, this.travi)
  }
  ridisegnaLotti() {
    const d = new THREE.Object3D(), col = new THREE.Color(); let nv = 0, nb = 0, ns = 0
    for (const l of LOTTI) {
      if (this.m.posseduto(l)) continue
      d.position.set(l.i + 2, 0.05, l.j + 2); d.rotation.set(-Math.PI / 2, 0, 0); d.scale.set(1, 1, 1); d.updateMatrix(); this.velo.setMatrixAt(nv++, d.matrix)
      let r = l.a * 131 + l.b * 17 + 5
      const caso = () => { r = (r * 9301 + 49297) % 233280; return r / 233280 }
      for (let k = 0; k < 7; k++) {
        d.position.set(l.i + 0.4 + caso() * 3.2, 0.25, l.j + 0.4 + caso() * 3.2); d.rotation.set(0, caso() * 6, 0); d.scale.setScalar(0.6 + caso() * 0.8); d.updateMatrix()
        this.cespugli.setMatrixAt(nb, d.matrix); this.cespugli.setColorAt(nb, col.setHSL(0.3, 0.5, 0.18 + caso() * 0.12)); nb++
      }
      for (let k = 0; k < 3; k++) { d.position.set(l.i + 0.4 + caso() * 3.2, 0.14, l.j + 0.4 + caso() * 3.2); d.rotation.set(0, caso() * 6, 0); d.scale.set(1, 0.7, 1); d.updateMatrix(); this.sassi.setMatrixAt(ns++, d.matrix) }
    }
    this.velo.count = nv; this.cespugli.count = nb; this.sassi.count = ns
    for (const x of [this.velo, this.cespugli, this.sassi]) x.instanceMatrix.needsUpdate = true
    this.cespugli.instanceColor.needsUpdate = true
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
    // ciuffi d'erba nella parte selvatica
    let r = 11
    const caso = () => { r = (r * 9301 + 49297) % 233280; return r / 233280 }
    const ciuffi = new THREE.InstancedMesh(FORME.ciuffo, mat(0x4f9a2c), 500)
    for (let n = 0; n < 500; n++) {
      const x = (caso() - 0.5) * 70, z = (caso() - 0.5) * 56
      d.position.set(x, 0, z); d.rotation.set(0, caso() * 6, (caso() - 0.5) * 0.4)
      d.scale.setScalar(dentro(Math.floor(x), Math.floor(z)) ? 0 : 0.7 + caso() * 0.8); d.updateMatrix(); ciuffi.setMatrixAt(n, d.matrix)
    }
    this.scena.add(ciuffi); this.decori.erba = [ciuffi]
  }
  togliAlbero(n) { for (const x of this.istanzeAlberi) { x.setMatrixAt(n, ZERO); x.instanceMatrix.needsUpdate = true } }

  // nuvole piatte che scorrono (nessuna ombra: solo un po' di vita)
  _nuvole() {
    this.gruppoNuvole = new THREE.Group(); this.scena.add(this.gruppoNuvole)
    const m = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85, fog: false })
    for (let n = 0; n < 7; n++) {
      const g = new THREE.Group()
      for (let k = 0; k < 4; k++) { const s = new THREE.Mesh(new THREE.SphereGeometry(2 + Math.random() * 1.5, 8, 6), m); s.position.set(k * 2.2 - 3, Math.random(), Math.random() * 1.5); s.scale.y = 0.5; g.add(s) }
      g.position.set((Math.random() - 0.5) * 120, 28 + Math.random() * 8, -20 - Math.random() * 40); this.gruppoNuvole.add(g); this.nuvole.push(g)
    }
  }

  // il fienile e la casa: solo di scena
  _fisse() {
    for (const f of FISSI) {
      const g = f.tipo === 'fienile' ? creaFienile() : creaCasa()
      g.position.set(f.i + f.w / 2, 0, f.j + f.d / 2); this.scena.add(g)
    }
  }

  muovi(dt) { for (const n of this.nuvole) { n.position.x += dt * 0.6; if (n.position.x > 70) n.position.x = -70 } }

  /** Accende e spegne i pezzi che pesano (le opzioni): alberi, ciuffi, nuvole. */
  applica(q) {
    for (const m of this.decori.alberi) m.visible = q.alberi
    for (const m of this.decori.erba) m.visible = q.erba
    this.gruppoNuvole.visible = q.nuvole
  }

  via() {
    for (const t of this.texture) t.dispose()
    this.scena.traverse(o => { if (o.isMesh) { o.geometry?.dispose(); const m = o.material; for (const x of Array.isArray(m) ? m : [m]) x?.dispose() } })
  }
}
