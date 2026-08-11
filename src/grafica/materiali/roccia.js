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
export function rocciaPosa(c, reg, A, lato, tinte, scoperto, opz = {}) {
  /* i massi del pavimento sono **il doppio** di quelli della parete,
     come i lastroni lo sono dei conci: fatti uguali, pavimento e
     parete diventano lo stesso tessuto e la grotta perde il dentro e
     il fuori. (E costano un quarto: a due volte i pixel dello schermo
     una grotta di sassolini era tre volte un corridoio.) */
  const modo = opz.modo || 'normale', sm = (opz.seme || 0) * 53
  /* `franata` è ghiaia di crollo: massi piccoli, pochi grandi, con la
     stessa curva `r³` della parete; `bagnata` scurisce appena e mette
     qualche lucido piatto, il riflesso di una pozza fra i sassi */
  const passo = lato * 0.83                 // 83/100: non torna mai al passo della cella
  for (let k = Math.floor(reg.y0 / passo) - 1; k < Math.ceil(reg.y1 / passo) + 1; k++)
    for (let i = Math.floor(reg.x0 / passo) - 1; i < Math.ceil(reg.x1 / passo) + 1; i++) {
      if (scoperto && !scoperto(i * passo, k * passo, passo, passo)) continue
      const r = m => dado(i, k, 1000 + m + sm)
      // il centro sbanda di mezza maglia: è quello che rompe le file
      const cx = (i + 0.5 + (r(1) - 0.5) * 0.7) * passo
      const cy = (k + 0.5 + (r(2) - 0.5) * 0.7) * passo
      const col = mescola(tinte[0], tinte[1], r(3))
      const g = r(4)
      const taglia = modo === 'franata' ? passo * (0.28 + g * g * g * 0.7) : passo * (0.6 + g * 0.34)
      masso(c, cx, cy, taglia, col,
            mescola(col, '#ffffff', modo === 'bagnata' ? 0.2 : 0.1),
            mescola(col, '#000000', 0.13),
            m => dado(i * 5 + m, k, 1020 + sm))
      if (modo === 'bagnata' && r(6) > 0.55)
        velo(c, 0.4, () => ell(c, cx - taglia * 0.15, cy - taglia * 0.2, taglia * 0.4, taglia * 0.14, '#bfe8ef'))
    }
  // qualche vena d'ombra fra un masso e l'altro: senza, la roccia è un
  // tappeto di ciottoli invece che una parete scavata
  semina(reg, lato * 1.5, 13 + sm, 1, null, (x, y, r) => {
    if (r(1) < (modo === 'franata' ? 0.42 : 0.6)) return
    velo(c, modo === 'bagnata' ? 0.24 : 0.16, () =>
      ell(c, x, y, lato * (0.25 + r(2) * 0.45), lato * (0.1 + r(3) * 0.2),
          modo === 'bagnata' ? '#0d1418' : A.giunto))
  })
}
rocciaPosa.modi = ['normale', 'franata', 'bagnata']

/* ── la parete di roccia viva ──
   Gli stessi massi ma più grossi e più contrastati: la parete ha le sue
   ombre in mezzo, e sono quelle a farla leggere come una cosa che sta
   *in piedi* invece che stesa per terra. */
export function roccia(c, reg, A, lato, tinte, dentro, opz = {}) {
  const modo = opz.modo || 'normale', sm = (opz.seme || 0) * 43
  /* ── LA ROCCIA ERA TROPPO GREZZA, E IL MOTIVO ERA UNO ──
     Massi tutti della stessa misura, in una maglia regolare: a occhio
     tornava un tappeto di sassi uguali, cioè un motivo — la stessa
     accusa che si fa a una griglia. La roccia vera **non ha una
     misura**: ci sono due o tre blocchi grossi e attorno una ghiaia di
     pezzi piccoli. Qui la taglia esce da una curva (`r³`), che a
     differenza di un numero pescato dritto dà **pochi grandi e molti
     piccoli**, ed è quello che si legge come pietra spaccata.

     `stratificata` aggiunge le bande orizzontali dei sedimenti: la
     tinta si sposta per fasce alte mezza cella, e la parete smette di
     essere un ammasso e diventa una cosa che è stata tagliata. */
  const passo = lato * 0.42
  const bande = modo === 'stratificata'
  for (let k = Math.floor(reg.y0 / passo) - 1; k < Math.ceil(reg.y1 / passo) + 1; k++)
    for (let i = Math.floor(reg.x0 / passo) - 1; i < Math.ceil(reg.x1 / passo) + 1; i++) {
      if (dentro && !dentro(i * passo, k * passo, passo, passo)) continue
      const r = m => dado(i, k, 1200 + m + sm)
      const cx = (i + 0.5 + (r(1) - 0.5) * 0.9) * passo
      const cy = (k + 0.5 + (r(2) - 0.5) * 0.9) * passo
      let col = mescola(tinte[0], tinte[1], r(3))
      /* le fasce: due tinte che si alternano lentamente, sempre le
         stesse per la stessa quota, così le vene corrono orizzontali */
      if (bande) {
        const banda = dado(0, Math.floor(cy / (lato * 0.55)), 1290 + sm)
        col = mescola(col, banda > 0.5 ? '#ffffff' : '#000000', 0.06 + banda * 0.06)
      }
      const g = r(4)
      const taglia = 0.34 + g * g * g * 1.25       // pochi grandi, molti piccoli
      /* l'ombra di contatto: un'ellisse scura appena sotto il masso.
         Senza, i pezzi sono ritagli appoggiati; con, si vede che uno
         sta davanti all'altro. Costa un tracciato ogni tre massi. */
      if (r(6) > 0.35)
        velo(c, 0.22, () => ell(c, cx, cy + passo * taglia * 0.42,
                                passo * taglia * 0.78, passo * taglia * 0.3,
                                mescola(tinte[1], '#000000', 0.55)))
      masso(c, cx, cy, passo * taglia, col,
            mescola(col, '#ffffff', 0.24), mescola(col, '#000000', 0.2),
            m => dado(i * 3 + m, k, 1220 + sm))
      /* la scheggia: una lasca chiara staccata dalla faccia del masso,
         che è quello che una roccia ha e un ciottolo no */
      if (r(7) > 0.72)
        velo(c, 0.5, () => ell(c, cx + passo * (r(8) - 0.5) * 0.5,
                               cy + passo * (r(9) - 0.5) * 0.5,
                               passo * taglia * 0.28, passo * taglia * 0.14,
                               mescola(col, '#ffffff', 0.3)))
    }
  // le fessure profonde: poche e lunghe, mai una rete
  semina(reg, lato * 1.5, 31 + sm, 1, null, (x, y, r) => {
    if (r(1) < (modo === 'frantumata' ? 0.2 : 0.55)) return
    velo(c, 0.42, () => crepa(c, x, y, lato * (0.6 + r(2) * 0.8),
                              mescola(tinte[1], '#000000', 0.5), r))
  })
}
roccia.modi = ['normale', 'stratificata', 'frantumata']
