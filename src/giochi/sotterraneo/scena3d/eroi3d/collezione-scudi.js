// Generato da strumenti/promuovi-3d.mjs da poc/armi-3d/collezione-scudi.js: non si tocca a mano (si cambia il prototipo e si rilancia `npm run promuovi3d`).
// La collezione: dieci scudi. La faccia guarda +z; il centro sta sopra e davanti al braccio che lo regge (`chiudi(offset)`).
import { Fucina, C, sca, cil, con, sfe, ott, ico, toro, poli, profiloScudo, cristallo, PIATTA, anima, respira, braci, orbita, pulsaLibero } from './fucina.js'

const scala = (pts, k, dy = 0) => pts.map(([x, y]) => [x * k, y * k + dy])
const OFF = [-0.05, 0.12, 0.14]
/** Il corpo e il bordo di uno scudo dal profilo: il corpo sporge davanti al bordo (niente facce coplanari). */
function corpo (f, pts, { col, bordo, k = 0.86, prof = 0.05, tc = 'pieno', tb = 'metallo' }) {
  f.metti(poli(pts, prof, 0.006), bordo, 0, 0, 0, {}, tb)
  f.metti(poli(scala(pts, k), prof + 0.014, 0.004), col, 0, 0, 0, {}, tc)
}
/** La presa dietro: una cinghia di cuoio e la maniglia (stanno a z negativo, fuori vista da davanti). */
function presa (f, y = 0) {
  f.metti(sca(0.05, 0.05, 0.05), C.CUOIO, 0, y, -0.05)
  f.metti(sca(0.2, 0.03, 0.02), C.CUOIO_S, 0, y + 0.1, -0.04)
}
function borchie (f, pts, col = C.OTTONE, tipo = 'oro', r = 0.016, z = 0.04) { for (const [x, y] of pts) f.metti(sfe(r, 5, 4), col, x, y, z, { s: [1, 1, 0.6] }, tipo) }
const cerchio = (n, R, ph = 0) => Array.from({ length: n }, (_, i) => [Math.cos(i * 2 * Math.PI / n + ph) * R, Math.sin(i * 2 * Math.PI / n + ph) * R])

