// Generato da strumenti/promuovi-3d.mjs da poc/mostri-3d/bosco.js: non si tocca a mano (si cambia il prototipo e si rilancia `npm run promuovi3d`).
// Prototipo: i mostri del bosco e della brughiera in 3D (three.js). Stesso contratto di mostri.js: `crea…()` → Group coi piedi a y = 0,
// davanti verso +z, `userData.anima(t)` (a riposo) e, dove serve, `userData.attacca(p)` con p∈0..1 (posa d'attacco, da chiamare dopo anima).
import * as THREE from 'three'
import { M, mesh, sfera, rozza, scatola, cil, cono, perno, punta, liscio, onda } from './mostri.js'

const V3 = THREE.Vector3, SU = new V3(0, 1, 0), PI = Math.PI
const BUIO = 0x14100f
const lucido = (c, o = {}) => M(c, { flatShading: false, roughness: 0.25, ...o })
const lum = (c, k = 1.6, o = {}) => M(c, { emissive: c, emissiveIntensity: k, flatShading: false, ...o })

/** Un arto fra due punti (tubo che si assottiglia), con la palla del giunto solo in `b` (l'inizio lo copre il pezzo prima). */
function arto (g, a, b, r1, r2, m, seg = 6, giunto = true) {
  const A = new V3(...a), B = new V3(...b), d = B.clone().sub(A), h = d.length()
  const o = cil(g, r2, r1, h, m, 0, 0, 0, seg); o.position.copy(A).addScaledVector(d, 0.5)
  o.quaternion.setFromUnitVectors(SU, d.clone().normalize())
  if (giunto) sfera(g, r2, m, B.x, B.y, B.z, 1, 1, 1, 7)
  return o
}
/** Un occhio con iride, pupilla e riflesso. `giro`: quanto guarda di lato (rad). */
function occhio (g, x, y, z, r, iride, { emis = 0.6, fessura = false, giro = 0, pupilla = BUIO } = {}) {
  const o = perno(g, x, y, z); o.rotation.y = giro; o.userData.occhio = true
  sfera(o, r, lum(iride, emis, { roughness: 0.3 }), 0, 0, 0, 1, 1, 0.75, 12)
  sfera(o, r * 0.5, lucido(pupilla, { roughness: 0.2 }), 0, 0, r * 0.5, fessura ? 0.4 : 1, 1.05, 0.5, 8)
  sfera(o, r * 0.26, lum(0xffffff, 0.8), r * 0.3, r * 0.34, r * 0.62, 1, 1, 0.6, 6)
  return o
}
/** Una zampa a due pezzi (anca → ginocchio → piede) con zampone e artigli. */
function zampa (g, x, y, z, su, giu, r, mat, matP, claw, opz = {}) {
  const anca = perno(g, x, y, z)
  sfera(anca, r * 1.25, mat, 0, 0, 0, 1, 1.15, 1.05, 9)
  arto(anca, [0, 0, 0], su, r, r * 0.78, mat, 7)
  const gin = perno(anca, ...su)
  arto(gin, [0, 0, 0], giu, r * 0.78, r * 0.62, mat, 7)
  if (opz.ciuffi) for (let k = 0; k < 3; k++) {
    cono(anca, r * 0.5, r * 2.4, opz.ciuffi, 0, -r * (0.6 + k * 0.7), -r * 0.9, 5).rotation.x = PI + 0.45
    cono(gin, r * 0.35, r * 1.5, opz.ciuffi, 0, -r * (0.4 + k * 0.5), -r * 0.7, 4).rotation.x = PI + 0.5
  }
  const piede = perno(gin, ...giu)
  sfera(piede, r * 0.95, matP, 0, -r * 0.1, r * 0.55, 1, 0.55, 1.6, 9)
  const n = opz.dita ?? 3
  for (let k = 0; k < n; k++) {
    const kk = k - (n - 1) / 2
    cono(piede, r * 0.15, r * (opz.lungArt ?? 0.55), claw, kk * r * 0.42, -r * 0.2, r * 1.5, 4).rotation.x = PI / 2 - 0.15
  }
  return { anca, gin, piede }
}

// ── l'attacco: ogni mostro ha `userData.attacco` (tipo, durata in s, arrivo 0..1, proiettile) e `userData.attacca(p)`, p∈0..1, che dopo
// `anima(t)` sovrascrive le pose: carica (anticipazione), scatto fino a `arrivo`, rientro in guardia. A p = 0 e p = 1 non tocca niente.
// F.c = quanto è in carica, F.k = quanto è nello scatto, F.a = bocca/pinze aperte (si chiudono all'arrivo).
const fasi = (p, A) => {
  let c = liscio(0, A * 0.5, p) * (1 - liscio(A * 0.5, A, p))
  let k = liscio(A * 0.42, A, p) * (1 - liscio(Math.min(0.96, A + 0.12), 1, p))
  const a = liscio(0, A * 0.4, p) * (1 - liscio(A * 0.92, Math.min(0.99, A + 0.05), p))
  const t = c + k; if (t > 1) { c /= t; k /= t }
  return { c, k, a }
}
/** Porta v (Vector3 o Euler) verso `car` nella carica e verso `col` nello scatto (null = lascia com'è). */
const imp = (v, F, car, col) => {
  ['x', 'y', 'z'].forEach((a, i) => {
    const c0 = car?.[i], k0 = col?.[i]; if (c0 == null && k0 == null) return
    const cur = v[a]; v[a] = cur + ((c0 ?? cur) - cur) * F.c + ((k0 ?? cur) - cur) * F.k
  })
}
const apre = (o, F, val) => { o.rotation.x += (val - o.rotation.x) * F.a }
/** Un gesto che ogni `per` secondi dura `dur` secondi (0..1..0, morbido): deterministico in t. */
const gesto = (t, per, off, dur) => { const x = (((t + off) % per) + per) % per; if (x >= dur) return 0; const q = Math.sin(x / dur * PI); return q * q }
/** Gli occhi (`userData.occhio`) ammiccano da soli, ogni ~3,7 s e ogni tanto due volte di fila. */
const ammicca = (g, T) => {
  if (!g.userData._occhi) { g.userData._occhi = []; g.traverse(o => { if (o.userData.occhio) g.userData._occhi.push(o) }) }
  const x = T % 3.7, y = (T + 1.3) % 9.1, bl = Math.max(x < 0.16 ? Math.sin(x / 0.16 * PI) : 0, y < 0.14 ? Math.sin(y / 0.14 * PI) : 0)
  g.userData._occhi.forEach(o => { o.scale.y = 1 - bl * 0.92 })
}
const memo = (vs) => { const s0 = vs.map(v => v.clone()); return () => vs.forEach((v, i) => v.copy(s0[i])) }   // la posa a riposo di quel che attacca() tocca e anima() non azzera
const marker = (padre, x, y, z) => { const o = new THREE.Object3D(); o.position.set(x, y, z); padre.add(o); return o }

