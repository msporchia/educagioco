// Generato da strumenti/promuovi-3d.mjs da poc/roba-3d/vesti.js: non si tocca a mano (si cambia il prototipo e si rilancia `npm run promuovi3d`).
// Le vesti del catalogo in 3D (le 39 figure `veste-*` di roba.json): un modello PER FIGURA, INDOSSATO da uno dei quattro eroi di poc/eroi-3d/eroi.js.
// Forma dalla descrizione (corazza a piastre, cotta di maglia, giubba di cuoio, veste lunga, mantello, tunica, ali…), colori dalla materia,
// motivi e luce dall'elemento, bordi/gemme/rune/bagliore dal pregio (1 comune … 4 leggendario). Funzione pura della figura (niente Math.random).
// Contratto: `vesti(eroe, figura)` → `togli()` (come `indossa` dei gioielli e `vesti` di poc/armature-3d/armature.js): i pezzi stanno sui perni
// dell'eroe (busto, bracci[i], gambe[i], testa) e ne seguono le pose; le sue vesti di serie si spengono (visible = false) e `togli()` le riaccende.
// Le misure (busto, bracci, gambe, testa) si leggono dall'eroe, così la stessa figura veste cavaliere, elfa, mago e nano.
// `eroe.userData.animaArmatura(t)` muove mantelli, orli e bagliori; `userData.triangoliArmatura` conta i triangoli. Autonomo: solo three.
import * as THREE from 'three'
import { MATERIE, ELEMENTI, PREGIO } from './palette.js'
import roba from './catalogo-roba.js'

export const ARCHETIPI = ['corazza a piastre', 'cotta di maglia', 'cotta di cuoio', 'giubba con tabarro', 'giubba con spalline e gonna', 'cotta con pelliccia', 'veste lunga',
  'veste con cintura', 'veste con ali', 'veste con grembiule', 'mantello con cappuccio', 'tunica', 'corazza con mantello']
export const FIGURE = roba.figure.filter(f => f.id.startsWith('veste-'))

const PI = Math.PI
const hash = i => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x) }
const seme = id => { let h = 7; for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) % 100003; return h }

// ══════════ mattoncini: materiali e geometrie in cache, geometrie unitarie scalate sulla mesh ══════════
const cacheMat = new Map()
function M (colore, o = {}) {
  const k = colore + JSON.stringify(o)
  if (!cacheMat.has(k)) cacheMat.set(k, new THREE.MeshStandardMaterial({ color: colore, roughness: 0.85, metalness: 0, flatShading: true, ...o }))
  return cacheMat.get(k)
}
const stoffa = (c, o = {}) => M(c, { roughness: 0.93, ...o })
const cuoio = (c, o = {}) => M(c, { roughness: 0.6, metalness: 0.04, ...o })
const metallo = (c, o = {}) => M(c, { metalness: 0.58, roughness: 0.3, ...o })
const ferro = (c, o = {}) => M(c, { metalness: 0.32, roughness: 0.68, ...o })
const oro = (c, o = {}) => M(c, { metalness: 0.72, roughness: 0.26, ...o })
const lucem = (c, f = 0.9, o = {}) => M(c, { emissive: c, emissiveIntensity: f, roughness: 0.4, ...o })
const doppia = { side: THREE.DoubleSide }
const geo = new Map()
const G = (k, f) => { if (!geo.has(k)) geo.set(k, f()); return geo.get(k) }
function pezzo (g, geometria, m, x, y, z, sx, sy, sz) {
  const o = new THREE.Mesh(geometria, m); o.position.set(x, y, z); o.scale.set(sx, sy, sz); o.castShadow = o.receiveShadow = true; g.add(o); return o
}
const sca = (g, w, h, d, m, x = 0, y = 0, z = 0) => pezzo(g, G('b', () => new THREE.BoxGeometry(1, 1, 1)), m, x, y, z, w, h, d)
const sfe = (g, rx, ry, rz, m, x = 0, y = 0, z = 0, seg = 8) => pezzo(g, G('s' + seg, () => new THREE.SphereGeometry(1, seg, Math.max(4, seg * 0.7 | 0))), m, x, y, z, rx, ry, rz)
const cupola = (g, rx, ry, rz, m, x = 0, y = 0, z = 0, seg = 9) => pezzo(g, G('d' + seg, () => new THREE.SphereGeometry(1, seg, 3, 0, PI * 2, 0, PI / 2)), m, x, y, z, rx, ry, rz)
// cilindro (o tronco di cono): raggio basso rb, alto rt, altezza h; kz allunga/accorcia la profondità (ellisse); `aperto` senza i coperchi
const cil = (g, rt, rb, h, m, x = 0, y = 0, z = 0, seg = 10, kz = 1, aperto = false) => {
  rb = Math.max(rb, 0.001)
  return pezzo(g, G(`c${(rt / rb).toFixed(4)},${seg},${aperto}`, () => new THREE.CylinderGeometry(rt / rb, 1, 1, seg, 1, aperto)), m, x, y, z, rb, h, rb * kz)
}
const ott = (g, r, m, x = 0, y = 0, z = 0, sx = 1, sy = 1.4, sz = 0.7) => pezzo(g, G('o', () => new THREE.OctahedronGeometry(1, 0)), m, x, y, z, r * sx, r * sy, r * sz)
const cono = (g, r, h, m, x = 0, y = 0, z = 0, seg = 4) => pezzo(g, G(`n${r},${h},${seg}`, () => new THREE.ConeGeometry(r, h, seg)), m, x, y, z, 1, 1, 1)
const tondo = (g, R, tubo, m, x, y, z, rx, rz, seg = 14) => {      // un anello orizzontale ellittico (cordone, bordo)
  const o = pezzo(g, G(`t${tubo},${seg}`, () => new THREE.TorusGeometry(1, tubo, 3, Math.min(seg, 12))), m, x, y, z, rx, rz, 1); o.rotation.x = PI / 2; return o
}
const SU = new THREE.Vector3(0, 1, 0)
/** Un cono dalla base `a` alla punta `b` (punte di spalla, corna, spine). */
function punta (g, a, b, r, m, seg = 4) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A)
  const o = cono(g, r, d.length(), m, 0, 0, 0, seg); o.position.copy(A).addScaledVector(d, 0.5); o.quaternion.setFromUnitVectors(SU, d.normalize()); return o
}
/** Un triangolo con la punta in giù (origine al centro del lato alto, y da 0 a -1) spesso 1 in z: lembi, punte e frange dell'orlo. */
const lembo = (g, w, h, sp, m, x, y, z) => pezzo(g, G('lembo', () => {
  const s = new THREE.Shape(); s.moveTo(-0.5, 0); s.lineTo(0.5, 0); s.lineTo(0, -1)
  const e = new THREE.ExtrudeGeometry(s, { depth: 1, bevelEnabled: false }); e.translate(0, 0, -0.5); return e
}), m, x, y, z, w, h, sp)
/** Una foglia a rombo con la punta in giù (origine in alto). */
const fogliaT = (g, w, h, sp, m, x, y, z) => pezzo(g, G('fogliaT', () => {
  const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(0.5, -0.35); s.lineTo(0, -1); s.lineTo(-0.5, -0.35)
  const e = new THREE.ExtrudeGeometry(s, { depth: 1, bevelEnabled: false }); e.translate(0, 0, -0.5); return e
}), m, x, y, z, w, h, sp)
/** Un trapezio (larghezza alta wa, bassa wb, altezza h, appeso al bordo alto: y da 0 a -h) esteso in z di `spess`. */
function trapezio (g, wa, wb, h, spess, m, x = 0, y = 0, z = 0) {
  const ge = G(`tz${wa.toFixed(3)},${wb.toFixed(3)},${h.toFixed(3)},${spess}`, () => {
    const s = new THREE.Shape(); s.moveTo(-wa / 2, 0); s.lineTo(wa / 2, 0); s.lineTo(wb / 2, -h); s.lineTo(-wb / 2, -h); s.lineTo(-wa / 2, 0)
    const e = new THREE.ExtrudeGeometry(s, { depth: spess, bevelEnabled: false }); e.translate(0, 0, -spess / 2); return e
  })
  return pezzo(g, ge, m, x, y, z, 1, 1, 1)
}
function stellaG (n = 5) {
  return G('stella' + n, () => {
    const s = new THREE.Shape()
    for (let i = 0; i < n * 2; i++) { const a = PI / 2 + i * PI / n, k = i % 2 ? 0.45 : 1; i ? s.lineTo(Math.cos(a) * k, Math.sin(a) * k) : s.moveTo(Math.cos(a) * k, Math.sin(a) * k) }
    const g = new THREE.ExtrudeGeometry(s, { depth: 1, bevelEnabled: false }); g.translate(0, 0, -0.5); return g
  })
}
const stella = (g, r, m, x, y, z, n = 5) => pezzo(g, stellaG(n), m, x, y, z, r, r, 0.006)
/** Un nastro (tubo sottile) lungo la curva per i punti `pts` [[x,y,z],…]: bordi del cappuccio, ricami. */
function nastro (g, pts, r, m, seg = 4, chiusa = false) {
  const curva = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p)), chiusa)
  const o = new THREE.Mesh(new THREE.TubeGeometry(curva, Math.max(2, (pts.length - 1) * 2), r, seg, chiusa), m); o.castShadow = o.receiveShadow = true; g.add(o); return o
}

// ══════════ le misure dell'eroe ══════════
function misure (eroe) {
  const u = eroe.userData, busto = u.busto
  const cassa = busto.children[0].geometry.parameters           // il busto è una scatola: width, height, depth
  const m = {
    W: cassa.width / 2, D: cassa.depth / 2, T: u.th,
    armX: Math.abs(u.bracci[0].position.x), mR: u.bracci[0].children[0].geometry.parameters.radiusTop,
    legX: Math.abs(u.gambe[0].position.x), legR: u.gambe[0].children[0].geometry.parameters.radiusTop, legH: u.altezzaBusto,
    Rt: u.R, cy: u.cy
  }
  m.vis = m.legH - u.gambe[0].children[1].geometry.parameters.height            // la gamba visibile sopra lo stivale
  return m
}
/** Spegne le vesti dell'eroe che questa sostituisce (busto, bracci, gambe, ed eventualmente il copricapo). */
function nascondi (eroe, copricapo) {
  const u = eroe.userData, lista = []
  const spegni = o => { if (o && o.visible) { o.visible = false; lista.push(o) } }
  u.busto.children.forEach((c, i) => { if (i === 0 || c === u.testa || u.bracci.includes(c)) return; spegni(c) })
  eroe.children.forEach(c => { if (c.isGroup && c !== u.busto && !u.gambe.includes(c)) spegni(c) })
  const armi = u.perniArmi ? Object.values(u.perniArmi) : []
  u.bracci.forEach(b => b.children.forEach((c, i) => { if (i < 2 || c === u.falce || c === u.ascia || armi.includes(c)) return; spegni(c) }))
  u.gambe.forEach(p => p.children.forEach((c, i) => { if (i >= 2) spegni(c) }))
  if (copricapo) { spegni(u.copricapo); spegni(u.capelli) }
  return lista
}

