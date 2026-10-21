// Generato da strumenti/promuovi-3d.mjs da poc/armi-3d/armi.js: non si tocca a mano (si cambia il prototipo e si rilancia `npm run promuovi3d`).
// PoC: l'equipaggiamento in 3D «puro» (niente sprite): 4 famiglie × 3 gradi, tutto in codice three.js.
// Stile della fattoria 3D: pezzi uniti in una mesh per materiale (colori nei vertici, flat shading, come `Cantiere` di
// dal-sotterraneo.js), salvo le luci (materiale emissivo per colore) e i pezzi che si muovono (liberi).
// Contratto: `creaArma(famiglia, grado)` → Group con l'origine nel pugno, asse lungo +y; lo scudo ha la faccia verso +z.
// `equipaggia(contadino, { destra, sinistra })` → togli(). Autonomo: non importa niente dal gioco.
import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

// ── palette calda ──
const LEGNO = 0x9a6a36, LEGNO_S = 0x6e4a26, LEGNO_C = 0xb98547, CUOIO = 0x7a4a2a, CUOIO_S = 0x4f2f1c
const FERRO = 0x7a7e82, FERRO_S = 0x5d6166, ACCIAIO = 0xe3eaf2, ACCIAIO_S = 0xa8b4c2
const ORO = 0xf4c542, ORO_S = 0xc8922a, OTTONE = 0xd9a441
const ROSSO = 0xc8402f, BLU = 0x2f5fb0, BLU_S = 0x1e3a78, CREMA = 0xf1e6c8
const CIANO = 0x58e0ff, VIOLA = 0xc07cff, RUBINO = 0xff4a62

const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _v = new THREE.Vector3(), _s = new THREE.Vector3()
const SU = new THREE.Vector3(0, 1, 0)

// ── i materiali (condivisi): pieno e metallo coi colori nei vertici, luce con un emissivo per colore ──
const materiali = {
  pieno: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, metalness: 0, flatShading: true }),
  metallo: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.34, metalness: 0.42, flatShading: true }),
  oro: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.28, metalness: 0.5, flatShading: true })
}
const luci = new Map()
function materialeLuce (hex, forza = 1.1) {
  const k = hex + ':' + forza
  if (!luci.has(k)) luci.set(k, new THREE.MeshStandardMaterial({ color: hex, emissive: hex, emissiveIntensity: forza, roughness: 0.4, metalness: 0, flatShading: true }))
  return luci.get(k)
}

/** Il cantiere dell'arma: si posano i pezzi, poi `chiudi()` fa una mesh per materiale. */
class Fucina {
  constructor () { this.liste = new Map(); this.liberi = []; this.luci = [] }
  metti (geo, colore, x = 0, y = 0, z = 0, { rx = 0, ry = 0, rz = 0, s = null } = {}, tipo = 'pieno') {
    if (tipo === 'luce') return this._luce(geo, colore, x, y, z, rx, ry, rz, s)
    const g = geo.index ? geo.toNonIndexed() : geo.clone()
    _m.compose(_v.set(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz)), s ? _s.set(...s) : _s.set(1, 1, 1))
    g.applyMatrix4(_m)
    for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal') g.deleteAttribute(k)
    g.computeVertexNormals()
    const n = g.attributes.position.count, c = new THREE.Color(colore), a = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) { a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b }
    g.setAttribute('color', new THREE.BufferAttribute(a, 3))
    if (!this.liste.has(tipo)) this.liste.set(tipo, [])
    this.liste.get(tipo).push(g)
    geo.dispose()
    return this
  }
  _luce (geo, colore, x, y, z, rx, ry, rz, s) {
    const g = geo.index ? geo.toNonIndexed() : geo.clone()
    _m.compose(_v.set(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz)), s ? _s.set(...s) : _s.set(1, 1, 1))
    g.applyMatrix4(_m)
    for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal') g.deleteAttribute(k)
    g.computeVertexNormals()
    if (!this.liste.has('luce:' + colore)) this.liste.set('luce:' + colore, [])
    this.liste.get('luce:' + colore).push(g)
    geo.dispose()
    return this
  }
  /** Un'asta da `a` a `b` (rastremata r1 → r2): lama, stelo, ramo d'arco, freccia. */
  asta (a, b, r1, r2, colore, tipo = 'pieno', seg = 6) {
    const d = _v.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]).clone(), L = d.length()
    _q.setFromUnitVectors(SU, d.normalize()); _e.setFromQuaternion(_q)
    return this.metti(new THREE.CylinderGeometry(r2, r1, L, seg), colore, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2, { rx: _e.x, ry: _e.y, rz: _e.z }, tipo)
  }
  /** Un pezzo che si muove da solo (gemma che gira, anello): mesh a parte, in `userData.liberi`. */
  libero (geo, hex, x, y, z, forza = 1.2) {
    const m = new THREE.Mesh(geo, materialeLuce(hex, forza)); m.position.set(x, y, z); m.castShadow = true
    this.liberi.push(m); return m
  }
  chiudi (offset = [0, 0, 0]) {
    const g = new THREE.Group(), dentro = new THREE.Group(); dentro.position.set(...offset); g.add(dentro)
    let tri = 0
    for (const [tipo, lista] of this.liste) {
      const geo = mergeGeometries(lista); for (const x of lista) x.dispose()
      const luce = tipo.startsWith('luce:')
      const m = new THREE.Mesh(geo, luce ? materialeLuce(Number(tipo.slice(5))) : materiali[tipo])
      m.castShadow = true; m.receiveShadow = !luce; dentro.add(m)
      tri += geo.attributes.position.count / 3
    }
    for (const l of this.liberi) { dentro.add(l); tri += (l.geometry.index ? l.geometry.index.count : l.geometry.attributes.position.count) / 3 }
    g.userData.triangoli = Math.round(tri)
    g.userData.liberi = this.liberi
    return g
  }
}

