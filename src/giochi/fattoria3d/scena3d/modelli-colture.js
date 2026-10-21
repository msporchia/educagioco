// Il campo della fattoria 3D: 2×2 celle, quattro tessere, le piante a istanze (una InstancedMesh per forma, condivisa fra
// le colture). Ogni coltura è una «ricetta» che posa le sue parti attorno a ogni pianta. modelli.js ri-esporta da qui.
// Vedi docs/fattoria3d/scena.md («Le colture»).
import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { fondiPerMateriale } from './fondi.js'
import { memoModello } from './cache-modelli.js'

const cache = new Map()
function mat (colore, o = {}) {
  const k = colore + JSON.stringify(o)
  if (!cache.has(k)) cache.set(k, new THREE.MeshStandardMaterial({ color: colore, roughness: 0.9, metalness: 0, flatShading: true, ...o }))
  return cache.get(k)
}
function scatola (g, w, h, d, m, x, y, z) {
  const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.castShadow = o.receiveShadow = true; o.position.set(x, y, z); g.add(o); return o
}

// ── le forme: piccole, a facce piatte, in unità vere (o di lato 1 dove la ricetta scala) ──
const V2 = (x, y) => new THREE.Vector2(x, y)
/** Una geometria da una lista di triangoli (tre punti [x, y, z] ciascuno). */
function triangoli (punti) {
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(punti.flat(), 3)); g.computeVertexNormals(); return g
}
/** Più pezzi in una geometria sola; coi colori ai vertici se almeno un pezzo ne ha uno ([geometria, colore?]). */
function unisci (pezzi) {
  const colori = pezzi.some(([, c]) => c != null)
  const u = mergeGeometries(pezzi.map(([geo, col]) => {
    const g = geo.index ? geo.toNonIndexed() : geo.clone()
    for (const k of Object.keys(g.attributes)) if (k !== 'position') g.deleteAttribute(k)
    if (colori) {
      const c = new THREE.Color(col ?? 0xffffff), n = g.attributes.position.count, a = new Float32Array(n * 3)
      for (let i = 0; i < n; i++) a.set([c.r, c.g, c.b], i * 3)
      g.setAttribute('color', new THREE.BufferAttribute(a, 3))
    }
    return g
  }))
  u.computeVertexNormals(); return u
}
/** Foglia ovale lungo +z (lunga 1, larga ~0.84), la nervatura rialzata: sei triangoli. */
function foglia () {
  const B = [0, 0, 0], M = [0, 0.08, 0.5], giro = [B, [-0.42, 0, 0.3], [-0.36, 0, 0.72], [0, 0, 1], [0.36, 0, 0.72], [0.42, 0, 0.3]]
  return triangoli(giro.flatMap((p, i) => [p, giro[(i + 1) % giro.length], M]))
}
/** Foglietta a rombo (quattro triangoli), per le foglie composte. */
function rombo () {
  const M = [0, 0.06, 0.5], giro = [[0, 0, 0], [-0.4, 0, 0.45], [0, 0, 1], [0.4, 0, 0.45]]
  return triangoli(giro.flatMap((p, i) => [p, giro[(i + 1) % 4], M]))
}
/** Nastro: la foglia lunga del mais e del grano, sale e ricade in fuori verso +z (larga 1 al massimo). */
function nastro () {
  const file = [[0, 0, 0.3], [0.3, 0.22, 0.5], [0.46, 0.52, 0.4], [0.42, 0.82, 0.22]], punta = [0, 0.3, 1.0]
  const t = []
  for (let k = 0; k < 3; k++) {
    const [y0, z0, w0] = file[k], [y1, z1, w1] = file[k + 1]
    t.push([-w0, y0, z0], [w0, y0, z0], [-w1, y1, z1], [w0, y0, z0], [w1, y1, z1], [-w1, y1, z1])
  }
  const [y3, z3, w3] = file[3]; t.push([-w3, y3, z3], [w3, y3, z3], punta)
  return triangoli(t)
}
/** Un chicco: bipiramide a `n` lati, raggio r, mezza altezza h. */
function chicco (n, r, h) {
  const giro = Array.from({ length: n }, (_, i) => [Math.cos(i * 2 * Math.PI / n) * r, 0, Math.sin(i * 2 * Math.PI / n) * r])
  return triangoli(giro.flatMap((p, i) => { const q = giro[(i + 1) % n]; return [[0, h, 0], q, p, [0, -h, 0], p, q] }))
}
/** La spiga del grano: chicchi a coppie, una coppia di traverso all'altra, e le reste in cima. */
function spigaGrano () {
  const pezzi = [], reste = []
  for (let i = 0; i < 4; i++) {
    const y = 0.03 + i * 0.045
    for (const s of [-1, 1]) {
      const c = chicco(3, 0.018, 0.032)
      if (i % 2) c.rotateX(s * 0.35).translate(0, y, s * 0.017); else c.rotateZ(-s * 0.35).translate(s * 0.017, y, 0)
      pezzi.push([c])
      if (i) { const [x, z] = i % 2 ? [0, s * 0.02] : [s * 0.02, 0]; reste.push([x - 0.003, y + 0.02, z], [x + 0.003, y + 0.02, z], [x * 2.6, y + 0.15, z * 2.6]) }
    }
  }
  pezzi.push([chicco(3, 0.016, 0.03).translate(0, 0.215, 0)])
  reste.push([-0.003, 0.23, 0], [0.003, 0.23, 0], [0, 0.36, 0])
  pezzi.push([triangoli(reste)])
  return unisci(pezzi)
}
/** La pannocchia: chicchi gialli, tre brattee verdi aperte in cima, la barba. */
function pannocchia () {
  const pezzi = [[new THREE.LatheGeometry([V2(0.004, 0), V2(0.03, 0.025), V2(0.037, 0.09), V2(0.028, 0.17), V2(0.004, 0.21)], 6), 0xf2d23a]]
  for (let k = 0; k < 3; k++) pezzi.push([foglia().scale(0.075, 0.25, 0.17).rotateX(-Math.PI / 2).rotateY(Math.PI).rotateX(0.2).translate(0, 0, 0.028).rotateY(k * 2.1), 0x8ab84a])
  pezzi.push([new THREE.ConeGeometry(0.013, 0.05, 4).translate(0, 0.23, 0), 0x9a6a30])
  return unisci(pezzi)
}
function pennacchio () {
  const pezzi = [[new THREE.ConeGeometry(0.008, 0.18, 3).translate(0, 0.09, 0)]]
  for (let k = 0; k < 3; k++) pezzi.push([new THREE.ConeGeometry(0.006, 0.12, 3).translate(0, 0.06, 0).rotateZ(0.7).rotateY(k * 2.1).translate(0, 0.03, 0)])
  return unisci(pezzi)
}
/** La zucca: tonda schiacciata, otto spicchi, l'incavo in cima col picciolo. Di raggio ~1, la base a y 0. */
function zucca () {
  const s = new THREE.SphereGeometry(1, 16, 6), p = s.attributes.position
  for (let i = 0; i < p.count; i++) {
    const colonna = i % 17, riga = Math.floor(i / 17), spicchio = colonna % 2 ? 0.86 : 1
    p.setXYZ(i, p.getX(i) * spicchio, p.getY(i) * (riga === 0 || riga === 6 ? 0.7 : 1), p.getZ(i) * spicchio)
  }
  s.scale(1, 0.62, 1).translate(0, 0.52, 0)
  return unisci([[s, 0xf09a20], [new THREE.CylinderGeometry(0.07, 0.11, 0.3, 5).rotateZ(0.25).translate(0.03, 1.02, 0), 0x6a7a2a]])
}
/** Il calice: cinque sepali a stella che ricadono (sopra il pomodoro e la fragola, sopra la melanzana). */
function calice () {
  const C = [0, 0.05, 0], t = []
  for (let k = 0; k < 5; k++) {
    const a = k * 2 * Math.PI / 5, P = (b, r, y) => [Math.cos(b) * r, y, Math.sin(b) * r]
    t.push(C, P(a - 0.4, 0.4, 0), P(a, 1, -0.35), C, P(a, 1, -0.35), P(a + 0.4, 0.4, 0))
  }
  return triangoli(t)
}
/** La spighetta della lavanda: quattro verticilli lungo un arco che si piega verso +z (lunga 1). */
function spighetta () {
  const pezzi = []; let y = 0, z = 0
  for (let i = 0; i < 4; i++) {
    const a = 0.12 + i * 0.22, r = 0.085 - i * 0.012
    pezzi.push([chicco(3, r, 0.14).rotateX(a).translate(0, y + Math.cos(a) * 0.12, z + Math.sin(a) * 0.12)])
    y += Math.cos(a) * 0.25; z += Math.sin(a) * 0.25
  }
  return unisci(pezzi)
}

