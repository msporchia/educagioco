/* ═════ IL GATTO ═════
   Il secondo quadrupede, e non un lupo rimpicciolito: cambiano le
   proporzioni, non solo la taglia. Corpo corto e testa tonda invece
   che allungata, orecchie a triangolo alte e vicine in cima alla
   testa (non larghe come quelle del lupo), occhi grandi, coda
   **lunga e sottile che si incurva** — mai dritta come quella del
   lupo, mai folta.

   Come il lupo usa `bestia()` (`quadrupede: true`) e non `persona()`,
   e passa dagli stessi stati: lampeggia di rosso, cade di lato, aspetta
   con i puntini. In più ha una posa che i cani non hanno: **seduto**,
   con la coda arrotolata intorno alle zampe davanti — `stato: 'seduto'`
   la sceglie, e non tocca `corpo.js` perché per `bestia()` è solo una
   stringa che non riconosce e lascia passare senza tingerla.

   Il manto è un dato, non una funzione: `MANTI` ha le tavolozze
   (soriano, nero, bianco, rosso, tricolore) e `gattoCon(manto)` in
   `indice.js` sceglie quella giusta prima di disegnare — un gatto
   soriano e uno nero condividono lo stesso `disegna`, cambiano solo i
   colori che gli passa. Il tricolore usa tutti e tre i toni di pelo
   della tavolozza (`pelo`, `peloS`, `peloC`) invece di lasciarne uno
   spento come faceva il lupo. */
import { mescola, capsula, poligono, tondo } from '../comune.js'
import { occhi } from '../segni.js'

export const MANTI = {
  soriano: {
    pelo: '#b08a5c', peloS: '#7a5a34', peloC: '#e8d0a0',
    pancia: '#f0e3c4', musetto: '#f5ecd8',
    naso: '#d97a86', occhio: '#8fd85a', zanne: '#f7f4ea', bordo: '#2a2015',
  },
  nero: {
    pelo: '#2c2c34', peloS: '#1a1a20', peloC: '#4a4a56',
    pancia: '#55555f', musetto: '#5a5a64',
    naso: '#d97a86', occhio: '#e8c33c', zanne: '#f7f4ea', bordo: '#0f0f13',
  },
  bianco: {
    pelo: '#f7f3ea', peloS: '#dcd6c6', peloC: '#ffffff',
    pancia: '#ffffff', musetto: '#ffffff',
    naso: '#e8899c', occhio: '#7fc9e0', zanne: '#f7f4ea', bordo: '#4a4436',
  },
  rosso: {
    pelo: '#e2823c', peloS: '#b25f1e', peloC: '#f5c088',
    pancia: '#f7e2bc', musetto: '#f7e2bc',
    naso: '#c9683a', occhio: '#8fd85a', zanne: '#f7f4ea', bordo: '#5a3410',
  },
  tricolore: {
    // bianco di base, le macchie sono gli stessi due toni che altrove
    // fanno da ombra e da luce: qui diventano le chiazze arancio e nere
    pelo: '#f7f3ea', peloS: '#e2823c', peloC: '#2c2c34',
    pancia: '#ffffff', musetto: '#ffffff',
    naso: '#e8899c', occhio: '#8fd85a', zanne: '#f7f4ea', bordo: '#2c2418',
  },
}

