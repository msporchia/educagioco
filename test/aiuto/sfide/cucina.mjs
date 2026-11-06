/* La cucina per la partita finta in due (../sfida-finta.mjs) e il banco della rete: due bambini finti che toccano a caso, prenotano
   e fanno i conti in un attimo. */
import { regolaCucina } from '../../../src/motore/bancarella/in-due.js'

export default {
  regola: ({ firma }) => regolaCucina({ firma }),
  scelte: seme => ({ minuti: 5, menu: 'pochi', seme: seme * 13 }),
  /* un passo da 16 ms di uno dei due: `inc.scegli(mossa)` se gli va */
  muovi(ruolo, inc, r) {
    const S = inc.motore.S, io = S.cuochi[ruolo]
    if (io.calcola) { if (r() < 0.02) inc.scegli(['pagata', io.calcola]); return }
    if (r() < 0.03) inc.scegli(['tocca', S.cucina.celle[Math.floor(r() * S.cucina.celle.length)].id])
    else if (r() < 0.003) inc.scegli(['prenota', S.ordini[Math.floor(r() * S.ordini.length)].id])
  },
}
