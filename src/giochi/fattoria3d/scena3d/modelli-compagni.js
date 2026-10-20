// I modelli di chi vive sulla fattoria senza lavorarci: il contadino (nuovo aspetto), il bobtail Watson e i gatti. Tutto in
// codice, geometrie condivise, materiali dalla cache di `modelli.js`: niente luci, niente immagini (solo la faccia del
// contadino, una trama canvas). Davanti verso +z, piedi a terra (y = 0), origine al centro dell'impronta.
// Le pose sono funzioni a parte (`posaCane`, `posaGatto`): ricevono lo stato e il tempo e muovono i perni, senza memoria.
// Vedi docs/fattoria3d/compagni.md.
import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { mat } from './modelli.js'

// ── mattoncini con le geometrie in comune ──
const geo = new Map()
const G = (k, f) => { if (!geo.has(k)) geo.set(k, f()); return geo.get(k) }
function pezzo (g, geometria, m, x, y, z, sx = 1, sy = 1, sz = 1) {
  const o = new THREE.Mesh(geometria, m); o.position.set(x, y, z); o.scale.set(sx, sy, sz); o.castShadow = true; o.receiveShadow = true; g.add(o); return o
}
const scatola = (g, w, h, d, m, x = 0, y = 0, z = 0) => pezzo(g, G(`b${w},${h},${d}`, () => new THREE.BoxGeometry(w, h, d)), m, x, y, z)
const sfera = (g, r, m, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1) => pezzo(g, G(`s${r}`, () => new THREE.SphereGeometry(r, 10, 8)), m, x, y, z, sx, sy, sz)
const rozza = (g, r, m, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1) => pezzo(g, G(`i${r}`, () => new THREE.IcosahedronGeometry(r, 1)), m, x, y, z, sx, sy, sz)
const cil = (g, rs, ri, h, m, x = 0, y = 0, z = 0, seg = 10) => pezzo(g, G(`c${rs},${ri},${h},${seg}`, () => new THREE.CylinderGeometry(rs, ri, h, seg)), m, x, y, z)
const cono = (g, r, h, m, x = 0, y = 0, z = 0, seg = 4) => pezzo(g, G(`n${r},${h},${seg}`, () => new THREE.ConeGeometry(r, h, seg)), m, x, y, z)
const perno = (g, x, y, z) => { const p = new THREE.Group(); p.position.set(x, y, z); g.add(p); return p }
/** Una sfera invisibile ma toccabile: il dito è largo e un gatto è piccolo. */
function zonaTocco (g, r, y) {
  const o = new THREE.Mesh(G(`z${r}`, () => new THREE.SphereGeometry(r, 6, 4)), mat(0xffffff)); o.position.y = y; o.visible = false
  g.add(o); g.userData.colpo = o
}
const ombre = g => g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true } })

// ══════════ il contadino ══════════
const facce = new Map()
/** La faccia: una trama canvas (occhi grandi, guance, sorriso), una per aspetto. */
function trammaFaccia (donna) {
  if (facce.has(donna)) return facce.get(donna)
  const c = document.createElement('canvas'); c.width = 256; c.height = 176
  const x = c.getContext('2d')
  x.fillStyle = '#f5c9a2'; x.fillRect(0, 0, 256, 176)
  for (const s of [-1, 1]) {
    const ex = 128 + s * 46, ey = 78
    x.fillStyle = 'rgba(240,120,110,.45)'; x.beginPath(); x.ellipse(128 + s * 74, 118, 17, 11, 0, 0, 7); x.fill()          // guancia
    x.fillStyle = '#fff'; x.beginPath(); x.ellipse(ex, ey, 15, 19, 0, 0, 7); x.fill()
    x.fillStyle = '#2a2018'; x.beginPath(); x.ellipse(ex + s * -1, ey + 2, 10, 14, 0, 0, 7); x.fill()
    x.fillStyle = '#fff'; x.beginPath(); x.arc(ex + 3, ey - 4, 4, 0, 7); x.fill()
    x.strokeStyle = '#5a3a22'; x.lineWidth = 5; x.lineCap = 'round'                                                          // sopracciglio
    x.beginPath(); x.arc(ex, ey - 28, 16, Math.PI * 1.2, Math.PI * 1.8); x.stroke()
    if (donna) { x.strokeStyle = '#2a2018'; x.lineWidth = 3; x.beginPath(); x.moveTo(ex + s * 14, ey - 8); x.lineTo(ex + s * 22, ey - 14); x.stroke() }   // ciglia
  }
  x.fillStyle = '#e0a07e'; x.beginPath(); x.ellipse(128, 105, 5, 4, 0, 0, 7); x.fill()                                           // naso
  x.strokeStyle = '#8a3a2a'; x.lineWidth = 5; x.lineCap = 'round'; x.beginPath(); x.arc(128, 112, 24, 0.25 * Math.PI, 0.75 * Math.PI); x.stroke()   // sorriso
  if (!donna) { x.fillStyle = 'rgba(150,90,60,.5)'; for (const [a, b] of [[104, 100], [112, 96], [144, 96], [152, 100], [120, 94], [136, 94]]) { x.beginPath(); x.arc(a, b - 6, 2, 0, 7); x.fill() } }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4
  facce.set(donna, t)
  return t
}

