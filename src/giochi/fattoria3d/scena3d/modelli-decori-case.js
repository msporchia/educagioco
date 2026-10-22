// Le case piccole, i forni, i chioschi, la serra e i lampioni delle decorazioni (W11). Il davanti (la porta) è verso +z, come ogni edificio; il tetto
// sta lungo x. Sono scatole e tetti dei mattoncini di modelli.js, fusi in poche mesh (la serra tiene due lastre trasparenti, i lampioni la luce).
// Vedi docs/fattoria3d/decorazioni.md.
import * as THREE from 'three'
import { decoro, mat, pronto, scatola, cilindro, cono, palla, ciuffo, fiore, cesto } from './modelli-decori-base.js'
import { tetto } from './modelli.js'

const MURO = 0xf2e6cf, LEGNO = 0x9a6a36, LEGNO_SCURO = 0x6e4a2c, VETRO = 0xa6d8ee, PIETRA = 0xb9b2a4, MATTONE = 0xb4553a

const luce = () => mat(0xfff0b0, { emissive: 0xffc24a, emissiveIntensity: 1.0 })
const finestra = (g, x, y, z, w = 0.4, h = 0.42, lato = 1) => {
  scatola(g, w, h, 0.05, mat(VETRO, { emissive: 0x405a66 }), x, y, z + 0.015 * lato)
  scatola(g, w + 0.1, 0.05, 0.08, mat(LEGNO_SCURO), x, y - h / 2, z + 0.03 * lato); scatola(g, w + 0.1, 0.05, 0.08, mat(LEGNO_SCURO), x, y + h / 2, z + 0.03 * lato)
  scatola(g, 0.04, h, 0.08, mat(LEGNO_SCURO), x, y, z + 0.03 * lato)
}
const porta = (g, x, z, w = 0.55, h = 0.95, colore = LEGNO) => {
  scatola(g, w, h, 0.08, mat(colore), x, h / 2 + 0.05, z); palla(g, 0.035, 0xf0c040, x + w * 0.3, h / 2, z + 0.05, 1, 1, 1, 0)
  scatola(g, w + 0.25, 0.06, 0.2, mat(0xa59d8f), x, 0.03, z + 0.08)
}

