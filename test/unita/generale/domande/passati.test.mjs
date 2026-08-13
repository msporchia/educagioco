/* ═══════════════════════════════════════════════════════════════════
   PASSATI
   ═══════════════════════════════════════════════════════════════════ */
import { controlla, uguale, nota, riassunto } from '../../../aiuto/verifica.mjs'
import { mondoFinto, cosaFinta, cartellino, chiFinto } from '../../../aiuto/finto.js'
import { domandaDa } from '../../../../src/motore/generale/domande/indice.js'
import { Passati } from '../../../../src/motore/generale/domande/passati.js'

{
  const mondo = mondoFinto({})
  const passati = new Passati(3)
  controlla('passati: al primo no', !passati.valuta(mondo, null))
  controlla('passati: al secondo no', !passati.valuta(mondo, null))
  controlla('passati: al terzo sì', passati.valuta(mondo, null))
  passati.azzera()
  controlla('passati: azzerata, riparte da capo', !passati.valuta(mondo, null))
}

riassunto('passati')
