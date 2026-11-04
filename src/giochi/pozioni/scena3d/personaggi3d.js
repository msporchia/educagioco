// Il mercante e chi viene a bere: modellati nella creta come gli ingredienti,
// in piedi su y = 0, alti un po' più di uno, rivolti a +z. Nel gioco non si
// costruiscono: si fotografano sul computer (`npm run anteprime pozioni`) e
// sul banco sono figure che saltano e si piegano. Vedi docs/pozioni/personaggi.md.
import { Group, Mesh, MeshStandardMaterial } from 'three'
import { palla, osso, unione, meno, dentro, sopra, pelle, scatolaDi, fra, verso, mosso } from '../../fattoria3d/scena3d/creta.js'

const materiale = (lucido = 0.7) => new MeshStandardMaterial({ vertexColors: true, roughness: lucido, metalness: 0 })
const pezzo = (forma, passo, colore, lucido) => new Mesh(pelle(forma, { ...scatolaDi(forma, 0.05), passo, colore }), materiale(lucido))
const tutto = (...pezzi) => { const g = new Group(); g.add(...pezzi); return g }
const tinta = hex => (x, y, z, c) => c.setHex(hex)

// due occhi tondi che guardano avanti: bianco, pupilla grande, un punto di luce
function occhi(cx, cy, cz, r, largo = 1) {
  const pezzi = []
  for (const s of [-1, 1]) {
    const x = cx + s * largo * r * 1.25
    pezzi.push(pezzo(palla([x, cy, cz], r), 0.008, (px, py, pz, c) => {
      const d = Math.hypot(px - x, py - cy)
      c.setHex(0xfaf6ea)
      if (pz > cz && d < r * 0.68) c.setHex(0x1c1420)
      if (pz > cz && Math.hypot(px - x - r * 0.25, py - cy - r * 0.28) < r * 0.2) c.setHex(0xffffff)
    }, 0.25))
  }
  return pezzi
}

function mercante(porge) {
  const veste = unione([osso([0, 0.04, 0], [0, 0.62, 0], 0.4, 0.2), palla([0, 0.34, 0.03], [0.34, 0.3, 0.3])], 0.08)
  const manoD = porge ? [0.47, 0.82, 0.2] : [0.34, 0.3, 0.22], gomitoD = porge ? [0.42, 0.58, 0.1] : [0.38, 0.46, 0.06]
  const braccia = unione([osso([0.22, 0.6, 0], gomitoD, 0.095, 0.085), osso(gomitoD, manoD, 0.085, 0.1),
                          osso([-0.22, 0.6, 0], [-0.38, 0.46, 0.06], 0.095, 0.085), osso([-0.38, 0.46, 0.06], [-0.3, 0.3, 0.22], 0.085, 0.1)], 0.04)
  const mani = unione([palla(manoD, 0.078), palla([-0.3, 0.27, 0.25], 0.078)], 0)
  const testa = unione([palla([0, 0.83, 0.02], 0.2), palla([0, 0.8, 0.23], [0.07, 0.06, 0.08])], 0.03)
  const barba = unione([palla([0, 0.68, 0.14], [0.17, 0.15, 0.1]), palla([0, 0.54, 0.17], [0.12, 0.13, 0.08]), palla([0, 0.43, 0.18], [0.06, 0.09, 0.05]),
                        palla([-0.1, 0.76, 0.17], [0.09, 0.035, 0.05]), palla([0.1, 0.76, 0.17], [0.09, 0.035, 0.05])], 0.04)
  const turbante = unione([palla([0, 0.98, 0], [0.25, 0.14, 0.24]), palla([0.03, 1.09, -0.01], [0.17, 0.1, 0.17]), palla([0.01, 1.17, 0], 0.07)], 0.05)
  const gemma = palla([0, 1.02, 0.235], 0.05)
  return tutto(
    pezzo(veste, 0.014, (x, y, z, c) => {
      c.setHex(0x6a2f8f); verso(c, 0x3f1a5e, fra(0.25, 0, y) * 0.5)
      if (Math.abs(y - 0.4) < 0.038) c.setHex(0xe6b53c)                     // la cintura
      if (y < 0.075) c.setHex(0xe6b53c)                                     // l'orlo
      verso(c, 0xc98be6, fra(0.6, 0.95, Math.sin(Math.atan2(z, x) * 16) * 0.5 + 0.5) * 0.14 * (y < 0.38))
    }),
    pezzo(braccia, 0.012, (x, y, z, c) => { c.setHex(0x7c3ba3); verso(c, 0x4a2069, mosso(x, y, z, 14) * 0.1 + 0.1) }),
    pezzo(mani, 0.01, tinta(0xe4ac7c)),
    pezzo(testa, 0.01, (x, y, z, c) => { c.setHex(0xe4ac7c); verso(c, 0xd9785c, fra(0.08, 0.02, Math.hypot(x, y - 0.8, (z - 0.28) * 0.6))) }),
    pezzo(barba, 0.01, (x, y, z, c) => { c.setHex(0xf0ece2); verso(c, 0xbcb4a6, fra(0.3, 0.8, Math.abs(Math.sin(x * 40 + y * 9))) * 0.3) }),
    pezzo(turbante, 0.012, (x, y, z, c) => { c.setHex(0xe9622f); verso(c, 0xf7c04a, fra(0.2, 0.9, Math.sin((y * 2 + Math.atan2(z, x) * 0.3) * 18) * 0.5 + 0.5) * 0.75) }),
    pezzo(gemma, 0.008, tinta(0x38d8c8), 0.15),
    ...occhi(0, 0.87, 0.195, 0.045),
  )
}

