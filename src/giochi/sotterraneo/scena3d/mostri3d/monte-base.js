// Generato da strumenti/promuovi-3d.mjs da poc/mostri-3d/monte-base.js: non si tocca a mano (si cambia il prototipo e si rilancia `npm run promuovi3d`).
// Gli attrezzi comuni dei mostri del monte (poc/mostri-3d/monte*.js): occhi, arti, il corpo a due gambe, il ritmo degli attacchi, il
// moto da fermo condiviso. Autonomo: solo three e gli attrezzi di mostri.js. Stesso contratto dei prati e del bosco.
import * as THREE from 'three'
import { M, mesh, sfera, rozza, scatola, cil, cono, perno, punta, osso, liscio, onda } from './mostri.js'

export { THREE, M, mesh, sfera, rozza, scatola, cil, cono, perno, punta, osso, liscio, onda }
export const PI = Math.PI
export const V3 = THREE.Vector3
export const SU = new V3(0, 1, 0)
export const NERO = 0x14100f

/** Un materiale che luce da sé, NUOVO a ogni chiamata (così pulsa per istanza senza svegliare le altre). */
export const lumi = (c, k = 1.6, o = {}) => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: k, roughness: 0.4, ...o })
/** Come `lumi` ma condiviso (per i riflessi fissi). */
export const lum = (c, k = 1.6, o = {}) => M(c, { emissive: c, emissiveIntensity: k, flatShading: false, roughness: 0.4, ...o })
export const lucido = (c, o = {}) => M(c, { flatShading: false, roughness: 0.25, ...o })
export const senzaOmbra = o => { o.castShadow = false; return o }

/** Un arto fra due punti (tubo che si assottiglia), con la palla del giunto solo in `b`. */
export function arto (g, a, b, r1, r2, m, seg = 7, giunto = true) {
  const A = new V3(...a), B = new V3(...b), d = B.clone().sub(A), h = d.length()
  const o = cil(g, r2, r1, h, m, 0, 0, 0, seg); o.position.copy(A).addScaledVector(d, 0.5)
  o.quaternion.setFromUnitVectors(SU, d.clone().normalize())
  if (giunto) sfera(g, r2, m, B.x, B.y, B.z, 1, 1, 1, 7)
  return o
}

/** Un occhio con iride, pupilla e riflesso; torna il perno (ammicca con scale.y). `giro`: quanto guarda di lato. */
export function occhio (g, x, y, z, r, iride, { emis = 0.6, fessura = false, giro = 0, pupilla = NERO, bianco = null } = {}) {
  const o = perno(g, x, y, z); o.rotation.y = giro; o.userData.occhio = true
  if (bianco) sfera(o, r * 1.15, lucido(bianco), 0, 0, -r * 0.1, 1, 1.05, 0.75, 10)
  sfera(o, r, lum(iride, emis, { roughness: 0.3 }), 0, 0, 0, 1, 1, 0.75, 12)
  sfera(o, r * 0.5, lucido(pupilla), 0, 0, r * 0.5, fessura ? 0.4 : 1, 1.05, 0.5, 8)
  sfera(o, r * 0.26, lum(0xffffff, 0.8), r * 0.3, r * 0.34, r * 0.62, 1, 1, 0.6, 6)
  return o
}

