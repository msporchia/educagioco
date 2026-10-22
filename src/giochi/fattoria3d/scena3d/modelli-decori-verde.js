// Il verde delle decorazioni (W7): alberi da piantare, siepi, arbusti, la radura, i funghi, i ceppi e i tronchi, i sassi. Poche mesh l'uno
// (tutti fusi in una); i colori dei sassi e delle chiome sono quelli del terreno. Vedi docs/fattoria3d/decorazioni.md.
import { decoro, mat, scatola, cilindro, cono, palla, sasso, disteso, ciuffo, fiore } from './modelli-decori-base.js'

const LEGNO = 0x7a5232, LEGNO_CHIARO = 0xd9b27a, VERDE = 0x4f9a45, VERDE_SCURO = 0x3f8a3a, PIETRA = 0xa8a395, PIETRA_SCURA = 0x8f8a7e

/** Un albero da giardino: tronco e chiome a palle di icosaedro. `palle`: [colore, raggio, x, y, z]. */
function albero (g, { tronco = LEGNO, alt = 0.8, spessore = 0.13, palle }) {
  cilindro(g, spessore * 0.7, spessore, alt, mat(tronco), 0, alt / 2, 0, 7)
  for (const [c, r, x, y, z] of palle) palla(g, r, c, x, y, z, 1, 0.92, 1, 1)
}