// geometrie
const sca = (w, h, d) => new THREE.BoxGeometry(w, h, d)
const cil = (rt, rb, h, seg = 8) => new THREE.CylinderGeometry(rt, rb, h, seg)
const con = (r, h, seg = 4) => new THREE.ConeGeometry(r, h, seg)
const sfe = (r, a = 8, b = 6) => new THREE.SphereGeometry(r, a, b)
const ott = (r) => new THREE.OctahedronGeometry(r, 0)
const ico = (r, d = 0) => new THREE.IcosahedronGeometry(r, d)
const toro = (R, r, a = 6, b = 14) => new THREE.TorusGeometry(R, r, a, b)
const PIATTA = Math.PI / 2           // un cilindro con l'asse verso +z (dischi degli scudi)

// ══════════ SPADA ══════════
function spada (grado) {
  const f = new Fucina()
  if (grado === 'base') {
    f.metti(cil(0.024, 0.022, 0.17, 5), LEGNO_S, 0, -0.03, 0, { rz: 0.04 })                 // impugnatura grezza
    f.metti(ico(0.04), FERRO_S, 0, -0.13, 0, { s: [1, 0.9, 1] })                             // pomo ammaccato
    f.metti(sca(0.2, 0.035, 0.05), FERRO_S, 0, 0.065, 0, { rz: 0.07 })                      // guardia dritta
    f.metti(sca(0.09, 0.44, 0.024), FERRO, 0, 0.31, 0, { rz: 0.025 })                       // lama
    f.metti(con(0.045, 0.12, 4), FERRO, 0.003, 0.59, 0, { rz: 0.025, s: [1, 1, 0.5] })
    f.metti(sca(0.02, 0.03, 0.03), FERRO_S, 0.046, 0.4, 0)                                   // sbeccatura
    f.metti(sca(0.04, 0.05, 0.025), 0x8a5a36, -0.01, 0.2, 0.001)                             // macchia di ruggine
  } else if (grado === 'medio') {
    f.metti(cil(0.024, 0.024, 0.19, 8), CUOIO, 0, -0.035, 0)
    for (const y of [-0.09, -0.04, 0.01]) f.metti(cil(0.027, 0.027, 0.014, 8), CUOIO_S, 0, y, 0)   // fasce di cuoio
    f.metti(sfe(0.04), OTTONE, 0, -0.145, 0, {}, 'oro')                                       // pomo d'ottone
    f.metti(sca(0.07, 0.04, 0.06), ACCIAIO_S, 0, 0.075, 0, {}, 'metallo')                     // guardia curva
    for (const s of [-1, 1]) {
      f.asta([s * 0.03, 0.075, 0], [s * 0.15, 0.045, 0], 0.024, 0.017, ACCIAIO_S, 'metallo', 6)
      f.metti(sfe(0.028), OTTONE, s * 0.155, 0.04, 0, {}, 'oro')
    }
    f.metti(sca(0.12, 0.55, 0.026), ACCIAIO, 0, 0.375, 0, {}, 'metallo')                       // lama
    f.metti(sca(0.03, 0.46, 0.032), ACCIAIO_S, 0, 0.36, 0, {}, 'metallo')                     // sguscio
    f.metti(con(0.06, 0.15, 4), ACCIAIO, 0, 0.725, 0, { s: [1, 1, 0.45] }, 'metallo')
    f.metti(sca(0.013, 0.5, 0.027), 0xf8fbff, 0.06, 0.37, 0, {}, 'metallo')                   // filo
    f.metti(sca(0.013, 0.5, 0.027), 0xf8fbff, -0.06, 0.37, 0, {}, 'metallo')
  } else {
    f.metti(cil(0.025, 0.025, 0.2, 8), BLU_S, 0, -0.04, 0)
    for (const y of [-0.1, -0.04, 0.02]) f.metti(cil(0.029, 0.029, 0.014, 8), ORO, 0, y, 0, {}, 'oro')
    f.metti(ott(0.06), ORO, 0, -0.165, 0, { s: [1, 1.1, 1] }, 'oro')                          // pomo d'oro
    f.metti(ott(0.034), CIANO, 0, -0.165, 0.045, { s: [1, 1.3, 0.8] }, 'luce')               // gemma del pomo
    // guardia ad ali
    f.metti(sca(0.1, 0.06, 0.08), ORO, 0, 0.085, 0, {}, 'oro')
    f.metti(ott(0.04), RUBINO, 0, 0.085, 0.055, { s: [0.9, 1.3, 0.7] }, 'luce')
    for (const s of [-1, 1]) for (let i = 0; i < 4; i++) {                                    // la guardia a ventaglio d'ali
      f.asta([s * 0.05, 0.07, 0], [s * (0.11 + i * 0.045), 0.11 + [0.17, 0.2, 0.15, 0.08][i], 0], 0.02 - i * 0.002, 0.006, i % 2 ? ORO_S : ORO, 'oro', 4)
    }
    f.metti(sca(0.3, 0.035, 0.05), ORO, 0, 0.065, 0, {}, 'oro')
    // lama lunga, argentea, con anima luminosa e rune
    f.metti(sca(0.15, 0.68, 0.03), 0xf6fbff, 0, 0.46, 0, {}, 'metallo')
    f.metti(con(0.075, 0.22, 4), 0xf6fbff, 0, 0.9, 0, { s: [1, 1, 0.4] }, 'metallo')
    f.metti(sca(0.04, 0.6, 0.034), CIANO, 0, 0.44, 0, {}, 'luce')                           // anima
    f.metti(con(0.02, 0.14, 4), CIANO, 0, 0.84, 0, { s: [1, 1, 0.9] }, 'luce')
    for (const s of [-1, 1]) f.metti(sca(0.01, 0.72, 0.034), ORO, s * 0.078, 0.46, 0, {}, 'oro')   // filo d'oro
    for (let i = 0; i < 5; i++) {                                                             // rune a due lati dell'anima
      f.metti(sca(0.03, 0.016, 0.037), VIOLA, 0.058, 0.25 + i * 0.12, 0, { rz: 0.5 }, 'luce')
      f.metti(sca(0.03, 0.016, 0.037), VIOLA, -0.058, 0.31 + i * 0.12, 0, { rz: -0.5 }, 'luce')
    }
  }
  const g = f.chiudi()
  g.userData.anima = grado === 'super' ? t => pulsa(g, t) : null
  return g
}

