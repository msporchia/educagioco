// PoC: l'armatura indossata dai quattro eroi (poc/eroi-3d/eroi.js), costruita SUL personaggio che la riceve.
// `vesti(eroe, tipo, pregio = 1)` → `togli()`. tipo: 'panciotto' | 'corazza' | 'manto' | 'saio'; pregio 1 comune, 2 buono, 3 raro.
// Le misure (busto, bracci, gambe) si leggono dal gruppo dell'eroe; i pezzi stanno sui perni (busto, bracci[i], gambe[i]) e
// seguono le pose. Il mantello oscilla: la pagina chiama `eroe.userData.animaArmatura(t)`. Autonomo: solo three.
// Le vesti dell'eroe che l'armatura sostituisce si spengono (visible = false) e `togli()` le riaccende.
import * as THREE from 'three'

export const TIPI = ['panciotto', 'corazza', 'manto', 'saio']

// ── mattoncini (materiali e geometrie in cache, geometrie unitarie scalate sulla mesh) ──
const cacheMat = new Map()
function M (colore, o = {}) {
  const k = colore + JSON.stringify(o)
  if (!cacheMat.has(k)) cacheMat.set(k, new THREE.MeshStandardMaterial({ color: colore, roughness: 0.85, metalness: 0, flatShading: true, ...o }))
  return cacheMat.get(k)
}
const metallo = (c, o = {}) => M(c, { metalness: 0.5, roughness: 0.36, ...o })
const luceM = (c, f = 0.9) => M(c, { emissive: c, emissiveIntensity: f, roughness: 0.4 })
const geo = new Map()
const G = (k, f) => { if (!geo.has(k)) geo.set(k, f()); return geo.get(k) }
function pezzo (g, geometria, m, x, y, z, sx, sy, sz) {
  const o = new THREE.Mesh(geometria, m); o.position.set(x, y, z); o.scale.set(sx, sy, sz); o.castShadow = o.receiveShadow = true; g.add(o); return o
}
const sca = (g, w, h, d, m, x = 0, y = 0, z = 0) => pezzo(g, G('b', () => new THREE.BoxGeometry(1, 1, 1)), m, x, y, z, w, h, d)
const sfe = (g, rx, ry, rz, m, x = 0, y = 0, z = 0, seg = 8) => pezzo(g, G('s' + seg, () => new THREE.SphereGeometry(1, seg, Math.max(5, seg * 0.7 | 0))), m, x, y, z, rx, ry, rz)
const cupola = (g, rx, ry, rz, m, x = 0, y = 0, z = 0, seg = 9) => pezzo(g, G('d' + seg, () => new THREE.SphereGeometry(1, seg, 4, 0, Math.PI * 2, 0, Math.PI / 2)), m, x, y, z, rx, ry, rz)
// cilindro (o tronco di cono): raggio basso rb, alto rt, altezza h; kz allunga/accorcia la profondità (ellisse)
const cil = (g, rt, rb, h, m, x = 0, y = 0, z = 0, seg = 10, kz = 1) => pezzo(g, G(`c${(rt / rb).toFixed(4)},${seg}`, () => new THREE.CylinderGeometry(rt / rb, 1, 1, seg)), m, x, y, z, rb, h, rb * kz)
const ott = (g, r, m, x = 0, y = 0, z = 0, sx = 1, sy = 1.4, sz = 0.7) => pezzo(g, G('o', () => new THREE.OctahedronGeometry(1, 0)), m, x, y, z, r * sx, r * sy, r * sz)
const tondo = (g, R, tubo, m, x, y, z, rx, rz) => {   // un anello orizzontale ellittico (cordone, bordo)
  const o = pezzo(g, G(`t${tubo}`, () => new THREE.TorusGeometry(1, tubo, 5, 20)), m, x, y, z, rx, rz, 1); o.rotation.x = Math.PI / 2; return o
}
function stellaGeo () {
  return G('stella', () => {
    const s = new THREE.Shape()
    for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + i * Math.PI / 5, k = i % 2 ? 0.45 : 1; i ? s.lineTo(Math.cos(a) * k, Math.sin(a) * k) : s.moveTo(Math.cos(a) * k, Math.sin(a) * k) }
    const g = new THREE.ExtrudeGeometry(s, { depth: 1, bevelEnabled: false }); g.translate(0, 0, -0.5); return g
  })
}
/** Un trapezio (larghezza alta wa, bassa wb, altezza h, appeso al suo bordo alto: y da 0 a -h) esteso in z di `spess`. */
function trapezio (g, wa, wb, h, spess, m, x = 0, y = 0, z = 0) {
  const k = `tz${wa.toFixed(3)},${wb.toFixed(3)},${h.toFixed(3)},${spess}`
  const ge = G(k, () => {
    const s = new THREE.Shape(); s.moveTo(-wa / 2, 0); s.lineTo(wa / 2, 0); s.lineTo(wb / 2, -h); s.lineTo(-wb / 2, -h); s.lineTo(-wa / 2, 0)
    const e = new THREE.ExtrudeGeometry(s, { depth: spess, bevelEnabled: false }); e.translate(0, 0, -spess / 2); return e
  })
  return pezzo(g, ge, m, x, y, z, 1, 1, 1)
}

