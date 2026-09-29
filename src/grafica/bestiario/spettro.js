// l'unica creatura senza appoggio, e per questo l'unica disegnata in trasparenza
import { mescola, tondo } from '../comune.js'

export const SPETTRO = {
  quadrupede: true, taglia: 1.05,
  col: {
    velo: '#b9c4e8', veloS: '#8894c4', cappuccio: '#5a6494',
    luce: '#8ce8ff', bordo: '#3d4470',
  },
  disegna(q, s, C, dir, sw, stato) {
    const t = q.tempo || 0
    const b = C.bordo
    const su = Math.sin(t * 1.3) * 0.8 * s      // fluttua: non poggia su niente
    q.in(0, su, r => {
      r.velo(stato === 'ko' ? 0.3 : 0.72, () => {
        // il lenzuolo: spalle larghe che si stringono e finiscono a code
        r.ctx.fillStyle = C.velo
        r.ctx.beginPath()
        r.ctx.moveTo(-5.4 * s, -8 * s)
        r.ctx.quadraticCurveTo(-6.6 * s, -1 * s, -4.6 * s, 1.6 * s)
        for (let i = 0; i < 4; i++) {           // le quattro code che ondeggiano
          const x = (-4.6 + i * 3) * s
          const giu = (2.6 + Math.sin(t * 2.2 + i * 1.4) * 1.6) * s
          r.ctx.quadraticCurveTo(x + 1.5 * s, giu, x + 3 * s, 1.4 * s)
        }
        r.ctx.quadraticCurveTo(6.6 * s, -1 * s, 5.4 * s, -8 * s)
        r.ctx.quadraticCurveTo(0, -12 * s, -5.4 * s, -8 * s)
        r.ctx.closePath()
        r.ctx.fill()
        r.ctx.strokeStyle = b; r.ctx.lineWidth = 0.6 * s; r.ctx.stroke()
        // il cappuccio calato, più fitto del resto
        tondo(r, 0, -8.4 * s, 4.2 * s, 4.4 * s, C.cappuccio, b, 0.7 * s)
        tondo(r, 0, -7.6 * s, 3 * s, 3.2 * s, '#1b1f38')
      })
      if (stato === 'ko') return
      // le luci stanno fuori dal velo, o si spengono insieme al lenzuolo e la faccia sparisce
      const pulsa = 0.8 + Math.sin(t * 3) * 0.2
      for (const v of [-1, 1]) {
        r.velo(0.5, () => r.cerchio(v * 1.3 * s, -8 * s, 1.5 * s * pulsa, C.luce))
        r.cerchio(v * 1.3 * s, -8 * s, 0.62 * s * pulsa, '#ffffff')
      }
    })
  },
}