// ══════════ SCUDO ══════════   (faccia verso +z, il centro sta sopra e davanti al braccio che lo regge)
function scudo (grado) {
  const f = new Fucina()
  if (grado === 'base') {
    for (let i = -2; i <= 2; i++) f.metti(sca(0.082, 0.36 - Math.abs(i) * 0.04, 0.035), i % 2 ? LEGNO : LEGNO_C, i * 0.08, 0, 0, { rz: i * 0.01 })   // assi di legno
    f.metti(sca(0.4, 0.04, 0.046), FERRO_S, 0, 0.09, 0.0, { rz: 0.03 })                      // due fasce di ferro grezzo
    f.metti(sca(0.4, 0.04, 0.046), FERRO_S, 0, -0.09, 0.0, { rz: -0.02 })
    f.metti(sfe(0.06, 7, 5), FERRO, 0, 0, 0.02, { s: [1, 1, 0.5] })                           // umbone
    f.metti(sca(0.05, 0.05, 0.06), LEGNO_S, 0, 0, -0.04)                                      // maniglia
    return f.chiudi([-0.05, 0.12, 0.13])
  }
  if (grado === 'medio') {
    f.metti(cil(0.235, 0.235, 0.05, 14), ACCIAIO_S, 0, 0, 0, { rx: PIATTA }, 'metallo')       // bordo d'acciaio
    f.metti(cil(0.19, 0.19, 0.05, 14), BLU, 0, 0, 0.01, { rx: PIATTA })      // il dietro sta dentro il bordo: coplanari sfarfallavano                      // campo dipinto
    f.metti(sca(0.06, 0.37, 0.06), CREMA, 0, 0, 0.012)                                       // croce
    f.metti(sca(0.37, 0.06, 0.06), CREMA, 0, 0, 0.012)
    f.metti(sfe(0.07, 10, 6), ACCIAIO, 0, 0, 0.03, { s: [1, 1, 0.6] }, 'metallo')             // umbone bombato
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + 0.39; f.metti(sfe(0.02, 5, 4), OTTONE, Math.cos(a) * 0.212, Math.sin(a) * 0.212, 0.03, {}, 'oro') }   // borchie
    f.metti(sca(0.05, 0.05, 0.05), CUOIO, 0, 0, -0.04)
    return f.chiudi([-0.05, 0.12, 0.14])
  }
  // super: bordo d'oro, campo blu notte, anello e gemma luminosi, quattro punte
  f.metti(cil(0.275, 0.275, 0.06, 16), ORO, 0, 0, 0, { rx: PIATTA }, 'oro')
  f.metti(cil(0.225, 0.225, 0.075, 16), BLU_S, 0, 0, 0.005, { rx: PIATTA })
  f.metti(toro(0.16, 0.012, 5, 20), CIANO, 0, 0, 0.045, {}, 'luce')
  f.metti(toro(0.215, 0.01, 5, 20), ORO, 0, 0, 0.042, {}, 'oro')
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2
    f.metti(con(0.05, 0.14, 4), ORO, Math.cos(a) * 0.3, Math.sin(a) * 0.3, 0, { rz: a - Math.PI / 2, ry: 0 }, 'oro')   // punte
    f.metti(ott(0.025), RUBINO, Math.cos(a + Math.PI / 4) * 0.215, Math.sin(a + Math.PI / 4) * 0.215, 0.05, { s: [1, 1.4, 1], rz: a + Math.PI / 4 }, 'luce')
  }
  f.metti(sfe(0.09, 10, 6), ORO, 0, 0, 0.035, { s: [1, 1, 0.55] }, 'oro')
  f.metti(ott(0.075), CIANO, 0, 0, 0.075, { s: [1, 1.25, 0.8] }, 'luce')                      // gemma grande
  // ali sopra la gemma
  for (const s of [-1, 1]) for (let i = 0; i < 3; i++) f.asta([s * 0.04, -0.02 + i * 0.012, 0.06], [s * (0.14 + i * 0.02), 0.06 + i * 0.045, 0.055], 0.012, 0.004, ORO_S, 'oro', 4)
  f.metti(sca(0.05, 0.05, 0.05), CUOIO, 0, 0, -0.04)
  const g = f.chiudi([-0.04, 0.12, 0.15])
  g.userData.anima = t => pulsa(g, t)
  return g
}

