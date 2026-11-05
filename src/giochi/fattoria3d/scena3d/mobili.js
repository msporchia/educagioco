// I mobili della casa (docs/fattoria3d/casa.md), tutti in codice come il resto della fattoria: pochi mattoncini, il colore scelto dal
// bambino e, per le stoffe, una trama disegnata su un canvas (righe, quadri, pois, fiori, cuori, stelle). Ogni modello ha l'origine al
// centro della sua impronta NON girata e il davanti verso +z; le cose appese stanno contro la parete di fondo (a -z). Non sa le regole.
import * as THREE from 'three'
import { mat, scatola, cilindro, cono, sfera } from './modelli.js'
import { memoModello } from './cache-modelli.js'
import { disegnaTrama, chiaro, scuro } from './trame-pure.js'
import { fondiPerMateriale } from './fondi.js'
import { MOBILI, COLORI, coloreDi, tintaInForma } from '../dati/interni.js'

const PARETE = -0.86                          // dove sta la parete di fondo, dal centro della prima fila di celle

// ── le stoffe: una trama per (colore, trama), disegnata una volta ──
const trame = new Map()
function stoffa(hex, trama) {
  if (!trama || trama === 'unita' || typeof document === 'undefined') return mat(hex, { roughness: 1 })
  const k = hex + trama
  if (!trame.has(k)) {
    const c = document.createElement('canvas'); c.width = c.height = 64
    disegnaTrama(c.getContext('2d'), 64, hex, trama)
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2, 2)
    trame.set(k, new THREE.MeshStandardMaterial({ map: t, roughness: 1, flatShading: true }))
  }
  return trame.get(k)
}

// ── i mattoncini dei mobili ──
const METALLO = mat(0x9aa0a6, { roughness: 0.5, metalness: 0.4 })
const BIANCO = mat(0xf4f2ec), NERO = mat(0x2b2b30), VETRO = mat(0x9fd3ef, { roughness: 0.2, metalness: 0.1 })
/** Quello che si vede da una finestra: il cielo e, in basso, il prato. */
const fuori = (g, w, h, y) => { scatola(g, w, h, 0.02, VETRO, 0, y, PARETE + 0.03); scatola(g, w, h * 0.3, 0.02, mat(0x7cc46a), 0, y - h * 0.35, PARETE + 0.035) }
const gambe = (g, w, d, h, m, r = 0.04) => { for (const sx of [-1, 1]) for (const sz of [-1, 1]) cilindro(g, r, r, h, m, sx * (w / 2 - r * 1.5), h / 2, sz * (d / 2 - r * 1.5), 6) }

