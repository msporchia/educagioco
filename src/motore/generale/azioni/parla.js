/* ═══════════════════════════════════════════════════════════════════
   PARLA — la chiamata, non il grido

   `suona` è il grido a chiunque stia ascoltando: rumore, con una
   posizione ma senza destinatario. `parla` è la CHIAMATA — la stessa
   parola, lo stesso segnale, ma consegnata solo a chi il mittente VEDE
   nell'istante in cui arriva.

   Il vincolo non è un dettaglio: il gioco ha un principio esplicito —
   «quello che vedi lo puoi aspettare, quello che non vedi te lo deve
   dire qualcuno» — e un messaggio diretto a distanza infinita lo
   cancellerebbe. Per questo non fa rumore e non chiama chi accorre: è
   un mezzo silenzio, non un allarme.

   Da fuori la differenza si vede: uno urla, l'altro si avvicina e
   bisbiglia.
   ═══════════════════════════════════════════════════════════════════ */
import { Ordine } from './ordine.js'
import { Esito } from './esiti.js'

export class Parla extends Ordine {
  static parola = 'parla'

  aPortata () { return true }

  fa (contesto, cosa) {
    contesto.mondo.diciA(contesto.chi, cosa.id)
    this.dice(contesto, `dico «${cosa.nome}»`, 'parla sottovoce')
    return Esito.finito()
  }
}