// ══════════ ARCO ══════════   (alto lungo y, il pancione verso +z, corda dietro a -z)
/** La forma del ramo: z in funzione di t = |y| / metà lunghezza (0 impugnatura, 1 punta). */
function ramoArco (grado) {
  if (grado === 'super') return t => -0.22 * t * t + 0.5 * Math.max(0, t - 0.7) ** 2 + 0.01
  return t => -0.2 * t * t
}
function arco (grado) {
  const f = new Fucina(), H = grado === 'super' ? 0.55 : 0.46, N = grado === 'base' ? 4 : 7, z = ramoArco(grado)
  const colore = grado === 'base' ? LEGNO : grado === 'medio' ? LEGNO_C : ORO
  const tipo = grado === 'super' ? 'oro' : 'pieno'
  const R0 = grado === 'base' ? 0.026 : grado === 'medio' ? 0.026 : 0.028
  for (const s of [1, -1]) {
    for (let i = 0; i < N; i++) {
      const t0 = i / N, t1 = (i + 1) / N
      const r0 = R0 * (1 - 0.5 * t0), r1 = R0 * (1 - 0.5 * t1)
      const jit = grado === 'base' ? (i % 2 ? 0.012 : -0.01) * s : 0
      f.asta([jit, s * t0 * H, z(t0)], [-jit, s * t1 * H, z(t1)], r0, r1, grado === 'medio' && i % 2 ? LEGNO : colore, tipo, 6)
      if (grado === 'medio' && i === 3) f.metti(sfe(0.022, 6, 4), OTTONE, 0, s * (t1) * H, z(t1), {}, 'oro')
    }
    const tp = [0, s * H, z(1)]
    if (grado === 'medio') f.metti(sfe(0.024, 6, 4), OTTONE, ...tp, {}, 'oro')
    if (grado === 'super') {
      f.metti(sfe(0.026, 6, 4), ORO_S, ...tp, {}, 'oro')
      f.metti(ott(0.02), CIANO, tp[0], tp[1] + s * 0.02, tp[2] + 0.025, { s: [1, 1.4, 1] }, 'luce')
      for (const t of [0.35, 0.55]) f.metti(sca(0.05, 0.02, 0.012), ORO_S, 0, s * t * H, z(t) + 0.022, { rz: s * 0.4 }, 'oro')   // alette
    }
  }
  // corda: da punta a punta, dietro
  const zc = z(1)
  f.asta([0, -H, zc], [0, H, zc], 0.005, 0.005, grado === 'super' ? CIANO : 0xe3d8b8, grado === 'super' ? 'luce' : 'pieno', 4)
  // impugnatura
  const grip = grado === 'base' ? CUOIO_S : grado === 'medio' ? CUOIO : BLU_S
  f.metti(cil(0.034, 0.034, 0.16, 7), grip, 0, 0, 0.0)
  if (grado !== 'base') for (const y of [-0.05, 0.05]) f.metti(cil(0.037, 0.037, 0.013, 7), grado === 'medio' ? CUOIO_S : ORO, 0, y, 0, {}, grado === 'medio' ? 'pieno' : 'oro')
  if (grado === 'super') f.metti(ott(0.032), RUBINO, 0, 0.0, 0.04, { s: [1, 1.3, 0.9] }, 'luce')
  // la freccia incoccata (medio e super)
  if (grado !== 'base') {
    const y0 = 0.075, za = zc, zb = 0.48
    f.asta([0, y0, za], [0, y0, zb], 0.008, 0.008, grado === 'super' ? ORO : LEGNO_C, grado === 'super' ? 'oro' : 'pieno', 5)
    f.metti(con(0.022, 0.07, 4), grado === 'super' ? CIANO : ACCIAIO_S, 0, y0, zb + 0.03, { rx: PIATTA }, grado === 'super' ? 'luce' : 'metallo')
    for (const q of [-1, 1]) { f.metti(sca(0.004, 0.04, 0.07), grado === 'super' ? VIOLA : ROSSO, 0, y0 + q * 0.017, za + 0.05, { rx: 0 }, grado === 'super' ? 'luce' : 'pieno'); f.metti(sca(0.04, 0.004, 0.07), grado === 'super' ? VIOLA : ROSSO, q * 0.017, y0, za + 0.05, {}, grado === 'super' ? 'luce' : 'pieno') }
  }
  const g = f.chiudi()
  g.userData.anima = grado === 'super' ? t => pulsa(g, t) : null
  return g
}

