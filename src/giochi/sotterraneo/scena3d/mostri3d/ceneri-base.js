// Generato da strumenti/promuovi-3d.mjs da poc/mostri-3d/ceneri-base.js: non si tocca a mano (si cambia il prototipo e si rilancia `npm run promuovi3d`).
// Gli attrezzi comuni dei mostri della piana delle ceneri (livelli 9–11): occhi, fiamme e luci per-oggetto, il ritmo degli attacchi,
// l'idle vivo. Stesso contratto di prati.js (`crea…()` → Group coi piedi a y = 0, davanti +z, `userData.anima(t)`, `attacco`, `attacca(p)`).
// Le luci emissive sono SEMPRE materiali nuovi per istanza (`lum`): così due mostri uguali non pulsano insieme.
import * as THREE from 'three'
import { M, mesh, sfera, rozza, scatola, cil, cono, perno, punta, osso, liscio, onda } from './mostri.js'

export { THREE, M, mesh, sfera, rozza, scatola, cil, cono, perno, punta, osso, liscio, onda }
export const PI = Math.PI
export const NERO = 0x17120f
export const lucido = (c, o = {}) => M(c, { flatShading: false, roughness: 0.25, ...o })

// ── la creazione in corso: luci e fiamme nate dopo `inizia()` finiscono nel mostro che chiude con `vivo()` ──
let cur = { luci: [], fiamme: [], occhi: [] }
export const inizia = () => { cur = { luci: [], fiamme: [], occhi: [] } }
/** Un materiale che brilla, nuovo per questo mostro (pulsa in `vivo`). */
export function lum (c, k = 1.6, o = {}) {
  const m = new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: k, flatShading: false, roughness: 0.4, ...o })
  cur.luci.push({ m, k }); return m
}
/** Una fiammella: tre lingue (esterna, interna, una storta) con la base in y = 0 del suo perno; vive e vacilla in `vivo`. */
export function fiamma (g, x, y, z, h, r, c1 = 0xff5a10, c2 = 0xffc840, ph = Math.random() * 6) {
  const f = perno(g, x, y, z)
  const lingua = (rr, hh, m, ox = 0, oz = 0, inc = 0) => {
    const geo = new THREE.ConeGeometry(rr, hh, 6); geo.translate(0, hh / 2, 0)
    const o = new THREE.Mesh(geo, m); o.position.set(ox, 0, oz); o.rotation.z = inc; f.add(o); return o
  }
  lingua(r * 1.5, h, lum(c1, 1.6)); lingua(r * 0.95, h * 0.72, lum(c2, 2.0), 0, r * 0.1); lingua(r * 0.8, h * 0.6, lum(c1, 1.6), r * 0.8, -r * 0.1, -0.35)
  f.userData.ph = ph; cur.fiamme.push(f); return f
}
/** Un occhio con riflesso; se `emis` brilla (occhi di fuoco). Torna il perno, per ammiccare. */
export function occhio (g, x, y, z, r, iride = 0xffc43a, { emis = 1.2, fessura = false, giro = 0, pupilla = NERO, bianco = null } = {}) {
  const o = perno(g, x, y, z); o.rotation.y = giro; o.userData.occhio = true
  if (bianco) sfera(o, r, lucido(bianco), 0, 0, 0, 1, 1.05, 0.8, 12)
  sfera(o, bianco ? r * 0.62 : r, emis ? lum(iride, emis, { roughness: 0.3 }) : lucido(iride), 0, 0, bianco ? r * 0.3 : 0, 1, 1, 0.75, 12)
  sfera(o, r * 0.45, lucido(pupilla), 0, 0, r * 0.5, fessura ? 0.35 : 1, 1.05, 0.5, 8)
  sfera(o, r * 0.24, lucido(0xffffff, { emissive: 0xffffff, emissiveIntensity: 0.9 }), r * 0.3, r * 0.34, r * 0.62, 1, 1, 0.6, 6)
  return o
}
const SU = new THREE.Vector3(0, 1, 0)
/** Un arto fra due punti (tubo che si assottiglia), con la palla del giunto in `b`. */
export function arto (g, a, b, r1, r2, m, seg = 7, giunto = true) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A), h = d.length()
  const o = cil(g, r2, r1, h, m, 0, 0, 0, seg); o.position.copy(A).addScaledVector(d, 0.5)
  o.quaternion.setFromUnitVectors(SU, d.clone().normalize())
  if (giunto) sfera(g, r2, m, B.x, B.y, B.z, 1, 1, 1, 7)
  return o
}
/** Una zampa a due pezzi (anca → ginocchio → piede) con zampone e artigli. */
export function zampa (g, x, y, z, su, giu, r, mat, matP, claw, opz = {}) {
  const anca = perno(g, x, y, z)
  sfera(anca, r * 1.25, mat, 0, 0, 0, 1, 1.15, 1.05, 9)
  arto(anca, [0, 0, 0], su, r, r * 0.78, mat, 7)
  const gin = perno(anca, ...su)
  arto(gin, [0, 0, 0], giu, r * 0.78, r * 0.62, mat, 7)
  const piede = perno(gin, ...giu)
  sfera(piede, r * 0.95, matP, 0, -r * 0.1, r * 0.55, 1, 0.55, 1.6, 9)
  const n = opz.dita ?? 3
  for (let k = 0; k < n; k++) cono(piede, r * 0.15, r * (opz.lungArt ?? 0.55), claw, (k - (n - 1) / 2) * r * 0.42, -r * 0.2, r * 1.5, 4).rotation.x = PI / 2 - 0.15
  return { anca, gin, piede }
}

