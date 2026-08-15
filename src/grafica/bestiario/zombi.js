/* ═════ LO ZOMBI ═════
   Il boss della cantina, e il primo padrone di casa che si incontra:
   deve far paura per la **posa**, non per il macabro. Spalle storte,
   testa piegata da un lato, braccia che pendono: è tutto lì, e non c'è
   una goccia di sangue né un osso di fuori.

   Verde-grigio, non verde: l'orco è verde, e sono due cose diverse. */
import { mescola, capsula, poligono, tondo } from '../comune.js'
import { occhi } from '../segni.js'

export const ZOMBI = {
  spalle: 6, taglia: 1.08, arti: 0.92,
  col: {
    pelle: '#8fa382', pelleS: '#6b7d61',
    manica: '#5f6b52', manicaS: '#48513e',
    gambe: '#4c5442', gambeS: '#3a4033',
    scarpe: '#3a2f26', scarpeS: '#2c241d',
    stracci: '#6b6a52', bordo: '#232b1e',
  },
  tronco(q, s, C) {
    const b = C.bordo, sp = 0.85 * s
    const t = q.tempo || 0
    const storto = Math.sin(t * 0.9) * 0.4 * s     // ondeggia, non sta dritto
    // il busto inclinato: una spalla più alta dell'altra, sempre
    poligono(q, [[-5.4 * s, -13.8 * s], [5.8 * s, -12.6 * s],
                 [4.6 * s, -5 * s], [-4.4 * s, -5 * s]], C.pelle, b, sp)
    // la camicia a brandelli sopra: copre il torso e finisce a strappi
    q.ctx.fillStyle = C.stracci
    q.ctx.beginPath()
    q.ctx.moveTo(-5 * s, -13.4 * s); q.ctx.lineTo(5.4 * s, -12.4 * s)
    q.ctx.lineTo(4.6 * s, -7.4 * s)
    for (let i = 0; i < 4; i++) {                  // gli strappi in fondo
      const x = (4.6 - i * 3.2) * s
      q.ctx.lineTo(x - 1.6 * s, (-5 - (i % 2) * 1.4) * s + storto)
      q.ctx.lineTo(x - 3.2 * s, -7 * s)
    }
    q.ctx.closePath(); q.ctx.fill()
    q.ctx.strokeStyle = b; q.ctx.lineWidth = 0.5 * s; q.ctx.stroke()
    // le costole che si intravedono dallo strappo sul petto
    q.ctx.strokeStyle = mescola(C.pelle, '#ffffff', 0.35); q.ctx.lineWidth = 0.5 * s
    for (const dy of [-11.4, -10.2, -9]) {
      q.ctx.beginPath()
      q.ctx.moveTo(-1.6 * s, dy * s); q.ctx.quadraticCurveTo(0, (dy + 0.8) * s, 1.8 * s, dy * s)
      q.ctx.stroke()
    }
  },
  testa(q, s, C, dir, stato) {
    const b = C.bordo, sp = 0.85 * s, R = 4.4 * s
    const t = q.tempo || 0
    // la testa piegata: la parte che più di tutte dice «zombi». È
    // ruotata di suo, non solo storta di posizione
    q.in(0.6 * s, 0, r => {
      tondo(r, 0, 0, R * 0.94, R, C.pelle, b, sp)
      // i capelli radi appiccicati al cranio
      r.ctx.fillStyle = '#3d3a2c'
      r.ctx.beginPath()
      r.ctx.moveTo(-R * 0.94, -1.4 * s)
      r.ctx.quadraticCurveTo(0, -R * 1.5, R * 0.94, -1.4 * s)
      r.ctx.quadraticCurveTo(R * 0.5, -R * 0.6, 0, -R * 0.7)
      r.ctx.quadraticCurveTo(-R * 0.5, -R * 0.6, -R * 0.94, -1.4 * s)
      r.ctx.closePath(); r.ctx.fill()
      if (stato === 'ko') { occhi(r, s, 1.8, -0.4, 0.8, stato); return }
      // un occhio più aperto dell'altro: l'asimmetria fa il resto
      r.cerchio(-1.8 * s, -0.4 * s, 1.15 * s, '#e8e4d0')
      r.cerchio(-1.7 * s, -0.2 * s, 0.5 * s, '#20182e')
      r.cerchio(1.9 * s, -0.5 * s, 0.8 * s, '#e8e4d0')
      r.cerchio(1.9 * s, -0.4 * s, 0.38 * s, '#20182e')
      r.ctx.strokeStyle = C.pelleS; r.ctx.lineWidth = 0.8 * s; r.ctx.lineCap = 'round'
      r.ctx.beginPath()
      r.ctx.moveTo(-3.4 * s, -2.6 * s); r.ctx.lineTo(-0.6 * s, -2 * s)
      r.ctx.stroke()
      // la bocca aperta storta, senza denti aguzzi
      r.ctx.fillStyle = '#3a2b2b'
      r.ctx.beginPath(); r.ctx.ellipse(0.4 * s, 2.4 * s, 1.9 * s, 1.2 * s, 0.2, 0, 6.29); r.ctx.fill()
    }, 0.22 + Math.sin(t * 0.9) * 0.05)
  },
}
