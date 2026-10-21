// La collezione: dieci asce. Il manico sale lungo +y dal pugno, la testa sta in alto con il filo verso +x (il profilo si vede di fronte).
import { Fucina, C, sca, cil, con, sfe, ott, ico, toro, poli, cristallo, PIATTA, anima, respira, fiamme, braci, lampo, orbita } from './fucina.js'

const spec = pts => pts.map(([x, y]) => [-x, y]).reverse()          // lo stesso profilo specchiato (per le bipenni)
/** Il manico: asta con un filo di curva, puntale in fondo, fasce di cuoio vicino al pugno. */
function manico (f, { y1, r = 0.026, col = C.LEGNO, fascia = C.CUOIO_S, puntale = null, curva = 0.012 }) {
  const n = 4
  for (let i = 0; i < n; i++) {
    const a = -0.12 + (y1 + 0.12) * i / n, b = -0.12 + (y1 + 0.12) * (i + 1) / n
    f.asta([curva * Math.sin(i * 1.7), a, 0], [curva * Math.sin((i + 1) * 1.7), b, 0], r * 1.0, r * 0.94, i % 2 ? col : (col === C.LEGNO ? C.LEGNO_C : col), 'pieno', 7)
  }
  for (const y of [-0.08, 0, 0.08]) f.metti(cil(r * 1.18, r * 1.18, 0.016, 7), fascia, 0, y, 0)
  if (puntale) f.metti(cil(r * 1.3, r * 1.1, 0.04, 7), puntale, 0, -0.14, 0, {}, 'metallo')
}
const collare = (f, y, col = C.FERRO_S, r = 0.04, h = 0.07, tipo = 'metallo') => f.metti(cil(r, r, h, 8), col, 0, y, 0, {}, tipo)