/** Il contadino: testa grande, corpo piccolo. Stessi perni dell'eroe vecchio (`gambe`, `busto`, `testa`, `bracci`, `falce`, `ascia`). */
export function creaContadino (aspetto = 'contadino') {
  const donna = aspetto === 'contadina'
  const g = new THREE.Group()
  const pelle = mat(0xf5c9a2), maglia = mat(donna ? 0xf3e3c0 : 0xd9503f), salopette = mat(0x3d68b8), toppa = mat(0xe8b94a)
  const scuro = mat(0x2a2018), stivale = mat(0x6a4426), paglia = mat(0xe9c96e), nastro = mat(donna ? 0xe86f9a : 0xc23a2e), fazzoletto = mat(0xd2392e)
  const gambe = [-1, 1].map(s => {
    const p = perno(g, s * 0.1, 0.34, 0)
    scatola(p, 0.14, 0.2, 0.16, salopette, 0, -0.1, 0)
    scatola(p, 0.16, 0.16, 0.22, stivale, 0, -0.26, 0.03); scatola(p, 0.17, 0.03, 0.17, scuro, 0, -0.18, 0)
    if (s > 0) scatola(p, 0.08, 0.08, 0.01, toppa, 0.0, -0.09, 0.085)                                   // la toppa sul ginocchio
    return p
  })
  const busto = perno(g, 0, 0.34, 0)
  scatola(busto, 0.36, 0.3, 0.22, maglia, 0, 0.15, 0)
  scatola(busto, 0.37, 0.15, 0.23, salopette, 0, 0.075, 0)
  scatola(busto, 0.22, 0.2, 0.04, salopette, 0, 0.2, 0.12); scatola(busto, 0.08, 0.07, 0.01, toppa, 0.05, 0.2, 0.145)
  for (const s of [-1, 1]) scatola(busto, 0.05, 0.2, 0.235, salopette, s * 0.1, 0.24, 0)
  cil(busto, 0.14, 0.12, 0.06, fazzoletto, 0, 0.31, 0)                                                   // il fazzoletto al collo
  const nodo = cono(busto, 0.07, 0.1, fazzoletto, 0, 0.26, 0.12); nodo.rotation.x = Math.PI
  // la testa
  const testa = perno(busto, 0, 0.34, 0)
  const sx = 1.05, sy = 0.95
  sfera(testa, 0.24, pelle, 0, 0.22, 0, sx, sy, 1)
  const faccia = new THREE.Mesh(G('faccia', () => new THREE.SphereGeometry(0.2425, 14, 10, Math.PI / 2 - 0.95, 1.9, 1.0, 1.3)),
    new THREE.MeshStandardMaterial({ map: trammaFaccia(donna), roughness: 0.9 }))
  faccia.position.set(0, 0.22, 0); faccia.scale.set(sx, sy, 1); testa.add(faccia)
  for (const s of [-1, 1]) sfera(testa, 0.045, pelle, s * 0.25, 0.2, 0, 1, 1.2, 0.8)
  const capelli = mat(donna ? 0x7a4a26 : 0x6b4423)
  sfera(testa, 0.215, capelli, 0, 0.27, -0.05, sx, sy * 0.95, 0.95)
  if (donna) for (const s of [-1, 1]) {                                                                // le trecce
    sfera(testa, 0.06, capelli, s * 0.2, 0.1, -0.05); sfera(testa, 0.055, capelli, s * 0.21, -0.01, -0.06); sfera(testa, 0.045, nastro, s * 0.21, -0.08, -0.06)
  }
  // il cappello di paglia con il nastro
  cil(testa, 0.36, 0.36, 0.03, paglia, 0, 0.38, 0, 16)
  cil(testa, 0.17, 0.2, 0.16, paglia, 0, 0.46, 0, 14)
  cil(testa, 0.202, 0.208, 0.045, nastro, 0, 0.395, 0, 14)
  if (donna) sfera(testa, 0.045, nastro, 0.2, 0.43, 0.06); else cono(testa, 0.012, 0.18, mat(0xd8b24a), -0.19, 0.44, 0.06, 4).rotation.z = 0.5   // un fiore, o una spiga
  const bracci = [-1, 1].map(s => {
    const p = perno(busto, s * 0.22, 0.28, 0)
    scatola(p, 0.09, 0.24, 0.1, maglia, 0, -0.11, 0); sfera(p, 0.055, pelle, 0, -0.27, 0, 1, 1, 1)
    return p
  })
  // la falce e l'ascia nel pugno destro, solo mentre servono (come nel contadino di prima)
  const falce = perno(bracci[1], 0, -0.29, 0); falce.visible = false
  cil(falce, 0.018, 0.018, 1.1, mat(0x9a6a36), 0, -0.4, 0, 5)
  const lama = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.022, 4, 14, Math.PI * 0.7), mat(0xcfd6dc, { metalness: 0.5, roughness: 0.4 }))
  lama.rotation.set(Math.PI / 2, 0, Math.PI * 0.15); lama.position.set(0, -0.94, 0); falce.add(lama)
  const ascia = perno(bracci[1], 0, -0.29, 0); ascia.visible = false
  cil(ascia, 0.022, 0.022, 0.7, mat(0x9a6a36), 0, -0.25, 0, 5)
  scatola(ascia, 0.05, 0.16, 0.2, mat(0xcfd6dc, { metalness: 0.5, roughness: 0.4 }), 0, -0.56, 0.1)
  ombre(g)
  g.userData = { gambe, busto, testa, bracci, falce, ascia, aspetto }
  return g
}

