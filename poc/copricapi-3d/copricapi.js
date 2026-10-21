// PoC: i copricapi indossabili dei quattro eroi (slot testa): elmi e cappelli dal più umile al raro, tutto in codice three.js.
// Si monta sul perno `testa` di un eroe di `poc/eroi-3d/eroi.js`; il copricapo di serie (`userData.copricapo`) si nasconde.
// Ogni pezzo è disegnato in «unità di testa» (R = 1, origine al centro della testa, +z davanti) e il gruppo è scalato su R dell'eroe:
// così la stessa forma sta bene sul nano (R .295) e sull'elfa (R .27). Gli eroi coi capelli (elfa, mago) hanno una chioma più larga
// della testa: i cappelli che la lasciano vedere si allargano in x e z (`ctx.k`); gli elmi la nascondono (`userData.capelli`).
// Contratto: `copri(eroe, id)` → togli(); `eroe.userData.animaCopricapo(t)` anima piuma, gemma, luce. Autonomo: solo three e M di eroi.js.
import * as THREE from 'three'
import { M } from '../eroi-3d/eroi.js'

const DS = { side: THREE.DoubleSide }
const mat = (c, o = {}) => M(c, { ...DS, ...o })
const met = (c, o = {}) => M(c, { metalness: 0.5, roughness: 0.38, ...DS, ...o })
/** Un materiale che brilla, UNICO per l'oggetto (si anima senza toccare gli altri). */
const luceUnica = (c, f = 0.8) => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: f, roughness: 0.4, flatShading: true })

