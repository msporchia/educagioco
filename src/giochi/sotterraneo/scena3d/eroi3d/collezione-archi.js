// Generato da strumenti/promuovi-3d.mjs da poc/armi-3d/collezione-archi.js: non si tocca a mano (si cambia il prototipo e si rilancia `npm run promuovi3d`).
// La collezione: dieci archi. Verticali lungo y, il pancione (l'impugnatura) verso +z, le punte e la corda dietro (z < 0), la freccia verso +z.
import { Fucina, C, sca, cil, con, sfe, ott, ico, toro, poli, cristallo, PIATTA, anima, respira, fiamme, braci, orbita, pulsaLibero } from './fucina.js'

/** I due rami: N aste per lato lungo la curva z(t), t = |y|/H. Torna la z delle punte. */
function rami (f, { H, z, N = 7, r0 = 0.026, r1 = 0.013, col = C.LEGNO, col2 = null, tipo = 'pieno', jit = 0 }) {
  for (const s of [1, -1]) for (let i = 0; i < N; i++) {
    const t0 = i / N, t1 = (i + 1) / N, j = jit * (i % 2 ? 1 : -1) * s
    f.asta([j, s * t0 * H, z(t0)], [-j, s * t1 * H, z(t1)], r0 + (r1 - r0) * t0, r0 + (r1 - r0) * t1, col2 && i % 2 ? col2 : col, tipo, 6)
  }
  return z(1)
}
const corda = (f, H, zc, col = 0xe3d8b8, tipo = 'pieno', r = 0.005) => f.asta([0, -H, zc], [0, H, zc], r, r, col, tipo, 4)
function presa (f, { h = 0.16, r = 0.034, col = C.CUOIO, fascia = C.CUOIO_S, tipo = 'pieno', ftipo = 'pieno' }) {
  f.metti(cil(r, r, h, 7), col, 0, 0, 0, {}, tipo)
  for (const y of [-h * 0.34, h * 0.34]) f.metti(cil(r * 1.1, r * 1.1, 0.013, 7), fascia, 0, y, 0, {}, ftipo)
}
/** La freccia incoccata: dalla corda (zc) fino a zb, all'altezza del pugno (y0). */
function freccia (f, { zc, zb = 0.5, y0 = 0.075, asta = C.LEGNO_C, punta = C.ACCIAIO_S, piume = C.ROSSO, tipoAsta = 'pieno', tipoPunta = 'metallo', tipoPiume = 'pieno', lunga = 0.07 }) {
  f.asta([0, y0, zc], [0, y0, zb], 0.008, 0.008, asta, tipoAsta, 5)
  f.metti(con(0.022, lunga, 4), punta, 0, y0, zb + lunga / 2, { rx: PIATTA }, tipoPunta)
  for (const q of [-1, 1]) {
    f.metti(sca(0.004, 0.04, 0.07), piume, 0, y0 + q * 0.017, zc + 0.05, {}, tipoPiume)
    f.metti(sca(0.04, 0.004, 0.07), piume, q * 0.017, y0, zc + 0.05, {}, tipoPiume)
  }
}

