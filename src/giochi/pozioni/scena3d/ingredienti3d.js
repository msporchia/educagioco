// Gli ingredienti come oggetti: modellati nella creta (forme che si fondono,
// una pelle sola, i colori nei vertici), come gli animali della fattoria.
// Un liquido si mostra con da dove viene: la bava col drago, il succo con la
// rapa. Nel gioco non si costruiscono: si fotografano sul computer (`npm run
// anteprime pozioni`). Vedi docs/pozioni/regole.md.
import { Group, Mesh, MeshStandardMaterial } from 'three'
import { palla, osso, fila, girata, unione, meno, dentro, sopra, pelle, scatolaDi, fra, verso, mosso } from '../../fattoria3d/scena3d/creta.js'

const materiale = (lucido = 0.75) => new MeshStandardMaterial({ vertexColors: true, roughness: lucido, metalness: 0 })

const pezzo = (forma, passo, colore, lucido) => new Mesh(pelle(forma, { ...scatolaDi(forma, 0.05), passo, colore }), materiale(lucido))
const tinta = hex => (x, y, z, c) => c.setHex(hex)
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

function drago() {
  const lato = s => [
    fila([[s * 0.17, 0.74, -0.14], [s * 0.26, 0.92, -0.34], [s * 0.26, 1.08, -0.52]], [0.075, 0.045, 0.012], 0.03),
    girata(palla([s * 0.34, 0.66, -0.14], [0.05, 0.13, 0.09]), [0, 0, -s * 0.7]),
    palla([s * 0.15, 0.68, 0.14], 0.085),
    palla([s * 0.08, 0.52, 0.54], 0.045),
  ]
  const testa = unione([
    palla([0, 0.54, -0.04], [0.3, 0.27, 0.32]),
    osso([0, 0.48, 0.14], [0, 0.44, 0.56], 0.21, 0.135),
    osso([0, 0.36, -0.14], [0, 0, -0.34], 0.2, 0.3),
    ...[0, 1, 2].map(n => osso([0, 0.74 - n * 0.2, -0.2 - n * 0.09], [0, 0.88 - n * 0.2, -0.36 - n * 0.09], 0.05, 0.008)),
    ...lato(1), ...lato(-1),
    fila([[0, 0.32, 0.5], [0.01, 0.2, 0.52], [0, 0.12, 0.52]], [0.022, 0.016, 0.045], 0.02),
  ], 0.05)
  const forma = dentro(testa, sopra(0))
  const occhio = (x, y, z) => Math.hypot(Math.abs(x) - 0.17, y - 0.7, z - 0.21)
  return tutto(pezzo(forma, 0.014, (x, y, z, c, nx, ny) => {
    c.setHex(0x4fa84a); verso(c, 0x2a7238, fra(0, 0.7, ny) * 0.6); verso(c, 0xc8d878, fra(0.05, -0.6, ny) * 0.8)
    if (y > 0.62 && z < -0.12 && Math.abs(x) < 0.07 || (Math.abs(x) > 0.15 && y > 0.8)) c.setHex(0xe8dcae)
    verso(c, 0xf2c83a, fra(0.06, 0.04, occhio(x, y, z))); verso(c, 0x141414, fra(0.035, 0.022, occhio(x, y, z)))
    if (y < 0.3 && z > 0.42 && Math.abs(x) < 0.06) c.setHex(0x9ae86a)      // la bava
  }, 0.45))
}

