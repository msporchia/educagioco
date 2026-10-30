/* I conti uguali su ogni telefono (src/motore/conti-uguali.js) danno quello che darebbe Math, a meno dell'ultima cifra: il motore
   che li usa invece di Math gioca come prima. `node test/esegui.mjs conti-uguali --niente-build` */
import { ipot, potenzaIntera, arcotangente, arcotangente2, arcocoseno, coseno, seno, logaritmo, esponenziale, potenza } from '../../src/motore/conti-uguali.js'
import { controlla, riassunto } from '../aiuto/verifica.mjs'

const TOLLERA = 1e-14
function scarto(nome, f, g, punti) {
  let peggio = 0, dove = null
  for (const p of punti) {
    const a = f(...p), b = g(...p), s = Math.abs(a - b) / Math.max(1, Math.abs(b))
    if (!(s <= peggio)) { peggio = s; dove = p }
  }
  controlla(`${nome}: come Math (scarto ${peggio.toExponential(1)})`, peggio < TOLLERA, `in ${dove}`)
}

let s = 12345
const caso = () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648 }
const fra = (a, b, n = 4000) => Array.from({ length: n }, () => [a + (b - a) * caso()])
const coppie = (a, b, n = 4000) => Array.from({ length: n }, () => [a + (b - a) * caso(), a + (b - a) * caso()])

scarto('ipot', ipot, Math.hypot, coppie(-50, 50))
scarto('arcotangente', arcotangente, Math.atan, [...fra(-3, 3), ...fra(-1e6, 1e6), [0], [1], [-1], [TOLLERA]])
scarto('arcotangente2', arcotangente2, Math.atan2, [...coppie(-10, 10), [0, 1], [0, -1], [1, 0], [-1, 0], [0, 0]])
scarto('arcocoseno', arcocoseno, Math.acos, [...fra(-1, 1), [1], [-1], [0], [0.99999999], [-0.99999999]])
scarto('coseno', coseno, Math.cos, fra(-60, 60))
scarto('seno', seno, Math.sin, fra(-60, 60))
scarto('logaritmo', logaritmo, Math.log, [...fra(1e-9, 1), ...fra(1, 1e6), [1], [2], [0.5]])
scarto('esponenziale', esponenziale, Math.exp, [...fra(-30, 30), [0], [1], [-1]])
scarto('potenza', potenza, Math.pow, [...fra(0, 1).map(([x]) => [x, 1.6]), ...coppie(0.01, 3).map(([x, e]) => [x, e]), [0, 1.6]])
scarto('potenzaIntera', potenzaIntera, Math.pow, [[0.7, 0], [0.7, 1], [0.7, 2], [0.7, 5], [2, 10], [1.5, 7]])

riassunto('I conti uguali su ogni telefono')