// ══════════ i pezzi comuni ══════════
/** La gonna: un tronco di cono ellittico dalla vita (y0) al fondo (yb); ritorna le misure per appoggiarci sopra. */
function gonna (c, o) {
  const { W, D, legX, legR, legH } = c, b = c.R.bu
  const y0 = o.y0 ?? 0.06, lung = o.lung ?? 1, hemH = o.hemH ?? 0
  const yb = -(legH - 0.075) * lung + hemH, Ls = y0 - yb
  const rtx = W + 0.036, rtz = D + 0.036, sv = o.svasa ?? 0.09
  const rbx = Math.max(rtx + sv, lung < 1 ? 0 : legX + legR + 0.045 + sv * 0.5), rbz = Math.max(rtz + sv * 0.6, D + 0.05 + sv * 0.5)
  const g = { y0, yb, Ls, rtx, rtz, rbx, rbz, b }
  g.rx = y => rtx + (rbx - rtx) * (y0 - y) / Ls
  g.rz = y => rtz + (rbz - rtz) * (y0 - y) / Ls
  g.ang = Math.atan((rbz - rtz) / Ls)
  g.pt = (a, y, off = 0) => [Math.sin(a) * (g.rx(y) + off), y, Math.cos(a) * (g.rz(y) + off)]
  cil(b, rtx, rbx, Ls, o.mat, 0, (y0 + yb) / 2, 0, o.seg ?? 16, rbz / rbx, true)
  return g
}
/** L'orlo: lembi, punte, foglie o frange appesi al fondo della gonna. */
function orlo (c, g, tipo, mat, h, mat2) {
  const b = g.b
  if (!tipo || tipo === 'liscio') { tondo(b, 1, 0.011, mat2 || mat, 0, g.yb + 0.01, 0, g.rx(g.yb) + 0.003, g.rz(g.yb) + 0.003, 16); return }
  const cfg = { punte: [14, 1, 'l'], lembi: [9, 1.15, 'l'], foglie: [11, 1.35, 'f'], scomposto: [12, 1.15, 'l'], sfrangiato: [18, 1, 'l'] }[tipo] || [12, 1, 'l']
  const n = cfg[0], per = PI * (g.rbx + g.rbz), w = per / n * cfg[1]
  for (let i = 0; i < n; i++) {
    const a = i * PI * 2 / n + 0.1, hh = tipo === 'scomposto' ? h * (0.6 + 0.8 * hash(i * 3 + c.s)) : tipo === 'sfrangiato' ? h * (0.7 + 0.5 * hash(i + c.s)) : h
    const p = g.pt(a, g.yb + 0.012, 0.004)
    const t = (cfg[2] === 'f' ? fogliaT : lembo)(b, w, hh + 0.012, 0.016, i % 2 && mat2 ? mat2 : mat, p[0], p[1], p[2])
    t.rotation.order = 'YXZ'; t.rotation.y = a; t.rotation.x = -g.ang; if (tipo === 'scomposto') t.rotation.z = (hash(i + 9 + c.s) - 0.5) * 0.3
  }
  tondo(b, 1, 0.01, mat2 || mat, 0, g.yb + 0.012, 0, g.rx(g.yb) + 0.004, g.rz(g.yb) + 0.004, 16)
}
/** Una striscia lungo il davanti della gonna e del torso, larga `w`, a `x` dal centro. */
function striscia (c, g, mat, w, x, sp = 0.008, yTop) {
  const { D, T } = c, b = g.b, y1 = yTop ?? T - 0.02
  sca(b, w, y1 - g.y0, sp, mat, x, (y1 + g.y0) / 2, D + 0.0185)
  const zc = (g.rz(g.y0) + g.rz(g.yb)) / 2 + 0.006 + Math.abs(x) * 0.02, f = 1 / Math.cos(g.ang)
  const sk = sca(b, w * (1 + (g.rbx / g.rtx - 1) * 0.5), g.Ls * f, sp, mat, x * (g.rbx / g.rtx * 0.5 + 0.5), (g.y0 + g.yb) / 2, zc)
  sk.rotation.x = -g.ang
}
/** Il busto: la scatola che avvolge il torso (+ il collo). */
function torso (c, mat, extra = 0) {
  const { W, D, T } = c
  sca(c.R.bu, 2 * W + 0.03 + extra, T - 0.045, 2 * D + 0.03 + extra, mat, 0, 0.03 + (T - 0.045) / 2, 0)
}
function cintura (c, g, mat, bordo, opz = {}) {
  const { W, D } = c, b = c.R.bu, y = opz.y ?? 0.05, h = opz.h ?? 0.05
  const rx = g ? g.rx(y) + 0.004 : W + 0.04, rz = g ? g.rz(y) + 0.004 : D + 0.04
  cil(b, rx, rx, h, mat, 0, y, 0, 14, rz / rx)
  if (opz.fibbia !== null) {
    const f = opz.fibbia ?? bordo, zf = rz + 0.006
    if (opz.forma === 'rombo') { ott(b, 0.034, f, 0, y, zf + 0.008, 1, 1.25, 0.35); ott(b, 0.014, opz.cuore || mat, 0, y, zf + 0.016, 1, 1.2, 0.4) }
    else if (opz.forma === 'tonda') { cil(b, 0.032, 0.032, 0.014, f, 0, y, zf + 0.008, 10).rotation.x = PI / 2; cil(b, 0.018, 0.018, 0.016, opz.cuore || mat, 0, y, zf + 0.012, 8).rotation.x = PI / 2 }
    else if (opz.forma === 'doppia') for (const s of [-1, 1]) { sca(b, 0.04, 0.046, 0.014, f, s * 0.07, y, zf + 0.006); sca(b, 0.02, 0.026, 0.016, opz.cuore || mat, s * 0.07, y, zf + 0.008) }
    else { sca(b, 0.05, 0.046, 0.014, f, 0, y, zf + 0.006); sca(b, 0.026, 0.024, 0.016, opz.cuore || mat, 0, y, zf + 0.008) }
  }
}
function collarino (c, mat, alto = 0.07) {
  const { W, D, T } = c
  cil(c.R.bu, W * 0.82, W * 0.9, alto, mat, 0, T - 0.012, 0, 12, (D + 0.036) / (W * 0.9))
}
/** Le maniche di stoffa: stretta, dritta, larga o ampia (a campana), con polsino. */
function maniche (c, tipo, mat, polsino, opz = {}) {
  const { mR } = c
  c.R.br.forEach(r => {
    const rr = mR + 0.04
    cupola(r, rr + 0.012, 0.075, rr + 0.012, mat, 0, 0.026, 0, 9)
    if (tipo === 'sbuffo') {
      sfe(r, mR + 0.075, 0.095, mR + 0.075, mat, 0, -0.05, 0, 8)
      cil(r, mR + 0.03, mR + 0.034, 0.1, mat, 0, -0.17, 0, 9, 1, true)
      sfe(r, mR + 0.062, 0.062, mR + 0.062, mat, 0, -0.205, 0, 8)
      if (polsino) cil(r, mR + 0.04, mR + 0.04, 0.026, polsino, 0, -0.232, 0, 9, 1, true)
      return
    }
    const [t0, t1] = { stretta: [0.022, 0.02], dritta: [0.035, 0.04], larga: [0.04, 0.075], ampia: [0.05, 0.115] }[tipo] || [0.03, 0.04]
    cil(r, mR + t0, mR + t1, 0.255, mat, 0, -0.105, 0, 10, 1, true)
    if (polsino) cil(r, mR + t1 + 0.005, mR + t1 + 0.007, opz.polH ?? 0.03, polsino, 0, -0.225, 0, 10)
    if (opz.fibbia) cil(r, mR + t1 * 0.6 + 0.012, mR + t1 * 0.6 + 0.012, 0.018, opz.fibbia, 0, -0.14, 0, 9, 1, true)
  })
}
/** Il cappuccio: 'giu' (calato sulle spalle), 'grande' (calato e ampio), 'su' (alzato sulla testa, aperto sul davanti). */
function cappuccio (c, tipo, mat, bordo) {
  const { W, D, T, Rt, cy } = c, b = c.R.bu
  const k = tipo === 'grande' ? 1.5 : tipo === 'enorme' ? 1.8 : 1
  cil(b, W * 0.84, W * 0.95, 0.075, mat, 0, T - 0.016, 0, 12, (D + 0.05) / (W * 0.95))
  if (tipo === 'su') {
    const te = c.R.te, hx = 1.05 * Rt + 0.05, hy = 0.95 * Rt + 0.055, hz = Rt + 0.05, a = 1.05, mm = M(mat.color.getHex(), { roughness: 0.93, ...doppia })
    const guscio = new THREE.Mesh(G('cg', () => new THREE.SphereGeometry(1, 10, 6, PI / 2 + a, PI * 2 - 2 * a, 0, PI * 0.72)), mm)
    guscio.scale.set(hx, hy, hz); guscio.position.set(0, cy + 0.012, -0.018); guscio.castShadow = true; te.add(guscio)
    const tetto = new THREE.Mesh(G('ct', () => new THREE.SphereGeometry(1, 12, 3, 0, PI * 2, 0, 0.86)), mm)
    tetto.scale.set(hx * 1.005, hy * 1.005, hz * 1.02); tetto.position.copy(guscio.position); tetto.castShadow = true; te.add(tetto)
    const P = (phi, th) => [-Math.cos(phi) * Math.sin(th) * hx * 1.01, cy + 0.012 + Math.cos(th) * hy * 1.01, -0.018 + Math.sin(phi) * Math.sin(th) * hz * 1.01]
    const pts = []
    for (const th of [2.2, 1.75, 1.3, 0.95]) pts.push(P(PI / 2 + a, th))
    for (const f of [0.55, 0.25, 0, -0.25, -0.55]) pts.push(P(PI / 2 + a * f, 0.86))
    for (const th of [0.95, 1.3, 1.75, 2.2]) pts.push(P(PI / 2 - a, th))
    nastro(te, pts, 0.014, bordo || mat)
    const pu = cono(te, 0.07 * (hx / 0.3), 0.15, mat, 0, cy + hy * 0.78, -hz * 0.55, 5); pu.rotation.x = -0.9
    return
  }
  const sx = W * 0.9 * (k > 1 ? 1.15 : 1)
  // il collare: il cappuccio calato si vede da davanti come un cordone spesso di stoffa attorno al collo, appoggiato sulle spalle, col bordo sopra
  const Rc = W * 0.92 + 0.03 * k, tb = 0.034 * k, zc = (D + 0.07 + 0.02 * k) / Rc
  const collare = (R, t, m, y) => { const q = pezzo(b, G(`hc${R.toFixed(3)},${t.toFixed(3)}`, () => { const q = new THREE.TorusGeometry(R, t, 5, 14); q.rotateX(PI / 2); return q }), m, 0, y, 0.0, 1, 1, zc); return q }
  collare(Rc, tb, mat, T - 0.012)
  if (bordo) collare(Rc, 0.009 * k, bordo, T + tb * 0.7 - 0.012)
  // il sacco dietro la schiena: più grosso, con la punta ricadente
  sfe(b, sx * 1.15, 0.13 * k, 0.11 * k, mat, 0, T - 0.085 * (k > 1 ? 1.3 : 1), -(D + 0.055 + 0.025 * k), 9)
  const pu = cil(b, 0.014, W * 0.62 * k, 0.17 * k, mat, 0, T - 0.2 * k, -(D + 0.065 + 0.035 * k), 7, 0.8); pu.rotation.x = 0.12
  if (bordo) tondo(b, 1, 0.011, bordo, 0, T - 0.07 * k, -(D + 0.05 + 0.02 * k) + 0.004, sx * 0.97, 0.075 * k, 12).rotation.x = PI / 2 - 0.05
}
/** Il mantello dietro la schiena in tre tratti che si piegano e oscillano. */
function mantello (c, o) {
  const { W, D, T, armX, mR, legH, vis } = c, b = c.R.bu
  const es = o.mat, fo = o.fod, bo = o.bordo
  const yFondo = o.yFondo ?? -Math.max(0.1, Math.min(vis * 0.9, legH * 0.7))
  const L = T - 0.01 - yFondo, l = L / 3, wTop = (o.largo ?? 2 * W + 0.07), z0 = -(D + 0.024)
  const segs = []
  let padre = new THREE.Group(); padre.position.set(0, T - 0.01, z0); b.add(padre)
  const ws = [wTop, wTop * 1.12, wTop * 1.26, wTop * (o.svasa ?? 1.42)]
  const th = o.th ?? 0.1
  for (let i = 0; i < 3; i++) {
    const p = i ? new THREE.Group() : padre
    if (i) { p.position.set(0, -l, 0); padre.add(p) }
    p.rotation.x = th; segs.push({ p, base: th })
    trapezio(p, ws[i], ws[i + 1], l + 0.012, 0.024, es, 0, 0, 0)
    if (fo) trapezio(p, ws[i] - 0.02, ws[i + 1] - 0.02, l + 0.004, 0.006, fo, 0, -0.002, 0.0145)
    if (bo) for (const s of [-1, 1]) sca(p, 0.012, l + 0.006, 0.03, bo, s * (ws[i] + ws[i + 1]) / 4, -l / 2, 0).rotation.z = s * Math.atan((ws[i + 1] - ws[i]) / 2 / l)
    padre = p
  }
  if (bo) sca(padre, ws[3] + 0.014, 0.03, 0.034, bo, 0, -l - 0.002, 0)
  if (o.striscia) for (let i = 0; i < 3; i++) trapezio(segs[i].p, ws[i] * 0.16, ws[i + 1] * 0.16, l + 0.006, 0.006, o.striscia, 0, 0, -0.0145)
  if (o.lembi) for (const s of [-1, 1]) {               // lembi che cadono ai lati, davanti alle braccia
    const f = trapezio(b, 0.1, 0.085, 0.24, 0.02, es, s * (armX + mR + 0.02), T - 0.03, 0); f.rotation.x = 0.02
  }
  c.anim.push(t => segs.forEach((s, i) => { s.p.rotation.x = s.base + (0.035 + i * 0.02) * Math.sin(t * 1.3 + i * 0.7) * (i + 1) * 0.6; s.p.rotation.z = 0.02 * (i + 1) * Math.sin(t * 0.9 + i) }))
}
/** Le spalle: rotonde, a lame, a punte, a fiamma, massicce; ritorna nulla. `col` = {ac, acs, ti}. */
function spalle (c, tipo, p) {
  const { mR } = c
  c.R.br.forEach((r, i) => {
    const s = i ? 1 : -1, rr = mR + 0.065, ac = p.ac, acs = p.acs, ti = p.ti
    if (tipo === 'lame' || tipo === 'multi') {
      for (let k = 0; k < 3; k++) cupola(r, rr + 0.005 + k * 0.014, 0.05 - k * 0.003, rr + 0.005 + k * 0.014, k % 2 ? acs : ac, s * 0.01, 0.045 - k * 0.032, 0, 8)
      cil(r, rr + 0.04, rr + 0.04, 0.014, ti, s * 0.01, -0.052, 0, 8, 1, true)
    } else if (tipo === 'massicce') {
      cupola(r, rr + 0.04, 0.095, rr + 0.04, ac, s * 0.016, 0.02, 0, 8)
      cil(r, rr + 0.045, rr + 0.055, 0.05, acs, s * 0.016, -0.03, 0, 8, 1, true)
      for (const q of [-1, 1]) sfe(r, 0.012, 0.012, 0.012, ti, s * 0.016 + q * (rr + 0.01), 0.04, q * 0.01, 5)
    } else {
      cupola(r, rr + 0.012, 0.085, rr + 0.012, ac, s * 0.012, 0.03, 0, 8)
      cil(r, rr + 0.006, rr + 0.012, 0.022, ti, s * 0.012, 0.026, 0, 8, 1, true)
      cil(r, rr, rr + 0.006, 0.05, acs, s * 0.012, -0.02, 0, 8, 1, true)
    }
    if (tipo === 'punte') {
      const pm = p.punta || ti
      punta(r, [s * 0.012, 0.09, 0], [s * 0.02, 0.2, 0], 0.028, pm, 4)
      punta(r, [s * 0.075, 0.07, 0.005], [s * 0.17, 0.12, 0.005], 0.026, pm, 4)
      punta(r, [s * 0.012, 0.075, 0.06], [s * 0.02, 0.12, 0.15], 0.02, pm, 4)
    } else if (tipo === 'fiamma') {
      const f1 = lucem(0xff5a1a, 0.7), f2 = lucem(0xffb03a, 0.8)
      punta(r, [s * 0.01, 0.08, 0], [s * 0.01, 0.23, 0], 0.036, f1, 5)
      punta(r, [s * 0.07, 0.07, 0], [s * 0.15, 0.2, 0], 0.03, f1, 5)
      punta(r, [s * 0.01, 0.075, 0.045], [s * 0.02, 0.16, 0.1], 0.026, f2, 5)
      punta(r, [s * 0.01, 0.08, 0], [s * 0.01, 0.15, 0], 0.02, f2, 4)
      c.anim.push(t => { f1.emissiveIntensity = 0.65 + 0.3 * Math.sin(t * 6 + i) })
    } else if (tipo === 'ghiaccio') {
      const gh = lucem(0x9fe6ff, 0.45, { transparent: true, opacity: 0.88 })
      punta(r, [s * 0.01, 0.08, 0], [s * 0.02, 0.22, 0], 0.03, gh, 5); punta(r, [s * 0.07, 0.07, 0], [s * 0.15, 0.17, 0], 0.024, gh, 5)
    }
    if (p.gemma) ott(r, 0.026, p.gemma, s * 0.04, 0.052, rr * 0.75, 1, 1.3, 0.6)
    // bracciale e guanto d'arme
    cil(r, mR + 0.022, mR + 0.018, 0.1, ac, 0, -0.17, 0, 8, 1, true)
    cil(r, mR + 0.03, mR + 0.03, 0.022, ti, 0, -0.228, 0, 8, 1, true)
    sfe(r, mR + 0.024, mR + 0.024, mR + 0.024, acs, 0, -0.115, 0, 6)
  })
}
/** Cosciali, ginocchiere e schinieri. */
function gambali (c, ac, acs, ti) {
  const { legR, vis } = c
  c.R.gr.forEach(r => {
    if (vis < 0.1) { cil(r, legR + 0.026, legR + 0.022, vis, ac, 0, -vis / 2, 0, 8, 1, true); return }
    cil(r, legR + 0.026, legR + 0.022, vis * 0.5, ac, 0, -vis * 0.25, 0, 8, 1, true)
    sfe(r, legR + 0.026, legR + 0.026, legR + 0.026, acs, 0, -vis * 0.52, 0.01, 6)
    cil(r, legR + 0.02, legR + 0.026, vis * 0.5 + 0.035, ac, 0, -vis * 0.77 - 0.017, 0, 8, 1, true)
    cil(r, legR + 0.03, legR + 0.03, 0.02, ti, 0, -vis - 0.03, 0, 8, 1, true)
  })
}