// una boccetta di vetro con la coda di sirena disegnata sull'etichetta, e due lacrime cadute
function lacrime() {
  const vetro = unione([palla([0, 0.34, 0], [0.3, 0.34, 0.2]), osso([0, 0.6, 0], [0, 0.82, 0], 0.1, 0.085), palla([0, 0.84, 0], [0.12, 0.03, 0.12])], 0.05)
  const tappo = osso([0, 0.84, 0], [0, 0.98, 0], 0.075, 0.09)
  const disegno = (x, y) => {
    const fianco = Math.max(0.012, 0.05 * fra(0.26, 0.5, y))
    const pinna = ((Math.abs(x) - 0.065) / 0.075) ** 2 + ((y - 0.215) / 0.04) ** 2 < 1
    return pinna || (y > 0.235 && y < 0.5 && Math.abs(x - Math.sin(y * 11) * 0.025) < fianco)
  }
  const goccia = (x, z, s) => unione([palla([x, 0.08 * s, z], 0.08 * s), osso([x, 0.1 * s, z], [x, 0.22 * s, z], 0.05 * s, 0.006)], 0.03)
  return tutto(pezzo(vetro, 0.008, (x, y, z, c) => {
    c.setHex(0x8fdcf0); verso(c, 0x3a9ad0, fra(0.5, 0.05, y) * 0.75); verso(c, 0xeafcff, fra(0.75, 0.95, y) * 0.6)
    if (z > 0.02 && Math.abs(x) < 0.17 && y > 0.14 && y < 0.54) { c.setHex(0xf6ecd2); if (disegno(x, y)) c.setHex(0x1f8a9a) }
  }, 0.12), pezzo(tappo, 0.01, tinta(0xb8875a)),
  pezzo(unione([goccia(0.38, 0.12, 1), goccia(-0.36, 0.16, 0.8)], 0), 0.008, (x, y, z, c) => { c.setHex(0x7fd8f4); verso(c, 0xeafcff, fra(0.1, 0.2, y) * 0.5) }, 0.08))
}

function gufo() {
  const ala = s => girata(palla([s * 0.3, 0.42, -0.02], [0.08, 0.3, 0.2]), [0, 0, s * 0.12])
  const piede = s => palla([s * 0.12, 0.05, 0.16], [0.09, 0.05, 0.1])
  const corpo = unione([palla([0, 0.45, 0], [0.31, 0.43, 0.28]), palla([0, 0.86, 0.02], [0.29, 0.25, 0.26]),
    osso([0.19, 1.0, 0], [0.24, 1.2, -0.02], 0.08, 0.01), osso([-0.19, 1.0, 0], [-0.24, 1.2, -0.02], 0.08, 0.01),
    ala(1), ala(-1), piede(1), piede(-1), osso([0, 0.82, 0.24], [0, 0.72, 0.31], 0.045, 0.012)], 0.05)
  const forma = dentro(corpo, sopra(0))
  const occhio = (x, y, z) => Math.hypot(Math.abs(x) - 0.12, y - 0.88, (z - 0.25) * 0.5)
  return tutto(pezzo(forma, 0.013, (x, y, z, c) => {
    c.setHex(0x8a6238); verso(c, 0x5e3f22, mosso(x, y, z, 26) * 0.4 + 0.2)
    // il petto chiaro a scaglie
    if (y < 0.72 && z > 0.08 && Math.abs(x) < 0.22) { c.setHex(0xe8d8b4); verso(c, 0x8a6238, fra(0.3, 0.9, Math.sin(y * 44 + Math.abs(Math.sin(x * 20)) * 2))) }
    verso(c, 0xf0e4c8, fra(0.15, 0.1, occhio(x, y, z)))
    verso(c, 0xf2a71e, fra(0.1, 0.08, occhio(x, y, z))); verso(c, 0x141414, fra(0.06, 0.045, occhio(x, y, z)))
    if (z > 0.24 && y < 0.83 && y > 0.68 && Math.abs(x) < 0.05) c.setHex(0xe0a020)
    if (y < 0.1) c.setHex(0xe0a020)
  }, 0.6))
}

