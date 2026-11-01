// Generato da strumenti/promuovi-3d.mjs da poc/eroi-3d/eroi.js: non si tocca a mano (si cambia il prototipo e si rilancia `npm run promuovi3d`).
// PoC: i quattro eroi giocabili del Sotterraneo come personaggi 3D in codice (three.js), al posto degli sprite.
// Stile della fattoria 3D (`creaContadino`): chibi, testa ~45% dell'altezza, low-poly morbido a facce piatte, faccia con una
// trama canvas (occhi grandi, ma decisi: il tono è serio-avventuroso). Autonomo: solo three.
// Contratto (lo stesso del contadino, così `equipaggia` di armi.js funziona): `creaEroe(chiave)` → Group, piedi a y = 0, davanti +z,
// `userData = { gambe:[sx,dx], busto, testa, bracci:[sx,dx], falce, ascia, anima(t) }`. I bracci hanno il pugno a y = -0.29.
import * as THREE from 'three'

export const CHIAVI = ['cavaliere', 'elfa', 'mago', 'nano']

// ── mattoncini ──
const cacheMat = new Map()
export function M (colore, o = {}) {
  const k = colore + JSON.stringify(o)
  if (!cacheMat.has(k)) cacheMat.set(k, new THREE.MeshStandardMaterial({ color: colore, roughness: 0.85, metalness: 0, flatShading: true, ...o }))
  return cacheMat.get(k)
}
const metallo = (c, o = {}) => M(c, { metalness: 0.45, roughness: 0.4, ...o })
const luce = (c, f = 0.8) => M(c, { emissive: c, emissiveIntensity: f, roughness: 0.4 })
const geo = new Map()
const G = (k, f) => { if (!geo.has(k)) geo.set(k, f()); return geo.get(k) }
function pezzo (g, geometria, m, x, y, z, sx = 1, sy = 1, sz = 1) {
  const o = new THREE.Mesh(geometria, m); o.position.set(x, y, z); o.scale.set(sx, sy, sz); o.castShadow = o.receiveShadow = true; g.add(o); return o
}
const scatola = (g, w, h, d, m, x = 0, y = 0, z = 0) => pezzo(g, G(`b${w},${h},${d}`, () => new THREE.BoxGeometry(w, h, d)), m, x, y, z)
const sfera = (g, r, m, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1, seg = 8) => pezzo(g, G(`s${r},${seg}`, () => new THREE.SphereGeometry(r, seg, Math.max(5, seg * 0.7 | 0))), m, x, y, z, sx, sy, sz)
const rozza = (g, r, m, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1) => pezzo(g, G(`i${r}`, () => new THREE.IcosahedronGeometry(r, 1)), m, x, y, z, sx, sy, sz)
const cil = (g, rs, ri, h, m, x = 0, y = 0, z = 0, seg = 10) => pezzo(g, G(`c${rs},${ri},${h},${seg}`, () => new THREE.CylinderGeometry(rs, ri, h, seg)), m, x, y, z)
const cono = (g, r, h, m, x = 0, y = 0, z = 0, seg = 5) => pezzo(g, G(`n${r},${h},${seg}`, () => new THREE.ConeGeometry(r, h, seg)), m, x, y, z)
const perno = (g, x, y, z) => { const p = new THREE.Group(); p.position.set(x, y, z); g.add(p); return p }
const SU = new THREE.Vector3(0, 1, 0)
/** Un cono dalla base `a` alla punta `b` (orecchie, corna, ciuffi). */
function punta (g, a, b, r, m, seg = 5) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A)
  const o = cono(g, r, d.length(), m, 0, 0, 0, seg); o.position.copy(A).addScaledVector(d, 0.5); o.quaternion.setFromUnitVectors(SU, d.normalize()); return o
}
/** Un tubo tra due punti (r1 in `a`, r2 in `b`), tondo alle estremità. */
function tubo (g, a, b, r1, r2, m, seg = 7) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A)
  const o = cil(g, r2, r1, d.length(), m, 0, 0, 0, seg); o.position.copy(A).addScaledVector(d, 0.5); o.quaternion.setFromUnitVectors(SU, d.normalize())
  sfera(g, r1, m, ...A.toArray(), 1, 1, 1, 6); sfera(g, r2, m, ...B.toArray(), 1, 1, 1, 6); return o
}
/** Un profilo piatto in (z, y) — z in avanti — esteso di `spessore` in x: cimieri, creste, pinne. */
function sagomaLaterale (punti, spessore) {
  const s = new THREE.Shape(); punti.forEach(([z, y], i) => i ? s.lineTo(z, y) : s.moveTo(z, y))
  const g = new THREE.ExtrudeGeometry(s, { depth: spessore, bevelEnabled: false }); g.translate(0, 0, -spessore / 2); g.rotateY(-Math.PI / 2); return g
}
function stella (r, spessore) {
  const s = new THREE.Shape()
  for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + i * Math.PI / 5, k = i % 2 ? r * 0.45 : r; i ? s.lineTo(Math.cos(a) * k, Math.sin(a) * k) : s.moveTo(Math.cos(a) * k, Math.sin(a) * k) }
  const g = new THREE.ExtrudeGeometry(s, { depth: spessore, bevelEnabled: false }); g.translate(0, 0, -spessore / 2); return g
}