// ══════════ gli ornamenti dell'elemento ══════════
/** Un anello di motivi attorno a un'ellisse (orlo, falde): fiamme, cristalli, foglie, onde, stelle, rune, brandelli, gocce, bolle. */
function ornaAnello (c, tipo, n, rx, rz, y, ang = 0, scala = 1) {
  const b = c.R.bu, el = c.el
  const luce1 = lucem(el.colore, 0.85), luce2 = lucem(el.colore2, 0.9)
  for (let i = 0; i < n; i++) {
    const a = i * PI * 2 / n + 0.35, x = Math.sin(a) * rx, z = Math.cos(a) * rz, h = (0.06 + 0.03 * hash(i + c.s)) * scala
    let o
    if (tipo === 'fiamme') {
      o = cono(b, 0.022 * scala, h * 1.4, i % 2 ? luce1 : lucem(0xffb040, 0.9), x, y + h * 0.5, z, 4)
      const ph = i * 0.9; c.anim.push(t => { o.scale.set(1, 0.8 + 0.35 * Math.sin(t * 7 + ph), 1) })
    } else if (tipo === 'cristalli') {
      o = ott(b, 0.02 * scala, M(0xbdeeff, { emissive: 0x5ec0f0, emissiveIntensity: 0.4, roughness: 0.2, metalness: 0.1 }), x, y + h * 0.4, z, 1, 2.4 * (0.8 + hash(i + 2)), 0.9)
      o.rotation.z = (hash(i + 5) - 0.5) * 0.4; o.rotation.x = -ang
    } else if (tipo === 'foglie') {
      o = ott(b, 0.026 * scala, M(i % 2 ? 0x58c860 : 0x2f8a3a, { emissive: 0x2a8a30, emissiveIntensity: 0.25 }), x, y + 0.01, z, 0.8, 1.7, 0.25)
      o.rotation.y = a; o.rotation.x = -0.5 - ang; o.rotation.z = (hash(i) - 0.5) * 0.6
    } else if (tipo === 'onde') {
      o = sfe(b, 0.03 * scala, 0.012, 0.012, i % 2 ? luce1 : luce2, x, y + 0.01, z, 6); o.rotation.y = a
    } else if (tipo === 'stelle') {
      o = stella(b, 0.022 * scala, i % 2 ? luce2 : luce1, x, y + 0.01, z, 5); o.rotation.y = a; o.rotation.x = -ang; o.position.x *= 1.004; o.position.z *= 1.004
      const ph = i * 1.3; c.anim.push(t => { o.scale.set(0.022 * scala * (0.85 + 0.25 * Math.sin(t * 2.4 + ph)), 0.022 * scala * (0.85 + 0.25 * Math.sin(t * 2.4 + ph)), 0.006) })
    } else if (tipo === 'rune') {
      o = sca(b, 0.014 * scala, 0.03 * scala, 0.006, luce2, x, y + 0.012, z); o.rotation.y = a; o.rotation.x = -ang; o.rotation.z = (i % 3 - 1) * 0.35
    } else if (tipo === 'brandelli') {
      o = lembo(b, 0.055 * scala, h * 1.6, 0.01, M(el.ombra, { emissive: el.colore, emissiveIntensity: 0.18, transparent: true, opacity: 0.85 }), x, y + 0.02, z)
      o.rotation.y = a; o.rotation.x = -ang
    } else if (tipo === 'gocce') {
      o = ott(b, 0.014 * scala, lucem(0xd01a2a, 0.9), x, y - 0.01 - h * 0.3, z, 0.8, 1.8, 0.8)
      const ph = i * 1.1; c.anim.push(t => { o.position.y = y - 0.01 - h * 0.3 - 0.015 * ((t * 0.5 + ph) % 1) })
    } else if (tipo === 'bolle') {
      o = sfe(b, 0.014 * scala, 0.014 * scala, 0.014 * scala, lucem(el.colore, 0.9), x, y + 0.02 + h * 0.4 * (i % 2), z, 5)
    } else if (tipo === 'raggi') {
      o = ott(b, 0.015 * scala, i % 2 ? luce2 : luce1, x, y + 0.012, z, 0.8, 2.2, 0.4); o.rotation.y = a; o.rotation.x = -ang
    }
  }
}
const ORNA = { fuoco: 'fiamme', ghiaccio: 'cristalli', natura: 'foglie', acqua: 'onde', arcano: 'stelle', luce: 'raggi', ombra: 'brandelli', sangue: 'gocce', veleno: 'bolle', oro: 'raggi' }
/** Il bagliore e i motivi dell'elemento, secondo il pregio: una linea di luce, un anello di motivi, e al massimo scintille che girano. */
function elemento (c, ring) {
  const { pr, fig, el } = c, b = c.R.bu
  if (fig.elemento === 'nessuno' || !ring) return
  const tipo = c.sch.orna || ORNA[fig.elemento]
  if (c.sch.orna === null) return
  const n = [0, 0, 4, 6, 8][fig.pregio]
  if (n) ornaAnello(c, tipo, n, ring.rx, ring.rz, ring.y, ring.ang || 0, ring.scala || 1)
  if (fig.pregio >= 3 && !ring.noLinea) {
    const l = lucem(el.colore, 0.75)
    tondo(b, 1, 0.006, l, 0, ring.y + 0.03, 0, ring.rx * 1.003, ring.rz * 1.003, 16)
    c.anim.push(t => { l.emissiveIntensity = 0.65 + 0.3 * Math.sin(t * 2.1) })
  }
  if (fig.pregio >= 4) {
    const m1 = lucem(el.colore2, 1), motes = []
    for (let i = 0; i < 5; i++) motes.push(ott(b, 0.016, m1, 0, 0, 0, 1, 1.5, 1))
    c.anim.push(t => motes.forEach((o, i) => { const a = t * (0.9 + 0.1 * i) + i * 1.26; o.position.set(Math.sin(a) * (c.W + 0.2), c.T * 0.55 + Math.sin(t * 1.4 + i) * 0.12, Math.cos(a) * (c.D + 0.2)); o.rotation.y = t * 2 }))
  }
}