// ══════════ Watson, il bobtail ══════════
// Il pelo è fatto di ciocche (coni a cinque facce che ricadono) piantate su volumi morbidi e fuse in una geometria sola per
// pezzo, coi colori nei vertici: radice scura e punta chiara fanno spessore senza luci, e cento ciocche costano un mesh.
// Le macchie sono una regola sulla posizione (testa bianca, giacca ardesia da dietro le spalle), sfumata a ciocche.
const BIANCO = 0xf4f2ee, CREMA = 0xe6dccb, ARDESIA = 0x8c98aa, CHIARO = 0xb2bac7, SCURO = 0x707c8f
let seme = 1
const caso = () => (seme = (seme * 16807) % 2147483647) / 2147483647
const liscio = (a, b, x) => { const k = Math.min(1, Math.max(0, (x - a) / (b - a))); return k * k * (3 - 2 * k) }
const _c = new THREE.Color(), _p = new THREE.Vector3(), _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _m = new THREE.Matrix4(), _s = new THREE.Vector3()
const SU = new THREE.Vector3(0, 1, 0), GIU = new THREE.Vector3(0, -1, 0)

/** I colori nei vertici: `colore(p, c)` riempie `c` per ogni vertice. */
function tingi (geo, colore) {
  const pos = geo.attributes.position, col = new Float32Array(pos.count * 3)
  for (let i = 0; i < pos.count; i++) { colore(_p.fromBufferAttribute(pos, i), _c); col.set([_c.r, _c.g, _c.b], i * 3) }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3))
}
/** Un volume morbido (icosaedro), colorato vertice per vertice da `tinta(p)`, un po' più scuro: sta sotto le ciocche. */
function volume (parti, c, r, tinta) {
  const g = new THREE.IcosahedronGeometry(1, 1); g.deleteAttribute('uv'); g.scale(...r); g.translate(...c)
  tingi(g, (p, k) => k.setHex(tinta(p)).multiplyScalar(0.8)); parti.push(g)
}
/** Una ciocca: un cono dalla radice `p` verso `d`, scuro alla radice e chiaro in punta, girato a caso su sé stesso. */
function ciocca (parti, p, d, lungo, largo, hex) {
  const g = G('ciocca', () => { const c = new THREE.ConeGeometry(1, 1, 5, 1, true); c.deleteAttribute('uv'); c.translate(0, 0.5, 0); return c.toNonIndexed() }).clone()
  const luce = 0.9 + caso() * 0.16
  tingi(g, (q, k) => k.setHex(hex).multiplyScalar(luce * (q.y > 0.5 ? 1.04 : 0.84)))
  _q.setFromUnitVectors(SU, d.clone().normalize()).multiply(_q2.setFromAxisAngle(SU, caso() * 6.28))
  g.applyMatrix4(_m.compose(p, _q, _s.set(largo, lungo, largo * (0.55 + caso() * 0.3)))); parti.push(g)
}
const fuori = (c, r, k = 0.92) => p => ((p.x - c[0]) / r[0]) ** 2 + ((p.y - c[1]) / r[1]) ** 2 + ((p.z - c[2]) / r[2]) ** 2 > k * k
/** Copre un volume di ciocche: `n` radici sparse a spirale sulla superficie; `giu` 0..1 quanto ricadono lungo il corpo
    (sul dorso si aprono di lato, come la scriminatura); `dove(p)` scarta le radici nascoste o fuori posto. */
