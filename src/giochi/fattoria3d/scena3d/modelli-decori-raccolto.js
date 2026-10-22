// Il raccolto in giro (W14): balle e covoni, cassette, le tredici casse delle colture, ceste, ceste di frutta, barili e le cose da mangiare (pane, torta,
// marmellata, latte). Un 1×1 l'uno (le balle in fila 2×1), una mesh fusa a testa. Lo stesso `frutto` dei cartelli. Vedi docs/fattoria3d/decorazioni.md.
import { decoro, mat, scatola, cilindro, cono, palla, disteso, cesto, cassetta, frutto, mucchio } from './modelli-decori-base.js'

const PAGLIA = 0xe6c36a, PAGLIA_SCURA = 0xc9a24a, CORDA = 0x8a5a2a, LEGNO = 0xb98a4a, LEGNO_SCURO = 0x7b4a24

/** Una balla quadra lungo x con le due legature. */
function ballaQuadra (g, x, y, z, rot = 0) {
  const b = scatola(g, 0.78, 0.44, 0.46, mat(PAGLIA), x, y + 0.22, z); b.rotation.y = rot
  for (const dx of [-0.2, 0.2]) { const l = scatola(g, 0.04, 0.46, 0.48, mat(CORDA), x + dx * Math.cos(rot), y + 0.22, z - dx * Math.sin(rot)); l.rotation.y = rot }
  for (let i = 0; i < 4; i++) { const f = scatola(g, 0.14, 0.02, 0.02, mat(PAGLIA_SCURA), x + (i - 1.5) * 0.15, y + 0.455, z + (i % 2 - 0.5) * 0.2) }
}
/** Una cassa dell'orto: la cassetta di legno e un mucchio della coltura. */
function cassa (g, k, rnd) {
  cassetta(g, 0.85, 0.62, 0.36, 0, 0)
  mucchio(g, k, 0.6, 0.4, 0.28, 9, rnd, 0.95)
}
/** Frutti piccoli e tondi in un recipiente: `n` palle del colore dato a quota `y`. */
function palle (g, colori, w, d, y, n, rnd, r = 0.075) {
  for (let i = 0; i < n; i++) palla(g, r, colori[i % colori.length], (rnd() - 0.5) * w, y + (i > n * 0.6 ? 0.09 : 0), (rnd() - 0.5) * d, 1, 0.95, 1, 0)
}
const tavola = g => scatola(g, 0.9, 0.05, 0.62, mat(LEGNO_SCURO), 0, 0.025, 0)

