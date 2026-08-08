/* ═══════════════════════════════════════════════════════════════════
   LA ROCCIA — l'opposto del corridoio costruito

   Niente corsi, niente giunti che corrono, niente spigoli retti: massi
   tondeggianti di misura diversa, appoggiati uno all'altro. La misura
   resta quella della muratura (poco più di un corso), se no si torna
   ai massi grandi come un uomo — ma siccome non sono allineati, la
   stanza non legge «costruita»: legge **scavata**.

   Il contrasto è più basso che altrove apposta: la roccia è l'unico
   pavimento senza giunti chiari a fare da reticolo, e se le tinte
   saltassero da masso a masso diventerebbe un mosaico di sassi che si
   fa guardare più di chi ci cammina sopra.
   ═══════════════════════════════════════════════════════════════════ */
import { mescola, dado, ell, velo } from '../comune.js'
import { masso, semina, crepa } from './semina.js'

/* ── il pavimento della grotta ── */
export function rocciaPosa(c, reg, A, lato, scoperto) {
  /* i massi del pavimento sono **il doppio** di quelli della parete,
     come i lastroni lo sono dei conci: fatti uguali, pavimento e
     parete diventano lo stesso tessuto e la grotta perde il dentro e
     il fuori. (E costano un quarto: a due volte i pixel dello schermo
     una grotta di sassolini era tre volte un corridoio.) */
  const passo = lato * 0.83                 // 83/100: non torna mai al passo della cella
  for (let k = Math.floor(reg.y0 / passo) - 1; k < Math.ceil(reg.y1 / passo) + 1; k++)
    for (let i = Math.floor(reg.x0 / passo) - 1; i < Math.ceil(reg.x1 / passo) + 1; i++) {
      if (scoperto && !scoperto(i * passo, k * passo, passo, passo)) continue
      const r = m => dado(i, k, 1000 + m)
      // il centro sbanda di mezza maglia: è quello che rompe le file
      const cx = (i + 0.5 + (r(1) - 0.5) * 0.7) * passo
      const cy = (k + 0.5 + (r(2) - 0.5) * 0.7) * passo
      const col = mescola(A.lastra[0], A.lastra[1], r(3))
      masso(c, cx, cy, passo * (0.6 + r(4) * 0.34), col,
            mescola(col, '#ffffff', 0.1), mescola(col, '#000000', 0.13),
            m => dado(i * 5 + m, k, 1020))
    }
  // qualche vena d'ombra fra un masso e l'altro: senza, la roccia è un
  // tappeto di ciottoli invece che una parete scavata
  semina(reg, lato * 1.5, 13, 1, null, (x, y, r) => {
    if (r(1) < 0.6) return
    velo(c, 0.16, () => ell(c, x, y, lato * (0.25 + r(2) * 0.45), lato * (0.1 + r(3) * 0.2), A.giunto))
  })
}

/* ── la parete di roccia viva ──
   Gli stessi massi ma più grossi e più contrastati: la parete ha le sue
   ombre in mezzo, e sono quelle a farla leggere come una cosa che sta
   *in piedi* invece che stesa per terra. */
export function roccia(c, reg, A, lato, tinte, dentro) {
  // poco più di un corso di muratura: nell'altezza di un personaggio
  // ce ne stanno quattro, come nelle pareti costruite
  const passo = lato * 0.42
  for (let k = Math.floor(reg.y0 / passo) - 1; k < Math.ceil(reg.y1 / passo) + 1; k++)
    for (let i = Math.floor(reg.x0 / passo) - 1; i < Math.ceil(reg.x1 / passo) + 1; i++) {
      if (dentro && !dentro(i * passo, k * passo, passo, passo)) continue
      const r = m => dado(i, k, 1200 + m)
      const cx = (i + 0.5 + (r(1) - 0.5) * 0.8) * passo
      const cy = (k + 0.5 + (r(2) - 0.5) * 0.8) * passo
      const col = mescola(tinte[0], tinte[1], r(3))
      masso(c, cx, cy, passo * (0.66 + r(4) * 0.4), col,
            mescola(col, '#ffffff', 0.24), null,
            m => dado(i * 3 + m, k, 1220))
    }
  // le fessure profonde: poche e lunghe, mai una rete
  semina(reg, lato * 1.5, 31, 1, null, (x, y, r) => {
    if (r(1) < 0.55) return
    velo(c, 0.42, () => crepa(c, x, y, lato * (0.6 + r(2) * 0.8),
                              mescola(tinte[1], '#000000', 0.5), r))
  })
}