export const VERDE_DECORI = {
  albero: decoro('albero', g => {
    albero(g, { alt: 0.7, palle: [[VERDE, 0.42, 0, 1.05, 0], [0x5aa84c, 0.3, 0.2, 1.3, 0.1], [0x449040, 0.28, -0.18, 1.25, -0.1]] })
    return { altezza: 1.9 }
  }),
  albero_verde: decoro('albero_verde', g => {
    albero(g, { alt: 1.0, spessore: 0.17, tronco: 0x6a4528, palle: [[VERDE_SCURO, 0.55, 0, 1.35, 0], [0x4a9a42, 0.4, 0.3, 1.75, 0.1], [0x357a34, 0.38, -0.3, 1.7, -0.1], [VERDE, 0.34, 0, 2.1, 0]] })
    return { altezza: 2.6 }
  }),
  albero_rosa: decoro('albero_rosa', (g, rnd) => {
    albero(g, { alt: 0.85, tronco: 0x5a3a2a, palle: [[0xf29ab6, 0.46, 0, 1.2, 0], [0xf7b7cb, 0.32, 0.25, 1.45, 0.12], [0xe9819f, 0.3, -0.25, 1.4, -0.1]] })
    for (let i = 0; i < 7; i++) palla(g, 0.03, 0xf7b7cb, (rnd() - 0.5) * 1.0, 0.025, (rnd() - 0.5) * 1.0, 1, 0.4, 1, 0)       // i petali caduti
    return { altezza: 2.1 }
  }),
  melo: decoro('melo', (g, rnd) => {
    albero(g, { alt: 0.75, tronco: 0x6a4a2a, palle: [[0x56a346, 0.46, 0, 1.12, 0], [0x4a9a42, 0.32, 0.27, 1.35, 0.1], [0x62ae50, 0.3, -0.25, 1.3, -0.08]] })
    for (let i = 0; i < 9; i++) { const a = rnd() * 6.28, r = 0.3 + rnd() * 0.25; palla(g, 0.06, 0xd8352a, Math.cos(a) * r, 0.95 + rnd() * 0.5, Math.sin(a) * r, 1, 1, 1, 0) }
    return { altezza: 2.0 }
  }),
  topiaria: decoro('topiaria', g => {
    cilindro(g, 0.3, 0.22, 0.34, mat(0xb4553a), 0, 0.17, 0, 10)
    cilindro(g, 0.07, 0.07, 0.3, mat(LEGNO), 0, 0.49, 0, 5)
    palla(g, 0.4, VERDE_SCURO, 0, 0.9, 0, 1, 0.9, 1, 1)
    palla(g, 0.29, VERDE, 0, 1.4, 0, 1, 0.9, 1, 1)
    palla(g, 0.18, 0x5aa84c, 0, 1.78, 0, 1, 0.9, 1, 1)
    cono(g, 0.06, 0.18, mat(0x5aa84c), 0, 2.0, 0, 6)
    return { altezza: 2.2 }
  }),

  siepe: decoro('siepe', g => {
    scatola(g, 1.9, 0.6, 0.5, mat(VERDE_SCURO), 0, 0.3, 0)
    for (const x of [-0.6, 0, 0.6]) palla(g, 0.32, VERDE, x, 0.62, 0, 1.1, 0.7, 0.9, 1)
    return { altezza: 0.95 }
  }),
  siepe_tonda: decoro('siepe_tonda', g => {
    for (const [x, r] of [[-0.62, 0.38], [0.02, 0.44], [0.64, 0.36]]) palla(g, r, VERDE_SCURO, x, r * 0.95, 0, 1, 0.95, 0.95, 1)
    return { altezza: 0.95 }
  }),
  arbusto_largo: decoro('arbusto_largo', (g, rnd) => {
    for (const [x, z, r] of [[-0.6, 0.05, 0.32], [-0.2, -0.1, 0.4], [0.28, 0.08, 0.38], [0.65, -0.05, 0.28]]) palla(g, r, rnd() > 0.5 ? VERDE : VERDE_SCURO, x, r * 0.85, z, 1, 0.8, 1, 1)
    return { altezza: 0.8 }
  }),
  arbusto_basso: decoro('arbusto_basso', g => {
    palla(g, 0.38, VERDE, 0, 0.22, 0, 1.1, 0.55, 1, 1); palla(g, 0.24, 0x5aa84c, 0.22, 0.2, 0.1, 1, 0.6, 1, 1)
    return { altezza: 0.5 }
  }),
  arbusto_tondo: decoro('arbusto_tondo', g => {
    palla(g, 0.34, VERDE_SCURO, 0, 0.3, 0, 1, 0.9, 1, 1); palla(g, 0.16, VERDE, 0.28, 0.14, 0.14, 1, 0.8, 1, 0)
    return { altezza: 0.7 }
  }),
  arbusto_ciuffo: decoro('arbusto_ciuffo', (g, rnd) => { ciuffo(g, 0, 0, 0x6aaa3a, 14, 0.32, rnd); ciuffo(g, 0.1, -0.05, 0x4f9a45, 8, 0.24, rnd); return { altezza: 0.4 } }),

  radura: decoro('radura', (g, rnd) => {
    cilindro(g, 1.4, 1.45, 0.05, mat(0x77b24d), 0, 0.025, 0, 18)
    cilindro(g, 1.05, 1.1, 0.02, mat(0x86be58), 0, 0.06, 0, 16)
    const colori = [0xfff4d8, 0xf0c52a, 0xf29ab6, 0xd8352a]
    for (let i = 0; i < 12; i++) { const a = rnd() * 6.28, r = 0.2 + rnd() * 1.0; fiore(g, Math.cos(a) * r, Math.sin(a) * r, 0.1 + rnd() * 0.1, colori[i % 4], 0.05) }
    for (let i = 0; i < 4; i++) { const a = i * 1.57 + 0.5; ciuffo(g, Math.cos(a) * 0.9, Math.sin(a) * 0.9, 0x5aa84c, 5, 0.22, rnd) }
    return { altezza: 0.3 }
  }),
  fungo: decoro('fungo', g => {
    for (const [x, z, s, c] of [[0, 0, 1, 0xc9854a], [0.28, 0.12, 0.65, 0xd9a066], [-0.22, 0.16, 0.5, 0xc9854a]]) {
      cilindro(g, 0.05 * s, 0.07 * s, 0.26 * s, mat(0xf2e6cf), x, 0.13 * s, z, 6)
      palla(g, 0.17 * s, c, x, 0.28 * s, z, 1, 0.55, 1, 1)
    }
    return { altezza: 0.45 }
  }),
  fungo_rosso: decoro('fungo_rosso', g => {
    cilindro(g, 0.1, 0.13, 0.42, mat(0xf2e6cf), 0, 0.21, 0, 7)
    palla(g, 0.3, 0xd8352a, 0, 0.5, 0, 1, 0.6, 1, 1)
    for (const [x, z] of [[0.1, 0.12], [-0.12, 0.08], [0.02, -0.14], [0.17, -0.05]]) palla(g, 0.045, 0xfff4e6, x, 0.64 - Math.hypot(x, z) * 0.35, z, 1, 0.6, 1, 0)
    return { altezza: 0.75 }
  }),

  ceppo: decoro('ceppo', (g, rnd) => {
    cilindro(g, 0.3, 0.36, 0.4, mat(LEGNO), 0, 0.2, 0, 10)
    cilindro(g, 0.27, 0.27, 0.02, mat(LEGNO_CHIARO), 0, 0.41, 0, 10)
    cilindro(g, 0.17, 0.17, 0.022, mat(0xc79a5e), 0, 0.412, 0, 10); cilindro(g, 0.07, 0.07, 0.024, mat(LEGNO_CHIARO), 0, 0.414, 0, 8)
    for (let i = 0; i < 3; i++) { const a = i * 2.1 + rnd(); const r = scatola(g, 0.22, 0.08, 0.08, mat(LEGNO), Math.cos(a) * 0.38, 0.04, Math.sin(a) * 0.38); r.rotation.y = -a }
    return { altezza: 0.5 }
  }),
  ceppino: decoro('ceppino', g => {
    cilindro(g, 0.17, 0.21, 0.26, mat(LEGNO), 0, 0.13, 0, 8); cilindro(g, 0.15, 0.15, 0.02, mat(LEGNO_CHIARO), 0, 0.27, 0, 8)
    palla(g, 0.06, 0x6aaa3a, 0.18, 0.05, 0.1, 1, 0.5, 1, 0)
    return { altezza: 0.35 }
  }),
  ceppo_ascia: decoro('ceppo_ascia', g => {
    cilindro(g, 0.3, 0.35, 0.5, mat(LEGNO), 0, 0.25, 0, 10); cilindro(g, 0.27, 0.27, 0.02, mat(LEGNO_CHIARO), 0, 0.51, 0, 10)
    const asta = scatola(g, 0.06, 0.62, 0.06, mat(0x9a6a36), 0.08, 0.78, 0); asta.rotation.z = -0.35
    const ferro = scatola(g, 0.3, 0.2, 0.05, mat(0x8a8f99, { metalness: 0.4, roughness: 0.5 }), -0.08, 0.63, 0); ferro.rotation.z = -0.35
    return { altezza: 1.15 }
  }),
  tronco: decoro('tronco', (g, rnd) => {
    disteso(g, 0.26, 2.5, 0x6e4a2c, 0, 0.26, 0)
    for (const s of [-1, 1]) { const f = cilindro(g, 0.22, 0.22, 0.03, mat(LEGNO_CHIARO), s * 1.26, 0.26, 0, 10); f.rotation.z = Math.PI / 2; const a = cilindro(g, 0.12, 0.12, 0.035, mat(0xc79a5e), s * 1.27, 0.26, 0, 8); a.rotation.z = Math.PI / 2 }
    const ramo = cilindro(g, 0.06, 0.08, 0.4, mat(0x6e4a2c), 0.3, 0.55, 0.0, 5); ramo.rotation.z = -0.5
    palla(g, 0.1, 0x5aa84c, -0.5, 0.52, 0.2, 1.4, 0.5, 1, 0); palla(g, 0.08, 0x6aaa3a, 0.7, 0.5, -0.18, 1.2, 0.5, 1, 0)
    return { altezza: 0.6 }
  }),
  tronco_corto: decoro('tronco_corto', g => {
    disteso(g, 0.2, 0.85, 0x6e4a2c, 0, 0.2, 0.05, 9)
    for (const s of [-1, 1]) { const f = cilindro(g, 0.17, 0.17, 0.03, mat(LEGNO_CHIARO), s * 0.43, 0.2, 0.05, 9); f.rotation.z = Math.PI / 2 }
    return { altezza: 0.45 }
  }),
  tronco_su: decoro('tronco_su', g => {
    cilindro(g, 0.25, 0.3, 0.95, mat(0x6e4a2c), 0, 0.475, 0, 9); cilindro(g, 0.22, 0.22, 0.03, mat(LEGNO_CHIARO), 0, 0.96, 0, 9); cilindro(g, 0.11, 0.11, 0.034, mat(0xc79a5e), 0, 0.962, 0, 8)
    palla(g, 0.1, 0x6aaa3a, 0.24, 0.12, 0.12, 1, 0.5, 1, 0)
    return { altezza: 1.0 }
  }),

  sasso: decoro('sasso', (g, rnd) => { sasso(g, 0.36, PIETRA, 0, 0, rnd); return { altezza: 0.4 } }),
  sassi: decoro('sassi', (g, rnd) => {
    sasso(g, 0.2, PIETRA, -0.22, 0.05, rnd); sasso(g, 0.15, PIETRA_SCURA, 0.12, 0.2, rnd); sasso(g, 0.12, 0xb9b4a6, 0.2, -0.15, rnd); sasso(g, 0.09, PIETRA, -0.05, -0.2, rnd)
    return { altezza: 0.3 }
  }),
  masso: decoro('masso', (g, rnd) => { sasso(g, 0.5, PIETRA_SCURA, 0, 0, rnd, { sy: 0.85, sx: 1.1 }); sasso(g, 0.2, PIETRA, 0.4, 0.25, rnd); return { altezza: 0.65 } }),
  sassi_fila: decoro('sassi_fila', (g, rnd) => {
    for (let i = 0; i < 6; i++) sasso(g, 0.2 + (i % 3) * 0.04, i % 2 ? PIETRA : PIETRA_SCURA, -0.85 + i * 0.34, (i % 2 ? 0.07 : -0.05), rnd)
    return { altezza: 0.35 }
  }),
  masso_fiorito: decoro('masso_fiorito', (g, rnd) => {
    sasso(g, 0.46, PIETRA, 0, 0, rnd, { sy: 0.8 })
    palla(g, 0.28, 0x5aa84c, 0, 0.42, 0.04, 1.2, 0.35, 1, 1)
    fiore(g, -0.12, 0.05, 0.62, 0xf29ab6, 0.06); fiore(g, 0.1, -0.05, 0.56, 0xfff4d8, 0.06); fiore(g, 0.04, 0.14, 0.58, 0xf0c52a, 0.05)
    ciuffo(g, 0.35, 0.28, 0x5aa84c, 6, 0.2, rnd)
    return { altezza: 0.8 }
  }),
  sasso_fiorito: decoro('sasso_fiorito', (g, rnd) => {
    sasso(g, 0.3, PIETRA_SCURA, 0, 0, rnd, { sy: 0.8 })
    fiore(g, 0.14, 0.1, 0.4, 0xd8352a, 0.05); fiore(g, -0.12, 0.12, 0.36, 0xfff4d8, 0.05); ciuffo(g, 0.2, 0.2, 0x5aa84c, 5, 0.16, rnd)
    return { altezza: 0.55 }
  }),
  roccia: decoro('roccia', (g, rnd) => {
    sasso(g, 0.55, PIETRA_SCURA, -0.2, 0, rnd, { sy: 0.9, sx: 1.2 }); sasso(g, 0.36, PIETRA, 0.5, 0.15, rnd, { sy: 0.8 })
    palla(g, 0.4, 0x5f9a3e, -0.2, 0.55, 0, 1.1, 0.3, 0.9, 1); palla(g, 0.22, 0x6aaa3a, 0.52, 0.38, 0.15, 1, 0.3, 1, 0)
    return { altezza: 0.9 }
  }),
}