const geo = new Map()
const G = (k, f) => { if (!geo.has(k)) geo.set(k, f()); return geo.get(k) }
function pz (g, geometria, m, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1) {
  const o = new THREE.Mesh(geometria, m); o.position.set(x, y, z); o.scale.set(sx, sy, sz); o.castShadow = o.receiveShadow = true; g.add(o); return o
}
const sf = (g, r, m, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1, seg = 8) => pz(g, G(`s${r},${seg}`, () => new THREE.SphereGeometry(r, seg, Math.max(5, seg * 0.7 | 0))), m, x, y, z, sx, sy, sz)
const cl = (g, rs, ri, h, m, x = 0, y = 0, z = 0, seg = 14) => pz(g, G(`c${rs},${ri},${h},${seg}`, () => new THREE.CylinderGeometry(rs, ri, h, seg)), m, x, y, z)
const sc = (g, w, h, d, m, x = 0, y = 0, z = 0) => pz(g, G(`b${w},${h},${d}`, () => new THREE.BoxGeometry(w, h, d)), m, x, y, z)
const cn = (g, r, h, m, x = 0, y = 0, z = 0, seg = 6) => pz(g, G(`n${r},${h},${seg}`, () => new THREE.ConeGeometry(r, h, seg)), m, x, y, z)
const gem = (g, r, m, x, y, z, sx = 1, sy = 1.4, sz = 1) => pz(g, G(`o${r}`, () => new THREE.OctahedronGeometry(r)), m, x, y, z, sx, sy, sz)
/** Un anello piatto (orizzontale) di raggio r (x) e rz (z), tubo t. */
const anello = (g, r, rz, t, m, y = 0, x = 0, z = 0, seg = 16) => { const o = pz(g, G(`t${t},${seg}`, () => new THREE.TorusGeometry(1, t, 4, seg)), m, x, y, z, r, rz, 1); o.rotation.x = Math.PI / 2; return o }
const perno = (g, x = 0, y = 0, z = 0) => { const p = new THREE.Group(); p.position.set(x, y, z); g.add(p); return p }
const SU = new THREE.Vector3(0, 1, 0)
function punta (g, a, b, r, m, seg = 5) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A)
  const o = cn(g, r, d.length(), m, 0, 0, 0, seg); o.position.copy(A).addScaledVector(d, 0.5); o.quaternion.setFromUnitVectors(SU, d.normalize()); return o
}
function tubo (g, a, b, r1, r2, m, seg = 7, tondo = true) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A)
  const o = cl(g, r2, r1, d.length(), m, 0, 0, 0, seg); o.position.copy(A).addScaledVector(d, 0.5); o.quaternion.setFromUnitVectors(SU, d.normalize())
  if (tondo) { sf(g, r1, m, ...A.toArray(), 1, 1, 1, 6); sf(g, r2, m, ...B.toArray(), 1, 1, 1, 6) }
  return o
}
/** Una cupola (parte alta di una sfera) fino all'angolo `th`; con `a` > 0 lascia aperto un varco davanti di ±a radianti. */
function cupola (g, m, { rx, ry, rz, y = 0, z = 0, th = 1.25, a = 0, th0 = 0, patch = false }) {
  const geom = G(`cu${th0},${th},${a},${patch}`, () => patch ? new THREE.SphereGeometry(1, 12, 8, Math.PI / 2 - a, 2 * a, th0, th - th0) : a ? new THREE.SphereGeometry(1, 16, 9, Math.PI / 2 + a, Math.PI * 2 - 2 * a, th0, th - th0) : new THREE.SphereGeometry(1, 16, 9, 0, Math.PI * 2, 0, th))
  return pz(g, geom, m, 0, y, z, rx, ry, rz)
}
/** Un profilo piatto in (z, y) — z in avanti — esteso di `sp` in x. */
function sagoma (punti, sp) {
  const s = new THREE.Shape(); punti.forEach(([z, y], i) => i ? s.lineTo(z, y) : s.moveTo(z, y))
  const g = new THREE.ExtrudeGeometry(s, { depth: sp, bevelEnabled: false }); g.translate(0, 0, -sp / 2); g.rotateY(-Math.PI / 2); return g
}
/** Un profilo piatto in (x, y) esteso di `sp` in z (ali, piume, foglie). */
function lamina (punti, sp) {
  const s = new THREE.Shape(); punti.forEach(([x, y], i) => i ? s.lineTo(x, y) : s.moveTo(x, y))
  const g = new THREE.ExtrudeGeometry(s, { depth: sp, bevelEnabled: false }); g.translate(0, 0, -sp / 2); return g
}
function stella (r, sp) {
  const s = new THREE.Shape()
  for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + i * Math.PI / 5, k = i % 2 ? r * 0.45 : r; i ? s.lineTo(Math.cos(a) * k, Math.sin(a) * k) : s.moveTo(Math.cos(a) * k, Math.sin(a) * k) }
  const g = new THREE.ExtrudeGeometry(s, { depth: sp, bevelEnabled: false }); g.translate(0, 0, -sp / 2); return g
}
/** Un bordo che segue la cupola aperta (±a) da th0 a th1: una fila di tubi sulla superficie. */
function bordoVarco (g, m, { rx, ry, rz, y = 0, z = 0, a, th0, th1, r = 0.05, n = 5, fuori = 1.0 }) {
  for (const s of [-1, 1]) {
    const P = i => { const th = th0 + (th1 - th0) * i / n; return [s * rx * fuori * Math.sin(a) * Math.sin(th), y + ry * fuori * Math.cos(th), z + rz * fuori * Math.cos(a) * Math.sin(th)] }
    for (let i = 0; i < n; i++) tubo(g, P(i), P(i + 1), r, r, m, 5, false)
  }
}
const PI = Math.PI
// palette
const CUOIO = 0x8a5a30, CUOIO_S = 0x5d3a1e, FERRO = 0x9aa3ae, FERRO_S = 0x5a626d, FERRO_L = 0xd3dce6, BRONZO = 0xb87439, ORO = 0xf0c24a, ORO_S = 0xc08a2c
const ROSSO = 0xc4382f, ROSSO_S = 0x8e2420, BIANCO = 0xf1ece0, AVORIO = 0xf0e6c6, BLU = 0x2f5fb0