// ═════════════════════════════════════ IL LUPO ═════════════════════════════════════
const LUPI = {
  grigio: { pelo: 0x80848c, scuro: 0x4b4e57, ventre: 0xc9cbcd, occhi: 0xffc43a },
  nero: { pelo: 0x2e2f37, scuro: 0x15161b, ventre: 0x5a5b63, occhi: 0xff8a2a },
  bianco: { pelo: 0xe6eaee, scuro: 0xa9b4c2, ventre: 0xffffff, occhi: 0x8fd8ff },
  capo: { pelo: 0x5a5c63, scuro: 0x2d2e34, ventre: 0xa3a5a8, occhi: 0xff5a2a },
}
export function creaLupo (variante = 'grigio', capo = false) {
  const c = LUPI[variante]
  const g = new THREE.Group(), corpo = perno(g, 0, 0, 0)
  const P = M(c.pelo), S = M(c.scuro), V = M(c.ventre), naso = lucido(0x0d0b0b), dente = M(0xf5ecd6), art = M(0x2a2622)
  rozza(corpo, 0.27, P, 0, 0.62, 0.0, 0.78, 0.86, 1.55, 2)                     // il torace lungo
  rozza(corpo, 0.25, P, 0, 0.66, 0.27, 0.92, 1.0, 0.95, 2)                     // le spalle
  rozza(corpo, 0.2, V, 0, 0.5, 0.1, 0.72, 0.55, 1.9, 1)                        // il ventre chiaro
  rozza(corpo, 0.22, P, 0, 0.62, -0.3, 0.88, 0.95, 0.95, 2)                    // l'anca
  for (let i = 0; i < 9; i++) cono(corpo, 0.055 - i * 0.002, 0.17 - i * 0.004, i % 2 ? S : P, 0, 0.92 - Math.max(0, i - 3) * 0.04, 0.42 - i * 0.1, 5).rotation.x = -1.0   // la criniera a ciocche
  for (let i = -2; i <= 2; i++) cono(corpo, 0.045, 0.16, V, i * 0.055, 0.56, 0.5 - Math.abs(i) * 0.03, 5).rotation.x = PI * 0.9                       // il pelo del petto
  for (const s of [-1, 1]) for (let k = 0; k < 3; k++) {
    cono(corpo, 0.04, 0.15, S, s * 0.2, 0.6 - k * 0.07, -0.18 - k * 0.1, 5).rotation.set(0.6, 0, s * -0.7)                                             // ciocche sul fianco
  }
  const Z = []
  for (const s of [-1, 1]) {
    Z.push(zampa(corpo, s * 0.15, 0.55, 0.3, [0, -0.24, -0.04], [0, -0.28, 0.05], 0.07, P, S, art, { ciuffi: P }))
    Z.push(zampa(corpo, s * 0.16, 0.55, -0.3, [0, -0.2, 0.16], [0, -0.31, -0.17], 0.076, P, S, art, { ciuffi: P }))
  }
  // collo e testa
  const collo = perno(corpo, 0, 0, 0)
  arto(collo, [0, 0.74, 0.36], [0, 0.86, 0.6], 0.18, 0.14, P, 8)
  const testa = perno(collo, 0, 0.87, 0.64); testa.rotation.x = 0.1; testa.scale.setScalar(1.18)
  rozza(testa, 0.13, P, 0, 0, 0, 1.0, 0.95, 1.1, 2)
  rozza(testa, 0.08, V, 0, -0.04, 0.17, 0.9, 0.8, 1.9, 1)                      // il muso
  sfera(testa, 0.032, naso, 0, 0.0, 0.34, 1.1, 0.8, 0.9, 8)
  scatola(testa, 0.012, 0.05, 0.1, S, 0, 0.07, 0.2).rotation.x = -0.15           // la striscia sul naso
  const orecchie = []
  for (const s of [-1, 1]) {
    const o = perno(testa, s * 0.085, 0.12, -0.03); o.rotation.set(-0.2, 0, s * -0.28); orecchie.push(o)
    const piccolo = capo && s === -1
    cono(o, 0.052, piccolo ? 0.1 : 0.18, P, 0, piccolo ? 0.05 : 0.09, 0, 5)
    cono(o, 0.03, piccolo ? 0.07 : 0.12, V, 0, piccolo ? 0.04 : 0.07, 0.025, 4)
    occhio(testa, s * 0.07, 0.04, 0.105, 0.028, c.occhi, { emis: 0.9, giro: s * 0.55 })
    scatola(testa, 0.055, 0.012, 0.02, P, s * 0.07, 0.078, 0.115).rotation.z = s * -0.4     // il cipiglio
    for (let k = 0; k < 3; k++) cono(testa, 0.032, 0.11, V, s * 0.1, -0.04 - k * 0.028, 0.02 - k * 0.04, 4).rotation.z = s * -1.8   // il pelo delle guance
  }
  const mascella = perno(testa, 0, -0.07, 0.07)
  rozza(mascella, 0.055, V, 0, -0.01, 0.1, 0.85, 0.4, 1.9, 1)
  for (const s of [-1, 1]) {
    cono(testa, 0.011, 0.045, dente, s * 0.035, -0.075, 0.29, 4).rotation.x = PI                    // zanne
    cono(mascella, 0.01, 0.035, dente, s * 0.03, 0.03, 0.17, 4)
  }
  const gola = rozza(mascella, 0.04, lum(0xc23a3a, 0.4), 0, 0.012, 0.1, 0.9, 0.3, 1.9, 1); gola.castShadow = false
  // coda folta
  const coda = []; let padre = perno(corpo, 0, 0.64, -0.42)
  for (let i = 0; i < 5; i++) {
    const sg = perno(padre, 0, 0, i ? -0.11 : 0); coda.push(sg)
    const r = [0.06, 0.085, 0.095, 0.085, 0.05][i]
    rozza(sg, r, i > 2 ? S : P, 0, 0, -0.05, 1, 1, 1.55, 1)
    cono(sg, r * 0.55, 0.12, i % 2 ? S : P, 0, r * 0.6, -0.08, 4).rotation.x = -1.1
    padre = sg
  }
  if (capo) {
    const cicatrice = M(0xd98a8a, { roughness: 0.6 })
    scatola(testa, 0.012, 0.15, 0.012, cicatrice, -0.075, 0.045, 0.125).rotation.set(0.3, 0, 0.35)
    for (const y of [-0.01, 0.04, 0.09]) scatola(testa, 0.04, 0.008, 0.01, cicatrice, -0.076, y, 0.13).rotation.z = 0.2
    // la collana di zanne e ossicini
    for (let i = 0; i < 9; i++) {
      const a = -1.35 + i * 0.34, x = Math.sin(a) * 0.19, y = 0.76 - Math.cos(a) * 0.1 - 0.02
      cono(collo, 0.018, 0.07, i % 3 ? dente : M(0xc9b88e), x, y, 0.5 + Math.cos(a) * 0.02, 4).rotation.set(0, 0, PI)
    }
    sfera(collo, 0.035, lum(0xff9a2a, 1.0), 0, 0.7, 0.57, 1, 1.3, 0.6, 8)                           // un cristallo rosso al collo
    for (let i = 0; i < 5; i++) cono(corpo, 0.04, 0.2, S, (i - 2) * 0.06, 0.95, 0.5, 4).rotation.set(-0.3, 0, (i - 2) * 0.12)   // criniera ritta
  }
  g.scale.setScalar(capo ? 0.88 : 0.64)
  g.userData.anima = (t) => {
    const r = onda(t, 3.4), b = onda(t, 7.2), sw = onda(t, 0.9)
    const sn = gesto(t, 6.5, 6.3, 1.6), rg = gesto(t, 7.7, 4.2, 1.4), sc = gesto(t, 11.3, 7.4, 0.9), pz = gesto(t, 9.1, 2.3, 0.9)   // annusa, ringhia, scuote il pelo, raspa
    corpo.scale.set(1 + r * 0.014, 1 + r * 0.03, 1 + r * 0.014)
    corpo.position.set(sw * 0.012, b * 0.01 + r * 0.004, 0)
    corpo.rotation.set(sn * 0.06 + onda(t, 1.4) * 0.012, onda(t, 38) * 0.05 * sc, sw * 0.022 + onda(t, 31) * 0.05 * sc)
    collo.rotation.set(sn * 0.35 + rg * 0.12, onda(t, 0.6) * 0.1, 0)
    testa.rotation.set(0.1 + onda(t, 0.9) * 0.05 + sn * 0.3 + onda(t, 21) * 0.06 * sn + rg * 0.12, onda(t, 0.55) * 0.34 + onda(t, 1.4) * 0.07, onda(t, 0.7) * 0.05)
    mascella.rotation.x = 0.04 + onda(t, 2.6) * 0.012 + rg * 0.34 + onda(t, 40) * 0.02 * rg
    orecchie.forEach((o, i) => { const sg = i ? 1 : -1, fl = gesto(t, 3.1 + i * 1.3, 0.4 + i, 0.25); o.rotation.z = sg * (-0.28 + fl * 0.35 + rg * 0.2); o.rotation.x = -0.2 - rg * 0.25 - sn * 0.1 })
    coda.forEach((sg, i) => { sg.rotation.y = onda(t, 2.6, -i * 0.6) * (0.1 + i * 0.05) * (1 + sn * 0.3); sg.rotation.x = -0.15 + onda(t, 1.7, -i * 0.4) * 0.06 })
    Z.forEach((z, i) => { z.anca.rotation.x = onda(t, 0.9, i * 1.7) * 0.02 + (i % 2 ? 1 : -1) * sw * 0.012 })
    Z[2].anca.rotation.x += -pz * 0.5; Z[2].gin.rotation.x = -pz * 0.7                // una zampa che raspa il suolo
  }
  { const r0 = memo([corpo.position, corpo.rotation, collo.rotation, testa.rotation, mascella.rotation, ...coda.map(c => c.rotation), ...Z.flatMap(z => [z.anca.rotation, z.gin.rotation])]); const an0 = g.userData.anima; g.userData.fase = 0; g.userData.anima = (t) => { const T = t + (g.userData.fase || 0); r0(); an0(T); ammicca(g, T) } }
  g.userData.attacco = { tipo: 'morso', durata: capo ? 0.75 : 0.7, arrivo: 0.55, proiettile: null }
  g.userData.attacca = (p) => {                                                    // si accuccia, balza e azzanna; le zampe davanti si protendono, quelle dietro spingono
    const F = fasi(p, 0.55)
    imp(corpo.position, F, [null, -0.1, -0.16], [null, 0.1, 0.5])
    imp(corpo.rotation, F, [0.1, null, null], [0.22, null, null])
    imp(collo.rotation, F, [0.1, null, null], [0.2, null, null])
    imp(testa.rotation, F, [0.15, null, null], [0.35, null, null])
    apre(mascella, F, 0.85)
    Z.forEach((z, i) => {
      if (i % 2 === 0) { imp(z.anca.rotation, F, [0.45, null, null], [-0.85, null, null]); imp(z.gin.rotation, F, [-0.5, null, null], [-0.35, null, null]) }
      else { imp(z.anca.rotation, F, [-0.55, null, null], [0.75, null, null]); imp(z.gin.rotation, F, [0.6, null, null], [0.45, null, null]) }
    })
    coda.forEach(sg => imp(sg.rotation, F, [-0.3, null, null], [0.12, null, null]))
  }
  g.userData.anima(0)
  return g
}

// ═════════════════════════════════════ IL RAGNO ═════════════════════════════════════
export function creaRagno (variante = 'bosco') {
  const nero = variante === 'nero'
  const g = new THREE.Group()
  const cor = M(nero ? 0x1d1a24 : 0x4b3322), cor2 = M(nero ? 0x2c2736 : 0x6b4a2c), gamba = M(nero ? 0x25212d : 0x3e2a1c), segno = M(nero ? 0xd23a2c : 0xe0b24a, nero ? { emissive: 0x8a1a10, emissiveIntensity: 0.9 } : {})
  const peli = M(nero ? 0x4a4458 : 0x8a6238), zanna = M(0xd8c9a4, { roughness: 0.4 })
  const corpo = perno(g, 0, 0, 0)
  rozza(corpo, 0.2, cor, 0, 0.37, -0.3, 0.92, 0.86, 1.25, 2)                       // l'addome
  // il disegno dell'addome: una clessidra (vedova nera) o rombi gialli
  if (nero) { rozza(corpo, 0.06, segno, 0, 0.55, -0.3, 1.0, 0.35, 1.2, 1); rozza(corpo, 0.05, segno, 0, 0.545, -0.4, 1.0, 0.3, 1.3, 1) }
  else for (let i = 0; i < 4; i++) { const r = 0.07 - i * 0.012; rozza(corpo, r, segno, 0, 0.54 - i * 0.03, -0.18 - i * 0.12, 1.0 - i * 0.05, 0.33, 1.2, 0).rotation.y = PI / 4 }
  for (let i = 0; i < 16; i++) {                                                       // le setole dell'addome
    const a = i * 2.4, rr = 0.1 + (i % 4) * 0.025
    punta(corpo, [Math.cos(a) * rr, 0.46 + Math.abs(Math.sin(a)) * 0.07, -0.3 + Math.sin(a * 1.3) * 0.17], [Math.cos(a) * rr * 1.5, 0.5 + Math.abs(Math.sin(a)) * 0.12, -0.3 + Math.sin(a * 1.3) * 0.2 - 0.04], 0.009, peli, 3)
  }
  cono(corpo, 0.05, 0.12, cor2, 0, 0.3, -0.58, 5).rotation.x = -PI / 2 - 0.4       // le filiere
  rozza(corpo, 0.14, cor2, 0, 0.35, 0.02, 1.0, 0.8, 1.15, 2)                       // il cefalotorace
  const testa = perno(corpo, 0, 0.35, 0.17)
  rozza(testa, 0.1, cor, 0, 0.02, 0.04, 1.1, 0.95, 1.0, 1)
  // otto occhi: due grandi davanti, due medi sopra, quattro piccoli ai lati
  const bril = lum(nero ? 0xff3a2a : 0xffd23a, 0.9)
  for (const s of [-1, 1]) {
    sfera(testa, 0.032, bril, s * 0.04, 0.04, 0.12, 1, 1, 0.8, 9); sfera(testa, 0.012, lum(0xffffff, 0.8), s * 0.04 + 0.01, 0.055, 0.15, 1, 1, 1, 5)
    sfera(testa, 0.02, bril, s * 0.07, 0.07, 0.1, 1, 1, 0.8, 7)
    sfera(testa, 0.014, bril, s * 0.09, 0.05, 0.07, 1, 1, 0.8, 6)
    sfera(testa, 0.012, bril, s * 0.1, 0.06, 0.03, 1, 1, 0.8, 6)
  }
  const cheliceri = []
  for (const s of [-1, 1]) {
    const ch = perno(testa, s * 0.04, -0.03, 0.12); cheliceri.push(ch); ch.rotation.z = s * 0.1
    sfera(ch, 0.035, cor2, 0, 0, 0, 1, 1.3, 1, 8)
    cono(ch, 0.014, 0.1, zanna, 0, -0.1, 0.02, 4).rotation.x = PI + 0.25
    arto(testa, [s * 0.075, -0.02, 0.1], [s * 0.1, -0.03, 0.22], 0.017, 0.012, cor2, 5)      // i pedipalpi
  }
  // le otto zampe: femore su, tibia giù, tarso: ognuna con tre perni
  const zampe = []
  const angoli = [58, 20, -18, -52]
  for (const s of [-1, 1]) angoli.forEach((gr, i) => {
    const a = gr * PI / 180
    const anca = perno(corpo, s * 0.11, 0.37, 0.12 - i * 0.06); anca.rotation.y = s > 0 ? -a : PI + a
    sfera(anca, 0.04, gamba, 0, 0, 0, 1, 1, 1, 7)
    arto(anca, [0, 0, 0], [0.26, 0.2, 0], 0.036, 0.028, gamba, 6)
    const ginocchio = perno(anca, 0.26, 0.2, 0)
    arto(ginocchio, [0, 0, 0], [0.22, -0.4, 0], 0.028, 0.02, gamba, 6)
    const tarso = perno(ginocchio, 0.22, -0.4, 0)
    arto(tarso, [0, 0, 0], [0.06, -0.17, 0], 0.02, 0.011, gamba, 5, false)
    for (let k = 0; k < 3; k++) cono(ginocchio, 0.008, 0.07, peli, 0.05 + k * 0.06, -0.06 - k * 0.1, 0.02, 3).rotation.z = -1.2   // peli sulla tibia
    zampe.push({ anca, ginocchio, tarso, i, s })
  })
  g.scale.setScalar(0.62)
  g.userData.anima = (t) => {
    const r = onda(t, 3.0), b = onda(t, 8.0)
    const ta = gesto(t, 5.5, 5.15, 1.3), rp = gesto(t, 7.3, 3.4, 0.45)                 // le zampe davanti tastano, un rapido riposizionamento
    corpo.position.set(onda(t, 1.1) * 0.01 + rp * 0.04, b * 0.012 + r * 0.004, rp * 0.06)
    corpo.scale.set(1 + r * 0.012, 1 + r * 0.035, 1 + r * 0.012)
    corpo.rotation.set(onda(t, 1.3) * 0.025 - ta * 0.08, rp * 0.12, onda(t, 7.4) * 0.03)
    testa.rotation.set(ta * 0.12, onda(t, 0.8) * 0.2 + ta * onda(t, 6) * 0.1, 0)
    cheliceri.forEach((c, i) => { c.rotation.x = Math.max(0, onda(t, 3.1, i)) * 0.22 + ta * 0.2 })
    zampe.forEach(({ anca, ginocchio, tarso, i, s }) => {
      const f = t * 2.6 + (i % 2 ? PI : 0) + (s > 0 ? 0 : PI * 0.5)
      const base = s > 0 ? -angoli[i] * PI / 180 : PI + angoli[i] * PI / 180
      anca.rotation.y = base + onda(f, 1) * 0.09 + (i === 0 ? ta * onda(t, 9, s) * 0.2 : 0) + rp * (i % 2 ? 0.08 : -0.08)
      anca.rotation.z = Math.max(0, onda(f, 1, 1.2)) * 0.12 + (i === 0 ? ta * (0.35 + 0.25 * onda(t, 9, s * 1.3)) : 0) + rp * Math.max(0, onda(t, 16, i * 1.1)) * 0.3
      ginocchio.rotation.z = onda(f, 1, 0.6) * 0.07 - (i === 0 ? ta * 0.25 : 0); tarso.rotation.z = onda(f, 1, 0.2) * 0.06
    })
  }
  const origine = marker(testa, 0, -0.04, 0.26)
  g.userData.origine = origine
  { const r0 = memo([corpo.position, corpo.rotation, testa.position, ...cheliceri.map(c => c.rotation), ...zampe.flatMap(z => [z.anca.rotation, z.ginocchio.rotation])]); const an0 = g.userData.anima; g.userData.fase = 0; g.userData.anima = (t) => { const T = t + (g.userData.fase || 0); r0(); an0(T); ammicca(g, T) } }
  g.userData.attacco = { tipo: nero ? 'sputo' : 'morso', durata: nero ? 0.8 : 0.6, arrivo: 0.5, proiettile: nero ? { tipo: 'ragnatela', origine } : null }
  g.userData.attacca = (p) => {                                                  // si impenna sulle zampe di dietro, poi si getta in avanti con le zanne (il nero sputa la tela)
    const F = fasi(p, 0.5)
    imp(corpo.rotation, F, [-0.6, null, null], [nero ? -0.2 : 0.25, null, null])
    imp(corpo.position, F, [null, 0.14, -0.16], [null, nero ? 0.05 : -0.01, nero ? 0.02 : 0.4])
    imp(testa.position, F, [null, null, 0.12], [null, null, nero ? 0.3 : 0.2])
    cheliceri.forEach(c => apre(c, F, nero ? 0.7 : 0.95))
    zampe.forEach(z => {
      if (z.i < 2) { imp(z.anca.rotation, F, [null, null, 1.0], [null, null, nero ? 0.5 : 0.1]); imp(z.ginocchio.rotation, F, [null, null, -0.3], [null, null, -0.1]) }
      else imp(z.anca.rotation, F, [null, null, 0.05], [null, null, 0.0])
    })
  }
  g.userData.anima(0)
  return g
}

