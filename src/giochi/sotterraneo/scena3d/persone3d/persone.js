// Generato da strumenti/promuovi-3d.mjs da poc/persone-3d/persone.js: non si tocca a mano (si cambia il prototipo e si rilancia `npm run promuovi3d`).
// PoC: le persone del mondo di sopra del Sotterraneo (villaggio, botteghe, missioni) come personaggi 3D in codice, al posto
// degli sprite. Stessa famiglia degli eroi (poc/eroi-3d/eroi.js): chibi, testa grande, low-poly a facce piatte, la faccia su una
// trama canvas. Un corpo solo coi parametri (altezza, corporatura, pelle, capelli, barba), poi ognuno i suoi panni e il suo arnese.
// Autonomo (solo three). Contratto: `creaPersona(chiave)` → Group, piedi a y = 0, davanti +z;
// `userData = { chiave, anima(t), saluta(t), altezza, triangoli }`: `saluta(t)` fa partire il saluto all'istante t (la mano alzata,
// circa 2,4 s), `anima(t)` è funzione del tempo (respiro, sguardo, ammiccare, un gesto ogni 6-9 s). `altezza` è la cima della
// testa o del cappello senza gli arnesi (lancia, zaino, canna): per normalizzare si usa quella, non il Box3 intero.
import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

export const CHIAVI = ['armaiolo', 'incantatrice', 'erborista', 'rigattiere', 'minatore', 'capitano', 'ragazza', 'eremita', 'guardia', 'boscaiolo', 'pescatore', 'mugnaio', 'cacciatrice', 'carovaniere']

// ── mattoncini ──
const cacheMat = new Map()
function M (colore, o = {}) {
  const k = colore + JSON.stringify(o)
  if (!cacheMat.has(k)) cacheMat.set(k, new THREE.MeshStandardMaterial({ color: colore, roughness: 0.85, metalness: 0, flatShading: true, ...o }))
  return cacheMat.get(k)
}
const metallo = (c, o = {}) => M(c, { metalness: 0.45, roughness: 0.4, ...o })
const luce = (c, f = 0.9) => M(c, { emissive: c, emissiveIntensity: f, roughness: 0.4 })
const luceSua = (c, f = 1) => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: f, roughness: 0.4, flatShading: true })
const DOPPIO = { side: THREE.DoubleSide }
const geo = new Map()
const G = (k, f) => { if (!geo.has(k)) geo.set(k, f()); return geo.get(k) }
function pezzo (g, geometria, m, x, y, z, sx = 1, sy = 1, sz = 1) {
  const o = new THREE.Mesh(geometria, m); o.position.set(x, y, z); o.scale.set(sx, sy, sz); o.castShadow = o.receiveShadow = true; g.add(o); return o
}
const scatola = (g, w, h, d, m, x = 0, y = 0, z = 0) => pezzo(g, G(`b${w},${h},${d}`, () => new THREE.BoxGeometry(w, h, d)), m, x, y, z)
const sfera = (g, r, m, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1, seg = 8) => pezzo(g, G(`s${r},${seg}`, () => new THREE.SphereGeometry(r, seg, Math.max(5, seg * 0.7 | 0))), m, x, y, z, sx, sy, sz)
const rozza = (g, r, m, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1) => pezzo(g, G(`i${r}`, () => new THREE.IcosahedronGeometry(r, 0)), m, x, y, z, sx, sy, sz)
const cil = (g, rs, ri, h, m, x = 0, y = 0, z = 0, seg = 8) => pezzo(g, G(`c${rs},${ri},${h},${seg}`, () => new THREE.CylinderGeometry(rs, ri, h, seg)), m, x, y, z)
const cono = (g, r, h, m, x = 0, y = 0, z = 0, seg = 6) => pezzo(g, G(`n${r},${h},${seg}`, () => new THREE.ConeGeometry(r, h, seg)), m, x, y, z)
const toro = (g, R, r, m, x = 0, y = 0, z = 0, seg = 12) => pezzo(g, G(`t${R},${r},${seg}`, () => new THREE.TorusGeometry(R, r, 4, seg)), m, x, y, z)
const perno = (g, x = 0, y = 0, z = 0) => { const p = new THREE.Group(); p.position.set(x, y, z); g.add(p); return p }
const SU = new THREE.Vector3(0, 1, 0)
/** Un cono dalla base `a` alla punta `b`. */
function punta (g, a, b, r, m, seg = 5) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A)
  const o = cono(g, r, d.length(), m, 0, 0, 0, seg); o.position.copy(A).addScaledVector(d, 0.5); o.quaternion.setFromUnitVectors(SU, d.normalize()); return o
}
/** Un tubo tra due punti (r1 in `a`, r2 in `b`); `tondi` mette una sfera alle estremità. */
function tubo (g, a, b, r1, r2, m, seg = 6, tondi = false) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A)
  const o = cil(g, r2, r1, d.length(), m, 0, 0, 0, seg); o.position.copy(A).addScaledVector(d, 0.5); o.quaternion.setFromUnitVectors(SU, d.normalize())
  if (tondi) { sfera(g, r1, m, ...A.toArray(), 1, 1, 1, 6); sfera(g, r2, m, ...B.toArray(), 1, 1, 1, 6) }
  return o
}
/** Una calotta di sfera aperta davanti (cappucci, scialli): `apertura` è la mezza larghezza della finestra in radianti. */
const calotta = (apertura, giu) => G(`cal${apertura},${giu}`, () => new THREE.SphereGeometry(1, 12, 8, Math.PI / 2 + apertura, Math.PI * 2 - 2 * apertura, 0, giu))
/** Un grembiule o una gonna aperta dietro: un tratto di tronco di cono attorno al davanti, largo `arco` radianti per lato. */
const arcoGeo = (rs, ri, h, arco) => G(`a${rs},${ri},${h},${arco}`, () => new THREE.CylinderGeometry(rs, ri, h, 6, 1, true, -arco, 2 * arco))
const smussa = x => x * x * (3 - 2 * x)
const lim = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x))
const mescola = (a, b, k) => a + (b - a) * k
/** Una campana da 0 a 1 e ritorno sul tratto [a, b] di k (0 fuori). */
const campana = (k, a = 0, b = 1) => (k < a || k > b) ? 0 : Math.sin(Math.PI * (k - a) / (b - a))

