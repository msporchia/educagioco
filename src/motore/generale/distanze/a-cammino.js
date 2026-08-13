/* ═══════════════════════════════════════════════════════════════════
   A CAMMINO — la misura degli occhi

   Si conta in passi veri: un muro in mezzo allontana, e una porta
   chiusa mette a distanza infinita perché di lì non ci si cammina. È il
   trucco che regge mezzo gioco con venti righe — nessun raggio da
   tracciare, nessun angolo da calcolare — ed è anche il motivo per cui
   chiudersi dietro una porta rende ciechi tutti e due.

   ── LA COSA CHE SI TOCCA SOLO DA ACCANTO ──
   Su una porta chiusa non ci si può stare, quindi la sua cella è a
   distanza infinita anche per chi le è appoggiato: chi era attaccato al
   portone «non lo vedeva». Era un caso speciale scritto a parte
   (`vedePorta`); qui è la cosa a dire da quali celle la si raggiunge, e
   il raggio misura verso la più vicina. Una cosa nuova che si comporta
   così non aggiunge nessuna eccezione qui dentro.
   ═══════════════════════════════════════════════════════════════════ */
import { Raggio } from './raggio.js'
import { mappaDi } from '../mappa.js'

export class ACammino extends Raggio {
  distanza (mondo, da, a) {
    const passi = mappaDi(mondo, da)
    const quanto = punto => {
      if (!punto || punto.x == null) return Infinity
      if (punto.x < 0 || punto.y < 0 || punto.x >= mondo.w || punto.y >= mondo.h) return Infinity
      const d = passi[punto.y * mondo.w + punto.x]
      return d < 0 ? Infinity : d
    }
    const dritto = quanto(a)
    if (dritto !== Infinity) return dritto
    /* non ci si arriva sopra: forse la si tocca da accanto, e chi lo sa
       è lei */
    const bordi = typeof a.bordi === 'function' ? a.bordi() : []
    return bordi.reduce((min, p) => Math.min(min, quanto(p)), Infinity)
  }

  get comeSiLegge () { return `${this.limite} passi` }
}