// ══════════ la faccia ══════════
// Una trama canvas 256×176 sul patch di sfera del contadino. Ogni eroe ha il suo stile; `chiusi` dà gli occhi per l'ammiccare.
const STILI = {
  cavaliere: { pelle: '#e8b48c', guance: 'rgba(225,110,90,.28)', iride: '#2c6ea8', occX: 46, occY: 80, rx: 14, ry: 17, palp: 0.3, inclina: 0.0, cejaC: '#4a2e1a', cejaS: 8, cejaOut: -34, cejaIn: -22, bocca: 'serio', cicatrice: true },
  elfa: { pelle: '#f7d9c0', guance: 'rgba(240,130,130,.35)', iride: '#2fae6a', occX: 47, occY: 80, rx: 15, ry: 20, palp: 0.08, inclina: 0.2, cejaC: '#b99a50', cejaS: 4.5, cejaOut: -35, cejaIn: -27, bocca: 'sorriso', ciglia: true, lentiggini: true },
  mago: { pelle: '#f2cfae', guance: 'rgba(230,120,110,.3)', iride: '#4b79d8', occX: 46, occY: 82, rx: 13, ry: 16, palp: 0.34, inclina: 0.0, cejaC: '#f0eef4', cejaS: 10, cejaOut: -30, cejaIn: -26, bocca: 'nulla', rughe: true },
  nano: { pelle: '#e39a74', guance: 'rgba(215,80,60,.4)', iride: '#6a4426', occX: 46, occY: 84, rx: 12, ry: 14, palp: 0.32, inclina: 0.0, cejaC: '#b84a1a', cejaS: 13, cejaOut: -28, cejaIn: -14, bocca: 'nulla', rughe: true }
}
const trame = new Map()
function disegnaFaccia (s, chiusi) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 176
  const x = c.getContext('2d')
  x.fillStyle = s.pelle; x.fillRect(0, 0, 256, 176)
  x.lineCap = 'round'; x.lineJoin = 'round'
  for (const l of [-1, 1]) { x.fillStyle = s.guance; x.beginPath(); x.ellipse(128 + l * 74, 120, 17, 10, 0, 0, 7); x.fill() }
  if (s.lentiggini) { x.fillStyle = 'rgba(190,110,80,.5)'; for (const l of [-1, 1]) for (const [a, b] of [[62, 108], [70, 114], [78, 106], [66, 120]]) { x.beginPath(); x.arc(128 + l * (128 - a), b, 1.8, 0, 7); x.fill() } }
  for (const l of [-1, 1]) {
    const ex = 128 + l * s.occX, ey = s.occY
    if (!chiusi) {
      const rot = -l * s.inclina
      x.save(); x.beginPath(); x.ellipse(ex, ey, s.rx, s.ry, rot, 0, 7); x.clip()
      x.fillStyle = '#fbfaf4'; x.fillRect(ex - 30, ey - 30, 60, 60)
      x.fillStyle = s.iride; x.beginPath(); x.ellipse(ex - l * 1.5, ey + 1, s.rx * 0.78, s.ry * 0.92, rot, 0, 7); x.fill()
      x.fillStyle = 'rgba(0,0,0,.28)'; x.beginPath(); x.ellipse(ex - l * 1.5, ey - s.ry * 0.5, s.rx * 0.8, s.ry * 0.5, 0, 0, 7); x.fill()   // l'ombra della palpebra sull'iride
      x.fillStyle = '#16120e'; x.beginPath(); x.ellipse(ex - l * 1.5, ey + 2, s.rx * 0.4, s.ry * 0.55, rot, 0, 7); x.fill()
      x.fillStyle = '#fff'; x.beginPath(); x.arc(ex + 3.5, ey - s.ry * 0.3, 4.2, 0, 7); x.fill(); x.beginPath(); x.arc(ex - 3.5, ey + s.ry * 0.4, 2, 0, 7); x.fill()
      x.fillStyle = s.pelle; x.fillRect(ex - 30, ey - 30, 60, 30 + (-s.ry + 2 * s.ry * s.palp))                                       // la palpebra calata
      x.restore()
      x.strokeStyle = '#2a1c14'; x.lineWidth = 4.5
      x.beginPath(); x.ellipse(ex, ey, s.rx + 1, s.ry + 1, rot, Math.PI * 1.08, Math.PI * 1.92); x.stroke()                            // il bordo superiore
      if (s.ciglia) { x.lineWidth = 3.2; x.beginPath(); x.moveTo(ex + l * (s.rx - 1), ey - s.ry * 0.35); x.lineTo(ex + l * (s.rx + 9), ey - s.ry * 0.75); x.moveTo(ex + l * (s.rx - 4), ey - s.ry * 0.7); x.lineTo(ex + l * (s.rx + 4), ey - s.ry - 5); x.stroke() }
    } else {
      x.strokeStyle = '#2a1c14'; x.lineWidth = 5; x.beginPath(); x.arc(ex, ey - 6, s.rx, Math.PI * 0.15, Math.PI * 0.85); x.stroke()
      if (s.ciglia) { x.lineWidth = 3; x.beginPath(); x.moveTo(ex + l * s.rx, ey + 2); x.lineTo(ex + l * (s.rx + 8), ey - 4); x.stroke() }
    }
    x.strokeStyle = s.cejaC; x.lineWidth = s.cejaS                                                                                     // il sopracciglio: l'estremo interno è più basso
    x.beginPath(); x.moveTo(ex + l * 22, ey + s.cejaOut); x.quadraticCurveTo(ex + l * 4, ey + s.cejaOut - 8, ex - l * 18, ey + s.cejaIn); x.stroke()
    if (s.rughe) { x.strokeStyle = 'rgba(120,70,50,.45)'; x.lineWidth = 2; for (const k of [0, 1]) { x.beginPath(); x.moveTo(ex + l * (s.rx + 8), ey + 2 + k * 6); x.lineTo(ex + l * (s.rx + 16), ey - 2 + k * 9); x.stroke() } }
  }
  x.fillStyle = 'rgba(160,80,60,.4)'; x.beginPath(); x.ellipse(128, 106, 5, 4, 0, 0, 7); x.fill()                                      // il naso
  x.strokeStyle = '#8a3a2a'; x.lineWidth = 4.5
  if (s.bocca === 'serio') { x.beginPath(); x.moveTo(113, 128); x.quadraticCurveTo(128, 133, 144, 124); x.stroke() }                      // un mezzo ghigno sicuro
  if (s.bocca === 'sorriso') { x.beginPath(); x.moveTo(114, 124); x.quadraticCurveTo(130, 136, 146, 121); x.stroke(); x.lineWidth = 2.5; x.beginPath(); x.moveTo(146, 121); x.lineTo(150, 117); x.stroke() }
  if (s.cicatrice) {
    x.strokeStyle = 'rgba(190,70,70,.8)'; x.lineWidth = 3.5; x.beginPath(); x.moveTo(128 - s.occX - 16, s.occY - 38); x.lineTo(128 - s.occX + 4, s.occY - 14); x.stroke()
    x.lineWidth = 2; for (const k of [0.25, 0.55, 0.8]) { const px = 128 - s.occX - 16 + 20 * k, py = s.occY - 38 + 24 * k; x.beginPath(); x.moveTo(px - 4, py - 2); x.lineTo(px + 4, py + 2); x.stroke() }
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4
  return t
}
function trammaFaccia (chiave, chiusi) {
  const k = chiave + (chiusi ? ':c' : '')
  if (!trame.has(k)) trame.set(k, disegnaFaccia(STILI[chiave], chiusi))
  return trame.get(k)
}

// ══════════ lo scheletro comune ══════════
/** Gambe, busto, testa con la faccia, bracci col pugno a y = -0.29, e i due perni fittizi `falce` e `ascia`. */
function scheletro (chiave, o) {
  const g = new THREE.Group()
  const { legH, legX, legR, torso: [tw, th, td], armX, R, pelle, calzoni, stivale, maniche, guanti, manicaR = 0.058, bot = [0.15, 0.13, 0.22], orecchie = true } = o
  const gambe = [-1, 1].map(s => {
    const p = perno(g, s * legX, legH, 0), lung = legH - bot[1] + 0.04
    cil(p, legR, legR * 0.92, lung, calzoni, 0, -lung / 2, 0, 8)
    scatola(p, bot[0], bot[1], bot[2], stivale, 0, -legH + bot[1] / 2, 0.03)
    return p
  })
  const busto = perno(g, 0, legH, 0)
  scatola(busto, tw, th, td, o.corpo, 0, th / 2, 0)
  const testa = perno(busto, 0, th - 0.03, 0), cy = 0.93 * R, sx = 1.05, sy = 0.95
  const pelleM = M(pelle)
  sfera(testa, R, pelleM, 0, cy, 0, sx, sy, 1, 14)
  const faccia = new THREE.Mesh(G('faccia', () => new THREE.SphereGeometry(1, 16, 10, Math.PI / 2 - 0.95, 1.9, 1.0, 1.3)), new THREE.MeshStandardMaterial({ map: trammaFaccia(chiave, false), roughness: 0.9 }))
  faccia.position.set(0, cy, 0); faccia.scale.set(R * 1.01 * sx, R * 1.01 * sy, R * 1.01); testa.add(faccia)
  if (orecchie) for (const s of [-1, 1]) sfera(testa, R * 0.19, pelleM, s * R * 1.03 * sx, cy - 0.01, 0, 1, 1.2, 0.8)
  const bracci = [-1, 1].map(s => {
    const p = perno(busto, s * armX, th - 0.04, 0)
    cil(p, manicaR, manicaR * 0.9, 0.24, maniche, 0, -0.12, 0, 8)
    sfera(p, 0.058, guanti, 0, -0.28, 0)
    return p
  })
  const falce = perno(bracci[1], 0, -0.29, 0); falce.visible = false          // segnaposto: l'equipaggiamento li spegne
  const ascia = perno(bracci[1], 0, -0.29, 0); ascia.visible = false
  g.userData = { chiave, gambe, busto, testa, bracci, falce, ascia, cy, R, faccia, sway: [], altezzaBusto: legH, th }
  return g
}