// ── trame: la faccia e qualche stoffa ──
function tela (w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')] }
function trama (c) { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t }
const trameStoffa = new Map()
/** Una stoffa a quadri o a righe (la camicia del boscaiolo, la maglia del pescatore). */
function stoffa (tipo) {
  if (trameStoffa.has(tipo)) return trameStoffa.get(tipo)
  if (typeof document === 'undefined') return M(tipo === 'quadri' ? 0xb8281f : 0xeef0ec)
  const [c, x] = tela(64, 64)
  if (tipo === 'quadri') {
    x.fillStyle = '#b8281f'; x.fillRect(0, 0, 64, 64)
    x.fillStyle = 'rgba(25,15,15,.78)'; x.fillRect(0, 0, 64, 20); x.fillRect(0, 32, 64, 20)
    x.fillStyle = 'rgba(25,15,15,.6)'; x.fillRect(0, 0, 20, 64); x.fillRect(32, 0, 20, 64)
    x.fillStyle = 'rgba(240,200,120,.35)'; x.fillRect(26, 0, 2, 64); x.fillRect(0, 26, 64, 2)
  } else {
    x.fillStyle = '#eef0ec'; x.fillRect(0, 0, 64, 64); x.fillStyle = '#2f5a92'; for (let y = 0; y < 64; y += 16) x.fillRect(0, y, 64, 8)
  }
  const t = trama(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(tipo === 'quadri' ? 3 : 1, tipo === 'quadri' ? 2 : 3)
  const m = new THREE.MeshStandardMaterial({ map: t, roughness: 0.9, flatShading: true })
  trameStoffa.set(tipo, m); return m
}

// Una trama 256×176 sul patch di sfera della faccia, come gli eroi; `chiusi` per ammiccare, `felice` per il saluto (bocca aperta).
function disegnaFaccia (s, chiusi, felice) {
  const [c, x] = tela(256, 176)
  x.fillStyle = s.pelle; x.fillRect(0, 0, 256, 176)
  x.lineCap = 'round'; x.lineJoin = 'round'
  if (s.barbetta) { x.fillStyle = s.barbetta; x.beginPath(); x.ellipse(128, 160, 92, 46, 0, 0, 7); x.fill() }
  for (const l of [-1, 1]) { x.fillStyle = s.guance || 'rgba(225,110,90,.3)'; x.beginPath(); x.ellipse(128 + l * 74, 120, 18, 11, 0, 0, 7); x.fill() }
  if (s.lentiggini) { x.fillStyle = 'rgba(170,90,60,.55)'; for (const l of [-1, 1]) for (const [a, b] of [[60, 106], [70, 114], [80, 104], [66, 122], [88, 116]]) { x.beginPath(); x.arc(128 + l * (128 - a), b, 2, 0, 7); x.fill() } }
  if (s.fuliggine) { x.fillStyle = 'rgba(40,34,30,.38)'; for (const [a, b, r] of [[60, 126, 16], [196, 112, 12], [150, 40, 18], [92, 30, 10]]) { x.beginPath(); x.ellipse(a, b, r, r * 0.6, 0.4, 0, 7); x.fill() } }
  if (s.farina) { x.fillStyle = 'rgba(255,255,255,.55)'; for (const [a, b, r] of [[64, 40, 12], [190, 128, 10], [176, 30, 7]]) { x.beginPath(); x.ellipse(a, b, r, r * 0.7, 0.3, 0, 7); x.fill() } }
  for (const l of [-1, 1]) {
    const ex = 128 + l * s.occX, ey = s.occY
    if (!chiusi && !(felice && s.ridendo)) {
      x.save(); x.beginPath(); x.ellipse(ex, ey, s.rx, s.ry, 0, 0, 7); x.clip()
      x.fillStyle = '#fbfaf4'; x.fillRect(ex - 30, ey - 30, 60, 60)
      x.fillStyle = s.iride; x.beginPath(); x.ellipse(ex - l * 1.5, ey + 1, s.rx * 0.78, s.ry * 0.9, 0, 0, 7); x.fill()
      x.fillStyle = 'rgba(0,0,0,.25)'; x.beginPath(); x.ellipse(ex - l * 1.5, ey - s.ry * 0.5, s.rx * 0.8, s.ry * 0.5, 0, 0, 7); x.fill()
      x.fillStyle = '#16120e'; x.beginPath(); x.ellipse(ex - l * 1.5, ey + 2, s.rx * 0.42, s.ry * 0.55, 0, 0, 7); x.fill()
      x.fillStyle = '#fff'; x.beginPath(); x.arc(ex + 3, ey - s.ry * 0.3, 3.6, 0, 7); x.fill()
      x.fillStyle = s.pelle; x.fillRect(ex - 30, ey - 30, 60, 30 + (-s.ry + 2 * s.ry * (s.palp || 0.2)))
      if (s.palpebra) { x.fillStyle = s.palpebra; x.fillRect(ex - 30, ey - 30, 60, 30 + (-s.ry + 2 * s.ry * (s.palp || 0.2))) }
      x.restore()
      x.strokeStyle = '#2a1c14'; x.lineWidth = 4
      x.beginPath(); x.ellipse(ex, ey, s.rx + 1, s.ry + 1, 0, Math.PI * 1.08, Math.PI * 1.92); x.stroke()
      if (s.ciglia) { x.lineWidth = 3; x.beginPath(); x.moveTo(ex + l * (s.rx - 1), ey - s.ry * 0.35); x.lineTo(ex + l * (s.rx + 8), ey - s.ry * 0.75); x.stroke() }
    } else {
      x.strokeStyle = '#2a1c14'; x.lineWidth = 4.5; x.beginPath()
      if (chiusi) x.arc(ex, ey - 6, s.rx, Math.PI * 0.15, Math.PI * 0.85); else x.arc(ex, ey + 6, s.rx * 0.9, Math.PI * 1.15, Math.PI * 1.85)
      x.stroke()
    }
    x.strokeStyle = s.ceja; x.lineWidth = s.cejaS || 7
    x.beginPath(); x.moveTo(ex + l * 22, ey + (s.cejaOut ?? -32)); x.quadraticCurveTo(ex + l * 4, ey + (s.cejaOut ?? -32) - 8, ex - l * 18, ey + (s.cejaIn ?? -26)); x.stroke()
    if (s.rughe) { x.strokeStyle = 'rgba(110,60,40,.45)'; x.lineWidth = 2; for (const k of [0, 1]) { x.beginPath(); x.moveTo(ex + l * (s.rx + 7), ey + 2 + k * 6); x.lineTo(ex + l * (s.rx + 15), ey - 2 + k * 9); x.stroke() } }
    if (s.occhiali) { x.strokeStyle = '#6a4a26'; x.lineWidth = 3.5; x.beginPath(); x.arc(ex, ey, s.ry + 5, 0, 7); x.stroke() }
  }
  if (s.occhiali) { x.beginPath(); x.moveTo(128 - s.occX + s.ry + 5, s.occY - 4); x.quadraticCurveTo(128, s.occY - 10, 128 + s.occX - s.ry - 5, s.occY - 4); x.stroke() }
  x.fillStyle = 'rgba(150,70,50,.42)'; x.beginPath(); x.ellipse(128, 106, s.naso || 5, (s.naso || 5) * 0.8, 0, 0, 7); x.fill()
  x.strokeStyle = '#8a3a2a'; x.lineWidth = 4.5
  const by = s.boccaY || 128
  if (felice) {
    x.fillStyle = '#6a2018'; x.beginPath(); x.moveTo(110, by - 4); x.quadraticCurveTo(128, by + 18, 146, by - 4); x.closePath(); x.fill()
    x.fillStyle = '#e8706a'; x.beginPath(); x.ellipse(128, by + 6, 9, 4, 0, 0, 7); x.fill()
  } else if (s.bocca === 'sorriso') { x.beginPath(); x.moveTo(113, by - 4); x.quadraticCurveTo(128, by + 8, 143, by - 4); x.stroke() }
  else if (s.bocca === 'serio') { x.beginPath(); x.moveTo(116, by); x.lineTo(140, by - 1); x.stroke() }
  else if (s.bocca === 'piccola') { x.beginPath(); x.moveTo(121, by - 2); x.quadraticCurveTo(128, by + 3, 135, by - 2); x.stroke() }
  if (s.rossetto && !felice) { x.strokeStyle = s.rossetto; x.lineWidth = 5; x.beginPath(); x.moveTo(117, by - 3); x.quadraticCurveTo(128, by + 6, 139, by - 3); x.stroke() }
  return trama(c)
}
const trameFaccia = new Map()
function facciaDi (chiave, chiusi, felice) {
  if (typeof document === 'undefined') return null                   // in Node (i test, il catalogo): la forma senza la trama
  const k = chiave + (chiusi ? ':c' : '') + (felice ? ':f' : '')
  if (!trameFaccia.has(k)) trameFaccia.set(k, disegnaFaccia(FACCE[chiave], chiusi, felice))
  return trameFaccia.get(k)
}
const FACCE = {
  armaiolo: { pelle: '#d99a72', iride: '#5a3a22', occX: 44, occY: 84, rx: 11, ry: 12, palp: 0.36, ceja: '#24180f', cejaS: 12, cejaOut: -26, cejaIn: -20, bocca: 'serio', boccaY: 134, guance: 'rgba(210,90,70,.35)', fuliggine: true, naso: 8 },
  incantatrice: { pelle: '#e9c3a8', iride: '#8a3ad0', occX: 46, occY: 82, rx: 13, ry: 16, palp: 0.32, ceja: '#2a1630', cejaS: 4.5, cejaOut: -34, cejaIn: -28, bocca: 'piccola', ciglia: true, palpebra: 'rgba(120,50,140,.85)', rossetto: '#a8305a' },
  erborista: { pelle: '#f0c8a6', iride: '#4a7a3a', occX: 45, occY: 82, rx: 11, ry: 12, palp: 0.25, ceja: '#a8a29a', cejaS: 6, bocca: 'sorriso', rughe: true, occhiali: true, guance: 'rgba(235,110,100,.4)' },
  rigattiere: { pelle: '#e2a77c', iride: '#3a2a1a', occX: 42, occY: 78, rx: 10, ry: 13, palp: 0.2, ceja: '#3a2414', cejaS: 9, cejaOut: -36, cejaIn: -30, bocca: 'sorriso', naso: 12, ridendo: true, guance: 'rgba(220,90,70,.42)' },
  minatore: { pelle: '#d8a582', iride: '#4a6a8a', occX: 45, occY: 86, rx: 11, ry: 12, palp: 0.3, ceja: '#6a5a4a', cejaS: 8, bocca: 'sorriso', boccaY: 132, fuliggine: true, rughe: true },
  capitano: { pelle: '#e2b08e', iride: '#3a5a8a', occX: 44, occY: 82, rx: 11, ry: 12, palp: 0.4, ceja: '#b8b8bc', cejaS: 9, cejaOut: -24, cejaIn: -18, bocca: 'serio', boccaY: 140, rughe: true },
  ragazza: { pelle: '#f6d2b6', iride: '#3a7ab8', occX: 46, occY: 84, rx: 14, ry: 18, palp: 0.05, ceja: '#7a3a1a', cejaS: 4.5, cejaOut: -36, cejaIn: -30, bocca: 'sorriso', ciglia: true, lentiggini: true, guance: 'rgba(245,120,120,.45)' },
  eremita: { pelle: '#d7b394', iride: '#6a6a7a', occX: 44, occY: 86, rx: 10, ry: 9, palp: 0.5, ceja: '#e6e4de', cejaS: 13, cejaOut: -20, cejaIn: -26, bocca: 'nulla', rughe: true, naso: 9 },
  guardia: { pelle: '#e6b896', iride: '#5a4630', occX: 45, occY: 86, rx: 11, ry: 12, palp: 0.38, ceja: '#4a3020', cejaS: 9, cejaOut: -26, cejaIn: -20, bocca: 'serio', barbetta: 'rgba(80,60,50,.22)' },
  boscaiolo: { pelle: '#e0a882', iride: '#3a6a3a', occX: 45, occY: 82, rx: 11, ry: 13, palp: 0.25, ceja: '#5a3218', cejaS: 10, bocca: 'nulla', guance: 'rgba(220,90,70,.45)' },
  pescatore: { pelle: '#d49a72', iride: '#3a7a9a', occX: 44, occY: 86, rx: 9, ry: 8, palp: 0.45, ceja: '#9a9a96', cejaS: 8, bocca: 'nulla', rughe: true, barbetta: 'rgba(200,200,200,.4)', naso: 9 },
  mugnaio: { pelle: '#f2c0a0', iride: '#5a3a22', occX: 45, occY: 80, rx: 11, ry: 13, palp: 0.15, ceja: '#6a4428', cejaS: 8, bocca: 'nulla', guance: 'rgba(240,90,90,.55)', farina: true, ridendo: true },
  cacciatrice: { pelle: '#e8b894', iride: '#4a7a3a', occX: 45, occY: 84, rx: 11, ry: 12, palp: 0.42, ceja: '#8a3014', cejaS: 6, cejaOut: -24, cejaIn: -30, bocca: 'serio', boccaY: 134, ciglia: true, lentiggini: true },
  carovaniere: { pelle: '#c98a5e', iride: '#3a2a1a', occX: 44, occY: 84, rx: 10, ry: 11, palp: 0.3, ceja: '#1e1610', cejaS: 11, cejaOut: -30, cejaIn: -24, bocca: 'sorriso', boccaY: 138, rughe: true, naso: 11 }
}

// ══════════ il corpo comune ══════════
/** Gambe, busto (un cilindro schiacciato), testa con la faccia, braccia con gomito e mano (`mani[i]`, un perno per gli arnesi). */
function corpo (chiave, o) {
  const g = new THREE.Group()
  const { legH = 0.32, legX = 0.1, legR = 0.07, tw = 0.36, th = 0.3, td = 0.24, basso = 0.9, armX = 0.23, R = 0.25, pelle, calzoni, scarpe, vesti,
    maniche = vesti, avambracci = maniche, manicaR = 0.056, bot = [0.13, 0.11, 0.2], orecchie = true, testaS = [1.05, 0.95, 1] } = o
  const pelleM = M(pelle)
  const gambe = [-1, 1].map(s => {
    const p = perno(g, s * legX, legH, 0), lung = legH - bot[1] + 0.04
    if (calzoni) cil(p, legR, legR * 0.88, lung, calzoni, 0, -lung / 2, 0, 7)
    scatola(p, bot[0], bot[1], bot[2], scarpe, 0, -legH + bot[1] / 2, 0.03)
    return p
  })
  const busto = perno(g, 0, legH, 0)
  const tronco = cil(busto, tw / 2, tw / 2 * basso, th, vesti, 0, th / 2, 0, 8); tronco.scale.z = td / tw; tronco.rotation.y = Math.PI / 8
  const testa = perno(busto, 0, th - 0.03, 0), cy = 0.93 * R
  sfera(testa, R, pelleM, 0, cy, 0, ...testaS, 12)
  const faccia = new THREE.Mesh(G('faccia', () => new THREE.SphereGeometry(1, 14, 9, Math.PI / 2 - 0.95, 1.9, 1.0, 1.3)), new THREE.MeshStandardMaterial({ map: facciaDi(chiave, false, false), roughness: 0.9 }))
  faccia.userData.solo = true
  faccia.position.set(0, cy, 0); faccia.scale.set(R * 1.01 * testaS[0], R * 1.01 * testaS[1], R * 1.01 * testaS[2]); testa.add(faccia)
  if (orecchie) for (const s of [-1, 1]) sfera(testa, R * 0.18, pelleM, s * R * 1.02 * testaS[0], cy - 0.01, 0, 0.8, 1.2, 0.8, 6)
  const bracci = [], gomiti = [], mani = []
  for (const s of [-1, 1]) {
    const b = perno(busto, s * armX, th - 0.045, 0)
    sfera(b, manicaR * 1.05, maniche, 0, 0, 0, 1, 1, 1, 7)
    cil(b, manicaR, manicaR * 0.92, 0.15, maniche, 0, -0.07, 0, 7)
    const gm = perno(b, 0, -0.14, 0)
    cil(gm, manicaR * 0.9, manicaR * 0.78, 0.12, avambracci, 0, -0.06, 0, 7)
    const mn = perno(gm, 0, -0.15, 0)
    sfera(mn, 0.05, o.manoM || pelleM, 0, 0, 0, 1, 1.08, 0.9, 7)
    sfera(mn, 0.022, o.manoM || pelleM, -s * 0.026, 0.012, 0.035, 1, 1, 1, 5)          // il pollice, in avanti e verso il dentro
    bracci.push(b); gomiti.push(gm); mani.push(mn)
  }
  g.userData = { chiave, gambe, busto, testa, bracci, gomiti, mani, cy, R, th, legH, faccia, sway: [], testaS }
  return g
}
const sway = (u, o, ax, az, f, p = 0) => { u.sway.push({ o, ax, az, f, p, bx: o.rotation.x, bz: o.rotation.z }); return o }
/** I capelli: una calotta un po' più grande della testa, spostata indietro (la faccia resta scoperta). */
function chioma (u, m, { su = 0.12, dietro = 0.14, k = 1.05, sy = 0.96 } = {}) {
  const { testa, cy, R, testaS } = u
  return sfera(testa, R * k, m, 0, cy + R * su, -R * dietro, testaS[0] * 1.02, sy, 1, 10)
}
/** Una barba: una massa sotto la bocca che scende di `lung`, con i baffi. */
function barba (u, m, ms, { lung = 0.2, larga = 1, baffi = true, punta: aPunta = false } = {}) {
  const { testa, cy, R } = u
  const b = sway(u, perno(testa, 0, cy - R * 0.5, R * 0.6), 0.04, 0.025, 1.2)
  sfera(b, 0.16 * larga, m, 0, -0.01, 0.0, 1.05, 0.8, 0.62, 8)
  if (lung > 0.12) {
    sfera(b, 0.13 * larga, m, 0, -lung * 0.5, 0.03, 1, 1.3, 0.55, 8)
    if (aPunta) cono(b, 0.11 * larga, lung, m, 0, -lung * 0.9, 0.04, 6).rotation.x = Math.PI
  }
  for (const s of [-1, 1]) sfera(b, 0.09 * larga, ms, s * 0.12 * larga, 0.06, -0.06, 0.8, 1.6, 0.7, 6)   // le basette
  if (baffi) for (const s of [-1, 1]) tubo(b, [s * 0.015, 0.1, 0.13], [s * 0.13, 0.06, 0.1], 0.042, 0.03, ms, 6, true)
  return b
}

// ══════════ l'idle e il saluto ══════════
// Tutto è funzione di `t` (+ la fase del personaggio): niente stato, tranne l'istante del saluto. `posa` di ogni personaggio mette
// le braccia e il gesto; il resto (respiro, sguardo, ammiccare, ciocche e mantelli che seguono) è comune.
const DURATA_SALUTO = 2.4
function gesto (c, t) {
  const x = t + c.fase + c.off, n = Math.floor(x / c.P), k = (x - n * c.P) / c.D
  return k < 1 ? { k, n } : { k: -1, n }
}
const v3 = new THREE.Vector3()
function finisci (g, c) {
  const u = g.userData, base = { busto: u.busto.position.y }
  u.fase = c.fase; u.salutoDa = -1e9
  u.saluta = t => { u.salutoDa = t }
  u.istanteGesto = k => c.P - c.fase - c.off + k * c.D               // per le prove: il tempo in cui il secondo gesto è a k
  u.anima = t => {
    const tt = t + c.fase
    for (const o of [...u.bracci, ...u.gomiti, ...u.mani]) o.rotation.set(0, 0, 0)
    u.bracci[0].rotation.z = -0.07; u.bracci[1].rotation.z = 0.07
    u.busto.rotation.set(c.chino || 0, 0, 0); u.busto.position.set(0, base.busto, 0)
    for (const gm of u.gambe) { gm.rotation.set(0, 0, 0); gm.position.y = u.legH }
    const r = Math.sin(tt * 2.1), sy = 1 + 0.03 * r, sx = 1 + 0.02 * r                  // il respiro
    u.busto.scale.set(sx, sy, sx)
    u.testa.scale.set(1 / sx, 1 / sy, 1 / sx); for (const b of u.bracci) b.scale.set(1 / sx, 1 / sy, 1 / sx)
    const giro = Math.sin(tt * 0.83) * Math.max(0, Math.sin(tt * 0.29)) ** 2               // ogni tanto si guarda intorno
    u.testa.rotation.set(0.03 * r - (c.chino || 0) * 0.8, 0.45 * giro * (c.sguardo ?? 1), 0)
    const ge = gesto(c, t)
    c.posa(u, tt, ge)
    // il saluto: la mano alzata (e che ondeggia), la testa verso chi arriva, la bocca aperta
    const ks = (t - u.salutoDa) / DURATA_SALUTO, felice = ks >= 0 && ks < 1
    if (felice) {
      const w = smussa(lim(ks / 0.14)) * (1 - smussa(lim((ks - 0.82) / 0.18))), i = c.mano ?? 1, sg = i ? 1 : -1
      const b = u.bracci[i], gm = u.gomiti[i], fermo = c.saluto === 'fermo'
      const onda = fermo ? 0 : Math.sin(ks * DURATA_SALUTO * Math.PI * 2 * 1.6)
      b.rotation.set(mescola(b.rotation.x, -0.45, w), mescola(b.rotation.y, 0, w), mescola(b.rotation.z, sg * (fermo ? 2.5 : 2.15), w))
      gm.rotation.set(mescola(gm.rotation.x, -0.15, w), mescola(gm.rotation.y, 0, w), mescola(gm.rotation.z, sg * (fermo ? -0.1 : 0.15 + 0.38 * onda), w))
      u.testa.rotation.y *= 1 - w; u.testa.rotation.z = mescola(u.testa.rotation.z, -sg * 0.1, w); u.testa.rotation.x -= 0.06 * w
      if (c.salutoPiu) c.salutoPiu(u, ks, w)
    }
    const tb = Math.PI * 2 * 1.2 * tt
    for (const s of u.sway) {
      const lag = Math.sin(tb - 1.5), lag2 = Math.sin(tb * 0.5 - 0.8)
      s.o.rotation.x = (s.bx || 0) + (s.o.userData.piuX || 0) + s.ax * (1.2 * Math.sin(tt * s.f + s.p) + 0.6 * lag)
      s.o.rotation.z = (s.bz || 0) + s.az * (1.2 * Math.sin(tt * s.f * 0.8 + s.p + 1) + 0.6 * lag2)
    }
    const ciclo = (tt * 0.9 + 1.3) % 4.6, chiuso = ciclo > 4.44 || (ciclo > 2.3 && ciclo < 2.42)
    const m = facciaDi(u.chiave, chiuso && !felice, felice); if (u.faccia.material.map !== m) u.faccia.material.map = m
    if (c.vivo) c.vivo(u, tt, ge, g)
  }
  let tri = 0
  g.traverse(o => { if (o.isMesh) tri += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3 })
  u.triangoli = Math.round(tri)
  u.anima(0)
  // l'altezza della figura senza gli arnesi lunghi (quelli segnati `arnese`)
  const nascosti = []; g.traverse(o => { if (o.userData.arnese && o.visible) { o.visible = false; nascosti.push(o) } })
  g.updateMatrixWorld(true)
  const b = new THREE.Box3(); g.traverse(o => { if (o.isMesh && visibile(o)) b.expandByObject(o, true) })
  u.altezza = +b.max.y.toFixed(3)
  for (const o of nascosti) o.visible = true
  fondi(g)
  return g
}
function visibile (o) { for (let p = o; p; p = p.parent) if (!p.visible) return false; return true }

// ── la fusione: i pezzi fermi di tutta la persona, per tipo di materiale, diventano una mesh sola con la pelle (SkinnedMesh) ──
// Ogni vertice segue il suo perno (lo scheletro sono i perni stessi, peso 1), coi colori nei vertici: da una ventina di chiamate di
// disegno a persona si passa a quattro o cinque (la faccia, che ha la sua trama, e le luci restano a sé). Si fa a figura ferma
// all'origine, senza genitore: lo spazio della figura è il mondo del legame.
const fusi = new Map()
function materialeFuso (m) {
  const k = `${m.metalness}|${m.roughness}|${m.side}`
  if (!fusi.has(k)) fusi.set(k, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, metalness: m.metalness, roughness: m.roughness, side: m.side }))
  return fusi.get(k)
}
function fondi (g) {
  g.updateMatrixWorld(true)
  const ossa = [], indice = new Map(), gruppi = new Map()
  const osso = n => { if (!indice.has(n)) { indice.set(n, ossa.length); ossa.push(n) } return indice.get(n) }
  g.traverse(c => {
    if (!c.isMesh || c.userData.solo) return
    const m = c.material
    if (m.map || m.transparent || m.vertexColors || m.emissive.getHex() !== 0) return
    const k = `${m.metalness}|${m.roughness}|${m.side}`
    if (!gruppi.has(k)) gruppi.set(k, [])
    gruppi.get(k).push(c)
  })
  const pelli = []
  for (const lista of gruppi.values()) {
    const geos = lista.map(c => {
      const q = c.geometry.index ? c.geometry.toNonIndexed() : c.geometry.clone()
      for (const a of Object.keys(q.attributes)) if (a !== 'position') q.deleteAttribute(a)
      q.applyMatrix4(c.matrixWorld); q.computeVertexNormals()
      const nv = q.attributes.position.count, col = new Float32Array(nv * 3), cc = c.material.color, ii = new Uint16Array(nv * 4), pp = new Float32Array(nv * 4), o = osso(c.parent)
      for (let i = 0; i < nv; i++) { col[i * 3] = cc.r; col[i * 3 + 1] = cc.g; col[i * 3 + 2] = cc.b; ii[i * 4] = o; pp[i * 4] = 1 }
      q.setAttribute('color', new THREE.BufferAttribute(col, 3))
      q.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(ii, 4)); q.setAttribute('skinWeight', new THREE.Float32BufferAttribute(pp, 4))
      return q
    })
    const ms = new THREE.SkinnedMesh(mergeGeometries(geos), materialeFuso(lista[0].material))
    ms.castShadow = ms.receiveShadow = true; ms.frustumCulled = false
    for (const c of lista) c.parent.remove(c)
    pelli.push(ms)
  }
  const scheletro = new THREE.Skeleton(ossa)              // le inverse dalla posa di adesso
  for (const ms of pelli) { g.add(ms); ms.bind(scheletro, new THREE.Matrix4()) }
}

