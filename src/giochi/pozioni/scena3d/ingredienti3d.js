// Gli ingredienti come oggetti: modellati nella creta (forme che si fondono,
// una pelle sola, i colori nei vertici), come gli animali della fattoria.
// Una prova su nove dei diciotto: vedi docs/pozioni/regole.md.
import { Group, Mesh, MeshStandardMaterial, Color } from 'three'
import { palla, osso, fila, girata, unione, meno, dentro, sopra, pelle, scatolaDi, fra, verso, mosso } from '../../fattoria3d/scena3d/creta.js'

const materiale = (lucido = 0.75) => new MeshStandardMaterial({ vertexColors: true, roughness: lucido, metalness: 0 })

function pezzo(forma, passo, colore, lucido) {
  const m = new Mesh(pelle(forma, { ...scatolaDi(forma, 0.05), passo, colore }), materiale(lucido))
  return m
}
const tutto = (...pezzi) => { const g = new Group(); g.add(...pezzi); return g }

function fungo(cx, cz, s, gira = 0) {
  const gambo = osso([cx, 0.02, cz], [cx + gira * 0.08, 0.52 * s, cz], 0.13 * s, 0.09 * s)
  const cappello = dentro(palla([cx + gira * 0.08, 0.5 * s, cz], [0.42 * s, 0.34 * s, 0.42 * s]), sopra(0.47 * s), 0.05)
  return { gambo, cappello, h: 0.47 * s, s, cx, cz }
}
function funghi() {
  const parti = [fungo(-0.12, 0, 1, -1), fungo(0.34, 0.14, 0.68, 1)]
  const forma = unione(parti.flatMap(p => [p.gambo, p.cappello]), 0.04)
  return tutto(pezzo(forma, 0.016, (x, y, z, c, nx, ny) => {
    const p = parti[x > 0.15 ? 1 : 0], dx = x - p.cx, dz = z - p.cz, su = y > p.h + 0.012 && ny > -0.1
    c.setHex(0xe8d8b8)
    if (su) {
      c.setHex(0xb0512e)
      verso(c, 0x7e3218, fra(0.1, 0.5, 1 - (y - p.h) / (0.34 * p.s)) * 0.6)
      // le macchie chiare del cappello
      const m = Math.sin(dx * 19 / p.s + 1) * Math.sin(dz * 21 / p.s) * Math.sin(y * 24 / p.s + 2)
      verso(c, 0xf2e4c4, fra(0.28, 0.4, m))
    } else if (y > p.h - 0.03) verso(c, 0xc9a97c, fra(0, 0.4, Math.sin(Math.atan2(dz, dx) * 34) * 0.5 + 0.5)) // le lamelle
    verso(c, 0x7e5a3a, mosso(x, y, z, 30) * 0.12 + 0.05)
  }))
}

function ghianda() {
  const noce = unione([palla([0, 0.34, 0], [0.24, 0.34, 0.24]), osso([0, 0.14, 0], [0, 0.01, 0], 0.08, 0.012)], 0.1)
  const cupola = unione([dentro(palla([0, 0.56, 0], [0.285, 0.2, 0.285]), sopra(0.5), 0.03), osso([0, 0.72, 0], [0.05, 0.92, 0.02], 0.035, 0.025)], 0.03)
  const forma = unione([noce, cupola], 0.008)
  return tutto(pezzo(forma, 0.012, (x, y, z, c) => {
    if (y < 0.515) {
      c.setHex(0xa96a2c); verso(c, 0xd9a35a, fra(0.2, 0.5, y) * 0.35 * (0.6 + z)); verso(c, 0x6a3f18, fra(0.16, 0.02, y))
      verso(c, 0x7a4a1e, Math.abs(Math.sin(Math.atan2(z, x) * 7)) * 0.08)
    } else {
      c.setHex(0x7a5a34)
      // le squame della cupola
      const a = Math.atan2(z, x), s = Math.sin(a * 9 + Math.floor(y * 26) * 1.6) * Math.sin(y * 82)
      verso(c, 0x4a3218, fra(-0.1, 0.5, s) * 0.8)
    }
  }, 0.45))
}

