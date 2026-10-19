// I modelli degli oggetti di scena delle città (barili, casse, carretti, bancarelle, rastrelliere, lanterne, tende…): ognuno si
// posa nel cantiere del pezzo (kit.js), già in piedi sul suo punto, col davanti verso +z locale e la larghezza lungo x. Poche facce
// a oggetto (sono tanti): cilindri a 6–8 lati, scatole, qualche ottaedro; il colore sta nei vertici, i materiali sono quelli del kit
// (la nebbia li legge dall'attributo della base). Dove stanno lo decide props-citta.js. docs/sotterraneo/mondo-3d.md, «Gli oggetti
// delle città».
import { OctahedronGeometry, ConeGeometry, TorusGeometry, DodecahedronGeometry, CircleGeometry } from 'three'
import { scatola, cilindro, triangolo, COLORI } from './kit.js'

const L = COLORI.legno, LS = COLORI.legnoScuro, FERRO = COLORI.ferro
const PANNI = [[0.84, 0.25, 0.22], [0.26, 0.52, 0.82], [0.93, 0.72, 0.22], [0.32, 0.67, 0.42], [0.74, 0.36, 0.72], [0.96, 0.52, 0.22]]
const FIORI = [[0.95, 0.3, 0.4], [0.98, 0.82, 0.25], [0.7, 0.45, 0.95], [0.98, 0.98, 0.9], [0.35, 0.6, 0.98]]
const scegli = (r, l) => l[Math.floor(r() * l.length)]
const PI = Math.PI

// un sacco in piedi, col collo legato
function sacco(c, x, y, z, col, ry = 0) {
  c.metti('liscio', cilindro(0.1, 0.15, 0.34, 7), x, y + 0.17, z, col, { ry })
  c.metti('liscio', cilindro(0.045, 0.07, 0.07, 6), x, y + 0.37, z, [col[0] * 0.8, col[1] * 0.8, col[2] * 0.8], { ry })
}
function cassa(c, x, y, z, s, ry = 0, col = L) {
  c.metti('legno', scatola(s, s, s, 1), x, y + s / 2, z, col, { ry })
  c.metti('legno', scatola(s + 0.03, 0.05, s + 0.03, 1), x, y + s - 0.02, z, LS, { ry })
  c.metti('legno', scatola(s * 1.18, 0.045, 0.02, 1), x, y + s / 2, z + Math.cos(ry) * (s / 2 + 0.01), LS, { ry, rz: 0.75 })
}
function botteInPiedi(c, x, z, r, y = 0) {
  c.metti('legno', cilindro(0.19, 0.19, 0.5, 8, 1), x, y + 0.25, z, scegli(r, [L, [0.62, 0.46, 0.32]]))
  for (const h of [0.12, 0.38]) c.metti('liscio', cilindro(0.205, 0.205, 0.04, 8, 1, true), x, y + h, z, FERRO)
  c.metti('legno', cilindro(0.17, 0.17, 0.02, 8), x, y + 0.51, z, [0.58, 0.44, 0.3])
}
// un tronco disteso lungo x, con le teste chiare ai due capi (così la catasta si legge per legna e non per assi)
function tronco(c, y, z, col) {
  c.metti('legno', cilindro(0.09, 0.09, 0.8, 6), 0, y, z, col, { rz: PI / 2 })
  for (const s of [-1, 1]) c.metti('legno', new CircleGeometry(0.08, 6), s * 0.402, y, z, [0.86, 0.72, 0.52], { ry: s * PI / 2 })
}
function fiore(c, x, y, z, r) {
  c.metti('liscio', cilindro(0.01, 0.01, 0.16, 4), x, y + 0.08, z, [0.3, 0.55, 0.28])
  c.metti('liscio', new OctahedronGeometry(0.05), x, y + 0.18, z, scegli(r, FIORI))
}
function ciuffo(c, x, y, z) { c.metti('liscio', new ConeGeometry(0.1, 0.2, 5), x, y + 0.1, z, [0.34, 0.6, 0.28]) }

