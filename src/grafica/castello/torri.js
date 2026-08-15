/* ═══════════════════════════════════════════════════════════════════
   LE TORRI — il fusto, la corona, le targhe.

   Il fusto si alza di poco a ogni livello; la cima cambia di netto ai
   tre stadi (1-3, 4-6, 7-10) e sta in `cime.js`.

   ── la sagoma del fusto ──
   Il cappello da solo non bastava: da lontano, su uno schermo di
   telefono, una balestra e un arco sono due macchie marroni uguali.
   Quello che si legge a colpo d'occhio è la *forma*, quindi la torre
   cambia scheletro a ogni stadio:

     nato       torretta di sasso, tozza, che si stringe verso l'alto;
     cresciuto  fusto dritto e alto su una scarpa svasata, con il
                cornicione a metà;
     massimo    basamento a gradoni, fusto quasi verticale e un
                ballatoio che sporge tutt'intorno sotto i merli.

   Anche la pietra cambia: sasso grigio a righe grosse, poi conci
   regolari, poi muratura fine e chiara.
   ═══════════════════════════════════════════════════════════════════ */
import { TORRI } from '../../data/ops.js'
import { TINTA } from './tinte.js'
import { CIME } from './cime.js'

const STADIO = lv => (lv <= 3 ? 0 : lv <= 6 ? 1 : 2)

const PIETRA = [
  { muro: '#b3a794', riga: 0.66, luce: '#ffffff3a' },   // sasso grezzo, scuro
  { muro: '#cfc5b3', riga: 0.5,  luce: '#ffffff55' },   // conci regolari
  { muro: '#efe8dc', riga: 0.38, luce: '#ffffff77' },   // muratura fine, quasi bianca
]

function sagoma(x, y, bx, alt, stadio) {
  const cima = y - alt
  if (stadio === 0) {
    const tx = bx * 0.8
    return { cima, tx, punti: [[x - bx, y], [x + bx, y], [x + tx, cima], [x - tx, cima]] }
  }
  if (stadio === 1) {
    // scarpa svasata e due contrafforti che salgono lungo i fianchi
    const tx = bx * 0.88, sc = bx * 1.28, hs = alt * 0.24
    const cf = bx * 1.12, hc = alt * 0.62
    return { cima, tx, punti: [
      [x - sc, y], [x + sc, y], [x + cf, y - hs], [x + cf, y - hc],
      [x + bx * 0.96, y - hc - alt * 0.05], [x + tx, cima],
      [x - tx, cima], [x - bx * 0.96, y - hc - alt * 0.05],
      [x - cf, y - hc], [x - cf, y - hs]] }
  }
  const tx = bx * 0.94, sc = bx * 1.34, hs = alt * 0.14
  const bal = bx * 1.3, hb = alt * 0.68, hbal = alt * 0.12     // il ballatoio
  return { cima, tx, bal, hb, hbal, punti: [
    [x - sc, y], [x + sc, y], [x + sc, y - hs], [x + bx, y - hs * 1.5],
    [x + bx, y - hb], [x + bal, y - hb], [x + bal, y - hb - hbal], [x + tx, y - hb - hbal * 1.2],
    [x + tx, cima], [x - tx, cima],
    [x - tx, y - hb - hbal * 1.2], [x - bal, y - hb - hbal], [x - bal, y - hb], [x - bx, y - hb],
    [x - bx, y - hs * 1.5], [x - sc, y - hs]] }
}

