// Le staccionate e i cancelli: due banchi di istanze soltanto (scatole e sfere di tinta propria per istanza), qualunque sia il tipo. Una staccionata sta in una
// cella: un palo al centro e, verso ogni vicina dello stesso tipo (dati/tessere.js), un tratto che arriva al bordo, così le file, gli angoli e le T si
// raccordano da sole e gli estremi hanno il palo. Il cancello è lo stesso pezzo con due pali alti e un'anta aperta: si vede che ci si passa.
// Peso: non cresce con la fattoria (finestra di lotti e `CAPACITA_STACCIONATE`). Vedi docs/fattoria3d/staccionate.md e istanze.md.
import * as THREE from 'three'
import { cellaDa, chiave } from '../dati/mondo.js'
import { viciniDi, caso, LATI } from '../dati/tessere.js'

/** Quante istanze al massimo (il peso è questo, qualunque sia l'estensione). */
export const CAPACITA_STACCIONATE = { scatole: 16000, sfere: 5000 }

const LEGNO = new THREE.Color('#8a5a33'), LEGNO_CHIARO = new THREE.Color('#a8744a'), BIANCO = new THREE.Color('#f5f1e8'), FERRO = new THREE.Color('#4d4a46')
const FILO = new THREE.Color('#c9c6bd'), PALO_FILO = new THREE.Color('#7a5c40'), PIETRA = new THREE.Color('#a39b8c'), SIEPE = new THREE.Color('#477f33')

