/* ═══════════════════════════════════════════════════════════════════
   GLI INDIZI DEL DITO

   Le due cose che dicono al dito dove può andare: le piazzole dove una
   torre può nascere o atterrare, e fin dove arriva a sparare.

   Il raggio si accende solo quando uno se lo sta chiedendo — mentre
   sposta una torre, mentre ne guarda la scheda, mentre sceglie cosa
   costruire — perché acceso sempre sarebbe un cerchio colorato che
   sporca il prato senza dire niente di nuovo.

   Le piazzole invece adesso **respirano da sole** quando l'energia
   basta per una torre nuova. Non è un ripensamento: da quando il banco
   dei bottoni non c'è più, il campo è l'unico posto dove si compra, e
   una piazzola spenta sarebbe un negozio con la saracinesca abbassata.
   Il respiro è lento apposta — un invito, non un allarme.
   ═══════════════════════════════════════════════════════════════════ */
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

/* Il tipo può mancare: quando si è appena toccata una piazzola e la
   torre non è ancora scelta, il cerchio dice comunque «da qui si batte
   fin lì», e lo dice in bianco. */
export function raggio(p, { x, y, r, tipo }) {
  p.cerchio(x, y, r, (tipo && TINTA[tipo] ? TINTA[tipo].chiaro : '#ffffff') + '20')
}

/* ── da dove entrano ──
   Dove le strade sono due, il bordo alto ha due bocche e bisogna vederle
   senza doverle cercare: una freccia che punta dentro, e sotto la
   strada che comincia. Con una strada sola non si disegna niente — la
   bocca è una, e indicarla sarebbe rumore. */
export function ingresso(p, { x, y, acceso }) {
  const S = p.S, w = 11 * S, h = 13 * S
  p.figura([[x, y + h], [x - w, y], [x + w, y]], acceso ? '#e0554d' : '#ffffff88')
  p.ctx.strokeStyle = acceso ? '#a83b34' : '#5d6b7a66'
  p.ctx.lineWidth = 1.6 * S
  p.ctx.beginPath()
  p.ctx.moveTo(x, y + h); p.ctx.lineTo(x - w, y); p.ctx.lineTo(x + w, y); p.ctx.closePath()
  p.ctx.stroke()
}
