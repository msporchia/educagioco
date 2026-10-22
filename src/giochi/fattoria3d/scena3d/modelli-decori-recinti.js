// I recinti delle decorazioni (W10): staccionate, cancello, ringhiera, colonna, pergole, gazebo, i cartelli (e i sedici delle colture) e le bandiere.
// Tutti sono lunghi lungo x col davanti verso +z (si girano col ↻); fusi in una mesh, la bandiera tiene a parte il drappo che sventola.
// Vedi docs/fattoria3d/decorazioni.md.
import * as THREE from 'three'
import { decoro, mat, pronto, scatola, cilindro, cono, palla, frutto, ciuffo, COLTURE_DECORI } from './modelli-decori-base.js'
import { fondiPerMateriale } from './fondi.js'

const LEGNO = 0x9a6a36, LEGNO_SCURO = 0x6e4a2c, BIANCO = 0xf4efe4, FERRO = 0x33343c, VERDE = 0x4f9a45

/** Una fila di `n` paletti ritti lungo x, larga `lung`, alti `h`, con la punta (staccionata). */
function paletti (g, n, lung, h, larg, colore, z = 0) {
  const m = mat(colore)
  for (let i = 0; i < n; i++) {
    const x = -lung / 2 + (lung * (i + 0.5)) / n
    scatola(g, larg, h, 0.035, m, x, h / 2, z)
    cono(g, larg * 0.62, 0.07, m, x, h + 0.03, z, 4).rotation.y = Math.PI / 4
  }
}
const palo = (g, x, z, h, colore = LEGNO_SCURO, r = 0.05) => cilindro(g, r, r * 1.15, h, mat(colore), x, h / 2, z, 6)

// ── i sedici cartelli delle colture: due pali, un'asse col motivo della coltura ──
function cartelloColtura (g, k) {
  const [c] = COLTURE_DECORI[k]
  palo(g, -0.3, 0, 0.7); palo(g, 0.3, 0, 0.7)
  scatola(g, 0.9, 0.5, 0.05, mat(0xe9d6a8), 0, 0.82, 0.06)
  scatola(g, 0.94, 0.04, 0.07, mat(LEGNO), 0, 1.08, 0.06); scatola(g, 0.94, 0.04, 0.07, mat(LEGNO), 0, 0.57, 0.06)
  scatola(g, 0.7, 0.02, 0.02, mat(c), 0, 0.64, 0.1)                       // la riga del colore della coltura sotto il disegno
  // il motivo: dipinto sulla tavola (piatto: scalato in z), lo stesso frutto delle casse
  const m = new THREE.Group(); m.position.set(0, 0.7, 0.1); m.scale.set(1, 1, 0.25); g.add(m)
  frutto(m, k, 0, 0, 0, 1.15)
  m.traverse(o => { if (o.isMesh) { o.castShadow = false } })
  ciuffo(g, -0.3, 0.1, 0x5aa84c, 4, 0.12, () => 0.5); ciuffo(g, 0.3, 0.1, 0x5aa84c, 4, 0.12, () => 0.2)
  return { altezza: 1.2 }
}