// ═════════════════════════════════════ IL FUNGO ═════════════════════════════════════
export function creaFungo (variante = 'rosso') {
  const v = variante === 'viola'
  const g = new THREE.Group()
  const gambo = M(v ? 0xd9d0e2 : 0xefe3c6), gambo2 = M(v ? 0xb7a8c9 : 0xd9c79c), cappello = M(v ? 0x6b3d9a : 0xc2392b), macchia = v ? lum(0xb8f06a, 0.9) : M(0xf6efdc), branchie = M(v ? 0xe6d6f5 : 0xf1dfb4)
  const corpo = perno(g, 0, 0, 0)
  const lat = new THREE.LatheGeometry([[0.0, 0.0], [0.17, 0.0], [0.2, 0.05], [0.16, 0.2], [0.135, 0.4], [0.0, 0.4]].map(([x, y]) => new THREE.Vector2(x, y)), 12)
  mesh(corpo, lat, gambo, 0, 0.0, 0)                                                // il gambo che si restringe
  const anello = mesh(corpo, new THREE.TorusGeometry(0.15, 0.03, 5, 14), gambo2, 0, 0.32, 0); anello.rotation.x = PI / 2; anello.scale.set(1, 1, 0.6)
  // i piedini
  for (const s of [-1, 1]) { rozza(corpo, 0.07, gambo2, s * 0.1, 0.03, 0.06, 1.1, 0.55, 1.5, 1) }
  // il cappello
  const cap = perno(corpo, 0, 0.42, 0)
  const R = 0.4
  mesh(cap, new THREE.SphereGeometry(R, 20, 10, 0, PI * 2, 0, PI / 2), cappello, 0, 0, 0, 1, 0.62, 1)
  const sotto = mesh(cap, new THREE.CircleGeometry(R, 20), branchie, 0, 0, 0); sotto.rotation.x = PI / 2
  for (let i = 0; i < 28; i++) { const a = i / 28 * PI * 2; scatola(cap, 0.012, 0.035, R * 0.8, M(v ? 0xa88cc4 : 0xdcc490), Math.cos(a) * R * 0.5, -0.02, Math.sin(a) * R * 0.5).rotation.y = -a + PI / 2 }   // le branchie
  const spots = [[0, 0, 0.09], [0.5, 0.8, 0.07], [0.62, 3.0, 0.075], [0.58, 5.1, 0.06], [0.95, 0.1, 0.06], [0.98, 1.9, 0.07], [0.95, 3.6, 0.055], [0.98, 4.7, 0.065], [0.3, 4.0, 0.05], [1.15, 2.7, 0.05]]
  for (const [th, ph, r] of spots) {
    const x = R * Math.sin(th) * Math.cos(ph), z = R * Math.sin(th) * Math.sin(ph), y = R * 0.62 * Math.cos(th)
    const n = new V3(x, y / 0.62 / 0.62, z).normalize()
    const sp = sfera(cap, r, macchia, x * 1.0, y * 1.0 - 0.005, z * 1.0, 1, 0.3, 1, 8); sp.quaternion.setFromUnitVectors(SU, n); sp.castShadow = false
  }
  // la faccia sul gambo
  const faccia = perno(corpo, 0, 0.2, 0.15)
  for (const s of [-1, 1]) {
    occhio(faccia, s * 0.065, 0.07, 0.005, 0.04, v ? 0xc6ff4a : 0xffd23a, { emis: 1.1, giro: s * 0.35 })
    scatola(faccia, 0.085, 0.022, 0.03, M(v ? 0x4a2a6a : 0x7a2a1f), s * 0.065, 0.13, 0.015).rotation.z = s * -0.45
  }
  const bocca = perno(faccia, 0, -0.05, 0.01)
  sfera(bocca, 0.065, M(0x2a0d10, { flatShading: false }), 0, -0.02, 0, 1.2, 0.7, 0.5, 10)
  for (let k = -2; k <= 2; k++) { cono(bocca, 0.012, 0.035, M(0xfff6e0), k * 0.024, 0.02, 0.02, 4).rotation.x = PI; cono(bocca, 0.011, 0.028, M(0xfff6e0), k * 0.024 + 0.012, -0.05, 0.02, 4) }
  // le braccine
  const braccia = []
  for (const s of [-1, 1]) {
    const b = perno(corpo, s * 0.17, 0.2, 0.02); braccia.push(b)
    arto(b, [0, 0, 0], [s * 0.12, -0.09, 0.05], 0.035, 0.03, gambo2, 6)
    rozza(b, 0.045, gambo, s * 0.14, -0.11, 0.06, 1, 1, 1, 1)
  }
  // le spore luminose
  const matSpora = lum(v ? 0xb8f06a : 0xfff0a0, 1.6, { transparent: true, opacity: 0.85, depthWrite: false })
  const spore = []
  for (let i = 0; i < 14; i++) { const s = sfera(g, 0.014 + (i % 3) * 0.007, matSpora, 0, 0, 0, 1, 1, 1, 6); s.castShadow = false; spore.push(s) }
  g.scale.setScalar(1.05)
  g.userData.anima = (t) => {
    const hop = Math.abs(onda(t, 5.4)), sw = onda(t, 1.1)
    const sb = gesto(t, 5.3, 4.95, 1.3), morso = gesto(t, 3.6, 0.6, 0.5)                // sbuffa le spore e gonfia il cappello, morde l'aria
    corpo.position.y = hop * 0.04
    corpo.position.z = 0; corpo.position.x = 0
    corpo.scale.set(1 + (0.5 - hop) * 0.06, 1 + (hop - 0.5) * 0.1, 1 + (0.5 - hop) * 0.06)
    corpo.rotation.set(onda(t, 0.8) * 0.03, 0, sw * 0.07)
    cap.rotation.set(onda(t, 1.3) * 0.06 - sb * 0.12, onda(t, 0.7) * 0.12, onda(t, 1.7) * 0.05 + sw * 0.05)
    cap.scale.setScalar(1 + sb * 0.14 + onda(t, 3.2) * 0.015)
    bocca.scale.y = 1 + morso * 0.9 + sb * 0.5
    braccia.forEach((b, i) => { b.rotation.z = (i ? -1 : 1) * (0.1 + onda(t, 5.4, i * 1.2) * 0.2 + sb * 0.4) })
    spore.forEach((s, i) => { const u = (t * 0.2 + i / 14) % 1, k = 1 + sb * 0.9; s.position.set(Math.cos(i * 2.7 + t * 0.6) * (0.2 + u * 0.35) * k, 0.45 + u * 0.8 * k, Math.sin(i * 2.7 + t * 0.6) * (0.2 + u * 0.35) * k); s.scale.setScalar(Math.sin(u * PI) * (1 + sb * 0.8)) })
  }
  const origine = marker(faccia, 0, -0.05, 0.14)
  g.userData.origine = origine
  { const r0 = memo([corpo.position, corpo.scale, cap.rotation, bocca.scale, ...braccia.map(b => b.rotation)]); const an0 = g.userData.anima; g.userData.fase = 0; g.userData.anima = (t) => { const T = t + (g.userData.fase || 0); r0(); an0(T); ammicca(g, T) } }
  g.userData.attacco = { tipo: 'sputo', durata: 0.8, arrivo: 0.5, proiettile: { tipo: 'spore', origine } }
  g.userData.attacca = (p) => {                                                  // si schiaccia, poi si allunga e soffia una nuvola di spore
    const F = fasi(p, 0.5)
    imp(corpo.scale, F, [1.28, 0.7, 1.28], [0.85, 1.28, 0.85])
    imp(corpo.position, F, [null, null, -0.06], [null, null, 0.14])
    imp(cap.rotation, F, [-0.35, null, null], [0.5, null, null])
    bocca.scale.y += (2.4 - bocca.scale.y) * F.a
    braccia.forEach((b, i) => { const sg = i ? -1 : 1; imp(b.rotation, F, [null, null, sg * 0.5], [null, null, sg * 1.1]) })
    spore.forEach(sp => sp.scale.multiplyScalar(1 + F.k * 1.8))
  }
  g.userData.anima(0)
  return g
}

