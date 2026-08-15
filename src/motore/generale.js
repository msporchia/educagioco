/* ═══════════════════════════════════════════════════════════════════
   IL GENERALE — le regole, senza schermo

   Questo file era lungo 2088 righe e conteneva tutto: il vocabolario,
   la mappa, le condizioni, il registro, l'esecutore, un `switch` di
   trecento righe con dentro ogni verbo del gioco. Adesso è un ELENCO:
   le regole stanno in `motore/generale/`, un file per cosa, e qui c'è
   solo la porta d'ingresso — quello che la vista, i test e l'editor
   chiamano.

   ── COM'È FATTO DENTRO ──────────────────────────────────────────
     vocabolario.js   i verbi, i blocchi, i gradi: tabelle e basta
     azioni/          un file per verbo. `Azione.esegui(contesto)` fa UN
                      passo e dice se ha finito; chi contiene un'azione
                      non sa cosa sia, e per questo si annidano
     domande/         un file per domanda. Si valuta e si racconta da sé
     distanze/        vedere, sentire e colpire: la stessa domanda con
                      due variabili — come si misura, fin dove si arriva
     messaggi/        un rumore sa da sé a chi arriva; una voce anche
     elementi/        le cose del campo: rispondono ai comandi da sé
     allestimento.js  montare la scena — succede una volta, prima
     mondo.js         cosa c'è e dove — risponde, non costruisce
     unita.js         chi cammina, e l'orchestratore dei suoi fili
     partita.js       il battito: ognuno fa un passo, poi i messaggi,
                      poi il verdetto
     registro.js      le righe che si leggono dopo
     piano.js         comporre un piano, pesarlo, rifiutarlo

   ── IL MODELLO, che non è cambiato ──────────────────────────────
   Il bambino non pilota nessuno: firma ORDINI PERMANENTI alle sue
   unità, come un generale prima della battaglia. Poi guarda. Un'unità
   sa già camminare: il bambino decide il COSA e il QUANDO, mai il COME.

   Non esiste una «IA dei mostri»: c'è UN solo linguaggio di ordini e UN
   solo esecutore. Ogni fazione ha un AUTORE — il giocatore oppure il
   livello — e l'esecutore non sa e non gli importa chi ha scritto cosa.
   ═══════════════════════════════════════════════════════════════════ */

/* il vocabolario: le parole del gioco */
export {
  VERBI, GRADI, gradoDi, BLOCCHI, CONDIZIONI, RAMI,
  eCondizione, eRipeti, eRoutine, eBlocco, eAvanzato,
  ramoDi, corpoDi, dentroA, chiaveCond, nonRiesce, saFare,
} from './generale/vocabolario.js'

/* il mondo: cosa c'è, chi c'è, e i segnali che girano */
export {
  Mondo, creaMondo, SEGNALI, ilSegnale, segnaleDi,
  vive, perdute, laCosa, nominabili, nomiDi, complementiDi,
  raccogliRoutine, reazioniDi, scusaDi,
} from './generale/mondo.js'

/* la cassetta: quali verbi si offrono, qui e a chi */
export { verbiDi, verbiPer, nonSa } from './generale/cassetta.js'

/* le domande che si possono fare */
export { condizioniDi, condCompone, valutabile } from './generale/domande/quali.js'
export { domandaDa } from './generale/domande/indice.js'

/* la geometria */
export { libera, distanze, vede } from './generale/mappa.js'

/* il piano: comporlo, pesarlo, rifiutarlo prima di giocarlo */
export {
  pianoCompleto, mieUnita, altruiUnita, altriInCampo, eOstile, pianoVuoto, contaOrdini, guaiDi, manca,
} from './generale/piano.js'

/* le parole con cui si legge un ordine */
export { testoCond, descrivi } from './generale/parole.js'

/* far girare una scena */
export { Partita, PASSI_MASSIMI } from './generale/partita.js'

import { Partita } from './generale/partita.js'
import { guaiDi } from './generale/piano.js'
import { pianoCompleto, mieUnita } from './generale/piano.js'

/* ── LE TRE FUNZIONI CHE IL GIOCO CHIAMA ──
   La vista non sa che esiste una `Partita`: le sono sempre bastate tre
   chiamate, e restano quelle. Chi vuole tenersi la partita in mano usa
   la classe. */
export function avvia (mondo, piano) {
  new Partita(mondo, piano)
  return mondo
}

export function passo (mondo) {
  if (mondo.partita) mondo.partita.passo()
}

/* è quello che usa il test, ed è quello che usa il gioco quando vuole
   sapere com'è finita senza guardare: stesso mondo, stessi ordini,
   stesso esito. Niente `Math.random` da nessuna parte. */
export function esegui (mondo, ordini) {
  const miei = mieUnita(mondo.livello)
  const piano = Array.isArray(ordini) ? { [miei[0]]: ordini } : (ordini || {})

  const guai = guaiDi(mondo, piano)
  if (guai.length)
    return { vinto: false, motivo: 'Ci sono ordini che non si possono dare: ' + guai[0].motivo,
             passi: 0, traccia: [], rifiutati: guai, mondo }

  const partita = new Partita(mondo, pianoCompleto(mondo, piano))
  partita.finoInFondo()
  return { vinto: mondo.vinto, motivo: mondo.motivo, passi: mondo.passi,
           traccia: mondo.traccia, rifiutati: [], colpevole: mondo.colpevole,
           perdute: mondo.perdute(), mondo }
}

/* le righe del registro, dalla più vecchia alla più nuova */
export const registro = (mondo, quante) =>
  quante ? mondo.traccia.slice(-quante) : mondo.traccia
