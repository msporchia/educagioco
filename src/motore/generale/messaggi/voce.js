/* ═══════════════════════════════════════════════════════════════════
   VOCE — quello che si dice a chi si ha davanti

   Il gemello del rumore, e il vincolo non è un dettaglio: il gioco ha
   un principio esplicito — «quello che vedi lo puoi aspettare, quello
   che non vedi te lo deve dire qualcuno» — e un messaggio diretto a
   distanza infinita lo cancellerebbe.

   Si guarda con gli occhi di CHI PARLA, e **nell'istante in cui arriva**,
   non in quello in cui è partito: nel frattempo qualcuno può essersi
   mosso, e chi si è tolto di mezzo non sente niente.
   ═══════════════════════════════════════════════════════════════════ */
import { Messaggio } from './messaggio.js'

export class Voce extends Messaggio {
  arrivaA (mondo, chi) {
    const chiParla = mondo.perId[this.da]
    return !!chiParla && chiParla.eInPiedi() && chiParla.vede(mondo, chi)
  }

  racconto (nome, destati) {
    return destati.length
      ? { penso: `dico «${nome}»: mi sente ${destati.join(' e ')}`, siVede: `parla a ${destati.join(' e ')}` }
      : { penso: `dico «${nome}», ma non mi vede nessuno`, siVede: 'parla a vuoto' }
  }
}