const STELO = new THREE.CylinderGeometry(0.012, 0.022, 1, 4).translate(0, 0.5, 0)          // la cipolla, com'era
const FORME = {
  stelo:     { geo: STELO },
  fusto:     { geo: new THREE.CylinderGeometry(0.5, 1, 1, 5, 1, true).translate(0, 0.5, 0) },   // raggio 1 alla base: si scala
  filo:      { geo: new THREE.CylinderGeometry(0.6, 1, 1, 3, 1, true).translate(0, 0.5, 0) },
  foglia:    { geo: foglia(), m: { side: THREE.DoubleSide } },
  trifoglio: { geo: unisci([-0.8, 0, 0.8].map(a => [rombo().scale(0.62, 1, a ? 0.85 : 1).rotateY(a)])), m: { side: THREE.DoubleSide } },
  nastro:    { geo: nastro(), m: { side: THREE.DoubleSide } },
  calice:    { geo: calice(), m: { side: THREE.DoubleSide } },
  spiga:     { geo: spigaGrano(), m: { side: THREE.DoubleSide } },
  pannocchia:{ geo: pannocchia(), m: { vertexColors: true, side: THREE.DoubleSide } },
  pennacchio:{ geo: pennacchio() },
  zucca:     { geo: zucca(), m: { vertexColors: true } },
  sfera:     { geo: new THREE.IcosahedronGeometry(1, 0) },                                     // tuberi, bulbi, il cespo della lavanda
  bacca:     { geo: new THREE.IcosahedronGeometry(1, 0), m: { roughness: 0.45 } },             // il pomodoro, lucido
  fragola:   { geo: new THREE.LatheGeometry([V2(0.002, -0.075), V2(0.02, -0.056), V2(0.033, -0.03), V2(0.026, -0.008), V2(0.002, 0)], 6), m: { roughness: 0.6 } },
  melanzana: { geo: new THREE.LatheGeometry([V2(0.002, -0.26), V2(0.034, -0.243), V2(0.051, -0.2), V2(0.052, -0.13), V2(0.036, -0.05), V2(0.002, 0)], 6), m: { roughness: 0.32, metalness: 0.08 } },
  radice:    { geo: new THREE.ConeGeometry(1, 1, 6).rotateX(Math.PI).translate(0, -0.5, 0) },  // la cima a y 0, la punta giù
  spighetta: { geo: spighetta() },
}