// ═════════════════════════════════════ IL MOSTRO VERDE (muschio e radici) ═════════════════════════════════════
export function creaMostroVerde () {
  const g = new THREE.Group()
  const cor = M(0x4b3826), cor2 = M(0x2f2418), mus = M(0x5f8f3a), mus2 = M(0x86b351), mus3 = M(0x3d6a2c), rad = M(0x6b4e30), mensola = M(0xd9742b)
  const corpo = perno(g, 0, 0, 0)
  const gambe = []
  for (const s of [-1, 1]) {
    const gm = perno(corpo, s * 0.3, 0.66, 0); gambe.push(gm)
    rozza(gm, 0.27, cor, 0, -0.22, 0, 0.9, 1.4, 0.9, 1)
    rozza(gm, 0.2, mus3, s * 0.04, -0.02, 0.06, 1, 0.8, 1, 1)
    rozza(gm, 0.29, cor2, 0, -0.6, 0.1, 1.1, 0.4, 1.5, 1)
    for (let k = -2; k <= 2; k++) punta(gm, [k * 0.1, -0.6, 0.28], [k * 0.14, -0.64, 0.56], 0.05, rad, 5)
    for (let k = 0; k < 3; k++) punta(gm, [s * 0.2, -0.3 + k * 0.1, -0.1], [s * 0.38, -0.5 + k * 0.05, -0.25 - k * 0.1], 0.04, rad, 4)   // radici che scendono sul fianco
  }
  rozza(corpo, 0.42, cor, 0, 0.85, 0, 1.0, 0.9, 0.9, 2)
  const torso = perno(corpo, 0, 0, 0)
  rozza(torso, 0.56, cor, 0, 1.3, 0, 1.08, 0.95, 0.85, 2)
  for (const [x, y, z, r] of [[0.55, 1.62, -0.05, 0.3], [-0.55, 1.62, -0.05, 0.3], [0.1, 1.55, -0.3, 0.32], [-0.2, 1.0, 0.38, 0.2], [0.3, 0.95, -0.35, 0.25], [-0.35, 1.45, 0.33, 0.16]]) rozza(torso, r, x > 0.4 || y < 1.1 ? mus : mus3, x, y, z, 1.1, 0.7, 1.0, 1)
  for (const [x, y, z] of [[0.15, 1.8, 0.1], [-0.3, 1.75, -0.1], [0.4, 1.0, 0.3]]) rozza(torso, 0.1, mus2, x, y, z, 1, 0.6, 1, 0)
  // il cuore d'ambra nel petto, fra le costole di corteccia
  sfera(torso, 0.12, lum(0xffb53a, 1.5), 0, 1.28, 0.44, 1, 1.5, 0.4, 10)
  for (const [a, b] of [[-0.2, 1.5], [0.2, 1.5], [-0.24, 1.1], [0.24, 1.1]]) punta(torso, [a, b, 0.42], [a * 1.3, b > 1.3 ? 1.4 : 1.2, 0.5], 0.04, cor2, 4)
  for (let k = 0; k < 4; k++) { const m = cil(torso, 0.2 - k * 0.025, 0.2 - k * 0.025, 0.05, mensola, 0.05 * (k % 2 ? -1 : 1), 1.15 + k * 0.18, -0.5, 9); m.rotation.x = 0.2 }      // i funghi a mensola sulla schiena
  const liane = []
  const testa = perno(torso, 0, 1.92, 0.3)
  rozza(testa, 0.31, mus, 0, 0, 0, 1.0, 0.95, 1.0, 2)
  rozza(testa, 0.15, mus2, 0, 0.2, -0.03, 1.2, 0.5, 1.2, 1)
  scatola(testa, 0.4, 0.06, 0.1, cor, 0, 0.1, 0.26).rotation.x = 0.1
  for (const s of [-1, 1]) {
    occhio(testa, s * 0.12, 0.0, 0.26, 0.055, 0xffe033, { emis: 1.8, fessura: true, giro: s * 0.2 })
    scatola(testa, 0.2, 0.04, 0.06, cor2, s * 0.12, 0.07, 0.26).rotation.z = s * -0.4
    punta(testa, [s * 0.12, 0.2, -0.02], [s * 0.34, 0.6, -0.12], 0.055, cor, 5)               // i palchi
    punta(testa, [s * 0.24, 0.42, -0.07], [s * 0.2, 0.74, -0.04], 0.03, cor, 4)
    punta(testa, [s * 0.28, 0.5, -0.1], [s * 0.5, 0.64, -0.2], 0.03, cor, 4)
    punta(testa, [s * 0.18, 0.15, -0.03], [s * 0.35, 0.28, 0.03], 0.04, cor, 4)
    for (let k = 0; k < 2; k++) cono(testa, 0.06, 0.15, mus2, s * (0.3 + k * 0.1), 0.58 + k * 0.1, -0.1 - k * 0.07, 4).rotation.z = s * -0.8     // foglie sui palchi
  }
  scatola(testa, 0.2, 0.05, 0.05, M(BUIO), 0, -0.13, 0.26)
  for (let k = -2; k <= 2; k++) cono(testa, 0.015, 0.05, M(0xd8cfa8), k * 0.04, -0.11, 0.29, 4).rotation.x = PI
  for (let k = -3; k <= 3; k++) { const pv = perno(testa, k * 0.07, -0.18, 0.2 - Math.abs(k) * 0.03); cono(pv, 0.02, 0.2 + (k & 1) * 0.1, mus3, 0, -0.1, 0, 4).rotation.x = PI; liane.push(pv) }  // la barba di muschio
  // le braccia: pesanti, di radice, con le dita come rami
  const bracci = []
  for (const s of [-1, 1]) {
    const sp = perno(torso, s * 0.7, 1.55, 0); sp.rotation.z = s * 0.1
    rozza(sp, 0.31, mus, 0, 0.02, 0, 1, 0.9, 1, 1)
    arto(sp, [0, 0, 0], [s * 0.1, -0.48, 0.1], 0.19, 0.15, cor, 7)
    const go = perno(sp, s * 0.1, -0.48, 0.1)
    arto(go, [0, 0, 0], [0, -0.5, 0.16], 0.15, 0.13, cor, 7)
    for (let k = 0; k < 3; k++) rozza(go, 0.07, mus3, s * 0.05, -0.1 - k * 0.12, 0.1, 1, 0.8, 1, 0)
    const mano = perno(go, 0, -0.5, 0.16)
    rozza(mano, 0.18, cor2, 0, -0.04, 0.03, 1.1, 1, 1, 1)
    for (let k = 0; k < 4; k++) { const dx = (k - 1.5) * 0.075; punta(mano, [dx, -0.08, 0.0], [dx * 1.5, -0.36, 0.08 + (k % 2) * 0.03], 0.04, rad, 4); punta(mano, [dx * 1.5, -0.3, 0.08], [dx * 1.9, -0.44, 0.2], 0.022, rad, 4) }
    punta(mano, [-s * 0.1, -0.05, 0.04], [-s * 0.2, -0.28, 0.12], 0.035, rad, 4)
    bracci.push({ sp, go, s })
  }
  g.scale.setScalar(0.64)
  const foglie = []
  for (let i = 0; i < 6; i++) { const f = cono(g, 0.05, 0.12, mus2, 0, 0, 0, 4); f.castShadow = false; foglie.push(f) }
  g.userData.anima = (t) => {
    const r = onda(t, 2.2), sw = onda(t, 0.9), res = gesto(t, 6.2, 6.2, 2.0)             // il respiro profondo, a metà, con le braccia che si aprono
    torso.scale.set(1 + r * 0.014 + res * 0.05, 1 + r * 0.03 + res * 0.06, 1 + r * 0.014 + res * 0.05)
    torso.position.y = r * 0.015 + res * 0.03
    torso.rotation.set(onda(t, 1.1) * 0.025 - res * 0.08, onda(t, 0.4) * 0.07, sw * 0.045)
    testa.rotation.set(0.06 + onda(t, 0.8) * 0.05 - res * 0.2, onda(t, 0.45) * 0.3, onda(t, 0.6) * 0.05)
    bracci.forEach(({ sp, go, s }, i) => { sp.rotation.x = -0.1 + onda(t, 1.5, i * PI) * 0.1 - res * 0.1; sp.rotation.z = s * (0.12 + onda(t, 1.0, i) * 0.05 + res * 0.25); go.rotation.x = -0.25 + onda(t, 1.7, i) * 0.1 })
    liane.forEach((l, i) => { l.rotation.z = onda(t, 1.4, i) * 0.14; l.rotation.x = onda(t, 1.1, i * 0.8) * 0.08 })
    gambe.forEach((gm, i) => { gm.rotation.x = onda(t, 1.2, i * 3) * 0.015 })
    foglie.forEach((f, i) => { const u = (t * 0.16 + i / 6) % 1; f.position.set(Math.cos(i * 2.1) * 0.5 + onda(t, 2.5, i * 1.7) * 0.12, 2.5 - u * 2.4, Math.sin(i * 2.1) * 0.4); f.rotation.set(t * 2 + i, t * 1.5, onda(t, 3, i)); f.scale.setScalar(Math.sin(u * PI)) })   // le foglie che cadono
  }
  { const r0 = memo([corpo.position, torso.rotation, testa.rotation, ...gambe.map(x => x.rotation), ...bracci.flatMap(b => [b.sp.rotation, b.go.rotation])]); const an0 = g.userData.anima; g.userData.fase = 0; g.userData.anima = (t) => { const T = t + (g.userData.fase || 0); r0(); an0(T); ammicca(g, T) } }
  g.userData.attacco = { tipo: 'zampata', durata: 0.9, arrivo: 0.6, proiettile: null }
  g.userData.attacca = (p) => {                                                  // alza le braccia sopra la testa e le abbatte insieme
    const F = fasi(p, 0.6)
    bracci.forEach(({ sp, go }) => { imp(sp.rotation, F, [-2.9, null, null], [-0.9, null, null]); imp(go.rotation, F, [-0.35, null, null], [-0.1, null, null]) })
    imp(torso.rotation, F, [-0.32, null, null], [0.42, null, null])
    imp(testa.rotation, F, [-0.3, null, null], [0.4, null, null])
    imp(corpo.position, F, [null, null, -0.1], [null, null, 0.3])
    gambe.forEach(gm => imp(gm.rotation, F, [0.12, null, null], [-0.2, null, null]))
  }
  g.userData.anima(0)
  return g
}

