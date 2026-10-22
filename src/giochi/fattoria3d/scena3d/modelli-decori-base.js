// Gli attrezzi comuni dei modelli delle decorazioni (modelli-decori-*.js): il caso deterministico, i sassi, i cesti e il motivo di ogni coltura (che
// serve ai cartelli e alle casse del raccolto). Ogni decorazione è UN modello piccolo, fuso (fondiPerMateriale) in una o due mesh: i decori si ripetono
// (cinquanta siepi, trenta casse) e ogni mesh è una draw call; il peso è in docs/fattoria3d/decorazioni.md. Nessuna regola qui.
import * as THREE from 'three'
import { mat, scatola, cilindro, cono, sfera } from './modelli.js'
import { fondiPerMateriale } from './fondi.js'
import { memoModello } from './cache-modelli.js'

/** Un generatore deterministico (mulberry32): lo stesso id dà lo stesso sasso, e il catalogo e la scena si vedono uguali. */
export function caso (seme) {
  let a = seme >>> 0
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}
/** Un seme da una parola. */
export const semeDi = parola => { let h = 2166136261; for (let i = 0; i < parola.length; i++) h = Math.imul(h ^ parola.charCodeAt(i), 16777619); return h >>> 0 }

function pronto (m) { m.castShadow = true; m.receiveShadow = true; return m }

/** Un sasso: un icosaedro con i vertici scossi un po' (deterministico), appoggiato a terra (`y` è la quota del suo fondo). */
export function sasso (g, r, colore, x, z, rnd, { sx = 1, sy = 0.7, sz = 1, y = 0, giro = 0 } = {}) {
  const geo = new THREE.IcosahedronGeometry(r, 0)
  const p = geo.attributes.position
  const seme = rnd() * 1000, tinta = new Map()       // lo stesso vertice si scuote allo stesso modo in ogni faccia: niente fessure fra i triangoli
  for (let i = 0; i < p.count; i += 1) {
    const ch = Math.round(p.getX(i) * 1000) + ',' + Math.round(p.getY(i) * 1000) + ',' + Math.round(p.getZ(i) * 1000)
    if (!tinta.has(ch)) tinta.set(ch, 0.88 + caso(semeDi(ch) + Math.floor(seme))() * 0.24)
    const k = tinta.get(ch); p.setXYZ(i, p.getX(i) * k, p.getY(i) * k, p.getZ(i) * k)
  }
  geo.computeVertexNormals()
  const o = pronto(new THREE.Mesh(geo, mat(colore))); o.scale.set(sx, sy, sz); o.position.set(x, y + r * sy * 0.8, z); o.rotation.y = giro; g.add(o)
  return o
}
/** Una chioma: una palla verde (icosaedro a flat shading, più «foglia» di una sfera liscia). */
export function palla (g, r, colore, x, y, z, sx = 1, sy = 1, sz = 1, detail = 1) {
  const o = pronto(new THREE.Mesh(new THREE.IcosahedronGeometry(r, detail), mat(colore))); o.scale.set(sx, sy, sz); o.position.set(x, y, z); g.add(o); return o
}
/** Un cilindro disteso lungo x (un tronco, una balla), da `x0` a `x1`. */
export function disteso (g, r, lung, colore, x, y, z, seg = 10) {
  const o = cilindro(g, r, r, lung, mat(colore), x, y, z, seg); o.rotation.z = Math.PI / 2; return o
}
/** Un arco (manico di un cesto, arco di rose): un mezzo toro in piedi nel piano xy. */
export function arco (g, raggio, spessore, colore, x, y, z, ang = Math.PI, seg = 10) {
  const o = pronto(new THREE.Mesh(new THREE.TorusGeometry(raggio, spessore, 5, seg, ang), mat(colore))); o.position.set(x, y, z); g.add(o); return o
}
/** Un ciuffo d'erba: `n` coni sottili che si aprono a ventaglio. */
export function ciuffo (g, x, z, colore, n, alt, rnd) {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + rnd(), r = 0.03 + rnd() * 0.04, h = alt * (0.7 + rnd() * 0.5)
    const o = cono(g, 0.025, h, mat(colore), x + Math.cos(a) * r, h / 2, z + Math.sin(a) * r, 4); o.rotation.set(Math.sin(a) * 0.35, 0, -Math.cos(a) * 0.35)
  }
}
/** Un fiore su uno stelo: gambo verde, corolla colorata, bottone giallo. */
export function fiore (g, x, z, h, colore, r = 0.06) {
  cilindro(g, 0.012, 0.012, h, mat(0x4a9a3a), x, h / 2, z, 4)
  palla(g, r, colore, x, h, z, 1, 0.6, 1, 0)
  palla(g, r * 0.4, 0xf0c040, x, h + r * 0.35, z, 1, 1, 1, 0)
}