/** Come appare ogni coltura: `h` l'altezza della pianta matura, `a`→`b` il verde da giovane a maturo, `fc` il colore del
    frutto (anche delle scintille del raccolto, mondo3d.js), `fs` la sua scala; `disp` come stanno le piante ('file': `n`
    per solco, sulle porche; 'fitto': `n`×`nz` per tessera; 'sparso': otto a caso), `v` quanto le muove il vento. La cipolla
    è rimasta com'era (`frutto`, `l`). Tempi e nomi sono di dati/colture.js. */
export const ASPETTO = {
  grano:    { h: 0.82, a: 0x5fae3a, b: 0xd9b04a, fc: 0xe6b93c, fs: 1,   disp: 'fitto', n: 5, nz: 4, v: 1 },
  carota:   { h: 0.24, a: 0x4aa83a, b: 0x4aa83a, fc: 0xf08a24, fs: 1,   disp: 'file', n: 5, v: 0.5 },
  mais:     { h: 1.25, a: 0x4f9a3a, b: 0x7a9a3a, fc: 0xf2d23a, fs: 1,   disp: 'file', n: 3, v: 0.6 },
  pomodoro: { h: 0.85, a: 0x3f8a34, b: 0x3f8a34, fc: 0xd8352a, fs: 1,   disp: 'file', n: 2, v: 0.25 },
  zucca:    { h: 0.3,  a: 0x4f9a3a, b: 0x5a9a3a, fc: 0xf09a20, fs: 1,   disp: 'file', n: 2, v: 0 },
  patata:   { h: 0.3,  a: 0x2f7a34, b: 0x5a7a2c, fc: 0xe6c065, fs: 1,   disp: 'file', n: 3, v: 0.3 },
  fragola:  { h: 0.12, a: 0x3f9a3a, b: 0x3f9a3a, fc: 0xd8203a, fs: 1,   disp: 'file', n: 3, v: 0.15 },
  melanzana:{ h: 0.7,  a: 0x3f7a36, b: 0x3f7a36, fc: 0x4a1f66, fs: 1,   disp: 'file', n: 2, v: 0.3 },
  cipolla:  { h: 0.36, a: 0x7cc04a, b: 0x9ab04a, fc: 0xe8d29a, fs: 1.4, disp: 'sparso', frutto: 'terra', l: 0.8 },
  lavanda:  { h: 0.42, a: 0x6a9a5a, b: 0x7a9a6a, fc: 0x8a5ac8, fs: 1,   disp: 'file', n: 2, v: 0.7 },
  cavolfiore:   { h: 0.3,  a: 0x7a9a6c, b: 0x6f9a62, fc: 0xf3efe0, fs: 1, disp: 'file', n: 2, v: 0.1 },
  peperone:     { h: 0.5,  a: 0x3f8a34, b: 0x3f8a34, fc: 0xd8281e, fs: 1, disp: 'file', n: 2, v: 0.2 },
  aglio:        { h: 0.4,  a: 0x7cc04a, b: 0x9ab04a, fc: 0xf0ead8, fs: 1, disp: 'file', n: 4, v: 0.6 },
  barbabietola: { h: 0.3,  a: 0x4f8a3a, b: 0x5a8a40, fc: 0x8a1f4a, fs: 1, disp: 'file', n: 3, v: 0.3 },
  riso:         { h: 0.55, a: 0x8ec060, b: 0xd8c870, fc: 0xe6c85a, fs: 0.8, disp: 'file', n: 5, v: 1 },
}