/** Una casa a un piano: corpo, tetto lungo x, porta e finestre sul davanti, il camino. Si costruisce in un gruppo spostato di `z0`. */
function casa (g0, { w, d, h, muro = MURO, tettoCol = MATTONE, z0 = 0, camino = true, finestre = 2, portaCol = LEGNO }) {
  const g = new THREE.Group(); g.position.z = z0; g0.add(g)
  scatola(g, w, h, d, mat(muro), 0, h / 2, 0)
  scatola(g, w + 0.1, 0.1, d + 0.1, mat(0xa59d8f), 0, 0.05, 0)
  const alt = tetto(g, w + 0.35, d + 0.4, h, tettoCol, 0.55)
  const fz = d / 2
  porta(g, 0, fz, Math.min(0.6, w * 0.3), Math.min(h * 0.75, 1.0), portaCol)
  const lati = finestre >= 2 ? [-1, 1] : [1]
  for (const s of lati) finestra(g, s * w * 0.3, h * 0.58, fz)
  if (camino) { scatola(g, 0.3, 0.8, 0.3, mat(0x8a5a44), w * 0.28, h + alt * 0.6 + 0.2, -d * 0.15); scatola(g, 0.36, 0.06, 0.36, mat(0x6e4a3a), w * 0.28, h + alt * 0.6 + 0.62, -d * 0.15) }
  return alt
}
/** Un fienile: corpo, tetto, il portone a croce e il finestrone del fienile. */
function fienile (g, { w, d, h, muro, tettoCol, croce = 0xf4efe4 }) {
  scatola(g, w, h, d, mat(muro), 0, h / 2, 0)
  scatola(g, w + 0.1, 0.1, d + 0.1, mat(0xa59d8f), 0, 0.05, 0)
  tetto(g, w + 0.4, d + 0.5, h, tettoCol, 0.7)
  const fz = d / 2
  scatola(g, w * 0.46, h * 0.78, 0.06, mat(muro === 0xb83a2e ? 0xa02f26 : muro), 0, h * 0.4, fz + 0.01)
  const c = mat(croce)
  scatola(g, w * 0.5, 0.07, 0.07, c, 0, h * 0.78, fz + 0.05); scatola(g, w * 0.5, 0.07, 0.07, c, 0, 0.1, fz + 0.05)
  for (const s of [-1, 1]) scatola(g, 0.07, h * 0.78, 0.07, c, s * w * 0.25, h * 0.4, fz + 0.05)
  scatola(g, 0.07, h * 0.78, 0.07, c, 0, h * 0.4, fz + 0.05)
  for (const s of [-1, 1]) { const x = scatola(g, 0.07, h * 0.9, 0.07, c, s * w * 0.12, h * 0.4, fz + 0.06); x.rotation.z = s * 0.5 }
  scatola(g, w * 0.25, 0.3, 0.05, mat(0x3a2a22), 0, h + 0.28, fz + 0.01)
}
/** Un chiosco: pedana, bancone, quattro pali e un tendone a righe. */
function chiosco (g, a, b, tetto2) {
  scatola(g, 2.7, 0.1, 1.7, mat(0xc79a5e), 0, 0.05, 0)
  for (const x of [-1.2, 1.2]) for (const z of [-0.7, 0.7]) scatola(g, 0.08, 1.7, 0.08, mat(0xf4efe4), x, 0.95, z)
  scatola(g, 2.0, 0.55, 0.45, mat(a), 0, 0.37, -0.35); scatola(g, 2.1, 0.06, 0.55, mat(0xf4efe4), 0, 0.68, -0.35)
  for (let i = 0; i < 9; i++) { const s = scatola(g, 0.3, 0.05, 1.9, mat(i % 2 ? 0xf4efe4 : b), -1.2 + i * 0.3, 1.9 + (tetto2 ? 0.1 * Math.sin((i / 8) * Math.PI) : 0), 0); s.rotation.x = 0.0 }
  for (let i = 0; i < 9; i++) scatola(g, 0.3, 0.2, 0.04, mat(i % 2 ? 0xf4efe4 : b), -1.2 + i * 0.3, 1.78, 0.95)
  for (const [x, c] of [[-0.55, 0xf0c52a], [0, 0xd8352a], [0.5, 0x7cbc4a]]) { palla(g, 0.1, c, x, 0.8, -0.3, 1, 1, 1, 0) }
  for (const x of [-0.75, 0.75]) { cilindro(g, 0.17, 0.17, 0.05, mat(b), x, 0.52, 0.5, 8); cilindro(g, 0.03, 0.03, 0.4, mat(0xf4efe4), x, 0.28, 0.5, 5) }
}
const lampada = (g, y, s = 1) => {
  scatola(g, 0.2 * s, 0.26 * s, 0.2 * s, luce(), 0, y, 0)
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) scatola(g, 0.025 * s, 0.28 * s, 0.025 * s, mat(0x33343c), x * 0.1 * s, y, z * 0.1 * s)
  cono(g, 0.17 * s, 0.14 * s, mat(0x33343c), 0, y + 0.2 * s, 0, 4).rotation.y = Math.PI / 4
  scatola(g, 0.24 * s, 0.03 * s, 0.24 * s, mat(0x33343c), 0, y - 0.15 * s, 0)
}

