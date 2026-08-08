/* ═════ L'ORSO ═════
   Il terzo quadrupede, e la sagoma che doveva mancare: il lupo è
   lungo e basso, il gatto è piccolo e affusolato, l'orso è **grosso e
   tondo** — a 36 px si riconosce dalla massa prima ancora che dal
   colore. Groppa alta e rotonda, testa grande con orecchie piccole e
   rotonde (mai a punta: quelle sono del lupo e del gatto), muso corto,
   zampe larghe e tozze che si vedono appena muoversi.

   Imponente ma non spaventoso — come vale già per l'orco: occhi
   piccoli ma non cattivi, niente zanne in vista, il muso è un salame
   arrotondato e basta. Usa `bestia()` come lupo e gatto
   (`quadrupede: true`) e gli stessi stati; in più `stato: 'ritto'` lo
   fa alzare sulle zampe posteriori — una posa, non un personaggio a
   parte, e per `bestia()` è solo una stringa che non tinge nessuno
   stato, come `'seduto'` del gatto.

   Due manti bastano, bruno e nero; il terzo, bianco, è l'orso polare
   — la stessa sagoma, tre tavolozze, mai tre disegni. */
import { mescola, capsula, poligono, tondo } from '../comune.js'
import { occhi } from '../segni.js'

export const MANTI = {
  bruno: {
    pelo: '#7a5636', peloS: '#5a3e24', peloC: '#a07a4e',
    pancia: '#c9a877', musetto: '#d9bb8c',
    naso: '#241a12', occhio: '#241a12', zanne: '#f7f4ea', bordo: '#1c130c',
  },
  nero: {
    pelo: '#2e2925', peloS: '#1c1815', peloC: '#4a423b',
    pancia: '#6b5f52', musetto: '#8a7a68',
    naso: '#0d0b09', occhio: '#0d0b09', zanne: '#f7f4ea', bordo: '#0a0806',
  },
  bianco: {
    pelo: '#eef2f0', peloS: '#cdd8d4', peloC: '#ffffff',
    pancia: '#ffffff', musetto: '#ffffff',
    naso: '#2a2a2c', occhio: '#3a3230', zanne: '#f7f4ea', bordo: '#8a9490',
  },
}