function maga() {
  const veste = osso([0, 0.04, 0], [0, 0.55, 0], 0.32, 0.16)
  const braccia = unione([osso([0.16, 0.52, 0], [0.3, 0.32, 0.12], 0.07, 0.06), osso([-0.16, 0.52, 0], [-0.3, 0.32, 0.12], 0.07, 0.06)], 0.03)
  const testa = palla([0, 0.73, 0.02], 0.19)
  const capelli = unione([meno(palla([0, 0.75, -0.02], 0.215), palla([0, 0.68, 0.2], [0.2, 0.17, 0.15]), 0.02),
                          osso([-0.18, 0.72, -0.02], [-0.25, 0.46, 0], 0.08, 0.04), osso([0.18, 0.72, -0.02], [0.25, 0.46, 0], 0.08, 0.04)], 0.04)
  const falda = palla([0, 0.86, 0], [0.34, 0.035, 0.34])
  const punta = unione([osso([0, 0.86, 0], [0.02, 1.08, -0.02], 0.2, 0.08), osso([0.02, 1.08, -0.02], [0.13, 1.23, -0.05], 0.08, 0.018)], 0.03)
  const blu = (x, y, z, c) => {
    c.setHex(0x2f4bb3); verso(c, 0x1e2f78, fra(0.3, 0, y) * 0.5)
    if (Math.sin(x * 37 + 1) * Math.sin(y * 31) * Math.sin(z * 29 + 2) > 0.5) c.setHex(0xffd85e)   // le stelline
  }
  return tutto(pezzo(veste, 0.014, blu), pezzo(braccia, 0.012, tinta(0x2f4bb3)),
    pezzo(unione([palla([0.3, 0.3, 0.13], 0.06), palla([-0.3, 0.3, 0.13], 0.06)], 0), 0.01, tinta(0xf0c6a0)),
    pezzo(testa, 0.01, (x, y, z, c) => { c.setHex(0xf0c6a0); verso(c, 0xe88a7a, fra(0.07, 0.02, Math.hypot(Math.abs(x) - 0.11, y - 0.68)) * 0.7) }),
    pezzo(capelli, 0.012, (x, y, z, c) => { c.setHex(0xd9622a); verso(c, 0xf0a048, fra(0.2, 0.9, Math.sin(x * 34 + z * 12) * 0.5 + 0.5) * 0.4) }),
    pezzo(falda, 0.012, blu), pezzo(punta, 0.012, blu), ...occhi(0, 0.75, 0.185, 0.045))
}

