// Le forme degli oggetti di scena fuori dalle città: lapidi e cripte, archi spezzati, menhir, tronchi e funghi giganti, palafitte,
// fumarole, carrelli da miniera, accampamenti, cartelli... e quel che sta attorno agli ingressi dei dungeon. Dove stanno lo decide
// props-dove.js. Ogni forma si posa nel cantiere del pezzo (kit.js) in coordinate locali (davanti verso +z, il suolo a y = 0), con
// poche facce (cilindri a 5–8 lati, scatole, icosaedri senza suddivisioni) e solo i materiali che i pezzi hanno già (pietra, legno,
// liscio; luce solo dove brilla): niente chiamate in più per oggetto. Il caso di ogni oggetto viene dal suo seme.
import { SphereGeometry, ConeGeometry, IcosahedronGeometry, OctahedronGeometry, TorusGeometry, CircleGeometry } from 'three'
import { scatola, cilindro, triangolo } from './kit.js'
import { caso } from './suolo.js'
import { propsDelPezzo, quotaProp } from './props-dove.js'

const P = 'pietra', L = 'legno', X = 'liscio', LU = 'luce'
const PI = Math.PI
const GRIGIO = [0.72, 0.72, 0.7], GRIGIO_S = [0.5, 0.5, 0.5], MUSCHIO = [0.4, 0.56, 0.3], TERRA = [0.42, 0.33, 0.25], OSSO = [0.92, 0.89, 0.8]
const FERRO = [0.27, 0.27, 0.3], RUGGINE = [0.4, 0.27, 0.2], LEGNO = [0.62, 0.46, 0.33], LEGNO_S = [0.4, 0.3, 0.22], BRUCIATO = [0.13, 0.11, 0.1]
const PAGLIA = [0.86, 0.76, 0.5], BUIO = [0.04, 0.035, 0.04], ERBA = [0.45, 0.62, 0.32], MARCIO = [0.43, 0.37, 0.31]
const scegli = (r, l) => l[Math.floor(r() * l.length)]
const tinta = (c, k) => [c[0] * k, c[1] * k, c[2] * k]
const ico = (r, det = 0) => new IcosahedronGeometry(r, det)
const sfera = (r, a = 6, b = 4) => new SphereGeometry(r, a, b)
const disco = (r, n = 8) => new CircleGeometry(r, n).rotateX(-PI / 2)

// ── piccoli pezzi ──
function lapide(c, x, z, h, lean, col, ry = 0) {
  c.metti(P, scatola(0.46, h, 0.12, 1), x, h / 2, z, col, { rz: lean, ry })
  c.metti(P, cilindro(0.23, 0.23, 0.12, 6, 1), x - Math.sin(lean) * h / 2, h / 2 + Math.cos(lean) * h / 2, z, col, { rx: PI / 2, rz: lean, ry })
}
function croce(c, x, z, lean, mat = P, col = GRIGIO, h = 0.95) {
  c.metti(mat, scatola(0.1, h, 0.1, 1), x, h / 2, z, col, { rz: lean })
  c.metti(mat, scatola(0.46, 0.1, 0.1, 1), x - Math.sin(lean) * h * 0.3, h * 0.72, z, col, { rz: lean })
}
function menhirAt(c, r, x, z, h, ry = 0) {
  const l = (r() - 0.5) * 0.22, v = 0.8 + r() * 0.25
  c.metti(P, cilindro(0.17, 0.3, h, 5, 1), x, h / 2, z, tinta(GRIGIO_S, v), { rz: l, ry })
  c.metti(P, new ConeGeometry(0.17, 0.26, 5), x - Math.sin(l) * (h / 2 + 0.12), h / 2 + Math.cos(l) * (h / 2 + 0.12), z, tinta(GRIGIO_S, v * 0.95), { rz: l, ry })
  if (r() < 0.6) c.metti(X, ico(0.13), x + 0.18, 0.05, z + 0.12, MUSCHIO, { s: [1.3, 0.55, 1] })
}
function falde(c, w, d, y, alto, col, mat = X) {
  const m2 = d / 2, a = Math.atan2(alto, m2), L2 = Math.hypot(m2, alto)
  for (const s of [-1, 1]) c.metti(mat, scatola(w + 0.1, 0.06, L2 + 0.04, 1.4), 0, y + alto / 2, s * m2 / 2, col, { rx: s * a })
  for (const s of [-1, 1]) c.metti(P, triangolo([s * w / 2 * 0.99, y, -d / 2], [s * w / 2 * 0.99, y, d / 2], [s * w / 2 * 0.99, y + alto, 0]), 0, 0, 0, tinta(col, 0.85))
}
// la ragnatela: raggi e anelli sottili, a due facce, in un piano verticale (x, y), centrata in (cx, cy, cz)
function ragnatela(c, cx, cy, cz, R, ch = [0.93, 0.94, 0.97]) {
  const n = 8, pt = (a, f) => [cx + Math.cos(a) * R * f, cy + Math.sin(a) * R * f * 0.85, cz]
  for (let i = 0; i < n; i++) {
    const a = i * PI * 2 / n + 0.2, t = pt(a, 1), w = 0.022
    c.metti(X, triangolo([cx, cy, cz], [t[0] - Math.sin(a) * w, t[1] + Math.cos(a) * w, cz], [t[0] + Math.sin(a) * w, t[1] - Math.cos(a) * w, cz]), 0, 0, 0, ch)
  }
  for (const f of [0.38, 0.68, 0.98]) for (let i = 0; i < n; i++) {
    const a = i * PI * 2 / n + 0.2, b = (i + 1) * PI * 2 / n + 0.2, A = pt(a, f), B = pt(b, f), A2 = pt(a, f - 0.07), B2 = pt(b, f - 0.07)
    c.metti(X, triangolo(A, B, B2), 0, 0, 0, ch); c.metti(X, triangolo(A, B2, A2), 0, 0, 0, ch)
  }
}
function palettoMorto(c, x, z, h, lean) {
  c.metti(L, cilindro(0.03, 0.055, h, 5, 1), x, h / 2, z, MARCIO, { rz: lean })
  c.metti(L, cilindro(0.02, 0.03, 0.5, 4, 1), x - Math.sin(lean) * h * 0.7 + 0.12, h * 0.7, z, MARCIO, { rz: lean - 1.0 })
}
function cranio(c, x, y, z, ry = 0, s = 1) {
  c.metti(X, sfera(0.12 * s, 6, 4), x, y, z, OSSO, { s: [1, 0.9, 1.1], ry })
  c.metti(X, scatola(0.12 * s, 0.05 * s, 0.11 * s), x + Math.sin(ry) * 0.05, y - 0.1 * s, z + Math.cos(ry) * 0.05, tinta(OSSO, 0.92), { ry })
  for (const e of [-1, 1]) c.metti(X, scatola(0.04 * s, 0.045 * s, 0.03 * s), x + Math.cos(ry) * e * 0.05 * s + Math.sin(ry) * 0.1 * s, y + 0.01, z - Math.sin(ry) * e * 0.05 * s + Math.cos(ry) * 0.1 * s, BUIO, { ry })
}

