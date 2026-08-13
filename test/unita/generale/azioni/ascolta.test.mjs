/* ═══════════════════════════════════════════════════════════════════
   QUANDO SENTI
   ═══════════════════════════════════════════════════════════════════ */
import { controlla, uguale, nota, riassunto } from '../../../aiuto/verifica.mjs'
import { banco, cosaFinta, cartellino, chiFinto, campoFinto } from '../../../aiuto/finto.js'
import { Esito } from '../../../../src/motore/generale/azioni/esiti.js'
import { Ascolta } from '../../../../src/motore/generale/azioni/ascolta.js'
import { Fila } from '../../../../src/motore/generale/azioni/fila.js'

{
  const seg = cartellino('via', 'segnale', 'via libera')
  const q = banco({ cose: [seg], chi: chiFinto() })
  const ascolta = new Ascolta([0], 'via', new Fila([]))
  const esito = ascolta.esegui(q.contesto)
  controlla('quando senti: arma e passa oltre, senza spendere il battito',
            esito.finito && !esito.speso)
  uguale("quando senti: l'ascolto sta sul personaggio, non sul mondo",
         q.chi.ascolti.length, 1)
  ascolta.esegui(q.contesto)
  uguale('quando senti: passarci sopra due volte non arma due ascolti',
         q.chi.ascolti.length, 1)
}

riassunto('quando senti')
