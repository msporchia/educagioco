// Generato da strumenti/promuovi-3d.mjs da poc/mostri-3d/palude-base.js: non si tocca a mano (si cambia il prototipo e si rilancia `npm run promuovi3d`).
// Attrezzi comuni dei mostri della palude (palude.js, palude-grossi.js). Autonomo: solo three e gli attrezzi di mostri.js.
// Ogni mostro scrive UNA funzione `pose(T, F)` che sistema tutto da zero (mai `+=`): F = { c, k, a } è l'attacco (c carica, k scatto,
// a bocca aperta), tutto zero a riposo. `vivente()` ne ricava anima(t) (F nullo) e attacca(p) (stessa posa col tempo dell'ultimo anima):
// così a p = 0 e p = 1 la posa coincide con l'idle per costruzione.
import * as THREE from 'three'
import { M, mesh, sfera, rozza, scatola, cil, cono, perno, punta, liscio, onda } from './mostri.js'
export { THREE, M, mesh, sfera, rozza, scatola, cil, cono, perno, punta, liscio, onda }

export const V3 = THREE.Vector3, SU = new V3(0, 1, 0), PI = Math.PI
export const BUIO = 0x14100f
export const lucido = (c, o = {}) => M(c, { flatShading: false, roughness: 0.25, ...o })
export const lum = (c, k = 1.6, o = {}) => M(c, { emissive: c, emissiveIntensity: k, flatShading: false, ...o })
/** Materiale emissivo NON condiviso (per le cose che pulsano: ogni istanza il suo). */
export const lumProprio = (c, k = 1.6) => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: k, roughness: 0.4 })
export const molle = (c, o = {}) => M(c, { flatShading: false, roughness: 0.55, ...o })

/** Un arto fra due punti (tubo che si assottiglia), con la palla del giunto solo in `b`. */
export function arto (g, a, b, r1, r2, m, seg = 6, giunto = true) {
  const A = new V3(...a), B = new V3(...b), d = B.clone().sub(A), h = d.length()
  const o = cil(g, r2, r1, h, m, 0, 0, 0, seg); o.position.copy(A).addScaledVector(d, 0.5)
  o.quaternion.setFromUnitVectors(SU, d.clone().normalize())
  if (giunto) sfera(g, r2, m, B.x, B.y, B.z, 1, 1, 1, 7)
  return o
}
/** Dispone un cilindro di altezza 1 (creato con `filo`) fra due punti: per corde, lingue, fili. */
export function filo (g, r, m, seg = 5) { const o = cil(g, r, r, 1, m, 0, 0, 0, seg); return o }
const _d = new V3()
export function tendi (o, a, b) {
  _d.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]); const h = Math.max(1e-4, _d.length())
  o.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2); o.scale.y = h
  o.quaternion.setFromUnitVectors(SU, _d.multiplyScalar(1 / h))
}
/** Un occhio con iride, pupilla e riflesso; `userData.occhio` fa ammiccare (scale.y). `orizz`: pupilla orizzontale (rospo, polpo). */
export function occhio (g, x, y, z, r, iride, { emis = 0.6, fessura = false, orizz = false, giro = 0, pupilla = BUIO } = {}) {
  const o = perno(g, x, y, z); o.rotation.y = giro; o.userData.occhio = true
  sfera(o, r, lum(iride, emis, { roughness: 0.3 }), 0, 0, 0, 1, 1, 0.75, 12)
  sfera(o, r * 0.5, lucido(pupilla, { roughness: 0.2 }), 0, 0, r * 0.5, fessura ? 0.4 : orizz ? 1.4 : 1, orizz ? 0.45 : 1.05, 0.5, 8)
  sfera(o, r * 0.26, lum(0xffffff, 0.8), r * 0.3, r * 0.34, r * 0.62, 1, 1, 0.6, 6)
  return o
}
export const marker = (padre, x, y, z) => { const o = new THREE.Object3D(); o.position.set(x, y, z); padre.add(o); return o }
/** Un gesto che ogni `per` secondi dura `dur` secondi (0..1..0, morbido): deterministico in t. */
export const gesto = (t, per, off, dur) => { const x = (((t + off) % per) + per) % per; if (x >= dur) return 0; const q = Math.sin(x / dur * PI); return q * q }
/** Fasi di un attacco: c carica (sale e scende fino a metà), k scatto (a p = arrivo è 1), a bocca aperta (si chiude all'arrivo). */
export const fasi = (p, A) => {
  let c = liscio(0, A * 0.5, p) * (1 - liscio(A * 0.5, A, p))
  let k = liscio(A * 0.42, A, p) * (1 - liscio(Math.min(0.96, A + 0.12), 1, p))
  const a = liscio(0, A * 0.4, p) * (1 - liscio(A * 0.92, Math.min(0.99, A + 0.05), p))
  const t = c + k; if (t > 1) { c /= t; k /= t }
  return { c, k, a }
}
const ZERO = { c: 0, k: 0, a: 0 }
const ammicca = (g, T) => {
  if (!g.userData._occhi) { g.userData._occhi = []; g.traverse(o => { if (o.userData.occhio) g.userData._occhi.push(o) }) }
  const x = T % 3.7, y = (T + 1.3) % 9.1, bl = Math.max(x < 0.16 ? Math.sin(x / 0.16 * PI) : 0, y < 0.14 ? Math.sin(y / 0.14 * PI) : 0)
  g.userData._occhi.forEach(o => { o.scale.y = 1 - bl * 0.92 })
}
let nIstanza = 0
/** Chiude un mostro: anima(t), attacca(p), attacco, fase. `proiettile`: null o il tipo ('sputo', 'freccia'…), con `origine` il marker. */
export function vivente (g, pose, { tipo, durata, arrivo, origine = null, proiettile = null }) {
  g.userData.fase = (nIstanza++ * 2.37) % 7
  let ult = 0
  g.userData.anima = t => { const T = t + g.userData.fase; ult = T; pose(T, ZERO); ammicca(g, T) }
  g.userData.attacca = p => pose(ult, fasi(p, arrivo))
  g.userData.attacco = { tipo, durata, arrivo, proiettile: proiettile ? { tipo: proiettile, origine } : null }
  if (origine) g.userData.origine = origine
  g.userData.anima(0)
  return g
}

