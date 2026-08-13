/* ═══════════════════════════════════════════════════════════════════
   VIVO
   ═══════════════════════════════════════════════════════════════════ */
import { controlla, uguale, nota, riassunto } from '../../../aiuto/verifica.mjs'
import { mondoFinto, cosaFinta, cartellino, chiFinto } from '../../../aiuto/finto.js'
import { domandaDa } from '../../../../src/motore/generale/domande/indice.js'

{
  const orco = chiFinto({ id: 'orco', nome: "l'orco", fazione: 'orchi' })
  const mondo = mondoFinto({ cose: [cartellino('orco', 'unita', "l'orco")], unita: [orco] })
  const caduto = domandaDa({ cond: 'vivo', complemento: 'orco', non: true })
  controlla('caduto: finché è in piedi, no', !caduto.valuta(mondo, null))
  orco.inPiedi = false
  controlla('caduto: quando cade, sì', caduto.valuta(mondo, null))
  uguale('caduto: e si legge senza «non»', caduto.testo(mondo), "l'orco è fuori combattimento")
}

riassunto('vivo')