// ── chi posa le parti: la pianta (P) e il pezzo attorno a lei ──
const P = new THREE.Matrix4(), L = new THREE.Matrix4(), M = new THREE.Matrix4()
const Q = new THREE.Quaternion(), E = new THREE.Euler(), V = new THREE.Vector3(), S = new THREE.Vector3()
const posa = {
  parti: null,
  /** La pianta in (x, y, z): si piega `lean` verso `yaw`, il vento la inclina di `sway`, cresce di `s`. */
  su (x, y, z, yaw = 0, sway = 0, s = 1, lean = 0) { E.set(lean, yaw, sway, 'ZYX'); P.compose(V.set(x, y, z), Q.setFromEuler(E), S.set(s, s, s)) },
  /** Un pezzo nel riferimento della pianta: ruotato (rx in avanti, poi ry attorno), scalato. Il colore è un THREE.Color. */
  metti (nome, colore, x, y, z, rx, ry, rz, sx, sy = sx, sz = sx) {
    const p = this.parti[nome]
    if (p.mesh && p.n < p.mesh.instanceMatrix.count) {
      E.set(rx, ry, rz, 'YXZ'); L.compose(V.set(x, y, z), Q.setFromEuler(E), S.set(sx, sy, sz))
      p.mesh.setMatrixAt(p.n, M.multiplyMatrices(P, L)); p.mesh.setColorAt(p.n, colore)
    }
    p.n++
  },
}
const C1 = new THREE.Color(), C2 = new THREE.Color(), C3 = new THREE.Color(), C4 = new THREE.Color()
const BIANCO = new THREE.Color(0xffffff), MARRONE = new THREE.Color(0x9a6a36), VERDE_ACERBO = new THREE.Color(0x7ab840)
const mix = (out, a, b, t) => out.set(a).lerp(C4.set(b), t)
const tra = (x, a, b) => Math.min(1, Math.max(0, (x - a) / (b - a)))
/** Quante foglie ha una pianta che cresce: una subito, tutte da metà crescita. */
const quante = (n, c) => Math.max(1, Math.ceil(n * Math.min(1, 0.3 + c * 1.4)))

/** Le ricette: (pianta, crescita 0..1, frutto 0..1, maturo 0..1, aspetto, vento). Dove serve, la pianta l'ha già posata
    `su` alla sua scala; una ricetta può riposarla (il palo dei pomodori non cresce). */
