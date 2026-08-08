/* ═══════════════════════════════════════════════════════════════════
   GLI INDIZI DEL DITO

   Le due cose che si accendono solo mentre si trascina una torre: le
   piazzole dove può atterrare e fin dove arriva a sparare. È l'unico
   momento in cui uno si sta chiedendo «dove ci sta?» e «fin dove
   arriva?». Sempre accesi erano aloni colorati che sporcavano il prato
   senza dire niente di nuovo.
   ═══════════════════════════════════════════════════════════════════ */
import { TINTA } from './tinte.js'

export function piazzolaViva(p, { x, y, scelta }) {
  const S = p.S, r = (scelta ? 19 : 14) * S
  p.cerchio(x, y, r, scelta ? '#38c17255' : '#ffffff77')
  p.ctx.strokeStyle = scelta ? '#1c7a45' : '#38c172'
  p.ctx.lineWidth = (scelta ? 3.6 : 2.4) * S
  p.ctx.setLineDash(scelta ? [] : [6 * S, 5 * S])
  p.ctx.beginPath(); p.ctx.arc(x, y, r, 0, 6.29); p.ctx.stroke(); p.ctx.setLineDash([])
  p.testo('+', x, y + 1 * S, scelta ? '#1c7a45' : '#2f8a52', (scelta ? 17 : 13) * S)
}

export function raggio(p, { x, y, r, tipo }) {
  p.cerchio(x, y, r, TINTA[tipo].chiaro + '20')
}
