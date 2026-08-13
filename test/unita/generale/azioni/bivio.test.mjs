/* ═══════════════════════════════════════════════════════════════════
   IL BIVIO
   ═══════════════════════════════════════════════════════════════════ */
import { controlla, uguale, nota, riassunto } from '../../../aiuto/verifica.mjs'
import { banco, cosaFinta, cartellino, chiFinto, campoFinto } from '../../../aiuto/finto.js'
import { Esito } from '../../../../src/motore/generale/azioni/esiti.js'
import { Bivio } from '../../../../src/motore/generale/azioni/bivio.js'
import { Fila } from '../../../../src/motore/generale/azioni/fila.js'
import { Sempre } from '../../../../src/motore/generale/domande/sempre.js'

{
  const q = banco({ chi: chiFinto() })
  const bivio = new Bivio([0], new Sempre(), new Fila([]), new Fila([]))
  bivio.esegui(q.contesto)
  uguale('bivio: sceglie un ramo solo', bivio.scelto, 'vero')
  controlla('bivio: e lo racconta', q.registro.ha('prendo il ramo del vero'))
}

riassunto('il bivio')