function rapa() {
  const corpo = unione([palla([0, 0.36, 0], [0.34, 0.31, 0.34]), fila([[0, 0.14, 0], [0.03, 0.02, 0.02]], [0.12, 0.02], 0.08)], 0.14)
  const foglie = unione([-1.05, -0.35, 0.3, 0.95].map((a, n) => girata(palla([0, 1.0, 0], [0.11, 0.28, 0.035]), [0.12 * n, n * 1.5, a * 0.5], [0, 0.66, 0])), 0.05)
  return tutto(
    pezzo(corpo, 0.012, (x, y, z, c) => { c.setHex(0xf2e8dc); verso(c, 0xb0305e, fra(0.26, 0.5, y + mosso(x, y, z, 12) * 0.04)); verso(c, 0xc0a890, fra(0.3, 0.46, Math.abs(Math.sin(y * 30)) * 0.5) * 0.12) }, 0.4),
    pezzo(foglie, 0.012, (x, y, z, c) => { c.setHex(0x5fae4a); verso(c, 0x2f7a38, fra(1.2, 0.8, y) * 0.7); verso(c, 0xb0305e, fra(0.74, 0.64, y) * 0.8) }, 0.55),
  )
}

function nuvola() {
  const forma = dentro(unione([palla([-0.36, 0.3, 0], [0.3, 0.27, 0.27]), palla([0.02, 0.44, 0], [0.36, 0.38, 0.33]), palla([0.4, 0.3, 0.02], [0.28, 0.25, 0.25]),
    palla([-0.12, 0.26, 0.2], 0.24), palla([0.2, 0.24, 0.18], 0.22), palla([0.1, 0.3, -0.2], 0.26)], 0.09), sopra(0.08), 0.04)
  return tutto(pezzo(forma, 0.016, (x, y, z, c, nx, ny) => { c.setHex(0xf6faff); verso(c, 0xa8c4e8, fra(0.2, -0.7, ny) * 0.9) }, 0.85))
}

function grappolo() {
  const chicchi = []
  for (const [y, n, r] of [[0.74, 5, 0.27], [0.56, 5, 0.22], [0.38, 4, 0.16], [0.22, 2, 0.07], [0.1, 1, 0]])
    for (let i = 0; i < n; i++) { const a = i / n * 6.283 + y * 7; chicchi.push(palla([Math.cos(a) * r, y, Math.sin(a) * r], 0.115)) }
  const forma = unione(chicchi, 0.012)
  const gambo = unione([fila([[0, 0.72, 0], [0.02, 0.92, 0], [0.08, 1.02, 0]], [0.04, 0.03, 0.03], 0.02), girata(palla([0.26, 0.92, 0], [0.2, 0.025, 0.15]), [0, 0, 0.35])], 0.03)
  return tutto(
    pezzo(forma, 0.011, (x, y, z, c, nx, ny, nz) => { c.setHex(0x6a3f9e); verso(c, 0x3f2268, fra(0.2, -0.6, ny) * 0.8); verso(c, 0xa98ae0, fra(0.55, 0.9, nz * 0.6 + ny * 0.5) * 0.6) }, 0.28),
    pezzo(gambo, 0.011, (x, y, z, c) => { c.setHex(0x6e5230); if (x > 0.09) { c.setHex(0x5fa04a); verso(c, 0x3a7a38, mosso(x, y, z, 22) * 0.4 + 0.2) } }, 0.6),
  )
}

function cometa() {
  // la testa di roccia, e tre code che si aprono dietro di lei
  const coda = (dy, dz, r) => fila([[0.34, 0.3, 0], [-0.02, 0.5 + dy * 0.4, dz * 0.4], [-0.34, 0.72 + dy, dz], [-0.64, 0.92 + dy * 1.6, dz * 1.5]], [r, r * 0.7, r * 0.38, 0.008], 0.05)
  const roccia = [[0.5, 0.2, 0.17], [0.34, 0.1, 0.17], [0.54, 0.36, 0.08]].reduce((f, c) => meno(f, palla(c, 0.05), 0.025),
    unione([palla([0.38, 0.27, 0], [0.24, 0.22, 0.22]), palla([0.48, 0.38, 0.08], 0.09), palla([0.3, 0.14, -0.08], 0.1)], 0.05))
  const code = unione([coda(0, 0, 0.17), coda(0.14, 0.14, 0.1), coda(-0.14, -0.12, 0.1)], 0.06)
  return tutto(
    pezzo(roccia, 0.011, (x, y, z, c) => { c.setHex(0x8a8078); verso(c, 0x4e4640, mosso(x, y, z, 26) * 0.55 + 0.3) }, 0.85),
    pezzo(code, 0.014, (x, y, z, c) => { c.setHex(0xfff0c0); verso(c, 0x8ad0f8, fra(0.3, -0.1, x)); verso(c, 0x4a78e0, fra(-0.1, -0.55, x)) }, 0.35),
  )
}