// ══════════ gli arnesi (lungo +y, l'impugnatura sull'origine) ══════════
const LEGNO = 0x8a5a30, LEGNO_S = 0x5e3c1e, FERRO = 0x7a7f86
function martello (g) {
  const m = perno(g)
  cil(m, 0.024, 0.027, 0.42, M(LEGNO), 0, 0.12, 0, 6)
  scatola(m, 0.11, 0.11, 0.24, metallo(0x5f6368), 0, 0.34, 0.0); scatola(m, 0.12, 0.12, 0.04, metallo(0x9aa0a8), 0, 0.34, 0.12)
  return m
}
function piccone (g) {
  const m = perno(g); m.userData.arnese = true
  cil(m, 0.022, 0.026, 0.62, M(LEGNO), 0, 0.0, 0, 6)
  const testa = perno(m, 0, 0.3, 0)
  punta(testa, [0, 0, 0], [0, -0.07, 0.3], 0.045, metallo(FERRO), 5); punta(testa, [0, 0, 0], [0, -0.07, -0.3], 0.045, metallo(FERRO), 5)
  cil(testa, 0.045, 0.045, 0.09, metallo(0x5a5e64), 0, 0, 0, 6)
  return m
}
function ascia (g) {
  const m = perno(g); m.userData.arnese = true
  cil(m, 0.021, 0.024, 0.62, M(0xa8743c), 0, 0.12, 0, 6)
  const lama = new THREE.Shape([[0, 0.07], [0.22, 0.16], [0.25, -0.09], [0, -0.04]].map(p => new THREE.Vector2(...p)))
  const gl = G('lamaAscia', () => { const q = new THREE.ExtrudeGeometry(lama, { depth: 0.025, bevelEnabled: false }); q.translate(0, -0.03, -0.0125); return q })
  pezzo(m, gl, metallo(0xb8c0c8), 0, 0.36, 0.01); scatola(m, 0.05, 0.08, 0.05, metallo(0x5a5e64), 0, 0.37, 0)
  return m
}
function lancia (g) {
  const m = perno(g); m.userData.arnese = true
  cil(m, 0.017, 0.019, 1.3, M(LEGNO_S), 0, 0.2, 0, 6)
  punta(m, [0, 0.85, 0], [0, 1.06, 0], 0.04, metallo(0xc8d0d8), 4)
  cil(m, 0.026, 0.026, 0.05, metallo(FERRO), 0, 0.84, 0, 6)
  const ban = sway(g.userData, perno(m, 0, 0.78, 0), 0.0, 0.25, 2.2)
  scatola(ban, 0.012, 0.13, 0.1, M(0xd6a12a), 0, -0.07, -0.05); scatola(ban, 0.013, 0.13, 0.06, M(0x2a4a8a), 0, -0.07, -0.12)
  m.userData.bandiera = ban
  return m
}

// ══════════ I PERSONAGGI ══════════

// L'armaiolo, il fabbro: largo, calvo con la barba nera corta, braccia nude enormi, grembiule di cuoio, il martello. Batte.
function armaiolo () {
  const PELLE = 0xd99a72, CUOIO = 0x7a4626, CUOIO_S = 0x4a2a16, GRIGIO = 0x5d636c, NERO = 0x221a16
  const g = corpo('armaiolo', { legH: 0.3, legX: 0.12, legR: 0.085, tw: 0.5, th: 0.33, td: 0.34, basso: 0.82, armX: 0.31, R: 0.24, pelle: PELLE,
    calzoni: M(0x4a3a30), scarpe: M(NERO), vesti: M(GRIGIO), maniche: M(PELLE), manicaR: 0.08, bot: [0.16, 0.12, 0.24] })
  const u = g.userData, { busto, testa, bracci, mani, cy, R } = u
  const cu = M(CUOIO), cus = M(CUOIO_S)
  for (const b of bracci) cil(b, 0.09, 0.088, 0.07, M(GRIGIO), 0, -0.01, 0, 7)                          // le maniche corte
  cil(busto, 0.255, 0.25, 0.05, cus, 0, 0.04, 0, 8).scale.z = 0.69                                     // la cintura
  scatola(busto, 0.3, 0.24, 0.03, cu, 0, 0.17, 0.165)                                                    // la pettorina del grembiule
  for (const s of [-1, 1]) scatola(busto, 0.04, 0.03, 0.34, cus, s * 0.12, 0.31, 0)                     // le cinghie sulle spalle
  const grem = sway(u, perno(busto, 0, 0.04, 0), 0.03, 0.01, 1.1)
  pezzo(grem, arcoGeo(0.21, 0.25, 0.32, 1.05), M(CUOIO, DOPPIO), 0, -0.16, 0, 1, 1, 0.78); scatola(grem, 0.12, 0.07, 0.03, cus, 0.07, -0.1, 0.2)
  for (const s of [-1, 1]) cil(mani[s < 0 ? 0 : 1], 0.06, 0.055, 0.06, cus, 0, 0.045, 0, 7)          // i polsini di cuoio
  chioma(u, M(0x2a1c14), { su: -0.32, dietro: 0.32, k: 0.98, sy: 0.7 })                                // la corona di capelli scuri dietro
  barba(u, M(0x221812), M(0x2e2018), { lung: 0.1, larga: 1.12 })
  sfera(testa, 0.06, M(0xc98262), 0, cy - R * 0.1, R * 0.98, 1.2, 0.9, 1)                              // il naso
  const mart = martello(mani[1]); mart.rotation.set(1.5, 0, 0)
  u.martello = mart
  return finisci(g, {
    fase: 0.4, P: 6.5, D: 2.4, off: 1.2, mano: 0,
    posa (u, tt, ge) {
      const [bs, bd] = u.bracci, [gs, gd] = u.gomiti
      bs.rotation.set(-0.25 + 0.03 * Math.sin(tt * 1.3), 0, -0.28); gs.rotation.set(-0.9, 0, 0.0)                // la sinistra sul fianco
      bd.rotation.set(-0.15, 0, 0.18); gd.rotation.set(-0.55 + 0.04 * Math.sin(tt * 1.1), 0, 0)
      if (ge.k >= 0) {                                                                                         // tre colpi di martello davanti
        const k = ge.k, su = smussa(lim(k / 0.12)) * (1 - smussa(lim((k - 0.85) / 0.15)))
        const colpo = 0.5 - 0.5 * Math.cos(Math.PI * 2 * lim((k - 0.1) / 0.75) * 3)
        bd.rotation.x = mescola(-0.15, -0.55 - 1.0 * colpo, su); gd.rotation.x = mescola(-0.55, -0.4 - 1.2 * colpo, su)
        bs.rotation.x = mescola(bs.rotation.x, -0.7, su); gs.rotation.x = mescola(gs.rotation.x, -1.2, su)
        u.busto.rotation.x = 0.06 * su * (1 - colpo); u.testa.rotation.x = 0.16 * su; u.testa.rotation.y *= 1 - su
      }
    }
  })
}

// L'incantatrice: alta e sottile, veste lunga verde mare fino a terra, lo scialle magenta sul capo e sulle spalle con le monetine,
// capelli neri lunghi; una sfera arcana le galleggia sopra la mano sinistra. Ci passa sopra la destra e la sfera sale e si accende.
function incantatrice () {
  const PELLE = 0xe9c3a8, VESTE = 0x1f6e72, VESTE_S = 0x154c52, SCIALLE = 0xb2306e, SCIALLE_S = 0x7e1f4c, ORO = 0xe8c050, CAPELLI = 0x24162a
  const g = corpo('incantatrice', { legH: 0.38, legX: 0.07, legR: 0.045, tw: 0.3, th: 0.3, td: 0.21, basso: 0.85, armX: 0.19, R: 0.235, pelle: PELLE,
    calzoni: null, scarpe: M(0x5a2a5a), vesti: M(VESTE), manicaR: 0.046, bot: [0.09, 0.07, 0.17], testaS: [1.0, 1.0, 1.0] })
  const u = g.userData, { busto, testa, bracci, gomiti, mani, cy, R } = u
  const ve = M(VESTE), ves = M(VESTE_S), sc = M(SCIALLE), scs = M(SCIALLE_S), oro = metallo(ORO, { metalness: 0.5, roughness: 0.3 })
  const gonna = sway(u, perno(g, 0, 0.42, 0), 0.015, 0.02, 1.2)
  cil(gonna, 0.15, 0.3, 0.42, ve, 0, -0.21, 0, 10); cil(gonna, 0.302, 0.305, 0.035, oro, 0, -0.4, 0, 10)
  scatola(gonna, 0.06, 0.38, 0.012, ves, 0, -0.2, 0.22).rotation.x = -0.32
  for (const gm of gomiti) { const p = sway(u, perno(gm, 0, -0.1, 0), 0.06, 0.0, 1.5); cono(p, 0.075, 0.13, ve, 0, -0.02, -0.01, 7) }   // le maniche a calice
  cil(busto, 0.15, 0.155, 0.04, oro, 0, 0.06, 0, 8).scale.z = 0.72
  // lo scialle: una calotta aperta davanti sul capo, che scende sulle spalle in due lembi
  const sca = pezzo(testa, calotta(0.95, 2.05), M(SCIALLE, DOPPIO), 0, cy + 0.02, -0.01, R * 1.16, R * 1.12, R * 1.14)
  cil(busto, 0.17, 0.215, 0.1, sc, 0, 0.27, -0.0, 9).scale.z = 0.85
  for (const s of [-1, 1]) { const l = sway(u, perno(busto, s * 0.11, 0.28, 0.08), 0.04, 0.02, 1.3, s); scatola(l, 0.08, 0.34, 0.02, sc, 0, -0.17, 0.02).rotation.x = -0.12; cono(l, 0.05, 0.06, scs, 0, -0.36, 0.0, 4).rotation.x = Math.PI }
  const cerchio = toro(testa, R * 1.02, 0.012, oro, 0, cy + R * 0.42, R * 0.05, 14); cerchio.rotation.x = Math.PI / 2 - 0.2
  for (let i = -2; i <= 2; i++) { const a = i * 0.3; sfera(testa, 0.018, oro, Math.sin(a) * R * 1.05, cy + R * 0.32 - Math.abs(i) * 0.012, Math.cos(a) * R * 1.0, 1, 1, 0.4, 5) }   // le monetine
  pezzo(testa, G('luna', () => new THREE.TorusGeometry(0.035, 0.012, 4, 8, Math.PI * 1.3)), luce(0xd8b0ff, 0.8), 0, cy + R * 0.62, R * 0.92).rotation.z = -0.6
  chioma(u, M(CAPELLI), { su: 0.12, dietro: 0.12, k: 1.03 })
  for (const s of [-1, 1]) sfera(testa, R * 0.3, M(CAPELLI), s * R * 0.7, cy + R * 0.25, R * 0.4, 0.8, 0.6, 0.6, 6)   // la frangia divisa
  const capLunghi = sway(u, perno(busto, 0, 0.28, -0.12), 0.05, 0.02, 1.1)
  const cl = cil(capLunghi, 0.12, 0.07, 0.4, M(CAPELLI), 0, -0.17, -0.03, 7); cl.rotation.x = 0.1; cl.scale.z = 0.55
  cono(capLunghi, 0.07, 0.1, M(CAPELLI), 0, -0.41, -0.05, 6).rotation.x = Math.PI
  // la sfera arcana sopra la sinistra
  const sfe = perno(mani[0], 0, 0, 0); sfe.userData.solo = true
  const nucleo = new THREE.Mesh(G('sfera', () => new THREE.IcosahedronGeometry(0.075, 1)), luceSua(0xb27cff, 1.1)); sfe.add(nucleo)
  const guscio = new THREE.Mesh(G('guscio', () => new THREE.IcosahedronGeometry(0.1, 0)), new THREE.MeshStandardMaterial({ color: 0xd7c0ff, emissive: 0x7a4cff, emissiveIntensity: 0.6, transparent: true, opacity: 0.35, flatShading: true }))
  sfe.add(guscio)
  // le tre scintille in una mesh sola, che gira tutta (una chiamata invece di tre)
  const scintille = new THREE.Mesh(G('scint3', () => mergeGeometries([0, 1, 2].map(i => { const a = i * Math.PI * 2 / 3; return new THREE.OctahedronGeometry(0.02).translate(Math.cos(a) * 0.14, 0, Math.sin(a) * 0.14) }))), luce(0x7af0ff, 1.4))
  sfe.add(scintille)
  return finisci(g, {
    fase: 1.7, P: 7.2, D: 2.6, off: 2.0, mano: 1, sguardo: 0.6,
    posa (u, tt, ge) {
      const [bs, bd] = u.bracci, [gs, gd] = u.gomiti, [ms] = u.mani
      bs.rotation.set(-0.35, 0, -0.3); gs.rotation.set(-1.2 + 0.04 * Math.sin(tt * 1.2), 0, 0.25); ms.rotation.set(0, 0, 0)
      bd.rotation.set(0.05, 0, 0.12); gd.rotation.set(-0.3, 0, 0)
      u.testa.rotation.x += 0.1; u.testa.rotation.y = u.testa.rotation.y * 0.5 - 0.15                     // guarda la sfera
      if (ge.k >= 0) {                                                                                     // la destra passa sopra la sfera
        const su = smussa(lim(ge.k / 0.2)) * (1 - smussa(lim((ge.k - 0.8) / 0.2))), giro = Math.sin(ge.k * Math.PI * 4)
        bd.rotation.x = mescola(0.05, -0.75, su); bd.rotation.z = mescola(0.12, -0.05, su); gd.rotation.set(mescola(-0.3, -1.2, su), 0, mescola(0, -0.6 + 0.3 * giro, su))
        u.testa.rotation.x += 0.08 * su
      }
    },
    vivo (u, tt, ge) {
      const k = ge.k >= 0 ? campana(ge.k, 0.1, 0.95) : 0
      sfe.position.set(0, 0.17 + 0.02 * Math.sin(tt * 2.4) + 0.06 * k, 0.0)
      nucleo.material.emissiveIntensity = 1.0 + 0.3 * Math.sin(tt * 3.1) + 1.2 * k; nucleo.rotation.set(tt * 0.7, tt * 1.1, 0)
      guscio.rotation.set(-tt * 0.5, tt * 0.8, 0); guscio.scale.setScalar(1 + 0.08 * Math.sin(tt * 2.2) + 0.25 * k)
      scintille.rotation.set(0.25 * Math.sin(tt * 1.3), tt * (1.8 + k * 3), 0)
    }
  })
}