function manto (parti, c, r, { n, lungo, largo, giu = 0.8, tinta, dove = () => true }) {
  for (let i = 0; i < n; i++) {
    const y = 1 - 2 * (i + 0.5) / n, rr = Math.sqrt(1 - y * y), a = i * 2.39996 + caso() * 0.6
    const u = new THREE.Vector3(Math.cos(a) * rr, y, Math.sin(a) * rr)
    const p = new THREE.Vector3(c[0] + u.x * r[0], c[1] + u.y * r[1], c[2] + u.z * r[2])
    if (!dove(p)) continue
    const nn = new THREE.Vector3(u.x / r[0], u.y / r[1], u.z / r[2]).normalize()
    const t = GIU.clone().addScaledVector(nn, -GIU.dot(nn))
    if (t.length() < 0.25) t.copy(nn.y < 0 ? nn : new THREE.Vector3(Math.sign(p.x - c[0]) || 1, -0.6, 0))
    const d = nn.clone().multiplyScalar(1 - giu).addScaledVector(t.normalize(), giu)
    d.add(new THREE.Vector3(caso() - 0.5, caso() - 0.5, caso() - 0.5).multiplyScalar(0.35))
    p.addScaledVector(nn, -largo * 0.6)
    ciocca(parti, p, d, lungo * (0.8 + caso() * 0.45), largo * (0.85 + caso() * 0.3), tinta(p))
  }
}
/** Un pezzo di pelo (volumi e ciocche disegnati nel sistema del cane fermo), spostato nel suo perno: un mesh. */
function pelo (perno, chiave, o, disegna) {
  const geo = G(chiave, () => {
    seme = [...chiave].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) % 2147483646, 7) + 1
    const parti = []; disegna(parti)
    const g = mergeGeometries(parti); g.translate(-o.x, -o.y, -o.z); g.computeBoundingSphere(); return g
  })
  const m = new THREE.Mesh(geo, mat(0xffffff, { vertexColors: true })); m.castShadow = m.receiveShadow = true; perno.add(m); return m
}
// i colori, dalla posizione nel cane fermo
const merle = p => { const k = caso(); return p.y < 0.3 ? CHIARO : k < 0.15 ? SCURO : k < 0.45 ? CHIARO : ARDESIA }
/** La giacca: ardesia da dietro le spalle (il bordo scende verso il dietro), bianco il petto e il collo. */
const giacca = p => caso() > liscio(0.21 - 0.45 * (0.75 - p.y) + 0.06, 0.21 - 0.45 * (0.75 - p.y) - 0.06, p.z) ? BIANCO : merle(p)
const T = new THREE.Vector3(0, 0.75, 0.45), RT = [0.31, 0.28, 0.27]          // il centro della testa e i suoi raggi
/** La testa bianca, con l'ardesia ai lati che dalla fronte scende alle orecchie; crema attorno alla bocca. */
const capo = p => {
  const lato = liscio(0.13, 0.22, Math.abs(p.x)) * liscio(T.y - 0.12, T.y - 0.02, p.y) * liscio(T.z - 0.16, T.z - 0.06, p.z) * liscio(T.z + 0.22, T.z + 0.12, p.z)
  return caso() < lato ? (caso() < 0.35 ? CHIARO : ARDESIA) : p.z > T.z + 0.17 && p.y < T.y - 0.07 ? CREMA : BIANCO
}
/** Le orecchie ardesia, che schiariscono verso le punte. */
const orecchio = p => { const k = caso() - liscio(T.y - 0.05, T.y - 0.22, p.y) * 0.45; return k < 0.2 ? CHIARO : k < 0.45 ? SCURO : ARDESIA }
const zampaDietro = p => caso() < liscio(0.12, 0.24, p.y) ? merle(p) : BIANCO

/** Un bobtail cucciolone: testa grande, tonda e bianca con la frangia sugli occhi, orecchie ardesia penzolanti, naso nero,
    bocca aperta con la lingua; petto e zampe davanti bianchi, la giacca grigio-azzurra dietro, il posteriore più alto
    delle spalle, zampe corte e pelose, niente coda (un moncherino nel pelo). */
