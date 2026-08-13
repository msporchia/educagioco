/* ═══════════════════════════════════════════════════════════════════
   PREMUTO e ALMENO
   ═══════════════════════════════════════════════════════════════════ */
import { controlla, uguale, nota, riassunto } from '../../../aiuto/verifica.mjs'
import { mondoFinto, cosaFinta, cartellino, chiFinto } from '../../../aiuto/finto.js'
import { domandaDa } from '../../../../src/motore/generale/domande/indice.js'

{
  const totem = cosaFinta({ id: 'totem', nome: 'il totem', tipo: 'congegno',
                            stato: { premuto: true, almeno: 2 } })
  const mondo = mondoFinto({ cose: [totem] })
  controlla('premuto: lo chiede al congegno',
            domandaDa({ cond: 'premuto', complemento: 'totem' }).valuta(mondo, null))
  controlla('almeno: due basta a due',
            domandaDa({ cond: 'almeno', complemento: 'totem', n: 2 }).valuta(mondo, null))
  controlla('almeno: due non basta a tre',
            !domandaDa({ cond: 'almeno', complemento: 'totem', n: 3 }).valuta(mondo, null))
}

riassunto('premuto e almeno')