const RICETTE = {
  grano (p, c, f, m, A) {
    const verde = mix(C1, A.a, A.b, m), h = A.h * p.hj
    posa.metti('filo', verde, 0, 0, 0, 0, 0, 0, 0.012, h, 0.012)
    if (f > 0) posa.metti('spiga', mix(C2, A.a, A.fc, m), 0, h, 0, 0.12 + 0.28 * m, p.fase, 0, f * A.fs)     // matura, si china
  },
  carota (p, c, f, m, A) {
    const verde = C1.set(A.a)
    for (let k = 0; k < quante(7, c); k++) posa.metti('foglia', verde, 0, 0.02, 0, -1.0 + (k % 3) * 0.2, p.fase + k * 0.9, 0, 0.034, 0.2, 0.19 + (k % 3) * 0.03)
    if (f > 0) posa.metti('radice', C2.set(A.fc), 0, 0.075 * f, 0, 0, p.fase, 0, 0.048 * f * A.fs, 0.22, 0.048 * f * A.fs)
  },
  mais (p, c, f, m, A) {
    const verde = mix(C1, A.a, A.b, m), H = A.h * p.hj
    posa.metti('fusto', verde, 0, 0, 0, 0, 0, 0, 0.028, H, 0.028)
    for (let j = 0; j < quante(6, c); j++) {
      const lung = 0.62 - j * 0.05
      posa.metti('nastro', verde, 0, (0.08 + j * 0.14) * H, 0, 0, p.fase + (j % 2) * Math.PI + j * 0.3, 0, 0.1, lung)
    }
    if (f <= 0) return
    const velo = mix(C2, 0xb8d890, 0xffffff, m)
    for (const [y, giro] of p.i % 3 ? [[0.45, 0]] : [[0.45, 0], [0.32, Math.PI]]) {
      const yaw = p.fase + Math.PI / 2 + giro
      posa.metti('pannocchia', velo, Math.sin(yaw) * 0.03, y * H, Math.cos(yaw) * 0.03, 0.5, yaw, 0, f * A.fs)
    }
    posa.metti('pennacchio', C3.set(0xd9b36a), 0, H, 0, 0, p.fase, 0, 0.5 + 0.5 * f)
  },
  pomodoro (p, c, f, m, A, sway) {
    posa.su(p.x, p.y, p.z)                                                           // il palo: già piantato, non cresce
    posa.metti('fusto', MARRONE, 0.07, 0, 0, 0, 0, 0, 0.016, 0.92, 0.016)
    posa.su(p.x, p.y, p.z, p.fase, sway, 0.22 + 0.78 * Math.sqrt(c))
    const verde = C1.set(A.a), H = A.h
    posa.metti('fusto', verde, 0, 0, 0, 0, 0, 0, 0.02, H, 0.02)
    for (let j = 0; j < quante(8, c); j++) {
      const l = 0.17 - j * 0.007
      posa.metti('foglia', verde, 0, (0.14 + j * 0.105) * H, 0, 0.25, j * 2.4, 0, l * 0.8, l, l)
    }
    const ALTI = [0.32, 0.36, 0.5, 0.55, 0.68, 0.42, 0.62]
    ALTI.forEach((y, j) => {
      const soglia = j / ALTI.length * 0.55, g = tra(f, soglia, soglia + 0.45)
      if (g <= 0) return
      const yaw = j * 2.1 + 0.5, r = 0.05 * g * A.fs, x = Math.sin(yaw) * 0.075, z = Math.cos(yaw) * 0.075, yy = y * H - r * 0.3
      posa.metti('bacca', mix(C2, VERDE_ACERBO, A.fc, tra(f, soglia + 0.15, soglia + 0.5)), x, yy, z, 0, j, 0, r, r * 0.85, r)
      posa.metti('calice', verde, x, yy + r * 0.8, z, 0, j, 0, r * 0.75, r * 0.5, r * 0.75)
    })
  },
  zucca (p, c, f, m, A) {
    const verde = mix(C1, A.a, A.b, m)
    for (let j = 0; j < quante(6, c); j++) {
      const l = 0.27 + (j % 3) * 0.04
      posa.metti('foglia', verde, 0, 0.02 + (j % 2) * 0.04, 0, -0.25 + (j % 2) * 0.3, j * 1.05, 0, l * 1.1, l, l)
    }
    posa.metti('fusto', verde, 0, 0.02, 0, Math.PI / 2, 2.6, 0, 0.012, 0.4, 0.012)
    if (f > 0) posa.metti('zucca', mix(C2, 0x9ad070, 0xffffff, tra(f, 0.3, 1)), 0.13, 0, 0, 0, 1, 0, 0.17 * f * A.fs)
  },
  patata (p, c, f, m, A) {
    const verde = mix(C1, A.a, A.b, m)
    posa.metti('fusto', verde, 0, 0, 0, 0, 0, 0, 0.018, 0.12, 0.018)
    for (let j = 0; j < quante(8, c); j++) {
      const alta = j < 4, l = alta ? 0.13 : 0.15
      posa.metti('foglia', verde, 0, alta ? 0.11 : 0.04, 0, alta ? -0.75 : -0.15, j * Math.PI / 2 + (alta ? 0 : Math.PI / 4), 0, l * 0.75, l, l)
    }
    if (f > 0) for (let k = 0; k < 3; k++) {
      const yaw = k * 2.1 + 0.4, s = f * A.fs
      posa.metti('sfera', C2.set(A.fc), Math.sin(yaw) * 0.11, 0.005, Math.cos(yaw) * 0.11, 0, yaw, 0, 0.052 * s, 0.036 * s, 0.04 * s)
    }
  },
  fragola (p, c, f, m, A) {
    const verde = C1.set(A.a)
    for (let j = 0; j < quante(5, c); j++) posa.metti('trifoglio', verde, 0, 0.03 + (j % 2) * 0.02, 0, -0.35 - (j % 2) * 0.25, j * 1.26, 0, 0.13)
    const n = p.i % 2 ? 2 : 3
    for (let k = 0; k < n; k++) {
      const soglia = k * 0.2, g = tra(f, soglia, soglia + 0.5)
      if (g <= 0) continue
      const yaw = 0.6 + k * 2.1, x = Math.sin(yaw) * 0.08, z = Math.cos(yaw) * 0.08, s = g * 1.3 * A.fs
      posa.metti('fragola', mix(C2, 0xe4eeb0, A.fc, tra(f, soglia + 0.1, soglia + 0.55)), x, 0.05, z, -0.85, yaw, 0, s)
      posa.metti('calice', verde, x, 0.05, z, -0.85, yaw, 0, 0.026 * s, 0.03 * s, 0.026 * s)
    }
  },
  melanzana (p, c, f, m, A) {
    const verde = C1.set(A.a), H = A.h
    posa.metti('fusto', C3.set(0x4a5a34), 0, 0, 0, 0, 0, 0, 0.022, H, 0.022)
    for (let j = 0; j < quante(9, c); j++) {
      const l = 0.24 - j * 0.01
      posa.metti('foglia', verde, 0, (0.14 + j * 0.095) * H, 0, 0.12 + (j % 2) * 0.15, j * 2.4, 0, l * 0.72, l, l)
    }
    const ALTI = p.i % 2 ? [0.62, 0.5] : [0.62, 0.5, 0.72]
    ALTI.forEach((y, k) => {
      const soglia = k * 0.2, g = tra(f, soglia, soglia + 0.5)
      if (g <= 0) return
      const yaw = 0.9 + k * 2.3, x = Math.sin(yaw) * 0.075, z = Math.cos(yaw) * 0.075, yy = y * H, s = g * A.fs
      posa.metti('fusto', C3, x, yy, z, 0, 0, 0, 0.008, 0.07, 0.008)
      posa.metti('melanzana', mix(C2, 0xa07ac0, A.fc, tra(f, soglia, soglia + 0.6)), x, yy, z, -0.3, yaw, 0, s)
      posa.metti('calice', verde, x, yy, z, -0.3, yaw, 0, 0.05 * s, 0.09 * s, 0.05 * s)
    })
  },
  lavanda (p, c, f, m, A) {
    const verde = mix(C1, A.a, A.b, m), spiga = mix(C2, A.a, A.fc, f)
    posa.metti('sfera', C3.set(0x56804a), 0, 0.005, 0, 0, p.fase, 0, 0.075, 0.035, 0.075)
    const fiore = c > 0.3 ? 0.4 + 0.6 * tra(c, 0.3, 0.8) : 0
    for (let k = 0; k < 8; k++) {
      const yaw = k * 0.785 + (k % 2) * 0.2, lean = 0.12 + 0.28 * ((k * 5) % 4) / 3, l = A.h * (0.85 + 0.15 * ((k * 3) % 4) / 3)
      posa.metti('filo', verde, 0, 0.02, 0, lean, yaw, 0, 0.007, l, 0.007)
      if (fiore) posa.metti('spighetta', spiga, Math.sin(yaw) * Math.sin(lean) * l, 0.02 + Math.cos(lean) * l, Math.cos(yaw) * Math.sin(lean) * l, lean, yaw, 0, 0.22 * fiore * A.fs)
    }
  },
  cavolfiore (p, c, f, m, A) {                                        // rosetta di foglie grandi, la testa bianca nel mezzo
    const verde = mix(C1, A.a, A.b, m)
    for (let j = 0; j < quante(8, c); j++) {
      const l = 0.27 - (j % 2) * 0.04
      posa.metti('foglia', verde, 0, 0.02 + (j % 2) * 0.03, 0, -0.95 + (j % 3) * 0.12 + (1 - f) * 0.15, j * 0.785 + p.fase, 0, l * 0.9, l, l)
    }
    if (f <= 0) return
    const s = f * A.fs, testa = mix(C2, 0xa8c890, A.fc, tra(f, 0.2, 0.8))
    posa.metti('sfera', testa, 0, 0.1 + 0.03 * s, 0, 0, p.fase, 0, 0.09 * s, 0.07 * s, 0.09 * s)
    for (let k = 0; k < 3; k++) {                                       // i cimini sulla testa
      const yaw = k * 2.1 + p.fase
      posa.metti('sfera', testa, Math.sin(yaw) * 0.05 * s, 0.13 + 0.03 * s, Math.cos(yaw) * 0.05 * s, 0, yaw, 0, 0.045 * s, 0.04 * s, 0.045 * s)
    }
  },
  peperone (p, c, f, m, A) {                                          // arbusto con i frutti penduli: rossi, gialli o ancora verdi
    const verde = C1.set(A.a), H = A.h
    posa.metti('fusto', C3.set(0x4a6a34), 0, 0, 0, 0, 0, 0, 0.02, H, 0.02)
    for (let j = 0; j < quante(8, c); j++) {
      const l = 0.18 - j * 0.006
      posa.metti('foglia', verde, 0, (0.18 + j * 0.1) * H, 0, 0.3 + (j % 2) * 0.15, j * 2.4, 0, l * 0.7, l, l)
    }
    const ALTI = p.i % 2 ? [0.55, 0.42] : [0.55, 0.42, 0.68]
    ALTI.forEach((y, k) => {
      const soglia = k * 0.2, g = tra(f, soglia, soglia + 0.5)
      if (g <= 0) return
      const yaw = 0.7 + k * 2.3, x = Math.sin(yaw) * 0.07, z = Math.cos(yaw) * 0.07, yy = y * H, s = g * A.fs
      posa.metti('melanzana', mix(C2, 0x5a9a34, (p.i + k) % 2 ? 0xf0b81e : A.fc, tra(f, soglia, soglia + 0.6)), x, yy, z, -0.15, yaw, 0, 1.5 * s, 0.85 * s, 1.5 * s)
      posa.metti('calice', verde, x, yy, z, -0.15, yaw, 0, 0.06 * s, 0.09 * s, 0.06 * s)
    })
  },
  aglio (p, c, f, m, A) {                                             // steli sottili, il bulbo bianco a fior di terra
    const verde = mix(C1, A.a, A.b, m)
    for (let j = 0; j < quante(4, c); j++) {
      const lean = 0.08 + (j % 2) * 0.16
      posa.metti('filo', verde, 0, 0.02, 0, lean, j * 1.6 + p.fase, 0, 0.009, A.h * (0.75 + 0.25 * ((j * 3) % 4) / 3), 0.009)
    }
    if (f > 0) posa.metti('sfera', mix(C2, 0xdde8c0, A.fc, tra(f, 0.2, 0.9)), 0, 0.02, 0, 0, p.fase, 0, 0.055 * f * A.fs, 0.042 * f * A.fs, 0.055 * f * A.fs)
  },
  barbabietola (p, c, f, m, A) {                                      // ciuffo di foglie sui piccioli rossi, la radice viola-rosa che spunta
    const verde = mix(C1, A.a, A.b, m)
    for (let j = 0; j < quante(5, c); j++) {
      const yaw = j * 1.26 + p.fase, lean = 0.35 + (j % 2) * 0.15
      posa.metti('filo', C3.set(0xb02a40), 0, 0.03, 0, lean, yaw, 0, 0.009, 0.12, 0.009)
      posa.metti('foglia', verde, Math.sin(yaw) * 0.045, 0.14, Math.cos(yaw) * 0.045, -0.7 + (j % 2) * 0.25, yaw, 0, 0.12, 0.2, 0.19)
    }
    if (f > 0) posa.metti('sfera', mix(C2, 0xc87a8c, A.fc, tra(f, 0.2, 0.9)), 0, 0.02 + 0.015 * f, 0, 0, p.fase, 0, 0.06 * f * A.fs, 0.052 * f * A.fs, 0.06 * f * A.fs)
  },
  riso (p, c, f, m, A, sway) {                                        // un campo sott'acqua: la lastra azzurra sotto, i culmi chiari che si piegano
    if (p.i % (2 * A.n) === 0) {                                      // una lastra per tessera, a coordinate del campo
      posa.su(0, 0, 0)
      posa.metti('sfera', C3.set(0x6fb0cc), p.k % 2 ? 0.5 : -0.5, 0.12, p.k < 2 ? -0.5 : 0.5, 0, 0, 0, 0.47, 0.03, 0.47)
    }
    posa.su(p.x, p.y, p.z, p.fase, sway, 0.22 + 0.78 * Math.sqrt(c))
    const verde = mix(C1, A.a, A.b, m)
    for (let j = 0; j < quante(3, c); j++) {
      const lean = 0.1 + j * 0.12
      posa.metti('filo', verde, 0, 0.01, 0, lean, j * 2.1 + p.fase, 0, 0.007, A.h * p.hj, 0.007)
      if (f > 0 && j < 2) posa.metti('spiga', mix(C2, A.a, A.fc, m), Math.sin(j * 2.1 + p.fase) * Math.sin(lean) * A.h * p.hj, 0.01 + Math.cos(lean) * A.h * p.hj, Math.cos(j * 2.1 + p.fase) * Math.sin(lean) * A.h * p.hj, 0.7 * m + 0.1, j * 2.1 + p.fase, 0, f * A.fs)
    }
  },
  cipolla (p, c, f, m, A, sway) {                                     // com'era: lo stelo e il bulbo, a coordinate del campo
    posa.su(0, 0, 0)
    const h = 0.1 + (A.h - 0.1) * Math.sqrt(c)
    posa.metti('stelo', mix(C1, A.a, A.b, m), p.x, 0.1, p.z, 0, 0, sway, A.l, h, A.l)
    if (f > 0) posa.metti('sfera', C2.set(A.fc), p.x, 0.1 + f * 0.03, p.z, 0, p.fase, 0, 0.07 * f * A.fs, 0.07 * f * A.fs * 0.8, 0.07 * f * A.fs)
  },
}
const CRESCE_DA_SE = new Set(['pomodoro', 'cipolla', 'riso'])                  // queste si posano da sole

