// Le bestiole delle decorazioni (W13): la cuccia, le casette e la vaschetta per gli uccelli, la ciotola, l'apiario e l'alveare, e le bestiole ferme (coniglietto,
// gattino smoking, cucciolo bobtail, pulcino, uccellino, tartarughe, farfalle, coccinella). Fermi: non sono i compagni (compagni.md), che girano e si
// toccano; queste sono un soprammobile da giardino, una mesh fusa l'una. Vedi docs/fattoria3d/decorazioni.md.
import * as THREE from 'three'
import { decoro, mat, pronto, scatola, cilindro, cono, palla, fiore, ciuffo } from './modelli-decori-base.js'
import { tetto } from './modelli.js'

const NERO = 0x25252d, BIANCO = 0xf6f3ec, LEGNO = 0x9a6a36, LEGNO_SCURO = 0x6e4a2c

/** Due occhi neri sul davanti (+z) di una testa a (x, y, z) di raggio r. */
const occhi = (g, x, y, z, r, c = 0x1a1a1e) => { for (const s of [-1, 1]) palla(g, r * 0.14, c, x + s * r * 0.4, y + r * 0.15, z + r * 0.88, 1, 1, 0.6, 0) }
const orecchie = (g, x, y, z, r, colore, alt = 0.14) => { for (const s of [-1, 1]) { const o = cono(g, r * 0.4, alt, mat(colore), x + s * r * 0.55, y + r * 0.85, z, 4); o.rotation.z = -s * 0.2 } }

function cuccia (g, grande) {
  const k = grande ? 1.9 : 1
  scatola(g, 0.8 * k, 0.6, 0.78, mat(0xc4553a), 0, 0.3, -0.02)
  tetto(g, 0.95 * k, 1.0, 0.6, 0x7a4a2a, 0.5)
  scatola(g, 0.34, 0.36, 0.05, mat(0x2a1a14), 0, 0.2, 0.39); const a = cilindro(g, 0.17, 0.17, 0.05, mat(0x2a1a14), 0, 0.38, 0.39, 10); a.rotation.x = Math.PI / 2
  scatola(g, 0.3, 0.1, 0.04, mat(0xfff4d8), 0, 0.64, 0.42)
  cilindro(g, 0.13, 0.1, 0.07, mat(0x2f5fa8), 0.5 * k * 0.6, 0.04, 0.55, 10)
  for (let i = 0; i < 5; i++) palla(g, 0.025, 0x8a5a2a, 0.5 * k * 0.6 + (i - 2) * 0.03, 0.09, 0.55 + (i % 2) * 0.03, 1, 1, 1, 0)
  if (grande) { cilindro(g, 0.04, 0.04, 0.2, mat(0xfff4d8), -0.5, 0.74, 0.43, 5).rotation.z = Math.PI / 2; palla(g, 0.05, 0xfff4d8, -0.6, 0.74, 0.43, 1, 1, 1, 0); palla(g, 0.05, 0xfff4d8, -0.4, 0.74, 0.43, 1, 1, 1, 0) }
}
function casettaUccelli (g, tettoCol, posatoio) {
  cilindro(g, 0.04, 0.05, 1.5, mat(LEGNO_SCURO), 0, 0.75, 0, 6)
  scatola(g, 0.5, 0.42, 0.42, mat(0xe9c27a), 0, 1.7, 0)
  tetto(g, 0.62, 0.62, 1.9, tettoCol, 0.7)
  cilindro(g, 0.09, 0.09, 0.04, mat(0x2a1a14), 0, 1.72, 0.22, 8).rotation.x = Math.PI / 2
  if (posatoio) cilindro(g, 0.015, 0.015, 0.18, mat(LEGNO_SCURO), 0, 1.58, 0.3, 4).rotation.x = Math.PI / 2
  palla(g, 0.06, 0xf0c52a, 0.25, 0.0 + 1.5, 0, 1, 1, 1, 0)
}
function alveareBox (g0, x, z, s = 1) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s); g0.add(g)
  const b = mat(0xf2e6cf), a = mat(0xe8c050)
  scatola(g, 0.5, 0.1, 0.5, mat(LEGNO), 0, 0.28, 0)
  for (let i = 0; i < 3; i++) scatola(g, 0.46, 0.17, 0.46, i % 2 ? a : b, 0, 0.4 + i * 0.17, 0)
  tetto(g, 0.56, 0.56, 0.9, 0xb4553a, 0.3)
  for (const px of [-1, 1]) scatola(g, 0.05, 0.25, 0.05, mat(LEGNO_SCURO), px * 0.2, 0.13, 0.15)
  scatola(g, 0.2, 0.03, 0.03, mat(0x2a1a14), 0, 0.44, 0.24)
  for (const [bx, by, bz] of [[0.18, 0.7, 0.4], [-0.25, 0.55, 0.45], [0.05, 0.85, 0.5]]) palla(g, 0.025, 0xf0c52a, bx, by, bz, 1, 0.8, 1.3, 0)
}