// ══════════ gli elmi ══════════
function cuffia (g) {
  const cu = mat(CUOIO), cus = mat(CUOIO_S), oro = met(ORO_S)
  cupola(g, cu, { rx: 1.09, ry: 1.0, rz: 1.06, y: 0.02, th: 1.28 })
  anello(g, 1.075, 1.055, 0.07, cus, 0.3)                                                      // la fascia al bordo
  sf(g, 0.09, cus, 0, 1.03, 0, 1, 0.7, 1, 6)                                                    // il bottone in cima
  for (const a of [-0.9, 0.9]) { const p = perno(g, 0, 0.02, 0); p.rotation.y = a; sc(p, 0.03, 0.03, 0.34, cus, 0, 0.99, 0.0).rotation.x = 0 }
  sc(g, 0.16, 0.12, 0.05, oro, 0, 0.3, 1.075)                                                  // la fibbia
  sc(g, 0.95, 0.4, 0.07, cu, 0, 0.1, -1.06)                                                    // il paranuca
  sc(g, 0.97, 0.06, 0.09, cus, 0, -0.12, -1.06)
}
function calotta (g) {
  const fe = met(FERRO), fl = met(FERRO_L), br = met(BRONZO)
  cupola(g, fe, { rx: 1.12, ry: 1.05, rz: 1.1, y: 0.03, th: 1.25 })
  anello(g, 1.075, 1.07, 0.06, fl, 0.36)
  for (let i = 0; i < 10; i++) { const a = i * PI / 5 + 0.15; gem(g, 0.035, br, Math.sin(a) * 1.075, 0.36, Math.cos(a) * 1.07, 1, 1, 1) }   // i ribattini
  const cresta = pz(g, G('arcoCresta', () => new THREE.TorusGeometry(1, 0.04, 5, 14, PI)), fl, 0, 0.03, 0, 1.11, 1.05, 1.11); cresta.rotation.y = PI / 2   // la nervatura
  cn(g, 0.07, 0.16, br, 0, 1.12, 0, 5)
}
function nasale (g) {
  const fe = met(FERRO), fl = met(FERRO_L), br = met(BRONZO), cus = mat(FERRO_S)
  cupola(g, fe, { rx: 1.1, ry: 1.2, rz: 1.08, y: 0.0, th: 1.22 })
  anello(g, 1.045, 1.03, 0.065, br, 0.4)
  sc(g, 0.12, 0.7, 0.07, fl, 0, 0.13, 1.06)                                                    // il nasale
  sc(g, 0.2, 0.07, 0.08, br, 0, 0.44, 1.06)
  const maglia = G('maglia', () => new THREE.CylinderGeometry(1.1, 0.95, 0.85, 12, 1, true, PI - 1.35, 2.7))
  pz(g, maglia, mat(FERRO_S, { metalness: 0.4 }), 0, -0.1, 0)                                  // il paranuca di maglia
  cn(g, 0.06, 0.2, br, 0, 1.22, 0, 5)
}
function paragnatici (g, ctx) {
  const fe = met(FERRO), fl = met(FERRO_L), oro = met(ORO), ro = mat(ROSSO), ros = mat(ROSSO_S)
  cupola(g, fe, { rx: 1.12, ry: 1.05, rz: 1.1, y: 0.03, th: 1.25 })
  anello(g, 1.08, 1.07, 0.07, oro, 0.37)
  const zd = ctx.chiave === 'elfa' ? 0.15 : -0.3                                                // i paragnatici lasciano fuori l'orecchio lungo
  const placca = G('placca' + zd, () => sagoma([[0.5, 0.36], [0.55, -0.05], [0.28, -0.5], [zd + 0.1, -0.5], [zd, -0.1], [zd, 0.36]], 0.08))
  for (const s of [-1, 1]) { pz(g, placca, fe, s * 1.07, 0, 0); sc(g, 0.1, 0.05, 0.5, oro, s * 1.07, -0.5, 0.2 + zd / 2 - 0.1) }
  const cresta = pz(g, G('arcoC2', () => new THREE.TorusGeometry(1, 0.05, 5, 14, PI)), fl, 0, 0.03, 0, 1.11, 1.06, 1.11); cresta.rotation.y = PI / 2
  cl(g, 0.12, 0.16, 0.12, oro, 0, 1.12, 0, 8)
  const cim = perno(g, 0, 1.2, 0)
  pz(cim, G('cimiero', () => sagoma([[0.5, 0.02], [0.42, 0.25], [0.2, 0.5], [-0.15, 0.62], [-0.55, 0.55], [-0.9, 0.3], [-1.25, -0.2], [-1.45, -0.7], [-1.1, -0.65], [-0.8, -0.3], [-0.4, -0.05], [0, -0.04]], 0.16)), ro, 0, 0, 0)
  pz(cim, G('cimiero2', () => sagoma([[0.3, 0.04], [0.1, 0.4], [-0.3, 0.5], [-0.7, 0.32], [-0.3, 0.0]], 0.2)), ros, 0, 0.01, 0)
  return t => { cim.rotation.x = 0.07 * Math.sin(t * 2.1); cim.rotation.z = 0.03 * Math.sin(t * 1.5) }
}
function alato (g, ctx) {
  const fe = met(FERRO_L), oro = met(ORO), bi = mat(BIANCO), bis = mat(0xcfd6e2)
  cupola(g, fe, { rx: 1.12, ry: 1.05, rz: 1.1, y: 0.03, th: 1.25 })
  anello(g, 1.08, 1.07, 0.07, oro, 0.37)
  cn(g, 0.08, 0.2, oro, 0, 1.15, 0, 5)
  const ala = G('ala', () => lamina([[0, -0.12], [0.55, -0.02], [0.85, 0.18], [0.6, 0.2], [0.98, 0.46], [0.66, 0.44], [0.92, 0.78], [0.5, 0.64], [0.62, 1.05], [0.2, 0.7], [0, 0.35]], 0.08))
  const ala2 = G('ala2', () => lamina([[0, 0], [0.4, 0.1], [0.62, 0.36], [0.34, 0.34], [0.5, 0.6], [0.16, 0.5], [0, 0.3]], 0.06))
  const ali = [-1, 1].map(s => {
    const p = perno(g, s * 1.1, 0.28, -0.1); p.rotation.set(0, -s * 0.35, -s * 0.25)
    const a = pz(p, ala, bi, 0, 0, 0); const b = pz(p, ala2, bis, 0, 0.02, 0.07); if (s < 0) { a.scale.x = -1; b.scale.x = -1 }
    sf(p, 0.1, oro, 0, 0, 0, 1, 1, 1, 6)
    return p
  })
  return t => { ali.forEach((p, i) => { p.rotation.z = (i ? 1 : -1) * (0.25 + 0.06 * Math.sin(t * 2.2)) }) }
}
function cornuto (g) {
  const fe = met(0x6f6c6a), br = met(BRONZO), av = mat(AVORIO), ra = met(0xd68a48)
  cupola(g, fe, { rx: 1.12, ry: 1.05, rz: 1.1, y: 0.03, th: 1.25 })
  anello(g, 1.08, 1.07, 0.09, br, 0.37)
  for (let i = -2; i <= 2; i++) { const a = i * 0.5; gem(g, 0.05, ra, Math.sin(a) * 1.095, 0.37, Math.cos(a) * 1.085, 1, 1, 1) }
  sc(g, 0.1, 0.16, 0.8, ra, 0, 1.06, 0)
  for (const s of [-1, 1]) {
    const c = perno(g, s * 1.06, 0.55, 0.0)
    const pts = [[0, 0, 0], [s * 0.34, 0.1, 0.0], [s * 0.6, 0.42, 0.05], [s * 0.62, 0.84, 0.16]]
    for (let i = 0; i < 3; i++) tubo(c, pts[i], pts[i + 1], 0.17 - i * 0.04, 0.14 - i * 0.045, av, 6, false)
    punta(c, pts[3], [s * 0.55, 1.28, 0.3], 0.09, av, 6)
    sf(c, 0.19, ra, 0, 0, 0, 1, 1, 1, 6); sf(c, 0.15, av, s * 0.34, 0.1, 0, 1, 1, 1, 6); sf(c, 0.11, av, s * 0.6, 0.42, 0.05, 1, 1, 1, 6)
  }
}
function grandeElmo (g) {
  const fe = met(0xb2bcc8), fl = met(FERRO_L), oro = met(ORO), blu = mat(BLU), bi = mat(BIANCO), nero = mat(0x14161b)
  const P = { rx: 1.16, ry: 1.12, rz: 1.14, y: -0.02, a: 0.78 }
  cupola(g, fe, { ...P, th: 2.15 })
  bordoVarco(g, oro, { ...P, th0: 0.15, th1: 2.15, r: 0.045, n: 4, fuori: 1.01 })
  anello(g, 1.0, 0.98, 0.05, oro, 0.52)
  const vis = perno(g, 0, 0, 0)                                                                  // la visiera, alzata sulla fronte
  cupola(vis, fl, { rx: 1.24, ry: 1.2, rz: 1.22, y: -0.02, th0: 0.85, th: 1.75, a: 0.85, patch: true })
  vis.rotation.x = -1.0
  sf(vis, 0.1, oro, 0, 0.08, 1.27, 1, 1, 0.6, 6)
  for (const dy of [0.0, 0.2]) sc(vis, 0.12, 0.05, 0.03, nero, 0, dy, 1.225)                    // le feritoie
  for (const s of [-1, 1]) gem(g, 0.09, oro, s * 1.17, 0.2, 0.0, 1, 1, 1)                       // i perni della visiera
  cl(g, 0.17, 0.2, 0.16, oro, 0, 1.13, 0, 8)
  const pen = perno(g, 0, 1.2, 0)
  for (let i = 0; i < 4; i++) { const p = perno(pen, 0, 0, 0); p.rotation.x = 0.1 + i * 0.28 - 0.4; gem(p, 0.14, i % 2 ? bi : blu, 0, 0.3 + i * 0.03, 0, 1, 2.2 - i * 0.2, 1.1 - i * 0.1) }
  return t => { pen.rotation.x = 0.06 * Math.sin(t * 2.0) }
}
function leggendario (g) {
  const oro = met(ORO, { metalness: 0.6, roughness: 0.25 }), oros = met(ORO_S), bi = luceUnica(0xfff3b0, 0.9), rg = luceUnica(0xff4a62, 0.8)
  cupola(g, oro, { rx: 1.14, ry: 1.07, rz: 1.12, y: 0.03, th: 1.3 })
  anello(g, 1.1, 1.08, 0.08, oros, 0.34)
  const pl = G('guanciaO', () => sagoma([[0.5, 0.3], [0.58, -0.1], [0.3, -0.55], [-0.05, -0.5], [-0.12, 0.3]], 0.08))
  for (const s of [-1, 1]) pz(g, pl, oro, s * 1.1, 0, 0)
  pz(g, G('finO', () => sagoma([[0.55, 0.0], [0.4, 0.4], [0.0, 0.7], [-0.4, 0.5], [-0.8, 0.05], [-0.4, 0.0]], 0.12)), oros, 0, 1.0, 0)
  const raggi = []
  for (let i = -3; i <= 3; i++) { const a = i * 0.36; const p = perno(g, Math.sin(a) * 1.0, 0.5 + 0.0, Math.cos(a) * 1.03); p.rotation.y = a; p.rotation.x = -0.25; const c = cn(p, 0.07, 0.4, luceUnica(0xffe58a, 0.6), 0, 0.2, 0, 4); raggi.push(c) }
  const gm = gem(g, 0.12, rg, 0, 0.4, 1.12, 1, 1.5, 0.8)
  const alone = anello(g, 0.95, 0.95, 0.025, luceUnica(0xfff0a0, 1.0), 1.65)
  const orbe = sf(g, 0.12, bi, 0, 1.18, 0, 1, 1, 1, 8)
  return t => { const p = 0.5 + 0.5 * Math.sin(t * 2.4); gm.material.emissiveIntensity = 0.5 + 0.9 * p; gm.scale.setScalar(0.9 + 0.2 * p); alone.rotation.z = t * 0.6; alone.position.y = 1.65 + 0.03 * Math.sin(t * 1.7); bi.emissiveIntensity = 0.7 + 0.4 * p }
}