// ═════════════════════════════════════ L'ORSO ═════════════════════════════════════
export function creaOrso () {
  const g = new THREE.Group(), corpo = perno(g, 0, 0, 0)
  const P = M(0x5b3b24), S = M(0x3b2416), V = M(0x8a6240), muso = M(0xa27b55), art = M(0xe3d6b4, { roughness: 0.5 }), naso = lucido(0x0c0a0a), dente = M(0xf5ecd6)
  rozza(corpo, 0.44, P, 0, 0.8, 0, 0.88, 0.9, 1.5, 2)                              // il corpo
  rozza(corpo, 0.34, P, 0, 1.0, 0.34, 1.0, 0.85, 1.0, 2)                          // la gobba sulle spalle
  rozza(corpo, 0.37, P, 0, 0.74, -0.42, 0.95, 0.95, 1.0, 2)                       // la groppa
  rozza(corpo, 0.3, V, 0, 0.55, 0.15, 0.8, 0.5, 1.8, 1)                            // il ventre
  for (let i = 0; i < 12; i++) cono(corpo, 0.07, 0.2, i % 2 ? S : P, ((i % 3) - 1) * 0.1, 1.28 - Math.abs(i - 3) * 0.03 - i * 0.015, 0.55 - i * 0.12, 5).rotation.x = -0.9    // pelo irto sul dorso
  for (const s of [-1, 1]) for (let k = 0; k < 4; k++) cono(corpo, 0.06, 0.2, S, s * 0.36, 0.95 - k * 0.1, 0.35 - k * 0.2, 5).rotation.set(0.4, 0, s * -0.85)   // sui fianchi
  for (let i = -2; i <= 2; i++) cono(corpo, 0.06, 0.2, V, i * 0.08, 0.75, 0.62 - Math.abs(i) * 0.04, 5).rotation.x = PI * 0.88
  const Z = []
  for (const s of [-1, 1]) {
    Z.push(zampa(corpo, s * 0.3, 0.74, 0.42, [0, -0.32, 0.04], [0, -0.36, -0.0], 0.13, P, S, art, { dita: 5, lungArt: 0.8, ciuffi: S }))
    Z.push(zampa(corpo, s * 0.3, 0.74, -0.46, [0, -0.28, 0.1], [0, -0.4, -0.06], 0.14, P, S, art, { dita: 5, lungArt: 0.8, ciuffi: S }))
  }
  const collo = perno(corpo, 0, 0, 0)
  arto(collo, [0, 0.95, 0.5], [0, 0.92, 0.82], 0.32, 0.27, P, 9)
  const testa = perno(collo, 0, 0.92, 0.9); testa.rotation.x = 0.18
  rozza(testa, 0.23, P, 0, 0, 0, 1.05, 1.0, 1.05, 2)
  rozza(testa, 0.14, muso, 0, -0.07, 0.24, 0.95, 0.8, 1.55, 1)                     // il muso chiaro
  sfera(testa, 0.05, naso, 0, -0.02, 0.43, 1.2, 0.85, 0.9, 8)
  const mascella = perno(testa, 0, -0.14, 0.12)
  rozza(mascella, 0.09, muso, 0, -0.01, 0.15, 0.9, 0.4, 1.8, 1)
  rozza(mascella, 0.06, lum(0xb83a3a, 0.4), 0, 0.02, 0.15, 0.9, 0.3, 1.8, 1).castShadow = false
  for (const s of [-1, 1]) {
    cono(testa, 0.02, 0.08, dente, s * 0.06, -0.15, 0.36, 4).rotation.x = PI
    cono(mascella, 0.018, 0.07, dente, s * 0.05, 0.05, 0.27, 4)
    sfera(testa, 0.09, P, s * 0.2, 0.2, -0.04, 1, 1, 0.7, 9); sfera(testa, 0.05, V, s * 0.2, 0.2, 0.0, 1, 1, 0.5, 8)   // le orecchie tonde
    occhio(testa, s * 0.1, 0.06, 0.2, 0.032, 0xe0a030, { emis: 0.7, giro: s * 0.45 })
    scatola(testa, 0.1, 0.025, 0.04, S, s * 0.1, 0.12, 0.2).rotation.z = s * -0.45
    for (let k = 0; k < 3; k++) cono(testa, 0.05, 0.14, S, s * 0.19, -0.04 - k * 0.04, 0.0 - k * 0.04, 4).rotation.z = s * -1.8
  }
  scatola(testa, 0.012, 0.12, 0.012, M(0xc98a82), 0.1, 0.07, 0.205).rotation.set(0.3, 0, -0.4)                          // una vecchia cicatrice
  const coda = sfera(corpo, 0.09, P, 0, 0.78, -0.82, 1, 1, 1, 8)
  g.userData.anima = (t) => {
    const r = onda(t, 2.6), sw = onda(t, 0.8)
    const im = gesto(t, 8.2, 8.5, 2.6), ru = gesto(t, 9.5, 5.5, 1.1)                  // si impenna a metà e annusa, poi ruggisce
    corpo.scale.set(1 + r * 0.012, 1 + r * 0.026, 1)
    corpo.rotation.set(-0.3 * im, 0, sw * 0.018 + onda(t, 7) * 0.008)
    corpo.position.set(sw * 0.012, 0.12 * im + onda(t, 7.2) * 0.01, 0)
    collo.rotation.set(0, onda(t, 0.5) * 0.08, 0)
    testa.rotation.set(0.18 + onda(t, 0.7) * 0.06 - im * 0.2 + onda(t, 20) * 0.07 * im, onda(t, 0.4) * 0.3 + onda(t, 1.1) * 0.06, onda(t, 0.6) * 0.04)
    mascella.rotation.x = 0.04 + ru * 0.55 + onda(t, 2.4) * 0.01
    Z.forEach((z, i) => { const dav = i % 2 === 0; z.anca.rotation.x = onda(t, 0.9, i * 2) * 0.015 + (dav ? -0.9 : 0.3) * im; if (dav) z.gin.rotation.x = -0.5 * im })
  }
  { const r0 = memo([corpo.position, corpo.rotation, testa.rotation, mascella.rotation, ...Z.flatMap(z => [z.anca.rotation, z.gin.rotation])]); const an0 = g.userData.anima; g.userData.fase = 0; g.userData.anima = (t) => { const T = t + (g.userData.fase || 0); r0(); an0(T); ammicca(g, T) } }
  g.userData.attacco = { tipo: 'zampata', durata: 0.85, arrivo: 0.55, proiettile: null }
  g.userData.attacca = (p) => {                                                    // si impenna sulle zampe di dietro e abbatte le zampe davanti
    const F = fasi(p, 0.55)
    imp(corpo.rotation, F, [-0.6, null, null], [0.16, null, null])
    imp(corpo.position, F, [null, 0.34, 0.05], [null, 0.0, 0.32])
    for (const i of [0, 2]) { imp(Z[i].anca.rotation, F, [-1.9, null, null], [-0.45, null, null]); imp(Z[i].gin.rotation, F, [-0.7, null, null], [-0.1, null, null]) }
    for (const i of [1, 3]) imp(Z[i].anca.rotation, F, [0.62, null, null], [-0.1, null, null])
    imp(testa.rotation, F, [-0.15, null, null], [0.5, null, null])
    apre(mascella, F, 0.75)
  }
  g.userData.anima(0)
  return g
}

// ═════════════════════════════════════ IL GRANCHIO ═════════════════════════════════════
export function creaGranchio (variante = 'rosso') {
  const blu = variante === 'blu'
  const g = new THREE.Group()
  const gus = M(blu ? 0x3b6f9a : 0xc9532f), gus2 = M(blu ? 0x28506f : 0x963a20), chiaro = M(blu ? 0xb7d3e6 : 0xf0c9a0), punte = M(blu ? 0xe3d8bd : 0xf4d9b4)
  const corpo = perno(g, 0, 0.0, 0)
  sfera(corpo, 0.32, gus, 0, 0.3, 0, 1.4, 0.55, 1.0, 14)
  sfera(corpo, 0.28, chiaro, 0, 0.2, 0.02, 1.35, 0.4, 0.95, 10)
  for (const [x, z, r] of [[0, 0, 0.1], [-0.2, -0.05, 0.07], [0.2, -0.05, 0.07], [0, -0.14, 0.06], [-0.12, 0.1, 0.05], [0.12, 0.1, 0.05]]) rozza(corpo, r, gus2, x, 0.46 - Math.abs(x) * 0.25, z, 1, 0.5, 1, 0)   // le gobbe del guscio
  for (let i = 0; i < 7; i++) { const a = -0.9 + i * 0.3; cono(corpo, 0.03, 0.11, punte, Math.sin(a) * 0.42, 0.34, Math.cos(a) * 0.28, 4).rotation.set(PI / 2 - 0.2, 0, -Math.sin(a) * 1.0) }   // i denti del bordo
  const occhi = []
  for (const s of [-1, 1]) {
    const st = perno(corpo, s * 0.12, 0.38, 0.26); st.rotation.z = s * -0.18; occhi.push(st)
    arto(st, [0, 0, 0], [0, 0.18, 0.04], 0.022, 0.018, gus2, 6)
    sfera(st, 0.042, lucido(0x1a1210), 0, 0.2, 0.05, 1, 1, 1, 10); sfera(st, 0.014, lum(0xffffff, 0.9), 0.015, 0.22, 0.085, 1, 1, 1, 5)
  }
  const chele = []
  for (const s of [-1, 1]) {
    const sp = perno(corpo, s * 0.34, 0.28, 0.2); sp.rotation.y = s * 0.15
    arto(sp, [0, 0, 0], [s * 0.2, 0.12, 0.14], 0.07, 0.06, gus, 7)
    const go = perno(sp, s * 0.2, 0.12, 0.14); go.rotation.y = s * -0.4
    arto(go, [0, 0, 0], [0, 0.0, 0.25], 0.06, 0.055, gus, 7)
    const pinza = perno(go, 0, 0, 0.25)
    pinza.scale.setScalar(1.3)
    sfera(pinza, 0.13, gus, 0, 0, 0.06, 1.0, 0.85, 1.25, 12)
    for (let k = 0; k < 3; k++) cono(pinza, 0.02, 0.06, punte, s * (-0.04), 0.1, 0.04 + k * 0.07, 4)            // dentelli sul dorso della chela
    punta(pinza, [-0.04, -0.02, 0.12], [-0.01, -0.02, 0.4], 0.06, gus2, 5)
    const mobile = perno(pinza, 0.07, 0.0, 0.14)
    punta(mobile, [0, -0.02, 0], [-0.06, -0.02, 0.26], 0.055, gus, 5)
    chele.push({ sp, go, mobile, s })
  }
  const gambe = []
  for (const s of [-1, 1]) for (let i = 0; i < 3; i++) {
    const z0 = 0.08 - i * 0.15
    const anca = perno(corpo, s * 0.4, 0.2, z0)
    arto(anca, [0, 0, 0], [s * 0.2, 0.14, -0.02 - i * 0.02], 0.035, 0.03, gus2, 6)
    const gi = perno(anca, s * 0.2, 0.14, -0.02 - i * 0.02)
    arto(gi, [0, 0, 0], [s * 0.17, -0.34, -0.06 - i * 0.04], 0.03, 0.014, gus2, 6, false)
    cono(gi, 0.014, 0.07, punte, s * 0.17, -0.35, -0.06 - i * 0.04, 4).rotation.x = PI
    gambe.push({ anca, gi, i, s })
  }
  g.scale.setScalar(0.85)
  g.userData.anima = (t) => {
    const b = Math.abs(onda(t, 6.5)), pa = gesto(t, 6.2, 5.95, 1.5)
    const dir = Math.sin(Math.floor((t + 1.0) / 6.2) * 2.7) > 0 ? 1 : -1                // un passo di lato, a destra o a sinistra
    corpo.position.set(onda(t, 0.7) * 0.015 + dir * 0.08 * pa, b * 0.012, 0)
    corpo.rotation.set(0, onda(t, 0.8) * 0.08, onda(t, 6.5) * 0.02)
    occhi.forEach((o, i) => { o.rotation.x = onda(t, 1.7, i * 2) * 0.2; o.rotation.z = (i ? -1 : 1) * 0.18 + onda(t, 2.3, i) * 0.12 })
    chele.forEach(({ sp, go, mobile, s }, i) => {
      const sn = Math.max(0, onda(t, 4.2 + i * 0.7, i * 1.3))
      mobile.rotation.y = s * (0.08 + 0.5 * sn * sn)
      go.rotation.y = s * -0.4 + onda(t, 1.2, i * 1.5) * 0.12
      sp.rotation.x = onda(t, 6.5, i) * 0.04
    })
    gambe.forEach(({ anca, gi, i, s }) => { const f = t * 7 + i * 2.1 + (s > 0 ? 0 : PI); anca.rotation.z = Math.max(0, onda(f, 1)) * (0.05 + pa * 0.12) * s; gi.rotation.z = onda(f, 1, 1) * 0.05 })
  }
  { const r0 = memo([corpo.position, corpo.rotation, ...chele.flatMap(c => [c.sp.rotation, c.go.rotation, c.mobile.rotation])]); const an0 = g.userData.anima; g.userData.fase = 0; g.userData.anima = (t) => { const T = t + (g.userData.fase || 0); r0(); an0(T); ammicca(g, T) } }
  g.userData.attacco = { tipo: 'morso', durata: 0.6, arrivo: 0.5, proiettile: null }
  g.userData.attacca = (p) => {                                                  // alza e spalanca le chele, poi le chiude di scatto davanti
    const F = fasi(p, 0.5)
    imp(corpo.position, F, [null, 0.05, -0.12], [null, 0, 0.32])
    imp(corpo.rotation, F, [-0.15, null, null], [0.12, null, null])
    chele.forEach(({ sp, go, mobile, s }) => {
      imp(sp.rotation, F, [-0.5, s * 0.4, null], [0.05, s * -0.15, null])
      imp(go.rotation, F, [null, s * -0.95, null], [null, s * 0.25, null])
      mobile.rotation.y += (s * 1.1 - mobile.rotation.y) * F.a
    })
  }
  g.userData.anima(0)
  return g
}