function conchiglia() {
  // una spirale di anelli che si stringono, fusi: la pelle fa il guscio
  const pezzi = []
  for (let t = 0; t < 1; t += 0.035) {
    const a = t * 15, r = 0.3 * (1 - t) ** 1.25
    pezzi.push(palla([Math.cos(a) * r * 0.82, 0.12 + t * 0.92, Math.sin(a) * r * 0.82], 0.32 * (1 - t) ** 1.2 + 0.012))
  }
  const bocca = palla([0.33, 0.2, 0.2], [0.17, 0.27, 0.15])
  const forma = meno(unione(pezzi, 0.05), bocca, 0.05)
  return tutto(pezzo(forma, 0.014, (x, y, z, c) => {
    c.setHex(0xf0e2cc)
    verso(c, 0xc8875a, fra(0.1, 0.8, Math.sin(y * 42 + Math.atan2(z, x)) * 0.5 + 0.5) * 0.65)
    verso(c, 0xf7b8a0, fra(0.3, 0.1, Math.hypot(x - 0.33, y - 0.2, z - 0.2)))
  }, 0.4))
}

function mandragora() {
  const corpo = unione([
    osso([0, 0.26, 0], [0, 0.72, 0], 0.17, 0.21),
    fila([[-0.09, 0.3, 0], [-0.2, 0.1, 0.03], [-0.24, -0.1, 0]], [0.09, 0.055, 0.02], 0.05),
    fila([[0.09, 0.3, 0], [0.16, 0.08, -0.03], [0.26, -0.12, 0.02]], [0.09, 0.055, 0.02], 0.05),
    fila([[-0.16, 0.62, 0], [-0.36, 0.56, 0.05], [-0.46, 0.7, 0.02]], [0.07, 0.04, 0.015], 0.05),
    fila([[0.16, 0.62, 0], [0.36, 0.48, 0.05], [0.47, 0.36, 0.02]], [0.07, 0.04, 0.015], 0.05),
  ], 0.07)
  const scavato = meno(meno(meno(corpo, palla([-0.08, 0.72, 0.2], 0.05), 0.02), palla([0.08, 0.72, 0.2], 0.05), 0.02), palla([0, 0.6, 0.2], [0.07, 0.04, 0.05]), 0.02)
  const foglie = [-1.1, -0.45, 0.2, 0.85].map((a, n) => girata(palla([0, 1.12, 0], [0.09, 0.24, 0.035]), [0.1 * n, n * 1.3, a * 0.55], [0, 0.9, 0]))
  const ciuffo = unione(foglie, 0.04)
  return tutto(
    pezzo(scavato, 0.014, (x, y, z, c) => { c.setHex(0xb98a56); verso(c, 0x7a5430, fra(-0.3, 0.6, mosso(x, y * 2.4, z, 28)) * 0.5); verso(c, 0x3a2412, fra(0.09, 0.03, Math.min(Math.hypot(x + 0.08, y - 0.72, z - 0.2), Math.hypot(x - 0.08, y - 0.72, z - 0.2), Math.hypot(x, y - 0.6, z - 0.19)))) }),
    pezzo(ciuffo, 0.012, (x, y, z, c) => { c.setHex(0x4f9e4a); verso(c, 0x2a6a30, fra(1.25, 0.9, y) * 0.7) }, 0.55),
  )
}

function ossoDiTroll() {
  const capo = (x, s) => unione([palla([x, 0.14, 0.1 * s], 0.15), palla([x, 0.14, -0.1 * s], 0.15)], 0.06)
  const forma = unione([osso([-0.5, 0.14, 0], [0.5, 0.14, 0], 0.095, 0.085), capo(-0.56, 1), capo(0.56, 1)], 0.09)
  return tutto(pezzo(forma, 0.016, (x, y, z, c) => { c.setHex(0xe8e0cc); verso(c, 0xb9a57e, fra(-0.2, 0.7, mosso(x, y, z, 16)) * 0.55); verso(c, 0x9a8460, fra(0.09, 0.0, y) * 0.5) }))
}

function ramo() {
  const legno = unione([
    fila([[-0.6, 0.12, 0], [-0.2, 0.2, 0.04], [0.2, 0.2, -0.03], [0.62, 0.34, 0]], [0.1, 0.08, 0.06, 0.03], 0.05),
    fila([[-0.1, 0.2, 0.02], [0.08, 0.42, 0.1], [0.1, 0.62, 0.08]], [0.055, 0.035, 0.018], 0.04),
  ], 0.05)
  const foglia = (x, y, z, ang) => girata(unione([0, 1, 2].flatMap(n => [palla([0.09 * n, 0, 0], [0.085, 0.015, 0.1 - n * 0.008])]).concat([palla([0.27, 0, 0], [0.09, 0.015, 0.05])]), 0.05), ang, [0, 0, 0])
  const sposta = (f, dx, dy, dz) => ({ f: (x, y, z) => f.f(x - dx, y - dy, z - dz), c: [f.c[0] + dx, f.c[1] + dy, f.c[2] + dz], r: f.r })
  const foglie = unione([sposta(foglia(0, 0, 0, [0.5, 0.5, 0.7]), 0.1, 0.63, 0.08), sposta(foglia(0, 0, 0, [-0.4, 2.4, 0.3]), 0.1, 0.6, 0.08), sposta(foglia(0, 0, 0, [0.3, 0.1, 0.4]), 0.6, 0.34, 0)], 0.01)
  return tutto(
    pezzo(legno, 0.013, (x, y, z, c) => { c.setHex(0x8a5e38); verso(c, 0x4e3218, fra(-0.1, 0.4, Math.sin(Math.atan2(z, y - 0.2) * 9 + x * 6) * 0.5 + mosso(x, y, z, 26) * 0.5) * 0.8) }),
    pezzo(foglie, 0.01, (x, y, z, c) => { c.setHex(0x5fa04a); verso(c, 0x3a7a38, mosso(x, y, z, 22) * 0.5 + 0.2) }, 0.5),
  )
}