// L'erborista, la guaritrice: tonda e anziana, mantello col cappuccio color ruggine, veste color crema e un grembiulino verde, gli
// occhiali; il cesto d'erbe al braccio sinistro e le boccette alla cintura. Coglie un ciuffo dal cesto e lo annusa.
function erborista () {
  const PELLE = 0xf0c8a6, MANTO = 0xa4533a, MANTO_S = 0x7a3a26, VESTE = 0xe6d6ae, VERDE = 0x5a8a3a, CESTO = 0xb08040
  const g = corpo('erborista', { legH: 0.26, legX: 0.08, legR: 0.05, tw: 0.4, th: 0.3, td: 0.32, basso: 1.1, armX: 0.23, R: 0.25, pelle: PELLE,
    calzoni: null, scarpe: M(0x5a3a22), vesti: M(VESTE), maniche: M(MANTO), avambracci: M(VESTE), manicaR: 0.058, bot: [0.11, 0.08, 0.18] })
  const u = g.userData, { busto, testa, mani, gomiti, cy, R } = u
  const ma = M(MANTO), mas = M(MANTO_S), ve = M(VESTE), vd = M(VERDE)
  const gonna = sway(u, perno(g, 0, 0.3, 0), 0.015, 0.02, 1.2)
  cil(gonna, 0.22, 0.29, 0.28, ve, 0, -0.15, 0, 10)
  scatola(gonna, 0.26, 0.24, 0.02, vd, 0, -0.13, 0.25).rotation.x = -0.24                                 // il grembiule verde
  // il mantello: dalle spalle fin quasi a terra, dietro; il cappuccio alzato
  const manto = sway(u, perno(busto, 0, 0.3, -0.08), 0.04, 0.02, 1.2)
  const mt = cil(manto, 0.2, 0.31, 0.56, ma, 0, -0.27, -0.03, 9, ); mt.scale.z = 0.7
  cil(busto, 0.2, 0.22, 0.08, ma, 0, 0.27, 0, 9).scale.z = 0.86                                          // la mantellina sulle spalle
  sfera(busto, 0.03, metallo(0xd0a040), 0, 0.27, 0.18, 1, 1, 0.6, 5)                                       // la fibbia
  pezzo(testa, calotta(0.85, 2.15), M(MANTO, DOPPIO), 0, cy + 0.01, -0.02, R * 1.2, R * 1.15, R * 1.18)
  punta(testa, [0, cy + R * 0.6, -R * 0.9], [0, cy + R * 0.05, -R * 1.65], 0.1, ma, 5)                    // la punta del cappuccio
  for (const s of [-1, 1]) sfera(testa, R * 0.28, M(0xc8c4bc), s * R * 0.45, cy + R * 0.72, R * 0.6, 1.1, 0.45, 0.6, 6)   // i capelli grigi sotto
  sfera(testa, 0.05, M(0xe0a888), 0, cy - R * 0.12, R * 0.99, 1.1, 0.9, 1)
  // la cintura con le boccette
  cil(busto, 0.205, 0.21, 0.04, M(0x5a3a22), 0, 0.03, 0, 9).scale.z = 0.8
  ;[[0xe04a5a, 0.55], [0x4ac0e0, 0.95], [0xe0b040, 1.35]].forEach(([c, a]) => {
    const x = Math.sin(a) * 0.21, z = Math.cos(a) * 0.17
    sfera(busto, 0.035, M(c, { roughness: 0.2 }), x, -0.03, z, 1, 1.1, 1, 6); cil(busto, 0.012, 0.012, 0.035, M(0xd8e8e8), x, 0.015, z, 5); cil(busto, 0.015, 0.015, 0.015, M(0x8a5a30), x, 0.035, z, 5)
  })
  // il cesto al braccio sinistro (appeso al gomito)
  const cesto = perno(gomiti[0], 0, -0.06, -0.05); cesto.rotation.set(1.5, -0.25, -0.15)
  cil(cesto, 0.12, 0.09, 0.1, M(CESTO), 0, -0.1, 0.07, 9); toro(cesto, 0.12, 0.012, M(0x8a5a2a), 0, -0.05, 0.07, 10).rotation.x = Math.PI / 2
  const manico = toro(cesto, 0.1, 0.01, M(0x8a5a2a), 0, -0.05, 0.07, 10); manico.rotation.y = Math.PI / 2
  for (const [x, z, c] of [[-0.05, 0.03, 0x4a9a3a], [0.04, 0.1, 0x6ab84a], [0.0, 0.05, 0x3a7a2a], [0.06, 0.02, 0x8ac85a]]) rozza(cesto, 0.05, M(c), x, -0.02, z + 0.04, 1, 1.2, 1)
  sfera(cesto, 0.025, M(0xf0d040), -0.06, 0.02, 0.1, 1, 1, 1, 5); sfera(cesto, 0.025, M(0xd060a0), 0.05, 0.03, 0.12, 1, 1, 1, 5)
  const ciuffo = perno(mani[1], 0, 0.02, 0.03)
  tubo(ciuffo, [0, 0, 0], [0, 0.12, 0.03], 0.009, 0.007, vd, 4); rozza(ciuffo, 0.05, M(0x6ab84a), 0, 0.13, 0.03, 1, 1.3, 1); sfera(ciuffo, 0.028, M(0xd060a0), 0.03, 0.16, 0.05, 1, 1, 1, 5)
  return finisci(g, {
    fase: 2.9, P: 7.6, D: 3.0, off: 3.1, mano: 1,
    posa (u, tt, ge) {
      const [bs, bd] = u.bracci, [gs, gd] = u.gomiti, [ms, md] = u.mani
      bs.rotation.set(-0.15, 0, -0.32); gs.rotation.set(-1.45, 0.3, 0.2)                          // il cesto al braccio
      bd.rotation.set(0.0 + 0.03 * Math.sin(tt * 1.2), 0, 0.14); gd.rotation.set(-0.35, 0, 0)
      ciuffo.scale.setScalar(1e-4)                                                                   // nella pelle: si nasconde scalando
      if (ge.k >= 0) {
        const k = ge.k
        const verso = smussa(lim(k / 0.18)) * (1 - smussa(lim((k - 0.3) / 0.12)))                 // la mano al cesto…
        const naso = smussa(lim((k - 0.32) / 0.16)) * (1 - smussa(lim((k - 0.82) / 0.16)))       // …poi al naso
        bd.rotation.set(mescola(mescola(0, -0.55, verso), -1.05, naso), mescola(0, -0.5, verso), mescola(mescola(0.14, -0.15, verso), -0.25, naso))
        gd.rotation.set(mescola(mescola(-0.35, -0.6, verso), -2.25, naso), 0, mescola(0, -0.75, naso))
        ciuffo.scale.setScalar(k > 0.25 && k < 0.9 ? 1 : 1e-4)
        u.testa.rotation.x = mescola(u.testa.rotation.x, 0.25, verso) - 0.18 * naso; u.testa.rotation.y = mescola(u.testa.rotation.y, 0, Math.max(verso, naso))
      }
    }
  })
}

// Il rigattiere, il mercante: basso e panciuto, giubba senape con le toppe, cappellaccio a falda larga con la piuma, e uno zaino
// enorme carico di pentole e coperte più alto di lui; il sacco nella destra. Si risistema lo zaino con un saltello e le pentole ballano.
function rigattiere () {
  const PELLE = 0xe2a77c, GIUBBA = 0xc9962f, GIUBBA_S = 0x9a6e1e, FASCIA = 0x6a3a8a, CALZE = 0x5a4632, ZAINO = 0x7a5232, ZAINO_S = 0x553820
  const g = corpo('rigattiere', { legH: 0.24, legX: 0.11, legR: 0.075, tw: 0.42, th: 0.3, td: 0.34, basso: 1.08, armX: 0.26, R: 0.25, pelle: PELLE,
    calzoni: M(CALZE), scarpe: M(0x3a2618), vesti: M(GIUBBA), manicaR: 0.064, bot: [0.15, 0.1, 0.22] })
  const u = g.userData, { busto, testa, bracci, mani, cy, R } = u
  const gi = M(GIUBBA), gis = M(GIUBBA_S), za = M(ZAINO), zas = M(ZAINO_S)
  sfera(busto, 0.22, gi, 0, 0.11, 0.05, 1.0, 0.85, 0.85, 9)                                                // la pancia
  cil(busto, 0.24, 0.24, 0.06, M(FASCIA), 0, 0.06, 0.02, 9).scale.z = 0.85                               // la fascia viola
  scatola(busto, 0.08, 0.08, 0.02, M(0x4a8a5a), -0.1, 0.18, 0.21); scatola(busto, 0.06, 0.07, 0.02, M(0xb04a3a), 0.12, 0.05, 0.215)   // le toppe
  for (const s of [-1, 1]) scatola(busto, 0.05, 0.03, 0.36, M(0x4a3020), s * 0.13, 0.3, 0)               // gli spallacci
  // lo zaino: un cassone con il rotolo, le pentole, il mestolo e una lanterna appesa
  const zaino = sway(u, perno(busto, 0, 0.16, -0.18), 0.02, 0.0, 1.0); zaino.userData.arnese = true   // fuori dall'altezza: si normalizza sul corpo
  scatola(zaino, 0.62, 0.7, 0.32, za, 0, 0.2, -0.15); scatola(zaino, 0.64, 0.06, 0.34, zas, 0, -0.02, -0.15); scatola(zaino, 0.64, 0.05, 0.34, zas, 0, 0.4, -0.15)
  scatola(zaino, 0.3, 0.16, 0.06, zas, 0, 0.07, 0.0)
  cil(zaino, 0.11, 0.11, 0.86, M(0xb03a3a), 0, 0.65, -0.12, 8).rotation.z = Math.PI / 2                     // la coperta arrotolata, più larga dello zaino
  cil(zaino, 0.112, 0.112, 0.05, M(0xe0c060), 0.25, 0.65, -0.12, 8).rotation.z = Math.PI / 2
  cil(zaino, 0.112, 0.112, 0.05, M(0xe0c060), -0.25, 0.65, -0.12, 8).rotation.z = Math.PI / 2
  cil(zaino, 0.08, 0.06, 0.3, metallo(0x8a8a8e), 0.16, 0.86, -0.2, 8).rotation.z = -0.35                     // un tubo di stufa che spunta
  const pentola = sway(u, perno(zaino, 0.34, 0.32, -0.12), 0.12, 0.0, 2.2)
  cil(pentola, 0.08, 0.07, 0.11, metallo(0x6a6e74), 0, -0.1, 0, 8); toro(pentola, 0.04, 0.008, metallo(0x4a4e54), 0, -0.02, 0, 8)
  const padella = sway(u, perno(zaino, -0.34, 0.4, -0.1), 0.1, 0.0, 1.9, 1)
  cil(padella, 0.1, 0.09, 0.025, metallo(0x3a3c40), 0, -0.16, 0, 9).rotation.z = Math.PI / 2; cil(padella, 0.012, 0.012, 0.1, M(LEGNO_S), 0, -0.04, 0, 5)
  const lant = sway(u, perno(zaino, 0.33, 0.0, -0.02), 0.15, 0.08, 2.0, 2)
  scatola(lant, 0.06, 0.08, 0.06, metallo(0x3a3a3a), 0, -0.08, 0.02); cono(lant, 0.05, 0.04, metallo(0x3a3a3a), 0, -0.02, 0.02, 4)
  const lume = scatola(lant, 0.045, 0.055, 0.065, luce(0xffc860, 0.8), 0, -0.08, 0.02)
  // la testa: nasone, baffi a manubrio, cappellaccio
  sfera(testa, 0.075, M(0xd88a68), 0, cy - R * 0.14, R * 0.98, 1.1, 1.0, 1.1)
  for (const s of [-1, 1]) tubo(testa, [s * 0.02, cy - R * 0.42, R * 0.92], [s * 0.15, cy - R * 0.32, R * 0.8], 0.03, 0.02, M(0x3a2414), 5, true)
  chioma(u, M(0x3a2414), { su: -0.05, dietro: 0.2, k: 1.03 })
  const cap = perno(testa, 0, cy + R * 0.58, -0.02); cap.rotation.set(-0.12, 0, 0.1)
  cil(cap, 0.38, 0.4, 0.03, M(0x4a5a32), 0, 0, 0, 12)
  cil(cap, 0.18, 0.22, 0.17, M(0x4a5a32), 0, 0.08, 0, 9)
  cil(cap, 0.225, 0.225, 0.04, M(0x8a2a2a), 0, 0.03, 0, 9)
  const piuma = sway(u, perno(cap, 0.17, 0.08, -0.05), 0.08, 0.05, 1.8)
  piuma.rotation.z = -0.5; scatola(piuma, 0.035, 0.32, 0.012, M(0xe04a2a), 0, 0.15, 0); scatola(piuma, 0.02, 0.16, 0.013, M(0xf0c040), 0.005, 0.2, 0.001)
  // il sacco nella sinistra
  const sacco = perno(mani[0], 0, 0.02, 0.02)
  sfera(sacco, 0.12, M(0xc8b080), 0, -0.11, 0.0, 1, 1.05, 0.9, 8); cil(sacco, 0.03, 0.05, 0.06, M(0xb0986a), 0, -0.01, 0, 6); toro(sacco, 0.032, 0.008, M(0x6a4a2a), 0, -0.02, 0, 6).rotation.x = Math.PI / 2
  return finisci(g, {
    fase: 4.1, P: 6.8, D: 1.8, off: 0.6, mano: 1,
    posa (u, tt, ge) {
      const [bs, bd] = u.bracci, [gs, gd] = u.gomiti
      bs.rotation.set(0.05, 0, -0.2); gs.rotation.set(-0.15, 0, 0)
      bd.rotation.set(-0.5, 0, 0.35); gd.rotation.set(-1.0 + 0.04 * Math.sin(tt * 1.4), 0.4, 0.5)       // la destra agli spallacci
      if (ge.k >= 0) {                                                                                  // due saltelli: lo zaino si risistema
        const k = ge.k, h = Math.abs(Math.sin(k * Math.PI * 2)) * (k < 1 ? 1 : 0)
        u.busto.position.y += 0.04 * h; u.busto.rotation.x = -0.08 * h
        for (const gm of u.gambe) gm.rotation.x = -0.12 * h
        zaino.userData.piuX = 0.1 * Math.sin(k * Math.PI * 4) * (1 - k)
        bd.rotation.x -= 0.25 * h
      } else zaino.userData.piuX = 0
    },
    vivo (u, tt) { lume.material.emissiveIntensity = 0.7 + 0.15 * Math.sin(tt * 7) * Math.sin(tt * 3.3) }
  })
}

