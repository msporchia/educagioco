// I modelli di chi vive sulla fattoria senza lavorarci: il contadino (nuovo aspetto), il bobtail Watson e i gatti. Tutto in
// codice, geometrie condivise, materiali dalla cache di `modelli.js`: niente luci, niente immagini (solo la faccia del
// contadino, una trama canvas). Davanti verso +z, piedi a terra (y = 0), origine al centro dell'impronta.
// Le pose sono funzioni a parte (`posaCane`, `posaGatto`): ricevono lo stato e il tempo e muovono i perni, senza memoria.
// Vedi docs/fattoria3d/compagni.md.
import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { mat } from './modelli.js'
import { fondiPerMateriale } from './fondi.js'
import { memoModello } from './cache-modelli.js'
import { abitoDiSerie, normalizzaAbito, opzione, chiaveAbito } from '../dati/abiti.js'

// ── il dettaglio da lontano ──
// Ogni pezzo di pelo (cane) e di morbido (gatto) sa rifarsi con meno facce e meno ciocche (`userData.lod`, fatto la prima volta che serve):
// un compagno a più di ~12 m dalla camera (zoom lontano) ne ha il 20–25%. `impostaDettaglio` cambia le geometrie del gruppo.
// Vedi docs/fattoria3d/scena.md, «Draw call e triangoli».
let DETTAGLIO = 1
const LOD_FACCE = 0.5, LOD_GROSSE = 1.5
/** Esegue `fai` con il dettaglio basso (palla, tubo e manto leggono `DETTAGLIO`). */
function daLontano (fai) {
  DETTAGLIO = 0.35
  try { return fai() } finally { DETTAGLIO = 1 }
}
/** Dal vicino al lontano e viceversa: `basso` vero = le geometrie povere. Non fa niente se è già così. */
export function impostaDettaglio (g, basso) {
  if (!!g.userData.dettaglioBasso === !!basso) return
  g.userData.dettaglioBasso = !!basso
  g.traverse(o => { const l = o.userData.lod; if (l) o.geometry = basso ? l.bassa() : l.alta })
}
/** Triangoli di un gruppo come sono adesso (per i controlli e per le misure). */
export function triangoliDi (g) {
  let n = 0
  g.traverse(o => { if (o.isMesh && o.visible !== false && o.geometry) n += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3 })
  return Math.round(n)
}

// ── mattoncini con le geometrie in comune ──
const geo = new Map()
const G = (k, f) => { if (!geo.has(k)) geo.set(k, f()); return geo.get(k) }
function pezzo (g, geometria, m, x, y, z, sx = 1, sy = 1, sz = 1) {
  const o = new THREE.Mesh(geometria, m); o.position.set(x, y, z); o.scale.set(sx, sy, sz); o.castShadow = true; o.receiveShadow = true; g.add(o); return o
}
const scatola = (g, w, h, d, m, x = 0, y = 0, z = 0) => pezzo(g, G(`b${w},${h},${d}`, () => new THREE.BoxGeometry(w, h, d)), m, x, y, z)
const sfera = (g, r, m, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1) => {
  const geo = G(`s${r}`, () => new THREE.SphereGeometry(r, 10, 8)), o = pezzo(g, geo, m, x, y, z, sx, sy, sz)
  o.userData.lod = { alta: geo, bassa: () => G(`s${r}:lod`, () => new THREE.SphereGeometry(r, 6, 4)) }
  return o
}
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
/** La faccia: una trama canvas (occhi grandi, guance, sorriso), una per aspetto e per colore della pelle. */
function trammaFaccia (donna, css = '#f5c9a2') {
  const chiave = donna + css
  if (facce.has(chiave)) return facce.get(chiave)
  const c = document.createElement('canvas'); c.width = 256; c.height = 176
  const x = c.getContext('2d')
  x.fillStyle = css; x.fillRect(0, 0, 256, 176)
  for (const s of [-1, 1]) {
    const ex = 128 + s * 46, ey = 78
    x.fillStyle = 'rgba(230,100,100,.4)'; x.beginPath(); x.ellipse(128 + s * 74, 118, 17, 11, 0, 0, 7); x.fill()          // guancia
    x.fillStyle = '#fff'; x.beginPath(); x.ellipse(ex, ey, 15, 19, 0, 0, 7); x.fill()
    x.fillStyle = '#2a2018'; x.beginPath(); x.ellipse(ex + s * -1, ey + 2, 10, 14, 0, 0, 7); x.fill()
    x.fillStyle = '#fff'; x.beginPath(); x.arc(ex + 3, ey - 4, 4, 0, 7); x.fill()
    x.strokeStyle = '#5a3a22'; x.lineWidth = 5; x.lineCap = 'round'                                                          // sopracciglio
    x.beginPath(); x.arc(ex, ey - 28, 16, Math.PI * 1.2, Math.PI * 1.8); x.stroke()
    if (donna) { x.strokeStyle = '#2a2018'; x.lineWidth = 3; x.beginPath(); x.moveTo(ex + s * 14, ey - 8); x.lineTo(ex + s * 22, ey - 14); x.stroke() }   // ciglia
  }
  x.fillStyle = 'rgba(120,60,40,.22)'; x.beginPath(); x.ellipse(128, 105, 5, 4, 0, 0, 7); x.fill()                                           // naso
  x.strokeStyle = '#8a3a2a'; x.lineWidth = 5; x.lineCap = 'round'; x.beginPath(); x.arc(128, 112, 24, 0.25 * Math.PI, 0.75 * Math.PI); x.stroke()   // sorriso
  if (!donna) { x.fillStyle = 'rgba(150,90,60,.5)'; for (const [a, b] of [[104, 100], [112, 96], [144, 96], [152, 100], [120, 94], [136, 94]]) { x.beginPath(); x.arc(a, b - 6, 2, 0, 7); x.fill() } }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4
  facce.set(chiave, t)
  return t
}

const scurisci = (hex, k) => new THREE.Color(hex).multiplyScalar(k).getHex()
const cupola = G('cupola', () => new THREE.SphereGeometry(0.235, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2))

/** Il contadino: testa grande, corpo piccolo. `arg`: un abito (dati/abiti.js) o il nome di una persona ('contadino' | 'contadina': l'abito di
    serie). Stessi perni per ogni abito (`gambe`, `busto`, `testa`, `bracci`, `falce`, `ascia`): i cappelli e i capelli stanno nella testa, la
    gonna e la maglia nel busto, gli stivali nelle gambe. Vedi docs/fattoria3d/guardaroba.md. */