export function creaCane () {
  const g = new THREE.Group()
  const V = (x, y, z) => new THREE.Vector3(x, y, z)
  const O = { corpo: V(0, 0.38, -0.2), testa: V(0, 0.62, 0.3), frangia: V(0, T.y + RT[1] * 0.75, T.z + RT[2] * 0.55), lingua: V(0, T.y - 0.165, T.z + 0.31) }
  const corpo = perno(g, O.corpo.x, O.corpo.y, O.corpo.z)
  const BOTTE = [[0, 0.46, -0.04], [0.27, 0.23, 0.3]], PETTO = [[0, 0.49, 0.19], [0.25, 0.25, 0.19]], COLLO = [[0, 0.6, 0.29], [0.2, 0.17, 0.15]]
  const SEDERE = [[0, 0.51, -0.29], [0.28, 0.27, 0.23]]
  const folto = { lungo: 0.12, largo: 0.075 }
  pelo(corpo, 'cane:corpo', O.corpo, parti => {
    volume(parti, ...BOTTE, giacca); volume(parti, ...PETTO, giacca); volume(parti, ...COLLO, giacca)
    manto(parti, ...BOTTE, { n: 110, ...folto, tinta: giacca, dove: p => fuori(...PETTO)(p) && fuori(...SEDERE)(p) })
    manto(parti, ...PETTO, { n: 70, ...folto, tinta: giacca, dove: p => fuori(...BOTTE)(p) && fuori(...COLLO)(p) })
    manto(parti, [0, 0.4, 0.02], [0.25, 0.12, 0.42], { n: 60, lungo: 0.15, largo: 0.07, giu: 0.9, tinta: giacca, dove: p => p.y < 0.36 })   // la gonna sotto la pancia
    manto(parti, ...COLLO, { n: 40, lungo: 0.1, largo: 0.065, tinta: giacca, dove: p => fuori(...PETTO)(p) && fuori(T.toArray(), RT)(p) })
  })
  const posteriore = perno(corpo, 0, 0, 0)
  pelo(posteriore, 'cane:sedere', O.corpo, parti => {
    volume(parti, ...SEDERE, giacca)
    manto(parti, ...SEDERE, { n: 95, ...folto, tinta: giacca, dove: fuori(...BOTTE) })
    manto(parti, [0, 0.62, -0.5], [0.07, 0.06, 0.06], { n: 12, lungo: 0.07, largo: 0.05, giu: 0.4, tinta: merle })   // il moncherino
  })
  // la testa: il perno al collo, così annusare e annuire la portano giù e avanti
  const testa = perno(corpo, O.testa.x - O.corpo.x, O.testa.y - O.corpo.y, O.testa.z - O.corpo.z)
  const TESTA = [T.toArray(), RT], MUSO = [[0, T.y - 0.11, T.z + 0.24], [0.14, 0.105, 0.12]]
  const GUANCE = [-1, 1].map(s => [[s * 0.14, T.y - 0.1, T.z + 0.16], [0.1, 0.095, 0.1]])
  const faccia = p => !(p.z > T.z + 0.15 && p.y < T.y + 0.06 && Math.abs(p.x) < 0.18)
  pelo(testa, 'cane:testa', O.testa, parti => {
    volume(parti, ...TESTA, capo); volume(parti, ...MUSO, capo)
    manto(parti, ...TESTA, { n: 150, lungo: 0.11, largo: 0.07, giu: 0.7, tinta: capo, dove: faccia })
    for (const G2 of GUANCE) { volume(parti, ...G2, capo); manto(parti, ...G2, { n: 30, lungo: 0.08, largo: 0.055, tinta: capo, dove: p => p.z > T.z + 0.1 }) }
    manto(parti, ...MUSO, { n: 50, lungo: 0.07, largo: 0.045, tinta: capo, dove: p => p.z > T.z + 0.2 && !(Math.abs(p.x) < 0.07 && p.y > T.y - 0.11) })
  })
  const naso = sfera(testa, 0.06, mat(0x16161a, { roughness: 0.25 }), 0, T.y - 0.06 - O.testa.y, T.z + 0.345 - O.testa.z, 1.3, 0.85, 0.9)
  sfera(testa, 0.06, mat(0x3b1d24), 0, T.y - 0.165 - O.testa.y, T.z + 0.3 - O.testa.z, 1.45, 0.5, 0.8)                     // la bocca aperta
  const occhi = [-1, 1].map(s => {                                                                                          // due occhietti lucidi, a metà sotto la frangia
    const o = sfera(testa, 0.034, mat(0x1c1612, { roughness: 0.15 }), s * 0.105, T.y - 0.025 - O.testa.y, T.z + 0.252 - O.testa.z)
    sfera(testa, 0.01, mat(0xffffff, { roughness: 0.3 }), s * 0.105 + 0.01, T.y - 0.015 - O.testa.y, T.z + 0.284 - O.testa.z); return o
  })
  // la frangia: file di ciocche che dalla fronte ricadono sugli occhi, un mesh suo per dondolare
  const frangia = perno(testa, O.frangia.x - O.testa.x, O.frangia.y - O.testa.y, O.frangia.z - O.testa.z)
  pelo(frangia, 'cane:frangia', O.frangia, parti => {
    for (const [el, n, lungo] of [[0.75, 9, 0.16], [0.5, 12, 0.17], [0.3, 9, 0.14]]) for (let i = 0; i < n; i++) {
      const a = (i / (n - 1) - 0.5) * (el > 0.4 ? 2 : 1.3) + (caso() - 0.5) * 0.12, e = el + (caso() - 0.5) * 0.14
      const u = V(Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e))
      const p = V(T.x + u.x * RT[0], T.y + u.y * RT[1], T.z + u.z * RT[2])
      ciocca(parti, p, V(Math.sin(a) * 0.4, -0.85, 0.45), lungo * (0.7 + Math.abs(a) * 0.3 + caso() * 0.2), 0.07, capo(p))   // più lunghe ai lati
    }
  })
  const lingua = perno(testa, O.lingua.x - O.testa.x, O.lingua.y - O.testa.y, O.lingua.z - O.testa.z)
  const l = sfera(lingua, 0.05, mat(0xe8768e), 0, -0.012, 0.02, 1.05, 0.3, 1.3); l.rotation.x = 0.45
  const orecchie = [-1, 1].map(s => {
    const o = V(s * 0.27, T.y + 0.15, T.z - 0.01), p = perno(testa, o.x - O.testa.x, o.y - O.testa.y, o.z - O.testa.z)
    const ORE = [[s * 0.32, T.y - 0.06, T.z + 0.02], [0.075, 0.2, 0.14]]
    pelo(p, `cane:orecchio${s}`, o, parti => {
      volume(parti, ...ORE, orecchio)
      manto(parti, ...ORE, { n: 50, lungo: 0.09, largo: 0.06, giu: 0.85, tinta: orecchio, dove: q => s * (q.x - ORE[0][0]) > -0.04 })
    })
    p.userData.giro = s * 0.1; return p
  })
  // le zampe: corte e grosse, pelose fino al piede bianco; le davanti bianche, le dietro ardesia sopra
  const zampe = [[-0.15, 0.32, 0.2], [0.15, 0.32, 0.2], [-0.16, 0.34, -0.34], [0.16, 0.34, -0.34]].map(([x, y, z], i) => {
    const p = perno(g, x, y, z), dietro = i > 1, tinta = dietro ? zampaDietro : () => BIANCO
    pelo(p, `cane:zampa${i}`, V(x, y, z), parti => {
      const GAMBA = [[x, 0.18, z], [0.09, 0.15, 0.095]], PIEDE = [[x, 0.055, z + 0.04], [0.1, 0.055, 0.125]], COSCIA = [[x, 0.27, z + 0.02], [0.11, 0.13, 0.13]]
      if (dietro) { volume(parti, ...COSCIA, tinta); manto(parti, ...COSCIA, { n: 20, lungo: 0.1, largo: 0.065, tinta }) }
      volume(parti, ...GAMBA, tinta); volume(parti, ...PIEDE, () => BIANCO)
      manto(parti, ...GAMBA, { n: 26, lungo: 0.08, largo: 0.06, tinta, dove: q => q.y > 0.1 })
      manto(parti, ...PIEDE, { n: 18, lungo: 0.045, largo: 0.045, giu: 0.6, tinta: () => BIANCO, dove: q => q.y > 0.06 })
    })
    return p
  })
  for (const p of [corpo, posteriore, testa, frangia, lingua, ...orecchie, ...zampe]) p.userData.base = p.position.clone()
  orecchie.forEach(o => { o.rotation.z = o.userData.giro })
  zonaTocco(g, 0.6, 0.5)
  g.userData = { ...g.userData, corpo, posteriore, testa, frangia, orecchie, lingua, naso, occhi, zampe, tipo: 'cane' }
  return g
}

