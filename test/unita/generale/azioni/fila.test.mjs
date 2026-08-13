/* ═══════════════════════════════════════════════════════════════════
   LA FILA
   ═══════════════════════════════════════════════════════════════════ */
import { controlla, uguale, nota, riassunto } from '../../../aiuto/verifica.mjs'
import { banco, cosaFinta, cartellino, chiFinto, campoFinto } from '../../../aiuto/finto.js'
import { Esito } from '../../../../src/motore/generale/azioni/esiti.js'
import { Fila } from '../../../../src/motore/generale/azioni/fila.js'
import { Definizione } from '../../../../src/motore/generale/azioni/definizione.js'
import { compilaFila } from '../../../../src/motore/generale/azioni/indice.js'

{
  const meta = cosaFinta({ id: 'meta', nome: 'la meta', tipo: 'posto', x: 1, y: 0 })
  const q = banco({ cose: [meta], chi: chiFinto({ x: 0, y: 0 }) })
  const fila = compilaFila([{ verbo: 'vai', complemento: 'meta' },
                            { verbo: 'vai', complemento: 'meta' }])
  const primo = fila.esegui(q.contesto)
  controlla('fila: finito il primo ordine la fila non è finita', !primo.finito)
  const secondo = fila.esegui(q.contesto)
  controlla('fila: finito anche il secondo, ha finito', secondo.finito)
}
{
  /* una definizione si scavalca senza costare un battito: se lo costasse,
     un piano con due azioni in cima partirebbe due battiti dopo */
  const q = banco({ chi: chiFinto() })
  const fila = new Fila([new Definizione([0], 'azione 1'), new Definizione([1], 'azione 2')])
  const esito = fila.esegui(q.contesto)
  controlla('fila: le definizioni non costano battiti', esito.finito && !esito.speso)
}

riassunto('la fila')
