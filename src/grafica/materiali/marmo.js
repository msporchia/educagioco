/* ═══════════════════════════════════════════════════════════════════
   IL MARMO — la sala del tesoro e quella del trono

   Tre pose e un muro, tutti costruiti sulla stessa idea: **è il vuoto
   che fa sembrare prezioso un disegno**. La prima versione del mosaico
   tesserava tutta la stanza a quadretti minuti e a tinte diverse:
   sembrava carta millimetrata colorata, e i personaggi ci si perdevano
   dentro. Adesso il motivo è confinato — a una cornice lungo i muri,
   o a una passatoia in mezzo — e tutto il resto è marmo quieto, tono
   su tono.
   ═══════════════════════════════════════════════════════════════════ */
import { mescola, dado, rett, velo, poly } from '../comune.js'
import { lastra, crepa } from './semina.js'

/* il marmo liscio: lastroni grandi come quelli di `lastre`, ma di
   **una sola tinta spostata appena** verso il chiaro o lo scuro, con
   qualche vena calda. È la base su cui il motivo può risaltare. */
export function marmoLiscio(c, reg, A, lato, scoperto) {
  const h = lato * 0.53, g = lato * 0.015   // 0.53, non 0.52: vedi `lastre`
  for (let k = Math.floor(reg.y0 / h) - 1; k < Math.ceil(reg.y1 / h); k++) {
    let x = Math.floor(reg.x0 / lato) * lato - lato * (1.4 + dado(k, 21, 340))
    while (x < reg.x1 + lato) {
      const chiave = Math.round(x / 3)
      const r = m => dado(chiave, k, 350 + m)
      const w = lato * (1 + r(1) * 0.9)
      if (x + w > reg.x0 - lato && (!scoperto || scoperto(x, k * h, w, h))) {
        const col = mescola(A.tessere[0], r(2) > 0.5 ? '#ffffff' : '#000000', r(3) * 0.08)
        lastra(c, x + g, k * h + g, w - g * 2, h - g * 2, col,
               mescola(col, '#ffffff', 0.12), mescola(col, '#000000', 0.1),
               m => dado(chiave + m, k, 360))
        if (r(4) > 0.84)                          // una vena, non una crepa
          velo(c, 0.3, () => crepa(c, x + w * 0.15, k * h + h * 0.4, w * 0.6,
                                   mescola(col, A.giunto, 0.4), m => dado(chiave, k, 370 + m)))
      }
      x += w
    }
  }
}

/* la cornice: il mosaico vero, confinato a una fascia lungo i muri. Le
   tessere sono tirate verso il fondo chiaro (poche tinte, smorzate) e
   l'oro torna in diagonale di riga in riga, non in colonna: una
   griglia dritta si sarebbe rivista come i «cubetti». */
function cornice(c, reg, A, lato, banda) {
  const h = lato * 0.22, g = lato * 0.015
  for (let k = Math.floor(reg.y0 / h) - 1; k < Math.ceil(reg.y1 / h); k++) {
    const y = k * h + h / 2
    const vicinoOrizz = y - reg.y0 < banda || reg.y1 - y < banda
    let x = Math.floor(reg.x0 / lato) * lato - lato * (1 + dado(k, 33, 380))
    while (x < reg.x1 + lato) {
      const chiave = Math.round(x / 3)
      const r = m => dado(chiave, k, 390 + m)
      const w = lato * (0.21 + r(1) * 0.136)
      const cx = x + w / 2
      const vicinoVert = cx - reg.x0 < banda || reg.x1 - cx < banda
      if ((vicinoOrizz || vicinoVert) && x + w > reg.x0 - lato) {
        let base = A.tessere[0]
        if (Math.abs((chiave + k * 3) % 11) < 2) base = A.tessere[2]
        else if (r(2) > 0.985) base = A.tessere[3]
        const col = mescola(mescola(base, A.tessere[0], 0.3),
                            r(3) > 0.5 ? '#ffffff' : '#000000', r(4) * 0.05)
        lastra(c, x + g, k * h + g, w - g * 2, h - g * 2, col,
               mescola(col, '#ffffff', 0.16), mescola(col, '#000000', 0.14),
               m => dado(chiave + m, k, 400))
      }
      x += w
    }
  }
}

/* ── il pavimento della sala del tesoro ── */
export function mosaico(c, reg, A, lato, scoperto) {
  marmoLiscio(c, reg, A, lato, scoperto)
  cornice(c, reg, A, lato, lato * 1.15)
}