// Il minatore: tarchiato, sbarbato e sporco di fuliggine, maglia blu e salopette color terra, l'elmo giallo con la lampada; si
// appoggia al piccone piantato a terra. Si asciuga la fronte col braccio.
function minatore () {
  const PELLE = 0xd8a582, MAGLIA = 0x3d5f8f, SALOP = 0xa0703a, SALOP_S = 0x6e4a22, ELMO = 0xe0b030
  const g = corpo('minatore', { legH: 0.28, legX: 0.11, legR: 0.08, tw: 0.42, th: 0.3, td: 0.3, basso: 0.92, armX: 0.27, R: 0.245, pelle: PELLE,
    calzoni: M(SALOP), scarpe: M(0x2a2420), vesti: M(MAGLIA), manicaR: 0.066, bot: [0.15, 0.13, 0.23] })
  const u = g.userData, { busto, testa, gambe, mani, cy, R } = u
  const sa = M(SALOP), sas = M(SALOP_S)
  cil(busto, 0.212, 0.198, 0.16, sa, 0, 0.08, 0, 8).scale.z = 0.73
  scatola(busto, 0.24, 0.16, 0.03, sa, 0, 0.2, 0.14); scatola(busto, 0.1, 0.07, 0.02, sas, 0, 0.18, 0.157)    // la pettorina con la tasca
  for (const s of [-1, 1]) { scatola(busto, 0.045, 0.03, 0.32, sas, s * 0.1, 0.3, 0); sfera(busto, 0.02, metallo(0xd0a040), s * 0.1, 0.27, 0.155, 1, 1, 0.5, 5) }
  for (const p of gambe) cil(p, 0.088, 0.088, 0.04, sas, 0, -0.16, 0, 7)                                       // i risvolti
  cil(busto, 0.15, 0.17, 0.05, M(0xd0c8b0), 0, 0.31, 0, 8).scale.z = 0.8                                     // il fazzoletto al collo
  // l'elmo giallo con la tesa e la lampada
  const elmo = new THREE.Mesh(G('elmoMin', () => new THREE.SphereGeometry(1, 12, 7, 0, Math.PI * 2, 0, 1.45)), M(ELMO, { roughness: 0.5 }))
  elmo.position.set(0, cy + 0.03, -0.01); elmo.scale.set(R * 1.12, R * 1.0, R * 1.1); testa.add(elmo)
  cil(testa, R * 1.3, R * 1.32, 0.025, M(ELMO, { roughness: 0.5 }), 0, cy + 0.04, 0, 12)
  scatola(testa, 0.035, 0.03, R * 2.1, M(0xc89a20, { roughness: 0.5 }), 0, cy + R * 0.95, 0)
  cil(testa, 0.055, 0.06, 0.05, metallo(0x5a5a5a), 0, cy + R * 0.62, R * 0.98, 8).rotation.x = Math.PI / 2
  const lampada = new THREE.Mesh(G('lampada', () => new THREE.CircleGeometry(0.045, 8)), luceSua(0xfff0a0, 1.6)); lampada.position.set(0, cy + R * 0.62, R * 0.98 + 0.027); testa.add(lampada)
  sfera(testa, 0.055, M(0xc8906a), 0, cy - R * 0.12, R * 0.98, 1.1, 0.95, 1)
  for (const s of [-1, 1]) sfera(testa, R * 0.22, M(0x8a8a86), s * R * 0.98, cy - R * 0.05, -R * 0.1, 0.6, 1.0, 1.0, 6)   // le basette grigie
  // il piccone a terra, la destra sopra il manico
  const pic = piccone(g); pic.position.set(0.36, 0.31, 0.12); pic.rotation.set(0.0, 1.25, -0.12)
  return finisci(g, {
    fase: 5.5, P: 7.9, D: 2.4, off: 4.2, mano: 0,
    posa (u, tt, ge) {
      const [bs, bd] = u.bracci, [gs, gd] = u.gomiti
      bd.rotation.set(-0.5, 0, 0.3); gd.rotation.set(-0.85, 0, -0.1)                                       // la mano sul manico
      bs.rotation.set(0.02 * Math.sin(tt * 1.2), 0, -0.12); gs.rotation.set(-0.3, 0, 0)
      u.busto.rotation.z = -0.04
      if (ge.k >= 0) {                                                                                      // si asciuga la fronte
        const su = smussa(lim(ge.k / 0.25)) * (1 - smussa(lim((ge.k - 0.72) / 0.28))), passa = Math.sin(ge.k * Math.PI * 3)
        bs.rotation.set(mescola(0, -1.75, su), mescola(0, 0.3 * passa, su), mescola(-0.12, 0.35, su)); gs.rotation.set(mescola(-0.3, -1.55, su), 0, 0)
        u.testa.rotation.x = mescola(u.testa.rotation.x, -0.08, su); u.testa.rotation.y *= 1 - su
      }
    }
  })
}

// Il capitano: alto e dritto, capelli e baffoni grigi, nessun elmo; corazza d'acciaio scuro, fascia d'oro di traverso, il
// mantello blu lungo, la spada nel fodero al fianco con la sinistra sull'elsa. Si liscia i baffi, guarda lontano.
function capitano () {
  const PELLE = 0xe2b08e, ACC = 0x6a7480, ACC_S = 0x48505a, ACC_L = 0xa8b2bc, BLU = 0x24489a, BLU_S = 0x182f6a, ORO = 0xe0b040
  const g = corpo('capitano', { legH: 0.4, legX: 0.1, legR: 0.07, tw: 0.42, th: 0.32, td: 0.27, basso: 0.78, armX: 0.27, R: 0.235, pelle: PELLE,
    calzoni: M(0x2e3442), scarpe: M(0x2a1e16), vesti: metallo(ACC), maniche: M(BLU), manicaR: 0.06, bot: [0.13, 0.17, 0.21] })
  const u = g.userData, { busto, testa, gambe, bracci, mani, cy, R } = u
  const ac = metallo(ACC), acs = metallo(ACC_S), acl = metallo(ACC_L), bl = M(BLU), oro = metallo(ORO, { metalness: 0.55, roughness: 0.3 })
  sfera(busto, 0.19, acl, 0, 0.18, 0.05, 1.05, 0.78, 0.6, 9)                                                // il pettorale
  const fascia = scatola(busto, 0.07, 0.42, 0.025, oro, 0, 0.16, 0.13); fascia.rotation.set(0.0, 0, 0.7)
  cil(busto, 0.2, 0.18, 0.06, M(0x3a2618), 0, 0.03, 0, 8).scale.z = 0.7                                    // la cintura
  scatola(busto, 0.06, 0.05, 0.02, oro, 0, 0.03, 0.14)
  for (const s of [-1, 1]) { const f = scatola(busto, 0.15, 0.12, 0.02, bl, s * 0.09, -0.05, 0.12); f.rotation.y = s * 0.15 }   // le falde blu
  for (const b of bracci) { const sp = perno(b, 0, 0.02, 0); sfera(sp, 0.09, ac, 0, 0, 0, 1.1, 0.7, 1.05, 8); toro(sp, 0.085, 0.01, oro, 0, -0.04, 0, 10).rotation.x = Math.PI / 2 }
  for (const p of gambe) scatola(p, 0.14, 0.04, 0.22, M(0x4a3426), 0, -0.24, 0.03)                         // il risvolto degli stivali
  for (const m of mani) cil(m, 0.058, 0.05, 0.06, M(0x4a3426), 0, 0.04, 0, 7)                              // i guanti
  // il mantello: dal collo alle caviglie, col bavero
  cil(busto, 0.14, 0.17, 0.07, bl, 0, 0.32, -0.0, 8).scale.z = 0.9
  const manto = sway(u, perno(busto, 0, 0.32, -0.13), 0.035, 0.02, 1.0)
  const mm = scatola(manto, 0.46, 0.7, 0.03, bl, 0, -0.35, -0.02); mm.rotation.x = 0.08
  scatola(manto, 0.465, 0.04, 0.032, M(BLU_S), 0, -0.68, -0.05)
  for (const s of [-1, 1]) sfera(manto, 0.03, oro, s * 0.17, 0.0, 0.04, 1, 1, 0.5, 6)
  // la spada nel fodero al fianco sinistro
  const fodero = perno(busto, -0.2, 0.02, 0.06); fodero.rotation.set(0.35, 0, -0.25)
  cil(fodero, 0.026, 0.02, 0.42, M(0x3a2618), 0, -0.21, 0, 6); cil(fodero, 0.028, 0.028, 0.04, oro, 0, -0.42, 0, 6)
  scatola(fodero, 0.16, 0.025, 0.035, oro, 0, 0.03, 0); cil(fodero, 0.018, 0.018, 0.09, M(0x4a2a1a), 0, 0.09, 0, 5); sfera(fodero, 0.03, oro, 0, 0.15, 0, 1, 1, 1, 6)
  // la testa: capelli grigi corti, baffoni, il naso dritto
  chioma(u, M(0xa8a8ac), { su: 0.16, dietro: 0.16, k: 1.04, sy: 0.9 })
  for (const s of [-1, 1]) {
    tubo(testa, [s * 0.015, cy - R * 0.38, R * 0.95], [s * 0.15, cy - R * 0.45, R * 0.82], 0.038, 0.022, M(0xc0c0c4), 6, true)
    sfera(testa, R * 0.2, M(0xa8a8ac), s * R * 0.98, cy - R * 0.1, -R * 0.05, 0.6, 1.2, 0.9, 6)
  }
  sfera(testa, 0.05, M(0xd09878), 0, cy - R * 0.1, R * 0.99, 1, 1.1, 1.1)
  return finisci(g, {
    fase: 0.9, P: 8.4, D: 2.4, off: 5.0, mano: 1, saluto: 'fermo', sguardo: 0.7,
    posa (u, tt, ge) {
      const [bs, bd] = u.bracci, [gs, gd] = u.gomiti
      bs.rotation.set(-0.15, 0, -0.42); gs.rotation.set(-1.05, 0.0, -0.2)                                   // la sinistra sull'elsa
      bd.rotation.set(0.04, 0, 0.1); gd.rotation.set(-0.12, 0, 0)
      u.testa.rotation.x -= 0.08                                                                             // il mento in su
      if (ge.k >= 0) {                                                                                       // si liscia i baffi
        const su = smussa(lim(ge.k / 0.25)) * (1 - smussa(lim((ge.k - 0.75) / 0.25))), liscia = Math.sin(ge.k * Math.PI * 4)
        bd.rotation.set(mescola(0.04, -1.25, su), mescola(0, -0.35, su), mescola(0.1, -0.15 + 0.12 * liscia, su)); gd.rotation.set(mescola(-0.12, -1.6, su), 0, mescola(0, -0.45, su))
        u.testa.rotation.y *= 1 - su; u.testa.rotation.x -= 0.05 * su
      }
    }
  })
}