function fusto(p, x, y, larg, alt, tinta, stadio) {
  const { ctx } = p
  const bx = larg, pietra = PIETRA[stadio]
  const forma = sagoma(x, y, bx, alt, stadio)
  const { cima, tx } = forma
  p.ellisse(x, y + 4 * (larg / 11), larg * 1.7, larg * 0.72, '#00000028')
  p.ellisse(x, y + 1.6 * (larg / 11), larg * 1.45, larg * 0.62, '#8e8577')
  p.ellisse(x, y + 0.4 * (larg / 11), larg * 1.34, larg * 0.54, '#b3aa9a')
  ctx.save()
  ctx.beginPath()
  forma.punti.forEach(([px, py], i) => i ? ctx.lineTo(px, py) : ctx.moveTo(px, py))
  ctx.closePath(); ctx.fillStyle = pietra.muro; ctx.fill(); ctx.clip()
  // i corsi di pietra: più fitti man mano che la torre si fa signorile
  const fila = larg * pietra.riga
  ctx.strokeStyle = '#00000018'; ctx.lineWidth = Math.max(0.6, larg * 0.1)
  for (let yy = y - fila, n = 0; yy > cima - fila; yy -= fila, n++) {
    ctx.beginPath(); ctx.moveTo(x - bx * 1.4, yy); ctx.lineTo(x + bx * 1.4, yy); ctx.stroke()
    const off = n % 2 ? 0 : bx * 0.55
    for (let k = -2; k <= 2; k++) {
      const jx = x + off + k * bx * 1.1
      ctx.beginPath(); ctx.moveTo(jx, yy); ctx.lineTo(jx, yy - fila); ctx.stroke()
    }
  }
  finestre(p, x, y, bx, alt, stadio)
  const g = ctx.createLinearGradient(x - bx * 1.34, 0, x + bx * 1.34, 0)   // luce da sinistra
  g.addColorStop(0, pietra.luce); g.addColorStop(0.45, '#ffffff00'); g.addColorStop(1, '#3a2f2455')
  ctx.fillStyle = g; ctx.fillRect(x - bx * 1.4, cima - 2, bx * 2.8, alt + 4)
  ctx.restore()
  // il cornicione: la firma della torre cresciuta. Senza, la scarpa alla
  // base da sola non bastava a distinguerla da quella appena nata.
  if (stadio === 1) {
    const cy = y - alt * 0.54
    p.rett(x - bx * 1.16, cy, bx * 2.32, alt * 0.06, '#bdb2a0')
    p.rett(x - bx * 1.16, cy, bx * 2.32, alt * 0.022, '#ded5c6')
    p.rett(x - bx * 1.16, cy + alt * 0.06, bx * 2.32, alt * 0.018, '#8f8577')
  }
  // le mensole sotto il ballatoio, che è la firma della torre al massimo
  if (stadio === 2) {
    const { bal, hb, hbal } = forma
    for (let i = -2; i <= 2; i++)
      p.figura([[x + i * bal * 0.44 - bal * 0.1, y - hb],
                [x + i * bal * 0.44 + bal * 0.1, y - hb],
                [x + i * bal * 0.44, y - hb + hbal * 0.55]], '#a89c88')
    p.rett(x - bal, y - hb - hbal, bal * 2, hbal * 0.28, '#e8c569')
  }
  // la fascia col colore della torre, appena sotto i merli
  p.rett(x - tx * 1.02, cima + larg * 0.5, tx * 2.04, larg * 0.36, tinta.chiaro)
  p.rett(x - tx * 1.02, cima + larg * 0.5, tx * 2.04, larg * 0.13, '#ffffff33')
  return { cima, tx }
}

/* Le feritoie: una sola e stretta quando la torre è nata, due più su
   quando cresce, tre e una finestra accesa quando è al massimo — la
   luce dentro è il modo più corto per dire «qui c'è qualcuno». */
function finestre(p, x, y, bx, alt, stadio) {
  const w = bx * 0.24, h = alt * 0.13
  const buco = (fx, fy, acceso) => {
    p.rett(fx - w, fy - h, w * 2, h, acceso ? '#f2c94c' : '#4a3f33')
    p.ellisse(fx, fy - h, w, w * 1.1, acceso ? '#f2c94c' : '#4a3f33')
    if (acceso) p.ellisse(fx, fy - h * 0.6, w * 0.5, w * 0.6, '#fff3c4')
  }
  if (stadio === 0) buco(x, y - alt * 0.5)
  else if (stadio === 1) { buco(x - bx * 0.45, y - alt * 0.45); buco(x + bx * 0.45, y - alt * 0.45) }
  else {
    buco(x - bx * 0.5, y - alt * 0.34); buco(x + bx * 0.5, y - alt * 0.34)
    buco(x, y - alt * 0.52, true)
  }
}

/* La corona: merli e basta quando la torre è nata, poi sempre più merli,
   e al massimo bordati d'oro con due stendardi ai lati — è il segno che
   quella torre è arrivata in fondo alla scaletta. */
