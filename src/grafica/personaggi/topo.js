/* ═════ IL TOPO ═════
   Anche questo nasce da un difetto scritto in `todo.md`: «Cric il topo
   oggi esce come un mostriciattolo» — nei dati non ha ancora un
   pittore suo, e quello che gli si avvicina di più è un goblin o uno
   scheletro piccolo. Cric non apre porte, passa sotto: nella storia
   dei Fondi è quello che porta la chiave dove Marta non arriva. Un
   personaggio così piccolo nella parte merita di essere piccolo anche
   nel disegno, non un mostro rimpicciolito.

   Usa `bestia()` come lupo, gatto, papera e falena — stesso calco di
   `gatto.js`, taglia ridotta ancora di più (0.5, sotto il gatto a
   0.72). Due firme lo separano da tutti gli altri quadrupedi del
   catalogo:

     · l'**orecchio**: un tondo grande e piatto, non un triangolo
       (gatto) né largo e orizzontale (lupo);
     · la **coda**: un filo sottile e nudo che ondeggia, mai peloso —
       il gatto e il lupo ce l'hanno folta o affusolata, il topo no.

   Muso appuntito con due baffi per lato, nasino rosa, occhi piccoli e
   tondi: la faccia da roditore che un bambino riconosce subito. */
import { mescola, capsula, poligono, tondo } from '../comune.js'
import { occhi } from '../segni.js'

export const TOPO = {
  taglia: 0.5, quadrupede: true,
  col: {
    pelo: '#a99a86', peloS: '#8a7c68',
    pancia: '#e8ddc8', naso: '#e8899c',
    orecchio: '#d9a8ac', coda: '#d9a8ac',
    occhio: '#20182e', bordo: '#3a3025',
  },
  disegna(q, s, C, dir, sw, stato) {
    const b = C.bordo, sp = 0.5 * s
    const bob = -Math.abs(sw) * 0.3 * s

    const zampa = (x, y, avanti, col) =>
      capsula(q, x + avanti * 0.35 * s, y - 0.8 * s, 0.45 * s, 0.9 * s, 0.4 * s, col, b, sp * 0.6)

    // la coda: un filo, due passate (bordo sotto, colore sopra) — mai
    // una forma piena, se no torna la coda folta degli altri
    const coda = (bx, by, verso) => {
      const c = q.ctx
      const traccia = () => {
        c.beginPath()
        c.moveTo(bx, by)
        c.quadraticCurveTo(bx - verso * 3 * s, by + 1 * s + Math.sin(sw * 2) * s, bx - verso * 5 * s, by - 1.5 * s)
      }
      traccia(); c.strokeStyle = b; c.lineWidth = 0.75 * s; c.lineCap = 'round'; c.stroke()
      traccia(); c.strokeStyle = C.coda; c.lineWidth = 0.4 * s; c.stroke()
    }

    // l'orecchio: un tondo grande e piatto, non un triangolo — la
    // prima cosa che lo separa dal gatto
    const orecchio = (r, v) => tondo(r, v * 1.6 * s, -1.4 * s, 1.3 * s, 1.3 * s, C.orecchio, b, sp * 0.6)

    if (dir === 'dx') {
      const d = sw * 0.9 * s
      zampa(-1.6 * s - d, 0, -1, C.peloS); zampa(1.3 * s + d, 0, 1, C.peloS)
      coda(-2.6 * s, -1.6 * s + bob, -1)
      capsula(q, 0, -2 * s + bob, 2.6 * s, 1.5 * s, 1.3 * s, C.pelo, b, sp)
      capsula(q, 0.3 * s, -1.1 * s + bob, 1.9 * s, 0.6 * s, 0.55 * s, C.pancia)
      zampa(-0.9 * s + d, 0, 1, C.pelo); zampa(1.9 * s - d, 0, -1, C.pelo)
      q.in(3 * s, -2.4 * s + bob, r => {
        orecchio(r, -1)
        // la testa tonda prima, il muso appuntito sopra — se no il
        // cerchio della testa lo copre e il topo resta senza naso
        tondo(r, 1.4 * s, 0, 1.6 * s, 1.5 * s, C.pelo, b, sp)
        poligono(r, [[1.2 * s, -0.7 * s], [4.2 * s, 0.3 * s], [1 * s, 1.5 * s]], C.pelo, b, sp * 0.8)
        tondo(r, 3.9 * s, 0.3 * s, 0.42 * s, 0.38 * s, C.naso)
        if (stato === 'ko') occhi(r, s, 0.1, -0.3, 0.4, stato)
        else tondo(r, 0.55 * s, -0.25 * s, 0.4 * s, 0.44 * s, C.occhio)
        r.ctx.strokeStyle = mescola(C.bordo, '#ffffff', 0.3); r.ctx.lineWidth = 0.2 * s
        for (const dy of [-0.1, 0.35, 0.8]) {
          r.ctx.beginPath(); r.ctx.moveTo(3.6 * s, dy * s); r.ctx.lineTo(5.8 * s, (dy - 0.15) * s); r.ctx.stroke()
        }
      })
      return
    }

    if (dir === 'su') {
      for (const v of [-1, 1]) zampa(v * 1.3 * s, 0, v, C.peloS)
      coda(0, -2.4 * s + bob, 1)
      capsula(q, 0, -2.6 * s + bob, 2.3 * s, 2.1 * s, 1.7 * s, C.pelo, b, sp)
      q.in(0, -4.6 * s + bob, r => { for (const v of [-1, 1]) orecchio(r, v) })
      return
    }

    // di fronte
    for (const v of [-1, 1]) zampa(v * 1.3 * s, -0.1 * s, v, C.peloS)
    coda(sw >= 0 ? -1.8 * s : 1.8 * s, -2 * s + bob, sw >= 0 ? -1 : 1)
    capsula(q, 0, -2.4 * s + bob, 2 * s, 2 * s, 1.6 * s, C.pelo, b, sp)
    q.in(0, -4.2 * s + bob, r => {
      for (const v of [-1, 1]) orecchio(r, v)
      tondo(r, 0, 0, 2 * s, 1.9 * s, C.pelo, b, sp)
      if (stato === 'ko') occhi(r, s, 0.9, -0.3, 0.55, stato)
      else for (const v of [-1, 1]) tondo(r, v * 0.9 * s, -0.3 * s, 0.5 * s, 0.55 * s, C.occhio)
      tondo(r, 0, 1 * s, 0.5 * s, 0.42 * s, C.naso)
      r.ctx.strokeStyle = mescola(C.bordo, '#ffffff', 0.3); r.ctx.lineWidth = 0.2 * s
      for (const v of [-1, 1]) for (const dy of [0.7, 1.1]) {
        r.ctx.beginPath(); r.ctx.moveTo(v * 0.4 * s, dy * s); r.ctx.lineTo(v * 1.8 * s, (dy - 0.3) * s); r.ctx.stroke()
      }
    })
  },
}