// ── il ritmo dell'attacco e i gesti (come prati.js) ──
/** s da −1 (carica) a +1 (colpo a fondo, a p = a), poi 0 a p = 1. W = solo la carica, L = solo lo scatto. */
export function ritmo (p, a) {
  const q = a * 0.55, s = p < q ? -liscio(0, q, p) : p < a ? -1 + 2 * liscio(q, a, p) : 1 - liscio(a, 1, p)
  return { s, W: Math.max(0, -s), L: Math.max(0, s) }
}
export const apertura = (p, a) => liscio(0, a * 0.8, p) * (1 - liscio(a, Math.min(1, a + 0.12), p))
/** Un gesto che si ripete: dentro la finestra [0, dur) ogni `per` secondi dà u (0..1) e b = sin(πu). */
export const evento = (T, per, dur, off = 0) => { const k = (((T + off) % per) + per) % per; return k < dur ? { u: k / dur, b: Math.sin(PI * k / dur) } : { u: 0, b: 0 } }
const ammicca = T => { const c = T % 3.4; return c < 0.16 ? Math.sin(c / 0.16 * PI) : 0 }
export const marcatore = (g, x, y, z) => { const o = new THREE.Object3D(); o.position.set(x, y, z); g.add(o); return o }
export const dichiara = (g, tipo, durata, arrivo, proiettile = null) => { g.userData.attacco = { tipo, durata, arrivo, proiettile }; if (proiettile) g.userData.origine = proiettile.origine }

let nIstanza = 0
/** L'idle: `fn(T)` posa tutto in modo assoluto (T = t + fase di questa istanza); poi occhi che ammiccano, luci che pulsano, fiamme che vacillano. */
export function vivo (g, fn) {
  const mio = cur; cur = { luci: [], fiamme: [], occhi: [] }
  const occhi = []
  g.traverse(o => { if (o.userData.occhio) { o.userData.s0 = o.scale.clone(); occhi.push(o) } })
  g.userData.fase = (nIstanza++ * 2.37) % 7
  g.userData.anima = t => {
    const T = t + g.userData.fase
    fn(T)
    const bl = ammicca(T + 0.7)
    for (const o of occhi) o.scale.set(o.userData.s0.x, o.userData.s0.y * (1 - 0.92 * bl), o.userData.s0.z)
    mio.luci.forEach(({ m, k }, i) => { m.emissiveIntensity = k * (0.82 + 0.18 * Math.sin(T * 4.3 + i * 1.7) + 0.08 * Math.sin(T * 13 + i * 3.1)) })
    mio.fiamme.forEach(f => {
      const a = f.userData.ph, v = 1 + 0.22 * Math.sin(T * 11 + a) + 0.1 * Math.sin(T * 19 + a * 2)
      f.scale.set(1 - (v - 1) * 0.35, v, 1 - (v - 1) * 0.35); f.rotation.z = 0.14 * Math.sin(T * 4.1 + a) + (f.userData.base ?? 0)
    })
  }
  g.userData.anima(0)
  return g
}
