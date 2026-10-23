// L'arredo del giardino (W12): panche, sedie, amaca, altalene, tavolini, bancone, casse, barili, sacchi, la posta, lo specchio, campanelle, girandola, mulinello,
// palloncini, festoni, lucine, paiolo: 27 voci, ognuna UNA mesh fusa (il mulinello, che gira, ne ha due). Davanti è +z (si gira col ↻); ogni parte tocca quella che la regge.
// Vedi docs/fattoria3d/decorazioni.md.
import * as THREE from 'three'
import { decoro, mat, pronto, scatola, cilindro, cono, palla, filo, listello, botte, festoneFra, arco, luce } from './modelli-decori-base.js'
import { fondiPerMateriale } from './fondi.js'
import { mazzo } from './modelli-decori-fiori.js'

const LEGNO = 0x9a6a36, LEGNO_SCURO = 0x6e4a2c, LEGNO_CHIARO = 0xd9b27a, FERRO = 0x33343c, BIANCO = 0xf4efe4, ROSSO = 0xd8352a, GIALLO = 0xf0c52a, ROSA = 0xf29ab6
const VARI = [0xd8352a, 0xf0c52a, 0x3f78c8, 0xf29ab6, 0x5aa84c]

/** Una panca lunga lungo x: sedile di tre assi, due fianchi (gambe piene), e a richiesta lo schienale (`schiena(g)` lo disegna sopra le gambe). */
function panca (g, { colore = LEGNO, gambe = LEGNO_SCURO, lung = 1.8, schiena = null } = {}) {
  for (const z of [-0.12, 0.02, 0.16]) scatola(g, lung, 0.05, 0.12, mat(colore), 0, 0.43, z)
  for (const s of [-1, 1]) {
    scatola(g, 0.07, 0.43, 0.4, mat(gambe), s * (lung / 2 - 0.12), 0.215, 0.02)
  }
  scatola(g, lung - 0.3, 0.04, 0.05, mat(gambe), 0, 0.2, 0.02)
  if (schiena) schiena(g)
}
const montanti = (g, lung, h, colore) => { for (const s of [-1, 1]) scatola(g, 0.06, h, 0.06, mat(colore), s * (lung / 2 - 0.12), 0.43 + h / 2, -0.17) }

/** Un palo con base, da cui parte un braccio (campanelle, posta). */
function palo (g, h, colore = LEGNO_SCURO, r = 0.045) {
  cilindro(g, 0.1, 0.12, 0.06, mat(0x8f8a7e), 0, 0.03, 0, 8)
  cilindro(g, r, r * 1.2, h, mat(colore), 0, h / 2 + 0.03, 0, 6)
}