// ── l'idle di battaglia ──
// Tutto è funzione di `t` (+ `userData.fase`, diversa per eroe): niente stato. `posaGuardia` muove le ossa (ginocchia, peso,
// braccia, testa, il gesto speciale); `anima` fa il resto (respiro, ritardo dei capelli, occhi, bagliore, barba).
const FASI = { cavaliere: 0, elfa: 1.9, mago: 3.6, nano: 5.3 }
const FBALZO = { cavaliere: 1.3, elfa: 1.55, mago: 1.2, nano: 1.45 }                      // Hz: il rimbalzo sulle ginocchia
const GESTI = { cavaliere: { P: 6.4, D: 1.7, off: 2.2 }, elfa: { P: 7.1, D: 1.8, off: 3.5 }, mago: { P: 5.6, D: 1.8, off: 1.0 }, nano: { P: 7.8, D: 2.6, off: 4.0 } }
/** Il gesto speciale: `k` da 0 a 1 mentre dura (-1 fuori), `n` il numero del ciclo. `t` è il tempo senza la fase. */
export function gesto (u, t) {
  const g = GESTI[u.chiave], x = t + u.fase + g.off, n = Math.floor(x / g.P), k = (x - n * g.P) / g.D
  return k < 1 ? { k, n } : { k: -1, n }
}
/** L'istante `t` (senza fase) in cui il gesto numero `n` è a `k` (per le strisce). */
export function istanteGesto (chiave, n, k) { const g = GESTI[chiave]; return n * g.P - g.off - FASI[chiave] + k * g.D }
const mescola = (a, b, k) => a + (b - a) * k
/** L'idle: respiro più marcato, rimbalzo, occhi che ammiccano e capelli/barba che seguono con ritardo. */
function finisci (g) {
  const u = g.userData, testaY = u.testa.position.y
  u.fase = FASI[u.chiave]
  u.anima = t => {
    const tt = t + u.fase, wb = Math.PI * 2 * FBALZO[u.chiave]
    const r = Math.sin(tt * 2.1), sy = 1 + 0.032 * r, sx = 1 + 0.024 * r                     // il petto sale e si allarga
    u.busto.scale.set(sx, sy, sx)
    u.testa.scale.set(1 / sx, 1 / sy, 1 / sx); for (const b of u.bracci) b.scale.set(1 / sx, 1 / sy, 1 / sx)   // la testa e le braccia (e l'arma) non si deformano
    u.testa.position.y = testaY
    for (const s of u.sway) {
      const lag = Math.sin(wb * tt - 1.5), lag2 = Math.sin(wb * tt * 0.5 - 0.8)             // seguono il rimbalzo con ritardo
      s.o.rotation.x = (s.bx || 0) + s.ax * (1.2 * Math.sin(tt * s.f + s.p) + 0.7 * lag)
      s.o.rotation.z = (s.bz || 0) + s.az * (1.2 * Math.sin(tt * s.f * 0.8 + s.p + 1) + 0.7 * lag2)
    }
    const ciclo = (tt * 0.9 + 1.3) % 4.6, chiuso = ciclo > 4.44 || (ciclo > 2.3 && ciclo < 2.42)
    const m = trammaFaccia(u.chiave, chiuso); if (u.faccia.material.map !== m) u.faccia.material.map = m
    const ge = gesto(u, t), pa = u.perniArmi
    if (u.chiave === 'mago') {                                                              // il bagliore sulla gemma dopo il colpo della staffa
      const arma = pa && pa.destra && pa.destra.children[0]
      if (arma && arma.userData.liberi) {
        if (!arma.userData.bagliore) { const l = new THREE.PointLight(0xc59bff, 0, 1.6, 1.5); l.position.set(0, 1.2, 0.1); arma.add(l); arma.userData.bagliore = l }
        arma.userData.bagliore.intensity = ge.k > 0.5 ? 3.2 * Math.sin(Math.PI * (ge.k - 0.5) * 2) ** 2 : 0
      }
    }
    if (u.chiave === 'nano' && u.barba) {                                                   // la barba si sistema: uno scuotimento mentre la mano passa
      const q = ge.k > 0.45 ? Math.sin(Math.PI * (ge.k - 0.45) / 0.55) : 0
      u.barba.rotation.x += 0.12 * q * Math.sin(ge.k * 40); u.barba.rotation.z += 0.06 * q * Math.sin(ge.k * 31)
    }
  }
  let tri = 0
  g.traverse(o => { if (o.isMesh) tri += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3 })
  u.triangoli = Math.round(tri)
  return g
}
const sway = (u, o, ax, az, f, p = 0) => { u.sway.push({ o, ax, az, f, p, bx: o.rotation.x, bz: o.rotation.z }); return o }

