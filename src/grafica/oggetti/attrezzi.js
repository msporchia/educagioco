/* ═══════════════════════════════════════════════════════════════════
   GLI ATTREZZI DEGLI OGGETTI

   Le poche cose che quaranta oggetti si passano fra loro: due
   tavolozze (il legno-e-ferro e la pietra), l'ombra a terra, l'asse di
   legno, la fiamma, la pozza di luce, e **il gesto di chi ondeggia**
   per farsi raccogliere.

   ── due famiglie, e vanno tenute separate ──
   · le cose **piatte** stanno *sul* pavimento e si vedono dall'alto:
     botola, ponte, ragnatela, acqua, scala, il portone. Non hanno
     ombra portata e non sporgono dalla cella.
   · le cose **in piedi** si vedono un po' di lato, come i personaggi:
     hanno l'ombra a terra, sporgono sopra la loro cella e le copre chi
     sta più in basso.

   Sbagliare famiglia si vede subito: una cassa disegnata piatta sembra
   un tappeto, una botola disegnata in piedi sembra una porta caduta
   per terra.

   ── la misura ──
   Come per i personaggi: tutto in unità, una cella vale 20. Chi
   disegna riceve `S = latoCella / 20`.
   ═══════════════════════════════════════════════════════════════════ */
import { mescola } from '../comune.js'
import { scintilla } from '../segni.js'

export const LATO = 20            // quanto vale una cella, in unità

/* il legno e il ferro tornano dappertutto: casse, botti, ponti, pozzi.
   Una tavolozza sola per tutti, se no ogni oggetto ha il suo marrone e
   la stanza sembra un campionario. */
export const LEGNO = {
  chiaro: '#a8763f', medio: '#8a5a30', scuro: '#6a4222', molto: '#4d2f16',
  ferro: '#6d7789', ferroS: '#454c5c', ferroL: '#98a3b5',
  oro: '#e8c569', oroS: '#a8842c',
  bordo: '#2e1d0f',
}

export const PIETRA = {
  chiara: '#a49a86', media: '#8b8071', scura: '#6f6455', bordo: '#3c352b',
}

/* l'ombra a terra: la stessa per tutti, così tutti sembrano poggiati
   sullo stesso pavimento e non ritagliati e incollati */
export const ombra = (p, x, y, rx, ry = rx * 0.36) =>
  p.ellisse(x, y, rx, ry, '#00000038')

/* le assi: la stessa riga di legno con la venatura, usata dalla cassa,
   dalla botte, dal ponte, dal cartello e dalla botola */
export function asse(q, x, y, w, h, col, bordo = LEGNO.bordo, sp = 0.6) {
  q.rett(x, y, w, h, col)
  q.rett(x, y, w, h * 0.22, mescola(col, '#ffffff', 0.16))
  q.rett(x, y + h * 0.82, w, h * 0.18, mescola(col, '#000000', 0.22))
  q.ctx.strokeStyle = bordo; q.ctx.lineWidth = sp; q.ctx.strokeRect(x, y, w, h)
}

/* la fiamma: tre lingue di colore, la più grande dietro. Guizza col
   tempo e con lo sfasamento `f`, che serve a non far battere tutti i
   fuochi della stanza allo stesso ritmo. */
export function fiamma(q, x, y, r, t, f = 0) {
  const g = 1 + Math.sin(t * 9 + f) * 0.12
  const g2 = 1 + Math.sin(t * 13 + f * 2.3) * 0.16
  const lingua = (rx, ry, col, dx) => {
    const c = q.ctx
    c.beginPath()
    c.moveTo(x - rx + dx, y)
    c.quadraticCurveTo(x - rx * 0.8 + dx, y - ry * 0.75, x + dx * 1.6, y - ry)
    c.quadraticCurveTo(x + rx * 0.8 + dx, y - ry * 0.75, x + rx + dx, y)
    c.quadraticCurveTo(x, y + ry * 0.22, x - rx + dx, y)
    c.closePath()
    c.fillStyle = col; c.fill()
  }
  lingua(r, r * 2.5 * g, '#ff7a1e', Math.sin(t * 5 + f) * r * 0.14)
  lingua(r * 0.66, r * 1.75 * g2, '#ffc23c', Math.sin(t * 7 + f) * r * 0.2)
  lingua(r * 0.32, r * 0.95 * g, '#fff3c4', Math.sin(t * 11 + f) * r * 0.2)
}

/* la pozza di luce: **si aggiunge** al pavimento, non lo copre. Con un
   velo normale la macchia gialla resta una macchia gialla; in
   `lighter` è la pietra sotto che si scalda, ed è la stessa idea con
   cui il fondale buca il buio. */
export function pozzaLuce(p, x, y, r, col, forza) {
  const c = p.ctx
  const prima = c.globalCompositeOperation
  c.globalCompositeOperation = 'lighter'
  c.save(); c.translate(x, y); c.scale(1, 0.62)
  const g = c.createRadialGradient(0, 0, r * 0.05, 0, 0, r)
  g.addColorStop(0, col + 'aa'); g.addColorStop(0.45, col + '44'); g.addColorStop(1, col + '00')
  c.globalAlpha = forza
  c.fillStyle = g
  c.beginPath(); c.arc(0, 0, r, 0, 6.29); c.fill()
  c.globalAlpha = 1
  c.restore()
  c.globalCompositeOperation = prima
}

/* ── il gesto di chi si fa raccogliere ──
   Una cosa da prendere si deve **muovere**, altrimenti sembra parte
   del pavimento: sale e scende piano, ha la sua ombra che resta
   ferma, e ogni tanto manda una scintilla. Venti oggetti diversi
   condividono questo gesto — e siccome è uno solo, un bambino impara
   una volta che «quello che ondeggia si può prendere».

   `disegna(q, s)` lavora con l'origine sull'oggetto già sollevato. */
export function raccolta(p, cosa, S, quanto, disegna) {
  const { x, y } = cosa
  const s = S * (quanto || 1), t = p.tempo || 0
  const su = Math.sin(t * 2.4 + x * 0.05) * 0.8 * s
  p.ellisse(x, y + 1.5 * s, 4 * s, 1.4 * s, '#00000028')
  p.in(x, y - 3 * s + su, q => disegna(q, s))
  scintilla(p, x + 3.4 * s, y - 7 * s + su, 1.5 * s, (t * 0.9 + x * 0.01) % 1)
}