export const ARREDO_DECORI = {
  panchina2: decoro('panchina2', g => {
    panca(g, { colore: 0xc9a066, gambe: 0x8f8a7e }); return { altezza: 0.55 }
  }),
  panchina_legno: decoro('panchina_legno', g => {
    panca(g, { schiena: g => {
      montanti(g, 1.8, 0.5, LEGNO_SCURO)
      for (const y of [0.62, 0.78, 0.94]) scatola(g, 1.66, 0.1, 0.04, mat(LEGNO), 0, y, -0.17)
      for (const s of [-1, 1]) { scatola(g, 0.06, 0.05, 0.38, mat(LEGNO_SCURO), s * 0.84, 0.6, 0.02) }
    } }); return { altezza: 1.0 }
  }),
  panchina_bianca: decoro('panchina_bianca', g => {
    panca(g, { colore: BIANCO, gambe: BIANCO, schiena: g => {
      montanti(g, 1.8, 0.62, BIANCO)
      scatola(g, 1.66, 0.06, 0.05, mat(BIANCO), 0, 1.07, -0.17); scatola(g, 1.66, 0.04, 0.04, mat(BIANCO), 0, 0.64, -0.17)
      for (let i = 0; i < 9; i++) { const x = -0.7 + i * 0.175; scatola(g, 0.035, 0.42, 0.035, mat(BIANCO), x, 0.86, -0.17); palla(g, 0.035, BIANCO, x, 1.1 + (i % 2 ? 0.0 : 0.04), -0.17, 1, 1, 1, 0) }
    } }); return { altezza: 1.15 }
  }),
  panchina_cuore: decoro('panchina_cuore', g => {
    panca(g, { colore: 0xe86a8a, gambe: 0xb8445f, schiena: g => {
      montanti(g, 1.8, 0.62, 0xb8445f)
      scatola(g, 1.66, 0.46, 0.04, mat(0xe86a8a), 0, 0.88, -0.17)
      for (const sx of [-1, 1]) palla(g, 0.125, 0xfff4f4, sx * 0.1, 0.96, -0.15, 1, 1, 0.3, 1)       // il cuore: due palle e una punta in giù
      const p = cono(g, 0.235, 0.26, mat(0xfff4f4), 0, 0.84, -0.15, 4); p.rotation.set(0, Math.PI / 4, Math.PI); p.scale.set(1, 1, 0.3)
    } }); return { altezza: 1.2 }
  }),
  sedia: decoro('sedia', g => {
    scatola(g, 0.42, 0.05, 0.42, mat(LEGNO), 0, 0.45, 0.02)
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) scatola(g, 0.05, 0.45, 0.05, mat(LEGNO_SCURO), sx * 0.18, 0.225, 0.02 + sz * 0.18)
    for (const sx of [-1, 1]) scatola(g, 0.05, 0.5, 0.05, mat(LEGNO_SCURO), sx * 0.18, 0.72, -0.16)
    scatola(g, 0.4, 0.07, 0.03, mat(LEGNO), 0, 0.82, -0.16); scatola(g, 0.4, 0.07, 0.03, mat(LEGNO), 0, 0.64, -0.16)
    return { altezza: 1.0 }
  }),
  sdraio: decoro('sdraio', g => {
    // la tela è una fascia unica dal bordo alto dietro, giù fin dove ci si siede, e su davanti: a strisce
    const P = [[0.82, -0.32], [0.3, -0.1], [0.25, 0.12], [0.33, 0.32]]          // [y, z]
    for (let i = 0; i < 3; i++) for (let k = 0; k < 5; k++) {
      const x = -0.2 + k * 0.1; listello(g, [x, P[i][0], P[i][1]], [x, P[i + 1][0], P[i + 1][1]], 0.1, 0.025, k % 2 ? 0xf4efe4 : 0x3f78c8, [1, 0, 0])
    }
    for (const s of [-1, 1]) {
      filo(g, [s * 0.27, 0.9, -0.34], [s * 0.27, 0.22, 0.06], 0.022, LEGNO); filo(g, [s * 0.27, 0.22, 0.06], [s * 0.27, 0.36, 0.34], 0.022, LEGNO)
      filo(g, [s * 0.27, 0.0, 0.4], [s * 0.27, 0.36, 0.34], 0.022, LEGNO_SCURO); filo(g, [s * 0.27, 0.0, -0.3], [s * 0.27, 0.22, 0.06], 0.022, LEGNO_SCURO)
      filo(g, [s * 0.27, 0.0, 0.4], [s * 0.27, 0.0, -0.3], 0.018, LEGNO_SCURO)
    }
    return { altezza: 0.95 }
  }),
  amaca: decoro('amaca', g => {
    const H = 1.05
    for (const s of [-1, 1]) {
      cilindro(g, 0.05, 0.06, H, mat(LEGNO_SCURO), s * 1.3, H / 2, 0, 6)
      for (const z of [-0.22, 0.22]) filo(g, [s * 1.3, 0.0, z * 1.6], [s * 1.3, H * 0.85, 0], 0.025, LEGNO_SCURO)
      cono(g, 0.07, 0.1, mat(LEGNO), s * 1.3, H + 0.05, 0, 6)
    }
    const n = 10, pt = i => { const t = i / n; return [-1.3 + 2.6 * t, 0.98 - 0.52 * 4 * t * (1 - t), 0] }
    for (let i = 0; i < n; i++) listello(g, pt(i), pt(i + 1), 0.5, 0.03, i % 2 ? 0xf4efe4 : 0xe86a8a, [0, 0, 1])
    for (const s of [-1, 1]) filo(g, pt(s < 0 ? 0 : n), [s * 1.3, 0.98, 0], 0.02, 0xd9c7a0)
    return { altezza: 1.2 }
  }),
  altalena: decoro('altalena', g => {
    for (const s of [-1, 1]) { filo(g, [s * 0.8, 0.0, 0.4], [s * 0.8, 1.75, 0], 0.045, LEGNO_SCURO); filo(g, [s * 0.8, 0.0, -0.4], [s * 0.8, 1.75, 0], 0.045, LEGNO_SCURO) }
    cilindro(g, 0.05, 0.05, 1.75, mat(LEGNO), 0, 1.75, 0, 6).rotation.z = Math.PI / 2
    scatola(g, 0.5, 0.06, 0.22, mat(LEGNO_CHIARO), 0, 0.5, 0.0)
    for (const s of [-1, 1]) filo(g, [s * 0.25, 1.72, 0], [s * 0.25, 0.52, 0], 0.014, 0x8f8a7e)
    return { altezza: 1.9 }
  }),
  altalena_pergola: decoro('altalena_pergola', g => {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) scatola(g, 0.1, 2.0, 0.1, mat(LEGNO_SCURO), sx * 1.2, 1.0, sz * 0.6)
    for (const sz of [-1, 1]) scatola(g, 2.7, 0.1, 0.1, mat(LEGNO), 0, 2.0, sz * 0.6)
    for (const sx of [-1, 1]) scatola(g, 0.1, 0.1, 1.3, mat(LEGNO), sx * 1.2, 2.0, 0)
    for (const sz of [-1, 1]) listello(g, [0, 2.4, 0], [0, 2.0, sz * 0.78], 3.0, 0.06, 0xb4553a, [1, 0, 0])      // il tetto a due falde
    scatola(g, 2.9, 0.07, 0.07, mat(LEGNO_SCURO), 0, 2.4, 0)
    for (const s of [-1, 1]) { filo(g, [s * 0.6, 1.98, 0], [s * 0.6, 0.58, 0.05], 0.016, 0x8f8a7e); }
    for (const z of [-0.12, 0.02, 0.16]) scatola(g, 1.5, 0.05, 0.12, mat(0xf4efe4), 0, 0.55, z)
    scatola(g, 1.5, 0.5, 0.05, mat(0xf4efe4), 0, 0.85, -0.17); for (const s of [-1, 1]) scatola(g, 0.06, 0.2, 0.4, mat(0xf4efe4), s * 0.72, 0.65, 0.02)
    return { altezza: 2.5 }
  }),

  tavolino: decoro('tavolino', g => {
    cilindro(g, 0.18, 0.22, 0.05, mat(LEGNO_SCURO), 0, 0.025, 0, 8); cilindro(g, 0.05, 0.06, 0.52, mat(LEGNO_SCURO), 0, 0.3, 0, 6)
    cilindro(g, 0.42, 0.42, 0.05, mat(LEGNO), 0, 0.58, 0, 14); cilindro(g, 0.43, 0.43, 0.012, mat(BIANCO), 0, 0.61, 0, 14)
    palla(g, 0.1, 0xe9dfc8, 0, 0.7, 0, 1.1, 0.9, 1.1, 1); cilindro(g, 0.03, 0.04, 0.05, mat(0xe9dfc8), 0, 0.8, 0, 6)
    filo(g, [0.08, 0.72, 0], [0.18, 0.68, 0], 0.018, 0xe9dfc8); const m = arco(g, 0.06, 0.014, 0xe9dfc8, -0.12, 0.7, 0, Math.PI * 1.5, 6); m.rotation.z = -Math.PI * 0.75
    for (const [x, z] of [[0.22, 0.2], [-0.22, 0.2]]) { cilindro(g, 0.045, 0.03, 0.05, mat(BIANCO), x, 0.645, z, 7) }
    return { altezza: 0.85 }
  }),
  bancone: decoro('bancone', g => {
    scatola(g, 1.8, 0.88, 0.5, mat(0xb98a4a), 0, 0.44, 0)
    for (const y of [0.2, 0.45, 0.7]) scatola(g, 1.82, 0.03, 0.52, mat(LEGNO_SCURO), 0, y, 0)
    scatola(g, 1.92, 0.07, 0.62, mat(LEGNO_CHIARO), 0, 0.91, 0.03)
    cilindro(g, 0.1, 0.1, 0.16, mat(0x9fd0e0), -0.6, 1.025, 0.0, 8); cilindro(g, 0.1, 0.1, 0.16, mat(0xe9b44a), -0.35, 1.025, 0.1, 8)
    scatola(g, 0.28, 0.14, 0.2, mat(0x33343c), 0.55, 1.01, 0.0); scatola(g, 0.2, 0.02, 0.16, mat(0xe9dfc8), 0.55, 1.09, 0.0)
    for (const [x, z] of [[0.05, 0.1], [0.15, -0.05], [0.0, -0.05]]) palla(g, 0.06, ROSSO, x, 1.0, z, 1, 1, 1, 1)
    return { altezza: 1.1 }
  }),
  cassa: decoro('cassa', g => {
    scatola(g, 0.56, 0.5, 0.56, mat(0xb98a4a), 0, 0.25, 0)
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) scatola(g, 0.06, 0.52, 0.06, mat(LEGNO_SCURO), sx * 0.26, 0.26, sz * 0.26)
    for (const y of [0.05, 0.45]) for (const r of [0, 1]) scatola(g, r ? 0.58 : 0.05, 0.05, r ? 0.05 : 0.58, mat(LEGNO_SCURO), r ? 0 : -0.26, y, r ? 0.27 : 0)
    for (const s of [-1, 1]) { const d = scatola(g, 0.06, 0.62, 0.02, mat(LEGNO_SCURO), 0, 0.25, 0.285); d.rotation.z = s * 0.82 }
    return { altezza: 0.55 }
  }),
  cassa_grande: decoro('cassa_grande', g => {
    scatola(g, 0.86, 0.7, 0.7, mat(0xa87a3e), 0, 0.35, 0)
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) scatola(g, 0.07, 0.72, 0.07, mat(LEGNO_SCURO), sx * 0.4, 0.36, sz * 0.32)
    for (const y of [0.06, 0.64]) { scatola(g, 0.88, 0.06, 0.06, mat(LEGNO_SCURO), 0, y, 0.34); scatola(g, 0.06, 0.06, 0.72, mat(LEGNO_SCURO), -0.4, y, 0) }
    for (const s of [-1, 1]) { const d = scatola(g, 0.07, 0.86, 0.02, mat(LEGNO_SCURO), 0, 0.35, 0.355); d.rotation.z = s * 0.88 }
    scatola(g, 0.36, 0.28, 0.32, mat(0xc59858), 0.18, 0.84, 0.0)
    for (const sx of [-1, 1]) scatola(g, 0.04, 0.3, 0.04, mat(LEGNO_SCURO), 0.18 + sx * 0.16, 0.85, 0.14)
    return { altezza: 1.0 }
  }),
  barile: decoro('barile', g => {
    botte(g, 0.3, 0.7, 0xa06a34); cilindro(g, 0.2, 0.2, 0.012, mat(LEGNO_CHIARO), 0, 0.705, 0, 12); return { altezza: 0.8 }
  }),
  barile2: decoro('barile2', g => {
    botte(g, 0.3, 0.6, 0xa06a34); cilindro(g, 0.24, 0.24, 0.02, mat(0x6b4a2e), 0, 0.6, 0, 12)
    palla(g, 0.2, 0x4f9a45, 0, 0.66, 0, 1.2, 0.6, 1.2, 1)
    mazzo(g, [[-0.1, 0.05, 0.2, 'margherita', ROSA, GIALLO, 1.4], [0.1, 0.0, 0.26, 'tulipano', ROSSO, null, 1.3], [0.0, 0.12, 0.22, 'margherita', BIANCO, GIALLO, 1.3], [0.04, -0.1, 0.24, 'margherita', GIALLO, 0xc08a20, 1.3]], 0.66); return { altezza: 1.0 }
  }),
  barilotto: decoro('barilotto', g => {
    const b = botte(g, 0.2, 0.52, 0xa06a34, 0, 0, 0); b.rotation.z = Math.PI / 2; b.position.set(0.26, 0.27, 0)       // coricato: il fondo (con la cannella) sta a destra
    for (const x of [-0.15, 0.15]) scatola(g, 0.08, 0.14, 0.46, mat(LEGNO_SCURO), x, 0.07, 0)
    cilindro(g, 0.03, 0.03, 0.12, mat(0xb08a30), 0.3, 0.27, 0, 6).rotation.z = Math.PI / 2; scatola(g, 0.04, 0.1, 0.04, mat(0xb08a30), 0.35, 0.22, 0)
    return { altezza: 0.5 }
  }),
  sacco: decoro('sacco', g => {
    palla(g, 0.26, 0xe0cfa3, 0, 0.25, 0, 1, 1.05, 1, 1); cono(g, 0.12, 0.2, mat(0xe0cfa3), 0, 0.58, 0, 7)
    const l = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.02, 4, 8), mat(0x8a5a2a)); l.rotation.x = Math.PI / 2; l.position.set(0, 0.52, 0); pronto(l); g.add(l)
    cono(g, 0.05, 0.1, mat(0xe0cfa3), 0, 0.74, 0, 5)
    return { altezza: 0.8 }
  }),
  sacco_iuta: decoro('sacco_iuta', g => {
    for (const [x, z, h, c] of [[-0.18, 0.04, 0.55, 0xb08a52], [0.2, -0.02, 0.5, 0xa07a46]]) {
      palla(g, 0.24, c, x, 0.23, z, 1, 1, 0.9, 1); cono(g, 0.12, 0.2, mat(c), x, 0.23 + 0.22, z, 6)
      const l = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.018, 4, 8), mat(0x5a3a1e)); l.rotation.x = Math.PI / 2; l.position.set(x, 0.23 + 0.31, z); pronto(l); g.add(l)
      scatola(g, 0.18, 0.16, 0.02, mat(0xd8352a), x, 0.25, z + 0.215)
    }
    palla(g, 0.22, 0xb89a62, 0.02, 0.62, 0.0, 1.1, 0.9, 0.9, 1).rotation.z = 0.5
    return { altezza: 0.9 }
  }),
  posta: decoro('posta', g => {
    cilindro(g, 0.07, 0.09, 0.05, mat(0x8f8a7e), 0, 0.025, 0, 8); cilindro(g, 0.04, 0.045, 0.95, mat(LEGNO_SCURO), 0, 0.5, 0, 6)
    scatola(g, 0.12, 0.05, 0.4, mat(LEGNO_SCURO), 0, 0.97, 0)
    scatola(g, 0.3, 0.2, 0.5, mat(0x2d6fb8), 0, 1.1, 0); const t = cilindro(g, 0.15, 0.15, 0.5, mat(0x2d6fb8), 0, 1.2, 0, 10); t.rotation.x = Math.PI / 2
    const p = cilindro(g, 0.14, 0.14, 0.02, mat(0x1e4f8a), 0, 1.15, 0.255, 10); p.rotation.x = Math.PI / 2; p.scale.set(1, 1, 1.1)
    scatola(g, 0.04, 0.2, 0.04, mat(ROSSO), 0.17, 1.12, -0.1); scatola(g, 0.03, 0.1, 0.12, mat(ROSSO), 0.17, 1.24, -0.04)
    scatola(g, 0.12, 0.02, 0.07, mat(BIANCO), 0, 1.35, 0.1)
    return { altezza: 1.5 }
  }),
  specchio: decoro('specchio', g => {
    const fr = pronto(new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.04, 5, 16), mat(0xc79a3a, { metalness: 0.3, roughness: 0.6 }))); fr.position.set(0, 0.95, 0); fr.scale.set(1, 1.55, 1); g.add(fr)
    const v = cilindro(g, 0.24, 0.24, 0.025, mat(0xcfe6f2, { metalness: 0.5, roughness: 0.15 }), 0, 0.95, 0, 16); v.rotation.x = Math.PI / 2; v.scale.set(1, 1, 1.55)
    for (const s of [-1, 1]) { filo(g, [s * 0.34, 0.0, 0.0], [s * 0.24, 0.95, 0.0], 0.025, 0x6e4a2c); scatola(g, 0.07, 0.05, 0.5, mat(0x6e4a2c), s * 0.34, 0.025, 0) }
    palla(g, 0.05, 0xc79a3a, 0, 1.36, 0, 1, 1, 1, 0)
    return { altezza: 1.45 }
  }),
  campanelle: decoro('campanelle', g0 => {
    const g = new THREE.Group(); g.position.x = -0.25; g0.add(g)          // il palo a sinistra: le campanelle pendono al centro della cella
    palo(g, 1.8)
    scatola(g, 0.5, 0.05, 0.05, mat(LEGNO_SCURO), 0.25, 1.84, 0)
    filo(g, [0, 1.5, 0], [0.4, 1.84, 0], 0.02, LEGNO_SCURO)
    const R = 0.17, X = 0.5, Y = 1.5
    cilindro(g, R, R, 0.03, mat(LEGNO), X, Y, 0, 12)
    filo(g, [X, 1.84, 0], [X, Y + 0.02, 0], 0.012, 0xbfc4cc)
    const lunghe = [0.5, 0.36, 0.44, 0.3, 0.52]
    for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2, h = lunghe[i]; cilindro(g, 0.018, 0.018, h, mat(0xbfc4cc, { metalness: 0.5, roughness: 0.35 }), X + Math.cos(a) * R * 0.85, Y - h / 2, Math.sin(a) * R * 0.85, 6) }
    filo(g, [X, Y, 0], [X, Y - 0.32, 0], 0.01, 0xbfc4cc); palla(g, 0.035, LEGNO_SCURO, X, Y - 0.32, 0, 1, 1, 1, 0)
    scatola(g, 0.1, 0.12, 0.012, mat(0xd8352a), X, Y - 0.42, 0)
    filo(g, [X, Y - 0.32, 0], [X, Y - 0.36, 0], 0.008, 0xbfc4cc)
    return { altezza: 2.0 }
  }),
  girandola: decoro('girandola', g => {
    cilindro(g, 0.015, 0.02, 1.25, mat(LEGNO_CHIARO), 0, 0.64, 0, 5); cilindro(g, 0.07, 0.09, 0.04, mat(0x8f8a7e), 0, 0.02, 0, 8)
    const gr = new THREE.Group(); gr.position.set(0, 1.28, 0.04); g.add(gr)
    VARI.slice(0, 4).forEach((c, i) => { const a = i * Math.PI / 2 + 0.4, o = cono(gr, 0.1, 0.3, mat(c), Math.cos(a) * 0.15, Math.sin(a) * 0.15, 0, 3); o.rotation.z = a - Math.PI / 2; o.scale.z = 0.22 })
    palla(gr, 0.04, 0xf4efe4, 0, 0, 0.02, 1, 1, 1, 0)
    return { altezza: 1.6 }
  }),
  mulinello: decoro('mulinello', g => {
    cilindro(g, 0.1, 0.14, 0.06, mat(0x8f8a7e), 0, 0.03, 0, 8)
    cilindro(g, 0.07, 0.13, 1.1, mat(BIANCO), 0, 0.6, 0, 8)
    cono(g, 0.2, 0.28, mat(0xb4553a), 0, 1.29, 0, 8)
    scatola(g, 0.12, 0.12, 0.18, mat(LEGNO_SCURO), 0, 1.12, 0.14)
    const pale = new THREE.Group(); pale.position.set(0, 1.12, 0.26); g.add(pale)
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2, br = new THREE.Group(); br.rotation.z = a; pale.add(br)
      scatola(br, 0.05, 0.78, 0.03, mat(LEGNO), 0, 0.39, 0); scatola(br, 0.2, 0.5, 0.012, mat(i % 2 ? 0xf4efe4 : 0xe86a8a), 0.12, 0.45, 0.02)
    }
    palla(pale, 0.06, LEGNO_SCURO, 0, 0, 0.02, 1, 1, 1, 0)
    fondiPerMateriale(pale)
    g.userData.pale = pale
    g.userData.anima = function (t) { this.pale.rotation.z = -t * 1.3 }
    return { altezza: 1.9, escludi: [pale] }
  }),
  palloncini: decoro('palloncini', g => {
    cilindro(g, 0.1, 0.13, 0.12, mat(0x8f8a7e), 0, 0.06, 0, 8)
    const P = [[0, 1.75, 0, ROSSO], [0.25, 1.55, 0.1, GIALLO], [-0.25, 1.5, 0.05, 0x3f78c8], [0.08, 1.4, -0.22, ROSA], [-0.1, 1.35, 0.22, 0x5aa84c]]
    for (const [x, y, z, c] of P) {
      palla(g, 0.17, c, x, y, z, 1, 1.22, 1, 1)
      cono(g, 0.03, 0.05, mat(c), x, y - 0.27, z, 4).rotation.x = Math.PI
      filo(g, [0, 0.12, 0], [x, y - 0.27, z], 0.008, 0xe9dfc8, 3)
    }
    return { altezza: 2.0 }
  }),
  festone: decoro('festone', g => {
    for (const s of [-1, 1]) { cilindro(g, 0.04, 0.05, 1.5, mat(LEGNO_SCURO), s * 0.9, 0.75, 0, 6); palla(g, 0.06, 0xb98a4a, s * 0.9, 1.52, 0, 1, 1, 1, 0); cilindro(g, 0.1, 0.12, 0.06, mat(0x8f8a7e), s * 0.9, 0.03, 0, 8) }
    const p = festoneFra(g, [-0.9, 1.47, 0], [0.9, 1.47, 0], 0.32, 12, 0.014, 0x3f8a3a)
    p.forEach(([x, y, z], i) => { palla(g, 0.075, i % 2 ? 0x4f9a45 : 0x3f8a3a, x, y, z, 1, 0.9, 1, 0); if (i % 2 === 0 && i > 0 && i < 12) palla(g, 0.04, VARI[(i / 2) % 5], x, y - 0.06, z + 0.04, 1, 1, 1, 0) })
    return { altezza: 1.7 }
  }),
  lucine: decoro('lucine', g => {
    for (const s of [-1, 1]) { cilindro(g, 0.04, 0.05, 1.8, mat(LEGNO_SCURO), s * 0.9, 0.9, 0, 6); cilindro(g, 0.1, 0.12, 0.06, mat(0x8f8a7e), s * 0.9, 0.03, 0, 8) }
    const p = festoneFra(g, [-0.9, 1.78, 0], [0.9, 1.78, 0], 0.26, 12, 0.01, 0x33343c)
    p.forEach(([x, y, z], i) => { if (i > 0 && i < 12) { const c = [0xffd54a, 0xffb347, 0xfff1b0][i % 3]; palla(g, 0.05, c, x, y - 0.04, z, 1, 1.2, 1, 0).material = luce(c) } })
    return { altezza: 1.9 }
  }),
  paiolo: decoro('paiolo', g => {
    const top = [0, 1.15, 0]
    for (const a of [0.3, 2.4, 4.5]) filo(g, [Math.cos(a) * 0.42, 0, Math.sin(a) * 0.42], top, 0.025, LEGNO_SCURO)
    filo(g, top, [0, 0.66, 0], 0.012, FERRO)
    palla(g, 0.23, 0x2b2b30, 0, 0.46, 0, 1, 0.82, 1, 1); cilindro(g, 0.2, 0.2, 0.03, mat(0x2b2b30), 0, 0.62, 0, 10)
    const r = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.015, 4, 12), mat(FERRO)); r.rotation.x = Math.PI / 2; r.position.set(0, 0.66, 0); pronto(r); g.add(r)
    arco(g, 0.2, 0.012, FERRO, 0, 0.64, 0, Math.PI, 8)
    for (const a of [0, 1.57, 3.14, 4.71]) { const l = cilindro(g, 0.04, 0.04, 0.4, mat(LEGNO_SCURO), Math.cos(a) * 0.1, 0.05, Math.sin(a) * 0.1, 6); l.rotation.set(Math.PI / 2, 0, a + 1.57) }
    for (const [x, z, h, c] of [[0, 0, 0.3, 0xff7a1a], [0.1, 0.04, 0.22, 0xff9a2a], [-0.08, -0.05, 0.24, 0xe8541a], [0.02, 0.1, 0.18, 0xffb030]]) cono(g, 0.07, h, luce(c), x, 0.1 + h / 2, z, 5)
    return { altezza: 1.2 }
  }),
}