// ══════════ le misure dell'eroe ══════════
function misure (eroe, modo) {
  const u = eroe.userData, busto = u.busto
  const cassa = busto.children[0].geometry.parameters           // il busto è una scatola: width, height, depth
  const m = {
    W: cassa.width / 2, D: cassa.depth / 2, T: u.th,
    armX: Math.abs(u.bracci[0].position.x), armY: u.bracci[0].position.y, mR: u.bracci[0].children[0].geometry.parameters.radiusTop,
    legX: Math.abs(u.gambe[0].position.x), legR: u.gambe[0].children[0].geometry.parameters.radiusTop, legH: u.altezzaBusto,
    robe: null, Wc: 0, Dc: 0
  }
  m.vis = m.legH - u.gambe[0].children[1].geometry.parameters.height            // la gamba visibile sopra lo stivale
  m.Wc = m.W; m.Dc = m.D
  if (modo === 'dorso') {                                                      // sotto un mantello restano le vesti: il mago ha una campana
    const cam = busto.children.find((c, i) => i > 0 && c.visible && c.isMesh && c.geometry.type === 'CylinderGeometry')
    if (cam) { m.Wc = m.Dc = Math.max(m.W, cam.geometry.parameters.radiusTop, 0) }
    const gon = eroe.children.find(c => c.isGroup && c !== busto && !u.gambe.includes(c) && c.visible && c.children[0] && c.children[0].geometry && c.children[0].geometry.type === 'CylinderGeometry')
    if (gon) {
      const c0 = gon.children[0], p = c0.geometry.parameters, yTop = gon.position.y + c0.position.y + p.height * c0.scale.y / 2 - m.legH
      m.robe = { yTop, yBot: yTop - p.height, rTop: p.radiusTop, rBot: p.radiusBottom }
    }
  }
  return m
}
const raggioVeste = (m, y) => m.robe && y <= m.robe.yTop && y >= m.robe.yBot ? m.robe.rTop + (m.robe.rBot - m.robe.rTop) * (m.robe.yTop - y) / (m.robe.yTop - m.robe.yBot) : 0

/** Spegne le vesti dell'eroe che l'armatura sostituisce. 'completo': tutto; 'dorso': solo ciò che il mantello copre. */
function nascondi (eroe, modo, anchegambe) {
  const u = eroe.userData, lista = []
  const spegni = o => { if (o.visible) { o.visible = false; lista.push(o) } }
  u.busto.children.forEach((c, i) => {
    if (i === 0 || c === u.testa || u.bracci.includes(c)) return
    if (modo === 'completo' || c.position.y >= u.th * 0.9 || c.position.z < -0.05) spegni(c)
  })
  if (modo === 'completo') eroe.children.forEach(c => { if (c.isGroup && c !== u.busto && !u.gambe.includes(c)) spegni(c) })
  const armi = u.perniArmi ? Object.values(u.perniArmi) : []
  u.bracci.forEach(b => b.children.forEach((c, i) => {
    if (i < 2 || c === u.falce || c === u.ascia || armi.includes(c)) return
    if (modo === 'completo' || c.isGroup) spegni(c)
  }))
  if (anchegambe) u.gambe.forEach(p => p.children.forEach((c, i) => { if (i >= 2) spegni(c) }))
  return lista
}