/** Dove stanno le piante. 'sparso' è la vecchia disposizione (otto a caso per tessera, lo stesso caso di prima). */
function disponi (disp, n, nz, seme) {
  const pos = []
  let r = disp === 'sparso' ? seme * 9301 + 49297 : seme * 7919 + 104729
  const caso = () => { r = (r * 9301 + 49297) % 233280; return r / 233280 }
  for (let k = 0; k < 4; k++) {
    const cx = (k % 2 ? 0.5 : -0.5), cz = (k < 2 ? -0.5 : 0.5)
    const metti = (x, z, y) => pos.push({ x, z, y, k, i: pos.length, fase: caso() * 6.28, hj: 0.88 + caso() * 0.22, lean: (caso() - 0.5) * 0.22 })
    if (disp === 'sparso') for (let a = 0; a < 8; a++) pos.push({ x: cx + (caso() - 0.5) * 0.78, z: cz + (caso() - 0.5) * 0.78, k, i: pos.length, fase: caso() * 6.28 })
    else if (disp === 'fitto') {
      for (let i = 0; i < n; i++) for (let j = 0; j < nz; j++) metti(cx - 0.5 + (i + 0.5 + (caso() - 0.5) * 0.7) / n, cz - 0.5 + (j + 0.5 + (caso() - 0.5) * 0.7) / nz, 0.1)
    } else for (const dz of [-0.25, 0.25]) for (let i = 0; i < n; i++) metti(cx - 0.5 + (i + 0.5) / n + (caso() - 0.5) * 0.03, cz + dz + (caso() - 0.5) * 0.02, 0.155)
  }
  return pos
}
function posizioni (st, A) {
  const k = `${A.disp}${A.n || 0}x${A.nz || 0}`
  return st.disp[k] || (st.disp[k] = disponi(A.disp, A.n, A.nz || A.n, st.seme))
}