function rana() {
  const corpo = unione([palla([0, 0.34, 0], [0.42, 0.34, 0.36]), palla([0, 0.62, 0.05], [0.36, 0.22, 0.3]),
                        palla([-0.2, 0.84, 0.08], 0.125), palla([0.2, 0.84, 0.08], 0.125),
                        palla([-0.36, 0.1, 0.16], [0.17, 0.09, 0.22]), palla([0.36, 0.1, 0.16], [0.17, 0.09, 0.22]),
                        osso([0.34, 0.38, 0.12], [0.3, 0.22, 0.3], 0.07, 0.055), osso([-0.34, 0.38, 0.12], [-0.3, 0.22, 0.3], 0.07, 0.055)], 0.05)
  const bocca = dentro(palla([0, 0.57, 0.31], [0.25, 0.022, 0.07]), sopra(0.5), 0)
  return tutto(pezzo(corpo, 0.012, (x, y, z, c) => {
    c.setHex(0x5bb33e); verso(c, 0x3a8a2c, fra(0.5, 0.95, y) * 0.35)
    if (z > 0.1 && y < 0.5 && Math.abs(x) < 0.3 && y > 0.1) verso(c, 0xe8f0b0, fra(0.3, 0.2, Math.abs(x)) * 0.9)  // la pancia
    verso(c, 0x2f6e24, fra(0.25, 0.5, Math.sin(x * 21 + 1) * Math.sin(z * 19) * Math.sin(y * 17 + 3)) * 0.6 * (z < 0.1))
  }, 0.45), pezzo(bocca, 0.008, tinta(0x24521c)), ...occhi(0, 0.87, 0.185, 0.085, 2.0 * 0.95))
}

function gufo() {
  const corpo = unione([palla([0, 0.45, 0], [0.34, 0.45, 0.3]), palla([0, 0.78, 0.02], [0.34, 0.27, 0.28]),
                        osso([-0.24, 0.98, 0], [-0.3, 1.14, -0.02], 0.08, 0.012), osso([0.24, 0.98, 0], [0.3, 1.14, -0.02], 0.08, 0.012)], 0.06)
  const ali = unione([palla([-0.34, 0.46, 0.02], [0.09, 0.3, 0.2]), palla([0.34, 0.46, 0.02], [0.09, 0.3, 0.2])], 0)
  const dischi = unione([palla([-0.14, 0.8, 0.22], [0.15, 0.15, 0.07]), palla([0.14, 0.8, 0.22], [0.15, 0.15, 0.07])], 0.02)
  const becco = osso([0, 0.74, 0.28], [0, 0.66, 0.34], 0.05, 0.012)
  const piedi = unione([palla([-0.13, 0.03, 0.2], [0.11, 0.04, 0.1]), palla([0.13, 0.03, 0.2], [0.11, 0.04, 0.1])], 0)
  return tutto(pezzo(corpo, 0.012, (x, y, z, c) => {
    c.setHex(0x8a5f38); verso(c, 0x5e3d20, fra(0.6, 1.1, y) * 0.5)
    if (z > 0.05 && y < 0.62) { verso(c, 0xecd9b0, fra(0.26, 0.14, Math.abs(x)))
      verso(c, 0x8a5f38, fra(0.45, 0.8, Math.sin(y * 42 + Math.abs(x) * 12) * 0.5 + 0.5) * 0.55 * fra(0.3, 0.1, Math.abs(x))) }
  }), pezzo(ali, 0.012, (x, y, z, c) => { c.setHex(0x6e4a2a); verso(c, 0x4a2f18, fra(0.3, 0.9, Math.sin(y * 34) * 0.5 + 0.5) * 0.45) }),
  pezzo(dischi, 0.01, tinta(0xf2e2c0)), pezzo(becco, 0.008, tinta(0xe6a52c), 0.35), pezzo(piedi, 0.01, tinta(0xe6a52c)),
  ...occhi(0, 0.81, 0.27, 0.085, 1.33))
}

