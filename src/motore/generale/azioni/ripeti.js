/* ═══════════════════════════════════════════════════════════════════
   RIPETI — gli ordini che ha dentro, in tondo

   La differenza col bivio è tutta in due righe: la lista è una sola, e
   quando finisce non si esce — si torna al principio.

   L'USCITA SI GUARDA A OGNI BATTITO, non a fine giro: «smetti quando
   vedi gli orchi» deve valere nell'istante in cui li vedi, se no si
   finisce di fare il giro con il nemico alle spalle. È la ragione per
   cui questo non è un `while` da manuale — è un `while` che controlla
   anche in mezzo, e la promessa che il vecchio verbo `pattuglia` faceva
   senza poterla mantenere.

   L'uscita è una DOMANDA, e la domanda si valuta e si racconta da sé:
   qui non c'è nessuno `switch` su che tipo di uscita sia.
   ═══════════════════════════════════════════════════════════════════ */
import { Azione } from './azione.js'
import { Esito } from './esiti.js'
import { domandaDa } from '../domande/indice.js'
import { NonPossoSaperlo } from '../domande/domanda.js'

export class Ripeti extends Azione {
  constructor (via, corpo, finche) {
    super(via)
    this.corpo = corpo
    this.finche = finche
  }

  static compila (dato, via, fila) {
    return new Ripeti(via,
      fila(Array.isArray(dato.corpo) ? dato.corpo : [], [...via, 'corpo']),
      domandaDa(dato.finche))
  }

  azzera () { super.azzera(); this.corpo.azzera() }
  figli () { return [this.corpo] }

  /* ── È ORA DI SMETTERE? E SE NON POSSO SAPERLO, NO ──
     «Smetti quando il portone è aperto» detto da chi il portone non lo
     vede non è né vero né falso: è una cosa che non può sapere, e la
     domanda si rifiuta di rispondere invece di mentire.

     Allora il giro continua — e questa non è una toppa, è la risposta
     giusta: non so se posso smettere, quindi non smetto. Quello che
     succede a schermo è un personaggio che gira all'infinito, e a fine
     scena il motore dice **cosa** stava aspettando che non sarebbe mai
     arrivato. È un bug che si vede e che si può capire, ed è la lezione
     del gioco resa concreta: se ti serve sapere cosa succede là dietro,
     fattelo dire da qualcuno. Rispondere «no, non è aperto» sarebbe
     stato peggio — un piano sbagliato che a volte funziona per caso. */
  eOra (contesto) {
    try {
      return this.finche.valuta(contesto.mondo, contesto.chi)
    } catch (nonSo) {
      if (!(nonSo instanceof NonPossoSaperlo)) throw nonSo
      return false
    }
  }

  esegui (contesto) {
    const { mondo, chi } = contesto
    if (this.finche && this.eOra(contesto)) {
      this.dice(contesto, `${this.finche.testo(mondo)}: smetto di girare`, 'si ferma')
      return Esito.finito()
    }
    if (this.corpo.vuota) return Esito.finitoSubito()
    const esito = this.corpo.esegui(contesto)
    /* il giro è finito: si ricomincia, e ricominciare non costa un
       battito in più — quello l'ha già speso l'ultimo ordine del giro */
    if (esito.finito && !esito.rotto) { this.corpo.azzera(); return Esito.inCorso() }
    return esito
  }
}
