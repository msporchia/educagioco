// Generato da strumenti/promuovi-3d.mjs da poc/armi-3d/collezione-spade.js: non si tocca a mano (si cambia il prototipo e si rilancia `npm run promuovi3d`).
// La collezione: dieci spade, dalla più umile alla leggendaria. Origine nel pugno, lama verso +y, facce piatte verso ±z.
import { Fucina, C, sca, cil, con, sfe, ott, ico, toro, poli, cristallo, PIATTA, anima, respira, fiamme, braci } from './fucina.js'

/** Una lama dritta (profilo estruso): da y0 a y1, larghezza w (in punta w2), punta lunga `punta`. */
function lama (f, { y0, y1, w, w2 = w, punta = 0.1, prof = 0.024, col = C.ACCIAIO, tipo = 'metallo', x = 0, z = 0, bev = 0.004 }) {
  f.metti(poli([[-w / 2, y0], [w / 2, y0], [w2 / 2, y1], [0, y1 + punta], [-w2 / 2, y1]], prof, bev), col, x, 0, z, {}, tipo)
}
/** Una lama curva (scimitarra): la curva va verso +x, il profilo si stringe in punta. */
function lamaCurva (f, { y0, L, curva, w0, prof = 0.022, col = C.ACCIAIO, tipo = 'metallo', N = 8 }) {
  const dx = [], sx = []
  for (let i = 0; i <= N; i++) {
    const u = i / N, c = curva * u * u, w = w0 * (1 + 0.32 * Math.sin(Math.PI * Math.min(1, u * 1.1))) * (1 - u ** 3)
    dx.push([c + w, y0 + L * u]); sx.push([c - w, y0 + L * u])
  }
  f.metti(poli([...dx, ...sx.reverse()], prof, 0.004), col, 0, 0, 0, {}, tipo)
}
function presa (f, { y0 = -0.12, y1 = 0.05, r = 0.024, col = C.CUOIO, fasce = C.CUOIO_S, n = 3, tipo = 'pieno', ftipo = 'pieno' }) {
  const h = y1 - y0
  f.metti(cil(r, r, h, 8), col, 0, (y0 + y1) / 2, 0, {}, tipo)
  for (let i = 0; i < n; i++) f.metti(cil(r * 1.12, r * 1.12, 0.014, 8), fasce, 0, y0 + h * (i + 0.5) / n, 0, {}, ftipo)
}

