/* ═══════════════════════════════════════════════════════════════════
   IL BUIO E LE POZZE DI LUCE

   È qui che ci si sbaglia per prima: si stende un velo giallo dove sta
   la torcia e si spera. Ne esce una stanza uniformemente scura con
   sopra delle macchie gialle uniformi — due tinte piatte invece di una.

   Una pozza di luce non si aggiunge al buio: **glielo toglie**. Quindi
   il velo si dipinge a parte, ci si fanno i buchi con `destination-out`
   (dove la torcia è più vicina il velo sparisce del tutto) e solo
   allora si posa sulla stanza. Dentro al buco si vede il pavimento
   dipinto per come è, con tutte le sue chiazze e le sue crepe; fuori
   resta la stessa stanza, al buio. È una cosa sola, illuminata a
   tratti, non due.

   Sopra ci vanno altri due passaggi corti, che sono quelli che fanno
   sembrare la luce **calda** invece che «meno scura»:
     · `soft-light` con la tinta della fiamma: satura, non schiarisce —
       la pietra grigia sotto la torcia diventa pietra dorata;
     · `screen` sul cuore della pozza: il mezzo metro attorno alla
       fiaccola, quello che deve bruciare.

   Il buio è un velo **piatto**, mai una vignettatura: la mappa scorre,
   e una vignettatura seguirebbe la mappa invece dello schermo — si
   vedrebbero gli angoli scuri in mezzo al cammino.
   ═══════════════════════════════════════════════════════════════════ */
import { rett, ell, velo } from './comune.js'
import { semina } from './materiali/indice.js'

const NOTTE = '#0a0c16'          // blu quasi nero: il buio grigio è cenere

/* un'ellisse sfumata, schiacciata come tutto quello che sta a terra */
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

  /* ── il velo bucato ──
     Su una tela di scorta: sono gradienti morbidi, un pixel per pixel
     basta e avanza (a 34×22 celle sono quattro mega, e si buttano
     subito dopo). */
  if (A.buio) {
    const cv = document.createElement('canvas')
    cv.width = Math.max(1, Math.round(W)); cv.height = Math.max(1, Math.round(H))
    const v = cv.getContext('2d')
    v.fillStyle = NOTTE; v.fillRect(0, 0, W, H)
    v.globalCompositeOperation = 'destination-out'
    for (const [i, k] of torce) {
      const x = i * lato + lato / 2, y = (k + 1) * lato - lato * 0.2
      // al centro il velo sparisce tutto; il bordo si spegne piano, se
      // no la pozza ha un contorno e sembra un tappeto
      pozza(v, x, y, R, 0.82, [[0, '#000000ff'], [0.3, '#000000f2'],
                               [0.62, '#00000090'], [0.85, '#00000030'], [1, '#00000000']])
    }
    velo(c, A.buio, () => c.drawImage(cv, 0, 0, W, H))
  }

  if (!torce.length) return

  /* ── il calore: satura quello che c'è sotto, non lo copre ── */
  const prima = c.globalCompositeOperation
  c.globalCompositeOperation = 'soft-light'
  for (const [i, k] of torce) {
    const x = i * lato + lato / 2, y = (k + 1) * lato - lato * 0.2
    pozza(c, x, y, R * 0.95, 0.82,
          [[0, fiamma + 'ee'], [0.45, fiamma + '99'], [1, fiamma + '00']])
  }
  /* ── il cuore della pozza: piccolo e acceso ── */
  c.globalCompositeOperation = 'screen'
  for (const [i, k] of torce) {
    const x = i * lato + lato / 2, y = (k + 1) * lato - lato * 0.35
    pozza(c, x, y, R * 0.5, 0.86,
          [[0, A.luce + '66'], [0.4, A.luce + '2a'], [1, A.luce + '00']])
    pozza(c, x, y - lato * 0.28, lato * 0.5, 1,
          [[0, '#fff6d0aa'], [1, '#fff6d000']])
  }
  c.globalCompositeOperation = prima
}

/* ── la luce a chiazze del bosco ──
   Il sole che passa fra le foglie: macchie morbide, tante, di misura
   diversa. Il posto lo dice il dado, quindi il bosco esce sempre lo
   stesso.

   Il modo di posarle è `lighter`, cioè **si somma**, e non
   `soft-light` come le pozze delle torce: sull'erba verde una luce
   calda in soft-light sposta la tinta verso l'oliva, e le pozze di
   sole sembravano chiazze di terra battuta. Sommata, invece,
   schiarisce il verde e resta verde. */
export function chiazzeDiLuce(c, reg, A, lato) {
  const prima = c.globalCompositeOperation
  c.globalCompositeOperation = 'lighter'
  semina(reg, lato * 2.4, 41, 1, null, (x, y, r) => {
    if (r(1) < 0.42) return
    const rx = lato * (0.7 + r(2) * 1.5)
    velo(c, A.chiazzeLuce * (0.5 + r(3) * 0.5), () =>
      pozza(c, x, y, rx, 0.72, [[0, A.luce + 'ee'], [0.5, A.luce + '88'], [1, A.luce + '00']]))
  })
  // e qualche raggio netto: è quello che dice «sole», non «giorno»
  semina(reg, lato * 7, 43, 1, null, (x, y, r) => {
    if (r(1) < 0.55) return
    velo(c, A.chiazzeLuce * 0.5, () =>
      pozza(c, x, y, lato * (0.35 + r(2) * 0.3), 0.6,
            [[0, '#fffbe8'], [0.6, A.luce + '99'], [1, A.luce + '00']]))
  })
  c.globalCompositeOperation = prima
}

/* la torcia del fondale: un braccio di ferro, la fiaccola, la fiamma.
   Sta nel fondale, quindi la fiamma è **ferma** — a 36 px si vede il
   bagliore, non il guizzo, e il bagliore ce l'ha già dipinto sotto.
   Quella che guizza è l'oggetto di scena `{ che: 'torcia' }`, che
   costa di più e si mette dove conta. */
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