/** Muove i perni del cane. `stato`: sta siede annusa dorme festa vaga segue; `vel` 0..1 quanto va; `fase` il passo; `t` il tempo. */
export function posaCane (g, { stato = 'sta', vel = 0, fase = 0, t = 0 } = {}) {
  const u = g.userData, [fl, fr, bl, br] = u.zampe
  for (const p of [u.corpo, u.posteriore, u.testa, u.frangia, u.lingua, ...u.orecchie, ...u.zampe]) { p.position.copy(p.userData.base); p.rotation.set(0, 0, 0); p.scale.set(1, 1, 1) }
  u.orecchie.forEach(o => { o.rotation.z = o.userData.giro })
  const resp = Math.sin(t * 2.2), ansima = Math.sin(t * 8)
  const lingua = (fuori, giu) => { u.lingua.scale.set(1 + fuori * 0.15, 1, 1 + fuori); u.lingua.rotation.x = giu; u.lingua.position.y += ansima * 0.004 }
  const orecchie = (k, avanti = 0) => u.orecchie.forEach((o, i) => { o.rotation.z += (i ? 1 : -1) * k; o.rotation.x = -avanti })
  lingua(0.25 + ansima * 0.05, 0.15)
  u.frangia.rotation.x = Math.sin(t * 1.3) * 0.03
  if (vel > 0.05) {                                                    // il trotto, a coppie in diagonale, un po' goffo
    const amp = 0.55 * Math.min(1, 0.5 + vel), s = Math.sin(fase), rimbalzo = Math.sin(fase * 2)
    fl.rotation.x = br.rotation.x = s * amp; fr.rotation.x = bl.rotation.x = -s * amp
    u.corpo.position.y += Math.abs(Math.cos(fase)) * 0.035; u.corpo.rotation.z = s * 0.05
    u.posteriore.rotation.y = s * 0.12; u.testa.rotation.z = -s * 0.05; u.testa.rotation.x = rimbalzo * 0.05
    u.frangia.rotation.x = rimbalzo * 0.12 - 0.04; orecchie(rimbalzo * 0.15, 0.1 + vel * 0.15)
    if (vel > 0.7) lingua(0.9, 0.5)
  }
  if (stato === 'siede') {                                             // il sedere a terra, il petto in su, le zampe dietro piegate avanti
    u.corpo.rotation.x = -0.5; u.corpo.position.y = 0.37; u.corpo.scale.y = 1 + resp * 0.015
    for (const z of [bl, br]) { z.position.y = 0.17; z.position.z += 0.08; z.rotation.x = -1.35 }
    for (const z of [fl, fr]) { z.position.z -= 0.08; z.rotation.x = 0.06 }
    u.testa.rotation.x = 0.42; u.testa.rotation.y = Math.sin(t * 0.7) * 0.35; u.posteriore.rotation.y = Math.sin(t * 3) * 0.04
    lingua(0.35 + ansima * 0.1, 0.25)
  } else if (stato === 'annusa') {                                     // il naso giù, a scatti
    u.testa.rotation.x = 0.85 + Math.sin(t * 9) * 0.07; u.testa.position.y -= 0.12; u.testa.position.z += 0.05; u.corpo.rotation.x += 0.12
    u.posteriore.rotation.y += Math.sin(t * 5) * 0.08; orecchie(-0.05, 0.25); u.frangia.rotation.x = 0.1; lingua(0, 0)
  } else if (stato === 'festa') {                                      // scodinzola col sedere, lingua fuori, un saltello
    const k = Math.sin(t * 16)
    u.posteriore.rotation.y = k * 0.42; u.corpo.rotation.z = k * 0.05
    u.corpo.position.y += Math.abs(Math.sin(t * 6)) * 0.05; u.corpo.rotation.x = 0.15; u.testa.rotation.x = -0.3
    u.frangia.rotation.x = Math.sin(t * 12) * 0.1 - 0.05; orecchie(Math.abs(Math.sin(t * 6)) * 0.2); lingua(1, 0.55)
  } else if (stato === 'dorme') {                                      // sdraiato, il mento sulle zampe davanti allungate
    const schiaccia = 0.78 * (1 + resp * 0.03)
    u.corpo.position.y = 0.16; u.corpo.scale.set(1.08, schiaccia, 1)
    for (const z of [fl, fr]) { z.position.y = 0.1; z.position.z += 0.08; z.rotation.x = -1.5 }
    for (const z of [bl, br]) { z.position.y = 0.19; z.position.z += 0.04; z.rotation.x = -1.4 }
    u.testa.scale.y = 0.85 / schiaccia; u.testa.position.y -= 0.24; u.testa.position.z += 0.06; u.testa.rotation.set(0.1, 0.35, 0.12)
    orecchie(0.2); u.frangia.rotation.x = 0.05; u.lingua.scale.set(0.01, 0.01, 0.01)
  } else if (vel <= 0.05) {                                            // in piedi: respira, ansima, guarda in giro, il sedere dondola piano
    u.corpo.scale.y = 1 + resp * 0.012; u.testa.rotation.y = Math.sin(t * 0.5) * 0.25; u.posteriore.rotation.y = Math.sin(t * 3) * 0.06
  }
}

