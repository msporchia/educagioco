// Generato da strumenti/promuovi-3d.mjs da poc/armi-3d/collezione-bacchette.js: non si tocca a mano (si cambia il prototipo e si rilancia `npm run promuovi3d`).
// La collezione: dieci bacchette e staffe. L'asta sale lungo +y dal pugno (un po' sotto, per il puntale); la cima porta la magia.
import { Fucina, C, sca, cil, con, sfe, ott, ico, toro, poli, cristallo, PIATTA, anima, respira, fiamme, braci, orbita, lampo, pulsaLibero } from './fucina.js'

/** Un'asta a tratti con un filo di storto: `pts` gli estremi. */
const asta = (f, pts, r1, r2, col, tipo = 'pieno', seg = 6, alt = null) => f.fila(pts, r1, r2, col, tipo, seg)
const presa = (f, y, n = 3, col = C.CUOIO_S, r = 0.034, tipo = 'pieno') => { for (let i = 0; i < n; i++) f.metti(cil(r, r, 0.022, 7), col, 0, y + i * 0.04, 0, {}, tipo) }

// 1 ─ bacchetta di legno: un ramoscello sbucciato con un nodo in cima
function bacchetta () {
  const f = new Fucina()
  asta(f, [[0, -0.1, 0], [0.008, 0.08, 0], [-0.006, 0.24, 0.004], [0.004, 0.4, 0]], 0.022, 0.009, C.LEGNO_C, 'pieno', 6)
  f.metti(sfe(0.03, 6, 5), C.LEGNO_S, 0, -0.105, 0, {})
  f.metti(cil(0.028, 0.028, 0.06, 6), C.CUOIO_S, 0, -0.04, 0, {})
  f.metti(sfe(0.026, 5, 4), C.LEGNO_S, 0.006, 0.405, 0, { s: [1, 1.2, 1] })
  f.metti(sca(0.03, 0.018, 0.02), C.LEGNO_S, 0.02, 0.2, 0.0, { rz: 0.5 })
  return f.chiudi()
}
// 2 ─ bastone nodoso: radice contorta con tre nodi e una palla di legno tra le dita di radice
function nodoso () {
  const f = new Fucina()
  asta(f, [[0, -0.34, 0], [0.025, -0.1, 0.01], [-0.02, 0.15, -0.01], [0.025, 0.42, 0.01], [-0.01, 0.7, 0], [0.01, 0.9, 0]], 0.036, 0.026, C.LEGNO_S, 'pieno', 6)
  for (const [x, y, z, r] of [[0.03, -0.1, 0.02, 0.05], [-0.04, 0.15, 0, 0.055], [0.04, 0.42, 0.02, 0.05], [-0.025, 0.66, 0.02, 0.04]]) f.metti(ico(r), C.LEGNO, x, y, z, { s: [1, 0.85, 1] })
  presa(f, -0.06, 3, C.CUOIO, 0.043)
  for (let i = 0; i < 5; i++) {                                                       // le dita di radice in cima
    const a = i * 1.257, c = Math.cos(a), s = Math.sin(a)
    asta(f, [[0, 0.88, 0], [c * 0.07, 1.0, s * 0.07], [c * 0.05, 1.15, s * 0.05], [c * 0.0, 1.2, s * 0.0]], 0.026, 0.008, i % 2 ? C.LEGNO : C.LEGNO_S, 'pieno', 5)
  }
  f.metti(ico(0.07, 0), C.LEGNO_C, 0, 1.06, 0, { s: [1, 1.1, 1] })
  f.metti(sca(0.03, 0.02, 0.02), C.NATURA, 0.045, 0.45, 0.05, {})
  return f.chiudi()
}
// 3 ─ scettro: ottone e oro, palla a spicchi, croce e rubino
function scettro () {
  const f = new Fucina()
  f.asta([0, -0.2, 0], [0, 0.62, 0], 0.024, 0.02, C.OTTONE, 'oro', 8)
  for (const [y, r] of [[-0.2, 0.034], [-0.02, 0.03], [0.18, 0.034], [0.4, 0.03]]) f.metti(sfe(r, 7, 5), C.ORO, 0, y, 0, {}, 'oro')
  f.metti(cil(0.036, 0.036, 0.1, 8), C.BLU_S, 0, -0.07, 0)
  for (const y of [-0.11, -0.03]) f.metti(cil(0.04, 0.04, 0.014, 8), C.ORO, 0, y, 0, {}, 'oro')
  f.metti(cil(0.04, 0.03, 0.06, 8), C.ORO, 0, 0.64, 0, {}, 'oro')
  f.metti(sfe(0.085, 10, 7), C.ORO, 0, 0.77, 0, {}, 'oro')
  f.metti(toro(0.085, 0.01, 4, 16), C.ORO_S, 0, 0.77, 0, { rx: PIATTA }, 'oro')
  f.metti(toro(0.085, 0.01, 4, 16), C.ORO_S, 0, 0.77, 0, {}, 'oro')
  f.metti(sca(0.03, 0.12, 0.03), C.ORO, 0, 0.9, 0, {}, 'oro')                             // la croce
  f.metti(sca(0.1, 0.03, 0.03), C.ORO, 0, 0.92, 0, {}, 'oro')
  f.metti(ott(0.032), C.RUBINO, 0, 0.77, 0.075, { s: [1, 1.3, 0.8] }, 'viva')
  for (let i = 0; i < 4; i++) { const a = i * PIATTA + 0.78; f.metti(con(0.018, 0.07, 4), C.ORO, Math.cos(a) * 0.06, 0.64 + 0.01, Math.sin(a) * 0.06, { rz: Math.cos(a) * 0.6, rx: -Math.sin(a) * 0.6 }, 'oro') }
  const g = f.chiudi(); g.userData.anima = respira(g, 2, 0.3, 1.0)
  return g
}
// 4 ─ staffa con cristallo: asta di legno, artigli d'argento, cristallo azzurro sospeso che pulsa
function cristalloStaffa () {
  const f = new Fucina()
  f.asta([0, -0.36, 0], [0, 0.95, 0], 0.03, 0.026, C.LEGNO_S, 'pieno', 8)
  presa(f, -0.1, 3, C.CUOIO, 0.036)
  f.metti(con(0.03, 0.09, 6), C.ACCIAIO_S, 0, -0.4, 0, { rx: Math.PI }, 'metallo')
  f.metti(toro(0.045, 0.012, 5, 10), C.ACCIAIO, 0, 0.55, 0, { rx: PIATTA }, 'metallo')
  f.metti(cil(0.046, 0.034, 0.06, 8), C.ACCIAIO, 0, 0.95, 0, {}, 'metallo')
  for (let i = 0; i < 4; i++) {
    const a = i * PIATTA + Math.PI / 4, c = Math.cos(a), s = Math.sin(a)
    f.fila([[c * 0.04, 0.97, s * 0.04], [c * 0.1, 1.08, s * 0.1], [c * 0.09, 1.2, s * 0.09], [c * 0.05, 1.3, s * 0.05]], 0.016, 0.006, C.ACCIAIO, 'metallo', 5)
  }
  const cr = f.libero(cristallo(0.07, 0.3, 5), 0x4f90e8, 0, 1.12, 0, 1.2)
  const an = anima(pulsaLibero(cr, 2.4, 0.04), t => { cr.rotation.y = t * 0.6; cr.position.y = 1.12 + 0.015 * Math.sin(t * 1.8) })
  const br = braci(f, 0x9ec8ff, [-0.1, 1.0, -0.1], [0.2, 0.3, 0.2], { n: 5, vel: 0.3, r: 0.012, sale: 0.15 })
  const g = f.chiudi(); g.userData.anima = anima(an, br)
  return g
}
// 5 ─ bastone della natura: due rami intrecciati, foglie, fiori e un bocciolo che brilla
function natura () {
  const f = new Fucina()
  const a = [[0, -0.34, 0], [0.03, -0.05, 0.01], [-0.03, 0.25, 0], [0.03, 0.55, 0.01], [0.04, 0.82, 0]]
  const b = [[0, -0.34, 0], [-0.03, -0.05, -0.01], [0.03, 0.25, 0], [-0.03, 0.55, -0.01], [-0.04, 0.82, 0]]
  asta(f, a, 0.032, 0.022, C.CORTECCIA, 'pieno', 6); asta(f, b, 0.03, 0.02, C.LEGNO_S, 'pieno', 6)
  presa(f, -0.08, 2, C.VERDE_S, 0.042)
  for (const s of [-1, 1]) {                                                           // i rami che si aprono come una culla
    asta(f, [[s * 0.04, 0.82, 0], [s * 0.12, 0.96, 0.02], [s * 0.14, 1.12, 0], [s * 0.08, 1.24, 0.0]], 0.022, 0.007, s > 0 ? C.CORTECCIA : C.LEGNO_S, 'pieno', 5)
    f.metti(sfe(0.03, 5, 4), C.FIORE, s * 0.08, 1.26, 0, { s: [1, 0.7, 1] }, 'pieno')
  }
  for (const [x, y, z, r] of [[0.08, 0.35, 0.03, 0.4], [-0.09, 0.55, -0.03, -0.5], [0.07, 0.1, -0.03, 0.8], [-0.07, 0.72, 0.03, -0.8], [0.14, 1.02, 0, 0.7], [-0.15, 1.1, 0, -0.7]]) {
    f.metti(poli([[0, 0], [0.05, 0.05], [0, 0.14], [-0.05, 0.05]], 0.01, 0.001), r > 0 ? C.FOGLIA : C.NATURA, x, y, z, { rz: -r * 1.5, ry: r }, 'pieno')
  }
  const bocciolo = f.libero(ico(0.07, 0), C.NATURA, 0, 1.08, 0, 1.4)
  for (let i = 0; i < 6; i++) { const t = i * Math.PI / 3; f.metti(poli([[0, 0], [0.04, 0.05], [0, 0.15], [-0.04, 0.05]], 0.008, 0.001), i % 2 ? C.FIORE : C.NATURA, Math.cos(t) * 0.04, 1.1, Math.sin(t) * 0.04, { rz: -Math.cos(t) * 0.9, rx: Math.sin(t) * 0.9, ry: 0 }, 'pieno') }
  const polline = orbita(f, C.FUOCO_C, [0, 1.1, 0], 0.17, { n: 5, vel: 1.1, r: 0.02, inc: 0.4 })
  const br = braci(f, C.NATURA, [-0.1, 0.8, -0.1], [0.2, 0.6, 0.2], { n: 6, vel: 0.3, r: 0.014, sale: 0.15 })
  const g = f.chiudi(); g.userData.anima = anima(pulsaLibero(bocciolo, 2.4, 0.07), polline, br, respira(g, 2, 0.3, 1.1))
  return g
}
// 6 ─ bastone del fuoco: asta nera, bacile di brace e una fiamma viva, anelli roventi
function fuoco () {
  const f = new Fucina()
  f.asta([0, -0.36, 0], [0, 1.0, 0], 0.03, 0.024, C.LAVA, 'metallo', 8)
  presa(f, -0.1, 3, C.ROSSO_S, 0.036)
  f.metti(con(0.03, 0.09, 6), C.LAVA_S, 0, -0.4, 0, { rx: Math.PI }, 'metallo')
  for (const y of [0.3, 0.6]) f.metti(cil(0.036, 0.036, 0.022, 8), C.FUOCO_R, 0, y, 0, {}, 'viva')
  f.metti(cil(0.14, 0.05, 0.12, 9), C.LAVA_S, 0, 1.07, 0, {}, 'metallo')                    // il bacile
  f.metti(cil(0.145, 0.145, 0.016, 9), C.FUOCO_R, 0, 1.13, 0, {}, 'viva')
  for (let i = 0; i < 5; i++) { const a = i * 1.257; f.metti(con(0.03, 0.12, 4), C.LAVA_S, Math.cos(a) * 0.15, 1.17, Math.sin(a) * 0.15, { rz: -Math.cos(a) * 0.4, rx: Math.sin(a) * 0.4 }, 'metallo') }
  f.metti(sfe(0.1, 7, 5), C.FUOCO, 0, 1.16, 0, { s: [1, 0.7, 1] }, 'viva')
  const fi = fiamme(f, [[0, 1.16, 0], [0.07, 1.15, 0.02], [-0.07, 1.15, -0.02], [0.02, 1.14, 0.07], [-0.03, 1.14, -0.07]], { h: 0.26, r: 0.07 })
  const br = braci(f, C.FUOCO_C, [-0.12, 1.15, -0.12], [0.24, 0.1, 0.24], { n: 12, vel: 0.5, r: 0.018, sale: 0.45 })
  const g = f.chiudi(); g.userData.anima = anima(respira(g, 5, 0.5, 1.3), fi, br)
  return g
}
// 7 ─ bastone del ghiaccio: asta bianca e un grappolo di cristalli di brina
function ghiaccio () {
  const f = new Fucina()
  f.asta([0, -0.36, 0], [0, 0.95, 0], 0.03, 0.025, C.NEVE, 'metallo', 8)
  presa(f, -0.1, 3, C.GHIACCIO_S, 0.036, 'metallo')
  f.metti(con(0.03, 0.09, 6), C.GHIACCIO_S, 0, -0.4, 0, { rx: Math.PI }, 'metallo')
  f.metti(toro(0.045, 0.012, 5, 10), C.GHIACCIO, 0, 0.5, 0, { rx: PIATTA }, 'metallo')
  f.metti(cil(0.05, 0.034, 0.07, 7), C.GHIACCIO_S, 0, 0.96, 0, {}, 'metallo')
  const grappolo = [[0, 1.2, 0, 0.055, 0.5, 0, 0], [0.09, 1.1, 0.02, 0.04, 0.32, 0, -0.7], [-0.09, 1.12, -0.01, 0.04, 0.34, 0, 0.7], [0.03, 1.1, 0.08, 0.035, 0.28, 0.7, -0.2], [-0.03, 1.1, -0.08, 0.035, 0.28, -0.7, 0.2]]
  for (const [x, y, z, r, h, rx, rz] of grappolo) f.metti(cristallo(r, h, 5, 0.32), r > 0.05 ? C.GHIACCIO_L : C.GHIACCIO, x, y, z, { rx, rz }, r > 0.05 ? 'viva' : 'metallo')
  const br = braci(f, C.NEVE, [-0.2, 0.8, -0.15], [0.4, 0.7, 0.3], { n: 12, vel: 0.22, r: 0.015, sale: -0.25 })
  const o = orbita(f, C.NEVE, [0, 1.15, 0], 0.2, { n: 3, vel: 0.9, r: 0.02, inc: 0.3 })
  const g = f.chiudi(); g.userData.anima = anima(respira(g, 2.2, 0.5, 1.2), br, o)
  return g
}
// 8 ─ bastone del fulmine: asta d'acciaio a spirale di rame, due rebbi e una sfera elettrica
function fulmine () {
  const f = new Fucina()
  f.asta([0, -0.36, 0], [0, 0.98, 0], 0.025, 0.02, C.TUONO_S, 'metallo', 8)
  presa(f, -0.1, 3, C.CUOIO_S, 0.034)
  f.metti(con(0.03, 0.09, 6), C.RAME, 0, -0.4, 0, { rx: Math.PI }, 'oro')
  for (let i = 0; i < 16; i++) { const a = i * 0.95; f.metti(sfe(0.021, 5, 4), C.RAME, Math.cos(a) * 0.03, 0.12 + i * 0.045, Math.sin(a) * 0.03, {}, 'oro') }   // la spirale
  f.metti(cil(0.05, 0.034, 0.06, 8), C.TUONO, 0, 0.98, 0, {}, 'metallo')
  for (const s of [-1, 1]) {
    f.fila([[s * 0.04, 1.0, 0], [s * 0.14, 1.1, 0], [s * 0.13, 1.26, 0], [s * 0.07, 1.36, 0]], 0.02, 0.008, C.TUONO, 'metallo', 5)
    f.metti(ott(0.018), C.FULMINE, s * 0.07, 1.37, 0, {}, 'viva')
  }
  const sfera = f.libero(ico(0.085, 1), C.FULMINE_V, 0, 1.17, 0, 1.5)
  const nucleo = f.libero(ott(0.045), 0xffffff, 0, 1.17, 0, 1.4)
  const lam = [1, 5, 9, 14].map(sd => lampo(f, [0, 1.17, 0], [Math.cos(sd) * 0.3, 1.17 + Math.sin(sd * 1.3) * 0.22, Math.sin(sd) * 0.3], { n: 4, scarto: 0.045, seme: sd, r: 0.006 }))
  const arco = lampo(f, [-0.07, 1.37, 0], [0.07, 1.37, 0], { n: 3, scarto: 0.02, seme: 21, r: 0.006 })
  const sc = braci(f, C.FULMINE, [-0.2, 1.0, -0.2], [0.4, 0.35, 0.4], { n: 8, vel: 0.9, r: 0.013, sale: 0.1 })
  const g = f.chiudi(); g.userData.anima = anima(respira(g, 8, 0.5, 1.3), ...lam, arco, sc, t => { sfera.scale.setScalar(1 + 0.08 * Math.sin(t * 9)); nucleo.rotation.set(t * 3, t * 2, 0) })
  return g
}
// 9 ─ bastone dell'ombra: asta ritorta nera, falce di corno che regge una sfera di buio con volute attorno
function ombra () {
  const f = new Fucina()
  asta(f, [[0, -0.36, 0], [0.02, -0.1, 0], [-0.02, 0.2, 0], [0.02, 0.5, 0], [-0.015, 0.8, 0], [0, 1.0, 0]], 0.034, 0.024, C.OMBRA_S, 'metallo', 6)
  presa(f, -0.1, 3, C.OMBRA_M, 0.04, 'metallo')
  f.metti(con(0.03, 0.1, 5), C.OMBRA_M, 0, -0.41, 0, { rx: Math.PI }, 'metallo')
  for (const y of [0.3, 0.55, 0.8]) f.metti(con(0.026, 0.1, 4), C.OMBRA_M, 0.03, y, 0.03, { rz: -1.1, rx: 0.4 }, 'metallo')   // spine lungo l'asta
  for (const s of [-1, 1]) {                                                           // le corna a falce
    f.fila([[s * 0.03, 0.98, 0], [s * 0.17, 1.03, 0], [s * 0.24, 1.18, 0], [s * 0.2, 1.36, 0], [s * 0.1, 1.46, 0]], 0.032, 0.006, C.OMBRA, 'metallo', 6)
    f.metti(ott(0.014), C.OMBRA_L, s * 0.11, 1.46, 0, { s: [1, 1.4, 1] }, 'viva')
  }
  const sfera = f.libero(ico(0.1, 1), C.PORPORA, 0, 1.2, 0, 1.1)
  const occhio = f.libero(ott(0.04), C.OMBRA_L, 0, 1.2, 0.085, 1.8); occhio.scale.set(1.6, 0.6, 0.6)
  const volute = orbita(f, C.OMBRA_L, [0, 1.2, 0], 0.22, { n: 4, vel: 1.4, r: 0.026, inc: 0.6, geo: () => ico(0.026, 0) })
  const fumo = braci(f, C.OMBRA_M, [-0.12, 1.0, -0.12], [0.24, 0.2, 0.24], { n: 8, vel: 0.35, r: 0.04, sale: 0.35, geo: () => ico(1, 0) })
  const g = f.chiudi(); g.userData.anima = anima(respira(g, 2.4, 0.4, 1.0), volute, fumo, t => { sfera.scale.setScalar(1 + 0.07 * Math.sin(t * 2.5)); sfera.rotation.y = t; occhio.scale.y = 0.6 * (Math.sin(t * 0.9) > 0.92 ? 0.15 : 1) })
  return g
}
// 10 ─ staffa arcana: giroscopio d'anelli attorno a un cristallo, gemme che orbitano, rune a mezz'aria
function arcano () {
  const f = new Fucina()
  f.asta([0, -0.4, 0], [0, 0.98, 0], 0.03, 0.022, C.ARCANO_S, 'metallo', 8)
  for (let i = 0; i < 6; i++) f.metti(cil(0.036, 0.036, 0.014, 8), C.ORO, 0, -0.18 + i * 0.05, 0, {}, 'oro')
  f.metti(cil(0.045, 0.045, 0.2, 8), C.ARCANO_S, 0, -0.04, 0, {})
  f.metti(sfe(0.045, 7, 5), C.ORO, 0, -0.43, 0, {}, 'oro')
  f.metti(con(0.035, 0.1, 6), C.ORO, 0, -0.47, 0, { rx: Math.PI }, 'oro')
  for (const y of [0.3, 0.62]) { f.metti(toro(0.045, 0.012, 5, 10), C.ORO, 0, y, 0, { rx: PIATTA }, 'oro'); f.metti(ott(0.022), C.ARCANO, 0.05, y, 0, {}, 'viva') }
  f.metti(cil(0.06, 0.036, 0.08, 8), C.ORO, 0, 1.0, 0, {}, 'oro')
  for (let i = 0; i < 4; i++) { const a = i * PIATTA; f.fila([[Math.cos(a) * 0.05, 1.04, Math.sin(a) * 0.05], [Math.cos(a) * 0.1, 1.12, Math.sin(a) * 0.1], [Math.cos(a) * 0.05, 1.2, Math.sin(a) * 0.05]], 0.016, 0.008, C.ORO, 'oro', 5) }
  const cr = f.libero(cristallo(0.07, 0.24, 5), C.LUCE, 0, 1.42, 0, 1.4)
  const anelli = [[0.22, 0xff4a62], [0.27, C.ARCANO], [0.32, C.CIANO]].map(([R, hex]) => f.libero(toro(R, 0.01, 4, 30), hex, 0, 1.42, 0, 1.2))
  const gemme = orbita(f, C.VIOLA, [0, 1.42, 0], 0.27, { n: 3, vel: 1.5, r: 0.032, inc: 0.5 })
  const rune = braci(f, C.ARCANO, [-0.25, 1.0, -0.25], [0.5, 0.8, 0.5], { n: 12, vel: 0.25, r: 0.016, sale: 0.2 })
  const g = f.chiudi()
  g.userData.anima = anima(respira(g, 2.4, 0.4, 1.2), gemme, rune, pulsaLibero(cr, 2.8, 0.07), t => {
    anelli.forEach((a, i) => { a.rotation.set(t * (0.7 + i * 0.3) + i, t * (0.5 - i * 0.2), i * 1.1) })
    cr.rotation.y = t * 0.9
  })
  return g
}

export const BACCHETTE = [
  ['bacchetta-legno', 'Bacchetta di legno', 1, 'nessuno', bacchetta],
  ['bastone-nodoso', 'Bastone nodoso', 2, 'nessuno', nodoso],
  ['scettro', 'Scettro', 3, 'oro', scettro],
  ['staffa-cristallo', 'Staffa con cristallo', 4, 'arcano', cristalloStaffa],
  ['bastone-natura', 'Bastone della natura', 5, 'natura', natura],
  ['bastone-fuoco', 'Bastone del fuoco', 6, 'fuoco', fuoco],
  ['bastone-ghiaccio', 'Bastone del ghiaccio', 7, 'ghiaccio', ghiaccio],
  ['bastone-fulmine', 'Bastone del fulmine', 8, 'fulmine', fulmine],
  ['bastone-ombra', "Bastone dell'ombra", 9, 'ombra', ombra],
  ['staffa-arcana', 'Staffa arcana', 10, 'arcano', arcano]
]