// ══════════ le CORAZZE a piastre (e la cotta di maglia) ══════════
const PIASTRE = {
  acciaio: { ac: MATERIE.acciaio.medio, acs: MATERIE.acciaio.scuro, ti: 0xc9a14a, tr: 0x6a4a2a, met: { metalness: 0.6, roughness: 0.24 } },
  ferro: { ac: MATERIE.ferro.medio, acs: MATERIE.ferro.scuro, ti: 0x9a8a60, tr: 0x3d3a36, met: { metalness: 0.3, roughness: 0.72 } },
  oro: { ac: MATERIE.oro.medio, acs: MATERIE.oro.scuro, ti: MATERIE.oro.chiaro, tr: 0x6a4a1c, met: { metalness: 0.78, roughness: 0.2 } }
}
function corazza (c) {
  const s = c.sch, { W, D, T } = c, b = c.R.bu
  const P = { ...PIASTRE[s.mat || 'acciaio'], ...(s.col || {}) }
  const ac = metallo(P.ac, P.met), acs = metallo(P.acs, { ...P.met, roughness: P.met.roughness + 0.1 }), ti = oro(P.ti), tr = cuoio(P.tr), tim = metallo(P.ti, { metalness: 0.7, roughness: 0.3 })
  const ph = T * 0.3
  sca(b, 2 * W + 0.03, T - 0.05, 2 * D + 0.03, acs, 0, 0.04 + (T - 0.05) / 2, 0)                              // il guscio
  // il petto
  if (s.petto === 'muscoli') {
    for (const q of [-1, 1]) sfe(b, W * 0.55, ph * 0.8, 0.075, ac, q * W * 0.5, T * 0.62, D - 0.03, 8)
    for (let k = 0; k < 3; k++) for (const q of [-1, 1]) sca(b, W * 0.5, 0.024, 0.03, k % 2 ? acs : ac, q * W * 0.27, T * 0.36 - k * 0.03, D + 0.012)
    sca(b, 0.014, T * 0.55, 0.026, acs, 0, T * 0.5, D + 0.025)
  } else {
    sfe(b, W + 0.03, ph, 0.085, ac, 0, T * 0.62, D - 0.045, 8)
    sca(b, 0.026, ph * 1.45, 0.035, ti, 0, T * 0.62, D + 0.045)
  }
  sfe(b, W + 0.026, ph * 0.95, 0.08, ac, 0, T * 0.6, -(D - 0.045), 8)                                          // la schiena
  sca(b, 0.026, T * 0.5, 0.026, ti, 0, T * 0.58, -(D + 0.03))
  for (let i = 0; i < 2; i++) sca(b, 2 * W + 0.036 + i * 0.008, 0.032, 2 * D + 0.036 + i * 0.008, i ? ac : acs, 0, 0.066 + i * 0.027, 0)
  if (s.petto === 'decorato') {                                                                                // rilievi dorati sul petto
    for (const q of [-1, 1]) { sca(b, 0.012, T * 0.42, 0.01, tim, q * W * 0.5, T * 0.56, D + 0.046).rotation.z = -q * 0.18; sca(b, W * 0.5, 0.012, 0.01, tim, q * W * 0.4, T * 0.66, D + 0.046).rotation.z = q * 0.25 }
    ott(b, 0.05, lucem(0xffe08a, 0.45), 0, T * 0.6, D + 0.062, 1, 1.4, 0.5)
  }
  if (s.petto === 'disegni') {                                                                                 // disegni luminosi sul petto
    const l = lucem(s.luce || 0xff3a1a, 0.7)
    for (const q of [-1, 1]) { sca(b, 0.012, T * 0.38, 0.01, l, q * 0.07, T * 0.55, D + 0.05).rotation.z = -q * 0.3; sca(b, 0.07, 0.012, 0.01, l, q * 0.07, T * 0.7, D + 0.05).rotation.z = q * 0.3 }
    ott(b, 0.034, l, 0, T * 0.56, D + 0.06, 1, 1.3, 0.5)
    c.anim.push(t => { l.emissiveIntensity = 0.55 + 0.35 * Math.sin(t * 2.4) })
  }
  if (s.graffi) for (let i = 0; i < 5; i++) { const r = sca(b, 0.05 + 0.04 * hash(i), 0.006, 0.006, ferro(0x2a2c30), (hash(i + 3) - 0.5) * W * 1.3, T * (0.35 + 0.35 * hash(i + 7)), D + 0.05 + (i % 2) * 0.003); r.rotation.z = (hash(i + 9) - 0.5) * 1.2 }
  // la cintura
  const rxC = W + 0.04, rzC = D + 0.04
  cil(b, rxC + 0.01, rxC + 0.01, 0.05, tr, 0, 0.026, 0, 14, (rzC + 0.01) / (rxC + 0.01))
  for (let i = -3; i <= 3; i++) sfe(b, 0.012, 0.012, 0.008, tim, i * (W * 0.27), 0.026, D + 0.05, 5)
  const f = s.fibbia || 'quadra'
  if (f === 'tonda') { cil(b, 0.034, 0.034, 0.016, ac, 0, 0.026, D + 0.054, 10).rotation.x = PI / 2; cil(b, 0.02, 0.02, 0.018, acs, 0, 0.026, D + 0.058, 8).rotation.x = PI / 2 }
  else if (f === 'rombo') { ott(b, 0.04, tim, 0, 0.026, D + 0.056, 1, 1.3, 0.35); ott(b, 0.016, lucem(0xffd070, 0.5), 0, 0.026, D + 0.066, 1, 1.2, 0.4) }
  else if (f === 'doppia') for (const q of [-1, 1]) { sca(b, 0.05, 0.05, 0.016, tim, q * 0.08, 0.026, D + 0.054); sca(b, 0.025, 0.026, 0.018, acs, q * 0.08, 0.026, D + 0.058) }
  else { sca(b, 0.06, 0.05, 0.016, tim, 0, 0.026, D + 0.054); sca(b, 0.03, 0.028, 0.018, acs, 0, 0.026, D + 0.058) }
  if (s.gemmaCintura) ott(b, 0.026, lucem(s.gemmaCintura, 0.6), 0, 0.026, D + 0.07, 1, 1.2, 0.5)
  // collo
  if (s.collo === 'V') {
    for (const q of [-1, 1]) { sca(b, 0.014, 0.1, 0.012, ti, q * 0.045, T - 0.06, D + 0.02).rotation.z = q * 0.5 }
    cil(b, W * 0.8, W * 0.8, 0.04, acs, 0, T - 0.012, 0, 12, (D + 0.012) / (W * 0.8))
  } else cil(b, W * 0.8, W * 0.8, 0.04, acs, 0, T - 0.012, 0, 12, (D + 0.012) / (W * 0.8))
  // falde: piastre che pendono dalla cintura
  const rx = W + 0.04, rz = D + 0.04, n = 8, wp = PI * (rx + rz) / n * 1.05
  for (let i = 0; i < n; i++) {
    const a = i * PI * 2 / n, t = sca(b, wp, 0.115, 0.022, i % 2 ? ac : acs, Math.sin(a) * rx, -0.04, Math.cos(a) * rz)
    t.rotation.order = 'YXZ'; t.rotation.y = a; t.rotation.x = -0.17
    if (c.fig.pregio >= 3) sca(b, wp * 0.9, 0.012, 0.026, tim, Math.sin(a) * (rx + 0.002), -0.1, Math.cos(a) * (rz + 0.002)).rotation.y = a
  }
  const sp = s.colSp ? { ac: metallo(s.colSp.ac, P.met), acs: metallo(s.colSp.acs, P.met) } : { ac, acs }
  spalle(c, s.spalle || 'rotonde', { ac: sp.ac, acs: sp.acs, ti, punta: s.puntaCol ? oro(s.puntaCol) : null, gemma: s.gemmaSpalla ? lucem(s.gemmaSpalla, 0.55) : null })
  gambali(c, ac, acs, ti)
  if (s.mantello) mantello(c, { mat: stoffa(s.mantello), fod: stoffa(s.mantelloF || 0x2a0e0e), bordo: s.mantelloB ? oro(s.mantelloB) : null, lembi: s.lembi, largo: s.lembi ? 2 * W + 0.12 : null })
  if (c.fig.pregio >= 2 && !s.nudo) sca(b, 2 * W + 0.04, 0.014, 2 * D + 0.04, tim, 0, 0.0, 0)
  if (s.gemmeBordo) for (const q of [-1, 1]) sca(b, 0.014, T * 0.5, 0.01, tim, q * (W * 0.62), T * 0.6, D + 0.05).rotation.z = -q * 0.1
  elemento(c, s.orna === null ? null : { rx: rx + 0.03, rz: rz + 0.03, y: -0.11, ang: 0.17, scala: 0.9, noLinea: true })
}

