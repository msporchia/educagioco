// I segni sopra le figure del campo, che le figure non portano: il livello
// e il «+» di una torre che si può potenziare, la pastiglia «immune» di
// chi è stato preso da un colpo che non lo tocca, la corona del capo. Li
// usano i pittori a sprite (giochi/castello/scena/pittori.js). Misure in
// unità (`p.S`), mai in pixel.

// il livello, e il «+» (verde se l'energia basta) di chi può salire
export function targhe(p, x, y, lv, potenziabile, posso) {
  const S = p.S
  p.cerchio(x + 13 * S, y - 6 * S, 7.5 * S, '#ffd76a')
  p.ctx.strokeStyle = '#c99a1e'; p.ctx.lineWidth = 1.2 * S; p.ctx.stroke()
  p.testo(lv, x + 13 * S, y - 5.5 * S, '#6b4b00', 10 * S)
  if (!potenziabile) return
  p.cerchio(x - 13 * S, y + 8 * S, 7 * S, posso ? '#38c172' : '#b9aec9')
  p.testo('+', x - 13 * S, y + 8.5 * S, '#fff', 11 * S)
}

// grigia come il nastro (il colore di una torre direbbe «questa», e il
// segno dice il contrario), scritta per esteso perché a 15 px un simbolo
// non si legge
export function segnoImmune(p, x, y, quanto) {
  if (!(quanto > 0)) return
  const S = p.S, w = 22 * S, h = 7 * S
  const su = (1 - quanto) * 4 * S
  p.velo(Math.min(1, quanto * 1.6), () => {
    p.ctx.fillStyle = '#f2eff6'; p.ctx.strokeStyle = '#6c6480'; p.ctx.lineWidth = 0.9 * S
    p.ctx.beginPath()
    p.ctx.roundRect(x - w / 2, y - h - su, w, h, h / 2)
    p.ctx.fill(); p.ctx.stroke()
    p.testo('immune', x, y - h / 2 - su, '#4a4458', 5.2 * S)
  })
}

export function corona(p, x, y, s) {
  p.figura([[x - 6 * s, y], [x - 6 * s, y - 5 * s], [x - 3 * s, y - 2.5 * s], [x, y - 6 * s],
            [x + 3 * s, y - 2.5 * s], [x + 6 * s, y - 5 * s], [x + 6 * s, y]], '#f5c542')
  p.rett(x - 6 * s, y - 0.8 * s, 12 * s, 1.6 * s, '#c8961e')
}
