// Le materie: di che cosa è fatta una forma. Vedi docs/core/grafica.md.
import { dado } from './comune.js'

const LATO = 48                      // il quadretto che si ripete

// in bianco/nero trasparente sopra il colore: una trama sola serve ogni tinta
const TRAME = {
  // stoffa: ordito fitto e debole, deve dire "non liscia" e non "righe"
  stoffa(c) {
    c.strokeStyle = '#ffffff30'; c.lineWidth = 1
    for (let i = 0; i < LATO; i += 4) {
      c.beginPath(); c.moveTo(i + 0.5, 0); c.lineTo(i + 0.5, LATO); c.stroke()
    }
    c.strokeStyle = '#00000038'
    for (let k = 0; k < LATO; k += 4) {
      c.beginPath(); c.moveTo(0, k + 0.5); c.lineTo(LATO, k + 0.5); c.stroke()
    }
    // e qualche filo più marcato, se no l'ordito è troppo regolare
    c.strokeStyle = '#00000048'
    for (let k = 0; k < LATO; k += 4)
      if (dado(k, 3, 1) > 0.6) {
        c.beginPath(); c.moveTo(0, k + 0.5); c.lineTo(LATO, k + 0.5); c.stroke()
      }
  },

  // cuoio: grana, macchie irregolari senza direzione (non trama)
  cuoio(c) {
    for (let i = 0; i < 260; i++) {
      const x = dado(i, 1, 5) * LATO, y = dado(i, 2, 5) * LATO
      const r = 0.6 + dado(i, 3, 5) * 1.6
      c.fillStyle = dado(i, 4, 5) > 0.5 ? '#ffffff28' : '#00000044'
      c.beginPath(); c.ellipse(x, y, r, r * 0.8, 0, 0, 6.29); c.fill()
    }
    // le pieghe: due o tre solchi lunghi e molli
    c.strokeStyle = '#00000038'; c.lineWidth = 1.6
    for (let i = 0; i < 3; i++) {
      const y = dado(i, 7, 5) * LATO
      c.beginPath(); c.moveTo(0, y)
      c.quadraticCurveTo(LATO / 2, y + (dado(i, 8, 5) - 0.5) * 10, LATO, y)
      c.stroke()
    }
  },

  // ferro: venature nel verso della martellatura, leggero (se si carica diventa legno)
  ferro(c) {
    c.lineWidth = 1; c.lineCap = 'round'
    for (let i = 0; i < 40; i++) {
      const y = dado(i, 1, 21) * LATO
      const x = dado(i, 2, 21) * LATO
      const l = 6 + dado(i, 3, 21) * 16
      c.strokeStyle = dado(i, 4, 21) > 0.5 ? '#ffffff2c' : '#00000030'
      c.beginPath(); c.moveTo(x, y); c.lineTo(x + l, y + (dado(i, 5, 21) - 0.5) * 3); c.stroke()
    }
    // le ammaccature del martello
    for (let i = 0; i < 26; i++) {
      const x = dado(i, 6, 21) * LATO, y = dado(i, 7, 21) * LATO
      c.fillStyle = '#00000022'
      c.beginPath(); c.ellipse(x, y, 1.6, 1.1, 0, 0, 6.29); c.fill()
    }
  },

  pelo(c) {
    c.lineWidth = 1; c.lineCap = 'round'
    for (let i = 0; i < 420; i++) {
      const x = dado(i, 1, 9) * LATO, y = dado(i, 2, 9) * LATO
      const l = 1.6 + dado(i, 3, 9) * 2.4
      c.strokeStyle = dado(i, 4, 9) > 0.55 ? '#ffffff34' : '#00000044'
      c.beginPath(); c.moveTo(x, y); c.lineTo(x + l * 0.4, y + l); c.stroke()
    }
  },
}

const quadretti = {}   // disegnati una volta sola per tutta la vita della pagina

function quadretto(nome) {
  if (quadretti[nome]) return quadretti[nome]
  const cv = document.createElement('canvas')
  cv.width = cv.height = LATO
  const c = cv.getContext('2d')
  TRAME[nome](c)
  quadretti[nome] = cv
  return cv
}

const motivi = new WeakMap()

export function trama(ctx, nome) {
  if (!TRAME[nome]) return null
  let per = motivi.get(ctx)
  if (!per) { per = {}; motivi.set(ctx, per) }
  if (!per[nome]) per[nome] = ctx.createPattern(quadretto(nome), 'repeat')
  return per[nome]
}