// ═════════════════════════════════════ IL SERPENTE ═════════════════════════════════════
export function creaSerpente (variante = 'verde') {
  const v = { verde: [0x5e8f3c, 0x2f4d22, 0xe8d79a], nero: [0x5b4a6e, 0x1d1626, 0xd0553c] }[variante]
  const g = new THREE.Group()
  const N = 26, segs = []
  const pelle = M(v[0]), scuro = M(v[1]), pancia = M(v[2])
  const raggio = u => 0.03 + 0.06 * liscio(0, 0.45, u) * (1 - 0.4 * liscio(0.86, 1, u))
  for (let i = 0; i < N; i++) {
    const u = i / (N - 1), r = raggio(u), sg = new THREE.Group()
    sfera(sg, r, pelle, 0, 0, 0, 1, 0.92, 2.5, 8)
    sfera(sg, r * 0.8, pancia, 0, -r * 0.35, 0.0, 0.8, 0.5, 2.0, 6)
    if (i % 3 === 1) rozza(sg, r * 0.7, scuro, 0, r * 0.62, 0, 0.9, 0.3, 1.3, 0)              // i rombi sul dorso
    g.add(sg); segs.push(sg)
  }
  const testa = perno(g, 0, 0, 0)
  const cappuccio = perno(testa, 0, -0.13, -0.1); cappuccio.rotation.x = -0.55
  sfera(cappuccio, 0.17, pelle, 0, 0, 0, 1.0, 1.2, 0.14, 14)
  sfera(cappuccio, 0.11, pancia, 0, -0.04, 0.02, 0.9, 1.0, 0.12, 10)
  for (const s of [-1, 1]) sfera(cappuccio, 0.03, scuro, s * 0.08, 0.02, 0.03, 1, 1.4, 0.4, 6)
  sfera(cappuccio, 0.06, scuro, 0, 0.06, -0.015, 1.4, 1, 0.2, 8)
  rozza(testa, 0.1, pelle, 0, 0, 0.0, 1.0, 0.8, 1.35, 1)
  rozza(testa, 0.07, pelle, 0, -0.015, 0.12, 0.9, 0.7, 1.3, 1)
  for (const s of [-1, 1]) occhio(testa, s * 0.07, 0.035, 0.06, 0.027, 0xffd24a, { emis: 1.0, fessura: true, giro: s * 0.9 })
  const mascella = perno(testa, 0, -0.045, 0.05)
  rozza(mascella, 0.05, pancia, 0, 0, 0.07, 0.9, 0.4, 1.6, 1)
  for (const s of [-1, 1]) { cono(testa, 0.009, 0.06, M(0xfff6e0), s * 0.03, -0.05, 0.12, 4).rotation.x = PI; cono(mascella, 0.008, 0.04, M(0xfff6e0), s * 0.025, 0.02, 0.1, 4) }
  const lingua = perno(testa, 0, -0.035, 0.17)
  for (const s of [-1, 1]) { const f = cono(lingua, 0.006, 0.1, lum(0xd23a52, 0.4), s * 0.015, 0, 0.05, 4); f.rotation.set(PI / 2, 0, s * 0.35) }
  const sonaglio = perno(g, 0, 0, 0)
  const posiz = (u, t, c = 0) => {
    const alz = liscio(0.6, 0.97, u)
    const amp = 0.2 * (1 - 0.7 * alz) * (0.4 + u * 0.6) * (1 + 1.3 * c)
    const x = Math.sin(u * 11 - t * 1.8) * amp
    const z = -(1 - u) * 2.1 + 0.1 + Math.sin(u * 11 - t * 1.8 + 1) * 0.04 * (1 - alz)
    const y = raggio(u) * 0.95 + alz * 0.62
    return [x, y, z]
  }
  let ultT = 0
  const aggiorna = (t, F) => {
    ultT = t
    const c = F ? F.c : 0, k = F ? F.k : 0
    const wv = gesto(t, 6.4, 6.25, 1.7), rs = onda(t, 2.6), fl = gesto(t, 2.2, 0.2, 0.5)   // la testa che si protende, il respiro, la lingua
    const P = segs.map((_, i) => {
      const u = i / (N - 1), [x, y, z] = posiz(u, t, c), w = liscio(0.4, 1, u)
      return [x * (1 - 0.6 * k * w), y + (0.14 * c - 0.34 * k) * w + (rs * 0.03 - wv * 0.07) * w, z + (-0.4 * c + 1.0 * k) * w + wv * 0.22 * w]
    })
    segs.forEach((sg, i) => {
      sg.position.set(...P[i])
      const a = P[Math.max(0, i - 1)], b = P[Math.min(N - 1, i + 1)]
      sg.quaternion.setFromUnitVectors(new V3(0, 0, 1), new V3(b[0] - a[0], b[1] - a[1], b[2] - a[2]).normalize())
    })
    const h = P[N - 1]
    testa.position.set(h[0], h[1] + 0.03, h[2] + 0.07)
    testa.rotation.set(0.55 + onda(t, 1.1) * 0.08 * (1 - k) + wv * 0.1 - 0.3 * c + 0.5 * k, onda(t, 1.1) * 0.32 * (1 - k), onda(t, 0.9) * 0.06)
    lingua.scale.z = 0.2 + fl * (1.3 + onda(t, 50) * 0.2); lingua.visible = fl > 0.05
    mascella.rotation.x = 0.04 + Math.max(0, onda(t, 0.6)) * 0.05 + (F ? F.a * 0.95 : 0)
    cappuccio.scale.set(1 + onda(t, 1.7) * 0.04 + wv * 0.25 + 0.3 * (c + k), 1 + 0.1 * (c + k), 1)
  }
  g.userData.fase = 0
  g.userData.anima = (t) => { const T = t + (g.userData.fase || 0); aggiorna(T, null); ammicca(g, T) }
  const origine = marker(testa, 0, -0.03, 0.2)
  g.userData.origine = origine
  g.userData.attacco = { tipo: variante === 'nero' ? 'sputo' : 'morso', durata: variante === 'nero' ? 0.7 : 0.5, arrivo: 0.5, proiettile: variante === 'nero' ? { tipo: 'veleno', origine } : null }
  g.userData.attacca = (p) => aggiorna(ultT, fasi(p, 0.5))      // il collo si ritrae a S e scatta in avanti
  g.userData.anima(0)
  return g
}