function costruisciContadino (arg = 'contadino') {
  const A = typeof arg === 'string' ? abitoDiSerie(arg) : normalizzaAbito(arg, arg && arg.persona)
  const donna = A.persona === 'contadina'
  const O = c => opzione(c, A[c])
  const m = O('maglia'), cap = O('cappello'), colloO = O('collo'), chioma = O('capelli'), pant = O('pantalone')
  const g = new THREE.Group()
  const pelle = mat(O('pelle').c), maglia = mat(m.c), maniche = mat(m.motivo === 'festa' && !donna ? 0xf6f0e6 : m.c), salopette = mat(pant.c), toppa = mat(0xe8b94a)
  const scuro = mat(0x2a2018), stivale = mat(O('stivali').c), nastro = mat(donna ? 0xe86f9a : 0xc23a2e), segno = mat(scurisci(m.c, 0.72))
  const gambe = [-1, 1].map(s => {
    const p = perno(g, s * 0.1, 0.34, 0)
    scatola(p, 0.14, 0.2, 0.16, donna ? pelle : salopette, 0, -0.1, 0)
    scatola(p, 0.16, 0.16, 0.22, stivale, 0, -0.26, 0.03); scatola(p, 0.17, 0.03, 0.17, scuro, 0, -0.18, 0)
    if (s > 0 && !donna) scatola(p, 0.08, 0.08, 0.01, toppa, 0.0, -0.09, 0.085)                       // la toppa sul ginocchio
    return p
  })
  const busto = perno(g, 0, 0.34, 0)
  scatola(busto, 0.36, 0.3, 0.22, maglia, 0, 0.15, 0)
  if (donna) {
    cil(busto, 0.2, 0.27, 0.27, salopette, 0, 0.0, 0, 12)                                            // la gonna
    scatola(busto, 0.37, 0.04, 0.23, scuro, 0, 0.145, 0)                                              // la cintura
  } else {
    scatola(busto, 0.37, 0.15, 0.23, salopette, 0, 0.075, 0)
    scatola(busto, 0.22, 0.2, 0.04, salopette, 0, 0.2, 0.12); scatola(busto, 0.08, 0.07, 0.01, toppa, 0.05, 0.2, 0.145)
    for (const s of [-1, 1]) scatola(busto, 0.05, 0.2, 0.235, salopette, s * 0.1, 0.24, 0)
  }
  // il motivo della maglia
  if (m.motivo === 'quadri') { scatola(busto, 0.03, 0.3, 0.225, segno, -0.1, 0.15, 0); scatola(busto, 0.03, 0.3, 0.225, segno, 0.1, 0.15, 0); scatola(busto, 0.362, 0.03, 0.225, segno, 0, 0.22, 0) }
  else if (m.motivo === 'pois') for (const [x, y] of [[-0.09, 0.22], [0.09, 0.22], [0, 0.17], [-0.1, 0.1], [0.1, 0.1]]) sfera(busto, 0.02, segno, x, y, 0.112, 1, 1, 0.3)
  else if (m.motivo === 'grembiule') {
    const bianco = mat(0xf6f3ee)
    scatola(busto, 0.26, 0.26, 0.03, bianco, 0, 0.12, 0.12); scatola(busto, 0.08, 0.07, 0.01, mat(0xd8d2c4), 0.05, 0.1, 0.14)
    for (const s of [-1, 1]) scatola(busto, 0.03, 0.14, 0.235, bianco, s * 0.08, 0.24, 0)
  } else if (m.motivo === 'festa') {
    const oro = mat(0xe0b030)
    if (donna) { scatola(busto, 0.375, 0.04, 0.235, oro, 0, 0.1, 0); scatola(busto, 0.1, 0.07, 0.03, oro, 0, 0.1, 0.12) }
    else for (const y of [0.1, 0.19, 0.28]) sfera(busto, 0.02, oro, 0, y, 0.115, 1, 1, 0.4)
  }
  // il collo
  const cc = mat(colloO.c)
  if (colloO.forma === 'fazzoletto') { cil(busto, 0.14, 0.12, 0.06, cc, 0, 0.31, 0); const nodo = cono(busto, 0.07, 0.1, cc, 0, 0.26, 0.12); nodo.rotation.x = Math.PI }
  else if (colloO.forma === 'sciarpa') { cil(busto, 0.15, 0.14, 0.08, cc, 0, 0.31, 0); scatola(busto, 0.07, 0.2, 0.03, cc, 0.07, 0.2, 0.125) }
  else if (colloO.forma === 'papillon') { scatola(busto, 0.03, 0.03, 0.03, cc, 0, 0.3, 0.12); for (const s of [-1, 1]) { const f = cono(busto, 0.045, 0.09, cc, s * 0.065, 0.3, 0.12, 4); f.rotation.z = -s * Math.PI / 2 } }
  else if (colloO.forma === 'scialle') { cil(busto, 0.2, 0.27, 0.09, cc, 0, 0.27, 0, 12); const p = cono(busto, 0.12, 0.17, cc, 0, 0.17, 0.12); p.rotation.x = Math.PI }
  // la testa
  const testa = perno(busto, 0, 0.34, 0)
  const sx = 1.05, sy = 0.95
  sfera(testa, 0.24, pelle, 0, 0.22, 0, sx, sy, 1)
  const faccia = new THREE.Mesh(G('faccia', () => new THREE.SphereGeometry(0.2425, 14, 10, Math.PI / 2 - 0.95, 1.9, 1.0, 1.3)),
    new THREE.MeshStandardMaterial({ map: trammaFaccia(donna, O('pelle').css), roughness: 0.9 }))
  faccia.position.set(0, 0.22, 0); faccia.scale.set(sx, sy, 1); testa.add(faccia)
  for (const s of [-1, 1]) sfera(testa, 0.045, pelle, s * 0.25, 0.2, 0, 1, 1.2, 0.8)
  // i capelli
  const capelli = mat(chioma.c)
  sfera(testa, 0.215, capelli, 0, 0.27, -0.05, sx, sy * 0.95, 0.95)
  if (chioma.stile === 'trecce') for (const s of [-1, 1]) {
    sfera(testa, 0.06, capelli, s * 0.2, 0.1, -0.05); sfera(testa, 0.055, capelli, s * 0.21, -0.01, -0.06); sfera(testa, 0.045, nastro, s * 0.21, -0.08, -0.06)
  } else if (chioma.stile === 'coda') {
    sfera(testa, 0.065, capelli, 0, 0.3, -0.22); sfera(testa, 0.06, capelli, 0, 0.2, -0.29, 1, 1.5, 1); sfera(testa, 0.05, capelli, 0, 0.08, -0.3, 1, 1.5, 1); sfera(testa, 0.035, nastro, 0, 0.3, -0.2)
  } else if (chioma.stile === 'caschetto') sfera(testa, 0.25, capelli, 0, 0.16, -0.08, 1.1, 0.85, 0.9)
  // il cappello
  const cm = mat(cap.c)
  if (cap.forma === 'paglia') {
    cil(testa, 0.36, 0.36, 0.03, cm, 0, 0.38, 0, 16)
    cil(testa, 0.17, 0.2, 0.16, cm, 0, 0.46, 0, 14)
    cil(testa, 0.202, 0.208, 0.045, nastro, 0, 0.395, 0, 14)
    if (donna) sfera(testa, 0.045, nastro, 0.2, 0.43, 0.06); else cono(testa, 0.012, 0.18, mat(0xd8b24a), -0.19, 0.44, 0.06, 4).rotation.z = 0.5   // un fiore, o una spiga
  } else if (cap.forma === 'berretto') {
    pezzo(testa, cupola, cm, 0, 0.3, 0, 1.05, 0.95, 1)
    const v = scatola(testa, 0.2, 0.02, 0.13, cm, 0, 0.315, 0.26); v.rotation.x = 0.18
    sfera(testa, 0.025, mat(scurisci(cap.c, 0.7)), 0, 0.52, 0)
  } else if (cap.forma === 'tesa') {
    cil(testa, 0.43, 0.43, 0.025, cm, 0, 0.37, 0, 16)
    cil(testa, 0.19, 0.21, 0.13, cm, 0, 0.43, 0, 14)
    cil(testa, 0.212, 0.214, 0.035, mat(scurisci(cap.c, 0.6)), 0, 0.395, 0, 14)
  } else if (cap.forma === 'fascia') {
    cil(testa, 0.19, 0.19, 0.045, cm, 0, 0.385, 0, 14)
    const fiore = mat(0xfff2f6), cuore = mat(0xe8b94a)
    for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; sfera(testa, 0.032, fiore, -0.12 + Math.cos(a) * 0.04 * 0.8, 0.405 + Math.sin(a) * 0.04, 0.15 + Math.cos(a) * 0.04 * 0.6) }
    sfera(testa, 0.025, cuore, -0.125, 0.405, 0.165)
  } else if (cap.forma === 'cowboy') {
    cil(testa, 0.4, 0.4, 0.025, cm, 0, 0.38, 0, 16)
    cil(testa, 0.15, 0.2, 0.2, cm, 0, 0.49, 0, 12)
    cil(testa, 0.202, 0.208, 0.04, mat(scurisci(cap.c, 0.55)), 0, 0.405, 0, 12)
    sfera(testa, 0.03, mat(0xe0b030), 0, 0.405, 0.2, 1, 1, 0.4)
  }
  const bracci = [-1, 1].map(s => {
    const p = perno(busto, s * 0.22, 0.28, 0)
    scatola(p, 0.09, 0.24, 0.1, maniche, 0, -0.11, 0); sfera(p, 0.055, pelle, 0, -0.27, 0, 1, 1, 1)
    if (m.motivo === 'quadri') scatola(p, 0.092, 0.03, 0.102, segno, 0, -0.06, 0)
    else if (m.motivo === 'maglione') scatola(p, 0.098, 0.035, 0.108, mat(scurisci(m.c, 1.25)), 0, -0.225, 0)
    return p
  })
  if (m.motivo === 'maglione') cil(busto, 0.15, 0.15, 0.05, mat(scurisci(m.c, 1.25)), 0, 0.3, 0)       // il collo alto
  // la falce e l'ascia nel pugno destro, solo mentre servono (come nel contadino di prima)
  const falce = perno(bracci[1], 0, -0.29, 0); falce.visible = false
  cil(falce, 0.018, 0.018, 1.1, mat(0x9a6a36), 0, -0.4, 0, 5)
  const lama = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.022, 4, 14, Math.PI * 0.7), mat(0xcfd6dc, { metalness: 0.5, roughness: 0.4 }))
  lama.rotation.set(Math.PI / 2, 0, Math.PI * 0.15); lama.position.set(0, -0.94, 0); falce.add(lama)
  const ascia = perno(bracci[1], 0, -0.29, 0); ascia.visible = false
  cil(ascia, 0.022, 0.022, 0.7, mat(0x9a6a36), 0, -0.25, 0, 5)
  scatola(ascia, 0.05, 0.16, 0.2, mat(0xcfd6dc, { metalness: 0.5, roughness: 0.4 }), 0, -0.56, 0.1)
  // la canna da pesca nel pugno destro, solo quando si pesca: un'asta lunga che punta avanti e in alto quando il braccio è alzato
  const canna = perno(bracci[1], 0, -0.29, 0); canna.visible = false
  cil(canna, 0.014, 0.022, 1.15, mat(0x8a5a2b), 0, -0.5, 0, 5)
  cil(canna, 0.03, 0.03, 0.13, mat(0x2a2018), 0, -0.04, 0, 6)               // l'impugnatura
  sfera(canna, 0.035, mat(0xd8352a), 0, -1.08, 0)                           // la punta rossa: si vede dove finisce il filo
  ombre(g)
  // ogni parte che le pose piegano è fusa a sé: le gambe, il busto (senza testa e braccia), la testa, i bracci
  for (const p of [...gambe, testa, ...bracci]) fondiPerMateriale(p)
  fondiPerMateriale(busto, { escludi: [testa, ...bracci] })
  g.userData = { gambe, busto, testa, bracci, falce, ascia, canna, aspetto: A.persona, abito: A }
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
  const g = new THREE.IcosahedronGeometry(1, DETTAGLIO < 1 ? 0 : 1); g.deleteAttribute('uv'); g.scale(...r); g.translate(...c)
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
  if (DETTAGLIO < 1) { n = Math.max(3, Math.round(n * DETTAGLIO)); lungo *= LOD_GROSSE; largo *= LOD_GROSSE }       // la versione da lontano: meno ciocche, più grosse
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
  const fai = k => G(k, () => {
    seme = [...k].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) % 2147483646, 7) + 1
    const parti = []; disegna(parti)
    const g = mergeGeometries(parti); g.translate(-o.x, -o.y, -o.z); g.computeBoundingSphere(); return g
  })
  const geo = fai(chiave)
  const m = new THREE.Mesh(geo, mat(0xffffff, { vertexColors: true })); m.castShadow = m.receiveShadow = true; perno.add(m)
  m.userData.lod = { alta: geo, bassa: () => daLontano(() => fai(chiave + ':lod')) }
  return m
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