// ══════════ PANCIOTTO: gilet di cuoio, lacci e cintura, spalle libere ══════════
function panciotto (m, R, P, anim) {
  const { W, D, T } = m
  const pal = [null, { cu: 0x9b6a3a, sc: 0x4f3220, lac: 0xe8d8a6, mt: 0xb39a62, bordo: null }, { cu: 0x8a4b2a, sc: 0x4a2a18, lac: 0xf2e2b0, mt: 0xd9a441, bordo: 0xd9a441 }, { cu: 0x3a2a26, sc: 0x241714, lac: 0xf4d98a, mt: 0xf0c24a, bordo: 0xf0c24a }][P]
  const cu = M(pal.cu), sc = M(pal.sc), lac = M(pal.lac), mt = metallo(pal.mt, { metalness: 0.45 })
  const y0 = 0.045, y1 = T - 0.03, h = y1 - y0, b = R.bu
  sca(b, 2 * W + 0.026, h, 2 * D + 0.026, cu, 0, (y0 + y1) / 2, 0)
  const stH = h * 0.78
  sca(b, 0.085, stH, 0.01, sc, 0, y1 - stH / 2 - 0.005, D + 0.016)                                             // l'apertura sul davanti
  for (let i = 0; i < 4; i++) sca(b, 0.11, 0.012, 0.014, lac, 0, y1 - 0.045 - i * stH * 0.22, D + 0.02)         // i lacci incrociati
  for (const s of [-1, 1]) {
    sca(b, 0.07, 0.03, 2 * D + 0.03, cu, s * W * 0.55, T - 0.012, 0)                                          // le bretelle sulle spalle
    sca(b, 0.014, h * 0.7, 2 * D + 0.03, sc, s * (W + 0.0125), y0 + h * 0.4, 0)                                // la cucitura dei fianchi
  }
  sca(b, 2 * W + 0.05, 0.05, 2 * D + 0.05, sc, 0, y0 + 0.012, 0)                                               // la cintura
  sca(b, 0.05, 0.042, 0.012, mt, 0, y0 + 0.012, D + 0.03); sca(b, 0.026, 0.022, 0.014, sc, 0, y0 + 0.012, D + 0.033)
  const n = Math.max(8, Math.round(Math.PI * (W + D + 0.06) / 0.1)), rx = W + 0.034, rz = D + 0.034
  for (let i = 0; i < n; i++) {                                                                              // le strisce di cuoio che pendono dalla cintura
    const a = i * Math.PI * 2 / n + 0.2, s = sca(b, 0.075, 0.1, 0.016, i % 2 ? cu : sc, Math.sin(a) * rx, y0 - 0.04, Math.cos(a) * rz)
    s.rotation.order = 'YXZ'; s.rotation.y = a; s.rotation.x = -0.12
  }
  if (P >= 2) {
    const rivetto = (x, y, z) => sfe(b, 0.011, 0.011, 0.008, mt, x, y, z, 5)
    for (const s of [-1, 1]) for (let i = 0; i < 4; i++) rivetto(s * 0.075, y1 - 0.02 - i * h * 0.2, D + 0.0165)
    for (const s of [-1, 1]) rivetto(s * W * 0.55, T + 0.004, D * 0.5)
    for (let i = -3; i <= 3; i++) rivetto(i * (W * 0.28), y0 + 0.012, D + 0.027)
    for (const s of [-1, 1]) sca(b, 0.012, stH, 0.012, M(pal.bordo, { metalness: 0.4, roughness: 0.4 }), s * 0.049, y1 - stH / 2 - 0.005, D + 0.018)
  }
  if (P >= 3) {
    ott(b, 0.026, luceM(0xff5a4a, 0.55), 0, y0 + 0.012, D + 0.04, 1, 1.2, 0.5)                                // un rubino sulla fibbia
    for (const s of [-1, 1]) sca(b, 0.05, 0.012, 2 * D + 0.034, metallo(pal.mt), s * W * 0.55, T + 0.005, 0)
    sca(b, 2 * W + 0.03, 0.014, 2 * D + 0.03, metallo(pal.mt), 0, y1 - 0.005, 0)
    for (let i = 0; i < n; i += 2) { const a = i * Math.PI * 2 / n + 0.2; sfe(b, 0.012, 0.012, 0.01, mt, Math.sin(a) * (rx + 0.012), y0 - 0.075, Math.cos(a) * (rz + 0.012), 5) }
  }
}