// 1 ─ arco corto: un ramo di nocciolo, storto
function corto () {
  const f = new Fucina(), H = 0.38, z = t => -0.17 * t * t
  rami(f, { H, z, N: 4, r0: 0.026, r1: 0.014, col: C.LEGNO, jit: 0.01 })
  corda(f, H, z(1), 0xcdbf9a)
  presa(f, { h: 0.14, r: 0.03, col: C.CUOIO_S })
  f.metti(sfe(0.022, 5, 4), C.LEGNO_S, 0.016, 0.25, z(0.66) + 0.01, {}, 'pieno')
  freccia(f, { zc: z(1), zb: 0.38, asta: C.LEGNO, punta: C.FERRO_S, piume: C.CREMA })
  return f.chiudi()
}
// 2 ─ arco lungo: alto, quasi dritto, con le cocche di corno
function lungo () {
  const f = new Fucina(), H = 0.72, z = t => -0.15 * t * t
  rami(f, { H, z, N: 8, r0: 0.028, r1: 0.012, col: C.LEGNO_C, col2: C.LEGNO })
  for (const s of [-1, 1]) f.metti(cil(0.016, 0.02, 0.05, 6), C.CREMA, 0, s * H, z(1), {}, 'pieno')
  corda(f, H, z(1) - 0.005)
  presa(f, { h: 0.2, r: 0.033, col: C.CUOIO, fascia: C.ROSSO_S })
  f.metti(sca(0.05, 0.06, 0.045), C.CUOIO_S, 0, 0.13, 0.0, {})
  freccia(f, { zc: z(1), zb: 0.62, y0: 0.11, asta: C.LEGNO_C, punta: C.FERRO, piume: C.BLU, lunga: 0.08 })
  return f.chiudi()
}
// 3 ─ arco composito: rami rivolti all'indietro a becco, osso e tendini, laccato di rosso
function composito () {
  const f = new Fucina(), H = 0.52, z = t => -0.2 * t * t + 1.1 * Math.max(0, t - 0.72) ** 2
  rami(f, { H, z, N: 9, r0: 0.03, r1: 0.014, col: C.ROSSO_S, col2: C.LEGNO_S })
  for (const s of [-1, 1]) {
    f.metti(cil(0.024, 0.03, 0.12, 6), C.CREMA, 0, s * 0.16, 0.0, {})              // placche d'osso accanto alla presa
    f.asta([0, s * H * 0.86, z(0.86)], [0, s * H, z(1)], 0.015, 0.01, C.CREMA, 'pieno', 5)
    f.metti(sfe(0.02, 5, 4), C.OTTONE, 0, s * H, z(1) + 0.01, {}, 'oro')
    for (const t of [0.4, 0.55, 0.7]) f.metti(cil(0.034 - t * 0.02, 0.034 - t * 0.02, 0.014, 6), C.ORO_S, 0, s * t * H, z(t), { rx: 0.4 * s }, 'oro')
  }
  corda(f, H, z(1), 0xe8dcb8)
  presa(f, { h: 0.15, r: 0.036, col: C.BLU_S, fascia: C.ORO, ftipo: 'oro' })
  freccia(f, { zc: z(1), zb: 0.5, asta: C.LEGNO_C, punta: C.ACCIAIO, piume: C.CIANO })
  return f.chiudi()
}
// 4 ─ balestra: fusto di legno lungo, prodo d'acciaio, staffa, quadrello
function balestra () {
  const f = new Fucina(), H = 0.34, zp = 0.4, z = t => zp - 0.1 * t * t
  f.metti(sca(0.05, 0.06, 0.62), C.LEGNO_S, 0, 0.05, 0.08, {})                       // il fusto
  f.metti(sca(0.056, 0.05, 0.1), C.CUOIO_S, 0, 0.06, -0.2, {})                        // il calcio
  f.metti(sca(0.03, 0.04, 0.2), C.FERRO_S, 0, 0.085, 0.14, {}, 'metallo')               // scanalatura
  f.metti(cil(0.03, 0.03, 0.14, 7), C.CUOIO, 0, -0.02, 0, {})                         // l'impugnatura sotto
  f.metti(sca(0.014, 0.07, 0.02), C.FERRO, 0, -0.045, 0.06, { rx: -0.3 }, 'metallo') // il grilletto
  for (const s of [1, -1]) for (let i = 0; i < 6; i++) {
    const t0 = i / 6, t1 = (i + 1) / 6
    f.asta([0, s * t0 * H, z(t0)], [0, s * t1 * H, z(t1)], 0.026 - t0 * 0.012, 0.026 - t1 * 0.012, i % 2 ? C.ACCIAIO_S : C.FERRO, 'metallo', 5)
  }
  f.metti(sca(0.07, 0.1, 0.08), C.FERRO_S, 0, 0.05, zp - 0.01, {}, 'metallo')
  f.metti(toro(0.05, 0.01, 4, 10), C.FERRO, 0, 0.0, zp + 0.06, { rx: PIATTA, s: [0.7, 1, 1.3] }, 'metallo')   // la staffa del piede
  const zc = z(1) - 0.005, zn = 0.1
  f.asta([0, -H, zc], [0, 0.07, zn], 0.005, 0.005, 0xe3d8b8, 'pieno', 4)
  f.asta([0, H, zc], [0, 0.07, zn], 0.005, 0.005, 0xe3d8b8, 'pieno', 4)
  f.asta([0, 0.115, zn], [0, 0.115, zp + 0.18], 0.01, 0.01, C.LEGNO_C, 'pieno', 5)  // il quadrello
  f.metti(con(0.025, 0.08, 4), C.ACCIAIO_S, 0, 0.115, zp + 0.22, { rx: PIATTA }, 'metallo')
  for (const q of [-1, 1]) f.metti(sca(0.004, 0.03, 0.05), C.ROSSO, 0, 0.115 + q * 0.014, zn + 0.04, {})
  f.metti(sfe(0.022, 5, 4), C.OTTONE, 0, H, z(1), {}, 'oro'); f.metti(sfe(0.022, 5, 4), C.OTTONE, 0, -H, z(1), {}, 'oro')
  return f.chiudi()
}
// 5 ─ arco di corno: due corna d'ariete che si arricciano in avanti, pelo e cuoio
function corno () {
  const f = new Fucina(), H = 0.5, z = t => -0.19 * t * t + 0.9 * Math.max(0, t - 0.78) ** 2
  rami(f, { H, z, N: 8, r0: 0.036, r1: 0.012, col: C.CREMA, col2: 0xd8c8a0 })
  for (const s of [1, -1]) for (const t of [0.25, 0.4, 0.55, 0.7]) f.metti(cil(0.038 - t * 0.03, 0.038 - t * 0.03, 0.01, 6), 0x6a5a40, 0, s * t * H, z(t), { rx: s * (0.05 + t * 0.7) })
  for (const s of [1, -1]) f.metti(sfe(0.016, 5, 4), C.BRONZO, 0, s * H, z(1), {}, 'oro')
  corda(f, H, z(1) - 0.0, 0xcdbf9a)
  presa(f, { h: 0.18, r: 0.04, col: C.CUOIO_S, fascia: C.BRONZO, ftipo: 'oro' })
  for (let i = 0; i < 6; i++) { const a = i * 1.1; f.metti(sca(0.02, 0.07, 0.016), 0xcdb890, Math.cos(a) * 0.04, -0.09 - 0.02 * (i % 2), Math.sin(a) * 0.04, { rz: Math.cos(a) * 0.5 }) }   // il ciuffo di pelo
  freccia(f, { zc: z(1), zb: 0.5, asta: C.CORTECCIA, punta: C.CREMA, piume: C.ROSSO_S, tipoPunta: 'pieno' })
  return f.chiudi()
}
// 6 ─ arco elfico: sottile, con le foglie lungo i rami e la corda dorata
function elfico () {
  const f = new Fucina(), H = 0.66, z = t => -0.2 * t * t + 0.5 * Math.max(0, t - 0.8) ** 2
  rami(f, { H, z, N: 9, r0: 0.022, r1: 0.008, col: C.FOGLIA_S, col2: C.ACCIAIO_S, tipo: 'metallo' })
  for (const s of [1, -1]) {
    for (const [t, lung] of [[0.22, 0.1], [0.4, 0.12], [0.58, 0.1], [0.74, 0.08]]) for (const q of [-1, 1]) {
      f.metti(poli([[0, 0], [0.025, 0.04], [0.0, lung], [-0.025, 0.04]], 0.006, 0.001), t > 0.5 ? C.NATURA : C.FOGLIA, q * 0.02, s * t * H, z(t) + 0.01, { rz: -s * q * 1.0 }, 'pieno')
    }
    f.metti(poli([[0, 0], [0.03, 0.06], [0, 0.17], [-0.03, 0.06]], 0.008, 0.001), C.ARGENTO, 0, s * H, z(1), { rx: -0.2 }, 'metallo')   // foglia d'argento sulla punta
    f.metti(ott(0.012), C.NATURA, 0, s * (H * 0.55), z(0.55) + 0.025, {}, 'viva')
  }
  corda(f, H, z(1), C.ORO, 'oro', 0.004)
  presa(f, { h: 0.17, r: 0.028, col: C.FOGLIA_S, fascia: C.ARGENTO, ftipo: 'metallo' })
  f.metti(ott(0.026), C.NATURA, 0, 0.0, 0.032, { s: [1, 1.4, 0.8] }, 'viva')
  freccia(f, { zc: z(1), zb: 0.55, y0: 0.09, asta: C.LEGNO_C, punta: C.ARGENTO, piume: C.NATURA, tipoPiume: 'pieno' })
  const g = f.chiudi(); g.userData.anima = respira(g, 2.4, 0.4, 1.2)
  return g
}
// 7 ─ arco di fuoco: corna nere di basalto, corda di fiamma, freccia che brucia
function fuoco () {
  const f = new Fucina(), H = 0.56, z = t => -0.2 * t * t + 0.8 * Math.max(0, t - 0.75) ** 2
  rami(f, { H, z, N: 8, r0: 0.032, r1: 0.012, col: C.LAVA_S, col2: C.LAVA, tipo: 'metallo' })
  for (const s of [1, -1]) {
    for (const t of [0.3, 0.5, 0.7]) f.metti(ott(0.018), C.FUOCO, 0, s * t * H, z(t) + 0.025, { s: [1, 1.5, 1] }, 'viva')
    f.asta([0, s * H * 0.9, z(0.9)], [0, s * H * 1.05, z(1) + 0.02], 0.015, 0.003, C.FUOCO_R, 'oro', 4)
  }
  f.asta([0, -H, z(1)], [0, H, z(1)], 0.006, 0.006, C.FUOCO_C, 'luce', 4)
  presa(f, { h: 0.17, r: 0.034, col: C.LAVA, fascia: C.FUOCO_R, ftipo: 'metallo' })
  f.metti(sfe(0.03, 6, 5), C.FUOCO, 0, 0, 0.034, { s: [1, 1.2, 0.6] }, 'viva')
  freccia(f, { zc: z(1), zb: 0.52, asta: C.LAVA_S, punta: C.FUOCO_R, piume: C.FUOCO, tipoPunta: 'viva', tipoPiume: 'viva' })
  const fi = fiamme(f, [[0, H + 0.01, z(1)], [0, H * 0.7, z(0.7) + 0.02], [0, 0.075, 0.5 + 0.07]], { h: 0.14, r: 0.03 })
  const br = braci(f, C.FUOCO_C, [-0.05, -0.1, -0.1], [0.1, 0.6, 0.45], { n: 8, vel: 0.4, r: 0.014, sale: 0.28 })
  const g = f.chiudi(); g.userData.anima = anima(respira(g, 5, 0.5, 1.3), fi, br)
  return g
}
// 8 ─ arco di ghiaccio: rami di schegge di cristallo, corda azzurra
function ghiaccio () {
  const f = new Fucina(), H = 0.56, z = t => -0.19 * t * t + 0.6 * Math.max(0, t - 0.78) ** 2
  rami(f, { H, z, N: 8, r0: 0.026, r1: 0.01, col: C.GHIACCIO, col2: C.GHIACCIO_S, tipo: 'metallo' })
  for (const s of [1, -1]) {
    for (const [t, r, h] of [[0.28, 0.018, 0.16], [0.46, 0.016, 0.14], [0.62, 0.014, 0.12]]) f.metti(cristallo(r, h, 4), C.NEVE, 0.012, s * t * H, z(t) - 0.02, { rz: s * 0.5, rx: -0.4 }, 'metallo')
    f.metti(cristallo(0.022, 0.12, 5), C.GHIACCIO_L, 0, s * (H + 0.04), z(1), { rz: s * 0.15 }, 'viva')
  }
  f.asta([0, -H, z(1)], [0, H, z(1)], 0.005, 0.005, C.GHIACCIO_L, 'luce', 4)
  presa(f, { h: 0.17, r: 0.032, col: C.GHIACCIO_S, fascia: C.NEVE, ftipo: 'metallo' })
  f.metti(cristallo(0.03, 0.1, 5), C.GHIACCIO_L, 0, 0, 0.034, {}, 'viva')
  freccia(f, { zc: z(1), zb: 0.52, asta: C.NEVE, punta: C.GHIACCIO_L, piume: C.GHIACCIO, tipoPunta: 'viva', tipoPiume: 'metallo' })
  const br = braci(f, C.NEVE, [-0.06, -0.5, -0.12], [0.12, 1.0, 0.5], { n: 10, vel: 0.22, r: 0.013, sale: -0.18 })
  const g = f.chiudi(); g.userData.anima = anima(respira(g, 2, 0.5, 1.2), br)
  return g
}
// 9 ─ arco d'ombra: rami ritorti come artigli, corda viola, volute che orbitano
function ombra () {
  const f = new Fucina(), H = 0.58, z = t => -0.2 * t * t + 0.7 * Math.max(0, t - 0.8) ** 2 + 0.03 * Math.sin(t * 9)
  rami(f, { H, z, N: 10, r0: 0.03, r1: 0.008, col: C.OMBRA, col2: C.OMBRA_S, tipo: 'metallo', jit: 0.012 })
  for (const s of [1, -1]) {
    for (const t of [0.25, 0.45, 0.65]) f.metti(con(0.02, 0.1, 4), C.OMBRA_M, 0.02, s * t * H, z(t) - 0.02, { rz: -s * 2.3, rx: 0.4 }, 'metallo')   // spine
    f.metti(con(0.02, 0.12, 4), C.OMBRA_L, 0, s * (H + 0.05), z(1), { rz: s > 0 ? 0 : Math.PI }, 'viva')
  }
  f.asta([0, -H, z(1)], [0, H, z(1)], 0.005, 0.005, C.OMBRA_L, 'luce', 4)
  presa(f, { h: 0.17, r: 0.034, col: C.OMBRA_S, fascia: C.OMBRA_M, ftipo: 'metallo' })
  f.metti(ott(0.03), C.OMBRA_L, 0, 0, 0.036, { s: [1, 1.5, 0.8] }, 'viva')
  freccia(f, { zc: z(1), zb: 0.52, asta: C.OMBRA_S, punta: C.OMBRA_L, piume: C.OMBRA_M, tipoPunta: 'viva', tipoPiume: 'metallo' })
  const o = orbita(f, C.OMBRA_L, [0, 0, 0.05], 0.32, { n: 4, vel: 0.9, r: 0.025, inc: 0.9, geo: () => ico(0.025, 0) })
  const br = braci(f, C.OMBRA_M, [-0.08, -0.5, -0.15], [0.16, 1.0, 0.4], { n: 8, vel: 0.28, r: 0.02, sale: 0.2 })
  const g = f.chiudi(); g.userData.anima = anima(respira(g, 2.8, 0.45, 1.1), o, br)
  return g
}
// 10 ─ arco di luce: oro con ali di piume alle punte, corda di luce, una freccia che sa di sole
function luce () {
  const f = new Fucina(), H = 0.6, z = t => -0.21 * t * t + 0.8 * Math.max(0, t - 0.78) ** 2
  rami(f, { H, z, N: 9, r0: 0.032, r1: 0.014, col: C.ORO, col2: C.ORO_S, tipo: 'oro' })
  for (const s of [1, -1]) {
    for (let i = 0; i < 5; i++) {                                                  // l'ala: cinque penne a ventaglio dalla punta
      const a = (i - 2) * 0.28, lung = 0.2 - Math.abs(i - 2) * 0.03
      f.metti(poli([[0, 0], [0.03, lung * 0.5], [0, lung], [-0.03, lung * 0.5]], 0.008, 0.001), i % 2 ? C.NEVE : C.LUCE, 0, s * (H * 0.74), z(0.74) + 0.015, { rz: s > 0 ? -a * 0.6 : Math.PI + a * 0.6, rx: -0.2 }, 'metallo')
    }
    f.metti(ott(0.022), C.LUCE, 0, s * H, z(1), { s: [1, 1.4, 1] }, 'viva')
    for (const t of [0.3, 0.5]) f.metti(ott(0.015), C.CIANO, 0, s * t * H, z(t) + 0.03, { s: [1, 1.5, 1] }, 'viva')
  }
  f.asta([0, -H, z(1)], [0, H, z(1)], 0.006, 0.006, C.LUCE, 'luce', 4)
  presa(f, { h: 0.17, r: 0.034, col: C.BLU_S, fascia: C.ORO, ftipo: 'oro' })
  f.metti(sfe(0.045, 8, 6), C.ORO, 0, 0, 0.03, { s: [1, 1.2, 0.8] }, 'oro')
  f.metti(ott(0.03), C.LUCE, 0, 0, 0.065, { s: [1, 1.4, 0.8] }, 'viva')
  freccia(f, { zc: z(1), zb: 0.55, asta: C.ORO, punta: C.LUCE, piume: C.NEVE, tipoAsta: 'oro', tipoPunta: 'viva', tipoPiume: 'metallo' })
  const alone = f.libero(toro(0.2, 0.007, 4, 28), C.LUCE, 0, 0, 0.0, 1.3)
  const sc = braci(f, C.LUCE, [-0.1, -0.5, -0.15], [0.2, 1.0, 0.5], { n: 12, vel: 0.3, r: 0.016, sale: 0.3 })
  const g = f.chiudi(); g.userData.anima = anima(respira(g, 3, 0.5, 1.3), sc, t => { alone.rotation.set(0.3, t * 0.7, t * 0.4) })
  return g
}

export const ARCHI = [
  ['arco-corto', 'Arco corto', 1, 'nessuno', corto],
  ['arco-lungo', 'Arco lungo', 2, 'nessuno', lungo],
  ['arco-composito', 'Arco composito', 3, 'nessuno', composito],
  ['balestra', 'Balestra', 4, 'nessuno', balestra],
  ['arco-corno', 'Arco di corno', 5, 'nessuno', corno],
  ['arco-elfico', 'Arco elfico', 6, 'natura', elfico],
  ['arco-fuoco', 'Arco di fuoco', 7, 'fuoco', fuoco],
  ['arco-ghiaccio', 'Arco di ghiaccio', 8, 'ghiaccio', ghiaccio],
  ['arco-ombra', "Arco d'ombra", 9, 'ombra', ombra],
  ['arco-luce', 'Arco di luce', 10, 'luce', luce]
]