// ══════════ i gatti ══════════
const MANTELLI = {
  bianconero: { pelo: 0xf2f0ea, chiaro: 0xf2f0ea, macchia: 0x2b2b30, zampe: 0xf2f0ea, coda: 0x2b2b30, occhi: 0x7cc04a },
  rosso:      { pelo: 0xd9822b, chiaro: 0xf2c28a, macchia: 0xb86a1c, zampe: 0xd9822b, coda: 0xd9822b, occhi: 0x7cc04a },
  nero:       { pelo: 0x2a2a31, chiaro: 0x2a2a31, macchia: 0x2a2a31, zampe: 0x2a2a31, coda: 0x2a2a31, occhi: 0xe8d04a },
}
/** Un gatto sinuoso: corpo lungo, orecchie a punta, coda in tre pezzi che si muove. */
export function creaGatto (variante = 'bianconero') {
  const M = MANTELLI[variante] || MANTELLI.bianconero
  const g = new THREE.Group()
  const pelo = mat(M.pelo), chiaro = mat(M.chiaro), macchia = mat(M.macchia), zampaM = mat(M.zampe), codaM = mat(M.coda), occhiM = mat(M.occhi)
  const rosa = mat(0xe8909a), nero = mat(0x15151a)
  const corpo = perno(g, 0, 0.2, -0.18)
  sfera(corpo, 0.13, pelo, 0, 0.1, 0.18, 1.0, 0.95, 1.9)
  sfera(corpo, 0.1, chiaro, 0, 0.06, 0.34, 0.95, 0.9, 1.0)
  if (variante === 'bianconero') sfera(corpo, 0.1, macchia, 0, 0.19, 0.12, 1.0, 0.5, 1.4)
  if (variante === 'rosso') for (const z of [0.05, 0.2, 0.33]) scatola(corpo, 0.2, 0.012, 0.03, macchia, 0, 0.225, z)       // le strisce
  const testa = perno(corpo, 0, 0.17, 0.4)
  sfera(testa, 0.115, pelo, 0, 0.08, 0.06, 1.1, 0.95, 1.0)
  if (variante === 'bianconero') { sfera(testa, 0.05, chiaro, 0, 0.04, 0.14); sfera(testa, 0.06, macchia, -0.07, 0.15, 0.04, 1, 0.6, 1) }
  for (const s of [-1, 1]) {
    const o = cono(testa, 0.05, 0.11, variante === 'bianconero' && s < 0 ? macchia : pelo, s * 0.075, 0.2, 0.02, 4); o.rotation.z = -s * 0.3
    const dentro = cono(testa, 0.03, 0.07, rosa, s * 0.07, 0.19, 0.04, 4); dentro.rotation.z = -s * 0.3
    sfera(testa, 0.024, occhiM, s * 0.05, 0.1, 0.15)
    scatola(testa, 0.008, 0.03, 0.012, nero, s * 0.05, 0.1, 0.17)                                       // la pupilla a fessura
  }
  sfera(testa, 0.016, rosa, 0, 0.06, 0.175)
  const gambe = [[-0.07, 0.16], [0.07, 0.16], [-0.07, -0.16], [0.07, -0.16]].map(([x, z]) => {
    const p = perno(g, x, 0.2, z)
    cil(p, 0.035, 0.03, 0.17, zampaM, 0, -0.1, 0, 6); sfera(p, 0.045, zampaM, 0, -0.19, 0.015, 1, 0.6, 1.3)
    p.userData.base = [x, 0.2, z]; return p
  })
  // la coda lunga, in tre pezzi
  const coda1 = perno(corpo, 0, 0.14, -0.08), coda2 = perno(coda1, 0, 0.2, 0), coda3 = perno(coda2, 0, 0.18, 0)
  cil(coda1, 0.032, 0.036, 0.2, pelo, 0, 0.1, 0, 6); cil(coda2, 0.03, 0.032, 0.18, pelo, 0, 0.09, 0, 6); cil(coda3, 0.03, 0.03, 0.16, codaM, 0, 0.08, 0, 6)
  zonaTocco(g, 0.38, 0.22)
  ombre(g)
  g.userData = { ...g.userData, corpo, testa, gambe, coda: [coda1, coda2, coda3], tipo: 'gatto', variante }
  return g
}

