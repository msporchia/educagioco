// Generato da strumenti/promuovi-3d.mjs da poc/mostri-3d/landa-base.js: non si tocca a mano (si cambia il prototipo e si rilancia `npm run promuovi3d`).
// Gli attrezzi comuni dei mostri della landa vecchia (foresta nera, landa, tombe, abisso). Autonomo: solo three e mostri.js.
// Stesso contratto dei mostri dei prati e del bosco: `userData.anima(t)` (idle) e `userData.attacca(p)` (da chiamare dopo anima).
import * as THREE from 'three'
import { M, mesh, sfera, rozza, scatola, cil, cono, perno, punta, osso, liscio, onda } from './mostri.js'

export { THREE, M, mesh, sfera, rozza, scatola, cil, cono, perno, punta, osso, liscio, onda }
export const PI = Math.PI
export const V3 = THREE.Vector3
export const SU = new V3(0, 1, 0)
export const NERO = 0x120e12

export const lucido = (c, o = {}) => M(c, { flatShading: false, roughness: 0.25, ...o })
export const lum = (c, k = 1.6, o = {}) => M(c, { emissive: c, emissiveIntensity: k, flatShading: false, roughness: 0.4, ...o })
/** Un materiale tutto nostro (non in cache): per le luci che pulsano e per le cose che sfumano. */
export const vivoMat = (c, k = 1.6, o = {}) => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: k, roughness: 0.4, ...o })

/** Un arto fra due punti (tubo che si assottiglia), con la palla del giunto solo in `b`. */
export function arto (g, a, b, r1, r2, m, seg = 6, giunto = true) {
  const A = new V3(...a), B = new V3(...b), d = B.clone().sub(A), h = d.length()
  const o = cil(g, r2, r1, h, m, 0, 0, 0, seg); o.position.copy(A).addScaledVector(d, 0.5)
  o.quaternion.setFromUnitVectors(SU, d.clone().normalize())
  if (giunto) sfera(g, r2, m, B.x, B.y, B.z, 1, 1, 1, 7)
  return o
}
/** Un occhio che ammicca (`userData.occhio`): `colore` emissivo, pupilla scura, riflesso. */
export function occhio (g, x, y, z, r, colore, { emis = 1.6, fessura = false, giro = 0, pupilla = NERO, sclera = null } = {}) {
  const o = perno(g, x, y, z); o.rotation.y = giro; o.userData.occhio = true
  if (sclera) sfera(o, r, lucido(sclera), 0, 0, 0, 1, 1, 0.75, 10)
  else sfera(o, r, vivoMat(colore, emis, { flatShading: false }), 0, 0, 0, 1, 1, 0.75, 10)
  if (sclera) sfera(o, r * 0.62, lum(colore, emis), 0, 0, r * 0.3, 1, 1, 0.7, 8)
  sfera(o, r * 0.45, lucido(pupilla), 0, 0, r * 0.5, fessura ? 0.35 : 1, 1.1, 0.5, 8)
  sfera(o, r * 0.24, lum(0xffffff, 0.8), r * 0.28, r * 0.32, r * 0.62, 1, 1, 0.6, 5)
  return o
}
/** Un occhio acceso e basta (luce senza iride): per ombre, elmi, spettri. Ammicca. */
export function lume (g, x, y, z, r, colore, { sx = 1, sy = 1, emis = 3.5, mat = null } = {}) {
  const o = perno(g, x, y, z); o.userData.occhio = true
  const s = sfera(o, r, mat ?? vivoMat(colore, emis, { flatShading: false }), 0, 0, 0, sx, sy, 0.55, 8); s.castShadow = false
  return o
}

// ── l'attacco ─────────────────────────────────────────────────────────────────────────────────────────────────────
/** Le fasi di un attacco: c = in carica (anticipazione), k = nello scatto, a = bocca/pinze aperte. A p = 0 e p = 1 sono tutte 0. */
export const fasi = (p, A) => {
  let c = liscio(0, A * 0.5, p) * (1 - liscio(A * 0.5, A, p))
  let k = liscio(A * 0.42, A, p) * (1 - liscio(Math.min(0.96, A + 0.12), 1, p))
  const a = liscio(0, A * 0.4, p) * (1 - liscio(A * 0.92, Math.min(0.99, A + 0.05), p))
  const t = c + k; if (t > 1) { c /= t; k /= t }
  return { c, k, a }
}
/** Porta v (Vector3 o Euler) verso `car` nella carica e verso `col` nello scatto (null = lascia com'è). */
export const imp = (v, F, car, col) => {
  ['x', 'y', 'z'].forEach((a, i) => {
    const c0 = car?.[i], k0 = col?.[i]; if (c0 == null && k0 == null) return
    const cur = v[a]; v[a] = cur + ((c0 ?? cur) - cur) * F.c + ((k0 ?? cur) - cur) * F.k
  })
}
export const apre = (o, F, val) => { o.rotation.x += (val - o.rotation.x) * F.a }
/** Un gesto che ogni `per` secondi dura `dur` secondi (0..1..0, morbido): deterministico in t. */
export const gesto = (t, per, off, dur) => { const x = (((t + off) % per) + per) % per; if (x >= dur) return 0; const q = Math.sin(x / dur * PI); return q * q }
const ammicca = (g, T) => {
  if (!g.userData._occhi) { g.userData._occhi = []; g.traverse(o => { if (o.userData.occhio) g.userData._occhi.push(o) }) }
  const x = T % 3.7, y = (T + 1.3) % 9.1, bl = Math.max(x < 0.16 ? Math.sin(x / 0.16 * PI) : 0, y < 0.14 ? Math.sin(y / 0.14 * PI) : 0)
  g.userData._occhi.forEach(o => { o.scale.y = 1 - bl * 0.92 })
}
const memo = vs => { const s0 = vs.map(v => v.clone()); return () => vs.forEach((v, i) => v.copy(s0[i])) }
export const marker = (padre, x, y, z) => { const o = new THREE.Object3D(); o.position.set(x, y, z); padre.add(o); return o }
export const dichiara = (g, tipo, durata, arrivo, proiettile = null) => { g.userData.attacco = { tipo, durata, arrivo, proiettile }; if (proiettile) g.userData.origine = proiettile.origine }