// la cotta di maglia: strati alternati di anelli (a fasce), spalline a piastrine, falde sfrangiate
function maglia (c) {
  const s = c.sch, { W, D, T, mR } = c, b = c.R.bu
  const m1 = metallo(0xb4bac2, { metalness: 0.42, roughness: 0.55 }), m2 = metallo(0x8c939c, { metalness: 0.42, roughness: 0.55 }), pi = metallo(0xd2d8de, { metalness: 0.55, roughness: 0.35 })
  const nb = 7, h = (T - 0.045) / nb
  for (let k = 0; k < nb; k++) sca(b, 2 * W + 0.034 + (k % 2) * 0.006, h * 0.98, 2 * D + 0.034 + (k % 2) * 0.006, k % 2 ? m2 : m1, 0, 0.03 + (k + 0.5) * h, 0)
  const rx = W + 0.04, rz = D + 0.04, n = 16
  for (let r = 0; r < 2; r++) for (let i = 0; i < n; i++) {                                                  // cosciali sfrangiati su due file
    const a = i * PI * 2 / n + r * 0.2, w = PI * (rx + rz) / n * 1.15, t = lembo(b, w, 0.12 - r * 0.03, 0.02, (i + r) % 2 ? m1 : m2, Math.sin(a) * (rx + r * 0.006), 0.02 - r * 0.03, Math.cos(a) * (rz + r * 0.006))
    t.rotation.order = 'YXZ'; t.rotation.y = a; t.rotation.x = -0.14
  }
  cintura(c, null, cuoio(0x5a3d22), oro(0xd9b04a), { y: 0.034, h: 0.05, forma: 'quadra', fibbia: metallo(0xd2d8de), cuore: ferro(0x4a4e56) })
  cil(b, W * 0.82, W * 0.9, 0.06, m2, 0, T - 0.012, 0, 12, (D + 0.036) / (W * 0.9))
  c.R.br.forEach((r, i) => {                                                                                // maniche corte di maglia + spalline a piastrine
    cil(r, mR + 0.03, mR + 0.034, 0.14, m1, 0, -0.05, 0, 10, 1, true)
    for (let k = 0; k < 3; k++) cupola(r, mR + 0.075 - k * 0.006, 0.05, mR + 0.075 - k * 0.006, pi, (i ? 1 : -1) * 0.01, 0.045 - k * 0.032, 0, 8)
    cil(r, mR + 0.03, mR + 0.028, 0.05, m2, 0, -0.17, 0, 8, 1, true)
  })
  c.R.gr.forEach(r => {                                                                                    // gambe: calzoni di stoffa scura e maglia sopra il ginocchio
    cil(r, c.legR + 0.022, c.legR + 0.022, c.vis * 0.5, m2, 0, -c.vis * 0.25, 0, 9, 1, true)
  })
  elemento(c, null)
}

