/* ═════ LO SCHELETRO ═════
   Quello delle cripte, e **non fa paura**: la regola è tutta qui.
   Niente occhiaie nere vuote, niente denti a sciabola, niente sangue.
   Al loro posto: testa tonda grande da pupazzo, due occhi che sono due
   lucine azzurre in mezzo al nero (come due occhietti, non come due
   buchi), una bocca cucita a puntini che sembra un sorriso, e una
   mascella che ciondola a ogni passo — un mostro un po' sciocco.

   È l'unico personaggio **chiaro** del gioco: in una cripta scura una
   macchia bianca che cammina non si confonde con nient'altro. */
import { capsula, poligono, tondo } from '../comune.js'
import { occhi } from '../segni.js'

export const SCHELETRO = {
  spalle: 4.6, taglia: 0.96, arti: 0.58,
  col: {
    pelle: '#efe9d8', pelleS: '#cdc5ae',
    manica: '#efe9d8', manicaS: '#cdc5ae',
    gambe: '#e8e1cd', gambeS: '#c6bda6',
    scarpe: '#cdc5ae', scarpeS: '#aca38b',
    osso: '#efe9d8', ossoS: '#c6bda6',
    straccio: '#5f6f96',
    fuoco: '#7fe0ff',
    bordo: '#3b3529',
  },
  dietro(q, s, C, dir) {
    // lo straccio sulle spalle: serve a non farlo sembrare nudo e a
    // dargli un colore suo in mezzo a tanto bianco
    const b = C.bordo, sp = 0.7 * s
    if (dir === 'su')
      poligono(q, [[-4.6 * s, -12.6 * s], [4.6 * s, -12.6 * s], [5.4 * s, -5 * s],
                   [-5.4 * s, -5 * s]], C.straccio, b, sp)
    else
      for (const v of [-1, 1])
        poligono(q, [[v * 2.4 * s, -12.6 * s], [v * 5 * s, -12.2 * s], [v * 5.6 * s, -5.4 * s],
                     [v * 3 * s, -6.4 * s]], C.straccio, b, sp)
  },
  tronco(q, s, C, dir) {
    const b = C.bordo, sp = 0.7 * s
    const w = dir === 'dx' ? 2.6 : 3.8
    // la colonna e il bacino, poi tre costole ad arco: una gabbia
    // toracica disegnata a costole singole a 36 px diventa una grattugia
    capsula(q, 0, -8.8 * s, 1 * s, 4.4 * s, 0.9 * s, C.ossoS, b, sp)
    capsula(q, 0, -5 * s, w * 0.9, 1.6 * s, 1.2 * s, C.osso, b, sp)      // il bacino
    q.ctx.strokeStyle = C.osso; q.ctx.lineWidth = 1.3 * s; q.ctx.lineCap = 'round'
    for (const dy of [-12, -10.4, -8.8]) {
      q.ctx.beginPath()
      q.ctx.moveTo(-w * s, dy * s)
      q.ctx.quadraticCurveTo(0, dy * s + 2.2 * s, w * s, dy * s)
      q.ctx.stroke()
    }
    // le clavicole: due trattini che chiudono in alto
    q.ctx.strokeStyle = C.ossoS; q.ctx.lineWidth = 1 * s
    q.ctx.beginPath()
    q.ctx.moveTo(-w * 1.05 * s, -12.8 * s); q.ctx.lineTo(w * 1.05 * s, -12.8 * s)
    q.ctx.stroke()
  },
  testa(q, s, C, dir, stato) {
    const b = C.bordo, sp = 0.75 * s, R = 4.6 * s
    const t = q.tempo || 0
    const ciondola = stato === 'ko' ? 0 : Math.abs(Math.sin(t * 3)) * 0.5 * s
    capsula(q, 0, 2.4 * s, 1 * s, 1.6 * s, 0.8 * s, C.ossoS, b, sp)       // il collo
    if (dir === 'su') {
      tondo(q, 0, 0, R * 0.94, R * 0.98, C.pelleS, b, sp)
      // la sutura del cranio: due linee, e si capisce che è un teschio
      q.ctx.strokeStyle = C.bordo; q.ctx.lineWidth = 0.6 * s
      q.ctx.beginPath()
      q.ctx.moveTo(0, -R * 0.95); q.ctx.lineTo(0, R * 0.3)
      q.ctx.moveTo(-R * 0.7, -R * 0.25); q.ctx.lineTo(R * 0.7, -R * 0.25)
      q.ctx.stroke()
      return
    }
    const dx = dir === 'dx' ? 0.4 * s : 0
    tondo(q, dx, 0, R * 0.94, R * 0.96, C.pelle, b, sp)
    // la mascella, staccata e ciondolante
    capsula(q, dx + (dir === 'dx' ? 0.4 * s : 0), R * 0.72 + ciondola,
            R * (dir === 'dx' ? 0.55 : 0.62), R * 0.24, R * 0.2, C.pelleS, b, sp)
    if (dir === 'dx') {
      // il muso: gli zigomi sporgono e sotto ci sta il buco del naso
      tondo(q, R * 0.78, -0.2 * s, R * 0.3, R * 0.26, C.pelleS, b, sp * 0.7)
      if (stato === 'ko') occhi(q, s, -0.6, -0.6, 0.7, stato, '#8a8272')
      else {
        tondo(q, R * 0.35, -R * 0.28, 1.1 * s, 1.2 * s, '#2a2b33')
        tondo(q, R * 0.42, -R * 0.24, 0.5 * s, 0.55 * s, C.fuoco)
      }
      q.ctx.strokeStyle = C.bordo; q.ctx.lineWidth = 0.5 * s
      for (let i = 0; i < 3; i++) {
        const tx = R * 0.25 + i * 0.95 * s
        q.ctx.beginPath()
        q.ctx.moveTo(tx, R * 0.55 + ciondola); q.ctx.lineTo(tx, R * 0.9 + ciondola)
        q.ctx.stroke()
      }
    } else {
      if (stato === 'ko') occhi(q, s, 1.7, -0.5, 0.8, stato, '#8a8272')
      else for (const v of [-1, 1]) {
        // l'occhiaia tonda e la lucina dentro: è il punto in cui uno
        // scheletro smette di essere macabro e diventa un pupazzo
        tondo(q, v * 1.75 * s, -0.6 * s, 1.35 * s, 1.45 * s, '#2a2b33')
        tondo(q, v * 1.75 * s + 0.2 * s, -0.5 * s, 0.6 * s, 0.65 * s, C.fuoco)
        q.velo(0.5, () => tondo(q, v * 1.75 * s + 0.2 * s, -0.5 * s, 1.1 * s, 1.2 * s, C.fuoco))
      }
      poligono(q, [[0, 1 * s], [0.8 * s, 2.2 * s], [-0.8 * s, 2.2 * s]], '#2a2b33')   // il naso
      // i denti: cinque trattini corti sulla mascella, che è già più
      // in basso perché ciondola
      q.ctx.strokeStyle = C.bordo; q.ctx.lineWidth = 0.5 * s
      for (let i = -2; i <= 2; i++) {
        q.ctx.beginPath()
        q.ctx.moveTo(i * 0.95 * s, R * 0.52 + ciondola)
        q.ctx.lineTo(i * 0.95 * s, R * 0.92 + ciondola)
        q.ctx.stroke()
      }
    }
  },
  arma(q, s, C, dir, sw, mani) {
    const b = C.bordo, sp = 0.65 * s
    // un femore per clava: buffo, e non è una spada — questo mostro non
    // deve sembrare armato sul serio
    q.in(mani.dx.x + (dir === 'dx' ? 1 : 0.4) * s, mani.dx.y + 0.4 * s, r => {
      capsula(r, 0, -3.4 * s, 0.75 * s, 3.4 * s, 0.6 * s, C.osso, b, sp)
      for (const dy of [-6.6, -0.2]) for (const v of [-1, 1])
        tondo(r, v * 0.85 * s, dy * s, 1 * s, 1 * s, C.osso, b, sp)
    }, dir === 'dx' ? 0.4 : 0.28)
  },
}