// ══════════ cappelli e cappucci ══════════
function cappuccio (g) {
  const st = mat(0x5f7a3f), sts = mat(0x44592c), cu = mat(CUOIO_S)
  const P = { rx: 1.14, ry: 1.1, rz: 1.14, y: 0.0, a: 1.0 }
  cupola(g, st, { ...P, th: 2.05 })
  bordoVarco(g, sts, { ...P, th0: 0.25, th1: 2.05, r: 0.075, n: 6, fuori: 1.0 })
  punta(g, [0, 0.55, -1.0], [0, -0.1, -1.95], 0.42, st, 6)                                       // la punta che ricade dietro
  sf(g, 0.07, cu, 0, 0.26, -1.9, 1, 1, 1, 5)
  for (const s of [-1, 1]) sc(g, 0.14, 0.08, 0.06, cu, s * 0.96, -0.32, 0.55).rotation.y = s * 0.9
}
function feltro (g) {
  const fe = mat(0x7a5a3a), fs = mat(0x5d4128), ro = mat(0xa8342a), ver = mat(0x3f9150), ver2 = mat(0xa3d67a)
  cl(g, 1.0, 1.7, 0.14, fe, 0, 0.5, 0, 20).scale.set(1, 1, 1)
  cl(g, 0.72, 0.97, 0.62, fe, 0, 0.88, 0, 16)
  cl(g, 0.74, 0.74, 0.04, fs, 0, 1.2, 0, 16).scale.set(1, 1, 1)
  sc(g, 0.16, 0.05, 1.2, fs, 0, 1.225, 0)
  cl(g, 0.99, 1.0, 0.16, ro, 0, 0.67, 0, 16)
  const piuma = perno(g, 0.55, 0.7, 0.72); piuma.rotation.set(-0.2, -0.4, -0.55)
  const fp = pz(piuma, G('piuma', () => lamina([[0, 0], [0.12, 0.3], [0.2, 0.7], [0.17, 1.1], [0.05, 1.5], [-0.08, 1.2], [-0.16, 0.7], [-0.1, 0.25]], 0.05)), ver, 0, 0, 0)
  pz(piuma, G('piuma2', () => lamina([[0, 0.05], [0.04, 0.5], [0.03, 1.2], [-0.02, 0.5]], 0.07)), ver2, 0, 0, 0)
  return t => { piuma.rotation.z = -0.55 + 0.08 * Math.sin(t * 2.3); piuma.rotation.x = -0.2 + 0.05 * Math.sin(t * 1.7) }
}
function apprendista (g) {
  const bl = mat(0x5b6fb0), bls = mat(0x435392), crema = mat(0xe9d3a0)
  cl(g, 1.0, 1.35, 0.06, bl, 0, 0.5, 0, 20)
  cl(g, 0.62, 0.99, 0.7, bl, 0, 0.88, 0, 14)
  cl(g, 0.995, 1.0, 0.14, bls, 0, 0.6, 0, 14)
  const piega = perno(g, 0, 1.23, 0); piega.rotation.x = -0.3
  cl(piega, 0.2, 0.62, 0.7, bl, 0, 0.3, 0, 12)
  const p2 = perno(piega, 0, 0.64, 0); p2.rotation.x = -0.6
  cl(p2, 0.05, 0.2, 0.55, bl, 0, 0.25, 0, 8); sf(p2, 0.07, crema, 0, 0.55, 0, 1, 1, 1, 6)
  return t => { p2.rotation.x = -0.6 + 0.1 * Math.sin(t * 1.9) }
}
function stellato (g) {
  const vi = mat(0x40318e), vis = mat(0x2e2368), oro = met(ORO), st = G('stellaC', () => stella(0.17, 0.03)), sl = luceUnica(0xffd54a, 0.55)
  cl(g, 1.0, 1.85, 0.12, vi, 0, 0.52, 0, 22)
  cl(g, 0.55, 0.98, 0.8, vi, 0, 0.94, 0, 16)
  cl(g, 0.985, 1.0, 0.2, vis, 0, 0.62, 0, 16)
  sc(g, 0.3, 0.2, 0.06, oro, 0, 0.62, 1.02)
  const p1 = perno(g, 0, 1.3, 0); p1.rotation.x = -0.3
  cl(p1, 0.18, 0.55, 0.75, vi, 0, 0.3, 0, 12)
  const p2 = perno(p1, 0, 0.66, 0); p2.rotation.x = -0.9
  cl(p2, 0.03, 0.18, 0.55, vi, 0, 0.24, 0, 8)
  const p3 = perno(p2, 0, 0.5, 0); p3.rotation.x = -0.7
  pz(p3, G('stellaT', () => stella(0.17, 0.04)), sl, 0, 0.12, 0)
  for (const [a, y, k] of [[0.55, 0.0, 1], [-0.5, 0.12, 0.9], [1.4, 0.1, 0.8], [-1.5, -0.05, 0.9], [2.5, 0.02, 0.8], [-2.6, 0.1, 0.8]]) {
    const q = perno(g, 0, 0.64 + y + 0.3, 0), r = 0.99 - 0.43 * ((0.3 + y) / 0.8) * 0.5; q.rotation.y = a
    const s = pz(q, st, sl, 0, 0, r + 0.02, k, k, 1); s.rotation.x = -0.4
  }
  return t => { p2.rotation.x = -0.9 + 0.1 * Math.sin(t * 1.8); p3.rotation.x = -0.7 + 0.15 * Math.sin(t * 2.4 + 1) }
}
function arcano (g) {
  const nero = mat(0x241a52), neros = mat(0x171036), oro = met(ORO), ci = luceUnica(0x58e0ff, 0.9), vio = luceUnica(0xc07cff, 0.9), rune = luceUnica(0xffd54a, 0.8)
  cl(g, 1.0, 1.55, 0.1, nero, 0, 0.52, 0, 18)
  anello(g, 1.55, 1.55, 0.05, oro, 0.51, 0, 0, 16)
  cl(g, 0.5, 0.98, 0.95, nero, 0, 1.0, 0, 16)
  cl(g, 0.985, 1.0, 0.22, neros, 0, 0.64, 0, 16)
  anello(g, 1.0, 1.0, 0.04, oro, 0.75)
  anello(g, 1.0, 1.0, 0.04, oro, 0.53)
  const p1 = perno(g, 0, 1.45, 0); p1.rotation.x = -0.15
  cl(p1, 0.16, 0.5, 0.9, nero, 0, 0.4, 0, 12)
  const p2 = perno(p1, 0, 0.84, 0); p2.rotation.x = 0.35
  cl(p2, 0.04, 0.17, 0.6, nero, 0, 0.28, 0, 8)
  const gm = gem(g, 0.17, ci, 0, 0.64, 1.03, 1, 1.5, 0.8)
  for (let i = 0; i < 10; i++) { const a = i * PI / 5 + 0.3; const r = sc(g, 0.07, 0.025, 0.1, rune, Math.sin(a) * 1.38, 0.565, Math.cos(a) * 1.38); r.rotation.y = a }
  const orbe = gem(p2, 0.12, vio, 0, 0.66, 0, 1, 1, 1)
  const sc2 = [0, 1, 2].map(i => gem(g, 0.05, i ? ci : vio, 0, 2.3, 0, 1, 1, 1))
  return t => {
    const p = 0.5 + 0.5 * Math.sin(t * 2.6); gm.material.emissiveIntensity = 0.4 + 1.0 * p; gm.scale.setScalar(0.9 + 0.2 * p); vio.emissiveIntensity = 0.5 + 0.8 * (1 - p)
    p2.rotation.x = 0.35 + 0.08 * Math.sin(t * 1.6)
    sc2.forEach((o, i) => { const a = t * 1.4 + i * 2.094; o.position.set(Math.sin(a) * 0.4, 2.2 + 0.1 * Math.sin(a * 2), Math.cos(a) * 0.4) })
  }
}
function coronaFoglie (g) {
  const rm = mat(0x6a4a2a), v1 = mat(0x3f9150), v2 = mat(0x86c767), fior = luceUnica(0xf4a6c0, 0.3), cen = luceUnica(0xffd54a, 0.4)
  anello(g, 0.94, 0.9, 0.06, rm, 0.58)
  const fo = G('foglia', () => new THREE.IcosahedronGeometry(0.17, 0))
  const N = 15
  for (let i = 0; i < N; i++) {
    const a = i * PI * 2 / N + 0.1, p = perno(g, Math.sin(a) * 0.95, 0.58, Math.cos(a) * 0.91); p.rotation.y = a
    const f = pz(p, fo, i % 2 ? v1 : v2, 0, 0.09 + (i % 3) * 0.03, 0.05, 0.55, 0.25, 1.5); f.rotation.x = -0.9 - (i % 2) * 0.3
    if (i % 5 === 0) gem(p, 0.05, luceUnica(0xff6a7a, 0.3), 0.07, 0.04, 0.15, 1, 1, 1)
  }
  for (const [a, k] of [[0, 1.0], [0.55, 0.8], [-0.55, 0.8]]) {
    const p = perno(g, Math.sin(a) * 0.97, 0.66, Math.cos(a) * 0.93); p.rotation.y = a
    for (let j = 0; j < 5; j++) { const q = perno(p, 0, 0, 0); q.rotation.z = j * PI * 2 / 5; gem(q, 0.06 * k, fior, 0, 0.08 * k, 0.04, 1, 1.5, 0.5) }
    gem(p, 0.045 * k, cen, 0, 0, 0.07, 1, 1, 1)
  }
}
function diadema (g) {
  const oro = met(ORO, { metalness: 0.6, roughness: 0.25 }), oros = met(ORO_S), rg = luceUnica(0xff4a62, 0.35), zz = luceUnica(0x58a8ff, 0.3), vd = luceUnica(0x3bd186, 0.3)
  anello(g, 0.95, 0.92, 0.065, oro, 0.55)
  const N = 9, gemme = []
  for (let i = 0; i < N; i++) {
    const a = (i - (N - 1) / 2) * 0.42, alto = 0.36 - Math.abs(i - 4) * 0.045, p = perno(g, Math.sin(a) * 0.95, 0.55, Math.cos(a) * 0.92); p.rotation.y = a
    cn(p, 0.075, alto, oro, 0, alto / 2, 0, 4)
    if (i % 2 === 0) sf(p, 0.04, oros, 0, alto, 0, 1, 1, 1, 5)
  }
  const col = [rg, zz, vd]
  for (let i = -2; i <= 2; i++) { const a = i * 0.34, p = perno(g, Math.sin(a) * 0.97, 0.55, Math.cos(a) * 0.94); p.rotation.y = a; gemme.push(gem(p, i === 0 ? 0.1 : 0.065, col[Math.abs(i) % 3 === 0 ? 0 : (i < 0 ? 1 : 2)], 0, 0, 0.03, 1, 1.4, 0.6)) }
  const pend = gem(g, 0.075, rg, 0, 0.33, 1.0, 1, 1.5, 0.6)
  return t => { const p = 0.5 + 0.5 * Math.sin(t * 2.2); rg.emissiveIntensity = 0.3 + 0.5 * p }
}
function fascia (g) {
  const ro = mat(0xb8362e), ros = mat(0x8e2420), oro = met(ORO)
  const b = cl(g, 0.9, 0.94, 0.26, ro, 0, 0.55, 0, 18); b.scale.set(1, 1, 0.97)
  const f = cl(g, 0.915, 0.955, 0.05, oro, 0, 0.6, 0, 18); f.scale.set(1, 1, 0.97)
  sf(g, 0.14, ros, 0, 0.55, -0.97, 1, 1, 0.8, 6)
  const code = [-1, 1].map(s => {
    const p = perno(g, s * 0.07, 0.55, -1.0); p.rotation.set(0.1, 0, s * 0.18)
    sc(p, 0.16, 0.7, 0.04, ros, 0, -0.37, -0.05); sc(p, 0.16, 0.06, 0.05, oro, 0, -0.65, -0.05)
    return p
  })
  return t => { code.forEach((p, i) => { p.rotation.x = 0.1 + 0.18 * Math.sin(t * 2.4 + i * 1.2); p.rotation.z = (i ? 1 : -1) * 0.18 + 0.08 * Math.sin(t * 1.8 + i) }) }
}