function posaTutto (parti, disp, crescita, t, coltura, vento) {
  const A = ASPETTO[coltura] || ASPETTO.grano, ricetta = RICETTE[coltura] || RICETTE.grano
  for (const p of Object.values(parti)) p.n = 0
  posa.parti = parti
  for (const p of disp) {
    const c = crescita[p.k]
    if (!(c >= 0)) continue
    const sway = vento ? (Math.sin(t * 1.9 + p.fase) * 0.11 + Math.sin(t * 0.8 + p.x * 2.2) * 0.07) * (0.3 + c) : 0   // ~10° alla punta di un campo maturo
    const f = c > 0.55 ? Math.min(1, (c - 0.55) / 0.4) : 0, m = tra(c, 0.62, 1)
    if (!CRESCE_DA_SE.has(coltura)) posa.su(p.x, p.y, p.z, p.fase, sway * (A.v ?? 1), 0.22 + 0.78 * Math.sqrt(c), (p.lean || 0) * (A.disp === 'fitto' ? 1 : 0.3))
    ricetta(p, c, f, m, A, sway * (A.v ?? 1))
  }
}

/** Quante istanze servono al massimo per forma: si prova ogni coltura matura, una volta sola. */
let massimi = null
function contaMassimi () {
  if (massimi) return massimi
  massimi = {}
  for (const k of Object.keys(ASPETTO)) {
    const parti = Object.fromEntries(Object.keys(FORME).map(n => [n, { n: 0 }]))
    const A = ASPETTO[k]
    posaTutto(parti, disponi(A.disp, A.n, A.nz || A.n, 1), [1, 1, 1, 1], 0, k, false)
    for (const [n, p] of Object.entries(parti)) massimi[n] = Math.max(massimi[n] || 0, p.n)
  }
  return massimi
}

