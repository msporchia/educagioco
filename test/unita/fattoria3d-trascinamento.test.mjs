/* Il pezzo tenuto al dito (scena3d/trascinamento-puro.js): il centro del pezzo cade sul punto che il dito tiene, la cella del fantasma è quella
   dove si costruisce, lo scarto della presa si conserva; e lo scorrimento ai bordi (fascia, curva, zero fuori fascia). Senza browser.
   `node test/esegui.mjs fattoria3d-trascinamento`
   tempo: 1 */
import { controlla, riassunto } from '../aiuto/verifica.mjs'
const uguale = (cosa, avuto, atteso) => controlla(cosa, JSON.stringify(avuto) === JSON.stringify(atteso), 'ho ' + JSON.stringify(avuto))   // JSON: -0 e 0 sono lo stesso scorrimento
import { cellaSottoIlDito, centroDi, scartoDellaPresa, dentroIlPezzo, velocitaBordo, FASCIA_PX, VEL_MIN, VEL_MAX } from '../../src/giochi/fattoria3d/scena3d/trascinamento-puro.js'

/* ══════════ 1. l'ancoraggio: il centro del pezzo sul punto del dito ══════════ */
// per ogni misura il centro del pezzo ancorato sta a meno di mezza cella dal punto (è la griglia a farlo scattare, mai di più)
for (const [w, d] of [[1, 1], [2, 2], [3, 3], [4, 3], [3, 4], [2, 1], [5, 5]]) {
  let peggio = 0
  for (let x = 10; x < 12; x += 0.05) for (let z = -7; z < -5; z += 0.05) {
    const a = cellaSottoIlDito({ x, z }, w, d), c = centroDi(a.i, a.j, w, d)
    peggio = Math.max(peggio, Math.abs(c.x - x), Math.abs(c.z - z))
  }
  controlla(`${w}×${d}: il centro resta a mezza cella dal punto del dito`, peggio <= 0.5 + 1e-9, 'scarto ' + peggio.toFixed(3))
}
// i casi a mano: un 3×3 con il dito al centro della sua cella di mezzo, un 2×2 sull'incrocio, un 1×1 nella sua cella
uguale('3×3 col dito al centro della cella (5,7): l\'angolo è (4,6)', cellaSottoIlDito({ x: 5.5, z: 7.5 }, 3, 3), { i: 4, j: 6 })
uguale('2×2 sull\'incrocio (5,7): l\'angolo è (4,6)', cellaSottoIlDito({ x: 5.0, z: 7.0 }, 2, 2), { i: 4, j: 6 })
uguale('1×1 nella cella (5,7)', cellaSottoIlDito({ x: 5.4, z: 7.6 }, 1, 1), { i: 5, j: 7 })
uguale('4×3: centro (6,7.5) → l\'angolo è (4,6)', cellaSottoIlDito({ x: 5.5, z: 7.5 }, 4, 3), { i: 4, j: 6 })
uguale('vicino all\'origine l\'angolo è negativo (il mondo non ha confini)', cellaSottoIlDito({ x: 0.2, z: 0.2 }, 3, 3), { i: -1, j: -1 })
uguale('coordinate negative', cellaSottoIlDito({ x: -3.4, z: -0.4 }, 2, 2), { i: -4, j: -1 })
// il vecchio errore: la cella sotto il dito (floor) come angolo sposta un 3×3 di una cella e mezza in giù e a destra
{
  const p = { x: 5.5, z: 7.5 }, vecchio = centroDi(Math.floor(p.x), Math.floor(p.z), 3, 3), nuovo = centroDi(cellaSottoIlDito(p, 3, 3).i, cellaSottoIlDito(p, 3, 3).j, 3, 3)
  controlla('con l\'angolo sotto il dito un 3×3 finiva una cella in giù e a destra (due, col dito sull\'angolo della cella)', vecchio.x - p.x === 1 && vecchio.z - p.z === 1)
  controlla('con il centro sotto il dito sta esatto', nuovo.x === p.x && nuovo.z === p.z)
}