/** Muove i perni del gatto. Stati: sta siede lava dorme stiracchia fusa vaga fugge. `p` (0..1) è a che punto è lo stato. */
export function posaGatto (g, { stato = 'sta', vel = 0, fase = 0, t = 0, p = 0 } = {}) {
  const u = g.userData, [fl, fr, bl, br] = u.gambe, [c1, c2, c3] = u.coda
  u.gambe.forEach(z => { z.rotation.set(0, 0, 0); z.position.set(...z.userData.base); z.scale.set(1, 1, 1) })
  u.corpo.rotation.set(0, 0, 0); u.corpo.position.set(0, 0.2, -0.18); u.corpo.scale.set(1, 1, 1)
  u.testa.rotation.set(0, 0, 0)
  c1.rotation.set(-1.3, 0, 0); c2.rotation.set(0.4, 0, 0); c3.rotation.set(0.3, 0, 0)
  const resp = Math.sin(t * 2.6)
  if (vel > 0.05) {                                                    // il passo felino: basso, la coda alta che ondeggia
    const amp = 0.5 * Math.min(1, 0.6 + vel), s = Math.sin(fase)
    fl.rotation.x = br.rotation.x = s * amp; fr.rotation.x = bl.rotation.x = -s * amp
    u.corpo.position.y += Math.abs(Math.cos(fase)) * 0.012; u.corpo.position.y -= 0.02; u.corpo.rotation.y = s * 0.06
    c1.rotation.x = -0.85; c2.rotation.x = 0.25; c3.rotation.x = 0.15
    c2.rotation.z = Math.sin(fase * 0.5) * 0.35; c3.rotation.z = Math.sin(fase * 0.5 - 0.8) * 0.45
    u.testa.rotation.x = 0.1
    return
  }
  const onda = (k = 1, a = 0.3) => { c1.rotation.z = Math.sin(t * 1.6 * k) * a * 0.5; c2.rotation.z = Math.sin(t * 1.6 * k - 0.7) * a; c3.rotation.z = Math.sin(t * 1.6 * k - 1.4) * a * 1.4 }
  const seduto = () => {
    u.corpo.rotation.x = -0.9; u.corpo.position.y = 0.1
    bl.rotation.x = br.rotation.x = -1.3; bl.position.y = br.position.y = 0.12
    u.testa.rotation.x = 0.9
    c1.rotation.x = -2.3; c2.rotation.x = 0.9; c3.rotation.x = 0.9
  }
  if (stato === 'siede') { seduto(); u.testa.rotation.y = Math.sin(t * 0.8) * 0.5; u.corpo.scale.y = 1 + resp * 0.012; c3.rotation.z = Math.sin(t * 1.4) * 0.3 }
  else if (stato === 'lava') {                                         // seduto, la zampa su, la testa che si china
    seduto(); fl.rotation.x = -2.1 + Math.sin(t * 7) * 0.12; u.testa.rotation.x = 1.45 + Math.sin(t * 7) * 0.1; u.testa.rotation.z = 0.15
  } else if (stato === 'dorme') {                                      // a pagnotta, la testa sulle zampe, la coda attorno
    u.corpo.position.y = 0.075; u.corpo.scale.set(1.05, 0.75 * (1 + resp * 0.05), 0.9)
    for (const z of u.gambe) { z.position.y = 0.1; z.scale.y = 0.35 }
    u.testa.position.set(0, 0, 0); u.testa.rotation.set(0.6, 0.5, 0.35)
    c1.rotation.set(-1.45, 0, 0); c2.rotation.set(0, 0, 1.1); c3.rotation.set(0, 0, 1.0)
  } else if (stato === 'stiracchia') {                                 // il sedere in su, il petto in giù, le zampe avanti
    const k = Math.sin(Math.min(1, p) * Math.PI)
    u.corpo.rotation.x = 0.5 * k; u.corpo.position.y = 0.2 + 0.03 * k
    fl.rotation.x = fr.rotation.x = -1.1 * k; u.testa.rotation.x = -0.2 * k
    c1.rotation.x = -0.2 * k - 0.8 * (1 - k); onda(1, 0.2)
  } else if (stato === 'fusa') {                                       // le fusa: un tremolio, la coda piano
    u.corpo.position.y += Math.sin(t * 55) * 0.003; u.testa.rotation.x = 0.15; u.testa.rotation.y = Math.sin(t * 2) * 0.2; onda(0.6, 0.25)
  } else { u.corpo.scale.y = 1 + resp * 0.012; u.testa.rotation.y = Math.sin(t * 0.7) * 0.3; onda(1, 0.35) }
}

const SCALA_CANE = 0.8          // Watson è un cane grande, ma in scena doveva stare più piccolo del contadino

/** Il modello di un compagno dai dati (`dati/compagni.js`). */
export function creaCompagno (c) {
  const g = c.tipo === 'cane' ? creaCane() : creaGatto(c.variante)
  if (c.tipo === 'cane') g.scale.setScalar(SCALA_CANE)
  g.userData.id = c.id
  return g
}

/** Conta i mesh e i triangoli (veri, senza la zona del tocco) e l'ingombro di un modello: per il test e per i rapporti. */
export function misure (g) {
  g.updateMatrixWorld(true)
  let mesh = 0, triangoli = 0; const b = new THREE.Box3(), t = new THREE.Box3()
  g.traverseVisible(o => { if (o.isMesh) { mesh++; triangoli += (o.geometry.index || o.geometry.attributes.position).count / 3; t.setFromObject(o, false); b.union(t) } })
  const s = new THREE.Vector3(); b.getSize(s)
  return { mesh, triangoli, larghezza: s.x, altezza: s.y, lunghezza: s.z, sotto: b.min.y }
}
