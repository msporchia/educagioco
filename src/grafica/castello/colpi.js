/* ═══════════════════════════════════════════════════════════════════
   COLPI ED ESPLOSIONI

   Il colpo è la prova che la torre sta lavorando: scia lunga e corpo
   grosso, perché su uno schermo di telefono un pallino di cinque pixel
   semplicemente non si vede.
   ═══════════════════════════════════════════════════════════════════ */
import { TORRI } from '../../data/ops.js'
import { TINTA } from './tinte.js'

export function colpo(p, c) {
  const S = p.S, tinta = TINTA[c.tipo], aspetto = TORRI[c.tipo].aspetto
  // la seconda salva parte con un po' di ritardo: fino ad allora è ancora
  // dentro la bocca da fuoco, e non si disegna niente
  if (c.t < 0) return
  const x = c.x + (c.tx - c.x) * c.t, y = c.y + (c.ty - c.y) * c.t
  const lungo = Math.hypot(c.tx - c.x, c.ty - c.y)
  const scia = Math.min(38 * S, lungo * c.t)
  p.in(x, y, q => {
    const g = q.ctx.createLinearGradient(-scia, 0, 0, 0)
    g.addColorStop(0, tinta.chiaro + '00'); g.addColorStop(0.6, tinta.chiaro + '77')
    g.addColorStop(1, tinta.chiaro + 'ee')
    q.ctx.strokeStyle = g; q.ctx.lineWidth = (aspetto === 'bombe' ? 6 : 4.6) * S; q.ctx.lineCap = 'round'
    q.ctx.beginPath(); q.ctx.moveTo(-scia, 0); q.ctx.lineTo(0, 0); q.ctx.stroke()
    if (aspetto === 'arciere') {
      // la freccia: asta chiara col suo contorno scuro, punta e penne
      q.ctx.strokeStyle = '#3f3427'; q.ctx.lineWidth = 3.6 * S
      q.ctx.beginPath(); q.ctx.moveTo(-9 * S, 0); q.ctx.lineTo(5 * S, 0); q.ctx.stroke()
      q.ctx.strokeStyle = '#f7efdd'; q.ctx.lineWidth = 2 * S
      q.ctx.beginPath(); q.ctx.moveTo(-9 * S, 0); q.ctx.lineTo(5 * S, 0); q.ctx.stroke()
      q.figura([[11 * S, 0], [4 * S, -4 * S], [4 * S, 4 * S]], '#3f3427')
      q.figura([[-8 * S, 0], [-13 * S, -3.6 * S], [-9.6 * S, 0], [-13 * S, 3.6 * S]], tinta.chiaro)
    } else if (aspetto === 'bombe') {
      q.in(0, 0, r => {                       // la bomba rotola in aria
        r.cerchio(0, 0, 6 * S, '#2f2a26')
        r.ellisse(-2 * S, -2 * S, 2 * S, 1.6 * S, '#5c554d')
        r.ctx.strokeStyle = '#c9a06a'; r.ctx.lineWidth = 1.4 * S
        r.ctx.beginPath(); r.ctx.moveTo(3 * S, -4.6 * S)
        r.ctx.quadraticCurveTo(7 * S, -7 * S, 5 * S, -9 * S); r.ctx.stroke()
        r.cerchio(5 * S, -9.6 * S, 2.2 * S, '#ffd76a')
        r.cerchio(5 * S, -10 * S, 1.1 * S, '#fff3c4')
      }, p.tempo * 7)
    } else {
      // il dardo magico: alone largo, nucleo pieno, lampo bianco al centro
      q.cerchio(0, 0, 11 * S, tinta.chiaro + '3a')
      q.cerchio(0, 0, 7 * S, tinta.chiaro + '99')
      q.cerchio(0, 0, 4.6 * S, tinta.chiaro)
      q.cerchio(-1 * S, -1 * S, 2.6 * S, '#ffffff')
    }
  }, Math.atan2(c.ty - c.y, c.tx - c.x))
}

/* Due effetti diversi, e devono restare diversi.

   L'esplosione è una **palla che si sgonfia**: si apre di colpo, piena,
   e sparisce. Niente anelli concentrici che scappano verso l'esterno —
   con quattro torri che sparano il campo diventava un tiro a segno di
   cerchi e non si capiva più dove fossero i nemici.

   La folata di gelo è l'opposto: un velo azzurro che si allarga piano e
   resta lì a sbiadire, senza bordo acceso. Il freddo si vede addosso ai
   mostri, che è la cosa bella; qui basta suggerire da dove viene. */
export function schizzo(p, s) {
  const q = Math.max(0, Math.min(1, s.vita)), col = TINTA[s.tipo].chiaro
  if (s.gelo) {
    p.velo(q * 0.22, () => p.cerchio(s.x, s.y, s.r, col))
    p.velo(q * 0.4, () => {
      p.ctx.strokeStyle = col; p.ctx.lineWidth = 1.6 * p.S
      p.ctx.beginPath(); p.ctx.arc(s.x, s.y, s.r, 0, 6.29); p.ctx.stroke()
    })
    return
  }
  // la palla: grande quando è appena scoppiata, e cala con la vita
  p.velo(q * 0.55, () => p.cerchio(s.x, s.y, s.r * (0.55 + q * 0.45), col))
  p.velo(q * 0.9, () => p.cerchio(s.x, s.y, s.r * (0.3 + q * 0.3), '#fff8'))
}
