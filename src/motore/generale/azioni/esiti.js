/* ═══════════════════════════════════════════════════════════════════
   ESITO — cosa risponde un'azione dopo un passo

   Erano cinque stringhe (`fatto`, `subito`, `lavora`, `attesa`,
   `errore`) e nessuno poteva indovinare che differenza ci fosse fra le
   prime due. Sono due fatti indipendenti, e ora si leggono:

       finito   ho concluso: chi mi contiene passi alla prossima
       speso    il battito l'ho consumato io: la prossima parte dopo

   |                | battito speso        | battito intatto        |
   |----------------|----------------------|------------------------|
   | **ho finito**  | `Esito.finito()`     | `Esito.finitoSubito()` |
   | **non ancora** | `Esito.inCorso()`    | `Esito.inAttesa()`     |

   ── PERCHÉ IL BATTITO INTATTO CONTA ──
   Nel gioco tutto si misura in battiti, e ci sono cose che non sono un
   gesto: una definizione è una riga di intestazione, `quando senti`
   arma un ascolto e prosegue, `prendi` di una cosa che hai già in mano
   non è un movimento. Se costassero un battito, un piano con due
   dichiarazioni in cima partirebbe due battiti dopo — e nel livello del
   carceriere, dove la finestra è di quattro battiti, il risultato
   dipenderebbe da come hai *scritto* il piano invece che da cosa fa.

   ── E PERCHÉ L'ATTESA NON È UN BATTITO SPESO ──
   Chi aspetta non fa succedere niente. È l'unico modo di accorgersi che
   la scena si è piantata: se in un giro intero nessuno ha speso un
   battito, niente potrà più cambiare, e invece di girare per trecento
   turni si dice cos'è che non arriverà mai.
   ═══════════════════════════════════════════════════════════════════ */
export class Esito {
  constructor (finito, speso, rotto) {
    this.finito = !!finito
    this.speso = !!speso
    this.rotto = !!rotto
    Object.freeze(this)
  }

  /* ho concluso, e il battito l'ho usato io */
  static finito () { return FINITO }
  /* ho concluso senza che succedesse niente: si prosegue in questo stesso battito */
  static finitoSubito () { return SUBITO }
  /* non ho concluso: richiamami al battito dopo */
  static inCorso () { return IN_CORSO }
  /* non ho concluso e non è successo niente: sto aspettando qualcosa */
  static inAttesa () { return IN_ATTESA }
  /* di qui non si va avanti: chi mi contiene si ferma con me */
  static rotto () { return ROTTO }
}

const FINITO = new Esito(true, true, false)
const SUBITO = new Esito(true, false, false)
const IN_CORSO = new Esito(false, true, false)
const IN_ATTESA = new Esito(false, false, false)
const ROTTO = new Esito(true, false, true)
