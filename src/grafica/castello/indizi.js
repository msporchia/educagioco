// Gli indizi del dito: le piazzole (respirano da sole quando l'energia
// basta per una torre nuova) e il raggio (si accende solo quando uno se lo
// sta chiedendo).
import { TINTA } from './tinte.js'

export function piazzolaViva(p, { x, y, scelta, viva = false }) {
  const S = p.S
  // il respiro: mezzo secondo per riempirsi, mezzo per svuotarsi
  const q = viva ? 0.5 + 0.5 * Math.sin((p.tempo || 0) * 2.2) : 1
  const r = (scelta ? 19 : 14 + q * 1.6) * S
  const forte = scelta ? 1 : 0.45 + q * 0.55
  const alfa = v => Math.round(v * forte * 255).toString(16).padStart(2, '0')
  p.cerchio(x, y, r, scelta ? '#38c17255' : '#ffffff' + alfa(0.47))
  p.ctx.strokeStyle = scelta ? '#1c7a45' : '#38c172' + alfa(1)
  p.ctx.lineWidth = (scelta ? 3.6 : 2.4) * S
  p.ctx.setLineDash(scelta ? [] : [6 * S, 5 * S])
  p.ctx.beginPath(); p.ctx.arc(x, y, r, 0, 6.29); p.ctx.stroke(); p.ctx.setLineDash([])
  p.testo('+', x, y + 1 * S, scelta ? '#1c7a45' : '#2f8a52', (scelta ? 17 : 13) * S)
}

// il tipo può mancare: senza torre scelta il cerchio è bianco
export function raggio(p, { x, y, r, tipo }) {
  p.cerchio(x, y, r, (tipo && TINTA[tipo] ? TINTA[tipo].chiaro : '#ffffff') + '20')
}

export function ingresso(p, { x, y, acceso }) {
  const S = p.S, w = 11 * S, h = 13 * S
  p.figura([[x, y + h], [x - w, y], [x + w, y]], acceso ? '#e0554d' : '#ffffff88')
  p.ctx.strokeStyle = acceso ? '#a83b34' : '#5d6b7a66'
  p.ctx.lineWidth = 1.6 * S
  p.ctx.beginPath()
  p.ctx.moveTo(x, y + h); p.ctx.lineTo(x - w, y); p.ctx.lineTo(x + w, y); p.ctx.closePath()
  p.ctx.stroke()
}