/** Una zampa a due pezzi per le bestie: anca → ginocchio → piede con artigli o zoccolo. */
export function zampa (g, x, y, z, su, giu, r, mat, matP, claw, opz = {}) {
  const anca = perno(g, x, y, z)
  sfera(anca, r * 1.25, mat, 0, 0, 0, 1, 1.15, 1.05, 9)
  arto(anca, [0, 0, 0], su, r, r * 0.78, mat, 7)
  const gin = perno(anca, ...su)
  arto(gin, [0, 0, 0], giu, r * 0.78, r * 0.62, mat, 7)
  const piede = perno(gin, ...giu)
  if (opz.zoccolo) {
    const zo = cil(piede, r * 0.7, r * 0.82, r * 0.7, matP, 0, -r * 0.3, 0.02, 7)
    zo.userData.zoccolo = true
  } else {
    sfera(piede, r * 0.95, matP, 0, -r * 0.1, r * 0.55, 1, 0.55, 1.6, 9)
    const n = opz.dita ?? 3
    for (let k = 0; k < n; k++) cono(piede, r * 0.15, r * (opz.lungArt ?? 0.55), claw, (k - (n - 1) / 2) * r * 0.42, -r * 0.2, r * 1.5, 4).rotation.x = PI / 2 - 0.15
  }
  return { anca, gin, piede }
}

/** Il corpo di una creatura a due gambe. Perni: gambe[2] (anca), gin[2] (ginocchio), busto, testa, bracci[2] (spalla), gomiti[2], mani[2].
 *  `roccia`: forme spigolose (icosaedri) invece di sfere. Il piede tocca y = 0. */
export function figura (o) {
  const { pelle, pelle2 = pelle, calzoni = pelle, veste = pelle, scarpa = pelle2, gamba = 0.5, busto = [0.5, 0.55, 0.35], testa = 0.2, braccio = 0.5,
    gr = 0.09, sg = 0.1, spalla = 0, collo = 0, piede = 1, mano = 1.2, seg = 8, roccia = false, bracciaMat = null } = o
  const g = new THREE.Group()
  const mp = M(pelle), m2 = M(pelle2), mc = M(calzoni), mv = M(veste), ms = M(scarpa), mb = bracciaMat ?? mp
  const S = roccia ? (gg, r, m, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1) => rozza(gg, r, m, x, y, z, sx, sy, sz, 1) : sfera
  const P = { g, gambe: [], gin: [], bracci: [], gomiti: [], mani: [], hip: gamba, mp, m2, mc, mv, S }
  for (const s of [-1, 1]) {
    const an = perno(g, s * busto[0] * 0.28, gamba, 0); P.gambe.push(an)
    arto(an, [0, 0, 0], [0, -gamba * 0.5, 0], sg * 1.05, sg * 0.92, mc, seg)
    const gi = perno(an, 0, -gamba * 0.5, 0); P.gin.push(gi)
    arto(gi, [0, 0, 0], [0, -gamba * 0.46, 0], sg * 0.92, sg * 0.78, mc, seg)
    const rf = sg * 1.1 * piede
    S(gi, rf, ms, 0, -gamba * 0.5 + rf * 0.55, rf * 0.7, 1, 0.55, 1.6)
  }
  const bu = perno(g, 0, gamba, 0); P.busto = bu
  S(bu, 0.5, mv, 0, busto[1] * 0.5, 0, busto[0], busto[1], busto[2])
  S(bu, 0.5, mc, 0, 0.0, 0, busto[0] * 0.9, busto[1] * 0.3, busto[2] * 0.95)
  const te = perno(bu, 0, busto[1] + testa * 0.5 + collo, busto[2] * 0.1); P.testa = te
  S(te, testa, mp, 0, 0, 0, 1, 0.95, 1.02)
  for (const s of [-1, 1]) {
    const sp = perno(bu, s * (busto[0] / 2 + gr * 0.1), busto[1] * 0.88, 0); P.bracci.push(sp)
    if (spalla) S(sp, spalla, m2, 0, 0.02, 0, 1, 0.9, 1)
    arto(sp, [0, 0, 0], [0, -braccio * 0.5, 0], gr, gr * 0.88, mb, seg)
    const go = perno(sp, 0, -braccio * 0.5, 0); P.gomiti.push(go)
    arto(go, [0, 0, 0], [0, -braccio * 0.5, 0], gr * 0.88, gr * 0.74, mp, seg)
    const ma = perno(go, 0, -braccio * 0.52, 0); P.mani.push(ma)
    S(ma, gr * mano, mp, 0, -gr * 0.2, 0, 1, 1.1, 0.95)
  }
  return P
}