// tuxedo come Sherlock, il gatto di casa: nero, pettorina e muso bianchi
function gatto() {
  const corpo = unione([palla([0, 0.3, -0.02], [0.3, 0.3, 0.3]), osso([0, 0.45, 0.05], [0, 0.62, 0.08], 0.2, 0.15),
                        osso([-0.14, 0.34, 0.18], [-0.15, 0.04, 0.26], 0.075, 0.06), osso([0.14, 0.34, 0.18], [0.15, 0.04, 0.26], 0.075, 0.06),
                        palla([-0.15, 0.035, 0.29], [0.08, 0.04, 0.09]), palla([0.15, 0.035, 0.29], [0.08, 0.04, 0.09]),
                        osso([0.24, 0.1, -0.2], [0.44, 0.16, -0.05], 0.06, 0.05), osso([0.44, 0.16, -0.05], [0.48, 0.5, -0.02], 0.05, 0.04)], 0.05)
  const testa = unione([palla([0, 0.8, 0.08], [0.27, 0.23, 0.24]),
                        osso([-0.17, 0.95, 0.06], [-0.23, 1.14, 0.04], 0.09, 0.012), osso([0.17, 0.95, 0.06], [0.23, 1.14, 0.04], 0.09, 0.012),
                        palla([0, 0.73, 0.28], [0.11, 0.07, 0.07])], 0.04)
  const baffi = unione([-1, 1].flatMap(s => [osso([s * 0.1, 0.74, 0.31], [s * 0.34, 0.77, 0.27], 0.006), osso([s * 0.1, 0.72, 0.31], [s * 0.34, 0.69, 0.27], 0.006)]), 0)
  return tutto(pezzo(corpo, 0.012, (x, y, z, c) => {
    c.setHex(0x1d1c22)
    if (z > 0.08 && Math.abs(x) < 0.15 + (0.6 - y) * 0.1 && y > 0.14) c.setHex(0xf2efe8)          // la pettorina
    if (y < 0.1 && z > 0.12) c.setHex(0xf2efe8)                                                    // i calzini
  }, 0.55), pezzo(testa, 0.01, (x, y, z, c) => {
    c.setHex(0x1d1c22)
    if (z > 0.2 && y < 0.82 - Math.abs(x) * 0.7 ) c.setHex(0xf2efe8)                               // il muso
    if (y > 1 && z > 0.05 && Math.abs(x) > 0.18) c.setHex(0xd98a9a)                                // dentro le orecchie
    if (z > 0.3 && y > 0.745 && y < 0.8 && Math.abs(x) < 0.04) c.setHex(0xe07a90)                  // il naso
  }, 0.55), pezzo(baffi, 0.005, tinta(0xf4f2ec)), ...occhi(0, 0.85, 0.27, 0.06, 1.65))
}