export const MODELLI = {
  barile: (c, r) => botteInPiedi(c, 0, 0, r),
  botti: (c, r) => {
    botteInPiedi(c, -0.28, 0.0, r); botteInPiedi(c, 0.26, 0.05, r)
    c.metti('legno', cilindro(0.19, 0.19, 0.5, 8, 1), 0, 0.64, 0.02, L, { rz: PI / 2 })
    for (const h of [-0.15, 0.15]) c.metti('liscio', cilindro(0.205, 0.205, 0.04, 8), h, 0.64, 0.02, FERRO, { rz: PI / 2 })
  },
  sacchi: (c, r) => {
    const col = () => scegli(r, [[0.86, 0.78, 0.6], [0.78, 0.7, 0.52], [0.9, 0.84, 0.7]])
    sacco(c, -0.2, 0, 0, col(), r() * 3); sacco(c, 0.2, 0, 0.02, col(), r() * 3); sacco(c, 0, 0, 0.26, col(), r() * 3); sacco(c, 0, 0.3, 0.1, col(), r() * 3)
  },
  casse: (c, r) => {
    cassa(c, -0.24, 0, 0, 0.42, r() * 0.3 - 0.15); cassa(c, 0.24, 0, 0.04, 0.4, r() * 0.3 - 0.15, [0.66, 0.5, 0.36]); cassa(c, 0, 0.4, 0.02, 0.36, r() * 0.5 - 0.25)
  },
  // il carretto col fieno: sta di fianco al muro (due celle), le stanghe verso il lato
  carretto: (c, r) => {
    c.metti('legno', scatola(1.35, 0.08, 0.7, 1), 0, 0.38, 0, L)
    for (const s of [-1, 1]) c.metti('legno', scatola(1.35, 0.22, 0.05, 1), 0, 0.5, s * 0.34, LS)
    c.metti('legno', scatola(0.05, 0.22, 0.7, 1), -0.65, 0.5, 0, LS)
    c.metti('paglia', cilindro(0.33, 0.33, 1.25, 8), 0.02, 0.66, 0, [0.92, 0.8, 0.46], { rz: PI / 2 })
    c.metti('paglia', cilindro(0.2, 0.2, 0.5, 7), 0.3, 0.88, 0.02, [0.88, 0.76, 0.42], { rz: PI / 2 })
    for (const s of [-1, 1]) {
      c.metti('legno', new TorusGeometry(0.3, 0.035, 4, 10), -0.05, 0.3, s * 0.42, LS)
      c.metti('legno', cilindro(0.055, 0.055, 0.06, 6), -0.05, 0.3, s * 0.42, L, { rx: PI / 2 })
      for (const a of [0, PI / 4, PI / 2, PI * 3 / 4]) c.metti('legno', scatola(0.58, 0.035, 0.03, 1), -0.05, 0.3, s * 0.42, L, { rz: a })
      c.metti('legno', cilindro(0.025, 0.03, 0.6, 5), 0.95, 0.26, s * 0.25, LS, { rz: -PI / 2 - 0.18 })
    }
    c.metti('legno', cilindro(0.02, 0.02, 0.6, 5), 0.2, 0.95, 0.2, FERRO, { rx: 0.3, rz: 0.15 })
  },
  balle: (c, r) => {
    for (const [x, y, z] of [[-0.28, 0, 0], [0.28, 0, 0], [0, 0.34, 0.02]]) {
      c.metti('paglia', scatola(0.52, 0.34, 0.4, 1), x, y + 0.17, z, [0.92, 0.8, 0.48], { ry: (r() - 0.5) * 0.2 })
      for (const s of [-1, 1]) c.metti('legno', scatola(0.025, 0.36, 0.42, 1), x + s * 0.13, y + 0.17, z, LS)
    }
  },
  legna: (c, r) => {
    const righe = [4, 3, 2]
    righe.forEach((n, row) => { for (let i = 0; i < n; i++) { tronco(c, 0.09 + row * 0.16, (i - (n - 1) / 2) * 0.19, scegli(r, [[0.6, 0.44, 0.3], [0.52, 0.38, 0.26], [0.68, 0.52, 0.36]])) } })
  },
  // la catasta grande del rifugio: più alta, con il ceppo e l'ascia
  catasta: (c, r) => {
    const righe = [5, 4, 3, 2]
    righe.forEach((n, row) => { for (let i = 0; i < n; i++) tronco(c, 0.09 + row * 0.165, (i - (n - 1) / 2) * 0.17, scegli(r, [[0.6, 0.44, 0.3], [0.5, 0.36, 0.25], [0.7, 0.54, 0.38]])) })
    for (const [x, z] of [[-0.72, 0.1], [0.72, -0.05]]) c.metti('legno', cilindro(0.15, 0.17, 0.3, 7), x, 0.15, z, [0.66, 0.5, 0.36])
  },
  ceppo: (c) => {
    c.metti('legno', cilindro(0.17, 0.2, 0.34, 8), 0, 0.17, 0, [0.66, 0.5, 0.36])
    c.metti('legno', cilindro(0.015, 0.015, 0.5, 4), 0.02, 0.5, 0, LS, { rx: 0.2, rz: -0.25 })
    c.metti('liscio', scatola(0.14, 0.1, 0.03), -0.05, 0.7, 0.05, [0.7, 0.72, 0.76], { rx: 0.2, rz: -0.25 })
    c.metti('legno', cilindro(0.1, 0.1, 0.5, 6), 0.4, 0.1, 0.3, [0.62, 0.46, 0.32], { rz: PI / 2 })
  },
  panca: (c) => {
    c.metti('legno', scatola(0.95, 0.05, 0.26, 1), 0, 0.32, 0, L)
    for (const s of [-1, 1]) c.metti('legno', scatola(0.06, 0.3, 0.22, 1), s * 0.38, 0.15, 0, LS)
  },
  tavolo: (c, r) => {
    c.metti('legno', scatola(0.95, 0.06, 0.5, 1), 0, 0.5, 0, [0.68, 0.52, 0.36])
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) c.metti('legno', scatola(0.06, 0.48, 0.06, 1), sx * 0.4, 0.24, sz * 0.2, LS)
    for (const s of [-1, 1]) {
      c.metti('legno', scatola(0.9, 0.04, 0.17, 1), 0, 0.28, s * 0.36, L)
      for (const t of [-1, 1]) c.metti('legno', scatola(0.05, 0.26, 0.05, 1), t * 0.38, 0.13, s * 0.36, LS)
    }
    c.metti('liscio', cilindro(0.05, 0.04, 0.08, 6), -0.2, 0.57, 0.02, scegli(r, PANNI))
    c.metti('liscio', cilindro(0.09, 0.06, 0.04, 8), 0.18, 0.55, -0.05, [0.85, 0.82, 0.75])
  },
  // la bancarella piccola della piazza, con la tendina a righe colorata: due celle di larghezza
  bancarella: (c, r) => {
    const tela = scegli(r, PANNI)
    for (const [sx, sz, h] of [[-1, 1, 1.5], [1, 1, 1.5], [-1, -1, 1.8], [1, -1, 1.8]]) c.metti('legno', scatola(0.08, h, 0.08, 1), sx * 0.85, h / 2, sz * 0.38, LS)
    c.metti('legno', scatola(1.6, 0.7, 0.36, 1), 0, 0.35, 0.22, L)
    c.metti('legno', scatola(1.7, 0.05, 0.46, 1), 0, 0.72, 0.22, [0.62, 0.46, 0.32])
    c.metti('stoffa', scatola(1.95, 0.04, 1.0, 1.2), 0, 1.68, 0, tela, { rx: Math.atan2(0.3, 0.8) })
    c.metti('stoffa', scatola(1.95, 0.22, 0.03, 1.2), 0, 1.5, 0.5, tela)
    const merce = r()
    for (let i = 0; i < 6; i++) {
      const x = -0.65 + i * 0.26
      if (merce < 0.5) c.metti('liscio', new OctahedronGeometry(0.075), x, 0.82, 0.22 + (r() - 0.5) * 0.15, scegli(r, [[0.9, 0.2, 0.25], [0.95, 0.75, 0.2], [0.4, 0.75, 0.3]]))
      else c.metti('liscio', cilindro(0.06, 0.07, 0.12 + r() * 0.08, 7), x, 0.84, 0.22, scegli(r, PANNI))
    }
    cassa(c, -0.6, 0, -0.18, 0.34); sacco(c, 0.6, 0, -0.2, [0.86, 0.78, 0.6])
  },
  // lo scaffale a muro (erbe, barattoli): tre ripiani
  scaffale: (c, r) => {
    for (const s of [-1, 1]) c.metti('legno', scatola(0.07, 1.5, 0.3, 1), s * 0.62, 0.75, 0, LS)
    for (const h of [0.35, 0.8, 1.25]) {
      c.metti('legno', scatola(1.3, 0.05, 0.3, 1), 0, h, 0, L)
      for (let i = 0; i < 4; i++) {
        if (r() < 0.5) c.metti('liscio', cilindro(0.06, 0.065, 0.16 + r() * 0.06, 7), -0.45 + i * 0.3, h + 0.11, 0.02, scegli(r, [[0.3, 0.62, 0.86], [0.86, 0.34, 0.3], [0.42, 0.8, 0.46], [0.92, 0.78, 0.32]]))
        else c.metti('liscio', new ConeGeometry(0.08, 0.22, 6), -0.45 + i * 0.3, h + 0.14, 0.02, [0.34 + r() * 0.2, 0.6, 0.3])
      }
    }
    c.metti('legno', scatola(1.4, 0.06, 0.38, 1), 0, 1.55, 0.04, [0.6, 0.44, 0.3])
  },
  // la rastrelliera d'armi: spade, lance e scudi appoggiati a due montanti
  rastrelliera: (c, r) => {
    for (const s of [-1, 1]) c.metti('legno', scatola(0.08, 1.25, 0.08, 1), s * 0.8, 0.62, 0, LS)
    for (const h of [0.42, 0.95]) c.metti('legno', scatola(1.7, 0.07, 0.07, 1), 0, h, 0.02, L)
    for (let i = 0; i < 3; i++) {
      const x = -0.55 + i * 0.28
      c.metti('legno', cilindro(0.015, 0.015, 1.6, 4), x, 0.78, -0.08, LS, { rz: (i - 1) * 0.07 })
      c.metti('liscio', new ConeGeometry(0.035, 0.14, 4), x + (i - 1) * 0.113, 1.64, -0.08, [0.78, 0.8, 0.85], { rz: (i - 1) * 0.07 })
    }
    for (let i = 0; i < 3; i++) {
      const x = 0.05 + i * 0.22
      c.metti('liscio', scatola(0.05, 0.72, 0.014), x, 0.88, 0.05, [0.78, 0.8, 0.86])
      c.metti('legno', scatola(0.2, 0.035, 0.04), x, 0.51, 0.05, LS)
      c.metti('legno', scatola(0.04, 0.12, 0.04), x, 0.44, 0.05, LS)
    }
    for (const [x, col] of [[-0.55, [0.8, 0.22, 0.2]], [0.62, [0.24, 0.42, 0.78]]]) {
      c.metti('legno', cilindro(0.21, 0.21, 0.04, 10), x, 0.26, 0.2, col, { rx: PI / 2 - 0.25 })
      c.metti('liscio', cilindro(0.06, 0.06, 0.05, 6), x, 0.27, 0.23, [0.85, 0.85, 0.8], { rx: PI / 2 - 0.25 })
    }
  },
  // il manichino da allenamento del forte: palo, traversa, corpo di paglia e uno scudo
  manichino: (c) => {
    c.metti('legno', cilindro(0.05, 0.07, 1.5, 6), 0, 0.75, 0, LS)
    c.metti('legno', scatola(0.8, 0.07, 0.07, 1), 0, 1.15, 0, L)
    c.metti('paglia', cilindro(0.17, 0.2, 0.55, 7), 0, 1.0, 0, [0.9, 0.78, 0.48])
    c.metti('paglia', cilindro(0.12, 0.12, 0.2, 7), 0, 1.45, 0, [0.9, 0.78, 0.48])
    c.metti('legno', cilindro(0.19, 0.19, 0.04, 10), 0.22, 0.95, 0.18, [0.7, 0.2, 0.18], { rx: PI / 2 })
    c.metti('legno', cilindro(0.015, 0.015, 0.7, 4), -0.35, 0.75, 0.15, LS, { rz: 0.2 })
  },
  lanterna: (c) => {
    c.metti('legno', scatola(0.07, 1.7, 0.07, 1), 0, 0.85, 0, LS)
    c.metti('legno', scatola(0.34, 0.05, 0.05, 1), 0.15, 1.62, 0, LS)
    c.metti('liscio', scatola(0.2, 0.03, 0.2), 0.3, 1.36, 0, FERRO)
    c.metti('luce', scatola(0.15, 0.2, 0.15), 0.3, 1.48, 0, [1, 0.84, 0.48])
    c.metti('liscio', new ConeGeometry(0.15, 0.12, 4), 0.3, 1.64, 0, FERRO, { ry: PI / 4 })
  },
  // il palo con la fiaccola: le fiamme le fa vita.js (cose.fuochi), qui il palo e la coppa di ferro
  torcia: (c, r, o, cose) => {
    c.metti('legno', cilindro(0.045, 0.06, 1.6, 6), 0, 0.8, 0, LS)
    c.metti('liscio', cilindro(0.13, 0.07, 0.15, 8), 0, 1.65, 0, FERRO)
    c.metti('luce', cilindro(0.1, 0.1, 0.02, 8), 0, 1.72, 0, [1, 0.55, 0.15])
    for (const s of [-1, 0, 1]) c.metti('legno', scatola(0.04, 0.12, 0.04), s * 0.05, 0.06, 0.06, LS, { rz: s * 0.5 })
    if (o.fuoco) cose.fuochi.push(c.dove(0, 1.78, 0))
  },
  braciere: (c, r, o, cose) => {
    c.metti('liscio', cilindro(0.3, 0.16, 0.2, 8), 0, 0.58, 0, FERRO)
    c.metti('luce', cilindro(0.27, 0.27, 0.02, 8), 0, 0.69, 0, [1, 0.5, 0.14])
    for (let i = 0; i < 3; i++) { const a = i * PI * 2 / 3; c.metti('liscio', scatola(0.04, 0.5, 0.04), Math.cos(a) * 0.14, 0.27, Math.sin(a) * 0.14, FERRO, { rz: Math.cos(a) * 0.25, rx: -Math.sin(a) * 0.25 }) }
    for (let i = 0; i < 2; i++) c.metti('legno', cilindro(0.04, 0.04, 0.3, 5), 0, 0.71, 0, [0.62, 0.34, 0.14], { rz: PI / 2, ry: i * PI / 2 + 0.4 })
    if (o.fuoco) cose.fuochi.push(c.dove(0, 0.76, 0))
  },
  // il fiore in cassetta (di fianco ai muri) e il vaso
  fiori: (c, r) => {
    c.metti('legno', scatola(0.9, 0.2, 0.24, 1), 0, 0.1, 0, [0.66, 0.5, 0.36])
    c.metti('legno', scatola(0.93, 0.04, 0.27, 1), 0, 0.2, 0, LS)
    for (let i = 0; i < 6; i++) { ciuffo(c, -0.38 + i * 0.15, 0.2, (r() - 0.5) * 0.1); fiore(c, -0.38 + i * 0.15 + (r() - 0.5) * 0.05, 0.2, (r() - 0.5) * 0.1, r) }
  },
  vaso: (c, r) => {
    for (const [x, z, s] of [[-0.2, 0, 1], [0.2, 0.05, 0.8]]) {
      c.metti('liscio', cilindro(0.11 * s, 0.07 * s, 0.2 * s, 7), x, 0.1 * s, z, [0.8, 0.44, 0.3])
      c.metti('liscio', cilindro(0.115 * s, 0.115 * s, 0.03, 7), x, 0.21 * s, z, [0.74, 0.38, 0.26])
      ciuffo(c, x, 0.2 * s, z)
      for (let i = 0; i < 3; i++) fiore(c, x + (r() - 0.5) * 0.12, 0.2 * s, z + (r() - 0.5) * 0.1, r)
    }
  },
  // l'orto: l'aiuola con tre file e uno steccato basso su tre lati
  orto: (c, r) => {
    c.metti('liscio', scatola(1.7, 0.1, 0.78), 0, 0.05, 0, [0.4, 0.28, 0.2])
    for (let f = 0; f < 3; f++) for (let i = 0; i < 4; i++) {
      const x = -0.62 + i * 0.41, z = -0.22 + f * 0.22
      if (f === 1) c.metti('liscio', new ConeGeometry(0.06, 0.2, 5), x, 0.2, z, [0.95, 0.55, 0.18], { rx: PI })
      else c.metti('liscio', new OctahedronGeometry(0.11), x, 0.18, z, [0.4 + r() * 0.15, 0.7, 0.33], { s: [1, 0.75, 1] })
    }
    for (const [x, z] of [[-0.9, -0.42], [0.9, -0.42], [-0.9, 0.42], [0.9, 0.42]]) c.metti('legno', scatola(0.06, 0.4, 0.06, 1), x, 0.2, z, LS)
    c.metti('legno', scatola(1.86, 0.04, 0.04, 1), 0, 0.34, -0.42, L)
    c.metti('legno', scatola(1.86, 0.04, 0.04, 1), 0, 0.2, -0.42, L)
    for (const s of [-1, 1]) { c.metti('legno', scatola(0.04, 0.04, 0.88, 1), s * 0.9, 0.34, 0, L); c.metti('legno', scatola(0.04, 0.04, 0.88, 1), s * 0.9, 0.2, 0, L) }
  },
  bucato: (c, r) => {
    for (const s of [-1, 1]) c.metti('legno', scatola(0.06, 1.55, 0.06, 1), s * 0.8, 0.77, 0, LS)
    c.metti('liscio', scatola(1.66, 0.014, 0.014), 0, 1.45, 0, [0.85, 0.8, 0.7])
    for (let i = 0; i < 4; i++) {
      const h = 0.4 + r() * 0.25
      c.metti('stoffa', scatola(0.3 + r() * 0.1, h, 0.015, 1), -0.55 + i * 0.37, 1.43 - h / 2, 0, scegli(r, PANNI), { rz: (r() - 0.5) * 0.08 })
    }
    c.metti('paglia', cilindro(0.17, 0.12, 0.2, 7), 0.15, 0.1, 0.32, [0.78, 0.62, 0.4])
  },
  // l'insegna di una bottega: palo, braccio, cartello appeso con il segno della merce davanti
  insegna: (c, r, o) => {
    c.metti('legno', scatola(0.08, 2.2, 0.08, 1), 0, 1.1, 0, LS)
    c.metti('legno', scatola(0.5, 0.05, 0.05, 1), 0.25, 2.05, 0, LS)
    c.metti('legno', scatola(0.56, 0.42, 0.04, 1), 0.28, 1.76, 0.02, [0.7, 0.54, 0.36])
    for (const s of [-1, 1]) c.metti('liscio', scatola(0.015, 0.1, 0.015), 0.28 + s * 0.2, 1.97, 0.02, FERRO)
    const x = 0.28, y = 1.76, z = 0.06
    if (o.bottega === 'fucina') {
      c.metti('liscio', new TorusGeometry(0.12, 0.03, 5, 10, PI * 1.5), x, y, z, [0.3, 0.3, 0.34], { rz: PI * 0.75 })
    } else if (o.bottega === 'erbe') {
      c.metti('liscio', new ConeGeometry(0.08, 0.3, 5), x - 0.07, y, z, [0.34, 0.72, 0.36], { rz: 0.5 })
      c.metti('liscio', new ConeGeometry(0.08, 0.3, 5), x + 0.07, y, z, [0.28, 0.62, 0.32], { rz: -0.5 })
    } else if (o.bottega === 'torretta') {
      c.metti('luce', new OctahedronGeometry(0.14), x, y, z, [0.62, 0.5, 1], { s: [1, 1.3, 0.35] })
    } else {
      c.metti('liscio', cilindro(0.13, 0.13, 0.03, 10), x, y, z, [0.96, 0.78, 0.22], { rx: PI / 2 })
      c.metti('liscio', cilindro(0.08, 0.08, 0.035, 10), x, y, z, [0.84, 0.64, 0.14], { rx: PI / 2 })
    }
  },
  // l'affilatoio del fabbro: la ruota di pietra fra due cavalletti, e il secchio d'acqua
  ruota: (c) => {
    for (const s of [-1, 1]) c.metti('legno', scatola(0.06, 0.6, 0.36, 1), s * 0.17, 0.3, 0, LS, { rz: -s * 0.0 })
    c.metti('pietra', cilindro(0.3, 0.3, 0.1, 12), 0, 0.5, 0, [0.7, 0.68, 0.64], { rz: PI / 2 })
    c.metti('liscio', cilindro(0.04, 0.04, 0.5, 5), 0, 0.5, 0, FERRO, { rz: PI / 2 })
    c.metti('liscio', scatola(0.03, 0.2, 0.03), 0.28, 0.5, 0, FERRO, { rz: 0.4 })
    c.metti('legno', cilindro(0.14, 0.11, 0.2, 8), 0.1, 0.1, 0.38, [0.55, 0.4, 0.28])
    c.metti('liscio', cilindro(0.115, 0.115, 0.01, 8), 0.1, 0.19, 0.38, [0.2, 0.34, 0.44])
  },
  incudine: (c) => {
    c.metti('legno', cilindro(0.2, 0.24, 0.42, 8), 0, 0.21, 0, [0.5, 0.36, 0.25])
    c.metti('liscio', scatola(0.5, 0.15, 0.2), 0, 0.5, 0, FERRO)
    c.metti('liscio', scatola(0.28, 0.1, 0.14), 0, 0.4, 0, FERRO)
    c.metti('liscio', new ConeGeometry(0.09, 0.28, 6), 0.38, 0.52, 0, FERRO, { rz: -PI / 2 })
    c.metti('legno', cilindro(0.015, 0.015, 0.34, 4), -0.12, 0.62, 0.18, LS, { rz: PI / 2 - 0.3 })
    c.metti('liscio', scatola(0.1, 0.08, 0.07), -0.28, 0.6, 0.18, FERRO)
  },
  carbone: (c, r) => {
    c.metti('legno', scatola(0.7, 0.28, 0.5, 1), 0, 0.14, 0, [0.52, 0.38, 0.26])
    for (let i = 0; i < 7; i++) c.metti('liscio', new DodecahedronGeometry(0.1), -0.22 + (i % 4) * 0.15, 0.3 + (i > 3 ? 0.08 : 0), (i > 3 ? 0.05 : -0.08), [0.16, 0.15, 0.16])
  },
  // il banco di pellicce del rifugio: due montanti, una stanga e tre pelli stese
  pellicce: (c, r) => {
    for (const s of [-1, 1]) c.metti('legno', scatola(0.08, 1.5, 0.08, 1), s * 0.8, 0.75, 0, LS)
    c.metti('legno', scatola(1.7, 0.07, 0.07, 1), 0, 1.4, 0, L)
    c.metti('legno', scatola(1.7, 0.06, 0.06, 1), 0, 0.5, 0, L)
    for (const [x, col, h] of [[-0.48, [0.52, 0.36, 0.24], 0.9], [0.0, [0.8, 0.77, 0.7], 0.8], [0.5, [0.36, 0.27, 0.2], 0.95]]) {
      c.metti('liscio', scatola(0.5, h, 0.03), x, 1.4 - h / 2, 0.02, col, { rz: (r() - 0.5) * 0.1 })
      c.metti('liscio', scatola(0.2, 0.2, 0.035), x + 0.18, 1.4 - h + 0.1, 0.02, col)
      c.metti('liscio', scatola(0.16, 0.22, 0.035), x - 0.2, 1.4 - h + 0.05, 0.02, col)
    }
  },
  slitta: (c, r) => {
    for (const s of [-1, 1]) {
      c.metti('legno', scatola(1.35, 0.05, 0.07, 1), 0, 0.08, s * 0.28, LS)
      c.metti('legno', scatola(0.25, 0.05, 0.07, 1), 0.75, 0.13, s * 0.28, LS, { rz: 0.5 })
      for (const x of [-0.45, 0.4]) c.metti('legno', scatola(0.05, 0.14, 0.05, 1), x, 0.16, s * 0.28, LS)
    }
    c.metti('legno', scatola(1.15, 0.05, 0.62, 1), 0, 0.22, 0, L)
    cassa(c, -0.3, 0.24, 0, 0.36, 0.15); sacco(c, 0.2, 0.24, -0.1, [0.82, 0.74, 0.58]); sacco(c, 0.28, 0.24, 0.14, [0.76, 0.68, 0.52], 1)
    c.metti('liscio', scatola(0.36, 0.05, 0.5), 0.0, 0.62, 0, [0.5, 0.36, 0.24], { rz: 0.1 })
  },
  // la tenda di tela del forte: un cono a otto spicchi (si legge da ogni lato), l'ingresso scuro, il palo col pennone (due celle per due)
  tenda: (c, r) => {
    const tela = scegli(r, [[0.78, 0.3, 0.26], [0.3, 0.46, 0.72], [0.82, 0.6, 0.26], [0.34, 0.58, 0.38]])
    const cono = new ConeGeometry(1.0, 1.5, 8, 1, true), uv = cono.attributes.uv
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 4, uv.getY(i) * 2)
    c.metti('stoffa', cono, 0, 0.75, 0, tela)
    c.metti('liscio', triangolo([-0.28, 0, 0.93], [0.28, 0, 0.93], [0, 0.85, 0.8]), 0, 0.02, 0, [0.12, 0.09, 0.07])
    c.metti('legno', cilindro(0.025, 0.025, 0.55, 5), 0, 1.72, 0, LS)
    c.metti('stoffa', scatola(0.36, 0.2, 0.015, 1), 0.2, 1.9, 0, scegli(r, PANNI))
    for (const a of [0.8, 2.4, 4.0, 5.6]) c.metti('legno', cilindro(0.012, 0.012, 0.3, 4), Math.cos(a) * 1.05, 0.12, Math.sin(a) * 1.05, LS, { rz: Math.cos(a) * 0.5, rx: -Math.sin(a) * 0.5 })
  },
  bandiera: (c, r) => {
    for (let i = 0; i < 3; i++) c.metti('pietra', new DodecahedronGeometry(0.14), Math.cos(i * 2.1) * 0.16, 0.12, Math.sin(i * 2.1) * 0.16, [0.7, 0.68, 0.64])
    c.metti('legno', cilindro(0.04, 0.05, 3.2, 6), 0, 1.6, 0, LS)
    c.metti('stoffa', scatola(0.8, 0.46, 0.02, 1), 0.42, 2.85, 0, scegli(r, [[0.8, 0.2, 0.2], [0.24, 0.44, 0.8]]))
    c.metti('liscio', new OctahedronGeometry(0.06), 0, 3.25, 0, [0.96, 0.78, 0.22])
  },
}

// un tratto di palizzata, lungo 1,1 lungo x: quattro pali appuntiti e due traverse (il forte, tutto attorno alla città)
export function palizzata(c, r) {
  for (let i = 0; i < 4; i++) {
    const x = -0.45 + i * 0.3, h = 1.45 + r() * 0.35
    c.metti('legno', scatola(0.2, h, 0.2, 1), x, h / 2, 0, scegli(r, [[0.55, 0.4, 0.28], [0.62, 0.46, 0.32], [0.5, 0.36, 0.25]]))
    c.metti('legno', new ConeGeometry(0.15, 0.26, 4), x, h + 0.13, 0, [0.5, 0.36, 0.25], { ry: PI / 4 })
  }
  for (const h of [0.45, 1.0]) c.metti('legno', scatola(1.1, 0.07, 0.07, 1), 0, h, 0.12, LS)
}
MODELLI.palizzata = palizzata