/** Il moto da fermo comune a chi sta su due gambe. Assegna (non somma) ogni perno che `attacca` può toccare. `k.riposo`: rotazioni a riposo. */
export function idleUmano (P, T, k = {}) {
  const { respiro = 0.025, rit = 1, riposoB = [-0.1, -0.1], zB = 0.08, gom = [-0.15, -0.15], testa = [0.05, 0], oscilla = 0.05, peso = 0.03, bob = 0.025, muoviBraccia = 1 } = k
  const f = Math.sin(T * 2.0 * rit), w = Math.sin(T * 0.7 * rit), rock = Math.sin(T * 1.25 * rit * PI)   // rock: il dondolo ~0.6 Hz
  const bobbo = Math.abs(Math.sin(T * 1.25 * rit * PI))
  P.g.position.set(0, 0, 0); P.g.rotation.set(0, Math.sin(T * 0.35) * 0.05, w * oscilla * 0.3)
  P.busto.scale.set(1 + f * respiro * 0.5, 1 + f * respiro, 1 + f * respiro * 0.5)
  P.busto.position.set(w * peso, P.hip - bobbo * bob * 0.5, 0)
  P.busto.rotation.set(0.02 + f * 0.01, w * oscilla * 0.8, rock * oscilla * 0.4)
  P.testa.rotation.set(testa[0] + Math.sin(T * 0.8) * 0.05, testa[1] + Math.sin(T * 0.45 * rit) * 0.35 + Math.sin(T * 1.1) * 0.06, Math.sin(T * 0.6) * 0.05)
  P.bracci.forEach((b, i) => {
    const s = i ? 1 : -1
    b.rotation.set(riposoB[i] + muoviBraccia * (Math.sin(T * 1.7 * rit + i * 1.3) * 0.05 - rock * 0.03 * s), 0, s * zB)
    P.gomiti[i].rotation.set(gom[i] + muoviBraccia * Math.sin(T * 2.3 * rit + i) * 0.06, 0, 0)
  })
  P.gambe.forEach((a, i) => {
    const s = i ? 1 : -1
    a.rotation.set(Math.sin(T * 0.6 * rit + i * PI) * 0.05 * 0.8 - bobbo * bob * 0.6, 0, 0)
    P.gin[i].rotation.set(bobbo * bob * 1.8 + Math.max(0, s * w) * 0.04, 0, 0)
  })
}

// ── l'attacco ────────────────────────────────────────────────────────────────────────────────────────────────────
/** s da −1 (carica indietro) a +1 (colpo a fondo, a p = arrivo), poi 0 a p = 1. W = solo la carica, L = solo lo scatto. */
export function ritmo (p, a) {
  const q = a * 0.55, s = p < q ? -liscio(0, q, p) : p < a ? -1 + 2 * liscio(q, a, p) : 1 - liscio(a, 1, p)
  return { s, W: Math.max(0, -s), L: Math.max(0, s) }
}
export const apertura = (p, a) => liscio(0, a * 0.8, p) * (1 - liscio(a, Math.min(1, a + 0.12), p))
export const marcatore = (g, x, y, z) => { const o = new THREE.Object3D(); o.position.set(x, y, z); g.add(o); return o }
export const dichiara = (g, tipo, durata, arrivo, proiettile = null) => {
  g.userData.attacco = { tipo, durata, arrivo, proiettile }
  if (proiettile) g.userData.origine = proiettile.origine
}
/** Un gesto che si ripete: dentro [0, dur) ogni `per` secondi dà u (0..1) e b = sin(πu). */
export const evento = (T, per, dur, off = 0) => { const k = (((T + off) % per) + per) % per; return k < dur ? { u: k / dur, b: Math.sin(PI * k / dur) } : { u: 0, b: 0 } }
const ammicca = T => { const c = T % 3.4; return c < 0.16 ? Math.sin(c / 0.16 * PI) : 0 }