export const GATTO = {
  taglia: 0.72, quadrupede: true,
  col: MANTI.soriano,
  disegna(q, s, C, dir, sw, stato) {
    const b = C.bordo, sp = 0.62 * s
    const bob = -Math.abs(sw) * 0.45 * s

    const zampa = (x, y, avanti, col) => {
      capsula(q, x + avanti * 0.5 * s, y - 1.2 * s, 0.7 * s, 1.35 * s, 0.65 * s, col, b, sp)
      tondo(q, x + avanti * 0.8 * s, y + 0.1 * s, 1 * s, 0.6 * s, col, b, sp)
    }

    // la coda: un tratto curvo a doppio strato (bordo sotto, pelo
    // sopra) che finisce in un piccolo uncino — mai un segmento dritto,
    // se no torna la coda folta del lupo invece di quella sottile del
    // gatto. `verso` è ±1 e dice da che parte si incurva.
    const coda = (bx, by, verso, agitata) => {
      const c = q.ctx
      const k = agitata ? Math.sin(sw * 3) * 0.5 * s : 0
      const traccia = () => {
        c.beginPath()
        c.moveTo(bx, by)
        c.quadraticCurveTo(bx - verso * 2.3 * s, by - 3.1 * s + k, bx - verso * 0.5 * s, by - 6 * s)
        c.quadraticCurveTo(bx + verso * 0.9 * s, by - 8.2 * s, bx + verso * 2.1 * s, by - 6.8 * s)
      }
      traccia(); c.strokeStyle = b; c.lineWidth = 1.2 * s + sp; c.lineCap = 'round'; c.stroke()
      traccia(); c.strokeStyle = C.pelo; c.lineWidth = 1.2 * s; c.stroke()
      // la punta: il terzo tono del manto, quello che al lupo non serviva
      tondo(q, bx + verso * 2.1 * s, by - 6.8 * s, 0.65 * s, 0.6 * s, C.peloC, b, sp * 0.6)
    }

    // orecchio a triangolo, alto e stretto: la differenza che si vede
    // per prima, anche a 36 px
    const orecchio = (r, v) =>
      poligono(r, [[v * 0.5 * s, -0.6 * s], [v * 1.3 * s, -4.2 * s], [v * 2 * s, -0.8 * s]],
               v < 0 ? C.peloS : C.pelo, b, sp * 0.85)

    if (stato === 'seduto') {
      // seduto e composto, la coda che si arrotola davanti alle zampe:
      // la posa che i cani non fanno mai
      capsula(q, 0, -6.2 * s, 2.5 * s, 3.9 * s, 2.1 * s, C.pelo, b, sp)
      capsula(q, 0.2 * s, -3 * s, 2.3 * s, 1.7 * s, 1.3 * s, C.pancia)
      for (const v of [-1, 1]) capsula(q, v * 1.35 * s, -1.3 * s, 0.6 * s, 1.7 * s, 0.55 * s, C.pelo, b, sp)
      q.in(2.5 * s, -0.6 * s, r => {
        const c = r.ctx
        const arco = () => { c.beginPath(); c.arc(0, 0, 2.1 * s, Math.PI * 0.85, Math.PI * 2.55) }
        arco(); c.strokeStyle = b; c.lineWidth = 1.15 * s + sp; c.lineCap = 'round'; c.stroke()
        arco(); c.strokeStyle = C.pelo; c.lineWidth = 1.15 * s; c.stroke()
        tondo(r, Math.cos(Math.PI * 2.55) * 2.1 * s, Math.sin(Math.PI * 2.55) * 2.1 * s,
              0.6 * s, 0.55 * s, C.peloC, b, sp * 0.6)
      })
      q.in(0, -10.4 * s, r => {
        for (const v of [-1, 1]) orecchio(r, v)
        tondo(r, 0, 0, 2.1 * s, 2 * s, C.pelo, b, sp)
        capsula(r, 0, 1.1 * s, 1.4 * s, 0.85 * s, 0.75 * s, C.musetto, b, sp)
        tondo(r, 0, 1 * s, 0.55 * s, 0.5 * s, C.naso)
        if (stato === 'ko') occhi(r, s, 0.75, -0.2, 0.7, 'ko')
        else for (const v of [-1, 1]) {
          tondo(r, v * 0.85 * s, -0.35 * s, 0.8 * s, 0.85 * s, C.occhio, b, sp * 0.55)
          tondo(r, v * 0.85 * s + 0.12 * s, -0.25 * s, 0.36 * s, 0.46 * s, '#20182e')
        }
      })
      return
    }

    if (dir === 'dx') {
      // di profilo: corpo corto, coda alta che ondeggia col passo, muso
      // corto invece che allungato — è dove lupo e gatto si assomigliano
      // meno
      const d = sw * 1.1 * s
      zampa(-2.4 * s - d, 0, -1, C.peloS); zampa(2.1 * s + d, 0, 1, C.peloS)
      coda(-3.6 * s, -4.6 * s + bob, -1, true)
      capsula(q, 0, -4.4 * s + bob, 3.4 * s, 2.1 * s, 1.7 * s, C.pelo, b, sp)
      capsula(q, 0.3 * s, -3 * s + bob, 2.6 * s, 0.9 * s, 0.8 * s, C.pancia)
      zampa(-1.6 * s + d, 0, 1, C.pelo); zampa(2.9 * s - d, 0, -1, C.pelo)
      capsula(q, 3.6 * s, -6.2 * s + bob, 1.5 * s, 1.7 * s, 1.3 * s, C.pelo, b, sp)
      q.in(4.7 * s, -7.4 * s + bob, r => {
        poligono(r, [[-1 * s, -0.6 * s], [-0.4 * s, -3.4 * s], [0.9 * s, -1.1 * s]], C.peloS, b, sp * 0.85)
        tondo(r, 0, 0, 2.1 * s, 2 * s, C.pelo, b, sp)
        // il muso: corto e chiaro, non allungato come nel lupo
        capsula(r, 1.7 * s, 0.8 * s, 1.1 * s, 0.75 * s, 0.7 * s, C.musetto, b, sp)
        tondo(r, 2.6 * s, 0.5 * s, 0.5 * s, 0.42 * s, C.naso)
        if (stato === 'ko') occhi(r, s, -0.3, -0.4, 0.65, stato)
        else {
          tondo(r, 0.7 * s, -0.4 * s, 0.85 * s, 0.9 * s, C.occhio, b, sp * 0.55)
          tondo(r, 0.85 * s, -0.3 * s, 0.38 * s, 0.48 * s, '#20182e')
        }
      })
      return
    }

    if (dir === 'su') {
      // di spalle: le due orecchie vicine in cima, la coda che sale
      // dritta e poi si incurva — non sventola larga come nel lupo
      for (const v of [-1, 1]) zampa(v * 2 * s, 0, v, C.peloS)
      coda(0, -5.4 * s + bob, 1, true)
      capsula(q, 0, -5 * s + bob, 3 * s, 3 * s, 2.2 * s, C.pelo, b, sp)
      capsula(q, 0, -8.2 * s + bob, 2 * s, 1.6 * s, 1.4 * s, C.pelo, b, sp)
      q.in(0, -9.4 * s + bob, r => { for (const v of [-1, 1]) orecchio(r, v) })
      return
    }

    // di faccia: testa grande e tonda, orecchie vicine, occhi grandi
    for (const v of [-1, 1]) zampa(v * 2.1 * s, -0.15 * s, v, C.peloS)
    coda(sw >= 0 ? -2.6 * s : 2.6 * s, -4.6 * s + bob, sw >= 0 ? -1 : 1, false)
    capsula(q, 0, -5.4 * s + bob, 2.9 * s, 3 * s, 2.2 * s, C.pelo, b, sp)
    for (const v of [-1, 1]) {
      const alza = (v < 0 ? sw : -sw) > 0 ? 0.8 * s : 0
      zampa(v * 1.7 * s, -alza, v, C.pelo)
    }
    q.in(0, -8.4 * s + bob, r => {
      for (const v of [-1, 1]) orecchio(r, v)
      tondo(r, 0, 0, 2.9 * s, 2.7 * s, C.pelo, b, sp)
      // la mascherina chiara intorno al muso, corta e rotonda
      poligono(r, [[-1.7 * s, 0.4 * s], [1.7 * s, 0.4 * s], [1.2 * s, 2.6 * s], [-1.2 * s, 2.6 * s]],
               C.musetto)
      if (stato === 'ko') occhi(r, s, 1.2, -0.5, 0.85, stato)
      else for (const v of [-1, 1]) {
        tondo(r, v * 1.25 * s, -0.6 * s, 1 * s, 1.05 * s, C.occhio, b, sp * 0.55)
        tondo(r, v * 1.25 * s + 0.15 * s, -0.5 * s, 0.44 * s, 0.54 * s, '#20182e')
      }
      tondo(r, 0, 1.3 * s, 0.75 * s, 0.6 * s, C.naso)
      // i baffi: due tratti per lato, il tocco che dice «gatto» anche
      // quando la testa è piccola
      r.ctx.strokeStyle = mescola(C.bordo, '#ffffff', 0.3); r.ctx.lineWidth = 0.3 * s; r.ctx.lineCap = 'round'
      for (const v of [-1, 1]) for (const dy of [-0.1, 0.5]) {
        r.ctx.beginPath()
        r.ctx.moveTo(v * 0.9 * s, 1.5 * s + dy * s)
        r.ctx.lineTo(v * 2.6 * s, 1.1 * s + dy * s)
        r.ctx.stroke()
      }
    })
  },
}