// ══════════ STAFFA MAGICA ══════════
function staffa (grado) {
  const f = new Fucina()
  if (grado === 'base') {
    const p = [[0, -0.34, 0], [0.015, -0.1, 0], [-0.012, 0.15, 0.01], [0.018, 0.42, 0], [-0.005, 0.7, 0.01], [0, 0.88, 0]]
    for (let i = 0; i < p.length - 1; i++) f.asta(p[i], p[i + 1], 0.032 - i * 0.002, 0.03 - i * 0.002, i % 2 ? LEGNO_S : LEGNO, 'pieno', 5)
    f.metti(sfe(0.04, 5, 4), LEGNO_S, 0.012, 0.15, 0.03, {}, 'pieno')                          // nodo
    f.asta([0, 0.86, 0], [-0.08, 1.02, 0], 0.024, 0.014, LEGNO, 'pieno', 5)                     // forca
    f.asta([0, 0.86, 0], [0.08, 1.0, 0], 0.024, 0.014, LEGNO_S, 'pieno', 5)
    f.metti(ico(0.07), 0x9aa0a4, 0.0, 0.99, 0.0, { s: [1, 1.15, 0.9] })                         // sasso nella forca
    f.metti(cil(0.034, 0.034, 0.03, 5), CUOIO_S, 0, -0.02, 0)
  } else if (grado === 'medio') {
    f.asta([0, -0.36, 0], [0, 0.95, 0], 0.03, 0.026, LEGNO_S, 'pieno', 8)
    for (const y of [-0.08, 0, 0.08]) f.metti(cil(0.035, 0.035, 0.028, 8), CUOIO, 0, y, 0)       // presa
    f.metti(con(0.03, 0.09, 6), ACCIAIO_S, 0, -0.4, 0, { rx: Math.PI }, 'metallo')              // puntale
    f.metti(cil(0.045, 0.034, 0.05, 8), ACCIAIO, 0, 0.95, 0, {}, 'metallo')                      // collare
    f.metti(toro(0.045, 0.012, 5, 10), ACCIAIO, 0, 0.6, 0, { rx: PIATTA }, 'metallo')
    for (let i = 0; i < 4; i++) {                                                                // artiglio d'acciaio
      const a = i * Math.PI / 2 + Math.PI / 4, c = Math.cos(a), s = Math.sin(a)
      f.asta([c * 0.04, 0.97, s * 0.04], [c * 0.09, 1.1, s * 0.09], 0.016, 0.009, ACCIAIO, 'metallo', 5)
      f.asta([c * 0.09, 1.1, s * 0.09], [c * 0.06, 1.2, s * 0.06], 0.009, 0.004, ACCIAIO, 'metallo', 5)
    }
    f.metti(ott(0.08), 0x4f90e8, 0, 1.1, 0, { s: [1, 1.35, 1] }, 'luce')
  } else {
    // asta d'oro attorcigliata, anelli, orbita di gemme
    for (let i = 0; i < 20; i++) {
      const y = -0.34 + i * 0.065, a = i * 0.9
      f.metti(sfe(0.034, 6, 5), i % 2 ? ORO : ORO_S, Math.cos(a) * 0.014, y, Math.sin(a) * 0.014, {}, 'oro')
    }
    f.asta([0, -0.36, 0], [0, 1.0, 0], 0.02, 0.02, 0xa9741e, 'oro', 6)
    for (const y of [-0.08, 0.02]) f.metti(cil(0.04, 0.04, 0.03, 8), BLU_S, 0, y, 0)             // presa blu notte
    f.metti(con(0.035, 0.1, 6), ORO, 0, -0.42, 0, { rx: Math.PI }, 'oro')
    f.metti(cil(0.07, 0.04, 0.07, 8), ORO, 0, 1.02, 0, {}, 'oro')
    for (let i = 0; i < 6; i++) {                                                                // corona di petali
      const a = i * Math.PI / 3, c = Math.cos(a), s = Math.sin(a)
      f.asta([c * 0.06, 1.05, s * 0.06], [c * 0.15, 1.2, s * 0.15], 0.022, 0.012, ORO, 'oro', 4)
      f.asta([c * 0.15, 1.2, s * 0.15], [c * 0.1, 1.34, s * 0.1], 0.012, 0.005, ORO_S, 'oro', 4)
      f.metti(ott(0.016), i % 2 ? CIANO : RUBINO, c * 0.1, 1.355, s * 0.1, {}, 'luce')
    }
    f.metti(toro(0.12, 0.012, 5, 18), ORO, 0, 0.78, 0, { rx: PIATTA }, 'oro')
    f.metti(ott(0.045), VIOLA, 0, 0.8, 0.12, { s: [1, 1.3, 1] }, 'luce')
    const sfera = f.libero(ico(0.115, 1), VIOLA, 0, 1.2, 0, 1.3)                                 // il globo
    const interno = f.libero(ico(0.06, 0), 0xffffff, 0, 1.2, 0, 1.0)
    const orbita = [CIANO, RUBINO, ORO].map((c, i) => f.libero(ott(0.032), c, 0, 1.2, 0, 1.2))
    const anello = f.libero(toro(0.2, 0.007, 4, 28), CIANO, 0, 1.2, 0, 1.0); anello.rotation.x = 1.25
    const g = f.chiudi()
    g.userData.anima = t => {
      pulsa(g, t)
      orbita.forEach((m, i) => { const a = t * 1.8 + i * 2.094; m.position.set(Math.cos(a) * 0.2, 1.2 + Math.sin(a * 1.3) * 0.05, Math.sin(a) * 0.2); m.rotation.y = t * 2 })
      sfera.scale.setScalar(1 + 0.06 * Math.sin(t * 3)); interno.rotation.y = t; interno.rotation.x = t * 0.7
      anello.rotation.z = t * 0.8
    }
    return g
  }
  return f.chiudi()
}