function robot() {
  const corpo = unione([palla([0, 0.38, 0], [0.31, 0.28, 0.25]), osso([-0.12, 0.14, 0], [-0.14, 0.03, 0.04], 0.08, 0.1), osso([0.12, 0.14, 0], [0.14, 0.03, 0.04], 0.08, 0.1),
                        osso([-0.3, 0.48, 0], [-0.4, 0.3, 0.12], 0.05, 0.05), osso([0.3, 0.48, 0], [0.4, 0.3, 0.12], 0.05, 0.05),
                        palla([-0.4, 0.28, 0.13], 0.08), palla([0.4, 0.28, 0.13], 0.08)], 0.02)
  const testa = unione([palla([0, 0.8, 0], [0.3, 0.22, 0.24]), osso([0, 0.98, 0], [0, 1.14, 0], 0.016), osso([0, 0.6, 0], [0, 0.66, 0], 0.1)], 0.02)
  const bulbo = palla([0, 1.17, 0], 0.05)
  const bocca = palla([0, 0.71, 0.225], [0.13, 0.026, 0.03])
  const metallo = (x, y, z, c) => {
    c.setHex(0xa8b6c4); verso(c, 0x6e7d8c, fra(0.2, -0.2, z) * 0.6)
    if (z > 0.12 && y > 0.3 && y < 0.5 && Math.abs(x) < 0.14) c.setHex(0x2b3a4a)                  // lo sportello
    if (z > 0.12 && Math.abs(y - 0.4) < 0.03 && Math.abs(Math.abs(x) - 0.07) < 0.03) c.setHex(0xf2c33d)
  }
  return tutto(pezzo(corpo, 0.012, metallo, 0.35), pezzo(testa, 0.012, metallo, 0.35),
    pezzo(bulbo, 0.008, tinta(0xe0453a), 0.2), pezzo(bocca, 0.008, tinta(0x2b3a4a)), ...occhi(0, 0.84, 0.2, 0.07, 1.5))
}

function folletto() {
  const corpo = unione([osso([0, 0.12, 0], [0, 0.5, 0], 0.26, 0.17), osso([0.15, 0.48, 0], [0.28, 0.32, 0.1], 0.06, 0.055), osso([-0.15, 0.48, 0], [-0.28, 0.32, 0.1], 0.06, 0.055)], 0.04)
  const stivali = unione([palla([-0.12, 0.06, 0.1], [0.11, 0.07, 0.17]), palla([0.12, 0.06, 0.1], [0.11, 0.07, 0.17])], 0)
  const testa = unione([palla([0, 0.71, 0.02], 0.2), palla([0, 0.67, 0.22], 0.05),
                        osso([-0.18, 0.72, 0], [-0.4, 0.84, -0.03], 0.06, 0.012), osso([0.18, 0.72, 0], [0.4, 0.84, -0.03], 0.06, 0.012)], 0.03)
  const capelli = palla([0, 0.62, 0.11], [0.17, 0.12, 0.11])
  const cappello = unione([osso([0, 0.82, 0], [-0.02, 1.02, -0.03], 0.21, 0.09), osso([-0.02, 1.02, -0.03], [-0.2, 1.1, -0.06], 0.09, 0.015)], 0.04)
  return tutto(pezzo(corpo, 0.012, (x, y, z, c) => {
    c.setHex(0x2f8a4e); if (Math.abs(y - 0.28) < 0.03) c.setHex(0x5a3a22)
    if (Math.abs(y - 0.28) < 0.04 && Math.abs(x) < 0.05 && z > 0) c.setHex(0xf2c33d)
  }), pezzo(stivali, 0.01, tinta(0x5a3a22)),
    pezzo(testa, 0.01, (x, y, z, c) => { c.setHex(0xf0c6a0); verso(c, 0xe88a7a, fra(0.06, 0.02, Math.hypot(x, y - 0.67, z - 0.26))) }),
    pezzo(meno(capelli, palla([0, 0.76, 0.2], [0.16, 0.1, 0.12]), 0.02), 0.01, tinta(0xc9542a)),
    pezzo(cappello, 0.012, (x, y, z, c) => { c.setHex(0xc8323a); if (y < 0.86) c.setHex(0xf2efe8) }),
    ...occhi(0, 0.74, 0.19, 0.045))
}

export const MODELLI = { mercante: () => mercante(false), 'mercante-porge': () => mercante(true), maga, rana, gufo, gatto, robot, folletto }
