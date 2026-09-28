// Il buio e le pozze di luce: vedi docs/core/grafica.md.
import { rett, ell, velo } from './comune.js'
import { semina } from './materiali/indice.js'

const NOTTE = '#0a0c16'          // blu quasi nero: il buio grigio è cenere

function pozza(c, x, y, r, schiaccia, fermate) {
  c.save()
  c.translate(x, y); c.scale(1, schiaccia)
  const g = c.createRadialGradient(0, 0, r * 0.06, 0, 0, r)
  for (const [p, col] of fermate) g.addColorStop(p, col)
  c.fillStyle = g
  c.beginPath(); c.arc(0, 0, r, 0, 6.29); c.fill()
  c.restore()
}

export function luceEBuio(c, W, H, A, torce, lato) {
  const R = lato * 2.7                       // fin dove arriva una torcia
  const fiamma = A.fiamma || A.luce

  if (A.buio) {
    const cv = document.createElement('canvas')
    cv.width = Math.max(1, Math.round(W)); cv.height = Math.max(1, Math.round(H))
    const v = cv.getContext('2d')
    v.fillStyle = NOTTE; v.fillRect(0, 0, W, H)
    v.globalCompositeOperation = 'destination-out'
    for (const [i, k] of torce) {
      const x = i * lato + lato / 2, y = (k + 1) * lato - lato * 0.2
      // il bordo si spegne piano: senza, la pozza ha un contorno e sembra un tappeto
      pozza(v, x, y, R, 0.82, [[0, '#000000ff'], [0.3, '#000000f2'],
                               [0.62, '#00000090'], [0.85, '#00000030'], [1, '#00000000']])
    }
    velo(c, A.buio, () => c.drawImage(cv, 0, 0, W, H))
  }

  if (!torce.length) return

  // il calore satura quello che c'è sotto, non lo copre: stesse 4 tappe di caduta() e del velo del buio
  const prima = c.globalCompositeOperation
  c.globalCompositeOperation = 'soft-light'
  for (const [i, k] of torce) {
    const x = i * lato + lato / 2, y = (k + 1) * lato - lato * 0.2
    pozza(c, x, y, R * 0.95, 0.82,
          [[0, fiamma + 'ff'], [0.22, fiamma + 'e8'], [0.48, fiamma + '70'],
           [0.75, fiamma + '24'], [1, fiamma + '00']])
  }
  c.globalCompositeOperation = 'screen'   // il cuore della pozza: il mezzo metro che deve sembrare bruciare
  for (const [i, k] of torce) {
    const x = i * lato + lato / 2, y = (k + 1) * lato - lato * 0.35
    pozza(c, x, y, R * 0.5, 0.86,
          [[0, A.luce + '99'], [0.3, A.luce + '55'], [0.6, A.luce + '18'], [1, A.luce + '00']])
    pozza(c, x, y - lato * 0.28, lato * 0.5, 1,
          [[0, '#fff6d0cc'], [0.4, '#fff6d066'], [1, '#fff6d000']])
  }
  c.globalCompositeOperation = prima
}

// il sole fra le foglie: lighter (si somma), non soft-light come le torce (sposterebbe il verde verso l'oliva)
export function chiazzeDiLuce(c, reg, A, lato) {
  const prima = c.globalCompositeOperation
  c.globalCompositeOperation = 'lighter'
  semina(reg, lato * 2.4, 41, 1, null, (x, y, r) => {
    if (r(1) < 0.42) return
    const rx = lato * (0.7 + r(2) * 1.5)
    velo(c, A.chiazzeLuce * (0.5 + r(3) * 0.5), () =>
      pozza(c, x, y, rx, 0.72, [[0, A.luce + 'ee'], [0.5, A.luce + '88'], [1, A.luce + '00']]))
  })
  semina(reg, lato * 7, 43, 1, null, (x, y, r) => {   // qualche raggio netto: dice «sole», non «giorno»
    if (r(1) < 0.55) return
    velo(c, A.chiazzeLuce * 0.5, () =>
      pozza(c, x, y, lato * (0.35 + r(2) * 0.3), 0.6,
            [[0, '#fffbe8'], [0.6, A.luce + '99'], [1, A.luce + '00']]))
  })
  c.globalCompositeOperation = prima
}

// La luce che si può chiedere: creaLuce().in(x,y) torna { tinta, forza,
// buio } per illuminare i personaggi come il fondale sotto di loro (vedi
// docs/core/grafica.md).
function caduta(q) {
  if (q >= 1) return 0
  if (q <= 0.3) return 1 - q * 0.16
  if (q <= 0.62) return 0.95 - (q - 0.3) / 0.32 * 0.39
  if (q <= 0.85) return 0.56 - (q - 0.62) / 0.23 * 0.37
  return 0.19 * (1 - (q - 0.85) / 0.15)
}

export function creaLuce({ ambiente, torce = [], lato = 36 }) {
  const A = ambiente || {}
  const R = lato * 2.7                       // fin dove arriva una torcia: come sopra
  const fiamma = A.fiamma || A.luce || '#ffb45a'
  const notte = A.buio || 0
  const tintaAmbiente = (A.fondo && A.fondo[1]) || null   // il colore del pavimento in ombra: fa sembrare *una* la stanza
  const fuochi = torce.map(([i, k]) => ({   // in pixel, una volta sola: la scena li interroga ogni fotogramma
    x: i * lato + lato / 2,
    y: (k + 1) * lato - lato * 0.35,
  }))

  return {
    fuochi,
    // x,y in pixel della MAPPA: chi disegna in coordinate schermo ci somma la camera prima di chiedere
    in(x, y) {
      let forza = 0, vicino = null, dmin = Infinity
      for (const f of fuochi) {
        const dx = x - f.x, dy = (y - f.y) / 0.82      // la pozza è schiacciata
        const d = Math.hypot(dx, dy)
        const q = caduta(d / R)
        if (q > forza) forza = q
        if (d < dmin) { dmin = d; vicino = f }
      }
      return { tinta: fiamma, forza, buio: notte * (1 - forza), fuoco: vicino,
               notte: NOTTE, ambiente: tintaAmbiente }
    },
  }
}

// per chi non ha un fondale (una vetrina, un ritratto): «pieno giorno, nessuna ombra»
export const LUCE_PIENA = {
  fuochi: [],
  in: () => ({ tinta: '#ffffff', forza: 0, buio: 0, fuoco: null, notte: NOTTE, ambiente: null }),
}

// la torcia del fondale: fiamma FERMA (quella che guizza è l'oggetto di scena `{ che: 'torcia' }`)
export function torciaFerma(c, x, y, s, A) {
  rett(c, x - 0.8 * s, y - 5 * s, 1.6 * s, 5 * s, '#4a4038')
  rett(c, x - 2.4 * s, y - 6.4 * s, 4.8 * s, 2 * s, '#5b5044')
  rett(c, x - 2.4 * s, y - 6.4 * s, 4.8 * s, 0.7 * s, '#7a6f60')
  velo(c, 0.9, () => {
    ell(c, x, y - 9 * s, 3.4 * s, 4.6 * s, A.luce + '66')
    ell(c, x, y - 8.6 * s, 2.2 * s, 3.4 * s, '#ff9a3c')
    ell(c, x, y - 8.2 * s, 1.2 * s, 2.2 * s, '#ffe9a0')
  })
}
