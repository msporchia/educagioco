/* ═══════════════════════════════════════════════════════════════════
   E QUELLO CHE NON SI PUÒ CHIEDERE
   ═══════════════════════════════════════════════════════════════════ */
import { controlla, uguale, nota, riassunto } from '../../../aiuto/verifica.mjs'
import { mondoFinto, cosaFinta, cartellino, chiFinto } from '../../../aiuto/finto.js'
import { domandaDa } from '../../../../src/motore/generale/domande/indice.js'

{
  const mondo = mondoFinto({ cose: [cartellino('chiave', 'oggetto', 'la chiave')] })
  controlla('una domanda su una cosa che c\'è si può valutare',
            domandaDa({ cond: 'hai', complemento: 'chiave' }).valutabile(mondo))
  controlla('una su una cosa che non c\'è, no',
            !domandaDa({ cond: 'hai', complemento: 'fantasma' }).valutabile(mondo))
  uguale('e un tipo di domanda che non esiste non si compila',
         domandaDa({ cond: 'boh', complemento: 'chiave' }), null)
}

riassunto('cosa si può chiedere')
