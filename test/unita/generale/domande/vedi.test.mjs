/* ═══════════════════════════════════════════════════════════════════
   VEDI
   ═══════════════════════════════════════════════════════════════════ */
import { controlla, uguale, nota, riassunto } from '../../../aiuto/verifica.mjs'
import { mondoFinto, cosaFinta, cartellino, chiFinto } from '../../../aiuto/finto.js'
import { domandaDa } from '../../../../src/motore/generale/domande/indice.js'

{
  const orco = chiFinto({ id: 'orco', nome: "l'orco", fazione: 'orchi' })
  const eroe = chiFinto({ id: 'eroe', vede: () => true })
  const mondo = mondoFinto({ cose: [cartellino('orchi', 'fazione', 'gli orchi')], unita: [orco, eroe] })
  const vedi = domandaDa({ cond: 'vedi', complemento: 'orchi' })
  controlla('vedi: risponde sì se lo vede', vedi.valuta(mondo, eroe))
  uguale('vedi: e si legge', vedi.testo(mondo), 'vedi gli orchi')

  const cieco = chiFinto({ id: 'cieco', vede: () => false })
  controlla('vedi: e no se non lo vede', !vedi.valuta(mondo, cieco))
}
{
  const orco = chiFinto({ id: 'orco', nome: "l'orco", fazione: 'orchi' })
  const eroe = chiFinto({ id: 'eroe' })
  const mondo = mondoFinto({ cose: [cartellino('orchi', 'fazione', 'gli orchi')], unita: [orco, eroe] })
  const non = domandaDa({ cond: 'vedi', complemento: 'orchi', non: true })
  controlla('non vedi: è il contrario', !non.valuta(mondo, eroe))
  uguale('non vedi: e si legge in italiano', non.testo(mondo), 'non vedi gli orchi')
}

riassunto('vedi')