export const CASE_DECORI = {
  casetta: decoro('casetta', g => {
    casa(g, { w: 1.6, d: 1.2, h: 0.95, muro: 0xf6e8d0, tettoCol: 0x4a6a8a, z0: -0.1 })
    scatola(g, 0.3, 0.3, 0.24, mat(LEGNO), 0.55, 0.15, 0.7); fiore(g, 0.5, 0.7, 0.3, 0xf29ab6); fiore(g, 0.6, 0.72, 0.28, 0xfff4d8)
    return { altezza: 2.0 }
  }),
  casa: decoro('casa', g => {
    const alt = casa(g, { w: 3.5, d: 2.2, h: 1.45, z0: -0.2, finestre: 2 })
    scatola(g, 0.7, 0.04, 0.55, mat(0xb08a5a), 0, 0.02, 1.2)
    for (const x of [-1.1, 1.1]) { cesto(g, 0.09, 0.1, x, 1.0); palla(g, 0.07, 0xf29ab6, x, 0.2, 1.0, 1, 0.8, 1, 0) }
    return { altezza: 1.5 + alt + 0.8 }
  }),
  casetta_lunga: decoro('casetta_lunga', g => {
    casa(g, { w: 2.8, d: 1.5, h: 1.0, muro: 0xf6efe0, tettoCol: 0x4a6a8a, z0: -0.1, finestre: 2, camino: false })
    for (const x of [-1.0, 1.0]) finestra(g, x, 0.62, 0.65, 0.34, 0.36)
    scatola(g, 0.3, 0.7, 0.3, mat(0x8a5a44), 0.9, 1.9, -0.4)
    return { altezza: 2.2 }
  }),
  casa_veranda: decoro('casa_veranda', g => {
    casa(g, { w: 3.2, d: 1.7, h: 1.3, muro: 0xe8efe2, tettoCol: 0x7a5a8a, z0: -0.6, finestre: 2, camino: true })
    const legno = mat(0xf4efe4)
    scatola(g, 3.0, 0.1, 1.0, mat(0xb08a5a), 0, 0.1, 0.9)
    for (const x of [-1.4, -0.5, 0.5, 1.4]) scatola(g, 0.1, 1.15, 0.1, legno, x, 0.72, 1.35)
    const tt = scatola(g, 3.2, 0.08, 1.3, mat(0x7a5a8a), 0, 1.4, 0.95); tt.rotation.x = 0.18
    scatola(g, 3.0, 0.07, 0.06, legno, 0, 0.5, 1.35); for (const x of [-1.2, -0.8, 0.8, 1.2]) scatola(g, 0.04, 0.4, 0.04, legno, x, 0.3, 1.35)
    cilindro(g, 0.12, 0.1, 0.12, mat(MATTONE), 1.1, 0.22, 0.85, 8); palla(g, 0.1, 0xd8352a, 1.1, 0.34, 0.85, 1, 0.8, 1, 0)
    scatola(g, 0.5, 0.05, 0.4, mat(LEGNO), -1.0, 0.4, 0.85); scatola(g, 0.5, 0.35, 0.05, mat(LEGNO), -1.0, 0.6, 0.67)
    return { altezza: 2.6 }
  }),
  casa_albero: decoro('casa_albero', (g, rnd) => {
    cilindro(g, 0.28, 0.4, 2.0, mat(0x6a4528), 0, 1.0, -0.3, 8)
    for (const [x, y, z, r, c] of [[0, 3.0, -0.3, 0.95, 0x3f8a3a], [0.7, 2.7, 0.0, 0.6, 0x4f9a45], [-0.75, 2.75, -0.5, 0.6, 0x4a9a42], [0.1, 3.5, -0.2, 0.55, 0x5aa84c]]) palla(g, r, c, x, y, z, 1, 0.85, 1, 1)
    scatola(g, 1.9, 0.1, 1.5, mat(LEGNO), 0, 1.65, 0.1)
    scatola(g, 1.2, 0.7, 1.0, mat(0xc79a5e), 0, 2.05, 0); tetto(g, 1.5, 1.4, 2.4, 0x9a3f2a, 0.6)
    scatola(g, 0.35, 0.5, 0.05, mat(LEGNO_SCURO), -0.15, 2.0, 0.62)
    scatola(g, 0.35, 0.28, 0.04, mat(VETRO), 0.4, 2.15, 0.62)
    for (const x of [-0.8, 0.8]) for (const z of [-0.5, 0.65]) scatola(g, 0.05, 0.3, 0.05, mat(LEGNO), x, 1.85, z)
    for (let i = 0; i < 6; i++) scatola(g, 0.5, 0.05, 0.06, mat(LEGNO), 0.3 + 0.03 * i, 0.18 + i * 0.26, 1.25 - i * 0.07).rotation.z = 0
    for (const x of [0.08, 0.52]) { const l = scatola(g, 0.05, 1.7, 0.05, mat(LEGNO_SCURO), x + 0.1, 0.9, 1.1); l.rotation.x = -0.18 }
    return { altezza: 4.2 }
  }),
  fienile_rosso: decoro('fienile_rosso', g => { fienile(g, { w: 3.4, d: 2.5, h: 1.8, muro: 0xb83a2e, tettoCol: 0x5a4a44 }); return { altezza: 3.4 } }),
  fienile_blu: decoro('fienile_blu', g => { fienile(g, { w: 2.5, d: 2.3, h: 1.5, muro: 0xe8dcc0, tettoCol: 0x2f5fa8, croce: 0x2f5fa8 }); return { altezza: 3.0 } }),
  torretta: decoro('torretta', g => {
    const p = mat(PIETRA)
    cilindro(g, 0.78, 0.86, 2.7, p, 0, 1.35, 0, 12)
    for (let i = 0; i < 4; i++) cilindro(g, 0.81 + (i % 2 ? 0 : 0.01), 0.81, 0.04, mat(0x9d968a), 0, 0.6 + i * 0.6, 0, 12)
    cilindro(g, 0.95, 0.95, 0.12, mat(0x9d9689), 0, 2.76, 0, 12)
    cono(g, 1.05, 1.3, mat(0xb4455f), 0, 3.48, 0, 12)
    palla(g, 0.07, 0xf0c52a, 0, 4.2, 0, 1, 1, 1, 0)
    scatola(g, 0.42, 0.7, 0.1, mat(LEGNO), 0, 0.4, 0.82)
    for (const y of [1.4, 2.2]) scatola(g, 0.12, 0.36, 0.06, mat(0x2a3a44), 0.0, y, 0.78)
    return { altezza: 4.3 }
  }),
  forno: decoro('forno', g => {
    scatola(g, 1.5, 1.0, 1.2, mat(0xa59d8f), 0, 0.5, -0.1); scatola(g, 1.6, 0.1, 1.3, mat(0x8f8a7e), 0, 1.05, -0.1)
    scatola(g, 0.5, 0.8, 0.5, mat(0x8a5a44), 0.45, 1.45, -0.3); scatola(g, 0.6, 0.06, 0.6, mat(0x6e4a3a), 0.45, 1.88, -0.3)
    scatola(g, 0.62, 0.55, 0.08, mat(0x2a1a14), -0.1, 0.5, 0.55); scatola(g, 0.5, 0.4, 0.06, mat(0xff7a2a, { emissive: 0xff5a10, emissiveIntensity: 1.1 }), -0.1, 0.45, 0.6)
    cilindro(g, 0.31, 0.31, 0.08, mat(0xa59d8f), -0.1, 0.78, 0.55, 8)
    for (let i = 0; i < 5; i++) cilindro(g, 0.07, 0.07, 0.45, mat(LEGNO_SCURO), -0.75 + (i % 3) * 0.16 + (i > 2 ? 0.08 : 0), 0.08 + (i > 2 ? 0.12 : 0), 0.7, 6).rotation.x = Math.PI / 2
    return { altezza: 2.0 }
  }),
  forno_pizza: decoro('forno_pizza', g => {
    scatola(g, 1.5, 0.55, 1.3, mat(0xb9b2a4), 0, 0.28, 0)
    const c = pronto(new THREE.Mesh(new THREE.SphereGeometry(0.72, 14, 9, 0, Math.PI * 2, 0, Math.PI / 2), mat(0xc4604a))); c.position.set(0, 0.55, 0); g.add(c)
    cilindro(g, 0.14, 0.17, 0.5, mat(0x8a5a44), 0.3, 1.3, -0.2, 8)
    scatola(g, 0.5, 0.36, 0.1, mat(0x2a1a14), 0, 0.75, 0.62); scatola(g, 0.4, 0.28, 0.06, mat(0xff7a2a, { emissive: 0xff5a10, emissiveIntensity: 1.1 }), 0, 0.72, 0.68)
    const pala = scatola(g, 0.07, 1.0, 0.03, mat(LEGNO), 0.62, 0.6, 0.78); pala.rotation.z = 0.35; cilindro(g, 0.17, 0.17, 0.03, mat(0x8a8f99), 0.88, 1.1, 0.78, 8)
    for (let i = 0; i < 5; i++) cilindro(g, 0.07, 0.07, 0.4, mat(LEGNO_SCURO), -0.55 + (i % 3) * 0.14, 0.1 + Math.floor(i / 3) * 0.14, 0.82, 6).rotation.z = Math.PI / 2
    return { altezza: 1.9 }
  }),
  chiosco_rosa: decoro('chiosco_rosa', g => { chiosco(g, 0xf4a6c0, 0xe4709a, false); return { altezza: 2.2 } }),
  chiosco_azzurro: decoro('chiosco_azzurro', g => { chiosco(g, 0x8fc6e8, 0x3a8ac0, true); return { altezza: 2.3 } }),
  casotta: decoro('casotta', g => {
    for (const [x, z] of [[-0.45, -0.3], [0.45, -0.3], [-0.45, 0.3], [0.45, 0.3]]) scatola(g, 0.08, 0.4, 0.08, mat(LEGNO_SCURO), x, 0.2, z)
    scatola(g, 1.15, 0.7, 0.85, mat(0xd9a066), 0, 0.75, 0)
    tetto(g, 1.4, 1.2, 1.1, 0xc4553a, 0.55)
    scatola(g, 0.3, 0.38, 0.05, mat(0x3a2a22), 0, 0.68, 0.45)
    const r = scatola(g, 0.35, 0.04, 0.8, mat(LEGNO), 0, 0.28, 0.85); r.rotation.x = -0.6
    for (let i = 0; i < 3; i++) scatola(g, 0.33, 0.03, 0.04, mat(LEGNO_SCURO), 0, 0.2 + i * 0.1, 0.68 + i * 0.17)
    for (const [x, z] of [[0.7, 0.55], [-0.75, 0.7]]) palla(g, 0.1, 0xf6efe0, x, 0.09, z, 1.3, 0.9, 1, 0)
    return { altezza: 1.8 }
  }),
  serra: decoro('serra', (g, rnd) => {
    const bianco = mat(0xf4efe4)
    scatola(g, 3.6, 0.3, 2.5, mat(0xb4553a), 0, 0.15, 0)
    for (const x of [-1.8, -0.6, 0.6, 1.8]) for (const z of [-1.25, 1.25]) scatola(g, 0.07, 1.45, 0.07, bianco, x, 1.0, z)
    for (const z of [-1.25, 1.25]) { scatola(g, 3.65, 0.06, 0.07, bianco, 0, 1.72, z); scatola(g, 3.65, 0.05, 0.05, bianco, 0, 0.5, z) }
    for (const x of [-1.8, 1.8]) { scatola(g, 0.06, 0.06, 2.5, bianco, x, 1.72, 0); scatola(g, 0.05, 0.05, 2.5, bianco, x, 0.5, 0) }
    scatola(g, 3.65, 0.07, 0.07, bianco, 0, 2.05, 0)
    for (const s of [-1, 1]) { const f = scatola(g, 3.65, 0.05, 0.05, bianco, 0, 1.9, s * 0.62); f.rotation.x = -s * 0.4 }
    const vetro = new THREE.MeshStandardMaterial({ color: 0xcfeaf2, transparent: true, opacity: 0.32, roughness: 0.2, depthWrite: false })
    for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.03, 1.35), vetro); p.position.set(0, 1.88, s * 0.62); p.rotation.x = -s * 0.4; g.add(p) }
    for (const z of [-0.7, 0.7]) for (let i = 0; i < 5; i++) { const x = -1.4 + i * 0.7; palla(g, 0.2, i % 2 ? 0x4f9a45 : 0x5aa84c, x, 0.5, z, 1, 1.1, 1, 1); if (i % 2) palla(g, 0.06, 0xd8352a, x + 0.1, 0.6, z + 0.15, 1, 1, 1, 0) }
    scatola(g, 0.9, 0.2, 0.08, mat(0xe9d6a8), 0, 0.5, 1.23)
    return { altezza: 2.2 }
  }),
  tettoia_fieno: decoro('tettoia_fieno', g => {
    for (const x of [-1.2, 1.2]) for (const z of [-0.7, 0.7]) scatola(g, 0.12, 1.7, 0.12, mat(LEGNO_SCURO), x, 0.85, z)
    const t = scatola(g, 3.0, 0.1, 1.9, mat(0xa86a3a), 0, 1.78, 0); t.rotation.x = 0.12
    for (let i = 0; i < 6; i++) scatola(g, 0.04, 0.05, 1.9, mat(0x8a4a2a), -1.35 + i * 0.54, 1.84, 0).rotation.x = 0.12
    for (const [x, z, s] of [[-0.6, -0.2, 1], [0.1, -0.3, 0.9], [0.65, -0.05, 1.1], [-0.2, 0.2, 0.8]]) {
      cono(g, 0.6 * s, 0.9 * s, mat(0xe6c36a), x, 0.45 * s, z, 7)
      for (let k = 0; k < 4; k++) cono(g, 0.04, 0.25, mat(0xc9a24a), x + (k - 1.5) * 0.18, 0.1, z + 0.4 * s, 4).rotation.x = 1.2
    }
    return { altezza: 2.0 }
  }),
  capanno: decoro('capanno', g => {
    const assi = mat(0xb08050)
    scatola(g, 2.2, 1.35, 1.3, assi, 0, 0.68, -0.1)
    for (let i = 0; i < 9; i++) scatola(g, 0.02, 1.35, 1.32, mat(0x8a5e38), -1.0 + i * 0.25, 0.68, -0.1)
    const t = scatola(g, 2.5, 0.1, 1.7, mat(0x5a4a44), 0, 1.5, -0.1); t.rotation.x = 0.16
    scatola(g, 0.7, 1.0, 0.07, mat(LEGNO_SCURO), 0.3, 0.55, 0.58); scatola(g, 0.08, 0.1, 0.1, mat(0xf0c040), 0.55, 0.55, 0.64)
    finestra(g, -0.65, 0.85, 0.57, 0.4, 0.4)
    const manico = scatola(g, 0.05, 1.2, 0.05, mat(LEGNO), -1.3, 0.6, 0.45); manico.rotation.z = 0.2; scatola(g, 0.3, 0.07, 0.05, mat(0x8a8f99), -1.18, 1.1, 0.45)
    cilindro(g, 0.2, 0.17, 0.3, mat(0x8a8f99, { metalness: 0.3 }), -0.95, 0.15, 0.7, 10)
    return { altezza: 1.8 }
  }),

  lampione: decoro('lampione', g => {
    const f = mat(0x33343c)
    cilindro(g, 0.1, 0.13, 0.12, f, 0, 0.06, 0, 8); cilindro(g, 0.035, 0.05, 1.7, f, 0, 0.95, 0, 6); cilindro(g, 0.07, 0.05, 0.1, f, 0, 1.75, 0, 6)
    lampada(g, 2.0)
    return { altezza: 2.4 }
  }),
  lampione_cesto: decoro('lampione_cesto', (g, rnd) => {
    const f = mat(0x33343c)
    cilindro(g, 0.1, 0.13, 0.12, f, 0, 0.06, 0, 8); cilindro(g, 0.035, 0.05, 1.7, f, 0, 0.95, 0, 6)
    lampada(g, 2.0)
    scatola(g, 0.5, 0.04, 0.04, f, 0.25, 1.5, 0)
    cilindro(g, 0.19, 0.13, 0.17, mat(0xb98a4a), 0.5, 1.4, 0, 10)       // il cesto appeso al braccio
    for (const z of [-0.15, 0.15]) cilindro(g, 0.006, 0.006, 0.1, f, 0.5, 1.5, z, 3)
    for (const [x, z, col] of [[0.5, 0.0, 0xf29ab6], [0.58, 0.07, 0xd8352a], [0.42, -0.06, 0xfff4d8], [0.5, 0.1, 0xf0c52a]]) palla(g, 0.075, col, x, 1.52, z, 1, 0.8, 1, 0)
    palla(g, 0.12, 0x4f9a45, 0.5, 1.5, 0, 1.2, 0.5, 1.2, 0)
    return { altezza: 2.4 }
  }),
  lanterna: decoro('lanterna', g => {
    const f = mat(0x33343c)
    cilindro(g, 0.09, 0.12, 0.1, f, 0, 0.05, 0, 8); cilindro(g, 0.04, 0.05, 1.25, f, 0, 0.7, 0, 6)
    scatola(g, 0.4, 0.04, 0.04, f, 0.15, 1.3, 0)
    const l = new THREE.Group(); l.position.set(0.3, 1.1, 0); g.add(l)
    cilindro(l, 0.006, 0.006, 0.12, f, 0, 0.13, 0, 3)
    lampada(l, 0, 0.8)
    return { altezza: 1.6 }
  }),
}