// La ragazza: piccola, vestitino azzurro al ginocchio con il colletto bianco, calzettoni, scarpette rosse, una treccia lunga
// castana col fiocco, le lentiggini. Le mani dietro la schiena; ogni tanto fa due saltelli e la treccia vola.
function ragazza () {
  const PELLE = 0xf6d2b6, VESTITO = 0x5f9fd8, VESTITO_S = 0x3f78b0, CAPELLI = 0x8a4a22, CAPELLI_S = 0x6a3418, FIOCCO = 0xe0404a
  const g = corpo('ragazza', { legH: 0.29, legX: 0.065, legR: 0.04, tw: 0.27, th: 0.24, td: 0.2, basso: 1.05, armX: 0.165, R: 0.235, pelle: PELLE,
    calzoni: M(0xf2f0ea), scarpe: M(0xc8303a), vesti: M(VESTITO), maniche: M(VESTITO), avambracci: M(PELLE), manicaR: 0.042, bot: [0.08, 0.07, 0.15] })
  const u = g.userData, { busto, testa, cy, R } = u
  const ve = M(VESTITO), ves = M(VESTITO_S), ca = M(CAPELLI), cas = M(CAPELLI_S)
  const gonna = sway(u, perno(busto, 0, 0.02, 0), 0.02, 0.03, 1.6)
  cil(gonna, 0.14, 0.23, 0.18, ve, 0, -0.08, 0, 10); cil(gonna, 0.232, 0.235, 0.025, M(0xf4f2ec), 0, -0.165, 0, 10)
  for (const b of u.bracci) sfera(b, 0.06, ve, 0, -0.02, 0, 1, 0.9, 1, 7)                                   // le maniche a sbuffo
  cil(busto, 0.1, 0.13, 0.03, M(0xf8f6f0), 0, 0.235, 0.0, 8).scale.z = 0.95                                 // il colletto
  scatola(busto, 0.05, 0.035, 0.02, M(FIOCCO), 0, 0.2, 0.105)
  // i capelli: calotta, frangia, la treccia lunga dietro col fiocco
  chioma(u, ca, { su: 0.1, dietro: 0.1, k: 1.05 })
  for (const s of [-1, 0, 1]) sfera(testa, R * 0.3, ca, s * R * 0.45, cy + R * 0.62, R * 0.6, 1, 0.5, 0.6, 6)
  for (const s of [-1, 1]) sfera(testa, R * 0.25, ca, s * R * 0.92, cy - R * 0.05, R * 0.05, 0.6, 1.4, 0.9, 6)
  const treccia = sway(u, perno(testa, 0, cy - R * 0.1, -R * 0.95), 0.12, 0.08, 1.7)
  treccia.rotation.x = 0.25
  const pezzi = [0, 1, 2, 3].map(i => sfera(treccia, 0.06 - i * 0.007, i % 2 ? cas : ca, 0, -0.04 - i * 0.075, -0.01 * i, 1, 1.2, 1, 6))
  scatola(treccia, 0.1, 0.04, 0.03, M(FIOCCO), 0, -0.31, -0.03); sfera(treccia, 0.03, ca, 0, -0.36, -0.03, 1, 1.3, 1, 5)
  scatola(testa, 0.14, 0.05, 0.035, M(FIOCCO), 0, cy + R * 0.2, -R * 0.98)
  u.treccia = treccia
  return finisci(g, {
    fase: 3.3, P: 6.0, D: 1.4, off: 2.4, mano: 1,
    posa (u, tt, ge) {
      const [bs, bd] = u.bracci, [gs, gd] = u.gomiti
      bs.rotation.set(0.35, 0, -0.18); gs.rotation.set(-0.3, 0, 0.5); bd.rotation.set(0.35, 0, 0.18); gd.rotation.set(-0.3, 0, -0.5)   // le mani dietro
      u.busto.rotation.z = 0.05 * Math.sin(tt * 1.1); u.testa.rotation.z = -0.08 * Math.sin(tt * 1.1)              // dondola
      if (ge.k >= 0) {
        const h = Math.abs(Math.sin(ge.k * Math.PI * 2))
        u.busto.position.y += 0.05 * h; u.busto.rotation.x = -0.05 * h; for (const gm of u.gambe) { gm.rotation.x = 0.1 * h; gm.position.y += 0.05 * h }
        u.treccia.userData.piuX = 0.5 * h
      } else u.treccia.userData.piuX = 0
    }
  })
}

// L'eremita: curvo, tunica grigio-bruna lunga coi rattoppi e la corda in vita, cappuccio scuro alzato, barba grigia lunga a punta,
// sopracciglia folte, il bastone nodoso più alto di lui. Si accarezza la barba e annuisce.
function eremita () {
  const PELLE = 0xd7b394, TUNICA = 0x6e6250, TUNICA_S = 0x4e4436, CAPP = 0x5c6450, BARBA = 0xd0cec8, BARBA_S = 0xaeaca6, CORDA = 0xc8b07a
  const g = corpo('eremita', { legH: 0.32, legX: 0.08, legR: 0.045, tw: 0.32, th: 0.3, td: 0.25, basso: 1.0, armX: 0.2, R: 0.24, pelle: PELLE,
    calzoni: null, scarpe: M(0x6a4a2a), vesti: M(TUNICA), manicaR: 0.055, bot: [0.11, 0.06, 0.18] })
  const u = g.userData, { busto, testa, mani, gomiti, cy, R } = u
  const tu = M(TUNICA), tus = M(TUNICA_S), cp = M(CAPP)
  const gonna = sway(u, perno(g, 0, 0.36, 0), 0.015, 0.015, 1.0)
  cil(gonna, 0.17, 0.27, 0.34, tu, 0, -0.17, 0, 9)
  scatola(gonna, 0.09, 0.08, 0.02, tus, 0.12, -0.24, 0.22).rotation.y = 0.45; scatola(gonna, 0.07, 0.07, 0.02, M(0x7a6a4a), -0.1, -0.1, 0.2).rotation.y = -0.4   // i rattoppi
  for (const gm of gomiti) cil(gm, 0.07, 0.085, 0.1, tu, 0, -0.09, 0, 7)                                    // le maniche larghe
  cil(busto, 0.17, 0.17, 0.035, M(CORDA), 0, 0.04, 0, 8).scale.z = 0.8
  const nodo = sway(u, perno(busto, 0.06, 0.03, 0.13), 0.06, 0.04, 1.5); tubo(nodo, [0, 0, 0], [0.01, -0.16, 0.0], 0.013, 0.011, M(CORDA), 4)
  pezzo(testa, calotta(0.8, 2.2), M(CAPP, DOPPIO), 0, cy + 0.02, -0.02, R * 1.2, R * 1.16, R * 1.2)
  cil(busto, 0.19, 0.22, 0.09, cp, 0, 0.27, -0.01, 9).scale.z = 0.85
  punta(testa, [0, cy + R * 0.75, -R * 0.75], [0, cy + R * 0.25, -R * 1.6], 0.09, cp, 5)
  sfera(testa, 0.06, M(0xc89a7a), 0, cy - R * 0.12, R * 0.99, 1, 1.2, 1.1)
  const b = barba(u, M(BARBA), M(BARBA_S), { lung: 0.3, punta: true, larga: 0.9 })
  u.barbaP = b
  // il bastone nodoso nella destra
  const bast = perno(mani[1], 0, 0, 0); bast.userData.arnese = true
  const nodi = [[0, -0.36, 0.0], [0.01, -0.1, 0.01], [-0.01, 0.2, 0.0], [0.02, 0.5, 0.01], [0.0, 0.66, 0.0]]
  for (let i = 0; i < nodi.length - 1; i++) tubo(bast, nodi[i], nodi[i + 1], 0.024 - i * 0.002, 0.022 - i * 0.002, M(0x7a5a3a), 5)
  rozza(bast, 0.05, M(0x5e4428), 0.0, 0.69, 0.0, 1, 0.9, 1); rozza(bast, 0.028, M(0x5e4428), 0.02, 0.2, 0.0)
  for (const [x, y, z] of [[0.04, 0.66, 0.02], [-0.03, 0.6, 0.03]]) rozza(bast, 0.025, M(0x5a8a3a), x, y, z, 1, 0.6, 1.4)   // due foglie
  return finisci(g, {
    fase: 6.1, P: 8.0, D: 3.0, off: 1.5, mano: 0, chino: 0.22, sguardo: 0.5,
    posa (u, tt, ge) {
      const [bs, bd] = u.bracci, [gs, gd] = u.gomiti
      bd.rotation.set(-0.75, 0, 0.18); gd.rotation.set(-0.35, 0, 0); u.mani[1].rotation.set(0.95, 0, 0)    // il bastone avanti, dritto
      bs.rotation.set(-0.2, 0, -0.1); gs.rotation.set(-0.7, 0, 0.3)
      if (ge.k >= 0) {                                                                                    // si liscia la barba, poi annuisce
        const su = smussa(lim(ge.k / 0.2)) * (1 - smussa(lim((ge.k - 0.7) / 0.2))), liscia = Math.sin(ge.k * Math.PI * 5)
        bs.rotation.set(mescola(-0.2, -0.95, su), 0, mescola(-0.1, 0.12 + 0.06 * liscia, su)); gs.rotation.set(mescola(-0.7, -1.1 + 0.15 * liscia, su), 0, mescola(0.3, 0.55, su))
        u.testa.rotation.x += 0.12 * campana(ge.k, 0.7, 1) * Math.sin(ge.k * 40); u.testa.rotation.y *= 1 - su
      }
    }
  })
}

// La guardia (e le sentinelle): cotta di maglia grigia, sopravveste a spicchi giallo e blu, il cappello di ferro a tesa larga,
// la lancia con il pennoncino nella destra e lo scudo tondo al braccio sinistro. Batte la lancia a terra.
function guardia () {
  const PELLE = 0xe6b896, MAGLIA = 0x8a9098, GIALLO = 0xd8a42a, BLU = 0x2a4a8a, LEGNO_C = 0x9a6a36
  const g = corpo('guardia', { legH: 0.34, legX: 0.1, legR: 0.07, tw: 0.38, th: 0.3, td: 0.26, basso: 0.92, armX: 0.24, R: 0.24, pelle: PELLE,
    calzoni: M(0x5a4a3a), scarpe: M(0x2a2018), vesti: metallo(MAGLIA, { roughness: 0.6 }), manicaR: 0.058, bot: [0.13, 0.14, 0.21] })
  const u = g.userData, { busto, testa, mani, gomiti, cy, R } = u
  const gi = M(GIALLO), blu = M(BLU), fe = metallo(0x7a8088)
  for (const s of [-1, 1]) { const f = scatola(busto, 0.15, 0.36, 0.02, s < 0 ? gi : blu, s * 0.075, 0.08, 0.125); f.rotation.x = -0.04 }   // la sopravveste a spicchi
  for (const s of [-1, 1]) scatola(busto, 0.15, 0.3, 0.02, s < 0 ? blu : gi, s * 0.075, 0.1, -0.125)
  cil(busto, 0.2, 0.19, 0.045, M(0x3a2618), 0, 0.03, 0, 8).scale.z = 0.72
  sfera(busto, 0.04, gi, 0, 0.2, 0.14, 1, 1, 0.3, 6)
  // il cappello di ferro: calotta e tesa larga
  const cap = perno(testa, 0, cy + R * 0.2, 0)
  const cal = new THREE.Mesh(G('cappFerro', () => new THREE.SphereGeometry(1, 12, 6, 0, Math.PI * 2, 0, 1.4)), fe); cal.position.set(0, 0.0, 0); cal.scale.set(R * 1.08, R * 1.0, R * 1.08); cap.add(cal)
  cil(cap, R * 1.55, R * 1.62, 0.03, fe, 0, 0.0, 0, 14).rotation.x = 0.0
  scatola(cap, 0.03, 0.04, R * 2.2, metallo(0x9aa2aa), 0, R * 0.95, 0)
  sfera(testa, 0.05, M(0xd8a080), 0, cy - R * 0.12, R * 0.99, 1, 1, 1)
  chioma(u, M(0x5a3a22), { su: -0.1, dietro: 0.25, k: 1.0 })
  // la lancia nella destra, lo scudo alla sinistra
  const lan = lancia(g); mani[1].add(lan); lan.position.set(0, -0.0, 0.0); lan.rotation.set(0, 0, 0)
  const scudo = perno(gomiti[0], -0.06, -0.08, 0.02); scudo.rotation.set(0, -Math.PI / 2, 0)
  cil(scudo, 0.2, 0.2, 0.03, M(LEGNO_C), 0, 0, 0, 12).rotation.x = Math.PI / 2
  toro(scudo, 0.2, 0.016, fe, 0, 0, 0.0, 12)
  cil(scudo, 0.13, 0.13, 0.032, blu, 0, 0, 0.003, 12).rotation.x = Math.PI / 2
  cil(scudo, 0.05, 0.06, 0.04, metallo(0xc0c4c8), 0, 0, 0.02, 8).rotation.x = Math.PI / 2
  for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4; scatola(scudo, 0.028, 0.06, 0.036, gi, Math.cos(a) * 0.16, Math.sin(a) * 0.16, 0.002).rotation.z = a }
  return finisci(g, {
    fase: 2.2, P: 7.0, D: 1.6, off: 3.6, mano: 0, saluto: 'fermo', sguardo: 0.8,
    posa (u, tt, ge) {
      const [bs, bd] = u.bracci, [gs, gd] = u.gomiti
      bd.rotation.set(-0.12, 0, 0.32); gd.rotation.set(-1.1, 0, 0); u.mani[1].rotation.set(1.2, 0, 0)    // la lancia dritta, il calcio a terra
      bs.rotation.set(-0.15, 0, -0.18); gs.rotation.set(-1.2, 0, 0.0)
      if (ge.k >= 0) {                                                                                     // la alza e la batte
        const k = ge.k, su = campana(k, 0, 0.45), urto = k > 0.45 ? Math.exp(-(k - 0.45) * 10) * Math.cos((k - 0.45) * 30) : 0
        bd.rotation.x -= 0.18 * su; gd.rotation.x -= 0.3 * su
        u.busto.position.y -= 0.008 * Math.max(0, urto); u.testa.rotation.x += 0.05 * su
      }
    }
  })
}

