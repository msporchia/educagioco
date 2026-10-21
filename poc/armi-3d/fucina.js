// La fucina comune della collezione: copia di quella di armi.js (che non esporta niente) con in più i pezzi che pulsano
// da soli ('viva': un materiale emissivo SUO per ogni arma), i pezzi liberi con materiale proprio, le geometrie estruse
// (lame e scudi dal profilo) e i piccoli effetti (fiamme, braci, orbite, fulmini) che tornano in più armi.
import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

// ── palette ──
export const C = {
  LEGNO: 0x9a6a36, LEGNO_S: 0x6e4a26, LEGNO_C: 0xb98547, CUOIO: 0x7a4a2a, CUOIO_S: 0x4f2f1c,
  FERRO: 0x7a7e82, FERRO_S: 0x5d6166, ACCIAIO: 0xe3eaf2, ACCIAIO_S: 0xa8b4c2, ARGENTO: 0xf6fbff,
  ORO: 0xf4c542, ORO_S: 0xc8922a, OTTONE: 0xd9a441, BRONZO: 0xb9783a, RAME: 0xc86a3a,
  ROSSO: 0xc8402f, ROSSO_S: 0x8a2a22, BLU: 0x2f5fb0, BLU_S: 0x1e3a78, CREMA: 0xf1e6c8, VERDE: 0x3e8a4a, VERDE_S: 0x2a5e32,
  CIANO: 0x58e0ff, VIOLA: 0xc07cff, RUBINO: 0xff4a62,
  FUOCO: 0xff7a1a, FUOCO_C: 0xffd23a, FUOCO_R: 0xff3b1a, LAVA: 0x3a1a14, LAVA_S: 0x5a2a1c, BRACE: 0xff5a1a,
  GHIACCIO: 0xaee8ff, GHIACCIO_S: 0x6fb8e8, GHIACCIO_L: 0x9af0ff, NEVE: 0xeaf8ff,
  FULMINE: 0xfff06a, FULMINE_V: 0x8fb4ff, TUONO: 0x4a5a86, TUONO_S: 0x2c3556,
  NATURA: 0x7ff06a, FOGLIA: 0x4aa84a, FOGLIA_S: 0x2f7a3a, CORTECCIA: 0x6a4a2e, FIORE: 0xff9ac8,
  OMBRA: 0x3a2c5c, OMBRA_S: 0x241a3c, OMBRA_M: 0x54408a, OMBRA_L: 0xb26cff,
  LUCE: 0xfff2b0, ARCANO: 0x7a8cff, ARCANO_S: 0x3a3f9a, PORPORA: 0x7a2a8a
}

const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _v = new THREE.Vector3(), _s = new THREE.Vector3()
const SU = new THREE.Vector3(0, 1, 0)

const materiali = {
  pieno: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, metalness: 0, flatShading: true }),
  metallo: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.34, metalness: 0.42, flatShading: true }),
  oro: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.28, metalness: 0.5, flatShading: true })
}
const luci = new Map()
export function materialeLuce (hex, forza = 1.1) {
  const k = hex + ':' + forza
  if (!luci.has(k)) luci.set(k, new THREE.MeshStandardMaterial({ color: hex, emissive: hex, emissiveIntensity: forza, roughness: 0.4, metalness: 0, flatShading: true }))
  return luci.get(k)
}
const luceNuova = (hex, forza) => new THREE.MeshStandardMaterial({ color: hex, emissive: hex, emissiveIntensity: forza, roughness: 0.4, metalness: 0, flatShading: true })

// geometrie
export const sca = (w, h, d) => new THREE.BoxGeometry(w, h, d)
export const cil = (rt, rb, h, seg = 8) => new THREE.CylinderGeometry(rt, rb, h, seg)
export const con = (r, h, seg = 4) => new THREE.ConeGeometry(r, h, seg)
export const sfe = (r, a = 8, b = 6) => new THREE.SphereGeometry(r, a, b)
export const ott = (r) => new THREE.OctahedronGeometry(r, 0)
export const ico = (r, d = 0) => new THREE.IcosahedronGeometry(r, d)
export const toro = (R, r, a = 6, b = 14) => new THREE.TorusGeometry(R, r, a, b)
export const PIATTA = Math.PI / 2

