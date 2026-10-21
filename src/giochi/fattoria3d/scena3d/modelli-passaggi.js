// Ponte, passerella e tavolo con le panche: tre pezzi presi dal mondo di sopra del Sotterraneo 3D (ponti.js: `ponte`, props-modelli.js:
// `tavolo`) e rifatti qui con i mattoncini e i materiali della fattoria. Una copia e non un import: i modelli del sotterraneo si posano in
// un «cantiere» che vuole le sue trame, la sua nebbia e il suo mondo (vedi docs/fattoria3d/scena.md, «Ponte, passerella e tavolo»).
// Origine al centro dell'impronta, davanti verso +z; la quota di chi ci cammina sopra sta in dati/catalogo.js (`alzato`).
import * as THREE from 'three'
import { mat } from './modelli.js'
import { fondiPerMateriale } from './fondi.js'
import { memoModello } from './cache-modelli.js'

function pronto (m) { m.castShadow = true; m.receiveShadow = true; return m }
function scatola (g, w, h, d, m, x = 0, y = 0, z = 0) {
  const o = pronto(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m)); o.position.set(x, y, z); g.add(o); return o
}
function cilindro (g, rs, ri, h, m, x = 0, y = 0, z = 0, seg = 8) {
  const o = pronto(new THREE.Mesh(new THREE.CylinderGeometry(rs, ri, h, seg), m)); o.position.set(x, y, z); g.add(o); return o
}

/** La gobba del ponte lungo x: l'altezza della strada in x (−1,5…1,5). Le quote per cella di dati/catalogo.js (0,25 · 0,36 · 0,25) la campionano. */
const GOBBA = x => 0.1 + 0.26 * (1 - (x / 1.5) ** 2)

// ── il ponte ad arco di pietra: 3×1, sulla gobba si cammina; sotto, l'arcata ──
function costruisciPonte () {
  const g = new THREE.Group()
  const pietra = mat(0xb9b4aa), chiara = mat(0xd6d1c6), scura = mat(0x8d887e)
  const N = 12, L = 3, prof = 0.8
  const s = new THREE.Shape()
  s.moveTo(-L / 2, 0); s.lineTo(-0.85, 0)
  s.absellipse(0, 0, 0.85, GOBBA(0) - 0.1, Math.PI, 0, true)
  s.lineTo(L / 2, 0)
  for (let i = N; i >= 0; i--) s.lineTo(-L / 2 + L * i / N, GOBBA(-L / 2 + L * i / N))
  s.closePath()
  const geo = new THREE.ExtrudeGeometry(s, { depth: prof, bevelEnabled: false, curveSegments: 14 }); geo.translate(0, 0, -prof / 2)
  g.add(pronto(new THREE.Mesh(geo, pietra)))
  // i parapetti: pezzi dritti che seguono la gobba, con il cappello più chiaro; due pilastrini a ogni capo
  for (const lato of [-1, 1]) {
    for (let i = 0; i < N; i++) {
      const xa = -L / 2 + L * i / N, xb = xa + L / N, ya = GOBBA(xa), yb = GOBBA(xb), lung = Math.hypot(L / N, yb - ya) + 0.02
      const muro = scatola(g, lung, 0.22, 0.12, scura, (xa + xb) / 2, (ya + yb) / 2 + 0.11, lato * 0.36); muro.rotation.z = Math.atan2(yb - ya, L / N)
      const cap = scatola(g, lung, 0.04, 0.17, chiara, (xa + xb) / 2, (ya + yb) / 2 + 0.24, lato * 0.36); cap.rotation.z = Math.atan2(yb - ya, L / N)
    }
    for (const x of [-1.42, 1.42]) { scatola(g, 0.2, 0.42, 0.2, pietra, x, GOBBA(x) + 0.2, lato * 0.36); scatola(g, 0.25, 0.05, 0.25, chiara, x, GOBBA(x) + 0.43, lato * 0.36) }
  }
  g.userData.altezza = 0.9
  fondiPerMateriale(g)
  return g
}