// ══════════ le COTTE e le GIUBBE di cuoio ══════════
function cotta (c) {
  const s = c.sch, { W, D, T, mR } = c, b = c.R.bu, cuc = cuoio(s.cuc || 0xe0cfa8)
  const co = cuoio(s.co), cs = cuoio(s.cs || s.co - 0x181008)
  torso(c, co)
  // l'apertura davanti e i lacci
  sca(b, 0.07, (T - 0.06) * 0.8, 0.008, cs, 0, T * 0.52, D + 0.0185)
  for (let i = 0; i < 4; i++) sca(b, 0.11, 0.01, 0.012, cuc, 0, T - 0.07 - i * 0.045, D + 0.022)
  for (const q of [-1, 1]) sca(b, 0.01, T - 0.1, 0.008, cuc, q * (W - 0.012), 0.03 + (T - 0.1) / 2 + 0.02, D + 0.016)   // le cuciture
  cintura(c, null, cuoio(s.cin || 0x4a2d18), oro(s.fibbia || 0xc9a14a), { y: 0.045, h: 0.058, forma: s.fibbiaForma || 'quadra', cuore: cs })
  collarino(c, s.collo ? stoffa(s.collo) : cs, 0.06)
  // la gonna a strisce (pteruges) o la gonna piena
  const rx = W + 0.04, rz = D + 0.04
  if (s.gonna) {
    const g = gonna(c, { mat: stoffa(s.gonna), lung: 0.3, y0: 0.05, svasa: 0.1, hemH: 0 })
    orlo(c, g, s.orlo || 'lembi', stoffa(s.gonna), 0.07, stoffa(s.gonna2 || s.gonna))
    c.gonnaG = g
  } else {
    const n = s.strisce || 10, wp = PI * (rx + rz) / n * 1.1
    for (let i = 0; i < n; i++) {
      const a = i * PI * 2 / n + 0.2, h = (s.stlung || 0.12) + (s.slab ? 0.05 * hash(i + c.s) : 0)
      const t = sca(b, wp, h, 0.018, i % 2 ? co : cs, Math.sin(a) * rx, -h / 2 + 0.02, Math.cos(a) * rz)
      t.rotation.order = 'YXZ'; t.rotation.y = a; t.rotation.x = -0.14; if (s.slab) t.rotation.z = (hash(i + 4) - 0.5) * 0.25
    }
  }
  // spalline: imbottite (cuscini), grosse dorate, o piastre
  c.R.br.forEach((r, i) => {
    const q = i ? 1 : -1, rr = mR + 0.05
    if (s.spalline === 'grosse') {
      cupola(r, rr + 0.045, 0.1, rr + 0.045, oro(s.spCol || 0xe0b040), q * 0.012, 0.03, 0, 10)
      cil(r, rr + 0.045, rr + 0.052, 0.03, oro(s.spCol2 || 0xc89228), q * 0.012, 0.0, 0, 10, 1, true)
      for (let k = -1; k <= 1; k++) sfe(r, 0.013, 0.013, 0.008, oro(0xfff0a0), q * 0.012 + k * 0.045, 0.058, 0.01 * (1 - Math.abs(k)), 5)
    } else if (s.spalline === 'piastre') {
      for (let k = 0; k < 3; k++) cupola(r, rr + 0.01 + k * 0.013, 0.045, rr + 0.01 + k * 0.013, metallo(s.spCol || 0x8c939c), q * 0.012, 0.048 - k * 0.03, 0, 9)
    } else {
      sfe(r, rr + 0.025, 0.065, rr + 0.025, cuoio(s.spCol || s.co - 0x100800), q * 0.012, 0.03, 0, 8)
      cil(r, rr + 0.025, rr + 0.03, 0.02, cuc, q * 0.012, 0.0, 0, 10, 1, true)
    }
    // maniche
    cil(r, mR + 0.022, mR + 0.02, 0.24, s.manicheCol ? stoffa(s.manicheCol) : co, 0, -0.11, 0, 9, 1, true)
    cil(r, mR + 0.026, mR + 0.026, 0.03, cs, 0, -0.22, 0, 9, 1, true)
  })
  // gambali di cuoio più chiaro
  if (s.gambali) c.R.gr.forEach(r => {
    const cg = cuoio(s.gambali), vis = c.vis
    cil(r, c.legR + 0.022, c.legR + 0.02, vis + 0.03, cg, 0, -vis / 2 + 0.01, 0, 9)
    cil(r, c.legR + 0.03, c.legR + 0.03, 0.02, cuc, 0, -vis - 0.01, 0, 9, 1, true)
    sca(r, 0.026, vis * 0.5, 0.012, cuc, 0, -vis * 0.45, c.legR + 0.022)
  })
  // il colletto di pelo
  if (s.pelo) {
    const pe = stoffa(s.pelo, { roughness: 1 })
    const n = 14
    for (let i = 0; i < n; i++) {
      const a = i * PI * 2 / n, x = Math.sin(a) * (W * 0.88), z = Math.cos(a) * (D + 0.05)
      const t = punta(b, [x, T - 0.045, z], [x * 1.12, T + 0.025, z * 1.15], 0.032, pe, 4)
    }
    cil(b, W * 0.92, W * 0.98, 0.05, pe, 0, T - 0.03, 0, 12, (D + 0.07) / (W * 0.98))
  }
  // piastre sulle spalle e in vita
  if (s.piastre) {
    const pm = metallo(s.piastre, { metalness: 0.5, roughness: 0.4 })
    for (const q of [-1, 1]) sca(b, 0.07, 0.014, 0.03, pm, q * W * 0.5, 0.045, D + 0.044)
    sca(b, 0.1, 0.034, 0.014, pm, 0, 0.12, D + 0.02)
  }
  // il tabarro lungo dietro
  if (s.tabarro) mantello(c, { mat: stoffa(s.tabarro), fod: stoffa(s.tabarroF || s.tabarro - 0x101008), striscia: s.tabarroS ? oro(s.tabarroS) : null, bordo: null, yFondo: -Math.max(0.12, c.vis * 0.9), largo: 2 * W * 0.9, svasa: 1.3 })
  if (s.tabarroDavanti) {                                                                                   // il pezzo davanti, stretto
    const f = trapezio(b, 0.2, 0.18, 0.1 + c.vis * 0.9, 0.018, stoffa(s.tabarro), 0, 0.02, D + 0.044); f.rotation.x = -0.04
    if (s.tabarroS) trapezio(b, 0.04, 0.04, 0.1 + c.vis * 0.9, 0.006, oro(s.tabarroS), 0, 0.02, D + 0.054)
  }
  if (c.fig.pregio >= 2 && s.bordo) { tondo(b, 1, 0.009, oro(s.bordo), 0, T - 0.04, 0, W + 0.02, D + 0.02, 14); for (const q of [-1, 1]) sca(b, 0.01, T - 0.1, 0.01, oro(s.bordo), q * 0.05, T * 0.52, D + 0.023) }
  if (s.broche) ott(b, 0.026, lucem(s.broche, 0.5), 0, T - 0.07, D + 0.034, 1, 1.2, 0.5)
  elemento(c, s.gonna ? { rx: c.gonnaG.rx(c.gonnaG.yb) + 0.02, rz: c.gonnaG.rz(c.gonnaG.yb) + 0.02, y: c.gonnaG.yb, ang: c.gonnaG.ang, scala: 0.9 } : { rx: rx + 0.03, rz: rz + 0.03, y: -0.1, ang: 0.14, scala: 0.9 })
}

// ══════════ le VESTI lunghe, i mantelli, le tuniche ══════════
const posizioniRicami = [[0.3, 0.55], [-0.35, 0.5], [1.1, 0.42], [-1.15, 0.38], [0.0, 0.25], [2.0, 0.3], [-2.0, 0.33], [0.7, 0.8], [-0.7, 0.75], [2.9, 0.4], [-2.9, 0.45], [3.14, 0.7]]
function ricami (c, g, tipo, col, col2, n) {
  const b = g.b
  for (let i = 0; i < n; i++) {
    const [a, f] = posizioniRicami[i % posizioniRicami.length], y = g.yb + (g.y0 - g.yb) * f, p = g.pt(a, y, 0.004), m = i % 2 && col2 ? col2 : col
    let o
    if (tipo === 'spirali') { o = new THREE.Mesh(G('spir', () => new THREE.TorusGeometry(0.03, 0.0045, 3, 9, PI * 1.6)), m); o.position.set(...p); o.castShadow = true; b.add(o); sfe(b, 0.007, 0.007, 0.007, m, p[0], p[1], p[2] + 0.001, 4).position.copy(new THREE.Vector3(...p)) }
    else if (tipo === 'arabeschi') { o = new THREE.Mesh(G('arab', () => new THREE.TubeGeometry(new THREE.CatmullRomCurve3([[-0.035, -0.03, 0], [-0.01, -0.012, 0], [0.012, 0.012, 0], [0.036, 0.03, 0], [0.012, 0.045, 0]].map(v => new THREE.Vector3(...v))), 8, 0.0045, 3)), m); o.position.set(...p); o.castShadow = true; b.add(o); ott(b, 0.012, m, p[0], p[1] - 0.03, p[2], 1, 1.3, 0.3).rotation.y = a }
    else if (tipo === 'stelle') o = stella(b, 0.026, m, p[0], p[1], p[2], 5)
    else o = ott(b, 0.02, m, p[0], p[1], p[2], 1, 1.5, 0.3)
    o.rotation.y = a; o.rotation.x = -g.ang
  }
}
function veste (c) {
  const s = c.sch, { W, D, T, mR } = c, b = c.R.bu
  const co = stoffa(s.co, s.lucida ? { roughness: 0.6 } : {}), cs = stoffa(s.cs || (s.co & 0xfefefe) >> 1)
  const bo = s.bo ? (s.boLucido ? oro(s.bo) : stoffa(s.bo, { roughness: 0.6 })) : null, boM = s.bo ? oro(s.bo) : null
  torso(c, co)
  const lung = s.lung ?? 1
  const g = gonna(c, { mat: co, lung, svasa: { s: 0.04, n: 0.09, a: 0.2 }[s.svasa || 'n'], hemH: s.orlo && s.orlo !== 'liscio' ? (s.orloH ?? 0.07) : 0 })
  orlo(c, g, s.orlo, s.orloCol ? stoffa(s.orloCol) : co, s.orloH ?? 0.07, s.orloCol2 ? stoffa(s.orloCol2) : (bo && s.orlo === 'liscio' ? bo : null))
  if (s.orlo === 'liscio' && s.orloCol && !bo) { /* orlo di colore diverso, già dato */ }
  // sottoveste visibile nello scollo a V
  if (s.sotto) {
    const sm = stoffa(s.sotto), sh = new THREE.Shape([new THREE.Vector2(-0.075, 0), new THREE.Vector2(0.075, 0), new THREE.Vector2(0, -0.17)])
    const t = new THREE.Mesh(G('v' + s.id, () => new THREE.ShapeGeometry(sh)), M(s.sotto, { roughness: 0.9, ...doppia })); t.position.set(0, T - 0.012, D + 0.0165); b.add(t)
  }
  // cintura
  const cinCol = s.cin != null ? s.cin : null
  if (cinCol !== null) cintura(c, g, s.cinTipo === 'sottile' ? stoffa(cinCol) : (s.cinCuoio ? cuoio(cinCol) : stoffa(cinCol)), s.fibbia ? (s.fibbiaArg ? metallo(s.fibbia) : oro(s.fibbia)) : null, { y: 0.05, h: s.cinTipo === 'sottile' ? 0.03 : s.cinTipo === 'larga' ? 0.075 : 0.05, fibbia: s.fibbia ? undefined : null, forma: s.fibbiaForma, cuore: cs })
  // pannello centrale e strisce davanti
  if (s.pannello) {
    striscia(c, g, stoffa(s.pannello.col), s.pannello.w ?? 0.1, 0, 0.01, T - 0.025)
    if (s.pannello.bordo) for (const q of [-1, 1]) striscia(c, g, oro(s.pannello.bordo), 0.013, q * ((s.pannello.w ?? 0.1) / 2 + 0.003), 0.012, T - 0.025)
  }
  if (s.bordiFronte) for (const q of [-1, 1]) striscia(c, g, s.bordiLuce ? lucem(s.bordiFronte, 0.8) : oro(s.bordiFronte), s.bordiW ?? 0.014, q * 0.05, 0.011, T - 0.02)
  if (s.davanti) striscia(c, g, stoffa(s.davanti), 0.075, 0, 0.011, T - 0.03)
  // scollo
  if (s.scollo === 'V') {
    const sc = s.scolloCol ? oro(s.scolloCol) : boM
    for (const q of [-1, 1]) { const t = sca(b, 0.014, 0.115, 0.012, sc, q * 0.042, T - 0.065, D + 0.02); t.rotation.z = q * 0.4 }
  }
  if (s.coll) cil(b, W * 0.84, W * 0.97, 0.058, stoffa(s.coll, { roughness: 0.85 }), 0, T - 0.014, 0, 12, (D + 0.05) / (W * 0.97))
  else collarino(c, co, 0.055)
  if (s.collBordo) tondo(b, 1, 0.01, oro(s.collBordo), 0, T - 0.045, 0, W * 0.93, D + 0.05, 12)
  if (s.gemma) ott(b, 0.024, lucem(s.gemma, 0.8), 0, T - 0.085, D + 0.034, 1, 1.25, 0.5)
  // il cappuccio
  if (s.capp) cappuccio(c, s.capp, s.cappCol ? stoffa(s.cappCol) : co, s.cappBordo ? (s.cappLuce ? lucem(s.cappBordo, 0.8) : s.cappStoffa ? stoffa(s.cappBordo) : oro(s.cappBordo, { roughness: 0.5 })) : null)
  // le maniche
  maniche(c, s.maniche || 'stretta', s.manicheCol ? stoffa(s.manicheCol) : co, s.polsino != null ? stoffa(s.polsino, { roughness: 0.7 }) : (bo && s.polsinoOro ? boM : null), { fibbia: s.fibbieManiche ? oro(s.fibbieManiche) : null })
  // il bottoni
  if (s.bottoni) for (let i = 0; i < 4; i++) sfe(b, 0.012, 0.012, 0.01, stoffa(s.bottoni, { roughness: 0.5 }), 0, T - 0.07 - i * 0.045, D + 0.026, 5)
  // ricami
  const dove = (k, col) => k === 'arg' ? metallo(col, { roughness: 0.25 }) : k === 'luce' ? lucem(col, 0.55) : oro(col)
  if (s.ricami) ricami(c, g, s.ricami.tipo, dove(s.ricami.m1, s.ricami.c1), s.ricami.c2 ? dove(s.ricami.m2, s.ricami.c2) : null, s.ricami.n ?? 5)
  if (s.ricamiPetto) {
    const m1 = oro(s.ricamiPetto), m2 = metallo(0xe6ecf4, { roughness: 0.25 })
    for (const q of [-1, 1]) { sca(b, 0.01, 0.1, 0.008, m1, q * 0.09, T * 0.6, D + 0.02).rotation.z = q * 0.3; sca(b, 0.008, 0.08, 0.008, m2, q * 0.115, T * 0.58, D + 0.02).rotation.z = q * 0.3; ott(b, 0.014, m1, q * 0.07, T * 0.78, D + 0.024, 1, 1.4, 0.3) }
    ott(b, 0.018, m1, 0, T * 0.5, D + 0.024, 1, 1.4, 0.3)
    c.R.br.forEach(r => { tondo(r, 1, 0.006, m1, 0, -0.2, 0, mR + 0.05, mR + 0.05, 10) })
  }
  if (s.stelline) {                                                                                        // la notte stellata: stelline sparse sulla gonna
    const l = lucem(0xfff2b0, 0.7); posizioniRicami.slice(0, s.stelline).forEach(([a, f], i) => { const y = g.yb + (g.y0 - g.yb) * f, p = g.pt(a, y, 0.005), st = stella(b, 0.026 + 0.01 * hash(i), l, p[0], p[1], p[2], 5); st.rotation.y = a; st.rotation.x = -g.ang })
    c.anim.push(t => { l.emissiveIntensity = 0.55 + 0.35 * Math.sin(t * 2.3) })
  }
  // casi speciali
  if (s.ali) {                                                                                             // le spalle a ali di piume
    for (const q of [-1, 1]) {
      const ala = new THREE.Group(); ala.position.set(q * (W - 0.02), T - 0.04, -(D + 0.02)); b.add(ala)
      const pm = [stoffa(0xffffff, { roughness: 0.7 }), stoffa(0xe8eef6, { roughness: 0.7 })]
      for (let k = 0; k < 7; k++) {
        const a = 0.35 + k * 0.2, L = 0.34 - Math.abs(k - 2) * 0.03, pp = new THREE.Group(); pp.rotation.z = -q * (a - 0.15); pp.rotation.x = -0.15 + k * 0.03; pp.position.set(0, k * 0.0, -k * 0.004); ala.add(pp)
        lembo(pp, 0.075, L, 0.012, pm[k % 2], q * 0.0, 0.0, 0).rotation.z = PI
        pezzo(pp, G('piuma', () => { const s2 = new THREE.Shape(); s2.moveTo(-0.5, 0); s2.lineTo(0.5, 0); s2.lineTo(0.35, 0.8); s2.lineTo(0, 1); s2.lineTo(-0.35, 0.8); return new THREE.ExtrudeGeometry(s2, { depth: 1, bevelEnabled: false }) }), pm[k % 2], 0, 0, -0.006, 0.07, L, 0.012)
      }
      c.anim.push(t => { ala.rotation.z = -q * (0.02 + 0.05 * Math.sin(t * 1.5)) })
    }
  }
  if (s.grembiule) {
    const gr = stoffa(s.grembiule)
    const sk = sca(b, 0.17, g.Ls * 0.6 / Math.cos(g.ang), 0.012, gr, 0, (g.y0 + g.yb) / 2 + g.Ls * 0.18, (g.rz(g.y0) + g.rz(g.yb)) / 2 + 0.01); sk.rotation.x = -g.ang
    ott(b, 0.05, stoffa(s.rombo || 0xc02a22), 0, (g.y0 + g.yb) / 2 + g.Ls * 0.22, (g.rz(g.y0) + g.rz(g.yb)) / 2 + 0.02, 0.9, 1.5, 0.3).rotation.x = -g.ang
    sca(b, 0.12, T - 0.07, 0.014, stoffa(0xf2f0ea), 0, 0.04 + (T - 0.07) / 2 + 0.03, D + 0.02)                   // il petto bianco
    ott(b, 0.026, lucem(0xff5a6a, 0.8), 0, T * 0.62, D + 0.036, 1, 1.25, 0.5)
    for (const q of [-1, 1]) sca(b, 0.014, T * 0.5, 0.012, gr, q * 0.06, T * 0.58, D + 0.021)
  }
  if (s.sbuffi) {                                                                                           // tunica a sbuffi: pieghe sull'orlo e sul busto
    for (let i = 0; i < 6; i++) { const a = i * PI / 3 + 0.2, p = g.pt(a, g.yb + 0.18, 0.01); sfe(b, 0.055, 0.05, 0.03, co, p[0], p[1], p[2], 6).rotation.y = a }
    tondo(b, 1, 0.022, co, 0, T - 0.04, 0, W + 0.025, D + 0.03, 12)
  }
  if (s.lumeEl) elemento(c, { rx: g.rx(g.yb) + 0.015, rz: g.rz(g.yb) + 0.015, y: g.yb + 0.02, ang: g.ang, scala: 1.9 })
  else elemento(c, s.noEl ? null : { rx: g.rx(g.yb) + 0.015, rz: g.rz(g.yb) + 0.015, y: g.yb + 0.02, ang: g.ang, scala: 1.9 })
  if (s.mantelloDietro) mantello(c, { mat: stoffa(s.mantelloDietro), fod: stoffa(s.mantelloF || 0x201010), bordo: null, yFondo: g.yb + 0.04 })
}