/** Il disegno di ogni mobile: (gruppo, colore hex, materiale del colore). */
const DISEGNI = {
  armadio(g, c, m) {
    scatola(g, 1.8, 1.45, 0.62, m, 0, 0.75, -0.12); scatola(g, 1.86, 0.08, 0.68, mat(scuro(c, 0.25)), 0, 1.5, -0.12)
    for (const x of [-0.45, 0.45]) { scatola(g, 0.84, 1.28, 0.04, mat(chiaro(c, 0.12)), x, 0.78, 0.2); cilindro(g, 0.025, 0.025, 0.22, METALLO, x * 0.12 + (x > 0 ? 0.05 : -0.05), 0.82, 0.24, 6) }
    scatola(g, 1.8, 0.06, 0.62, mat(scuro(c, 0.3)), 0, 0.03, -0.12)
  },
  divano(g, c, m) {
    scatola(g, 2.8, 0.28, 0.8, m, 0, 0.22, 0); scatola(g, 2.8, 0.5, 0.22, m, 0, 0.5, -0.3)
    for (const x of [-1.32, 1.32]) scatola(g, 0.2, 0.42, 0.8, m, x, 0.36, 0)
    for (const x of [-0.68, 0.68]) scatola(g, 1.2, 0.1, 0.56, m, x, 0.41, 0.08)
    gambe(g, 2.7, 0.7, 0.1, mat(0x5a3a22))
  },
  poltrona(g, c, m) {
    scatola(g, 0.82, 0.28, 0.8, m, 0, 0.22, 0); scatola(g, 0.82, 0.55, 0.2, m, 0, 0.52, -0.3)
    for (const x of [-0.36, 0.36]) scatola(g, 0.14, 0.4, 0.8, m, x, 0.4, 0)
    gambe(g, 0.75, 0.7, 0.1, mat(0x5a3a22))
  },
  pouf(g, c, m) { cilindro(g, 0.34, 0.36, 0.36, m, 0, 0.18, 0, 14); cilindro(g, 0.33, 0.33, 0.04, mat(chiaro(c, 0.2)), 0, 0.37, 0, 14) },
  tavolino(g, c, m) { scatola(g, 1.6, 0.07, 0.7, m, 0, 0.32, 0); gambe(g, 1.5, 0.6, 0.3, m); scatola(g, 1.4, 0.04, 0.5, mat(scuro(c, 0.15)), 0, 0.1, 0) },
  libreria(g, c, m) {
    scatola(g, 1.8, 1.4, 0.06, m, 0, 0.7, -0.3)
    for (const x of [-0.88, 0.88]) scatola(g, 0.06, 1.4, 0.5, m, x, 0.7, -0.1)
    const libri = [0xd9534f, 0x3f6fd1, 0xf2c94c, 0x6fbf73, 0x9b6fd1, 0xef8a3c]
    for (let p = 0; p < 4; p++) {
      const y = 0.05 + p * 0.45; scatola(g, 1.76, 0.05, 0.5, m, 0, y, -0.1)
      if (p < 3) for (let k = 0; k < 9; k++) { const h = 0.24 + (k * 7 % 5) * 0.03; scatola(g, 0.12, h, 0.32, mat(libri[(k + p) % libri.length]), -0.72 + k * 0.17, y + 0.03 + h / 2, -0.1) }
    }
  },
  camino(g, c, m) {
    scatola(g, 1.8, 1.0, 0.5, m, 0, 0.5, -0.2); scatola(g, 2.0, 0.1, 0.62, mat(scuro(c, 0.2)), 0, 1.05, -0.18)
    scatola(g, 0.9, 0.6, 0.1, NERO, 0, 0.35, 0.03)
    sfera(g, 0.18, mat(0xffa030, { emissive: 0xff6a10, emissiveIntensity: 1.3 }), -0.1, 0.18, 0.05, 1, 1.4, 1, 6)
    sfera(g, 0.13, mat(0xffd050, { emissive: 0xffa020, emissiveIntensity: 1.2 }), 0.14, 0.15, 0.05, 1, 1.4, 1, 6)
    g.userData.fuoco = true
  },
  tv(g, c, m) {
    scatola(g, 1.7, 0.45, 0.55, m, 0, 0.225, -0.1); scatola(g, 1.4, 0.8, 0.07, NERO, 0, 0.88, -0.2)
    scatola(g, 1.28, 0.68, 0.02, mat(0x5aa7d6, { emissive: 0x2a6a96, emissiveIntensity: 0.5 }), 0, 0.88, -0.16)
    scatola(g, 0.3, 0.05, 0.2, NERO, 0, 0.47, -0.2)
  },
  lampada(g, c, m) { cilindro(g, 0.18, 0.2, 0.05, METALLO, 0, 0.03, 0, 10); cilindro(g, 0.025, 0.025, 1.2, METALLO, 0, 0.62, 0, 6); cono(g, 0.26, 0.32, mat(c, { emissive: c, emissiveIntensity: 0.35 }), 0, 1.3, 0, 12) },
  pianta(g, c, m) {
    cilindro(g, 0.24, 0.18, 0.36, m, 0, 0.18, 0, 10)
    const foglia = mat(0x4c9a4a)
    for (let k = 0; k < 6; k++) { const t = k / 6 * Math.PI * 2; sfera(g, 0.2, foglia, Math.cos(t) * 0.14, 0.62 + (k % 2) * 0.12, Math.sin(t) * 0.14, 1, 1.4, 1, 6) }
    sfera(g, 0.2, foglia, 0, 0.88, 0, 1, 1.5, 1, 6)
  },
  tavolo(g, c, m) { scatola(g, 1.8, 0.08, 1.8, m, 0, 0.58, 0); gambe(g, 1.6, 1.6, 0.56, m, 0.06); scatola(g, 0.9, 0.02, 0.9, mat(0xf4f2ec), 0, 0.63, 0) },
  sedia(g, c, m) { scatola(g, 0.6, 0.06, 0.6, m, 0, 0.36, 0.05); gambe(g, 0.55, 0.55, 0.36, m, 0.035); scatola(g, 0.6, 0.55, 0.06, m, 0, 0.66, -0.24) },
  fornelli(g, c, m) {
    scatola(g, 1.8, 0.85, 0.65, m, 0, 0.43, -0.1); scatola(g, 1.84, 0.05, 0.7, mat(0x8a8f96), 0, 0.88, -0.1)
    for (const [x, z] of [[-0.55, -0.25], [-0.2, -0.25], [-0.55, 0.05], [-0.2, 0.05]]) cilindro(g, 0.12, 0.12, 0.02, NERO, x, 0.92, z, 10)
    scatola(g, 0.7, 0.45, 0.03, NERO, 0.4, 0.42, 0.24); scatola(g, 0.5, 0.25, 0.02, mat(0xffb060, { emissive: 0xff7a20, emissiveIntensity: 0.4 }), 0.4, 0.42, 0.26)
  },
  frigo(g, c, m) { scatola(g, 0.78, 1.5, 0.66, m, 0, 0.75, -0.1); scatola(g, 0.8, 0.02, 0.02, mat(scuro(c, 0.3)), 0, 1.05, 0.24); for (const y of [0.6, 1.3]) scatola(g, 0.04, 0.24, 0.05, METALLO, 0.3, y, 0.26) },
  credenza(g, c, m) {
    scatola(g, 1.8, 0.8, 0.55, m, 0, 0.4, -0.15)
    for (const x of [-0.45, 0.45]) { scatola(g, 0.82, 0.68, 0.03, mat(chiaro(c, 0.15)), x, 0.4, 0.14); sfera(g, 0.04, METALLO, x + (x > 0 ? -0.3 : 0.3), 0.45, 0.17, 1, 1, 1, 6) }
    for (const [x, col] of [[-0.5, 0xd9534f], [-0.1, 0xf4f2ec], [0.4, 0x3f6fd1]]) cilindro(g, 0.1, 0.08, 0.2, mat(col), x, 0.9, -0.2, 8)
  },
  lavello(g, c, m) { scatola(g, 0.85, 0.85, 0.65, m, 0, 0.43, -0.1); scatola(g, 0.6, 0.04, 0.45, METALLO, 0, 0.87, -0.1); cilindro(g, 0.03, 0.03, 0.3, METALLO, 0, 1.02, -0.32, 6); scatola(g, 0.04, 0.04, 0.16, METALLO, 0, 1.16, -0.25) },
  letto(g, c, m) {
    const legno = mat(0x8a5a33)
    scatola(g, 1.8, 0.3, 2.8, legno, 0, 0.2, 0); scatola(g, 1.82, 0.9, 0.1, legno, 0, 0.45, -1.4); scatola(g, 1.82, 0.5, 0.1, legno, 0, 0.25, 1.4)
    scatola(g, 1.7, 0.18, 2.65, BIANCO, 0, 0.42, 0)
    scatola(g, 1.74, 0.12, 1.85, m, 0, 0.5, 0.38)
    for (const x of [-0.42, 0.42]) scatola(g, 0.68, 0.14, 0.4, BIANCO, x, 0.55, -1.02)
  },
  comodino(g, c, m) { scatola(g, 0.6, 0.5, 0.55, m, 0, 0.25, -0.1); scatola(g, 0.5, 0.18, 0.02, mat(chiaro(c, 0.15)), 0, 0.33, 0.18); cilindro(g, 0.06, 0.08, 0.06, BIANCO, 0, 0.53, -0.1, 8); sfera(g, 0.1, mat(0xffe08a, { emissive: 0xffc040, emissiveIntensity: 0.6 }), 0, 0.66, -0.1, 1, 1.2, 1, 8) },
  cassettiera(g, c, m) { scatola(g, 1.6, 0.85, 0.6, m, 0, 0.43, -0.1); for (let k = 0; k < 3; k++) { scatola(g, 1.48, 0.22, 0.03, mat(chiaro(c, 0.15)), 0, 0.17 + k * 0.26, 0.21); sfera(g, 0.035, METALLO, 0, 0.17 + k * 0.26, 0.24, 1, 1, 1, 6) } },
  scrivania(g, c, m) {
    scatola(g, 1.7, 0.06, 0.7, m, 0, 0.55, -0.05); scatola(g, 0.5, 0.52, 0.66, m, 0.58, 0.26, -0.05); for (const z of [-0.33, 0.25]) cilindro(g, 0.03, 0.03, 0.52, m, -0.78, 0.26, z, 6)
    scatola(g, 0.4, 0.02, 0.3, BIANCO, -0.2, 0.59, 0); cilindro(g, 0.06, 0.05, 0.14, mat(0xd9534f), -0.6, 0.65, -0.25, 8)
  },
  giochi(g, c, m) {
    scatola(g, 0.8, 0.45, 0.6, m, 0, 0.23, 0)
    sfera(g, 0.16, mat(0xd9534f), -0.15, 0.55, 0, 1, 1, 1, 10); scatola(g, 0.2, 0.2, 0.2, mat(0xf2c94c), 0.18, 0.52, 0.05); cono(g, 0.12, 0.22, mat(0x3f6fd1), 0.05, 0.55, -0.15, 8)
  },
  orsetto(g, c, m) {
    sfera(g, 0.22, m, 0, 0.24, 0, 1, 1.05, 0.9, 10); sfera(g, 0.16, m, 0, 0.55, 0.02, 1, 1, 1, 10)
    for (const x of [-0.12, 0.12]) { sfera(g, 0.06, m, x, 0.69, 0, 1, 1, 0.6, 6); sfera(g, 0.08, m, x * 1.6, 0.28, 0.12, 1, 1, 1, 6) }
    sfera(g, 0.06, mat(chiaro(c, 0.4)), 0, 0.52, 0.15, 1, 0.8, 0.8, 6); for (const x of [-0.06, 0.06]) sfera(g, 0.022, NERO, x, 0.6, 0.15, 1, 1, 1, 5)
  },
  cuccia(g, c, m) { cilindro(g, 0.42, 0.44, 0.18, m, 0, 0.09, 0, 14); cilindro(g, 0.32, 0.32, 0.1, mat(chiaro(c, 0.35)), 0, 0.15, 0, 14); sfera(g, 0.08, mat(0xf2c94c), 0.15, 0.24, 0.05, 1.6, 0.6, 0.6, 6) },
  tiragraffi(g, c, m) { scatola(g, 0.7, 0.08, 0.7, m, 0, 0.04, 0); cilindro(g, 0.1, 0.1, 1.0, mat(0xd8c49a), 0, 0.55, 0, 8); scatola(g, 0.5, 0.06, 0.5, m, 0, 1.05, 0); sfera(g, 0.06, mat(0xd9534f), 0.2, 0.9, 0.2, 1, 1, 1, 6) },
  vasca(g, c, m) { scatola(g, 1.8, 0.55, 0.8, m, 0, 0.28, 0); scatola(g, 1.6, 0.04, 0.6, mat(0x9fd3ef, { roughness: 0.2 }), 0, 0.5, 0); cilindro(g, 0.03, 0.03, 0.3, METALLO, -0.75, 0.7, -0.3, 6); for (let k = 0; k < 3; k++) sfera(g, 0.09, BIANCO, 0.2 + k * 0.15, 0.56, 0.1 - k * 0.08, 1, 0.8, 1, 6) },
  lavandino(g, c, m) { cilindro(g, 0.1, 0.14, 0.75, m, 0, 0.38, -0.1, 10); scatola(g, 0.7, 0.14, 0.5, m, 0, 0.82, -0.12); scatola(g, 0.5, 0.03, 0.32, mat(0x9fd3ef, { roughness: 0.2 }), 0, 0.89, -0.1); cilindro(g, 0.025, 0.025, 0.2, METALLO, 0, 0.98, -0.3, 6) },
  wc(g, c, m) { cilindro(g, 0.2, 0.16, 0.4, m, 0, 0.2, 0.05, 12); cilindro(g, 0.26, 0.26, 0.05, m, 0, 0.42, 0.08, 14); scatola(g, 0.55, 0.5, 0.2, m, 0, 0.6, -0.3); scatola(g, 0.12, 0.04, 0.05, METALLO, 0.15, 0.82, -0.2) },
  cesto(g, c, m) { cilindro(g, 0.26, 0.22, 0.5, m, 0, 0.25, 0, 10); cilindro(g, 0.27, 0.27, 0.04, mat(scuro(c, 0.2)), 0, 0.5, 0, 10); sfera(g, 0.14, mat(0x63b3ed), 0.05, 0.55, 0, 1.4, 0.6, 1, 6) },
  tappeto(g, c, m) { scatola(g, 2.85, 0.03, 1.85, m, 0, 0.015, 0); g.userData.basso = true },
  'tappeto-tondo'(g, c, m) { cilindro(g, 0.95, 0.95, 0.03, m, 0, 0.015, 0, 28); g.userData.basso = true },
  tappetino(g, c, m) { scatola(g, 1.8, 0.03, 0.85, m, 0, 0.015, 0); g.userData.basso = true },
  quadro(g, c, m) {
    scatola(g, 0.8, 0.62, 0.05, m, 0, 1.35, PARETE); scatola(g, 0.66, 0.48, 0.02, mat(0x8ec7ea), 0, 1.35, PARETE + 0.035)
    scatola(g, 0.66, 0.18, 0.02, mat(0x6fbf73), 0, 1.2, PARETE + 0.045); sfera(g, 0.07, mat(0xf6d36b), 0.18, 1.48, PARETE + 0.05, 1, 1, 0.3, 8)
  },
  finestra(g, c, m) {
    scatola(g, 0.78, 0.82, 0.05, BIANCO, 0, 1.3, PARETE); fuori(g, 0.64, 0.68, 1.3)
    scatola(g, 0.04, 0.68, 0.03, BIANCO, 0, 1.3, PARETE + 0.045); scatola(g, 0.64, 0.04, 0.03, BIANCO, 0, 1.3, PARETE + 0.045)
    for (const x of [-0.42, 0.42]) scatola(g, 0.22, 0.95, 0.04, m, x, 1.28, PARETE + 0.08)
    scatola(g, 1.0, 0.05, 0.05, mat(0x8a5a33), 0, 1.78, PARETE + 0.1)
  },
  'finestra-larga'(g, c, m) {
    scatola(g, 1.68, 0.82, 0.05, BIANCO, 0, 1.3, PARETE); fuori(g, 1.54, 0.68, 1.3)
    for (const x of [-0.385, 0, 0.385]) scatola(g, 0.04, 0.68, 0.03, BIANCO, x, 1.3, PARETE + 0.045)
    scatola(g, 1.54, 0.04, 0.03, BIANCO, 0, 1.3, PARETE + 0.045)
    for (const x of [-0.86, 0.86]) scatola(g, 0.26, 0.95, 0.04, m, x, 1.28, PARETE + 0.08)
    scatola(g, 1.96, 0.05, 0.05, mat(0x8a5a33), 0, 1.78, PARETE + 0.1)
  },
  'finestra-tonda'(g, c, m) {
    cilindro(g, 0.42, 0.42, 0.06, m, 0, 1.35, PARETE, 24).rotation.x = Math.PI / 2; cilindro(g, 0.34, 0.34, 0.02, VETRO, 0, 1.35, PARETE + 0.04, 24).rotation.x = Math.PI / 2
    scatola(g, 0.04, 0.68, 0.03, m, 0, 1.35, PARETE + 0.05); scatola(g, 0.68, 0.04, 0.03, m, 0, 1.35, PARETE + 0.05)
  },
  'finestra-fiori'(g, c, m) {
    scatola(g, 0.6, 0.72, 0.05, BIANCO, 0, 1.38, PARETE); fuori(g, 0.48, 0.6, 1.38)
    scatola(g, 0.04, 0.6, 0.03, BIANCO, 0, 1.38, PARETE + 0.045)
    for (const x of [-0.4, 0.4]) scatola(g, 0.2, 0.72, 0.04, m, x, 1.38, PARETE + 0.04)
    scatola(g, 0.8, 0.14, 0.18, mat(0x8a5a33), 0, 0.96, PARETE + 0.1)
    for (const x of [-0.27, -0.09, 0.09, 0.27]) sfera(g, 0.1, mat(0x4c9a4a), x, 1.06, PARETE + 0.1, 1, 0.8, 1, 6)
    for (const [x, col] of [[-0.27, 0xd9534f], [-0.09, 0xf2c94c], [0.09, 0xf29ac0], [0.27, 0xd9534f]]) sfera(g, 0.07, mat(col), x, 1.14, PARETE + 0.12, 1, 1, 1, 6)
  },
  orologio(g, c, m) { cilindro(g, 0.28, 0.28, 0.06, m, 0, 1.45, PARETE + 0.02, 18).rotation.x = Math.PI / 2; cilindro(g, 0.23, 0.23, 0.02, BIANCO, 0, 1.45, PARETE + 0.06, 18).rotation.x = Math.PI / 2; scatola(g, 0.03, 0.17, 0.02, NERO, 0, 1.51, PARETE + 0.08); scatola(g, 0.12, 0.03, 0.02, NERO, 0.05, 1.45, PARETE + 0.08) },
  specchio(g, c, m) { scatola(g, 0.62, 0.9, 0.05, m, 0, 1.3, PARETE); scatola(g, 0.5, 0.78, 0.02, mat(0xcfe8f4, { roughness: 0.15 }), 0, 1.3, PARETE + 0.035) },
  mensola(g, c, m) {
    scatola(g, 1.6, 0.06, 0.3, m, 0, 1.25, PARETE + 0.15)
    cilindro(g, 0.1, 0.08, 0.18, mat(0xd9534f), -0.5, 1.37, PARETE + 0.15, 8); sfera(g, 0.12, mat(0x4c9a4a), 0, 1.4, PARETE + 0.15, 1, 1, 1, 6); scatola(g, 0.3, 0.22, 0.14, mat(0x3f6fd1), 0.45, 1.39, PARETE + 0.15)
  },
}

function costruisci(tipo, colore, trama) {
  const m = MOBILI[tipo], g = new THREE.Group()
  const hex = (coloreDi(m.tinte, colore) || COLORI[m.tinte][0]).c
  const materiale = m.tinte === 'stoffa' ? stoffa(hex, trama) : mat(hex)
  ;(DISEGNI[tipo] || DISEGNI.pouf)(g, hex, materiale)
  if (m.strato === 'tappeto' || m.strato === 'muro') g.traverse(o => { if (o.isMesh) o.castShadow = false })
  fondiPerMateriale(g)
  g.userData.altezza = m.strato === 'muro' ? 1.8 : 1.2
  return g
}
const memo = memoModello('mobile', costruisci, { chiave: (t, c, tr) => `${t}:${c}:${tr}` })
/** Un mobile col suo colore e la sua trama (quelli di serie se mancano o non vanno per lui), o null se il tipo non c'è. */
export function creaMobile(tipo, colore = null, trama = null) {
  if (!MOBILI[tipo]) return null
  const t = tintaInForma(tipo, colore, trama)
  return memo(tipo, t.colore, t.trama)
}
export const TIPI_DISEGNATI = Object.keys(DISEGNI)