function rana() {
  const corpo = unione([
    palla([0, 0.26, -0.04], [0.32, 0.25, 0.4]),
    palla([0, 0.38, 0.3], [0.27, 0.19, 0.24]),
    palla([-0.15, 0.53, 0.33], 0.1), palla([0.15, 0.53, 0.33], 0.1),
    fila([[0.26, 0.2, -0.26], [0.46, 0.34, -0.14], [0.42, 0.1, 0.12], [0.5, 0.03, 0.3]], [0.13, 0.1, 0.05, 0.05], 0.06),
    fila([[-0.26, 0.2, -0.26], [-0.46, 0.34, -0.14], [-0.42, 0.1, 0.12], [-0.5, 0.03, 0.3]], [0.13, 0.1, 0.05, 0.05], 0.06),
    fila([[0.2, 0.2, 0.3], [0.27, 0.05, 0.42]], [0.06, 0.04], 0.05),
    fila([[-0.2, 0.2, 0.3], [-0.27, 0.05, 0.42]], [0.06, 0.04], 0.05),
  ], 0.07)
  const forma = dentro(corpo, { f: (x, y) => -y + 0.002, c: [0, 0, 0], r: 1e9 })
  const occhio = (x, y, z) => Math.hypot(x - Math.sign(x) * 0.16, y - 0.56, z - 0.4)
  return tutto(pezzo(forma, 0.014, (x, y, z, c, nx, ny) => {
    c.setHex(0x6fbf4f); verso(c, 0x3f8a3a, fra(0.1, 0.5, ny) * 0.5 + mosso(x, y, z, 15) * 0.2)
    verso(c, 0xe8e4b8, fra(0.1, -0.6, ny))
    verso(c, 0xf2d24a, fra(0.075, 0.05, occhio(x, y, z)))
    verso(c, 0x141414, fra(0.045, 0.03, occhio(x, y, z)))
    verso(c, 0x2a5a2a, fra(0.012, 0.004, Math.abs(y - 0.31 + (x * x) * 0.5)) * fra(0.32, 0.44, z))  // la bocca
  }, 0.35))
}

function luna() {
  const forma = meno(palla([0, 0.5, 0], [0.5, 0.5, 0.2]), palla([0.26, 0.56, 0], [0.42, 0.42, 0.42]), 0.02)
  return tutto(pezzo(forma, 0.012, (x, y, z, c) => {
    c.setHex(0xe9ecff); verso(c, 0xb8bfe8, fra(0.1, 0.6, mosso(x, y, z, 14) + 0.3) * 0.7)
  }, 0.4))
}

function stella() {
  const raggi = [0, 1, 2, 3, 4].map(n => { const a = Math.PI / 2 + n * Math.PI * 2 / 5; return osso([0, 0.52, 0], [Math.cos(a) * 0.5, 0.52 + Math.sin(a) * 0.5, 0], 0.16, 0.025) })
  const forma = unione(raggi, 0.1)
  return tutto(pezzo(forma, 0.012, (x, y, z, c) => { c.setHex(0xffd85e); verso(c, 0xe89a1e, fra(0.1, 0.5, Math.hypot(x, y - 0.52))) }, 0.3))
}

// il nome dell'ingrediente → il modello, in piedi sull'origine
export const MODELLI = {
  'funghi secchi': funghi, 'ghiande macinate': ghianda, 'conchiglia pestata': conchiglia, 'radice di mandragora': mandragora,
  'osso di troll': ossoDiTroll, 'ramo di quercia': ramo, 'essenza di rana': rana, 'polvere di luna': luna, 'stelle tritate': stella,
}