export const RECINTI_DECORI = {
  staccio: decoro('staccio', g => {
    const m = mat(0xf0e4c8)
    paletti(g, 8, 1.9, 0.62, 0.17, 0xf0e4c8)
    scatola(g, 1.95, 0.06, 0.05, mat(LEGNO), 0, 0.2, -0.03); scatola(g, 1.95, 0.06, 0.05, mat(LEGNO), 0, 0.46, -0.03)
    for (const x of [-0.95, 0.95]) scatola(g, 0.09, 0.78, 0.09, m, x, 0.39, -0.02)
    return { altezza: 0.8 }
  }),
  recinto_legno: decoro('recinto_legno', g => {
    for (const x of [-0.9, 0, 0.9]) palo(g, x, 0, 0.78, LEGNO_SCURO, 0.06)
    for (const y of [0.3, 0.6]) scatola(g, 1.95, 0.1, 0.05, mat(LEGNO), 0, y, 0.06)
    for (const y of [0.3, 0.6]) scatola(g, 1.95, 0.04, 0.03, mat(LEGNO_SCURO), 0, y - 0.04, -0.02)
    return { altezza: 0.8 }
  }),
  cancello: decoro('cancello', g => {
    for (const x of [-0.9, 0.9]) { palo(g, x, 0, 1.0, LEGNO_SCURO, 0.075); palla(g, 0.08, 0xb98a4a, x, 1.04, 0, 1, 1, 1, 0) }
    const ante = mat(LEGNO)
    for (const x of [-0.45, 0.45]) {
      scatola(g, 0.78, 0.07, 0.05, ante, x, 0.35, 0.02); scatola(g, 0.78, 0.07, 0.05, ante, x, 0.78, 0.02)
      scatola(g, 0.06, 0.55, 0.05, ante, x - 0.36 * Math.sign(x), 0.57, 0.02); scatola(g, 0.06, 0.55, 0.05, ante, x + 0.36 * Math.sign(x), 0.57, 0.02)
      const t = scatola(g, 0.9, 0.05, 0.04, ante, x, 0.57, 0.02); t.rotation.z = 0.5 * Math.sign(x)
    }
    return { altezza: 1.1 }
  }),
  ringhiera: decoro('ringhiera', g => {
    const f = mat(FERRO)
    scatola(g, 2.9, 0.06, 0.07, f, 0, 0.84, 0); scatola(g, 2.9, 0.04, 0.05, f, 0, 0.14, 0)
    for (let i = 0; i < 15; i++) { const x = -1.4 + i * 0.2; cilindro(g, 0.015, 0.015, 0.7, f, x, 0.49, 0, 4); if (i % 2 === 0) palla(g, 0.03, 0x33343c, x, 0.88, 0, 1, 1, 1, 0) }
    for (const x of [-1.45, 0, 1.45]) { scatola(g, 0.1, 0.95, 0.1, f, x, 0.475, 0); cono(g, 0.07, 0.14, f, x, 1.02, 0, 4) }
    return { altezza: 1.1 }
  }),
  colonna: decoro('colonna', g => {
    const p = mat(0xe8e2d4)
    scatola(g, 0.56, 0.16, 0.56, p, 0, 0.08, 0); cilindro(g, 0.2, 0.24, 1.1, p, 0, 0.71, 0, 12); scatola(g, 0.5, 0.12, 0.5, p, 0, 1.32, 0); scatola(g, 0.4, 0.08, 0.4, mat(0xd6d0c0), 0, 1.42, 0)
    for (const a of [0.4, 1.2, 2.0, 2.8, 3.6, 4.4, 5.2]) scatola(g, 0.03, 1.0, 0.03, mat(0xcfc9ba), Math.cos(a) * 0.215, 0.7, Math.sin(a) * 0.215)
    return { altezza: 1.5 }
  }),
  pergola: decoro('pergola', g => pergola(g, false)),
  pergola_fiorita: decoro('pergola_fiorita', (g, rnd) => pergola(g, true, rnd)),

  gazebo: decoro('gazebo', g => gazebo(g, false)),
  gazebo_cena: decoro('gazebo_cena', g => gazebo(g, true)),

  cartello: decoro('cartello', g => {
    palo(g, 0, 0, 1.1, LEGNO_SCURO, 0.06)
    scatola(g, 0.85, 0.42, 0.06, mat(0xe9d6a8), 0, 0.88, 0.07); scatola(g, 0.9, 0.05, 0.08, mat(LEGNO), 0, 1.12, 0.07); scatola(g, 0.9, 0.05, 0.08, mat(LEGNO), 0, 0.64, 0.07)
    for (const y of [0.95, 0.8]) scatola(g, 0.55, 0.04, 0.02, mat(0x8a5a2b), -0.05, y, 0.11)
    const frec = scatola(g, 0.5, 0.2, 0.05, mat(0xb98a4a), 0.05, 0.38, 0.0); frec.rotation.z = 0.12
    return { altezza: 1.2 }
  }),
  insegna: decoro('insegna', g => {
    palo(g, -0.3, 0, 1.4, LEGNO_SCURO, 0.06)
    scatola(g, 0.75, 0.07, 0.07, mat(LEGNO_SCURO), 0.05, 1.36, 0)
    for (const x of [-0.18, 0.28]) cilindro(g, 0.008, 0.008, 0.2, mat(FERRO), x, 1.24, 0, 3)
    scatola(g, 0.58, 0.4, 0.05, mat(0xe9c27a), 0.05, 1.0, 0); scatola(g, 0.62, 0.04, 0.06, mat(LEGNO), 0.05, 1.21, 0); scatola(g, 0.62, 0.04, 0.06, mat(LEGNO), 0.05, 0.79, 0)
    palla(g, 0.12, 0xd8352a, 0.05, 1.0, 0.04, 1, 1, 0.4, 0); palla(g, 0.07, 0xf0c52a, 0.05, 1.0, 0.07, 1, 1, 0.4, 0)
    return { altezza: 1.6 }
  }),

  ...Object.fromEntries(Object.keys(COLTURE_DECORI).map(k => [`cartello_${k}`, decoro(`cartello_${k}`, g => cartelloColtura(g, k))])),

  bandiera: decoro('bandiera', g => {
    cilindro(g, 0.04, 0.06, 2.3, mat(0xe8e2d4), 0, 1.15, 0, 6); palla(g, 0.07, 0xf0c52a, 0, 2.34, 0, 1, 1, 1, 0)
    cilindro(g, 0.1, 0.12, 0.1, mat(0x8f8a7e), 0, 0.05, 0, 8)
    const drappo = new THREE.Group(); drappo.position.set(0.04, 2.0, 0); g.add(drappo)
    const a = pronto(new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.025), mat(0xd8352a))); a.position.set(0.4, 0, 0); drappo.add(a)
    const b = pronto(new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.14, 0.03), mat(0xfff4d8))); b.position.set(0.4, 0, 0.002); drappo.add(b)
    g.userData.drappo = drappo
    g.userData.anima = function (t) { this.drappo.rotation.y = Math.sin(t * 2.4) * 0.22; this.drappo.rotation.z = Math.sin(t * 3.1) * 0.05 }
    fondiPerMateriale(drappo)
    return { altezza: 2.5, escludi: [drappo] }
  }),
  stendardo: decoro('stendardo', g => {
    cilindro(g, 0.04, 0.05, 2.0, mat(LEGNO_SCURO), 0, 1.0, 0, 6); palla(g, 0.07, 0xf0c52a, 0, 2.05, 0, 1, 1, 1, 0)
    scatola(g, 0.7, 0.05, 0.05, mat(LEGNO_SCURO), 0.3, 1.88, 0)
    scatola(g, 0.5, 1.0, 0.03, mat(0x2f5fa8), 0.3, 1.34, 0.03)
    const p = cono(g, 0.25, 0.3, mat(0x2f5fa8), 0.3, 0.7, 0.03, 4); p.rotation.set(Math.PI, 0, Math.PI / 4); p.scale.set(1, 1, 0.1)
    palla(g, 0.13, 0xf0c52a, 0.3, 1.4, 0.06, 1, 1, 0.3, 0); palla(g, 0.06, 0xfff4d8, 0.3, 1.4, 0.08, 1, 1, 0.3, 0)
    for (const x of [0.08, 0.3, 0.52]) palla(g, 0.03, 0xf0c52a, x, 0.84, 0.05, 1, 1, 1, 0)
    return { altezza: 2.2 }
  }),
}