// ── il cimitero ──
function tomba(c, r) {
  const n = 3 + Math.floor(r() * 3), grigio = tinta(scegli(r, [GRIGIO, [0.62, 0.66, 0.62], [0.68, 0.66, 0.6]]), 0.95)
  for (let i = 0; i < n; i++) {
    const x = (i % 2 ? 0.55 : -0.55) + (r() - 0.5) * 0.25, z = -0.7 + Math.floor(i / 2) * 0.75 + (r() - 0.5) * 0.2, h = 0.5 + r() * 0.35
    if (r() < 0.3) croce(c, x, z, (r() - 0.5) * 0.3, P, grigio, h + 0.25); else lapide(c, x, z, h, (r() - 0.5) * 0.3, grigio, (r() - 0.5) * 0.4)
    c.metti(X, sfera(0.38, 6, 3), x, 0.02, z + 0.42, r() < 0.7 ? [0.34, 0.27, 0.2] : [0.36, 0.5, 0.27], { s: [1, 0.3, 1.7] })
  }
}
function cripta(c, r) {
  c.metti(P, scatola(1.9, 0.75, 1.4, 1.4), 0, 0.375, 0, [0.7, 0.7, 0.68])
  c.metti(P, scatola(2.05, 0.1, 1.55, 1.4), 0, 0.05, 0, GRIGIO_S)
  falde(c, 1.9, 1.4, 0.75, 0.45, [0.5, 0.5, 0.54], P)
  c.metti(X, scatola(0.55, 0.58, 0.04), 0, 0.33, 0.71, BUIO)
  c.metti(P, scatola(0.8, 0.08, 0.32, 1), 0, 0.04, 0.88, GRIGIO)
  c.metti(P, scatola(0.08, 0.34, 0.08), 0, 1.4, 0, GRIGIO); c.metti(P, scatola(0.24, 0.07, 0.08), 0, 1.5, 0, GRIGIO)
  for (const s of [-1, 1]) c.metti(X, ico(0.26), s * 1.0, 0.4, 0.72, MUSCHIO, { s: [1, 0.8, 0.5] })
  for (const s of [-1, 1]) c.metti(P, cilindro(0.1, 0.1, 0.5, 6, 1), s * 0.55, 0.28, 0.74, GRIGIO)
}
function cancello(c, r) {
  for (const s of [-1, 1]) {
    const h = s < 0 ? 1.55 : 1.0
    c.metti(P, scatola(0.32, h, 0.32, 1), s * 1.0, h / 2, 0, GRIGIO)
    c.metti(P, new ConeGeometry(0.26, 0.26, 4), s * 1.0, h + 0.13, 0, tinta(GRIGIO, 0.9), { ry: PI / 4, rz: s > 0 ? 0.25 : 0 })
  }
  c.metti(P, scatola(0.3, 0.28, 0.25, 1), 1.55, 0.14, 0.4, GRIGIO, { ry: 0.5, rz: 0.2 })
  // il battente caduto, appeso al cardine di sinistra, e le sbarre
  const th = -0.95, hx = -0.82, hy = 0.15, rot = (u, v) => [hx + u * Math.cos(th) - v * Math.sin(th), hy + u * Math.sin(th) + v * Math.cos(th)]
  for (let i = 0; i < 6; i++) { if (i === 3) continue; const [x, y] = rot(0.14 + i * 0.15, 0.5); c.metti(X, scatola(0.04, 0.95, 0.04), x, y, 0, RUGGINE, { rz: th + (i === 4 ? 0.2 : 0) }) }
  for (const v of [0.1, 0.85]) { const [x, y] = rot(0.5, v); c.metti(X, scatola(0.95, 0.05, 0.05), x, y, 0, FERRO, { rz: th }) }
  // due tratti di inferriata rimasti in piedi e un muretto
  for (let i = 0; i < 4; i++) c.metti(X, scatola(0.04, 0.8, 0.04), 1.5 + i * 0.2, 0.4, -0.05, FERRO, { rz: i === 3 ? 0.4 : 0 })
  c.metti(X, scatola(0.9, 0.05, 0.05), 1.85, 0.62, -0.05, FERRO)
  c.metti(P, scatola(1.0, 0.45, 0.25, 1.4), -1.8, 0.22, 0, GRIGIO_S); c.metti(X, ico(0.2), -1.6, 0.46, 0, MUSCHIO, { s: [1.3, 0.5, 0.8] })
}
// ── le rovine ──
function arcoRotto(c, r) {
  c.metti(P, scatola(0.36, 1.7, 0.36, 1.2), -1.0, 0.85, 0, [0.8, 0.78, 0.72])
  c.metti(P, scatola(0.36, 1.1, 0.36, 1.2), 1.0, 0.55, 0, [0.78, 0.76, 0.7])
  for (const t of [3.0, 2.62, 2.28, 1.98, 1.76]) c.metti(P, scatola(0.4, 0.3, 0.34, 1.2), Math.cos(t) * 1.0, 1.6 + Math.sin(t) * 1.0, 0, tinta([0.8, 0.78, 0.72], 0.9 + r() * 0.1), { rz: t + PI / 2 })
  c.metti(P, scatola(0.4, 0.3, 0.34, 1.2), 1.15, 1.2, 0, [0.76, 0.74, 0.7], { rz: 0.25 })
  for (const [x, z, a] of [[0.4, 0.7, 0.5], [0.9, 0.55, 2], [-0.3, 0.85, 1.1]]) c.metti(P, scatola(0.4, 0.3, 0.34, 1.2), x, 0.15, z, [0.74, 0.72, 0.68], { ry: a, rz: r() * 0.3 })
  c.metti(X, ico(0.22), -1.0, 1.75, 0, MUSCHIO, { s: [1, 0.5, 1] })
}
function colonnaRotta(c, r) {
  const h = 0.5 + r() * 0.7
  c.metti(P, scatola(0.6, 0.18, 0.6, 1.4), 0, 0.09, 0, [0.84, 0.82, 0.78])
  c.metti(P, cilindro(0.2, 0.22, h, 8, 1.4), 0, 0.18 + h / 2, 0, [0.86, 0.84, 0.8])
  for (const a of [0.2, 2.3, 4.1]) c.metti(P, scatola(0.14, 0.2, 0.1), Math.cos(a) * 0.15, 0.18 + h + 0.05, Math.sin(a) * 0.15, [0.82, 0.8, 0.76], { rz: r() * 0.5, ry: a })
  c.metti(P, cilindro(0.2, 0.2, 0.5, 8, 1.4), 0.75, 0.2, 0.3, [0.84, 0.82, 0.78], { rz: PI / 2, ry: 0.6 })
  c.metti(P, cilindro(0.2, 0.2, 0.4, 8, 1.4), 1.25, 0.2, -0.15, [0.82, 0.8, 0.76], { rz: PI / 2, ry: -0.3 })
  c.metti(P, scatola(0.5, 0.2, 0.5, 1.4), -0.7, 0.1, 0.5, [0.8, 0.78, 0.74], { ry: 0.5 })
  c.metti(X, ico(0.15), 0.1, 0.18 + h, 0.1, MUSCHIO, { s: [1.2, 0.5, 1] })
}
function muretto(c, r) {
  const n = 6
  for (let i = 0; i < n; i++) {
    const x = (i - (n - 1) / 2) * 0.42, v = 0.8 + r() * 0.3
    c.metti(P, scatola(0.4 + r() * 0.1, 0.26, 0.5, 1.4), x, 0.13, (r() - 0.5) * 0.06, tinta([0.68, 0.66, 0.6], v), { ry: (r() - 0.5) * 0.2 })
    if (i > 0 && i < n - 1 && !(i === 3 && r() < 0.5)) c.metti(P, scatola(0.38, 0.22, 0.46, 1.4), x + 0.1, 0.37, (r() - 0.5) * 0.05, tinta([0.64, 0.62, 0.58], v), { ry: (r() - 0.5) * 0.25 })
  }
  for (const [x, z] of [[1.7, 0.4], [-1.9, -0.3]]) c.metti(P, scatola(0.3, 0.2, 0.3, 1.4), x, 0.1, z, [0.66, 0.64, 0.6], { ry: r() * 3, rz: 0.2 })
  c.metti(X, ico(0.2), 0.6, 0.5, 0, MUSCHIO, { s: [1.4, 0.4, 0.9] })
}
function macerie(c, r, o = {}) {
  const col = o.scuro ? [0.3, 0.28, 0.27] : [0.7, 0.68, 0.64]
  for (let i = 0; i < 7; i++) c.metti(P, scatola(0.2 + r() * 0.3, 0.14 + r() * 0.12, 0.2 + r() * 0.25, 1.4), (r() - 0.5) * 1.4, 0.1, (r() - 0.5) * 1.2, tinta(col, 0.8 + r() * 0.3), { ry: r() * 3, rz: (r() - 0.5) * 0.5, rx: (r() - 0.5) * 0.4 })
  for (let i = 0; i < 3; i++) c.metti(X, ico(0.12 + r() * 0.08), (r() - 0.5) * 1.2, 0.08, (r() - 0.5) * 1.1, tinta(col, 0.9), { s: [1, 0.7, 1] })
  c.metti(L, scatola(1.1, 0.08, 0.1), 0.1, 0.18, 0.2, o.scuro ? BRUCIATO : LEGNO_S, { ry: r() * 3, rz: 0.15 })
}
// ── la brughiera ──
function menhir(c, r) { menhirAt(c, r, 0, 0, 1.2 + r() * 0.8, r() * 3) }
function cerchio(c, r) {
  const n = 7
  for (let i = 0; i < n; i++) { const a = i * PI * 2 / n; menhirAt(c, r, Math.cos(a) * 1.4, Math.sin(a) * 1.4, 0.7 + r() * 0.6, a) }
  c.metti(P, scatola(1.0, 0.16, 0.7, 1.4), 0, 0.08, 0, [0.5, 0.5, 0.52], { ry: r() })
  c.metti(X, disco(0.2, 6), 0, 0.17, 0, [0.7, 0.66, 0.4])
}
function tumulo(c, r) {
  c.metti(X, new SphereGeometry(1.0, 8, 5, 0, PI * 2, 0, PI / 2), 0, -0.02, 0, ERBA, { s: [1.3, 0.62, 1.1] })
  c.metti(P, scatola(0.2, 0.62, 0.26, 1), -0.34, 0.31, 0.88, GRIGIO_S); c.metti(P, scatola(0.2, 0.62, 0.26, 1), 0.34, 0.31, 0.88, GRIGIO_S)
  c.metti(P, scatola(1.0, 0.18, 0.3, 1), 0, 0.7, 0.86, GRIGIO_S)
  c.metti(X, scatola(0.5, 0.55, 0.05), 0, 0.28, 0.82, BUIO)
  for (let i = 0; i < 5; i++) { const a = -0.9 + i * 0.45; c.metti(P, ico(0.12 + r() * 0.06), Math.sin(a) * 1.35, 0.07, Math.cos(a) * 1.2, GRIGIO_S, { s: [1, 0.7, 1] }) }
}
function cespoErica(c, r) {
  for (let i = 0; i < 5; i++) c.metti(X, ico(0.24 + r() * 0.14), (r() - 0.5) * 1.0, 0.12, (r() - 0.5) * 0.9, scegli(r, [[0.62, 0.38, 0.62], [0.74, 0.46, 0.7], [0.55, 0.35, 0.58], [0.8, 0.55, 0.75]]), { s: [1.3, 0.62, 1.1], ry: r() * 3 })
  for (let i = 0; i < 2; i++) c.metti(X, ico(0.16), (r() - 0.5) * 1.1, 0.07, (r() - 0.5) * 1.0, [0.4, 0.5, 0.28], { s: [1.2, 0.6, 1] })
  c.metti(P, ico(0.16), 0.5, 0.06, -0.3, GRIGIO_S, { s: [1, 0.7, 1] })
}
// ── il bosco ──
function tronco(c, r) {
  const Ln = 2.0 + r() * 0.8, rr = 0.2 + r() * 0.06
  c.metti(L, cilindro(rr, rr * 1.12, Ln, 7, 1), 0, rr, 0, [0.46, 0.35, 0.26], { rz: PI / 2 })
  c.metti(L, new CircleGeometry(rr * 1.12, 7), -Ln / 2 - 0.002, rr, 0, [0.78, 0.65, 0.46], { ry: -PI / 2 })
  c.metti(L, new ConeGeometry(rr * 0.9, 0.4, 5), Ln / 2 + 0.15, rr * 1.1, 0, [0.5, 0.38, 0.28], { rz: -PI / 2 })
  for (const x of [-0.5, 0.4]) c.metti(L, cilindro(0.035, 0.06, 0.45, 5, 1), x, rr + 0.3, 0, LEGNO_S, { rz: x < 0 ? 0.6 : -0.7 })
  c.metti(X, ico(0.2), 0.1, rr * 1.8, 0.04, MUSCHIO, { s: [2.4, 0.45, 0.9] })
  for (let i = 0; i < 3; i++) c.metti(X, new SphereGeometry(0.07, 6, 3, 0, PI * 2, 0, PI / 2), -0.6 + i * 0.35, rr * 2 - 0.01, 0.12 + (r() - 0.5) * 0.1, i % 2 ? [0.9, 0.55, 0.2] : [0.94, 0.9, 0.8])
}
function ceppoGrande(c, r) {
  c.metti(L, cilindro(0.5, 0.62, 0.22, 9, 1), 0, 0.11, 0, [0.42, 0.32, 0.24])
  c.metti(L, cilindro(0.42, 0.5, 0.5, 9, 1), 0, 0.46, 0, [0.46, 0.35, 0.26])
  c.metti(L, new CircleGeometry(0.42, 9).rotateX(-PI / 2), 0, 0.711, 0, [0.8, 0.68, 0.48])
  c.metti(L, new CircleGeometry(0.24, 9).rotateX(-PI / 2), 0, 0.713, 0, [0.7, 0.57, 0.38])
  for (let i = 0; i < 3; i++) { const a = r() * 6.28; c.metti(X, cilindro(0.17, 0.17, 0.05, 8, 1), Math.cos(a) * 0.46, 0.25 + i * 0.12, Math.sin(a) * 0.46, [0.9, 0.58, 0.22], { rz: Math.cos(a) * 0.25, rx: -Math.sin(a) * 0.25 }) }
  c.metti(X, ico(0.2), -0.15, 0.7, 0.1, MUSCHIO, { s: [1.3, 0.5, 1] })
  for (let i = 0; i < 3; i++) { const a = 1 + i * 2; c.metti(X, new SphereGeometry(0.08, 6, 3, 0, PI * 2, 0, PI / 2), Math.cos(a) * 0.75, 0.22, Math.sin(a) * 0.75, [0.92, 0.88, 0.8]) }
}
function funghiGiganti(c, r) {
  const v = scegli(r, [{ cappa: [0.85, 0.2, 0.16], macchie: [0.98, 0.96, 0.9] }, { cappa: [0.62, 0.38, 0.8], macchie: [0.9, 0.82, 0.98] }, { cappa: [0.92, 0.6, 0.22], macchie: [0.98, 0.9, 0.7] }])
  const n = 2 + Math.floor(r() * 2)
  for (let i = 0; i < n; i++) {
    const a = i * 2.2 + r(), d = i ? 0.55 + r() * 0.3 : 0, x = Math.cos(a) * d, z = Math.sin(a) * d, H = i ? 0.45 + r() * 0.4 : 0.9 + r() * 0.35, R = i ? 0.3 + r() * 0.15 : 0.6 + r() * 0.1
    c.metti(X, cilindro(0.09 * R / 0.4 + 0.03, 0.13 * R / 0.4 + 0.03, H, 7, 1), x, H / 2, z, [0.95, 0.92, 0.84])
    c.metti(X, new SphereGeometry(R, 8, 4, 0, PI * 2, 0, PI / 2), x, H - 0.03, z, v.cappa, { s: [1, 0.62, 1] })
    c.metti(X, disco(R * 0.98, 8).rotateX(PI), x, H - 0.03, z, [0.82, 0.76, 0.66])
    for (let k = 0; k < 4; k++) { const b = k * 1.7 + a, pol = 0.3 + (k % 2) * 0.35; c.metti(X, new SphereGeometry(R * 0.11, 4, 3), x + Math.cos(b) * R * Math.sin(pol) * 0.9, H - 0.03 + Math.cos(pol) * R * 0.62, z + Math.sin(b) * R * Math.sin(pol) * 0.9, v.macchie, { s: [1, 0.5, 1] }) }
  }
}
function ragnatelaRami(c, r) {
  palettoMorto(c, -0.75, 0, 1.75, -0.12); palettoMorto(c, 0.75, 0, 1.45, 0.14)
  ragnatela(c, 0, 1.12, 0, 0.85)
  c.metti(X, sfera(0.06, 5, 3), 0.05, 1.12, 0.02, BUIO, { s: [1, 0.8, 1.2] })
  c.metti(X, sfera(0.04, 5, 3), 0.05, 1.18, 0.04, BUIO)
  c.metti(X, ico(0.1), 0.1, 1.98, 0, MARCIO, { s: [1, 0.6, 1] })
}
// ── viandanti ──
function accampamento(c, r) {
  const tela = scegli(r, [[0.74, 0.45, 0.32], [0.46, 0.54, 0.62], [0.82, 0.72, 0.46], [0.5, 0.62, 0.42]]), hw = 0.85, H = 1.1, Ld = 1.6, a = Math.atan2(H, hw), Ls = Math.hypot(hw, H)
  for (const s of [-1, 1]) c.metti(X, scatola(Ls, 0.05, Ld, 1.4), s * hw / 2, H / 2, -0.8, tela, { rz: -s * a })
  for (const z of [-0.8 - Ld / 2, -0.8 + Ld / 2]) c.metti(X, triangolo([-hw, 0, z], [hw, 0, z], [0, H, z]), 0, 0, 0, tinta(tela, 0.82))
  c.metti(X, triangolo([-0.4, 0, -0.8 + Ld / 2 + 0.01], [0.4, 0, -0.8 + Ld / 2 + 0.01], [0, 0.7, -0.8 + Ld / 2 + 0.01]), 0, 0, 0, BUIO)
  c.metti(L, cilindro(0.025, 0.025, 1.3, 4, 1), 0, 0.65, -0.8 + Ld / 2, LEGNO_S, { rx: 0.25 })
  const fz = 1.1
  c.metti(X, disco(0.38, 8), 0, 0.03, fz, [0.13, 0.11, 0.1])
  for (let i = 0; i < 7; i++) { const t = i * PI * 2 / 7; c.metti(P, ico(0.085), Math.cos(t) * 0.4, 0.05, fz + Math.sin(t) * 0.4, tinta(GRIGIO_S, 0.8 + r() * 0.3), { s: [1, 0.8, 1] }) }
  for (let i = 0; i < 3; i++) c.metti(L, cilindro(0.03, 0.04, 0.55, 5, 1), 0, 0.09, fz, BRUCIATO, { rz: PI / 2, ry: i * 1.05 + 0.3, rx: 0.12 })
  for (const [x, z, ry] of [[-1.15, fz + 0.2, 1.6], [1.1, fz + 0.5, 0.35], [0.1, fz + 1.2, 0]]) c.metti(L, cilindro(0.13, 0.14, 1.0, 7, 1), x, 0.14, z, [0.5, 0.38, 0.28], { rz: PI / 2, ry })
  c.metti(X, scatola(0.34, 0.4, 0.2), 1.1, 0.2, -0.1, [0.5, 0.36, 0.24], { ry: 0.5 })
  c.metti(X, cilindro(0.09, 0.09, 0.42, 6), 1.2, 0.07, 0.25, [0.74, 0.66, 0.5], { rz: PI / 2, ry: 0.3 })
}
function carro(c, r) {
  const a = 0.19, py = 0.42, rot = (x, y) => [x * Math.cos(a) - y * Math.sin(a), py + x * Math.sin(a) + y * Math.cos(a)]
  const pezzo = (x, y, z, geo, col, o = {}) => { const [px, py2] = rot(x, y); c.metti(L, geo, px, py2, z, col, { rz: a, ...o }) }
  pezzo(0, 0, 0, scatola(1.6, 0.1, 0.8, 1), LEGNO)
  for (const s of [-1, 1]) pezzo(0, 0.2, s * 0.4, scatola(1.6, 0.3, 0.05, 1), tinta(LEGNO, 0.85))
  pezzo(-0.8, 0.2, 0, scatola(0.05, 0.3, 0.8, 1), tinta(LEGNO, 0.85))
  for (const s of [-1, 1]) {
    c.metti(X, new TorusGeometry(0.36, 0.045, 4, 10), 0.55, 0.38, s * 0.5, LEGNO_S)
    for (let k = 0; k < 2; k++) c.metti(L, scatola(0.04, 0.72, 0.04), 0.55, 0.38, s * 0.5, LEGNO_S, { rz: k * PI / 2 + 0.3 })
    c.metti(X, cilindro(0.06, 0.06, 0.1, 6), 0.55, 0.38, s * 0.5, FERRO, { rx: PI / 2 })
  }
  c.metti(L, new TorusGeometry(0.36, 0.045, 4, 10), -1.4, 0.05, 0.9, LEGNO_S, { rx: PI / 2 + 0.2 })
  for (const s of [-1, 1]) c.metti(L, scatola(1.5, 0.05, 0.07), -1.65, 0.08, s * 0.32, LEGNO_S, { rz: -0.07, ry: s * 0.06 })
  for (const x of [-0.4, 0.2]) { const [px, py2] = rot(x, 0.5); c.metti(X, new TorusGeometry(0.46, 0.025, 3, 8, PI), px, py2, 0, LEGNO_S, { ry: PI / 2, rz: a }) }
  const [cx, cy] = rot(0.3, 0.3); c.metti(L, scatola(0.4, 0.4, 0.4, 1), cx, cy, 0.05, LEGNO, { rz: a, ry: 0.3 })
  c.metti(X, triangolo([-0.2, 0.9, 0.42], [0.25, 0.85, 0.42], [0.05, 0.3, 0.45]), 0, 0, 0, [0.85, 0.8, 0.66])
}
function recinto(c, r) {
  for (let i = 0; i < 4; i++) c.metti(L, cilindro(0.045, 0.06, 0.9, 5, 1), (i - 1.5) * 0.7, 0.45, 0, LEGNO_S, { rz: i === 3 ? 0.3 : (r() - 0.5) * 0.06 })
  for (const y of [0.35, 0.65]) c.metti(L, scatola(1.45, 0.07, 0.05), -0.35, y, 0.05, LEGNO, { rz: (r() - 0.5) * 0.05 })
  c.metti(L, scatola(0.8, 0.07, 0.05), 1.55, 0.2, 0.3, LEGNO, { rz: 0.15, ry: 0.5 })
  c.metti(X, ico(0.14), 0.4, 0.05, 0.25, MUSCHIO, { s: [1.6, 0.4, 1] })
}
function cassaMele(c, r) {
  c.metti(L, scatola(0.55, 0.3, 0.4, 1), 0, 0.15, 0, LEGNO, { ry: r() })
  for (let i = 0; i < 6; i++) c.metti(X, ico(0.07), (i % 3 - 1) * 0.15, 0.33, (i < 3 ? -0.08 : 0.1), i % 4 ? [0.86, 0.2, 0.16] : [0.55, 0.75, 0.25], { ry: 0 })
  for (let i = 0; i < 3; i++) c.metti(X, ico(0.07), 0.45 + i * 0.15, 0.06, 0.2 - i * 0.2, [0.86, 0.2, 0.16])
}
function cartello(c, r) {
  c.metti(L, cilindro(0.05, 0.065, 1.6, 5, 1), 0, 0.8, 0, LEGNO_S)
  for (const [y, s, w] of [[1.38, 1, 0.78], [1.08, -1, 0.62]]) {
    c.metti(L, scatola(w, 0.2, 0.05, 1), s * 0.14, y, 0.07, LEGNO, { ry: s * 0.12 })
    c.metti(L, scatola(0.17, 0.17, 0.05, 1), s * (0.14 + w / 2), y, 0.07 + s * 0.012, LEGNO, { rz: PI / 4, ry: s * 0.12 })
    c.metti(X, scatola(w * 0.6, 0.04, 0.02), s * 0.14, y, 0.1, LEGNO_S, { ry: s * 0.12 })
  }
}
function totem(c, r) {
  c.metti(P, scatola(0.56, 0.3, 0.56, 1), 0, 0.15, 0, GRIGIO_S)
  c.metti(P, scatola(0.44, 0.5, 0.44, 1), 0, 0.55, 0, tinta(GRIGIO_S, 1.1))
  for (const e of [-1, 1]) c.metti(X, scatola(0.1, 0.08, 0.03), e * 0.1, 0.62, 0.225, [0.95, 0.75, 0.2])
  c.metti(X, scatola(0.2, 0.05, 0.03), 0, 0.45, 0.225, BUIO)
  c.metti(X, scatola(0.46, 0.06, 0.46), 0, 0.82, 0, [0.72, 0.22, 0.16])
  c.metti(P, scatola(0.34, 0.4, 0.34, 1), 0, 1.05, 0, tinta(GRIGIO_S, 0.95), { ry: 0.5 })
  c.metti(P, new ConeGeometry(0.26, 0.36, 4), 0, 1.45, 0, GRIGIO_S, { ry: 0.5 })
}
function miliare(c, r) {
  c.metti(P, scatola(0.36, 0.62, 0.24, 1), 0, 0.31, 0, [0.76, 0.74, 0.7], { rz: (r() - 0.5) * 0.08 })
  c.metti(P, cilindro(0.18, 0.18, 0.24, 6, 1), 0, 0.62, 0, [0.76, 0.74, 0.7], { rx: PI / 2 })
  c.metti(X, scatola(0.24, 0.08, 0.02), 0, 0.5, 0.125, [0.3, 0.3, 0.32])
  c.metti(X, scatola(0.1, 0.1, 0.02), 0, 0.3, 0.125, [0.3, 0.3, 0.32])
}
// ── l'acqua ──
function palafitta(c, r, o) {
  const liv = Math.max(0, o.liv), py = liv + 0.85, bot = -0.4
  for (const [x, z] of [[-0.85, -0.7], [0.85, -0.7], [-0.85, 0.7], [0.85, 0.7], [0, -0.7]]) c.metti(L, cilindro(0.075, 0.09, py - bot + 0.5, 6, 1), x, bot + (py - bot + 0.5) / 2, z, LEGNO_S, { rz: (r() - 0.5) * 0.06 })
  for (let i = 0; i < 4; i++) c.metti(L, scatola(2.0, 0.07, 0.4, 1), 0, py, -0.6 + i * 0.4, tinta(LEGNO, 0.85 + r() * 0.2))
  c.metti(L, scatola(1.25, 0.8, 1.0, 1.2), -0.2, py + 0.43, -0.25, LEGNO)
  falde(c, 1.5, 1.35, py + 0.83, 0.55, PAGLIA)
  c.metti(X, scatola(0.4, 0.55, 0.04), -0.2, py + 0.3, 0.27, BUIO)
  const lungo = py + 0.65
  for (const s of [-1, 1]) c.metti(L, scatola(0.05, lungo, 0.05), 0.55 + s * 0.2, lungo / 2 - 0.05, 1.2 - lungo * 0.12, LEGNO_S, { rx: -0.34 })
  for (let i = 0; i < 4; i++) c.metti(L, scatola(0.4, 0.04, 0.04), 0.55, 0.3 + i * (lungo * 0.22), 1.2 - (0.3 + i * lungo * 0.22) * 0.34, LEGNO)
  c.metti(X, scatola(0.1, 0.12, 0.1), 0.6, py + 0.1, 0.4, [0.95, 0.75, 0.3])
}
function barca(c, r) {
  c.metti(L, new SphereGeometry(0.5, 8, 4, 0, PI * 2, 0, PI / 2), 0, 0, 0, scegli(r, [[0.34, 0.44, 0.52], [0.5, 0.36, 0.26], [0.42, 0.5, 0.42]]), { s: [2.0, 0.55, 0.85] })
  c.metti(L, scatola(1.9, 0.05, 0.09), 0, 0.3, 0, LEGNO_S)
  for (const x of [-0.45, 0.4]) c.metti(L, scatola(0.05, 0.05, 1.5), x, 0.0, 0, LEGNO_S, { rx: 0 })
  for (const s of [-1, 1]) { c.metti(L, cilindro(0.02, 0.02, 1.4, 4, 1), 0.4, 0.04, s * 0.95, LEGNO_S, { rz: PI / 2, ry: s * 0.35 }); c.metti(L, scatola(0.3, 0.02, 0.12), 1.1, 0.04, s * 0.95 + s * 0.28, LEGNO, { ry: s * 0.35 }) }
}
function canneto(c, r) {
  for (let i = 0; i < 11; i++) {
    const a = i * 2.39, d = 0.15 + (i % 4) * 0.2, h = 0.85 + (i % 5) * 0.16, lx = Math.cos(a) * 0.1, lz = Math.sin(a) * 0.1
    c.metti(X, new ConeGeometry(0.028, h, 4), Math.cos(a) * d, h / 2, Math.sin(a) * d, [0.46 + (i % 3) * 0.04, 0.62, 0.3], { rz: lx, rx: -lz })
    if (i % 3 === 0) c.metti(X, cilindro(0.035, 0.035, 0.18, 5, 1), Math.cos(a) * d - lx * h * 0.5, h * 0.92, Math.sin(a) * d + lz * h * 0.5, [0.45, 0.3, 0.18])
  }
}
function ninfee(c, r, o) {
  const y = o.liv + 0.04
  for (let i = 0; i < 5; i++) {
    const x = (r() - 0.5) * 1.5, z = (r() - 0.5) * 1.5, rr = 0.2 + r() * 0.14
    c.metti(X, new CircleGeometry(rr, 8, 0.4 + r(), PI * 2 - 0.5).rotateX(-PI / 2), x, y, z, [0.26 + r() * 0.1, 0.52 + r() * 0.1, 0.28], { ry: r() * 6 })
    if (i === 0 || r() < 0.3) c.metti(X, new ConeGeometry(0.07, 0.12, 5), x, y + 0.06, z, scegli(r, [[0.98, 0.7, 0.8], [0.98, 0.96, 0.9], [0.95, 0.85, 0.3]]))
  }
}
function palo(c, r, o) {
  for (let i = 0; i < 1 + (r() < 0.5 ? 1 : 0); i++) {
    const len = Math.max(0.5, o.liv) + 0.45 + r() * 0.5, x = i * 0.4, l = (r() - 0.5) * 0.4
    c.metti(L, cilindro(0.055, 0.08, len + 0.3, 6, 1), x, len / 2 - 0.15, 0, LEGNO_S, { rz: l, rx: (r() - 0.5) * 0.3 })
    c.metti(X, cilindro(0.085, 0.085, 0.12, 6, 1), x - Math.sin(l) * (o.liv + 0.1 - len / 2 + 0.15), Math.max(0, o.liv) + 0.08, 0, MUSCHIO)
    if (i === 0) c.metti(X, new TorusGeometry(0.07, 0.015, 3, 6), x, len - 0.25, 0, [0.7, 0.6, 0.45], { rx: PI / 2 })
  }
}
// ── la cenere e l'inferno ──
function fumarola(c, r, o) {
  c.metti(P, new ConeGeometry(0.58, 0.46, 7), 0, 0.22, 0, [0.28, 0.23, 0.2])
  c.metti(X, disco(0.22, 7), 0, 0.455, 0, BUIO)
  c.metti(LU, disco(0.12, 6), 0, 0.46, 0, [1, 0.42, 0.1])
  for (let i = 0; i < 4; i++) { const a = i * 1.7 + 0.4; c.metti(X, ico(0.1), Math.cos(a) * 0.3, 0.42, Math.sin(a) * 0.3, [0.86, 0.78, 0.26], { s: [1.4, 0.45, 1] }) }
  for (let i = 0; i < 3; i++) c.metti(P, ico(0.1 + r() * 0.07), (r() - 0.5) * 1.3, 0.06, (r() - 0.5) * 1.2, [0.25, 0.21, 0.19], { s: [1, 0.7, 1] })
  if (o.cose) o.cose.camini.push(c.dove(0, 0.55, 0))
}
function rocciaSpaccata(c, r) {
  const col = [0.22, 0.18, 0.17]
  for (const s of [-1, 1]) c.metti(P, new IcosahedronGeometry(0.5, 0), s * 0.2, 0.34, 0, col, { s: [0.8, 1, 0.95], ry: s * 0.3, rz: s * -0.12 })
  c.metti(LU, scatola(0.12, 0.5, 0.6), 0, 0.34, 0, [1, 0.45, 0.1])
  for (let i = 0; i < 3; i++) c.metti(LU, scatola(0.3 + r() * 0.2, 0.03, 0.04), (r() - 0.5) * 0.6, 0.12 + i * 0.14, 0.38, [1, 0.5 + r() * 0.2, 0.1], { rz: (r() - 0.5) * 1.2 })
  c.metti(P, ico(0.12), 0.7, 0.07, 0.3, col, { s: [1, 0.7, 1] })
}
function ossa(c, r) {
  for (let i = 0; i < 4; i++) c.metti(X, new TorusGeometry(0.38 - i * 0.02, 0.04, 3, 6, PI), 0, 0, -0.6 + i * 0.4, OSSO, { rz: i === 3 ? 0.9 : 0, s: [1, 1 - i * 0.07, 1] })
  c.metti(X, cilindro(0.045, 0.045, 1.6, 5, 1), 0, 0.37, -0.1, tinta(OSSO, 0.95), { rx: PI / 2 })
  c.metti(X, sfera(0.2, 6, 4), 1.2, 0.17, 0.4, OSSO, { s: [0.9, 0.8, 1.5], ry: 0.5 })
  for (const s of [-1, 1]) c.metti(X, new ConeGeometry(0.05, 0.5, 5), 1.2 + s * 0.2, 0.3, 0.3, OSSO, { rz: -s * 1.1, ry: 0.5 })
  for (const s of [-1, 1]) c.metti(X, scatola(0.06, 0.06, 0.05), 1.2 + s * 0.1, 0.25, 0.1, BUIO)
  c.metti(X, cilindro(0.03, 0.03, 0.6, 5, 1), -0.9, 0.04, 0.5, OSSO, { rz: PI / 2, ry: 0.8 })
}
function tridente(c, r) {
  const l = (r() - 0.5) * 0.3
  c.metti(L, cilindro(0.025, 0.035, 1.7, 5, 1), 0, 0.85, 0, LEGNO_S, { rz: l })
  const x = -Math.sin(l) * 1.7, y = 0.08 + Math.cos(l) * 1.7
  c.metti(X, scatola(0.3, 0.04, 0.04), x, y, 0, FERRO, { rz: l })
  for (const s of [-1, 0, 1]) c.metti(X, new ConeGeometry(0.035, s ? 0.34 : 0.44, 4), x + s * 0.14, y + 0.2, 0, FERRO, { rz: l - s * 0.12 })
  c.metti(X, triangolo([x, y - 0.05, 0], [x + 0.28, y - 0.2, 0.02], [x + 0.04, y - 0.4, 0]), 0, 0, 0, [0.7, 0.12, 0.1])
  for (let i = 0; i < 3; i++) c.metti(P, ico(0.09), Math.cos(i * 2.1) * 0.14, 0.04, Math.sin(i * 2.1) * 0.14, GRIGIO_S, { s: [1, 0.7, 1] })
}
// ── il monte e le miniere ──
function carrello(c, r) {
  c.metti(L, scatola(0.9, 0.06, 1.15, 0.8), 0, 0.28, 0, [0.5, 0.36, 0.26])
  for (const s of [-1, 1]) { c.metti(L, scatola(0.06, 0.38, 1.15, 0.8), s * 0.42, 0.48, 0, [0.5, 0.36, 0.26]); c.metti(L, scatola(0.9, 0.38, 0.06, 0.8), 0, 0.48, s * 0.55, tinta([0.5, 0.36, 0.26], 0.9)) }
  c.metti(X, scatola(0.94, 0.05, 1.2), 0, 0.63, 0, FERRO)
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) c.metti(X, cilindro(0.14, 0.14, 0.07, 8, 1), sx * 0.46, 0.15, sz * 0.4, FERRO, { rz: PI / 2 })
  for (let i = 0; i < 4; i++) c.metti(X, ico(0.17 + r() * 0.06), (i % 2 - 0.5) * 0.4, 0.62, (i < 2 ? -0.2 : 0.22), [0.3, 0.29, 0.33])
  c.metti(X, new OctahedronGeometry(0.1), 0.05, 0.76, 0, [0.95, 0.8, 0.3])
  for (let i = 0; i < 3; i++) c.metti(X, ico(0.1), 0.8 + i * 0.2, 0.06, 0.5 - i * 0.3, [0.3, 0.29, 0.33], { s: [1, 0.7, 1] })
}
function binari(c, r) {
  for (let i = 0; i < 7; i++) if (i !== 5) c.metti(L, scatola(0.92, 0.05, 0.14, 1), 0, 0.03, -1.15 + i * 0.38, LEGNO_S, { ry: (r() - 0.5) * 0.1 })
  for (const s of [-1, 1]) c.metti(X, scatola(0.05, 0.06, 2.3), s * 0.34, 0.09, -0.1, [0.46, 0.43, 0.42])
  c.metti(X, scatola(0.05, 0.06, 0.8), -0.34, 0.12, 1.5, [0.46, 0.43, 0.42], { ry: -0.35, rx: 0.12 })
  c.metti(X, scatola(0.05, 0.06, 0.7), 0.34, 0.2, 1.4, [0.46, 0.43, 0.42], { ry: 0.3, rx: -0.4 })
}
function travi(c, r) {
  for (const s of [-1, 1]) {
    c.metti(L, scatola(0.2, 1.9, 0.2, 1), s * 0.85, 0.95, 0, LEGNO_S, { rz: s * 0.02 })
    c.metti(L, scatola(0.12, 0.8, 0.12, 1), s * 0.62, 1.55, 0, LEGNO_S, { rz: s * 0.8 })
  }
  c.metti(L, scatola(2.0, 0.22, 0.24, 1), 0, 1.92, 0, LEGNO_S, { rz: 0.03 })
  c.metti(X, scatola(0.7, 0.28, 0.04), 0.3, 1.55, 0.14, [0.72, 0.62, 0.42])
  c.metti(X, cilindro(0.008, 0.008, 0.3, 3), -0.35, 1.7, 0.1, FERRO)
  c.metti(X, scatola(0.16, 0.2, 0.16), -0.35, 1.47, 0.1, [0.95, 0.78, 0.35])
  c.metti(P, ico(0.18), 1.05, 0.08, 0.3, GRIGIO_S, { s: [1, 0.6, 1] })
}
function minerale(c, r) {
  for (let i = 0; i < 8; i++) { const a = r() * 6.28, d = r() * 0.5; c.metti(X, ico(0.15 + r() * 0.12), Math.cos(a) * d, 0.1 + (0.5 - d) * 0.25, Math.sin(a) * d, tinta([0.3, 0.29, 0.33], 0.8 + r() * 0.4), { s: [1, 0.8, 1], ry: r() * 3 }) }
  for (const col of [[0.95, 0.8, 0.3], [0.35, 0.6, 0.95], [0.85, 0.5, 0.3]]) { const a = r() * 6.28; c.metti(X, new OctahedronGeometry(0.09), Math.cos(a) * 0.35, 0.3 + r() * 0.1, Math.sin(a) * 0.35, col, { s: [1, 1.5, 1], ry: r() * 3 }) }
  c.metti(L, cilindro(0.025, 0.03, 0.9, 5, 1), 0.75, 0.04, 0.25, LEGNO, { rz: PI / 2 - 0.1, ry: 0.5 })
  c.metti(X, scatola(0.3, 0.05, 0.05), 1.15, 0.12, 0.05, FERRO, { ry: 0.5, rz: 0.2 })
}
function argano(c, r) {
  c.metti(X, disco(0.45, 8), 0, 0.02, 0.1, BUIO)
  for (let i = 0; i < 4; i++) { const a = i * PI / 2; c.metti(L, scatola(0.7, 0.07, 0.16, 1), Math.sin(a) * 0.5, 0.04, 0.1 + Math.cos(a) * 0.5, LEGNO_S, { ry: a }) }
  for (const z of [-0.5, 0.7]) for (const s of [-1, 1]) c.metti(L, scatola(0.1, 1.6, 0.1, 1), s * 0.38, 0.8, z, LEGNO_S, { rz: -s * 0.25 })
  c.metti(L, cilindro(0.06, 0.06, 1.4, 7, 1), 0, 1.5, 0.1, LEGNO, { rx: PI / 2 })
  c.metti(L, cilindro(0.17, 0.17, 0.5, 8, 1), 0, 1.5, 0.1, tinta(LEGNO, 0.85), { rx: PI / 2 })
  c.metti(X, scatola(0.05, 0.05, 0.5), 0.2, 1.6, 0.85, FERRO, { rx: 0 }); c.metti(X, scatola(0.05, 0.4, 0.05), 0.2, 1.4, 0.85, FERRO)
  c.metti(X, cilindro(0.01, 0.01, 1.35, 4, 1), 0.02, 0.82, 0.1, [0.7, 0.62, 0.48])
  c.metti(L, cilindro(0.14, 0.1, 0.22, 8, 1), 0.02, 0.2, 0.1, [0.55, 0.42, 0.3])
}
function cairn(c, r) {
  let y = 0
  for (const [rr, dx] of [[0.3, 0], [0.24, 0.04], [0.18, -0.03], [0.12, 0.02]]) { c.metti(P, ico(rr), dx, y + rr * 0.45, 0, tinta(GRIGIO, 0.7 + r() * 0.3), { s: [1.15, 0.7, 1], ry: r() * 3 }); y += rr * 0.75 }
}
// ── solo attorno agli ingressi ──
function teschio(c, r) {
  c.metti(L, cilindro(0.03, 0.04, 1.25, 5, 1), 0, 0.62, 0, LEGNO_S, { rz: (r() - 0.5) * 0.14 })
  cranio(c, 0, 1.33, 0.03, 0, 1.1)
}
function braciere(c, r, o) {
  for (let i = 0; i < 3; i++) { const a = i * PI * 2 / 3 + 0.5; c.metti(X, cilindro(0.02, 0.03, 0.85, 5, 1), Math.cos(a) * 0.17, 0.4, Math.sin(a) * 0.17, FERRO, { rz: Math.cos(a) * -0.18, rx: Math.sin(a) * 0.18 }) }
  c.metti(X, cilindro(0.3, 0.16, 0.16, 8, 1), 0, 0.84, 0, FERRO)
  c.metti(LU, disco(0.24, 8), 0, 0.925, 0, [1, 0.42, 0.1])
  if (o.cose) { o.cose.braci.push(c.dove(0, 1.0, 0)); o.cose.fuochi.push(c.dove(0, 0.92, 0)) }
}
function pozza(c, r) {
  c.metti(X, new CircleGeometry(0.8, 9).rotateX(-PI / 2), 0, 0.03, 0, [0.14, 0.3, 0.34], { s: [1.2 + r() * 0.3, 1, 0.8 + r() * 0.2], ry: r() * 3 })
  for (let i = 0; i < 4; i++) { const a = i * 1.6 + r(); c.metti(P, ico(0.1), Math.cos(a) * 1.0, 0.05, Math.sin(a) * 0.75, GRIGIO_S, { s: [1, 0.7, 1] }) }
}
function bozzolo(c, r) {
  palettoMorto(c, 0, 0, 1.6, 0.1)
  c.metti(X, sfera(0.17, 6, 4), -0.1, 1.15, 0, [0.9, 0.92, 0.94], { s: [0.8, 1.9, 0.8] })
  c.metti(X, cilindro(0.01, 0.01, 0.4, 3), -0.08, 1.62, 0, [0.9, 0.92, 0.94])
  c.metti(X, sfera(0.1, 5, 3), 0.28, 0.1, 0.1, [0.9, 0.92, 0.94], { s: [1, 0.6, 1.2] })
}
function palizzata(c, r) {
  for (let i = 0; i < 6; i++) { const h = 0.9 + r() * 0.5; c.metti(L, cilindro(0.06, 0.08, h, 5, 1), (i - 2.5) * 0.3, h / 2, (r() - 0.5) * 0.1, tinta(LEGNO, 0.8 + r() * 0.2), { rz: (r() - 0.5) * 0.18 }); c.metti(L, new ConeGeometry(0.06, 0.2, 5), (i - 2.5) * 0.3, h + 0.08, 0, LEGNO_S) }
  c.metti(L, scatola(1.7, 0.06, 0.06), 0, 0.55, 0.07, LEGNO_S)
}
function sacchi(c, r) {
  for (let i = 0; i < 3; i++) { const x = (i - 1) * 0.3 + (r() - 0.5) * 0.1, z = (i % 2) * 0.2; c.metti(X, cilindro(0.1, 0.15, 0.34, 7), x, 0.17, z, scegli(r, [[0.74, 0.66, 0.5], [0.62, 0.55, 0.4]]), { ry: r() * 3 }); c.metti(X, cilindro(0.04, 0.07, 0.07, 6), x, 0.37, z, [0.5, 0.42, 0.3]) }
  c.metti(L, cilindro(0.2, 0.22, 0.45, 8, 1), 0.65, 0.22, 0.3, [0.6, 0.46, 0.33], { rz: 0.6, ry: 1 })
}
function trave(c, r, o = {}) {
  const Ln = 1.2 + r() * 0.8
  c.metti(L, scatola(0.16, Ln, 0.16, 1), 0, Ln / 2, 0, BRUCIATO, { rz: 0.3 + r() * 0.3, rx: (r() - 0.5) * 0.4 })
  c.metti(L, scatola(0.12, 0.8, 0.12, 1), 0.4, 0.07, 0.3, [0.2, 0.16, 0.14], { rz: PI / 2 - 0.1, ry: r() * 3 })
  c.metti(X, ico(0.12), -0.2, 0.06, 0.2, [0.15, 0.13, 0.12], { s: [1.6, 0.5, 1] })
}
function crepa(c, r) {
  // terra bruciata: una macchia di fuliggine con qualche crepa scura che la attraversa
  c.metti(X, disco(0.85, 8), 0, 0.022, 0, [0.1, 0.085, 0.075], { s: [1.4, 1, 0.9], ry: r() * 3 })
  for (let i = 0; i < 4; i++) c.metti(X, scatola(0.9 + r() * 0.5, 0.01, 0.05), (r() - 0.5) * 0.8, 0.03, (r() - 0.5) * 0.8, [0.07, 0.05, 0.04], { ry: r() * 3 })
}
function lanterna(c, r) {
  c.metti(L, cilindro(0.035, 0.045, 1.5, 5, 1), 0, 0.75, 0, LEGNO_S)
  c.metti(L, scatola(0.35, 0.04, 0.04), 0.14, 1.5, 0, LEGNO_S)
  c.metti(X, scatola(0.18, 0.22, 0.18), 0.3, 1.34, 0, FERRO)
  c.metti(LU, scatola(0.12, 0.14, 0.12), 0.3, 1.34, 0, [1, 0.8, 0.4])
}