const R = {
  balla_tonda: decoro('balla_tonda', g => {
    const r = 0.44
    disteso(g, r, 0.8, PAGLIA, 0, r, 0, 14)
    for (const x of [-0.27, 0.27]) { const c = cilindro(g, r + 0.012, r + 0.012, 0.04, mat(CORDA), x, r, 0, 14); c.rotation.z = Math.PI / 2 }
    for (const s of [-1, 1]) { const f = cilindro(g, r * 0.7, r * 0.7, 0.012, mat(PAGLIA_SCURA), s * 0.405, r, 0, 12); f.rotation.z = Math.PI / 2 }
    return { altezza: 0.95 }
  }),
  balla_quadra: decoro('balla_quadra', g => { ballaQuadra(g, 0, 0, 0); return { altezza: 0.5 } }),
  balle_fieno: decoro('balle_fieno', g => {
    ballaQuadra(g, -0.45, 0, -0.12); ballaQuadra(g, 0.45, 0, -0.1, 0.05); ballaQuadra(g, 0, 0.44, -0.1, -0.04)
    ballaQuadra(g, 0.1, 0, 0.35, 0.1)
    return { altezza: 1.0 }
  }),
  covone: decoro('covone', g => {
    const m = mat(PAGLIA)
    cono(g, 0.46, 1.0, m, 0, 0.5, 0, 9)
    cilindro(g, 0.33, 0.33, 0.07, mat(CORDA), 0, 0.5, 0, 9)
    cono(g, 0.16, 0.34, mat(PAGLIA_SCURA), 0, 1.15, 0, 7)
    for (let i = 0; i < 7; i++) { const a = i * 0.9; const o = cono(g, 0.04, 0.35, m, Math.cos(a) * 0.38, 0.12, Math.sin(a) * 0.38, 4); o.rotation.set(Math.sin(a) * 0.8, 0, -Math.cos(a) * 0.8) }
    return { altezza: 1.4 }
  }),

  cassetta0: decoro('cassetta0', (g, rnd) => { cassetta(g, 0.7, 0.5, 0.3, 0, 0); palle(g, [0xf2d034, 0xf5dc50], 0.5, 0.3, 0.26, 11, rnd, 0.08); return { altezza: 0.5 } }),
  cassetta1: decoro('cassetta1', (g, rnd) => { cassetta(g, 0.7, 0.5, 0.3, 0, 0); palle(g, [0x7cbc4a, 0x95cc5a], 0.5, 0.3, 0.26, 11, rnd, 0.08); return { altezza: 0.5 } }),
  cassetta2: decoro('cassetta2', (g, rnd) => { cassetta(g, 0.7, 0.5, 0.3, 0, 0); palle(g, [0xd8352a, 0xe8503a], 0.5, 0.3, 0.26, 11, rnd, 0.08); return { altezza: 0.5 } }),
  cassetta3: decoro('cassetta3', (g, rnd) => { cassetta(g, 0.7, 0.5, 0.3, 0, 0); mucchio(g, 'mais', 0.5, 0.3, 0.24, 6, rnd, 0.9); return { altezza: 0.6 } }),

  ...Object.fromEntries(['grano', 'mais', 'carote', 'zucche', 'erba', 'patate', 'cavolfiori', 'pomodori', 'melanzane', 'peperoni', 'cipolle', 'aglio', 'fragole']
    .map(k => [`raccolto_${k}`, decoro(`raccolto_${k}`, (g, rnd) => { cassa(g, k, rnd); return { altezza: 0.8 } })])),

  cassetta_fragole: decoro('cassetta_fragole', (g, rnd) => {
    cassetta(g, 0.8, 0.55, 0.26, 0, 0, 0xe9d6a8, 0xc9a870)
    for (const [x, z] of [[-0.18, -0.1], [0.18, 0.1]]) mucchio(g, 'fragole', 0.28, 0.2, 0.2, 5, rnd, 0.8)
    mucchio(g, 'fragole', 0.6, 0.36, 0.24, 5, rnd, 0.8)
    return { altezza: 0.5 }
  }),
  cassetta_raccolto: decoro('cassetta_raccolto', (g, rnd) => {
    cassetta(g, 0.85, 0.6, 0.3, 0, 0)
    for (const [k, x] of [['carote', -0.22], ['pomodori', 0.02], ['cavolfiori', 0.24]]) frutto(g, k, x, 0.26, (rnd() - 0.5) * 0.25, 1.0)
    for (const [k, x] of [['zucche', -0.1], ['melanzane', 0.12]]) frutto(g, k, x, 0.3, (rnd() - 0.5) * 0.2, 0.9)
    return { altezza: 0.7 }
  }),
  cesta_pomodori: decoro('cesta_pomodori', (g, rnd) => {
    cesto(g, 0.38, 0.32, 0, 0, { manico: true }); palle(g, [0xd8352a, 0xe8503a], 0.5, 0.5, 0.3, 11, rnd, 0.1)
    return { altezza: 0.9 }
  }),
  cesta_verdure: decoro('cesta_verdure', (g, rnd) => {
    cesto(g, 0.4, 0.3, 0, 0, { manico: true })
    frutto(g, 'carote', -0.15, 0.25, 0.05, 1.1); frutto(g, 'carote', 0.0, 0.25, 0.14, 1.0); frutto(g, 'cavolfiori', 0.13, 0.25, -0.05, 1.0); frutto(g, 'peperoni', -0.1, 0.27, -0.14, 0.9); frutto(g, 'cipolle', 0.17, 0.27, 0.14, 0.9)
    return { altezza: 0.95 }
  }),
  cesto_agrumi: decoro('cesto_agrumi', (g, rnd) => {
    cesto(g, 0.4, 0.3, 0, 0); palle(g, [0xf08a24, 0xf2d034, 0xf59a30], 0.52, 0.52, 0.28, 14, rnd, 0.09)
    palla(g, 0.04, 0x4a9a3a, 0.1, 0.45, 0.05, 1.6, 0.4, 1, 0)
    return { altezza: 0.6 }
  }),
  cesto_mele: decoro('cesto_mele', (g, rnd) => {
    cesto(g, 0.34, 0.28, 0, 0, { manico: true }); palle(g, [0xd8352a, 0xe0503a, 0x7cbc4a], 0.44, 0.44, 0.26, 10, rnd, 0.09)
    return { altezza: 0.85 }
  }),
  cassa_mele: decoro('cassa_mele', (g, rnd) => {
    cassetta(g, 0.8, 0.6, 0.34, 0, 0); palle(g, [0xd8352a, 0xe8503a, 0xb82a22], 0.62, 0.42, 0.3, 14, rnd, 0.09)
    return { altezza: 0.6 }
  }),
  barile_mele: decoro('barile_mele', (g, rnd) => {
    barile(g, 0.5)
    palle(g, [0xd8352a, 0x7cbc4a, 0xe0503a], 0.4, 0.4, 0.48, 7, rnd, 0.09)
    return { altezza: 0.75 }
  }),
  barile_frutta: decoro('barile_frutta', (g, rnd) => {
    barile(g, 0.5)
    palle(g, [0xf08a24, 0xd8352a, 0xf2d034, 0x7a2f78], 0.4, 0.4, 0.48, 8, rnd, 0.085)
    return { altezza: 0.75 }
  }),
  cesta_picnic: decoro('cesta_picnic', g => {
    cesto(g, 0.4, 0.34, 0, 0, { manico: true })
    const t = scatola(g, 0.7, 0.03, 0.5, mat(0xd8352a), 0, 0.36, 0); t.rotation.y = 0.2
    for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) if ((i + j) % 2 === 0) { const q = scatola(g, 0.17, 0.035, 0.16, mat(0xfff4d8), -0.26 + i * 0.17, 0.375, -0.17 + j * 0.17); q.rotation.y = 0.2 }
    palla(g, 0.09, 0xd9a066, -0.1, 0.45, 0.05, 1.7, 0.7, 1, 0); cilindro(g, 0.04, 0.04, 0.2, mat(0x7cbc4a), 0.15, 0.48, 0.0, 6)
    return { altezza: 1.0 }
  }),

  pane_decoro: decoro('pane_decoro', g => {
    tavola(g)
    palla(g, 0.28, 0xc98a4a, 0, 0.17, 0, 1.45, 0.62, 0.85, 1)
    for (const x of [-0.18, 0, 0.18]) { const t = scatola(g, 0.05, 0.02, 0.2, mat(0xe6c288), x, 0.34, 0); t.rotation.y = 0.5 }
    return { altezza: 0.4 }
  }),
  panino: decoro('panino', g => {
    tavola(g)
    palla(g, 0.22, 0xd9a066, -0.15, 0.17, 0, 1, 0.7, 1, 1); palla(g, 0.2, 0xc98a4a, 0.22, 0.15, 0.1, 1, 0.7, 1, 1)
    for (const [x, z] of [[-0.2, 0.0], [-0.08, 0.06], [-0.14, -0.08], [0.2, 0.08], [0.28, 0.15]]) palla(g, 0.018, 0xfff4d8, x, 0.3, z, 1, 0.6, 1, 0)
    return { altezza: 0.4 }
  }),
  torta_decoro: decoro('torta_decoro', g => {
    cilindro(g, 0.38, 0.38, 0.03, mat(0xfff7ea), 0, 0.015, 0, 14)
    cilindro(g, 0.28, 0.3, 0.16, mat(0xc77a3c), 0, 0.11, 0, 14); cilindro(g, 0.27, 0.27, 0.12, mat(0xff9cb8), 0, 0.25, 0, 14)
    palla(g, 0.22, 0xfff0f4, 0, 0.32, 0, 1, 0.3, 1, 1)
    for (const a of [0, 1.26, 2.52, 3.77, 5.03]) palla(g, 0.045, 0xd8352a, Math.cos(a) * 0.16, 0.38, Math.sin(a) * 0.16, 1, 1, 1, 0)
    return { altezza: 0.5 }
  }),
  crostatina: decoro('crostatina', g => {
    cilindro(g, 0.34, 0.3, 0.12, mat(0xd9a066), 0, 0.07, 0, 14)
    cilindro(g, 0.27, 0.27, 0.03, mat(0xb82a3a), 0, 0.125, 0, 14)
    for (const x of [-0.12, 0, 0.12]) { scatola(g, 0.05, 0.02, 0.5, mat(0xe6b87a), x, 0.15, 0).rotation.y = 0.5 }
    for (const x of [-0.12, 0, 0.12]) { scatola(g, 0.05, 0.022, 0.5, mat(0xe6b87a), x, 0.152, 0).rotation.y = -0.5 }
    return { altezza: 0.3 }
  }),
  marmellata_decoro: decoro('marmellata_decoro', g => {
    cilindro(g, 0.2, 0.2, 0.34, mat(0x9a1f3a), 0, 0.17, 0, 12)
    cilindro(g, 0.21, 0.21, 0.07, mat(0xf4efe4), 0, 0.37, 0, 12)
    scatola(g, 0.22, 0.14, 0.015, mat(0xfff4d8), 0, 0.17, 0.2)
    palla(g, 0.03, 0xd8352a, 0, 0.17, 0.21, 1, 1, 0.3, 0)
    return { altezza: 0.5 }
  }),
  latte_decoro: decoro('latte_decoro', g => {
    for (const [x, z, h] of [[-0.14, 0, 0.5], [0.16, 0.06, 0.42]]) {
      cilindro(g, 0.1, 0.1, h, mat(0xf4f1ea), x, h / 2, z, 10); cilindro(g, 0.04, 0.1, 0.1, mat(0xf4f1ea), x, h + 0.05, z, 10); cilindro(g, 0.05, 0.05, 0.05, mat(0x2f5fa8), x, h + 0.12, z, 8)
      scatola(g, 0.12, 0.12, 0.012, mat(0x6ab0e0), x, h * 0.45, z + 0.1)
    }
    return { altezza: 0.7 }
  }),
  vasetto: decoro('vasetto', g => {
    cilindro(g, 0.22, 0.18, 0.3, mat(0x9a6a36), 0, 0.15, 0, 10); cilindro(g, 0.23, 0.23, 0.04, mat(0x7b4a24), 0, 0.3, 0, 10)
    for (const y of [0.08, 0.22]) cilindro(g, 0.222 - (y < 0.1 ? 0.03 : 0), 0.222, 0.025, mat(0x5a3a1a), 0, y, 0, 10)
    cilindro(g, 0.17, 0.17, 0.02, mat(0xe8a830), 0, 0.31, 0, 10)
    return { altezza: 0.4 }
  }),
}
/** Un barile di legno chiuso da due cerchi di ferro, aperto in alto. */
function barile (g, h) {
  cilindro(g, 0.3, 0.26, h, mat(0x8a5a2b), 0, h / 2, 0, 12)
  for (const y of [0.12, h - 0.12]) cilindro(g, 0.296, 0.296, 0.04, mat(0x4a4a52), 0, y, 0, 12)
  cilindro(g, 0.27, 0.27, 0.02, mat(0x5a3a1a), 0, h - 0.01, 0, 12)
}
export const RACCOLTO_DECORI = R