// ══════════ CORAZZA: piastre d'acciaio, spalliere sovrapposte, falde, bracciali e schinieri ══════════
function corazza (m, R, P, anim) {
  const { W, D, T, mR, legR, vis } = m
  const pal = [null, { ac: 0x8b919c, acs: 0x575c66, tr: 0x3d4048, ti: 0xc9a14a }, { ac: 0xb6c1ce, acs: 0x7a8492, tr: 0x4a3f2c, ti: 0xd9a441 }, { ac: 0xe3ebf4, acs: 0xa2afc0, tr: 0x6a4e1c, ti: 0xf4c542 }][P]
  const ac = metallo(pal.ac, { metalness: P === 3 ? 0.78 : 0.55, roughness: P === 3 ? 0.22 : 0.4 }), acs = metallo(pal.acs, { metalness: 0.5 })
  const tr = M(pal.tr), ti = metallo(pal.ti, { metalness: 0.55, roughness: 0.3 })
  const b = R.bu, ph = T * 0.3
  sca(b, 2 * W + 0.03, T - 0.05, 2 * D + 0.03, acs, 0, 0.04 + (T - 0.05) / 2, 0)                                // il guscio che avvolge il busto
  sfe(b, W + 0.03, ph, 0.085, ac, 0, T * 0.62, D - 0.045, 8)                                                    // il pettorale bombato
  sfe(b, W + 0.026, ph * 0.95, 0.08, ac, 0, T * 0.6, -(D - 0.045), 8)                                           // la schiena
  sca(b, 0.026, ph * 1.45, 0.035, ti, 0, T * 0.62, D + 0.045)                                                  // la costola centrale
  sca(b, 0.026, T * 0.5, 0.026, ti, 0, T * 0.58, -(D + 0.03))
  for (let i = 0; i < 2; i++) sca(b, 2 * W + 0.036 + i * 0.008, 0.032, 2 * D + 0.036 + i * 0.008, i ? ac : acs, 0, 0.066 + i * 0.027, 0)   // le lame sotto il petto
  sca(b, 2 * W + 0.06, 0.05, 2 * D + 0.06, tr, 0, 0.026, 0)                                                      // la cintura borchiata
  for (let i = -3; i <= 3; i++) { const x = i * (W * 0.27); sfe(b, 0.014, 0.014, 0.01, ti, x, 0.026, D + 0.031, 5) }
  sca(b, 0.06, 0.05, 0.016, ti, 0, 0.026, D + 0.04)
  cil(b, W * 0.8, W * 0.8, 0.04, acs, 0, T - 0.012, 0, 12, (D + 0.012) / (W * 0.8))                              // il collarino sotto la testa
  // le falde: un anello di piastre che pendono dalla cintura
  const rx = W + 0.04, rz = D + 0.04, n = 8, wp = Math.PI * (rx + rz) / n * 1.05
  for (let i = 0; i < n; i++) {
    const a = i * Math.PI * 2 / n, s = sca(b, wp, 0.115, 0.022, i % 2 ? ac : acs, Math.sin(a) * rx, -0.04, Math.cos(a) * rz)
    s.rotation.order = 'YXZ'; s.rotation.y = a; s.rotation.x = -0.17
    sca(b, wp * 0.9, 0.012, 0.026, ti, Math.sin(a) * (rx + 0.002), -0.1, Math.cos(a) * (rz + 0.002)).rotation.y = a
  }
  // spalliere sovrapposte e bracciali
  R.br.forEach((r, i) => {
    const s = i ? 1 : -1, rr = mR + 0.065
    cupola(r, rr + 0.01, 0.08, rr + 0.01, ac, s * 0.012, 0.03, 0, 10)
    cil(r, rr + 0.005, rr + 0.012, 0.022, ti, s * 0.012, 0.026, 0, 10)
    cil(r, rr - 0.002, rr + 0.004, 0.05, acs, s * 0.012, -0.02, 0, 10)
    cil(r, rr - 0.01, rr - 0.004, 0.045, ac, s * 0.012, -0.066, 0, 10)
    cil(r, mR + 0.022, mR + 0.018, 0.1, ac, 0, -0.17, 0, 9)
    cil(r, mR + 0.03, mR + 0.03, 0.022, ti, 0, -0.228, 0, 9)
    sfe(r, mR + 0.024, mR + 0.024, mR + 0.024, acs, 0, -0.115, 0, 7)
  })
  // cosciali, ginocchiere, schinieri
  R.gr.forEach(r => {
    if (vis < 0.1) { cil(r, legR + 0.026, legR + 0.022, vis, ac, 0, -vis / 2, 0, 9); return }
    cil(r, legR + 0.026, legR + 0.022, vis * 0.5, ac, 0, -vis * 0.25, 0, 9)
    sfe(r, legR + 0.026, legR + 0.026, legR + 0.026, acs, 0, -vis * 0.52, 0.01, 7)
    cil(r, legR + 0.02, legR + 0.026, vis * 0.5 + 0.035, ac, 0, -vis * 0.77 - 0.017, 0, 9)
    cil(r, legR + 0.03, legR + 0.03, 0.02, ti, 0, -vis - 0.03, 0, 9)
  })
  if (P >= 2) {
    sca(b, 2 * W + 0.04, 0.014, 2 * D + 0.04, ti, 0, 0.0, 0)
    for (const s of [-1, 1]) sca(b, 0.014, T * 0.55, 0.01, ti, s * (W * 0.62), T * 0.62, D + 0.043).rotation.z = -s * 0.1
  }
  if (P >= 3) {
    ott(b, 0.05, luceM(0x58e0ff, 0.6), 0, T * 0.66, D + 0.062, 1, 1.35, 0.6)                                   // il sigillo
    for (const s of [-1, 1]) {
      sca(b, 0.07, 0.01, 0.01, luceM(0x58e0ff, 0.45), s * 0.12, T * 0.55, D + 0.047)
      sca(b, 0.01, 0.06, 0.01, luceM(0x58e0ff, 0.45), s * 0.15, T * 0.52, D + 0.047)
    }
    R.br.forEach((r, i) => { sca(r, 0.014, 0.04, 0.014, luceM(0x58e0ff, 0.5), (i ? 1 : -1) * (mR + 0.07), 0.04, 0) })
  }
  const pulsa = luceM(0x58e0ff, 0.6)
  if (P >= 3) anim.push(t => { pulsa.emissiveIntensity = 0.6 + 0.35 * Math.sin(t * 2.6) })
}