// Il boscaiolo: alto e grosso, camicia a quadri rossi e neri, pantaloni di tela, barbone castano e berretto di lana verde col
// pompon; l'ascia appoggiata sulla spalla destra. Ruota la spalla e si risistema l'ascia.
function boscaiolo () {
  const PELLE = 0xe0a882, BRAGHE = 0x3e5470, BARBA = 0x6a3a1a, BARBA_S = 0x52301a, LANA = 0x3a7a4a
  const quadri = stoffa('quadri')
  const g = corpo('boscaiolo', { legH: 0.36, legX: 0.115, legR: 0.08, tw: 0.48, th: 0.33, td: 0.32, basso: 0.85, armX: 0.3, R: 0.24, pelle: PELLE,
    calzoni: M(BRAGHE), scarpe: M(0x5a3a1e), vesti: quadri, maniche: quadri, avambracci: quadri, manicaR: 0.075, bot: [0.15, 0.14, 0.24] })
  const u = g.userData, { busto, testa, gambe, mani, cy, R } = u
  cil(busto, 0.245, 0.215, 0.05, M(0x3a2614), 0, 0.03, 0, 8).scale.z = 0.68
  scatola(busto, 0.06, 0.05, 0.02, metallo(0xb0a090), 0, 0.03, 0.16)
  for (const s of [-1, 1]) scatola(busto, 0.035, 0.32, 0.02, M(0x8a2a1a), s * 0.1, 0.17, 0.15)               // le bretelle
  for (const s of [-1, 1]) scatola(busto, 0.035, 0.035, 0.34, M(0x8a2a1a), s * 0.1, 0.32, 0)
  for (const p of gambe) cil(p, 0.088, 0.09, 0.05, M(0x5a3a1e), 0, -0.2, 0, 7)
  barba(u, M(BARBA), M(BARBA_S), { lung: 0.18, larga: 1.15 })
  sfera(testa, 0.06, M(0xd08a68), 0, cy - R * 0.1, R * 0.99, 1.1, 1, 1)
  // il berretto di lana col risvolto e il pompon
  const ber = perno(testa, 0, cy + R * 0.35, -0.01)
  sfera(ber, R * 1.06, M(LANA), 0, 0.0, 0, 1.03, 0.82, 1.03, 10)
  cil(ber, R * 1.1, R * 1.1, 0.07, M(0x2e6a3c), 0, -0.02, 0, 12)
  rozza(ber, 0.07, M(0xf0ece0), 0, R * 0.88, 0)
  chioma(u, M(BARBA), { su: -0.2, dietro: 0.28, k: 1.0 })
  // l'ascia sulla spalla destra
  const asc = ascia(mani[1]); asc.rotation.set(1.05, 0, -0.6); asc.position.set(0, 0, 0)
  return finisci(g, {
    fase: 4.7, P: 7.4, D: 2.2, off: 0.3, mano: 0,
    posa (u, tt, ge) {
      const [bs, bd] = u.bracci, [gs, gd] = u.gomiti
      bd.rotation.set(-0.1, 0, 0.25); gd.rotation.set(-2.2, 0, 0); u.mani[1].rotation.set(0.0, 0, 0)       // la mano alla spalla, l'ascia dietro
      bs.rotation.set(0.03 * Math.sin(tt * 1.2), 0, -0.14); gs.rotation.set(-0.2, 0, 0)
      if (ge.k >= 0) {                                                                                     // solleva l'ascia e la riappoggia
        const su = campana(ge.k, 0, 1), ruota = Math.sin(ge.k * Math.PI * 2)
        bd.rotation.x -= 0.5 * su; gd.rotation.x += 0.5 * su; u.busto.rotation.y = 0.15 * ruota; u.testa.rotation.y = -0.2 * ruota
        bs.rotation.z -= 0.3 * su
      }
    }
  })
}

// Il pescatore: magro e anziano, cappello di paglia a tesa larga, maglia a righe e gilet verde oliva, calzoni arrotolati, la
// barba grigia di qualche giorno e la pipa; la canna nella destra col filo e il galleggiante. Ogni tanto tira la lenza.
function pescatore () {
  const PELLE = 0xd49a72, GILET = 0x6a7a3a, BRAGHE = 0xb8a070, PAGLIA = 0xe2c46a, PAGLIA_S = 0xc0a04a
  const righe = stoffa('righe')
  const g = corpo('pescatore', { legH: 0.36, legX: 0.085, legR: 0.055, tw: 0.32, th: 0.3, td: 0.23, basso: 0.92, armX: 0.21, R: 0.235, pelle: PELLE,
    calzoni: M(BRAGHE), scarpe: M(0x4a3a2a), vesti: righe, maniche: righe, avambracci: M(PELLE), manicaR: 0.05, bot: [0.12, 0.08, 0.2] })
  const u = g.userData, { busto, testa, gambe, mani, cy, R } = u
  const gi = M(GILET)
  for (const s of [-1, 1]) { scatola(busto, 0.12, 0.27, 0.025, gi, s * 0.1, 0.14, 0.105); scatola(busto, 0.06, 0.05, 0.03, M(0x5a6a2a), s * 0.1, 0.1, 0.12) }   // il gilet con le tasche
  scatola(busto, 0.3, 0.27, 0.025, gi, 0, 0.14, -0.105)
  for (const p of gambe) { cil(p, 0.064, 0.064, 0.05, M(0xa08a5a), 0, -0.2, 0, 7); cil(p, 0.04, 0.04, 0.06, M(PELLE), 0, -0.24, 0, 6) }   // calzoni arrotolati, caviglie nude
  sfera(testa, 0.055, M(0xc08060), 0, cy - R * 0.1, R * 0.98, 1.1, 1.1, 1.1)
  // la pipa
  const pipa = perno(testa, 0.06, cy - R * 0.45, R * 0.88)
  tubo(pipa, [0, 0, 0], [0.08, -0.03, 0.08], 0.01, 0.01, M(0x3a2414), 4); cil(pipa, 0.025, 0.02, 0.05, M(0x6a3a1a), 0.09, 0.0, 0.09, 6)
  chioma(u, M(0xb0aea8), { su: -0.1, dietro: 0.25, k: 1.0 })
  // il cappello di paglia: tesa larga e un cocuzzolo basso con il nastro
  const cap = perno(testa, 0, cy + R * 0.55, 0); cap.rotation.set(-0.08, 0, -0.06)
  cil(cap, 0.44, 0.46, 0.025, M(PAGLIA), 0, 0, 0, 14)
  cil(cap, 0.2, 0.24, 0.15, M(PAGLIA), 0, 0.08, 0, 10); cil(cap, 0.245, 0.245, 0.04, M(0x2a4a7a), 0, 0.03, 0, 10)
  cil(cap, 0.44, 0.47, 0.012, M(PAGLIA_S), 0, -0.016, 0, 14)
  // la canna nella destra, il filo e il galleggiante (il filo resta verticale: si ricalcola a ogni fotogramma)
  const canna = perno(mani[1], 0, 0, 0); canna.userData.arnese = true; canna.rotation.x = 2.0
  tubo(canna, [0, -0.1, 0], [0, 0.25, 0], 0.022, 0.016, M(0x7a4a2a), 6)
  tubo(canna, [0, 0.25, 0], [0, 1.05, 0], 0.014, 0.006, M(0xa8743c), 5)
  cil(canna, 0.035, 0.035, 0.025, metallo(0x8a8a8e), 0.03, 0.08, 0, 8).rotation.z = Math.PI / 2
  const cima = perno(canna, 0, 1.05, 0)
  const filo = new THREE.Mesh(G('filo', () => new THREE.CylinderGeometry(0.003, 0.003, 1, 3).translate(0, 0.5, 0)), M(0xe8e8e8)); filo.userData.solo = true; filo.userData.arnese = true; g.add(filo)
  const gall = perno(g); gall.userData.arnese = true
  sfera(gall, 0.03, M(0xe03a2a), 0, 0.012, 0, 1, 0.8, 1, 6); sfera(gall, 0.03, M(0xf4f0e8), 0, -0.012, 0, 1, 0.8, 1, 6); cil(gall, 0.004, 0.004, 0.05, M(0x222222), 0, 0.04, 0, 3)
  const A = new THREE.Vector3(), B = new THREE.Vector3(), D = new THREE.Vector3()
  return finisci(g, {
    fase: 3.8, P: 6.4, D: 1.6, off: 2.8, mano: 0, sguardo: 0.5,
    posa (u, tt, ge) {
      const [bs, bd] = u.bracci, [gs, gd] = u.gomiti
      bd.rotation.set(-0.35, 0, 0.12); gd.rotation.set(-0.85 + 0.03 * Math.sin(tt * 1.3), 0, 0); u.mani[1].rotation.set(0, 0, 0)   // la canna in avanti, in su
      bs.rotation.set(-0.1, 0, -0.1); gs.rotation.set(-1.0, 0, 0.35)                                          // la sinistra in tasca, sul gilet
      u.testa.rotation.x += 0.12
      if (ge.k >= 0) { const tira = campana(ge.k, 0, 0.4), molla = ge.k > 0.4 ? Math.exp(-(ge.k - 0.4) * 6) * Math.sin((ge.k - 0.4) * 30) : 0; bd.rotation.x -= 0.2 * tira + 0.06 * molla; gd.rotation.x -= 0.1 * tira }
    },
    vivo (u, tt, ge, g) {
      g.updateMatrixWorld(true)
      cima.getWorldPosition(A); g.worldToLocal(A)
      const strappo = ge.k >= 0 ? campana(ge.k, 0, 0.45) : 0
      const L = 0.62 - 0.1 * strappo
      B.set(A.x + 0.03 * Math.sin(tt * 1.3), A.y - L + 0.012 * Math.sin(tt * 2.6), A.z + 0.03 * Math.cos(tt * 1.1))
      gall.position.copy(B)
      D.copy(A).sub(B); filo.position.copy(B); filo.scale.set(1, D.length(), 1); filo.quaternion.setFromUnitVectors(SU, D.normalize())
    }
  })
}

// Il mugnaio: tondo e rubicondo, camicia di tela grezza con le maniche arrotolate, grembiulone bianco infarinato, il basco chiaro e
// i baffi; il sacco di farina sulla spalla sinistra. Si batte il grembiule e si alza uno sbuffo di farina.
function mugnaio () {
  const PELLE = 0xf2c0a0, CAMICIA = 0xd8c8a0, GREMB = 0xf4f2ee, BRAGHE = 0x7a5a3a, BASCO = 0xe6e0d4, SACCO = 0xcfb682
  const g = corpo('mugnaio', { legH: 0.26, legX: 0.11, legR: 0.08, tw: 0.44, th: 0.31, td: 0.36, basso: 1.1, armX: 0.27, R: 0.25, pelle: PELLE,
    calzoni: M(BRAGHE), scarpe: M(0x4a3020), vesti: M(CAMICIA), maniche: M(CAMICIA), avambracci: M(PELLE), manicaR: 0.068, bot: [0.15, 0.1, 0.22] })
  const u = g.userData, { busto, testa, gomiti, mani, cy, R } = u
  const gr = M(GREMB)
  sfera(busto, 0.23, M(CAMICIA), 0, 0.12, 0.05, 1.0, 0.85, 0.85, 9)                                           // la pancia
  for (const gm of gomiti) cil(gm, 0.07, 0.07, 0.04, M(0xc8b890), 0, 0.0, 0, 7)                                // le maniche arrotolate
  sfera(busto, 0.2, gr, 0, 0.13, 0.1, 0.95, 0.85, 0.7, 9)
  const grem = sway(u, perno(busto, 0, 0.04, 0), 0.03, 0.01, 1.1)
  pezzo(grem, arcoGeo(0.25, 0.27, 0.3, 1.1), M(GREMB, DOPPIO), 0, -0.14, 0, 1, 1, 0.86)
  for (const [x, y] of [[-0.1, -0.08], [0.08, -0.2], [0.13, -0.04]]) sfera(grem, 0.035, M(0xd8d0c0), x, y, 0.235, 1.4, 1, 0.3, 5)
  cil(busto, 0.235, 0.24, 0.04, M(0xe8e4dc), 0, 0.05, 0, 9).scale.z = 0.85
  for (const s of [-1, 1]) scatola(busto, 0.035, 0.03, 0.36, gr, s * 0.1, 0.3, 0)
  sfera(testa, 0.065, M(0xe8907a), 0, cy - R * 0.1, R * 0.99, 1.1, 1.0, 1.1)
  for (const s of [-1, 1]) { tubo(testa, [s * 0.015, cy - R * 0.36, R * 0.95], [s * 0.13, cy - R * 0.4, R * 0.84], 0.04, 0.028, M(0x7a4a2a), 6, true); sfera(testa, 0.03, M(0x7a4a2a), s * 0.16, cy - R * 0.33, R * 0.8, 1, 1, 1, 5) }
  chioma(u, M(0x7a4a2a), { su: -0.1, dietro: 0.25, k: 1.0 })
  // il basco floscio, un po' di traverso
  const bas = perno(testa, 0.03, cy + R * 0.62, -0.02); bas.rotation.set(-0.1, 0, -0.28)
  cil(bas, 0.3, 0.26, 0.09, M(BASCO), 0, 0, 0, 12); sfera(bas, 0.3, M(BASCO), 0, 0.04, 0, 1, 0.3, 1, 12); cil(bas, 0.015, 0.02, 0.04, M(0xc8c0b0), 0, 0.12, 0, 5)
  // il sacco di farina sulla spalla sinistra (lo tiene la sinistra)
  const sacco = perno(busto, -0.2, 0.36, -0.02); sacco.rotation.set(0, 0.2, 0.55)
  sfera(sacco, 0.17, M(SACCO), 0, 0.03, 0, 1.45, 0.75, 0.9, 9)
  cil(sacco, 0.04, 0.05, 0.06, M(0xd8c8a0), -0.25, 0.03, 0, 6).rotation.z = Math.PI / 2
  scatola(sacco, 0.12, 0.08, 0.01, M(0x5a7aaa), 0, 0.03, 0.155).rotation.x = -0.25
  // lo sbuffo di farina (pezzetti liberi che compaiono nel gesto)
  const sbuffo = [0, 1, 2, 3, 4, 5].map(i => { const m = new THREE.Mesh(G('sbuffo', () => new THREE.IcosahedronGeometry(0.05, 0)), new THREE.MeshStandardMaterial({ color: 0xeeeae2, roughness: 1, flatShading: true, transparent: true, opacity: 0.75 })); m.userData.solo = true; m.visible = false; g.add(m); return m })
  return finisci(g, {
    fase: 5.0, P: 6.6, D: 2.0, off: 4.4, mano: 1,
    posa (u, tt, ge) {
      const [bs, bd] = u.bracci, [gs, gd] = u.gomiti
      bs.rotation.set(-0.3, 0, -2.5); gs.rotation.set(0, 0, -0.9 + 0.03 * Math.sin(tt * 1.2))              // la sinistra su, a tenere il sacco
      bd.rotation.set(0.02, 0, 0.3); gd.rotation.set(-0.4, 0, 0)
      if (ge.k >= 0) {                                                                                      // tre colpetti sul grembiule
        const su = smussa(lim(ge.k / 0.15)) * (1 - smussa(lim((ge.k - 0.75) / 0.2))), batti = 0.5 + 0.5 * Math.sin(ge.k * Math.PI * 6)
        bd.rotation.set(mescola(0.02, -0.45 - 0.25 * batti, su), 0, mescola(0.3, 0.1, su)); gd.rotation.set(mescola(-0.4, -0.9 + 0.3 * batti, su), 0, mescola(0, -0.4, su))
        u.testa.rotation.x += 0.15 * su; u.testa.rotation.y *= 1 - su
      }
    },
    vivo (u, tt, ge) {
      const k = ge.k
      sbuffo.forEach((m, i) => {
        const p = k >= 0 ? lim((k - 0.15 - i * 0.07) / 0.6) : 0
        m.visible = p > 0 && p < 1
        if (!m.visible) return
        const a = i * 1.7
        m.position.set(0.06 + Math.cos(a) * 0.18 * p, 0.3 + 0.45 * p, 0.36 + 0.18 * p + Math.sin(a) * 0.06)
        m.scale.setScalar(0.6 + 1.6 * p); m.material.opacity = 0.7 * (1 - p); m.rotation.set(tt + i, tt * 0.7, 0)
      })
    }
  })
}