export const BESTIOLE_DECORI = {
  cuccia: decoro('cuccia', g => { cuccia(g, false); return { altezza: 1.2 } }),
  cuccia_grande: decoro('cuccia_grande', g => { cuccia(g, true); return { altezza: 1.3 } }),
  casetta_uccelli: decoro('casetta_uccelli', g => { casettaUccelli(g, 0xc4301f, false); return { altezza: 2.4 } }),
  casetta_uccelli2: decoro('casetta_uccelli2', g => { casettaUccelli(g, 0x3f8a3a, true); return { altezza: 2.4 } }),
  vasca_uccelli: decoro('vasca_uccelli', g => {
    const p = mat(0xd6d1c6)
    cilindro(g, 0.2, 0.26, 0.1, p, 0, 0.05, 0, 10); cilindro(g, 0.09, 0.13, 0.55, p, 0, 0.37, 0, 8); cilindro(g, 0.42, 0.2, 0.14, p, 0, 0.72, 0, 12)
    cilindro(g, 0.34, 0.34, 0.03, mat(0x4ba6d6, { emissive: 0x1a4a66, emissiveIntensity: 0.4 }), 0, 0.78, 0, 12)
    palla(g, 0.075, 0x6aa8e0, 0.34, 0.86, 0.05, 1, 0.9, 1.2, 0); palla(g, 0.05, 0x6aa8e0, 0.4, 0.9, 0.05, 1, 1, 1, 0); cono(g, 0.015, 0.05, mat(0xf0a020), 0.45, 0.9, 0.05, 4).rotation.z = -Math.PI / 2
    return { altezza: 1.0 }
  }),
  ciotola: decoro('ciotola', (g, rnd) => {
    cilindro(g, 0.28, 0.2, 0.14, mat(0x2f5fa8), 0, 0.07, 0, 12); cilindro(g, 0.24, 0.24, 0.02, mat(0x2a1a14), 0, 0.14, 0, 12)
    for (let i = 0; i < 16; i++) { const a = rnd() * 6.28, r = rnd() * 0.18; palla(g, 0.03, 0x8a5a2a, Math.cos(a) * r, 0.17 + rnd() * 0.04, Math.sin(a) * r, 1, 0.8, 1, 0) }
    scatola(g, 0.18, 0.03, 0.1, mat(0xfff4d8), 0, 0.01, 0.4)
    return { altezza: 0.3 }
  }),
  apiario: decoro('apiario', g => { alveareBox(g, -0.5, 0, 1.0); alveareBox(g, 0.5, 0.05, 1.0); ciuffo(g, 0, 0.35, 0x5aa84c, 6, 0.2, () => 0.3); return { altezza: 1.4 } }),
  alveare: decoro('alveare', g => {
    alveareBox(g, 0, 0, 1.3)
    fiore(g, 0.4, 0.3, 0.3, 0xf0c52a, 0.05); fiore(g, -0.4, 0.35, 0.26, 0xf29ab6, 0.05)
    return { altezza: 1.3 }
  }),

  coniglietto: decoro('coniglietto', g => {
    const p = mat(0xe8e2d6)
    palla(g, 0.2, 0xe8e2d6, 0, 0.22, 0, 1, 0.95, 1.25, 1)
    palla(g, 0.14, 0xefe9de, 0, 0.42, 0.2, 1, 1, 1, 1); palla(g, 0.06, 0xf4b6c2, 0, 0.4, 0.34, 1, 0.8, 0.8, 0)
    occhi(g, 0, 0.42, 0.2, 0.14)
    for (const s of [-1, 1]) { const o = palla(g, 0.05, 0xe0b8b4, s * 0.06, 0.66, 0.16, 0.7, 3.2, 0.5, 0); o.rotation.z = -s * 0.12; palla(g, 0.065, 0xe8e2d6, s * 0.065, 0.66, 0.15, 0.8, 3.4, 0.6, 0).rotation.z = -s * 0.12 }
    palla(g, 0.07, 0xffffff, 0, 0.2, -0.27, 1, 1, 1, 0)
    for (const s of [-1, 1]) palla(g, 0.055, 0xdcd5c8, s * 0.12, 0.05, 0.18, 1, 0.7, 1.6, 0)
    ciuffo(g, 0.25, 0.12, 0x5aa84c, 5, 0.18, () => 0.4)
    return { altezza: 0.85 }
  }),
  gattino: decoro('gattino', g => {
    palla(g, 0.17, NERO, 0, 0.2, -0.02, 1, 1.15, 1.1, 1); palla(g, 0.09, BIANCO, 0, 0.17, 0.12, 1, 1.5, 0.7, 0)
    palla(g, 0.13, NERO, 0, 0.45, 0.07, 1, 0.95, 1, 1); palla(g, 0.065, BIANCO, 0, 0.4, 0.17, 1.1, 0.8, 0.8, 0); palla(g, 0.02, 0xf4a6b0, 0, 0.43, 0.22, 1, 0.8, 0.8, 0)
    for (const s of [-1, 1]) { palla(g, 0.022, 0x7ac05a, s * 0.05, 0.48, 0.19, 1, 1.3, 0.6, 0); cono(g, 0.045, 0.1, mat(NERO), s * 0.08, 0.6, 0.06, 4) }
    for (const s of [-1, 1]) palla(g, 0.045, BIANCO, s * 0.08, 0.04, 0.14, 1, 0.8, 1.3, 0)
    for (let i = 0; i < 4; i++) palla(g, 0.04, NERO, 0.15 + Math.sin(i * 0.6) * 0.09, 0.08 + i * 0.07, -0.14 - Math.cos(i * 0.6) * 0.04 * i, 1, 1, 1, 0)
    palla(g, 0.035, BIANCO, 0.3, 0.37, -0.28, 1, 1, 1, 0)
    return { altezza: 0.7 }
  }),
  cucciolo: decoro('cucciolo', g => {
    const grigio = 0x8d9096
    palla(g, 0.2, grigio, 0, 0.22, -0.03, 1, 1.05, 1.15, 1); palla(g, 0.13, BIANCO, 0, 0.18, 0.12, 1, 1.4, 0.7, 0)
    palla(g, 0.15, BIANCO, 0, 0.47, 0.08, 1, 0.95, 1, 1); palla(g, 0.065, grigio, 0, 0.52, 0.0, 1.5, 0.9, 1, 0)
    palla(g, 0.06, 0xf6f3ec, 0, 0.4, 0.2, 1, 0.8, 1, 0); palla(g, 0.03, 0x1a1a1e, 0, 0.43, 0.26, 1, 0.8, 0.8, 0); palla(g, 0.02, 0xf08a9a, 0.0, 0.36, 0.25, 1, 0.6, 0.5, 0)
    occhi(g, 0, 0.5, 0.08, 0.15)
    for (const s of [-1, 1]) { palla(g, 0.06, grigio, s * 0.15, 0.46, 0.04, 0.5, 1.6, 1, 0).rotation.z = -s * 0.25; palla(g, 0.05, BIANCO, s * 0.09, 0.04, 0.14, 1, 0.8, 1.4, 0) }
    palla(g, 0.05, grigio, 0, 0.1, -0.22, 1, 1, 1, 0)
    return { altezza: 0.75 }
  }),
  pulcino: decoro('pulcino', g => {
    palla(g, 0.16, 0xf6d84a, 0, 0.17, 0, 1, 1, 1.05, 1); palla(g, 0.1, 0xf8e062, 0, 0.35, 0.08, 1, 1, 1, 1)
    cono(g, 0.03, 0.07, mat(0xf0a020), 0, 0.34, 0.19, 4).rotation.x = Math.PI / 2
    occhi(g, 0, 0.35, 0.08, 0.1)
    for (const s of [-1, 1]) { cilindro(g, 0.008, 0.008, 0.07, mat(0xf0a020), s * 0.05, 0.035, 0.02, 3); scatola(g, 0.06, 0.01, 0.07, mat(0xf0a020), s * 0.05, 0.005, 0.04) }
    const ala = palla(g, 0.06, 0xe8c83a, 0.15, 0.2, 0, 0.4, 1, 1.2, 0)
    palla(g, 0.07, 0xf2e6cf, -0.3, 0.045, 0.2, 1.1, 0.7, 0.9, 1); palla(g, 0.05, 0xf2e6cf, -0.25, 0.04, 0.3, 1.1, 0.7, 0.9, 0)
    return { altezza: 0.5 }
  }),
  uccellino: decoro('uccellino', g => {
    const v = 0x6ab04a
    const r = cilindro(g, 0.025, 0.03, 0.9, mat(LEGNO_SCURO), 0, 0.2, 0, 5); r.rotation.z = Math.PI / 2; r.position.y = 0.17
    cilindro(g, 0.018, 0.02, 0.22, mat(LEGNO_SCURO), -0.05, 0.28, 0, 4).rotation.z = 0.5
    palla(g, 0.1, v, 0, 0.3, 0, 1, 1.05, 1.4, 1); palla(g, 0.07, 0x8bc86a, 0, 0.43, 0.1, 1, 1, 1, 1)
    cono(g, 0.022, 0.07, mat(0xf0a020), 0, 0.42, 0.2, 4).rotation.x = Math.PI / 2
    occhi(g, 0, 0.43, 0.1, 0.07)
    const co = cono(g, 0.04, 0.22, mat(0x3f8a3a), 0, 0.24, -0.25, 4); co.rotation.x = -Math.PI / 2.4
    for (const s of [-1, 1]) palla(g, 0.05, 0x3f8a3a, s * 0.09, 0.3, -0.02, 0.4, 1, 1.6, 0)
    palla(g, 0.06, 0xf6e9a8, 0, 0.26, 0.07, 1, 1, 1, 0)
    for (const x of [-0.35, 0.3]) palla(g, 0.06, 0x5aa84c, x, 0.2, 0.0, 1, 0.8, 1, 0)
    return { altezza: 0.6 }
  }),
  tartarughe: decoro('tartarughe', g => {
    for (const [x, z, s, rot, c] of [[-0.12, -0.1, 1, 0.3, 0x5a7a3a], [0.28, 0.25, 0.6, -0.5, 0x6a8a4a]]) {
      const t = new THREE.Group(); t.position.set(x, 0, z); t.rotation.y = rot; t.scale.setScalar(s); g.add(t)
      const guscio = pronto(new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), mat(c))); guscio.scale.set(1, 0.7, 1.2); guscio.position.y = 0.08; t.add(guscio)
      for (const [px, pz] of [[0, 0], [0.12, 0.1], [-0.12, 0.1], [0.12, -0.14], [-0.12, -0.14], [0, -0.22]]) palla(t, 0.07, 0xa8b866, px, 0.25 - Math.hypot(px, pz) * 0.2, pz, 1, 0.3, 1, 0)
      palla(t, 0.09, 0x9ab05a, 0, 0.12, 0.38, 1, 0.9, 1.2, 0); occhi(t, 0, 0.12, 0.38, 0.09)
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) palla(t, 0.07, 0x8aa04a, sx * 0.22, 0.04, sz * 0.2, 1, 0.7, 1.2, 0)
      cono(t, 0.04, 0.1, mat(0x8aa04a), 0, 0.06, -0.36, 4).rotation.x = -Math.PI / 2
    }
    return { altezza: 0.4 }
  }),
  farfalla: decoro('farfalla', (g, rnd) => { stelo(g, 0, 0, 0.5, 0xf29ab6); farfalla(g, 0.05, 0.62, 0.02, 1, 0xf08a24, 0.3); return { altezza: 0.9 } }),
  farfalle: decoro('farfalle', g => {
    stelo(g, -0.2, -0.1, 0.45, 0xf29ab6); stelo(g, 0.25, 0.15, 0.55, 0xfff4d8)
    farfalla(g, -0.15, 0.58, -0.05, 1, 0xf08a24, 0.5); farfalla(g, 0.28, 0.7, 0.2, 0.9, 0x5a8ae0, -0.4); farfalla(g, 0.0, 0.85, 0.1, 0.8, 0xf0c52a, 1.2)
    return { altezza: 1.0 }
  }),
  coccinella: decoro('coccinella', g => {
    const f = new THREE.Mesh(new THREE.CircleGeometry(0.3, 8).rotateX(-Math.PI / 2), mat(0x4f9a45)); f.position.y = 0.04; f.scale.set(1, 1, 1.4); g.add(f)
    scatola(g, 0.025, 0.02, 0.8, mat(0x3f8a3a), 0, 0.03, 0)
    const c = pronto(new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), mat(0xd8352a))); c.scale.set(1, 0.8, 1.15); c.position.set(0, 0.05, 0); g.add(c)
    palla(g, 0.075, NERO, 0, 0.1, 0.19, 1, 0.8, 0.8, 0)
    scatola(g, 0.01, 0.01, 0.3, mat(NERO), 0, 0.185, -0.02)
    for (const [x, z] of [[0.08, 0.04], [-0.08, 0.04], [0.09, -0.1], [-0.09, -0.1], [0.0, -0.17]]) palla(g, 0.026, NERO, x, 0.1 + 0.07 - Math.hypot(x, z) * 0.2, z, 1, 0.5, 1, 0)
    return { altezza: 0.35 }
  }),
}
function stelo (g, x, z, h, colore) {
  fiore(g, x, z, h, colore, 0.09)
  for (const s of [-1, 1]) palla(g, 0.06, 0x4f9a45, x + s * 0.1, h * 0.4, z, 1.5, 0.3, 1, 0)
}
/** Una farfalla ferma sopra un fiore: il corpo e quattro ali aperte a «V» (piatte, inclinate). */
function farfalla (g, x, y, z, s, colore, giro) {
  const b = new THREE.Group(); b.position.set(x, y, z); b.rotation.y = giro; b.scale.setScalar(s); g.add(b)
  cilindro(b, 0.012, 0.012, 0.14, mat(NERO), 0, 0, 0, 4).rotation.x = Math.PI / 2
  for (const lato of [-1, 1]) {
    const su = scatola(b, 0.17, 0.008, 0.14, mat(colore), lato * 0.09, 0.02, 0.03); su.rotation.z = lato * 0.5
    const giu = scatola(b, 0.12, 0.008, 0.1, mat(colore === 0xf08a24 ? 0xfac04a : 0x9ac0f0), lato * 0.07, 0.01, -0.07); giu.rotation.z = lato * 0.5
    palla(b, 0.02, NERO, lato * 0.12, 0.05, 0.05, 1, 0.4, 1, 0)
  }
  cilindro(b, 0.003, 0.003, 0.08, mat(NERO), 0.02, 0.03, 0.1, 3).rotation.set(0.3, 0, 0.3); cilindro(b, 0.003, 0.003, 0.08, mat(NERO), -0.02, 0.03, 0.1, 3).rotation.set(0.3, 0, -0.3)
}