export const CATALOGO_TESTA = [
  { id: 'cuffia-cuoio', nome: 'Cuffia di cuoio', classe: 'elmo', grado: 1, capelli: false, fa: cuffia },
  { id: 'elmo-calotta', nome: 'Elmo a calotta', classe: 'elmo', grado: 2, capelli: false, fa: calotta },
  { id: 'elmo-nasale', nome: 'Elmo col nasale', classe: 'elmo', grado: 3, capelli: false, fa: nasale },
  { id: 'elmo-paragnatici', nome: 'Elmo coi paragnatici', classe: 'elmo', grado: 4, capelli: false, fa: paragnatici },
  { id: 'elmo-alato', nome: 'Elmo alato', classe: 'elmo', grado: 5, elemento: 'aria', capelli: false, fa: alato },
  { id: 'elmo-cornuto', nome: 'Elmo a corna', classe: 'elmo', grado: 6, capelli: false, fa: cornuto },
  { id: 'grande-elmo', nome: 'Grande elmo da cavaliere', classe: 'elmo', grado: 8, capelli: false, fa: grandeElmo },
  { id: 'elmo-leggendario', nome: 'Elmo del re dorato', classe: 'elmo', grado: 10, elemento: 'luce', capelli: false, fa: leggendario },
  { id: 'cappuccio', nome: 'Cappuccio di stoffa', classe: 'cappello', grado: 1, capelli: false, fa: cappuccio },
  { id: 'fascia', nome: 'Fascia', classe: 'cappello', grado: 1, capelli: true, fa: fascia },
  { id: 'cappello-feltro', nome: 'Cappello di feltro con piuma', classe: 'cappello', grado: 3, capelli: true, fa: feltro },
  { id: 'cappello-apprendista', nome: 'Cappello da apprendista', classe: 'cappello', grado: 4, capelli: true, fa: apprendista },
  { id: 'corona-foglie', nome: 'Corona di foglie', classe: 'cappello', grado: 5, elemento: 'natura', capelli: true, fa: coronaFoglie },
  { id: 'cappello-stellato', nome: 'Cappello stellato', classe: 'cappello', grado: 6, capelli: true, fa: stellato },
  { id: 'diadema', nome: 'Diadema d\'oro', classe: 'cappello', grado: 8, capelli: true, fa: diadema },
  { id: 'cappello-arcano', nome: 'Cappello arcano', classe: 'cappello', grado: 9, elemento: 'arcano', capelli: true, fa: arcano }
]