// ══════════ IL CAVALIERE ══════════
// Tosto e quadrato: piastre azzurro-ferro, tabarro rosso con una croce d'oro, spalline enormi, elmo aperto con il cimiero rosso.
function cavaliere () {
  const FERRO = 0x8ea6c0, FERRO_S = 0x5d7391, FERRO_L = 0xc9d8e8, SCURO = 0x3e4a5e, ROSSO = 0xc4382f, ROSSO_S = 0x8e2420, ORO = 0xe3b34a, CUOIO = 0x6a4426
  const fe = metallo(FERRO), fes = metallo(FERRO_S), fel = metallo(FERRO_L), ro = M(ROSSO), oro = metallo(ORO, { metalness: 0.55, roughness: 0.3 })
  const g = scheletro('cavaliere', { legH: 0.34, legX: 0.115, legR: 0.085, torso: [0.42, 0.3, 0.27], armX: 0.265, R: 0.275, pelle: 0xe8b48c, calzoni: fes, corpo: fe, stivale: M(SCURO, { metalness: 0.3 }), maniche: fes, guanti: fel, manicaR: 0.065, bot: [0.17, 0.13, 0.24] })
  const u = g.userData, { busto, testa, gambe, bracci, cy, R } = u
  for (const p of gambe) { sfera(p, 0.062, fel, 0, -0.1, 0.05, 1, 1, 0.8); scatola(p, 0.14, 0.03, 0.15, oro, 0, -0.205, 0.03) }             // ginocchiera, bordo dello stivale
  // corazza: pettorale bombato, tabarro rosso con la croce, cintura, falde
  sfera(busto, 0.2, fel, 0, 0.18, 0.06, 1.05, 0.75, 0.62)
  scatola(busto, 0.17, 0.27, 0.014, ro, 0, 0.13, 0.142); scatola(busto, 0.05, 0.22, 0.02, oro, 0, 0.145, 0.15); scatola(busto, 0.15, 0.045, 0.02, oro, 0, 0.19, 0.15)
  scatola(busto, 0.46, 0.055, 0.3, M(CUOIO), 0, 0.03, 0); scatola(busto, 0.07, 0.07, 0.03, oro, 0, 0.03, 0.155)
  scatola(busto, 0.14, 0.1, 0.014, ro, 0, -0.04, 0.142)
  for (const s of [-1, 1]) scatola(busto, 0.13, 0.1, 0.02, fes, s * 0.15, -0.03, 0.12).rotation.y = s * 0.3
  cil(busto, 0.13, 0.15, 0.07, fel, 0, 0.31, 0, 10)                                                                                          // il goletto
  // spalline: calotta d'acciaio con un bordo d'oro e un rilievo
  for (const s of [-1, 1]) {
    const sp = perno(bracci[s < 0 ? 0 : 1], 0, 0.03, 0)
    sfera(sp, 0.115, fel, s * 0.01, 0.0, 0, 1.12, 0.78, 1.08, 10); cil(sp, 0.1, 0.11, 0.025, oro, s * 0.01, -0.07, 0, 10)
    scatola(sp, 0.04, 0.05, 0.16, fes, s * 0.015, 0.075, 0)
  }
  for (const b of bracci) cil(b, 0.075, 0.07, 0.07, oro, 0, -0.2, 0, 8)                                                                       // i bracciali
  // mantello corto
  const manto = sway(u, perno(busto, 0, 0.32, -0.14), 0.05, 0.03, 1.4)
  const mant = scatola(manto, 0.4, 0.4, 0.035, M(0xa42e2a), 0, -0.2, -0.02); mant.rotation.x = 0.12
  scatola(manto, 0.42, 0.04, 0.05, oro, 0, -0.01, 0.0)
  // la testa
  const pelleM = M(0xe8b48c)
  const cop = new THREE.Group(); testa.add(cop); u.copricapo = cop          // il copricapo di serie: si nasconde con visible = false
  const elmo = new THREE.Mesh(G('elmo', () => new THREE.SphereGeometry(1, 16, 10, 0, Math.PI * 2, 0, 1.22)), fe)
  elmo.position.set(0, cy + 0.01, -0.005); elmo.scale.set(R * 1.12, R * 1.06, R * 1.1); elmo.castShadow = true; cop.add(elmo)
  cil(cop, R * 1.14, R * 1.1, 0.04, oro, 0, cy + R * 0.38, 0, 16)                                                                           // il cerchio d'oro dell'elmo
  cil(cop, R * 1.06, R * 1.0, 0.18, fes, 0, cy + R * 0.3, -R * 0.12, 14)                                                                    // la nuca
  for (const s of [-1, 1]) { scatola(cop, 0.05, 0.2, 0.2, fe, s * R * 1.1, cy - 0.04, 0.0); scatola(cop, 0.055, 0.04, 0.2, oro, s * R * 1.1, cy + 0.07, 0.0) }   // le guanciere
  scatola(cop, 0.034, 0.17, 0.03, fel, 0, cy + R * 0.18, R * 0.99)                                                                           // il nasale
  scatola(cop, 0.05, 0.04, 0.04, fe, 0, cy + R * 0.42, R * 1.04)
  // cimiero: una pinna rossa su un fusto d'oro, dalla fronte alla nuca
  const cim = sway(u, perno(cop, 0, cy + R * 1.0, 0), 0.07, 0.0, 2.1)
  scatola(cim, 0.045, 0.045, 0.34, oro, 0, 0.0, -0.02)
  const pinna = pezzo(cim, G('pinna', () => sagomaLaterale([[0.15, 0.03], [0.1, 0.13], [0.0, 0.2], [-0.12, 0.23], [-0.25, 0.17], [-0.34, 0.03], [-0.42, -0.14], [-0.33, -0.14], [-0.24, -0.06], [-0.1, 0.0]], 0.07)), ro, 0, 0, 0)
  const pinna2 = pezzo(cim, G('pinna2', () => sagomaLaterale([[0.08, 0.04], [0.0, 0.14], [-0.14, 0.17], [-0.26, 0.1], [-0.12, 0.0]], 0.075)), M(ROSSO_S), 0, 0.005, 0)
  return finisci(g)
}

// ══════════ L'ELFA ══════════
// Svelta: tunica verde e corsetto di cuoio, mantellina col cappuccio abbassato, orecchie lunghissime, chioma chiara, cerchietto con gemma.
function elfa () {
  const VERDE = 0x3f9150, VERDE_S = 0x2a6a3c, VERDE_L = 0x86c767, CUOIO = 0x8a5a30, CUOIO_S = 0x573619, ORO = 0xe6bb55, BIONDO = 0xf2df9a, BIONDO_S = 0xd6bd6a, MANT = 0x2e6e58
  const ve = M(VERDE), ves = M(VERDE_S), cu = M(CUOIO), cus = M(CUOIO_S), oro = metallo(ORO, { metalness: 0.5, roughness: 0.3 }), cap = M(BIONDO), caps = M(BIONDO_S)
  const g = scheletro('elfa', { legH: 0.36, legX: 0.085, legR: 0.052, torso: [0.3, 0.28, 0.2], armX: 0.2, R: 0.27, pelle: 0xf7d9c0, calzoni: M(0x6b4a2c), corpo: ve, stivale: cus, maniche: ve, guanti: M(0xf7d9c0), manicaR: 0.05, bot: [0.11, 0.2, 0.17], orecchie: false })
  const u = g.userData, { busto, testa, gambe, bracci, cy, R } = u
  for (const p of gambe) { cil(p, 0.07, 0.06, 0.05, M(0xd2a566), 0, -0.2, 0.0, 8); punta(p, [0, -0.33, 0.07], [0, -0.35, 0.2], 0.05, cus, 5) }   // risvolto e punta all'insù
  // corsetto, lacci, cintura e borsello, gonnellino a lembi
  scatola(busto, 0.31, 0.16, 0.215, cu, 0, 0.1, 0); scatola(busto, 0.05, 0.14, 0.02, M(0xe9d3a0), 0, 0.12, 0.112)
  for (const y of [0.07, 0.12, 0.17]) scatola(busto, 0.09, 0.012, 0.02, cus, 0, y, 0.114)
  scatola(busto, 0.33, 0.045, 0.23, cus, 0, 0.02, 0); scatola(busto, 0.05, 0.05, 0.02, oro, 0, 0.02, 0.12)
  scatola(busto, 0.08, 0.09, 0.05, cu, 0.15, -0.02, 0.1)
  const gonna = perno(busto, 0, 0.0, 0)
  cil(gonna, 0.17, 0.235, 0.14, ve, 0, -0.06, 0, 9)
  for (let i = 0; i < 7; i++) { const a = i * Math.PI * 2 / 7 + 0.3; const l = cono(gonna, 0.045, 0.1, ves, Math.sin(a) * 0.235, -0.15, Math.cos(a) * 0.235, 4); l.rotation.x = Math.PI; l.rotation.y = a }
  // mantellina e cappuccio
  const mant = perno(busto, 0, 0.27, 0)
  cil(mant, 0.19, 0.27, 0.14, M(MANT), 0, -0.04, -0.01, 10)
  cil(mant, 0.275, 0.272, 0.025, oro, 0, -0.11, -0.01, 10)
  const cappuccio = sway(u, perno(busto, 0, 0.3, -0.13), 0.04, 0.02, 1.3)
  sfera(cappuccio, 0.15, M(MANT), 0, 0.0, 0, 1.05, 0.75, 0.9); cono(cappuccio, 0.08, 0.22, M(MANT), 0, -0.14, -0.04, 5).rotation.x = Math.PI
  for (const b of bracci) { cil(b, 0.056, 0.052, 0.1, cus, 0, -0.18, 0, 8); cil(b, 0.06, 0.06, 0.02, oro, 0, -0.13, 0, 8) }                   // i bracciali
  // testa: orecchie lunghe e appuntite, chioma
  const pelleM = M(0xf7d9c0), rosa = M(0xf0a8a0)
  for (const s of [-1, 1]) {
    const o = punta(testa, [s * R * 0.96, cy - 0.02, -0.02], [s * (R + 0.26), cy + 0.19, -0.1], 0.052, pelleM, 4); o.scale.z = 0.5
    const i = punta(testa, [s * R * 1.0, cy - 0.015, 0.0], [s * (R + 0.2), cy + 0.16, -0.075], 0.026, rosa, 4); i.scale.z = 0.4; i.position.z += 0.012
  }
  const cop = new THREE.Group(); testa.add(cop); u.copricapo = cop          // il copricapo di serie: si nasconde con visible = false
  const capAlto = new THREE.Group(); testa.add(capAlto); u.capelli = capAlto          // chioma sopra la testa: si nasconde sotto un elmo
  const cima = sfera(capAlto, R * 1.06, caps, 0, cy + R * 0.1, -R * 0.14, 1.06, 1.0, 1.0, 12)
    for (const s of [-1, 1]) {                                                                                                                  // frangia: due ciuffi di lato, mai sugli occhi
    punta(capAlto, [s * R * 0.05, cy + R * 0.95, R * 0.45], [s * R * 0.85, cy + R * 0.42, R * 0.62], 0.075, cap, 5).scale.z = 0.7
    punta(capAlto, [s * R * 0.9, cy + R * 0.18, R * 0.4], [s * R * 1.0, cy - R * 0.55, R * 0.42], 0.07, cap, 5)                                 // ciocche ai lati del viso
  }
  const coda = sway(u, perno(testa, 0, cy + R * 0.1, -R * 0.78), 0.12, 0.05, 1.6)                                                            // la chioma lunga dietro
  cil(coda, R * 0.7, R * 0.5, 0.22, cap, 0, -0.1, -0.03, 9); cil(coda, R * 0.5, R * 0.3, 0.26, caps, 0, -0.3, -0.04, 8)
  cono(coda, R * 0.3, 0.2, cap, 0, -0.52, -0.04, 7).rotation.x = Math.PI
  const treccia = sway(u, perno(testa, R * 0.78, cy - R * 0.2, -R * 0.35), 0.1, 0.1, 1.9, 1)                                                  // una treccina con un fiocco
  tubo(treccia, [0, 0, 0], [0.01, -0.16, -0.01], 0.032, 0.03, cap, 6); tubo(treccia, [0.01, -0.16, -0.01], [0, -0.3, 0.0], 0.03, 0.022, caps, 6); sfera(treccia, 0.032, luce(0x3bd186, 0.6), 0, -0.2, 0.0)
  const cerchietto = new THREE.Mesh(G('cerchietto', () => new THREE.TorusGeometry(1, 0.014, 5, 20)), oro)
  cerchietto.position.set(0, cy + R * 0.5, R * 0.03); cerchietto.rotation.x = Math.PI / 2 - 0.15; cerchietto.scale.set(R * 0.98, R * 0.98, R * 0.98); cop.add(cerchietto)
  pezzo(cop, G('gemma', () => new THREE.OctahedronGeometry(0.036)), luce(0x3bd186, 0.9), 0, cy + R * 0.5 + 0.0, R * 0.99, 0.9, 1.5, 0.7)
  return finisci(g)
}