// ══════════ MANTO: mantello lungo dietro le spalle, mantellina col fermaglio, bordo ricamato ══════════
function manto (m, R, P, anim) {
  const { Wc: W, Dc: D, T, armX, mR, legH, vis } = m
  const pal = [null, { es: 0x23707c, fo: 0x0f3a42, bo: 0xe2d4a4 }, { es: 0x6e2a6a, fo: 0x331135, bo: 0xe0b050 }, { es: 0x2b3f9e, fo: 0x141b55, bo: 0xf2c545 }][P]
  const es = M(pal.es), fo = M(pal.fo), bo = metallo(pal.bo, { metalness: P === 1 ? 0.1 : 0.5, roughness: 0.4 })
  const b = R.bu
  // la mantellina sulle spalle
  const rxa = W * 0.72 + 0.02, rxb = armX + mR * 0.6, rza = D * 0.95 + 0.01, rzb = D + 0.055
  cil(b, rxa, rxb, 0.14, es, 0, T - 0.058, 0, 14, rzb / rxb)
  tondo(b, 1, 0.012, bo, 0, T - 0.128, 0, rxb + 0.002, rzb + 0.002)
  for (const sg of [-1, 1]) {                                                                                   // due lembi che scendono sul petto, come un mantello gettato sulle spalle
    const f = trapezio(b, 0.1, 0.075, 0.2, 0.022, es, sg * (W * 0.62 + 0.03), T - 0.1, rzb - 0.02); f.rotation.x = -0.1
    const bd = sca(b, 0.012, 0.2, 0.026, bo, sg * (W * 0.62 + 0.03 - 0.0475), T - 0.2, rzb - 0.015); bd.rotation.x = -0.1
  }
  // il mantello: tre segmenti che si piegano, più aperto in basso se sotto c'è una campana
  const yFondo = m.robe ? Math.max(m.robe.yBot + 0.07, -0.26) : -Math.max(0.08, Math.min(vis * 0.82, legH * 0.62))
  const L = T - 0.01 - yFondo, l = L / 3, wTop = 2 * W + 0.07, z0 = -(D + 0.024)
  const rFondo = Math.max(raggioVeste(m, yFondo), 0)
  const need = Math.max(0, rFondo + 0.05 - (D + 0.024))
  let th = 0.07; for (; th < 0.6; th += 0.01) { if (l * (Math.sin(th) + Math.sin(2 * th) + Math.sin(3 * th)) >= need) break }
  const segs = []
  let padre = new THREE.Group(); padre.position.set(0, T - 0.01, z0); b.add(padre)
  const ws = [wTop, wTop * 1.12, wTop * 1.26, wTop * 1.42]
  for (let i = 0; i < 3; i++) {
    const p = i ? new THREE.Group() : padre
    if (i) { p.position.set(0, -l, 0); padre.add(p) }
    p.rotation.x = th; segs.push({ p, base: th })
    trapezio(p, ws[i], ws[i + 1], l + 0.012, 0.024, es, 0, 0, 0)
    trapezio(p, ws[i] - 0.02, ws[i + 1] - 0.02, l + 0.004, 0.006, fo, 0, -0.002, 0.0145)                       // la fodera
    if (P >= 2) for (const s of [-1, 1]) sca(p, 0.012, l + 0.006, 0.03, bo, s * (ws[i] + ws[i + 1]) / 4, -l / 2, 0).rotation.z = s * Math.atan((ws[i + 1] - ws[i]) / 2 / l)
    padre = p
  }
  sca(padre, ws[3] + 0.014, 0.036, 0.034, bo, 0, -l - 0.004, 0)                                               // l'orlo
  if (P >= 2) sca(padre, ws[3] - 0.03, 0.012, 0.036, M(pal.fo), 0, -l + 0.02, 0)
  if (P >= 3) {
    const glow = luceM(0xffd54a, 0.7)
    const posti = [[0, 0, -0.04, 1], [-0.08, 0, -0.1, 0.8], [0.08, 0, -0.1, 0.8], [0, 1, -0.045, 1.1], [-0.11, 1, -0.05, 0.7], [0.11, 1, -0.05, 0.7], [0, 2, -0.05, 0.9]]
    for (const [x, k, y, sc] of posti) {
      const o = pezzo(segs[k].p, stellaGeo(), glow, x * (ws[k] / wTop), y, -0.0165, 0.034 * sc, 0.034 * sc, 0.008)
      o.rotation.y = Math.PI
    }
    for (const s of [-1, 1]) { sca(padre, 0.012, 0.03, 0.036, glow, s * 0.14, -l + 0.01, 0.0).rotation.z = 0.4; sca(padre, 0.012, 0.03, 0.036, glow, s * 0.14, -l + 0.01, 0.0).rotation.z = -0.4 }
    anim.push(t => { glow.emissiveIntensity = 0.65 + 0.35 * Math.sin(t * 2.2) })
  }
  anim.push(t => segs.forEach((s, i) => { s.p.rotation.x = s.base + (0.035 + i * 0.02) * Math.sin(t * 1.3 + i * 0.7) * (i + 1) * 0.6; s.p.rotation.z = 0.02 * (i + 1) * Math.sin(t * 0.9 + i) }))
  // fermaglio sul petto
  const zf = rza + (rzb - rza) * 0.35 + 0.012, yf = T - 0.06
  cil(b, 0.032, 0.032, 0.014, bo, 0, yf, zf, 10).rotation.x = Math.PI / 2
  if (P === 1) sfe(b, 0.014, 0.014, 0.01, M(0xc8402f), 0, yf, zf + 0.01, 6)
  else ott(b, P === 3 ? 0.04 : 0.032, P === 3 ? luceM(0xff4a62, 0.7) : M(0xc8203a, { roughness: 0.3 }), 0, yf, zf + 0.012, 1, 1.3, 0.6)
  for (const s of [-1, 1]) sca(b, 0.05, 0.008, 0.008, bo, s * 0.045, yf + 0.004, zf + 0.002).rotation.z = s * 0.12
  if (P >= 2) for (let i = 0; i < 9; i++) { const a = -Math.PI * 0.8 + i * Math.PI * 1.6 / 8; sfe(b, 0.011, 0.011, 0.011, bo, Math.sin(a) * (rxb + 0.002), T - 0.112, Math.cos(a) * (rzb + 0.002), 5) }
}