/** Una pergola 2×2: quattro pali, le travi sopra, i listelli a graticcio; fiorita ha il rampicante con i fiori. */
function pergola (g, fiorita, rnd) {
  const b = mat(BIANCO)
  for (const x of [-0.85, 0.85]) for (const z of [-0.8, 0.8]) { scatola(g, 0.12, 1.9, 0.12, b, x, 0.95, z); scatola(g, 0.18, 0.08, 0.18, b, x, 0.04, z) }
  for (const z of [-0.8, 0.8]) scatola(g, 2.0, 0.12, 0.14, b, 0, 1.92, z)
  for (let i = 0; i < 7; i++) scatola(g, 0.07, 0.07, 1.9, b, -0.84 + i * 0.28, 2.0, 0)
  for (const z of [-0.8, 0.8]) for (const s of [-1, 1]) { const c = scatola(g, 0.3, 0.07, 0.07, b, s * 0.7, 1.7, z); c.rotation.z = s * 0.7 }
  if (fiorita) {
    for (const x of [-0.85, 0.85]) for (const z of [-0.8, 0.8]) palla(g, 0.17, 0x4f9a45, x, 0.5 + (x * z > 0 ? 0.3 : 0), z, 1, 2, 1, 0)
    for (let i = 0; i < 9; i++) palla(g, 0.17, i % 2 ? 0x4f9a45 : 0x5aa84c, -0.8 + i * 0.2, 2.05, (rnd() - 0.5) * 1.3, 1.2, 0.5, 1.2, 0)
    const colori = [0xf29ab6, 0xfff4d8, 0xd8352a]
    for (let i = 0; i < 14; i++) palla(g, 0.05, colori[i % 3], -0.85 + rnd() * 1.7, 1.9 + rnd() * 0.12, (rnd() - 0.5) * 1.5, 1, 1, 1, 0)
  }
  return { altezza: 2.2 }
}