export const ORSO = {
  taglia: 1.22, quadrupede: true,
  col: MANTI.bruno,
  disegna(q, s, C, dir, sw, stato) {
    const b = C.bordo, sp = 0.85 * s
    const bob = -Math.abs(sw) * 0.35 * s          // passo pesante: dondola poco

    // zampe larghe e tozze: corte, e la mano è un disco grande, non una
    // capsula stretta come nel lupo o nel gatto
    const zampa = (x, y, avanti, col) => {
      capsula(q, x + avanti * 0.55 * s, y - 1.15 * s, 1.35 * s, 1.35 * s, 1.15 * s, col, b, sp)
      tondo(q, x + avanti * 0.95 * s, y + 0.2 * s, 1.75 * s, 1.05 * s, col, b, sp)
    }

    // l'orecchio: un mezzo cerchio piccolo e rotondo, mai a punta —
    // è la prima cosa che lo separa da lupo e gatto in silhouette
    const orecchio = (r, v, x, y, R) => tondo(r, v * x, y, R, R * 0.92, C.peloS, b, sp * 0.8)

    if (stato === 'ritto') {
      // in piedi sulle zampe posteriori: un personaggio, non più un
      // animale di scena — le zampe davanti si tengono larghe, come
      // chi sta per abbracciare o per fermare qualcuno
      capsula(q, 0, -8 * s, 4 * s, 5.4 * s, 3.4 * s, C.pelo, b, sp)
      capsula(q, 0.3 * s, -6.4 * s, 3 * s, 2.6 * s, 1.8 * s, C.pancia)
      for (const v of [-1, 1]) {
        capsula(q, v * 4.4 * s, -1.6 * s, 1.5 * s, 3.2 * s, 1.3 * s, C.peloS, b, sp)
        tondo(q, v * 4.6 * s, 1.4 * s, 2 * s, 1.2 * s, C.peloS, b, sp)
      }
      for (const v of [-1, 1]) {
        capsula(q, v * 3.6 * s, -11.2 * s, 1.5 * s, 2.8 * s, 1.3 * s, C.pelo, b, sp)
        tondo(q, v * 4.6 * s, -9 * s, 1.7 * s, 1.6 * s, C.pelo, b, sp)
      }
      q.in(0, -15.6 * s, r => {
        for (const v of [-1, 1]) orecchio(r, v, 2.6 * s, -3.6 * s, 1.4 * s)
        tondo(r, 0, 0, 3.6 * s, 3.4 * s, C.pelo, b, sp)
        capsula(r, 0, 2.2 * s, 1.9 * s, 1.3 * s, 1.1 * s, C.musetto, b, sp)
        tondo(r, 0, 2.3 * s, 0.85 * s, 0.65 * s, C.naso)
        if (stato === 'ko') occhi(r, s, 1.4, -0.6, 0.6, 'ko')
        else for (const v of [-1, 1]) tondo(r, v * 1.4 * s, -0.6 * s, 0.6 * s, 0.65 * s, C.occhio, b, sp * 0.5)
      })
      return
    }

    if (dir === 'dx') {
      // di profilo: la groppa alta e tonda, il muso corto che sporge
      // appena — niente slancio in avanti come nel lupo
      const d = sw * 0.9 * s
      zampa(-3.2 * s - d, 0, -1, C.peloS); zampa(2.8 * s + d, 0, 1, C.peloS)
      capsula(q, -0.4 * s, -6 * s + bob, 4.8 * s, 3.6 * s, 3 * s, C.pelo, b, sp)
      capsula(q, 0.3 * s, -4.2 * s + bob, 3.6 * s, 1.4 * s, 1.2 * s, C.pancia)
      zampa(-2.2 * s + d, 0, 1, C.pelo); zampa(3.6 * s - d, 0, -1, C.pelo)
      capsula(q, 4.6 * s, -7.6 * s + bob, 2 * s, 2.3 * s, 1.8 * s, C.pelo, b, sp)
      q.in(6 * s, -9 * s + bob, r => {
        orecchio(r, -1, 0.4 * s, -1.8 * s, 1.1 * s)
        tondo(r, 0, 0, 2.6 * s, 2.5 * s, C.pelo, b, sp)
        // il muso: corto, tondo, appena in fuori — un salame, non un cono
        tondo(r, 2 * s, 0.9 * s, 1.5 * s, 1.2 * s, C.musetto, b, sp)
        tondo(r, 3 * s, 0.7 * s, 0.6 * s, 0.5 * s, C.naso)
        if (stato === 'ko') occhi(r, s, -0.3, -0.5, 0.55, stato)
        else {
          tondo(r, 0.9 * s, -0.6 * s, 0.6 * s, 0.65 * s, C.occhio, b, sp * 0.5)
          tondo(r, 1.02 * s, -0.5 * s, 0.28 * s, 0.34 * s, '#20182e')
        }
      })
      return
    }

    if (dir === 'su') {
      // di spalle: la groppa è quasi tutto quello che si vede, alta e
      // arrotondata, con le orecchiette che spuntano appena
      for (const v of [-1, 1]) zampa(v * 3 * s, 0, v, C.peloS)
      capsula(q, 0, -6.4 * s + bob, 4.2 * s, 4 * s, 3.2 * s, C.pelo, b, sp)
      capsula(q, 0, -10.4 * s + bob, 2.8 * s, 2 * s, 1.8 * s, C.pelo, b, sp)
      q.in(0, -11.6 * s + bob, r => { for (const v of [-1, 1]) orecchio(r, v, 2 * s, -0.6 * s, 1.2 * s) })
      return
    }

    // di faccia: testa grande e tonda, corpo massiccio che sparisce
    // dietro, zampe larghe piantate per terra
    for (const v of [-1, 1]) zampa(v * 3.3 * s, -0.1 * s, v, C.peloS)
    capsula(q, 0, -6.6 * s + bob, 3.8 * s, 3.8 * s, 3 * s, C.pelo, b, sp)
    for (const v of [-1, 1]) {
      const alza = (v < 0 ? sw : -sw) > 0 ? 0.7 * s : 0
      zampa(v * 2.3 * s, -alza, v, C.pelo)
    }
    q.in(0, -10.2 * s + bob, r => {
      for (const v of [-1, 1]) orecchio(r, v, 2.6 * s, -2.4 * s, 1.4 * s)
      tondo(r, 0, 0, 3.7 * s, 3.5 * s, C.pelo, b, sp)
      // la mascherina chiara intorno al muso: corta e larga, non a punta
      poligono(r, [[-2.3 * s, 0.6 * s], [2.3 * s, 0.6 * s], [1.7 * s, 3 * s], [-1.7 * s, 3 * s]],
               C.musetto)
      if (stato === 'ko') occhi(r, s, 1.6, -0.6, 0.6, stato)
      else for (const v of [-1, 1]) tondo(r, v * 1.6 * s, -0.7 * s, 0.62 * s, 0.68 * s, C.occhio, b, sp * 0.5)
      tondo(r, 0, 1.9 * s, 1 * s, 0.8 * s, C.naso)
      r.ctx.strokeStyle = b; r.ctx.lineWidth = 0.6 * s; r.ctx.lineCap = 'round'
      r.ctx.beginPath(); r.ctx.moveTo(0, 2.5 * s); r.ctx.lineTo(0, 3 * s); r.ctx.stroke()
    })
  },
}