// 1 ─ accetta: ferro grezzo e manico corto
function accetta () {
  const f = new Fucina()
  manico(f, { y1: 0.36 })
  f.metti(poli([[0.02, 0.24], [0.125, 0.18], [0.13, 0.4], [0.02, 0.35]], 0.026, 0.003), C.FERRO, 0, 0, 0, {}, 'metallo')
  f.metti(sca(0.06, 0.1, 0.034), C.FERRO_S, -0.04, 0.3, 0, {}, 'metallo')                 // il tallone
  collare(f, 0.3, C.FERRO_S, 0.036, 0.1)
  f.metti(sca(0.012, 0.18, 0.03), C.ACCIAIO_S, 0.12, 0.29, 0, {}, 'metallo')              // il filo lucido
  return f.chiudi()
}
// 2 ─ scure da boscaiolo: filo a mezzaluna, martello dietro
function scure () {
  const f = new Fucina()
  manico(f, { y1: 0.66, puntale: C.FERRO_S })
  f.metti(poli([[0.025, 0.48], [0.12, 0.4], [0.18, 0.5], [0.185, 0.62], [0.12, 0.72], [0.025, 0.64]], 0.028, 0.004), C.ACCIAIO_S, 0, 0, 0, {}, 'metallo')
  f.metti(poli([[0.16, 0.5], [0.185, 0.52], [0.19, 0.6], [0.165, 0.64]], 0.032, 0.002), C.ACCIAIO, 0, 0, 0, {}, 'metallo')
  f.metti(sca(0.09, 0.12, 0.05), C.FERRO_S, -0.06, 0.56, 0, {}, 'metallo')                // il dorso a martello
  collare(f, 0.56, C.FERRO, 0.038, 0.17)
  f.metti(sca(0.045, 0.045, 0.045), C.CUOIO_S, 0, 0.7, 0)
  return f.chiudi()
}
// 3 ─ ascia da guerra: una lama sola con la barba, punta dietro, ribattini
function guerra () {
  const f = new Fucina()
  manico(f, { y1: 0.82, puntale: C.ACCIAIO_S, col: C.LEGNO_S })
  f.metti(poli([[0.02, 0.62], [0.1, 0.6], [0.2, 0.5], [0.24, 0.44], [0.25, 0.66], [0.24, 0.88], [0.17, 0.86], [0.08, 0.76], [0.02, 0.74]], 0.03, 0.004), C.ACCIAIO_S, 0, 0, 0, {}, 'metallo')
  f.metti(poli([[0.2, 0.5], [0.24, 0.44], [0.25, 0.66], [0.24, 0.88], [0.215, 0.7]], 0.034, 0.002), C.ACCIAIO, 0, 0, 0, {}, 'metallo')   // il filo
  f.metti(con(0.03, 0.14, 4), C.FERRO, -0.1, 0.69, 0, { rz: PIATTA }, 'metallo')           // il rostro dietro
  collare(f, 0.68, C.FERRO, 0.04, 0.17)
  for (const y of [0.63, 0.74]) f.metti(sfe(0.014, 5, 4), C.ORO, 0.06, y, 0.022, {}, 'oro')
  for (const y of [0.55, 0.62, 0.74, 0.81]) f.metti(sca(0.028, 0.012, 0.062), C.FERRO_S, 0, y, 0, {}, 'metallo')   // le bandelle
  return f.chiudi()
}
// 4 ─ ascia vichinga: grande lama barbuta, anelli di bronzo e un cerchio inciso
function vichinga () {
  const f = new Fucina()
  manico(f, { y1: 0.96, puntale: C.BRONZO, col: C.LEGNO_S, fascia: C.BRONZO })
  f.metti(poli([[0.02, 0.7], [0.11, 0.69], [0.17, 0.6], [0.3, 0.46], [0.33, 0.7], [0.3, 0.94], [0.13, 0.84], [0.02, 0.82]], 0.026, 0.004), C.ACCIAIO, 0, 0, 0, {}, 'metallo')
  f.metti(poli([[0.29, 0.5], [0.33, 0.46], [0.345, 0.7], [0.32, 0.92], [0.3, 0.7]], 0.032, 0.002), C.ARGENTO, 0, 0, 0, {}, 'metallo')
  f.metti(toro(0.07, 0.01, 5, 14), C.BRONZO, 0.18, 0.69, 0.018, {}, 'oro')              // il cerchio di bronzo sulla faccia
  f.metti(sfe(0.022, 6, 4), C.BRONZO, 0.18, 0.69, 0.018, { s: [1, 1, 0.6] }, 'oro')
  f.metti(sca(0.05, 0.09, 0.04), C.FERRO_S, -0.04, 0.76, 0, {}, 'metallo')
  collare(f, 0.76, C.BRONZO, 0.04, 0.14, 'oro')
  for (const y of [0.3, 0.45]) f.metti(cil(0.034, 0.034, 0.025, 7), C.BRONZO, 0, y, 0, {}, 'oro')
  return f.chiudi()
}
// 5 ─ bipenne: due lame a mezzaluna, borchie e cima appuntita
function bipenne () {
  const f = new Fucina()
  manico(f, { y1: 0.94, puntale: C.ACCIAIO_S, col: C.LEGNO_C })
  const lamaD = [[0.03, 0.62], [0.12, 0.58], [0.21, 0.5], [0.27, 0.56], [0.25, 0.7], [0.27, 0.84], [0.21, 0.9], [0.12, 0.82], [0.03, 0.78]]
  f.metti(poli(lamaD, 0.026, 0.004), C.ACCIAIO_S, 0, 0, 0, {}, 'metallo')
  f.metti(poli(spec(lamaD), 0.026, 0.004), C.ACCIAIO_S, 0, 0, 0, {}, 'metallo')
  for (const s of [-1, 1]) f.metti(poli([[s * 0.23, 0.53], [s * 0.275, 0.57], [s * 0.255, 0.7], [s * 0.275, 0.83], [s * 0.23, 0.87], [s * 0.255, 0.7]].map(([x, y]) => [x, y]), 0.032, 0.002), C.ARGENTO, 0, 0, 0, {}, 'metallo')
  f.metti(sfe(0.055, 8, 6), C.BRONZO, 0, 0.7, 0, {}, 'oro')                              // borchia centrale
  f.metti(con(0.03, 0.16, 6), C.ACCIAIO, 0, 1.02, 0, {}, 'metallo')                      // cima
  f.metti(cil(0.036, 0.036, 0.04, 7), C.BRONZO, 0, 0.94, 0, {}, 'oro')
  collare(f, 0.7, C.FERRO, 0.04, 0.3)
  return f.chiudi()
}
// 6 ─ ascia da nano: massiccia, dorso a martello, bande di bronzo, rune azzurre che pulsano
function nano () {
  const f = new Fucina()
  manico(f, { y1: 0.7, puntale: C.BRONZO, col: C.CORTECCIA, fascia: C.BRONZO })
  f.metti(poli([[0.03, 0.46], [0.16, 0.4], [0.27, 0.34], [0.29, 0.58], [0.27, 0.8], [0.16, 0.74], [0.03, 0.68]], 0.05, 0.005), C.FERRO, 0, 0, 0, {}, 'metallo')
  f.metti(poli([[0.255, 0.35], [0.29, 0.34], [0.31, 0.58], [0.29, 0.82], [0.255, 0.8], [0.27, 0.58]], 0.056, 0.002), C.ACCIAIO_S, 0, 0, 0, {}, 'metallo')
  f.metti(sca(0.11, 0.2, 0.08), C.FERRO_S, -0.075, 0.57, 0, {}, 'metallo')                // il martello
  f.metti(sca(0.115, 0.205, 0.04), C.BRONZO, -0.075, 0.57, 0, {}, 'oro')
  collare(f, 0.57, C.BRONZO, 0.048, 0.28, 'oro')
  for (const y of [0.45, 0.69]) f.metti(cil(0.042, 0.042, 0.03, 7), C.BRONZO, 0, y, 0, {}, 'oro')
  // le rune sulla faccia: tre segni sovrapposti
  for (const z of [-1, 1]) {
    f.metti(sca(0.014, 0.1, 0.012), C.CIANO, 0.16, 0.58, z * 0.03, {}, 'viva')
    f.metti(sca(0.07, 0.014, 0.012), C.CIANO, 0.16, 0.64, z * 0.03, {}, 'viva')
    f.metti(sca(0.014, 0.07, 0.012), C.CIANO, 0.2, 0.55, z * 0.03, { rz: 0.6 }, 'viva')
    f.metti(sca(0.014, 0.07, 0.012), C.CIANO, 0.11, 0.53, z * 0.03, { rz: -0.6 }, 'viva')
  }
  f.metti(ott(0.03), C.CIANO, -0.075, 0.57, 0.045, { s: [1, 1.3, 0.7] }, 'viva')
  const g = f.chiudi(); g.userData.anima = respira(g, 2.6, 0.5, 1.2)
  return g
}
// 7 ─ ascia di lava: testa di roccia nera screpolata di brace, fiamme sul filo
function lava () {
  const f = new Fucina()
  manico(f, { y1: 0.86, puntale: C.LAVA_S, col: C.LAVA, fascia: C.FUOCO_R })
  f.metti(poli([[0.03, 0.6], [0.1, 0.55], [0.16, 0.5], [0.22, 0.42], [0.3, 0.5], [0.26, 0.6], [0.32, 0.72], [0.26, 0.84], [0.3, 0.94], [0.2, 0.92], [0.1, 0.84], [0.03, 0.8]], 0.034, 0.004), C.LAVA_S, 0, 0, 0, {}, 'metallo')
  f.metti(poli([[0.03, 0.66], [0.12, 0.62], [0.2, 0.6], [0.28, 0.66], [0.2, 0.7], [0.12, 0.74], [0.03, 0.76]], 0.04, 0.002), C.LAVA, 0, 0, 0, {}, 'metallo')
  for (const [x1, y1, x2, y2] of [[0.1, 0.62, 0.22, 0.7], [0.14, 0.82, 0.24, 0.72], [0.18, 0.54, 0.24, 0.62]]) f.asta([x1, y1, 0.02], [x2, y2, 0.02], 0.008, 0.005, C.FUOCO, 'oro', 4)
  for (const [x1, y1, x2, y2] of [[0.1, 0.62, 0.22, 0.7], [0.14, 0.82, 0.24, 0.72], [0.18, 0.54, 0.24, 0.62]]) f.asta([x1, y1, -0.02], [x2, y2, -0.02], 0.008, 0.005, C.FUOCO, 'oro', 4)
  f.metti(poli([[0.17, 0.5], [0.22, 0.42], [0.3, 0.5], [0.26, 0.6], [0.2, 0.6]], 0.038, 0.002), C.FUOCO_R, 0, 0, 0, {}, 'viva')   // la punta rovente
  f.metti(poli([[0.2, 0.92], [0.3, 0.94], [0.26, 0.84], [0.22, 0.86]], 0.038, 0.002), C.FUOCO_R, 0, 0, 0, {}, 'viva')
  f.metti(sfe(0.04, 6, 5), C.FUOCO, 0, 0.7, 0.0, {}, 'viva')
  collare(f, 0.7, C.LAVA, 0.044, 0.22)
  f.metti(ott(0.026), C.FUOCO_C, 0, 0.7, 0.04, { s: [1, 1.2, 0.7] }, 'viva')
  const fi = fiamme(f, [[0.29, 0.52, 0], [0.31, 0.7, 0], [0.28, 0.9, 0], [0.18, 0.43, 0]], { h: 0.16, r: 0.04 })
  const br = braci(f, C.FUOCO_C, [0.0, 0.55, -0.06], [0.3, 0.5, 0.12], { n: 9, vel: 0.4, r: 0.016, sale: 0.3 })
  const g = f.chiudi(); g.userData.anima = anima(respira(g, 4.5, 0.5, 1.3), fi, br)
  return g
}
// 8 ─ ascia del gelo: lama di cristallo e schegge di brina sul dorso
function gelo () {
  const f = new Fucina()
  manico(f, { y1: 0.86, puntale: C.GHIACCIO_S, col: C.GHIACCIO_S, fascia: C.NEVE })
  f.metti(poli([[0.03, 0.6], [0.12, 0.56], [0.2, 0.44], [0.28, 0.5], [0.24, 0.6], [0.34, 0.7], [0.24, 0.8], [0.28, 0.9], [0.2, 0.96], [0.12, 0.84], [0.03, 0.8]], 0.03, 0.004), C.GHIACCIO, 0, 0, 0, {}, 'metallo')
  f.metti(poli([[0.04, 0.64], [0.2, 0.6], [0.28, 0.7], [0.2, 0.78], [0.04, 0.76]], 0.04, 0.002), C.GHIACCIO_L, 0, 0, 0, {}, 'viva')
  for (const [x, y, r, h, a] of [[-0.05, 0.72, 0.03, 0.2, 1.2], [-0.04, 0.6, 0.02, 0.14, 1.9], [-0.03, 0.82, 0.02, 0.14, 0.7]]) f.metti(cristallo(r, h, 5), C.NEVE, x, y, 0, { rz: a }, 'metallo')
  collare(f, 0.7, C.ACCIAIO_S, 0.042, 0.24)
  f.metti(cristallo(0.04, 0.12, 5), C.GHIACCIO_L, 0, 1.0, 0, {}, 'viva')
  const br = braci(f, C.NEVE, [0.0, 0.5, -0.06], [0.3, 0.5, 0.12], { n: 8, vel: 0.25, r: 0.014, sale: -0.2 })
  const g = f.chiudi(); g.userData.anima = anima(respira(g, 2.2, 0.5, 1.2), br)
  return g
}
// 9 ─ ascia del tuono: due lame d'acciaio scuro, vene di fulmine e archi elettrici fra le punte
function tuono () {
  const f = new Fucina()
  manico(f, { y1: 0.9, puntale: C.TUONO_S, col: C.TUONO_S, fascia: C.FULMINE })
  const lamaD = [[0.03, 0.6], [0.13, 0.56], [0.24, 0.44], [0.27, 0.54], [0.22, 0.62], [0.26, 0.7], [0.22, 0.78], [0.27, 0.86], [0.24, 0.96], [0.13, 0.84], [0.03, 0.8]]
  f.metti(poli(lamaD, 0.03, 0.004), C.TUONO, 0, 0, 0, {}, 'metallo')
  f.metti(poli(spec(lamaD), 0.03, 0.004), C.TUONO, 0, 0, 0, {}, 'metallo')
  for (const s of [-1, 1]) {
    f.metti(poli([[s * 0.04, 0.7], [s * 0.1, 0.72], [s * 0.15, 0.68], [s * 0.2, 0.7], [s * 0.15, 0.66], [s * 0.1, 0.69]], 0.036, 0.001), C.FULMINE, 0, 0, 0, {}, 'viva')
    f.metti(cristallo(0.02, 0.09, 4), C.FULMINE_V, s * 0.265, 0.45, 0, { rz: -s * 0.4 }, 'viva')
    f.metti(cristallo(0.02, 0.09, 4), C.FULMINE_V, s * 0.26, 0.95, 0, { rz: s * 0.4 }, 'viva')
  }
  collare(f, 0.7, C.TUONO_S, 0.044, 0.26)
  f.metti(ott(0.05), C.FULMINE, 0, 0.7, 0.03, { s: [1, 1.2, 0.8] }, 'viva')
  f.metti(con(0.03, 0.14, 5), C.FULMINE_V, 0, 1.0, 0, {}, 'viva')
  const l1 = lampo(f, [-0.26, 0.45, 0], [-0.04, 1.05, 0], { n: 5, scarto: 0.05, seme: 1 })
  const l2 = lampo(f, [0.26, 0.45, 0], [0.04, 1.05, 0], { n: 5, scarto: 0.05, seme: 7 })
  const l3 = lampo(f, [-0.26, 0.96, 0.0], [0.26, 0.96, 0.0], { n: 6, scarto: 0.04, seme: 13 })
  const sc = braci(f, C.FULMINE, [-0.3, 0.4, -0.05], [0.6, 0.7, 0.1], { n: 8, vel: 0.9, r: 0.013, sale: 0.15 })
  const g = f.chiudi(); g.userData.anima = anima(respira(g, 7, 0.5, 1.3), l1, l2, l3, sc)
  return g
}
// 10 ─ ascia del re: oro e gemme, due lame ad ali, corona sulla cima, cerchio che gira
function re () {
  const f = new Fucina()
  manico(f, { y1: 1.0, puntale: C.ORO, col: C.BLU_S, fascia: C.ORO })
  for (const y of [-0.04, 0.04]) f.metti(cil(0.034, 0.034, 0.02, 8), C.ORO, 0, y, 0, {}, 'oro')
  const ala = [[0.03, 0.66], [0.12, 0.6], [0.2, 0.5], [0.3, 0.46], [0.34, 0.56], [0.3, 0.64], [0.35, 0.74], [0.3, 0.84], [0.34, 0.92], [0.3, 1.0], [0.2, 0.94], [0.12, 0.84], [0.03, 0.8]]
  f.metti(poli(ala, 0.034, 0.004), C.ORO, 0, 0, 0, {}, 'oro')
  f.metti(poli(spec(ala), 0.034, 0.004), C.ORO, 0, 0, 0, {}, 'oro')
  for (const s of [-1, 1]) {
    f.metti(poli([[s * 0.05, 0.7], [s * 0.2, 0.62], [s * 0.3, 0.7], [s * 0.2, 0.78]], 0.04, 0.002), C.ARGENTO, 0, 0, 0, {}, 'metallo')
    f.metti(ott(0.026), s > 0 ? C.RUBINO : C.CIANO, s * 0.2, 0.7, 0.03, { s: [1, 1.3, 0.8] }, 'viva')
    f.metti(cristallo(0.016, 0.1, 4), C.LUCE, s * 0.335, 0.52, 0, { rz: -s * 0.5 }, 'viva')
    f.metti(cristallo(0.016, 0.1, 4), C.LUCE, s * 0.33, 0.98, 0, { rz: s * 0.5 }, 'viva')
  }
  collare(f, 0.73, C.ORO_S, 0.05, 0.3, 'oro')
  f.metti(sfe(0.07, 8, 6), C.ORO, 0, 0.73, 0, {}, 'oro')
  f.metti(ott(0.05), C.RUBINO, 0, 0.73, 0.05, { s: [1, 1.2, 0.8] }, 'viva')
  for (let i = 0; i < 5; i++) { const a = (i - 2) * 0.45; f.metti(con(0.018, 0.1 + (i % 2 ? 0 : 0.04), 4), C.ORO, Math.sin(a) * 0.07, 1.02 + Math.cos(a) * 0.03, 0, { rz: -a }, 'oro') }   // la corona
  f.metti(cil(0.045, 0.04, 0.05, 8), C.ORO, 0, 1.0, 0, {}, 'oro')
  const cerchio = f.libero(toro(0.13, 0.008, 4, 22), C.LUCE, 0, 0.73, 0, 1.4)
  const sc = braci(f, C.LUCE, [-0.3, 0.4, -0.06], [0.6, 0.7, 0.12], { n: 10, vel: 0.35, r: 0.016, sale: 0.25 })
  const gm = orbita(f, C.RUBINO, [0, 0.73, 0], 0.19, { n: 3, vel: 1.2, r: 0.018 })
  const g = f.chiudi(); g.userData.anima = anima(respira(g, 3, 0.5, 1.3), sc, gm, t => { cerchio.rotation.set(t * 0.8, t * 0.5, 0) })
  return g
}

export const ASCE = [
  ['accetta', 'Accetta', 1, 'nessuno', accetta],
  ['scure', 'Scure da boscaiolo', 2, 'nessuno', scure],
  ['ascia-guerra', 'Ascia da guerra', 3, 'nessuno', guerra],
  ['ascia-vichinga', 'Ascia vichinga', 4, 'nessuno', vichinga],
  ['bipenne', 'Bipenne', 5, 'nessuno', bipenne],
  ['ascia-nano', 'Ascia da nano runica', 6, 'arcano', nano],
  ['ascia-lava', 'Ascia di lava', 7, 'fuoco', lava],
  ['ascia-gelo', 'Ascia del gelo', 8, 'ghiaccio', gelo],
  ['ascia-tuono', 'Ascia del tuono', 9, 'fulmine', tuono],
  ['ascia-re', 'Ascia del re', 10, 'oro', re]
]