/** Un prisma estruso dal profilo `pts` [[x,y],…] (piano xy), spesso `prof` lungo z e centrato; smusso leggero. */
export function poli (pts, prof = 0.03, bev = 0.004) {
  const s = new THREE.Shape(pts.map(p => new THREE.Vector2(p[0], p[1])))
  const g = new THREE.ExtrudeGeometry(s, { depth: prof, bevelEnabled: bev > 0, bevelSize: bev, bevelThickness: bev, bevelSegments: 1, curveSegments: 6 })
  g.translate(0, 0, -prof / 2)
  return g
}
/** Il profilo di uno scudo: `fn(t)` dà la larghezza a metà altezza t∈[0,1] (0 in alto, 1 in punta); n punti per lato. */
export function profiloScudo (alto, basso, fn, n = 8) {
  const dx = [], sx = []
  for (let i = 0; i <= n; i++) { const t = i / n, y = alto + (basso - alto) * t, w = fn(t); dx.push([w, y]); sx.push([-w, y]) }
  return [...dx, ...sx.reverse()]
}
/** Un cristallo a punta doppia: prisma a `seg` lati con due cappucci, alto `h` (da -h/2 a h/2). */
export function cristallo (r, h, seg = 5, cap = 0.3) {
  const a = new THREE.CylinderGeometry(r, r, h * (1 - 2 * cap), seg, 1, true).toNonIndexed()
  const su = new THREE.ConeGeometry(r, h * cap, seg).toNonIndexed(), giu = new THREE.ConeGeometry(r, h * cap, seg).toNonIndexed()
  su.translate(0, h * (0.5 - cap / 2), 0); giu.rotateX(Math.PI); giu.translate(0, -h * (0.5 - cap / 2), 0)
  const l = [a, su, giu]
  for (const g of l) { g.deleteAttribute('uv'); if (g.groups) g.clearGroups() }
  return mergeGeometries(l)
}

/** Il cantiere dell'arma: si posano i pezzi, poi `chiudi()` fa una mesh per materiale. */
export class Fucina {
  constructor () { this.liste = new Map(); this.liberi = []; this.vive = [] }
  /** `tipo`: 'pieno' | 'metallo' | 'oro' (colori nei vertici), 'luce' (emissivo condiviso), 'viva' (emissivo SUO, pulsa da solo). */
  metti (geo, colore, x = 0, y = 0, z = 0, { rx = 0, ry = 0, rz = 0, s = null } = {}, tipo = 'pieno') {
    const g = geo.index ? geo.toNonIndexed() : geo.clone()
    _m.compose(_v.set(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz)), s ? _s.set(...s) : _s.set(1, 1, 1))
    g.applyMatrix4(_m)
    for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal') g.deleteAttribute(k)
    g.computeVertexNormals()
    let chiave = tipo
    if (tipo === 'luce' || tipo === 'viva') chiave = tipo + ':' + colore
    else {
      const n = g.attributes.position.count, c = new THREE.Color(colore), a = new Float32Array(n * 3)
      for (let i = 0; i < n; i++) { a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b }
      g.setAttribute('color', new THREE.BufferAttribute(a, 3))
    }
    if (!this.liste.has(chiave)) this.liste.set(chiave, [])
    this.liste.get(chiave).push(g)
    geo.dispose()
    return this
  }
  /** Un'asta da `a` a `b` (rastremata r1 → r2): lama, stelo, ramo d'arco, freccia. */
  asta (a, b, r1, r2, colore, tipo = 'pieno', seg = 6) {
    const d = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]), L = d.length()
    _q.setFromUnitVectors(SU, d.normalize()); _e.setFromQuaternion(_q)
    return this.metti(new THREE.CylinderGeometry(r2, r1, L, seg), colore, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2, { rx: _e.x, ry: _e.y, rz: _e.z }, tipo)
  }
  /** Una polilinea di aste (ramo, serpente, arco): `pts` [[x,y,z],…], raggio da r1 a r2 lungo il percorso. */
  fila (pts, r1, r2, colore, tipo = 'pieno', seg = 6) {
    const n = pts.length - 1
    for (let i = 0; i < n; i++) this.asta(pts[i], pts[i + 1], r1 + (r2 - r1) * i / n, r1 + (r2 - r1) * (i + 1) / n, colore, tipo, seg)
    return this
  }
  /** Un pezzo che si muove da solo: mesh a parte con materiale SUO (si può animare senza toccare le altre armi). */
  libero (geo, hex, x, y, z, forza = 1.2) {
    const m = new THREE.Mesh(geo, luceNuova(hex, forza)); m.position.set(x, y, z); m.castShadow = false
    m.userData.forza = forza
    this.liberi.push(m); return m
  }
  /** Un'asta libera da `a` a `b` (lampi, fili). */
  astaLibera (a, b, r, hex, forza = 1.6) {
    const d = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]), L = d.length()
    const m = this.libero(new THREE.CylinderGeometry(r, r, L, 4), hex, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2, forza)
    m.quaternion.setFromUnitVectors(SU, d.normalize()); return m
  }
  chiudi (offset = [0, 0, 0]) {
    const g = new THREE.Group(), dentro = new THREE.Group(); dentro.position.set(...offset); g.add(dentro)
    let tri = 0
    const vive = []
    for (const [chiave, lista] of this.liste) {
      const geo = mergeGeometries(lista); for (const x of lista) x.dispose()
      let mat
      if (chiave.startsWith('luce:')) mat = materialeLuce(Number(chiave.slice(5)))
      else if (chiave.startsWith('viva:')) { mat = luceNuova(Number(chiave.slice(5)), 1.1); vive.push(mat) }
      else mat = materiali[chiave]
      const m = new THREE.Mesh(geo, mat)
      const luce = chiave.startsWith('luce') || chiave.startsWith('viva')
      m.castShadow = true; m.receiveShadow = !luce; dentro.add(m)
      tri += geo.attributes.position.count / 3
    }
    for (const l of this.liberi) { dentro.add(l); tri += (l.geometry.index ? l.geometry.index.count : l.geometry.attributes.position.count) / 3 }
    g.userData.triangoli = Math.round(tri)
    g.userData.liberi = this.liberi
    g.userData.vive = vive
    g.userData.dentro = dentro
    return g
  }
}