// ══════════ il catalogo: per ogni figura la sua forma e i suoi colori ══════════
const ORO_V = 0xe0b84a
const SCHEDE = {
  'veste-01': { b: cotta, co: 0x8c4a2e, cs: 0x6a3420, cuc: 0xe8d8b0, cin: 0x4a2d18, fibbia: 0xb09a62, spalline: 'imbottite', spCol: 0x7a4228, gambali: 0xb88050, strisce: 10, stlung: 0.12 },
  'veste-02': { b: corazza, mat: 'acciaio', col: { ac: 0xdce8f4, acs: 0x93a6bc, ti: 0xb8c4d0, tr: 0x6a4a2a }, spalle: 'rotonde', nudo: true },
  'veste-03': { b: corazza, mat: 'acciaio', col: { ac: 0x7fa8de, acs: 0x4c6eae, ti: ORO_V, tr: 0x2c3e78 }, spalle: 'rotonde', gemmaSpalla: 0x3a90ff, gemmaCintura: 0xd8f4ff, gemmeBordo: true, fibbia: 'rombo' },
  'veste-04': { b: corazza, mat: 'ferro', col: { ac: 0x575c64, acs: 0x363a40, ti: 0x4a4e56, tr: 0x2e2a26 }, spalle: 'massicce', graffi: true, nudo: true },
  'veste-05': { b: corazza, mat: 'ferro', col: { ac: 0xc99b54, acs: 0x9c7032, ti: 0xb88a40, tr: 0x5a3a20 }, spalle: 'lame', petto: 'muscoli', fibbia: 'quadra', nudo: true },
  'veste-06': { b: corazza, mat: 'oro', col: { ti: 0xfff0b0 }, spalle: 'punte', petto: 'decorato', fibbia: 'rombo', collo: 'V', gemmeBordo: true },
  'veste-07': { b: corazza, mat: 'ferro', col: { ac: 0x8c2219, acs: 0x5c1510, ti: 0xb04a2a, tr: 0x2e1410 }, spalle: 'fiamma', petto: 'disegni', mantello: 0x6a1614, mantelloF: 0x2a0808, fibbia: 'tonda' },
  'veste-08': { b: cotta, co: 0x3f8a38, cs: 0x2a6a28, cuc: 0xd8c890, cin: 0x5a3a20, fibbia: 0xb09a62, spalline: 'imbottite', spCol: 0x357a30, manicheCol: 0x3f8a38, tabarro: 0x3f8a38, tabarroF: 0x2a5a24, tabarroS: 0xe0c040, tabarroDavanti: true, gambali: 0x7a5230, broche: 0x58d870, bordo: 0xe0c040, strisce: 8 },
  'veste-09': { b: maglia },
  'veste-10': { b: corazza, mat: 'acciaio', col: { ac: 0xf6fafe, acs: 0xc6d4e2, ti: 0xdfe4ee, tr: 0xb8c4d2 }, spalle: 'lame', fibbia: 'tonda' },
  'veste-11': { b: corazza, mat: 'ferro', col: { ac: 0xd9812a, acs: 0xa65a18, ti: 0xf0a840, tr: 0x4a2a14 }, spalle: 'punte', puntaCol: 0xf0b040, fibbia: 'doppia', graffi: true },
  'veste-12': { b: corazza, mat: 'acciaio', col: { ac: 0x26336e, acs: 0x161c48, ti: ORO_V, tr: 0x2a2060 }, spalle: 'rotonde', fibbia: 'rombo', gemmeBordo: true },
  'veste-13': { b: corazza, mat: 'ferro', col: { ac: 0x1d1d24, acs: 0x121217, ti: ORO_V, tr: 0x16161a }, colSp: { ac: 0x6c6c76, acs: 0x4c4c56 }, spalle: 'punte', puntaCol: ORO_V, collo: 'V', mantello: 0x1a1a24, mantelloF: 0x0c0c12, lembi: true, fibbia: 'tonda' },
  'veste-14': { b: veste, co: 0x7a5a38, cs: 0x5a4228, capp: 'giu', lung: 0.82, maniche: 'larga', orlo: 'scomposto', orloH: 0.08, svasa: 'a', davanti: 0x5a4228, noEl: true },
  'veste-15': { b: veste, co: 0xf4f0e6, cs: 0xd8d2c4, lung: 0.72, maniche: 'sbuffo', coll: 0xfffaf0, orlo: 'scomposto', orloH: 0.06, sbuffi: true },
  'veste-16': { b: cotta, co: 0x46566a, cs: 0x34425a, cin: 0x2a2a32, fibbia: 0x9aa4b0, spalline: 'piastre', spCol: 0x9aa4b0, piastre: 0x9aa4b0, pelo: 0xf0f4f8, strisce: 12, stlung: 0.15, slab: true, gambali: 0x3a4252 },
  'veste-17': { b: veste, co: 0x6b7a2e, cs: 0x4a5620, capp: 'giu', scollo: 'V', scolloCol: 0xe8c84a, bo: 0xe8c84a, orlo: 'punte', orloH: 0.09, orloCol: 0x6b7a2e, bordiFronte: 0xe8d040, maniche: 'dritta', polsino: 0xe8d040 },
  'veste-18': { b: cotta, co: 0xe29a2c, cs: 0xb87420, cin: 0x5a3a20, fibbia: 0xe0b040, spalline: 'grosse', gonna: 0xb02a22, gonna2: 0x8a1c18, orlo: 'lembi', manicheCol: 0xe29a2c },
  'veste-19': { b: veste, co: 0x6a3aa8, cs: 0x4a2878, capp: 'giu', gemma: 0xe4f8ff, maniche: 'larga', polsino: 0xc8a8f0, svasa: 'a', orlo: 'liscio', cin: 0x4a2a78, bo: 0xc8a8f0 },
  'veste-20': { b: veste, co: 0x2a201c, cs: 0x1a1412, capp: 'giu', bordiFronte: 0xe0b040, cin: 0x4a3a2c, cinTipo: 'larga', maniche: 'dritta', orlo: 'liscio', bo: 0xe0b040, lucida: false },
  'veste-21': { b: veste, co: 0x2a5aa8, cs: 0x1c3e78, scollo: 'V', scolloCol: ORO_V, ricamiPetto: ORO_V, bo: ORO_V, maniche: 'stretta', orlo: 'lembi', orloH: 0.08, orloCol: 0x2a5aa8, orloCol2: 0x3a72c4, cin: 0xc8d0e0, cinTipo: 'sottile' },
  'veste-22': { b: veste, co: 0x34b83c, cs: 0x238a2a, scollo: 'V', scolloCol: ORO_V, bo: ORO_V, orlo: 'foglie', orloH: 0.11, orloCol: 0x34b83c, orloCol2: 0x58d860, cin: 0x6a4a2a, maniche: 'stretta' },
  'veste-23': { b: veste, co: 0xd8301c, cs: 0xa02014, capp: 'enorme', cappBordo: 0xffd8a0, cappStoffa: true, maniche: 'ampia', polsino: 0xffd0a0, orlo: 'sfrangiato', orloH: 0.07, orloCol: 0xffcc90, orloCol2: 0xff9a5a, cin: 0x8a1a10 },
  'veste-24': { b: veste, co: 0x4a9ad8, cs: 0x3678b0, capp: 'grande', maniche: 'ampia', lung: 0.88, scollo: 'V', scolloCol: ORO_V, collBordo: ORO_V, bo: ORO_V, orlo: 'liscio', davanti: 0x3a7ec0 },
  'veste-25': { b: veste, co: 0x1a2a78, cs: 0x101c58, coll: 0x6a3aa8, ricami: { tipo: 'spirali', c1: ORO_V, m1: 'oro', c2: 0xb070ff, m2: 'luce', n: 9 }, svasa: 'a', maniche: 'larga', orlo: 'liscio', bo: ORO_V, polsino: 0x6a3aa8 },
  'veste-26': { b: veste, co: 0xf4f4f8, cs: 0xd0d6e0, sotto: 0xc87a3a, scollo: 'V', scolloCol: ORO_V, bo: ORO_V, cin: 0x8a5a2a, fibbia: ORO_V, davanti: 0xc87a3a, ali: true, maniche: 'larga', orlo: 'lembi', orloH: 0.08, orloCol: 0xf4f4f8, orloCol2: 0xdfe6f0 },
  'veste-27': { b: veste, co: 0x3a2a5a, cs: 0x241a3c, coll: 0xd0d4de, ricami: { tipo: 'arabeschi', c1: 0xdfe6f0, m1: 'arg', n: 9 }, maniche: 'larga', orlo: 'liscio', bo: 0xdfe6f0, polsino: 0xd0d4de },
  'veste-28': { b: veste, co: 0xd6d6de, cs: 0xa8a8b4, capp: 'su', cappBordo: ORO_V, pannello: { col: 0x16161c, w: 0.17, bordo: ORO_V }, bo: ORO_V, maniche: 'dritta', polsino: 0x16161c, orlo: 'liscio', scollo: 'V', scolloCol: ORO_V },
  'veste-29': { b: veste, co: 0xd8501c, cs: 0xa03814, capp: 'giu', cappBordo: 0xf0d040, pannello: { col: 0x5a3a22, w: 0.15, bordo: ORO_V }, bo: ORO_V, maniche: 'larga', polsino: ORO_V, orlo: 'liscio', cin: 0x5a3a22 },
  'veste-30': { b: veste, co: 0x9ac8f0, cs: 0x72a4d4, capp: 'giu', cin: 0x6a4a2a, maniche: 'dritta', orlo: 'sfrangiato', orloH: 0.06, orloCol: 0x9ac8f0, orloCol2: 0xd0ecff, svasa: 's', polsino: 0xd8eeff },
  'veste-31': { b: veste, co: 0x7a3aa8, cs: 0x542478, capp: 'grande', bottoni: 0xf0e8d0, ricamiPetto: ORO_V, maniche: 'larga', polsino: 0x5a2888, orlo: 'liscio', bo: ORO_V },
  'veste-32': { b: veste, co: 0x4a4a52, cs: 0x32323a, coll: 0xb8bcc4, capp: 'giu', maniche: 'dritta', orlo: 'liscio', cin: 0x32323a, cinTipo: 'sottile', noEl: true },
  'veste-33': { b: veste, co: 0x7a5230, cs: 0x5a3a20, capp: 'giu', fibbieManiche: 0xe0b040, cin: 0x4a2e18, cinTipo: 'larga', fibbia: 0xe0b040, bo: 0xb08a20, orlo: 'liscio', maniche: 'larga', cinCuoio: true },
  'veste-34': { b: veste, co: 0x141a48, cs: 0x0c1030, capp: 'giu', bordiFronte: ORO_V, bordiW: 0.009, maniche: 'dritta', orlo: 'liscio', bo: ORO_V, stelline: 9 },
  'veste-35': { b: veste, co: 0x7a1420, cs: 0x560e16, capp: 'giu', bordiFronte: ORO_V, cin: 0x7a1420, cinTipo: 'larga', maniche: 'larga', orlo: 'liscio', bo: ORO_V },
  'veste-36': { b: veste, co: 0x2f8a3a, cs: 0x1f6a28, capp: 'giu', cappBordo: 0xc8f040, cappLuce: true, bordiFronte: 0xc8f040, bordiLuce: true, maniche: 'larga', orlo: 'liscio', bo: 0xc8f040 },
  'veste-37': { b: veste, co: 0x5a2a98, cs: 0x3c1a6c, ricami: { tipo: 'arabeschi', c1: ORO_V, m1: 'oro', c2: 0xdfe6f0, m2: 'arg', n: 6 }, ricamiPetto: ORO_V, svasa: 'a', maniche: 'larga', polsino: ORO_V, orlo: 'liscio', bo: ORO_V, coll: 0x7a4ac0, collBordo: ORO_V, scollo: 'V', scolloCol: ORO_V, gemma: 0xd8a0ff },
  'veste-38': { b: veste, co: 0x17171d, cs: 0x0e0e12, capp: 'su', cappBordo: 0x8a8a92, cin: 0x17171d, cinTipo: 'larga', fibbia: 0xd8dce4, fibbiaArg: true, maniche: 'dritta', orlo: 'liscio', bo: 0x6a6a72 },
  'veste-39': { b: veste, co: 0xc42a22, cs: 0x92181a, capp: 'giu', grembiule: 0x3a8a3a, rombo: 0xc42a22, maniche: 'larga', polsino: 0xf0ece0, orlo: 'liscio', bo: 0x7a0e12, cin: 0x5a3a22 }
}
const COSTRUTTORE = { corazza, cotta, maglia, veste }
void COSTRUTTORE

