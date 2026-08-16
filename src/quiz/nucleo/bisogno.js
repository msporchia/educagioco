/* ═══════════════════════════════════════════════════════════════════
   QUANTO SERVE RIVEDERE UNA COSA — il ripasso delle domande di scuola.

   Ogni domanda porta la chiave del CONCETTO che allena (`orto:gn`, non
   «lavagna»), e ogni risposta finisce in `store/srs.js` come per le
   tabelline e le parole inglesi. Questo file traduce quello stato in un
   numero solo: **quante volte più spesso deve uscire una tipologia**.

   NON È L'SRS DEGLI ASTEROIDI, ed è la cosa da tenere a mente.

   Là l'elemento è un fatto finito — `math:7x8`, `en:dog` — e c'è un
   totale: quattro risposte giuste e l'hai imparato, esce dal giro, il
   pianeta prende la stella. Qui l'elemento è un concetto che non
   finisce mai: le istanze le inventa la sorte, e tre *gn* facili
   azzeccati non vogliono dire che uno sappia il gruppo gn. Perciò di
   `srs.js` si usa solo la forza (che decade da sola, e quello serve) e
   MAI `isMastered`: niente esce mai dal giro, niente si dichiara
   imparato, nessuna materia nuova in `progressi.js`.

   E soprattutto: là il gioco È lo studio, quindi concentrarsi su quello
   che non sai è tutto il punto. Qui la domanda è il pedaggio dentro un
   gioco d'avventura — la carta di Survivors, la porta del Dungeon, il
   cancello d'oro della Corsa — e un bambino che va male in geometria
   non deve trovarsi una partita di sola geometria: sarebbe una
   punizione per essere andato male, dentro un gioco che ha scelto per
   giocare.

   Da qui la BANDA STRETTA: da 0.5 a 1.5, e nient'altro. Con dieci cose
   che pesano un decimo ciascuna, quella che sa bene scende al 5% e
   quella che non sa sale al 15% — uno scarto che si vede, un rapporto
   di tre a uno fra gli estremi, e le altre otto continuano a uscire
   come prima. `weight()` di `srs.js` va invece da 0.35 a oltre 7, un
   fattore venti: giusto per gli asteroidi, dove quello che sai davvero
   deve smettere di uscire, e sbagliato qui.

   MAI VISTO È NEUTRO (1.0), non urgente. Al primo avvio tutte le
   centotrenta tipologie sono mai viste: se valessero 1.5 sarebbero
   tutte uguali comunque, e l'unico effetto sarebbe che una cosa appena
   sbagliata pesa quanto una mai incontrata. Lo scarto nasce giocando.

   Questo file non importa niente di Vue e nessun profilo: prende un
   elemento SRS e torna un numero, così `unita/quiz-ripasso` può
   contarci sopra migliaia di tiri in Node. Il ponte col profilo è
   `quiz/memoria.js`.
   ═══════════════════════════════════════════════════════════════════ */

import { SRS, strength } from '../../store/srs.js'

/* gli estremi della banda: chi lo sa esce la metà, chi non lo sa una
   volta e mezzo. In mezzo, e neutro, chi non ha ancora una storia. */
export const BISOGNO = { min: 0.5, max: 1.5 }

/* quanto una cosa è saputa, da 0 (per niente) a 1 (quanto basta).
   Il tetto è `masterS` e non la forza massima: sopra quella soglia
   l'elemento negli altri giochi sarebbe «imparato», e continuare a
   premiare la forza in più vorrebbe dire far sparire per mesi una cosa
   che il bambino ha solo azzeccato cinque volte di fila. */
export function saputo(it, now = Date.now()) {
  if (!it || !it.last) return null            // mai visto: non si sa niente
  return Math.min(strength(it, now), SRS.masterS) / SRS.masterS
}

/* il fattore che moltiplica il peso di una tipologia */
export function bisognoDa(it, now = Date.now()) {
  const s = saputo(it, now)
  if (s === null) return 1
  return BISOGNO.max - s * (BISOGNO.max - BISOGNO.min)
}