/** La terra e il bordo di legno: nove scatole fisse, fuse in una o due mesh e fatte una volta sola per tutti i campi. */
const terraDelCampo = memoModello('campo-terra', () => {
  const g = new THREE.Group()
  scatola(g, 2, 0.1, 2, mat(0x6e4a2a), 0, 0.05, 0)
  for (const z of [-0.75, -0.25, 0.25, 0.75]) scatola(g, 1.84, 0.07, 0.17, mat(0x553720), 0, 0.12, z)
  const legno = mat(0x9a6a36)
  scatola(g, 2.1, 0.17, 0.08, legno, 0, 0.085, 1.0); scatola(g, 2.1, 0.17, 0.08, legno, 0, 0.085, -1.0)
  scatola(g, 0.08, 0.17, 2.1, legno, 1.0, 0.085, 0); scatola(g, 0.08, 0.17, 2.1, legno, -1.0, 0.085, 0)
  fondiPerMateriale(g)
  return g
})
/** Il campo: la terra in cache (geometrie condivise) e le piante a istanze, che sono sue (matrici e colori a ogni campo). */
export function creaCampo (seme = 1) {
  const g = terraDelCampo()
  const parti = {}
  for (const [nome, max] of Object.entries(contaMassimi())) {
    if (!max) continue
    const m = new THREE.InstancedMesh(FORME[nome].geo, mat(0xffffff, FORME[nome].m), max)
    m.castShadow = true; m.frustumCulled = false; m.setColorAt(0, BIANCO); m.count = 0; m.visible = false
    g.add(m); parti[nome] = { mesh: m, n: 0 }
  }
  g.userData.grano = { parti, seme, disp: {} }
  return g
}
/** crescita: quattro numeri, -1 = vuota, 0..1 = cresce (1 = matura). `vento` false = niente ondeggio. */
export function aggiornaCampo (g, crescita, t, coltura = 'grano', vento = true) {
  const st = g.userData.grano
  posaTutto(st.parti, posizioni(st, ASPETTO[coltura] || ASPETTO.grano), crescita, t, coltura, vento)
  for (const { mesh: m, n } of Object.values(st.parti)) {
    m.count = n; m.visible = n > 0
    if (!n) continue
    for (const a of [m.instanceMatrix, m.instanceColor]) { a.clearUpdateRanges(); a.addUpdateRange(0, n * a.itemSize); a.needsUpdate = true }
  }
}