// ══════════ IL MAGO ══════════
// Una campana viola-blu che arriva a terra, cappello a punta con la falda larga e la punta piegata, barba bianca fino alla cintura, ampolle.
function mago () {
  const VIOLA = 0x5a43b2, VIOLA_S = 0x3e2f8a, BLU = 0x3a6fd0, ORO = 0xf0c24a, BIANCO = 0xeeeaf2, BIANCO_S = 0xc9c5d6, CUOIO = 0x6a4426
  const vi = M(VIOLA), vis = M(VIOLA_S), bl = M(BLU), oro = metallo(ORO, { metalness: 0.5, roughness: 0.3 }), bi = M(BIANCO), bis = M(BIANCO_S)
  const g = scheletro('mago', { legH: 0.3, legX: 0.09, legR: 0.055, torso: [0.32, 0.3, 0.22], armX: 0.22, R: 0.26, pelle: 0xf2cfae, calzoni: vis, corpo: vi, stivale: M(0x45301c), maniche: vi, guanti: M(0xf2cfae), manicaR: 0.055, bot: [0.12, 0.1, 0.2] })
  const u = g.userData, { busto, testa, gambe, bracci, cy, R } = u
  // veste: busto + campana fino a terra (le scarpe sporgono appena)
  cil(busto, 0.19, 0.235, 0.32, vi, 0, 0.14, 0, 12)
  const gonna = sway(u, perno(g, 0, 0.38, 0), 0.02, 0.025, 1.3)
  cil(gonna, 0.235, 0.37, 0.36, vi, 0, -0.18, 0, 14)
  cil(gonna, 0.372, 0.378, 0.045, oro, 0, -0.355, 0, 14)
  cil(gonna, 0.375, 0.37, 0.04, bl, 0, -0.32, 0, 14)
  scatola(gonna, 0.07, 0.34, 0.012, bl, 0, -0.19, 0.3).rotation.x = -0.2                                                                       // lembo azzurro davanti
  const stelle = G('stella', () => stella(0.045, 0.012)), stM = luce(0xffd54a, 0.5)
  for (const [a, y, k] of [[0.55, 0.06, 1], [-0.5, 0.1, 1.1], [1.25, 0.2, 0.9], [-1.3, 0.22, 1], [0.0, 0.3, 0.8], [2.1, 0.12, 0.9], [-2.1, 0.16, 0.9], [0.75, 0.32, 0.8], [-0.8, 0.34, 0.8]]) {
    const r = 0.235 + (0.37 - 0.235) * (0.36 - y) / 0.36 + 0.004, st = pezzo(gonna, stelle, stM, Math.sin(a) * r, -0.36 + y + 0.04, Math.cos(a) * r, k, k, 1); st.rotation.y = a
  }
  // cintura con le ampolle
  const cinta = new THREE.Group(); busto.add(cinta)
  cil(cinta, 0.205, 0.215, 0.05, bl, 0, 0.04, 0, 12); scatola(cinta, 0.07, 0.065, 0.03, oro, 0, 0.04, 0.2)
  const colori = [0xff5a7a, 0x4fe0ff, 0xa0ff6a, 0xffc34a]
  colori.forEach((c, i) => {
    const a = 0.45 + i * 0.32, x = Math.sin(a) * 0.215, z = Math.cos(a) * 0.215, fl = perno(cinta, x, 0.03, z)
    fl.rotation.set(0, a, -0.0); fl.rotation.z = -0.25
    cil(fl, 0.01, 0.01, 0.07, M(0xcfe8f0, { transparent: true, opacity: 0.55 }), 0, -0.09, 0, 6)
    sfera(fl, 0.036, luce(c, 0.55), 0, -0.14, 0, 1, 1, 1, 7)
    cil(fl, 0.014, 0.014, 0.025, M(0x8a5a30), 0, -0.04, 0, 5)
  })
  // maniche a campana con i polsini
  for (const b of bracci) { cil(b, 0.06, 0.115, 0.22, vi, 0, -0.11, 0, 9); cil(b, 0.118, 0.12, 0.03, oro, 0, -0.22, 0, 9); cil(b, 0.12, 0.12, 0.02, bl, 0, -0.19, 0, 9) }
  cil(busto, 0.17, 0.2, 0.06, bl, 0, 0.31, 0, 10)                                                                                           // il colletto
  // testa: capelli, barba, cappello
  const cop = new THREE.Group(); testa.add(cop); u.copricapo = cop          // il copricapo di serie: si nasconde con visible = false
  const capAlto = new THREE.Group(); testa.add(capAlto); u.capelli = capAlto          // i capelli sotto il cappello: si nascondono sotto un elmo
  const capelli = sway(u, perno(testa, 0, cy + R * 0.15, -R * 0.7), 0.1, 0.05, 1.4, 2)
  cil(capelli, R * 0.8, R * 0.6, 0.2, bi, 0, -0.08, -0.04, 10); cil(capelli, R * 0.6, R * 0.35, 0.22, bis, 0, -0.26, -0.05, 9)
  sfera(capAlto, R * 1.02, bis, 0, cy + R * 0.1, -R * 0.2, 1.05, 0.95, 0.95, 12)
  for (const s of [-1, 1]) { sfera(testa, R * 0.2, bis, s * R * 1.0, cy - R * 0.1, R * 0.15, 0.8, 2.0, 1.0) }                                // basette
  const barba = sway(u, perno(testa, 0, cy - R * 0.5, R * 0.62), 0.05, 0.03, 1.2)
  sfera(barba, 0.17, bi, 0, -0.02, 0.01, 1.05, 0.9, 0.62, 10)
  sfera(barba, 0.13, bi, 0, -0.18, 0.045, 1.0, 1.4, 0.55)
  cono(barba, 0.13, 0.42, bi, 0, -0.34, 0.05, 6).rotation.x = Math.PI
  for (const s of [-1, 1]) {
    sfera(barba, 0.1, bis, s * 0.11, -0.14, 0.04, 0.8, 1.6, 0.6)
    const ba = punta(barba, [s * 0.04, 0.08, 0.14], [s * 0.2, 0.05, 0.13], 0.05, bi, 6)                                                       // i baffi che scendono e si arricciano
    sfera(barba, 0.045, bi, s * 0.2, 0.065, 0.13)
  }
  sfera(testa, 0.045, M(0xe8b898), 0, cy - R * 0.14, R * 1.0, 1.2, 0.9, 1)                                                                     // il naso
  // il cappello: falda larga, cono con una piega e la punta che ricade
  const cappello = perno(cop, 0, cy + R * 0.52, 0), vcp = M(0x40318e)
  cappello.rotation.z = 0.05
  cil(cappello, 0.44, 0.45, 0.03, vcp, 0, 0, 0, 18).scale.z = 1.02
  cil(cappello, 0.265, 0.3, 0.035, oro, 0, 0.03, 0, 14)
  cil(cappello, 0.24, 0.27, 0.14, vcp, 0, 0.08, 0, 14)
  cil(cappello, 0.15, 0.24, 0.24, vcp, 0, 0.22, 0, 12)
  const piega = perno(cappello, 0, 0.3, 0); piega.rotation.x = -0.22
  cil(piega, 0.07, 0.15, 0.24, vcp, 0, 0.1, 0, 10)
  const punta1 = sway(u, perno(piega, 0, 0.2, 0), 0.08, 0.04, 1.8)
  punta1.rotation.x = -0.5; cil(punta1, 0.015, 0.07, 0.16, vcp, 0, 0.08, 0, 8); const pp = perno(punta1, 0, 0.16, 0); pp.rotation.x = -0.6; cono(pp, 0.016, 0.1, vcp, 0, 0.04, 0, 6)
  scatola(cappello, 0.07, 0.06, 0.03, oro, 0, 0.07, 0.275)
  pezzo(cappello, G('stellaCapp', () => stella(0.07, 0.012)), luce(0xffd54a, 0.5), 0, 0.25, 0.185, 1, 1, 1).rotation.x = -0.35
  return finisci(g)
}