// ═════════════════════════════════════ LA TARTARUGA (caporale del lago) ═════════════════════════════════════
export function creaTartaruga () {
  const g = new THREE.Group()
  const verde = M(0x3f5a3a), placca = M(0x6f8a52), placca2 = M(0x587040), orlo = M(0x7a6a42), pelle = M(0x7d8f55), pelle2 = M(0x5b6c3d), ventre = M(0xcdb98a), artiglio = M(0x2d281e), alga = M(0x2a5e38), alga2 = M(0x3e7a45), cirripedi = M(0xdcd5bd)
  const corpo = perno(g, 0, 0, 0)
  const R = 0.62, ys = 0.62, zs = 1.25, y0 = 0.3
  mesh(corpo, new THREE.SphereGeometry(R, 18, 9, 0, PI * 2, 0, PI / 2), verde, 0, y0, 0, 1, ys, zs)
  const orloM = cil(corpo, R * 1.04, R * 1.06, 0.1, orlo, 0, y0 - 0.03, 0, 18); orloM.scale.z = zs
  const pianoM = cil(corpo, R * 0.98, R * 0.9, 0.14, ventre, 0, y0 - 0.14, 0, 18); pianoM.scale.z = zs
  const sulGuscio = (th, ph, k = 1) => {
    const p = new V3(R * k * Math.sin(th) * Math.cos(ph), y0 + R * k * ys * Math.cos(th), R * k * zs * Math.sin(th) * Math.sin(ph))
    const n = new V3(p.x, (p.y - y0) / (ys * ys), p.z / (zs * zs)).normalize()
    return [p, n]
  }
  const placche = [[0, 0, 0.19], ...[0, 1, 2, 3, 4].map(k => [0.58, k * PI * 0.4 + 0.3, 0.17]), ...[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(k => [1.05, k * PI * 0.2 + 0.1, 0.12])]
  placche.forEach(([th, ph, r], i) => {
    const [p, n] = sulGuscio(th, ph, 1.0)
    const pl = cil(corpo, r, r * 1.08, 0.06, i % 2 ? placca : placca2, p.x, p.y, p.z, 6)
    pl.quaternion.setFromUnitVectors(SU, n); pl.position.addScaledVector(n, 0.0)
    rozza(corpo, r * 0.5, i % 3 ? placca2 : placca, p.x + n.x * 0.04, p.y + n.y * 0.04, p.z + n.z * 0.04, 1, 0.25, 1, 0).quaternion.setFromUnitVectors(SU, n)
  })
  // cirripedi e muschio sul guscio
  for (const [th, ph] of [[0.35, 2.2], [0.9, 5.0], [0.7, 3.6], [1.1, 1.0], [0.45, 5.6]]) {
    const [p, n] = sulGuscio(th, ph, 1.01)
    for (let k = 0; k < 3; k++) { const c = cono(corpo, 0.03, 0.06, cirripedi, p.x + k * 0.04, p.y + 0.01, p.z + (k % 2) * 0.04, 6); c.quaternion.setFromUnitVectors(SU, n) }
  }
  // alghe appese al guscio: nastri che ondeggiano
  const alghe = []
  const attacchi = [[0.45, 0.8], [0.7, 2.1], [0.9, 3.4], [1.0, 4.4], [0.6, 5.5], [1.25, 0.2], [1.25, 2.9], [1.25, 3.9], [1.25, 5.1], [0.3, 1.0]]
  attacchi.forEach(([th, ph], i) => {
    const [p, n] = sulGuscio(th, ph, 1.0)
    const pv = perno(corpo, p.x, p.y, p.z); pv.quaternion.setFromUnitVectors(SU, n); pv.rotateX(0.0)
    const l = 0.2 + (i % 3) * 0.08
    cono(pv, 0.032, l, i % 2 ? alga : alga2, 0, l / 2, 0, 4).scale.z = 0.3
    const pv2 = perno(pv, 0, l, 0); pv2.rotation.x = 1.3
    cono(pv2, 0.028, l * 0.8, i % 2 ? alga2 : alga, 0, l * 0.4, 0, 4).scale.z = 0.35
    alghe.push({ pv, pv2, i })
  })
  // la testa: grossa, con il becco e un occhio d'oro
  const collo = perno(corpo, 0, 0.3, 0.7)
  arto(collo, [0, -0.02, -0.1], [0, 0.02, 0.2], 0.19, 0.17, pelle, 9)
  const testa = perno(collo, 0, 0.03, 0.34)
  rozza(testa, 0.18, pelle, 0, 0, 0, 1.0, 0.9, 1.2, 2)
  rozza(testa, 0.11, pelle, 0, -0.04, 0.2, 0.95, 0.7, 1.2, 1)
  const beccoS = cono(testa, 0.1, 0.17, M(0x4c4a3a), 0, -0.03, 0.31, 4); beccoS.rotation.x = PI / 2; beccoS.scale.set(1.3, 1, 0.55)
  cono(testa, 0.035, 0.07, M(0x4c4a3a), 0, -0.1, 0.38, 4).rotation.x = PI + 0.2                         // il gancio del becco
  const mascella = perno(testa, 0, -0.1, 0.12)
  rozza(mascella, 0.07, M(0x5a5844), 0, 0, 0.1, 0.95, 0.45, 1.7, 1)
  for (const s of [-1, 1]) {
    occhio(testa, s * 0.14, 0.05, 0.1, 0.04, 0xffc83a, { emis: 0.8, giro: s * 0.9 })
    scatola(testa, 0.1, 0.03, 0.05, pelle2, s * 0.14, 0.11, 0.1).rotation.z = s * -0.3
    sfera(testa, 0.012, M(BUIO), s * 0.04, -0.01, 0.37, 1, 1, 1, 5)
    for (let k = 0; k < 3; k++) rozza(testa, 0.03, pelle2, s * (0.1 + k * 0.01), 0.1 - k * 0.07, -0.12, 1, 1, 1, 0)
  }
  scatola(testa, 0.012, 0.12, 0.012, M(0xb8836a), 0.14, 0.08, 0.1).rotation.set(0.2, 0.3, 0.5)
  for (let k = 0; k < 3; k++) { const a = perno(testa, (k - 1) * 0.08, 0.17, -0.06); cono(a, 0.02, 0.22, alga2, 0, 0.1, 0, 4).rotation.set(-0.4, 0, (k - 1) * 0.3) }   // un ciuffo d'alga sulla testa
  // le zampe tozze
  const zampe = []
  for (const [x, z, f] of [[0.5, 0.45, 1], [-0.5, 0.45, 1], [0.5, -0.55, 0], [-0.5, -0.55, 0]]) {
    const s = Math.sign(x)
    const an = perno(corpo, x, 0.3, z); zampe.push(an)
    rozza(an, 0.2, pelle, s * 0.05, -0.12, 0, 1.0, 1.25, 1.2, 1)
    rozza(an, 0.2, pelle2, s * 0.1, -0.27, f ? 0.06 : -0.02, 1.15, 0.45, 1.5, 1)
    for (let k = 0; k < 3; k++) cono(an, 0.03, 0.12, artiglio, s * 0.1 + (k - 1) * 0.1 * (f ? 1 : 1), -0.28, 0.24, 4).rotation.x = PI / 2 - 0.1
  }
  cono(corpo, 0.08, 0.35, pelle, 0, 0.3, -0.85, 5).rotation.x = -PI / 2 - 0.15
  g.scale.setScalar(0.8)
  g.userData.anima = (t) => {
    const r = onda(t, 2.2), sw = onda(t, 0.9)
    const es = gesto(t, 6.5, 6.7, 2.4), mo = gesto(t, 4.0, 2.0, 0.6)                    // la testa rientra appena e riesce, ogni tanto schiocca
    corpo.scale.set(1 + r * 0.012, 1 + r * 0.03, 1 + r * 0.012)
    corpo.rotation.set(onda(t, 1.2) * 0.02, 0, sw * 0.03)
    collo.position.z = 0.7 - 0.25 * es; collo.position.y = 0.3 + onda(t, 1.4) * 0.02
    collo.rotation.set(onda(t, 0.5) * 0.05, onda(t, 0.35) * 0.18 * (1 - es * 0.6), 0)
    testa.rotation.set(onda(t, 0.8) * 0.05 + es * 0.1, onda(t, 0.55) * 0.2, 0)
    mascella.rotation.x = 0.05 + mo * 0.3 + es * 0.1
    alghe.forEach(({ pv2, i }) => { pv2.rotation.x = 1.3 + onda(t, 1.5, i * 1.3) * 0.3; pv2.rotation.z = onda(t, 0.9, i) * 0.25 })
    zampe.forEach((z, i) => { z.rotation.x = onda(t, 1.4, i * 1.6) * 0.07 })
  }
  { const r0 = memo([collo.position, collo.rotation, testa.rotation, mascella.rotation, corpo.position, corpo.rotation, ...zampe.map(z => z.rotation)]); const an0 = g.userData.anima; g.userData.fase = 0; g.userData.anima = (t) => { const T = t + (g.userData.fase || 0); r0(); an0(T); ammicca(g, T) } }
  g.userData.attacco = { tipo: 'morso', durata: 0.6, arrivo: 0.5, proiettile: null }
  g.userData.attacca = (p) => {                                                  // ritrae la testa nel guscio, poi la scatta fuori e schiocca il becco
    const F = fasi(p, 0.5)
    imp(collo.position, F, [null, null, 0.36], [null, null, 1.25])
    imp(testa.rotation, F, [-0.15, null, null], [0.12, null, null])
    apre(mascella, F, 0.75)
    imp(corpo.position, F, [null, null, -0.08], [null, null, 0.2])
    imp(corpo.rotation, F, [-0.05, null, null], [0.1, null, null])
    for (const i of [0, 1]) imp(zampe[i].rotation, F, [0.25, null, null], [-0.55, null, null])
    for (const i of [2, 3]) imp(zampe[i].rotation, F, [-0.1, null, null], [0.35, null, null])
  }
  g.userData.anima(0)
  return g
}

// ═════════════════════════════════════ ALI (pipistrello) ═════════════════════════════════════
export function creaPipistrello (variante = 'comune') {
  const rosso = variante === 'rosso'
  const g = new THREE.Group()
  const pelo = M(rosso ? 0x6a2a34 : 0x3d3347), pelo2 = M(rosso ? 0x8a3f48 : 0x5a4c66), dente = M(0xf5ecd6), buio = lucido(0x16101c)
  const corpoG = perno(g, 0, 0.62, 0)
  rozza(corpoG, 0.12, pelo, 0, 0, -0.02, 0.95, 1.05, 1.25, 2)
  rozza(corpoG, 0.09, pelo2, 0, -0.01, 0.06, 0.85, 0.9, 1.0, 1)
  for (let i = 0; i < 6; i++) cono(corpoG, 0.03, 0.08, pelo2, ((i % 3) - 1) * 0.04, 0.1 - Math.floor(i / 3) * 0.02, 0.0 - i * 0.03, 4).rotation.x = -0.8
  const testa = perno(corpoG, 0, 0.1, 0.11)
  rozza(testa, 0.082, pelo, 0, 0, 0, 1.05, 0.95, 1.0, 1)
  rozza(testa, 0.05, pelo2, 0, -0.03, 0.07, 0.9, 0.75, 1.1, 1)
  sfera(testa, 0.02, buio, 0, -0.01, 0.12, 1.3, 0.7, 0.7, 6)
  const foglia = cono(testa, 0.025, 0.045, M(0xc9808a), 0, 0.03, 0.115, 4); foglia.scale.z = 0.4                // la foglia del naso
  const orecchie = []
  for (const s of [-1, 1]) {
    const o = perno(testa, s * 0.05, 0.07, -0.01); o.rotation.set(-0.15, 0, s * -0.3); orecchie.push(o)
    const c = cono(o, 0.05, 0.22, pelo, 0, 0.11, 0, 4); c.scale.z = 0.3
    const d = cono(o, 0.03, 0.15, M(0xc9808a), 0, 0.09, 0.012, 4); d.scale.z = 0.2
    occhio(testa, s * 0.045, 0.025, 0.065, 0.02, 0xff3a2a, { emis: 1.8, giro: s * 0.5 })
  }
  const mascella = perno(testa, 0, -0.05, 0.05)
  rozza(mascella, 0.03, pelo2, 0, 0, 0.04, 0.9, 0.5, 1.4, 1)
  for (const s of [-1, 1]) { cono(testa, 0.007, 0.04, dente, s * 0.025, -0.06, 0.1, 4).rotation.x = PI; cono(mascella, 0.006, 0.03, dente, s * 0.02, 0.02, 0.06, 4) }
  // i piedi appesi
  for (const s of [-1, 1]) { const p = perno(corpoG, s * 0.04, -0.1, -0.1); p.rotation.x = 0.4; cono(p, 0.012, 0.09, pelo2, 0, -0.04, 0, 4).rotation.x = PI; for (let k = -1; k <= 1; k++) cono(p, 0.006, 0.03, dente, k * 0.01, -0.1, 0.01, 3).rotation.x = PI - 0.4 }
  // le ali: braccio, mano a quattro dita, membrana
  const ali = []
  const membrana = (tri, colore) => {
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(tri.flat()), 3)); geo.computeVertexNormals()
    const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: colore, side: THREE.DoubleSide, roughness: 0.75, flatShading: true, emissive: rosso ? 0x300a10 : 0x1a1024, emissiveIntensity: 0.6 }))
    m.castShadow = true; return m
  }
  for (const s of [-1, 1]) {
    const sp = perno(corpoG, s * 0.07, 0.04, 0); ali.push({ sp, s })
    sp.scale.x = s
    const E = [0.2, 0.1, 0.0], W = [0.36, 0.18, 0.02]
    arto(sp, [0, 0, 0], E, 0.025, 0.02, pelo, 6); arto(sp, E, W, 0.02, 0.016, pelo, 6)
    const polso = perno(sp, ...W); sp.userData.polso = polso
    const F = [[0.34, 0.05, 0.1], [0.5, -0.14, 0.08], [0.42, -0.36, 0.02], [0.2, -0.44, -0.04]]
    for (const f of F) arto(polso, [0, 0, 0], f, 0.01, 0.006, M(0x2b2233), 4, false)
    punta(polso, [0, 0, 0], [0.04, 0.09, 0.05], 0.014, dente, 4)                                          // il pollice artigliato
    const B = [0.0, -0.26, -0.14], Bw = B.map((v, i) => v - W[i])
    const mem = rosso ? 0x7d2e3e : 0x4b3d5c, mem2 = rosso ? 0xa33f4e : 0x6a5a80
    sp.add(membrana([[0, 0, 0], W, B, [0, 0, 0], B, [-0.0, -0.15, -0.12]], mem))
    polso.add(membrana([[0, 0, 0], F[0], F[1], [0, 0, 0], F[1], F[2], [0, 0, 0], F[2], F[3], [0, 0, 0], F[3], Bw], mem2))
  }
  g.userData.anima = (t) => {
    const fold = gesto(t, 7.0, 7.1, 2.2), burst = gesto(t, 7.0, 4.6, 1.3)                // ripiega le ali come un mantello, poi sbatte forte
    const f = onda(t, 9.5), amp = 0.75 + burst * 0.5
    corpoG.position.set(onda(t, 0.8) * 0.07, 0.62 + onda(t, 9.5, 1.2) * 0.04 + onda(t, 1.3) * 0.025 - fold * 0.12, onda(t, 0.6) * 0.05)
    corpoG.rotation.set(-0.15 + onda(t, 9.5, 1.8) * 0.05 + fold * 0.2, onda(t, 0.7) * 0.15, onda(t, 0.8) * 0.06)
    ali.forEach(({ sp }) => { sp.rotation.z = (f * amp + 0.1) * (1 - fold) - 0.7 * fold; sp.userData.polso.rotation.z = (onda(t, 9.5, -0.9) * 0.55 - 0.15) * (1 - fold) - 1.5 * fold })
    testa.rotation.set(onda(t, 0.8) * 0.06, onda(t, 0.55) * 0.25, 0)
    orecchie.forEach((o, i) => { o.rotation.x = -0.15 + onda(t, 5, i) * 0.09 })
    mascella.rotation.x = Math.max(0, onda(t, 2.2)) * 0.25
  }
  { const r0 = memo([corpoG.position, corpoG.rotation, testa.rotation, mascella.rotation, ...ali.flatMap(a => [a.sp.rotation, a.sp.userData.polso.rotation])]); const an0 = g.userData.anima; g.userData.fase = 0; g.userData.anima = (t) => { const T = t + (g.userData.fase || 0); r0(); an0(T); ammicca(g, T) } }
  g.userData.attacco = { tipo: 'volo-radente', durata: 0.8, arrivo: 0.55, proiettile: null }
  g.userData.attacca = (p) => {                                                  // sale, si rovescia in picchiata radente e morde
    const F = fasi(p, 0.55)
    imp(corpoG.position, F, [null, 0.95, -0.22], [null, 0.24, 0.8])
    imp(corpoG.rotation, F, [-0.55, null, null], [0.8, null, null])
    imp(testa.rotation, F, [-0.2, null, null], [0.3, null, null])
    apre(mascella, F, 0.95)
    ali.forEach(({ sp }) => { imp(sp.rotation, F, [null, null, 1.1], [null, null, 0.1]); imp(sp.userData.polso.rotation, F, [null, null, -0.1], [null, null, -1.0]) })
  }
  g.userData.anima(0)
  return g
}