/** Il brillio dei 'super': tutte le luci respirano insieme (e l'emissivo scorre da 0.8 a 1.7). */
function pulsa (g, t) {
  const k = 1.15 + 0.55 * Math.sin(t * 3.2)
  g.traverse(o => { if (o.isMesh && o.material.emissive && o.material.emissiveIntensity > 0) o.material.emissiveIntensity = k })   // materiali condivisi per colore: va bene per un PoC
}

const COSTRUTTORI = { spada, scudo, arco, staffa }
export const FAMIGLIE = ['spada', 'scudo', 'arco', 'staffa']
export const GRADI = ['base', 'medio', 'super']

export function creaArma (famiglia, grado) {
  const c = COSTRUTTORI[famiglia]
  if (!c || !GRADI.includes(grado)) throw new Error(`arma sconosciuta: ${famiglia}/${grado}`)
  const g = c(grado)
  g.userData.famiglia = famiglia; g.userData.grado = grado
  return g
}

// ══════════ al contadino ══════════
const PUGNO = -0.29
/** `destra`/`sinistra`: un'arma già creata, o «famiglia:grado». Torna `togli()`. */
export function equipaggia (c, { destra = null, sinistra = null } = {}) {
  const br = c.userData.bracci, tolti = []
  const prima = { falce: c.userData.falce.visible, ascia: c.userData.ascia.visible }
  c.userData.falce.visible = false; c.userData.ascia.visible = false
  c.userData.perniArmi = {}
  const prendi = a => typeof a === 'string' ? creaArma(...a.split(':')) : a
  const monta = (lato, braccio, arma) => {
    if (!arma) return
    const p = new THREE.Group(); p.position.set(0, PUGNO, 0); braccio.add(p); p.add(arma)
    if (arma.userData.tipo === 'ascia') arma.rotation.y = -Math.PI / 2          // il filo dell'ascia sta su +x: va girato in avanti, se no il colpo è di piatto
    const fam = arma.userData.famiglia
    p.rotation.x = fam === 'spada' ? 1.15 : fam === 'staffa' ? 0.12 : 0       // la lama in avanti e in alto; la staffa quasi dritta; arco e scudo a riposo
    if (fam === 'spada') p.rotation.z = -0.08
    c.userData.perniArmi[lato] = p; tolti.push(p)
  }
  monta('destra', br[1], prendi(destra))
  monta('sinistra', br[0], prendi(sinistra))
  const togli = () => {
    for (const p of tolti) p.parent.remove(p)
    c.userData.falce.visible = prima.falce; c.userData.ascia.visible = prima.ascia
    delete c.userData.perniArmi
  }
  return togli
}