/** Un cesto di vimini (cilindro svasato con il bordo e, se vuole, il manico): torna l'altezza utile. */
export function cesto (g, r, h, x, z, { manico = false, colore = 0xb98a4a, bordo = 0x8a5a2a } = {}) {
  cilindro(g, r, r * 0.78, h, mat(colore), x, h / 2, z, 12)
  const b = pronto(new THREE.Mesh(new THREE.TorusGeometry(r, 0.025, 5, 14), mat(bordo))); b.rotation.x = Math.PI / 2; b.position.set(x, h, z); g.add(b)
  if (manico) arco(g, r * 0.95, 0.025, bordo, x, h, z, Math.PI)
  return h
}
/** Una cassetta di legno con le assi dritte: `w×d`, alta `h`, centrata in (x, z); torna l'altezza del bordo. */
export function cassetta (g, w, d, h, x, z, colore = 0xb98a4a, scuro = 0x7b4a24) {
  const m = mat(colore), s = mat(scuro)
  scatola(g, w, 0.05, d, s, x, 0.03, z)
  for (const k of [0, 1, 2]) {
    const y = 0.08 + (h - 0.08) * (k / 2.4)
    scatola(g, w, 0.07, 0.035, m, x, y + 0.04, z + d / 2 - 0.018); scatola(g, w, 0.07, 0.035, m, x, y + 0.04, z - d / 2 + 0.018)
    scatola(g, 0.035, 0.07, d, m, x + w / 2 - 0.018, y + 0.04, z); scatola(g, 0.035, 0.07, d, m, x - w / 2 + 0.018, y + 0.04, z)
  }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) scatola(g, 0.05, h, 0.05, s, x + sx * (w / 2 - 0.025), h / 2, z + sz * (d / 2 - 0.025))
  return h
}