// ── gli effetti: ognuno ritorna una `t => …` da comporre con `anima(...)` ──
/** Compone più animazioni in una. */
export const anima = (...fn) => t => { for (const f of fn) f(t) }
/** Le luci 'vive' di un'arma respirano (solo le sue). */
export function respira (g, vel = 3, amp = 0.5, base = 1.2, fase = 0) {
  return t => { const k = base + amp * Math.sin(t * vel + fase); for (const m of g.userData.vive) m.emissiveIntensity = k }
}
const hash = i => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x) }
/** Fiamme: coni liberi che guizzano, con la base nei punti `basi` [[x,y,z],…]. */
export function fiamme (f, basi, { h = 0.18, r = 0.05, col = [C.FUOCO, C.FUOCO_C, C.FUOCO_R], vel = 7 } = {}) {
  const l = basi.map((b, i) => {
    const m = f.libero(con(r * (0.8 + 0.4 * hash(i)), h, 5), col[i % col.length], b[0], b[1] + h / 2, b[2], 1.4)
    return { m, b, i }
  })
  return t => { for (const { m, b, i } of l) {
    const k = 0.7 + 0.5 * Math.abs(Math.sin(t * vel + i * 1.9)) + 0.15 * Math.sin(t * vel * 2.3 + i)
    m.scale.set(1 - 0.12 * (k - 1), k, 1 - 0.12 * (k - 1)); m.position.set(b[0] + 0.012 * Math.sin(t * vel * 0.8 + i * 2), b[1] + h * k / 2, b[2])
    m.rotation.z = 0.15 * Math.sin(t * vel * 0.7 + i * 3)
  } }
}
/** Braci/scintille/fiocchi che salgono (o scendono) e si spengono: `n` pezzetti nel parallelepipedo `da` → `da+area`. */
export function braci (f, hex, da, area, { n = 6, vel = 0.5, r = 0.014, sale = 0.2, geo = () => ott(1) } = {}) {
  const l = Array.from({ length: n }, (_, i) => ({ m: f.libero(geo(), hex, 0, 0, 0, 1.6), i, p: [hash(i + 1), hash(i + 7), hash(i + 13)] }))
  return t => { for (const { m, i, p } of l) {
    const u = (t * vel + i / n) % 1
    m.position.set(da[0] + p[0] * area[0] + 0.015 * Math.sin(t * 3 + i), da[1] + p[1] * area[1] + u * sale, da[2] + p[2] * area[2])
    m.scale.setScalar(r * Math.sin(u * Math.PI)); m.rotation.set(t * 2 + i, t * 1.5, 0)
  } }
}
/** Pezzetti che girano attorno a `c` su un'orbita inclinata. */
export function orbita (f, hex, centro, R, { n = 3, vel = 1.6, r = 0.03, inc = 0, geo = () => ott(r) } = {}) {
  const l = Array.from({ length: n }, () => f.libero(geo(), hex, 0, 0, 0, 1.3))
  return t => l.forEach((m, i) => {
    const a = t * vel + i * Math.PI * 2 / n, x = Math.cos(a) * R, z = Math.sin(a) * R
    m.position.set(centro[0] + x, centro[1] + z * Math.sin(inc), centro[2] + z * Math.cos(inc)); m.rotation.set(t * 2, t * 1.4 + i, 0)
  })
}
/** Un lampo a zig-zag da `a` a `b`, fatto di `n` aste libere; guizza a scatti. */
export function lampo (f, a, b, { n = 4, scarto = 0.05, r = 0.007, hex = C.FULMINE, seme = 1, vel = 9 } = {}) {
  const pts = [a]
  for (let i = 1; i < n; i++) { const u = i / n; pts.push([a[0] + (b[0] - a[0]) * u + (hash(seme + i) - 0.5) * 2 * scarto, a[1] + (b[1] - a[1]) * u + (hash(seme + i * 3) - 0.5) * 0.4 * scarto, a[2] + (b[2] - a[2]) * u + (hash(seme + i * 5) - 0.5) * 2 * scarto]) }
  pts.push(b)
  const aste = pts.slice(0, -1).map((p, i) => f.astaLibera(p, pts[i + 1], r, hex))
  return t => { const v = Math.sin(t * vel + seme * 2.1) > -0.15 && Math.sin(t * vel * 2.7 + seme) > -0.6; for (const m of aste) m.visible = v }
}
/** Un cristallo (o altro pezzo libero) che pulsa nella scala e nella luce. */
export function pulsaLibero (m, vel = 3, amp = 0.08, fase = 0) {
  return t => { const k = 1 + amp * Math.sin(t * vel + fase); m.scale.setScalar(k); m.material.emissiveIntensity = m.userData.forza * (1 + 0.4 * Math.sin(t * vel + fase)) }
}
