/* ═══════════════════════════════════════════════════════════════════
   VAI — e non fa quasi niente, ed è giusto così

   Camminare è il tronco comune di tutti gli ordini (`Ordine`), non il
   mestiere di questo verbo: `prendi`, `apri`, `premi`, `attacca` si
   spostano esattamente allo stesso modo. Quello che resta a `vai` è
   solo cosa fare **una volta arrivato**, e la risposta è: fermarsi.

   Chi lo guardava prima era il file più grosso della cartella e aveva
   dentro la memoria, i ricordi, i bersagli che si muovono. Erano cose
   di tutti, tenute in ostaggio da un verbo.
   ═══════════════════════════════════════════════════════════════════ */
import { Ordine } from './ordine.js'
import { Esito } from './esiti.js'

export class Vai extends Ordine {
  static parola = 'vai'

  fa (contesto, cosa) {
    this.dice(contesto, `sono a ${cosa.nome}`, 'si ferma')
    return Esito.finito()
  }

  /* ── PER ME ARRIVARE È FINIRE ──
     Gli altri verbi arrivano e poi fanno qualcosa, e quel qualcosa costa
     il suo battito: si arriva al forziere, e al battito dopo lo si apre.
     Per `vai` no — il passo che ti porta a destinazione **è** l'ordine
     compiuto, e aspettare un battito per dire «sono arrivato» sarebbe
     un battito regalato in ogni ordine di moto di ogni piano. Su un
     gioco dove la finestra per passare è di quattro battiti, quello
     cambia chi vince. */
  avvicinati (contesto, cosa, scusa) {
    const esito = super.avvicinati(contesto, cosa, scusa)
    if (!esito.finito && esito.speso && this.aPortata(contesto, cosa)) return Esito.finito()
    return esito
  }
}