// ══════════ IL NANO ══════════
// Basso e larghissimo: elmo con le corna, naso grosso, barba rossa enorme con due trecce con gli anelli, armatura di rame e cuoio.
function nano () {
  const BRONZO = 0xb87439, RAME = 0xd68a48, MARR = 0x74492a, MARR_S = 0x45291a, AVORIO = 0xf0e6c6, BARBA = 0xcc541f, BARBA_L = 0xe5792e, FERRO = 0x6f6c6a
  const br = metallo(BRONZO, { roughness: 0.38 }), ra = metallo(RAME, { roughness: 0.35 }), ma = M(MARR), mas = M(MARR_S), fe = metallo(FERRO), av = M(AVORIO), ba = M(BARBA), bal = M(BARBA_L)
  const g = scheletro('nano', { legH: 0.2, legX: 0.135, legR: 0.09, torso: [0.5, 0.3, 0.34], armX: 0.315, R: 0.295, pelle: 0xe39a74, calzoni: mas, corpo: ma, stivale: mas, maniche: ma, guanti: M(0xe39a74), manicaR: 0.082, bot: [0.2, 0.13, 0.29], orecchie: true })
  const u = g.userData, { busto, testa, gambe, bracci, cy, R } = u
  for (const p of gambe) { scatola(p, 0.205, 0.045, 0.28, ra, 0, -0.178, 0.03); sfera(p, 0.065, br, 0, -0.07, 0.07, 1, 1, 0.75) }          // fascia e ginocchiera
  // armatura: pettorale di bronzo con le borchie, cintura larga con la fibbia
  scatola(busto, 0.4, 0.2, 0.05, br, 0, 0.17, 0.17); for (const s of [-1, 1]) for (const y of [0.12, 0.22]) sfera(busto, 0.016, ra, s * 0.17, y, 0.2, 1, 1, 0.6, 5)
  scatola(busto, 0.52, 0.08, 0.36, mas, 0, 0.03, 0); scatola(busto, 0.13, 0.1, 0.03, ra, 0, 0.03, 0.185); scatola(busto, 0.06, 0.05, 0.035, mas, 0, 0.03, 0.19)
  for (const s of [-1, 1]) scatola(busto, 0.14, 0.08, 0.03, br, s * 0.18, -0.03, 0.17)
  // spalline massicce con le punte
  for (const s of [-1, 1]) {
    const sp = perno(bracci[s < 0 ? 0 : 1], 0, 0.03, 0)
    sfera(sp, 0.13, br, s * 0.015, 0.0, 0, 1.1, 0.78, 1.1, 10); cil(sp, 0.11, 0.13, 0.03, ra, s * 0.015, -0.08, 0, 10)
    for (const [dx, dz] of [[0, 0], [-0.07, 0.03], [0.07, 0.03]]) { const c = cono(sp, 0.03, 0.09, ra, s * 0.015 + dx * 0.8, 0.1, dz, 5); c.rotation.z = -dx * 4; c.rotation.x = dz * 4 }
  }
  for (const b of bracci) { cil(b, 0.09, 0.09, 0.1, ra, 0, -0.2, 0, 8); cil(b, 0.095, 0.095, 0.02, mas, 0, -0.15, 0, 8) }                   // bracciali di rame
  // la testa: naso, sopracciglia, l'elmo con le corna
  sfera(testa, 0.075, M(0xe48a68), 0, cy - R * 0.1, R * 1.0, 1.1, 0.95, 1.1)
  const cop = new THREE.Group(); testa.add(cop); u.copricapo = cop          // il copricapo di serie: si nasconde con visible = false
  const elmo = new THREE.Mesh(G('elmoNano', () => new THREE.SphereGeometry(1, 14, 10, 0, Math.PI * 2, 0, 1.2)), fe)
  elmo.position.set(0, cy + 0.015, -0.01); elmo.scale.set(R * 1.12, R * 1.08, R * 1.1); elmo.castShadow = true; cop.add(elmo)
  cil(cop, R * 1.14, R * 1.1, 0.065, ra, 0, cy + R * 0.38, 0, 16)
  for (const a of [-2, -1, 0, 1, 2]) { const an = a * 0.5; sfera(cop, 0.018, br, Math.sin(an) * R * 1.14, cy + R * 0.38, Math.cos(an) * R * 1.14, 1, 1, 1, 5) }   // i chiodi
  const cresta = scatola(cop, 0.04, 0.09, 0.36, ra, 0, cy + R * 1.04, -0.02)
  const cornaS = []
  for (const s of [-1, 1]) {
    const c = perno(cop, s * R * 1.0, cy + R * 0.5, 0)
    const pts = [[0, 0, 0], [s * 0.13, 0.04, 0.0], [s * 0.22, 0.17, 0.02], [s * 0.24, 0.31, 0.07]]
    for (let i = 0; i < 3; i++) tubo(c, pts[i], pts[i + 1], 0.06 - i * 0.012, 0.05 - i * 0.014, av, 7)
    punta(c, pts[3], [s * 0.235, 0.44, 0.12], 0.034, av, 6)
    sfera(c, 0.065, ra, 0, 0, 0, 1, 1, 1, 6)
  }
  // barba: un muro rosso fino alla cintura, i baffi che si arricciano, le trecce con gli anelli
  const barba = sway(u, perno(testa, 0, cy - R * 0.28, R * 0.55), 0.04, 0.025, 1.2)
  u.barba = barba
  sfera(barba, 0.255, ba, 0, -0.15, 0.1, 1.08, 0.6, 0.62, 8)
  sfera(barba, 0.235, bal, 0, -0.27, 0.13, 1.05, 0.85, 0.58, 8)
  cono(barba, 0.2, 0.2, ba, 0, -0.45, 0.13, 6).rotation.x = Math.PI
  for (const s of [-1, 1]) sfera(barba, 0.13, ba, s * 0.2, -0.14, 0.0, 0.9, 1.1, 0.8)                                                        // le basette che scendono dall'elmo
  for (const s of [-1, 1]) {
    tubo(barba, [s * 0.07, -0.02, 0.27], [s * 0.2, -0.05, 0.26], 0.06, 0.05, bal, 6)
    tubo(barba, [s * 0.2, -0.05, 0.26], [s * 0.27, 0.02, 0.25], 0.05, 0.035, bal, 6); sfera(barba, 0.03, bal, s * 0.28, 0.05, 0.25)     // baffi arricciati
  }
  const trecce = [-1, 1].map(s => {
    const t = sway(u, perno(barba, s * 0.17, -0.3, 0.2), 0.08, 0.08, 1.7, s)
    for (let i = 0; i < 3; i++) sfera(t, 0.062 - i * 0.008, i % 2 ? bal : ba, s * 0.004, -i * 0.085, 0.005 * i, 1, 1.1, 1, 7)
    const an = new THREE.Mesh(G('anello', () => new THREE.TorusGeometry(0.052, 0.014, 5, 10)), ra); an.position.set(0, -0.1, 0.0); an.rotation.x = Math.PI / 2; an.castShadow = true; t.add(an)
    const an2 = an.clone(); an2.position.y = -0.22; t.add(an2)
    return t
  })
  return finisci(g)
}