/** Un gazebo ottagonale 3×3: pavimento d'assi, sei pali, la balaustra, il tetto a cono; con la cena un tavolo apparecchiato e lanterne. */
function gazebo (g, cena) {
  const b = mat(BIANCO), legno = mat(LEGNO)
  cilindro(g, 1.45, 1.5, 0.14, legno, 0, 0.07, 0, 8)
  cilindro(g, 1.3, 1.3, 0.02, mat(0xc79a5e), 0, 0.15, 0, 8)
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3 + Math.PI / 6, x = Math.cos(a) * 1.25, z = Math.sin(a) * 1.25
    scatola(g, 0.12, 1.9, 0.12, b, x, 1.05, z)
    if (i !== 2 && i !== 3) {                                  // due pali vicini sul davanti restano aperti: l'ingresso
      const a2 = a + Math.PI / 3, x2 = Math.cos(a2) * 1.25, z2 = Math.sin(a2) * 1.25
      const m = scatola(g, 1.25, 0.07, 0.06, b, (x + x2) / 2, 0.75, (z + z2) / 2); m.rotation.y = -(a + Math.PI / 6)
      const m2 = scatola(g, 1.25, 0.05, 0.05, b, (x + x2) / 2, 0.38, (z + z2) / 2); m2.rotation.y = -(a + Math.PI / 6)
    }
  }
  cilindro(g, 1.55, 1.55, 0.1, b, 0, 2.0, 0, 6)
  cono(g, 1.75, 1.0, mat(0x3f7a8a), 0, 2.55, 0, 6)
  cilindro(g, 0.05, 0.05, 0.3, b, 0, 3.2, 0, 5); palla(g, 0.08, 0xf0c52a, 0, 3.38, 0, 1, 1, 1, 0)
  if (cena) {
    cilindro(g, 0.5, 0.5, 0.05, mat(0xd6b06a), 0, 0.72, 0, 10); cilindro(g, 0.07, 0.07, 0.55, mat(LEGNO_SCURO), 0, 0.45, 0, 6)
    cilindro(g, 0.55, 0.55, 0.02, mat(0xfff4d8), 0, 0.76, 0, 10)
    for (const [x, z, c] of [[0.2, 0.1, 0xd8352a], [-0.2, -0.05, 0xf0c52a], [0, -0.25, 0x7a9a4a]]) cilindro(g, 0.1, 0.1, 0.03, mat(c), x, 0.79, z, 8)
    cilindro(g, 0.03, 0.03, 0.14, mat(0xf4efe4), 0.05, 0.85, 0.1, 5); palla(g, 0.03, 0xffd23a, 0.05, 0.94, 0.1, 1, 1.4, 1, 0)
    for (const [x, z] of [[0.85, 0.2], [-0.85, 0.2], [0.1, -0.9]]) { cilindro(g, 0.17, 0.17, 0.4, legno, x, 0.35, z, 8); cilindro(g, 0.2, 0.2, 0.04, mat(0xc79a5e), x, 0.57, z, 8) }
    for (let i = 0; i < 5; i++) { const a = i * 1.1 + 0.3; palla(g, 0.07, [0xfff4d8, 0xf0c52a][i % 2], Math.cos(a) * 1.4, 1.8, Math.sin(a) * 1.4, 1, 1.2, 1, 0) }
  } else {
    for (const s of [-1, 1]) { const p = scatola(g, 0.9, 0.08, 0.3, legno, s * 0.65, 0.4, -0.95); p.rotation.y = s * 0.5; scatola(g, 0.9, 0.3, 0.05, legno, s * 0.78, 0.6, -1.06).rotation.y = s * 0.5 }
  }
  return { altezza: 3.4 }
}
