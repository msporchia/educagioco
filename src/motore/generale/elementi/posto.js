import { Elemento } from '../elemento.js'

/* ═══════════════════════════════════════════════════════════════════
   IL POSTO — un punto della mappa con un nome

   Non riceve comandi (nessun verbo accetta 'posto' come non-`vai`) e
   non ha stato da azzerare: sta fermo, ed è tutto. Non disegna niente
   di suo — le macchie di ronda e il forziere del tesoro restano una
   scelta della vista, perché dipendono dall'obiettivo della MISSIONE
   (`livello.obiettivo`), che non è un fatto di un singolo posto.
   ═══════════════════════════════════════════════════════════════════ */
export class Posto extends Elemento {
  get tipo () { return 'posto' }
  get em () { return '📍' }
}