// 1 ─ rotella di legno: assi, un cerchio di ferro, un umbone
function rotella () {
  const f = new Fucina()
  f.metti(cil(0.21, 0.21, 0.04, 12), C.LEGNO, 0, 0, 0, { rx: PIATTA })
  for (const x of [-0.14, -0.07, 0, 0.07, 0.14]) f.metti(sca(0.008, 2 * Math.sqrt(0.21 ** 2 - x * x) - 0.02, 0.012), C.LEGNO_S, x, 0, 0.022)
  f.metti(toro(0.21, 0.014, 4, 14), C.FERRO_S, 0, 0, 0, {}, 'metallo')
  f.metti(sfe(0.06, 7, 5), C.FERRO, 0, 0, 0.02, { s: [1, 1, 0.5] }, 'metallo')
  presa(f)
  return f.chiudi(OFF)
}
// 2 ─ scudo a goccia: legno a strisce con fasce di ferro e una bordatura
function goccia () {
  const f = new Fucina()
  const pts = profiloScudo(0.27, -0.3, t => 0.21 * (1 - t ** 2.4), 8)
  corpo(f, pts, { col: C.LEGNO_C, bordo: C.FERRO_S, k: 0.92 })
  for (const x of [-0.1, 0, 0.1]) f.metti(sca(0.008, 0.46 * (1 - Math.abs(x) * 2), 0.012), C.LEGNO_S, x, 0.0, 0.033)
  f.metti(sca(0.38, 0.034, 0.02), C.FERRO_S, 0, 0.12, 0.035, {}, 'metallo')
  f.metti(sca(0.035, 0.5, 0.02), C.FERRO_S, 0, 0.0, 0.035, {}, 'metallo')
  f.metti(sfe(0.055, 7, 5), C.FERRO, 0, 0.05, 0.04, { s: [1, 1, 0.6] }, 'metallo')
  presa(f, 0.05)
  return f.chiudi(OFF)
}
// 3 ─ scudo rotondo ferrato: campo rosso e anello bianco, otto fasce di ferro, grande umbone
function rotondo () {
  const f = new Fucina()
  f.metti(cil(0.28, 0.28, 0.05, 16), C.FERRO_S, 0, 0, 0, { rx: PIATTA }, 'metallo')
  f.metti(cil(0.25, 0.25, 0.066, 16), C.ROSSO, 0, 0, 0, { rx: PIATTA })
  f.metti(toro(0.19, 0.016, 4, 20), C.CREMA, 0, 0, 0.034, {})
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + Math.PI / 8; f.metti(sca(0.14, 0.03, 0.016), C.FERRO, Math.cos(a) * 0.16, Math.sin(a) * 0.16, 0.036, { rz: a }, 'metallo') }
  f.metti(sfe(0.1, 10, 6), C.ACCIAIO_S, 0, 0, 0.03, { s: [1, 1, 0.65] }, 'metallo')
  f.metti(ott(0.04), C.FERRO, 0, 0, 0.08, { s: [1, 1, 0.7] }, 'metallo')
  borchie(f, cerchio(12, 0.265, 0.1), C.ACCIAIO, 'metallo', 0.014, 0.03)
  presa(f)
  return f.chiudi(OFF)
}
// 4 ─ scudo a torre: alto quasi quanto un bambino, assi, tre fasce, feritoia
function torre () {
  const f = new Fucina()
  const pts = [[-0.21, -0.38], [0.21, -0.38], [0.21, 0.3], [0.16, 0.38], [0.0, 0.42], [-0.16, 0.38], [-0.21, 0.3]]
  corpo(f, pts, { col: C.LEGNO_S, bordo: C.FERRO, k: 0.88, prof: 0.056 })
  for (const x of [-0.12, -0.04, 0.04, 0.12]) f.metti(sca(0.006, 0.7, 0.012), C.CUOIO_S, x, -0.0, 0.04)
  for (const y of [-0.28, 0.0, 0.28]) f.metti(sca(0.4, 0.04, 0.02), C.FERRO_S, 0, y, 0.04, {}, 'metallo')
  f.metti(sca(0.1, 0.014, 0.02), C.OMBRA_S, 0, 0.18, 0.042)                         // la feritoia
  borchie(f, [[-0.17, -0.28], [0.17, -0.28], [-0.17, 0], [0.17, 0], [-0.17, 0.28], [0.17, 0.28]], C.ACCIAIO_S, 'metallo', 0.016, 0.052)
  f.metti(sfe(0.05, 6, 5), C.FERRO, 0, -0.1, 0.04, { s: [1, 1, 0.6] }, 'metallo')
  presa(f, -0.1)
  return f.chiudi([-0.05, 0.16, 0.14])
}
// 5 ─ scudo del cavaliere: campo azzurro, bordo d'oro, capo-del-cavaliere e tre tondi
function cavaliere () {
  const f = new Fucina()
  const pts = profiloScudo(0.29, -0.32, t => 0.25 * (1 - t ** 2.6), 8)
  corpo(f, pts, { col: C.BLU, bordo: C.ORO, tb: 'oro' })
  f.metti(poli([[-0.2, 0.2], [0, 0.04], [0.2, 0.2], [0.2, 0.12], [0, -0.04], [-0.2, 0.12]], 0.02, 0.002), C.ORO, 0, 0.0, 0.04, {}, 'oro')   // il capriolo
  for (const [x, y] of [[-0.12, 0.2], [0.12, 0.2], [0, -0.14]]) f.metti(cil(0.036, 0.036, 0.016, 10), C.CREMA, x, y, 0.045, { rx: PIATTA }, 'oro')
  f.metti(poli([[-0.2, 0.16], [0.2, 0.16], [0.2, 0.25], [-0.2, 0.25]], 0.02, 0.001), C.ROSSO, 0, 0.0, 0.034)
  borchie(f, [[-0.2, 0.2], [0.2, 0.2], [-0.15, -0.12], [0.15, -0.12], [0, -0.28]], C.ORO, 'oro', 0.015, 0.04)
  f.metti(ott(0.03), C.RUBINO, 0, 0.09, 0.052, { s: [1, 1.3, 0.7] }, 'luce')
  presa(f, 0.0)
  return f.chiudi(OFF)
}
// 6 ─ scudo nanico: largo e squadrato, bronzo e ferro, rune azzurre attorno al martello
function nanico () {
  const f = new Fucina()
  const pts = [[-0.24, 0.28], [0.24, 0.28], [0.3, 0.18], [0.3, -0.04], [0.17, -0.27], [-0.17, -0.27], [-0.3, -0.04], [-0.3, 0.18]]
  corpo(f, pts, { col: C.FERRO_S, bordo: C.BRONZO, tb: 'oro', k: 0.86, prof: 0.056 })
  f.metti(poli(scala(pts, 0.62, 0.01), 0.02, 0.003), C.FERRO, 0, 0, 0.03, {}, 'metallo')
  f.metti(sca(0.05, 0.22, 0.03), C.CUOIO_S, 0, 0.0, 0.07)                                 // il manico del martello inciso
  f.metti(sca(0.18, 0.09, 0.03), C.BRONZO, 0, 0.1, 0.07, {}, 'oro')
  for (let i = 0; i < 8; i++) {
    const [x, y] = cerchio(8, 0.2, 0.2)[i]
    f.metti(sca(0.014, 0.05, 0.012), C.CIANO, x * 1.0, y * 0.9 + 0.0, 0.05, { rz: i * 0.75 }, 'viva')
  }
  borchie(f, [[-0.25, 0.2], [0.25, 0.2], [-0.25, -0.04], [0.25, -0.04], [-0.11, -0.22], [0.11, -0.22]], C.BRONZO, 'oro', 0.02, 0.05)
  presa(f)
  const g = f.chiudi(OFF); g.userData.anima = respira(g, 2.4, 0.5, 1.2)
  return g
}
// 7 ─ scudo d'ombra: disco a punte di buio, un occhio che si apre al centro, fumo che sale
function ombra () {
  const f = new Fucina()
  const stella = []
  for (let i = 0; i < 24; i++) { const a = i * Math.PI / 12, r = i % 2 ? 0.25 : 0.34; stella.push([Math.cos(a) * r, Math.sin(a) * r]) }
  f.metti(poli(stella, 0.05, 0.004), C.OMBRA_S, 0, 0, 0, {}, 'metallo')
  f.metti(cil(0.25, 0.25, 0.066, 16), C.OMBRA, 0, 0, 0, { rx: PIATTA }, 'metallo')
  f.metti(toro(0.2, 0.013, 4, 22), C.OMBRA_M, 0, 0, 0.036, {}, 'metallo')
  for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; f.metti(con(0.03, 0.12, 4), C.OMBRA_M, Math.cos(a) * 0.15, Math.sin(a) * 0.15, 0.04, { rz: a - PIATTA, rx: -0.5 }, 'metallo') }
  const occhio = f.libero(ott(0.1), C.OMBRA_L, 0, 0, 0.06, 1.6); occhio.scale.set(1.8, 0.7, 0.5)
  f.metti(sfe(0.04, 6, 5), 0xffffff, 0, 0, 0.1, { s: [0.5, 1.3, 0.5] }, 'viva')
  const fumo = braci(f, C.OMBRA_M, [-0.28, -0.3, 0.0], [0.56, 0.5, 0.08], { n: 8, vel: 0.3, r: 0.04, sale: 0.3, geo: () => ico(1, 0) })
  const sc = braci(f, C.OMBRA_L, [-0.25, -0.2, 0.05], [0.5, 0.5, 0.08], { n: 6, vel: 0.5, r: 0.014, sale: 0.35 })
  presa(f)
  const g = f.chiudi(OFF)
  g.userData.anima = anima(respira(g, 2.4, 0.45, 1.1), fumo, sc, t => { occhio.scale.y = 0.7 * (Math.sin(t * 0.8) > 0.9 ? 0.2 : 1); occhio.material.emissiveIntensity = 1.6 + 0.5 * Math.sin(t * 3) })
  return g
}
// 8 ─ scudo di cristallo: una faccia di ghiaccio sfaccettata con schegge sul bordo e un cuore che pulsa
function cristalloScudo () {
  const f = new Fucina()
  const pts = [[0, 0.34], [0.2, 0.24], [0.27, 0.0], [0.19, -0.22], [0, -0.34], [-0.19, -0.22], [-0.27, 0.0], [-0.2, 0.24]]
  corpo(f, pts, { col: C.GHIACCIO, bordo: C.GHIACCIO_S, k: 0.9, prof: 0.05, tc: 'metallo' })
  for (const s of [-1, 1]) f.metti(poli([[0, 0.28], [s * 0.14, 0.2], [s * 0.2, 0.0], [s * 0.1, -0.16], [0, 0.0]], 0.02, 0.002), C.NEVE, 0, 0, 0.044, {}, 'metallo')   // le sfaccettature chiare
  f.metti(poli([[0, 0.0], [0.1, -0.16], [0, -0.26], [-0.1, -0.16]], 0.02, 0.002), C.GHIACCIO_S, 0, 0, 0.044, {}, 'metallo')
  for (const [x, y, r, h, a] of [[0.0, 0.36, 0.035, 0.2, 0], [0.22, 0.26, 0.03, 0.16, -0.8], [-0.22, 0.26, 0.03, 0.16, 0.8], [0.3, 0.0, 0.028, 0.16, -1.5], [-0.3, 0.0, 0.028, 0.16, 1.5], [0.2, -0.26, 0.026, 0.14, -2.2], [-0.2, -0.26, 0.026, 0.14, 2.2]]) f.metti(cristallo(r, h, 5), C.NEVE, x, y, 0.0, { rz: a }, 'metallo')
  const cuore = f.libero(cristallo(0.07, 0.2, 5), C.GHIACCIO_L, 0, 0.04, 0.09, 1.3)
  const br = braci(f, C.NEVE, [-0.25, -0.2, 0.05], [0.5, 0.5, 0.1], { n: 8, vel: 0.25, r: 0.014, sale: -0.15 })
  presa(f)
  const g = f.chiudi(OFF); g.userData.anima = anima(pulsaLibero(cuore, 2.2, 0.06), br, t => { cuore.rotation.y = t * 0.7 })
  return g
}
// 9 ─ scudo d'oro: sagoma a tre lobi, smalto blu, leone di gemme, borchie
function oro () {
  const f = new Fucina()
  const pts = [[-0.29, 0.22], [-0.2, 0.31], [-0.09, 0.26], [0, 0.35], [0.09, 0.26], [0.2, 0.31], [0.29, 0.22], [0.28, 0.0], [0.19, -0.19], [0, -0.34], [-0.19, -0.19], [-0.28, 0.0]]
  corpo(f, pts, { col: C.BLU_S, bordo: C.ORO, k: 0.84, prof: 0.054, tb: 'oro' })
  f.metti(poli(scala(pts, 0.7, -0.01), 0.02, 0.004), C.ORO_S, 0, 0, 0.05, {}, 'oro')
  f.metti(poli(scala(pts, 0.62, -0.01), 0.02, 0.004), C.BLU, 0, 0, 0.058, {})
  f.metti(sfe(0.1, 10, 7), C.ORO, 0, 0.0, 0.07, { s: [1, 1, 0.55] }, 'oro')
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; f.metti(con(0.03, 0.12, 4), C.ORO, Math.cos(a) * 0.17, Math.sin(a) * 0.17, 0.07, { rz: a - PIATTA }, 'oro') }
  f.metti(ott(0.06), C.RUBINO, 0, 0, 0.12, { s: [1, 1.2, 0.7] }, 'viva')
  for (const [x, y, c] of [[-0.2, 0.2, C.CIANO], [0.2, 0.2, C.CIANO], [0, 0.27, C.VIOLA], [-0.17, -0.14, C.VIOLA], [0.17, -0.14, C.VIOLA]]) f.metti(ott(0.026), c, x, y, 0.07, { s: [1, 1.3, 0.8] }, 'viva')
  borchie(f, [[-0.27, 0.12], [0.27, 0.12], [-0.25, -0.1], [0.25, -0.1], [0, -0.3]], C.ORO, 'oro', 0.018, 0.05)
  const sc = braci(f, C.LUCE, [-0.28, -0.3, 0.06], [0.56, 0.6, 0.1], { n: 6, vel: 0.35, r: 0.015, sale: 0.1 })
  presa(f)
  const g = f.chiudi(OFF); g.userData.anima = anima(respira(g, 2.4, 0.4, 1.2), sc)
  return g
}
// 10 ─ l'Egida: disco solare d'oro bianco, ali di piume ai lati, raggi e un anello di luce che gira
function egida () {
  const f = new Fucina()
  f.metti(cil(0.3, 0.3, 0.06, 20), C.ORO, 0, 0, 0, { rx: PIATTA }, 'oro')
  f.metti(cil(0.25, 0.25, 0.076, 20), C.ARGENTO, 0, 0, 0, { rx: PIATTA }, 'metallo')
  f.metti(toro(0.2, 0.014, 4, 24), C.ORO, 0, 0, 0.042, {}, 'oro')
  f.metti(cil(0.14, 0.14, 0.09, 16), C.ORO_S, 0, 0, 0, { rx: PIATTA }, 'oro')
  f.metti(sfe(0.1, 10, 7), C.ORO, 0, 0, 0.05, { s: [1, 1, 0.55] }, 'oro')
  f.metti(sfe(0.065, 9, 6), C.LUCE, 0, 0, 0.082, { s: [1, 1, 0.6] }, 'viva')
  for (let i = 0; i < 12; i++) {                                                          // i raggi
    const a = i * Math.PI / 6
    f.metti(con(0.03, i % 2 ? 0.1 : 0.17, 4), i % 2 ? C.ORO_S : C.ORO, Math.cos(a) * 0.34, Math.sin(a) * 0.34, 0, { rz: a - PIATTA }, 'oro')
  }
  for (const s of [-1, 1]) for (let i = 0; i < 5; i++) {                                   // le ali
    const y = 0.14 - i * 0.07, lung = 0.28 - Math.abs(i - 1) * 0.035
    f.metti(poli([[0, 0.03], [lung, 0.015], [lung + 0.05, -0.012], [lung, -0.035], [0, -0.03]], 0.014, 0.002), i % 2 ? C.NEVE : C.LUCE, s * 0.3, y, -0.01, { rz: s * (-0.12 + i * 0.12) + (s < 0 ? Math.PI : 0) }, 'metallo')
  }
  for (let i = 0; i < 4; i++) { const a = i * PIATTA + Math.PI / 4; f.metti(ott(0.03), i % 2 ? C.CIANO : C.RUBINO, Math.cos(a) * 0.2, Math.sin(a) * 0.2, 0.06, { s: [1, 1.4, 0.8], rz: a }, 'viva') }
  const alone = f.libero(toro(0.37, 0.008, 4, 36), C.LUCE, 0, 0, 0.0, 1.3)
  const sc = braci(f, C.LUCE, [-0.34, -0.3, 0.0], [0.68, 0.6, 0.14], { n: 10, vel: 0.3, r: 0.017, sale: 0.15 })
  presa(f)
  const g = f.chiudi(OFF); g.userData.anima = anima(respira(g, 3, 0.5, 1.3), sc, t => { alone.rotation.z = t * 0.5; alone.scale.setScalar(1 + 0.03 * Math.sin(t * 2)) })
  return g
}

export const SCUDI = [
  ['rotella', 'Rotella di legno', 1, 'nessuno', rotella],
  ['scudo-goccia', 'Scudo a goccia', 2, 'nessuno', goccia],
  ['scudo-rotondo', 'Scudo rotondo ferrato', 3, 'nessuno', rotondo],
  ['scudo-torre', 'Scudo a torre', 4, 'nessuno', torre],
  ['scudo-cavaliere', 'Scudo del cavaliere', 5, 'nessuno', cavaliere],
  ['scudo-nanico', 'Scudo nanico runico', 6, 'arcano', nanico],
  ['scudo-ombra', "Scudo d'ombra", 7, 'ombra', ombra],
  ['scudo-cristallo', 'Scudo di cristallo', 8, 'ghiaccio', cristalloScudo],
  ['scudo-oro', "Scudo d'oro", 9, 'oro', oro],
  ['egida', 'Egida', 10, 'luce', egida]
]
