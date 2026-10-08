// La scala che sale, disegnata in codice e non dal foglio: un'apertura nella pietra coi gradini che salgono e si
// stringono (si va via, in su), sempre più chiari perché da lassù viene la luce; sopra, una freccia in su che
// sobbalza, e tutto intorno un chiarore che pulsa e si vede da lontano. È la sorella rovesciata di quella che scende
// (buia, a gradini che spariscono): colori neutri, di nessuno scenario, così si legge a colpo d'occhio anche dove
// la pietra è calda o fredda (docs/sotterraneo/scala-che-sale.md). `ctx` lavora in pixel di sprite, (x, y) è
// l'angolo in alto a sinistra della cella.

const FUORI = '#10121a', PIETRA = ['#c3c8d6', '#8f96ab', '#5b6176']
const FIANCO = '#14151e', ALZATA = '#262837'
// dal gradino più lontano (in alto, stretto, illuminato) al più vicino: la pedata e quanto è largo
const GRADINI = [
  { pedata: '#fff6c8', w: 4 },
  { pedata: '#d9d09a', w: 6 },
  { pedata: '#a9adc2', w: 8 },
  { pedata: '#7c8197', w: 10 },
]
// la freccia: righe da in alto (y relativo, x iniziale, larghezza), centrata sulla cella
const FRECCIA = [[3, 2], [2, 4], [1, 6], [0, 8], [3, 2], [3, 2], [3, 2]]

export function dipingiScalaSu(ctx, x, y, t, { alfa = 1 } = {}) {
  ctx.save()
  ctx.globalAlpha = alfa
  const r = (cx, cy, w, h, colore) => { ctx.fillStyle = colore; ctx.fillRect(x + cx, y + cy, w, h) }

  // il chiarore che scende dalla scala: pulsa piano, e sta sotto tutto il resto
  const q = 0.28 + 0.1 * Math.sin(t * 2.2)
  const g = ctx.createRadialGradient(x + 8, y + 7, 2, x + 8, y + 7, 20)
  g.addColorStop(0, `rgba(255,240,170,${q})`)
  g.addColorStop(1, 'rgba(255,240,170,0)')
  ctx.fillStyle = g
  ctx.beginPath(); ctx.arc(x + 8, y + 7, 20, 0, 7); ctx.fill()

  // la cornice di pietra: il contorno scuro, una riga chiara in alto e a sinistra, una scura in basso e a destra
  r(1, 1, 14, 14, FUORI)
  r(2, 2, 12, 12, PIETRA[1])
  r(2, 2, 12, 1, PIETRA[0]); r(2, 2, 1, 12, PIETRA[0])
  r(2, 13, 12, 1, PIETRA[2]); r(13, 2, 1, 12, PIETRA[2])

  // dentro, il buio ai lati e i gradini: ognuno più largo del precedente, e più scuro (la luce viene da su)
  r(3, 3, 10, 10, FIANCO)
  // ogni gradino è una pedata di due righe e un'alzata di una (l'ultimo, il più vicino, ha solo la pedata)
  GRADINI.forEach((s, i) => {
    const alto = 3 + i * 3
    const ultimo = i === GRADINI.length - 1
    r(8 - s.w / 2, alto, s.w, ultimo ? 1 : 2, s.pedata)
    if (!ultimo) r(8 - s.w / 2, alto + 2, s.w, 1, ALZATA)
  })

  // la freccia in su, sopra la cornice: scura intorno, chiara dentro, e sobbalza (non sparisce mai, o col buio non si legge)
  ctx.globalAlpha = alfa
  const su = Math.round(Math.sin(t * 3.2))
  const in_alto = -9 + su
  for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
    ctx.fillStyle = FUORI
    FRECCIA.forEach(([cx, w], i) => ctx.fillRect(x + 4 + cx + dx, y + in_alto + i + dy, w, 1))
  }
  ctx.fillStyle = '#fff6c8'
  FRECCIA.forEach(([cx, w], i) => ctx.fillRect(x + 4 + cx, y + in_alto + i, w, 1))
  ctx.restore()
}
