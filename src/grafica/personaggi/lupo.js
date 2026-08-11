/* ═════ IL LUPO ═════
   L'animale da guardia, e l'unico che non sta in piedi. Non è un
   personaggio più basso: è **lungo**, e la differenza si vede subito
   perché occupa la cella per il verso sbagliato.

   Ha il suo disegno e non lo scheletro di `corpo.js` — `quadrupede:
   true` dice all'indice di mandarlo a `bestia()` invece che a
   `persona()` — ma gli stati sono gli stessi, quindi lampeggia di
   rosso e cade di lato come tutti gli altri. Buffo e non feroce:
   occhi tondi e gialli, orecchie grandi, coda folta che sventola, e i
   denti si vedono appena. */
import { mescola, capsula, poligono, tondo } from '../comune.js'
import { occhi } from '../segni.js'

export const LUPO = {
  materie: { manto: 'pelo' },
  taglia: 1, quadrupede: true,
  col: {
    pelo: '#7c8798', peloS: '#5a6373', peloC: '#a4aebc',
    pancia: '#d4d9e2', musetto: '#e6eaf0',
    naso: '#2a2e38', occhio: '#ffd24a',
    zanne: '#f7f4ea',
    bordo: '#1e222c',
  },
  disegna(q, s, C, dir, sw, stato) {
    const b = C.bordo, sp = 0.75 * s
    const bob = -Math.abs(sw) * 0.5 * s
    const zampa = (x, y, avanti, col) => {
      capsula(q, x + avanti * 0.6 * s, y - 1.6 * s, 1 * s, 1.8 * s, 0.9 * s, col, b, sp)
      tondo(q, x + avanti * 1.1 * s, y + 0.1 * s, 1.4 * s, 0.8 * s, col, b, sp)
    }

    if (dir === 'dx') {
      // di profilo: il corpo per il lungo, la coda alta dietro, la testa
      // avanti e bassa — la posa di chi annusa
      const d = sw * 1.6 * s
      zampa(-3.4 * s - d, 0, -1, C.peloS); zampa(3 * s + d, 0, 1, C.peloS)
      // la coda: una virgola folta che sventola col passo
      q.in(-5.4 * s, -6 * s, r => {
        const c = r.ctx
        c.beginPath()
        c.moveTo(0, 0)
        c.quadraticCurveTo(-4 * s, -1 * s, -5.4 * s, -5 * s)
        c.quadraticCurveTo(-2.6 * s, -2.6 * s, 0.6 * s, -2.2 * s)
        c.closePath()
        c.fillStyle = C.pelo; c.fill(); c.strokeStyle = b; c.lineWidth = sp
        c.lineJoin = 'round'; c.stroke()
      }, sw * 0.22)
      capsula(q, 0, -5.4 * s + bob, 5.2 * s, 2.9 * s, 2.4 * s, C.pelo, b, sp)
      capsula(q, 0.4 * s, -3.6 * s + bob, 4 * s, 1.2 * s, 1 * s, C.pancia)
      zampa(-2.4 * s + d, 0, 1, C.pelo); zampa(4 * s - d, 0, -1, C.pelo)
      // il collo e la testa
      capsula(q, 4.6 * s, -7 * s + bob, 2 * s, 2.2 * s, 1.6 * s, C.pelo, b, sp)
      q.in(6.2 * s, -8.4 * s + bob, r => {
        poligono(r, [[-1.4 * s, -1.2 * s], [-0.2 * s, -4.6 * s], [1.4 * s, -1.4 * s]], C.pelo, b, sp)
        tondo(r, 0, 0, 2.6 * s, 2.4 * s, C.pelo, b, sp)
        // il muso: lungo e chiaro, con il nasino nero in punta
        capsula(r, 2.4 * s, 1 * s, 1.9 * s, 1 * s, 0.9 * s, C.musetto, b, sp)
        tondo(r, 4 * s, 0.6 * s, 0.75 * s, 0.65 * s, C.naso)
        poligono(r, [[2.6 * s, 1.9 * s], [3.2 * s, 1.9 * s], [2.9 * s, 2.7 * s]], C.zanne, b, sp * 0.6)
        if (stato === 'ko') occhi(r, s, -0.4, -0.4, 0.6, stato)
        else {
          tondo(r, 0.9 * s, -0.5 * s, 0.75 * s, 0.8 * s, C.occhio, b, sp * 0.6)
          tondo(r, 1 * s, -0.4 * s, 0.34 * s, 0.42 * s, '#20182e')
        }
      })
      return
    }

    if (dir === 'su') {
      // di spalle: la groppa, le orecchie che spuntano e la coda dritta
      q.in(0, -3 * s, r => {
        const c = r.ctx
        c.beginPath()
        c.moveTo(-1.2 * s, 0)
        c.quadraticCurveTo(-1.4 * s, -4 * s, -0.4 * s + Math.sin(sw * 1.6) * 2 * s, -7.4 * s)
        c.quadraticCurveTo(1.6 * s, -4 * s, 1.2 * s, 0)
        c.closePath()
        c.fillStyle = C.pelo; c.fill(); c.strokeStyle = b; c.lineWidth = sp
        c.lineJoin = 'round'; c.stroke()
      })
      for (const v of [-1, 1]) zampa(v * 2.8 * s, 0, v, C.peloS)
      capsula(q, 0, -5.6 * s + bob, 3.6 * s, 3.4 * s, 2.6 * s, C.pelo, b, sp)
      capsula(q, 0, -9.4 * s + bob, 2.6 * s, 1.8 * s, 1.6 * s, C.pelo, b, sp)
      for (const v of [-1, 1])
        poligono(q, [[v * 1.2 * s, -10.4 * s + bob], [v * 2.9 * s, -13.4 * s + bob],
                     [v * 3 * s, -10 * s + bob]], C.peloS, b, sp)
      q.linea([{ x: 0, y: -8.4 * s + bob }, { x: 0, y: -3.4 * s + bob }], C.peloS, 0.7 * s)
      return
    }

    // di faccia: la testa grande davanti, il corpo che sparisce dietro
    for (const v of [-1, 1]) zampa(v * 3 * s, -0.2 * s, v, C.peloS)
    capsula(q, 0, -6.6 * s + bob, 3.4 * s, 3.6 * s, 2.6 * s, C.pelo, b, sp)
    for (const v of [-1, 1]) {
      const alza = (v < 0 ? sw : -sw) > 0 ? 1 * s : 0
      zampa(v * 2 * s, -alza, v, C.pelo)
    }
    q.in(0, -9.6 * s + bob, r => {
      for (const v of [-1, 1])
        poligono(r, [[v * 1.4 * s, -1.6 * s], [v * 3.4 * s, -4.6 * s], [v * 3.3 * s, -0.8 * s]],
                 C.peloS, b, sp)
      for (const v of [-1, 1])
        poligono(r, [[v * 1.6 * s, -1.4 * s], [v * 2.9 * s, -3.6 * s], [v * 2.8 * s, -1 * s]],
                 mescola(C.pelo, '#ffffff', 0.2))
      tondo(r, 0, 0, 3.4 * s, 3.2 * s, C.pelo, b, sp)
      // la mascherina chiara intorno al muso: senza, la faccia di
      // fronte era una palla grigia con due puntini
      poligono(r, [[-2.2 * s, 0.4 * s], [2.2 * s, 0.4 * s], [1.6 * s, 3.4 * s], [-1.6 * s, 3.4 * s]],
               C.musetto)
      if (stato === 'ko') occhi(r, s, 1.5, -0.6, 0.7, stato)
      else for (const v of [-1, 1]) {
        tondo(r, v * 1.5 * s, -0.8 * s, 0.85 * s, 0.9 * s, C.occhio, b, sp * 0.6)
        tondo(r, v * 1.5 * s + 0.15 * s, -0.7 * s, 0.4 * s, 0.48 * s, '#20182e')
      }
      tondo(r, 0, 1.6 * s, 0.95 * s, 0.75 * s, C.naso)
      r.ctx.strokeStyle = b; r.ctx.lineWidth = 0.6 * s; r.ctx.lineCap = 'round'
      r.ctx.beginPath()
      r.ctx.moveTo(0, 2.2 * s); r.ctx.lineTo(0, 2.8 * s)
      r.ctx.moveTo(-1.4 * s, 3.4 * s); r.ctx.quadraticCurveTo(0, 2.4 * s, 1.4 * s, 3.4 * s)
      r.ctx.stroke()
      for (const v of [-1, 1])
        poligono(r, [[v * 0.7 * s, 3.2 * s], [v * 1.3 * s, 3.1 * s], [v * 1 * s, 4.1 * s]],
                 C.zanne, b, sp * 0.55)
    })
  },
}