/** Il corpo di una creatura a due gambe: gambe, busto, testa, braccia (perni con la mano in fondo). */
export function umano (o) {
  const { pelle, veste, calzoni, scarpa = 0x2c2119, gamba = 0.4, busto = [0.34, 0.4, 0.2], testa = 0.22, braccio = 0.3, gr = 0.05, sg = 0.06, maniche = true } = o
  const g = new THREE.Group(), mp = M(pelle), mv = M(veste), mc = M(calzoni)
  const P = { g, gambe: [], bracci: [], gomiti: [], mani: [], gamba, busto: null }
  for (const s of [-1, 1]) {
    const an = perno(g, s * busto[0] * 0.27, gamba, 0); P.gambe.push(an)
    arto(an, [0, 0, 0], [0, -gamba * 0.92, 0], sg, sg * 0.82, mc, 7, false)
    sfera(an, sg * 1.5, M(scarpa), 0, -gamba + sg * 0.9, sg * 0.9, 1, 0.65, 1.7, 8)
  }
  const bu = perno(g, 0, gamba, 0); P.busto = bu
  sfera(bu, 0.5, mv, 0, busto[1] / 2, 0, busto[0], busto[1], busto[2], 12)
  sfera(bu, 0.5, mc, 0, 0.02, 0, busto[0] * 0.9, busto[1] * 0.28, busto[2] * 0.95, 10)
  const te = perno(bu, 0, busto[1] + testa * 0.55, busto[2] * 0.1); P.testa = te
  sfera(te, testa, mp, 0, 0, 0, 1, 0.95, 1.02, 14)
  for (const s of [-1, 1]) {
    const sp = perno(bu, s * (busto[0] / 2 + gr * 0.2), busto[1] * 0.88, 0); P.bracci.push(sp)
    arto(sp, [0, 0, 0], [0, -braccio * 0.5, 0], gr, gr * 0.88, maniche ? mv : mp, 7, false)
    const go = perno(sp, 0, -braccio * 0.5, 0); P.gomiti.push(go)
    arto(go, [0, 0, 0], [0, -braccio * 0.5, 0], gr * 0.88, gr * 0.72, mp, 7, false)
    const ma = perno(go, 0, -braccio * 0.52, 0); P.mani.push(ma)
    sfera(ma, gr * 1.15, mp, 0, 0, 0, 1, 1.1, 0.9, 8)
  }
  return P
}

/** Una catena di perni annidati che si arrotola/si muove: `n` pezzi che si assottigliano da r0 a r1, lunghezza totale `lung` verso -y (pendente). */
export function catena (padre, n, lung, r0, r1, mat, seg = 6, dir = -1) {
  const perni = []; let cur = padre; const h = lung / n
  for (let i = 0; i < n; i++) {
    const p = perno(cur, 0, i === 0 ? 0 : dir * h, 0)
    const ra = r0 + (r1 - r0) * (i / n), rb = r0 + (r1 - r0) * ((i + 1) / n)
    cil(p, dir < 0 ? rb : ra, dir < 0 ? ra : rb, h, mat, 0, dir * h / 2, 0, seg)
    if (i < n - 1) sfera(p, rb, mat, 0, dir * h, 0, 1, 1, 1, 6)
    perni.push(p); cur = p
  }
  return perni
}