const COSTRUTTORI = { cavaliere, elfa, mago, nano }
export function creaEroe (chiave) {
  const c = COSTRUTTORI[chiave]
  if (!c) throw new Error(`eroe sconosciuto: ${chiave}`)
  return c()
}

// ══════════ le pose ══════════
const smussa = x => x * x * (3 - 2 * x)
/** Cosa tiene la mano (`destra`, `sinistra`): 'spada' (anche le asce), 'staffa', 'arco', 'balestra', 'scudo', o null. */
function inMano (u, lato) {
  const p = u.perniArmi && u.perniArmi[lato], a = p && p.children[0]
  return a ? (a.userData.tipo === 'balestra' ? 'balestra' : a.userData.famiglia || null) : null
}
/** Una fase di marcia (in radianti): gambe e braccia opposte, il busto che rimbalza. Non tocca le armi montate, tranne l'arco e la
    balestra (`tieni`). */
export function posaMarcia (e, fase) {
  const u = e.userData, s = Math.sin(fase), a = Math.abs(Math.cos(fase))
  u.gambe[0].rotation.x = s * 0.75; u.gambe[1].rotation.x = -s * 0.75
  u.bracci[0].rotation.set(-s * 0.55, 0, 0.06); u.bracci[1].rotation.set(s * 0.55, 0, -0.06)
  u.busto.position.y = u.altezzaBusto + a * 0.02; u.busto.rotation.y = s * 0.08
  u.busto.position.x = 0; u.busto.rotation.z = 0; for (const gm of u.gambe) gm.rotation.z = 0
  u.testa.rotation.y = -s * 0.05
  tieni(u, 0.05 * s)
}
/** Il colpo con il braccio destro, p da 0 (riposo) a 1 (a fondo); il busto si gira. */
export function posaColpo (e, p) {
  const u = e.userData, k = p < 0.5 ? smussa(p / 0.5) : 1 - smussa((p - 0.5) / 0.5) * 0.0
  u.bracci[1].rotation.set(-0.35 - 1.9 * smussa(Math.min(1, p)), 0, -0.1); u.busto.rotation.y = 0.15 - 0.45 * k
}
// l'arco e la balestra (docs/sotterraneo/roba-3d.md) non seguono il braccio: il perno ne annulla il giro, così l'arco resta ritto con
// la corda verso l'eroe e la balestra col fusto dove guarda, in guardia e in marcia. Il braccio li porge: l'arco teso davanti
// all'altezza della spalla (più basso l'arco lungo entrava nel pavimento), la balestra appena sotto, un poco in giù (pronta)
const PRONTA = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.22, 0, 0))
const _q = new THREE.Quaternion(), _e = new THREE.Euler()
// il braccio dell'arco punta avanti e un poco in fuori, e l'arco con lui: da davanti (il ritratto, la telecamera della scena) se ne vede
// la curva, mentre di taglio era un bastoncino
const ARCO_DI_TRAVERSO = 0.6
function tieni (u, dondolo = 0) {
  const bs = u.bracci[0], ps = u.perniArmi && u.perniArmi.sinistra
  const s = inMano(u, 'sinistra')
  if (s === 'balestra') {
    bs.rotation.set(-1.2 + dondolo, 0, 0.22)
    ps.quaternion.copy(bs.quaternion).invert().multiply(PRONTA)
  } else if (s === 'arco') {
    bs.quaternion.setFromEuler(_e.set(-1.6 + dondolo, -ARCO_DI_TRAVERSO, 0.06, 'YXZ'))
    ps.quaternion.copy(bs.quaternion).invert().multiply(_q.setFromEuler(_e.set(0.4 * dondolo, -ARCO_DI_TRAVERSO, 0.2 + 0.3 * dondolo, 'YXZ')))
    _e.order = 'XYZ'
  }
}
/** Un'arma in mano oscilla attorno alla sua posa base (memorizzata la prima volta): la punta si muove appena. */
function oscilla (p, dx, dy, dz) {
  if (!p) return
  const b = p.userData.base || (p.userData.base = { x: p.rotation.x, y: p.rotation.y, z: p.rotation.z })
  p.rotation.set(b.x + dx, b.y + dy, b.z + dz)
  return b
}
const lim = (x, a, b) => Math.max(a, Math.min(b, x))
/** La guardia di battaglia, per eroe, viva: ginocchia che rimbalzano (il busto scende di 0.015-0.035, i piedi restano a terra),
    il peso che passa da un piede all'altro ogni ~3,5 s, braccia e arma che dondolano, la testa che si guarda intorno,
    e ogni 5-8 s un gesto speciale. Funzione pura di `t` (e di `userData.fase`); `posaColpo` e `posaMarcia` si compongono sopra. */