// ══════════ SAIO: tonaca fino a mezza coscia, cappuccio calato dietro, cordone in vita ══════════
function saio (m, R, P, anim) {
  const { W, D, T, mR, legX, legR, vis } = m
  const pal = [null, { to: 0xa87f4c, sc: 0x6a4a2a, co: 0xe8dcc0, ri: null }, { to: 0xb69260, sc: 0x7a4a26, co: 0xf0e4c4, ri: 0xe3b957 }, { to: 0xefe4c8, sc: 0xb78a3c, co: 0xf4c542, ri: 0xe9b43e }][P]
  const to = M(pal.to), sc = M(pal.sc), co = M(pal.co), ri = pal.ri ? metallo(pal.ri, { metalness: 0.5, roughness: 0.32 }) : null
  const b = R.bu, y0 = 0.09, yb = -Math.max(0.065, vis * 0.5), Ls = y0 - yb
  sca(b, 2 * W + 0.03, T - 0.04, 2 * D + 0.03, to, 0, 0.03 + (T - 0.04) / 2, 0)
  const rtx = W + 0.034, rbx = Math.max(W + 0.07, legX + legR + 0.04), rtz = D + 0.034, rbz = D + 0.07
  cil(b, rtx, rbx, Ls, to, 0, (y0 + yb) / 2, 0, 14, rbz / rbx)                                                // la gonna della tonaca
  const rx = y => rtx + (rbx - rtx) * (y0 - y) / Ls, rz = y => rtz + (rbz - rtz) * (y0 - y) / Ls
  tondo(b, 1, 0.019, co, 0, 0.058, 0, rx(0.058) + 0.004, rz(0.058) + 0.004)                                   // il cordone
  const zc = rz(0.058) + 0.012
  sfe(b, 0.03, 0.03, 0.026, co, 0.07, 0.056, zc, 6)
  for (const [dx, dy, r] of [[0.062, -0.05, 0.1], [0.085, -0.045, -0.12]]) {
    const c = cil(b, 0.012, 0.012, 0.1, co, dx + (dx > 0.07 ? 0.01 : 0), 0.058 + dy, zc + 0.002, 6); c.rotation.z = r
    sfe(b, 0.022, 0.02, 0.022, co, dx + (dx > 0.07 ? 0.01 : 0) - Math.sin(r) * 0.05, 0.058 + dy - 0.055, zc + 0.002, 6)
  }
  const stH = T - 0.04 - 0.07
  sca(b, 0.075, stH, 0.008, sc, 0, 0.09 + stH / 2, D + 0.019)                                                  // lo scapolare scuro sul petto
  const ang = Math.atan((rbz - rtz) / Ls)
  const sk = sca(b, 0.075, Ls, 0.008, sc, 0, (y0 + yb) / 2, (rz(y0) + rz(yb)) / 2 + 0.006); sk.rotation.x = -ang
  if (P >= 2) {
    for (const s of [-1, 1]) {
      sca(b, 0.01, stH, 0.01, ri, s * 0.0425, 0.09 + stH / 2, D + 0.02)
      const g2 = sca(b, 0.01, Ls, 0.01, ri, s * 0.0425, (y0 + yb) / 2, (rz(y0) + rz(yb)) / 2 + 0.007); g2.rotation.x = -ang
    }
    tondo(b, 1, 0.012, ri, 0, yb + 0.012, 0, rx(yb + 0.012) + 0.003, rz(yb + 0.012) + 0.003)                  // l'orlo ricamato
  } else tondo(b, 1, 0.011, sc, 0, yb + 0.012, 0, rx(yb + 0.012) + 0.003, rz(yb + 0.012) + 0.003)
  // cappuccio calato: il collo e il sacco sulla schiena
  cil(b, W * 0.82, W * 0.9, 0.075, sc, 0, T - 0.018, 0, 12, (D + 0.036) / (W * 0.9))
  const cz = -(D + 0.05)
  sfe(b, W * 0.82, 0.1, 0.08, sc, 0, T - 0.07, cz, 9)
  const punta = cil(b, 0.01, W * 0.5, 0.13, sc, 0, T - 0.17, cz - 0.006, 7, 0.75); punta.rotation.x = 0.1
  if (P >= 3) tondo(b, 1, 0.011, ri, 0, T - 0.07, cz + 0.002, W * 0.78, 0.075).rotation.x = Math.PI / 2 - 0.05
  // maniche larghe
  R.br.forEach((r, i) => {
    const s = i ? 1 : -1
    cil(r, mR + 0.022, mR + 0.052, 0.21, to, 0, -0.105, 0, 10)
    cil(r, mR + 0.057, mR + 0.057, 0.036, P >= 2 ? ri : sc, 0, -0.205, 0, 10)
    if (P >= 3) cil(r, mR + 0.05, mR + 0.05, 0.012, ri, 0, -0.14, 0, 10)
  })
  if (P >= 3) {                                                                                                  // un fregio dorato sul petto e rombi sulla gonna
    pezzo(b, stellaGeo(), ri, 0, T * 0.64, D + 0.0205, 0.04, 0.04, 0.006)
    for (const dx of [-0.075, 0.075]) { const o = ott(b, 0.018, ri, dx, (y0 + yb) / 2 + 0.005, rz((y0 + yb) / 2) + 0.012, 1, 1.5, 0.4); o.rotation.x = -ang }
  }
}

const COSTRUTTORI = { panciotto, corazza, manto, saio }

/** Veste l'eroe con l'armatura `tipo` di grado `pregio` (1..3); torna `togli()`. Una sola armatura per volta. */
export function vesti (eroe, tipo, pregio = 1) {
  const costruisci = COSTRUTTORI[tipo]
  if (!costruisci) throw new Error(`armatura sconosciuta: ${tipo}`)
  pregio = Math.max(1, Math.min(3, Math.round(pregio) || 1))
  const u = eroe.userData
  if (u.armatura) u.armatura.togli()
  const modo = tipo === 'manto' ? 'dorso' : 'completo'
  const nascosti = nascondi(eroe, modo, tipo === 'corazza')
  const m = misure(eroe, modo), radici = [], anim = []
  const rad = padre => { const g = new THREE.Group(); padre.add(g); radici.push(g); return g }
  const R = { bu: rad(u.busto), br: u.bracci.map(rad), gr: u.gambe.map(rad) }
  costruisci(m, R, pregio, anim)
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
  u.armatura = { tipo, pregio, togli }
  return togli
}