/** Il motivo di ogni coltura (cartelli, casse): [colore, forma, colore2?]. Le forme le disegna `frutto`. */
export const COLTURE_DECORI = {
  grano: [0xe6c050, 'spiga'], mais: [0xf2c93a, 'pannocchia'], carote: [0xf08a24, 'radice'], zucche: [0xe8741c, 'zucca'], erba: [0x5aa83c, 'fascio'],
  pomodori: [0xd8352a, 'tondo'], patate: [0xc9a066, 'patata'], fragole: [0xe0334a, 'fragola'], melanzane: [0x5a2f78, 'lunga'], peperoni: [0xe23a2a, 'peperone'],
  cavolfiori: [0xf4f0dc, 'cavolo'], cipolle: [0xe0b070, 'bulbo'], aglio: [0xf2eddc, 'bulbo'], barbabietola: [0x9a2f55, 'bulbo'], lavanda: [0x9a74d0, 'spiga'], riso: [0xe8dc9a, 'spiga'],
}
/** Un frutto o un ortaggio della coltura `k` in (x, y, z), di grandezza `s` (1 = circa un pugno). Piccole mesh: il modello che lo usa si fonde. */
export function frutto (g, k, x, y, z, s = 1, giro = 0) {
  const [c, forma] = COLTURE_DECORI[k]
  const verde = mat(0x4a9a3a)
  switch (forma) {
    case 'spiga': { const o = cono(g, 0.035 * s, 0.34 * s, mat(c), x, y + 0.17 * s, z, 5); o.rotation.z = giro * 0.2; cilindro(g, 0.008 * s, 0.008 * s, 0.14 * s, verde, x, y - 0.03 * s, z, 3); break }
    case 'pannocchia': { cilindro(g, 0.045 * s, 0.04 * s, 0.3 * s, mat(c), x, y + 0.15 * s, z, 6).rotation.z = giro * 0.3; cono(g, 0.06 * s, 0.22 * s, verde, x + 0.03 * s, y + 0.08 * s, z + 0.03 * s, 4); break }
    case 'radice': { const o = cono(g, 0.05 * s, 0.3 * s, mat(c), x, y + 0.12 * s, z, 6); o.rotation.x = Math.PI; cono(g, 0.03 * s, 0.12 * s, verde, x, y + 0.31 * s, z, 4); break }
    case 'zucca': { palla(g, 0.15 * s, c, x, y + 0.11 * s, z, 1.15, 0.8, 1.15, 0); cilindro(g, 0.02 * s, 0.025 * s, 0.07 * s, mat(0x4a7a2a), x, y + 0.24 * s, z, 4); break }
    case 'fascio': { for (let i = -1; i <= 1; i++) { const o = cono(g, 0.03 * s, 0.34 * s, mat(c), x + i * 0.05 * s, y + 0.17 * s, z, 4); o.rotation.z = i * 0.28 } break }
    case 'tondo': palla(g, 0.1 * s, c, x, y + 0.1 * s, z, 1, 0.92, 1, 0); palla(g, 0.04 * s, 0x3f8a3a, x, y + 0.19 * s, z, 1, 0.5, 1, 0); break
    case 'patata': palla(g, 0.09 * s, c, x, y + 0.07 * s, z, 1.3, 0.8, 1, 0); break
    case 'fragola': { const o = cono(g, 0.075 * s, 0.14 * s, mat(c), x, y + 0.08 * s, z, 6); o.rotation.x = Math.PI; palla(g, 0.04 * s, 0x3f8a3a, x, y + 0.17 * s, z, 1, 0.45, 1, 0); break }
    case 'lunga': palla(g, 0.075 * s, c, x, y + 0.08 * s, z, 0.9, 2.1, 0.9, 0); cono(g, 0.04 * s, 0.05 * s, verde, x, y + 0.28 * s, z, 5); break
    case 'peperone': palla(g, 0.1 * s, c, x, y + 0.1 * s, z, 0.95, 1.2, 0.95, 0); cilindro(g, 0.02 * s, 0.02 * s, 0.07 * s, verde, x, y + 0.25 * s, z, 4); break
    case 'cavolo': palla(g, 0.13 * s, c, x, y + 0.12 * s, z, 1, 0.85, 1, 0); for (const a of [0, 2.1, 4.2]) palla(g, 0.075 * s, 0x6aaa4a, x + Math.cos(a) * 0.1 * s, y + 0.07 * s, z + Math.sin(a) * 0.1 * s, 1, 0.6, 1, 0); break
    case 'bulbo': palla(g, 0.1 * s, c, x, y + 0.09 * s, z, 1, 0.85, 1, 0); cono(g, 0.03 * s, 0.1 * s, mat(c), x, y + 0.22 * s, z, 5); break
    default: palla(g, 0.1 * s, c, x, y + 0.1 * s, z, 1, 1, 1, 0)
  }
}
/** Un mucchio di `k` dentro una cassetta/cesto largo `w×d` a quota `y`: `n` pezzi sparsi in modo deterministico. */
export function mucchio (g, k, w, d, y, n, rnd, s = 1) {
  for (let i = 0; i < n; i++) frutto(g, k, (rnd() - 0.5) * w, y + (i % 3 === 2 ? 0.1 : 0), (rnd() - 0.5) * d, s, rnd())
}

/** Il modello di una decorazione: gruppo, costruisci, altezza di riferimento (per i cartelli), fusione. `escludi` sono i nodi che si muovono. */
export function decoro (id, costruisci, altezza = 1) {
  return memoModello('decoro:' + id, () => {
    const g = new THREE.Group()
    const extra = costruisci(g, caso(semeDi(id))) || {}
    g.userData.altezza = extra.altezza || altezza
    fondiPerMateriale(g, { escludi: extra.escludi || [] })
    return g
  })
}
export { pronto, mat, scatola, cilindro, cono, sfera }