function verme() {
  const punti = [], raggi = []
  for (let n = 0; n <= 16; n++) {
    const t = n / 16, su = fra(0.7, 1, t)
    punti.push([-0.66 + t * 1.14, 0.09 + su * 0.34, Math.sin(t * 7.4) * 0.17 * (1 - su) + su * 0.12])
    raggi.push(0.04 + 0.06 * Math.min(1, t * 5))
  }
  const forma = fila(punti, raggi, 0.02), H = punti.at(-1)
  return tutto(pezzo(forma, 0.012, (x, y, z, c) => {
    c.setHex(0xe89ab0); verso(c, 0xc0607e, fra(0.2, 0.85, Math.sin((x * 0.9 + y * 0.8) * 62) * 0.5 + 0.5) * 0.7)
    const occhio = Math.min(Math.hypot(x - H[0] - 0.05, y - H[1] - 0.03, z - H[2] - 0.07), Math.hypot(x - H[0] + 0.05, y - H[1] - 0.03, z - H[2] - 0.07))
    verso(c, 0x141414, fra(0.028, 0.018, occhio))
  }, 0.4))
}

function stelo() {
  const asse = fila([[0, 0, 0], [0.03, 0.42, 0], [0.1, 0.72, 0], [0.2, 1.02, 0]], [0.022, 0.02, 0.018, 0.012], 0.01)
  // i chicchi a coppie, staccati l'uno dall'altro come in una spiga vera
  const chicchi = []
  for (let n = 0; n < 7; n++) for (const s of [-1, 1]) {
    const t = n / 6, cx = 0.1 + t * 0.1, cy = 0.68 + t * 0.34
    chicchi.push(girata(palla([cx + s * 0.05, cy + 0.03, 0], [0.03, 0.05, 0.03]), [0, 0, -s * 0.55 - 0.3], [cx, cy, 0]))
  }
  const baffi = chicchi.filter((_, n) => n % 2 === 0).map((_, n) => osso([0.1 + n / 6 * 0.1 - 0.05, 0.74 + n / 6 * 0.34, 0], [0.02 + n / 6 * 0.1 - 0.12, 0.92 + n / 6 * 0.34, 0], 0.005, 0.002))
  const forma = unione([asse, ...chicchi, ...baffi], 0.004)
  return tutto(pezzo(forma, 0.006, (x, y, z, c) => { c.setHex(0xe8c44a); verso(c, 0xb88a24, fra(0.7, 0.1, y) * 0.5); verso(c, 0xfff0a0, mosso(x, y, z, 40) * 0.4 + 0.1) }, 0.45))
}

// il nome dell'ingrediente → il modello, in piedi sull'origine
export const MODELLI = {
  'bava di drago': drago, 'essenza di rana': rana, 'lacrime di sirena': lacrime, 'sciroppo di gufo': gufo, 'succo di rapa': rapa,
  'schiuma di nuvola': nuvola, 'mosto di strega': grappolo,
  'polvere di luna': luna, 'stelle cadenti': stella, 'funghi secchi': funghi, 'conchiglia': conchiglia,
  'cenere di cometa': cometa, 'ghiande': ghianda,
  'radice di mandragora': mandragora, 'ramo di quercia': ramo, 'osso di troll': ossoDiTroll, 'verme di palude': verme, 'stelo dorato': stelo,
}