// ── la passerella: 1×3 (lungo z), assi di legno su pali, con la corda come mancorrente ──
function costruisciPasserella () {
  const g = new THREE.Group()
  const asse = [mat(0xa97a46), mat(0x9a6a36), mat(0xb88a52)], trave = mat(0x6e4a28), palo = mat(0x5a3a22), corda = mat(0xd8c08a)
  const Q = 0.18, N = 11, L = 2.9
  for (let i = 0; i < N; i++) {
    const z = -L / 2 + (i + 0.5) * L / N
    const a = scatola(g, 0.84, 0.045, L / N - 0.035, asse[i % 3], Math.sin(i * 7.1) * 0.015, Q - 0.0225, z); a.rotation.y = Math.sin(i * 3.3) * 0.02
  }
  for (const x of [-0.3, 0.3]) scatola(g, 0.09, 0.08, L, trave, x, Q - 0.09, 0)
  for (const z of [-1.2, 0, 1.2]) for (const x of [-0.34, 0.34]) cilindro(g, 0.055, 0.065, Q + 0.04, palo, x, (Q + 0.04) / 2 - 0.04, z, 7)
  // i paletti dei capi e di mezzo, e la corda che pende fra l'uno e l'altro
  const zs = [-1.4, 0, 1.4]
  for (const x of [-0.42, 0.42]) {
    for (const z of zs) cilindro(g, 0.04, 0.05, 0.62, palo, x, Q + 0.29, z, 6)
    for (let k = 0; k < 2; k++) for (let i = 0; i < 4; i++) {
      const za = zs[k] + (zs[k + 1] - zs[k]) * i / 4, zb = zs[k] + (zs[k + 1] - zs[k]) * (i + 1) / 4
      const ya = Q + 0.52 - Math.sin(Math.PI * i / 4) * 0.1, yb = Q + 0.52 - Math.sin(Math.PI * (i + 1) / 4) * 0.1
      const c = cilindro(g, 0.018, 0.018, Math.hypot(zb - za, yb - ya) + 0.01, corda, x, (ya + yb) / 2, (za + zb) / 2, 5)
      c.rotation.x = Math.PI / 2 - Math.atan2(yb - ya, zb - za)
    }
  }
  g.userData.altezza = 0.8
  fondiPerMateriale(g)
  return g
}

// ── il tavolo con le panche: 3×2, un tavolo lungo con la tovaglia a quadri, due panche, due boccali, il pane e un piatto ──
function costruisciTavolo () {
  const g = new THREE.Group()
  const piano = mat(0xb08450), gamba = mat(0x6e4a28), panca = mat(0x9a6a36), rosso = mat(0xd8352a), bianco = mat(0xfff4e0)
  const LT = 2.3, WT = 0.9, HT = 0.74
  scatola(g, LT, 0.07, WT, piano, 0, HT, 0)
  for (let i = 0; i < 6; i++) scatola(g, 0.4, 0.012, WT - 0.1, i % 2 ? rosso : bianco, -0.95 + i * 0.38, HT + 0.04, 0)     // la tovaglia, a strisce
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) scatola(g, 0.09, HT, 0.09, gamba, sx * (LT / 2 - 0.2), HT / 2, sz * (WT / 2 - 0.1))
  scatola(g, LT - 0.5, 0.05, 0.06, gamba, 0, 0.3, 0)
  for (const s of [-1, 1]) {
    scatola(g, LT - 0.15, 0.06, 0.32, panca, 0, 0.42, s * 0.74)
    for (const x of [-1, 1]) scatola(g, 0.08, 0.4, 0.26, gamba, x * (LT / 2 - 0.35), 0.2, s * 0.74)
  }
  // sul tavolo: due boccali, il piatto col pane, la brocca
  for (const [x, z] of [[-0.6, 0.15], [0.7, -0.18]]) { cilindro(g, 0.07, 0.06, 0.13, mat(0xd8c08a), x, HT + 0.11, z, 8); cilindro(g, 0.06, 0.06, 0.02, mat(0xf3e2b0), x, HT + 0.18, z, 8) }
  cilindro(g, 0.17, 0.15, 0.025, mat(0xe9e4d6), 0.05, HT + 0.06, 0.02, 12)
  const pane = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), mat(0xc88a3e)); pane.scale.set(1.3, 0.7, 0.9); pane.position.set(0.05, HT + 0.12, 0.02); g.add(pronto(pane))
  cilindro(g, 0.07, 0.09, 0.2, mat(0x6aa0c8), -0.1, HT + 0.14, -0.25, 8)
  g.userData.altezza = 1.0
  fondiPerMateriale(g)
  return g
}

// la cache (scena3d/cache-modelli.js): costruiti e fusi una volta, le istanze sono cloni
export const creaPonte = memoModello('ponte', costruisciPonte)
export const creaPasserella = memoModello('passerella', costruisciPasserella)
export const creaTavolo = memoModello('tavolo', costruisciTavolo)