// La cacciatrice: snella e dritta, giubba di cuoio verde bosco con le frange, la pelle del lupo sulle spalle e sul capo (il muso
// sulla fronte, le orecchie dritte), la treccia rossa, gli stivali alti; l'arco corto nella sinistra, la faretra sulla schiena. Si
// porta la destra sopra gli occhi e scruta lontano.
function cacciatrice () {
  const PELLE = 0xe8b894, GIUBBA = 0x4a5a2e, GIUBBA_S = 0x36421f, CUOIO = 0x7a5232, CUOIO_S = 0x4a3020, LUPO = 0x8a8984, LUPO_S = 0x5a5955,
    LUPO_C = 0xd8d4c8, CAPELLI = 0xb0461e, CAPELLI_S = 0x8a3414
  const g = corpo('cacciatrice', { legH: 0.38, legX: 0.08, legR: 0.055, tw: 0.32, th: 0.3, td: 0.22, basso: 0.9, armX: 0.2, R: 0.23, pelle: PELLE,
    calzoni: M(0x5a4632), scarpe: M(CUOIO_S), vesti: M(GIUBBA), maniche: M(GIUBBA), avambracci: M(CUOIO), manicaR: 0.048, bot: [0.11, 0.12, 0.19] })
  const u = g.userData, { busto, testa, gambe, mani, cy, R } = u
  const gi = M(GIUBBA), gis = M(GIUBBA_S), cu = M(CUOIO), cus = M(CUOIO_S), lu = M(LUPO), lus = M(LUPO_S), ca = M(CAPELLI), cas = M(CAPELLI_S)
  for (const p of gambe) cil(p, 0.063, 0.059, 0.17, cus, 0, -0.25, 0, 7)                                     // gli stivali alti
  // la falda della giubba sotto la cintura, con le frange
  const falda = sway(u, perno(busto, 0, 0.03, 0), 0.02, 0.015, 1.3)
  cil(falda, 0.165, 0.2, 0.14, gi, 0, -0.07, 0, 9).scale.z = 0.75
  for (let i = -3; i <= 3; i++) scatola(falda, 0.024, 0.06, 0.012, gis, i * 0.045, -0.16, 0.148)
  cil(busto, 0.168, 0.172, 0.04, cus, 0, 0.04, 0, 9).scale.z = 0.72                                          // la cintura
  scatola(busto, 0.04, 0.035, 0.02, metallo(0xc8a050), 0, 0.04, 0.125)
  scatola(busto, 0.035, 0.44, 0.02, cus, 0.0, 0.17, 0.118).rotation.z = 0.72                                 // la cinghia della faretra
  // la faretra sulla schiena, con le frecce
  const far = perno(busto, 0.05, 0.2, -0.14); far.rotation.z = -0.4; far.userData.arnese = true
  cil(far, 0.055, 0.048, 0.34, cu, 0, 0, 0, 7); cil(far, 0.058, 0.058, 0.03, cus, 0, 0.16, 0, 7)
  for (const [x, z] of [[-0.022, 0.012], [0.022, -0.01], [0.0, 0.022]]) { cil(far, 0.006, 0.006, 0.14, M(LEGNO), x, 0.22, z, 4); cono(far, 0.02, 0.06, M(0xece8de), x, 0.31, z, 3) }
  // la pelle del lupo: il manto dietro, il bavero di pelo chiaro, il capo col muso e le orecchie
  const manto = sway(u, perno(busto, 0, 0.3, -0.09), 0.035, 0.02, 1.1)
  cil(manto, 0.17, 0.24, 0.44, lu, 0, -0.21, -0.02, 9).scale.z = 0.6
  cil(busto, 0.19, 0.2, 0.07, lu, 0, 0.27, 0, 9).scale.z = 0.86
  sfera(busto, 0.07, M(LUPO_C), 0, 0.26, 0.13, 1.7, 0.6, 0.5, 6)
  pezzo(testa, calotta(0.95, 1.85), M(LUPO, DOPPIO), 0, cy + 0.02, -0.02, R * 1.17, R * 1.12, R * 1.16)
  sfera(testa, 0.1, lu, 0, cy + R * 0.98, R * 0.45, 1.05, 0.6, 1.35, 7)                                      // il muso del lupo sulla fronte
  sfera(testa, 0.06, M(LUPO_C), 0, cy + R * 0.86, R * 0.88, 1.1, 0.55, 0.9, 6)
  sfera(testa, 0.026, M(0x1c1a18), 0, cy + R * 0.98, R * 1.02, 1, 0.8, 1, 5)                                 // il naso del lupo
  for (const s of [-1, 1]) sfera(testa, 0.018, M(0xd0a020), s * 0.06, cy + R * 1.1, R * 0.62, 1, 1, 1, 4)    // gli occhi del lupo
  for (const s of [-1, 1]) { const o = cono(testa, 0.055, 0.13, lus, s * R * 0.58, cy + R * 1.18, R * 0.08, 4); o.rotation.z = -s * 0.25 }
  // i capelli rossi: due ciocche ai lati del viso e la treccia sulla spalla destra
  for (const s of [-1, 1]) sfera(testa, R * 0.24, ca, s * R * 0.86, cy + R * 0.05, R * 0.38, 0.55, 1.3, 0.8, 6)
  const treccia = sway(u, perno(testa, -R * 0.75, cy - R * 0.25, R * 0.1), 0.08, 0.05, 1.4)
  treccia.rotation.set(0.15, 0, -0.15)
  ;[0, 1, 2].forEach(i => sfera(treccia, 0.05 - i * 0.006, i % 2 ? cas : ca, 0, -0.04 - i * 0.07, 0.04 * i, 1, 1.2, 1, 6))
  scatola(treccia, 0.05, 0.03, 0.03, cus, 0, -0.22, 0.09)
  sfera(testa, 0.05, M(0xd89a78), 0, cy - R * 0.1, R * 0.98, 1, 0.9, 1)                                      // il naso
  // l'arco corto nella sinistra, dritto, con la corda
  const arco = perno(mani[0], 0, 0, 0.02); arco.userData.arnese = true
  pezzo(arco, G('arcoCaccia', () => new THREE.TorusGeometry(0.34, 0.016, 4, 12, Math.PI * 0.86)), M(LEGNO_S), 0.12, 0, 0).rotation.z = Math.PI / 2 + Math.PI * 0.07
  cil(arco, 0.024, 0.024, 0.08, cus, 0, 0, 0, 6)
  cil(arco, 0.003, 0.003, 0.66, M(0xe8e4d8), 0.21, 0, 0, 3)
  return finisci(g, {
    fase: 1.1, P: 7.8, D: 2.6, off: 0.9, mano: 1, sguardo: 0.9,
    posa (u, tt, ge) {
      const [bs, bd] = u.bracci, [gs, gd] = u.gomiti, [ms] = u.mani
      bs.rotation.set(-0.12, 0, -0.16); gs.rotation.set(-0.35 + 0.03 * Math.sin(tt * 1.2), 0, 0); ms.rotation.set(0, 0.0, 0)   // l'arco giù al fianco
      bd.rotation.set(0.02, 0, 0.12); gd.rotation.set(-0.25, 0, 0)
      if (ge.k >= 0) {                                                                                     // la mano sopra gli occhi, e guarda lontano
        const su = smussa(lim(ge.k / 0.18)) * (1 - smussa(lim((ge.k - 0.82) / 0.18))), giro = Math.sin(ge.k * Math.PI * 2)
        bd.rotation.set(mescola(0.02, -1.25, su), mescola(0, -0.45, su), mescola(0.12, -0.2, su)); gd.rotation.set(mescola(-0.25, -2.2, su), 0, mescola(0, -0.6, su))
        u.testa.rotation.x = mescola(u.testa.rotation.x, -0.12, su); u.testa.rotation.y = mescola(u.testa.rotation.y, 0.4 * giro, su)
        u.busto.rotation.y = 0.12 * giro * su
      }
    }
  })
}

// Il carovaniere: largo e scuro di sole, il turbante ocra avvolto col lembo che pende, la barba nera folta, lo spolverino rosso
// mattone fino ai polpacci sopra il panciotto, la fascia in vita con la frusta arrotolata; nella destra il bastone col lume, nella
// sinistra la carta delle strade. Ogni tanto la apre e la guarda.
function carovaniere () {
  const PELLE = 0xc98a5e, MANTO = 0x9a3a28, MANTO_S = 0x6e2818, PANC = 0x3a4a6a, FASCIA = 0xd8a030, TURB = 0xd8b060, TURB_S = 0xb08a40, BARBA = 0x1e1610
  const g = corpo('carovaniere', { legH: 0.32, legX: 0.11, legR: 0.075, tw: 0.44, th: 0.32, td: 0.32, basso: 0.95, armX: 0.28, R: 0.24, pelle: PELLE,
    calzoni: M(0x6a5a44), scarpe: M(0x3a2618), vesti: M(PANC), maniche: M(MANTO), avambracci: M(MANTO), manicaR: 0.07, bot: [0.15, 0.11, 0.23] })
  const u = g.userData, { busto, testa, mani, cy, R } = u
  const ma = M(MANTO), mas = M(MANTO_S), tu = M(TURB), tus = M(TURB_S)
  // lo spolverino: aperto davanti, dalle spalle fin sotto il ginocchio
  const manto = sway(u, perno(busto, 0, 0.3, 0), 0.025, 0.015, 1.0)
  pezzo(manto, arcoGeo(0.23, 0.32, 0.62, 2.45), M(MANTO, DOPPIO), 0, -0.3, -0.01, 1, 1, 0.82)
  cil(busto, 0.235, 0.25, 0.09, ma, 0, 0.27, 0, 9).scale.z = 0.85                                           // le spalle
  for (const s of [-1, 1]) scatola(busto, 0.06, 0.3, 0.02, mas, s * 0.1, 0.14, 0.16).rotation.y = s * 0.2    // i risvolti
  for (const gm of u.gomiti) cil(gm, 0.08, 0.08, 0.05, mas, 0, -0.12, 0, 7)                                  // i polsini
  // la fascia in vita e la frusta arrotolata al fianco
  cil(busto, 0.232, 0.236, 0.07, M(FASCIA), 0, 0.05, 0, 9).scale.z = 0.8
  const frusta = toro(busto, 0.07, 0.014, M(0x4a2e1a), -0.22, 0.0, 0.05, 10); frusta.rotation.y = Math.PI / 2
  cil(busto, 0.016, 0.018, 0.12, M(0x6a4a2a), -0.23, 0.06, 0.08, 5)
  // la testa: il turbante a giri, il lembo che pende, la barba folta
  const tur = perno(testa, 0, cy + R * 0.42, -0.01)
  cil(tur, R * 1.1, R * 1.06, 0.12, tu, 0, 0, 0, 10)
  toro(tur, R * 1.0, 0.035, tus, 0, 0.05, 0, 10).rotation.x = Math.PI / 2
  sfera(tur, R * 0.95, tu, 0, 0.07, 0, 1, 0.55, 1, 9)
  sfera(tur, 0.04, M(0x2a8a6a), 0, 0.02, R * 1.08, 1, 1, 0.6, 5)                                              // la pietra sul davanti
  const lembo = sway(u, perno(tur, R * 0.75, -0.02, -R * 0.55), 0.08, 0.05, 1.5)
  scatola(lembo, 0.08, 0.3, 0.025, tus, 0, -0.15, 0).rotation.x = 0.15
  barba(u, M(BARBA), M(0x2a2018), { lung: 0.2, larga: 1.12 })
  sfera(testa, 0.07, M(0xb87a52), 0, cy - R * 0.12, R * 0.98, 1.1, 1.0, 1.15)
  // il bastone col lume nella destra
  const bas = perno(mani[1], 0, 0, 0); bas.userData.arnese = true
  cil(bas, 0.02, 0.024, 1.2, M(LEGNO_S), 0, 0.22, 0, 6)
  cil(bas, 0.006, 0.006, 0.14, metallo(0x3a3a3a), 0.07, 0.75, 0, 3).rotation.z = Math.PI / 2
  const lant = sway(u, perno(bas, 0.13, 0.72, 0), 0.12, 0.1, 1.8)
  scatola(lant, 0.07, 0.09, 0.07, metallo(0x3a3a3a), 0, -0.08, 0); cono(lant, 0.055, 0.05, metallo(0x3a3a3a), 0, -0.01, 0, 4)
  scatola(lant, 0.052, 0.064, 0.075, luce(0xffc860, 0.9), 0, -0.08, 0)
  // la carta delle strade nella sinistra: arrotolata, si apre nel gesto
  const carta = perno(mani[0], 0, -0.02, 0.06)
  const rotolo = cil(carta, 0.03, 0.03, 0.22, M(0xe8d8a8), 0, 0, 0, 6); rotolo.rotation.z = Math.PI / 2
  const foglio = perno(carta, 0.1, 0.06, 0.03); scatola(foglio, 0.26, 0.2, 0.01, M(0xeadcae))
  return finisci(g, {
    fase: 2.6, P: 7.4, D: 2.8, off: 1.7, mano: 1, sguardo: 0.7,
    posa (u, tt, ge) {
      const [bs, bd] = u.bracci, [gs, gd] = u.gomiti, [ms, md] = u.mani
      bd.rotation.set(-0.1, 0, 0.34); gd.rotation.set(-1.05, 0, 0); md.rotation.set(1.15, 0, -0.32)       // il bastone a terra, il lume di lato
      bs.rotation.set(-0.1, 0, -0.12); gs.rotation.set(-0.5 + 0.03 * Math.sin(tt * 1.1), 0, 0); ms.rotation.set(0, 0, 0)
      foglio.scale.set(1e-4, 1e-4, 1e-4)                                                                    // nella pelle: si nasconde scalando
      if (ge.k >= 0) {                                                                                     // apre la carta davanti e la legge
        const su = smussa(lim(ge.k / 0.2)) * (1 - smussa(lim((ge.k - 0.8) / 0.2)))
        bs.rotation.set(mescola(-0.1, -0.85, su), mescola(0, 0.35, su), mescola(-0.12, -0.05, su)); gs.rotation.set(mescola(-0.5, -1.0, su), 0, mescola(0, 0.4, su))
        ms.rotation.set(mescola(0, -0.4, su), 0, 0)
        const aperta = su > 0.5 ? 1 : 1e-4; foglio.scale.set(aperta, aperta, aperta)
        u.testa.rotation.x = mescola(u.testa.rotation.x, 0.32, su); u.testa.rotation.y *= 1 - su
      }
    }
  })
}

const COSTRUTTORI = { armaiolo, incantatrice, erborista, rigattiere, minatore, capitano, ragazza, eremita, guardia, boscaiolo, pescatore, mugnaio, cacciatrice, carovaniere }
export function creaPersona (chiave) {
  const c = COSTRUTTORI[chiave]
  if (!c) throw new Error(`persona sconosciuta: ${chiave}`)
  const g = c()
  g.userData.chiave = chiave
  return g
}
