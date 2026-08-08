/* ── IL CANCELLO ──
   A differenza del portone, qui si **vede attraverso**: sbarre di
   ferro, il pavimento che si intravede in mezzo, e i due battenti che
   ruotano quando si apre. È la porta che non nasconde quello che c'è
   dall'altra parte — e in un gioco di ordini è tutta un'altra cosa da
   una porta cieca. */
import { mescola, tondo } from '../../comune.js'
import { LATO, LEGNO } from '../attrezzi.js'

export function cancello(p, cosa, S = p.S) {
  const { x, y, apertura = 0, lato = LATO } = cosa
  const L = lato * S, h = L / 2
  const a = Math.max(0, Math.min(1, apertura))
  const c = p.ctx
  // la soglia di pietra ai due lati: sono i cardini
  for (const v of [-1, 1]) {
    p.rett(x + v * h * 0.88 - L * 0.06, y - h * 0.8, L * 0.12, L * 0.8, '#6f6455')
    p.rett(x + v * h * 0.88 - L * 0.06, y - h * 0.8, L * 0.12, L * 0.1, '#9c9280')
  }
  // i due battenti di sbarre, incernierati ai lati e girati di `a`
  for (const v of [-1, 1]) {
    c.save()
    c.translate(x + v * h * 0.86, y)
    c.rotate(v * a * 1.15)
    const larg = h * 0.86
    // il telaio
    c.strokeStyle = LEGNO.ferroS; c.lineWidth = Math.max(1, L * 0.05)
    c.strokeRect(v > 0 ? -larg : 0, -h * 0.6, larg, h * 1.2)
    // le sbarre, con la punta in cima
    for (let i = 1; i < 4; i++) {
      const bx = (v > 0 ? -larg : 0) + larg * i / 4
      c.strokeStyle = LEGNO.ferro; c.lineWidth = Math.max(1, L * 0.035)
      c.beginPath(); c.moveTo(bx, -h * 0.6); c.lineTo(bx, h * 0.6); c.stroke()
      c.fillStyle = LEGNO.ferroL
      c.beginPath()
      c.moveTo(bx - L * 0.03, -h * 0.6); c.lineTo(bx + L * 0.03, -h * 0.6)
      c.lineTo(bx, -h * 0.74); c.closePath(); c.fill()
    }
    // la traversa in mezzo
    c.strokeStyle = LEGNO.ferroL; c.lineWidth = Math.max(1, L * 0.03)
    c.beginPath()
    c.moveTo(v > 0 ? -larg : 0, 0); c.lineTo(v > 0 ? 0 : larg, 0); c.stroke()
    c.restore()
  }
  if (a < 0.1) tondo(p, x, y, L * 0.07, L * 0.07, mescola(LEGNO.oro, '#000000', 0.1))
}