let nIstanza = 0
/** Chiude un mostro: `idle(T)` (T = t + fase) assegna tutte le pose; gli occhi fatti con `occhio()` ammiccano da soli. */
export function chiudi (g, idle) {
  const occhi = []
  g.traverse(o => { if (o.userData.occhio) { o.userData.s0 = o.scale.clone(); occhi.push(o) } })
  g.userData.fase = (nIstanza++ * 2.37) % 7
  g.userData.anima = t => {
    const T = t + g.userData.fase
    idle(T)
    const bl = ammicca(T + 0.7)
    for (const o of occhi) o.scale.set(o.userData.s0.x, o.userData.s0.y * (1 - 0.92 * bl), o.userData.s0.z)
  }
  g.userData.anima(0)
  return g
}

// ── i fulmini ────────────────────────────────────────────────────────────────────────────────────────────────────
const hash = (a, b) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x) }
/** Un fulmine a zigzag: n segmenti sottili che si riposizionano con `imposta(A, B, seme, ampiezza)`. */
export function fulmine (parent, n, r, mat) {
  const segs = []
  for (let i = 0; i < n; i++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 1, 4), mat); parent.add(c); segs.push(c) }
  const pts = Array.from({ length: n + 1 }, () => new V3()), dir = new V3(), u = new V3(), v = new V3()
  return {
    segs,
    mostra (on) { segs.forEach(s => { s.visible = on }) },
    imposta (A, B, seme, ampiezza = 0.1) {
      dir.copy(B).sub(A)
      const L = dir.length(); dir.normalize()
      u.set(0, 1, 0).cross(dir); if (u.lengthSq() < 1e-4) u.set(1, 0, 0); u.normalize(); v.copy(dir).cross(u)
      for (let i = 0; i <= n; i++) {
        const e = Math.sin(PI * i / n) * ampiezza
        pts[i].copy(A).addScaledVector(dir, L * i / n).addScaledVector(u, (hash(seme, i) - 0.5) * 2 * e).addScaledVector(v, (hash(seme + 7, i) - 0.5) * 2 * e)
      }
      for (let i = 0; i < n; i++) {
        const s = segs[i], d = pts[i + 1].clone().sub(pts[i]), h = d.length()
        s.position.copy(pts[i]).addScaledVector(d, 0.5); s.scale.set(1, h, 1); s.quaternion.setFromUnitVectors(SU, d.normalize())
      }
    },
  }
}

/** Una penna / lamina piatta e affusolata lungo +x da 0 a `lung`, larga `lar` (per le ali). */
export function penna (g, lung, lar, m, x = 0, y = 0, z = 0, rotZ = 0) {
  const sh = new THREE.Shape()
  sh.moveTo(0, -lar * 0.5); sh.lineTo(lung * 0.7, -lar * 0.5); sh.lineTo(lung, 0); sh.lineTo(lung * 0.7, lar * 0.5); sh.lineTo(0, lar * 0.5); sh.closePath()
  const o = new THREE.Mesh(new THREE.ShapeGeometry(sh), m); o.castShadow = true; o.position.set(x, y, z); o.rotation.z = rotZ; g.add(o)
  return o
}
export const sempre = m => { m.side = THREE.DoubleSide; return m }

/** Un cono che parte da (x, y, z) e va nella direzione `dir` (punte, ciuffi di pelo, corna dritte). */
export function ciuffo (g, m, x, y, z, dir, r, h, seg = 4) {
  const d = new V3(...dir).normalize(), c = cono(g, r, h, m, 0, 0, 0, seg)
  c.position.set(x, y, z).addScaledVector(d, h / 2); c.quaternion.setFromUnitVectors(SU, d)
  return c
}