/** Le quattro zampe all'aria, che pedalano piano (il cane a pancia in su). */
function zampe_aria (u, k, t) {
  u.zampe.forEach((z, i) => { z.rotation.x = -k * (1.6 + Math.sin(t * 9 + i * 1.7) * 0.4); z.position.y += 0.14 * k })
}

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
  // il bastoncino che riporta: un mesh solo (cilindro a cinque facce) in bocca, tenuto per traverso; si vede solo mentre lo porta
  const bastone = cil(testa, 0.016, 0.02, 0.5, mat(0x8a5a2b), 0, T.y - 0.17 - O.testa.y, T.z + 0.33 - O.testa.z, 5)
  bastone.rotation.z = Math.PI / 2; bastone.visible = false; bastone.castShadow = false
  bastone.userData.base = { p: bastone.position.clone(), r: bastone.rotation.clone() }
  for (const p of [corpo, posteriore, testa, frangia, lingua, ...orecchie, ...zampe]) p.userData.base = p.position.clone()
  orecchie.forEach(o => { o.rotation.z = o.userData.giro })
  zonaTocco(g, 0.6, 0.5)
  g.userData = { ...g.userData, corpo, posteriore, testa, frangia, orecchie, lingua, naso, occhi, zampe, bastone, tipo: 'cane' }
  return g
}

const liscia = x => { const k = Math.max(0, Math.min(1, x)); return k * k * (3 - 2 * k) }

/** Muove i perni del cane. `stato`: sta siede annusa dorme festa vaga segue e quelli delle sequenze (docs/fattoria3d/compagni.md): alza mano
    zampa rotola salta riporta starnuta gira sbadiglia incontra (con `sub`: annusa scodinzola lecca); `vel` 0..1 quanto va; `fase` il passo;
    `t` il tempo; `p` (0..1) a che punto è il passo della sequenza. */
