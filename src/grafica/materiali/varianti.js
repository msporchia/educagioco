/* ═══════════════════════════════════════════════════════════════════
   LE VARIANTI DI POSA — il disegno che cambia ogni cinque celle

   Il problema che risolve questo file: un pavimento fatto di soli
   dettagli sparsi con la stessa densità dappertutto **si legge come
   una stampa**. Ogni cella è come la sua vicina, e siccome la cella è
   quella della griglia, l'occhio ritrova la griglia. Non serve un
   dettaglio più bello: serve che il pavimento **cambi**, e che cambi
   con un passo molto più largo della cella.

   Quindi qui non ci sono granelli: c'è la **macchia**. Un reticolo di
   siti ogni `MODULO` celle — cinque, cioè 180 px a lato 36, cinque
   volte la cella e mezzo schermo di telefono in larghezza —
   sballottati di mezza maglia. Ogni sito pesca una variante dal
   sacchetto dell'ambiente (`A.varianti`) e la stende attorno a sé
   sfumando. Due macchie vicine si sovrappongono, così il confine fra
   una e l'altra non è mai una linea.

   ── il sacchetto è pesato ──
   `A.varianti` è una lista, e un nome che compare due volte esce il
   doppio delle volte. `liscio` sta quasi sempre due volte apposta: se
   tutte le macchie fanno qualcosa, il pavimento torna uniforme —
   uniformemente carico invece che uniformemente vuoto, ma uniforme. È
   il vuoto che fa vedere il pieno.

   ── qui la macchina, in `posature.js` i modi ──
   Questo file sa **dove** cambia il pavimento; che cosa vuol dire
   «usurato» o «con i detriti» sta accanto, in `posature.js`. Le due
   cose si toccano in un punto solo — la tabella `POSATURE`, con la
   firma `(c, cx, cy, raggio, A, lato, r)` — e aggiungere un modo
   nuovo non allunga di una riga quello che c'è qui.
   ═══════════════════════════════════════════════════════════════════ */
import { dado, velo } from '../comune.js'
import { POSATURE } from './posature.js'

/* quante celle prima che il disegno ricominci a raccontare un'altra
   cosa. Cinque, cioè 180 px a lato 36: **mezzo schermo di telefono**.
   Sotto le tre le macchie diventano loro il motivo ripetuto e si torna
   da capo; sopra le otto una stanza intera ne prende due o tre e non
   si vede più che cambia. La cella resta cinque volte più piccola —
   che è tutto il punto: il passo del disegno non deve avere niente a
   che fare col passo della griglia. */
export const MODULO = 5

/* i siti delle macchie, deterministici come tutto il resto */
export function macchie(reg, lato, seme, quali, fn) {
  const passo = lato * MODULO
  const gx0 = Math.floor(reg.x0 / passo) - 1, gx1 = Math.ceil(reg.x1 / passo) + 1
  const gy0 = Math.floor(reg.y0 / passo) - 1, gy1 = Math.ceil(reg.y1 / passo) + 1
  for (let gy = gy0; gy < gy1; gy++)
    for (let gx = gx0; gx < gx1; gx++) {
      const d = m => dado(gx * 13 + m, gy * 7, seme)
      const cx = (gx + 0.5 + (d(1) - 0.5) * 1.1) * passo
      const cy = (gy + 0.5 + (d(2) - 0.5) * 1.1) * passo
      const raggio = passo * (0.46 + d(3) * 0.38)
      /* i siti si generano anche fuori dalla stanza — devono, se no le
         macchie si fermerebbero al bordo e il bordo si vedrebbe — ma
         quello che cade tutto fuori non lo dipinge nessuno: su una
         mappa grande è quasi metà dei siti, e sono millisecondi veri */
      if (cx + raggio < reg.x0 || cx - raggio > reg.x1 ||
          cy + raggio < reg.y0 || cy - raggio > reg.y1) continue
      fn(quali[Math.floor(d(4) * quali.length) % quali.length], cx, cy, raggio,
         (a, b = 0) => dado(gx * 31 + a, gy * 17 + b, seme + 5))
    }
}

/* il sacchetto di scorta, per un ambiente che non dice il suo */
const PREDEFINITE = ['liscio', 'liscio', 'usura', 'ombra', 'detriti']

/* ═════ il passaggio che mappa.js chiama ═════
   Prima il fondo mosso — le due tinte dell'ambiente appena diverse,
   piccole e fitte, dappertutto: è quello che toglie la sensazione di
   stampato — e poi le macchie, che sono quelle che dicono *dove*. */
export function variazioni(c, reg, A, lato, seme = 71) {
  semina0(c, reg, A, lato)
  macchie(reg, lato, seme, A.varianti || PREDEFINITE, (quale, cx, cy, R, r) => {
    const fn = POSATURE[quale]
    if (fn) fn(c, cx, cy, R, A, lato, r)
  })
}

/* il fondo mosso: la vecchia mano di chiazze, dimezzata di taglia e
   raddoppiata di numero. Da sola non basta più — ci pensano le
   macchie — ma senza, il pavimento sotto le macchie è una tinta. */
function semina0(c, reg, A, lato) {
  const passo = lato * 0.8
  const gx0 = Math.floor(reg.x0 / passo), gx1 = Math.ceil(reg.x1 / passo)
  const gy0 = Math.floor(reg.y0 / passo), gy1 = Math.ceil(reg.y1 / passo)
  for (let gy = gy0; gy < gy1; gy++)
    for (let gx = gx0; gx < gx1; gx++) {
      const r = m => dado(gx * 7, gy * 13, 3 + m)
      const x = (gx + r(1)) * passo, y = (gy + r(2)) * passo
      const rx = lato * (0.14 + r(3) * 0.4)
      velo(c, 0.04 + r(4) * 0.055, () => {
        c.fillStyle = r(5) > 0.5 ? A.chiazze[0] : A.chiazze[1]
        c.beginPath()
        c.ellipse(x, y, rx, rx * (0.35 + r(6) * 0.4), r(7) * 3, 0, 6.29)
        c.fill()
      })
    }
}
