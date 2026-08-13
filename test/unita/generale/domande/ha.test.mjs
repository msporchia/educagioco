/* ═══════════════════════════════════════════════════════════════════
   HAI
   ═══════════════════════════════════════════════════════════════════ */
import { controlla, uguale, nota, riassunto } from '../../../aiuto/verifica.mjs'
import { mondoFinto, cosaFinta, cartellino, chiFinto } from '../../../aiuto/finto.js'
import { domandaDa } from '../../../../src/motore/generale/domande/indice.js'

{
  const eroe = chiFinto({ id: 'eroe', zaino: [] })
  const mondo = mondoFinto({ cose: [cartellino('chiave', 'oggetto', 'la chiave')], unita: [eroe] })
  const hai = domandaDa({ cond: 'hai', complemento: 'chiave' })
  controlla('hai: a mani vuote, no', !hai.valuta(mondo, eroe))
  eroe.metteInZaino('chiave')
  controlla('hai: con la chiave in mano, sì', hai.valuta(mondo, eroe))

  /* e con «di chi» parla di un altro: è la forma con cui i livelli
     dichiarano la vittoria */
  const altrui = domandaDa({ cond: 'hai', complemento: 'chiave', chi: 'eroe' })
  controlla('hai: sa parlare anche di qualcun altro', altrui.valuta(mondo, null))
}

riassunto('hai')
