// La scala che sale è la scala a pioli dipinta delle cantine (`SCALA_SU`), dritta nella cella e appoggiata in alto,
// con sotto un chiarore che pulsa piano: da lassù viene la luce, e la si trova da lontano (docs/sotterraneo/scala-che-sale.md).
// `ctx` lavora in pixel di sprite, (x, y) è l'angolo in alto a sinistra della cella.

export const SCALA_SU = 'cantine-scala-a-pioli'

export function chiaroreDellaScala(ctx, x, y, t, { alfa = 1 } = {}) {
  ctx.save()
  ctx.globalAlpha = alfa
  const q = 0.28 + 0.1 * Math.sin(t * 2.2)
  const g = ctx.createRadialGradient(x + 8, y + 7, 2, x + 8, y + 7, 20)
  g.addColorStop(0, `rgba(255,240,170,${q})`)
  g.addColorStop(1, 'rgba(255,240,170,0)')
  ctx.fillStyle = g
  ctx.beginPath(); ctx.arc(x + 8, y + 7, 20, 0, 7); ctx.fill()
  ctx.restore()
}