export function posaGuardia (e, t = 0) {
  const u = e.userData, [bs, bd] = u.bracci, tt = t + (u.fase || 0), wb = Math.PI * 2 * FBALZO[u.chiave]
  const bz = Math.sin(wb * tt), bn = 0.5 + 0.5 * bz                                         // 0 su, 1 giù
  const peso = lim(2.2 * Math.sin(tt * 0.9), -1, 1)                                         // -1 sul sinistro, +1 sul destro
  const o1 = Math.sin(wb * tt + 0.7), o2 = Math.sin(wb * tt + 2.1), lenta = Math.sin(tt * 1.1)
  const ge = gesto(u, t), k = ge.k, pa = u.perniArmi || {}
  for (const b of [bs, bd]) b.rotation.set(0, 0, 0)
  u.busto.rotation.set(0, 0, 0); u.testa.rotation.set(0, 0, 0)
  let tuffo = 0, busY = 0                                                                   // `tuffo`: un'altra flessione dal gesto
  // le gambe: una piega appena in avanti, quella scarica più rilassata; i piedi si spostano di pochi mm
  u.gambe.forEach((gm, i) => {
    const s = i ? 1 : -1, scarica = 0.5 - 0.5 * s * peso
    gm.rotation.set(0.01 + 0.012 * bn + 0.012 * scarica, 0, s * (0.012 + 0.008 * bn) - peso * 0.006)
  })
  // la testa: ogni tanto si guarda intorno (con un respiro che la porta su e giù)
  const giro = Math.sin(tt * 1.15) * Math.max(0, Math.sin(tt * 0.43)) ** 2
  u.testa.rotation.set(0.035 * bz + 0.03 * Math.max(0, Math.sin(tt * 0.43 + 1)), 0.4 * giro, 0.03 * peso)
  switch (u.chiave) {
    case 'cavaliere': {
      bd.rotation.set(-0.55 + 0.05 * o1, 0, -0.12 + 0.03 * o2); bs.rotation.set(-0.75 + 0.04 * o2, 0, 0.18 + 0.03 * o1)
      u.busto.rotation.y = 0.12 + 0.04 * lenta
      const sp = oscilla(pa.destra, 0.06 * o2, 0, 0.05 * o1)                                // la punta della spada oscilla
      if (k >= 0) {                                                                         // rialza e riassesta la spada
        const su = k < 0.4 ? smussa(k / 0.4) : 1 - smussa((k - 0.4) / 0.6)
        const assesta = k > 0.55 ? Math.sin((k - 0.55) * 22) * (1 - k) * 0.5 : 0
        bd.rotation.x -= 0.7 * su; bd.rotation.z -= 0.12 * su; u.busto.rotation.y += 0.15 * su; u.testa.rotation.y -= 0.2 * su
        if (sp) pa.destra.rotation.x = sp.x - 0.55 * su + 0.08 * assesta
        tuffo = 0.01 * su
      }
      break
    }
    case 'elfa': {
      bs.rotation.set(-1.45 + 0.03 * o1, 0, 0.06); bd.rotation.set(-1.1 + 0.04 * o2, 0.45, -0.45 + 0.03 * o1)
      u.busto.rotation.y = -0.25 + 0.03 * lenta; u.testa.rotation.y += 0.15
      oscilla(pa.sinistra, 0.04 * o2, 0, 0.03 * o1)                                          // lo scudo ondeggia appena (l'arco lo tiene ritto tieni)
      if (k >= 0) {
        const su = k < 0.35 ? smussa(k / 0.35) : k < 0.7 ? 1 : 1 - smussa((k - 0.7) / 0.3)
        if (ge.n % 2 === 0) {                                                               // si ravvia l'orecchio (la mano sale al lato della testa)
          bd.rotation.set(mescola(-1.1, -2.85, su), mescola(0.45, 0, su), mescola(-0.45, 0.55, su) + 0.05 * Math.sin(k * 30) * su)
          u.testa.rotation.z -= 0.1 * su; u.testa.rotation.y -= 0.12 * su
        } else {                                                                            // controlla la corda: la tira un filo e la lascia
          const tira = Math.sin(Math.PI * k)
          bd.rotation.x -= 0.14 * tira; bd.rotation.y += 0.3 * tira; u.testa.rotation.y += 0.25 * tira - 0.15 * su; u.busto.rotation.y -= 0.1 * tira
        }
      }
      break
    }
    case 'mago': {
      bd.rotation.set(-0.4 + 0.05 * o1, 0, -0.1 + 0.02 * o2); bs.rotation.set(-0.85 + 0.08 * o2, 0, 0.5 + 0.04 * o1)
      u.busto.rotation.y = 0.1 + 0.03 * lenta
      oscilla(pa.destra, 0.04 * o2, 0, 0.05 * o1)                                           // la gemma della staffa ondeggia
      if (k >= 0) {                                                                         // alza la staffa e la batte a terra
        const su = k < 0.45 ? smussa(k / 0.45) : k < 0.58 ? 1 - smussa((k - 0.45) / 0.13) : 0
        const urto = k >= 0.58 ? Math.exp(-(k - 0.58) * 9) * Math.cos((k - 0.58) * 25) : 0
        bd.rotation.x -= 0.55 * su; bd.rotation.z -= 0.05 * su; bs.rotation.x -= 0.2 * su + 0.05 * urto
        u.testa.rotation.x -= 0.1 * su; tuffo = 0.025 * Math.max(0, urto) + 0.006 * su
      }
      break
    }
    case 'nano': {
      bd.rotation.set(-0.3 + 0.04 * o1, 0, 0.75 + 0.04 * o2); bs.rotation.set(-0.55 + 0.04 * o2, 0, -0.05 + 0.03 * o1)
      u.busto.rotation.y = 0.1 + 0.03 * lenta
      oscilla(pa.destra, 0.06 * o2, 0, 0.05 * o1)
      const arma = pa.destra && pa.destra.children[0]
      if (arma) arma.rotation.y = 0
      if (k >= 0) {                                                                         // l'ascia fa un quarto di giro, poi la mano passa sulla barba
        const giraA = smussa(Math.min(1, k / 0.3)) * (1 - smussa(lim((k - 0.62) / 0.3, 0, 1)))
        if (arma) arma.rotation.y = Math.PI / 2 * giraA
        const barba = k > 0.4 ? Math.sin(Math.PI * lim((k - 0.4) / 0.58, 0, 1)) ** 0.6 : 0
        bd.rotation.x = mescola(bd.rotation.x, -1.55, barba); bd.rotation.z = mescola(bd.rotation.z, -0.35, barba)
        u.testa.rotation.x += 0.1 * barba; tuffo = 0.01 * Math.sin(Math.PI * k)
      }
      break
    }
  }
  u.busto.position.y = u.altezzaBusto - (0.015 + 0.02 * bn) - tuffo + busY
  u.busto.position.x = 0.012 * peso; u.busto.rotation.z = -0.03 * peso
  tieni(u, 0.03 * o1)
}