// 1 ─ pugnale: ferro grezzo, impugnatura di legno
function pugnale () {
  const f = new Fucina()
  presa(f, { y0: -0.1, y1: 0.05, r: 0.022, col: C.LEGNO_S, fasce: C.CUOIO_S, n: 2 })
  f.metti(ico(0.03), C.FERRO_S, 0, -0.115, 0, { s: [1, 0.9, 1] })
  f.metti(sca(0.11, 0.028, 0.04), C.FERRO_S, 0, 0.062, 0, { rz: 0.05 })
  f.metti(poli([[-0.036, 0.075], [0.036, 0.075], [0.03, 0.25], [0.002, 0.34], [-0.03, 0.25]], 0.018, 0.003), C.FERRO, 0, 0, 0, { rz: 0.02 }, 'metallo')
  f.metti(sca(0.012, 0.15, 0.021), C.FERRO_S, 0, 0.17, 0, {}, 'metallo')
  return f.chiudi()
}
// 2 ─ spada corta: cuoio e pomo d'ottone
function spadaCorta () {
  const f = new Fucina()
  presa(f, { y0: -0.13, y1: 0.05, r: 0.023, col: C.CUOIO, n: 3 })
  f.metti(sfe(0.04), C.OTTONE, 0, -0.15, 0, {}, 'oro')
  f.metti(sca(0.18, 0.032, 0.046), C.FERRO_S, 0, 0.066, 0, {}, 'metallo')
  lama(f, { y0: 0.08, y1: 0.46, w: 0.085, w2: 0.07, punta: 0.11, prof: 0.022 })
  f.metti(sca(0.02, 0.36, 0.028), C.ACCIAIO_S, 0, 0.27, 0, {}, 'metallo')      // sguscio
  return f.chiudi()
}
// 3 ─ spada lunga: guardia a braccia con palline, lama a sguscio, pomo a disco
function spadaLunga () {
  const f = new Fucina()
  presa(f, { y0: -0.15, y1: 0.05, r: 0.024, col: C.ROSSO_S, fasce: C.OTTONE, ftipo: 'oro', n: 4 })
  f.metti(cil(0.05, 0.05, 0.03, 10), C.OTTONE, 0, -0.17, 0, {}, 'oro')
  f.metti(sca(0.07, 0.04, 0.06), C.ACCIAIO_S, 0, 0.07, 0, {}, 'metallo')
  for (const s of [-1, 1]) {
    f.asta([s * 0.03, 0.07, 0], [s * 0.16, 0.055, 0], 0.022, 0.017, C.ACCIAIO_S, 'metallo', 6)
    f.metti(sfe(0.03), C.OTTONE, s * 0.17, 0.052, 0, {}, 'oro')
  }
  lama(f, { y0: 0.09, y1: 0.62, w: 0.1, w2: 0.085, punta: 0.14, prof: 0.024 })
  f.metti(poli([[-0.016, 0.1], [0.016, 0.1], [0.012, 0.58], [-0.012, 0.58]], 0.03, 0.002), C.ACCIAIO_S, 0, 0, 0, {}, 'metallo')   // sguscio
  return f.chiudi()
}
// 4 ─ scimitarra: lama panciuta e curva, guardia a disco, fascia rossa
function scimitarra () {
  const f = new Fucina()
  presa(f, { y0: -0.12, y1: 0.05, r: 0.022, col: C.ROSSO, fasce: C.ORO_S, n: 3 })
  f.metti(sfe(0.034, 7, 5), C.ORO, 0.0, -0.14, 0, { s: [1, 0.8, 1] }, 'oro')
  f.metti(cil(0.07, 0.07, 0.02, 10), C.ORO, 0, 0.065, 0, {}, 'oro')
  f.metti(sca(0.17, 0.02, 0.026), C.ORO_S, 0, 0.06, 0, {}, 'oro')
  lamaCurva(f, { y0: 0.075, L: 0.64, curva: 0.14, w0: 0.052, prof: 0.02 })
  f.metti(poli([[0.0, 0.09], [0.012, 0.09], [0.058, 0.5], [0.05, 0.5]], 0.026, 0.002), C.ACCIAIO_S, 0, 0, 0, {}, 'metallo')   // filo falso
  return f.chiudi()
}
// 5 ─ stocco: lama sottile come uno spillo, elsa a coppa e ponte, tutto ottone
function stocco () {
  const f = new Fucina()
  presa(f, { y0: -0.1, y1: 0.04, r: 0.016, col: C.BLU_S, fasce: C.ARGENTO, ftipo: 'metallo', n: 5 })
  f.metti(sfe(0.034, 8, 6), C.ORO, 0, -0.125, 0, {}, 'oro')
  f.metti(sfe(0.1, 10, 4), C.OTTONE, 0, 0.06, 0, { s: [1, 0.9, 1] }, 'oro')                // la coppa (cupola che copre la mano)
  f.metti(cil(0.101, 0.101, 0.012, 10), C.ORO_S, 0, 0.058, 0, {}, 'oro')
  f.fila([[0.09, 0.06, 0], [0.12, -0.02, 0], [0.09, -0.1, 0], [0.03, -0.13, 0]], 0.011, 0.011, C.ORO, 'oro', 4)                                   // ponte
  for (const s of [-1, 1]) f.asta([s * 0.05, 0.115, 0], [s * 0.15, 0.15, 0], 0.012, 0.007, C.ORO, 'oro', 4)
  f.asta([0, 0.11, 0], [0, 0.88, 0], 0.016, 0.004, C.ARGENTO, 'metallo', 4)
  f.metti(sca(0.04, 0.05, 0.04), C.ORO_S, 0, 0.12, 0, {}, 'oro')
  f.metti(ott(0.022), C.RUBINO, 0, 0.1, 0.095, { s: [1, 1.2, 0.8] }, 'luce')
  return f.chiudi()
}
// 6 ─ spada a due mani: lunga, larga, con l'elsa lunga e la guardia grande
function dueMani () {
  const f = new Fucina()
  presa(f, { y0: -0.3, y1: 0.05, r: 0.028, col: C.OMBRA_S, fasce: C.FERRO, ftipo: 'metallo', n: 6 })
  f.metti(cil(0.065, 0.065, 0.04, 10), C.FERRO, 0, -0.33, 0, { rx: 0 }, 'metallo')
  f.metti(sfe(0.04), C.FERRO_S, 0, -0.36, 0, {}, 'metallo')
  f.metti(sca(0.12, 0.05, 0.07), C.FERRO_S, 0, 0.08, 0, {}, 'metallo')
  for (const s of [-1, 1]) {
    f.asta([s * 0.05, 0.08, 0], [s * 0.2, 0.06, 0], 0.03, 0.02, C.FERRO, 'metallo', 6)
    f.metti(con(0.028, 0.08, 4), C.FERRO, s * 0.235, 0.06, 0, { rz: -s * PIATTA }, 'metallo')
  }
  lama(f, { y0: 0.1, y1: 0.18, w: 0.1, prof: 0.03, col: C.FERRO_S })             // il ricasso
  lama(f, { y0: 0.18, y1: 0.92, w: 0.15, w2: 0.11, punta: 0.18, prof: 0.028 })
  f.metti(poli([[-0.03, 0.2], [0.03, 0.2], [0.02, 0.86], [-0.02, 0.86]], 0.033, 0.002), C.ACCIAIO_S, 0, 0, 0, {}, 'metallo')
  return f.chiudi()
}
// 7 ─ claymore: braccia inclinate verso la punta con trifogli, impugnatura rossa, anello al pomo
function claymore () {
  const f = new Fucina()
  presa(f, { y0: -0.24, y1: 0.05, r: 0.026, col: C.ROSSO_S, fasce: C.ACCIAIO_S, ftipo: 'metallo', n: 5 })
  f.metti(toro(0.045, 0.014, 5, 12), C.ACCIAIO, 0, -0.29, 0, {}, 'metallo')
  f.metti(sca(0.1, 0.05, 0.065), C.ACCIAIO_S, 0, 0.075, 0, {}, 'metallo')
  for (const s of [-1, 1]) {
    f.asta([s * 0.04, 0.07, 0], [s * 0.21, 0.15, 0], 0.026, 0.02, C.ACCIAIO, 'metallo', 6)
    for (let k = 0; k < 4; k++) { const a = k * PIATTA; f.metti(sfe(0.022, 6, 4), C.ORO, s * 0.225 + Math.cos(a) * 0.03, 0.155 + Math.sin(a) * 0.03, 0, {}, 'oro') }
    f.metti(sfe(0.03, 6, 4), C.ORO, s * 0.222, 0.153, 0, {}, 'oro')
  }
  lama(f, { y0: 0.1, y1: 0.78, w: 0.13, w2: 0.1, punta: 0.15, prof: 0.027 })
  f.metti(poli([[-0.025, 0.12], [0.025, 0.12], [0.018, 0.7], [-0.018, 0.7]], 0.032, 0.002), C.ACCIAIO_S, 0, 0, 0, {}, 'metallo')
  f.metti(ott(0.03), C.RUBINO, 0, 0.075, 0.045, { s: [1, 1.3, 0.8] }, 'luce')
  return f.chiudi()
}
// 8 ─ lama di fuoco: acciaio nero con vena di brace, fiamme che guizzano sul filo
function lamaFuoco () {
  const f = new Fucina()
  presa(f, { y0: -0.14, y1: 0.05, r: 0.025, col: C.LAVA, fasce: C.FUOCO_R, ftipo: 'metallo', n: 4 })
  f.metti(ico(0.05), C.LAVA_S, 0, -0.17, 0, {}, 'metallo')
  f.metti(ott(0.032), C.FUOCO_C, 0, -0.17, 0.04, { s: [1, 1.2, 0.8] }, 'viva')
  f.metti(sca(0.08, 0.05, 0.06), C.LAVA_S, 0, 0.07, 0, {}, 'metallo')
  for (const s of [-1, 1]) {                                                                    // corna della guardia
    f.fila([[s * 0.05, 0.065, 0], [s * 0.15, 0.04, 0], [s * 0.2, 0.1, 0], [s * 0.19, 0.2, 0]], 0.03, 0.007, C.LAVA_S, 'metallo', 5)
    f.metti(ott(0.018), C.FUOCO_C, s * 0.15, 0.04, 0.03, {}, 'viva')
  }
  // lama a fiamma: bordi dentati, rossa scura, con vena viva
  const dx = [], sx = []
  const N = 12
  for (let i = 0; i <= N; i++) { const u = i / N, y = 0.09 + 0.8 * u, w = (0.065 + 0.03 * Math.sin(u * Math.PI * 0.9)) * (1 - u ** 2.5) * (i % 2 ? 1.0 : 0.78); dx.push([w, y]); sx.push([-w, y]) }
  f.metti(poli([...dx, ...sx.reverse()], 0.022, 0.003), C.LAVA_S, 0, 0, 0, {}, 'metallo')
  f.metti(poli([[-0.018, 0.12], [0.018, 0.12], [0.012, 0.6], [0, 0.8], [-0.012, 0.6]], 0.03, 0.002), C.FUOCO_R, 0, 0, 0, {}, 'viva')
  const fi = fiamme(f, [[-0.04, 0.2, 0.0], [0.045, 0.34, 0], [-0.045, 0.48, 0], [0.04, 0.62, 0], [0, 0.82, 0.0]], { h: 0.14, r: 0.04 })
  const br = braci(f, C.FUOCO_C, [-0.08, 0.2, -0.05], [0.16, 0.7, 0.1], { n: 8, vel: 0.45, r: 0.016, sale: 0.28 })
  const g = f.chiudi(); g.userData.anima = anima(respira(g, 5, 0.5, 1.3), fi, br)
  return g
}
// 9 ─ lama di ghiaccio: scheggia di cristallo con denti di brina e fiocchi che cadono
function lamaGhiaccio () {
  const f = new Fucina()
  presa(f, { y0: -0.13, y1: 0.05, r: 0.024, col: C.GHIACCIO_S, fasce: C.NEVE, ftipo: 'metallo', n: 4 })
  f.metti(cristallo(0.04, 0.12, 5), C.GHIACCIO, 0, -0.18, 0, {}, 'metallo')
  f.metti(sca(0.1, 0.04, 0.06), C.ACCIAIO_S, 0, 0.07, 0, {}, 'metallo')
  for (const s of [-1, 1]) {
    f.metti(cristallo(0.026, 0.2, 4), C.NEVE, s * 0.1, 0.12, 0, { rz: -s * 0.9 }, 'metallo')
    f.metti(cristallo(0.018, 0.12, 4), C.GHIACCIO, s * 0.07, 0.05, 0.02, { rz: s * 1.5 }, 'metallo')
  }
  // lama a dentellatura di cristallo
  const dx = [], sx = []
  for (let i = 0; i <= 10; i++) { const u = i / 10, y = 0.09 + 0.78 * u, w = (0.07 + 0.02 * Math.sin(u * 3)) * (1 - u ** 3) * (i % 2 ? 1 : 0.72); dx.push([w, y]); sx.push([-w, y]) }
  f.metti(poli([...dx, ...sx.reverse()], 0.024, 0.004), C.GHIACCIO, 0, 0, 0, {}, 'metallo')
  f.metti(poli([[-0.02, 0.12], [0.02, 0.12], [0.014, 0.62], [0, 0.82], [-0.014, 0.62]], 0.032, 0.002), C.GHIACCIO_L, 0, 0, 0, {}, 'viva')
  for (const [x, y, r, h] of [[0.05, 0.3, 0.014, 0.1], [-0.052, 0.5, 0.013, 0.09], [0.04, 0.62, 0.011, 0.08]]) f.metti(cristallo(r, h, 4), C.NEVE, x, y, 0, { rz: Math.sign(x) * -0.7 }, 'metallo')
  const br = braci(f, C.NEVE, [-0.09, 0.3, -0.05], [0.18, 0.6, 0.1], { n: 8, vel: 0.3, r: 0.014, sale: -0.2 })
  const g = f.chiudi(); g.userData.anima = anima(respira(g, 2.2, 0.5, 1.2), br)
  return g
}
// 10 ─ la spada leggendaria: disco solare per guardia, lama di luce filata d'oro, anelli di luce che salgono
function leggendaria () {
  const f = new Fucina()
  presa(f, { y0: -0.2, y1: 0.05, r: 0.026, col: C.BLU_S, fasce: C.ORO, ftipo: 'oro', n: 5 })
  f.metti(cil(0.06, 0.06, 0.04, 12), C.ORO, 0, -0.23, 0, {}, 'oro')
  f.metti(ott(0.05), C.LUCE, 0, -0.29, 0, { s: [1, 1.3, 1] }, 'viva')
  f.metti(cil(0.095, 0.095, 0.03, 16), C.ORO, 0, 0.09, 0, { rx: PIATTA }, 'oro')            // il sole
  f.metti(cil(0.06, 0.06, 0.045, 12), C.ORO_S, 0, 0.09, 0, { rx: PIATTA }, 'oro')
  f.metti(sfe(0.04, 8, 5), C.LUCE, 0, 0.09, 0.03, { s: [1, 1, 0.6] }, 'viva')
  for (let i = 0; i < 8; i++) {                                                                // i raggi
    const a = i * Math.PI / 4 + Math.PI / 8, c = Math.cos(a), s = Math.sin(a)
    f.metti(con(0.026, i % 2 ? 0.1 : 0.15, 4), i % 2 ? C.ORO_S : C.ORO, c * 0.14, 0.09 + s * 0.14, 0, { rz: a - PIATTA }, 'oro')
  }
  for (const s of [-1, 1]) f.fila([[s * 0.15, 0.09, 0], [s * 0.26, 0.03, 0], [s * 0.3, -0.05, 0]], 0.02, 0.008, C.ORO, 'oro', 4)
  lama(f, { y0: 0.12, y1: 0.9, w: 0.16, w2: 0.1, punta: 0.24, prof: 0.028, col: C.ARGENTO })
  f.metti(poli([[-0.034, 0.14], [0.034, 0.14], [0.02, 0.86], [0, 1.08], [-0.02, 0.86]], 0.036, 0.003), C.LUCE, 0, 0, 0, {}, 'viva')
  for (const s of [-1, 1]) f.metti(poli([[s * 0.082, 0.13], [s * 0.095, 0.13], [s * 0.056, 0.9], [s * 0.05, 0.9]], 0.032, 0.002), C.ORO, 0, 0, 0, {}, 'oro')
  const anelli = [0, 1].map(i => f.libero(toro(0.13 - i * 0.02, 0.008, 4, 20), C.LUCE, 0, 0.3, 0, 1.4))
  for (const a of anelli) a.rotation.x = PIATTA
  const sc = braci(f, C.LUCE, [-0.1, 0.15, -0.06], [0.2, 0.8, 0.12], { n: 10, vel: 0.35, r: 0.017, sale: 0.3 })
  const g = f.chiudi()
  g.userData.anima = anima(respira(g, 3, 0.5, 1.3), sc, t => anelli.forEach((a, i) => { const u = (t * 0.35 + i * 0.5) % 1; a.position.y = 0.2 + u * 0.8; a.scale.setScalar(0.5 + 0.5 * Math.sin(u * Math.PI)); a.material.emissiveIntensity = 1.6 * Math.sin(u * Math.PI) }))
  return g
}

export const SPADE = [
  ['pugnale', 'Pugnale', 1, 'nessuno', pugnale],
  ['spada-corta', 'Spada corta', 2, 'nessuno', spadaCorta],
  ['spada-lunga', 'Spada lunga', 3, 'nessuno', spadaLunga],
  ['scimitarra', 'Scimitarra', 4, 'nessuno', scimitarra],
  ['stocco', 'Stocco', 5, 'nessuno', stocco],
  ['due-mani', 'Spada a due mani', 6, 'nessuno', dueMani],
  ['claymore', 'Claymore', 7, 'nessuno', claymore],
  ['lama-fuoco', 'Lama di fuoco', 8, 'fuoco', lamaFuoco],
  ['lama-ghiaccio', 'Lama di ghiaccio', 9, 'ghiaccio', lamaGhiaccio],
  ['spada-leggendaria', 'Spada leggendaria', 10, 'luce', leggendaria]
]