/** Monta il copricapo `id` sulla testa dell'eroe, nascondendo quello di serie. Ritorna `togli()`. */
export function copri (eroe, id) {
  const def = CATALOGO_TESTA.find(d => d.id === id)
  if (!def) throw new Error(`copricapo sconosciuto: ${id}`)
  const u = eroe.userData
  if (u.copricapoMontato) u.copricapoMontato.togli()
  const serie = u.copricapo, chioma = u.capelli
  if (serie) serie.visible = false
  if (chioma) chioma.visible = !!def.capelli
  const k = def.capelli && chioma ? 1.12 : 1.0
  const g = new THREE.Group(); g.position.set(0, u.cy, 0); g.scale.set(u.R * k, u.R, u.R * k); u.testa.add(g)
  const anima = def.fa(g, { chiave: u.chiave, R: u.R, k })
  g.userData.triangoli = contaTriangoli(g)
  u.animaCopricapo = anima || null
  const togli = () => {
    u.testa.remove(g); if (serie) serie.visible = true; if (chioma) chioma.visible = true
    u.animaCopricapo = null; u.copricapoMontato = null
  }
  u.copricapoMontato = { id, def, gruppo: g, togli }
  return togli
}
export function contaTriangoli (o) {
  let n = 0; o.traverse(m => { if (m.isMesh) n += (m.geometry.index ? m.geometry.index.count : m.geometry.attributes.position.count) / 3 })
  return Math.round(n)
}