// ── il segno delle tane (props-tana-dati.js): pezzi piccoli, disposti attorno al cuore della tana. Quello che dice «qui c'è qualcuno»
// (il fumo, le braci) lo dichiarano a `cose` con `.tana`: la scena lo spegne quando il signore è morto ──
const vivo = (o, v) => { if (o.cose) { v.tana = o.tana; return v } return null }
// un tratto del cerchio di sassi: tre sassi lungo la tangente (il davanti guarda il cuore: gli estremi sono più in dentro)
function sassiTana(c, r) {
  for (let i = -1; i <= 1; i++) { const rr = 0.2 + r() * 0.12; c.metti(P, ico(rr), i * 0.55 + (r() - 0.5) * 0.12, rr * 0.45, i * i * 0.1, tinta(GRIGIO_S, 0.75 + r() * 0.35), { s: [1.2, 0.75, 1], ry: r() * 3 }) }
}
// il focolare spento: cenere, tizzoni neri e un filo di fumo
function cenereTana(c, r, o) {
  c.metti(X, disco(0.95, 9), 0, 0.024, 0, [0.2, 0.19, 0.19], { s: [1.1, 1, 0.95], ry: r() * 3 })
  c.metti(X, disco(0.5, 7), 0.05, 0.03, 0.02, [0.5, 0.49, 0.47], { ry: r() * 3 })
  for (let i = 0; i < 4; i++) c.metti(L, cilindro(0.03, 0.04, 0.5 + r() * 0.3, 4, 1), (r() - 0.5) * 0.8, 0.05, (r() - 0.5) * 0.7, BRUCIATO, { rz: PI / 2, ry: r() * 3 })
  const f = vivo(o, c.dove(0, 0.12, 0)); if (f) o.cose.camini.push(f)
}
// la fossa di braci: terra nera, sassi anneriti, brace che luccica (e scintille e fiamme, finché il signore c'è)
function braciTana(c, r, o) {
  c.metti(X, disco(1.0, 9), 0, 0.024, 0, [0.08, 0.065, 0.06], { s: [1.1, 1, 0.95], ry: r() * 3 })
  for (let i = 0; i < 6; i++) { const a = i * PI / 3 + 0.3; c.metti(P, ico(0.17 + r() * 0.06), Math.cos(a) * 0.72, 0.09, Math.sin(a) * 0.66, [0.22, 0.19, 0.18], { s: [1, 0.75, 1] }) }
  for (let i = 0; i < 4; i++) c.metti(LU, disco(0.12 + r() * 0.1, 6), (r() - 0.5) * 0.8, 0.045, (r() - 0.5) * 0.7, [1, 0.4 + r() * 0.2, 0.1])
  const b = vivo(o, c.dove(0, 0.2, 0)); if (b) { o.cose.braci.push(b); o.cose.fuochi.push(vivo(o, c.dove(0, 0.1, 0))) }
}
// la ragnatela fra due rami secchi, con due bozzoli appesi
function bozzoliTesi(c, r) {
  ragnatelaRami(c, r)
  for (const [x, y, l] of [[-0.32, 1.0, 0.45], [0.38, 0.8, 0.38]]) {
    c.metti(X, cilindro(0.008, 0.008, 0.5, 3), x, y + l / 2 + 0.1, 0.05, [0.9, 0.92, 0.94])
    c.metti(X, sfera(0.15, 6, 4), x, y, 0.05, [0.9, 0.92, 0.94], { s: [0.8, 1.9, 0.8] })
  }
}
// canne spezzate: qualche ceppo storto e le lame cadute di traverso
function canneSpezzate(c, r) {
  for (let i = 0; i < 5; i++) { const a = i * 2.3, d = 0.1 + (i % 3) * 0.18, h = 0.35 + (i % 4) * 0.14; c.metti(X, new ConeGeometry(0.03, h, 4), Math.cos(a) * d, h / 2, Math.sin(a) * d, [0.5, 0.6, 0.32], { rz: (r() - 0.5) * 0.4, rx: (r() - 0.5) * 0.4 }) }
  for (let i = 0; i < 4; i++) c.metti(X, new ConeGeometry(0.03, 0.8 + r() * 0.3, 4), (r() - 0.5) * 0.6, 0.05, (r() - 0.5) * 0.6, [0.62, 0.55, 0.32], { rz: PI / 2 + (r() - 0.5) * 0.3, ry: r() * 3 })
}
// un nido di fango: il tumulo scuro col suo cratere, i rametti attorno, due uova e un osso
function nidoFango(c, r) {
  const fango = [0.3, 0.22, 0.15]
  c.metti(X, new SphereGeometry(0.85, 8, 4, 0, PI * 2, 0, PI / 2), 0, 0, 0, fango, { s: [1.25, 0.5, 1.1] })
  c.metti(X, disco(0.45, 8), 0, 0.43, 0, [0.1, 0.08, 0.06])
  for (let i = 0; i < 8; i++) { const a = i * PI / 4 + r() * 0.3; c.metti(L, cilindro(0.025, 0.03, 0.7, 4, 1), Math.cos(a) * 0.85, 0.25, Math.sin(a) * 0.75, LEGNO_S, { rz: Math.cos(a) * -0.6, rx: Math.sin(a) * 0.6 }) }
  for (const [x, z] of [[-0.12, 0.05], [0.14, -0.08]]) c.metti(X, sfera(0.13, 6, 4), x, 0.5, z, [0.82, 0.84, 0.72], { s: [0.85, 1.1, 0.85] })
  c.metti(X, cilindro(0.03, 0.03, 0.55, 5, 1), 0.7, 0.07, 0.75, OSSO, { rz: PI / 2, ry: 0.6 })
}
// la carcassa di una bestia grossa: il costato che sale dal pelo marcio, la spina, il cranio con le corna
function carcassa(c, r) {
  c.metti(X, disco(0.9, 8), 0, 0.022, 0, [0.28, 0.22, 0.18], { s: [1.4, 1, 0.9], ry: r() * 3 })
  for (let i = 0; i < 5; i++) c.metti(X, new TorusGeometry(0.5 - Math.abs(i - 2) * 0.07, 0.045, 3, 6, PI), 0, 0, -0.75 + i * 0.37, OSSO, { rz: 0, s: [1, 1, 1] })
  c.metti(X, cilindro(0.05, 0.05, 1.9, 5, 1), 0, 0.5, -0.1, tinta(OSSO, 0.95), { rx: PI / 2 })
  c.metti(X, sfera(0.24, 6, 4), 0.1, 0.2, 1.15, OSSO, { s: [0.9, 0.8, 1.5], ry: 0.4 })
  for (const s of [-1, 1]) c.metti(X, new ConeGeometry(0.06, 0.55, 5), 0.1 + s * 0.25, 0.42, 1.1, OSSO, { rz: -s * 0.9, ry: 0.4 })
  for (const s of [-1, 1]) c.metti(X, scatola(0.07, 0.07, 0.06), 0.1 + s * 0.1, 0.25, 0.88, BUIO)
  c.metti(X, cilindro(0.035, 0.035, 0.7, 5, 1), -0.9, 0.05, 0.35, OSSO, { rz: PI / 2, ry: 0.9 })
}
// un mucchio di pietre, fatto a mano: larghe sotto, piccole in cima
function mucchio(c, r) {
  const sassi = [[0, 0, 0.42], [0.55, 0.1, 0.34], [-0.5, 0.15, 0.36], [0.1, -0.5, 0.33], [0.1, 0.5, 0.3], [0.2, 0.05, 0.3], [-0.2, -0.15, 0.27], [0.05, 0.02, 0.22]]
  sassi.forEach(([x, z, rr], i) => c.metti(P, ico(rr), x, rr * (i < 5 ? 0.5 : i === 5 ? 1.25 : i === 6 ? 1.1 : 1.8), z, tinta(GRIGIO_S, 0.7 + r() * 0.35), { s: [1.1, 0.8, 1], ry: r() * 3 }))
}
// una croce di legno storta, con due sassi ai piedi
function croceStorta(c, r) {
  const lean = (r() < 0.5 ? -1 : 1) * (0.32 + r() * 0.3)
  croce(c, 0, 0, lean, L, LEGNO_S, 1.25)
  c.metti(P, ico(0.17), 0.18, 0.06, 0.12, GRIGIO_S, { s: [1.2, 0.6, 1] }); c.metti(P, ico(0.12), -0.15, 0.04, 0.16, GRIGIO, { s: [1.2, 0.6, 1] })
}