/* ── il pavimento della sala del trono ──
   Marmo, e in mezzo la passatoia rossa che va dalla porta al trono. È
   l'unico pavimento del gioco con una **direzione**: dice dove si deve
   andare senza una freccia. */
export function tappeto(c, reg, A, lato, scoperto) {
  marmoLiscio(c, reg, A, lato, scoperto)
  const cx = (reg.x0 + reg.x1) / 2, w = lato * 1.6
  const [base, scuro] = A.tappeto || ['#a8322f', '#7a2220']
  rett(c, cx - w, reg.y0, w * 2, reg.y1 - reg.y0, base)
  // l'ombra lungo i due bordi: senza, il tappeto è una striscia di
  // vernice invece che un tessuto posato sopra
  velo(c, 0.5, () => {
    rett(c, cx - w, reg.y0, lato * 0.16, reg.y1 - reg.y0, scuro)
    rett(c, cx + w - lato * 0.16, reg.y0, lato * 0.16, reg.y1 - reg.y0, scuro)
  })
  for (const d of [-1, 1]) {
    rett(c, cx + d * w * 0.82 - lato * 0.05, reg.y0, lato * 0.1, reg.y1 - reg.y0, A.oro || '#e8c569')
    rett(c, cx + d * w * 0.7 - lato * 0.03, reg.y0, lato * 0.06, reg.y1 - reg.y0, scuro)
  }
  // il motivo: un rombo ogni due celle, tono su tono
  for (let k = Math.floor(reg.y0 / (lato * 2)); k < Math.ceil(reg.y1 / (lato * 2)); k++) {
    const y = k * lato * 2 + lato
    poly(c, [[cx, y - lato * 0.44], [cx + lato * 0.34, y], [cx, y + lato * 0.44],
             [cx - lato * 0.34, y]], scuro)
    poly(c, [[cx, y - lato * 0.24], [cx + lato * 0.18, y], [cx, y + lato * 0.24],
             [cx - lato * 0.18, y]], mescola(base, A.oro || '#e8c569', 0.35))
  }
}

/* ── il muro di marmo ──
   Lastroni bassi (la stessa scala delle altre murature) e venature
   chiare. La fascia d'oro non è legata ai blocchi: corre come un
   cornicione, a un'altezza fissa — così resta una riga sola anche coi
   blocchi piccoli. */
export function marmo(c, reg, A, lato, tinte, dentro) {
  const h = lato * 0.26, g = lato * 0.018
  for (let k = Math.floor(reg.y0 / h) - 1; k < Math.ceil(reg.y1 / h); k++) {
    let x = Math.floor(reg.x0 / lato) * lato - lato * (1 + dado(k, 11, 710))
    while (x < reg.x1 + lato) {
      const r = m => dado(Math.round(x / 3), k, 720 + m)
      const w = lato * (0.65 + r(1) * 0.5)
      if (x + w > reg.x0 - lato && (!dentro || dentro(x, k * h, w, h))) {
        const col = mescola(tinte[0], tinte[1], r(2) * 0.7)
        rett(c, x + g, k * h + g, w - g * 2, h - g * 2, col)
        rett(c, x + g, k * h + g, w - g * 2, (h - g * 2) * 0.22, mescola(col, '#ffffff', 0.3))
        if (r(3) > 0.55)
          velo(c, 0.32, () => {
            c.strokeStyle = mescola(col, '#7a6a52', 0.8); c.lineWidth = lato * 0.012
            c.beginPath()
            c.moveTo(x + g, k * h + h * (0.3 + r(4) * 0.4))
            c.quadraticCurveTo(x + w * 0.5, k * h + h * (0.1 + r(5) * 0.8),
                               x + w - g, k * h + h * (0.3 + r(6) * 0.4))
            c.stroke()
          })
      }
      x += w
    }
  }
  const passo = lato * 1.35
  for (let f = Math.floor(reg.y0 / passo) - 1; f < Math.ceil(reg.y1 / passo); f++) {
    const y = f * passo + passo * 0.58
    rett(c, reg.x0, y, reg.x1 - reg.x0, lato * 0.1, A.oro)
    rett(c, reg.x0, y, reg.x1 - reg.x0, lato * 0.035, mescola(A.oro, '#ffffff', 0.45))
  }
}