/** Il disegno delle staccionate. `motore` dà `staccionata` (Map cella → { tipo, cancello }); `dentroFinestra(i, j)` dice cosa ridisegnare. */
export class Staccionate {
  constructor(scena, motore, dentroFinestra) {
    this.m = motore; this.dentro = dentroFinestra
    const bianco = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 })
    this.scatole = this._banco(scena, new THREE.BoxGeometry(1, 1, 1), bianco, CAPACITA_STACCIONATE.scatole)
    this.sfere = this._banco(scena, new THREE.IcosahedronGeometry(1, 1), bianco, CAPACITA_STACCIONATE.sfere)
    this.banchi = [this.scatole, this.sfere]
    this._d = new THREE.Object3D(); this._c = new THREE.Color()
  }

  _banco(scena, geo, mat, cap) {
    const m = new THREE.InstancedMesh(geo, mat, cap)
    m.frustumCulled = false; m.count = 0; m.castShadow = false; m.receiveShadow = true
    m.setColorAt(0, new THREE.Color()); scena.add(m)
    return m
  }

  /** Un'istanza: centro (x, y, z), giro attorno a y, dimensioni (sx, sy, sz), colore con una variazione `v` (0..1) di chiaro/scuro. */
  _metti(banco, x, y, z, giro, sx, sy, sz, colore, v = 0.5) {
    const n = banco.count; if (n >= banco.instanceMatrix.count) return
    const d = this._d
    d.position.set(x, y, z); d.rotation.set(0, giro, 0); d.scale.set(sx, sy, sz); d.updateMatrix()
    banco.setMatrixAt(n, d.matrix)
    const t = 0.9 + v * 0.2
    banco.setColorAt(n, this._c.copy(colore).multiplyScalar(t)); banco.count = n + 1
  }
  /** Una scatola che parte dal suolo: `y0` il basso, `h` l'altezza. */
  _scatola(x, y0, z, giro, lung, h, spess, colore, v) { this._metti(this.scatole, x, y0 + h / 2, z, giro, lung, h, spess, colore, v) }

  ridisegna() {
    for (const b of this.banchi) b.count = 0
    const m = this.m
    const aspettoDi = (i, j) => m.staccionata.get(chiave(i, j)) || null
    for (const [k, a] of m.staccionata) {
      const [i, j] = cellaDa(k)
      if (!this.dentro(i, j)) continue
      const v = viciniDi(aspettoDi, UNISCE, i, j)
      if (a.cancello) this._cancello(a.tipo, i, j, v)
      else this._pezzo(a.tipo, i, j, v)
    }
    for (const b of this.banchi) { b.instanceMatrix.needsUpdate = true; if (b.instanceColor) b.instanceColor.needsUpdate = true }
  }

  /** I tratti verso i lati uniti: `fa(s, x, z, giro, di, dj)` per ognuno (centro del mezzo tratto, lungo 0,5; giro per metterlo lungo il lato). */
  _tratti(i, j, v, fa) {
    for (let s = 0; s < 4; s++) {
      if (v.lati[s] !== 'unito') continue
      const [di, dj] = LATI[s]
      fa(s, i + 0.5 + di * 0.25, j + 0.5 + dj * 0.25, di ? 0 : Math.PI / 2, di, dj)
    }
  }

  _pezzo(tipo, i, j, v) {
    const cx = i + 0.5, cz = j + 0.5, R = (s, k) => caso(i, j, s * 31 + k)
    if (tipo === 'legno') {
      this._scatola(cx, 0, cz, 0, 0.09, 0.42, 0.09, LEGNO, R(0, 0))
      this._tratti(i, j, v, (s, x, z, giro) => { for (const y of [0.12, 0.27]) this._scatola(x, y, z, giro, 0.52, 0.06, 0.035, LEGNO_CHIARO, R(s, y * 10)) })
    } else if (tipo === 'bianco') {
      this._scatola(cx, 0, cz, 0, 0.1, 0.62, 0.1, BIANCO, R(0, 0))
      this._tratti(i, j, v, (s, x, z, giro, di, dj) => {
        for (const y of [0.15, 0.38]) this._scatola(x, y, z, giro, 0.52, 0.05, 0.03, BIANCO, R(s, y * 10))
        for (const t of [-0.15, 0.05]) this._scatola(x + (di ? t : 0), 0, z + (di ? 0 : t), giro, 0.05, 0.5, 0.025, BIANCO, R(s, t * 50 + 3))       // le assi in piedi
      })
    } else if (tipo === 'filo') {
      this._scatola(cx, 0, cz, 0, 0.05, 0.5, 0.05, PALO_FILO, R(0, 0))
      this._tratti(i, j, v, (s, x, z, giro) => { for (const y of [0.14, 0.26, 0.38]) this._scatola(x, y, z, giro, 0.52, 0.012, 0.012, FILO, R(s, y * 10)) })
    } else if (tipo === 'muretto') {
      this._scatola(cx, 0, cz, 0, 0.3, 0.4, 0.3, PIETRA, R(0, 0))
      this._tratti(i, j, v, (s, x, z, giro) => {
        this._scatola(x, 0, z, giro, 0.52, 0.2, 0.24, PIETRA, R(s, 1))
        this._scatola(x, 0.2, z, giro, 0.5, 0.14, 0.2, PIETRA, R(s, 2))
        this._scatola(x, 0.34, z, giro, 0.18, 0.04, 0.2, PIETRA, R(s, 4))        // un sasso piatto in cima
      })
    } else {                                                                              // siepe
      this._metti(this.sfere, cx, 0.24, cz, 0, 0.27, 0.27, 0.27, SIEPE, R(0, 0))
      this._tratti(i, j, v, (s, x, z, giro, di) => {
        for (const t of [-0.12, 0.12]) this._metti(this.sfere, x + (di ? t : 0), 0.24 + R(s, t * 40) * 0.04, z + (di ? 0 : t), 0, 0.23, 0.26, 0.23, SIEPE, R(s, t * 50 + 7))
      })
    }
  }

  /** Il cancello: l'asse è quello delle vicine (est-ovest, o nord-sud), due pali alti agli estremi e un'anta aperta, girata via di 70° dal palo di sinistra. */
  _cancello(tipo, i, j, v) {
    const cx = i + 0.5, cz = j + 0.5, vicineNS = v.lati[0] !== 'vuoto' || v.lati[2] !== 'vuoto', vicineEO = v.lati[1] !== 'vuoto' || v.lati[3] !== 'vuoto'
    const lungoZ = vicineNS && !vicineEO
    const colore = tipo === 'bianco' ? BIANCO : tipo === 'muretto' || tipo === 'filo' ? FERRO : LEGNO, palo = tipo === 'muretto' ? PIETRA : colore
    const pos = (a, p) => lungoZ ? [cx + p, cz + a] : [cx + a, cz + p]          // a lungo l'asse, p di traverso
    const alto = tipo === 'bianco' ? 0.72 : tipo === 'muretto' ? 0.55 : 0.62
    for (const a of [-0.44, 0.44]) { const [x, z] = pos(a, 0); this._scatola(x, 0, z, 0, tipo === 'muretto' ? 0.16 : 0.09, alto, tipo === 'muretto' ? 0.16 : 0.09, palo, caso(i, j, a > 0 ? 1 : 2)) }
    const ang = 1.2, lung = 0.78                                               // l'anta: attaccata al palo di sinistra, aperta
    const [hx, hz] = pos(-0.4, 0), ca = Math.cos(ang), sa = Math.sin(ang)
    const dirX = lungoZ ? sa : ca, dirZ = lungoZ ? ca : sa                    // (asse, traverso) → (x, z)
    const gAnta = Math.atan2(-dirZ, dirX)                                    // la rotazione che porta una scatola lunga in x lungo (dirX, dirZ)
    const alt = tipo === 'bianco' ? 0.52 : 0.46
    for (const y of [0.1, alt - 0.1]) this._scatola(hx + dirX * lung / 2, y, hz + dirZ * lung / 2, gAnta, lung, 0.06, 0.035, colore, caso(i, j, 5 + y))
    for (const q of [0.04, 0.5, 0.96]) this._scatola(hx + dirX * lung * q, 0.1, hz + dirZ * lung * q, 0, 0.04, alt - 0.1, 0.04, colore, caso(i, j, 9 + q))
    if (tipo !== 'filo' && tipo !== 'muretto') this._scatola(hx + dirX * lung / 2, alt / 2 - 0.05, hz + dirZ * lung / 2, gAnta, lung * 0.95, 0.04, 0.03, colore, 0.4)
  }
}

const UNISCE = (a, b) => a.tipo === b.tipo