const FORME_DISEGNO = { tomba, cripta, cancello, croce: (c, r) => croce(c, 0, 0, (r() - 0.5) * 0.3, L, LEGNO_S, 1.05), arcoRotto, colonnaRotta, muretto, macerie, menhir, cerchio, tumulo, cespoErica,
  tronco, ceppoGrande, funghiGiganti, ragnatela: ragnatelaRami, accampamento, carro, recinto, cassaMele, palafitta, barca, canneto, ninfee, palo, fumarola, rocciaSpaccata, ossa, tridente,
  carrello, binari, travi, minerale, argano, cairn, cartello, totem, miliare, teschio, braciere, pozza, bozzolo, palizzata, sacchi, trave, crepa, lanterna,
  sassiTana, cenereTana, braciTana, bozzoliTesi, canneSpezzate, nidoFango, carcassa, mucchio, croceStorta, ossaTana: ossa, crepaTana: crepa, rocciaTana: rocciaSpaccata, macerieTana: macerie }

// Disegna nel cantiere i props di un pezzo (quelli delle zone caricate, o `lista`). `cose` riceve il fumo delle fumarole e le braci
// dei bracieri
export function disegnaPropsAperti(m, p, cant, cose, lista = propsDelPezzo(m, p)) {
  for (const o of lista) {
    const f = FORME_DISEGNO[o.tipo]
    if (!f) continue
    const q = quotaProp(m, o)
    cant.base(o.x, q.y - 0.02, o.z, o.giro)
    f(cant, caso(o.seme * 7 + 3), { liv: q.liv, cose, tana: o.tana })
  }
}