function merli(p, x, cima, tx, quanti, s, stadio, tinta) {
  const cw = tx * 2 / (quanti * 2 - 1)
  const colore = stadio === 2 ? '#f2ecdf' : '#dcd2c0'
  for (let i = 0; i < quanti; i++) {
    const mx = x - tx + i * cw * 2
    p.rett(mx, cima - 4.8 * s, cw, 5.2 * s, colore)
    if (stadio === 2) p.rett(mx, cima - 4.8 * s, cw, 1.1 * s, '#e8c569')
  }
  p.rett(x - tx * 1.12, cima - 0.2 * s, tx * 2.24, 3 * s, stadio === 2 ? '#ded5c6' : '#bdb2a0')
  if (stadio < 2) return
  p.rett(x - tx * 1.12, cima + 2.4 * s, tx * 2.24, 1 * s, '#e8c569')
  for (const v of [-1, 1]) {
    p.linea([{ x: x + v * tx * 1.05, y: cima - 4 * s },
             { x: x + v * tx * 1.05, y: cima - 15 * s }], '#6b5f52', 1.1 * s)
    p.figura([[x + v * tx * 1.05, cima - 15 * s],
              [x + v * tx * 1.05 + v * 7 * s, cima - 12.8 * s],
              [x + v * tx * 1.05, cima - 10.6 * s]], tinta.chiaro)
  }
}

/* il gettone d'oro col livello e il ＋ verde per salire: appartengono
   al disegno della torre, non alle sue regole — il gioco dice soltanto
   se si può salire e se l'energia basta */
function targhe(p, x, y, lv, potenziabile, posso) {
  const S = p.S
  p.cerchio(x + 13 * S, y - 6 * S, 7.5 * S, '#ffd76a')
  p.ctx.strokeStyle = '#c99a1e'; p.ctx.lineWidth = 1.2 * S; p.ctx.stroke()
  p.testo(lv, x + 13 * S, y - 5.5 * S, '#6b4b00', 10 * S)
  if (!potenziabile) return
  p.cerchio(x - 13 * S, y + 8 * S, 7 * S, posso ? '#38c172' : '#b9aec9')
  p.testo('+', x - 13 * S, y + 8.5 * S, '#fff', 11 * S)
}

/* ── lo stendardo del ramo ──
   Una torre che ha scelto il suo mestiere lo dice con una bandiera. Non
   è un vezzo: da metà scaletta in poi due torri dello stesso tipo fanno
   cose diverse, e su un campo pieno bisogna riconoscerle senza aprire
   nessuna scheda. Il colore è quello del ramo, il segno è il suo, e
   sventola perché una bandiera ferma sembra un cartello. */
function stendardo(p, x, cima, tx, s, ramo, tipo) {
  const R = (TORRI[tipo].rami || {})[ramo]
  if (!R) return
  const px = x - tx - 1.5 * s, base = cima - 1 * s, alt = 13 * s
  p.linea([{ x: px, y: base }, { x: px, y: base - alt }], '#7b6a55', 1.4 * s)
  const onda = Math.sin((p.tempo || 0) * 3.1) * 1.6 * s
  p.figura([[px, base - alt], [px - 9 * s, base - alt + 2.6 * s + onda],
            [px, base - alt + 6 * s]], R.colore)
  p.testo(R.segno, px - 4 * s, base - alt + 3 * s, '#ffffffdd', 5.6 * s)
}

export function torre(p, { x, y, tipo, lv, ramo, potenziabile, posso }) {
  const stadio = STADIO(lv), s = p.S * 0.92, tinta = TINTA[tipo]
  const aspetto = TORRI[tipo].aspetto
  /* La taglia fa un salto vero a ogni stadio: una torre al massimo è alta
     quasi il doppio di una appena nata, e da lontano è quello che si legge
     prima di ogni altra cosa. */
  const larg = (8.6 + stadio * 1.3 + lv * 0.1) * s
  const alt = (16 + stadio * 7.5 + lv * 0.7) * s
  const { cima, tx } = fusto(p, x, y, larg, alt, tinta, stadio)
  merli(p, x, cima, tx, 3 + stadio, s, stadio, tinta)
  p.in(x, cima - 3.6 * s, q => CIME[aspetto](q, s, stadio, tinta, p.tempo))
  if (ramo) stendardo(p, x, cima, tx, s, ramo, tipo)
  targhe(p, x, y, lv, potenziabile, posso)
}