let nIst = 0
/**
 * Incarta l'idle: tempo di ogni istanza t + fase, ripristino della posa di riposo di quel che `attacca` tocca (`tocca`: Vector3/Euler),
 * ammiccamento degli `userData.occhio`. Va chiamata a modello finito, DOPO aver dichiarato attacco e attacca.
 */
export function vivifica (g, anima, tocca = []) {
  const r0 = memo(tocca)
  g.userData.fase = (nIst++ * 2.37) % 7
  g.userData.anima = t => { const T = t + g.userData.fase; r0(); anima(T); ammicca(g, T) }
  g.userData.anima(0)
  return g
}

/** Una striscia stracciata: pannello piatto a due facce che pende da un perno (cappe, bende, bandiere). */
export function lembo (g, w, h, m, x, y, z, rotX = 0, rotY = 0, rotZ = 0) {
  const o = perno(g, x, y, z); o.rotation.set(rotX, rotY, rotZ)
  const mm = new THREE.Mesh(new THREE.PlaneGeometry(w, h, 1, 2), m)
  mm.position.y = -h / 2; mm.castShadow = true; o.add(mm)
  return o
}
export const doppio = (c, o = {}) => M(c, { side: THREE.DoubleSide, roughness: 0.9, ...o })

/** Il corpo di una creatura a due gambe: gambe, busto, testa (opzionale), braccia con gomito e mano (perni). */
export function umano (o) {
  const { pelle, veste, calzoni, scarpa = 0x2c2119, gamba = 0.4, busto = [0.34, 0.4, 0.2], testa = 0.2, braccio = 0.3, gr = 0.05, sg = 0.06, maniche = true, senzaTesta = false, senzaMani = false, piedi = true } = o
  const g = new THREE.Group(), mp = M(pelle), mv = M(veste), mc = M(calzoni)
  const P = { g, gambe: [], ginocchia: [], bracci: [], gomiti: [], mani: [] }
  for (const s of [-1, 1]) {
    const an = perno(g, s * busto[0] * 0.27, gamba, 0); P.gambe.push(an)
    osso(an, [0, 0, 0], [0, -gamba * 0.92, 0], sg, sg * 0.82, mc, 7)
    if (piedi) sfera(an, sg * 1.5, M(scarpa), 0, -gamba + sg * 0.9, sg * 0.9, 1, 0.65, 1.7, 8)
  }
  const bu = perno(g, 0, gamba, 0); P.busto = bu
  sfera(bu, 0.5, mv, 0, busto[1] / 2, 0, busto[0], busto[1], busto[2], 12)
  sfera(bu, 0.5, mc, 0, 0.02, 0, busto[0] * 0.9, busto[1] * 0.28, busto[2] * 0.95, 10)
  const te = perno(bu, 0, busto[1] + testa * 0.55, busto[2] * 0.1); P.testa = te
  if (!senzaTesta) sfera(te, testa, mp, 0, 0, 0, 1, 0.95, 1.02, 14)
  for (const s of [-1, 1]) {
    const sp = perno(bu, s * (busto[0] / 2 + gr * 0.2), busto[1] * 0.88, 0); P.bracci.push(sp)
    osso(sp, [0, 0, 0], [0, -braccio * 0.5, 0], gr, gr * 0.88, maniche ? mv : mp, 7)
    const go = perno(sp, 0, -braccio * 0.5, 0); P.gomiti.push(go)
    osso(go, [0, 0, 0], [0, -braccio * 0.5, 0], gr * 0.88, gr * 0.72, mp, 7)
    const ma = perno(go, 0, -braccio * 0.52, 0); P.mani.push(ma)
    if (!senzaMani) sfera(ma, gr * 1.15, mp, 0, 0, 0, 1, 1.1, 0.9, 8)
  }
  return P
}