export function posaCane (g, { stato = 'sta', vel = 0, fase = 0, t = 0, p = 0, sub = '' } = {}) {
  const u = g.userData, [fl, fr, bl, br] = u.zampe
  for (const p of [u.corpo, u.posteriore, u.testa, u.frangia, u.lingua, ...u.orecchie, ...u.zampe]) { p.position.copy(p.userData.base); p.rotation.set(0, 0, 0); p.scale.set(1, 1, 1) }
  u.orecchie.forEach(o => { o.rotation.z = o.userData.giro })
  u.occhi.forEach(o => o.scale.set(1, 1, 1))
  if (u.bastone.parent === u.testa) { u.bastone.visible = stato === 'riporta' && p < 0.5 }          // (posato, resta dov'è finché Compagni lo rimette)
  const resp = Math.sin(t * 2.2), ansima = Math.sin(t * 8)
  const alza = h => { u.corpo.position.y += h; u.zampe.forEach(z => { z.position.y += h }) }
  const lingua = (fuori, giu) => { u.lingua.scale.set(1 + fuori * 0.15, 1, 1 + fuori); u.lingua.rotation.x = giu; u.lingua.position.y += ansima * 0.004 }
  const orecchie = (k, avanti = 0) => u.orecchie.forEach((o, i) => { o.rotation.z += (i ? 1 : -1) * k; o.rotation.x = -avanti })
  lingua(0.25 + ansima * 0.05, 0.15)
  u.frangia.rotation.x = Math.sin(t * 1.3) * 0.03
  const gira = stato === 'gira' && p < 0.78
  if (gira) vel = 0.6
  if (vel > 0.05) {                                                    // il trotto, a coppie in diagonale, un po' goffo
    const amp = 0.55 * Math.min(1, 0.5 + vel), s = Math.sin(fase), rimbalzo = Math.sin(fase * 2)
    fl.rotation.x = br.rotation.x = s * amp; fr.rotation.x = bl.rotation.x = -s * amp
    u.corpo.position.y += Math.abs(Math.cos(fase)) * 0.035; u.corpo.rotation.z = s * 0.05
    u.posteriore.rotation.y = s * 0.12; u.testa.rotation.z = -s * 0.05; u.testa.rotation.x = rimbalzo * 0.05
    u.frangia.rotation.x = rimbalzo * 0.12 - 0.04; orecchie(rimbalzo * 0.15, 0.1 + vel * 0.15)
    if (vel > 0.7) lingua(0.9, 0.5)
  }
  const seduto = () => {                                               // il sedere a terra, il petto in su, le zampe dietro piegate avanti
    u.corpo.rotation.x = -0.5; u.corpo.position.y = 0.37; u.corpo.scale.y = 1 + resp * 0.015
    for (const z of [bl, br]) { z.position.y = 0.17; z.position.z += 0.08; z.rotation.x = -1.35 }
    for (const z of [fl, fr]) { z.position.z -= 0.08; z.rotation.x = 0.06 }
    u.testa.rotation.x = 0.42; u.testa.rotation.y = Math.sin(t * 0.7) * 0.35; u.posteriore.rotation.y = Math.sin(t * 3) * 0.04
    lingua(0.35 + ansima * 0.1, 0.25)
  }
  if (stato === 'siede') seduto()
  else if (stato === 'zampa') {                                        // seduto, la zampa davanti tesa verso l'eroe, la testa un po' storta
    seduto(); fr.rotation.x = -1.15 + Math.sin(t * 6) * 0.12; fr.position.y += 0.03
    u.testa.rotation.set(0.2, 0, 0.14); lingua(0.8 + ansima * 0.1, 0.4); orecchie(0.1); u.posteriore.rotation.y = Math.sin(t * 14) * 0.1
  } else if (stato === 'sbadiglia') {                                  // seduto, il muso in su, la bocca spalancata, gli occhi chiusi
    seduto(); const b = Math.pow(Math.sin(Math.min(1, p) * Math.PI), 0.6)
    u.testa.rotation.set(0.42 - 1.1 * b, 0, 0); lingua(0.35 + 1.2 * b, 0.25 + 0.9 * b); u.occhi.forEach(o => o.scale.y = 1 - 0.85 * b)
    u.testa.position.y += 0.03 * b; orecchie(0.1 * b)
  } else if (stato === 'rotola') {                                     // a pancia in su, le zampe all'aria, dondola
    const k = liscia(p / 0.2) * liscia((1 - p) / 0.2)
    u.corpo.rotation.z = k * Math.PI + Math.sin(t * 7) * 0.16 * k; u.corpo.position.y += 0.2 * k
    zampe_aria(u, k, t)
    u.testa.rotation.z = -k * 1.3; u.testa.rotation.x = -0.25 * k; lingua(0.2 + 0.9 * k, 0.4 * k); orecchie(-0.3 * k, 0.2 * k)
    u.posteriore.rotation.y = Math.sin(t * 14) * 0.3 * k
  } else if (stato === 'salta') {                                      // saltelli sul posto, le orecchie al vento
    const h = Math.abs(Math.sin(t * 8)); alza(h * 0.22)
    fl.rotation.x = fr.rotation.x = -0.55 * h - 0.1; bl.rotation.x = br.rotation.x = 0.5 * h
    u.corpo.rotation.x = 0.2 - 0.3 * h; u.testa.rotation.x = -0.3 * h; u.posteriore.rotation.y = Math.sin(t * 16) * 0.4
    orecchie(0.1 + 0.35 * (1 - h), 0.3 * h); lingua(1, 0.5)
  } else if (stato === 'riporta') {                                    // il bastoncino in bocca: abbassa il muso e lo posa
    const giu = liscia((p - 0.3) / 0.2) * (1 - liscia((p - 0.6) / 0.2))
    u.testa.rotation.x = -0.1 + 0.9 * giu; u.testa.position.y -= 0.14 * giu; u.testa.position.z += 0.06 * giu; u.corpo.rotation.x = 0.1 * giu
    u.posteriore.rotation.y = Math.sin(t * 16) * 0.35; lingua(p < 0.5 ? 0.05 : 0.9, 0.3); orecchie(0.1 + 0.15 * giu, 0.15)
  } else if (stato === 'starnuta') {                                   // prende fiato col muso in su, uno scatto in giù, poi scuote testa e orecchie
    const su = liscia(p / 0.34) * (1 - liscia((p - 0.34) / 0.06)), dopo = Math.max(0, 1 - (p - 0.42) / 0.45) * (p > 0.4 ? 1 : 0), sc = Math.sin(t * 30)
    u.testa.rotation.x = -0.55 * su + (p > 0.38 && p < 0.5 ? 0.7 : 0) + 0.1; u.testa.rotation.y = sc * 0.45 * dopo; u.corpo.position.y -= 0.03 * (p > 0.38 && p < 0.46 ? 1 : 0)
    u.frangia.rotation.x = sc * 0.2 * dopo; orecchie(Math.abs(sc) * 0.55 * dopo, 0.1); lingua(0.2, 0.2); u.occhi.forEach(o => o.scale.y = 1 - 0.8 * (su > 0.8 || dopo > 0.5 ? 1 : 0))
  } else if (stato === 'gira') {                                       // si rincorre il moncherino; poi si ferma stordito, ridendo
    if (gira) { u.testa.rotation.y = 0.95; u.posteriore.rotation.y = 0.5; u.corpo.rotation.z = -0.1; orecchie(0.25, 0.1) }
    else { u.corpo.rotation.z = Math.sin(t * 4) * 0.09; u.testa.rotation.set(0.2, 0, Math.sin(t * 5) * 0.3); orecchie(0.1); lingua(1.3, 0.8); u.posteriore.rotation.y = Math.sin(t * 14) * 0.2 }
  } else if (stato === 'mano') {                                       // annusa la mano dell'eroe
    u.testa.rotation.x = 0.6 + Math.sin(t * 10) * 0.05; u.testa.position.y -= 0.1; u.testa.position.z += 0.05; u.posteriore.rotation.y = Math.sin(t * 9) * 0.2; lingua(0, 0); orecchie(0, 0.2)
  } else if (stato === 'alza') {                                       // sente il suo nome: la testa su, le orecchie dritte
    u.testa.rotation.x = -0.35; u.testa.position.y += 0.04; orecchie(0.3, 0.25); lingua(0.1, 0.1)
  } else if (stato === 'incontra') {                                   // il gatto è lì: il muso giù ad annusare, poi coda e lingua
    const k = Math.sin(t * 16)
    if (sub === 'scodinzola') { u.posteriore.rotation.y = k * 0.42; u.corpo.rotation.z = k * 0.05; u.testa.rotation.x = 0.3; lingua(1, 0.5); orecchie(Math.abs(Math.sin(t * 6)) * 0.15) }
    else if (sub === 'lecca') { u.testa.rotation.x = 0.85 + Math.sin(t * 5) * 0.1; u.testa.position.y -= 0.1; u.testa.position.z += 0.05; lingua(1.4, 0.9 + Math.sin(t * 10) * 0.25); u.posteriore.rotation.y = k * 0.3 }
    else { u.testa.rotation.x = 0.75 + Math.sin(t * 9) * 0.06; u.testa.position.y -= 0.1; u.testa.position.z += 0.05; u.posteriore.rotation.y = Math.sin(t * 5) * 0.12; lingua(0, 0); orecchie(-0.05, 0.25) }
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
// Gatti di cartone morbido: testa grande e tonda, orecchie a triangolo con l'interno rosa, occhi enormi (una trama canvas
// trasparente sul davanti della testa, una per mantello), corpo ovale. Il pelo è fatto di palle lisce fuse in un mesh per pezzo,
// col mantello nei vertici (macchie, strisce, pancia chiara): pochi mesh e niente luci. Perni e pose come prima.
const BIANCO_G = 0xf6f3ee, NERO_G = 0x26262c
const MANTELLI = {
  bianconero: { occhi: '#8fd14f', naso: '#f09aa6', lucido: 0.9 },
  calico:     { occhi: '#a6dc7a', naso: '#f09aa6', lucido: 0.9 },
  nero:       { occhi: '#ffd23a', naso: '#c8808c', lucido: 0.5 },
}
const _c2 = new THREE.Color()
const mescola = (k, hex, t) => { if (t > 0) k.lerp(_c2.setHex(hex), Math.min(1, t)); return k }
const ellisse = (p, c, r) => Math.sqrt(((p.x - c[0]) / r[0]) ** 2 + ((p.y - c[1]) / r[1]) ** 2 + ((p.z - c[2]) / r[2]) ** 2)
const ombraSotto = (k, p) => k.multiplyScalar(0.86 + 0.14 * liscio(-0.02, 0.16, p.y))      // la pancia un filo più scura: dà volume

/** Il colore del mantello nei vertici: `corpo`, `testa`, `zampa(i)`, `coda(k)`; `p` è nel perno del pezzo. */
function coloriGatto (v) {
  if (v === 'calico') {                                                                          // Irene: tricolore a chiazze grandi, bianca sotto
    const AR = 0xe8872a
    const chiazza = p => Math.sin(p.z * 13 + 1.2) * Math.cos(p.x * 24 + 0.4) + 0.55 * Math.sin(p.y * 22 + p.z * 7)      // dove nero (>0.15) e dove arancione
    const nera = (k, t) => mescola(k, NERO_G, t)
    return {
      corpo: (p, k) => { k.setHex(BIANCO_G); const su = liscio(0.03, 0.1, p.y) * (1 - liscio(0.3, 0.35, p.z) * (1 - liscio(0.17, 0.22, p.y)))
        const c = chiazza(p), buco = liscio(0.62, 0.78, Math.sin(p.z * 21 + 0.5) * Math.sin(p.x * 38 + 2))
        mescola(k, AR, su * (1 - buco)); nera(k, su * (1 - buco) * liscio(0.1, 0.3, c)); return ombraSotto(k, p) },
      testa: (p, k) => { k.setHex(BIANCO_G); const ax = Math.abs(p.x), sx = Math.sign(p.x) || 1, davanti = liscio(0.06, 0.12, p.z), w = 0.012 + 0.07 * liscio(0.2, 0.04, p.y)
        const bianco = Math.max(davanti * (1 - liscio(w - 0.015, w + 0.015, ax)) * (1 - liscio(0.17, 0.22, p.y)),
          liscio(0.08, 0.13, p.z) * (1 - liscio(0.05, 0.09, p.y)) * (1 - liscio(0.1, 0.17, ax)))
        mescola(k, AR, 1 - bianco)                                                                // fronte e guance arancioni
        nera(k, (1 - bianco) * (sx < 0 ? liscio(0.1, 0.14, p.y) + 0.45 * liscio(0.1, 0.0, p.y) * liscio(0.07, 0.12, ax) : liscio(0.17, 0.21, p.y) * liscio(0.04, 0.1, ax)))   // un lato più nero, l'altro più arancione
        return k },
      zampa: i => (p, k) => { k.setHex(BIANCO_G)
        if (i < 2) { mescola(k, i ? NERO_G : AR, liscio(-0.04, 0.0, p.y)); mescola(k, AR, liscio(0.25, 0.5, Math.sin(p.y * 75)) * liscio(-0.17, -0.1, p.y) * liscio(-0.03, -0.06, p.y)) }
        else { mescola(k, i === 2 ? AR : NERO_G, 1 - liscio(-0.15, -0.17, p.y)); if (i === 2) mescola(k, NERO_G, liscio(0.0, 0.05, p.y)) }
        return k },
      coda: n => (p, k) => { k.setHex(AR); nera(k, liscio(-0.1, 0.25, Math.sin((p.y + n * 0.2) * 55)) * 0.9 + (n === 2 ? liscio(0.1, 0.17, p.y) : 0)); return k },
    }
  }
  if (v === 'nero') {
    const N = 0x2a2a32
    return {
      corpo: (p, k) => { k.setHex(N); mescola(k, BIANCO_G, (1 - liscio(0.03, 0.075, Math.abs(p.x))) * liscio(0.3, 0.34, p.z) * (1 - liscio(0.11, 0.16, p.y))); return ombraSotto(k, p) },
      testa: (p, k) => k.setHex(N),
      zampa: () => (p, k) => k.setHex(N),
      coda: () => (p, k) => k.setHex(N),
    }
  }
  return {                                                                                       // bianconero: Sherlock, il tuxedo di casa (foto vera)
    // nero, col bavaglino che scende fra le zampe e un po' di bianco sul ventre
    corpo: (p, k) => { k.setHex(NERO_G); const ax = Math.abs(p.x), larg = 0.05 + 0.09 * liscio(0.2, 0.0, p.y)
      mescola(k, BIANCO_G, liscio(0.3, 0.34, p.z) * (1 - liscio(larg - 0.02, larg + 0.02, ax)) * (1 - liscio(0.17, 0.21, p.y)))
      mescola(k, BIANCO_G, (1 - liscio(-0.01, 0.04, p.y)) * liscio(0.05, 0.15, p.z) * (1 - liscio(0.06, 0.1, ax))); return ombraSotto(k, p) },
    // la testa nera con la striscia bianca dalla fronte al naso, che si apre nel muso e nelle guance bianche
    testa: (p, k) => { k.setHex(NERO_G); const ax = Math.abs(p.x), davanti = liscio(0.06, 0.12, p.z), w = 0.012 + 0.07 * liscio(0.2, 0.04, p.y)
      const striscia = davanti * (1 - liscio(w - 0.015, w + 0.015, ax)) * (1 - liscio(0.17, 0.22, p.y))
      const muso = liscio(0.08, 0.13, p.z) * (1 - liscio(0.05, 0.09, p.y)) * (1 - liscio(0.1, 0.17, ax))
      return mescola(k, BIANCO_G, Math.max(striscia, muso)) },
    // le zampe davanti bianche dal gomito, le dietro nere con la zampetta bianca
    zampa: i => (p, k) => { k.setHex(NERO_G); return mescola(k, BIANCO_G, i < 2 ? liscio(-0.04, -0.08, p.y) : liscio(-0.14, -0.17, p.y)) },
    coda: () => (p, k) => k.setHex(NERO_G),
  }
}
const sferaG = (seg, righe) => G(`sg${seg},${righe}`, () => { const s = new THREE.SphereGeometry(1, seg, righe); s.deleteAttribute('uv'); return s })
function palla (parti, c, r, colore, seg = 14, righe = 10) { if (DETTAGLIO < 1) { seg = Math.max(5, Math.round(seg * LOD_FACCE)); righe = Math.max(3, Math.round(righe * LOD_FACCE)) }; const g = sferaG(seg, righe).clone(); g.scale(...r); g.translate(...c); tingi(g, colore); parti.push(g) }
function tubo (parti, rs, ri, h, c, colore, seg = 10) { if (DETTAGLIO < 1) seg = Math.max(5, Math.round(seg * LOD_FACCE)); const g = new THREE.CylinderGeometry(rs, ri, h, seg, 1); g.deleteAttribute('uv'); g.translate(...c); tingi(g, colore); parti.push(g) }
/** Un pezzo di pelo liscio: i volumi in `parti` fusi in un mesh solo (la geometria si fa una volta, per chiave). */
function morbido (perno, chiave, lucido, disegna) {
  const fai = k => G(k, () => { const parti = []; disegna(parti); const g = mergeGeometries(parti); g.computeBoundingSphere(); return g })
  const geo = fai(chiave)
  const m = new THREE.Mesh(geo, mat(0xffffff, { vertexColors: true, flatShading: false, roughness: lucido })); m.castShadow = m.receiveShadow = true; perno.add(m)
  m.userData.lod = { alta: geo, bassa: () => daLontano(() => fai(chiave + ':lod')) }
  return m
}

const facceGatto = new Map()
/** La faccia: occhi grandi con la fessura e il riflesso, nasino a triangolo, bocca a «w», puntini dei baffi; sfondo trasparente. */
function facciaGatto (v, chiusi = false) {
  const chiave = v + (chiusi ? ':dorme' : '')
  if (facceGatto.has(chiave)) return facceGatto.get(chiave)
  const M = MANTELLI[v], c = document.createElement('canvas'); c.width = 256; c.height = 192
  const x = c.getContext('2d')
  for (const s of chiusi ? [-1, 1] : []) {                                                // a occhi chiusi: due archi in giù, con le ciglia
    const ex = 128 + s * 56, ey = 76
    x.strokeStyle = v === 'nero' ? '#ffd23a' : '#2a2024'; x.lineWidth = 7; x.lineCap = 'round'
    x.beginPath(); x.arc(ex, ey - 12, 28, 0.25 * Math.PI, 0.75 * Math.PI); x.stroke()
  }
  for (const s of chiusi ? [] : [-1, 1]) {
    const ex = 128 + s * 56, ey = 76
    x.fillStyle = '#17141a'; x.beginPath(); x.ellipse(ex, ey, 36, 40, 0, 0, 7); x.fill()                                  // il contorno
    x.fillStyle = M.occhi; x.beginPath(); x.ellipse(ex, ey, 31, 35, 0, 0, 7); x.fill()                                    // l'iride, più scura in alto
    x.fillStyle = 'rgba(20,60,20,.4)'; x.beginPath(); x.ellipse(ex, ey - 2, 30, 24, 0, Math.PI, 2 * Math.PI); x.fill()
    x.fillStyle = '#0b0a0d'; x.beginPath(); x.ellipse(ex, ey + 1, 9, 29, 0, 0, 7); x.fill()                                // la pupilla a fessura
    x.fillStyle = '#fff'; x.beginPath(); x.arc(ex + 10, ey - 15, 8.5, 0, 7); x.fill()                                      // i riflessi
    x.beginPath(); x.arc(ex - 11, ey + 15, 4.5, 0, 7); x.fill()
    x.fillStyle = 'rgba(0,0,0,.35)'; for (const [a, b] of [[44, 134], [58, 142], [36, 146]]) { x.beginPath(); x.arc(128 + s * a, b, 2.6, 0, 7); x.fill() }   // i puntini dei baffi
  }
  x.fillStyle = M.naso; x.strokeStyle = '#5a3a40'; x.lineWidth = 2.5; x.lineJoin = 'round'
  x.beginPath(); x.moveTo(113, 113); x.lineTo(143, 113); x.lineTo(128, 130); x.closePath(); x.fill(); x.stroke()            // il nasino
  x.strokeStyle = '#4a3036'; x.lineWidth = 4; x.lineCap = 'round'; x.beginPath(); x.moveTo(128, 130); x.lineTo(128, 139)    // la bocca a «w»
  x.moveTo(128, 139); x.quadraticCurveTo(121, 150, 108, 140); x.moveTo(128, 139); x.quadraticCurveTo(135, 150, 148, 140); x.stroke()
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4
  facceGatto.set(chiave, t)
  return t
}

/** Un gatto di cartone morbido: corpo ovale con la schiena un po' inarcata, testa tonda con le guance piene, orecchie grandi
    rosa dentro, zampe sottili con la zampetta tonda, coda lunga in tre pezzi che ondeggia. */
export function creaGatto (variante = 'bianconero') {
  const M = MANTELLI[variante] || MANTELLI.bianconero
  const v = MANTELLI[variante] ? variante : 'bianconero'
  const col = coloriGatto(v), g = new THREE.Group()
  const rosa = mat(v === 'nero' ? 0xc8808c : 0xf0a0ac)
  const corpo = perno(g, 0, 0.2, -0.18)
  morbido(corpo, `gatto:${v}:corpo`, M.lucido, parti => {
    palla(parti, [0, 0.108, 0.17], [0.137, 0.13, 0.28], col.corpo, 24, 14)                  // il corpo ovale, un po' più alto a metà schiena
    palla(parti, [0, 0.09, 0.0], [0.122, 0.115, 0.125], col.corpo, 14, 10)                   // il dietro tondo
    palla(parti, [0, 0.075, 0.35], [0.115, 0.125, 0.11], col.corpo, 14, 10)                  // il petto
    palla(parti, [0, 0.18, 0.37], [0.095, 0.09, 0.09], col.corpo, 12, 8)                     // il collo
  })
  // la testa: il perno al collo; tonda, grande, con le guance piene
  const testa = perno(corpo, 0, 0.14, 0.4)
  morbido(testa, `gatto:${v}:testa`, M.lucido, parti => {
    palla(parti, [0, 0.1, 0.06], [0.17, 0.14, 0.145], col.testa, 24, 16)
    for (const s of [-1, 1]) palla(parti, [s * 0.1, 0.05, 0.1], [0.08, 0.07, 0.075], col.testa, 12, 8)
  })
  const facce = [false, true].map(chiusi => {                                            // occhi aperti, e chiusi per quando dorme
    const f = new THREE.Mesh(G('faccia-gatto', () => new THREE.SphereGeometry(0.1, 20, 12, Math.PI / 2 - 1.0, 2.0, 0.95, 1.3)),
      new THREE.MeshStandardMaterial({ map: facciaGatto(v, chiusi), transparent: true, roughness: 0.9, depthWrite: false, polygonOffsetFactor: -2, polygonOffsetUnits: -2, polygonOffset: true }))
    f.position.set(0, 0.1, 0.06); f.scale.set(0.17 * 10 * 1.012, 0.14 * 10 * 1.012, 0.145 * 10 * 1.012); f.visible = !chiusi; testa.add(f); return f
  })
  const orecchie = [-1, 1].map(s => {
    const fuoriM = v === 'bianconero' ? mat(NERO_G) : v === 'calico' ? mat(NERO_G) : v === 'nero' ? mat(0x2a2a32) : mat(BIANCO_G)
    const o = cono(testa, 0.085, 0.17, fuoriM, s * 0.105, 0.29, 0.03, 3); o.scale.z = 0.55; o.rotation.set(0, Math.PI, -s * 0.28)
    const d = cono(testa, 0.055, 0.115, rosa, s * 0.103, 0.282, 0.03 + 0.012, 3); d.scale.z = 0.55; d.rotation.set(0, Math.PI, -s * 0.28)
    return [o, d]
  })
  // i baffi: sei fili sottili in un mesh solo
  const baffi = G('baffi-gatto', () => {
    const parti = []
    for (const s of [-1, 1]) for (const [dz, dy] of [[0.35, 0.2], [0, 0], [-0.3, -0.18]]) {
      const b = new THREE.BoxGeometry(0.15, 0.004, 0.004); b.translate(s * 0.075, 0, 0)
      b.applyMatrix4(_m.compose(_p.set(s * 0.06, 0.055 + dy * 0.05, 0.17), _q.setFromEuler(new THREE.Euler(0, s * -dz * 0.8, s * dy * 0.9)), _s.set(1, 1, 1))); parti.push(b)
    }
    return mergeGeometries(parti)
  })
  const bf = new THREE.Mesh(baffi, mat(0xf2eee6)); bf.castShadow = false; testa.add(bf)
  const gambe = [[-0.07, 0.16], [0.07, 0.16], [-0.07, -0.16], [0.07, -0.16]].map(([x, z], i) => {
    const p = perno(g, x, 0.2, z), c = col.zampa(i)
    morbido(p, `gatto:${v}:zampa${i}`, M.lucido, parti => {
      tubo(parti, 0.04, 0.03, 0.17, [0, -0.095, 0], c, 10); palla(parti, [0, -0.01, 0], [0.043, 0.04, 0.043], c, 10, 8)    // la spalla tonda
      palla(parti, [0, -0.185, 0.014], [0.05, 0.03, 0.062], c, 10, 8)                              // la zampetta tonda
      if (i > 1) palla(parti, [0, 0.03, -0.01], [0.052, 0.085, 0.1], c, 10, 8)                     // la coscia
    })
    p.userData.base = [x, 0.2, z]; return p
  })
  // la coda lunga e morbida, in tre pezzi
  const coda1 = perno(corpo, 0, 0.14, -0.08), coda2 = perno(coda1, 0, 0.2, 0), coda3 = perno(coda2, 0, 0.18, 0)
  const code = [[coda1, 0.2, 0.052, 0.046], [coda2, 0.18, 0.046, 0.042], [coda3, 0.16, 0.042, 0.036]]
  code.forEach(([p, h, r1, r2], n) => morbido(p, `gatto:${v}:coda${n}`, M.lucido, parti => {
    tubo(parti, r2, r1, h, [0, h / 2, 0], col.coda(n), 10); palla(parti, [0, 0, 0], [r1, r1, r1], col.coda(n), 10, 8)
    if (n === 2) palla(parti, [0, h, 0], [r2, r2, r2], col.coda(n), 10, 8)                          // la punta tonda
  }))
  zonaTocco(g, 0.38, 0.22)
  g.userData = { ...g.userData, corpo, testa, gambe, coda: [coda1, coda2, coda3], orecchie: orecchie.flat(), facce, tipo: 'gatto', variante: v }
  return g
}

/** Muove i perni del gatto. Stati: sta siede lava dorme stiracchia fusa vaga fugge e quelli delle sequenze: struscia rotola miao volta
    incontra (con `sub`: annusa struscia zampata infastidito). `p` (0..1) è a che punto è lo stato. */
export function posaGatto (g, { stato = 'sta', vel = 0, fase = 0, t = 0, p = 0, sub = '' } = {}) {
  const u = g.userData, [fl, fr, bl, br] = u.gambe, [c1, c2, c3] = u.coda
  u.gambe.forEach(z => { z.rotation.set(0, 0, 0); z.position.set(...z.userData.base); z.scale.set(1, 1, 1) })
  u.corpo.rotation.set(0, 0, 0); u.corpo.position.set(0, 0.2, -0.18); u.corpo.scale.set(1, 1, 1)
  u.testa.rotation.set(0, 0, 0); u.testa.position.set(0, 0.14, 0.4); const chiusi = stato === 'dorme' || ((stato === 'fusa' || stato === 'struscia' || (stato === 'incontra' && sub === 'struscia')) && Math.sin(t * 1.1) > 0.45)   // con le fusa gli occhi si socchiudono piano
  u.facce[0].visible = !chiusi; u.facce[1].visible = chiusi
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
    u.corpo.rotation.x = -1.05; u.corpo.position.y = 0.11                  // il petto in su, il sedere a terra
    const stretto = u.variante === 'bianconero' ? 0.72 : 1                       // Sherlock siede composto: le davanti dritte e ravvicinate
    for (const z of [fl, fr]) { z.scale.y = 1.5; z.position.set(z.userData.base[0] * stretto, 0.36, -0.09) }   // le davanti dritte dal petto a terra
    for (const z of [bl, br]) { z.rotation.x = -1.35; z.position.set(z.userData.base[0], 0.085, -0.2) }
    u.testa.rotation.x = 1.0
    c1.rotation.set(-0.75, 0, 0); c2.rotation.set(0, 0, 1.4); c3.rotation.set(0, 0, 1.6)         // la coda a terra, che gira di lato
  }
  if (stato === 'siede') { seduto(); u.testa.rotation.y = Math.sin(t * 0.8) * (u.variante === 'bianconero' ? 0.25 : 0.5); u.corpo.scale.y = 1 + resp * 0.012; c3.rotation.z = Math.sin(t * 1.4) * 0.3 }
  else if (stato === 'lava') {                                         // seduto, la zampa su, la testa che si china
    seduto(); fl.rotation.x = -2.1 + Math.sin(t * 7) * 0.12; u.testa.rotation.x = 1.45 + Math.sin(t * 7) * 0.1; u.testa.rotation.z = 0.15
  } else if (stato === 'dorme') {                                      // a ciambella: il corpo steso, le zampe sotto, la testa sulle zampe, la coda attorno
    u.corpo.position.y = 0.045; u.corpo.scale.set(1.05, 0.8 * (1 + resp * 0.04), 0.9)
    for (const z of u.gambe) { z.position.y = 0.09; z.scale.y = 0.4 }
    u.testa.position.set(0.09, 0.14, 0.36); u.testa.rotation.set(0.55, -0.5, -0.2)
    c1.rotation.set(-1.8, 0, 0.3); c2.rotation.set(0, 0, 1.2); c3.rotation.set(0, 0, 2.1)
  } else if (stato === 'stiracchia') {                                 // il sedere in su, il petto in giù, le zampe avanti
    const k = Math.sin(Math.min(1, p) * Math.PI)
    u.corpo.rotation.x = 0.5 * k; u.corpo.position.y = 0.2 + 0.03 * k
    fl.rotation.x = fr.rotation.x = -1.1 * k; u.testa.rotation.x = -0.2 * k
    c1.rotation.x = -0.2 * k - 0.8 * (1 - k); onda(1, 0.2)
  } else if (stato === 'fusa') {                                       // le fusa: un tremolio, la coda piano
    u.corpo.position.y += Math.sin(t * 55) * 0.003; u.testa.rotation.x = 0.15; u.testa.rotation.y = Math.sin(t * 2) * 0.2; onda(0.6, 0.25)
  } else if (stato === 'struscia') {                                   // si struscia contro le gambe: testa e fianco, la coda dritta con la punta ripiegata
    const o = Math.sin(t * 2.4)
    u.corpo.rotation.y = o * 0.3; u.corpo.position.x = o * 0.08; u.testa.rotation.set(0.25, 0, o * 0.25); u.testa.position.z += 0.02
    c1.rotation.set(-0.1, 0, o * 0.08); c2.rotation.set(0, 0, 0); c3.rotation.set(0.95, 0, 0)
  } else if (stato === 'rotola') {                                     // si rovescia sulla schiena, le zampe all'aria
    const k = liscia(p / 0.2) * liscia((1 - p) / 0.2)
    u.corpo.rotation.z = k * Math.PI + Math.sin(t * 6) * 0.12 * k; u.corpo.position.y += 0.08 * k
    u.gambe.forEach((z, i) => { z.rotation.x = -k * (1.5 + Math.sin(t * 8 + i * 1.5) * 0.4); z.position.y += 0.1 * k })
    u.testa.rotation.z = -k * 1.1; u.testa.rotation.x = -0.2 * k; c1.rotation.set(-1.3 - 1.0 * k, 0, 0.4 * k); onda(1, 0.3)
  } else if (stato === 'miao') {                                       // seduto, il muso in su che miagola
    seduto(); const b = Math.sin(Math.min(1, p) * Math.PI)
    u.testa.rotation.x = 1.0 - 0.6 * b; u.testa.position.y += 0.015 * b; u.corpo.scale.y = 1 + 0.02 * b; c3.rotation.z = Math.sin(t * 1.4) * 0.3
  } else if (stato === 'volta') {                                      // seduto di schiena (Compagni lo gira), la coda che scatta
    seduto(); u.testa.rotation.y = 0.25; c3.rotation.z = 1.6 + Math.sin(t * 15) * 0.5; c2.rotation.z = 1.4 + Math.sin(t * 15 - 0.6) * 0.2
  } else if (stato === 'incontra') {                                   // con Watson: naso a naso, una zampata leggera, la faccia seccata
    if (sub === 'zampata') { fl.rotation.x = -1.3 + Math.max(0, Math.sin(t * 9)) * 0.6; u.corpo.rotation.x = -0.12; c1.rotation.set(-0.15, 0, 0); c2.rotation.set(0, 0, 0); c3.rotation.set(0.6, 0, 0); u.testa.rotation.x = -0.1 }
    else if (sub === 'infastidito') { u.testa.rotation.set(0.1, 0.7, 0.1); c1.rotation.x = -1.0; c3.rotation.z = Math.sin(t * 12) * 0.5; u.corpo.scale.y = 1 + resp * 0.012 }
    else if (sub === 'struscia') {
      const o = Math.sin(t * 2.4)
      u.corpo.rotation.y = o * 0.3; u.corpo.position.x = o * 0.06; u.testa.rotation.set(0.2, 0, o * 0.25); c1.rotation.set(-0.1, 0, o * 0.08); c2.rotation.set(0, 0, 0); c3.rotation.set(0.95, 0, 0)
    } else { u.corpo.rotation.x = -0.15; u.testa.rotation.x = -0.25; u.testa.position.z += 0.04; u.testa.position.y += 0.03; c1.rotation.set(-0.3, 0, 0); c2.rotation.set(0, 0, 0); c3.rotation.set(0.7, 0, 0) }
  } else { u.corpo.scale.y = 1 + resp * 0.012; u.testa.rotation.y = Math.sin(t * 0.7) * 0.3; onda(1, 0.35) }
}

const SCALA_GATTO = 1.15        // i gatti di casa devono leggersi dalla telecamera di serie
const SCALA_CANE = 0.8          // Watson è un cane grande, ma in scena doveva stare più piccolo del contadino

/** Il modello di un compagno dai dati (`dati/compagni.js`). */
export function creaCompagno (c) {
  const g = c.tipo === 'cane' ? creaCane() : creaGatto(c.variante)
  g.scale.setScalar(c.tipo === 'cane' ? SCALA_CANE : SCALA_GATTO)
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

// la cache (scena3d/cache-modelli.js): il contadino si costruisce e si fonde una volta per abito (chiave = persona e capi)
export const creaContadino = memoModello('contadino', costruisciContadino, {
  chiave: (arg = 'contadino') => chiaveAbito(typeof arg === 'string' ? abitoDiSerie(arg) : normalizzaAbito(arg, arg && arg.persona)),
})