/* ══════════ 2. lo scarto della presa si conserva ══════════ */
{
  // un 3×3 con l'angolo in (10,20): il dito lo prende nell'angolo in alto a sinistra (10.3, 20.2)
  const presa = { x: 10.3, z: 20.2 }, scarto = scartoDellaPresa(presa, 10, 20, 3, 3)
  uguale('subito dopo la presa il pezzo non salta', cellaSottoIlDito(presa, 3, 3, scarto), { i: 10, j: 20 })
  uguale('spostando il dito di (4,-2) il pezzo si sposta di (4,-2)', cellaSottoIlDito({ x: presa.x + 4, z: presa.z - 2 }, 3, 3, scarto), { i: 14, j: 18 })
  // per ogni misura e punto di presa (anche dentro i bordi) la presa non sposta il pezzo
  let tutti = true
  for (const [w, d] of [[1, 1], [2, 2], [3, 3], [4, 3]]) for (let fx = 0; fx <= 1; fx += 0.25) for (let fz = 0; fz <= 1; fz += 0.25) {
    const p = { x: 7 + fx * w, z: 3 + fz * d }, s = scartoDellaPresa(p, 7, 3, w, d), a = cellaSottoIlDito(p, w, d, s)
    if (a.i !== 7 || a.j !== 3) tutti = false
  }
  controlla('afferrato in qualunque punto il pezzo resta dov\'è', tutti)
}
controlla('un dito dentro il pezzo lo afferra', dentroIlPezzo({ x: 11, z: 21 }, 10, 20, 3, 3))
controlla('a un passo dal bordo lo afferra ancora (il dito è largo)', dentroIlPezzo({ x: 9.2, z: 21 }, 10, 20, 3, 3))
controlla('lontano non lo afferra', !dentroIlPezzo({ x: 7, z: 21 }, 10, 20, 3, 3))

/* ══════════ 3. lo scorrimento ai bordi ══════════ */
const area = { sinistra: 0, destra: 400, alto: 64, basso: 700 }
const v = (x, y) => velocitaBordo(x, y, area)
uguale('al centro non scorre', v(200, 380), { x: 0, z: 0 })
uguale('appena fuori della fascia non scorre', v(FASCIA_PX + 1, 64 + FASCIA_PX + 1), { x: 0, z: 0 })
controlla('al bordo sinistro scorre a sinistra (negativo) alla velocità massima', v(0, 380).x === -VEL_MAX && v(0, 380).z === 0)
controlla('al bordo destro scorre a destra', v(400, 380).x === VEL_MAX)
controlla('in alto (sotto la barra) scorre verso l\'alto, cioè z negativa', v(200, 64).z === -VEL_MAX)
controlla('in basso (sopra la fascia «metti via») scorre in giù', v(200, 700).z === VEL_MAX)
controlla('oltre il bordo non va più veloce del massimo', v(-80, 380).x === -VEL_MAX && v(200, 900).z === VEL_MAX)
controlla('appena dentro la fascia va piano (~VEL_MIN)', v(FASCIA_PX - 1, 380).x < 0 && v(FASCIA_PX - 1, 380).x > -(VEL_MIN + 0.05))
{
  let cresce = true, prec = 0
  for (let x = FASCIA_PX - 1; x >= 0; x -= 4) { const s = -v(x, 380).x; if (s < prec) cresce = false; prec = s }
  controlla('la velocità cresce verso il bordo', cresce)
}
controlla('nell\'angolo scorrono i due assi', v(0, 64).x === -VEL_MAX && v(0, 64).z === -VEL_MAX)
controlla('su uno schermo stretto le due fasce si compensano (non parte da sola)', (() => { const s = velocitaBordo(30, 380, { sinistra: 0, destra: 60, alto: 0, basso: 760 }); return Math.abs(s.x) < VEL_MAX })())

riassunto()