// ═════════════════════════════════════ IL CORVO E IL FALCO ═════════════════════════════════════
const UCCELLI = {
  corvo: { dorso: 0x1b1d2c, riflesso: 0x262f55, petto: 0x20232f, becco: 0x2c2c32, occhio: 0xd6a548, zampe: 0x2a2a2e, art: 0x1a1a1d, testa: 0x1b1d2c, hakbeak: false },
  falco: { dorso: 0x7b5a3d, riflesso: 0x9a7448, petto: 0xe8d8bb, becco: 0xd8b13c, occhio: 0xffcf2a, zampe: 0xe0b43c, art: 0x222222, testa: 0x6b7482, hakbeak: true },
}
export function creaUccello (specie = 'corvo') {
  const u = UCCELLI[specie], falco = specie === 'falco'
  const g = new THREE.Group()
  const dorso = M(u.dorso), ric = M(u.riflesso, { roughness: 0.35 }), petto = M(u.petto), becco = M(u.becco, { roughness: 0.35 }), zamp = M(u.zampe), art = M(u.art), tm = M(u.testa)
  const tilt = falco ? -0.38 : -0.3
  const tronco = perno(g, 0, falco ? 0.5 : 0.46, 0); tronco.rotation.x = tilt
  rozza(tronco, 0.19, dorso, 0, 0, 0, 0.82, 0.82, 1.55, 2)
  rozza(tronco, 0.17, petto, 0, -0.03, 0.12, 0.82, 0.95, 1.0, 2)
  if (falco) for (let k = 0; k < 8; k++) { const a = k % 4 - 1.5, r2 = Math.floor(k / 4); sfera(tronco, 0.022, M(0x5a3f28), a * 0.055, -0.04 - r2 * 0.09, 0.26 - r2 * 0.03 - Math.abs(a) * 0.01, 1.3, 0.8, 0.5, 6) }   // le macchie del petto
  for (let k = 0; k < 6; k++) cono(tronco, 0.04, 0.11, k % 2 ? ric : dorso, ((k % 3) - 1) * 0.06, 0.13 - Math.floor(k / 3) * 0.05, 0.0 - Math.floor(k / 3) * 0.1, 4).rotation.x = -1.2
  // la coda a ventaglio
  const coda = perno(tronco, 0, -0.01, -0.28); coda.rotation.x = 0.3
  for (let k = -3; k <= 3; k++) { const f = perno(coda, 0, 0, 0); f.rotation.y = k * 0.1; scatola(f, 0.075, 0.012, falco ? 0.36 : 0.3, k % 2 ? ric : dorso, 0, 0, -0.17 - (3 - Math.abs(k)) * 0.0) }
  // il collo e la testa: escono dal petto, non sopra
  const collo = perno(tronco, 0, 0.1, 0.27)
  sfera(collo, 0.1, falco ? petto : dorso, 0, -0.03, -0.04, 1, 1.15, 1, 10)
  const testa = perno(collo, 0, 0.06, 0.07); testa.rotation.x = 0.3
  testa.scale.setScalar(1.12)
  rozza(testa, 0.095, tm, 0, 0, 0, 1.0, 0.95, 1.1, 2)
  if (falco) {
    sfera(testa, 0.045, M(0xe6c24a), 0, -0.005, 0.12, 1.2, 0.9, 1.0, 7)
    const bs = cono(testa, 0.05, 0.12, becco, 0, -0.015, 0.17, 4); bs.rotation.x = PI / 2; bs.scale.set(1, 1, 0.8)
    cono(testa, 0.026, 0.05, M(0x1c1a14), 0, -0.04, 0.2, 4).rotation.x = PI      // il gancio
  } else {
    const bs = cono(testa, 0.062, 0.21, becco, 0, 0.0, 0.2, 5); bs.rotation.x = PI / 2 + 0.05; bs.scale.set(1, 1, 0.85)
    const bi = cono(testa, 0.05, 0.17, becco, 0, -0.045, 0.18, 4); bi.rotation.x = PI / 2 + 0.12; bi.scale.set(1, 1, 0.55)
  }
  const mascella = perno(testa, 0, -0.04, 0.08)
  cono(mascella, 0.035, falco ? 0.08 : 0.12, becco, 0, -0.005, falco ? 0.06 : 0.08, 4).rotation.x = PI / 2
  for (const s of [-1, 1]) {
    occhio(testa, s * 0.068, 0.025, 0.065, 0.024, u.occhio, { emis: falco ? 0.9 : 0.35, giro: s * 0.9 })
    if (falco) { scatola(testa, 0.04, 0.01, 0.02, M(0x3a2a1e), s * 0.066, 0.055, 0.075).rotation.z = s * -0.4; sfera(testa, 0.016, M(0x201a14), s * 0.085, -0.035, 0.05, 0.6, 1.8, 1, 6) }
  }
  if (!falco) for (let k = 0; k < 5; k++) cono(collo, 0.03, 0.09, dorso, (k - 2) * 0.035, -0.09, 0.03, 4).rotation.x = PI - 0.35
  // le ali: le remiganti a ventaglio. Chiuse stanno ritte contro il fianco, aperte si allargano
  const ali = []
  for (const s of [-1, 1]) {
    const sp = perno(tronco, s * 0.15, 0.04, 0.05); sp.scale.x = s
    rozza(sp, 0.09, ric, 0.03, -0.01, -0.14, 0.5, 0.95, 2.6, 1)
    const piume = []
    for (let i = 0; i < 9; i++) {
      const p = perno(sp, 0.03, 0.0, 0.0), q = perno(p, 0, 0, 0)
      const L = (falco ? 0.52 : 0.46) - Math.abs(i - 1) * 0.015 - (i > 5 ? (i - 5) * 0.045 : 0)
      scatola(q, L, 0.01, 0.075, i % 2 ? dorso : ric, L / 2, 0, 0)
      piume.push({ p, q, i })
    }
    ali.push({ sp, piume })
  }
  const apri = (w) => ali.forEach(({ sp, piume }) => {
    piume.forEach(({ p, q, i }) => {
      const chiuso = 1.52 + (i - 4) * 0.012, aperto = -0.15 + i * 0.14
      p.rotation.y = chiuso + (aperto - chiuso) * w
      q.rotation.x = (1 - w) * 1.45 + w * (i * 0.01)
      p.rotation.z = (1 - w) * -0.06 + w * 0.2
    })
    sp.rotation.z = w * 0.3
  })
  let idleW = 0
  const zampe = []
  for (const s of [-1, 1]) {
    const an = perno(g, s * 0.075, 0.3, -0.02); zampe.push(an)
    rozza(an, 0.07, falco ? petto : dorso, 0, 0.02, 0, 0.9, 1.5, 1.2, 1)
    arto(an, [0, 0, 0], [0, -0.12, -0.05], 0.025, 0.018, zamp, 5)
    const gi = perno(an, 0, -0.12, -0.05)
    arto(gi, [0, 0, 0], [0, -0.17, 0.06], 0.018, 0.014, zamp, 5)
    const pd = perno(gi, 0, -0.17, 0.06)
    for (let k = -1; k <= 1; k++) { arto(pd, [0, 0, 0], [k * 0.025, 0.0, 0.1], 0.012, 0.008, zamp, 4, false); cono(pd, 0.01, 0.04, art, k * 0.03, 0.0, 0.12, 4).rotation.x = PI / 2 + 0.3 }
    arto(pd, [0, 0, 0], [0, 0.0, -0.06], 0.012, 0.008, zamp, 4, false); cono(pd, 0.01, 0.04, art, 0, 0.0, -0.075, 4).rotation.x = -PI / 2 - 0.3
  }
  g.userData.anima = (t) => {
    const r = onda(t, 3.4)
    const pk = gesto(t, 3.9, 3.175, 0.55), sk = gesto(t, 6.9, 3.2, 0.9), fr = gesto(t, 8.7, 6.0, 1.2)   // becchetta, scuote le piume, allarga le ali
    tronco.scale.set(1 + r * 0.012, 1 + r * 0.03, 1)
    tronco.rotation.set(tilt + pk * 0.5 + onda(t, 7) * 0.02, onda(t, 0.6) * 0.1 + onda(t, 38) * 0.06 * sk, onda(t, 1.3) * 0.04 + onda(t, 34) * 0.08 * sk)
    g.position.y = Math.max(0, onda(t, 1.3)) ** 6 * 0.04
    testa.rotation.set(0.3 - pk * 0.25 + onda(t, 2.2) * 0.04, onda(t, 0.9) * 0.4 + onda(t, 2.1) * 0.15, onda(t, 0.6) * 0.18)
    collo.rotation.x = onda(t, 1.1) * 0.05 + pk * 0.2
    idleW = Math.max(fr * (falco ? 0.7 : 0.45), sk * 0.25); apri(idleW)
    coda.rotation.x = 0.3 + onda(t, 1.3) * 0.04 + sk * onda(t, 30) * 0.1
    mascella.rotation.x = Math.max(0, onda(t, 1.7)) * 0.04 + pk * 0.3
    zampe.forEach((an, i) => { an.rotation.x = onda(t, 1.3, i * PI) * 0.03 })
  }
  { const r0 = memo([tronco.rotation, g.position, collo.position, collo.rotation, testa.rotation, mascella.rotation, ...zampe.map(z => z.rotation)]); const an0 = g.userData.anima; g.userData.fase = 0; g.userData.anima = (t) => { const T = t + (g.userData.fase || 0); r0(); an0(T); ammicca(g, T) } }
  g.userData.attacco = { tipo: 'becco', durata: falco ? 0.7 : 0.6, arrivo: 0.55, proiettile: null }
  g.userData.attacca = (p) => {                                                  // ali spalancate e testa indietro, poi picchiata col becco
    const F = fasi(p, 0.55)
    if (F.c + F.k > 0.001) apri(idleW + (0.95 - idleW) * F.c + (0.4 - idleW) * F.k)
    imp(tronco.rotation, F, [tilt - 0.45, null, null], [tilt + 0.95, null, null])
    imp(g.position, F, [null, 0.16, -0.1], [null, 0.03, 0.5])
    imp(collo.position, F, [null, null, 0.24], [null, null, 0.38])
    imp(testa.rotation, F, [-0.1, null, null], [0.15, null, null])
    apre(mascella, F, 0.8)
    zampe.forEach(an => imp(an.rotation, F, [0.3, null, null], [-0.7, null, null]))
  }
  g.userData.anima(0)
  return g
}

// ═════════════════════════════════════ L'ELENCO ═════════════════════════════════════
export const MOSTRI_BOSCO = [
  { chiave: 'lupo', nome: 'Lupo grigio', zona: 'bosco', luogo: 'bosco, lupi, mulino', taglia: 'media', forza: 3, crea: () => creaLupo('grigio') },
  { chiave: 'lupo-nero', nome: 'Lupo nero', zona: 'bosco', luogo: 'bosco, lupi', taglia: 'media', forza: 4, crea: () => creaLupo('nero') },
  { chiave: 'lupo-bianco', nome: 'Lupo bianco', zona: 'brughiera', luogo: 'brughiera, passo', taglia: 'media', forza: 5, crea: () => creaLupo('bianco') },
  { chiave: 'lupo-capo', nome: 'Capobranco', zona: 'brughiera', luogo: 'brughiera (caporale), lupi', taglia: 'grande', forza: 6, crea: () => creaLupo('capo', true) },
  { chiave: 'ragno', nome: 'Ragno del bosco', zona: 'bosco', luogo: 'bosco, foresta, lupi', taglia: 'media', forza: 3, crea: () => creaRagno('bosco') },
  { chiave: 'ragno-nero', nome: 'Ragno nero', zona: 'bosco', luogo: 'bosco, gallerie', taglia: 'media', forza: 5, crea: () => creaRagno('nero') },
  { chiave: 'fungo', nome: 'Fungo che morde', zona: 'bosco', luogo: 'bosco, palude', taglia: 'piccola', forza: 3, crea: () => creaFungo('rosso') },
  { chiave: 'fungo-viola', nome: 'Fungo velenoso', zona: 'bosco', luogo: 'bosco, palude', taglia: 'piccola', forza: 4, crea: () => creaFungo('viola') },
  { chiave: 'mostro-verde', nome: 'Mostro di muschio', zona: 'bosco', luogo: 'bosco (caporale), palude', taglia: 'grande', forza: 5, crea: creaMostroVerde },
  { chiave: 'orso', nome: 'Orso', zona: 'bosco', luogo: 'bosco, foresta (caporale)', taglia: 'grande', forza: 6, crea: creaOrso },
  { chiave: 'granchio', nome: 'Granchio', zona: 'bosco', luogo: 'lago, guado', taglia: 'piccola', forza: 3, crea: () => creaGranchio('rosso') },
  { chiave: 'granchio-blu', nome: 'Granchio blu', zona: 'bosco', luogo: 'lago', taglia: 'piccola', forza: 4, crea: () => creaGranchio('blu') },
  { chiave: 'serpente', nome: 'Serpente', zona: 'bosco', luogo: 'lago, brughiera, palude', taglia: 'media', forza: 4, crea: () => creaSerpente('verde') },
  { chiave: 'serpente-nero', nome: 'Vipera nera', zona: 'brughiera', luogo: 'brughiera, rovine', taglia: 'media', forza: 6, crea: () => creaSerpente('nero') },
  { chiave: 'tartaruga', nome: 'Tartaruga corazzata', zona: 'bosco', luogo: 'lago (caporale), guado', taglia: 'grande', forza: 5, crea: creaTartaruga },
  { chiave: 'pipistrello', nome: 'Pipistrello', zona: 'brughiera', luogo: 'brughiera, passo, corvaia', taglia: 'piccola', forza: 5, crea: () => creaPipistrello('comune') },
  { chiave: 'pipistrello-rosso', nome: 'Pipistrello rosso', zona: 'brughiera', luogo: 'rovine, corvaia', taglia: 'piccola', forza: 6, crea: () => creaPipistrello('rosso') },
  { chiave: 'corvo', nome: 'Corvo', zona: 'brughiera', luogo: 'campi, corvi, cerchio', taglia: 'piccola', forza: 5, crea: () => creaUccello('corvo') },
  { chiave: 'falco', nome: 'Falco della brughiera', zona: 'brughiera', luogo: 'brughiera, colle', taglia: 'media', forza: 6, crea: () => creaUccello('falco') },
]
