/* ═══════════════════════════════════════════════════════════════════
   GLI ATTREZZI DEI MATERIALI

   Le quattro cose che ogni posa e ogni muratura usano: come si sparge
   roba su una regione, come si traccia una lastra, un masso, un
   concio, una crepa. Sono qui e non in `comune.js` perché servono solo
   a chi dipinge il terreno.

   ── il caso è deterministico ──
   Non c'è una sequenza casuale da consumare nell'ordine giusto: ogni
   granello è una **funzione pura della sua posizione** (`dado(i,k,n)`).
   La stessa stanza esce identica anche se domani la si dipingesse a
   riquadri, al contrario, o due volte.
   ═══════════════════════════════════════════════════════════════════ */
import { mescola, dado, poly } from '../comune.js'

/* semina roba su una regione: una griglia grossa, e dentro ogni maglia
   `quanti` oggetti messi dove dice il dado. Densità = area / passo².
   `dove` può rifiutare un posto (per non piantare l'erba nel muro). */
export function semina(reg, passo, seme, quanti, dove, fn) {
  const gx0 = Math.floor(reg.x0 / passo), gx1 = Math.ceil(reg.x1 / passo)
  const gy0 = Math.floor(reg.y0 / passo), gy1 = Math.ceil(reg.y1 / passo)
  for (let gy = gy0; gy < gy1; gy++)
    for (let gx = gx0; gx < gx1; gx++)
      for (let n = 0; n < quanti; n++) {
        const x = (gx + dado(gx, gy, seme + n * 17)) * passo
        const y = (gy + dado(gy, gx, seme + n * 31)) * passo
        if (x < reg.x0 || x > reg.x1 || y < reg.y0 || y > reg.y1) continue
        if (dove && !dove(x, y)) continue
        fn(x, y, m => dado(gx * 7 + n, gy * 13, seme + m * 41))
      }
}

/* la lastra: un poligono con gli angoli sbeccati, mai un rettangolo.
   È il rettangolo perfetto che fa sembrare tutto un foglio a quadretti. */
export function lastra(c, x, y, w, h, col, chiaro, scuro, r) {
  const j = Math.min(w, h) * 0.06
  const p = [
    [x + j * r(1) * 2, y + j * r(2)],
    [x + w * 0.5, y - j * r(3) * 0.6],
    [x + w - j * r(4) * 2, y + j * r(5)],
    [x + w + j * r(6) * 0.5, y + h * 0.5],
    [x + w - j * r(7) * 2, y + h - j * r(8)],
    [x + w * 0.5, y + h + j * r(9) * 0.6],
    [x + j * r(10) * 2, y + h - j * r(11)],
    [x - j * r(12) * 0.5, y + h * 0.5],
  ]
  poly(c, p, col)
  // lo smusso: luce da sopra a sinistra, ombra sotto a destra
  poly(c, [p[0], p[1], p[2], [x + w * 0.5, y + h * 0.22], [x + j, y + h * 0.2]], chiaro)
  poly(c, [p[4], p[5], p[6], [x + w * 0.5, y + h * 0.8], [x + w - j, y + h * 0.78]], scuro)
}

/* il masso di roccia grezza: un poligono a sette lati con il centro
   spostato a caso. Non è una lastra sbeccata — non ha spigoli retti, e
   messi uno accanto all'altro non formano corsi.

   `scuro` è facoltativo, e non è un capriccio: di massi ce ne sono
   migliaia su una mappa grande, e il terzo tracciato di ognuno costa
   quanto tutti gli altri dettagli della stanza messi insieme. Sulla
   parete si tiene solo la faccia in luce — l'ombra la fa già il masso
   accanto. */
export function masso(c, cx, cy, r, col, chiaro, scuro, dai) {
  const p = []
  for (let i = 0; i < 7; i++) {
    const a = i / 7 * 6.283
    const rr = r * (0.68 + dai(i) * 0.5)
    p.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.86])
  }
  poly(c, p, col)
  poly(c, [p[5], p[6], p[0], [cx, cy - r * 0.1]], chiaro)
  if (scuro) poly(c, [p[2], p[3], p[4], [cx, cy + r * 0.12]], scuro)
}

/* una pietra di taglio irregolare, con la faccia in luce in alto */
export function concio(c, x, y, w, h, col, r, sbeccata) {
  const j = Math.min(w, h) * 0.1
  const p = [
    [x + j * r(1), y + j * r(2) * 0.6],
    [x + w * 0.5, y - j * r(3) * 0.5],
    [x + w - j * r(4), y + j * r(5) * 0.6],
    [x + w + j * r(6) * 0.4, y + h * 0.55],
    [x + w - j * r(7), y + h - j * r(8) * 0.6],
    [x + j * r(9), y + h - j * r(10) * 0.5],
    [x - j * r(11) * 0.4, y + h * 0.45],
  ]
  poly(c, p, col)
  poly(c, [p[0], p[1], p[2], [x + w * 0.8, y + h * 0.3], [x + w * 0.2, y + h * 0.28]],
       mescola(col, '#ffffff', 0.2))
  poly(c, [p[4], p[5], [x + w * 0.2, y + h * 0.72], [x + w * 0.8, y + h * 0.74]],
       mescola(col, '#000000', 0.18))
  if (sbeccata) {                       // la scheggiatura: un morso all'angolo
    poly(c, [[x + w * 0.62, y], [x + w, y], [x + w, y + h * 0.34]],
         mescola(col, '#000000', 0.28))
  }
}

/* la crepa: una spezzata che si allarga, con una diramazione ogni tanto */
export function crepa(c, x, y, lung, col, r) {
  c.strokeStyle = col; c.lineWidth = Math.max(0.7, lung * 0.035); c.lineCap = 'round'
  c.beginPath()
  let px = x, py = y
  c.moveTo(px, py)
  for (let i = 0; i < 4; i++) {
    px += lung * 0.25 * (0.6 + r(i) * 0.8)
    py += lung * 0.2 * (r(i + 9) - 0.5)
    c.lineTo(px, py)
  }
  c.stroke()
  if (r(20) > 0.6) {
    c.beginPath(); c.moveTo(x + lung * 0.4, y + lung * 0.03)
    c.lineTo(x + lung * 0.6, y + lung * (0.18 + r(21) * 0.2)); c.stroke()
  }
}