// ══════════ vesti: la veste addosso all'eroe ══════════
/** Veste l'eroe con la figura (oggetto di roba.json o suo id); torna `togli()`. Una sola veste/armatura per volta. */
export function vesti (eroe, figura) {
  if (typeof figura === 'string') figura = FIGURE.find(f => f.id === figura)
  const sch0 = figura && SCHEDE[figura.id]
  if (!sch0) throw new Error(`veste sconosciuta: ${figura && figura.id}`)
  const sch = { ...sch0, id: figura.id }
  const u = eroe.userData
  if (u.armatura) u.armatura.togli()
  const nascosti = nascondi(eroe, sch.capp === 'su')
  const m = misure(eroe), radici = [], anim = []
  const rad = padre => { const g = new THREE.Group(); padre.add(g); radici.push(g); return g }
  const R = { bu: rad(u.busto), br: u.bracci.map(rad), gr: u.gambe.map(rad), te: rad(u.testa) }
  const c = { ...m, sch, fig: figura, R, anim, el: ELEMENTI[figura.elemento] || ELEMENTI.nessuno, pr: PREGIO[figura.pregio] || PREGIO[1], s: seme(figura.id) }
  sch.b(c)
  let tri = 0
  for (const r of radici) r.traverse(o => { if (o.isMesh) tri += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3 })
  const vecchia = u.animaArmatura
  u.animaArmatura = t => anim.forEach(f => f(t))
  u.triangoliArmatura = Math.round(tri)
  const togli = () => {
    for (const r of radici) r.parent.remove(r)
    for (const o of nascosti) o.visible = true
    u.animaArmatura = vecchia; delete u.triangoliArmatura; delete u.armatura
  }
  u.armatura = { tipo: 'veste', figura: figura.id, togli }
  togli.triangoli = u.triangoliArmatura
  return togli
}
export const stampaVesti = () => FIGURE.map(f => f.id)
